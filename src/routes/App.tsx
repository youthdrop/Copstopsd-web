import React, { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import Dashboard from "./Dashboard";
import Complaints from "./Complaints";
import ComplaintNew from "./ComplaintNew";
import ComplaintDetail from "./ComplaintDetail";
import Officers from "./Officers";
import OfficerDetail from "./OfficerDetail";
import Reports from "./Reports";
import Support from "./Support";

import Login from "./Login";
import Register from "./Register";
import Otp from "./Otp";
import StaffManagementPage from "./StaffManagementPage";

import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import PrivacyPolicy from "./PrivacyPolicy";
import Childsafety from "./Childsafety";

import PublicComplaintPage from "./PublicComplaintPage";
import ComplaintThankYouPage from "./ComplaintThankYouPage";

import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useAuth();

  const hasToken =
    isAuthed ||
    Boolean(localStorage.getItem("access_token")) ||
    Boolean(sessionStorage.getItem("access_token"));

  if (!hasToken) return <Navigate to="/login" replace />;

  return <>{children}</>;
}


function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loadingUser, refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadingUser) return <div className="p-6 text-sm text-gray-600">Checking permissions…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function LogoutRoute() {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    auth.logout();
    api.logout();
    navigate("/login", { replace: true });
  }, [auth, navigate]);

  return null;
}

export default function App() {
  return (
    <Routes>
      {/* Public auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/otp" element={<Otp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public policy/support pages */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/support" element={<Support />} />
      <Route path="/child-safety" element={<Childsafety />} />

      {/* Public complaint form */}
      <Route path="/complaint" element={<PublicComplaintPage />} />
      <Route path="/complaint/thank-you" element={<ComplaintThankYouPage />} />

      {/* Logout */}
      <Route
        path="/logout"
        element={
          <RequireAuth>
            <LogoutRoute />
          </RequireAuth>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/reports"
        element={
          <RequireAuth>
            <Reports />
          </RequireAuth>
        }
      />

      <Route
        path="/complaints"
        element={
          <RequireAuth>
            <Complaints />
          </RequireAuth>
        }
      />

      <Route
        path="/complaints/new"
        element={
          <RequireAuth>
            <ComplaintNew />
          </RequireAuth>
        }
      />

      <Route
        path="/complaints/:id"
        element={
          <RequireAuth>
            <ComplaintDetail />
          </RequireAuth>
        }
      />

      <Route
        path="/officers"
        element={
          <RequireAuth>
            <Officers />
          </RequireAuth>
        }
      />

      <Route
        path="/officers/:id"
        element={
          <RequireAuth>
            <OfficerDetail />
          </RequireAuth>
        }
      />

      <Route
        path="/staff"
        element={
          <RequireAuth>
            <RequireAdmin>
              <StaffManagementPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}