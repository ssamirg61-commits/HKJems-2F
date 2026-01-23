import { RequestHandler } from "express";
import * as XLSX from "xlsx";

// Simple ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface SideStone {
  id: string;
  description: string;
  shape: string;
  weight: string;
}

interface Design {
  id: string;
  userId: string; // Link to user who created the design
  designNumber: string;
  style: string;
  goldKarat: string;
  approxGoldWeight: string;
  stoneType: string;
  diamondShape: string;
  caratWeight: string;
  clarity: string;
  sideStones: SideStone[];
  marking: string;
  logoFileName?: string;
  logoData?: string;
  mediaFileName?: string;
  mediaData?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage
let designs: Design[] = [];

// Helper function to send email notification
async function sendEmailNotification(design: Design): Promise<void> {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!gmailUser && !webhookUrl) {
      console.warn(
        "Email configuration not set. Please set GMAIL_USER and GMAIL_APP_PASSWORD or WEBHOOK_URL.",
      );
      return;
    }

    // Build email content with all form data
    const emailContent = {
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
          ? {
              filename: design.logoFileName,
              data: design.logoData,
            }
          : null,
        media: design.mediaFileName
          ? {
              filename: design.mediaFileName,
              data: design.mediaData,
            }
          : null,
      },
    };

    // Try webhook first
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
    }

    // Log email details for debugging
    console.log(
      `Email service not fully configured. Email details for ${design.designNumber}:`,
      {
        to: "akira@hkjewel.co",
        subject: emailContent.subject,
        filesCount: [
          design.logoFileName ? 1 : 0,
          design.mediaFileName ? 1 : 0,
        ].reduce((a, b) => a + b, 0),
      },
    );
  } catch (error) {
    console.error("Error sending email notification:", error);
    // Don't throw - email failure shouldn't block form submission
  }
}

// Validate required fields
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

  // Check required text fields
  requiredTextFields.forEach((field) => {
    if (!formData[field] || formData[field].toString().trim() === "") {
      errors.push(`${field} is required`);
    }
  });

  // Check required dropdowns
  requiredDropdownFields.forEach((field) => {
    if (!formData[field] || formData[field].toString().trim() === "") {
      errors.push(`${field} is required`);
    }
  });

  // Check file uploads
  if (!formData.logoFileName) {
    errors.push("Logo file is required");
  }

  if (!formData.mediaFileName) {
    errors.push("Media file is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const getDesigns: RequestHandler = (_req, res) => {
  // Return designs without large file data to keep response size reasonable
  const designsWithoutData = designs.map((design) => ({
    ...design,
    logoData: design.logoFileName ? "[Image Data]" : undefined,
    mediaData: design.mediaFileName ? "[Media Data]" : undefined,
  }));
  res.json(designsWithoutData);
};

export const createDesign: RequestHandler = (req, res) => {
  try {
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

    // Validate required fields
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
      res.status(400).json({
        error: "Validation failed",
        errors: validation.errors,
      });
      return;
    }

    // Validate file sizes
    if (logoData) {
      const logoSize = Buffer.from(logoData.split(",")[1] || logoData, "base64")
        .length;
      if (logoSize > 10 * 1024 * 1024) {
        res.status(400).json({
          error: "Logo file exceeds 10MB limit",
        });
        return;
      }
    }

    if (mediaData) {
      const mediaSize = Buffer.from(
        mediaData.split(",")[1] || mediaData,
        "base64",
      ).length;
      if (mediaSize > 100 * 1024 * 1024) {
        res.status(400).json({
          error: "Media file exceeds 100MB limit",
        });
        return;
      }
    }

    const design: Design = {
      id: generateId(),
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
      createdAt: new Date().toISOString(),
    };

    designs.push(design);

    // Send email notification asynchronously (don't wait for it to complete)
    sendEmailNotification(design).catch((error) => {
      console.error("Error in email notification:", error);
    });

    // Return response without file data
    const response = {
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
      logoFileName: design.logoFileName,
      mediaFileName: design.mediaFileName,
      createdAt: design.createdAt,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating design:", error);
    res.status(400).json({ error: "Failed to create design" });
  }
};

export const updateDesign: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const designIndex = designs.findIndex((d) => d.id === id);

    if (designIndex === -1) {
      res.status(404).json({ error: "Design not found" });
      return;
    }

    designs[designIndex] = {
      ...designs[designIndex],
      ...req.body,
    };

    res.json(designs[designIndex]);
  } catch (error) {
    console.error("Error updating design:", error);
    res.status(400).json({ error: "Failed to update design" });
  }
};

export const deleteDesign: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const designIndex = designs.findIndex((d) => d.id === id);

    if (designIndex === -1) {
      res.status(404).json({ error: "Design not found" });
      return;
    }

    const deleted = designs.splice(designIndex, 1);
    res.json(deleted[0]);
  } catch (error) {
    console.error("Error deleting design:", error);
    res.status(400).json({ error: "Failed to delete design" });
  }
};

export const exportDesigns: RequestHandler = (req, res) => {
  try {
    if (designs.length === 0) {
      res.status(400).json({ error: "No designs to export" });
      return;
    }

    // Prepare data for Excel export
    const exportData: Record<string, any>[] = [];

    designs.forEach((design) => {
      // Create base row for each design
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

      // Add side stone data (up to 5 columns)
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

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jewelry Designs");

    // Set column widths for better readability
    const columns = [
      { wch: 12 }, // Design #
      { wch: 12 }, // Style
      { wch: 12 }, // Gold Karat
      { wch: 14 }, // Gold Weight
      { wch: 12 }, // Stone Type
      { wch: 15 }, // Diamond Shape
      { wch: 12 }, // Carat Weight
      { wch: 10 }, // Clarity
      { wch: 15 }, // Marking
      { wch: 15 }, // Logo File
      { wch: 15 }, // Media File
      { wch: 14 }, // Date Created
      // Side Stones (3 columns × 5 = 15)
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

    // Generate as base64 string
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });

    // Send as download
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
