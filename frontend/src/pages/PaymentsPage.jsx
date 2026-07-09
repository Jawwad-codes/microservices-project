/** @format */

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { paymentsApi } from "../api/client";
import { CreditCard, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import clsx from "clsx";

const METHOD_LABELS = {
  card: "💳 Card",
  jazzcash: "📱 JazzCash",
  cod: "💵 COD",
};

const STATUS_CONFIG = {
  success: {
    cls: "text-up bg-up/10 border-up/20",
    icon: <CheckCircle size={10} />,
    label: "Success",
  },
  failed: {
    cls: "text-down bg-down/10 border-down/20",
    icon: <XCircle size={10} />,
    label: "Failed",
  },
  refunded: {
    cls: "text-accent bg-accent/10 border-accent/20",
    icon: <CheckCircle size={10} />,
    label: "Refunded",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.success;
  return (
    <span
      className={clsx(
        "flex items-center gap-1 w-fit mx-auto text-[10px] font-mono px-2 py-0.5 rounded-full border",
        cfg.cls,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function PaymentsPage() {
  const { isAuth } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [methods, setMethods] = useState([]);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [pmtRes, methodsRes] = await Promise.all([
        paymentsApi.list(),
        paymentsApi.methods(),
      ]);
      setPayments(pmtRes.data.data || []);
      setMethods(methodsRes.data.data || []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    load();
  }, [isAuth, load]);

  const totalSuccess = payments
    .filter((p) => p.status === "success")
    .reduce((s, p) => s + p.amount, 0);

  if (!isAuth) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <EmptyState
          icon={CreditCard}
          title="Sign in to view payments"
          description="Payment records are visible after signing in."
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
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-sm text-muted mt-0.5">
            {payments.length} payment{payments.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="btn-ghost flex items-center gap-2"
        >
          <RefreshCw size={14} className={clsx(refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Enabled methods + total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-muted mb-2">Enabled Payment Methods</p>
          <div className="flex gap-2 flex-wrap">
            {methods.length === 0 ? (
              <span className="text-xs text-muted">Loading…</span>
            ) : (
              methods.map((m) => (
                <span
                  key={m}
                  className="text-xs font-mono bg-accent/10 border border-accent/20 text-accent px-3 py-1 rounded-full"
                >
                  {METHOD_LABELS[m] || m}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="card">
          <p className="text-xs text-muted mb-1">Total Collected</p>
          <p className="text-2xl font-bold font-mono text-up">
            Rs {totalSuccess.toLocaleString()}
          </p>
          <p className="text-xs text-muted mt-0.5">
            from {payments.filter((p) => p.status === "success").length}{" "}
            successful payment
            {payments.filter((p) => p.status === "success").length !== 1
              ? "s"
              : ""}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Payment records appear here once orders are placed."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-raised">
                  {[
                    "Payment ID",
                    "Order ID",
                    "Method",
                    "Amount",
                    "Status",
                    "Date",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={clsx(
                        "text-xs font-mono text-muted px-4 py-3",
                        i >= 3 ? "text-right" : "text-left",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-raised/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {p.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {p.orderId.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      {METHOD_LABELS[p.method] || p.method}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent font-semibold">
                      Rs {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted font-mono">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
