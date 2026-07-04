import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, Officer } from "../lib/api";
import { Input } from "../components/Input";
import { useAuth } from "../auth/AuthContext";

const DEPARTMENTS = ["", "SDPD", "Vista", "El Cajon", "Chula Vista", "National City", "Oceanside", "Sheriff"] as const;
type Department = (typeof DEPARTMENTS)[number];

type OfficerCreatePayload = {
  first_name: string;
  last_name: string;
  badge_number: string | null;
  department: string | null;
  unit: string | null;
};

const OFFICERS_SCROLL_KEY = "officers_scroll_y_v3";

/** Parse a CSV like "1,2,3" into a Set<number> */
function parseCsvIds(csv: string | null): Set<number> {
  if (!csv) return new Set();
  const out = new Set<number>();
  for (const part of csv.split(",")) {
    const n = Number(part.trim());
    if (Number.isFinite(n) && n > 0) out.add(n);
  }
  return out;
}

function csvFromSet(ids: Set<number>) {
  return Array.from(ids).sort((a, b) => a - b).join(",");
}

/**
 * Safely append query params to a returnTo URL that may already contain "?"
 * Always writes selectedOfficerIds (csv) for consistency.
 * Keeps selectedOfficerId too for backward compatibility.
 */
function withSelectedOfficer(returnTo: string, selectedCsv: string | null, officerId: number) {
  const [path, queryString = ""] = returnTo.split("?");
  const params = new URLSearchParams(queryString);

  const ids = parseCsvIds(params.get("selectedOfficerIds"));
  for (const id of parseCsvIds(selectedCsv)) ids.add(id);
  ids.add(officerId);

  params.set("selectedOfficerIds", csvFromSet(ids));
  params.set("selectedOfficerId", String(officerId));

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export default function Officers() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const returnTo = params.get("returnTo") || "";

  const selectedCsv = params.get("selectedOfficerIds");
  const selectedSet = useMemo(() => parseCsvIds(selectedCsv), [selectedCsv]);

  const [q, setQ] = useState("");
  const [items, setItems] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [status, setStatus] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    badge_number: "",
    department: "" as Department,
    unit: "",
  });

  const routeState: any = location.state || {};

  async function load(q?: string) {
    setErr(null);
    setLoading(true);
    try {
      const query = (q ?? "").trim();
      const data = await api.listOfficers(query);
      setItems(Array.isArray(data) ? (data as Officer[]) : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load officers";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const raw = sessionStorage.getItem(OFFICERS_SCROLL_KEY);
    if (raw) {
      const y = Number(raw);
      if (Number.isFinite(y)) {
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function returnWithOfficer(officerId: number) {
    sessionStorage.setItem(OFFICERS_SCROLL_KEY, String(window.scrollY));

    if (!returnTo) {
      navigate(`/officers/${officerId}`);
      return;
    }

    const url = withSelectedOfficer(returnTo, selectedCsv, officerId);
    const ids = parseCsvIds(selectedCsv);
    ids.add(officerId);

    navigate(url, {
      state: {
        draft: routeState?.draft,
        selectedOfficerIds: Array.from(ids).sort((a, b) => a - b),
      },
    });
  }

  async function submit() {
    setErr(null);
    setStatus(null);

    const payload: OfficerCreatePayload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      badge_number: form.badge_number.trim() || null,
      department: form.department || null,
      unit: form.unit.trim() || null,
    };

    if (!payload.first_name || !payload.last_name) {
      setErr("First name and last name are required.");
      return;
    }

    try {
      const created = await api.createOfficer(payload);

      setStatus("Officer added.");
      setForm({
        first_name: "",
        last_name: "",
        badge_number: "",
        department: "" as Department,
        unit: "",
      });

      await load(q);

      // If we were called from ComplaintNew, return immediately with officer selected.
      if (returnTo) {
        returnWithOfficer(created.id);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create officer";
      setErr(msg);
    }
  }

  function onSelect(officerId: number) {
    returnWithOfficer(officerId);
  }

  function goDetail(officerId: number) {
    sessionStorage.setItem(OFFICERS_SCROLL_KEY, String(window.scrollY));
    navigate(`/officers/${officerId}`);
  }

  function goBack() {
    sessionStorage.setItem(OFFICERS_SCROLL_KEY, String(window.scrollY));

    if (returnTo) {
      navigate(returnTo, {
        state: {
          draft: routeState?.draft,
          selectedOfficerIds: Array.from(selectedSet).sort((a, b) => a - b),
        },
      });
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Officers</h1>
          {returnTo ? (
            <div className="text-sm text-gray-600">
              Selecting officer(s) for: <span className="font-mono">{returnTo}</span>
            </div>
          ) : null}
        </div>
        <button className="px-3 py-2 rounded border hover:bg-gray-50" onClick={goBack}>
          Back
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search officers..." />
        <button className="px-3 py-2 rounded border hover:bg-gray-50" onClick={() => load(q)} disabled={loading}>
          Search
        </button>
        <button
          className="px-3 py-2 rounded border hover:bg-gray-50"
          onClick={() => {
            setQ("");
            load("");
          }}
          disabled={loading}
        >
          Clear
        </button>
      </div>

      {/* Add officer */}
      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold">Add Officer</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input value={form.first_name} onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))} placeholder="First name" />
          <Input value={form.last_name} onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))} placeholder="Last name" />
          <Input value={form.badge_number} onChange={(e) => setForm((s) => ({ ...s, badge_number: e.target.value }))} placeholder="Badge # (optional)" />

          <select
            className="border rounded px-3 py-2"
            value={form.department}
            onChange={(e) => setForm((s) => ({ ...s, department: e.target.value as Department }))}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d || "Department (optional)"}
              </option>
            ))}
          </select>

          <Input value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} placeholder="Unit (optional)" />
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50" onClick={submit} disabled={loading}>
            Add
          </button>

          {status ? <span className="text-sm text-green-700">{status}</span> : null}
          {err ? <span className="text-sm text-red-700">{err}</span> : null}
        </div>
      </div>

      {/* List */}
      <div className="border rounded">
        <div className="px-4 py-3 border-b font-semibold flex items-center justify-between">
          <span>Results</span>
          {loading ? <span className="text-sm text-gray-600">Loading…</span> : null}
        </div>

        <div className="divide-y">
          {items.length === 0 && !loading ? <div className="p-4 text-sm text-gray-600">No officers found.</div> : null}

          {items.map((o) => {
            const selected = selectedSet.has(o.id);

            return (
              <div key={o.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {o.first_name} {o.last_name}{" "}
                    {selected ? <span className="ml-2 text-xs px-2 py-0.5 rounded bg-black text-white">Selected</span> : null}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {o.department || "—"} {o.unit ? `• ${o.unit}` : ""} {o.badge_number ? `• Badge ${o.badge_number}` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {returnTo ? (
                    <button className="px-3 py-2 rounded border hover:bg-gray-50" onClick={() => onSelect(o.id)}>
                      Select
                    </button>
                  ) : (
                    <button className="px-3 py-2 rounded border hover:bg-gray-50" onClick={() => goDetail(o.id)}>
                      View
                    </button>
                  )}

                  {isAdmin ? (
                    <button
                      onClick={async () => {
                        const yes = window.confirm(`Delete officer ${o.first_name} ${o.last_name}?`);
                        if (!yes) return;

                        try {
                          await api.deleteOfficer(o.id);
                          setItems((prev) => prev.filter((x) => x.id !== o.id));
                        } catch (e: any) {
                          alert(e?.message || "Failed to delete officer");
                        }
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:border-red-300 transition"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
