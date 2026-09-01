import OpenAI from "openai";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured on the server.",
      });
    }

    const messages = Array.isArray(req.body?.messages)
      ? req.body.messages
      : [];

    const cleanMessages = messages
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim()
      )
      .slice(-30)
      .map((message) => ({
        role: message.role,
        content: message.content.trim().slice(0, 12000),
      }));

    if (!cleanMessages.length) {
      return res.status(400).json({
        error: "No valid messages provided.",
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model,
      instructions:
        "You are DEZN AI. " +
        "Be helpful, concise, accurate, and professional. " +
        "Answer in the same language used by the user unless asked otherwise.",
      input: cleanMessages,
    });

    const text = response.output_text?.trim();

    if (!text) {
      return res.status(502).json({
        error: "The AI returned an empty response.",
      });
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error("DEZN AI API error:", error);

    return res.status(500).json({
      error:
        error?.status === 401
          ? "OpenAI API key is invalid or not authorized."
          : error?.message || "حدث خطأ في الاتصال بالـ AI.",
    });
  }
}
