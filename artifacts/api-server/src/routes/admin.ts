import { Router, type IRouter } from "express";
import { generateAdminToken } from "../lib/auth";
import { AdminLoginBody, AdminLoginResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// POST /admin/login
router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    req.log.error("ADMIN_PASSWORD environment variable is not set");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (parsed.data.password !== adminPassword) {
    req.log.warn("Invalid admin login attempt");
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = generateAdminToken(parsed.data.password);
  res.json(AdminLoginResponse.parse({ success: true, token }));
});

export default router;
