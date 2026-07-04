import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, CaseNote, Officer } from "../lib/api";

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export default function OfficerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const officerId = Number(id);

  const [officer, setOfficer] = useState<Officer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [edit, setEdit] = useState({
    first_name: "",
    last_name: "",
    badge_number: "",
    department: "",
    unit: "",
  });

  // Case notes
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("");
  const [noteErr, setNoteErr] = useState<string | null>(null);
  const canAddNote = useMemo(() => noteText.trim().length > 0, [noteText]);

  useEffect(() => {
    if (!officerId || Number.isNaN(officerId)) {
      setError("Invalid officer id");
      setLoading(false);
      return;
    }
    loadOfficer();
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officerId]);

  async function loadOfficer() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOfficer(officerId);
      setOfficer(data);
      setEdit({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        badge_number: data.badge_number || "",
        department: data.department || "",
        unit: data.unit || "",
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load officer");
    } finally {
      setLoading(false);
    }
  }

  async function loadNotes() {
    try {
      setNotesLoading(true);
      setNoteErr(null);
      const data = await api.listCaseNotes("officer", officerId);
      setNotes(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setNoteErr(e?.message || "Failed to load case notes");
    } finally {
      setNotesLoading(false);
    }
  }

  async function saveOfficer() {
    if (!officer) return;

    setSaving(true);
    setSaveMsg(null);
    setError(null);

    try {
      const payload: Partial<Officer> = {
        first_name: edit.first_name.trim(),
        last_name: edit.last_name.trim(),
        badge_number: edit.badge_number.trim() || null,
        department: edit.department.trim() || null,
        unit: edit.unit.trim() || null,
      };

      if (!payload.first_name || !payload.last_name) {
        throw new Error("First name and last name are required.");
      }

      const updated = await api.updateOfficer(officerId, payload);
      setOfficer(updated);
      setSaveMsg("Officer saved.");
    } catch (e: any) {
      setError(e?.message || "Failed to save officer");
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    if (!canAddNote) return;

    setNoteErr(null);
    try {
      await api.addCaseNote({
        entity_type: "officer",
        entity_id: officerId,
        note_text: noteText.trim(),
        note_type: noteType.trim() || null,
        note_date: todayYmd(), // DB requires not-null; safe even if backend defaults
      });
      setNoteText("");
      setNoteType("");
      await loadNotes();
    } catch (e: any) {
      setNoteErr(e?.message || "Failed to add note");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => navigate("/officers")}
          className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-100"
        >
          ← Back to Officer Database
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Officer Details</h1>
        <p className="text-sm text-gray-600">Edit officer info and attach case notes.</p>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="border border-red-200 bg-red-50 text-red-800 p-3 rounded-xl text-sm">{error}</div>}
      {saveMsg && <div className="border border-green-200 bg-green-50 text-green-800 p-3 rounded-xl text-sm">{saveMsg}</div>}

      {!loading && officer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Edit officer */}
          <div className="border rounded-2xl p-4 space-y-3">
            <div className="font-semibold">Edit Officer</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">First Name</label>
                <input
                  className="w-full border rounded-xl px-3 py-2 hover:border-gray-400 focus:border-gray-500 focus:outline-none"
                  value={edit.first_name}
                  onChange={(e) => setEdit({ ...edit, first_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Last Name</label>
                <input
                  className="w-full border rounded-xl px-3 py-2 hover:border-gray-400 focus:border-gray-500 focus:outline-none"
                  value={edit.last_name}
                  onChange={(e) => setEdit({ ...edit, last_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Badge Number</label>
                <input
                  className="w-full border rounded-xl px-3 py-2 hover:border-gray-400 focus:border-gray-500 focus:outline-none"
                  value={edit.badge_number}
                  onChange={(e) => setEdit({ ...edit, badge_number: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs text-gray-600">Department</label>
                <input
                  className="w-full border rounded-xl px-3 py-2 hover:border-gray-400 focus:border-gray-500 focus:outline-none"
                  value={edit.department}
                  onChange={(e) => setEdit({ ...edit, department: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Unit</label>
                <input
                  className="w-full border rounded-xl px-3 py-2 hover:border-gray-400 focus:border-gray-500 focus:outline-none"
                  value={edit.unit}
                  onChange={(e) => setEdit({ ...edit, unit: e.target.value })}
                />
              </div>
            </div>

            <button
              onClick={saveOfficer}
              disabled={saving}
              className="border rounded-xl px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Officer"}
            </button>
          </div>

          {/* Officer case notes */}
          <div className="border rounded-2xl p-4 space-y-3">
            <div className="font-semibold">Case Notes (Officer)</div>

            {noteErr && (
              <div className="border border-red-200 bg-red-50 text-red-800 p-3 rounded-xl text-sm">{noteErr}</div>
            )}

            <div className="grid gap-2">
              <label className="text-xs text-gray-600">Note Type (optional)</label>
              <input
                className="w-full border rounded-xl px-3 py-2 hover:border-gray-400 focus:border-gray-500 focus:outline-none"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                placeholder="e.g., Follow-up, IA, Evidence, Interview"
              />

              <label className="text-xs text-gray-600 mt-2">New Note</label>
              <textarea
                className="w-full border rounded-xl px-3 py-2 min-h-[110px] hover:border-gray-400 focus:border-gray-500 focus:outline-none"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a case note…"
              />

              <button
                onClick={addNote}
                disabled={!canAddNote}
                className="border rounded-xl px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Add Note
              </button>
            </div>

            <div className="pt-3 border-t">
              {notesLoading ? (
                <div>Loading notes…</div>
              ) : notes.length === 0 ? (
                <div className="text-sm text-gray-500">No notes yet.</div>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-xl border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{n.note_type || "Note"}</span>
                          <span>•</span>
                          <span>{n.note_date || ""}</span>
                        </div>
                        <div>{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</div>
                      </div>
                      <div className="mt-2 text-sm whitespace-pre-wrap">{n.note_text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
