import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthContext";

const IDLE_LIMIT = 5 * 60 * 1000; // 5 minutes
const WARNING_TIME = 30 * 1000; // 30 seconds before logout

export default function IdleTimer() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [showWarning, setShowWarning] = useState(false);
  const logoutTimer = useRef<number | null>(null);
  const warningTimer = useRef<number | null>(null);

  const publicRoutes = [
    "/login",
    "/otp",
    "/forgot-password",
    "/reset-password",
    "/complaint",
    "/complaint/thank-you",
    "/privacy",
    "/privacy-policy",
    "/support",
    "/child-safety",
  ];

  const isPublicRoute = publicRoutes.includes(location.pathname);

  function clearTimers() {
    if (logoutTimer.current) window.clearTimeout(logoutTimer.current);
    if (warningTimer.current) window.clearTimeout(warningTimer.current);
  }

  function doLogout() {
    clearTimers();
    setShowWarning(false);
    auth.logout();
    api.logout();
    navigate("/login", { replace: true });
  }

  function resetTimers() {
    if (isPublicRoute || !auth.isAuthed) return;

    clearTimers();
    setShowWarning(false);

    warningTimer.current = window.setTimeout(() => {
      setShowWarning(true);
    }, IDLE_LIMIT - WARNING_TIME);

    logoutTimer.current = window.setTimeout(() => {
      doLogout();
    }, IDLE_LIMIT);
  }

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

    events.forEach((event) => window.addEventListener(event, resetTimers));

    resetTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimers));
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthed, location.pathname]);

  if (!showWarning || isPublicRoute || !auth.isAuthed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold">Session Expiring</h2>
        <p className="mt-2 text-sm text-gray-600">
          You have been inactive. You will be logged out in 30 seconds.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={resetTimers}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Stay Logged In
          </button>

          <button
            onClick={doLogout}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100"
          >
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}