import { Router } from "express";
import { z } from "zod";
import { LicenseStatus, Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { LicenseService } from "../services/license.service.js";
import { sendSuccess } from "../utils/response.js";
import { NotFoundError } from "../utils/errors.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { AuditService } from "../services/audit.service.js";

const router = Router();

// Protect all license administrative routes
router.use(authenticateAdmin);

const createLicenseSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  maxDevices: z.number().int().min(1).max(100).optional(),
  hwidLock: z.boolean().optional().default(true),
  expiresAt: z.string().datetime().nullable().optional(),
  durationDays: z.number().int().min(1).nullable().optional(),
  note: z.string().max(500).optional(),
  customKey: z.string().min(5).max(64).optional(),
  customerEmail: z.string().email().optional(),
  customerDiscord: z.string().max(100).optional(),
  customerName: z.string().max(100).optional(),
});

const batchGenerateSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  count: z.number().int().min(1).max(500),
  maxDevices: z.number().int().min(1).max(100).optional(),
  hwidLock: z.boolean().optional().default(true),
  expiresAt: z.string().datetime().nullable().optional(),
  durationDays: z.number().int().min(1).nullable().optional(),
  note: z.string().max(500).optional(),
  prefix: z.string().min(2).max(12).optional(),
});

const updateLicenseSchema = z.object({
  note: z.string().max(500).optional(),
  maxDevices: z.number().int().min(1).max(100).optional(),
  hwidLock: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  status: z.nativeEnum(LicenseStatus).optional(),
  customerEmail: z.string().email().optional(),
  customerDiscord: z.string().max(100).optional(),
  customerName: z.string().max(100).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard stats — two aliases for the same endpoint
// ─────────────────────────────────────────────────────────────────────────────
const getStats = async (req: any, res: any, next: any) => {
  try {
    const [total, active, unused, expired, revoked, devicesCount, productsCount] = await Promise.all([
      prisma.license.count(),
      prisma.license.count({ where: { status: LicenseStatus.ACTIVE } }),
      prisma.license.count({ where: { status: LicenseStatus.UNUSED } }),
      prisma.license.count({ where: { status: LicenseStatus.EXPIRED } }),
      prisma.license.count({ where: { status: LicenseStatus.REVOKED } }),
      prisma.device.count(),
      prisma.product.count(),
    ]);

    // Active devices in last 24 h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeDevices24h = await prisma.device.count({
      where: { lastSeenAt: { gte: oneDayAgo } },
    });

    // Recent audit trail
    const recentAuditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        admin: { select: { id: true, username: true, email: true } },
      },
    });

    // Product distribution
    const products = await prisma.product.findMany({
      include: { _count: { select: { licenses: true } } },
      orderBy: { createdAt: "asc" },
    });
    const productDistribution = products.map((p) => ({
      name: p.name,
      count: p._count.licenses,
    }));

    return sendSuccess(res, {
      totalLicenses: total,
      activeLicenses: active,
      unusedLicenses: unused,
      expiredLicenses: expired,
      revokedLicenses: revoked,
      totalDevices: devicesCount,
      activeDevices24h,
      totalProducts: productsCount,
      recentAuditLogs,
      productDistribution,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/licenses/stats  AND  /api/v1/licenses/stats/overview
router.get("/stats", getStats);
router.get("/stats/overview", getStats);

// GET /api/v1/licenses - Paginated query with search and filters
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string)?.trim();
    const status = req.query.status as LicenseStatus | undefined;
    const productId = req.query.productId as string | undefined;

    const where: Prisma.LicenseWhereInput = {};

    if (status && Object.values(LicenseStatus).includes(status)) {
      where.status = status;
    }

    if (productId) {
      where.productId = productId;
    }

    if (search) {
      where.OR = [
        { key: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { customerDiscord: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.license.count({ where }),
      prisma.license.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { devices: true },
          },
        },
      }),
    ]);

    return sendSuccess(
      res,
      items,
      200,
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/licenses - Create single license
router.post("/", async (req, res, next) => {
  try {
    const body = createLicenseSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product) throw new NotFoundError("Product not found", "NOT_FOUND");

    // Determine expiry
    let expiresAt: Date | null = null;
    if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt);
    } else if (body.durationDays && body.durationDays > 0) {
      expiresAt = new Date(Date.now() + body.durationDays * 86400000);
    } else if (product.defaultDurationDays) {
      expiresAt = new Date(Date.now() + product.defaultDurationDays * 86400000);
    }

    const key = LicenseService.generateKeyString("CHIRO");
    const maxDevices = body.maxDevices ?? product.maxDevices;

    const license = await prisma.license.create({
      data: {
        key,
        productId: product.id,
        status: LicenseStatus.UNUSED,
        maxDevices,
        hwidLock: body.hwidLock ?? true,
        expiresAt,
        note: body.note,
        customerEmail: body.customerEmail,
        customerDiscord: body.customerDiscord,
        customerName: body.customerName,
      },
      include: { product: true, _count: { select: { devices: true } } },
    });

    await AuditService.log({
      adminId: req.admin?.id,
      action: "LICENSE_CREATED",
      targetType: "License",
      targetId: license.id,
      ipAddress: req.ip,
      details: { key: license.key, productName: product.name },
    });

    return sendSuccess(res, license, 201);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/licenses/batch - Batch generate
router.post("/batch", async (req, res, next) => {
  try {
    const body = batchGenerateSchema.parse(req.body);

    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product) throw new NotFoundError("Product not found", "NOT_FOUND");

    let expiresAt: Date | null = null;
    if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt);
    } else if (body.durationDays && body.durationDays > 0) {
      expiresAt = new Date(Date.now() + body.durationDays * 86400000);
    } else if (product.defaultDurationDays) {
      expiresAt = new Date(Date.now() + product.defaultDurationDays * 86400000);
    }

    const maxDevices = body.maxDevices ?? product.maxDevices;
    const keys: string[] = [];

    for (let i = 0; i < body.count; i++) {
      let key = LicenseService.generateKeyString(body.prefix || "CHIRO");
      while (keys.includes(key) || (await prisma.license.count({ where: { key } })) > 0) {
        key = LicenseService.generateKeyString(body.prefix || "CHIRO");
      }
      keys.push(key);
    }

    const licenses = await prisma.$transaction(
      keys.map((key) =>
        prisma.license.create({
          data: {
            key,
            productId: product.id,
            status: LicenseStatus.UNUSED,
            maxDevices,
            hwidLock: body.hwidLock ?? true,
            expiresAt,
            note: body.note,
          },
        })
      )
    );

    await AuditService.log({
      adminId: req.admin?.id,
      action: "BATCH_GENERATED",
      targetType: "License",
      ipAddress: req.ip,
      details: { count: licenses.length, productName: product.name },
    });

    return sendSuccess(res, { count: licenses.length, licenses }, 201);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/licenses/:id - License details with devices
router.get("/:id", async (req, res, next) => {
  try {
    const license = await prisma.license.findUnique({
      where: { id: req.params.id },
      include: {
        product: true,
        devices: { orderBy: { lastSeenAt: "desc" } },
      },
    });

    if (!license) {
      throw new NotFoundError("License not found", "LICENSE_NOT_FOUND");
    }

    return sendSuccess(res, license);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/licenses/:id - Update license
router.patch("/:id", async (req, res, next) => {
  try {
    const body = updateLicenseSchema.parse(req.body);
    const data: Prisma.LicenseUpdateInput = {};

    if (body.note !== undefined) data.note = body.note;
    if (body.maxDevices !== undefined) data.maxDevices = body.maxDevices;
    if (body.hwidLock !== undefined) data.hwidLock = body.hwidLock;
    if (body.status !== undefined) data.status = body.status;
    if (body.customerEmail !== undefined) data.customerEmail = body.customerEmail;
    if (body.customerDiscord !== undefined) data.customerDiscord = body.customerDiscord;
    if (body.customerName !== undefined) data.customerName = body.customerName;
    if (body.expiresAt !== undefined) {
      data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    const updated = await prisma.license.update({
      where: { id: req.params.id },
      data,
      include: { product: true, _count: { select: { devices: true } } },
    });

    return sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/licenses/:id - Delete license
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.license.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { message: "License deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/licenses/:id/reset-hwid - Reset bound HWIDs
router.post("/:id/reset-hwid", async (req, res, next) => {
  try {
    const result = await LicenseService.resetHWID(req.params.id, req.admin?.id, req.ip);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/licenses/:id/revoke - Revoke license
router.post("/:id/revoke", async (req, res, next) => {
  try {
    const reason = (req.body.reason as string) || "Administrative revocation";
    const result = await LicenseService.revokeLicense(req.params.id, reason, req.admin?.id, req.ip);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/licenses/:id/unrevoke - Unrevoke license
router.post("/:id/unrevoke", async (req, res, next) => {
  try {
    const result = await LicenseService.unrevokeLicense(req.params.id, req.admin?.id, req.ip);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
