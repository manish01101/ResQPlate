import React, { useEffect, useState } from "react";
import api from "../utils/api";
import {
  Loader,
  Users,
  UtensilsCrossed,
  ClipboardCheck,
  Check,
  X,
} from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [claims, setClaims] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, donationsRes, claimsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/donations"),
        api.get("/admin/claims"), // Fetch global claims
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setDonations(donationsRes.data.data);
      setClaims(claimsRes.data.data);
    } catch (err) {
      console.error("Failed to load admin data", err);
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
      await fetchData();
    } catch (err) {
      alert("Verification failed");
    }
  };

  const handleReject = async (userId, role) => {
    if (
      !window.confirm(
        `Reject this ${role.toUpperCase()}'s verification request?`,
      )
    )
      return;
    try {
      await api.put(`/admin/users/${userId}/reject`);
      await fetchData();
    } catch (err) {
      alert("Rejection failed");
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

  // Handle accepting or cancelling claims directly from the Admin Panel
  const handleClaimAction = async (claimId, action) => {
    const promptText = action === "accept" ? "approve" : "reject/cancel";
    if (
      !window.confirm(
        `Are you sure you want to ${promptText} this pickup request?`,
      )
    )
      return;
    try {
      await api.put(`/claims/${claimId}/${action}`);
      fetchData(); // Refresh all data to update stats and tables
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${promptText} claim`);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-gray-600 dark:text-slate-400 font-medium">
            Loading Admin Dashboard...
          </p>
        </div>
      </div>
    );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()),
  );

  const pendingVerificationRequests = users.filter(
    (u) =>
      u.role !== "admin" &&
      !u.isVerified &&
      (u.verificationStatus === "pending" || u.verificationDocument),
  );

  const getDocumentPreviewType = (url) => {
    if (!url) return "none";
    if (url.startsWith("data:image/")) return "image";
    if (url.startsWith("data:application/pdf")) return "pdf";
    return "other";
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100">
            Admin Control Panel
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
            Monitor platform health, verify user accounts, and manage global
            donations & claims.
          </p>
        </div>

        {/* METRICS GRID */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-md transition-shadow">
              <div className="text-xs sm:text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Total Users
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-slate-100">
                {stats.totalUsers}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 hover:shadow-md transition-shadow">
              <div className="text-xs sm:text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Total Donations
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-slate-100">
                {stats.totalDonations}
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-4 sm:p-6 rounded-2xl shadow-sm border border-emerald-200 dark:border-emerald-700 hover:shadow-md transition-shadow">
              <div className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-2">
                Completed Pickups
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats.claims.completed || 0}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 p-4 sm:p-6 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-700 hover:shadow-md transition-shadow">
              <div className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2">
                Active Now
              </div>
              <div className="text-2xl sm:text-4xl font-extrabold text-amber-600 dark:text-amber-400">
                {stats.donations.available || 0}
              </div>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 sm:gap-4 mb-6 border-b border-gray-200 dark:border-slate-800 overflow-x-auto">
          <button
            className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-lg transition-all whitespace-nowrap ${
              tab === "users"
                ? "bg-emerald-600 text-white shadow-md -mb-0.5"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
            onClick={() => setTab("users")}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
            <span className="hidden sm:inline">User Management</span>
            <span className="sm:hidden">Users</span>
          </button>

          <button
            className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-lg transition-all whitespace-nowrap ${
              tab === "donations"
                ? "bg-emerald-600 text-white shadow-md -mb-0.5"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
            onClick={() => setTab("donations")}
          >
            <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
            <span className="hidden sm:inline">Global Donations</span>
            <span className="sm:hidden">Donations</span>
          </button>

          <button
            className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-lg transition-all whitespace-nowrap ${
              tab === "claims"
                ? "bg-emerald-600 text-white shadow-md -mb-0.5"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
            onClick={() => setTab("claims")}
          >
            <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
            <span className="hidden sm:inline">Claims & Requests</span>
            <span className="sm:hidden">Claims</span>
          </button>
        </div>

        {/* USERS SECTION */}
        {tab === "users" && (
          <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-800 space-y-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {pendingVerificationRequests.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                        Verification requests waiting for review
                      </h3>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Review submitted identity documents and approve or
                        reject each account.
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      {pendingVerificationRequests.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {pendingVerificationRequests.map((u) => (
                      <div
                        key={u._id}
                        className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm dark:border-amber-800 dark:bg-slate-900"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-slate-100">
                                {u.name}
                              </span>
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                {u.role}
                              </span>
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                {u.verificationStatus || "pending"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-slate-400">
                              <p>{u.email}</p>
                              <p>Phone: {u.phone || "Not provided"}</p>
                              <p>
                                Aadhaar: {u.aadhaarNumber || "Not provided"}
                              </p>
                              <p>
                                Document type:{" "}
                                {u.verificationDocumentType || "Aadhaar"}
                              </p>
                              <p>
                                Submitted:{" "}
                                {u.verificationSubmittedAt
                                  ? new Date(
                                      u.verificationSubmittedAt,
                                    ).toLocaleString()
                                  : "Not submitted"}
                              </p>
                            </div>
                            {u.verificationNotes && (
                              <p className="text-sm text-gray-700 dark:text-slate-300">
                                <span className="font-semibold">
                                  Admin note:
                                </span>{" "}
                                {u.verificationNotes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-3">
                            {u.verificationDocument ? (
                              <div className="w-full min-w-[240px] rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                    Submitted document
                                  </p>
                                  <a
                                    href={u.verificationDocument}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
                                  >
                                    Open in new tab
                                  </a>
                                </div>

                                {getDocumentPreviewType(
                                  u.verificationDocument,
                                ) === "image" ? (
                                  <img
                                    src={u.verificationDocument}
                                    alt="Uploaded verification document"
                                    className="max-h-48 w-full rounded-lg border border-emerald-200 bg-white object-contain dark:border-emerald-800 dark:bg-slate-950"
                                  />
                                ) : getDocumentPreviewType(
                                    u.verificationDocument,
                                  ) === "pdf" ? (
                                  <iframe
                                    src={u.verificationDocument}
                                    title="Uploaded verification document"
                                    className="h-48 w-full rounded-lg border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-slate-950"
                                  />
                                ) : (
                                  <div className="rounded-lg border border-dashed border-emerald-300 bg-white px-3 py-4 text-center text-sm text-emerald-700 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-300">
                                    Preview available in a new tab.
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
                                No document uploaded
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVerify(u._id, u.role)}
                                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(u._id, u.role)}
                                className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-slate-700 text-left text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Name
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Role
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Reliability
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-slate-100">
                          {u.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {u.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-block ${
                            u.role === "admin"
                              ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300"
                              : u.role === "ngo"
                                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                                : "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isVerified ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Verified
                          </span>
                        ) : u.role === "admin" ? (
                          <span className="text-gray-500 dark:text-slate-400 text-xs">
                            N/A
                          </span>
                        ) : u.verificationStatus === "rejected" ? (
                          <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                            <X className="w-4 h-4" />
                            Rejected
                          </span>
                        ) : u.verificationDocument ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <X className="w-4 h-4" />
                            Pending review
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-slate-400 text-xs">
                            Not submitted
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-600 dark:text-slate-400">
                        {((u.reliabilityScore || 0.5) * 100).toFixed(0)}%
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {!u.isVerified && u.role !== "admin" && (
                          <>
                            <button
                              onClick={() => handleVerify(u._id, u.role)}
                              className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 font-bold rounded-lg transition-colors text-xs whitespace-nowrap"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(u._id, u.role)}
                              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-lg transition-colors text-xs whitespace-nowrap"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-lg transition-colors text-xs whitespace-nowrap"
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

            {/* Mobile View for Users */}
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No users found.
              </div>
            )}
          </div>
        )}

        {/* DONATIONS SECTION */}
        {tab === "donations" && (
          <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-slate-700 text-left text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Food Item
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Donor
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Quantity
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Expiry
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {donations.map((d) => (
                    <tr
                      key={d._id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-slate-100">
                        {d.food_title}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                        {d.donor_id?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                        {d.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-block ${
                            d.status === "available"
                              ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                              : d.status === "claimed"
                                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                                : "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400 text-xs sm:text-sm">
                        {new Date(d.expiry_datetime).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {donations.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No donations found.
              </div>
            )}
          </div>
        )}

        {/* CLAIMS & REQUESTS SECTION */}
        {tab === "claims" && (
          <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-slate-700 text-left text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Food Item
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Requested By (NGO)
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300">
                      OTP PIN
                    </th>
                    <th className="px-6 py-4 font-semibold text-gray-700 dark:text-slate-300 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {claims.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-slate-100">
                        {c.donation_id?.food_title || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400">
                        {c.receiver_id?.name || "Unknown"}
                        <div className="text-xs text-gray-400">
                          {c.receiver_id?.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-block ${
                            c.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.status === "accepted"
                                ? "bg-blue-100 text-blue-800"
                                : c.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                        {c.pickup_pin || "---"}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {c.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleClaimAction(c._id, "accept")}
                              className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg transition-colors text-xs whitespace-nowrap"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleClaimAction(c._id, "cancel")}
                              className="px-3 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors text-xs whitespace-nowrap"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {c.status === "accepted" && (
                          <button
                            onClick={() => handleClaimAction(c._id, "cancel")}
                            className="px-3 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors text-xs whitespace-nowrap"
                          >
                            Cancel Request
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View for Claims */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-slate-700">
              {claims.map((c) => (
                <div key={c._id} className="p-4 space-y-3">
                  <h3 className="font-bold text-gray-900 dark:text-slate-100">
                    {c.donation_id?.food_title}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-slate-400">
                    <p>
                      <span className="font-medium">NGO:</span>{" "}
                      {c.receiver_id?.name || "Unknown"}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {c.receiver_id?.phone || "Unknown"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-block ${
                        c.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "accepted"
                            ? "bg-blue-100 text-blue-800"
                            : c.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="font-mono font-bold text-emerald-600">
                      PIN: {c.pickup_pin || "---"}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {c.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleClaimAction(c._id, "accept")}
                          className="flex-1 px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold rounded-lg transition-colors text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleClaimAction(c._id, "cancel")}
                          className="flex-1 px-3 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {c.status === "accepted" && (
                      <button
                        onClick={() => handleClaimAction(c._id, "cancel")}
                        className="flex-1 px-3 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors text-xs"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {claims.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No requests found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
