import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("resqplate_token");
    if (token) {
      api
        .get("/auth/me")
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem("resqplate_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("resqplate_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post("/auth/register", data);
    localStorage.setItem("resqplate_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("resqplate_token");
    setUser(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("resqplate_token");
    if (!token) return null;
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      console.error("Failed to refresh user", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
