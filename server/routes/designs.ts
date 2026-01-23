import { RequestHandler, Request, Response } from "express";
import * as XLSX from "xlsx";
import nodemailer from "nodemailer";

// Simple ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

interface FileData {
  filename: string;
  mimetype: string;
  size: number;
  data: string; // base64
}

interface Design {
  id: string;
  designNumber: string;
  style: string;
  goldKarat: string;
  approxGoldWeight: string;
  stoneType: string;
  diamondShape: string;
  caratWeight: string;
  clarity: string;
  sideStoneShape: string;
  approxWeight: string;
  marking: string;
  logoFile?: FileData;
  mediaFile?: FileData;
  createdAt: string;
}

// In-memory storage
let designs: Design[] = [];

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "",
    pass: process.env.GMAIL_APP_PASSWORD || "",
  },
});

// Helper function to parse multipart form data
async function parseFormData(req: Request): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      resolve({ body, contentType: req.headers["content-type"] });
    });

    req.on("error", reject);
  });
}

// Helper function to send email
async function sendEmailNotification(design: Design): Promise<void> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn(
        "Email configuration not set. Skipping email notification.",
      );
      return;
    }

    let htmlBody = `
      <h2>New Jewelry Design Submission</h2>
      <p>A new design has been submitted. Here are the details:</p>
      
      <h3>Design Details</h3>
      <ul>
        <li><strong>Design Number:</strong> ${design.designNumber}</li>
        <li><strong>Style:</strong> ${design.style}</li>
        <li><strong>Gold Karat:</strong> ${design.goldKarat}</li>
        <li><strong>Approx Gold Weight:</strong> ${design.approxGoldWeight}g</li>
      </ul>
      
      <h3>Center Stone Details</h3>
      <ul>
        <li><strong>Stone Type:</strong> ${design.stoneType}</li>
        <li><strong>Diamond Shape:</strong> ${design.diamondShape}</li>
        <li><strong>Carat Weight:</strong> ${design.caratWeight}</li>
        <li><strong>Clarity:</strong> ${design.clarity}</li>
      </ul>
      
      <h3>Side Stone Details</h3>
      <ul>
        <li><strong>Side Stone Shape:</strong> ${design.sideStoneShape}</li>
        <li><strong>Approx Weight:</strong> ${design.approxWeight}</li>
      </ul>
      
      <h3>Marking & Stamping</h3>
      <ul>
        <li><strong>Marking:</strong> ${design.marking}</li>
      </ul>
      
      <p><strong>Submitted at:</strong> ${new Date(design.createdAt).toLocaleString()}</p>
    `;

    const attachments = [];

    // Add logo as attachment if present
    if (design.logoFile) {
      attachments.push({
        filename: design.logoFile.filename,
        content: design.logoFile.data,
        encoding: "base64",
      });
    }

    // Add media as attachment if present
    if (design.mediaFile) {
      attachments.push({
        filename: design.mediaFile.filename,
        content: design.mediaFile.data,
        encoding: "base64",
      });
    }

    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "akira@hkjewel.co",
      subject: `New Jewelry Design Submission - ${design.designNumber}`,
      html: htmlBody,
      attachments: attachments,
    });

    console.log("Email notification sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw - email failure shouldn't block form submission
  }
}

// Helper to validate file type and size
function validateFile(
  buffer: Buffer,
  filename: string,
  maxSize: number,
  allowedTypes: string[],
): { valid: boolean; error?: string } {
  // Check file size
  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
    };
  }

  // For logo files, check image types
  if (allowedTypes.length === 3) {
    // Logo file validation
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!["png", "jpg", "jpeg"].includes(ext || "")) {
      return {
        valid: false,
        error: "Logo must be PNG, JPEG, or JPG format",
      };
    }
  }

  return { valid: true };
}

export const getDesigns: RequestHandler = (_req, res) => {
  res.json(designs);
};

export const createDesign: RequestHandler = async (req, res) => {
  try {
    const contentType = req.headers["content-type"] || "";

    let formFields: Record<string, string> = {};
    let logoFile: FileData | undefined;
    let mediaFile: FileData | undefined;

    // Handle JSON format (for backward compatibility with FormData)
    if (contentType.includes("application/json")) {
      formFields = req.body;
    } else if (contentType.includes("multipart/form-data")) {
      // Parse multipart form data
      const boundary = contentType.split("boundary=")[1];
      if (!boundary) {
        res.status(400).json({ error: "Invalid content type" });
        return;
      }

      const rawBody = (req as any).rawBody || Buffer.concat(
        (req as any).bodyChunks || [],
      );
      const parts = rawBody.toString().split(`--${boundary}`);

      for (const part of parts) {
        if (!part || part === "--\r\n" || part === "--") continue;

        const [headerSection, ...contentSection] = part.split("\r\n\r\n");
        const content = contentSection.join("\r\n\r\n").replace(/\r\n--$/, "");

        if (headerSection.includes('name="logoFile"')) {
          const filename =
            headerSection.match(/filename="(.+?)"/)?.[1] || "logo";
          logoFile = {
            filename,
            mimetype: "image/*",
            size: content.length,
            data: Buffer.from(content, "binary").toString("base64"),
          };
        } else if (headerSection.includes('name="mediaFile"')) {
          const filename =
            headerSection.match(/filename="(.+?)"/)?.[1] || "media";
          mediaFile = {
            filename,
            mimetype: "file",
            size: content.length,
            data: Buffer.from(content, "binary").toString("base64"),
          };
        } else {
          const fieldName = headerSection.match(/name="(.+?)"/)?.[1];
          if (fieldName && !fieldName.includes("File")) {
            formFields[fieldName] = content.trim();
          }
        }
      }
    } else {
      // Treat as JSON in the body
      formFields = req.body;

      // Check for base64 encoded files (legacy format)
      if (req.body.logoData) {
        logoFile = {
          filename: req.body.logoFileName || "logo",
          mimetype: "image/*",
          size: req.body.logoData.length,
          data: req.body.logoData,
        };
      }
    }

    // Validate required fields
    const requiredFields = [
      "designNumber",
      "style",
      "goldKarat",
      "approxGoldWeight",
      "stoneType",
      "diamondShape",
      "caratWeight",
      "clarity",
      "sideStoneShape",
      "approxWeight",
      "marking",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formFields[field] || formFields[field].trim() === "",
    );

    if (missingFields.length > 0) {
      res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    if (!logoFile) {
      res.status(400).json({ error: "Logo file is required" });
      return;
    }

    if (!mediaFile) {
      res.status(400).json({ error: "Media file is required" });
      return;
    }

    // Validate marking length
    if (formFields.marking.length > 50) {
      res
        .status(400)
        .json({ error: "Marking must not exceed 50 characters" });
      return;
    }

    const design: Design = {
      id: generateId(),
      designNumber: formFields.designNumber || `DN-${Date.now()}`,
      style: formFields.style,
      goldKarat: formFields.goldKarat,
      approxGoldWeight: formFields.approxGoldWeight,
      stoneType: formFields.stoneType,
      diamondShape: formFields.diamondShape,
      caratWeight: formFields.caratWeight,
      clarity: formFields.clarity,
      sideStoneShape: formFields.sideStoneShape,
      approxWeight: formFields.approxWeight,
      marking: formFields.marking,
      logoFile,
      mediaFile,
      createdAt: new Date().toISOString(),
    };

    designs.push(design);

    // Send email notification asynchronously (don't wait for it)
    sendEmailNotification(design).catch(console.error);

    res.status(201).json({
      ...design,
      logoFile: {
        ...design.logoFile,
        data: undefined, // Don't send base64 data in response
      },
      mediaFile: {
        ...design.mediaFile,
        data: undefined,
      },
    });
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
    const exportData = designs.map((design) => ({
      "Design #": design.designNumber,
      Style: design.style,
      "Gold Karat": design.goldKarat,
      "Gold Weight (g)": design.approxGoldWeight,
      "Stone Type": design.stoneType,
      "Diamond Shape": design.diamondShape,
      "Carat Weight": design.caratWeight,
      Clarity: design.clarity,
      "Side Stone Shape": design.sideStoneShape,
      "Side Stone Weight": design.approxWeight,
      Marking: design.marking,
      "Logo File": design.logoFile?.filename || "N/A",
      "Media File": design.mediaFile?.filename || "N/A",
      "Date Created": new Date(design.createdAt).toLocaleDateString(),
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jewelry Designs");

    // Set column widths for better readability
    const columns = [
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
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
