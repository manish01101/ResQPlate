import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";

const TOAST_STYLE = {
  claim_request: { icon: <Info className="w-5 h-5 text-blue-500" />, label: "New request" },
  claim_accepted: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, label: "Approved" },
  claim_rejected: { icon: <AlertCircle className="w-5 h-5 text-red-500" />, label: "Rejected" },
  claim_cancelled: { icon: <AlertCircle className="w-5 h-5 text-red-500" />, label: "Cancelled" },
  claim_completed: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, label: "Completed" },
  new_donation: { icon: <Info className="w-5 h-5 text-emerald-500" />, label: "New donation" },
  account_verified: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, label: "Verified" },
  account_rejected: { icon: <AlertCircle className="w-5 h-5 text-red-500" />, label: "Verification" },
  chat: { icon: <Info className="w-5 h-5 text-blue-500" />, label: "New message" },
  system: { icon: <Info className="w-5 h-5 text-gray-500" />, label: "System" },
};

let toastId = 0;

export default function ToastContainer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (n) => {
      if (!n || !n.title) return;
      const id = ++toastId;
      setToasts((prev) => [...prev.slice(-3), { id, notification: n }]);
      setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  useEffect(() => {
    if (!user) return;
    socket.on("notification", (msg) => push(msg.notification));
    return () => socket.off("notification");
  }, [user, push]);

  if (toasts.length === 0 || !user) return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[10000] space-y-3 w-[calc(100%-2rem)] sm:w-80">
      {toasts.map(({ id, notification: n }) => {
        const style = TOAST_STYLE[n.type] || TOAST_STYLE.system;
        return (
          <div
            key={id}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 fade-in duration-200"
          >
            <span className="mt-0.5 flex-shrink-0">{style.icon}</span>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
              if (n.link) navigate(n.link);
              dismiss(id);
            }}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                {style.label}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 mt-0.5">
                {n.title}
              </p>
              {n.message && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  {n.message}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 flex-shrink-0 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}