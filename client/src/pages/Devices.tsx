import React, { useState, useEffect, useCallback } from 'react';
import { Cpu, Search, Trash2, Loader2, AlertCircle, ChevronLeft, ChevronRight, Clock, Globe } from 'lucide-react';
import { Device } from '../types';
import { api, getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';

interface DevicesProps {
  initialSearch?: string;
}

export const Devices: React.FC<DevicesProps> = ({ initialSearch = '' }) => {
  const toast = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDevices({
        page,
        limit: 10,
        search: search.trim() || undefined,
      });
      setDevices(res.devices);
      if (res.pagination) {
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      toast.error('Failed to load devices', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleUnbind = async (device: Device) => {
    if (!confirm(`Unbind HWID ${device.hwid.substring(0, 16)}... from license?`)) return;
    try {
      await api.unbindDevice(device.id);
      toast.success('Device Unbound', 'Hardware slot has been freed.');
      loadDevices();
    } catch (err) {
      toast.error('Unbind Failed', getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Registered Devices & Hardware IDs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Active Roblox executors and client sessions bound to cryptographic licenses
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-panel p-4 rounded-2xl flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by HWID hash, device identifier, or IP address..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#111726] border border-transparent focus:border-cyan-500/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Devices table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-gray-200 dark:border-cyan-500/15">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            <span className="text-sm font-mono">Scanning registered nodes...</span>
          </div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <AlertCircle className="w-10 h-10 mx-auto text-gray-500 mb-2" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">No hardware devices registered</p>
            <p className="text-xs text-gray-500 mt-1">Devices will appear here once activated through Chiro UI Luau scripts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="py-3.5 px-4">Hardware Identifier (HWID)</th>
                  <th className="py-3.5 px-4">Device Name</th>
                  <th className="py-3.5 px-4">Bound License Key</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4">Last Seen</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-xs">
                {devices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-cyan-500/[0.02] dark:hover:bg-cyan-500/[0.04] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-cyan-300">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span className="truncate max-w-xs">{dev.hwid}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-gray-600 dark:text-gray-300">
                      {dev.deviceName || 'Roblox Client'}
                    </td>

                    <td className="py-3.5 px-4 text-cyan-400 font-semibold">
                      {dev.license?.key || 'Unlinked'}
                    </td>

                    <td className="py-3.5 px-4 font-sans text-gray-500">
                      {dev.license?.product?.name || 'Chiro UI Pro'}
                    </td>

                    <td className="py-3.5 px-4 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                        <span>{dev.ipAddress || 'Internal/Private'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(dev.lastSeenAt).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleUnbind(dev)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Unbind Device"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
