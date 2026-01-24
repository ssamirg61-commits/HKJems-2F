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

  // Initialize default admin
  initializeDefaultAdmin();

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

  // Public auth routes
  app.post("/api/auth/signup", signup);
  app.post("/api/auth/login", login);
  app.post("/api/auth/request-reset", requestPasswordReset);
  app.post("/api/auth/reset-password", resetPassword);

  // Protected auth routes
  app.get("/api/auth/me", authenticateToken, getCurrentUser);
  app.post("/api/auth/change-password", authenticateToken, changePassword);

  // Admin user management routes
  app.get(
    "/api/users",
    authenticateToken,
    authorizeRole(["ADMIN"]),
    getAllUsers,
  );
  app.put(
    "/api/users/:userId",
    authenticateToken,
    authorizeRole(["ADMIN"]),
    updateUser,
  );
  app.delete(
    "/api/users/:userId",
    authenticateToken,
    authorizeRole(["ADMIN"]),
    deleteUser,
  );
  app.post(
    "/api/users/:userId/reset-password",
    authenticateToken,
    authorizeRole(["ADMIN"]),
    resetUserPassword,
  );

  // Design routes with authentication
  app.get("/api/designs", authenticateToken, getDesigns);
  app.get(
    "/api/designs/export",
    authenticateToken,
    authorizeRole(["ADMIN"]),
    exportDesigns,
  );
  app.post("/api/designs", authenticateToken, createDesign);
  app.put("/api/designs/:id", authenticateToken, updateDesign);
  app.delete("/api/designs/:id", authenticateToken, deleteDesign);

  return app;
}
