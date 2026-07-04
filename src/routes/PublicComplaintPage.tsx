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
  const [stopTime, setStopTime] = useState("");
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
      };

      const resp = await submitPublicIntake(payload);

      navigate(
        resp?.case_number
          ? `/complaint/thank-you?case=${encodeURIComponent(resp.case_number)}`
          : "/complaint/thank-you"
      );
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mobile-match-page">
      <form className="mobile-match-card" onSubmit={onSubmit}>
        <h1>Submit a Complaint</h1>
        <p className="subtitle">
          Public intake form — your report is sent directly to our system.
        </p>

        <input
          placeholder="First name"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
        />

        <input
          placeholder="Last name"
          value={last}
          onChange={(e) => setLast(e.target.value)}
        />

        <input
          placeholder="Telephone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          placeholder="Department (e.g., SDPD, SD Sheriff, CHP)"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />

        <input
          type="date"
          value={stopDate}
          max={todayYYYYMMDD()}
          onChange={(e) => setStopDate(e.target.value)}
        />

        <input
          type="time"
          value={stopTime}
          onChange={(e) => setStopTime(e.target.value)}
        />

        <section className="harm-wrap">
          <h2>Harm done *</h2>
          <p>Select all that apply.</p>

          {HARM_OPTIONS.map((harm) => {
            const checked = harms.includes(harm);

            return (
              <button
                key={harm}
                type="button"
                className={checked ? "harm-row checked" : "harm-row"}
                onClick={() => toggleHarm(harm)}
              >
                <span className={checked ? "box checked-box" : "box"}>
                  {checked ? "✓" : ""}
                </span>
                {harm}
              </button>
            );
          })}
        </section>

        {err ? <p className="error">{err}</p> : null}

        <button className="submit-btn" disabled={!canSubmit || saving}>
          {saving ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </main>
  );
}