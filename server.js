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

// GitHub API Proxy
const GITHUB_API_URL = 'https://api.github.com/repos/antoniomoneo/Aire-gallery/contents';

app.all('/api/github/*', async (req, res) => {
    if (!process.env.GITHUB_TOKEN) {
        return res.status(500).json({ error: "GITHUB_TOKEN no configurado en el servidor." });
    }

    const githubPath = req.params[0];
    const targetUrl = `${GITHUB_API_URL}/${githubPath}`;

    try {
        const options = {
            method: req.method,
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'User-Agent': 'A.I.R.E-App-Proxy',
                'X-GitHub-Api-Version': '2022-11-28',
            } as HeadersInit
        };

        if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
            options.body = JSON.stringify(req.body);
            (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }
        
        const githubResponse = await fetch(targetUrl, options);

        const status = githubResponse.status;
        
        // Handle responses with no body
        if (status === 204 || status === 201 || (status === 200 && req.method === 'DELETE')) {
            return res.status(status).send();
        }

        const contentType = githubResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await githubResponse.json();
            return res.status(status).json(data);
        }
        
        const text = await githubResponse.text();
        return res.status(status).send(text);

    } catch (error) {
        console.error('Error proxying to GitHub API:', error);
        res.status(500).json({ error: 'Error interno del servidor al contactar con GitHub.' });
    }
});


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
    const statusCode = (e as any).status || 500;
    const message = (e as any).message || String(e);
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
