```javascript
import { Groq } from "groq-sdk";

export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Parse request body
  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }

  // Initialize Groq client with API key (kept server‑side only)
  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    // Call the chosen Groq model
    const response = await client.chat.completions.create({
      model: process.env.GROQ_MODEL_ID || "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    // Extract the assistant's reply
    const assistantResponse = response.choices?.[0]?.message?.content ?? "";

    // Return JSON response
    res.status(200).json({ response: assistantResponse });
  } catch (error) {
    console.error("Error calling Groq API:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
}
```