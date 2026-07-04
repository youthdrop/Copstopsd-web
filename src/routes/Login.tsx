import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * Forces a REAL backend call before navigating to /otp.
 * - Uses VITE_API_BASE_URL if set
 * - Otherwise falls back to your Railway URL
 */
const DEFAULT_API_BASE = "http://127.0.0.1:8000";

function getApiBase() {
  // Vite exposes env vars on import.meta.env
  // Some builds may not have it set, so we fall back to Railway.
  const v = (import.meta as any)?.env?.VITE_API_URL;
  const base = (typeof v === "string" && v.trim()) ? v.trim() : DEFAULT_API_BASE;
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function postJson(path: string, body: any) {
  const base = getApiBase();
  const url = `${base}${path}`;

  // Helpful debug so you can see it in Console immediately
  console.log("[LOGIN] POST", url, body?.email ? { ...body, password: "***" } : body);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // Try to parse JSON, but don’t fail if it’s not JSON
  let data: any = null;
  const text = await res.text().catch(() => "");
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  return { res, data };
}

async function loginAndRequestOtp(email: string, password: string) {
  // Try the most likely endpoint for password+OTP flow
  let out = await postJson("/auth/login", { email, password });

  // If backend uses a different path, try a fallback
  if (out.res.status === 404) {
    out = await postJson("/auth/request-otp", { email, password });
  }

  if (!out.res.ok) {
    const msg =
      (out.data && typeof out.data === "object" && (out.data.detail || out.data.message)) ||
      (typeof out.data === "string" && out.data) ||
      `Login failed (${out.res.status})`;

    throw new Error(msg);
  }

  return out.data;
}

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.length > 0 && !busy,
    [email, password, busy]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // ✅ This must hit Railway before we go to /otp
      const data = await loginAndRequestOtp(cleanEmail, password);

      // Store what OTP screen needs
      sessionStorage.setItem("login_email", cleanEmail);

      // NOTE: Storing passwords in sessionStorage is not ideal.
      // If your OTP screen currently depends on it, keep it for now.
      // We can refactor later to store a server-issued temp token instead.
      sessionStorage.setItem("login_password", password);

      // Optional: store temp token if backend returns one
      if (data && typeof data === "object") {
        if (data.temp_token) sessionStorage.setItem("temp_token", String(data.temp_token));
        if (data.otp_ticket) sessionStorage.setItem("otp_ticket", String(data.otp_ticket));
      }

      nav("/otp");
    } catch (err: any) {
      console.error("[LOGIN] error:", err);
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={{ marginTop: 0 }}>Log in</h1>

        {error && <div style={alert}>{error}</div>}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={label}>
            Email
            <input
              style={input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label style={label}>
            Password
            <input
              style={input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button style={btn} disabled={!canSubmit}>
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <Link to="/forgot-password">Forgot password?</Link>
          <Link to="/register">Create account</Link>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          API: {getApiBase()}
        </div>
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 };
const card: React.CSSProperties = { width: "100%", maxWidth: 420, border: "1px solid #e6e6e6", borderRadius: 16, padding: 22 };
const label: React.CSSProperties = { display: "grid", gap: 6, fontSize: 13 };
const input: React.CSSProperties = { padding: 10, borderRadius: 10, border: "1px solid #ccc" };
const btn: React.CSSProperties = { padding: 10, borderRadius: 10, border: "none", background: "black", color: "white", cursor: "pointer" };
const alert: React.CSSProperties = { background: "#fee", border: "1px solid #fbb", padding: 10, borderRadius: 10, marginBottom: 12 };
