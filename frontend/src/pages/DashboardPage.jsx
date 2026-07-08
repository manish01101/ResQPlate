import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";

// Reusable UI component for stats to keep code DRY
const StatCard = ({
  title,
  value,
  valueColor = "text-gray-900 dark:text-slate-100",
  bgClass = "bg-white dark:bg-slate-900",
  borderColor = "border-gray-200 dark:border-slate-800",
  titleColor = "text-gray-500 dark:text-slate-400",
}) => (
  <div
    className={`${bgClass} border ${borderColor} rounded-2xl shadow-sm p-6 flex flex-col justify-center hover:shadow-md transition-shadow`}
  >
    <p
      className={`text-xs sm:text-sm font-semibold uppercase tracking-wide ${titleColor}`}
    >
      {title}
    </p>
    <p className={`mt-3 text-3xl sm:text-4xl font-extrabold ${valueColor}`}>
      {value}
    </p>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (user?.role === "admin") {
          const res = await api.get("/admin/stats");
          setStats(res.data.data);
        } else if (user?.role === "donor") {
          const res = await api
            .get("/donations/my")
            .catch(() => api.get("/donations"));
          const donations = res.data?.data || [];

          setStats({
            totalPosted: donations.length,
            active: donations.filter((d) => d.status === "available").length,
            completed: donations.filter(
              (d) => d.status === "completed" || d.status === "claimed",
            ).length,
          });
        } else if (user?.role === "ngo") {
          const res = await api.get("/claims/my");
          const claims = res.data?.data || [];

          setStats({
            // Filter out cancelled claims from the total count
            totalClaims: claims.filter((c) => c.status !== "cancelled").length,
            pending: claims.filter((c) => c.status === "pending").length,
            completed: claims.filter((c) => c.status === "completed").length,
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Render logic for different role statistics
  const renderStats = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32 w-full mb-8">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      );
    }

    if (!stats) return null;

    if (user?.role === "admin") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={Object.values(stats.users || {}).reduce((a, b) => a + b, 0)}
          />
          <StatCard title="Total Donations" value={stats.totalDonations || 0} />
          <StatCard
            title="Successful Pickups"
            value={stats.claims?.completed || 0}
            bgClass="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20"
            borderColor="border-emerald-200 dark:border-emerald-700"
            titleColor="text-emerald-700 dark:text-emerald-300"
            valueColor="text-emerald-600 dark:text-emerald-400"
          />
        </div>
      );
    }

    if (user?.role === "donor") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Total Donations Posted"
            value={stats.totalPosted || 0}
          />
          <StatCard
            title="Active Listings"
            value={stats.active || 0}
            valueColor="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="Successful Rescues"
            value={stats.completed || 0}
            bgClass="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20"
            borderColor="border-emerald-200 dark:border-emerald-700"
            titleColor="text-emerald-700 dark:text-emerald-300"
            valueColor="text-emerald-600 dark:text-emerald-400"
          />
        </div>
      );
    }

    if (user?.role === "ngo") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <StatCard title="Total Food Claims" value={stats.totalClaims || 0} />
          <StatCard
            title="Pending Approvals"
            value={stats.pending || 0}
            valueColor="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="Completed Pickups"
            value={stats.completed || 0}
            bgClass="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20"
            borderColor="border-purple-200 dark:border-purple-700"
            titleColor="text-purple-700 dark:text-purple-300"
            valueColor="text-purple-600 dark:text-purple-400"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full pb-12 dark:bg-slate-950 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 dark:from-emerald-900 dark:to-emerald-950 pb-20 pt-8 sm:pt-14 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Welcome back, {user?.name} 👋
              </h1>
              <p className="mt-2 text-emerald-100 text-base sm:text-lg">
                Here's what's happening with your food rescue impact today.
              </p>
            </div>
            <div className="inline-flex items-center bg-emerald-900/50 rounded-lg p-3 border border-emerald-700/50 backdrop-blur-sm w-fit">
              <span className="text-emerald-100 text-xs sm:text-sm mr-3 font-medium">
                Current Role:
              </span>
              <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="-mt-12 sm:-mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Dynamic Stats Section based on Role */}
        {renderStats()}

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {user?.role === "donor" && (
              <button
                onClick={() => navigate("/donate")}
                className="group bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl cursor-pointer shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200 flex flex-col text-left active:translate-y-0.5"
              >
                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  📤
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                  Post a Donation
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 flex-grow">
                  Share your surplus food instantly with verified local NGOs.
                  The process takes less than a minute.
                </p>
                <div className="mt-4 text-emerald-600 dark:text-emerald-400 font-semibold text-sm flex items-center group-hover:translate-x-1 transition-transform">
                  Get started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </button>
            )}

            {user?.role !== "donor" && (
              <button
                onClick={() => navigate("/find-food")}
                className="group bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl cursor-pointer shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 flex flex-col text-left active:translate-y-0.5"
              >
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  🗺️
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                  Find Food Near You
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 flex-grow">
                  Locate available donations in your vicinity on the live
                  interactive map using real-time spatial data.
                </p>
                <div className="mt-4 text-blue-600 dark:text-blue-400 font-semibold text-sm flex items-center group-hover:translate-x-1 transition-transform">
                  Open Map
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </button>
            )}

            {user?.role === "ngo" && (
              <button
                onClick={() => navigate("/my-claims")}
                className="group bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl cursor-pointer shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 flex flex-col text-left active:translate-y-0.5"
              >
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  📋
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                  My Claims
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 flex-grow">
                  Track and manage your food rescue requests and view your
                  successful pickups.
                </p>
                <div className="mt-4 text-purple-600 dark:text-purple-400 font-semibold text-sm flex items-center group-hover:translate-x-1 transition-transform">
                  View Claims
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </button>
            )}

            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="group bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl cursor-pointer shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-lg hover:border-red-300 dark:hover:border-red-600 transition-all duration-200 flex flex-col text-left active:translate-y-0.5"
              >
                <div className="h-12 w-12 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  ⚙️
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                  Admin Panel
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 flex-grow">
                  Monitor platform health, verify user accounts, and view
                  comprehensive statistics.
                </p>
                <div className="mt-4 text-red-600 dark:text-red-400 font-semibold text-sm flex items-center group-hover:translate-x-1 transition-transform">
                  Go to Panel
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
