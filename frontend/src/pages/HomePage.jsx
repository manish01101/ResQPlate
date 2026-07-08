import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white dark:bg-slate-950 flex flex-col min-h-screen font-sans">
      {/* 🌟 HERO SECTION */}
      <div className="relative bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 overflow-hidden">
        {/* Ambient Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[20%] w-80 h-80 sm:w-96 sm:h-96 bg-emerald-600/25 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] -right-[20%] w-80 h-80 sm:w-96 sm:h-96 bg-emerald-800/35 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-emerald-800/50 border border-emerald-700/50 text-emerald-100 text-xs sm:text-sm font-medium mb-6 sm:mb-8 backdrop-blur-sm shadow-sm">
            <span className="flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 mr-2 sm:mr-2.5 animate-pulse"></span>
            <span className="hidden sm:inline">
              Bridging the gap between surplus food and hunger
            </span>
            <span className="sm:hidden">Fighting food waste, saving lives</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif font-extrabold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
            Fighting food waste, <br className="block sm:hidden" />
            <span className="hidden sm:inline">
              <br />
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-400">
              one meal at a time.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-2xl text-emerald-100/90 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Connect surplus food from donors with nearby NGOs using intelligent
            geo-spatial matching.
          </p>

          <div className="flex flex-col gap-3 sm:gap-4 w-full sm:w-auto sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate("/register")}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-emerald-900 text-base sm:text-lg font-bold rounded-xl shadow-xl shadow-emerald-900/30 hover:bg-emerald-50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 active:translate-y-0"
            >
              Join the Movement
            </button>
            <button
              onClick={() => navigate("/about")}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-emerald-800/40 border border-emerald-600/50 backdrop-blur-md text-white text-base sm:text-lg font-bold rounded-xl hover:bg-emerald-700/50 hover:shadow-lg transition-all duration-200"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* 📊 IMPACT STATS BANNER */}
      <div className="bg-white dark:bg-slate-900 py-8 sm:py-12 border-b border-gray-100 dark:border-slate-800 relative z-10 -mt-6 sm:-mt-8 mx-4 sm:mx-8 md:mx-auto max-w-5xl rounded-2xl shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center px-2 sm:px-4">
          <div className="flex flex-col py-2 sm:py-0 border-r border-gray-100 dark:border-slate-800 last:border-r-0 md:border-r md:last:border-r">
            <span className="text-2xl sm:text-4xl font-extrabold text-emerald-600">
              O(log N)
            </span>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
              Query Speed
            </span>
          </div>
          <div className="flex flex-col py-2 sm:py-0 border-r border-gray-100 dark:border-slate-800 last:border-r-0 md:border-r md:last:border-r">
            <span className="text-2xl sm:text-4xl font-extrabold text-emerald-600">
              100%
            </span>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
              Transparent
            </span>
          </div>
          <div className="flex flex-col py-2 sm:py-0 border-r border-gray-100 dark:border-slate-800 last:border-r-0 md:border-r md:last:border-r">
            <span className="text-2xl sm:text-4xl font-extrabold text-emerald-600">
              &lt; 1s
            </span>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
              Matching Time
            </span>
          </div>
          <div className="flex flex-col py-2 sm:py-0">
            <span className="text-2xl sm:text-4xl font-extrabold text-emerald-600">
              24/7
            </span>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium mt-1">
              Live Tracking
            </span>
          </div>
        </div>
      </div>

      {/* 🚀 TECHNOLOGY & FEATURES SECTION */}
      <div className="bg-gray-50 dark:bg-slate-900/60 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-xs sm:text-sm font-bold text-emerald-600 tracking-wider uppercase mb-2">
              How it works
            </h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-slate-100">
              Built for speed & reliability
            </h3>
            <p className="mt-3 sm:mt-4 text-gray-500 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-lg">
              Our platform uses cutting-edge algorithms to ensure food goes to
              the most reliable, nearest volunteers before it expires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-4 sm:mb-6">
                📍
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-2 sm:mb-3">
                Geo-Spatial Search
              </h4>
              <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 leading-relaxed">
                MongoDB 2dsphere indexing provides instant O(log N) proximity
                matching, finding the nearest food instantly.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-4 sm:mb-6">
                🧠
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-2 sm:mb-3">
                Mod-FA Algorithm
              </h4>
              <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 leading-relaxed">
                The Modified Firefly Algorithm balances Haversine distance and
                NGO reliability scores for optimal allocation.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-4 sm:mb-6">
                ⏰
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-2 sm:mb-3">
                Auto-Expiry Logic
              </h4>
              <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 leading-relaxed">
                Food freshness is guaranteed with automated timeline removals,
                ensuring expired food is never consumed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🏁 FOOTER */}
      <footer className="bg-gray-900 text-white pt-12 sm:pt-16 pb-6 sm:pb-8 text-center md:text-left mt-auto border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 sm:mb-16 pb-8 sm:pb-12 border-b border-gray-800 gap-4 sm:gap-6">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2">
                Together, we can end food waste.
              </h2>
              <p className="text-gray-400 text-base sm:text-lg">
                Join ResQPlate today and be part of the solution.
              </p>
            </div>
            <button
              onClick={() => navigate("/register")}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold shadow-lg transition-colors text-base sm:text-lg"
            >
              Create Free Account
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-center sm:justify-start mb-4">
                <Logo
                  className="text-white"
                  plateColor="text-white"
                  iconColor="text-emerald-400"
                />
              </div>
              <p className="text-gray-300 dark:text-gray-400 max-w-sm text-sm">
                A technology-driven platform designed to reduce food waste and
                combat hunger using intelligent algorithms and real-time
                mapping.
              </p>
            </div>
            <div>
              <h4 className="text-base font-bold mb-3 text-white">Platform</h4>
              <ul className="space-y-2 text-gray-300 dark:text-gray-400 text-sm">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Join as NGO
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-bold mb-3 text-white">Legal</h4>
              <ul className="space-y-2 text-gray-300 dark:text-gray-400 text-sm">
                <li>
                  <span className="cursor-pointer hover:text-emerald-400 transition-colors">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-emerald-400 transition-colors">
                    Terms of Service
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-emerald-400 transition-colors">
                    Safety Guidelines
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
            <p>
              © {new Date().getFullYear()} ResQPlate — Built for Social Impact.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
