import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, Complaint } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

export default function Complaints() {
  const navigate = useNavigate();
  const { isAdmin, refreshUser } = useAuth();

  const [rows, setRows] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshUser();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.listComplaints();
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Complaint Database</h1>
          <p className="text-sm text-gray-600">View and edit complaint records.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-100"
          >
            ← Back to Dashboard
          </button>

          <Link
            to="/complaints/new"
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-100"
          >
            Add Complaint
          </Link>
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left text-sm font-medium">Case #</th>
                <th className="p-2 text-left text-sm font-medium">Name</th>
                <th className="p-2 text-left text-sm font-medium">Date</th>
                <th className="p-2 text-left text-sm font-medium">Department</th>
                <th className="p-2 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 text-sm">{r.case_number}</td>
                  <td className="p-2 text-sm">
                    {r.complainant_last_name}, {r.complainant_first_name}
                  </td>
                  <td className="p-2 text-sm">{r.stop_date}</td>
                  <td className="p-2 text-sm">{r.department}</td>
                  <td className="p-2 text-sm">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Link to={`/complaints/${r.id}`} className="text-blue-600 hover:underline">
                        View / Edit
                      </Link>

                      {isAdmin ? (
                        <button
                          onClick={async () => {
                            const yes = window.confirm(
                              `Delete complaint ${r.case_number}? This cannot be undone.`
                            );
                            if (!yes) return;

                            try {
                              await api.deleteComplaint(r.id);
                              setRows((prev) => prev.filter((x) => x.id !== r.id));
                            } catch (e: any) {
                              alert(e?.message || "Failed to delete complaint");
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-sm border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td className="p-3 text-sm text-gray-600" colSpan={5}>
                    No complaints found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
