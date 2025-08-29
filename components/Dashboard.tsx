
import React, { useState, useMemo, useEffect } from 'react';
import { Pollutant } from '../types';
import { POLLUTANT_NAMES } from '../constants';
import type { AirQualityRecord, DashboardDataPoint } from '../types';
import { DashboardChart } from './DashboardChart';
import { PublishModal } from './PublishModal';
import { addGalleryItem } from '../utils/galleryService';
import { awardPoints } from '../utils/scoringService';

interface DashboardProps {
  data: AirQualityRecord[];
  onClose: () => void;
  userName: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onClose, userName }) => {
  const [selectedPollutant, setSelectedPollutant] = useState<Pollutant>(Pollutant.NO2);
  const [aggregation, setAggregation] = useState<'annual' | 'monthly'>('annual');
  const [conclusion, setConclusion] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const chartData = useMemo<DashboardDataPoint[]>(() => {
    const pollutantKey = selectedPollutant as keyof AirQualityRecord;
    
    const monthlyData = data.reduce((acc, curr) => {
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

    return Object.entries(monthlyData).map(([date, {sum, count}]) => ({
        date,
        value: parseFloat((sum / count).toFixed(2)),
    })).sort((a,b) => a.date.localeCompare(b.date));
  }, [data, selectedPollutant, aggregation]);

  const handlePublish = async (authorName: string) => {
    setIsPublishing(true);
    try {
        const title = `Análisis de ${POLLUTANT_NAMES[selectedPollutant]}`;
        await addGalleryItem({
            type: 'insight',
            author: authorName,
            title,
            conclusion,
            recommendation,
            config: {
                pollutant: selectedPollutant,
                aggregation,
            }
        });
        awardPoints(authorName, 500);
        alert('¡Publicado en la galería con éxito! (+500 Puntos)');
        setIsPublishModalOpen(false);
        setConclusion('');
        setRecommendation('');
    } catch (error) {
        console.error("Error publishing insight to gallery:", error);
        const errorMessage = error instanceof Error ? error.message : "Hubo un error al publicar en la galería.";
        alert(errorMessage);
    } finally {
        setIsPublishing(false);
    }
  };

  const ControlButton: React.FC<{onClick: () => void, isActive: boolean, children: React.ReactNode}> = ({ onClick, isActive, children }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-semibold rounded-md transition-all duration-200 border-2 ${
        isActive
          ? 'bg-cyan-500 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
          : 'bg-gray-700/50 border-gray-600 hover:border-cyan-500 text-gray-300'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900/90 border border-cyan-500/30 rounded-2xl shadow-2xl w-full max-w-6xl h-full sm:h-[90vh] p-4 sm:p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-orbitron text-cyan-300">Dashboard de Calidad del Aire</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar dashboard">&times;</button>
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto pr-2">
            <div className="flex flex-col min-h-full">
                <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 mb-4 flex-shrink-0">
                    <div className="flex-shrink-0">
                        <h3 className="text-xs sm:text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Contaminante</h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(Pollutant).map(p => (
                                <ControlButton key={p} onClick={() => setSelectedPollutant(p)} isActive={selectedPollutant === p}>
                                    {POLLUTANT_NAMES[p].match(/\(([^)]+)\)/)?.[1] || p}
                                </ControlButton>
                            ))}
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <h3 className="text-xs sm:text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Agrupación</h3>
                        <div className="flex gap-2">
                            <ControlButton onClick={() => setAggregation('annual')} isActive={aggregation === 'annual'}>Anual</ControlButton>
                            <ControlButton onClick={() => setAggregation('monthly')} isActive={aggregation === 'monthly'}>Mensual</ControlButton>
                        </div>
                    </div>
                </div>

                <div className="flex-grow min-h-[350px]">
                     <DashboardChart data={chartData} pollutantName={POLLUTANT_NAMES[selectedPollutant]} />
                </div>

                <div className="pt-4 border-t border-gray-700 mt-4 flex-shrink-0">
                    <h3 className="text-lg font-orbitron text-yellow-300 mb-3">Publica tu Análisis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="conclusion" className="font-bold text-gray-400 mb-1 block uppercase tracking-wider text-sm">Conclusión</label>
                            <textarea
                                id="conclusion"
                                value={conclusion}
                                onChange={(e) => setConclusion(e.target.value)}
                                placeholder="Escribe una breve conclusión basada en los datos que has observado..."
                                className="w-full h-24 p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                                maxLength={500}
                            />
                        </div>
                        <div>
                            <label htmlFor="recommendation" className="font-bold text-gray-400 mb-1 block uppercase tracking-wider text-sm">Recomendación</label>
                            <textarea
                                id="recommendation"
                                value={recommendation}
                                onChange={(e) => setRecommendation(e.target.value)}
                                placeholder="Basado en tu conclusión, ¿qué recomendarías?"
                                className="w-full h-24 p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                                maxLength={500}
                            />
                        </div>
                    </div>
                    <div className="mt-3 text-right">
                        <button
                            onClick={() => setIsPublishModalOpen(true)}
                            disabled={!conclusion.trim() || !recommendation.trim()}
                            className="px-6 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Publicar en Galería
                        </button>
                    </div>
                </div>
            </div>
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
