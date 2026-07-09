/** @format */

import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkHealth } from "../api/client";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  User,
  Server,
  LogOut,
  LogIn,
  Menu,
  X,
  Diamond,
  CreditCard,
  Bell,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/payments", label: "Payments", icon: CreditCard, authOnly: true },
  { to: "/notifications", label: "Notifications", icon: Bell, authOnly: true },
  { to: "/services", label: "Services", icon: Server },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Layout() {
  const { user, logout, isAuth } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [health, setHealth] = useState({});

  useEffect(() => {
    const poll = () => checkHealth().then(setHealth);
    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, []);

  const upCount = Object.values(health).filter((v) => v === "up").length;
  const totalCount = Object.keys(health).length;

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-surface border-r border-border transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Diamond size={18} className="text-accent fill-accent" />
            <div>
              <h1 className="font-mono text-sm font-semibold tracking-wide text-white">
                ShopFlow
              </h1>
              <p className="text-[10px] text-muted">microservices platform</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Health summary */}
        <div className="mx-4 mt-4 mb-1 px-3 py-2 bg-raised rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted font-mono uppercase tracking-wider">
              Services
            </span>
            <span
              className={clsx(
                "text-[11px] font-mono font-semibold",
                upCount === totalCount && totalCount > 0
                  ? "text-up"
                  : upCount > 0
                    ? "text-accent"
                    : "text-muted",
              )}
            >
              {totalCount > 0 ? `${upCount}/${totalCount} up` : "checking…"}
            </span>
          </div>
          <div className="flex gap-1 mt-2">
            {Object.entries(health).map(([key, status]) => (
              <div
                key={key}
                title={key}
                className={clsx(
                  "h-1.5 flex-1 rounded-full",
                  status === "up" ? "bg-up" : "bg-down/50",
                )}
              />
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.filter(({ authOnly }) => !authOnly || isAuth).map(
            ({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  clsx("nav-link", isActive && "active")
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ),
          )}
        </nav>

        {/* User / login */}
        <div className="px-3 py-4 border-t border-border">
          {isAuth ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate("/auth");
                }}
                className="text-muted hover:text-down transition-colors flex-shrink-0"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                navigate("/auth");
                setSidebarOpen(false);
              }}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <LogIn size={15} />
              Sign in
            </button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Diamond size={14} className="text-accent fill-accent" />
            <span className="font-mono text-sm font-semibold">ShopFlow</span>
          </div>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
