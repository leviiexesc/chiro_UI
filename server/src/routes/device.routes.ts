import { Router } from "express";
import { prisma } from "../prisma.js";
import { sendSuccess } from "../utils/response.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { AuditService } from "../services/audit.service.js";

const router = Router();
router.use(authenticateAdmin);

// GET /api/v1/devices - List all bound devices
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const search = (req.query.search as string)?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { hwid: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
        { license: { key: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.device.count({ where }),
      prisma.device.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lastSeenAt: "desc" },
        include: {
          license: {
            select: {
              id: true,
              key: true,
              status: true,
              product: {
                select: { name: true, slug: true },
              },
            },
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

// DELETE /api/v1/devices/:id - Unbind device
router.delete("/:id", async (req, res, next) => {
  try {
    const device = await prisma.device.delete({
      where: { id: req.params.id },
      include: { license: true },
    });

    await AuditService.log({
      adminId: req.admin?.id,
      action: "DEVICE_UNBOUND",
      targetType: "Device",
      targetId: req.params.id,
      ipAddress: req.ip,
      details: { hwid: device.hwid, key: device.license.key },
    });

    return sendSuccess(res, { message: "Device successfully unbound" });
  } catch (err) {
    next(err);
  }
});

export default router;
