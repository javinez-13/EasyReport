import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth.types";
import { verifyAccessToken } from "../utils/jwt";

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token missing or unauthorized" });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: "Invalid or expired access token" });
  }

  req.user = payload;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const userRole = req.user.role.toUpperCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to ${allowedRoles.join(", ")} roles`,
      });
    }

    next();
  };
}
