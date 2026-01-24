import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db";
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
  createUser,
} from "./routes/auth";
import { authenticateToken, authorizeRole } from "./middleware/auth";

// Kick off database connection once for both edge/serverless environments
connectDB()
  .then(() => initializeDefaultAdmin())
  .catch((err) => {
    console.error("Database initialization failed", err);
  });

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check for database (useful for Vercel deployments)
  app.get("/api/db-health", async (_req, res) => {
    try {
      const conn = await connectDB();
      res.status(200).json({
        ok: true,
        readyState: conn.readyState, // 1 = connected
        // hosts property may vary by driver version; include only when available
        hosts: (conn as any).hosts ?? (conn as any).host ?? null,
      });
    } catch (err: any) {
      console.error("DB health check failed:", err);
      res.status(500).json({ ok: false, message: err?.message ?? String(err) });
    }
  });

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
  app.post(
    "/api/users",
    authenticateToken,
    authorizeRole(["ADMIN"]),
    createUser,
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
