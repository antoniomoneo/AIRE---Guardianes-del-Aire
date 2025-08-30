


import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { AirQualityRecord, DashboardDataPoint, Pollutant } from '../types';
import { Pollutant as PollutantEnum } from '../types';
import { POLLUTANT_NAMES } from '../constants';
import { generateSimulation, SCENARIOS } from '../utils/simulationService';
import { generateScenarioWithAI } from '../utils/aiSimulationService';
import type { ScenarioId } from '../utils/simulationService';
import { awardPoints } from '../utils/scoringService';
import { PublishModal } from './PublishModal';
import { addGalleryItem } from '../utils/galleryService';

interface DigitalTwinLabProps {
  data: AirQualityRecord[];
  onClose: () => void;
  userName: string;
}

const SCENARIO_JUSTIFICATIONS: Record<ScenarioId, { title: string; justification: string }> = {
    NO_CRISIS_2008: {
        title: 'Lógica de la Simulación',
        justification: 'Se calcula la tendencia de contaminación de los años previos a 2008. A partir de ese año, se reemplazan los datos reales con una proyección de esa misma tendencia, asumiendo que el crecimiento del tráfico (y la contaminación asociada) nunca se hubiera detenido.'
    },
    NO_MADRID_CENTRAL: {
        title: 'Lógica de la Simulación',
        justification: 'Madrid Central causó una caída brusca de la polución. Para simular su ausencia, se toma la tendencia de mejora más lenta que ya existía antes de 2019 y se proyecta hacia adelante, eliminando el "salto" de mejora que supuso esta medida clave.'
    },
    NO_PANDEMIC: {
        title: 'Lógica de la Simulación',
        justification: 'La pandemia fue una anomalía histórica. Esta simulación ignora la drástica caída de 2020 y, en su lugar, continúa la tendencia de mejora que se venía observando en los años inmediatamente anteriores (2018-2019).'
    },
    AMBITIOUS_FUTURE: {
        title: 'Lógica de la Simulación',
        justification: 'Este es un escenario optimista. Se proyecta una reducción anual constante y ambiciosa (15% cada año) a partir del último dato real, simulando el efecto de políticas medioambientales muy estrictas, como la electrificación total del parque móvil.'
    }
};

export const DigitalTwinLab: React.FC<DigitalTwinLabProps> = ({ data, onClose, userName }) => {
    const [selectedPollutant, setSelectedPollutant] = useState<Pollutant>(PollutantEnum.NO2);
    const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('NO_MADRID_CENTRAL');
    const [aiSimulatedData, setAiSimulatedData] = useState<DashboardDataPoint[] | null>(null);
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);
    const [userInput, setUserInput] = useState('');
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [errorAI, setErrorAI] = useState<string | null>(null);

    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

    const hasAwardedPoints = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const newWidth = Math.round(entry.contentRect.width);
                const newHeight = Math.round(entry.contentRect.height);
                
                setSize(currentSize => {
                    if (currentSize.width !== newWidth || currentSize.height !== newHeight) {
                        return { width: newWidth, height: newHeight };
                    }
                    return currentSize;
                });
            }
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);
    
    useEffect(() => {
        if (userName && !hasAwardedPoints.current) {
            awardPoints(userName, 100);
            hasAwardedPoints.current = true;
        }

        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, userName]);

    const historicalData = useMemo<DashboardDataPoint[]>(() => {
        const pollutantKey = selectedPollutant as keyof AirQualityRecord;
        const annualData = data.reduce((acc, curr) => {
            const value = curr[pollutantKey] as number | null;
            if (value === null || isNaN(value)) return acc;
            const year = curr.ANO;
            if (!acc[year]) acc[year] = { sum: 0, count: 0 };
            acc[year].sum += value;
            acc[year].count++;
            return acc;
        }, {} as Record<string, { sum: number, count: number }>);

        return Object.entries(annualData).map(([year, { sum, count }]) => ({
            date: year,
            value: parseFloat((sum / count).toFixed(2)),
        })).sort((a,b) => a.date.localeCompare(b.date));
    }, [data, selectedPollutant]);

    const handleSelectScenario = (scenarioId: ScenarioId) => {
        setSelectedScenario(scenarioId);
        setAiSimulatedData(null);
        setAiExplanation(null);
        setErrorAI(null);
    };

    const handleGenerateAIScenario = async () => {
        if (!userInput.trim()) return;
        setIsLoadingAI(true);
        setErrorAI(null);
        setAiSimulatedData(null);
        setAiExplanation(null);
        setIsPublished(false);

        try {
            const result = await generateScenarioWithAI(userInput, historicalData, POLLUTANT_NAMES[selectedPollutant]);
            setAiSimulatedData(result.simulatedData);
            setAiExplanation(result.explanation);
        } catch (e) {
            console.error("AI Scenario Generation failed:", e);
            const message = e instanceof Error ? e.message : 'Error desconocido.';
            setErrorAI(`La IA no pudo generar el escenario. ${message}`);
        } finally {
            setIsLoadingAI(false);
        }
    };
    
    const handlePublish = async (authorName: string) => {
        if (!aiSimulatedData || !userInput || !aiExplanation) return;
        setIsPublishing(true);
        try {
            const title = `Escenario IA: ${userInput.substring(0, 50)}${userInput.length > 50 ? '...' : ''}`;
            await addGalleryItem({
                type: 'ai-scenario',
                author: authorName,
                title,
                userPrompt: userInput,
                aiExplanation,
                config: {
                    pollutant: selectedPollutant,
                    historicalData: historicalData,
                    simulatedData: aiSimulatedData,
                }
            });
            awardPoints(authorName, 500);
            alert('¡Escenario publicado en la galería con éxito! (+500 Puntos)');
            setIsPublishModalOpen(false);
            setIsPublished(true);
        } catch (error) {
            console.error("Error publishing AI scenario to gallery:", error);
            const errorMessage = error instanceof Error ? error.message : "Hubo un error al publicar en la galería.";
            alert(errorMessage);
        } finally {
            setIsPublishing(false);
        }
    };

    const combinedData = useMemo(() => {
        const simulationData = aiSimulatedData || generateSimulation(historicalData, selectedScenario);
        const allDates = new Set([...historicalData.map(p => p.date), ...simulationData.map(p => p.date)]);
        
        return Array.from(allDates).sort().map(date => {
            const histPoint = historicalData.find(p => p.date === date);
            const simPoint = simulationData.find(p => p.date === date);
            return {
                date: date,
                real: histPoint ? histPoint.value : null,
                simulated: simPoint ? simPoint.value : null,
            };
        });
    }, [historicalData, selectedScenario, aiSimulatedData]);

    const scenarioInfo = SCENARIOS[selectedScenario];
    const scenarioJustification = SCENARIO_JUSTIFICATIONS[selectedScenario];

    const simulationName = aiSimulatedData ? `IA: ${userInput.substring(0, 25)}...` : scenarioInfo.name;
    const simulationColor = aiSimulatedData ? "#10b981" : "#f97316";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/90 border border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-6xl h-full sm:h-[90vh] p-4 sm:p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl sm:text-2xl font-orbitron text-indigo-300">Laboratorio de Escenarios</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                
                <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                    <div className="lg:w-1/3 xl:w-1/4 p-4 space-y-4 lg:border-r border-gray-700 overflow-y-auto flex-shrink-0">
                        <section>
                            <label htmlFor="pollutant-select" className="text-lg font-bold text-gray-300">Contaminante a Analizar</label>
                            <select
                                id="pollutant-select"
                                value={selectedPollutant}
                                onChange={e => setSelectedPollutant(e.target.value as Pollutant)}
                                className="w-full mt-2 p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                                {Object.values(PollutantEnum).map(p => (
                                    <option key={p} value={p}>{POLLUTANT_NAMES[p]}</option>
                                ))}
                            </select>
                        </section>
                        
                        <section className="pt-4 border-t border-gray-600">
                            <h3 className="text-lg font-bold text-gray-300">Selecciona un Escenario "Qué hubiera pasado si..."</h3>
                            {Object.entries(SCENARIOS).map(([id, { name }]) => (
                                <button key={id} onClick={() => handleSelectScenario(id as ScenarioId)}
                                    className={`w-full text-left p-3 mt-2 rounded-lg border-2 transition-all ${!aiSimulatedData && selectedScenario === id ? 'bg-indigo-500/30 border-indigo-400' : 'bg-gray-800 border-gray-700 hover:border-indigo-500'}`}
                                >
                                    <span className="font-semibold text-white">{name}</span>
                                </button>
                            ))}
                        </section>
                        
                        {!aiSimulatedData && scenarioInfo && (
                            <>
                                <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                                    <h4 className="font-bold text-indigo-200">{scenarioInfo.name}</h4>
                                    <p className="text-sm text-gray-400 mt-1">{scenarioInfo.description}</p>
                                </div>
                                <div className="mt-4 p-4 bg-gray-900/70 border-l-4 border-orange-400 rounded-r-lg">
                                    <h4 className="font-bold text-orange-300">{scenarioJustification.title}</h4>
                                    <p className="text-sm text-gray-300 mt-1">{scenarioJustification.justification}</p>
                                </div>
                            </>
                        )}

                        <section className="pt-4 border-t border-gray-600">
                            <h3 className="text-lg font-bold text-gray-300">Crea tu Propio Escenario (IA)</h3>
                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Ej: ¿Y si todos los coches fueran eléctricos desde 2015?"
                                className="w-full h-24 mt-2 p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                maxLength={200}
                                disabled={isLoadingAI}
                            />
                            <button
                                onClick={handleGenerateAIScenario}
                                disabled={isLoadingAI || !userInput.trim()}
                                className="w-full mt-2 px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {isLoadingAI ? 'Generando...' : 'Generar con IA'}
                            </button>
                            {aiSimulatedData && (
                                <button
                                    onClick={() => setIsPublishModalOpen(true)}
                                    disabled={isPublished || isPublishing}
                                    className="w-full mt-2 px-6 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    {isPublished ? 'Publicado ✓' : 'Publicar en Galería (+500 Pts)'}
                                </button>
                            )}
                        </section>

                        {errorAI && <p className="text-sm text-red-400 p-2 bg-red-900/50 rounded-md">{errorAI}</p>}

                        {aiExplanation && (
                            <div className="mt-4 p-4 bg-gray-900/70 border-l-4 border-green-400 rounded-r-lg animate-fade-in">
                                <h4 className="font-bold text-green-300">Lógica de la IA</h4>
                                <p className="text-sm text-gray-300 mt-1">{aiExplanation}</p>
                            </div>
                        )}
                    </div>

                    <div ref={containerRef} className="flex-1 p-4 min-h-0 flex flex-col">
                         <h3 className="text-center font-orbitron text-indigo-200 mb-4 flex-shrink-0 text-lg">
                           Evolución de {POLLUTANT_NAMES[selectedPollutant]}
                        </h3>
                        {size.width > 0 && size.height > 0 && (
                            <LineChart width={size.width} height={size.height - 40} data={combinedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 'auto']} label={{ value: `µg/m³`, angle: -90, position: 'insideLeft', fill: '#9ca3af' }}/>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#818cf8' }}
                                    labelStyle={{ color: '#c7d2fe', fontWeight: 'bold' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="real" name="Realidad Histórica" stroke="#38bdf8" strokeWidth={3} dot={false} connectNulls />
                                <Line type="monotone" dataKey="simulated" name={simulationName} stroke={simulationColor} strokeWidth={3} strokeDasharray="5 5" dot={false} connectNulls />
                            </LineChart>
                        )}
                    </div>
                </div>

                 {isPublishModalOpen && (
                    <PublishModal
                        onClose={() => setIsPublishModalOpen(false)}
                        onPublish={handlePublish}
                        isPublishing={isPublishing}
                        userName={userName}
                    />
                )}
            </div>
            <style>{`.animate-fade-in { animation: fade-in 0.3s ease-out forwards; } @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
};