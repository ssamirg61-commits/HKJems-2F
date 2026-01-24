import { RequestHandler } from "express";
import * as XLSX from "xlsx";
import { DesignModel, IDesign } from "../models/Design";

// Helper function to send email notification
async function sendEmailNotification(design: IDesign): Promise<void> {
  try {
    const webhookUrl = process.env.WEBHOOK_URL;

    const emailContent = {
      from: "no-reply@hkjewel.co",
      to: "akira@hkjewel.co",
      subject: `New Jewelry Design Submission - ${design.designNumber}`,
      designData: {
        id: design.id,
        designNumber: design.designNumber,
        style: design.style,
        goldKarat: design.goldKarat,
        approxGoldWeight: design.approxGoldWeight,
        stoneType: design.stoneType,
        diamondShape: design.diamondShape,
        caratWeight: design.caratWeight,
        clarity: design.clarity,
        sideStones: design.sideStones,
        marking: design.marking,
        createdAt: design.createdAt,
      },
      files: {
        logo: design.logoFileName
          ? { filename: design.logoFileName, data: design.logoData }
          : null,
        media: design.mediaFileName
          ? { filename: design.mediaFileName, data: design.mediaData }
          : null,
      },
    };

    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailContent),
        });

        if (response.ok) {
          console.log(
            `Email notification sent via webhook for design ${design.designNumber}`,
          );
          return;
        } else {
          console.warn(
            `Webhook returned status ${response.status} for design ${design.designNumber}`,
          );
        }
      } catch (error) {
        console.warn("Webhook email failed:", error);
      }
    } else {
      console.warn(
        "No WEBHOOK_URL configured. Email will not be sent. Logging details only.",
      );
    }

    console.log(`Email details for ${design.designNumber}:`, {
      from: emailContent.from,
      to: emailContent.to,
      subject: emailContent.subject,
      filesCount: [design.logoFileName ? 1 : 0, design.mediaFileName ? 1 : 0].reduce(
        (a, b) => a + b,
        0,
      ),
    });
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
}

function validateFormData(formData: Record<string, any>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const requiredTextFields = ["approxGoldWeight", "caratWeight"];
  const requiredDropdownFields = [
    "style",
    "goldKarat",
    "stoneType",
    "diamondShape",
    "clarity",
  ];

  requiredTextFields.forEach((field) => {
    if (!formData[field] || formData[field].toString().trim() === "") {
      errors.push(`${field} is required`);
    }
  });

  requiredDropdownFields.forEach((field) => {
    if (!formData[field] || formData[field].toString().trim() === "") {
      errors.push(`${field} is required`);
    }
  });

  if (!formData.mediaFileName) {
    errors.push("Media file is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const getDesigns: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    const query = userRole === "USER" ? { userId } : {};
    const designs = await DesignModel.find(query).lean();

    const designsWithoutData = designs.map((design) => ({
      ...design,
      id: design._id.toString(),
      logoData: design.logoFileName ? "[Image Data]" : undefined,
      mediaData: design.mediaFileName ? "[Media Data]" : undefined,
      _id: undefined,
    }));

    res.json(designsWithoutData);
  } catch (error) {
    console.error("Error fetching designs:", error);
    res.status(400).json({ error: "Failed to fetch designs" });
  }
};

export const createDesign: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const {
      designNumber,
      style,
      goldKarat,
      approxGoldWeight,
      stoneType,
      diamondShape,
      caratWeight,
      clarity,
      sideStones,
      marking,
      logoFileName,
      logoData,
      mediaFileName,
      mediaData,
    } = req.body;

    const formData = {
      designNumber,
      style,
      goldKarat,
      approxGoldWeight,
      stoneType,
      diamondShape,
      caratWeight,
      clarity,
      logoFileName,
      mediaFileName,
    };

    const validation = validateFormData(formData);
    if (!validation.valid) {
      res.status(400).json({ error: "Validation failed", errors: validation.errors });
      return;
    }

    if (logoData) {
      const logoSize = Buffer.from(logoData.split(",")[1] || logoData, "base64").length;
      if (logoSize > 10 * 1024 * 1024) {
        res.status(400).json({ error: "Logo file exceeds 10MB limit" });
        return;
      }
    }

    if (mediaData) {
      const mediaSize = Buffer.from(mediaData.split(",")[1] || mediaData, "base64").length;
      if (mediaSize > 100 * 1024 * 1024) {
        res.status(400).json({ error: "Media file exceeds 100MB limit" });
        return;
      }
    }

    const designDoc = await DesignModel.create({
      userId,
      designNumber: designNumber || `HK-${Date.now()}`,
      style,
      goldKarat,
      approxGoldWeight,
      stoneType,
      diamondShape,
      caratWeight,
      clarity,
      sideStones: sideStones || [],
      marking: marking || "",
      logoFileName,
      logoData,
      mediaFileName,
      mediaData,
    });

    sendEmailNotification(designDoc).catch((error) => {
      console.error("Error in email notification:", error);
    });

    const response = {
      id: designDoc.id,
      designNumber: designDoc.designNumber,
      style: designDoc.style,
      goldKarat: designDoc.goldKarat,
      approxGoldWeight: designDoc.approxGoldWeight,
      stoneType: designDoc.stoneType,
      diamondShape: designDoc.diamondShape,
      caratWeight: designDoc.caratWeight,
      clarity: designDoc.clarity,
      sideStones: designDoc.sideStones,
      marking: designDoc.marking,
      logoFileName: designDoc.logoFileName,
      mediaFileName: designDoc.mediaFileName,
      createdAt: designDoc.createdAt,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating design:", error);
    res.status(400).json({ error: "Failed to create design" });
  }
};

export const updateDesign: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    const design = await DesignModel.findById(id);
    if (!design) {
      res.status(404).json({ error: "Design not found" });
      return;
    }

    if (userRole !== "ADMIN" && design.userId !== userId) {
      res.status(403).json({ error: "You can only edit your own designs" });
      return;
    }

    const updates = {
      ...req.body,
      userId: design.userId,
      designNumber: design.designNumber,
      createdAt: design.createdAt,
      updatedAt: new Date(),
    };

    const updated = await DesignModel.findByIdAndUpdate(id, updates, {
      new: true,
    }).lean();

    if (!updated) {
      res.status(404).json({ error: "Design not found after update" });
      return;
    }

    res.json({
      ...updated,
      id: updated._id.toString(),
      _id: undefined,
    });
  } catch (error) {
    console.error("Error updating design:", error);
    res.status(400).json({ error: "Failed to update design" });
  }
};

export const deleteDesign: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    const userRole = (req as any).userRole;

    const design = await DesignModel.findById(id);
    if (!design) {
      res.status(404).json({ error: "Design not found" });
      return;
    }

    if (userRole !== "ADMIN" && design.userId !== userId) {
      res.status(403).json({ error: "You can only delete your own designs" });
      return;
    }

    await design.deleteOne();

    res.json({
      id: design.id,
      designNumber: design.designNumber,
      message: "Design deleted",
    });
  } catch (error) {
    console.error("Error deleting design:", error);
    res.status(400).json({ error: "Failed to delete design" });
  }
};

export const exportDesigns: RequestHandler = async (_req, res) => {
  try {
    const designs = await DesignModel.find().lean();

    if (designs.length === 0) {
      res.status(400).json({ error: "No designs to export" });
      return;
    }

    const exportData: Record<string, any>[] = [];

    designs.forEach((design) => {
      const baseRow = {
        "Design #": design.designNumber,
        Style: design.style,
        "Gold Karat": design.goldKarat,
        "Gold Weight (g)": design.approxGoldWeight,
        "Stone Type": design.stoneType,
        "Diamond Shape": design.diamondShape,
        "Carat Weight": design.caratWeight,
        Clarity: design.clarity,
        Marking: design.marking || "-",
        "Logo File": design.logoFileName || "-",
        "Media File": design.mediaFileName || "-",
        "Date Created": new Date(design.createdAt).toLocaleDateString(),
      };

      for (let i = 0; i < 5; i++) {
        const stone = design.sideStones[i];
        if (stone) {
          baseRow[`Side Stone ${i + 1} Description`] = stone.description || "-";
          baseRow[`Side Stone ${i + 1} Shape`] = stone.shape || "-";
          baseRow[`Side Stone ${i + 1} Weight`] = stone.weight || "-";
        } else {
          baseRow[`Side Stone ${i + 1} Description`] = "-";
          baseRow[`Side Stone ${i + 1} Shape`] = "-";
          baseRow[`Side Stone ${i + 1} Weight`] = "-";
        }
      }

      exportData.push(baseRow);
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jewelry Designs");

    const columns = [
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 14 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 12 },
    ];
    worksheet["!cols"] = columns;

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="jewelry-designs-${new Date().toISOString().split("T")[0]}.xlsx"`,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(Buffer.from(wbout, "base64"));
  } catch (error) {
    console.error("Error exporting designs:", error);
    res.status(400).json({ error: "Failed to export designs" });
  }
};
