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

// Initialize DB on first request (lazy initialization for serverless)
let dbInitialized = false;

async function ensureDBInitialized() {
  if (!dbInitialized) {
    await connectDB();
    await initializeDefaultAdmin();
    dbInitialized = true;
  }
}

// Middleware to ensure DB is initialized before handling requests
export const dbMiddleware: express.RequestHandler = async (_req, res, next) => {
  try {
    await ensureDBInitialized();
    next();
  } catch (err) {
    console.error("Database initialization failed", err);
    res.status(500).json({ error: "Database connection failed" });
  }
};

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(dbMiddleware); // Ensure DB is initialized before handling requests

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

  // Global error handler - always return JSON
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  // 404 handler - always return JSON
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
