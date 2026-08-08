import React, { useState } from "react";
import { Star, X } from "lucide-react";
import api from "../utils/api";

export default function RatingModal({ claim, onClose, onRated }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      setError("Please pick a star rating.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/ratings", { claim_id: claim._id, rating, review });
      onRated?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center sm:bg-black/60 sm:p-4 sm:backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
            Rate this pickup
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          How was the rescue of{" "}
          <span className="font-semibold text-gray-800 dark:text-slate-200">
            {claim.donation_id?.food_title || "food"}
          </span>
          ?
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="focus:outline-none"
                aria-label={`Rate ${n} stars`}
              >
                <Star
                  className={`w-9 h-9 transition-colors ${
                    (hover || rating) >= n
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300 dark:text-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Leave a short review (optional)"
            maxLength="1000"
            rows="3"
            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />

          {error && (
            <p className="text-sm font-medium text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 shadow-lg"
          >
            {submitting ? "Submitting..." : "Submit rating"}
          </button>
        </form>
      </div>
    </div>
  );
}