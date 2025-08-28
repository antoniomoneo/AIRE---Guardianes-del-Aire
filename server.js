cd "/Users/kgmt/Documents/GitHub/AIRE---Guardianes-del-Aire"

# server.js: sirve dist y endpoint /api/gemini/generate
cat > server.js <<'EOF'
import express from "express";
import fetch from "node-fetch"; // node18+ trae fetch; por compatibilidad lo importamos
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json({ limit: "2mb" }));

// Proxy mínimo → POST /api/gemini/generate
// Body esperado: { model: "gemini-1.5-flash", contents: [...] }
app.post("/api/gemini/generate", async (req, res) => {
  try {
    if (!API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY no configurada" });
    const { model = "gemini-1.5-flash", ...rest } = req.body || {};
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${API_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rest),
    });
    const text = await r.text();
    res.status(r.status).type(r.headers.get("content-type") || "application/json").send(text);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Estáticos Vite
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server on http://0.0.0.0:${PORT}`);
});
EOF