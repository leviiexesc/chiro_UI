import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, RefreshCw, Users, Gamepad2, Cpu, Clock, AlertCircle, Globe
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsData, AnalyticsGameEntry, AnalyticsExecutorEntry } from '../types';

// ─── Colour palettes ────────────────────────────────────────────────────────
const GAME_COLORS = [
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#ef4444', '#f97316', '#84cc16', '#a78bfa',
];
const EXEC_COLORS = [
  '#22d3ee', '#818cf8', '#fb923c', '#34d399', '#f472b6',
  '#facc15', '#60a5fa', '#c084fc', '#4ade80', '#f87171',
];

// ─── SVG Donut Chart ────────────────────────────────────────────────────────
interface DonutProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}
const DonutChart: React.FC<DonutProps> = ({ data, size = 140, thickness = 28 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={(size - thickness) / 2}
          fill="none" stroke="#1e293b" strokeWidth={thickness} />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
          fill="#4b5563" fontSize={size * 0.12}>No data</text>
      </svg>
    );
  }

  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#1e293b" strokeWidth={thickness} />
      {data.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
};

// ─── Duration formatter ──────────────────────────────────────────────────────
function fmtDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalytics();
      setData(res);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const iv = setInterval(load, 30_000);
    return () => clearInterval(iv);
  }, [load]);

  // Build donut data arrays
  const gameDonut = (data?.gameBreakdown ?? []).map((g, i) => ({
    label: g.name,
    value: g.count,
    color: GAME_COLORS[i % GAME_COLORS.length],
  }));
  const execDonut = (data?.executorBreakdown ?? []).map((e, i) => ({
    label: e.executor,
    value: e.count,
    color: EXEC_COLORS[i % EXEC_COLORS.length],
  }));

  const totalGames = gameDonut.reduce((s, d) => s + d.value, 0);
  const totalExecs = execDonut.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-cyan-400" />
            Live Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time player activity · auto-refreshes every 30s
            {lastUpdated && (
              <span className="ml-2 font-mono text-xs text-gray-400">
                (updated {lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* ── Live Players Card ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-[#0d121f] border border-gray-200 dark:border-cyan-500/20 p-6 flex items-center gap-6 shadow-sm">
        <div className="relative flex-shrink-0">
          {/* Pulsing ring */}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-ping" />
          </span>
          <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
            <Users className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <div>
          <p className="text-4xl font-extrabold font-mono text-emerald-400 tabular-nums">
            {loading ? '...' : (data?.liveCount ?? 0)}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Players currently in-game
          </p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Sessions expire after 12 min of inactivity
          </p>
        </div>
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Game Breakdown */}
        <div className="rounded-2xl bg-white dark:bg-[#0d121f] border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <Gamepad2 className="w-5 h-5 text-blue-400" />
            Top Games
          </h2>
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
          ) : gameDonut.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No sessions yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <DonutChart data={gameDonut} />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {gameDonut.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1">{g.label}</span>
                    <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                      {g.value} ({totalGames > 0 ? Math.round((g.value / totalGames) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Executor Breakdown */}
        <div className="rounded-2xl bg-white dark:bg-[#0d121f] border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
            <Cpu className="w-5 h-5 text-purple-400" />
            Executor Breakdown
          </h2>
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>
          ) : execDonut.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No sessions yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <DonutChart data={execDonut} size={140} thickness={28} />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {execDonut.map((e, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1">{e.label}</span>
                    <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                      {e.value} ({totalExecs > 0 ? Math.round((e.value / totalExecs) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Session Log Table ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-[#0d121f] border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            Live Session Log
          </h2>
          <span className="text-xs font-mono text-gray-400">
            {data?.sessionLog.length ?? 0} active session{(data?.sessionLog.length ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading sessions...</div>
        ) : !data?.sessionLog.length ? (
          <div className="py-20 text-center">
            <Users className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No active sessions right now</p>
            <p className="text-gray-500 text-xs mt-1">Sessions appear when players run the loader script</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-black/20">
                  {['Player', 'Game', 'Executor', 'Country', 'Duration', 'Last Ping'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.sessionLog.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {s.robloxUser}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-[180px] truncate">
                      {s.gameName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {s.executor}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {s.country === '—' || !s.country ? '—' : s.country}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-mono">
                        <Clock className="w-3 h-3" />
                        {fmtDuration(s.durationSeconds)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono whitespace-nowrap">
                      {new Date(s.lastPingAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
