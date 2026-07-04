import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-2xl p-4 shadow-sm bg-white">
      <div className="font-semibold">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  function handleLogout() {
    try {
      api.logout(); // clears token storage
    } catch (e) {
      // don't block logout on errors
      console.error("Logout failed:", e);
    }
    navigate("/login", { replace: true });
  }

  return (
    <div className="space-y-6">
      {/* Header with Logout on the upper right */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Add complaints, add officers, add staff accounts, and run reports.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-100"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Primary Actions">
          <div className="flex flex-col gap-2">
            <Link to="/complaints/new" className="block">
              <Button className="w-full">Add Complaint</Button>
            </Link>

            <Link to="/officers" className="block">
              <Button className="w-full">Add Officer</Button>
            </Link>

            <Link to="/reports" className="block">
              <Button className="w-full">Reports</Button>
            </Link>
          </div>
        </Card>

        <Card title="Databases">
          <div className="flex flex-col gap-2">
            <Link to="/complaints" className="block">
              <Button className="w-full">Complaint Database</Button>
            </Link>

            <Link to="/officers" className="block">
              <Button className="w-full">Officer Database</Button>
            </Link>
          </div>
        </Card>

        {isAdmin ? (
          <Card title="Admin">
            <div className="flex flex-col gap-2">
              <Link to="/staff" className="block">
                <Button className="w-full">Staff Management</Button>
              </Link>

              <p className="text-xs text-gray-500">
                Admin only: add staff, reset passwords, and manage access.
              </p>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
