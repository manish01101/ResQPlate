import React from "react";
import { Link } from "react-router-dom";

const Logo = ({
  className = "text-gray-900",
  iconColor = "text-emerald-500",
  plateColor = "text-emerald-800",
}) => {
  return (
    <Link
      to="/"
      className={`flex items-center gap-2 group ${className} transition-transform hover:scale-105 duration-300`}
    >
      {/* Custom SVG Icon: Plate with a sprouting leaf */}
      <div className="relative flex items-center justify-center">
        {/* Food Cloche / Plate */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-8 h-8 ${plateColor} transition-colors group-hover:opacity-90`}
        >
          <path d="M12 3C7.589 3 4 6.589 4 11v2h16v-2c0-4.411-3.589-8-8-8zm-6 8c0-3.309 2.691-6 6-6s6 2.691 6 6H6z" />
          <path d="M2 14h20v3H2z" />
        </svg>
        {/* Sprouting Leaf */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-5 h-5 absolute -top-1.5 -right-2 ${iconColor} drop-shadow-sm`}
        >
          <path d="M17.5 2a5.5 5.5 0 00-5.5 5.5c0 1.25.43 2.4 1.15 3.32L9.4 14.58a1 1 0 001.41 1.41l3.76-3.76A5.46 5.46 0 0017.5 13a5.5 5.5 0 000-11z" />
        </svg>
      </div>

      {/* Typography */}
      <span className="text-2xl font-extrabold tracking-tight font-sans">
        <span className="text-gray-500">ResQ</span>
        <span className={iconColor}>Plate</span>
      </span>
    </Link>
  );
};

export default Logo;
