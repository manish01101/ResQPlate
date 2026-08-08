import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import api from "../utils/api";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";

const TYPE_ICONS = {
  claim_request: "🔔",
  claim_accepted: "✅",
  claim_rejected: "❌",
  claim_cancelled: "🚫",
  claim_completed: "🎉",
  new_donation: "🍽️",
  account_verified: "🛡️",
  account_rejected: "⚠️",
  chat: "💬",
  system: "ℹ️",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!user) return;
      if (!silent) setLoading(true);
      try {
        const res = await api.get("/notifications?limit=30");
        setItems(res.data.data || []);
        setUnread(res.data.unread || 0);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Live updates via raw WebSocket
  useEffect(() => {
    if (!user) return;
    const h = (msg) => {
      if (msg?.notification) {
        setItems((prev) => [msg.notification, ...prev].slice(0, 30));
        setUnread((u) => u + 1);
      }
    };
    socket.on("notification", h);
    return () => socket.off("notification", h);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  const clearAll = async () => {
    try {
      await api.delete("/notifications");
      setItems((prev) => prev.filter((n) => !n.read));
    } catch {
      /* ignore */
    }
  };

  const handleItemClick = (n) => {
    if (!n.read) markRead(n._id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
              Notifications
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={markAllRead}
                disabled={unread === 0}
                title="Mark all as read"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400 disabled:opacity-30"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
              <button
                onClick={clearAll}
                title="Clear read"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex justify-center py-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400 dark:text-slate-500">
                No notifications yet.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleItemClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-slate-800/60 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors flex gap-3 ${
                    n.read ? "opacity-60" : ""
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] || "ℹ️"}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-800 dark:text-slate-200">
                      {n.title}
                    </span>
                    {n.message && (
                      <span className="block text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </span>
                    )}
                    <span className="block text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  {!n.read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}