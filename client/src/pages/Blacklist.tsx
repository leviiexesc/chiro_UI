import React, { useState, useEffect, useCallback } from 'react';
import { ShieldBan, Plus, Trash2, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { BlacklistEntry } from '../types';

export const Blacklist: React.FC = () => {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'DISCORD', value: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchBlacklist({ type: typeFilter || undefined, search: search || undefined });
      setEntries(data);
    } catch (e: any) {
      setError(e.response?.data?.error?.message || e.message || 'Failed to load blacklist');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.value.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.addBlacklist({ type: form.type, value: form.value.trim(), reason: form.reason || undefined });
      setForm({ type: 'DISCORD', value: '', reason: '' });
      setShowAdd(false);
      load();
    } catch (e: any) {
      setError(e.response?.data?.error?.message || e.message || 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    try {
      await api.removeBlacklist(id);
      load();
    } catch (e: any) {
      setError(e.response?.data?.error?.message || e.message || 'Failed to remove entry');
    } finally {
      setDeleteId(null);
    }
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      DISCORD: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      TELEGRAM: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      HWID: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${styles[type] || 'bg-gray-500/15 text-gray-400'}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldBan className="w-6 h-6 text-red-400" />
            Blacklist
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ban accounts from claiming free keys by Discord ID, Telegram ID, or HWID.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Ban
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Add Form Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0d121f] rounded-2xl border border-gray-200 dark:border-cyan-500/20 shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add to Blacklist</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                >
                  <option value="DISCORD">Discord ID</option>
                  <option value="TELEGRAM">Telegram ID</option>
                  <option value="HWID">HWID</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {form.type === 'HWID' ? 'HWID Value' : `${form.type === 'DISCORD' ? 'Discord' : 'Telegram'} User ID`}
                </label>
                <input
                  type="text"
                  value={form.value}
                  onChange={e => setForm({ ...form, value: e.target.value })}
                  placeholder={form.type === 'HWID' ? 'e.g. ABC123...' : 'e.g. 123456789'}
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Abusing free keys"
                  className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Banning...' : 'Ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID or HWID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#0d121f] border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#0d121f] border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
        >
          <option value="">All Types</option>
          <option value="DISCORD">Discord</option>
          <option value="TELEGRAM">Telegram</option>
          <option value="HWID">HWID</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-[#0d121f]">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center">
            <ShieldBan className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No blacklisted entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-black/20">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Banned By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">{typeBadge(entry.type)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{entry.value}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {entry.reason || <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.bannedBy || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleteId === entry.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleteId === entry.id ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <p className="text-xs text-gray-400 font-mono">{entries.length} entries in blacklist</p>
    </div>
  );
};
