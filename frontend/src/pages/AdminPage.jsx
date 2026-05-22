import React, { useEffect, useState } from "react";
import api from "../utils/api";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, donationsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/donations"),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setDonations(donationsRes.data.data);
    } catch (err) {
      console.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId, role) => {
    if (
      !window.confirm(
        `Approve this ${role.toUpperCase()}'s account verification?`,
      )
    )
      return;
    try {
      await api.put(`/admin/users/${userId}/verify`);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isVerified: true } : u)),
      );
    } catch (err) {
      alert("Verification failed");
    }
  };

  const handleDelete = async (userId) => {
    if (
      !window.confirm("Are you sure you want to delete this user permanently?")
    )
      return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500">
        Loading Admin Dashboard...
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">
          Admin Control Panel
        </h1>
        <p className="text-gray-500 mt-1">
          Monitor platform health and verify user accounts.
        </p>
      </div>

      {/* METRICS GRID */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
              Total Users
            </div>
            <div className="text-4xl font-extrabold text-gray-900">
              {stats.totalUsers}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
              Total Donations
            </div>
            <div className="text-4xl font-extrabold text-gray-900">
              {stats.totalDonations}
            </div>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-200">
            <div className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-1">
              Completed Pickups
            </div>
            <div className="text-4xl font-extrabold text-emerald-600">
              {stats.claims.completed || 0}
            </div>
          </div>
          <div className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200">
            <div className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-1">
              Active Now
            </div>
            <div className="text-4xl font-extrabold text-amber-600">
              {stats.donations.available || 0}
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-px">
        <button
          className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${tab === "users" ? "bg-white border-t border-x border-gray-200 text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setTab("users")}
        >
          👥 User Management
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${tab === "donations" ? "bg-white border-t border-x border-gray-200 text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setTab("donations")}
        >
          🍽️ Global Donations
        </button>
      </div>

      {/* USERS TABLE */}
      {tab === "users" && (
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Role
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Verification
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Reliability
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{u.name}</div>
                      <div className="text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          u.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : u.role === "ngo"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.isVerified ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          Verified
                        </span>
                      ) : u.role === "admin" ? (
                        <span className="text-gray-400">N/A</span>
                      ) : (
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600">
                      {((u.reliabilityScore || 0.5) * 100).toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {!u.isVerified && u.role !== "admin" && (
                        <button
                          onClick={() => handleVerify(u._id, u.role)}
                          className="px-4 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold rounded-lg transition-colors text-xs"
                        >
                          Approve {u.role === "ngo" ? "NGO" : "Donor"}
                        </button>
                      )}

                      {u.role !== "admin" && (
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="px-4 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DONATIONS TABLE */}
      {tab === "donations" && (
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Food Item
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Donor Name
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Quantity
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Expiry Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donations.map((d) => (
                  <tr
                    key={d._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {d.food_title}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {d.donor_id?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{d.quantity}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          d.status === "available"
                            ? "bg-emerald-100 text-emerald-800"
                            : d.status === "claimed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(d.expiry_datetime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
