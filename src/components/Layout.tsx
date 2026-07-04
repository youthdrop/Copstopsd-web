import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const navItem = "px-3 py-2 rounded-lg hover:bg-gray-100 text-sm";
const navActive = "bg-gray-100";

export default function Layout() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">
            Police Accountability
          </Link>
          <div className="text-xs text-gray-500">Admin (MVP)</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <nav className="flex md:flex-col gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${navItem} ${isActive ? navActive : ""}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/complaints"
              className={({ isActive }) =>
                `${navItem} ${isActive ? navActive : ""}`
              }
            >
              Complaints
            </NavLink>

            <NavLink
              to="/officers"
              className={({ isActive }) =>
                `${navItem} ${isActive ? navActive : ""}`
              }
            >
              Officers
            </NavLink>
          </nav>
        </aside>

        <main className="col-span-12 md:col-span-9">
          {/* 🔑 Nested routes render here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
