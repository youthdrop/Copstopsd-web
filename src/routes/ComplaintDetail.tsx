import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import ComplaintFollowUpPanel from "../components/ComplaintFollowUpPanel";
import { api } from "../lib/api";

type CaseNote = {
  id: number;
  entity_type: "complaint" | "officer";
  entity_id: number;
  note_text: string;
  note_type?: string | null;
  note_date?: string | null;
  created_at?: string | null;
};

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

function toHHMM(v: any) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 5);
  return "";
}

function harmFromComplaint(c: any): string[] {
  if (Array.isArray(c?.harm_types)) return c.harm_types.filter(Boolean).map(String);
  if (Array.isArray(c?.types)) return c.types.filter(Boolean).map(String);
  if (typeof c?.harm_done === "string" && c.harm_done.trim()) {
    return c.harm_done.split(",").map((x: string) => x.trim()).filter(Boolean);
  }
  return [];
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const complaintId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingOfficerId, setRemovingOfficerId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [complaint, setComplaint] = useState<any>(null);

  const [status, setStatus] = useState("open");
  const [unit, setUnit] = useState("");
  const [stopLocation, setStopLocation] = useState("");
  const [stopTime, setStopTime] = useState("");
  const [narrative, setNarrative] = useState("");
  const [harmTypes, setHarmTypes] = useState<string[]>([]);

  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [noteText, setNoteText] = useState("");

  const officers = useMemo(() => complaint?.officers ?? [], [complaint]);

  function toggleHarm(h: string) {
    setHarmTypes((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  }

  function currentOfficerIds(): number[] {
    return (officers || [])
      .map((o: any) => Number(o.id))
      .filter((n: number) => Number.isFinite(n) && n > 0);
  }


  async function loadAll() {
    setLoading(true);
    setError("");
    setStatusMsg("");

    try {
      if (!Number.isFinite(complaintId) || complaintId <= 0) {
        throw new Error("Invalid complaint id");
      }

      const c = await api.getComplaint(complaintId);
      setComplaint(c);

      setStatus(c.status ?? "open");
      setUnit(c.unit ?? "");
      setStopLocation(c.stop_location ?? "");
      setStopTime(toHHMM(c.stop_time));
      setNarrative(c.narrative ?? "");
      setHarmTypes(harmFromComplaint(c));

      try {
        const n = await api.listCaseNotes("complaint", complaintId);
        setNotes(n || []);
      } catch {
        setNotes([]);
      }
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Failed to load complaint");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  async function saveUpdates() {
    setSaving(true);
    setError("");
    setStatusMsg("");

    try {
      const payload: any = {
        status: status.trim() || "open",
        unit: unit.trim() || null,
        stop_location: stopLocation.trim() || null,
        stop_time: stopTime || null,
        narrative: narrative.trim() || null,
        harm_types: harmTypes,
        officer_ids: currentOfficerIds(),
      };

      const updated = await api.updateComplaint(complaintId, payload);
      setComplaint(updated);
      setStatusMsg("Saved.");
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveOfficerIds(ids: number[], message: string) {
    await api.updateComplaint(complaintId, { officer_ids: ids });

    // Re-fetch the complaint so the officers relationship is fully refreshed.
    // Some API responses save officer_ids correctly but do not immediately
    // return the populated officers list.
    const refreshed = await api.getComplaint(complaintId);
    setComplaint(refreshed);
    setStatusMsg(message);
  }

  async function removeOfficer(officerId: number) {
    const previousComplaint = complaint;
    const remainingIds = currentOfficerIds().filter((id) => id !== officerId);

    setSaving(true);
    setRemovingOfficerId(officerId);
    setError("");
    setStatusMsg("");

    // Remove the officer from the screen immediately. If the API request fails,
    // restore the prior complaint state below.
    setComplaint((current: any) => ({
      ...current,
      officers: (current?.officers ?? []).filter(
        (officer: any) => Number(officer.id) !== officerId
      ),
      officer_ids: remainingIds,
    }));

    try {
      await api.updateComplaint(complaintId, { officer_ids: remainingIds });

      // Re-fetch from the server to keep the relationship synchronized.
      const refreshed = await api.getComplaint(complaintId);
      setComplaint(refreshed);
      setStatusMsg("Officer removed.");
    } catch (e: any) {
      setComplaint(previousComplaint);
      setError(typeof e?.message === "string" ? e.message : "Could not remove officer");
    } finally {
      setRemovingOfficerId(null);
      setSaving(false);
    }
  }



  async function addNote() {
    if (!noteText.trim()) return;

    setSaving(true);
    setError("");
    setStatusMsg("");

    try {
      await api.addCaseNote({
        entity_type: "complaint",
        entity_id: complaintId,
        note_text: noteText.trim(),
      });

      setNoteText("");

      const n = await api.listCaseNotes("complaint", complaintId);
      setNotes(n || []);
      setStatusMsg("Note added.");
    } catch (e: any) {
      setError(typeof e?.message === "string" ? e.message : "Add note failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-gray-600">Loading complaint…</div>;

  if (error && !complaint) {
    return (
      <div className="space-y-4">
        <div className="border rounded-xl p-3 bg-white">
          <div className="text-sm font-semibold text-red-700">Error</div>
          <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{error}</div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/complaints")}
          className="underline text-sm"
        >
          ← Back to complaints
        </button>
      </div>
    );
  }

  if (!complaint) return null;

  const harmsToShow = harmFromComplaint(complaint);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Complaint #{complaint.case_number ?? complaint.id}
          </h1>
          <p className="text-sm text-gray-600">
            {complaint.complainant_last_name}, {complaint.complainant_first_name} •{" "}
            {complaint.stop_date} • {complaint.department}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/complaints")}
            className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-100"
          >
            ← Back to Complaints
          </button>
        </div>
      </div>

      {statusMsg ? <div className="text-sm text-gray-700">{statusMsg}</div> : null}
      {error ? (
        <div className="border rounded-xl p-3 bg-red-50 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="border rounded-2xl p-4 shadow-sm bg-white space-y-3">
        <div className="font-semibold">Complaint Details</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">Telephone Number</div>
            <div className="font-medium">{complaint.complainant_phone || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Time of Stop</div>
            <div className="font-medium">{toHHMM(complaint.stop_time) || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Location</div>
            <div className="font-medium">{complaint.stop_location || "—"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Unit</div>
            <div className="font-medium">{complaint.unit || "—"}</div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-gray-500">Harms Done</div>
            <div className="font-medium">
              {harmsToShow.length ? harmsToShow.join(", ") : "—"}
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-500">Officers Involved</div>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/officers?complaintId=${complaintId}&returnTo=${encodeURIComponent(`/complaints/${complaintId}`)}`
                  )
                }
                className="px-3 py-2 text-sm border rounded-xl hover:bg-gray-50"
              >
                + Add Officer
              </button>
            </div>

            {officers?.length ? (
              <div className="space-y-2">
                {officers.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/officers/${o.id}`)}
                      className="text-left min-w-0"
                    >
                      <div className="font-medium">{o.first_name} {o.last_name}</div>
                      <div className="text-sm text-gray-500">
                        {o.badge_number ? `Badge ${o.badge_number}` : "No badge listed"}
                        {o.department ? ` • ${o.department}` : ""}
                        {o.unit ? ` • ${o.unit}` : ""}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeOfficer(Number(o.id))}
                      className="px-3 py-2 text-sm border rounded-xl text-red-700"
                      disabled={saving}
                    >
                      {removingOfficerId === Number(o.id) ? "Removing…" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No officers attached yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="border rounded-2xl p-4 shadow-sm bg-white space-y-4">
        <div className="font-semibold">Edit Complaint</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Unit</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Stop Location</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={stopLocation}
              onChange={(e) => setStopLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Time of Stop</label>
            <input
              type="time"
              className="w-full border rounded-xl px-3 py-2"
              value={stopTime}
              onChange={(e) => setStopTime(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Narrative</label>
            <textarea
              className="w-full border rounded-xl px-3 py-2 min-h-[140px]"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Harms Done</label>
            <div className="flex flex-wrap gap-2">
              {HARM_OPTIONS.map((h) => {
                const active = harmTypes.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleHarm(h)}
                    className={`px-3 py-2 rounded-xl border text-sm ${
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white hover:bg-gray-50 border-gray-300"
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-gray-500">
              This saves to <code>harm_types</code> in the database.
            </div>
          </div>

        </div>

        <div className="flex items-center gap-2">
          <Button disabled={saving} onClick={saveUpdates}>
            {saving ? "Saving…" : "Save Updates"}
          </Button>
        </div>
      </div>

      <ComplaintFollowUpPanel complaintId={complaintId} />

      <div className="border rounded-2xl p-4 shadow-sm bg-white space-y-3">
        <div className="font-semibold">Case Notes</div>

        <textarea
          className="w-full border rounded-xl px-3 py-2 min-h-[90px]"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a case note…"
        />

        <div className="flex items-center gap-2">
          <Button disabled={saving || !noteText.trim()} onClick={addNote}>
            Add Note
          </Button>
        </div>

        {notes?.length ? (
          <div className="space-y-3 pt-2">
            {notes.map((n) => (
              <div key={n.id} className="border rounded-xl p-3">
                <div className="text-xs text-gray-500">
                  {n.note_type ?? "Note"} • {n.note_date ?? ""} • {n.created_at ?? ""}
                </div>
                <div className="text-sm mt-1 whitespace-pre-wrap">{n.note_text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No notes yet.</div>
        )}
      </div>

    </div>
  );
}
