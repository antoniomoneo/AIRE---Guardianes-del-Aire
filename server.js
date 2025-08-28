// server.js
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app    = express();
const PORT   = process.env.PORT || 8080;
const API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json({ limit: "2mb" }));

// Healthcheck
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// Proxy → POST /api/gemini/generate
// Body: { model: "gemini-1.5-flash", contents: [...], generationConfig: {...}, safetySettings: [...] }
app.post("/api/gemini/generate", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY no configurada" });
    }
    const { model = "gemini-1.5-flash", ...payload } = req.body ?? {};
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${API_KEY}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const ctype = r.headers.get("content-type") || "application/json";
    const text  = await r.text();
    res.status(r.status).type(ctype).send(text);
  } catch (e) {
    console.error("[/api/gemini/generate] error:", e);
    res.status(500).json({ error: String(e) });
  }
});

// Estáticos Vite (dist) con caché larga para assets
app.use(
  express.static(path.join(__dirname, "dist"), {
    index: "index.html",
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (/\.(?:js|css|png|jpg|jpeg|gif|ico|svg|webp|woff2?)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});