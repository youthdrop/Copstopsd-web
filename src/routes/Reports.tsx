import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Complaint } from "../lib/api";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function Reports() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [department, setDepartment] = useState<string>("");

  const [from, setFrom] = useState<string>(() => ymd(new Date()));
  const [to, setTo] = useState<string>(() => ymd(new Date()));

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await api.listComplaints(q.trim());
        if (!mounted) return;

        // If department filter is used later, keep all and filter in memo below
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!mounted) return;
        setError(typeof e?.message === "string" ? e.message : "Failed to load complaints");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [q]);

  const allDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.department) set.add(r.department);
    }
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const fromD = from ? new Date(from + "T00:00:00") : null;
    const toD = to ? new Date(to + "T23:59:59") : null;

    return rows.filter((r) => {
      // Department filter
      if (department && r.department !== department) return false;

      // Date filter (stop_date)
      if (fromD || toD) {
        const stop = r.stop_date ? new Date(r.stop_date + "T12:00:00") : null;
        if (stop) {
          if (fromD && stop < fromD) return false;
          if (toD && stop > toD) return false;
        }
      }

      // Search filter (already handled by backend query param in listComplaints)
      return true;
    });
  }, [rows, department, from, to]);

  const countsByDept = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of filtered) {
      const d = (r.department || "Unknown").trim() || "Unknown";
      map[d] = (map[d] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  function clearFilters() {
    setQ("");
    setDepartment("");
    const today = ymd(new Date());
    setFrom(today);
    setTo(today);
  }

  function downloadCSV() {
    const header = ["case_number", "name", "stop_date", "stop_time", "department", "phone", "location"].join(",");

    const lines = filtered.map((r) => {
      const name = `${r.complainant_last_name ?? ""}, ${r.complainant_first_name ?? ""}`.trim();
      const phone = (r.complainant_phone ?? r.phone_number ?? "").toString();
      const location = (r.stop_location ?? "").toString();

      const stopTime =
        typeof r.stop_time === "string" ? r.stop_time.slice(0, 5) : "";

      const row = [
        r.case_number ?? "",
        name,
        r.stop_date ?? "",
        stopTime,
        r.department ?? "",
        phone,
        location,
      ];

      // CSV escape
      return row
        .map((v) => {
          const s = String(v ?? "");
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(",");
    });

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `copstopsd_reports_${from || "all"}_${to || "all"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-gray-600">Filter complaints and export results.</p>
        </div>

        {/* ✅ Back + Logout side-by-side (NO overlap) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100"
          >
            ← Back to Dashboard
          </button>

          <button
            onClick={() => {
              api.logout();
              navigate("/login", { replace: true });
            }}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {error && (
        <div className="border border-red-200 bg-red-50 text-red-800 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div className="border rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Search</label>
                <input
                  className="w-full mt-1 border rounded-xl px-3 py-2"
                  placeholder="Case #, name, location, narrative…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium">Department</label>
                <select
                  className="w-full mt-1 border rounded-xl px-3 py-2"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">All</option>
                  {allDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={clearFilters}
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Clear
                </button>

                <button
                  onClick={downloadCSV}
                  className="rounded-xl bg-black text-white px-4 py-2 text-sm hover:opacity-90"
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="text-sm font-medium">From</label>
                <input
                  type="date"
                  className="w-full mt-1 border rounded-xl px-3 py-2"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">To</label>
                <input
                  type="date"
                  className="w-full mt-1 border rounded-xl px-3 py-2"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div className="md:col-span-3 flex items-end gap-2">
                <span className="rounded-xl border px-4 py-2 text-sm">
                  {filtered.length} results
                </span>
                <span className="rounded-xl border px-4 py-2 text-sm">
                  {rows.length} total complaints
                </span>
              </div>
            </div>
          </div>

          {/* Counts by Department */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="border rounded-2xl p-4">
              <div className="font-semibold mb-3">Counts by Department</div>
              <div className="space-y-2">
                {countsByDept.map(([dept, count]) => (
                  <div key={dept} className="flex justify-between text-sm">
                    <span className="text-gray-700">{dept}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="lg:col-span-2 border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Case #</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-3 font-medium">{r.case_number}</td>
                      <td className="p-3">
                        {(r.complainant_last_name ?? "") + ", " + (r.complainant_first_name ?? "")}
                      </td>
                      <td className="p-3">{r.stop_date}</td>
                      <td className="p-3">{r.department}</td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td className="p-3 text-gray-600" colSpan={4}>
                        No results.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
