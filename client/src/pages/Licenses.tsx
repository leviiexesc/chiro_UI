import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Copy, 
  Check, 
  RotateCcw, 
  Ban, 
  CheckCircle, 
  Trash2, 
  Layers, 
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { License, Product, LicenseStatus } from '../types';
import { api, getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';

interface LicensesProps {
  initialSearch?: string;
  createModalOpen?: boolean;
  onCloseCreateModal?: () => void;
  batchModalOpen?: boolean;
  onCloseBatchModal?: () => void;
}

export const Licenses: React.FC<LicensesProps> = ({
  initialSearch = '',
  createModalOpen = false,
  onCloseCreateModal,
  batchModalOpen = false,
  onCloseBatchModal,
}) => {
  const toast = useToast();

  const [licenses, setLicenses] = useState<License[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [productFilter, setProductFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(createModalOpen);
  const [showBatchModal, setShowBatchModal] = useState(batchModalOpen);
  const [batchResults, setBatchResults] = useState<string[] | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    productId: '',
    maxDevices: 1,
    hwidLock: true,
    expiresAt: '',
    note: '',
    customerEmail: '',
    customerDiscord: '',
    customerName: '',
  });

  const [batchFormData, setBatchFormData] = useState({
    productId: '',
    count: 5,
    maxDevices: 1,
    hwidLock: true,
    expiresAt: '',
    note: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setShowCreateModal(createModalOpen);
  }, [createModalOpen]);

  useEffect(() => {
    setShowBatchModal(batchModalOpen);
  }, [batchModalOpen]);

  const loadProducts = async () => {
    try {
      const list = await api.getProducts();
      setProducts(list);
      if (list.length > 0 && !formData.productId) {
        setFormData((prev) => ({ ...prev, productId: list[0].id }));
        setBatchFormData((prev) => ({ ...prev, productId: list[0].id }));
      }
    } catch {
      // ignore
    }
  };

  const loadLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getLicenses({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        productId: productFilter || undefined,
      });
      setLicenses(res.licenses);
      if (res.pagination) {
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      toast.error('Failed to load licenses', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, productFilter, toast]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    toast.success('Copied to clipboard', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleResetHwid = async (id: string, key: string) => {
    if (!confirm(`Are you sure you want to reset all bound devices for license ${key}?`)) return;
    try {
      const res = await api.resetHwid(id);
      toast.success('HWID Reset Successful', `Unlinked ${res.unlinkedCount} device(s)`);
      loadLicenses();
    } catch (err) {
      toast.error('Reset Failed', getErrorMessage(err));
    }
  };

  const handleToggleRevoke = async (lic: License) => {
    try {
      if (lic.status === 'REVOKED') {
        await api.unrevokeLicense(lic.id);
        toast.success('License Restored', `Key ${lic.key} is now active.`);
      } else {
        const reason = prompt('Enter revocation reason (optional):');
        await api.revokeLicense(lic.id, reason || undefined);
        toast.warning('License Revoked', `Key ${lic.key} was revoked.`);
      }
      loadLicenses();
    } catch (err) {
      toast.error('Action Failed', getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string, key: string) => {
    if (!confirm(`Permanently delete license ${key}? This cannot be undone.`)) return;
    try {
      await api.deleteLicense(id);
      toast.success('Deleted', `License ${key} removed.`);
      loadLicenses();
    } catch (err) {
      toast.error('Delete Failed', getErrorMessage(err));
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) {
      toast.error('Product required', 'Please select a product.');
      return;
    }

    setSubmitting(true);
    try {
      // If expiresAt already contains 'T' it's a full ISO string (set by a preset button),
      // otherwise it's a plain YYYY-MM-DD from the date picker — parse as local midnight.
      const expiresAtISO = formData.expiresAt
        ? formData.expiresAt.includes('T')
          ? formData.expiresAt
          : new Date(formData.expiresAt + 'T23:59:59').toISOString()
        : null;

      const created = await api.createLicense({
        productId: formData.productId,
        maxDevices: Number(formData.maxDevices),
        hwidLock: formData.hwidLock,
        expiresAt: expiresAtISO,
        note: formData.note || undefined,
        customerEmail: formData.customerEmail || undefined,
        customerDiscord: formData.customerDiscord || undefined,
        customerName: formData.customerName || undefined,
      });

      toast.success('License Generated', created.key);
      setShowCreateModal(false);
      onCloseCreateModal?.();
      loadLicenses();
    } catch (err) {
      toast.error('Creation Failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchFormData.productId) {
      toast.error('Product required', 'Please select a product.');
      return;
    }

    setSubmitting(true);
    try {
      const batchExpiresAtISO = batchFormData.expiresAt
        ? batchFormData.expiresAt.includes('T')
          ? batchFormData.expiresAt
          : new Date(batchFormData.expiresAt + 'T23:59:59').toISOString()
        : null;

      const res = await api.batchGenerate({
        productId: batchFormData.productId,
        count: Number(batchFormData.count),
        maxDevices: Number(batchFormData.maxDevices),
        hwidLock: batchFormData.hwidLock,
        expiresAt: batchExpiresAtISO,
        note: batchFormData.note || undefined,
      });

      toast.success('Batch Generated', `Generated ${res.count} license keys.`);
      setBatchResults(res.licenses.map((l) => l.key));
      loadLicenses();
    } catch (err) {
      toast.error('Batch Failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            License Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Provision, monitor, lock, and revoke cryptographic product licenses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Generate Single
          </button>
          <button
            onClick={() => {
              setBatchResults(null);
              setShowBatchModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] hover:bg-gray-200 dark:hover:bg-[#1f2b4a] text-gray-800 dark:text-gray-200 text-sm font-semibold border border-gray-300 dark:border-cyan-500/20 transition-all active:scale-95"
          >
            <Layers className="w-4 h-4 text-cyan-400" /> Batch Generate
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search key, email, discord, customer note..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#111726] border border-transparent focus:border-cyan-500/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#111726] border border-transparent focus:border-cyan-500/50 focus:outline-none text-gray-700 dark:text-gray-200"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="REVOKED">Revoked</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#111726] border border-transparent focus:border-cyan-500/50 focus:outline-none text-gray-700 dark:text-gray-200"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table / List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-gray-200 dark:border-cyan-500/15">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            <span className="text-sm font-mono">Loading licenses...</span>
          </div>
        ) : licenses.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <AlertCircle className="w-10 h-10 mx-auto text-gray-500 mb-2" />
            <p className="font-semibold text-gray-700 dark:text-gray-300">No licenses found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or create a new license above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="py-3.5 px-4">License Key</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Devices / HWID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Expires</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {licenses.map((lic) => {
                  const deviceCount = lic._count?.devices ?? lic.devices?.length ?? 0;
                  return (
                    <tr
                      key={lic.id}
                      className="hover:bg-cyan-500/[0.02] dark:hover:bg-cyan-500/[0.04] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-mono font-medium text-gray-900 dark:text-cyan-300">
                          <span>{lic.key}</span>
                          <button
                            onClick={() => handleCopy(lic.key)}
                            className="p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                            title="Copy License Key"
                          >
                            {copiedKey === lic.key ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {lic.note && (
                          <div className="text-[11px] mt-0.5 text-amber-400 font-sans font-medium truncate max-w-[180px]" title={lic.note}>
                            🏷 {lic.note}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {lic.product?.name || 'Unknown Product'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            lic.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20'
                              : lic.status === 'REVOKED'
                              ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              lic.status === 'ACTIVE'
                                ? 'bg-emerald-400'
                                : lic.status === 'REVOKED'
                                ? 'bg-rose-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          {lic.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              deviceCount >= lic.maxDevices
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }`}
                          >
                            {deviceCount} / {lic.maxDevices}
                          </span>
                          {lic.hwidLock ? (
                            <span title="HWID Lock Enabled" className="text-cyan-400">
                              <Lock className="w-3.5 h-3.5 inline" />
                            </span>
                          ) : (
                            <span title="No HWID Lock" className="text-gray-500">
                              <Unlock className="w-3.5 h-3.5 inline" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {lic.customerDiscord || lic.customerEmail || lic.customerName ? (
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              {lic.customerDiscord || lic.customerName}
                            </div>
                            {lic.customerEmail && (
                              <div className="text-gray-400 text-[11px]">{lic.customerEmail}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-gray-500 dark:text-gray-400">
                        {lic.expiresAt ? (
                          <div>
                            <div>{new Date(lic.expiresAt).toLocaleDateString()}</div>
                            <div className="text-[11px] text-gray-400">{new Date(lic.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ) : 'Lifetime'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleResetHwid(lic.id, lic.key)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            title="Reset Bound HWIDs"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleRevoke(lic)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              lic.status === 'REVOKED'
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-rose-400 hover:bg-rose-500/10'
                            }`}
                            title={lic.status === 'REVOKED' ? 'Unrevoke License' : 'Revoke License'}
                          >
                            {lic.status === 'REVOKED' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(lic.id, lic.key)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete License"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Modal: Create Single License */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          onCloseCreateModal?.();
        }}
        title="Generate New License Key"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Product
            </label>
            <select
              required
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Max Devices (HWID)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxDevices}
                onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Duration
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { label: '1 Min', ms: 60_000 },
                  { label: '1 Day', ms: 86_400_000 },
                  { label: '7 Days', ms: 7 * 86_400_000 },
                  { label: '30 Days', ms: 30 * 86_400_000 },
                  { label: 'Lifetime', ms: 0 },
                ].map(({ label, ms }) => {
                  const val = ms === 0 ? '' : new Date(Date.now() + ms).toISOString();
                  const active = ms === 0
                    ? formData.expiresAt === ''
                    : formData.expiresAt.startsWith(val.substring(0, 16));
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFormData({ ...formData, expiresAt: val })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        active
                          ? 'bg-cyan-500 border-cyan-500 text-white'
                          : 'bg-gray-100 dark:bg-[#161f36] border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-cyan-400'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <input
                type="date"
                value={formData.expiresAt ? formData.expiresAt.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
              />
              {formData.expiresAt && formData.expiresAt.includes('T') && (
                <p className="text-[11px] text-cyan-400 mt-1">
                  ⏱ Expires: {new Date(formData.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hwidLockCheck"
              checked={formData.hwidLock}
              onChange={(e) => setFormData({ ...formData, hwidLock: e.target.checked })}
              className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
            />
            <label htmlFor="hwidLockCheck" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enforce Strict Hardware ID (HWID) Locking
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Customer Discord / Handle
            </label>
            <input
              type="text"
              placeholder="@user or user#0000"
              value={formData.customerDiscord}
              onChange={(e) => setFormData({ ...formData, customerDiscord: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Customer Email
            </label>
            <input
              type="email"
              placeholder="customer@domain.com"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Key Label / Name
            </label>
            <input
              type="text"
              placeholder="e.g. Discord Giveaway, VIP Access, Tester #3"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                onCloseCreateModal?.();
              }}
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate Key
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Batch Generate */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setBatchResults(null);
          onCloseBatchModal?.();
        }}
        title="Batch Generate Licenses"
        maxWidth="lg"
      >
        {batchResults ? (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
              Successfully created {batchResults.length} license keys!
            </div>
            <textarea
              readOnly
              rows={8}
              value={batchResults.join('\n')}
              className="w-full p-3 font-mono text-xs rounded-xl bg-gray-900 text-cyan-300 border border-gray-700 focus:outline-none"
            />
            <div className="flex justify-between items-center">
              <button
                onClick={() => handleCopy(batchResults.join('\n'))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold"
              >
                <Copy className="w-4 h-4" /> Copy All Keys
              </button>
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchResults(null);
                  onCloseBatchModal?.();
                }}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-sm font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBatchSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Target Product
              </label>
              <select
                required
                value={batchFormData.productId}
                onChange={(e) => setBatchFormData({ ...batchFormData, productId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                  Quantity (1 - 500)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={batchFormData.count}
                  onChange={(e) => setBatchFormData({ ...batchFormData, count: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                  Max Devices Per Key
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={batchFormData.maxDevices}
                  onChange={(e) => setBatchFormData({ ...batchFormData, maxDevices: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Duration
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { label: '1 Min', ms: 60_000 },
                  { label: '1 Day', ms: 86_400_000 },
                  { label: '7 Days', ms: 7 * 86_400_000 },
                  { label: '30 Days', ms: 30 * 86_400_000 },
                  { label: 'Lifetime', ms: 0 },
                ].map(({ label, ms }) => {
                  const val = ms === 0 ? '' : new Date(Date.now() + ms).toISOString();
                  const active = ms === 0
                    ? batchFormData.expiresAt === ''
                    : batchFormData.expiresAt.startsWith(val.substring(0, 16));
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setBatchFormData({ ...batchFormData, expiresAt: val })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        active
                          ? 'bg-cyan-500 border-cyan-500 text-white'
                          : 'bg-gray-100 dark:bg-[#161f36] border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-cyan-400'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <input
                type="date"
                value={batchFormData.expiresAt ? batchFormData.expiresAt.split('T')[0] : ''}
                onChange={(e) => setBatchFormData({ ...batchFormData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
              />
              {batchFormData.expiresAt && batchFormData.expiresAt.includes('T') && (
                <p className="text-[11px] text-cyan-400 mt-1">
                  ⏱ Expires: {new Date(batchFormData.expiresAt).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                Batch Label / Name
              </label>
              <input
                type="text"
                placeholder="e.g. Discord Giveaway Batch, Tester Keys Oct"
                value={batchFormData.note}
                onChange={(e) => setBatchFormData({ ...batchFormData, note: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowBatchModal(false);
                  onCloseBatchModal?.();
                }}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate Batch
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
