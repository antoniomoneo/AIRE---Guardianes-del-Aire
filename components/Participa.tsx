
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { awardPoints } from '../utils/scoringService';
import type { ParticipationItem } from '../types';

interface ParticipaProps {
  onClose: () => void;
  userName: string;
}

const PROPOSALS_URL = "https://corsproxy.io/?" + encodeURIComponent("https://raw.githubusercontent.com/antoniomoneo/Datasets/refs/heads/main/decide-madrid/proposals_latest%20copia.csv");
const DEBATES_URL = "https://corsproxy.io/?" + encodeURIComponent("https://decide.madrid.es/system/api/debates.csv");


const AIR_QUALITY_KEYWORDS = [
    'aire', 'contaminación', 'calidad', 'emisiones', 'humos', 'tráfico', 
    'zbe', 'bici', 'bicicleta', 'movilidad', 'sostenible', 'verde', 
    'ecológico', 'clima', 'climático', 'polución', 'peatonal', 'árboles'
];

// Helper function to parse a line with a specific delimiter, handling quotes.
const parseCsvLine = (line: string, delimiter: string): string[] => {
    // Regex to split by delimiter, but not when it's inside quotes.
    const regex = new RegExp(`${delimiter}(?=(?:[^"]*"[^"]*")*[^"]*$)`);
    const values = line.split(regex);
    // Clean up each value: trim whitespace, remove surrounding quotes, and handle double quotes.
    return values.map(v => {
        let cleanV = v.trim();
        if (cleanV.startsWith('"') && cleanV.endsWith('"')) {
            cleanV = cleanV.slice(1, -1);
        }
        return cleanV.replace(/""/g, '"');
    });
};

const parseCsvData = (csvText: string, type: 'proposals' | 'debates'): ParticipationItem[] => {
    try {
        if (!csvText || typeof csvText !== 'string' || csvText.trim().startsWith('<')) {
            console.error("Invalid CSV text provided (might be HTML from CORS proxy).");
            throw new Error("No se pudieron obtener los datos. El servicio externo o el proxy intermediario pueden estar temporalmente no disponibles.");
        }
        
        const lines = csvText.trim().split('\n');
        let headerLine = lines.shift()?.trim().toLowerCase();
        if (!headerLine) return [];

        // Handle Byte Order Mark (BOM)
        if (headerLine.charCodeAt(0) === 0xFEFF) {
            headerLine = headerLine.substring(1);
        }

        // Auto-detect delimiter
        const semicolonCount = (headerLine.match(/;/g) || []).length;
        const commaCount = (headerLine.match(/,/g) || []).length;
        let delimiter = commaCount > semicolonCount ? ',' : ';';

        let header = parseCsvLine(headerLine, delimiter);
        
        // Define a function to check if the header is valid by finding column indices
        const getHeaderIndices = (h: string[]) => ({
            idIndex: h.indexOf('id'),
            titleIndex: h.indexOf('title'),
            descIndex: h.indexOf('description') !== -1 ? h.indexOf('description') : h.indexOf('summary'),
            votesIndex: h.indexOf('cached_votes_up'),
        });

        let indices = getHeaderIndices(header);
        let headerIsValid = indices.idIndex !== -1 && indices.titleIndex !== -1 && indices.descIndex !== -1;

        // If header is not valid with the detected delimiter, try the other one as a fallback
        if (!headerIsValid) {
            const otherDelimiter = delimiter === ';' ? ',' : ';';
            const otherHeader = parseCsvLine(headerLine, otherDelimiter);
            const otherIndices = getHeaderIndices(otherHeader);

            if (otherIndices.idIndex !== -1 && otherIndices.titleIndex !== -1 && otherIndices.descIndex !== -1) {
                delimiter = otherDelimiter;
                header = otherHeader;
                indices = otherIndices;
            } else {
                // If both delimiters fail, then the format is truly unexpected.
                console.error('CSV header is missing required columns with both comma and semicolon delimiters.', { originalHeader: headerLine, required: ['id', 'title', 'description/summary'] });
                throw new Error("El formato del archivo de datos ha cambiado y no se puede procesar.");
            }
        }

        const { idIndex, titleIndex, descIndex, votesIndex } = indices;

        return lines.map(line => {
            if (!line.trim()) return null;
            const values = parseCsvLine(line, delimiter);
            if (values.length < header.length) return null;
            
            const id = values[idIndex];
            if (!id) return null;

            const votes = votesIndex !== -1 ? parseInt(values[votesIndex], 10) || 0 : 0;
            // Construct the link manually as the URL field is no longer in the CSV
            const link = `https://decide.madrid.es/${type}/${id}`;

            return {
                id: id,
                title: values[titleIndex] || '',
                description: values[descIndex] || '',
                cached_votes_up: votes,
                link: link,
            };
        }).filter((item): item is ParticipationItem => item !== null && !!item.id && !!item.title && !!item.link);
    } catch (e) {
        console.error("Failed to parse CSV data", e);
        if (e instanceof Error) throw e; 
        throw new Error("Ocurrió un error desconocido al procesar los datos.");
    }
};


const filterByKeywords = (items: ParticipationItem[]): ParticipationItem[] => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
        const textToSearch = `${item.title?.toLowerCase()} ${item.description?.toLowerCase()}`;
        return AIR_QUALITY_KEYWORDS.some(keyword => textToSearch.includes(keyword));
    });
};

export const Participa: React.FC<ParticipaProps> = ({ onClose, userName }) => {
    const [activeTab, setActiveTab] = useState<'proposals' | 'debates'>('proposals');
    const [items, setItems] = useState<ParticipationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const hasAwardedPoints = useRef(false);

    // State for AI Proposal Generator
    const [idea, setIdea] = useState('');
    const [generatedProposal, setGeneratedProposal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        if (userName && !hasAwardedPoints.current) {
            awardPoints(userName, 150);
            hasAwardedPoints.current = true;
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, userName]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            setItems([]);
            const url = activeTab === 'proposals' ? PROPOSALS_URL : DEBATES_URL;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Error en la red: ${response.statusText}`);
                const csvText = await response.text();
                const rawItems = parseCsvData(csvText, activeTab);
                const filteredItems = filterByKeywords(rawItems);
                setItems(filteredItems);
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
                setError(`No se pudieron cargar los datos. ${message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);
    
    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(item => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    const handleGenerateDraft = async () => {
        if (!idea.trim() || isGenerating) return;
        setIsGenerating(true);
        setAiError(null);
        setGeneratedProposal('');

        const systemPrompt = `Actúa como un experto asesor en políticas urbanas y sostenibilidad para el Ayuntamiento de Madrid. Tu objetivo es ayudar a un ciudadano a transformar su idea en una propuesta formal, bien estructurada y viable para mejorar la calidad del aire. La propuesta debe ser clara, concisa, convincente y estar redactada en un tono respetuoso y constructivo.

Analiza la siguiente idea ciudadana y redáctala como una propuesta formal para el portal 'Decide Madrid'. La propuesta debe tener las siguientes secciones, claramente marcadas con markdown (negritas para los títulos):

**Título de la Propuesta:** (Un título claro y llamativo)
**Exposición de Motivos:** (Describe el problema y por qué es importante abordarlo)
**Propuesta Concreta:** (Detalla la solución propuesta, qué se haría y cómo)
**Viabilidad y Beneficios:** (Explica por qué la propuesta es factible y qué mejoras traería a la ciudad y a sus habitantes)

La idea del ciudadano es: "${idea}"`;

        try {
            const resp = await fetch("/api/gemini/generate", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    model: "gemini-2.5-flash",
                    contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
                }),
            });

            if (!resp.ok) {
                const body = await resp.text();
                throw new Error(`HTTP ${resp.status} ${resp.statusText} :: ${body}`);
            }

            const data = await resp.json();
            const modelText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No se pudo generar la propuesta.";
            setGeneratedProposal(modelText);
        } catch (e) {
            const message = e instanceof Error ? e.message : "Error desconocido.";
            setAiError(`La IA no pudo generar el borrador. ${message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedProposal).then(() => {
            alert('¡Propuesta copiada al portapapeles!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('No se pudo copiar el texto.');
        });
    };

    const TabButton: React.FC<{ type: 'proposals' | 'debates', label: string }> = ({ type, label }) => (
        <button
            onClick={() => setActiveTab(type)}
            className={`flex-1 p-3 text-center font-orbitron text-sm sm:text-base transition-colors rounded-t-lg ${
                activeTab === type ? 'bg-gray-800 text-pink-300' : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800/70'
            }`}
        >
            {label}
        </button>
    );

    const Card: React.FC<{ item: ParticipationItem }> = ({ item }) => (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 flex flex-col gap-3 transition-transform hover:scale-[1.02] hover:border-pink-400/50">
            <div className="flex justify-between items-start gap-4">
                <h4 className="font-orbitron text-lg text-pink-200">{item.title}</h4>
                 {(item.cached_votes_up > 0 || activeTab === 'proposals') && (
                    <div className="flex-shrink-0 flex items-center gap-2 text-pink-200 bg-gray-700/50 px-3 py-1 rounded-full" title={`${item.cached_votes_up} apoyos`}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h8a1 1 0 001-1v-6.667a2.25 2.25 0 00-.75-1.666l-3.42-3.42a2.25 2.25 0 00-3.18 0l-3.42 3.42A2.25 2.25 0 006 10.333z" />
                        </svg>
                        <span className="font-bold text-base">{item.cached_votes_up}</span>
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-300 line-clamp-3">{item.description}</p>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-auto self-start px-4 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-500 transition-colors text-sm">
                Ver y Participar →
            </a>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/90 border border-pink-500/30 rounded-2xl shadow-2xl w-full max-w-7xl h-full sm:h-[90vh] p-4 sm:p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl sm:text-2xl font-orbitron text-pink-300">Participa Madrid: Calidad del Aire</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                    {/* Left Column: Explorer */}
                    <div className="w-full lg:w-1/2 flex flex-col">
                        <h3 className="text-xl font-orbitron text-pink-100 border-b border-pink-500/20 pb-2 mb-4 flex-shrink-0">
                            Explora Propuestas Existentes
                        </h3>
                        <div className="flex-shrink-0 flex border-b-2 border-gray-800">
                            <TabButton type="proposals" label="Propuestas" />
                            <TabButton type="debates" label="Debates" />
                        </div>
                        <div className="py-3 flex-shrink-0">
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filtrar por palabra clave..." className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm" />
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2">
                            {error ? <div className="flex items-center justify-center h-full text-center text-red-400">{error}</div>
                                : isLoading ? <div className="flex items-center justify-center h-full text-gray-400">Buscando iniciativas...</div>
                                : filteredItems.length > 0 ? <div className="space-y-4">{filteredItems.map(item => <Card key={item.id} item={item} />)}</div>
                                : <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                    <h3 className="text-2xl font-orbitron">No hay resultados</h3>
                                    <p className="mt-2 max-w-md">{items.length === 0 ? `No se encontraron ${activeTab === 'proposals' ? 'propuestas' : 'debates'} sobre calidad del aire.` : `Ningún resultado coincide con "${searchTerm}".`}</p>
                                </div>
                            }
                        </div>
                    </div>
                    
                    {/* Right Column: AI Proposal Generator */}
                    <div className="w-full lg:w-1/2 flex flex-col lg:border-l lg:border-gray-700/50 lg:pl-6">
                        <h3 className="text-xl font-orbitron text-green-300 border-b border-green-500/20 pb-2 mb-4 flex-shrink-0">
                            Crea tu Propuesta con IA
                        </h3>
                        <div className="flex-grow flex flex-col gap-4 overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="idea" className="font-bold text-gray-300 mb-2 block text-base">1. Escribe tu idea</label>
                                <textarea id="idea" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Ej: Poner más árboles en mi calle para que filtren el aire y den sombra." className="w-full h-28 p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-sm" />
                            </div>
                            <button onClick={handleGenerateDraft} disabled={isGenerating || !idea.trim()} className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-lg">
                                {isGenerating ? 'Generando Borrador...' : '2. Generar Borrador con IA'}
                            </button>
                            {aiError && <div className="p-3 bg-red-900/50 text-red-300 rounded-md text-sm">{aiError}</div>}
                            
                            {generatedProposal && (
                                <div className="p-4 bg-gray-900/60 border border-gray-700 rounded-lg space-y-3">
                                    <h4 className="text-lg font-orbitron text-gray-200">Borrador de la Propuesta:</h4>
                                    <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: generatedProposal.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                    <div className="flex gap-4 pt-3 border-t border-gray-700">
                                        <button onClick={handleCopy} className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors">Copiar Propuesta</button>
                                        <a href="https://decide.madrid.es/proposals/new" target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-4 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-500 transition-colors">
                                            Publicar en Decide Madrid
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
            `}</style>
        </div>
    );
};