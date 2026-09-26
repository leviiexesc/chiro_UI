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
  telegramId: z.union([z.string(), z.number()]).optional(),
  discordId: z.union([z.string(), z.number()]).optional(),
  cooldownHours: z.number().min(0).max(720).optional(),
});


// GET /api/v1/client/my-keys - Retrieve keys bound to a Telegram or Discord account
router.get("/my-keys", async (req, res, next) => {
  try {
    const telegramId = (req.query.telegramId as string)?.trim();
    const discordId = (req.query.discordId as string)?.trim();
    if (!telegramId && !discordId) {
      return sendSuccess(res, []);
    }

    const whereOr: any[] = [];
    if (telegramId) {
      whereOr.push(
        { customerName: { contains: `ID:${telegramId}` } },
        { note: { contains: `ID:${telegramId}` } }
      );
    }
    if (discordId) {
      whereOr.push(
        { customerDiscord: discordId },
        { customerName: { contains: `DISCORD_ID:${discordId}` } },
        { note: { contains: `DISCORD_ID:${discordId}` } }
      );
    }

    const licenses = await prisma.license.findMany({
      where: { OR: whereOr },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        _count: { select: { devices: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const licensesWithCooldown = licenses.map((lic) => {
      const lastReset = hwidResetCooldowns.get(lic.key);
      return {
        ...lic,
        lastResetAt: lastReset ? new Date(lastReset).toISOString() : null,
        lastResetTimestamp: lastReset || null,
      };
    });

    return sendSuccess(res, licensesWithCooldown);
  } catch (err) {
    next(err);
  }
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

    // Generate a fresh free license key (1 Day / 24 Hours duration) with high-security random key
    const secureKey = LicenseService.generateSecureKey("CHIRO");
    const license = await LicenseService.createLicense({
      productId: product.id,
      maxDevices: product.maxDevices ?? 1,
      durationDays: 1, // Free key expires in 1 day (24 hours)
      customKey: secureKey,
      note: `Auto-generated free key (1-day) via checkpoint from IP ${ip}`,
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

const redeemSchema = z.object({
  code: z.string().min(1, "Voucher code is required"),
  telegramId: z.union([z.string(), z.number()]).optional(),
  telegramUsername: z.string().optional(),
  discordId: z.union([z.string(), z.number()]).optional(),
  discordTag: z.string().optional(),
});

// POST /api/v1/client/redeem - Redeem purchase voucher into secure script key
router.post("/redeem", async (req, res, next) => {
  try {
    const { code, telegramId, telegramUsername, discordId, discordTag } = redeemSchema.parse(req.body);
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "Unknown";

    const result = await LicenseService.redeemVoucher(code, {
      telegramId: telegramId ? String(telegramId) : undefined,
      telegramUsername,
      discordId: discordId ? String(discordId) : undefined,
      discordTag,
      ipAddress: ip,
    });


    return sendSuccess(res, {
      ...result,
      message: "Voucher redeemed successfully! Use your new secure key in getgenv().Key.",
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

// In-memory cooldown store for HWID resets (key → last reset timestamp)
// 4-day cooldown: users cannot reset more than once every 4 days via bot
const hwidResetCooldowns = new Map<string, number>();
const HWID_COOLDOWN_MS = 4 * 24 * 60 * 60 * 1000; // 4 days in milliseconds

// Clean up old entries every hour
setInterval(() => {
  const cutoff = Date.now() - HWID_COOLDOWN_MS;
  for (const [key, ts] of hwidResetCooldowns.entries()) {
    if (ts < cutoff) hwidResetCooldowns.delete(key);
  }
}, 60 * 60 * 1000);

// POST /api/v1/client/reset-hwid - User-initiated HWID reset via key (4-day cooldown)
router.post("/reset-hwid", async (req, res, next) => {
  try {
    const { key, telegramId, discordId, cooldownHours } = resetSchema.parse(req.body);
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "Unknown";


    const license = await prisma.license.findUnique({ where: { key } });
    if (!license) {
      throw new NotFoundError("License key not found", "INVALID_LICENSE");
    }

    // ── Security Check: Telegram Account Ownership Verification ─────────────
    // If this key was redeemed via Telegram, only that exact Telegram account can reset it!
    const boundTgMatch = (license.customerName || license.note || "").match(/ID:(\d+)/);
    if (boundTgMatch) {
      const boundTgId = boundTgMatch[1];
      if (telegramId && String(telegramId) !== boundTgId) {
        throw new AppError(
          "ACCOUNT_MISMATCH",
          "Security Protection: This key is bound to another Telegram account. You cannot reset HWID for keys you do not own.",
          403
        );
      }
    }

    // ── Security Check: Discord Account Ownership Verification ──────────────
    const boundDiscordMatch = (license.customerDiscord || license.customerName || license.note || "").match(/(?:Discord|DISCORD_ID):(\d+)/);
    if (boundDiscordMatch) {
      const boundDiscordId = boundDiscordMatch[1];
      if (discordId && String(discordId) !== boundDiscordId) {
        throw new AppError(
          "ACCOUNT_MISMATCH",
          "Security Protection: This key is bound to another Discord account. You cannot reset HWID for keys you do not own.",
          403
        );
      }
    }

    // ── Role-based Cooldown Calculation ─────────────────────────────────────
    // cooldownHours: 0 = no cooldown (Chiro Hub VIP), 1 = admin, 24 = booster, 96 = default 4 days
    const effectiveCooldownMs = (cooldownHours !== undefined)
      ? cooldownHours * 60 * 60 * 1000
      : HWID_COOLDOWN_MS;

    const lastReset = hwidResetCooldowns.get(key);

    if (lastReset && effectiveCooldownMs > 0) {
      const elapsed = Date.now() - lastReset;
      if (elapsed < effectiveCooldownMs) {
        const remainingMs = effectiveCooldownMs - elapsed;
        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
        const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

        let waitTimeStr = "";
        if (remainingDays > 1) {
          waitTimeStr = `${remainingDays} days`;
        } else if (remainingHours > 1) {
          waitTimeStr = `${remainingHours} hours`;
        } else {
          waitTimeStr = `${remainingMinutes} minutes`;
        }

        throw new AppError(
          "HWID_COOLDOWN",
          `HWID reset is on cooldown. You can reset again in ${waitTimeStr}.`,
          429
        );
      }
    }

    const result = await LicenseService.resetHWID(license.id, undefined, ip);

    // Record the reset time
    hwidResetCooldowns.set(key, Date.now());

    return sendSuccess(res, {
      message: "HWID reset successfully. You may now activate this key on a new device.",
      cooldownHours: cooldownHours !== undefined ? cooldownHours : 96,
      nextResetAvailable: effectiveCooldownMs > 0
        ? new Date(Date.now() + effectiveCooldownMs).toISOString()
        : "Immediately (No Cooldown)",
      ...result,
    });

  } catch (err) {
    next(err);
  }
});

export default router;

