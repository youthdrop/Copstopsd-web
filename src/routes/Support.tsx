import React from "react";

export default function Support() {
  return (
    <main style={{ maxWidth: 760, margin: "56px auto", padding: 20, lineHeight: 1.5 }}>
      <h1 style={{ marginBottom: 8 }}>CopStop San Diego Edition – Support</h1>
      <p style={{ color: "#444", marginTop: 0 }}>
        If you’re experiencing issues with the CopStop San Diego Edition app, we’re here to help.
      </p>

      <section style={{ marginTop: 18 }}>
        <p>
          <strong>Support Email:</strong>{" "}
          <a href="mailto:contact@potcsd.org">contact@potcsd.org</a>
        </p>
        <p>
          <strong>Typical Response Time:</strong> 1–2 business days
        </p>
      </section>

      <hr style={{ margin: "22px 0" }} />

      <p style={{ fontSize: 14, color: "#555" }}>
        If you are in immediate danger, call 911. This app does not provide emergency services.
      </p>
    </main>
  );
}