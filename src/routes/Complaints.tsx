import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, Complaint } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

export default function Complaints() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [rows, setRows] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await api.listComplaints();
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      {/* 🔹 Back to Dashboard button */}
      <button
        onClick={() => navigate("/")}
        className="mb-4 inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-100"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-xl font-semibold mb-4">Complaint Database</h1>

      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-xl">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left text-sm font-medium">Case #</th>
                <th className="p-2 text-left text-sm font-medium">Name</th>
                <th className="p-2 text-left text-sm font-medium">Date</th>
                <th className="p-2 text-left text-sm font-medium">Department</th>
                <th className="p-2 text-left text-sm font-medium"></th>
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
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Link
                        to={`/complaints/${r.id}`}
                        className="text-blue-600 hover:underline"
                      >
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
                          style={{
                            padding: "6px 10px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
