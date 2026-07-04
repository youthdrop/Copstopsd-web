import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, StaffUser } from "../lib/api";

type AuthCtx = {
  token: string | null;
  user: StaffUser | null;
  isAuthed: boolean;
  isAdmin: boolean;
  loadingUser: boolean;
  setToken: (t: string | null) => void;
  setUser: (u: StaffUser | null) => void;
  refreshUser: () => Promise<StaffUser | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);
const TOKEN_KEY = "access_token";

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getStoredToken());
  const [user, setUserState] = useState<StaffUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const setToken = (t: string | null) => {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      sessionStorage.setItem(TOKEN_KEY, t);
      setTokenState(t);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      setTokenState(null);
      setUserState(null);
    }
  };

  const setUser = (u: StaffUser | null) => setUserState(u);

  const refreshUser = async () => {
    if (!getStoredToken()) {
      setUserState(null);
      return null;
    }

    setLoadingUser(true);
    try {
      const me = await api.me();
      setUserState(me);
      return me;
    } catch (e) {
      console.error("Failed to load current user", e);
      return null;
    } finally {
      setLoadingUser(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
    setUserState(null);
  };

  useEffect(() => {
    if (token && !user) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthed: Boolean(token),
      isAdmin: Boolean(user?.is_admin),
      loadingUser,
      setToken,
      setUser,
      refreshUser,
      logout,
    }),
    [token, user, loadingUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
