/** @format */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/client";
import { Diamond, Eye, EyeOff, Loader2 } from "lucide-react";
import clsx from "clsx";

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={clsx(
            "input pr-10",
            error && "border-down focus:border-down focus:ring-down/10",
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-down mt-1">{error}</p>}
    </div>
  );
}

export default function AuthPage() {
  const { login, isAuth, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");

  // Login state
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "" });
  const [regErr, setRegErr] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErr("");
    setLoginLoading(true);
    try {
      const res = await authApi.login(loginForm);
      login(res.data.data.token, res.data.data.user);
      navigate("/");
    } catch (err) {
      setLoginErr(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegErr("");
    setRegLoading(true);
    try {
      await authApi.register(regForm);
      setRegSuccess(true);
      setLoginForm({ email: regForm.email, password: "" });
      setTab("login");
    } catch (err) {
      setRegErr(err.response?.data?.message || "Registration failed.");
    } finally {
      setRegLoading(false);
    }
  };

  if (isAuth) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="card max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center text-2xl font-bold text-accent mx-auto mb-4">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <h2 className="text-lg font-bold text-white mb-1">
            You're signed in
          </h2>
          <p className="text-sm text-muted mb-4">{user?.email}</p>
          <button onClick={() => navigate("/")} className="btn-primary w-full">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-full p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 border border-accent/30 mb-4">
            <Diamond size={22} className="text-accent fill-accent/30" />
          </div>
          <h1 className="text-xl font-bold text-white">ShopFlow</h1>
          <p className="text-sm text-muted mt-1">
            Sign in or create your account
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-raised rounded-xl p-1 mb-6 border border-border">
          {["login", "register"].map((t) => (
            <button
              key={t}
              type="button"
              aria-label={`Switch to ${t === "login" ? "Sign In" : "Register"} tab`}
              onClick={() => {
                setTab(t);
                setLoginErr("");
                setRegErr("");
                setRegSuccess(false);
              }}
              className={clsx(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize",
                tab === t
                  ? "bg-surface text-white shadow border border-border"
                  : "text-muted hover:text-white",
              )}
            >
              {t === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div className="card">
          {regSuccess && tab === "login" && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-up/10 border border-up/30 text-up text-sm">
              Account created! You can now sign in.
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <InputField
                label="Email"
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
              <InputField
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {loginErr && (
                <p className="text-sm text-down bg-down/10 border border-down/30 rounded-lg px-3 py-2">
                  {loginErr}
                </p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loginLoading && <Loader2 size={15} className="animate-spin" />}
                {loginLoading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <InputField
                label="Full Name"
                value={regForm.name}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Jawwad Ahmed"
                autoComplete="name"
              />
              <InputField
                label="Email"
                type="email"
                value={regForm.email}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
              <InputField
                label="Password"
                type="password"
                value={regForm.password}
                onChange={(e) =>
                  setRegForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
              {regErr && (
                <p className="text-sm text-down bg-down/10 border border-down/30 rounded-lg px-3 py-2">
                  {regErr}
                </p>
              )}
              <button
                type="submit"
                disabled={regLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {regLoading && <Loader2 size={15} className="animate-spin" />}
                {regLoading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-4">
          {tab === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            onClick={() => setTab(tab === "login" ? "register" : "login")}
            className="text-accent hover:underline"
          >
            {tab === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
