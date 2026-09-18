import { prisma } from "../prisma.js";

export interface LogActionParams {
  adminId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  ipAddress?: string;
  details?: Record<string, any> | string;
}

export class AuditService {
  public static async log(params: LogActionParams) {
    try {
      const detailsStr =
        typeof params.details === "object"
          ? JSON.stringify(params.details)
          : params.details;

      return await prisma.auditLog.create({
        data: {
          adminId: params.adminId,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          ipAddress: params.ipAddress,
          details: detailsStr,
        },
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
      // Audit log failures should not crash requests
      return null;
    }
  }
}
