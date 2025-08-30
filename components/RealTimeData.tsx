
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { awardPoints } from '../utils/scoringService';

interface RealTimeDataProps {
  onClose: () => void;
  userName: string;
}

// Using a CORS proxy to prevent browser-side fetch errors.
const DATASET_URL = "https://corsproxy.io/?https%3A%2F%2Fstorage.googleapis.com%2Faire-470107-datasets-usw1%2Fcalair%2Flatest.flat.csv";

const POLLUTANT_MAP: Record<string, { name: string }> = {
    '1': { name: 'Dióxido de Azufre (SO₂)' },
    '8': { name: 'Dióxido de Nitrógeno (NO₂)' },
    '9': { name: 'Partículas < 2.5µm (PM₂.₅)' },
    '10': { name: 'Partículas < 10µm (PM₁₀)' },
    '14': { name: 'Ozono (O₃)' },
};
type PollutantCode = keyof typeof POLLUTANT_MAP;

interface HourlyData {
    hour: number;
    value: number;
}

type ParsedData = { data: Record<PollutantCode, Record<number, number[]>>, date: Date | null };

const parseFlatCsv = (csvText: string): ParsedData => {
    const lines = csvText.trim().split('\n');
    const headerLine = lines.shift();
    if (!headerLine) return { data: {}, date: null };
    const header = headerLine.split(',').map(h => h.trim());

    const data: Record<PollutantCode, Record<number, number[]>> = {};
    let fileDate: Date | null = null;

    lines.forEach(line => {
        if (!line.trim()) return;
        const values = line.split(',');
        const row = header.reduce((obj, nextKey, index) => {
            obj[nextKey] = values[index];
            return obj;
        }, {} as Record<string, string>);

        if (!fileDate && row['ano'] && row['mes'] && row['dia']) {
            const year = parseInt(row['ano']);
            const month = parseInt(row['mes']) - 1; // Date month is 0-indexed
            const day = parseInt(row['dia']);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                fileDate = new Date(year, month, day);
            }
        }
        
        const pollutantCode = row['magnitud'] as PollutantCode;
        if (!POLLUTANT_MAP[pollutantCode]) return;
        if (!data[pollutantCode]) data[pollutantCode] = {};

        for (let i = 1; i <= 24; i++) {
            const hourKey = `h${String(i).padStart(2, '0')}`;
            const validationKey = `v${String(i).padStart(2, '0')}`;
            if (row[validationKey] === 'V' && row[hourKey]) {
                const value = parseFloat(row[hourKey]);
                if (!isNaN(value)) {
                    if (!data[pollutantCode][i]) data[pollutantCode][i] = [];
                    data[pollutantCode][i].push(value);
                }
            }
        }
    });

    return { data, date: fileDate };
};

export const RealTimeData: React.FC<RealTimeDataProps> = ({ onClose, userName }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [selectedPollutant, setSelectedPollutant] = useState<PollutantCode>('8');
    const hasAwardedPoints = useRef(false);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const chartContainerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const container = chartContainerRef.current;
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
            awardPoints(userName, 300);
            hasAwardedPoints.current = true;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(DATASET_URL);
                if (!response.ok) {
                    throw new Error(`Fallo en la red (${response.status})`);
                }
                const csvText = await response.text();
                if (!csvText) {
                    throw new Error('El archivo de datos está vacío.');
                }
                const data = parseFlatCsv(csvText);
                setParsedData(data);
            } catch (e) {
                if (e instanceof Error) {
                    setError(`No se pudieron cargar los datos de ayer. ${e.message}`);
                } else {
                    setError('Ocurrió un error desconocido.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, userName]);

    const chartData = useMemo<HourlyData[] | null>(() => {
        if (!parsedData || !parsedData.data[selectedPollutant]) return null;
        
        const pollutantData = parsedData.data[selectedPollutant];
        
        return Object.entries(pollutantData).map(([hour, values]) => {
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            return { hour: parseInt(hour), value: parseFloat(avg.toFixed(2)) };
        }).sort((a,b) => a.hour - b.hour);
    }, [parsedData, selectedPollutant]);
    
    const formattedDate = useMemo(() => {
        if (!parsedData?.date) return 'ayer';
        return parsedData.date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    }, [parsedData?.date]);
    
    const ControlButton: React.FC<{onClick: () => void, isActive: boolean, children: React.ReactNode}> = ({ onClick, isActive, children }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 border-2 ${
                isActive
                ? 'bg-red-500 border-red-400 text-white shadow-md shadow-red-500/20'
                : 'bg-gray-700/50 border-gray-600 hover:border-red-500 text-gray-300'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/90 border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-4xl h-full sm:h-[90vh] p-4 sm:p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-orbitron text-red-300">Datos de Calidad del Aire</h2>
                        <p className="text-sm text-gray-400">Media horaria de todas las estaciones para el día {formattedDate}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(POLLUTANT_MAP).map(([code, {name}]) => (
                        <ControlButton key={code} onClick={() => setSelectedPollutant(code as PollutantCode)} isActive={selectedPollutant === code}>
                            {name}
                        </ControlButton>
                    ))}
                </div>

                <div className="flex-grow min-h-0" ref={chartContainerRef}>
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">Cargando datos...</div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full text-center text-red-400">{error}</div>
                    ) : (size.width > 0 && size.height > 0) ? (
                         chartData && chartData.length > 0 ? (
                            <LineChart width={size.width} height={size.height} data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="hour" stroke="#9ca3af" tick={{ fontSize: 12 }} label={{ value: 'Hora del día', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}/>
                                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={['auto', 'auto']} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}/>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#f87171' }}
                                    labelStyle={{ color: '#fca5a5', fontWeight: 'bold' }}
                                    formatter={(value: number) => [value, POLLUTANT_MAP[selectedPollutant].name]}
                                    labelFormatter={(label) => `Hora: ${label}:00`}
                                />
                                <Line type="monotone" dataKey="value" name={POLLUTANT_MAP[selectedPollutant].name} stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 7 }} />
                            </LineChart>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No hay datos disponibles para el contaminante seleccionado.</div>
                        )
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">Cargando gráfico...</div>
                    )}
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
