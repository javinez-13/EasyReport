const jwt = require("jsonwebtoken");

// MUST match src/utils/jwt.ts — login issues tokens with this secret.
const JWT_SECRET =
  process.env.JWT_SECRET || "barangay_easyreport_jwt_secret_key_2026";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
    } catch {
      /* ignore invalid token for optional auth */
    }
  }
  next();
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const normalizedRole = String(req.user.role || "").toUpperCase();
    const normalizedAllowed = allowedRoles.map((role) => String(role || "").toUpperCase());
    if (!normalizedAllowed.includes(normalizedRole)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

function adminMiddleware(req, res, next) {
  if (String(req.user?.role || "").toUpperCase() !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

module.exports = { authMiddleware, optionalAuth, requireRole, adminMiddleware, JWT_SECRET };
