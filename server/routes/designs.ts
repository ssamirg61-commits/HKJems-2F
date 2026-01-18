import { RequestHandler } from "express";
import * as XLSX from "xlsx";

// Simple ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
  brandText: string;
  logoFileName?: string;
  createdAt: string;
}

// In-memory storage (will be replaced with database)
let designs: Design[] = [];

export const getDesigns: RequestHandler = (_req, res) => {
  res.json(designs);
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
      sideStoneShape,
      approxWeight,
      brandText,
      logoFileName,
    } = req.body;

    const design: Design = {
      id: generateId(),
      designNumber: designNumber || `DN-${Date.now()}`,
      style,
      goldKarat,
      approxGoldWeight,
      stoneType,
      diamondShape,
      caratWeight,
      clarity,
      sideStoneShape,
      approxWeight,
      brandText,
      logoFileName,
      createdAt: new Date().toISOString(),
    };

    designs.push(design);
    res.status(201).json(design);
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
      "Brand/Stamping": design.brandText,
      "Logo File": design.logoFileName || "N/A",
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
      { wch: 14 },
    ];
    worksheet["!cols"] = columns;

    // Generate as base64 string
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });

    // Send as download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="jewelry-designs-${new Date().toISOString().split("T")[0]}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(Buffer.from(wbout, "base64"));
  } catch (error) {
    console.error("Error exporting designs:", error);
    res.status(400).json({ error: "Failed to export designs" });
  }
};
