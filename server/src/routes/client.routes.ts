import { Router } from "express";
import { z } from "zod";
import { LicenseService } from "../services/license.service.js";
import { sendSuccess } from "../utils/response.js";
import { clientRateLimiter } from "../middleware/rateLimit.middleware.js";
import { prisma } from "../prisma.js";
import { NotFoundError } from "../utils/errors.js";

const router = Router();

// Apply rate limiter to all public client endpoints
router.use(clientRateLimiter);

const verifySchema = z.object({
  key: z.string().min(1, "License key is required"),
  hwid: z.string().min(1, "HWID is required"),
  productSlug: z.string().optional(),
  placeId: z.union([z.string(), z.number()]).optional(),
  jobId: z.string().optional(),
});

const activateSchema = z.object({
  key: z.string().min(1, "License key is required"),
  hwid: z.string().min(1, "HWID is required"),
  productSlug: z.string().optional(),
});

const resetSchema = z.object({
  key: z.string().min(1, "License key is required"),
});

// POST /api/v1/client/verify - Verify client license and HWID
router.post("/verify", async (req, res, next) => {
  try {
    const { key, hwid, productSlug } = verifySchema.parse(req.body);
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "Unknown";
    const userAgent = req.headers["user-agent"] || "Luau-Client";

    const result = await LicenseService.verifyClientLicense(key, hwid, ip, userAgent, productSlug);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/client/activate - First-time or multi-device activation
router.post("/activate", async (req, res, next) => {
  try {
    const { key, hwid, productSlug } = activateSchema.parse(req.body);
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "Unknown";
    const userAgent = req.headers["user-agent"] || "Luau-Client";

    const result = await LicenseService.activateClientLicense(key, hwid, ip, userAgent, productSlug);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/client/reset-hwid - Admin-initiated HWID reset via key
// NOTE: This endpoint resets ALL devices for a key (admin use via automation)
router.post("/reset-hwid", async (req, res, next) => {
  try {
    const { key } = resetSchema.parse(req.body);
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "Unknown";

    const license = await prisma.license.findUnique({ where: { key } });
    if (!license) {
      throw new NotFoundError("License key not found", "INVALID_LICENSE");
    }

    const result = await LicenseService.resetHWID(license.id, undefined, ip);

    return sendSuccess(res, {
      message: "HWID reset successfully. You may now activate this key on a new device.",
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
