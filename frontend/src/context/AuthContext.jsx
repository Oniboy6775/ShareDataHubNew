import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("aff_token") || "",
  );
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(
    () => localStorage.getItem("aff_admin_mode") !== "false",
  );

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      api
        .get("/auth/profile")
        .then(({ data }) => setUser(data.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem("aff_token", newToken);
    localStorage.removeItem("aff_dismissed_broadcasts");
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    if (userData?.userType === "admin") {
      setAdminMode(true);
      localStorage.setItem("aff_admin_mode", "true");
    }
  };

  const logout = () => {
    localStorage.removeItem("aff_token");
    localStorage.removeItem("aff_admin_mode");
    delete api.defaults.headers.common["Authorization"];
    setToken("");
    setUser(null);
    setAdminMode(true);
  };

  const switchMode = (mode) => {
    const next = mode === "admin";
    setAdminMode(next);
    localStorage.setItem("aff_admin_mode", String(next));
  };

  const isAdmin = user?.userType === "admin";
  const inAdminMode = isAdmin && adminMode;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, setUser, isAdmin, inAdminMode, switchMode }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
