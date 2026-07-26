import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

const ADMIN_TOKEN_PREFIX = "townseed_admin_";

// Generate a simple session token from the admin password
export function generateAdminToken(password: string): string {
  const ts = Date.now();
  const raw = `${ADMIN_TOKEN_PREFIX}${password}_${ts}`;
  return Buffer.from(raw).toString("base64");
}

// Validate admin token — for simplicity we verify it decodes to a string
// containing the correct admin password
export function validateAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return false;
    return decoded.startsWith(`${ADMIN_TOKEN_PREFIX}${adminPassword}_`);
  } catch {
    return false;
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  if (!validateAdminToken(token)) {
    req.log.warn("Invalid admin token");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
