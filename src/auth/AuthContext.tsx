import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, StaffUser } from "../lib/api";

type AuthCtx = {
  token: string | null;
  user: StaffUser | null;
  isAuthed: boolean;
  isAdmin: boolean;
  loadingUser: boolean;
  userLoaded: boolean;
  setToken: (t: string | null) => void;
  setUser: (u: StaffUser | null) => void;
  refreshUser: () => Promise<StaffUser | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);
const TOKEN_KEY = "access_token";
const USER_KEY = "current_user";

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function getStoredUser(): StaffUser | null {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StaffUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    return null;
  }
}

function storeUser(user: StaffUser | null) {
  if (user) {
    const raw = JSON.stringify(user);
    localStorage.setItem(USER_KEY, raw);
    sessionStorage.setItem(USER_KEY, raw);
  } else {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getStoredToken());
  const [user, setUserState] = useState<StaffUser | null>(() => getStoredUser());
  const [loadingUser, setLoadingUser] = useState(false);
  const [userLoaded, setUserLoaded] = useState<boolean>(() => !getStoredToken() || Boolean(getStoredUser()));

  const setToken = (t: string | null) => {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
      sessionStorage.setItem(TOKEN_KEY, t);
      setTokenState(t);
      setUserLoaded(false);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      storeUser(null);
      setTokenState(null);
      setUserState(null);
      setUserLoaded(true);
    }
  };

  const setUser = (u: StaffUser | null) => {
    storeUser(u);
    setUserState(u);
    setUserLoaded(true);
  };

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      return null;
    }

    setLoadingUser(true);
    try {
      const me = await api.me();
      setUser(me);
      return me;
    } catch (e) {
      console.error("Failed to load current user", e);
      setUser(null);
      return null;
    } finally {
      setLoadingUser(false);
      setUserLoaded(true);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    storeUser(null);
    setTokenState(null);
    setUserState(null);
    setUserLoaded(true);
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthed: Boolean(token),
      isAdmin: Boolean(user?.is_admin),
      loadingUser,
      userLoaded,
      setToken,
      setUser,
      refreshUser,
      logout,
    }),
    [token, user, loadingUser, userLoaded]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
