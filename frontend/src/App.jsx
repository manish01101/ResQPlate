import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import FindFoodPage from "./pages/FindFoodPage";
import DonatePage from "./pages/DonatePage";
import MyClaimsPage from "./pages/MyClaimsPage";
import AdminPage from "./pages/AdminPage";
import ResQBot from "./components/ResQBot"; 

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      {/* Navbar is always visible now */}
      <Navbar />

      <main className="flex-grow w-full flex flex-col">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Auth Pages */}
          <Route
            path="/login"
            element={
              user ? <Navigate to="/dashboard" replace /> : <LoginPage />
            }
          />
          <Route
            path="/register"
            element={
              user ? <Navigate to="/dashboard" replace /> : <RegisterPage />
            }
          />

          {/* Private App Pages */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/find-food"
            element={
              <PrivateRoute>
                <FindFoodPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/donate"
            element={
              <PrivateRoute roles={["donor", "admin"]}>
                <DonatePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-claims"
            element={
              <PrivateRoute roles={["ngo", "donor", "admin"]}>
                <MyClaimsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute roles={["admin"]}>
                <AdminPage />
              </PrivateRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/"} replace />}
          />
        </Routes>
      </main>

      <ResQBot />
      
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}