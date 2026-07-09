/** @format */

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../api/client";
import { Bell, RefreshCw, Mail, ChevronDown, ChevronUp } from "lucide-react";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import clsx from "clsx";

const TYPE_COLORS = {
  order_confirmation: "text-up bg-up/10 border-up/20",
  order_cancelled: "text-muted bg-muted/10 border-muted/20",
  payment_failed: "text-down bg-down/10 border-down/20",
  generic: "text-info bg-info/10 border-info/20",
};

const TYPE_LABELS = {
  order_confirmation: "Order Confirmed",
  order_cancelled: "Order Cancelled",
  payment_failed: "Payment Failed",
  generic: "Notification",
};

function NotificationRow({ notif }) {
  const [expanded, setExpanded] = useState(false);
  const colorCls = TYPE_COLORS[notif.type] || TYPE_COLORS.generic;
  const label = TYPE_LABELS[notif.type] || notif.type;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-raised/50 transition-colors text-left"
      >
        {/* icon */}
        <div
          className={clsx(
            "w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0",
            colorCls,
          )}
        >
          <Mail size={14} />
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={clsx(
                "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                colorCls,
              )}
            >
              {label}
            </span>
            <span className="text-xs text-muted font-mono truncate">
              {notif.email}
            </span>
          </div>
          <p className="text-sm text-white mt-0.5 truncate">{notif.subject}</p>
        </div>

        {/* date + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted font-mono hidden sm:block">
            {new Date(notif.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-muted" />
          ) : (
            <ChevronDown size={14} className="text-muted" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 ml-11">
          <pre className="text-xs text-muted bg-raised border border-border rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed">
            {notif.body}
          </pre>
          <p className="text-[10px] text-muted mt-2 font-mono">
            {new Date(notif.createdAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const { isAuth, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      try {
        // Admins/all: fetch all. User: fetch by email
        const res = user?.email
          ? await notificationsApi.byEmail(user.email)
          : await notificationsApi.list();
        setNotifications(res.data.data || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!isAuth) return;
    load();
  }, [isAuth, load]);

  const types = [
    "all",
    ...Array.from(new Set(notifications.map((n) => n.type))),
  ];
  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  if (!isAuth) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <EmptyState
          icon={Bell}
          title="Sign in to view notifications"
          description="Notifications are tied to your account."
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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-muted mt-0.5">
            {notifications.length} notification
            {notifications.length !== 1 ? "s" : ""} for {user?.email}
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

      {/* Type filters */}
      {notifications.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={clsx(
                "text-xs font-mono px-3 py-1.5 rounded-full border transition-colors capitalize",
                filter === t
                  ? "bg-accent/20 border-accent text-accent"
                  : "bg-raised border-border text-muted hover:border-accent/50",
              )}
            >
              {t === "all" ? "All" : TYPE_LABELS[t] || t}
              {t === "all" && (
                <span className="ml-1.5 text-muted">
                  ({notifications.length})
                </span>
              )}
              {t !== "all" && (
                <span className="ml-1.5 text-muted">
                  ({notifications.filter((n) => n.type === t).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Notifications appear here when orders are placed, paid, or cancelled."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          {filtered.map((n) => (
            <NotificationRow key={n.id} notif={n} />
          ))}
        </div>
      )}
    </div>
  );
}
