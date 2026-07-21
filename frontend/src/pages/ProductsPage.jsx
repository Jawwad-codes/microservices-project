/** @format */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { productsApi } from "../api/client";
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  Loader2,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import clsx from "clsx";

/* ─── Product Card ─────────────────────────────────────────────────────────── */
function ProductCard({ product, onOrder, onEdit, onDelete, isAuth }) {
  return (
    <div className="card hover:border-border/80 transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
          <Package size={18} className="text-accent" />
        </div>
        <span
          className={clsx(
            "text-[10px] font-mono px-2 py-0.5 rounded-full border",
            product.stock > 0
              ? "text-up bg-up/10 border-up/20"
              : "text-down bg-down/10 border-down/20",
          )}
        >
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </span>
      </div>

      <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">
        {product.name}
      </h3>
      {product.description && (
        <p className="text-xs text-muted line-clamp-2 mb-3">
          {product.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
        <span className="text-accent font-bold text-base font-mono">
          Rs {Number(product.price).toLocaleString()}
        </span>
        <div className="flex items-center gap-1">
          {isAuth && product.stock > 0 && (
            <button
              onClick={() => onOrder(product)}
              className="btn-ghost text-xs py-1.5 px-3"
            >
              Order
            </button>
          )}
          {isAuth && (
            <>
              <button
                onClick={() => onEdit(product)}
                title="Edit product"
                className="btn-ghost p-1.5 text-muted hover:text-white"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDelete(product)}
                title="Delete product"
                className="btn-ghost p-1.5 text-muted hover:text-down"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-[9px] font-mono text-muted/50 mt-2 truncate">
        {product.id}
      </p>
    </div>
  );
}

/* ─── Add Product Modal ─────────────────────────────────────────────────────── */
function AddProductModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "0",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10) || 0,
      };
      const res = await productsApi.create(payload);
      onAdded(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="card w-full max-w-md relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Add New Product</h2>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Product Name *
            </label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Wireless Mouse"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Description
            </label>
            <textarea
              className="input resize-none h-20"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional description…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">
                Price (Rs) *
              </label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                placeholder="1500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Stock</label>
              <input
                className="input"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: e.target.value }))
                }
                placeholder="10"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-down bg-down/10 border border-down/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Adding…" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Edit Product Modal ─────────────────────────────────────────────────────── */
function EditProductModal({ product, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: product.name,
    description: product.description || "",
    price: String(product.price),
    stock: String(product.stock),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
      };
      const res = await productsApi.update(product.id, payload);
      onUpdated(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="card w-full max-w-md relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Edit Product</h2>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Product Name *
            </label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5">
              Description
            </label>
            <textarea
              className="input resize-none h-20"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1.5">
                Price (Rs) *
              </label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Stock</label>
              <input
                className="input"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: e.target.value }))
                }
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-down bg-down/10 border border-down/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ───────────────────────────────────────────────────── */
function DeleteProductModal({ product, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    try {
      await productsApi.remove(product.id);
      onDeleted(product.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="card w-full max-w-sm relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Delete Product</h2>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted mb-1">
          Are you sure you want to delete{" "}
          <span className="text-white font-medium">{product.name}</span>?
        </p>
        <p className="text-xs text-muted mb-5">This action cannot be undone.</p>
        {error && (
          <p className="text-sm text-down bg-down/10 border border-down/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-down/10 hover:bg-down/20 text-down border border-down/30 text-sm font-medium transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function ProductsPage() {
  const { isAuth } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await productsApi.list();
      setProducts(res.data.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-muted mt-0.5">
            {products.length} item{products.length !== 1 ? "s" : ""} in catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw
              size={14}
              className={clsx(refreshing && "animate-spin")}
            />
            Refresh
          </button>
          {isAuth ? (
            <button
              onClick={() => setShowAdd(true)}
              aria-label="Open add product form"
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={15} /> Add Product
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="btn-primary flex items-center gap-2"
            >
              Sign in to Add
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          className="input pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "No products match your search" : "No products yet"}
          description={
            search
              ? "Try a different search term."
              : isAuth
                ? "Use the Add Product button above to add the first product."
                : "Add the first product to the catalog."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isAuth={isAuth}
              onOrder={() =>
                navigate("/orders", { state: { productId: p.id } })
              }
              onEdit={(prod) => setEditTarget(prod)}
              onDelete={(prod) => setDeleteTarget(prod)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onAdded={(p) => setProducts((prev) => [p, ...prev])}
        />
      )}

      {editTarget && (
        <EditProductModal
          product={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={(updated) => {
            setProducts((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p)),
            );
            setEditTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteProductModal
          product={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => {
            setProducts((prev) => prev.filter((p) => p.id !== id));
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
