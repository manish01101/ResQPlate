import React from "react";
import { formatExpiry } from "../utils/haversine";
import { MapPin, Clock, Leaf, AlertCircle } from "lucide-react";

export default function DonationCard({
  donation,
  distanceKm,
  onClaim,
  userRole,
  isVerificationBlocked = false,
  onVerifyRequired,
}) {
  const isVegetarian =
    donation.food_type === "vegetarian" || donation.food_type === "vegan";
  const isExpiringSoon =
    new Date(donation.expiry_datetime) - new Date() < 30 * 60 * 1000; // Less than 30 min

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-200 group">
      {/* Image Section */}
      {donation.image_url ? (
        <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-slate-800 relative group-hover:scale-105 transition-transform duration-200 origin-center">
          <img
            src={donation.image_url}
            alt={donation.food_title}
            className="h-full w-full object-cover"
          />
          {isExpiringSoon && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
              <AlertCircle className="w-3 h-3" />
              Expiring Soon
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-slate-800 dark:to-slate-700 text-6xl group-hover:scale-105 transition-transform duration-200 origin-center">
          🍽️
        </div>
      )}

      {/* Status and Distance Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
          ● {donation.status}
        </span>
        {distanceKm && (
          <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 whitespace-nowrap">
            📍 {distanceKm} km
          </span>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex-grow flex flex-col">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100 leading-snug mb-3 line-clamp-2">
          {donation.food_title}
        </h3>

        {/* Info Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
            <span>👥</span>
            <span className="whitespace-nowrap">{donation.quantity}</span>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap ${
              isExpiringSoon
                ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {formatExpiry(donation.expiry_datetime)}
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
              isVegetarian
                ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            {isVegetarian ? "Vegetarian" : "Non-Veg"}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2 mt-auto">
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-400">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span className="line-clamp-2">{donation.location?.address}</span>
          </div>

          {/* Notes */}
          {donation.notes && (
            <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/70 p-3 rounded-lg border border-gray-100 dark:border-slate-700 mt-3">
              <span className="text-lg flex-shrink-0">💬</span>
              <span className="italic line-clamp-2">"{donation.notes}"</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Donor Info & Action */}
      <div className="px-4 sm:px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700 flex items-center justify-center text-emerald-50 font-bold text-sm flex-shrink-0">
            {donation.donor_id?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 truncate">
            {donation.donor_id?.name}
          </span>
        </div>

        {userRole === "ngo" && donation.status === "available" && (
          <button
            onClick={() =>
              isVerificationBlocked ? onVerifyRequired() : onClaim(donation._id)
            }
            className="inline-flex items-center px-4 py-2 border border-transparent text-xs sm:text-sm font-bold rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-slate-900 transition-all active:translate-y-0.5 whitespace-nowrap"
          >
            {isVerificationBlocked ? "Verify to Claim" : "Claim Pickup"}
          </button>
        )}
      </div>
    </div>
  );
}
