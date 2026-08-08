const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

// Dedicated limiter so chat abuse cannot drain the shared /api budget
const botLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many bot requests, please slow down." },
});

// @route  POST /api/bot/chat
// @desc   Proxy chat completions to Groq with the server-side API key
// @access Public (rate-limited)
router.post("/chat", botLimiter, async (req, res) => {
  try {
    const apiKey =
      process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: "AI assistant is not configured.",
      });
    }

    const { messages, vision } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "messages are required" });
    }
    if (messages.length > 50) {
      return res
        .status(400)
        .json({ success: false, message: "Too many messages" });
    }
    if (JSON.stringify(messages).length > 250_000) {
      return res
        .status(400)
        .json({ success: false, message: "Payload too large" });
    }

    const model = vision
      ? process.env.GROQ_VISION_MODEL || "llama-3.2-11b-vision-preview"
      : process.env.GROQ_BOT_MODEL || "llama-3.1-8b-instant";

    const response = await fetch(GROQ_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[bot] Groq error:",
        response.status,
        errorText.slice(0, 500),
      );
      return res.status(502).json({
        success: false,
        message: "AI request failed, please try again.",
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    res.json({ success: true, data: { content } });
  } catch (err) {
    console.error("[bot] Proxy error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
