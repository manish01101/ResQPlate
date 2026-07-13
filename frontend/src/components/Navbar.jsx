import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsMobileMenuOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
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
    `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
      isActive
        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-300"
        : "text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-emerald-600"
    }`;

  const desktopNavLinkClass = ({ isActive }) =>
    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
      isActive
        ? "border-emerald-500 text-gray-900 dark:text-slate-100"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
    }`;

  return (
    <nav className="bg-white/95 dark:bg-slate-900/95 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 w-full backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* LEFT SIDE: Logo & Links */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Logo />
            </div>

            {/* Desktop Navigation - Hidden on Mobile */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {/* If NOT logged in, show Public Links */}
              {!user ? (
                <>
                  <NavLink to="/" className={desktopNavLinkClass}>
                    Home
                  </NavLink>
                  <NavLink to="/about" className={desktopNavLinkClass}>
                    About Us
                  </NavLink>
                  <NavLink to="/contact" className={desktopNavLinkClass}>
                    Contact
                  </NavLink>
                </>
              ) : (
                /* If logged in, show App Links */
                <>
                  <NavLink to="/dashboard" className={desktopNavLinkClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/find-food" className={desktopNavLinkClass}>
                    Find Food
                  </NavLink>

                  {user?.role === "donor" && user?.isVerified && (
                    <NavLink to="/donate" className={desktopNavLinkClass}>
                      Donate
                    </NavLink>
                  )}
                  {(user?.role === "donor" || user?.role === "ngo") &&
                    user?.isVerified && (
                      <NavLink to="/my-claims" className={desktopNavLinkClass}>
                        {user?.role === "donor"
                          ? "Manage Donations"
                          : "My Claims"}
                      </NavLink>
                    )}
                  {(user?.role === "donor" || user?.role === "ngo") &&
                    !user?.isVerified && (
                      <NavLink to="/verify" className={desktopNavLinkClass}>
                        Verify Account
                      </NavLink>
                    )}
                  {user?.role === "admin" && (
                    <NavLink to="/admin" className={desktopNavLinkClass}>
                      Admin
                    </NavLink>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Theme Toggle + Auth (Desktop) + Mobile Menu Button */}
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />

            {/* Desktop Auth Buttons - Hidden on Mobile */}
            <div className="hidden md:flex md:items-center md:gap-4">
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
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {!user ? (
              <>
                <NavLink
                  to="/"
                  className={navLinkClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </NavLink>
                <NavLink
                  to="/about"
                  className={navLinkClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About Us
                </NavLink>
                <NavLink
                  to="/contact"
                  className={navLinkClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </NavLink>
                <div className="border-t border-gray-200 dark:border-slate-800 pt-2 mt-2">
                  <button
                    onClick={() => handleNavigate("/login")}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNavigate("/register")}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors mt-2"
                  >
                    Get Started
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/dashboard"
                  className={navLinkClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/find-food"
                  className={navLinkClass}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Find Food
                </NavLink>
                {user?.role === "donor" && user?.isVerified && (
                  <NavLink
                    to="/donate"
                    className={navLinkClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Donate
                  </NavLink>
                )}
                {(user?.role === "donor" || user?.role === "ngo") &&
                  user?.isVerified && (
                    <NavLink
                      to="/my-claims"
                      className={navLinkClass}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {user?.role === "donor"
                        ? "Manage Donations"
                        : "My Claims"}
                    </NavLink>
                  )}
                {(user?.role === "donor" || user?.role === "ngo") &&
                  !user?.isVerified && (
                    <NavLink
                      to="/verify"
                      className={navLinkClass}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Verify Account
                    </NavLink>
                  )}
                {user?.role === "admin" && (
                  <NavLink
                    to="/admin"
                    className={navLinkClass}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Panel
                  </NavLink>
                )}
                <div className="border-t border-gray-200 dark:border-slate-800 pt-2 mt-2">
                  <div className="px-3 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md border ${getRoleStyle(user?.role)}`}
                      >
                        {user?.role}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-3">
                      {user?.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
