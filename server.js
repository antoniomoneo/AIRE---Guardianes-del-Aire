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
app.use(express.json({ limit: "50mb" })); // Increased limit for larger media in gallery

// Healthcheck simple
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

// --- GitHub API Proxy ---
// This proxy centralizes all GitHub API interactions, keeping the token secure on the server.
const GITHUB_API_URL = 'https://api.github.com/repos/antoniomoneo/Aire-gallery/contents';

app.all('/api/github/*', async (req, res) => {
    if (!process.env.GITHUB_TOKEN) {
        return res.status(500).json({ error: "El token de GitHub (GITHUB_TOKEN) no está configurado en el servidor." });
    }

    const githubPath = req.params[0];
    const targetUrl = `${GITHUB_API_URL}/${githubPath}`;

    try {
        const fetchOptions: RequestInit = {
            method: req.method,
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                'User-Agent': 'A.I.R.E-App-Proxy/1.0',
            }
        };

        if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
            fetchOptions.body = JSON.stringify(req.body);
            (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }
        
        const githubResponse = await fetch(targetUrl, fetchOptions);
        const responseBody = await githubResponse.text(); // Read body once
        
        res.status(githubResponse.status);
        res.type(githubResponse.headers.get('content-type') || 'text/plain');
        res.send(responseBody);

    } catch (error) {
        console.error('Error en el proxy de GitHub API:', error);
        res.status(502).json({ error: 'Error del proxy: no se pudo contactar con la API de GitHub.' });
    }
});


// --- Gemini API Proxy ---
let ai;
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
  console.warn("API_KEY environment variable not set. The /api/gemini/generate endpoint will not work.");
}

app.post("/api/gemini/generate", async (req, res) => {
  if (!ai) {
    return res.status(500).json({ error: "La clave de API de Gemini (API_KEY) no está configurada en el servidor." });
  }
  
  try {
    const response = await ai.models.generateContent(req.body);
    res.status(200).json(response);
  } catch (e) {
    console.error("Error calling Gemini API:", e);
    const statusCode = (e as any).status || 500;
    const message = (e as any).message || String(e);
    res.status(statusCode).json({ error: message });
  }
});

// Serve static files from the Vite build output
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback: redirect all other requests to index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor iniciado en http://0.0.0.0:${PORT}`);
});