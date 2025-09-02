
import React, { useMemo } from 'react';
import type { GalleryItem, AirQualityRecord, InsightGalleryItem, AIScenarioGalleryItem, DashboardDataPoint } from '../types';
import { POLLUTANT_NAMES } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// This component is repurposed to act as GalleryDetailModal
// to fix a missing file error without adding new files.

interface GalleryDetailModalProps {
    item: GalleryItem;
    onClose: () => void;
    onVote: (id: string) => void;
    onDelete: (id: string) => void;
    isVoted: boolean;
    isAdmin: boolean;
    historicalData: AirQualityRecord[];
}

const InsightChart: React.FC<{ item: InsightGalleryItem, historicalData: AirQualityRecord[] }> = ({ item, historicalData }) => {
    const chartData = useMemo<DashboardDataPoint[]>(() => {
        const { pollutant, aggregation } = item.config;
        const pollutantKey = pollutant as keyof AirQualityRecord;

        const dataForChart = historicalData.reduce((acc, curr) => {
            const value = curr[pollutantKey] as number | null;
            if (value === null || isNaN(value)) return acc;

            const dateKey = aggregation === 'annual'
                ? `${curr.ANO}`
                : `${curr.ANO}-${String(curr.MES).padStart(2, '0')}`;
            
            if (!acc[dateKey]) {
                acc[dateKey] = { sum: 0, count: 0 };
            }
            acc[dateKey].sum += value;
            acc[dateKey].count++;
            
            return acc;
        }, {} as Record<string, { sum: number; count: number }>);

        return Object.entries(dataForChart).map(([date, {sum, count}]) => ({
            date,
            value: parseFloat((sum / count).toFixed(2)),
        })).sort((a,b) => a.date.localeCompare(b.date));
    }, [historicalData, item.config]);
    
    return (
        <div className="w-full h-64 mt-4 bg-gray-900/50 p-2 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} domain={['auto', 'auto']} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#06b6d4', borderRadius: '0.5rem' }}
                        formatter={(value: number) => [value.toFixed(2), POLLUTANT_NAMES[item.config.pollutant]]}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Line type="monotone" dataKey="value" name={POLLUTANT_NAMES[item.config.pollutant]} stroke="#67e8f9" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const AIScenarioChart: React.FC<{ item: AIScenarioGalleryItem }> = ({ item }) => {
    const combinedData = useMemo(() => {
        const { historicalData, simulatedData } = item.config;
        const allDates = new Set([...historicalData.map(p => p.date), ...simulatedData.map(p => p.date)]);
        
        return Array.from(allDates).sort().map(date => {
            const histPoint = historicalData.find(p => p.date === date);
            const simPoint = simulatedData.find(p => p.date === date);
            return {
                date: date,
                'Realidad Histórica': histPoint ? histPoint.value : null,
                'Escenario IA': simPoint ? simPoint.value : null,
            };
        });
    }, [item.config]);

    return (
        <div className="w-full h-64 mt-4 bg-gray-900/50 p-2 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} domain={[0, 'auto']} label={{ value: `µg/m³`, angle: -90, position: 'insideLeft', fill: '#9ca3af' }}/>
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#818cf8', borderRadius: '0.5rem' }}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Line type="monotone" dataKey="Realidad Histórica" stroke="#38bdf8" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="Escenario IA" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};


export const DecisionPanel: React.FC<GalleryDetailModalProps> = ({ item, onClose, onVote, onDelete, isVoted, isAdmin, historicalData }) => {
    const creationDate = new Date(item.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const renderContent = () => {
        switch (item.type) {
            case 'insight':
                return (
                    <>
                        <h5 className="font-bold text-gray-400 mb-1 text-base">Conclusión</h5>
                        <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-gray-200 text-base mb-6">
                           "{item.conclusion}"
                        </blockquote>
                        <h5 className="font-bold text-gray-400 mb-1 text-base">Recomendación</h5>
                        <blockquote className="border-l-4 border-yellow-500 pl-4 italic text-gray-200 text-base">
                           "{item.recommendation}"
                        </blockquote>
                        <InsightChart item={item} historicalData={historicalData} />
                    </>
                );
            case 'ai-scenario':
                return (
                    <>
                        <h5 className="font-bold text-gray-400 mb-1 text-base">Escenario del usuario</h5>
                        <blockquote className="border-l-4 border-indigo-400 pl-4 italic text-gray-200 text-base mb-6">
                           "{item.userPrompt}"
                        </blockquote>
                        <h5 className="font-bold text-gray-400 mb-1 text-base">Explicación de la IA</h5>
                        <blockquote className="border-l-4 border-green-400 pl-4 italic text-gray-200 text-base">
                           "{item.aiExplanation}"
                        </blockquote>
                        <AIScenarioChart item={item} />
                    </>
                );
            case 'audio-viz':
                return (
                    <video src={item.videoDataUrl} className="w-full max-h-[60vh] object-contain bg-black rounded-lg" controls autoPlay loop />
                );
            case '3d-model':
                 return (
                    <img src={item.imageDataUrl} alt={item.title} className="w-full max-h-[60vh] object-contain rounded-lg" />
                );
            default:
                return <p>Tipo de contenido no reconocido.</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800/90 border border-yellow-500/50 rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start pb-4 border-b border-gray-600 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-orbitron text-yellow-300">{item.title}</h2>
                        <p className="text-sm text-gray-400 mt-1">por {item.author} - {creationDate}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-4xl leading-none -mt-2" aria-label="Cerrar">&times;</button>
                </div>
                
                <div className="flex-grow my-4 overflow-y-auto pr-2">
                    {renderContent()}
                </div>

                <div className="flex-shrink-0 pt-4 border-t border-gray-600 flex justify-end items-center gap-4">
                    {isAdmin && (
                        <button onClick={() => onDelete(item.id)} className="px-4 py-2 rounded-lg hover:bg-red-500/20 text-red-400 flex items-center gap-2" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            <span>Eliminar</span>
                        </button>
                    )}
                    <div className="flex items-center gap-2 text-yellow-300 bg-gray-700/50 px-3 py-2 rounded-full">
                        <span className="font-bold text-lg">{item.votes}</span>
                        <button onClick={() => onVote(item.id)} disabled={isVoted} className={`p-1 rounded-full ${isVoted ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-300'}`} title="Votar">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h8a1 1 0 001-1v-6.667a2.25 2.25 0 00-.75-1.666l-3.42-3.42a2.25 2.25 0 00-3.18 0l-3.42 3.42A2.25 2.25 0 006 10.333z" /></svg>
                        </button>
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
