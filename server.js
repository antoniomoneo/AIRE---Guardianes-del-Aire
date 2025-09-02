// Server Express: sirve dist y expone /api/gemini/generate
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Body parser
app.use(express.json({ limit: "2mb" }));

// Healthcheck simple
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

// Initialize Gemini client if API key is available
let ai;
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
  console.warn("API_KEY environment variable not set. The /api/gemini/generate endpoint will not work.");
}


// Proxy a Gemini usando el SDK @google/genai
app.post("/api/gemini/generate", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "API_KEY no configurada en el servidor." });
  }
  
  try {
    // El cuerpo de la petición del frontend (req.body) debe coincidir
    // con los parámetros de ai.models.generateContent(), que incluye 'model', 'contents', y 'config'.
    const response = await ai.models.generateContent(req.body);
    
    // La respuesta del SDK es un objeto JSON que el frontend puede parsear directamente.
    res.status(200).json(response);
  } catch (e) {
    console.error("Error calling Gemini API:", e);
    const statusCode = e.status || 500;
    const message = e.message || String(e);
    res.status(statusCode).json({ error: message });
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