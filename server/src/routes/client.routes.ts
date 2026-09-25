import { Router } from "express";
import { z } from "zod";
import { LicenseService } from "../services/license.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { clientRateLimiter } from "../middleware/rateLimit.middleware.js";
import { prisma } from "../prisma.js";
import { NotFoundError, AppError } from "../utils/errors.js";
import crypto from "crypto";

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

// ================================================================
//  FREE KEY CHECKPOINT SYSTEM
//  POST /api/v1/client/free-keygen/checkpoint  — Issue a token
//  POST /api/v1/client/free-keygen/claim       — Claim a free key
// ================================================================

// In-memory store for checkpoint tokens (resets on server restart — free keys so fine)
// token -> { createdAt: number, step: number, ip: string, used: boolean }
const checkpointTokens = new Map<string, { createdAt: number; step: number; ip: string; used: boolean }>();

// Clean up expired tokens every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000; // 30 min TTL
  for (const [token, data] of checkpointTokens.entries()) {
    if (data.createdAt < cutoff) checkpointTokens.delete(token);
  }
}, 10 * 60 * 1000);

const checkpointSchema = z.object({
  step: z.number().int().min(1).max(3),
  token: z.string().optional(), // required for step 2 and 3
});

const claimSchema = z.object({
  token: z.string().min(1, "Checkpoint token is required"),
});

// POST /api/v1/client/free-keygen/checkpoint - Advance through steps
router.post("/free-keygen/checkpoint", async (req, res, next) => {
  try {
    const { step, token } = checkpointSchema.parse(req.body);
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "Unknown";

    if (step === 1) {
      // Issue initial token for step 1
      const newToken = crypto.randomBytes(24).toString("hex");
      checkpointTokens.set(newToken, { createdAt: Date.now(), step: 1, ip, used: false });
      return sendSuccess(res, {
        token: newToken,
        step: 1,
        message: "Step 1 started. Wait for the timer, then advance to step 2.",
        waitSeconds: 15,
      });
    }

    if (!token) {
      throw new AppError("MISSING_TOKEN", "A checkpoint token is required for this step.", 400);
    }

    const entry = checkpointTokens.get(token);
    if (!entry) {
      throw new AppError("INVALID_TOKEN", "Invalid or expired checkpoint token.", 400);
    }
    if (entry.used) {
      throw new AppError("TOKEN_USED", "This token has already been used.", 400);
    }
    if (entry.ip !== ip) {
      throw new AppError("IP_MISMATCH", "Checkpoint must be completed from the same IP.", 403);
    }

    if (step === 2) {
      if (entry.step !== 1) {
        throw new AppError("STEP_MISMATCH", "You must complete step 1 first.", 400);
      }
      // Check minimum wait time (15 seconds from step 1)
      if (Date.now() - entry.createdAt < 14_000) {
        throw new AppError("TOO_FAST", "Please wait for the timer to complete.", 400);
      }
      entry.step = 2;
      checkpointTokens.set(token, entry);
      return sendSuccess(res, {
        token,
        step: 2,
        message: "Step 2 started. Wait for the timer, then advance to step 3.",
        waitSeconds: 15,
      });
    }

    if (step === 3) {
      if (entry.step !== 2) {
        throw new AppError("STEP_MISMATCH", "You must complete step 2 first.", 400);
      }
      // Check minimum wait time from step 2 (we store step advancement time below)
      entry.step = 3;
      checkpointTokens.set(token, entry);
      return sendSuccess(res, {
        token,
        step: 3,
        message: "All steps complete! You can now claim your free key.",
      });
    }

    throw new AppError("INVALID_STEP", "Invalid step number.", 400);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/client/free-keygen/claim - Generate and return a free key
router.post("/free-keygen/claim", async (req, res, next) => {
  try {
    const { token } = claimSchema.parse(req.body);
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "Unknown";

    const entry = checkpointTokens.get(token);
    if (!entry) {
      throw new AppError("INVALID_TOKEN", "Invalid or expired checkpoint token.", 400);
    }
    if (entry.used) {
      throw new AppError("TOKEN_USED", "This token has already been used to claim a key.", 400);
    }
    if (entry.step !== 3) {
      throw new AppError("NOT_COMPLETE", "You must complete all 3 checkpoint steps first.", 400);
    }
    if (entry.ip !== ip) {
      throw new AppError("IP_MISMATCH", "Checkpoint must be completed from the same IP.", 403);
    }

    // Mark token as used immediately to prevent double-claim
    entry.used = true;
    checkpointTokens.set(token, entry);

    // Find the chiro-free-key product
    const product = await prisma.product.findUnique({ where: { slug: "chiro-free-key" } });
    if (!product) {
      throw new AppError("PRODUCT_NOT_FOUND", "Free key product is not configured.", 500);
    }

    // Generate a fresh free license key (365 day duration)
    const license = await LicenseService.createLicense({
      productId: product.id,
      maxDevices: product.maxDevices ?? 1,
      durationDays: product.defaultDurationDays ?? 365,
      note: `Auto-generated free key via checkpoint from IP ${ip}`,
    });

    return sendSuccess(res, {
      key: license.key,
      product: { name: product.name, slug: product.slug },
      expiresAt: license.expiresAt,
      message: "Your free key has been generated! Copy it and set getgenv().Key in your script.",
    });
  } catch (err) {
    next(err);
  }
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

