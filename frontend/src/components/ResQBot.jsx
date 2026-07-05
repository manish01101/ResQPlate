import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineXMark,
  HiOutlinePaperAirplane,
  HiOutlineChevronDown,
  HiOutlineCamera,
  HiOutlineTrash,
} from "react-icons/hi2";
import { Groq } from "groq-sdk";

const SYSTEM_INSTRUCTION = `You are ResQBot, the AI assistant for ResQPlate — a real-time food rescue platform. 
Use a warm, professional, and eco-conscious tone. Use occasional botanical or food emojis (🌿, 🍱).

PLATFORM KNOWLEDGE:
1. Matching: We use geo-spatial technology to instantly connect Donors with nearby verified NGOs.
2. Routing Algorithm: We use a 'Modified Firefly Algorithm (mod-FA)' to prioritize reliable volunteers.
3. Food Freshness: Auto-expires un-claimed food every 5 minutes.
4. Roles: Donors (post food), NGOs/Volunteers (claim and pick up food), Admins (monitor platform).

RULES:
- Keep answers concise. Max 3 short paragraphs.
- If users ask how to do something, guide them to the 'Dashboard' or 'Find Food' map.
- If analyzing food, provide estimated shelf life and safety tips.`;

const QUICK_REPLIES = [
  { label: "How to donate food?", emoji: "🍱" },
  { label: "How does matching work?", emoji: "🧠" },
  { label: "Is the food safe?", emoji: "🛡️" },
  { label: "Find NGOs near me", emoji: "📍" },
];

let groqClient = null;
try {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (key) {
    groqClient = new Groq({
      apiKey: key,
      dangerouslyAllowBrowser: true,
    });
  }
} catch (e) {
  console.error(e);
}

const FALLBACK_MESSAGE =
  "ResQBot is currently tending to the garden, but I will be back soon! 🌿";

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class='bg-gray-100 dark:bg-gray-800 px-1 rounded'>$1</code>")
    .replace(/\n/g, "<br/>");
}

const BotAvatar = ({ pulse }) => (
  <div
    className={`relative flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-500 shadow-md text-sm ${pulse ? "ring-4 ring-emerald-500/20 shadow-emerald-500/30" : ""}`}
  >
    🤖
    {pulse && (
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-900 animate-pulse" />
    )}
  </div>
);

const TypingDots = () => (
  <div className="flex items-center gap-1.5 p-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
        animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.15,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

const HeaderBtn = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
  >
    {children}
  </button>
);

const ActionBtn = ({ onClick, disabled, active, title, children }) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    title={title}
    whileTap={!disabled ? { scale: 0.9 } : {}}
    className={`w-9 h-9 flex shrink-0 items-center justify-center rounded-xl transition-all ${
      disabled
        ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400"
        : active
          ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md hover:-translate-y-px shadow-emerald-600/30"
          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
    }`}
  >
    {children}
  </motion.button>
);

export default function ResQBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatHistoryRef = useRef([]);

  useEffect(() => {
    if (!isMinimized)
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isMinimized]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting =
        "Hey there! 👋 I'm *ResQBot* — your AI-powered food rescue assistant. I can help you donate surplus food, connect with NGOs, and fight food waste. What can I help you with today?";
      setMessages([{ id: Date.now(), text: greeting, sender: "bot" }]);
    }
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnread(false);
    }
  }, [isOpen, isMinimized, messages.length]);

  const sendMessage = useCallback(
    async (textOverride) => {
      const messageText = (textOverride ?? inputValue).trim();
      if (!messageText && !imageBase64) return;
      if (isTyping || isAnalyzingImage) return;

      const userMsg = {
        id: Date.now(),
        text: messageText || "📷 Analyzing food image…",
        sender: "user",
        imagePreview: imagePreview,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");

      const capturedImage = imageBase64;
      setImageBase64(null);
      setImagePreview(null);
      setIsTyping(true);

      let parts = [];
      if (capturedImage) {
        setIsAnalyzingImage(true);
        const base64Data = capturedImage.replace(/^data:.+;base64,/, "");
        const prompt =
          messageText ||
          "Identify this food item. List its main ingredients, estimated shelf life, storage tips, and food safety warnings. Use emojis 🍎";
        parts = [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
        ];
      } else {
        parts = [{ text: messageText }];
      }

      chatHistoryRef.current.push({ role: "user", parts });

      try {
        if (!groqClient) throw new Error("Groq client not initialized");

        const apiMessages = [{ role: "system", content: SYSTEM_INSTRUCTION }];
        chatHistoryRef.current.forEach((entry) => {
          const text = entry.parts
            .map((p) => p.text)
            .filter(Boolean)
            .join(" ");
          if (text)
            apiMessages.push({
              role: entry.role === "user" ? "user" : "assistant",
              content: text,
            });
        });

        const response = await groqClient.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 300,
        });

        const responseText = response.choices[0].message.content.trim();
        chatHistoryRef.current.push({
          role: "model",
          parts: [{ text: responseText }],
        });
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, text: responseText, sender: "bot" },
        ]);

        if (!isOpen || isMinimized) setHasUnread(true);
      } catch (error) {
        chatHistoryRef.current.pop();
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, text: FALLBACK_MESSAGE, sender: "bot" },
        ]);
      } finally {
        setIsTyping(false);
        setIsAnalyzingImage(false);
      }
    },
    [
      inputValue,
      isTyping,
      isAnalyzingImage,
      isOpen,
      isMinimized,
      imageBase64,
      imagePreview,
    ],
  );

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleReset = () => {
    chatHistoryRef.current = [];
    setImageBase64(null);
    setImagePreview(null);
    setMessages([
      {
        id: Date.now(),
        text: "Chat cleared! How can I help you? 👋",
        sender: "bot",
      },
    ]);
  };

  const canSend =
    !!(inputValue.trim() || imageBase64) && !isTyping && !isAnalyzingImage;

  return (
    <>
      <style>{`
        .resqbot-scrollbar::-webkit-scrollbar { width: 5px; }
        .resqbot-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .resqbot-scrollbar::-webkit-scrollbar-thumb { border-radius: 10px; background: rgba(156, 163, 175, 0.5); }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 md:right-6 w-[360px] h-[540px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-110px)] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-emerald-100 dark:border-gray-800 z-[1000] overflow-hidden"
          >
            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-900 to-emerald-700 shrink-0">
              <div className="flex items-center gap-3">
                <BotAvatar pulse={!isMinimized} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm">
                      ResQBot
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                      AI
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-100/70 text-[10px]">
                      Online · Food Rescue Expert
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <HeaderBtn onClick={handleReset} title="Clear Chat">
                  <HiOutlineTrash size={16} />
                </HeaderBtn>
                <HeaderBtn
                  onClick={() => setIsMinimized(!isMinimized)}
                  title="Minimize"
                >
                  <HiOutlineChevronDown
                    size={16}
                    className={`transition-transform ${isMinimized ? "rotate-180" : ""}`}
                  />
                </HeaderBtn>
                <HeaderBtn onClick={() => setIsOpen(false)} title="Close">
                  <HiOutlineXMark size={18} />
                </HeaderBtn>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="flex flex-col flex-1 overflow-hidden"
                >
                  <div className="relative flex-1 min-h-0 overflow-y-auto bg-emerald-50/30 dark:bg-[#0f1117] resqbot-scrollbar p-4 flex flex-col gap-4">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2.5 items-end ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
                      >
                        {msg.sender === "bot" && <BotAvatar />}
                        <div
                          className={`flex flex-col gap-1 max-w-[80%] ${msg.sender === "user" ? "items-end" : "items-start"}`}
                        >
                          {msg.imagePreview && (
                            <img
                              src={msg.imagePreview}
                              alt="upload"
                              className="w-40 h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                            />
                          )}
                          <div
                            className={`px-3.5 py-2.5 text-[13px] leading-relaxed break-words shadow-sm ${
                              msg.sender === "user"
                                ? "bg-emerald-600 text-white rounded-2xl rounded-br-sm"
                                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm"
                            }`}
                            dangerouslySetInnerHTML={
                              msg.sender === "bot"
                                ? { __html: parseMarkdown(msg.text) }
                                : undefined
                            }
                          >
                            {msg.sender === "user" ? msg.text : undefined}
                          </div>
                          <span className="text-[10px] text-gray-400 px-1">
                            {formatTime(msg.id)}
                          </span>
                        </div>
                      </motion.div>
                    ))}

                    {isTyping && (
                      <div className="flex gap-2.5 items-end">
                        <BotAvatar />
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3.5 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                          <TypingDots />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {messages.length <= 1 && !isTyping && (
                    <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-[#0f1117] border-t border-emerald-50 dark:border-gray-800 shrink-0">
                      {QUICK_REPLIES.map(({ label, emoji }) => (
                        <button
                          key={label}
                          onClick={() => sendMessage(label)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                        >
                          {emoji} {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {imagePreview && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="w-10 h-10 object-cover rounded-md"
                      />
                      <div className="flex-1 text-xs">
                        <p className="font-semibold text-gray-700 dark:text-gray-200">
                          Image attached
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-[10px]">
                          Ready to analyze
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setImageBase64(null);
                          setImagePreview(null);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <HiOutlineXMark size={16} />
                      </button>
                    </div>
                  )}

                  <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex items-end gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                      />

                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height =
                            Math.min(e.target.scrollHeight, 96) + "px";
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Ask ResQBot..."
                        rows={1}
                        disabled={isTyping || isAnalyzingImage}
                        className="flex-1 max-h-24 min-h-[40px] resize-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resqbot-scrollbar"
                      />

                      <div className="flex gap-1.5 mb-0.5">
                        <ActionBtn
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isTyping || isAnalyzingImage}
                          active={!!imageBase64}
                          title="Attach Image"
                        >
                          <HiOutlineCamera size={18} />
                        </ActionBtn>

                        <ActionBtn
                          onClick={() => sendMessage()}
                          disabled={!canSend}
                          active={canSend}
                          title="Send Message"
                        >
                          <HiOutlinePaperAirplane
                            size={18}
                            className="translate-x-[1px]"
                          />
                        </ActionBtn>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) setIsMinimized(false);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-600/40 z-[1000] text-2xl"
      >
        <AnimatePresence mode="wait">
          {isOpen && !isMinimized ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <HiOutlineXMark size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              🤖
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}