// Server Express: sirve dist y expone APIs seguras
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Confía en el primer proxy (ej. Nginx, Google Cloud Run) para obtener la IP real.
app.set('trust proxy', true);

// Body parser para JSON, con límite aumentado para subidas a la galería.
app.use(express.json({ limit: "50mb" }));

// Healthcheck para el orquestador (ej. Kubernetes, Cloud Run).
app.get(["/health", "/healthz"], (_req, res) => res.status(200).json({ ok: true }));

// --- Proxy de la API de GitHub para la Galería ---
// Proxy para todas las interacciones (lectura y escritura) con el repo de la galería.
// Centraliza el uso del GITHUB_TOKEN de forma segura en el backend.
const GITHUB_API_URL = 'https://api.github.com/repos/antoniomoneo/Aire-gallery/contents';

app.all('/api/github/*', async (req, res) => {
    if (!process.env.GITHUB_TOKEN) {
        return res.status(500).json({ error: "El token de GitHub (GITHUB_TOKEN) no está configurado en el servidor." });
    }

    const githubPath = req.params[0];
    const targetUrl = `${GITHUB_API_URL}/${githubPath}`;

    try {
        const fetchOptions = {
            method: req.method,
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
                'User-Agent': 'AIRE-Guardianes/1.0',
            },
        };

        if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
            fetchOptions.body = JSON.stringify(req.body);
            (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }
        
        const githubResponse = await fetch(targetUrl, fetchOptions);
        const responseBody = await githubResponse.text();
        
        res.status(githubResponse.status);
        res.type(githubResponse.headers.get('content-type') || 'text/plain');
        res.send(responseBody);

    } catch (error) {
        console.error('Error en el proxy de GitHub API:', error);
        const detail = error instanceof Error ? error.message : String(error);
        res.status(502).json({ error: 'Bad gateway', detail });
    }
});


// --- Proxy de la API de Gemini ---
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

// --- Proxy de solo lectura (whitelist) para CSV/JSON externos ---
app.get("/api/proxy", async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: "URL parameter is required." });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (error) {
    return res.status(400).json({ error: "Invalid URL provided." });
  }
  
  // Whitelist de hosts permitidos para el proxy.
  const allowedHosts = ['raw.githubusercontent.com', 'api.github.com', 'decide.madrid.es'];
  if (!allowedHosts.includes(parsedUrl.hostname)) {
    return res.status(400).json({ error: `Host not allowed: ${parsedUrl.hostname}` });
  }

  try {
    const fetchOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'AIRE-Guardianes/1.0 (+https://example.org)',
        'Accept': req.headers.accept || 'text/plain',
      }
    };

    const proxyResponse = await fetch(targetUrl, fetchOptions);
    const responseBody = await proxyResponse.text();

    res.status(proxyResponse.status);
    res.type(proxyResponse.headers.get('content-type') || 'text/plain');
    res.send(responseBody);
    
  } catch (error) {
    console.error('Error in /api/proxy:', error);
    const detail = error instanceof Error ? error.message : String(error);
    res.status(502).json({ error: "Bad gateway", detail });
  }
});


// --- Servir Ficheros Estáticos y SPA Fallback ---

// Servir ficheros estáticos de la build de Vite con caché moderada.
app.use(express.static(path.join(__dirname, "dist"), {
  maxAge: '1h', // Cache de 1 hora
  etag: true,
  fallthrough: true
}));

// SPA fallback: redirige cualquier otra petición a index.html.
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});


// --- Arranque del Servidor y Apagado Limpio ---

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor iniciado en http://0.0.0.0:${PORT}`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Forzar apagado tras 10s si las conexiones no se cierran.
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10 * 1000);
};

// Escuchar señales de apagado
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));