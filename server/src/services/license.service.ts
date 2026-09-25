import crypto from "crypto";
import { LicenseStatus } from "@prisma/client";
import { prisma } from "../prisma.js";
import { AppError, NotFoundError, ForbiddenError } from "../utils/errors.js";
import { AuditService } from "./audit.service.js";

export interface CreateLicenseInput {
  productId: string;
  maxDevices?: number;
  durationDays?: number | null; // null = lifetime
  note?: string;
  customKey?: string;
}

export interface BatchGenerateInput {
  productId: string;
  count: number;
  maxDevices?: number;
  durationDays?: number | null;
  note?: string;
  prefix?: string;
}

export class LicenseService {
  /**
   * Generates a cryptographically random license key formatted as PREFIX-XXXX-XXXX-XXXX
   */
  public static generateKeyString(prefix = "CHIRO", chunks = 3, chunkLen = 4): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Base32 without ambiguous characters (0, O, 1, I)
    const parts: string[] = [prefix.toUpperCase().trim()];

    for (let i = 0; i < chunks; i++) {
      let chunk = "";
      const randomBytes = crypto.randomBytes(chunkLen);
      for (let j = 0; j < chunkLen; j++) {
        chunk += chars[randomBytes[j] % chars.length];
      }
      parts.push(chunk);
    }

    return parts.join("-");
  }

  /**
   * Creates a single license
   */
  public static async createLicense(input: CreateLicenseInput, adminId?: string, ipAddress?: string) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });

    if (!product) {
      throw new NotFoundError("Product not found", "PRODUCT_NOT_FOUND");
    }

    let key = input.customKey?.toUpperCase().trim();
    if (!key) {
      key = this.generateKeyString("CHIRO");
      // Collision prevention check
      let exists = await prisma.license.findUnique({ where: { key } });
      while (exists) {
        key = this.generateKeyString("CHIRO");
        exists = await prisma.license.findUnique({ where: { key } });
      }
    } else {
      const exists = await prisma.license.findUnique({ where: { key } });
      if (exists) {
        throw new AppError("LICENSE_ALREADY_EXISTS", "A license with this key already exists", 409);
      }
    }

    const durationDays = input.durationDays !== undefined ? input.durationDays : product.defaultDurationDays;
    let expiresAt: Date | null = null;

    if (durationDays && durationDays > 0) {
      expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    }

    const maxDevices = input.maxDevices ?? product.maxDevices;

    const license = await prisma.license.create({
      data: {
        key,
        productId: product.id,
        status: LicenseStatus.UNUSED,
        maxDevices,
        expiresAt,
        note: input.note,
      },
      include: {
        product: true,
      },
    });

    await AuditService.log({
      adminId,
      action: "LICENSE_CREATED",
      targetType: "License",
      targetId: license.id,
      ipAddress,
      details: { key: license.key, productId: product.id, maxDevices, expiresAt },
    });

    return license;
  }

  /**
   * Batch generates multiple license keys
   */
  public static async batchGenerate(input: BatchGenerateInput, adminId?: string, ipAddress?: string) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });

    if (!product) {
      throw new NotFoundError("Product not found", "PRODUCT_NOT_FOUND");
    }

    const count = Math.min(Math.max(1, input.count), 500); // safety clamp
    const durationDays = input.durationDays !== undefined ? input.durationDays : product.defaultDurationDays;
    let expiresAt: Date | null = null;
    if (durationDays && durationDays > 0) {
      expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    }
    const maxDevices = input.maxDevices ?? product.maxDevices;
    const prefix = input.prefix || "CHIRO";

    const keysToCreate: string[] = [];
    const usedKeysSet = new Set<string>();

    while (keysToCreate.length < count) {
      const key = this.generateKeyString(prefix);
      if (!usedKeysSet.has(key)) {
        usedKeysSet.add(key);
        keysToCreate.push(key);
      }
    }

    // Check DB collisions for the batch
    const existing = await prisma.license.findMany({
      where: { key: { in: keysToCreate } },
      select: { key: true },
    });
    const existingSet = new Set(existing.map((l) => l.key));
    const validKeys = keysToCreate.filter((k) => !existingSet.has(k));

    // Refill any collisions
    while (validKeys.length < count) {
      const key = this.generateKeyString(prefix);
      if (!usedKeysSet.has(key)) {
        usedKeysSet.add(key);
        const inDb = await prisma.license.findUnique({ where: { key } });
        if (!inDb) {
          validKeys.push(key);
        }
      }
    }

    const created = await prisma.$transaction(
      validKeys.map((key) =>
        prisma.license.create({
          data: {
            key,
            productId: product.id,
            status: LicenseStatus.UNUSED,
            maxDevices,
            expiresAt,
            note: input.note,
          },
        })
      )
    );

    await AuditService.log({
      adminId,
      action: "BATCH_LICENSES_GENERATED",
      targetType: "License",
      ipAddress,
      details: { count: created.length, productId: product.id, prefix },
    });

    return created;
  }

  /**
   * Client Verification Endpoint logic
   * Checks license key, expiration, revocation, and HWID binding.
   */
  public static async verifyClientLicense(key: string, hwid: string, ipAddress?: string, userAgent?: string, productSlug?: string) {
    const cleanedKey = key.toUpperCase().trim();
    const cleanedHWID = hwid.trim();

    if (!cleanedKey) {
      throw new AppError("INVALID_LICENSE", "The license key is invalid.", 400);
    }
    if (!cleanedHWID) {
      throw new AppError("INVALID_HWID", "Device hardware identifier is required.", 400);
    }

    const license = await prisma.license.findUnique({
      where: { key: cleanedKey },
      include: {
        product: true,
        devices: true,
      },
    });

    if (!license) {
      throw new AppError("INVALID_LICENSE", "The license key is invalid.", 404);
    }

    // Check product slug match if specified
    if (productSlug && license.product && license.product.slug.toLowerCase() !== productSlug.toLowerCase()) {
      throw new ForbiddenError(
        `License key belongs to '${license.product.name}' (${license.product.slug}), not '${productSlug}'.`,
        "PRODUCT_MISMATCH"
      );
    }

    // Check status: REVOKED
    if (license.status === LicenseStatus.REVOKED) {
      throw new ForbiddenError("The license has been revoked.", "LICENSE_REVOKED");
    }

    // Check expiration: only active licenses expire.
    // Unused licenses start their countdown upon first activation.
    if (license.status !== LicenseStatus.UNUSED && license.expiresAt && new Date() > license.expiresAt) {
      if (license.status !== LicenseStatus.EXPIRED) {
        await prisma.license.update({
          where: { id: license.id },
          data: { status: LicenseStatus.EXPIRED },
        });
      }
      throw new ForbiddenError("The license has expired.", "LICENSE_EXPIRED");
    }

    // If license is UNUSED, client should activate first or verify can auto-activate
    const boundDevice = license.devices.find((d) => d.hwid === cleanedHWID);

    if (!boundDevice) {
      // If UNUSED, automatically bind this first device
      if (license.status === LicenseStatus.UNUSED) {
        return await this.activateClientLicense(cleanedKey, cleanedHWID, ipAddress, userAgent, productSlug);
      }

      // If ACTIVE, check if it can bind a new device within maxDevices limit
      if (license.devices.length < license.maxDevices) {
        return await this.activateClientLicense(cleanedKey, cleanedHWID, ipAddress, userAgent, productSlug);
      }

      // Otherwise, HWID mismatch / device limit reached
      throw new ForbiddenError(
        "HWID mismatch: This license is already bound to another device.",
        "HWID_MISMATCH"
      );
    }

    // Update last seen timestamp and IP
    await prisma.device.update({
      where: { id: boundDevice.id },
      data: {
        lastSeenAt: new Date(),
        ipAddress: ipAddress || boundDevice.ipAddress,
        userAgent: userAgent || boundDevice.userAgent,
      },
    });

    return {
      valid: true,
      status: license.status,
      product: {
        id: license.product.id,
        name: license.product.name,
        slug: license.product.slug,
      },
      license: {
        key: license.key,
        maxDevices: license.maxDevices,
        currentDevices: license.devices.length,
        expiresAt: license.expiresAt,
        isLifetime: license.expiresAt === null,
      },
      device: {
        hwid: boundDevice.hwid,
        lastSeenAt: new Date(),
      },
    };
  }

  /**
   * Client Activation Endpoint logic
   */
  public static async activateClientLicense(key: string, hwid: string, ipAddress?: string, userAgent?: string, productSlug?: string) {
    const cleanedKey = key.toUpperCase().trim();
    const cleanedHWID = hwid.trim();

    const license = await prisma.license.findUnique({
      where: { key: cleanedKey },
      include: {
        product: true,
        devices: true,
      },
    });

    if (!license) {
      throw new AppError("INVALID_LICENSE", "The license key is invalid.", 404);
    }

    // Check product slug match if specified
    if (productSlug && license.product && license.product.slug.toLowerCase() !== productSlug.toLowerCase()) {
      throw new ForbiddenError(
        `License key belongs to '${license.product.name}' (${license.product.slug}), not '${productSlug}'.`,
        "PRODUCT_MISMATCH"
      );
    }

    if (license.status === LicenseStatus.REVOKED) {
      throw new ForbiddenError("The license has been revoked.", "LICENSE_REVOKED");
    }

    if (license.status !== LicenseStatus.UNUSED && license.expiresAt && new Date() > license.expiresAt) {
      throw new ForbiddenError("The license has expired.", "LICENSE_EXPIRED");
    }

    const existingDevice = license.devices.find((d) => d.hwid === cleanedHWID);
    if (existingDevice) {
      // Already active on this device
      return {
        valid: true,
        activated: false,
        message: "Device already registered.",
        product: {
          id: license.product.id,
          name: license.product.name,
          slug: license.product.slug,
        },
        license: {
          key: license.key,
          status: license.status,
          expiresAt: license.expiresAt,
        },
      };
    }

    if (license.devices.length >= license.maxDevices) {
      throw new ForbiddenError(
        `Device limit reached (${license.devices.length}/${license.maxDevices}). Please reset your HWID.`,
        "DEVICE_LIMIT_REACHED"
      );
    }

    // Bind device and set ACTIVE
    const newDevice = await prisma.device.create({
      data: {
        licenseId: license.id,
        hwid: cleanedHWID,
        ipAddress,
        userAgent,
      },
    });

    // If license was UNUSED, calculate fresh expiration time starting from this exact activation moment!
    let finalExpiresAt = license.expiresAt;
    if (license.status === LicenseStatus.UNUSED && license.expiresAt) {
      const durationMs = license.expiresAt.getTime() - license.createdAt.getTime();
      if (durationMs > 0) {
        finalExpiresAt = new Date(Date.now() + durationMs);
      }
    }

    const updatedLicense = await prisma.license.update({
      where: { id: license.id },
      data: {
        status: LicenseStatus.ACTIVE,
        expiresAt: finalExpiresAt,
        totalActivations: { increment: 1 },
      },
      include: {
        product: true,
      },
    });

    await AuditService.log({
      action: "DEVICE_ACTIVATED",
      targetType: "License",
      targetId: license.id,
      ipAddress,
      details: { hwid: cleanedHWID, key: license.key },
    });

    return {
      valid: true,
      activated: true,
      message: "License activated successfully.",
      product: {
        id: updatedLicense.product.id,
        name: updatedLicense.product.name,
        slug: updatedLicense.product.slug,
      },
      license: {
        key: updatedLicense.key,
        status: updatedLicense.status,
        expiresAt: updatedLicense.expiresAt,
        isLifetime: updatedLicense.expiresAt === null,
        devicesUsed: license.devices.length + 1,
        maxDevices: updatedLicense.maxDevices,
      },
      device: {
        id: newDevice.id,
        hwid: newDevice.hwid,
        createdAt: newDevice.createdAt,
      },
    };
  }

  /**
   * Resets all HWID device bindings for a license
   */
  public static async resetHWID(licenseId: string, adminId?: string, ipAddress?: string) {
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: { devices: true },
    });

    if (!license) {
      throw new NotFoundError("License not found", "LICENSE_NOT_FOUND");
    }

    const count = license.devices.length;

    await prisma.device.deleteMany({
      where: { licenseId: license.id },
    });

    // If it had devices and was ACTIVE, keep it active or unused
    await prisma.license.update({
      where: { id: license.id },
      data: {
        status: license.status === LicenseStatus.ACTIVE ? LicenseStatus.ACTIVE : license.status,
      },
    });

    await AuditService.log({
      adminId,
      action: "HWID_RESET",
      targetType: "License",
      targetId: license.id,
      ipAddress,
      details: { key: license.key, devicesCleared: count },
    });

    return { success: true, clearedDevices: count };
  }

  /**
   * Revoke a license
   */
  public static async revokeLicense(licenseId: string, reason?: string, adminId?: string, ipAddress?: string) {
    const license = await prisma.license.findUnique({ where: { id: licenseId } });
    if (!license) throw new NotFoundError("License not found", "LICENSE_NOT_FOUND");

    const updated = await prisma.license.update({
      where: { id: licenseId },
      data: { status: LicenseStatus.REVOKED },
    });

    await AuditService.log({
      adminId,
      action: "LICENSE_REVOKED",
      targetType: "License",
      targetId: licenseId,
      ipAddress,
      details: { key: license.key, reason },
    });

    return updated;
  }

  /**
   * Unrevoke a license
   */
  public static async unrevokeLicense(licenseId: string, adminId?: string, ipAddress?: string) {
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: { devices: true },
    });
    if (!license) throw new NotFoundError("License not found", "LICENSE_NOT_FOUND");

    // Recompute appropriate status
    let newStatus: LicenseStatus = LicenseStatus.ACTIVE;
    if (license.expiresAt && new Date() > license.expiresAt) {
      newStatus = LicenseStatus.EXPIRED;
    } else if (license.devices.length === 0) {
      newStatus = LicenseStatus.UNUSED;
    }

    const updated = await prisma.license.update({
      where: { id: licenseId },
      data: { status: newStatus },
    });

    await AuditService.log({
      adminId,
      action: "LICENSE_UNREVOKED",
      targetType: "License",
      targetId: licenseId,
      ipAddress,
      details: { key: license.key, newStatus: newStatus },
    });

    return updated;
  }
}
