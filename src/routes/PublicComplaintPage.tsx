import React, { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../lib/api";
import "./PublicComplaintPage.css";

const HARM_OPTIONS = [
  "Emotional distress",
  "Physical injury",
  "Property damage",
  "Illegal search",
  "Use of force",
  "Threats / intimidation",
  "Racial profiling",
  "Unlawful detention",
  "Financial loss",
  "Other",
] as const;

type HarmOption = (typeof HARM_OPTIONS)[number];

function todayYYYYMMDD() {
  return new Date().toISOString().slice(0, 10);
}

function currentTimeHHMM() {
  return new Date().toTimeString().slice(0, 5);
}

function RequiredAsterisk() {
  return <span className="required-star" aria-hidden="true">*</span>;
}

async function submitPublicIntake(payload: Record<string, unknown>) {
  const response = await fetch(`${API_URL}/public/intake`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Complaint submission failed");
  }

  return response.json();
}

export default function PublicComplaintPage() {
  const navigate = useNavigate();

  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [stopDate, setStopDate] = useState(todayYYYYMMDD());
  const [stopTime, setStopTime] = useState(currentTimeHHMM());
  const [harms, setHarms] = useState<HarmOption[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      first.trim() &&
      last.trim() &&
      phone.trim() &&
      department.trim() &&
      stopDate &&
      stopTime &&
      harms.length > 0
    );
  }, [first, last, phone, department, stopDate, stopTime, harms]);

  function toggleHarm(harm: HarmOption) {
    setHarms((prev) =>
      prev.includes(harm)
        ? prev.filter((item) => item !== harm)
        : [...prev, harm]
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErr(null);
    setSaving(true);

    try {
      const payload = {
        complainant_first_name: first.trim(),
        complainant_last_name: last.trim(),
        complainant_phone: phone.trim(),
        department: department.trim(),
        stop_date: stopDate,
        stop_time: stopTime,
        harm_done: harms,
        harm_types: harms,
      };

      const resp = await submitPublicIntake(payload);

      navigate(
        resp?.case_number
          ? `/complaint/thank-you?case=${encodeURIComponent(resp.case_number)}`
          : "/complaint/thank-you"
      );
    } catch (e: any) {
      setErr(e?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="public-page">
      <form className="public-card" onSubmit={onSubmit}>
        <header className="public-header">
          <div className="brand-mark">CopStopSD</div>
          <h1>Submit a Complaint</h1>
          <p className="subtitle">
            Fields marked with <RequiredAsterisk /> are required. We collect only the minimum information needed so a community advocate can follow up safely.
          </p>
        </header>

        <section className="form-section" aria-label="Contact information">
          <h2>Your Contact Information</h2>

          <div className="field-grid two-col">
            <label className="field-label">
              <span>First Name <RequiredAsterisk /></span>
              <input
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                autoComplete="given-name"
                required
              />
            </label>

            <label className="field-label">
              <span>Last Name <RequiredAsterisk /></span>
              <input
                value={last}
                onChange={(e) => setLast(e.target.value)}
                autoComplete="family-name"
                required
              />
            </label>
          </div>

          <label className="field-label">
            <span>Telephone Number <RequiredAsterisk /></span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Example: 619-555-0123"
              required
            />
          </label>
        </section>

        <section className="form-section" aria-label="Stop information">
          <h2>Stop Information</h2>

          <label className="field-label">
            <span>Law Enforcement Agency <RequiredAsterisk /></span>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Example: SDPD, Sheriff, CHP"
              required
            />
          </label>

          <div className="field-grid two-col">
            <label className="field-label">
              <span>Date of Incident <RequiredAsterisk /></span>
              <input
                type="date"
                value={stopDate}
                max={todayYYYYMMDD()}
                onChange={(e) => setStopDate(e.target.value)}
                required
              />
            </label>

            <label className="field-label">
              <span>Time of Incident <RequiredAsterisk /></span>
              <input
                type="time"
                value={stopTime}
                onChange={(e) => setStopTime(e.target.value)}
                required
              />
              <small>Current time is filled in automatically. Change it if needed.</small>
            </label>
          </div>
        </section>

        <section className="harm-wrap">
          <h2>Harm Done <RequiredAsterisk /></h2>
          <p>Select all that apply.</p>

          <div className="harm-list">
            {HARM_OPTIONS.map((harm) => {
              const checked = harms.includes(harm);

              return (
                <button
                  key={harm}
                  type="button"
                  className={checked ? "harm-row checked" : "harm-row"}
                  onClick={() => toggleHarm(harm)}
                  aria-pressed={checked}
                >
                  <span className={checked ? "box checked-box" : "box"}>
                    {checked ? "✓" : ""}
                  </span>
                  {harm}
                </button>
              );
            })}
          </div>
        </section>

        <p className="privacy-note">
          We do not ask you to describe what happened in this public form. A trained advocate will contact you to safely complete the report.
        </p>

        {err ? <p className="error" role="alert">{err}</p> : null}

        <button className="submit-btn" disabled={!canSubmit || saving}>
          {saving ? "Submitting..." : "Submit Securely"}
        </button>
      </form>
    </main>
  );
}
