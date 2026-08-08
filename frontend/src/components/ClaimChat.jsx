import React, { useState, useEffect, useRef } from "react";
import { Send, X } from "lucide-react";
import api from "../utils/api";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";

export default function ClaimChat({ claim, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get(`/chat/${claim._id}`);
        if (mounted) setMessages(res.data.data || []);
        api.put(`/chat/${claim._id}/read`).catch(() => {});
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [claim._id]);

  // Subscribe this socket to the claim room so live chat frames arrive,
  // and re-subscribe if the WebSocket reconnects while the chat is open.
  useEffect(() => {
    const join = () => socket.emit("joinPickup", claim._id);
    socket.on("connect", join);
    join();

    return () => {
      socket.off("connect", join);
      socket.emit("leavePickup", claim._id);
    };
  }, [claim._id]);

  const appendMessage = (m) => {
    if (!m?._id) return;
    setMessages((prev) =>
      prev.some((x) => String(x._id) === String(m._id))
        ? prev
        : [...prev, m],
    );
  };

  // Listen for live chat frames from the raw WebSocket connection
  useEffect(() => {
    const handler = (msg) => {
      if (
        msg?.type === "chat" &&
        String(msg?.data?.claim_id) === String(claim._id)
      ) {
        appendMessage(msg.data);
      }
    };
    socket.on("chat", handler);
    return () => socket.off("chat", handler);
  }, [claim._id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody("");
    try {
      const res = await api.post(`/chat/${claim._id}`, { body: text });
      // Optimistically append the returned message so the sender sees it
      // instantly even if the socket is mid-reconnect.
      appendMessage(res.data.data);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center sm:bg-black/60 sm:p-4 sm:backdrop-blur-sm">
      <div className="w-full h-[100dvh] sm:h-[80vh] sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <h3 className="font-bold text-gray-900 dark:text-slate-100">
            💬 Pickup Chat
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-950/50">
          {loading ? (
            <p className="text-center text-sm text-gray-400 py-6">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">
              No messages yet. Say hi to coordinate the pickup!
            </p>
          ) : (
            messages.map((m) => {
              const mine =
                String(m.sender_id) === String(user?._id ?? user?.id);
              return (
                <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                      mine
                        ? "bg-emerald-600 text-white rounded-br-sm"
                        : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-100 rounded-bl-sm"
                    }`}
                  >
                    {!mine && (
                      <p className="text-[10px] font-bold mb-1 text-gray-400">
                        {m.sender_name}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p
                      className={`text-[10px] mt-1 ${mine ? "text-emerald-200" : "text-gray-400 dark:text-slate-500"}`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        <form
          onSubmit={sendMessage}
          className="px-3 py-3 border-t border-gray-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
        >
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            maxLength="2000"
            className="flex-1 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!body.trim()}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}