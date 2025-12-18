import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(false);

  const loginUtils = (newToken, role) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", role);
    setToken(newToken);
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const logoutUtils = () => {
    localStorage.clear();
    setToken(null);
    setUserRole("");
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    const fetchUser = async () => {
      try {
        // "/me endpoint" => this check each time for valid user
        const res = await axios.get(`${BACKEND_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) {
          setUserRole(res.data.role);
          localStorage.setItem("role", res.data.role);
        }
      } catch (err) {
        if (err.response?.status === 401) logoutUtils();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        userRole,
        isAuthenticated,
        loginUtils,
        logoutUtils,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// hooks for auth context
// export const useAuth = function useContext(AuthContext) {};
export const useAuth = () => useContext(AuthContext);
