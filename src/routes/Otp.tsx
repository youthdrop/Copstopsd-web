import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";

export default function Otp() {
  const nav = useNavigate();
  const { setToken, setUser, refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("login_email");
    if (saved) setEmail(saved);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setBusy(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.trim();

      const res = await api.verifyOtp({ email: cleanEmail, otp_code: cleanCode });

      // token is persisted by api.verifyOtp (in api.ts); this keeps AuthContext in sync
      setToken(res.access_token);
      const me = await refreshUser();
      if (me) setUser(me);

      sessionStorage.removeItem("login_email");
      sessionStorage.removeItem("login_password"); // legacy cleanup

      nav("/", { replace: true });
    } catch (e: any) {
      setErr(e?.message || "OTP verification failed");
    } finally {
      setBusy(false);
    }
  }

  function onResend() {
    setOk("To resend a code, please go back to Login and sign in again.");
    setErr(null);
  }

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={{ marginTop: 0 }}>Enter Verification Code</h1>
        <p style={{ color: "#444" }}>Enter the 6-digit code sent to your email.</p>

        {err && <div style={alert}>{err}</div>}
        {ok && <div style={okBox}>{ok}</div>}

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
            Code
            <input
              style={input}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              required
            />
          </label>

          <button style={btn} disabled={busy}>
            {busy ? "Verifying…" : "Verify"}
          </button>

          <button type="button" style={btn2} disabled={busy} onClick={onResend}>
            Resend code
          </button>
        </form>

        <div style={{ marginTop: 12, fontSize: 14, display: "flex", justifyContent: "space-between" }}>
          <Link to="/login">Back to login</Link>
          <Link to="/forgot-password">Forgot password?</Link>
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
const btn2: React.CSSProperties = { padding: 10, borderRadius: 10, border: "1px solid #ccc", background: "white", cursor: "pointer" };
const alert: React.CSSProperties = { background: "#fee", border: "1px solid #fbb", padding: 10, borderRadius: 10, marginBottom: 12 };
const okBox: React.CSSProperties = { background: "#efe", border: "1px solid #bfb", padding: 10, borderRadius: 10, marginBottom: 12 };
