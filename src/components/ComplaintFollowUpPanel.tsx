import { useEffect, useState } from "react";
import { api, ComplaintFollowUp } from "../lib/api";

const FOLLOW_UP_STATUSES = [
  "",
  "Submitted",
  "Acknowledged",
  "Under Review",
  "Investigation Open",
  "Pending Interview",
  "Referred",
  "Closed",
  "Other",
];

const FINDINGS = [
  "Miscellaneous",
  "Sustained",
  "Not Sustained",
  "Exonerated",
  "Unfounded",
];

const emptyFollowUp = (complaintId: number): ComplaintFollowUp => ({
  complaint_id: complaintId,
  original_submitted_date: null,
  original_submitted_to: [],
  original_case_note: "",
  ia_case_number: "",
  ia_status: "",
  ia_case_note: "",
  cpp_case_number: "",
  cpp_status: "",
  cpp_case_note: "",
  disposition_date: null,
  disposition_findings: ["Miscellaneous"],
  disposition_case_note: "",
});

export default function ComplaintFollowUpPanel({ complaintId }: { complaintId: number }) {
  const [data, setData] = useState<ComplaintFollowUp>(emptyFollowUp(complaintId));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getComplaintFollowUp(complaintId)
      .then((value) => {
        if (!active) return;
        setData({
          ...emptyFollowUp(complaintId),
          ...value,
          original_submitted_to: value.original_submitted_to || [],
          disposition_findings:
            value.disposition_findings?.length ? value.disposition_findings : ["Miscellaneous"],
        });
      })
      .catch((e: any) => active && setError(e?.message || "Failed to load complaint follow-up"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [complaintId]);

  function update<K extends keyof ComplaintFollowUp>(key: K, value: ComplaintFollowUp[K]) {
    setData((previous) => ({ ...previous, [key]: value }));
  }

  function toggleSubmittedTo(value: string) {
    const current = new Set(data.original_submitted_to || []);
    current.has(value) ? current.delete(value) : current.add(value);
    update("original_submitted_to", Array.from(current));
  }

  function changeFinding(index: number, value: string) {
    const next = [...(data.disposition_findings || ["Miscellaneous"])];
    next[index] = value;
    update("disposition_findings", next);
  }

  function addFinding() {
    update("disposition_findings", [...(data.disposition_findings || []), "Miscellaneous"]);
  }

  function removeFinding(index: number) {
    const next = [...(data.disposition_findings || [])];
    next.splice(index, 1);
    update("disposition_findings", next.length ? next : ["Miscellaneous"]);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const saved = await api.updateComplaintFollowUp(complaintId, data);
      setData({
        ...emptyFollowUp(complaintId),
        ...saved,
        original_submitted_to: saved.original_submitted_to || [],
        disposition_findings:
          saved.disposition_findings?.length ? saved.disposition_findings : ["Miscellaneous"],
      });
      setMessage("Complaint follow-up saved.");
    } catch (e: any) {
      setError(e?.message || "Failed to save complaint follow-up");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="border rounded-2xl p-4 bg-white">Loading complaint follow-up…</div>;
  }

  return (
    <div className="border rounded-2xl p-4 shadow-sm bg-white space-y-6">
      <div>
        <div className="font-semibold text-lg">Complaint Follow-Up</div>
        <div className="text-sm text-gray-600">
          IA and CPP case numbers are optional and may be entered now or later.
        </div>
      </div>

      {message ? <div className="text-sm text-green-700">{message}</div> : null}
      {error ? <div className="text-sm text-red-700">{error}</div> : null}

      <section className="space-y-3 border rounded-xl p-4">
        <div className="font-semibold">Original Complaint</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium">Date Submitted</span>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2"
              value={data.original_submitted_date || ""}
              onChange={(e) => update("original_submitted_date", e.target.value || null)}
            />
          </label>

          <div className="space-y-2">
            <div className="text-sm font-medium">Submitted To</div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(data.original_submitted_to || []).includes("Internal Affairs")}
                onChange={() => toggleSubmittedTo("Internal Affairs")}
              />
              Internal Affairs
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(data.original_submitted_to || []).includes("Commission on Police Practices")}
                onChange={() => toggleSubmittedTo("Commission on Police Practices")}
              />
              Commission on Police Practices
            </label>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Case Note</span>
          <textarea
            className="w-full border rounded-xl px-3 py-2 min-h-[90px]"
            value={data.original_case_note || ""}
            onChange={(e) => update("original_case_note", e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-3 border rounded-xl p-4">
        <div className="font-semibold">Internal Affairs</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium">IA Case Number — optional</span>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={data.ia_case_number || ""}
              onChange={(e) => update("ia_case_number", e.target.value)}
              placeholder="Add now or later"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">IA Status</span>
            <select
              className="w-full border rounded-xl px-3 py-2"
              value={data.ia_status || ""}
              onChange={(e) => update("ia_status", e.target.value)}
            >
              {FOLLOW_UP_STATUSES.map((status) => (
                <option key={status} value={status}>{status || "Select status"}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">IA Case Note</span>
          <textarea
            className="w-full border rounded-xl px-3 py-2 min-h-[90px]"
            value={data.ia_case_note || ""}
            onChange={(e) => update("ia_case_note", e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-3 border rounded-xl p-4">
        <div className="font-semibold">Commission on Police Practices</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium">CPP Case Number — optional</span>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={data.cpp_case_number || ""}
              onChange={(e) => update("cpp_case_number", e.target.value)}
              placeholder="Add now or later"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">CPP Status</span>
            <select
              className="w-full border rounded-xl px-3 py-2"
              value={data.cpp_status || ""}
              onChange={(e) => update("cpp_status", e.target.value)}
            >
              {FOLLOW_UP_STATUSES.map((status) => (
                <option key={status} value={status}>{status || "Select status"}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">CPP Case Note</span>
          <textarea
            className="w-full border rounded-xl px-3 py-2 min-h-[90px]"
            value={data.cpp_case_note || ""}
            onChange={(e) => update("cpp_case_note", e.target.value)}
          />
        </label>
      </section>

      <section className="space-y-3 border rounded-xl p-4">
        <div className="font-semibold">Final Disposition</div>
        <label className="block max-w-sm space-y-1">
          <span className="text-sm font-medium">Disposition Date</span>
          <input
            type="date"
            className="w-full border rounded-xl px-3 py-2"
            value={data.disposition_date || ""}
            onChange={(e) => update("disposition_date", e.target.value || null)}
          />
        </label>

        <div className="space-y-3">
          {(data.disposition_findings || ["Miscellaneous"]).map((finding, index) => (
            <div key={index} className="flex flex-wrap items-end gap-2">
              <label className="space-y-1 grow max-w-md">
                <span className="text-sm font-medium">Finding {index + 1}</span>
                <select
                  className="w-full border rounded-xl px-3 py-2"
                  value={finding}
                  onChange={(e) => changeFinding(index, e.target.value)}
                >
                  {FINDINGS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              {index > 0 ? (
                <button
                  type="button"
                  className="px-3 py-2 border rounded-xl text-red-700"
                  onClick={() => removeFinding(index)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
          <button type="button" className="px-3 py-2 border rounded-xl" onClick={addFinding}>
            + Add Another Finding
          </button>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Disposition Case Note</span>
          <textarea
            className="w-full border rounded-xl px-3 py-2 min-h-[110px]"
            value={data.disposition_case_note || ""}
            onChange={(e) => update("disposition_case_note", e.target.value)}
          />
        </label>
      </section>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Complaint Follow-Up"}
      </button>

      <div className="text-xs text-gray-500">
        Document uploads will be added in the next phase after these fields are confirmed working.
      </div>
    </div>
  );
}
