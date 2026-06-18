import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function MyClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [donorTab, setDonorTab] = useState("requests"); // 'requests' | 'listings'

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch Claims (Outgoing for NGOs, Incoming for Donors)
      const claimsRes = await api.get("/claims/my");
      setClaims(claimsRes.data.data || []);

      // If Donor, fetch their personal listings too
      if (user?.role === "donor") {
        const donationsRes = await api.get("/donations/my");
        setMyDonations(donationsRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAction = async (claimId, action) => {
    try {
      await api.put(`/claims/${claimId}/${action}`);
      fetchAllData(); // Refresh data
    } catch (err) {
      alert("Action failed. Please try again.");
    }
  };

  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;
    try {
      await api.delete(`/donations/${donationId}`);
      fetchAllData();
    } catch (err) {
      alert("Failed to delete donation");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
      case "expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  if (loading)
    return (
      <div className="text-center p-20 text-gray-500">Loading data...</div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 dark:text-slate-200">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-slate-100">
          {user?.role === "donor" ? "Manage Donations" : "My Claims"}
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          {user?.role === "donor"
            ? "Review incoming pickup requests and manage your active food listings."
            : "Track the status of your food pickup requests."}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* DONOR TABS */}
      {user?.role === "donor" && (
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-slate-800 pb-px">
          <button
            className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${donorTab === "requests" ? "bg-white dark:bg-slate-900 border-t border-x border-gray-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm relative top-px" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"}`}
            onClick={() => setDonorTab("requests")}
          >
            🔔 Incoming Requests (
            {claims.filter((c) => c.status === "pending").length})
          </button>
          <button
            className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${donorTab === "listings" ? "bg-white dark:bg-slate-900 border-t border-x border-gray-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm relative top-px" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"}`}
            onClick={() => setDonorTab("listings")}
          >
            📋 My Food Listings
          </button>
        </div>
      )}

      {/* ========================================== */}
      {/* VIEW: CLAIMS / REQUESTS (Used by Donor & NGO) */}
      {/* ========================================== */}
      {(!user ||
        user.role === "ngo" ||
        (user.role === "donor" && donorTab === "requests")) && (
        <>
          {claims.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 shadow-sm">
              {user?.role === "donor"
                ? "No incoming requests yet."
                : "No claims found. Go to the map to find food near you!"}
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div
                  key={claim._id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {claim.donation_id?.food_title || "Unknown food"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      👥 {claim.donation_id?.quantity}
                      {user?.role === "donor" && (
                        <span className="mx-2">•</span>
                      )}
                      {user?.role === "donor" && (
                        <span>
                          Requested by:{" "}
                          <strong className="text-gray-700">
                            {claim.receiver_id?.name}
                          </strong>
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-slate-500">
                      <span>
                        Requested:{" "}
                        {new Date(claim.requestedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getStatusColor(claim.status)}`}
                    >
                      {claim.status}
                    </span>

                    {/* DONOR ACTIONS */}
                    {user?.role === "donor" && claim.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleClaimAction(claim._id, "accept")}
                          className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition"
                        >
                          Approve Pickup
                        </button>
                        <button
                          onClick={() => handleClaimAction(claim._id, "cancel")}
                          className="px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {/* NGO ACTIONS */}
                    {user?.role === "ngo" && claim.status === "accepted" && (
                      <button
                        onClick={() => handleClaimAction(claim._id, "complete")}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm"
                      >
                        ✅ Mark as Picked Up
                      </button>
                    )}
                    {user?.role === "ngo" &&
                      (claim.status === "pending" ||
                        claim.status === "accepted") && (
                        <button
                          onClick={() => handleClaimAction(claim._id, "cancel")}
                          className="px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition"
                        >
                          Cancel Request
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========================================== */}
      {/* VIEW: DONOR LISTINGS */}
      {/* ========================================== */}
      {user?.role === "donor" && donorTab === "listings" && (
        <>
          {myDonations.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 shadow-sm">
              You haven't posted any food donations yet.
            </div>
          ) : (
            <div className="space-y-4">
              {myDonations.map((donation) => (
                <div
                  key={donation._id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {donation.food_title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      👥 {donation.quantity} <span className="mx-2">•</span> ⏱
                      Expires:{" "}
                      {new Date(donation.expiry_datetime).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getStatusColor(donation.status)}`}
                    >
                      {donation.status}
                    </span>

                    {donation.status === "available" && (
                      <button
                        onClick={() => handleDeleteDonation(donation._id)}
                        className="px-4 py-2 bg-white border border-red-300 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 transition"
                      >
                        Delete Listing
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
