import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const BCRYPT_MAX_BYTES = 72;

export default function Register() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const pwBytes = new TextEncoder().encode(password).length;
      if (pwBytes > BCRYPT_MAX_BYTES) {
        throw new Error(
          `Password too long (max ${BCRYPT_MAX_BYTES} bytes). Use a shorter password (avoid emojis / very long phrases).`
        );
      }

      await api.register({
        email: cleanEmail,
        password,
        full_name: fullName.trim() || undefined,
      });

      nav("/login");
    } catch (e: any) {
      setErr(e?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={h1}>Create account</h1>

        {err && <div style={errBox}>{err}</div>}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={label}>
            Full name (optional)
            <input style={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>

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
            Password
            <input
              style={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="new-password"
            />
            <span style={{ fontSize: 12, color: "#666" }}>
              Tip: keep passwords shorter than ~60 characters; emojis count as multiple bytes.
            </span>
          </label>

          <button style={btn} disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: 14 }}>
          Already have an account? <Link to="/login">Log in</Link>
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
