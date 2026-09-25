import axios, { AxiosError } from 'axios';
import { ApiResponse, OverviewStats, License, Product, Device, AuditLog, AdminUser } from '../types';

const API_BASE = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token
apiClient.interceptors.request.use((config: import('axios').InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('chiro_admin_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle unauthorized / standardized error responses
apiClient.interceptors.response.use(
  (response: import('axios').AxiosResponse) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      // Clear token if unauthorized on private routes
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('chiro_admin_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected network error occurred.';
}

export const api = {
  // Auth
  async login(credentials: { usernameOrEmail: string; password: string }): Promise<{ token: string; admin: AdminUser }> {
    const res = await apiClient.post<ApiResponse<{ token: string; admin: AdminUser }>>('/auth/login', credentials);
    return res.data.data!;
  },

  async getMe(): Promise<AdminUser> {
    const res = await apiClient.get<ApiResponse<{ admin: AdminUser }>>('/auth/me');
    return res.data.data!.admin;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await apiClient.post<ApiResponse>('/auth/change-password', data);
  },

  // Stats
  async getOverviewStats(): Promise<OverviewStats> {
    const res = await apiClient.get<ApiResponse<OverviewStats>>('/licenses/stats/overview');
    return res.data.data!;
  },

  // Licenses
  async getLicenses(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    productId?: string;
    redeemStatus?: string;
  } = {}): Promise<{ licenses: License[]; pagination: ApiResponse['pagination'] }> {
    const res = await apiClient.get<ApiResponse<License[]>>('/licenses', { params });
    return { licenses: res.data.data || [], pagination: res.data.pagination };
  },

  async getLicense(id: string): Promise<License> {
    const res = await apiClient.get<ApiResponse<License>>(`/licenses/${id}`);
    return res.data.data!;
  },

  async createLicense(data: {
    productId: string;
    maxDevices?: number;
    hwidLock?: boolean;
    expiresAt?: string | null;
    note?: string;
    customerEmail?: string;
    customerDiscord?: string;
    customerName?: string;
  }): Promise<License> {
    const res = await apiClient.post<ApiResponse<License>>('/licenses', data);
    return res.data.data!;
  },

  async batchGenerate(data: {
    productId: string;
    count: number;
    maxDevices?: number;
    hwidLock?: boolean;
    expiresAt?: string | null;
    note?: string;
  }): Promise<{ count: number; licenses: License[] }> {
    const res = await apiClient.post<ApiResponse<{ count: number; licenses: License[] }>>('/licenses/batch', data);
    return res.data.data!;
  },

  async updateLicense(id: string, data: Partial<License>): Promise<License> {
    const res = await apiClient.patch<ApiResponse<License>>(`/licenses/${id}`, data);
    return res.data.data!;
  },

  async deleteLicense(id: string): Promise<void> {
    await apiClient.delete<ApiResponse>(`/licenses/${id}`);
  },

  async resetHwid(id: string): Promise<{ unlinkedCount: number }> {
    const res = await apiClient.post<ApiResponse<{ unlinkedCount: number }>>(`/licenses/${id}/reset-hwid`);
    return res.data.data!;
  },

  async revokeLicense(id: string, reason?: string): Promise<License> {
    const res = await apiClient.post<ApiResponse<License>>(`/licenses/${id}/revoke`, { reason });
    return res.data.data!;
  },

  async unrevokeLicense(id: string): Promise<License> {
    const res = await apiClient.post<ApiResponse<License>>(`/licenses/${id}/unrevoke`);
    return res.data.data!;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await apiClient.get<ApiResponse<Product[]>>('/products');
    return res.data.data || [];
  },

  async createProduct(data: {
    name: string;
    description?: string;
    defaultMaxDevices?: number;
  }): Promise<Product> {
    const res = await apiClient.post<ApiResponse<Product>>('/products', data);
    return res.data.data!;
  },

  async updateProduct(id: string, data: {
    name?: string;
    description?: string;
    defaultMaxDevices?: number;
    isActive?: boolean;
  }): Promise<Product> {
    const res = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, data);
    return res.data.data!;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete<ApiResponse>(`/products/${id}`);
  },

  // Devices
  async getDevices(params: {
    page?: number;
    limit?: number;
    search?: string;
    licenseId?: string;
  } = {}): Promise<{ devices: Device[]; pagination: ApiResponse['pagination'] }> {
    const res = await apiClient.get<ApiResponse<Device[]>>('/devices', { params });
    return { devices: res.data.data || [], pagination: res.data.pagination };
  },

  async unbindDevice(id: string): Promise<void> {
    await apiClient.delete<ApiResponse>(`/devices/${id}`);
  },

  // Audit Logs
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    search?: string;
  } = {}): Promise<{ logs: AuditLog[]; pagination: ApiResponse['pagination'] }> {
    const res = await apiClient.get<ApiResponse<AuditLog[]>>('/audit-logs', { params });
    return { logs: res.data.data || [], pagination: res.data.pagination };
  },
};
