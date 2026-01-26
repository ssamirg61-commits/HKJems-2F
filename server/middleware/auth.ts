import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";

export const authMiddleware = (
  req: any,
  res: any,
  next: any
) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  req.userId = "temp";
  req.userRole = "admin";

  return next();
};

// Authentication middleware - verify JWT token
export function authenticateToken(
  req: any,
  res: any,
  next: any,
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const verification = verifyToken(token);

    if (!verification.valid || !verification.data) {
      return res.status(401).json({ success: false, message: verification.error || "Invalid token" });
    }

    req.userId = verification.data.userId;
    req.userRole = verification.data.role;

    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Token verification failed" });
  }
}

// Authorization middleware - check user role
export function authorizeRole(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.userRole) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }

    return next();
  };
}

// Optional authentication middleware (for endpoints that can work with or without auth)
export function optionalAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (token) {
      const verification = verifyToken(token);

      if (verification.valid && verification.data) {
        req.userId = verification.data.userId;
        req.userRole = verification.data.role;
      }
    }

    return next();
  } catch (error) {
    return next();
  }
}
