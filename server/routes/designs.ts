import { RequestHandler } from "express";

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
  logoData?: string;
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
    } = req.body;

    let logoData: string | undefined;
    if (req.file) {
      logoData = req.file.buffer.toString("base64");
    }

    const design: Design = {
      id: uuidv4(),
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
      logoData,
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
    res.json(designs);
  } catch (error) {
    console.error("Error exporting designs:", error);
    res.status(400).json({ error: "Failed to export designs" });
  }
};
