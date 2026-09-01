import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

const model =
  process.env.OPENAI_MODEL ||
  "gpt-4o-mini";


/* =========================
   PATH CONFIGURATION
========================= */

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);


/* =========================
   MIDDLEWARE
========================= */

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.static(__dirname)
);


/* =========================
   HEALTH CHECK
========================= */

app.get(
  "/api/health",
  (_req, res) => {

    res.json({
      ok: true,

      openaiConfigured:
        Boolean(
          process.env.OPENAI_API_KEY
        ),

      model
    });

  }
);


/* =========================
   CHAT API
========================= */

app.post(
  "/api/chat",
  async (req, res) => {

    try {

      /* -------------------------
         CHECK API KEY
      ------------------------- */

      if (
        !process.env.OPENAI_API_KEY
      ) {

        return res.status(500).json({

          error:
            "OPENAI_API_KEY is not configured on the server."

        });

      }


      /* -------------------------
         GET MESSAGES
      ------------------------- */

      const messages =
        Array.isArray(
          req.body?.messages
        )
          ? req.body.messages
          : [];


      /* -------------------------
         CLEAN MESSAGES
      ------------------------- */

      const cleanMessages =
        messages

          .filter(message => {

            return (
              message &&
              (
                message.role === "user" ||
                message.role === "assistant"
              ) &&
              typeof message.content ===
                "string" &&
              message.content.trim()
            );

          })

          .slice(-30)

          .map(message => ({

            role:
              message.role,

            content:
              message.content
                .trim()
                .slice(0, 12000)

          }));


      /* -------------------------
         CHECK EMPTY CHAT
      ------------------------- */

      if (
        !cleanMessages.length
      ) {

        return res.status(400).json({

          error:
            "No valid messages provided."

        });

      }


      /* -------------------------
         OPENAI CLIENT
      ------------------------- */

      const client =
        new OpenAI({

          apiKey:
            process.env.OPENAI_API_KEY

        });


      /* -------------------------
         SEND REQUEST
      ------------------------- */

      const response =
        await client.responses.create({

          model,

          instructions:
            "You are DEZN AI. " +
            "Be helpful, concise, accurate, and professional. " +
            "Answer in the same language used by the user unless asked otherwise.",

          input:
            cleanMessages

        });


      /* -------------------------
         GET AI RESPONSE
      ------------------------- */

      const text =
        response.output_text?.trim();


      /* -------------------------
         EMPTY RESPONSE
      ------------------------- */

      if (!text) {

        return res.status(502).json({

          error:
            "The AI returned an empty response."

        });

      }


      /* -------------------------
         RETURN RESPONSE
      ------------------------- */

      return res.json({

        text

      });


    } catch (error) {

      console.error(
        "DEZN AI API error:",
        error
      );


      /* -------------------------
         ERROR HANDLING
      ------------------------- */

      return res.status(500).json({

        error:

          error?.status === 401

            ? "OpenAI API key is invalid or not authorized."

            : error?.message ||

              "حدث خطأ في الاتصال بالـ AI."

      });

    }

  }
);


/* =========================
   FRONTEND FALLBACK
========================= */

app.get(
  "*splat",
  (req, res, next) => {

    if (
      req.path.startsWith("/api/")
    ) {

      return next();

    }

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );

  }
);


/* =========================
   START SERVER
========================= */

app.listen(
  port,
  () => {

    console.log(
      `DEZN AI running on port ${port}`
    );

  }
);