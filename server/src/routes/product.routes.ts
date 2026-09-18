import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { sendSuccess } from "../utils/response.js";
import { NotFoundError } from "../utils/errors.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { AuditService } from "../services/audit.service.js";

const router = Router();
router.use(authenticateAdmin);

const createProductSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().max(500).optional(),
  maxDevices: z.number().int().min(1).max(100).default(1),
  defaultDurationDays: z.number().int().min(1).nullable().optional(),
});

const updateProductSchema = createProductSchema.partial();

// GET /api/v1/products
router.get("/", async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { licenses: true },
        },
      },
    });

    return sendSuccess(
      res,
      products.map((p) => ({
        ...p,
        licenseCount: p._count.licenses,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/products
router.post("/", async (req, res, next) => {
  try {
    const body = createProductSchema.parse(req.body);
    const product = await prisma.product.create({ data: body });

    await AuditService.log({
      adminId: req.admin?.id,
      action: "PRODUCT_CREATED",
      targetType: "Product",
      targetId: product.id,
      ipAddress: req.ip,
      details: { name: product.name, slug: product.slug },
    });

    return sendSuccess(res, product, 201);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { licenses: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundError("Product not found", "PRODUCT_NOT_FOUND");
    }

    return sendSuccess(res, {
      ...product,
      licenseCount: product._count.licenses,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/products/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const body = updateProductSchema.parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: body,
    });

    await AuditService.log({
      adminId: req.admin?.id,
      action: "PRODUCT_UPDATED",
      targetType: "Product",
      targetId: product.id,
      ipAddress: req.ip,
      details: body,
    });

    return sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/products/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.delete({
      where: { id: req.params.id },
    });

    await AuditService.log({
      adminId: req.admin?.id,
      action: "PRODUCT_DELETED",
      targetType: "Product",
      targetId: req.params.id,
      ipAddress: req.ip,
      details: { name: product.name },
    });

    return sendSuccess(res, { message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
