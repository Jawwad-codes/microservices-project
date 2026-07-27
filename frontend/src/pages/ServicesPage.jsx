/** @format */

import React, { useEffect, useState, useCallback } from "react";
import { checkHealth } from "../api/client";

const GATEWAY = import.meta.env.VITE_GATEWAY_URL || "https://api.jawwad.online";

const SERVICE_PORTS = {
  "api-gateway": 8080,
  "user-service": 4001,
  "product-service": 4002,
  "order-service": 4003,
  "payment-service": 4004,
  "notification-service": 4005,
};
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  ExternalLink,
} from "lucide-react";
import Spinner from "../components/Spinner";
import clsx from "clsx";

const SERVICE_META = {
  "api-gateway": {
    port: 8080,
    role: "Reverse proxy & single entry point",
    db: null,
  },
  "user-service": {
    port: 4001,
    role: "Auth, registration & user profiles",
    db: "user_db",
  },
  "product-service": {
    port: 4002,
    role: "Product catalog management",
    db: "product_db",
  },
  "order-service": {
    port: 4003,
    role: "Order orchestration (calls 3 services)",
    db: "order_db",
  },
  "payment-service": {
    port: 4004,
    role: "Payment processing (stub)",
    db: null,
  },
  "notification-service": {
    port: 4005,
    role: "Email notifications (stub)",
    db: null,
  },
};

const FLOW_STEPS = [
  { label: "Browser", arrow: true },
  { label: "API Gateway", arrow: true, key: "api-gateway" },
  { label: "User / Product / Order Service", arrow: false },
];

export default function ServicesPage() {
  const [health, setHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const poll = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    const result = await checkHealth();
    setHealth(result);
    setLastChecked(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, [poll]);

  const upCount = Object.values(health).filter((v) => v === "up").length;
  const total = Object.keys(health).length;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="text-sm text-muted mt-0.5">
            {total > 0 ? `${upCount} of ${total} services online` : "Checking…"}
            {lastChecked && (
              <span className="ml-2 text-xs">
                · Last checked{" "}
                {lastChecked.toLocaleTimeString("en-GB", { hour12: false })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => poll(true)}
          disabled={refreshing}
          className="btn-ghost flex items-center gap-2"
        >
          <RefreshCw size={14} className={clsx(refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Overall health bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Overall Health</span>
          <span
            className={clsx(
              "text-sm font-mono font-semibold",
              upCount === total && total > 0
                ? "text-up"
                : upCount > 0
                  ? "text-accent"
                  : "text-down",
            )}
          >
            {total > 0 ? `${Math.round((upCount / total) * 100)}%` : "—"}
          </span>
        </div>
        <div className="h-2 bg-raised rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-500",
              upCount === total && total > 0
                ? "bg-up"
                : upCount > 0
                  ? "bg-accent"
                  : "bg-down",
            )}
            style={{ width: total > 0 ? `${(upCount / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Service cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {Object.entries(SERVICE_META).map(([name, meta]) => {
            const status = health[name];
            const isUp = status === "up";
            return (
              <div
                key={name}
                className={clsx(
                  "card transition-colors",
                  isUp ? "hover:border-up/30" : "hover:border-down/30",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        "w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0",
                        isUp
                          ? "bg-up/10 border-up/20"
                          : "bg-down/10 border-down/20",
                      )}
                    >
                      <Server
                        size={15}
                        className={isUp ? "text-up" : "text-down"}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white font-mono">
                        {name}
                      </h3>
                      <p className="text-[11px] text-muted">Port {meta.port}</p>
                    </div>
                  </div>
                  {isUp ? (
                    <span className="flex items-center gap-1 text-up text-xs font-mono">
                      <CheckCircle size={12} /> Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-down text-xs font-mono">
                      <XCircle size={12} /> Offline
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-3">{meta.role}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="bg-raised border border-border px-2 py-0.5 rounded font-mono">{`localhost:${meta.port}`}</span>
                    {meta.db && (
                      <span className="bg-info/10 border border-info/20 text-info px-2 py-0.5 rounded font-mono">
                        {meta.db}
                      </span>
                    )}
                  </div>
                  <a
                    href={`http://localhost:${SERVICE_PORTS[name]}/health`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-accent transition-colors"
                    title="Open health endpoint"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request flow diagram */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Request Flow</h2>
        <div className="space-y-2 text-sm">
          {[
            { label: "Browser (frontend :3000)", type: "browser" },
            { label: "↓ HTTP", type: "arrow" },
            {
              label: "API Gateway (:4000)",
              type: "gateway",
              key: "api-gateway",
            },
            { label: "↓ Proxy routes", type: "arrow" },
            {
              label: "/api/auth/*  →  user-service (:4001)",
              type: "route",
              key: "user-service",
            },
            {
              label: "/api/products/*  →  product-service (:4002)",
              type: "route",
              key: "product-service",
            },
            {
              label: "/api/orders/*  →  order-service (:4003)",
              type: "route",
              key: "order-service",
            },
            { label: "↓ order-service internally calls:", type: "arrow" },
            {
              label: "product-service → validate product & get price",
              type: "internal",
              key: "product-service",
            },
            {
              label: "payment-service → process payment",
              type: "internal",
              key: "payment-service",
            },
            {
              label: "notification-service → send email (best-effort)",
              type: "internal",
              key: "notification-service",
            },
          ].map((step, i) => {
            const isUp = step.key ? health[step.key] === "up" : null;
            return (
              <div
                key={i}
                className={clsx(
                  "flex items-center gap-2 font-mono text-xs",
                  step.type === "arrow" && "text-muted ml-4",
                  step.type === "browser" &&
                    "text-info bg-info/10 border border-info/20 rounded-lg px-3 py-2",
                  step.type === "gateway" &&
                    "text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2",
                  step.type === "route" &&
                    "text-white bg-raised border border-border rounded-lg px-3 py-2 ml-4",
                  step.type === "internal" &&
                    "text-muted bg-surface border border-border rounded-lg px-3 py-2 ml-8",
                )}
              >
                {step.key && (
                  <span
                    className={clsx(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      isUp ? "bg-up" : isUp === false ? "bg-down" : "bg-muted",
                    )}
                  />
                )}
                {step.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
