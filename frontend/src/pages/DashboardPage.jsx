import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.role === "admin") {
      api
        .get("/admin/stats")
        .then((r) => setStats(r.data.data))
        .catch(() => {});
    }
  }, [user]);

  return (
    <div className="w-full pb-12 dark:bg-slate-950 min-h-screen">
      <div className="bg-emerald-800 pb-32 pt-14 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Welcome back, {user?.name} 👋
              </h1>
              <p className="mt-2 text-emerald-100 text-lg">
                Here's what's happening with your food rescue impact today.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center bg-emerald-900/50 rounded-lg p-3 border border-emerald-700/50 backdrop-blur-sm">
              <span className="text-emerald-100 text-sm mr-3">
                Current Role:
              </span>
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="-mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {user?.role === "admin" && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Total Users
              </p>
              <p className="mt-2 text-4xl font-extrabold text-gray-900">
                {Object.values(stats.users).reduce((a, b) => a + b, 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Total Donations
              </p>
              <p className="mt-2 text-4xl font-extrabold text-gray-900">
                {stats.totalDonations}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md border-b-4 border-b-emerald-500 p-6 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50"></div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide relative z-10">
                Successful Pickups
              </p>
              <p className="mt-2 text-4xl font-extrabold text-emerald-600 relative z-10">
                {stats.claims.completed || 0}
              </p>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-8 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(user?.role === "donor" || user?.role === "admin") && (
            <div
              onClick={() => navigate("/donate")}
              className="group bg-white p-8 rounded-xl cursor-pointer shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 flex flex-col"
            >
              <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                📤
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Post a Donation
              </h3>
              <p className="text-gray-500 flex-grow">
                Share your surplus food instantly with verified local NGOs. The
                process takes less than a minute.
              </p>
              <div className="mt-4 text-emerald-600 font-semibold text-sm flex items-center">
                Get started{" "}
                <span className="ml-1 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>
          )}

          {user?.role !== "donor" && (
            <div
              onClick={() => navigate("/find-food")}
              className="group bg-white p-8 rounded-xl cursor-pointer shadow-sm border border-gray-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 flex flex-col"
            >
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                🗺️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Find Food Near You
              </h3>
              <p className="text-gray-500 flex-grow">
                Locate available donations in your vicinity on the live
                interactive map using real-time spatial data.
              </p>
              <div className="mt-4 text-blue-600 font-semibold text-sm flex items-center">
                Open Map{" "}
                <span className="ml-1 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
