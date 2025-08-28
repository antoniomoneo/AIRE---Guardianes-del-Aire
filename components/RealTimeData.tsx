

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RealTimeDataProps {
  onClose: () => void;
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

const parseFlatCsv = (csvText: string): { data: Record<PollutantCode, Record<number, number[]>>, date: Date | null } => {
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

        const magnitude = row['magnitud'] as PollutantCode;
        if (!POLLUTANT_MAP[magnitude]) return;

        if (!data[magnitude]) {
            data[magnitude] = {};
        }

        for (let h = 1; h <= 24; h++) {
            const hourStr = h.toString().padStart(2, '0');
            const valueKey = `H${hourStr}`;
            const validKey = `V${hourStr}`;
            
            if (row[validKey] === 'V') {
                const value = parseFloat(row[valueKey]);
                if (!isNaN(value)) {
                    if (!data[magnitude][h]) {
                        data[magnitude][h] = [];
                    }
                    data[magnitude][h].push(value);
                }
            }
        }
    });
    return { data, date: fileDate };
};


export const RealTimeData: React.FC<RealTimeDataProps> = ({ onClose }) => {
    const [parsedData, setParsedData] = useState<Record<PollutantCode, Record<number, number[]>> | null>(null);
    const [availablePollutants, setAvailablePollutants] = useState<PollutantCode[]>([]);
    const [selectedPollutant, setSelectedPollutant] = useState<PollutantCode | null>(null);
    const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(DATASET_URL, { cache: "no-store" });
                if (!res.ok) throw new Error(`Error ${res.status}: No se pudo acceder al conjunto de datos.`);
                const csvText = await res.text();
                
                const { data: rawParsedData, date: fileDate } = parseFlatCsv(csvText);
                setParsedData(rawParsedData);

                const pollutantsInFile = Object.keys(rawParsedData) as PollutantCode[];
                setAvailablePollutants(pollutantsInFile);
                if (pollutantsInFile.length > 0) {
                    setSelectedPollutant(pollutantsInFile.includes('8') ? '8' : pollutantsInFile[0]);
                } else {
                    throw new Error("El archivo de datos más reciente no contiene datos de contaminantes válidos.");
                }

                if (fileDate) {
                    setLastUpdateTimestamp(fileDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }));
                } else {
                    setLastUpdateTimestamp("Último día disponible");
                }

            } catch (e) {
                if (e instanceof Error) {
                    setError(e.message);
                } else {
                    setError("Ocurrió un error desconocido al cargar los datos.");
                }
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const chartData = useMemo(() => {
        if (!parsedData || !selectedPollutant || !parsedData[selectedPollutant]) {
            return [];
        }
        const hourlyAverages: HourlyData[] = [];
        const pollutantData = parsedData[selectedPollutant];

        for (let h = 1; h <= 24; h++) {
            const values = pollutantData[h];
            if (values && values.length > 0) {
                const sum = values.reduce((acc, val) => acc + val, 0);
                const avg = sum / values.length;
                hourlyAverages.push({ hour: h, value: parseFloat(avg.toFixed(2)) });
            }
        }
        return hourlyAverages;
    }, [parsedData, selectedPollutant]);

    const ControlButton: React.FC<{onClick: () => void, isActive: boolean, children: React.ReactNode}> = ({ onClick, isActive, children }) => (
        <button
          onClick={onClick}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-semibold rounded-md transition-all duration-200 border-2 ${
            isActive
              ? 'bg-red-500 border-red-400 text-white shadow-md'
              : 'bg-gray-700/50 border-gray-600 hover:border-red-500 text-gray-300'
          }`}
        >
          {children}
        </button>
      );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/95 border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-6xl h-full sm:h-[90vh] p-4 sm:p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl sm:text-2xl font-orbitron text-red-300">Datos de Ayer</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                
                {loading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-red-400 mx-auto"></div>
                            <p className="mt-4 text-lg">Cargando datos del último día disponible...</p>
                        </div>
                    </div>
                )}
                {error && !loading && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center p-6 bg-red-900/50 rounded-lg">
                            <h3 className="text-xl font-bold text-red-300">Error de Carga</h3>
                            <p className="mt-2 text-red-200 max-w-lg">{error}</p>
                        </div>
                    </div>
                )}
                {!loading && !error && selectedPollutant && (
                    <div className="flex flex-col flex-grow min-h-0 pt-4">
                         <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider">Contaminante</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {availablePollutants.map(code => (
                                        <ControlButton key={code} onClick={() => setSelectedPollutant(code)} isActive={selectedPollutant === code}>
                                            {POLLUTANT_MAP[code].name.match(/\\(([^)]+)\\)/)?.[1] || POLLUTANT_MAP[code].name}
                                        </ControlButton>
                                    ))}
                                </div>
                            </div>
                            {lastUpdateTimestamp && (
                                <p className="text-sm text-gray-400 text-right mt-2 sm:mt-0">
                                    Datos del día: <span className="font-semibold text-gray-200">{lastUpdateTimestamp}</span>
                                </p>
                            )}
                        </div>
                        <div className="flex-grow">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="hour" stroke="#9ca3af" tick={{ fontSize: 12 }} label={{ value: 'Hora del día', position: 'insideBottom', offset: -5, fill: '#9ca3af' }} />
                                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={['auto', 'auto']} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#f87171' }}
                                        labelStyle={{ color: '#fca5a5', fontWeight: 'bold' }}
                                        formatter={(value: number, name: string, props: any) => [`${value} µg/m³`, `Hora ${props.payload.hour}:00`]}
                                        labelFormatter={() => ''}
                                    />
                                    <Legend verticalAlign="top" height={36}/>
                                    <Line type="monotone" dataKey="value" name={`Promedio de ${POLLUTANT_MAP[selectedPollutant].name}`} stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};