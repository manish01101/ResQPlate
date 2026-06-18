import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white dark:bg-slate-950 flex flex-col min-h-screen font-sans">
      {/* 🌟 HERO SECTION */}
      <div className="relative bg-emerald-900 overflow-hidden">
        {/* Ambient Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-600/30 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[60%] bg-emerald-800/40 rounded-full blur-[100px]"></div>
          <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-emerald-400/10 rounded-full blur-[80px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col items-center text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-800/50 border border-emerald-700/50 text-emerald-100 text-sm font-medium mb-8 backdrop-blur-sm shadow-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 mr-2.5 animate-pulse"></span>
            Bridging the gap between surplus food and hunger
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-extrabold text-white mb-6 tracking-tight leading-tight">
            Fighting food waste, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-400">
              one meal at a time.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-emerald-100/90 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
            Connect surplus food from donors with nearby NGOs using intelligent
            geo-spatial matching and real-time routing.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-white text-emerald-900 text-lg font-bold rounded-xl shadow-xl shadow-emerald-900/20 hover:bg-emerald-50 hover:-translate-y-1 transition-all duration-200"
            >
              Join the Movement
            </button>
            <button
              onClick={() => navigate("/about")}
              className="px-8 py-4 bg-emerald-800/40 border border-emerald-600/50 backdrop-blur-md text-white text-lg font-bold rounded-xl hover:bg-emerald-700/50 transition-all duration-200"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* 📊 IMPACT STATS BANNER */}
      <div className="bg-white dark:bg-slate-900 py-12 border-b border-gray-100 dark:border-slate-800 relative z-10 -mt-8 mx-4 sm:mx-8 md:mx-auto max-w-5xl rounded-2xl shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100 dark:divide-slate-800">
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold text-emerald-600">
              O(log N)
            </span>
            <span className="text-sm text-gray-500 font-medium mt-1">
              Query Speed
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold text-emerald-600">
              100%
            </span>
            <span className="text-sm text-gray-500 font-medium mt-1">
              Transparent
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold text-emerald-600">
              &lt; 1s
            </span>
            <span className="text-sm text-gray-500 font-medium mt-1">
              Matching Time
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold text-emerald-600">
              24/7
            </span>
            <span className="text-sm text-gray-500 font-medium mt-1">
              Live Tracking
            </span>
          </div>
        </div>
      </div>

      {/* 🚀 TECHNOLOGY & FEATURES SECTION */}
      <div className="bg-gray-50 dark:bg-slate-900/60 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-emerald-600 tracking-wider uppercase mb-2">
              How it works
            </h2>
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-slate-100">
              Built for speed & reliability
            </h3>
            <p className="mt-4 text-gray-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              Our platform uses cutting-edge algorithms to ensure food goes to
              the most reliable, nearest volunteers before it expires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                📍
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">
                Geo-Spatial Search
              </h4>
              <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                MongoDB 2dsphere indexing provides instant O(log N) proximity
                matching, finding the nearest food instantly.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                🧠
              </div>
              <h4 className="text-xl font-bold text-gray-900  mb-3">
                Mod-FA Algorithm
              </h4>
              <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                The Modified Firefly Algorithm balances Haversine distance and
                NGO reliability scores for optimal allocation.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                ⏰
              </div>
              <h4 className="text-xl font-bold text-gray-900  mb-3">
                Auto-Expiry Logic
              </h4>
              <p className="text-gray-500 dark:text-slate-400 leading-relaxed">
                Food freshness is guaranteed with automated timeline removals,
                ensuring expired food is never consumed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🏁 FOOTER */}
      <footer className="bg-gray-900 text-white pt-16 pb-8 text-center md:text-left mt-auto border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 pb-12 border-b border-gray-800 gap-6">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-2">
                Together, we can end food waste.
              </h2>
              <p className="text-gray-400 text-lg">
                Join ResQPlate today and be a part of the solution.
              </p>
            </div>
            <Link to="/register">
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-colors whitespace-nowrap text-lg">
                Create Free Account
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center justify-center md:justify-start mb-4">
                <Logo
                  className="text-white"
                  plateColor="text-white"
                  iconColor="text-emerald-400"
                />
              </div>
              <p className="text-gray-400 max-w-sm mx-auto md:mx-0">
                A technology-driven platform designed to reduce food waste and
                combat hunger using intelligent algorithms and real-time
                mapping.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4 text-white">Platform</h4>
              <ul className="space-y-2 text-gray-400">
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
              <h4 className="text-lg font-bold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-gray-400">
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
          <div className="text-center text-gray-500 text-sm">
            <p>
              © {new Date().getFullYear()} ResQPlate — Built for Social Impact.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
