export type LicenseStatus = 'UNUSED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'SUSPENDED';
export type AdminRole = 'SUPERADMIN' | 'ADMIN' | 'SUPPORT';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  defaultMaxDevices: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    licenses: number;
  };
}

export interface Device {
  id: string;
  licenseId: string;
  hwid: string;
  deviceName: string | null;
  ipAddress: string | null;
  lastSeenAt: string;
  createdAt: string;
  license?: {
    id: string;
    key: string;
    status: LicenseStatus;
    product: {
      name: string;
    };
  };
}

export interface License {
  id: string;
  key: string;
  productId: string;
  status: LicenseStatus;
  maxDevices: number;
  hwidLock: boolean;
  expiresAt: string | null;
  note: string | null;
  customerEmail: string | null;
  customerDiscord: string | null;
  customerName: string | null;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  devices?: Device[];
  _count?: {
    devices: number;
  };
}

export interface AuditLog {
  id: string;
  adminId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin?: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface OverviewStats {
  totalLicenses: number;
  activeLicenses: number;
  revokedLicenses: number;
  expiredLicenses: number;
  totalDevices: number;
  activeDevices24h: number;
  totalProducts: number;
  recentAuditLogs: AuditLog[];
  productDistribution: {
    name: string;
    count: number;
  }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
