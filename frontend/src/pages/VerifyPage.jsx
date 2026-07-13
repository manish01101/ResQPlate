import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { CheckCircle2, UploadCloud, ShieldCheck, Loader2 } from "lucide-react";

export default function VerifyPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    aadhaarNumber: "",
    documentType: "Aadhaar",
    notes: "",
  });
  const [documentUrl, setDocumentUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getDocumentPreviewType = (url) => {
    if (!url) return "none";
    if (url.startsWith("data:image/")) return "image";
    if (url.startsWith("data:application/pdf")) return "pdf";
    return "other";
  };

  useEffect(() => {
    if (user?.isVerified) {
      navigate(user?.role === "donor" ? "/donate" : "/my-claims", {
        replace: true,
      });
    }
  }, [user, navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setDocumentUrl(reader.result);
        setUploading(false);
        setMessage(
          "Document attached successfully. You can now submit for review.",
        );
      };
      reader.onerror = () => {
        setUploading(false);
        setError("Unable to read the selected file.");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploading(false);
      setError("Upload failed. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentUrl || !form.aadhaarNumber.trim()) {
      setError("Please upload your ID and provide your Aadhaar number.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/users/verify-submit", {
        documentUrl,
        aadhaarNumber: form.aadhaarNumber.trim(),
        documentType: form.documentType,
        notes: form.notes.trim(),
      });
      await refreshUser();
      setMessage(
        res.data.message ||
          "Verification request submitted successfully. Admin review is in progress.",
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Verification submission failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white px-4 py-10 dark:from-slate-950 dark:to-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              Verify your account
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              Admin approval is required before verified donors can post food
              and verified NGOs can claim pickups.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              Aadhaar / Government ID number
            </label>
            <input
              type="text"
              value={form.aadhaarNumber}
              onChange={(e) =>
                setForm({ ...form, aadhaarNumber: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none ring-0 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Enter your Aadhaar number"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              ID type
            </label>
            <select
              value={form.documentType}
              onChange={(e) =>
                setForm({ ...form, documentType: e.target.value })
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="Aadhaar">Aadhaar</option>
              <option value="PAN">PAN</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              Upload ID document
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/70 px-4 py-8 text-center text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
              <UploadCloud className="mb-2 h-7 w-7" />
              <span className="text-sm font-semibold">
                Click to upload a clear photo of your ID
              </span>
              <span className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                PNG, JPG, or PDF supported
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {uploading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing your document...
              </div>
            )}

            {documentUrl && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Uploaded document preview
                  </p>
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
                  >
                    Open in new tab
                  </a>
                </div>

                {getDocumentPreviewType(documentUrl) === "image" ? (
                  <img
                    src={documentUrl}
                    alt="Uploaded verification document"
                    className="max-h-72 w-full rounded-xl border border-emerald-200 object-contain bg-white dark:border-emerald-800 dark:bg-slate-950"
                  />
                ) : getDocumentPreviewType(documentUrl) === "pdf" ? (
                  <iframe
                    src={documentUrl}
                    title="Uploaded verification document"
                    className="h-72 w-full rounded-xl border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-slate-950"
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-emerald-300 bg-white px-4 py-6 text-center text-sm text-emerald-700 dark:border-emerald-800 dark:bg-slate-950 dark:text-emerald-300">
                    Document ready for submission. Open it in a new tab if you
                    want a larger view.
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">
              Notes for admin
            </label>
            <textarea
              rows="4"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Optional details about your organization or role"
            />
          </div>

          {message && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || uploading}
            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {submitting ? "Submitting..." : "Submit for Verification"}
          </button>
        </form>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
          <div className="font-semibold text-gray-900 dark:text-slate-100">
            What happens next?
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your request is sent to the admin for review.</li>
            <li>You can still browse available food while waiting.</li>
            <li>Once approved, you will be able to donate or claim pickups.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
