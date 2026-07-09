/** @format */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ordersApi, productsApi } from "../api/client";
import {
  ShoppingBag,
  RefreshCw,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Ban,
  Trash2,
  CreditCard,
} from "lucide-react";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import clsx from "clsx";

/* ─── Status Badge ──────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    paid: { cls: "badge-paid", icon: <CheckCircle size={10} />, label: "Paid" },
    payment_failed: {
      cls: "badge-failed",
      icon: <XCircle size={10} />,
      label: "Failed",
    },
    cancelled: {
      cls: "text-muted bg-muted/10 border-muted/20 text-[10px] font-mono px-2 py-0.5 rounded-full border",
      icon: <Ban size={10} />,
      label: "Cancelled",
    },
    paid_stock_update_failed: {
      cls: "badge-paid",
      icon: <CheckCircle size={10} />,
      label: "Paid",
    },
  };
  const config = map[status] || {
    cls: "badge-pending",
    icon: <Clock size={10} />,
    label: "Pending",
  };
  return (
    <span className={clsx(config.cls, "flex items-center gap-1 w-fit mx-auto")}>
      {config.icon}
      {config.label}
    </span>
  );
}

/* ─── Place Order Modal ─────────────────────────────────────────────────────── */
const METHOD_LABELS = {
  card: "💳 Card",
  jazzcash: "📱 JazzCash",
  cod: "💵 Cash on Delivery",
};

function PlaceOrderModal({ products, defaultProductId, onClose, onPlaced }) {
  const [productId, setProductId] = useState(
    defaultProductId || (products[0]?.id ?? ""),
  );
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = products.find((p) => p.id === productId);
  const total = selected ? selected.price * quantity : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!productId) return setError("Please select a product.");
    setLoading(true);
    try {
      const res = await ordersApi.create({
        productId,
        quantity: parseInt(quantity, 10),
        paymentMethod,
      });
      onPlaced(res.data.data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Order failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="card w-full max-w-md relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Place New Order</h2>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>
        {products.length === 0 ? (
          <p className="text-muted text-sm text-center py-6">
            No products available. Add some products first.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product */}
            <div>
              <label className="block text-xs text-muted mb-1.5">
                Product *
              </label>
              <select
                className="input"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Rs {Number(p.price).toLocaleString()} ({p.stock}{" "}
                    in stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs text-muted mb-1.5">
                Quantity *
              </label>
              <input
                className="input"
                type="number"
                min="1"
                max={selected?.stock}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              {selected && (
                <p className="text-[11px] text-muted mt-1">
                  Max available: {selected.stock}
                </p>
              )}
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-xs text-muted mb-1.5">
                Payment Method *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(METHOD_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPaymentMethod(key)}
                    className={clsx(
                      "py-2 px-2 rounded-lg border text-xs font-medium transition-colors text-center",
                      paymentMethod === key
                        ? "bg-accent/20 border-accent text-accent"
                        : "bg-raised border-border text-muted hover:border-accent/50",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selected && (
              <div className="p-3 bg-raised rounded-lg border border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Unit price</span>
                  <span className="text-white font-mono">
                    Rs {Number(selected.price).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted">Quantity</span>
                  <span className="text-white font-mono">×{quantity}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted">Payment via</span>
                  <span className="text-white">
                    {METHOD_LABELS[paymentMethod]}
                  </span>
                </div>
                <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border">
                  <span className="text-muted">Total</span>
                  <span className="text-accent font-mono">
                    Rs {Number(total).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

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
                {loading ? "Placing…" : "Place Order"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Cancel Confirm Modal ──────────────────────────────────────────────────── */
function CancelOrderModal({ order, productName, onClose, onCancelled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.cancel(order.id);
      onCancelled(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel order.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="card w-full max-w-sm relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Cancel Order</h2>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted mb-1">
          Cancel order for{" "}
          <span className="text-white font-medium">{productName}</span>?
        </p>
        <p className="text-xs text-muted mb-1">
          Order ID: <span className="font-mono">{order.id.slice(0, 8)}…</span>
        </p>
        {order.status === "paid" && (
          <p className="text-xs text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 mt-3">
            Stock will be automatically restored.
          </p>
        )}
        {error && (
          <p className="text-sm text-down bg-down/10 border border-down/30 rounded-lg px-3 py-2 mt-3">
            {error}
          </p>
        )}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-ghost flex-1">
            Keep Order
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-down/10 hover:bg-down/20 text-down border border-down/30 text-sm font-medium transition-colors"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Cancelling…" : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ──────────────────────────────────────────────────── */
function DeleteOrderModal({ order, productName, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    try {
      await ordersApi.remove(order.id);
      onDeleted(order.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete order.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="card w-full max-w-sm relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Delete Order</h2>
          <button onClick={onClose} className="text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted mb-1">
          Permanently delete this order for{" "}
          <span className="text-white font-medium">{productName}</span>?
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

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const { isAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const defaultProductId = location.state?.productId;

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [ordRes, prodRes] = await Promise.all([
        ordersApi.list(),
        productsApi.list(),
      ]);
      setOrders(ordRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    load();
    if (defaultProductId) setShowNew(true);
  }, [isAuth, load, defaultProductId]);

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const paidCount = orders.filter(
    (o) => o.status === "paid" || o.status === "paid_stock_update_failed",
  ).length;
  const failCount = orders.filter((o) => o.status === "payment_failed").length;
  const totalPaid = orders
    .filter(
      (o) => o.status === "paid" || o.status === "paid_stock_update_failed",
    )
    .reduce((s, o) => s + o.totalPrice, 0);

  const cancellableStatuses = ["pending", "paid", "paid_stock_update_failed"];
  const deletableStatuses = ["pending", "payment_failed", "cancelled"];

  if (!isAuth) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <EmptyState
          icon={ShoppingBag}
          title="Sign in to view orders"
          description="Your order history and order placement require authentication."
          action={
            <button onClick={() => navigate("/auth")} className="btn-primary">
              Sign in
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-sm text-muted mt-0.5">
            {orders.length} total · {paidCount} paid
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
          <button
            onClick={() => setShowNew(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> New Order
          </button>
        </div>
      </div>

      {/* Stats */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Orders", value: orders.length, color: "text-info" },
            { label: "Paid Orders", value: paidCount, color: "text-up" },
            { label: "Failed", value: failCount, color: "text-down" },
          ].map((s) => (
            <div key={s.label} className="card text-center py-4">
              <p className={clsx("text-2xl font-bold font-mono", s.color)}>
                {s.value}
              </p>
              <p className="text-xs text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Total paid bar */}
      {paidCount > 0 && (
        <div className="mb-6 px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl flex items-center justify-between">
          <span className="text-sm text-muted">Total amount paid</span>
          <span className="font-bold font-mono text-accent">
            Rs {totalPaid.toLocaleString()}
          </span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Place your first order from the products catalog."
          action={
            <button
              onClick={() => setShowNew(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={14} /> Place Order
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-raised">
                  {[
                    "Order ID",
                    "Product",
                    "Qty",
                    "Total",
                    "Payment",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={clsx(
                        "text-xs font-mono text-muted px-4 py-3",
                        i >= 2 && i <= 6
                          ? "text-right"
                          : i === 7
                            ? "text-center"
                            : "text-left",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const prod = productMap[o.productId];
                  const productName =
                    prod?.name || o.productId.slice(0, 8) + "…";
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-border last:border-0 hover:bg-raised/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {o.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-white">
                        {prod?.name || (
                          <span className="text-muted text-xs">
                            {o.productId.slice(0, 8)}…
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white">
                        {o.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-accent font-semibold">
                        Rs {Number(o.totalPrice).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-mono text-muted">
                          {o.paymentMethod
                            ? METHOD_LABELS[o.paymentMethod] || o.paymentMethod
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted font-mono">
                        {new Date(o.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {cancellableStatuses.includes(o.status) && (
                            <button
                              onClick={() => setCancelTarget(o)}
                              title="Cancel order"
                              className="btn-ghost p-1.5 text-muted hover:text-accent"
                            >
                              <Ban size={13} />
                            </button>
                          )}
                          {deletableStatuses.includes(o.status) && (
                            <button
                              onClick={() => setDeleteTarget(o)}
                              title="Delete order"
                              className="btn-ghost p-1.5 text-muted hover:text-down"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNew && (
        <PlaceOrderModal
          products={products.filter((p) => p.stock > 0)}
          defaultProductId={defaultProductId}
          onClose={() => setShowNew(false)}
          onPlaced={(o) => {
            setOrders((prev) => [o, ...prev]);
            load();
          }}
        />
      )}
      {cancelTarget && (
        <CancelOrderModal
          order={cancelTarget}
          productName={
            productMap[cancelTarget.productId]?.name ||
            cancelTarget.productId.slice(0, 8) + "…"
          }
          onClose={() => setCancelTarget(null)}
          onCancelled={(updated) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o)),
            );
            setCancelTarget(null);
          }}
        />
      )}
      {deleteTarget && (
        <DeleteOrderModal
          order={deleteTarget}
          productName={
            productMap[deleteTarget.productId]?.name ||
            deleteTarget.productId.slice(0, 8) + "…"
          }
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => {
            setOrders((prev) => prev.filter((o) => o.id !== id));
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
