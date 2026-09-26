import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { sendSuccess } from "../utils/response.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { AppError } from "../utils/errors.js";

const router = Router();
router.use(authenticateAdmin);

const addBlacklistSchema = z.object({
  type: z.enum(["DISCORD", "TELEGRAM", "HWID"]),
  value: z.string().min(1, "Value is required"),
  reason: z.string().optional(),
});

// GET /api/v1/admin/blacklist - List all blacklisted entries
router.get("/", async (req, res, next) => {
  try {
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = {};
    if (type && ["DISCORD", "TELEGRAM", "HWID"].includes(type)) {
      where.type = type;
    }
    if (search) {
      where.value = { contains: search };
    }

    const entries = await prisma.blacklist.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(res, entries);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/blacklist - Add to blacklist
router.post("/", async (req, res, next) => {
  try {
    const { type, value, reason } = addBlacklistSchema.parse(req.body);
    const admin = (req as any).admin;

    const existing = await prisma.blacklist.findUnique({
      where: { type_value: { type: type as any, value } },
    });
    if (existing) {
      throw new AppError("ALREADY_BLACKLISTED", "This entry is already blacklisted.", 409);
    }

    const entry = await prisma.blacklist.create({
      data: {
        type: type as any,
        value,
        reason,
        bannedBy: admin?.username || "admin",
      },
    });

    return sendSuccess(res, entry, 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/blacklist/:id - Remove from blacklist
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.blacklist.delete({ where: { id } });
    return sendSuccess(res, { message: "Entry removed from blacklist." });
  } catch (err) {
    next(err);
  }
});

export default router;
