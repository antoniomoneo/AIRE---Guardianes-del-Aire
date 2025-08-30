

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Label } from 'recharts';
import { awardPoints } from '../utils/scoringService';
import type { AirQualityRecord } from '../types';
import { Pollutant } from '../types';

interface RealTimeDataProps {
  onClose: () => void;
  userName: string;
  historicalData: AirQualityRecord[];
}

// Using a CORS proxy to prevent browser-side fetch errors.
const DATASET_URL = "https://corsproxy.io/?https%3A%2F%2Fraw.githubusercontent.com%2Fantoniomoneo%2FDatasets%2Frefs%2Fheads%2Fmain%2Fdata%2Fcalair%2Flatest.flat.csv";

const POLLUTANT_MAP: Record<string, { name: string }> = {
    '1': { name: 'Dióxido de Azufre (SO₂)' },
    '8': { name: 'Dióxido de Nitrógeno (NO₂)' },
    '9': { name: 'Partículas < 2.5µm (PM₂.₅)' },
    '10': { name: 'Partículas < 10µm (PM₁₀)' },
    '14': { name: 'Ozono (O₃)' },
};
type PollutantCode = keyof typeof POLLUTANT_MAP;

const POLLUTANT_CODE_TO_KEY_MAP: Record<PollutantCode, Pollutant> = {
    '1': Pollutant.SO2,
    '8': Pollutant.NO2,
    '9': Pollutant.PM2_5,
    '10': Pollutant.PM10,
    '14': Pollutant.O3,
};

interface HourlyData {
    hour: number;
    value: number;
}

type ParsedData = { data: Record<PollutantCode, Record<number, number[]>>, date: Date | null };

const parseCsvData = (csvText: string): ParsedData => {
    const lines = csvText.trim().split('\n');
    const headerLine = lines.shift();
    if (!headerLine) return { data: {}, date: null };

    const header = headerLine.split(',').map(h => h.trim());

    const colMap: Record<string, number> = header.reduce((acc, col, idx) => {
        acc[col] = idx;
        return acc;
    }, {} as Record<string, number>);

    const requiredCols = ['MAGNITUD', 'ANO', 'MES', 'DIA', 'Hora', 'Valor', 'Validacion'];
    for (const col of requiredCols) {
        if (colMap[col] === undefined) {
            console.error(`La columna requerida '${col}' no se encuentra en el fichero CSV.`);
            return { data: {}, date: null };
        }
    }

    const data: Record<PollutantCode, Record<number, number[]>> = {};
    let fileDate: Date | null = null;

    lines.forEach(line => {
        if (!line.trim()) return;
        const values = line.split(',');
        if (values.length < header.length) return;

        const validacion = values[colMap['Validacion']]?.trim().replace(/"/g, '');
        if (validacion !== 'V') return;

        const pollutantCode = values[colMap['MAGNITUD']]?.trim().replace(/"/g, '') as PollutantCode;
        if (!POLLUTANT_MAP[pollutantCode]) return;

        const horaStr = values[colMap['Hora']]?.trim().replace(/"/g, '');
        const valorStr = values[colMap['Valor']]?.trim().replace(/"/g, '');

        const hora = parseInt(horaStr, 10);
        const valor = parseFloat(valorStr);

        if (isNaN(hora) || isNaN(valor) || hora < 0 || hora > 24) return;

        if (!data[pollutantCode]) data[pollutantCode] = {};
        if (!data[pollutantCode][hora]) data[pollutantCode][hora] = [];
        data[pollutantCode][hora].push(valor);

        if (!fileDate) {
            const year = parseInt(values[colMap['ANO']]?.trim().replace(/"/g, ''));
            const month = parseInt(values[colMap['MES']]?.trim().replace(/"/g, '')) - 1;
            const day = parseInt(values[colMap['DIA']]?.trim().replace(/"/g, ''));
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                fileDate = new Date(year, month, day);
            }
        }
    });

    return { data, date: fileDate };
};


export const RealTimeData: React.FC<RealTimeDataProps> = ({ onClose, userName, historicalData }) => {
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
                const data = parseCsvData(csvText);
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
    
     const { overallAverage, last5YearsAverage } = useMemo(() => {
        const pollutantKey = POLLUTANT_CODE_TO_KEY_MAP[selectedPollutant];
        if (!historicalData || historicalData.length === 0 || !pollutantKey) {
            return { overallAverage: undefined, last5YearsAverage: undefined };
        }

        let totalSum = 0;
        let totalCount = 0;
        historicalData.forEach(record => {
            const value = record[pollutantKey] as number | null;
            if (value !== null && !isNaN(value)) {
                totalSum += value;
                totalCount++;
            }
        });
        const overallAvg = totalCount > 0 ? totalSum / totalCount : undefined;

        const maxYear = Math.max(...historicalData.map(d => d.ANO));
        const startYearForAvg = maxYear - 4;
        const last5YearsData = historicalData.filter(d => d.ANO >= startYearForAvg);
        
        let last5Sum = 0;
        let last5Count = 0;
        last5YearsData.forEach(record => {
            const value = record[pollutantKey] as number | null;
            if (value !== null && !isNaN(value)) {
                last5Sum += value;
                last5Count++;
            }
        });
        const last5Avg = last5Count > 0 ? last5Sum / last5Count : undefined;

        return { 
            overallAverage: overallAvg, 
            last5YearsAverage: last5Avg 
        };
    }, [historicalData, selectedPollutant]);

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
                                {overallAverage !== undefined && (
                                <ReferenceLine y={overallAverage} stroke="#f97316" strokeDasharray="4 4">
                                    <Label value={`Media Histórica (${overallAverage.toFixed(1)})`} position="insideTopLeft" fill="#f97316" fontSize={12} dy={5}/>
                                </ReferenceLine>
                                )}
                                {last5YearsAverage !== undefined && (
                                <ReferenceLine y={last5YearsAverage} stroke="#eab308" strokeDasharray="4 4">
                                    <Label value={`Media 5 Años (${last5YearsAverage.toFixed(1)})`} position="insideTopRight" fill="#eab308" fontSize={12} dy={5}/>
                                </ReferenceLine>
                                )}
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