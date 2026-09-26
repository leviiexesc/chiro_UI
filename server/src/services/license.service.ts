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
   * Used for store purchase voucher codes (e.g. CHIRO-RA3H-RUEY-ESKF)
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
   * Generates a high-entropy cryptographically secure license key (96-bit entropy)
   * Format: PREFIX_24hex (e.g. CHIRO_7d672a9d2743ddd3b50c2710)
   * Statistically impossible to brute-force or guess by humans or AI.
   */
  public static generateSecureKey(prefix = "CHIRO"): string {
    const hex = crypto.randomBytes(12).toString("hex").toLowerCase();
    return `${prefix.toUpperCase().trim()}_${hex}`;
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
    const cleanedKey = key.trim();
    const cleanedHWID = hwid.trim();

    if (!cleanedKey) {
      throw new AppError("INVALID_LICENSE", "The license key is invalid.", 400);
    }
    if (!cleanedHWID) {
      throw new AppError("INVALID_HWID", "Device hardware identifier is required.", 400);
    }

    // Blacklist check for HWID
    const hwidBlacklisted = await prisma.blacklist.findFirst({
      where: { type: "HWID", value: cleanedHWID },
    });
    if (hwidBlacklisted) {
      throw new ForbiddenError(
        "This hardware identifier (HWID) has been blacklisted from using Chiro UI.",
        "HWID_BLACKLISTED"
      );
    }


    // Exact key lookup, then uppercase/lowercase fallback for database case compatibility
    let license = await prisma.license.findUnique({
      where: { key: cleanedKey },
      include: {
        product: true,
        devices: true,
      },
    });

    if (!license) {
      license = await prisma.license.findUnique({
        where: { key: cleanedKey.toUpperCase() },
        include: {
          product: true,
          devices: true,
        },
      });
    }

    if (!license) {
      license = await prisma.license.findUnique({
        where: { key: cleanedKey.toLowerCase() },
        include: {
          product: true,
          devices: true,
        },
      });
    }

    if (!license) {
      throw new AppError("INVALID_LICENSE", "The license key is invalid.", 404);
    }

    // Check product slug match if specified
    // Lifetime keys (expiresAt === null) enjoy universal VIP access across all products!
    if (
      productSlug &&
      license.product &&
      license.expiresAt !== null &&
      license.product.slug.toLowerCase() !== productSlug.toLowerCase()
    ) {
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
      // If UNUSED, automatically bind this first device using exact key casing from DB
      if (license.status === LicenseStatus.UNUSED) {
        return await this.activateClientLicense(license.key, cleanedHWID, ipAddress, userAgent, productSlug);
      }

      // If ACTIVE, check if it can bind a new device within maxDevices limit
      if (license.devices.length < license.maxDevices) {
        return await this.activateClientLicense(license.key, cleanedHWID, ipAddress, userAgent, productSlug);
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
    const cleanedKey = key.trim();
    const cleanedHWID = hwid.trim();

    if (!cleanedHWID) {
      throw new AppError("INVALID_HWID", "Device hardware identifier is required.", 400);
    }

    // Blacklist check for HWID
    const hwidBlacklisted = await prisma.blacklist.findFirst({
      where: { type: "HWID", value: cleanedHWID },
    });
    if (hwidBlacklisted) {
      throw new ForbiddenError(
        "This hardware identifier (HWID) has been blacklisted from using Chiro UI.",
        "HWID_BLACKLISTED"
      );
    }

    // Exact key lookup, then uppercase/lowercase fallback
    let license = await prisma.license.findUnique({
      where: { key: cleanedKey },
      include: {
        product: true,
        devices: true,
      },
    });

    if (!license) {
      license = await prisma.license.findUnique({
        where: { key: cleanedKey.toUpperCase() },
        include: {
          product: true,
          devices: true,
        },
      });
    }

    if (!license) {
      license = await prisma.license.findUnique({
        where: { key: cleanedKey.toLowerCase() },
        include: {
          product: true,
          devices: true,
        },
      });
    }

    if (!license) {
      throw new AppError("INVALID_LICENSE", "The license key is invalid.", 404);
    }

    // Check product slug match if specified
    // Lifetime keys (expiresAt === null) enjoy universal VIP access across all products!
    if (
      productSlug &&
      license.product &&
      license.expiresAt !== null &&
      license.product.slug.toLowerCase() !== productSlug.toLowerCase()
    ) {
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

  /**
   * Redeems a store purchase voucher code (e.g. CHIRO-RA3H-RUEY-ESKF)
   * into a high-security random script key (e.g. CHIRO_7d672a9d2743ddd3b50c2710)
   */
  public static async redeemVoucher(
    voucherCode: string,
    redeemerInfo?: {
      telegramId?: string | number;
      telegramUsername?: string;
      discordId?: string | number;
      discordTag?: string;
      ipAddress?: string;
    }
  ) {
    const cleanedCode = voucherCode.trim();
    if (!cleanedCode) {
      throw new AppError("INVALID_CODE", "Please provide a valid voucher code.", 400);
    }

    // Look up the purchase license by voucher code using exact unique index
    const upperCode = cleanedCode.toUpperCase();
    let license = await prisma.license.findUnique({
      where: { key: upperCode },
      include: { product: true },
    });

    if (!license) {
      license = await prisma.license.findUnique({
        where: { key: cleanedCode },
        include: { product: true },
      });
    }

    if (!license) {
      throw new NotFoundError(
        "Voucher code not found. Please verify your purchase receipt or key.",
        "VOUCHER_NOT_FOUND"
      );
    }

    if (license.status === LicenseStatus.REVOKED) {
      throw new ForbiddenError("This license voucher has been revoked.", "VOUCHER_REVOKED");
    }

    if (license.status === LicenseStatus.EXPIRED) {
      throw new ForbiddenError("This license voucher has already expired.", "VOUCHER_EXPIRED");
    }

    // Check if this key was already redeemed into a secure key
    if (license.key.includes("_") && license.note && license.note.includes("Redeemed from")) {
      throw new ForbiddenError("This purchase key has already been redeemed.", "ALREADY_REDEEMED");
    }

    // Generate the high-security random key (CHIRO_7d672a9d2743ddd3b50c2710)
    let newSecureKey = this.generateSecureKey("CHIRO");
    while (await prisma.license.findUnique({ where: { key: newSecureKey } })) {
      newSecureKey = this.generateSecureKey("CHIRO");
    }

    const tgName = redeemerInfo?.telegramUsername ? `@${redeemerInfo.telegramUsername}` : "";
    const tgId = redeemerInfo?.telegramId ? `ID:${redeemerInfo.telegramId}` : "";
    const discName = redeemerInfo?.discordTag ? `${redeemerInfo.discordTag}` : "";
    const discId = redeemerInfo?.discordId ? `DISCORD_ID:${redeemerInfo.discordId}` : "";
    const redeemerStr = [tgName, tgId, discName, discId].filter(Boolean).join(" ");

    // Start duration countdown from moment of redemption
    let newExpiresAt = license.expiresAt;
    if (license.product?.defaultDurationDays) {
      newExpiresAt = new Date(Date.now() + license.product.defaultDurationDays * 24 * 60 * 60 * 1000);
    } else if (license.expiresAt) {
      const durationMs = license.expiresAt.getTime() - license.createdAt.getTime();
      const safeDurationMs = durationMs > 0 ? durationMs : 24 * 60 * 60 * 1000;
      newExpiresAt = new Date(Date.now() + safeDurationMs);
    }

    const updatedLicense = await prisma.license.update({
      where: { id: license.id },
      data: {
        key: newSecureKey,
        expiresAt: newExpiresAt,
        customerName: redeemerStr || license.customerName || "Customer",
        customerDiscord: redeemerInfo?.discordId ? String(redeemerInfo.discordId) : license.customerDiscord,
        note: `Redeemed from voucher: ${license.key} | Redeemed at: ${new Date().toISOString()}${redeemerStr ? ` by ${redeemerStr}` : ""}`,
      },
      include: {
        product: true,
      },
    });


    await AuditService.log({
      action: "VOUCHER_REDEEMED",
      targetType: "License",
      targetId: updatedLicense.id,
      ipAddress: redeemerInfo?.ipAddress,
      details: {
        originalVoucher: license.key,
        newSecureKey: updatedLicense.key,
        product: updatedLicense.product.name,
        redeemedBy: redeemerStr,
      },
    });

    return {
      redeemed: true,
      originalVoucher: license.key,
      key: updatedLicense.key,
      product: {
        id: updatedLicense.product.id,
        name: updatedLicense.product.name,
        slug: updatedLicense.product.slug,
      },
      durationDays: updatedLicense.product.defaultDurationDays,
      maxDevices: updatedLicense.maxDevices,
      expiresAt: updatedLicense.expiresAt,
    };
  }
}
