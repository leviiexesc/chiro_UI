import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { api, getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';

export const Products: React.FC = () => {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultMaxDevices: 1,
    isActive: true,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load products', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      defaultMaxDevices: 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      defaultMaxDevices: product.defaultMaxDevices,
      isActive: product.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;
    try {
      await api.deleteProduct(product.id);
      toast.success('Product deleted', product.name);
      loadProducts();
    } catch (err) {
      toast.error('Delete failed', getErrorMessage(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: formData.name,
          description: formData.description || undefined,
          defaultMaxDevices: Number(formData.defaultMaxDevices),
          isActive: formData.isActive,
        });
        toast.success('Product updated', formData.name);
      } else {
        await api.createProduct({
          name: formData.name,
          description: formData.description || undefined,
          defaultMaxDevices: Number(formData.defaultMaxDevices),
        });
        toast.success('Product created', formData.name);
      }
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      toast.error('Operation failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Products & Packages
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define script packages and software suites mapped to license keys
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-md shadow-cyan-500/20 transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <span className="text-sm font-mono">Loading products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center text-gray-400 glass-panel rounded-2xl">
          <Package className="w-10 h-10 mx-auto text-gray-500 mb-2" />
          <p className="font-semibold text-gray-700 dark:text-gray-300">No products configured</p>
          <p className="text-xs text-gray-500 mt-1">Create your first product to start generating keys.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-2xl glass-panel cyber-card flex flex-col justify-between border border-gray-200 dark:border-cyan-500/15 relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      p.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{p.name}</h3>
                  <div className="font-mono text-xs text-cyan-500/80">slug: {p.slug}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {p.description || 'No description provided.'}
                  </p>
                </div>

                {/* Redeem Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Not Redeemed</span>
                    <p className="text-base font-bold text-amber-300 mt-0.5">{p.notRedeemedCount ?? 0}</p>
                    <span className="text-[10px] text-gray-500">Vouchers available</span>
                  </div>

                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Already Redeemed</span>
                    <p className="text-base font-bold text-emerald-300 mt-0.5">{p.redeemedCount ?? 0}</p>
                    <span className="text-[10px] text-gray-500">Active script keys</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  <span>Total: </span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {p.licenseCount ?? 0} Keys
                  </span>
                  <span className="mx-1.5 opacity-40">|</span>
                  <span>{p.defaultMaxDevices} HWID{p.defaultMaxDevices > 1 ? 's' : ''}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Create New Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Product Name
            </label>
            <input
              type="text"
              required
              placeholder="Chiro UI Pro Cyber"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Complete suite with cyber animations, RBX executor bridge, etc."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
              Default Max Bound Devices (HWID)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={formData.defaultMaxDevices}
              onChange={(e) => setFormData({ ...formData, defaultMaxDevices: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500 text-sm"
            />
          </div>

          {editingProduct && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveProduct"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
              />
              <label htmlFor="isActiveProduct" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Active
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
