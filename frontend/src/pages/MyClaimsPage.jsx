import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import ActivePickupMap from "../components/ActivePickupMap";
import { Loader, Clock, AlertCircle, Trash2, Phone } from "lucide-react";

export default function MyClaimsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [donorTab, setDonorTab] = useState("requests");
  const [activePickup, setActivePickup] = useState(null);
  const [pinInputs, setPinInputs] = useState({});

  const verificationBlocked =
    (user?.role === "donor" || user?.role === "ngo") && !user?.isVerified;

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      if (verificationBlocked) {
        setClaims([]);
        setMyDonations([]);
        setLoading(false);
        return;
      }
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

  const handleClaimAction = async (claimId, action, payload = {}) => {
    try {
      await api.put(`/claims/${claimId}/${action}`, payload);
      fetchAllData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || "Action failed. Please try again.");
    }
  };

  const handlePinChange = (claimId, value) => {
    // Only allow numbers and max 4 digits
    if (/^\d{0,4}$/.test(value)) {
      setPinInputs((prev) => ({ ...prev, [claimId]: value }));
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
        return "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700";
      case "accepted":
        return "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700";
      case "cancelled":
      case "expired":
        return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700";
      default:
        return "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700";
    }
  };

  if (verificationBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
        <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
          <div className="text-4xl mb-3">🛡️</div>
          <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-300">
            Verification required
          </h2>
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
            Your account must be approved by an admin before you can manage
            donations or pickup requests.
          </p>
          <button
            onClick={() => navigate("/verify")}
            className="mt-6 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white"
          >
            Go to verification
          </button>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-gray-600 dark:text-slate-400 font-medium">
            Loading your claims...
          </p>
        </div>
      </div>
    );

  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100">
            {user?.role === "donor" ? "Manage Donations" : "My Claims"}
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
            {user?.role === "donor"
              ? "Review incoming pickup requests and manage your active food listings."
              : "Track the status of your food pickup requests."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-200 text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        {/* DONOR TABS */}
        {user?.role === "donor" && (
          <div className="flex gap-2 sm:gap-4 mb-6 border-b border-gray-200 dark:border-slate-800 overflow-x-auto">
            <button
              className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-lg transition-all whitespace-nowrap ${
                donorTab === "requests"
                  ? "bg-emerald-600 text-white shadow-md -mb-0.5"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
              onClick={() => setDonorTab("requests")}
            >
              🔔 Requests
              <span className="ml-1.5 inline-flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {claims.filter((c) => c.status === "pending").length}
              </span>
            </button>
            <button
              className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-lg transition-all whitespace-nowrap ${
                donorTab === "listings"
                  ? "bg-emerald-600 text-white shadow-md -mb-0.5"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
              onClick={() => setDonorTab("listings")}
            >
              📋 Listings
              <span className="ml-1.5 inline-flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {myDonations.length}
              </span>
            </button>
          </div>
        )}

        {/* CLAIMS / REQUESTS SECTION */}
        {(!user ||
          user.role === "ngo" ||
          (user.role === "donor" && donorTab === "requests")) && (
          <>
            {claims.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">
                  {user?.role === "donor"
                    ? "No incoming requests yet. Your food donations will appear here."
                    : "No claims found. Go to the map to find food near you!"}
                </p>
              </div>
            ) : (
              /* Changed from space-y-4 to a responsive grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {claims.map((claim) => (
                  <div
                    key={claim._id}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 leading-snug truncate">
                          {claim.donation_id?.food_title || "Unknown food"}
                        </h3>
                        {user?.role === "donor" && (
                          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 truncate">
                            Requested by:{" "}
                            <span className="font-semibold text-gray-900 dark:text-slate-100">
                              {claim.receiver_id?.name}
                            </span>
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-bold uppercase rounded-full border whitespace-nowrap flex-shrink-0 ${getStatusColor(claim.status)}`}
                      >
                        {claim.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-slate-800 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                        <span>👥</span>
                        <span>{claim.donation_id?.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(claim.requestedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Spacer to push actions to the bottom if cards have different heights */}
                    <div className="flex-grow"></div>

                    {(claim.status === "accepted" ||
                      claim.status === "completed") && (
                      <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-800/70">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-400">
                          <Phone className="h-3.5 w-3.5" />
                          Contact details
                        </div>
                        <div className="mt-2 space-y-2 text-sm text-gray-700 dark:text-slate-300">
                          <a
                            href={`tel:${user?.role === "donor" ? claim.receiver_id?.phone : claim.donation_id?.donor_id?.phone}`}
                            className="block rounded-lg border border-gray-200 bg-white px-3 py-2 font-medium hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900"
                          >
                            {user?.role === "donor"
                              ? "NGO phone"
                              : "Donor phone"}
                            :{" "}
                            {user?.role === "donor"
                              ? claim.receiver_id?.phone || "Not shared yet"
                              : claim.donation_id?.donor_id?.phone ||
                                "Not shared yet"}
                          </a>
                          <a
                            href={`tel:${user?.phone}`}
                            className="block rounded-lg border border-gray-200 bg-white px-3 py-2 font-medium hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900"
                          >
                            Your phone: {user?.phone || "Not shared yet"}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* OTP Display for Donor (Accepted Status) */}
                    {user?.role === "donor" &&
                      claim.status === "accepted" &&
                      claim.pickup_pin && (
                        <div className="mb-4 p-4 text-center bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border border-emerald-200 dark:border-emerald-700 rounded-xl">
                          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                            📌 Share this PIN with the volunteer
                          </p>
                          <p className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-widest font-mono">
                            {claim.pickup_pin}
                          </p>
                        </div>
                      )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 sm:gap-3">
                      {/* Donor Actions - Pending Request */}
                      {user?.role === "donor" && claim.status === "pending" && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <button
                            onClick={() =>
                              handleClaimAction(claim._id, "accept")
                            }
                            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors active:translate-y-0.5 shadow-sm"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() =>
                              handleClaimAction(claim._id, "cancel")
                            }
                            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:translate-y-0.5"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}

                      {/* Live Track Button */}
                      {claim.status === "accepted" && (
                        <button
                          onClick={() => setActivePickup(claim)}
                          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md hover:shadow-lg active:translate-y-0.5 text-sm"
                        >
                          📍 Live Track Pickup
                        </button>
                      )}

                      {/* NGO OTP Input - Accepted Status */}
                      {user?.role === "ngo" && claim.status === "accepted" && (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="4-Digit PIN"
                            value={pinInputs[claim._id] || ""}
                            onChange={(e) =>
                              handlePinChange(claim._id, e.target.value)
                            }
                            maxLength="4"
                            className="w-full px-4 py-2.5 text-center font-mono font-bold text-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:focus:ring-emerald-400"
                          />
                          <button
                            onClick={() =>
                              handleClaimAction(claim._id, "complete", {
                                pin: pinInputs[claim._id],
                              })
                            }
                            disabled={
                              !pinInputs[claim._id] ||
                              pinInputs[claim._id].length !== 4
                            }
                            className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-md active:translate-y-0.5 text-sm"
                          >
                            Verify & Complete
                          </button>
                        </div>
                      )}

                      {/* NGO Cancel Button */}
                      {user?.role === "ngo" &&
                        (claim.status === "pending" ||
                          claim.status === "accepted") && (
                          <button
                            onClick={() =>
                              handleClaimAction(claim._id, "cancel")
                            }
                            className="w-full mt-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:translate-y-0.5 text-sm"
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

        {/* DONOR LISTINGS SECTION */}
        {user?.role === "donor" && donorTab === "listings" && (
          <>
            {myDonations.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
                <div className="text-4xl mb-3">🍽️</div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">
                  You haven't posted any food donations yet.
                </p>
              </div>
            ) : (
              /* Changed from space-y-4 to a responsive grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {myDonations.map((donation) => (
                  <div
                    key={donation._id}
                    className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 leading-snug truncate">
                          {donation.food_title}
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-bold uppercase rounded-full border whitespace-nowrap flex-shrink-0 ${getStatusColor(donation.status)}`}
                      >
                        {donation.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-slate-800 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                        <span>👥</span>
                        <span>{donation.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(donation.expiry_datetime).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Spacer */}
                    <div className="flex-grow"></div>

                    {donation.status === "available" && (
                      <button
                        onClick={() => handleDeleteDonation(donation._id)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:translate-y-0.5 text-sm flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Listing
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activePickup && (
          <ActivePickupMap
            claim={activePickup}
            userRole={user.role}
            onClose={() => setActivePickup(null)}
          />
        )}
      </div>
    </div>
  );
}
