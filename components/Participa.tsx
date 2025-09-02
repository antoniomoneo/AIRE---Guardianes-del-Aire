
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
            createdAtIndex: h.indexOf('created_at'),
            retiredAtIndex: h.indexOf('retired_at'),
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

        const { idIndex, titleIndex, descIndex, votesIndex, createdAtIndex, retiredAtIndex } = indices;

        return lines.map((line): ParticipationItem | null => {
            if (!line.trim()) return null;
            const values = parseCsvLine(line, delimiter);
            if (values.length < header.length) return null;
            
            const id = values[idIndex];
            if (!id) return null;

            const votes = votesIndex !== -1 ? parseInt(values[votesIndex], 10) || 0 : 0;
            const link = `https://decide.madrid.es/${type}/${id}`;
            const createdAt = createdAtIndex !== -1 ? values[createdAtIndex] : new Date().toISOString();
            const retiredAt = retiredAtIndex !== -1 ? values[retiredAtIndex] : '';

            return {
                id: id,
                title: values[titleIndex] || '',
                description: values[descIndex] || '',
                cached_votes_up: votes,
                link: link,
                created_at: createdAt,
                retired_at: retiredAt,
            };
            // FIX: Explicitly typing the return of the map callback resolves the type predicate error in the filter.
        }).filter((item): item is ParticipationItem => 
            item !== null && 
            !!item.id && 
            !!item.title && 
            !!item.link &&
            (!item.retired_at || item.retired_at.trim() === '')
        );
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

    // State for Quick Filters
    const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | '2024' | '2025' | 'ai'>('all');
    const [isAiFiltering, setIsAiFiltering] = useState(false);
    const [aiFilterError, setAiFilterError] = useState<string | null>(null);
    const [aiFilteredIds, setAiFilteredIds] = useState<Set<string> | null>(null);

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
            // Reset AI filters when tab changes
            setAiFilteredIds(null);
            setActiveQuickFilter('all');
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
        let baseItems = items;

        if (activeQuickFilter === 'ai' && aiFilteredIds) {
            baseItems = items.filter(item => aiFilteredIds.has(item.id));
        } else if (activeQuickFilter === '2024') {
            baseItems = items.filter(item => item.created_at.startsWith('2024'));
        } else if (activeQuickFilter === '2025') {
            baseItems = items.filter(item => item.created_at.startsWith('2025'));
        }
        
        if (!searchTerm) return baseItems;

        return baseItems.filter(item => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm, activeQuickFilter, aiFilteredIds]);

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

    const handleAiFilter = async () => {
        if (isAiFiltering) return;
        setActiveQuickFilter('ai');
        if (aiFilteredIds) return;

        setIsAiFiltering(true);
        setAiFilterError(null);

        const proposalsForAI = items.map(({ id, title, description }) => ({ id, title, description }));

        const prompt = `
            Analiza la siguiente lista de propuestas ciudadanas de Madrid. Tu tarea es identificar las que están más directa y significativamente relacionadas con la mejora de la CALIDAD DEL AIRE.
            Considera temas como la reducción de emisiones del tráfico, fomento de la movilidad sostenible (bicicletas, peatones), zonas verdes, Zonas de Bajas Emisiones (ZBE), energías limpias, y control de la polución.
            Devuelve únicamente un objeto JSON con una clave "relevant_ids" que contenga un array con los IDs de las propuestas más relevantes.

            Propuestas:
            ${JSON.stringify(proposalsForAI.slice(0, 150))}
        `;

        const responseSchema = {
            type: "OBJECT",
            properties: {
                relevant_ids: {
                    type: "ARRAY",
                    description: "Un array de IDs de propuestas que son altamente relevantes para la calidad del aire.",
                    items: { type: "STRING" }
                }
            },
            required: ["relevant_ids"]
        };

        try {
            const resp = await fetch("/api/gemini/generate", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    model: "gemini-2.5-flash",
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    config: { responseMimeType: "application/json", responseSchema }
                }),
            });

            if (!resp.ok) throw new Error(`Error del servidor: ${resp.status}`);
            const data = await resp.json();
            const modelText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!modelText) throw new Error("La respuesta de la IA está vacía.");

            const result = JSON.parse(modelText);
            if (!result.relevant_ids || !Array.isArray(result.relevant_ids)) {
                throw new Error("La respuesta de la IA no tiene el formato esperado.");
            }
            setAiFilteredIds(new Set(result.relevant_ids));

        } catch (e) {
            const message = e instanceof Error ? e.message : "Error desconocido.";
            setAiFilterError(`Filtro IA fallido: ${message}`);
            setActiveQuickFilter('all');
        } finally {
            setIsAiFiltering(false);
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
    
    const QuickFilterButton: React.FC<{ label: string, onClick: () => void, isActive: boolean, isLoading?: boolean, disabled?: boolean }> = ({ label, onClick, isActive, isLoading = false, disabled = false }) => (
        <button
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 border-2 flex items-center gap-2 ${
                isActive
                ? 'bg-pink-500 border-pink-400 text-white shadow-md shadow-pink-500/20'
                : 'bg-gray-700/50 border-gray-600 hover:border-pink-500 text-gray-300'
            } ${isLoading || disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
            {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
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
                            Explora Iniciativas Existentes
                        </h3>
                        <div className="flex-shrink-0 flex border-b-2 border-gray-800">
                            <TabButton type="proposals" label="Propuestas" />
                            <TabButton type="debates" label="Debates" />
                        </div>
                        <div className="py-3 flex-shrink-0 space-y-2">
                             <p className="text-sm text-gray-400">Mostrando {filteredItems.length} de {items.length} iniciativas.</p>
                             <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-gray-400 text-sm font-bold">Filtros rápidos:</span>
                                <QuickFilterButton label="Todos" onClick={() => setActiveQuickFilter('all')} isActive={activeQuickFilter === 'all'} />
                                <QuickFilterButton label="2024" onClick={() => setActiveQuickFilter('2024')} isActive={activeQuickFilter === '2024'} disabled={activeTab === 'debates'} />
                                <QuickFilterButton label="2025" onClick={() => setActiveQuickFilter('2025')} isActive={activeQuickFilter === '2025'} disabled={activeTab === 'debates'}/>
                                <QuickFilterButton label="Calidad de Aire (IA)" onClick={handleAiFilter} isActive={activeQuickFilter === 'ai'} isLoading={isAiFiltering} disabled={activeTab === 'debates'} />
                            </div>
                            {aiFilterError && <p className="text-red-400 text-xs">{aiFilterError}</p>}
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filtrar por palabra clave..." className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm" />
                        </div>
                        <div className="flex-grow overflow-y-auto pr-2">
                            {error ? <div className="flex items-center justify-center h-full text-center text-red-400">{error}</div>
                                : isLoading ? <div className="flex items-center justify-center h-full text-gray-400">Buscando iniciativas...</div>
                                : filteredItems.length > 0 ? <div className="space-y-4">{filteredItems.map(item => <Card key={item.id} item={item} />)}</div>
                                : <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                    <h3 className="text-2xl font-orbitron">No hay resultados</h3>
                                    <p className="mt-2 max-w-md">{items.length === 0 ? `No se encontraron ${activeTab === 'proposals' ? 'propuestas' : 'debates'} sobre calidad del aire.` : `Ningún resultado coincide con los filtros aplicados.`}</p>
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
