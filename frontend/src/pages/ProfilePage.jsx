/** @format */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi, ordersApi } from "../api/client";
import { User, Calendar, Mail, Hash, ShoppingBag, LogOut } from "lucide-react";
import Spinner from "../components/Spinner";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-raised border border-border flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm text-white font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { isAuth, user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) return;
    Promise.all([
      authApi
        .profile(user.id)
        .then((r) => setProfile(r.data.data))
        .catch(() => setProfile(user)),
      ordersApi
        .list()
        .then((r) => setOrders(r.data.data || []))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [isAuth, user]);

  if (!isAuth) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="card max-w-sm w-full text-center">
          <User size={32} className="text-muted mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Not signed in</h2>
          <p className="text-sm text-muted mb-4">
            Sign in to view your profile.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="btn-primary w-full"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalSpent = paidOrders.reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Avatar & name */}
          <div className="card flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 border-2 border-accent/40 flex items-center justify-center text-3xl font-bold text-accent flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {profile?.name || user?.name}
              </h2>
              <p className="text-sm text-muted">
                {profile?.email || user?.email}
              </p>
            </div>
          </div>

          {/* Account info */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-1">
              Account Details
            </h3>
            <InfoRow
              icon={Hash}
              label="User ID"
              value={profile?.id || user?.id}
            />
            <InfoRow
              icon={User}
              label="Full Name"
              value={profile?.name || user?.name}
            />
            <InfoRow
              icon={Mail}
              label="Email Address"
              value={profile?.email || user?.email}
            />
            {profile?.createdAt && (
              <InfoRow
                icon={Calendar}
                label="Member Since"
                value={new Date(profile.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Total Orders",
                value: orders.length,
                color: "text-info",
              },
              {
                label: "Paid Orders",
                value: paidOrders.length,
                color: "text-up",
              },
              {
                label: "Total Spent",
                value: `Rs ${totalSpent.toLocaleString()}`,
                color: "text-accent",
              },
            ].map((s) => (
              <div key={s.label} className="card text-center py-4">
                <p className={`text-xl font-bold font-mono ${s.color}`}>
                  {s.value}
                </p>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sign out */}
          <button
            onClick={() => {
              logout();
              navigate("/auth");
            }}
            className="btn-danger w-full flex items-center justify-center gap-2"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
