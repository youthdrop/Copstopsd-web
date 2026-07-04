import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      await api.forgotPassword({ email: cleanEmail }); // throws if request fails
      setDone(true);
    } catch (e: any) {
      setErr(e?.message || "Could not send reset code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={h1}>Forgot password</h1>
        <p style={p}>Enter your email. We’ll send a 6-digit reset code.</p>

        {err && <div style={errBox}>{err}</div>}

        {!done ? (
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

            <button style={btn} disabled={busy}>
              {busy ? "Sending…" : "Send reset code"}
            </button>
          </form>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 14 }}>
              If an account exists for that email, a code was sent.
            </div>

            <button style={btn} onClick={() => nav("/reset-password")}>
              Enter code
            </button>
          </div>
        )}

        <div style={{ marginTop: 14, fontSize: 14 }}>
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}

/* styles */
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
};
