import React, { useEffect, useRef, useState } from "react";
import type { AirQualityRecord, ChatMessage } from "../types";
import { AIEye } from "./AIEye";
import { AI_KNOWLEDGE_BASE } from "../constants";
import { awardPoints } from "../utils/scoringService";

interface ChatProps {
  airQualityData: AirQualityRecord[];
  onReset: () => void;
  userName: string;
}

/**
 * Reemplazo del Chat:
 * - NO usa @google/genai en el frontend.
 * - Envía las peticiones al backend propio: POST /api/gemini/generate
 *   (el backend añade la GEMINI_API_KEY desde Secret Manager).
 * - Mantiene el look & feel y la firma de props.
 */
export const Chat: React.FC<ChatProps> = ({ airQualityData, onReset, userName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAwardedPoints = useRef(false);

  // Mensaje “sistema” embebido como primer turno de usuario
  // para acotar el comportamiento del modelo y darle el informe.
  const SYSTEM_PROMPT = `
Eres A.I.R.E., un asistente IA amigable y experto en la calidad del aire de Madrid.
Tu propósito es responder preguntas del usuario basándote en el siguiente informe técnico
(úsalo como tu única fuente de conocimiento). Respuestas concisas, claras, sin inventar.
Si te preguntan fuera del informe, indica que tu conocimiento se limita al documento.

=== INFORME TÉCNICO (base de conocimiento) ===
${AI_KNOWLEDGE_BASE}
`;

  // (Opcional) contexto con un pequeño resumen de los últimos datos:
  function summarizeAQ(data: AirQualityRecord[]): string {
    if (!data?.length) return "No hay datos recientes de calidad del aire en contexto.";
    const latest = data[data.length - 1];
    const parts: string[] = [];
    if ("station_name" in (latest as any)) parts.push(`Estación: ${(latest as any).station_name}`);
    if ("pollutant" in (latest as any)) parts.push(`Contaminante: ${(latest as any).pollutant}`);
    if ("Valor" in (latest as any)) parts.push(`Valor: ${(latest as any).Valor}`);
    if ("Hora" in (latest as any)) parts.push(`Hora: ${(latest as any).Hora}`);
    return `Datos recientes: ${parts.join(" · ")}`;
  }

  useEffect(() => {
    // Mensaje inicial del modelo (opcional)
    setMessages([
      {
        role: "model",
        text:
          "Hola, soy A.I.R.E. 😊 Estoy lista para responder preguntas sobre la calidad del aire en Madrid. ¿En qué te ayudo?",
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = userInput.trim();
    if (!text || isLoading) return;

    // Puntúa la primera interacción del usuario
    if (userName && !hasAwardedPoints.current) {
      try {
        awardPoints(userName, 100);
      } catch {}
      hasAwardedPoints.current = true;
    }

    const userMessage: ChatMessage = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Construimos el payload para el proxy:
      // 1) “SYSTEM_PROMPT” como primer turno user (actúa como instrucción del sistema)
      // 2) Un mini-resumen de datos actuales
      // 3) Historial de la conversación previo
      // 4) El turno del usuario actual
      const contents = [
        {
          role: "user" as const,
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "user" as const,
          parts: [{ text: summarizeAQ(airQualityData) }],
        },
        ...messages.map((m) => ({
          role: m.role as "user" | "model",
          parts: [{ text: m.text }],
        })),
        {
          role: "user" as const,
          parts: [{ text }],
        },
      ];

      const resp = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          contents,
        }),
      });

      const ctype = resp.headers.get("content-type") || "";
      const isJson = ctype.includes("application/json");

      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`HTTP ${resp.status} ${resp.statusText} :: ${body}`);
      }

      let modelText = "";
      if (isJson) {
        const data = await resp.json();
        modelText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ??
          "No he podido extraer la respuesta.";
      } else {
        modelText = await resp.text();
      }

      setMessages((prev) => [...prev, { role: "model", text: modelText }]);
    } catch (e: any) {
      console.error(e);
      const msg =
        e?.message?.includes("GEMINI_API_KEY")
          ? "La clave de API no está configurada en el servidor."
          : "Lo siento, ahora mismo no puedo procesar tu pregunta.";
      setError(msg);
      setMessages((prev) => [...prev, { role: "model", text: msg }]);
    } finally {
      setIsLoading(false);
    }
  }

  const renderMessage = (msg: ChatMessage, i: number) => {
    const isModel = msg.role === "model";
    return (
      <div key={i} className={`flex items-start gap-3 my-4 ${isModel ? "" : "justify-end"}`}>
        {isModel && (
          <div className="flex-shrink-0">
            <AIEye />
          </div>
        )}
        <div
          className={`max-w-md lg:max-w-lg px-4 py-3 rounded-xl ${
            isModel ? "bg-cyan-900/50" : "bg-gray-700"
          }`}
        >
          <p className="text-white whitespace-pre-wrap">{msg.text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900/80 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-lg">
      <div className="flex-grow p-4 overflow-y-auto min-h-0">
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="flex items-start gap-3 my-4">
            <div className="flex-shrink-0">
              <AIEye />
            </div>
            <div className="max-w-md lg:max-w-lg px-4 py-3 rounded-xl bg-cyan-900/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse delay-0"></span>
                <span className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse delay-150"></span>
                <span className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse delay-300"></span>
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-red-400 text-center py-2">{error}</p>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-cyan-500/20">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isLoading ? "A.I.R.E. está pensando..." : "Pregúntale a A.I.R.E...."}
            className="flex-grow bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="bg-cyan-600 text-white font-bold px-5 py-2 rounded-lg hover:bg-cyan-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>
      </div>

      <button
        onClick={onReset}
        className="w-full bg-gray-700 text-white font-bold py-2 rounded-b-lg hover:bg-gray-600 transition-colors"
      >
        Empezar de Nuevo
      </button>
    </div>
  );
};