import React, { useEffect } from "react";
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
  const { isAdmin, loadingUser, userLoaded, refreshUser, user } = useAuth();

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    try {
      api.logout();
    } catch (e) {
      console.error("Logout failed:", e);
    }
    navigate("/login", { replace: true });
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Add complaints, add officers, manage databases, and run reports.
          </p>
          {user?.email ? (
            <p className="text-xs text-gray-500 mt-1">
              Logged in as {user.email}{isAdmin ? " · Admin" : " · Staff"}
            </p>
          ) : null}
        </div>

        <button
          onClick={handleLogout}
          className="self-start px-4 py-2 text-sm border rounded-xl hover:bg-gray-100"
        >
          Logout
        </button>
      </div>

      {loadingUser || !userLoaded ? (
        <div className="text-sm text-gray-600">Loading your permissions…</div>
      ) : null}

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

        <Card title="Public Form">
          <div className="flex flex-col gap-2">
            <Link to="/complaint" className="block">
              <Button className="w-full">Open Public Complaint Form</Button>
            </Link>
            <p className="text-xs text-gray-500">
              Share this page with community members for public intake.
            </p>
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
