import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set. Add it to .env");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];

    const cleanMessages = messages
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-30)
      .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));

    if (!cleanMessages.length) {
      return res.status(400).json({ error: "No messages provided." });
    }

    const response = await client.responses.create({
      model,
      instructions:
        "You are DEZN AI. Be helpful, concise, accurate, and professional. " +
        "Answer in the same language used by the user unless asked otherwise.",
      input: cleanMessages
    });

    res.json({
      text: response.output_text || "لم أتمكن من إنشاء رد."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error?.message || "حدث خطأ في الاتصال بالـ AI."
    });
  }
});

app.get("*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`DEZN AI running at http://localhost:${port}`);
});
