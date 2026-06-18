import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "ngo":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "donor":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
      isActive
        ? "border-emerald-500 text-gray-900 dark:text-slate-100"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
    }`;

  return (
    <nav className="bg-white/90 dark:bg-slate-900/90 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 w-full backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* LEFT SIDE: Logo & Links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center pt-1">
              <Logo />
            </div>

            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              {/* If NOT logged in, show Public Links */}
              {!user ? (
                <>
                  <NavLink to="/" className={navLinkClass}>
                    Home
                  </NavLink>
                  <NavLink to="/about" className={navLinkClass}>
                    About Us
                  </NavLink>
                  <NavLink to="/contact" className={navLinkClass}>
                    Contact
                  </NavLink>
                </>
              ) : (
                /* If logged in, show App Links */
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/find-food" className={navLinkClass}>
                    Find Food
                  </NavLink>
                  {(user?.role === "donor" || user?.role === "admin") && (
                    <NavLink to="/donate" className={navLinkClass}>
                      Donate
                    </NavLink>
                  )}
                  {user?.role === "donor" && (
                    <NavLink to="/my-claims" className={navLinkClass}>
                      Manage Donations
                    </NavLink>
                  )}
                  {(user?.role === "ngo" || user?.role === "admin") && (
                    <NavLink to="/my-claims" className={navLinkClass}>
                      My Claims
                    </NavLink>
                  )}
                  {user?.role === "admin" && (
                    <NavLink to="/admin" className={navLinkClass}>
                      Admin
                    </NavLink>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Auth Buttons or User Profile */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            <ThemeToggle />
            {!user ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="text-gray-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 font-medium transition-colors text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors text-sm"
                >
                  Get Started
                </button>
              </>
            ) : (
              <>
                <span
                  className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border ${getRoleStyle(user?.role)}`}
                >
                  {user?.role}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
