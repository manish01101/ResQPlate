import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("ngo"); // donor

  const token = localStorage.getItem("token");

  useEffect(() => {
    setIsLoading(true);

    const fetchUserDetail = async () => {
      try {
        const res = axios.get(`${BACKEND_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res) {
          setIsAuthenticated(true);
          setUserRole(res.userRole);
          localStorage.setItem("role", res.userRole);
        }
      } catch (error) {
        toast.error("Error Occured!", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserDetail();
  }, [token]);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole("");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-green-600 font-bold"
      : "text-gray-600 hover:text-green-500";

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-15 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Logo />
          </div>

          {/* ---  DESKTOP MENU--- */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/" className={`${isActive("/")} transition duration-300`}>
              Home
            </Link>
            <Link
              to="/about"
              className={`${isActive("/about")} transition duration-300`}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={`${isActive("/contact")} transition duration-300`}
            >
              Contact
            </Link>

            {/* Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center space-x-4 ml-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-green-600 font-medium transition"
                >
                  Login
                </Link>
                <Link to="/register">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition transform hover:-translate-y-0.5 shadow-md hover:shadow-lg">
                    Sign Up
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4 ml-4">
                <Link to="/dashboard">
                  <button className="bg-blue-50 text-blue-600 border border-blue-200 cursor-pointer px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition">
                    {userRole === "donor" ? "My Donations" : "Find Food"}
                  </button>
                </Link>
                <button
                  className="text-gray-500 cursor-pointer hover:text-red-500 font-medium text-sm transition"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* --- MOBILE MENU --- */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-green-600 focus:outline-none p-2 rounded-md"
            >
              {isOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE DROPDOWN --- */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in-down">
          <div className="px-4 pt-2 pb-6 space-y-2 shadow-lg">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
            >
              Home
            </Link>
            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-green-50"
            >
              About
            </Link>

            {!isAuthenticated ? (
              <div className="pt-4 flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center bg-green-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-green-700"
                >
                  Create Account
                </Link>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-100">
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50"
                >
                  Go to Dashboard
                </Link>
                <button className="w-full text-left block px-3 py-3 rounded-md text-base font-medium text-red-500 hover:bg-red-50">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
