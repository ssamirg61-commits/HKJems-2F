import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/auth";

// Authentication middleware - verify JWT token
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.get("authorization");
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
    (req as any).userId = verification.data.userId;
    (req as any).userRole = verification.data.role as "USER" | "ADMIN";

    next();
  } catch (error) {
    res.status(401).json({ error: "Token verification failed" });
  }
}

// Authorization middleware - check user role
export function authorizeRole(allowedRoles: ("USER" | "ADMIN")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).userRole) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    if (!allowedRoles.includes((req as any).userRole)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

// Optional authentication middleware (for endpoints that can work with or without auth)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (token) {
      const verification = verifyToken(token);

      if (verification.valid && verification.data) {
        (req as any).userId = verification.data.userId;
        (req as any).userRole = verification.data.role as "USER" | "ADMIN";
      }
    }

    next();
  } catch (error) {
    // Continue without auth on error
    next();
  }
};
