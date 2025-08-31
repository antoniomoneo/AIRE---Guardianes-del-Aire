// Server Express: sirve dist y expone /api/gemini/generate
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Body parser
app.use(express.json({ limit: "2mb" }));

// Healthcheck simple
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

// Proxy mínimo a Gemini
// Espera body tipo: { model: "gemini-1.5-flash", contents: [...], ... }
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY no configurada" });
    }

    const { model = "gemini-2.5-flash", ...rest } = req.body || {};
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${API_KEY}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rest)
    });

    const ct = r.headers.get("content-type") || "application/json";
    const txt = await r.text(); // devolvemos tal cual
    res.status(r.status).type(ct).send(txt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Estáticos del build de Vite
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server on http://0.0.0.0:${PORT}`);
});