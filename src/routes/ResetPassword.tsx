import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function ResetPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.trim();

      await api.resetPassword({
        email: cleanEmail,
        code: cleanCode,
        new_password: newPassword,
      });

      setOk(true);
      setTimeout(() => nav("/login"), 400);
    } catch (e: any) {
      setErr(e?.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={h1}>Reset password</h1>
        <p style={p}>Enter your email, the 6-digit code, and your new password.</p>

        {err && <div style={errBox}>{err}</div>}
        {ok && <div style={okBox}>Password updated. Redirecting to login…</div>}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={label}>
            Email
            <input
              style={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
            />
          </label>

          <label style={label}>
            6-digit code
            <input
              style={input}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              placeholder="123456"
              required
            />
          </label>

          <label style={label}>
            New password
            <input
              style={input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              required
              autoComplete="new-password"
            />
          </label>

          <button style={btn} disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: 14 }}>
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 16,
  background: "#fff",
};
const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  border: "1px solid #e5e5e5",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};
const h1: React.CSSProperties = { margin: 0, fontSize: 24 };
const p: React.CSSProperties = { marginTop: 8, color: "#444" };
const label: React.CSSProperties = { display: "grid", gap: 6, fontSize: 14 };
const input: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ccc",
  outline: "none",
};
const btn: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "none",
  background: "black",
  color: "white",
  cursor: "pointer",
};
const errBox: React.CSSProperties = {
  background: "#fee",
  border: "1px solid #fbb",
  padding: 10,
  borderRadius: 10,
  marginBottom: 12,
  color: "#900",
  fontSize: 14,
};
const okBox: React.CSSProperties = {
  background: "#efe",
  border: "1px solid #bfb",
  padding: 10,
  borderRadius: 10,
  marginBottom: 12,
  color: "#060",
  fontSize: 14,
};
