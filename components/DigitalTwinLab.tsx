
import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { AirQualityRecord, DashboardDataPoint } from '../types';
import { generateSimulation, SCENARIOS } from '../utils/simulationService';
import type { ScenarioId } from '../utils/simulationService';
import { awardPoints } from '../utils/scoringService';

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
    const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('NO_MADRID_CENTRAL');
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
        const annualData = data.reduce((acc, curr) => {
            if (curr.NO2 === null || isNaN(curr.NO2)) return acc;
            const year = curr.ANO;
            if (!acc[year]) acc[year] = { sum: 0, count: 0 };
            acc[year].sum += curr.NO2;
            acc[year].count++;
            return acc;
        }, {} as Record<string, { sum: number, count: number }>);

        return Object.entries(annualData).map(([year, { sum, count }]) => ({
            date: year,
            value: parseFloat((sum / count).toFixed(2)),
        })).sort((a,b) => a.date.localeCompare(b.date));
    }, [data]);

    const simulatedData = useMemo(() => {
        return generateSimulation(historicalData, selectedScenario);
    }, [historicalData, selectedScenario]);

    const combinedData = useMemo(() => {
        return simulatedData.map((simPoint, index) => ({
            date: simPoint.date,
            real: historicalData.find(d => d.date === simPoint.date)?.value,
            simulated: simPoint.value,
        }));
    }, [historicalData, simulatedData]);

    const scenarioInfo = SCENARIOS[selectedScenario];
    const scenarioJustification = SCENARIO_JUSTIFICATIONS[selectedScenario];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/90 border border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-6xl h-full sm:h-[90vh] p-4 sm:p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl sm:text-2xl font-orbitron text-indigo-300">Laboratorio de Escenarios</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                
                <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                    <div className="lg:w-1/3 xl:w-1/4 p-4 space-y-4 lg:border-r border-gray-700 overflow-y-auto flex-shrink-0">
                        <h3 className="text-lg font-bold text-gray-300">Selecciona un Escenario "Qué hubiera pasado si..."</h3>
                        {Object.entries(SCENARIOS).map(([id, { name }]) => (
                            <button key={id} onClick={() => setSelectedScenario(id as ScenarioId)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedScenario === id ? 'bg-indigo-500/30 border-indigo-400' : 'bg-gray-800 border-gray-700 hover:border-indigo-500'}`}
                            >
                                <span className="font-semibold text-white">{name}</span>
                            </button>
                        ))}
                         <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                            <h4 className="font-bold text-indigo-200">{scenarioInfo.name}</h4>
                            <p className="text-sm text-gray-400 mt-1">{scenarioInfo.description}</p>
                        </div>
                        <div className="mt-4 p-4 bg-gray-900/70 border-l-4 border-orange-400 rounded-r-lg">
                            <h4 className="font-bold text-orange-300">{scenarioJustification.title}</h4>
                            <p className="text-sm text-gray-300 mt-1">{scenarioJustification.justification}</p>
                        </div>
                    </div>

                    <div ref={containerRef} className="flex-1 p-4 min-h-0 flex flex-col">
                        {size.width > 0 && size.height > 0 && (
                            <LineChart width={size.width} height={size.height} data={combinedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 'auto']} label={{ value: 'NO₂ (µg/m³)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}/>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#818cf8' }}
                                    labelStyle={{ color: '#c7d2fe', fontWeight: 'bold' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="real" name="Realidad Histórica" stroke="#38bdf8" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="simulated" name={scenarioInfo.name} stroke="#f97316" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        )}
                    </div>
                </div>

            </div>
            <style>{`.animate-fade-in { animation: fade-in 0.3s ease-out forwards; } @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
};
