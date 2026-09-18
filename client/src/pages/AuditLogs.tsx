import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
} from 'lucide-react';
import { AuditLog } from '../types';
import { api, getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';

const ACTION_COLORS: Record<string, string> = {
  LICENSE_CREATED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LICENSE_REVOKED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  LICENSE_UNREVOKED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  LICENSE_DELETED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  HWID_RESET: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  LICENSE_VERIFIED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  LICENSE_ACTIVATED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ADMIN_LOGIN: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  ADMIN_LOGOUT: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const ACTIONS = [
  '', 'LICENSE_CREATED', 'LICENSE_REVOKED', 'LICENSE_UNREVOKED', 'LICENSE_DELETED',
  'HWID_RESET', 'LICENSE_VERIFIED', 'LICENSE_ACTIVATED', 'ADMIN_LOGIN', 'ADMIN_LOGOUT',
  'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'DEVICE_UNBOUND', 'PASSWORD_CHANGED',
  'BATCH_GENERATED',
];

export const AuditLogs: React.FC = () => {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        page,
        limit: 15,
        search: search.trim() || undefined,
        action: actionFilter || undefined,
      });
      setLogs(res.logs);
      if (res.pagination) {
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      toast.error('Failed to load audit logs', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Audit & Activity Logs
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Immutable record of every administrative and client-side operation
        </p>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by target ID, action, admin user..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#111726] border border-transparent focus:border-cyan-500/50 focus:outline-none"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#111726] border border-transparent focus:border-cyan-500/50 focus:outline-none text-gray-700 dark:text-gray-200"
        >
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a || 'All Actions'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-gray-200 dark:border-cyan-500/15">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            <span className="text-sm font-mono text-gray-400">Retrieving secure audit trail...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <AlertCircle className="w-10 h-10 mx-auto text-gray-500 mb-2" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">No audit records match your query</p>
            <p className="text-xs text-gray-500 mt-1">Adjust filters or wait for new system events.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log) => {
              const colorClass = ACTION_COLORS[log.action] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
              return (
                <div key={log.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-cyan-500/[0.03] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-[#161f36] text-cyan-400 mt-0.5 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex text-xs font-bold font-mono px-2.5 py-0.5 rounded-full border ${colorClass}`}>
                          {log.action}
                        </span>
                        {log.admin && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{log.admin.username}</span>
                            <span className="text-gray-400">({log.admin.role ?? 'SYSTEM'})</span>
                          </span>
                        )}
                        {!log.admin && (
                          <span className="text-xs text-gray-400 font-mono">via SYSTEM / Luau</span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        Target: <span className="text-gray-700 dark:text-gray-300">{log.targetType}</span>
                        {log.targetId && (
                          <span className="text-gray-400"> · ID: {log.targetId.substring(0, 12)}...</span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-[11px] font-mono text-gray-500 bg-gray-50 dark:bg-gray-900/40 p-2 rounded-lg border border-gray-200 dark:border-gray-800 mt-1">
                          {JSON.stringify(log.details, null, 0).substring(0, 120)}
                          {JSON.stringify(log.details).length > 120 && '...'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    {log.ipAddress && (
                      <span className="text-[11px] font-mono text-gray-500">{log.ipAddress}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <span>Page {page} of {totalPages}</span>
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
