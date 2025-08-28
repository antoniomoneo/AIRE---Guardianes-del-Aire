
import React, { useState, useEffect, useRef } from 'react';
import type { AirQualityRecord, ChatMessage } from '../types';
import { GoogleGenAI } from '@google/genai';
import type { Chat as GenAIChat } from '@google/genai';
import { AIEye } from './AIEye';
import { AI_KNOWLEDGE_BASE } from '../constants';

interface ChatProps {
    airQualityData: AirQualityRecord[]; // Keep for potential future use, e.g. live data questions
    onReset: () => void;
}

const API_KEY = process.env.API_KEY as string;

export const Chat: React.FC<ChatProps> = ({ airQualityData, onReset }) => {
    const [chat, setChat] = useState<GenAIChat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = async () => {
            try {
                if (!API_KEY) {
                    setError("La clave de API no está configurada. No puedo conectar con A.I.R.E.");
                    console.error("API_KEY is not configured.");
                    return;
                }
                const ai = new GoogleGenAI({ apiKey: API_KEY });
                
                const newChat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: `Eres A.I.R.E., un asistente IA amigable y experto en la calidad del aire de Madrid. Tu propósito es responder preguntas del usuario basándote en el informe técnico que se te ha proporcionado. Eres educativo y quieres ayudar al usuario a entender la información. Tus respuestas deben ser concisas y basadas únicamente en el contexto del informe. No inventes información. Si te preguntan algo fuera del informe, amablemente indica que tu conocimiento se limita a la calidad del aire en Madrid según los datos que posees.`,
                    },
                    history: [
                        { role: 'user', parts: [{ text: `Aquí tienes el informe completo sobre la evolución de la calidad del aire en Madrid. Úsalo como tu única fuente de conocimiento para responder a mis preguntas: \n\n${AI_KNOWLEDGE_BASE}` }] },
                        { role: 'model', parts: [{ text: "Informe procesado. Soy A.I.R.E. y estoy lista para responder tus preguntas sobre la calidad del aire en Madrid basándome en este documento." }] }
                    ]
                });
                setChat(newChat);
            } catch (e) {
                console.error("Failed to initialize chat:", e);
                setError("No se pudo iniciar la sesión de chat con A.I.R.E.");
            }
        };
        initChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = { role: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);
        setError(null);

        try {
            const responseStream = await chat.sendMessageStream({ message: currentInput });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of responseStream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }

        } catch (e) {
            console.error("Error sending message:", e);
            const errorMessage = "Lo siento, estoy teniendo problemas para procesar tu pregunta en este momento.";
            setError(errorMessage);
            setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = (msg: ChatMessage, index: number) => {
        const isModel = msg.role === 'model';
        return (
            <div key={index} className={`flex items-start gap-3 my-4 ${isModel ? '' : 'justify-end'}`}>
                {isModel && <div className="flex-shrink-0"><AIEye /></div>}
                <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-xl ${isModel ? 'bg-cyan-900/50' : 'bg-gray-700'}`}>
                    <p className="text-white whitespace-pre-wrap">{msg.text}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[60vh] max-h-[700px] w-full bg-gray-900/80 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-lg">
            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map(renderMessage)}
                {isLoading && (
                    <div className="flex items-start gap-3 my-4">
                        <div className="flex-shrink-0"><AIEye /></div>
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
                        disabled={isLoading || !chat}
                    />
                    <button type="submit" disabled={isLoading || !userInput.trim() || !chat} className="bg-cyan-600 text-white font-bold px-5 py-2 rounded-lg hover:bg-cyan-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
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
