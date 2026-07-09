/** @format */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { productsApi, ordersApi, checkHealth } from "../api/client";
import {
  Package,
  ShoppingBag,
  Server,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Spinner from "../components/Spinner";
import clsx from "clsx";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "accent",
  onClick,
}) {
  const colors = {
    accent: "text-accent bg-accent/10 border-accent/20",
    up: "text-up bg-up/10 border-up/20",
    info: "text-info bg-info/10 border-info/20",
    muted: "text-muted bg-muted/10 border-muted/20",
  };
  return (
    <div
      onClick={onClick}
      className={clsx(
        "card flex items-start gap-4",
        onClick && "cursor-pointer hover:border-accent/40 transition-colors",
      )}
    >
      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0",
          colors[color],
        )}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-muted mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white font-mono">
          {value ?? <Spinner size="sm" />}
        </p>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }) {
  if (status === "paid") return <span className="badge-paid">Paid</span>;
  if (status === "payment_failed")
    return <span className="badge-failed">Failed</span>;
  return <span className="badge-pending">Pending</span>;
}

export default function Dashboard() {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState(null);
  const [orders, setOrders] = useState(null);
  const [health, setHealth] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, healthRes] = await Promise.all([
          productsApi.list(),
          checkHealth(),
        ]);
        setProducts(prodRes.data.data || []);
        setHealth(healthRes);
        if (isAuth) {
          const ordRes = await ordersApi.list();
          setOrders(ordRes.data.data || []);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuth]);

  const upCount = Object.values(health).filter((v) => v === "up").length;
  const totalCount = Object.keys(health).length;
  const paidOrders = (orders || []).filter((o) => o.status === "paid").length;
  const recentOrders = (orders || []).slice(0, 5);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {isAuth
            ? `Welcome back, ${user?.name?.split(" ")[0]} 👋`
            : "Dashboard"}
        </h1>
        <p className="text-muted text-sm mt-1">
          {isAuth
            ? "Here's what's happening across your store."
            : "Sign in to manage orders and products."}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Package}
          label="Total Products"
          value={products?.length ?? null}
          sub="in catalog"
          color="accent"
          onClick={() => navigate("/products")}
        />
        <StatCard
          icon={ShoppingBag}
          label="My Orders"
          value={isAuth ? (orders?.length ?? null) : "—"}
          sub={isAuth ? `${paidOrders} paid` : "sign in to view"}
          color="info"
          onClick={isAuth ? () => navigate("/orders") : undefined}
        />
        <StatCard
          icon={Server}
          label="Services"
          value={totalCount > 0 ? `${upCount}/${totalCount}` : null}
          sub="healthy"
          color={upCount === totalCount && totalCount > 0 ? "up" : "muted"}
          onClick={() => navigate("/services")}
        />
        <StatCard
          icon={TrendingUp}
          label="Order Value"
          value={
            isAuth && orders
              ? `Rs ${orders
                  .filter((o) => o.status === "paid")
                  .reduce((s, o) => s + o.totalPrice, 0)
                  .toLocaleString()}`
              : "—"
          }
          sub="total paid"
          color="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Orders</h2>
            {isAuth && (
              <button
                onClick={() => navigate("/orders")}
                className="text-xs text-accent flex items-center gap-1 hover:underline"
              >
                View all <ArrowRight size={12} />
              </button>
            )}
          </div>
          {!isAuth ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted mb-3">
                Sign in to see your orders
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="btn-primary text-sm px-4 py-2"
              >
                Sign in
              </button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted mb-3">No orders yet</p>
              <button
                onClick={() => navigate("/orders")}
                className="btn-ghost text-sm"
              >
                Place an order
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-xs font-mono text-muted">
                      {o.id.slice(0, 12)}…
                    </p>
                    <p className="text-sm text-white">
                      Qty: {o.quantity} · Rs{" "}
                      {Number(o.totalPrice).toLocaleString()}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service health */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Service Health</h2>
            <button
              onClick={() => navigate("/services")}
              className="text-xs text-accent flex items-center gap-1 hover:underline"
            >
              Details <ArrowRight size={12} />
            </button>
          </div>
          {Object.keys(health).length === 0 ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(health).map(([name, status]) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={clsx(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        status === "up"
                          ? "bg-up shadow-[0_0_6px_#34D399]"
                          : "bg-down",
                      )}
                    />
                    <span className="text-sm font-mono text-white">{name}</span>
                  </div>
                  {status === "up" ? (
                    <span className="flex items-center gap-1 text-up text-xs">
                      <CheckCircle size={12} /> Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-down text-xs">
                      <XCircle size={12} /> Offline
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      {!isAuth && (
        <div className="mt-6 p-5 rounded-xl bg-accent/5 border border-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white">Get started</p>
            <p className="text-sm text-muted">
              Create an account or sign in to place orders.
            </p>
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="btn-primary whitespace-nowrap flex items-center gap-2"
          >
            Sign in <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
