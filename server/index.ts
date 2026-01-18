import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getDesigns,
  createDesign,
  updateDesign,
  deleteDesign,
  exportDesigns,
} from "./routes/designs";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Design routes
  app.get("/api/designs", getDesigns);
  app.post("/api/designs", createDesign);
  app.put("/api/designs/:id", updateDesign);
  app.delete("/api/designs/:id", deleteDesign);
  app.get("/api/designs/export", exportDesigns);

  return app;
}
