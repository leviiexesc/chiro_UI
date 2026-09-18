import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { config } from "../config/index.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { UnauthorizedError } from "../utils/errors.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";
import { AuditService } from "../services/audit.service.js";

const router = Router();

const loginSchema = z.object({
  // Support both "username" and "usernameOrEmail" from the frontend
  username: z.string().optional(),
  usernameOrEmail: z.string().optional(),
  password: z.string().min(1, "Password is required"),
}).transform((data) => ({
  username: data.usernameOrEmail || data.username || "",
  password: data.password,
}));

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// POST /api/v1/auth/login
router.post("/login", authRateLimiter, async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    if (!username) {
      return sendError(res, "VALIDATION_ERROR", "Username or email is required", 400);
    }

    const admin = await prisma.adminUser.findFirst({
      where: {
        OR: [{ username }, { email: username.toLowerCase() }],
      },
    });

    if (!admin) {
      throw new UnauthorizedError("Invalid username or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid username or password", "INVALID_CREDENTIALS");
    }

    const token = jwt.sign(
      {
        sub: admin.id,
        username: admin.username,
        role: admin.role,
      },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await AuditService.log({
      adminId: admin.id,
      action: "ADMIN_LOGIN",
      targetType: "Auth",
      targetId: admin.id,
      ipAddress: req.ip,
      details: { username: admin.username },
    });

    return sendSuccess(res, {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get("/me", authenticateAdmin, async (req, res, next) => {
  try {
    return sendSuccess(res, { admin: req.admin });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/change-password
router.post("/change-password", authenticateAdmin, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const adminId = req.admin!.id;

    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new UnauthorizedError("Admin not found", "NOT_FOUND");
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return sendError(res, "INCORRECT_PASSWORD", "Current password is incorrect.", 400);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.adminUser.update({
      where: { id: adminId },
      data: { passwordHash },
    });

    await AuditService.log({
      adminId,
      action: "PASSWORD_CHANGED",
      targetType: "Auth",
      targetId: adminId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post("/logout", authenticateAdmin, async (req, res, next) => {
  try {
    await AuditService.log({
      adminId: req.admin?.id,
      action: "ADMIN_LOGOUT",
      targetType: "Auth",
      ipAddress: req.ip,
    });
    return sendSuccess(res, { message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
