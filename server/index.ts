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
import {
  signup,
  login,
  getCurrentUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getAllUsers,
  updateUser,
  deleteUser,
  resetUserPassword,
  initializeDefaultAdmin,
} from "./routes/auth";
import { authenticateToken, authorizeRole } from "./middleware/auth";

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
  app.get("/api/designs/export", exportDesigns);
  app.post("/api/designs", createDesign);
  app.put("/api/designs/:id", updateDesign);
  app.delete("/api/designs/:id", deleteDesign);

  return app;
}
