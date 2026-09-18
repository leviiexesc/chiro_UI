import { Router } from "express";
import { prisma } from "../prisma.js";
import { sendSuccess } from "../utils/response.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticateAdmin);

// GET /api/v1/audit-logs
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const action = req.query.action as string | undefined;
    const search = (req.query.search as string)?.trim();

    const where: any = {};
    if (action) {
      where.action = action;
    }
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { targetType: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: { id: true, username: true, email: true },
          },
        },
      }),
    ]);

    return sendSuccess(res, items, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
