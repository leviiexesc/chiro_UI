import React, { useEffect, useState } from 'react';
import { 
  Key, 
  CheckCircle, 
  AlertOctagon, 
  Cpu, 
  Package, 
  Activity, 
  Plus, 
  Layers, 
  ArrowUpRight, 
  Clock, 
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { OverviewStats } from '../types';
import { api, getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';

interface OverviewProps {
  onNavigate: (tab: string) => void;
  onOpenGenerate: () => void;
  onOpenBatch: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  onNavigate,
  onOpenGenerate,
  onOpenBatch,
}) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOverviewStats();
      setStats(data);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error('Failed to load metrics', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        <p className="text-sm text-gray-500 font-mono">Telemetry syncing...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center rounded-2xl glass-panel border border-rose-500/20 max-w-lg mx-auto mt-12">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Unable to fetch dashboard metrics</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5">{error || 'Server error'}</p>
        <button
          onClick={loadStats}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-400 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Licenses',
      value: stats.totalLicenses,
      icon: Key,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      label: 'Active Licenses',
      value: stats.activeLicenses,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Revoked / Expired',
      value: stats.revokedLicenses + stats.expiredLicenses,
      icon: AlertOctagon,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: 'Active Devices (24h)',
      value: stats.activeDevices24h,
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      label: 'Total Bound HWIDs',
      value: stats.totalDevices,
      icon: Cpu,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Products Managed',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            System Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time telemetry, license allocations, and verification activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGenerate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> New License
          </button>
          <button
            onClick={onOpenBatch}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] hover:bg-gray-200 dark:hover:bg-[#1f2b4a] text-gray-800 dark:text-gray-200 text-sm font-semibold border border-gray-300 dark:border-cyan-500/20 transition-all active:scale-95"
          >
            <Layers className="w-4 h-4 text-cyan-400" /> Batch Generate
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border glass-panel cyber-card flex items-center justify-between ${card.bg}`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {card.label}
                </p>
                <p className="text-2xl font-black mt-1 font-mono text-gray-900 dark:text-white">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-white/40 dark:bg-black/20 ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2 Column Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Breakdown */}
        <div className="lg:col-span-1 rounded-2xl glass-panel p-6 border border-gray-200 dark:border-cyan-500/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Product Distribution
            </h3>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1 font-mono"
            >
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats.productDistribution.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No products configured yet.</p>
            ) : (
              stats.productDistribution.map((item, i) => {
                const pct = stats.totalLicenses > 0 ? Math.round((item.count / stats.totalLicenses) * 100) : 0;
                return (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-[#161f36]/60 border border-gray-100 dark:border-cyan-500/10">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</span>
                      <span className="font-mono text-cyan-400 font-bold">{item.count} keys ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Audit Trail */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-6 border border-gray-200 dark:border-cyan-500/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Recent System Activity
            </h3>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1 font-mono"
            >
              View Full Audit <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stats.recentAuditLogs.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">No audit logs recorded yet.</p>
            ) : (
              stats.recentAuditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#161f36] text-cyan-400 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 dark:text-cyan-400">
                          {log.action}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          by <span className="font-semibold text-gray-700 dark:text-gray-300">{log.admin?.username || 'SYSTEM'}</span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-mono">
                        Target: {log.targetType} {log.targetId ? `(#${log.targetId.substring(0, 8)})` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
