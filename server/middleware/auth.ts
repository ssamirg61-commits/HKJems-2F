import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";

export const authMiddleware = (
  req: any,
  res: any,
  next: any
) => {
  const token = req.get?.("authorization");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.userId = "temp";
  req.userRole = "admin";

  next();
};

// Authentication middleware - verify JWT token
export function authenticateToken(
  req: any,
  res: any,
  next: any,
) {
  try {
    const authHeader = req.get?.("authorization");
    const token = authHeader?.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const verification = verifyToken(token);

    if (!verification.valid || !verification.data) {
      res.status(401).json({ error: verification.error || "Invalid token" });
      return;
    }

    // Attach user info to request
    req.userId = verification.data.userId;
    req.userRole = verification.data.role;

    next();
  } catch (error) {
    res.status(401).json({ error: "Token verification failed" });
  }
}

// Authorization middleware - check user role
export function authorizeRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.userRole) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

// Optional authentication middleware (for endpoints that can work with or without auth)
export function optionalAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.get?.("authorization");
    const token = authHeader?.split(" ")[1];

    if (token) {
      const verification = verifyToken(token);

      if (verification.valid && verification.data) {
        req.userId = verification.data.userId;
        req.userRole = verification.data.role;
      }
    }

    next();
  } catch (error) {
    // Continue without auth on error
    next();
  }
};
