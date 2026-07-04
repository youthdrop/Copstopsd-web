import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { api } from "../lib/api";

const DEPARTMENTS = ["SDPD", "Vista", "El Cajon", "Chula Vista", "National City", "Oceanside", "Sheriff"] as const;

// ✅ Match MOBILE “Harms done” options
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

const DRAFT_KEY = "complaint_new_draft_v8";
const SCROLL_KEY = "complaint_new_scroll_y_v8";

type Department = (typeof DEPARTMENTS)[number];
type HarmType = (typeof HARM_OPTIONS)[number];

type ComplaintDraft = {
  complainantFirstName: string;
  complainantLastName: string;
  complainantPhone: string;
  stopDate: string;
  stopTime: string;
  stopLocation: string;
  department: Department;
  unit: string;
  harmTypes: HarmType[];
  narrative: string;
  officerIds: number[];
};

const EMPTY_DRAFT: ComplaintDraft = {
  complainantFirstName: "",
  complainantLastName: "",
  complainantPhone: "",
  stopDate: "",
  stopTime: "",
  stopLocation: "",
  department: DEPARTMENTS[0],
  unit: "",
  harmTypes: [],
  narrative: "",
  officerIds: [],
};

function parseCsvIds(csv: string | null | undefined): number[] {
  if (!csv) return [];
  const set = new Set<number>();
  for (const part of csv.split(",")) {
    const n = Number(part.trim());
    if (Number.isFinite(n) && n > 0) set.add(n);
  }
  return Array.from(set).sort((a, b) => a - b);
}

function cleanOfficerIds(ids: unknown): number[] {
  if (!Array.isArray(ids)) return [];
  return Array.from(
    new Set(
      ids
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
  ).sort((a, b) => a - b);
}

function cleanHarms(values: unknown): HarmType[] {
  if (!Array.isArray(values)) return [];
  return values.filter((x): x is HarmType => (HARM_OPTIONS as readonly string[]).includes(String(x)));
}

function normalizeDraft(raw: any): ComplaintDraft {
  return {
    complainantFirstName: raw?.complainantFirstName ?? "",
    complainantLastName: raw?.complainantLastName ?? "",
    complainantPhone: raw?.complainantPhone ?? "",
    stopDate: raw?.stopDate ?? "",
    stopTime: raw?.stopTime ?? "",
    stopLocation: raw?.stopLocation ?? "",
    department: (DEPARTMENTS as readonly string[]).includes(raw?.department) ? raw.department : DEPARTMENTS[0],
    unit: raw?.unit ?? "",
    harmTypes: cleanHarms(raw?.harmTypes ?? raw?.harm_types),
    narrative: raw?.narrative ?? "",
    officerIds: cleanOfficerIds(raw?.officerIds),
  };
}

function loadStoredDraft(): ComplaintDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY) || sessionStorage.getItem(DRAFT_KEY);
    return raw ? normalizeDraft(JSON.parse(raw)) : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

function saveStoredDraft(draft: ComplaintDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage errors
  }
}

export default function ComplaintNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const hydratedRef = useRef(false);

  const initial = loadStoredDraft();

  const [complainantFirstName, setComplainantFirstName] = useState(initial.complainantFirstName);
  const [complainantLastName, setComplainantLastName] = useState(initial.complainantLastName);
  const [complainantPhone, setComplainantPhone] = useState(initial.complainantPhone);

  const [stopDate, setStopDate] = useState(initial.stopDate);
  const [stopTime, setStopTime] = useState(initial.stopTime); // HH:MM
  const [stopLocation, setStopLocation] = useState(initial.stopLocation);
  const [department, setDepartment] = useState<Department>(initial.department);
  const [unit, setUnit] = useState(initial.unit);
  const [harmTypes, setHarmTypes] = useState<HarmType[]>(initial.harmTypes);
  const [narrative, setNarrative] = useState(initial.narrative);

  const [officerIds, setOfficerIds] = useState<number[]>(initial.officerIds);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [missing, setMissing] = useState<string[]>([]);

  const currentDraft: ComplaintDraft = useMemo(
    () => ({
      complainantFirstName,
      complainantLastName,
      complainantPhone,
      stopDate,
      stopTime,
      stopLocation,
      department,
      unit,
      harmTypes,
      narrative,
      officerIds,
    }),
    [
      complainantFirstName,
      complainantLastName,
      complainantPhone,
      stopDate,
      stopTime,
      stopLocation,
      department,
      unit,
      harmTypes,
      narrative,
      officerIds,
    ]
  );

  function applyDraft(draft: ComplaintDraft) {
    setComplainantFirstName(draft.complainantFirstName);
    setComplainantLastName(draft.complainantLastName);
    setComplainantPhone(draft.complainantPhone);
    setStopDate(draft.stopDate);
    setStopTime(draft.stopTime);
    setStopLocation(draft.stopLocation);
    setDepartment(draft.department);
    setUnit(draft.unit);
    setHarmTypes(draft.harmTypes);
    setNarrative(draft.narrative);
    setOfficerIds(draft.officerIds);
  }

  // ----------------------------
  // Restore draft from router state first, then storage
  // ----------------------------
  useEffect(() => {
    const st: any = location.state;

    if (st?.draft) {
      const draft = normalizeDraft(st.draft);
      applyDraft(draft);
      saveStoredDraft(draft);
    }

    const y = localStorage.getItem(SCROLL_KEY) || sessionStorage.getItem(SCROLL_KEY);
    if (y) {
      const n = Number(y);
      if (Number.isFinite(n)) requestAnimationFrame(() => window.scrollTo(0, n));
    }

    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------
  // Save draft as user types
  // ----------------------------
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveStoredDraft(currentDraft);
  }, [currentDraft]);

  // remember scroll
  useEffect(() => {
    const handler = () => {
      try {
        const y = String(window.scrollY || 0);
        localStorage.setItem(SCROLL_KEY, y);
        sessionStorage.setItem(SCROLL_KEY, y);
      } catch {
        // ignore
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // ----------------------------
  // Read selected officers from URL query params OR router state
  // ----------------------------
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const fromQuery = parseCsvIds(qs.get("selectedOfficerIds") || qs.get("selectedOfficerId"));

    const st: any = location.state;
    const fromState = cleanOfficerIds(st?.selectedOfficerIds);

    const merged = Array.from(new Set([...officerIds, ...fromQuery, ...fromState])).sort((a, b) => a - b);

    const same = merged.length === officerIds.length && merged.every((v, i) => v === officerIds[i]);

    if (!same) {
      setOfficerIds(merged);
      saveStoredDraft({ ...currentDraft, officerIds: merged });
    }

    // Clear selected officer query params without triggering a React remount/navigation.
    if (fromQuery.length) {
      qs.delete("selectedOfficerIds");
      qs.delete("selectedOfficerId");
      const newSearch = qs.toString();
      const cleanUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ""}`;
      window.history.replaceState(location.state ?? {}, document.title, cleanUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.state]);

  function toggleHarm(t: HarmType) {
    setHarmTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function validate() {
    const m: string[] = [];
    if (!complainantFirstName.trim()) m.push("First name");
    if (!complainantLastName.trim()) m.push("Last name");
    if (!stopDate) m.push("Date of stop");
    if (!department) m.push("Department");
    if (!narrative.trim()) m.push("Narrative");
    return m;
  }

  async function onSave() {
    setSaving(true);
    setError("");
    setStatusMsg("");

    const m = validate();
    setMissing(m);
    if (m.length) {
      setError(`Missing required fields: ${m.join(", ")}`);
      setSaving(false);
      return;
    }

    try {
      const payload: any = {
        complainant_first_name: complainantFirstName.trim(),
        complainant_last_name: complainantLastName.trim(),
        complainant_phone: complainantPhone.trim() || null,
        stop_date: stopDate,
        stop_time: stopTime || null,
        stop_location: stopLocation.trim() || null,
        department,
        unit: unit.trim() || null,
        narrative: narrative.trim(),
        harm_types: harmTypes,
        officer_ids: officerIds,
      };

      const created = await api.createComplaint(payload);

      // clear draft after save
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(SCROLL_KEY);
      sessionStorage.removeItem(DRAFT_KEY);
      sessionStorage.removeItem(SCROLL_KEY);

      const id = (created as any)?.id;
      setStatusMsg("Saved.");
      if (id) navigate(`/complaints/${id}`);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to save complaint");
    } finally {
      setSaving(false);
    }
  }

  function goToOfficers() {
    saveStoredDraft(currentDraft);
    try {
      const y = String(window.scrollY || 0);
      localStorage.setItem(SCROLL_KEY, y);
      sessionStorage.setItem(SCROLL_KEY, y);
    } catch {
      // ignore
    }

    navigate(`/officers?returnTo=/complaints/new&selectedOfficerIds=${officerIds.join(",")}`, {
      state: { draft: currentDraft },
    });
  }

  const officerHint = useMemo(() => {
    if (!officerIds.length) return "No officers selected yet.";
    if (officerIds.length === 1) return `Selected officer ID: ${officerIds[0]}`;
    return `Selected officer IDs: ${officerIds.join(", ")}`;
  }, [officerIds]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">New Complaint</h1>
          <div className="text-sm text-gray-600">Enter the stop details and save to the database.</div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/dashboard")}>Back</Button>
        </div>
      </div>

      {error ? <div className="text-red-700 text-sm">{error}</div> : null}
      {statusMsg ? <div className="text-green-700 text-sm">{statusMsg}</div> : null}
      {missing.length ? <div className="text-xs text-red-600">Please complete: {missing.join(", ")}</div> : null}

      <div className="border rounded p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">First Name *</label>
            <input className="w-full border rounded px-3 py-2" value={complainantFirstName} onChange={(e) => setComplainantFirstName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Last Name *</label>
            <input className="w-full border rounded px-3 py-2" value={complainantLastName} onChange={(e) => setComplainantLastName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telephone Number</label>
            <input className="w-full border rounded px-3 py-2" value={complainantPhone} onChange={(e) => setComplainantPhone(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date of Stop *</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={stopDate} onChange={(e) => setStopDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Time of Stop</label>
            <input type="time" className="w-full border rounded px-3 py-2" value={stopTime} onChange={(e) => setStopTime(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input className="w-full border rounded px-3 py-2" value={stopLocation} onChange={(e) => setStopLocation(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Department *</label>
            <select className="w-full border rounded px-3 py-2" value={department} onChange={(e) => setDepartment(e.target.value as Department)}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <input className="w-full border rounded px-3 py-2" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Harms Done</label>
            <div className="flex flex-wrap gap-2">
              {HARM_OPTIONS.map((t) => {
                const active = harmTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleHarm(t)}
                    className={`px-3 py-2 rounded border text-sm ${active ? "bg-black text-white border-black" : "bg-white border-gray-300 hover:bg-gray-50"}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              This matches the mobile app and saves to <code>harm_types</code>.
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="block text-sm font-medium">Description / Narrative *</label>
              <div className="text-xs text-gray-500">{officerHint}</div>
            </div>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[140px]"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="What happened? Include as much detail as possible."
            />
            <div className="mt-2 text-xs text-gray-600">
              Want to select officers?{" "}
              <button type="button" className="underline" onClick={goToOfficers}>
                Go to Officers
              </button>{" "}
              •{" "}
              <button type="button" className="underline" onClick={() => setOfficerIds([])}>
                Clear selected officers
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button disabled={saving} onClick={onSave}>
            {saving ? "Saving..." : "Save Complaint"}
          </Button>

          <Button
            disabled={saving}
            onClick={() => {
              localStorage.removeItem(DRAFT_KEY);
              localStorage.removeItem(SCROLL_KEY);
              sessionStorage.removeItem(DRAFT_KEY);
              sessionStorage.removeItem(SCROLL_KEY);
              applyDraft(EMPTY_DRAFT);
              setStatusMsg("Draft cleared.");
            }}
          >
            Clear Draft
          </Button>
        </div>
      </div>
    </div>
  );
}
