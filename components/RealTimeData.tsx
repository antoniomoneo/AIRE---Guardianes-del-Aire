
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Label, ResponsiveContainer } from 'recharts';
import { awardPoints } from '../utils/scoringService';
import type { AirQualityRecord, StationDailyAverage, StationLocation } from '../types';
import { Pollutant } from '../types';
import { calculateAQI } from '../utils/realTimeDataUtils';
import type { RealTimePollutantCode } from '../utils/realTimeDataUtils';
import { Heatmap } from './Heatmap';
import { stationLocationsGeoJSON } from '../data/stationLocations';

interface RealTimeDataProps {
  onClose: () => void;
  userName: string;
  historicalData: AirQualityRecord[];
}

const TARGET_RAW_URL = "https://raw.githubusercontent.com/antoniomoneo/Datasets/main/data/calair/latest.flat.csv";
const DATASET_URL = "/api/proxy?url=" + encodeURIComponent(TARGET_RAW_URL);


// FIX: Use 'as const' to infer literal types for keys, making PollutantCode a union of literals instead of string.
const POLLUTANT_MAP = {
    '1': { name: 'Dióxido de Azufre (SO₂)' },
    '8': { name: 'Dióxido de Nitrógeno (NO₂)' },
    '9': { name: 'Partículas < 2.5µm (PM₂.₅)' },
    '10': { name: 'Partículas < 10µm (PM₁₀)' },
    '14': { name: 'Ozono (O₃)' },
} as const;
export type PollutantCode = keyof typeof POLLUTANT_MAP;

const STATION_MAP: Record<string, { name: string }> = {
    '4': { name: 'Pza. de España' },
    '8': { name: 'Escuelas Aguirre' },
    '11': { name: 'Av. Ramón y Cajal' },
    '16': { name: 'Arturo Soria' },
    '17': { name: 'Villaverde' },
    '18': { name: 'Farolillo' },
    '24': { name: 'Casa de Campo' },
    '27': { name: 'Barajas Pueblo' },
    '35': { name: 'Pza. del Carmen' },
    '36': { name: 'Moratalaz' },
    '38': { name: 'Cuatro Caminos' },
    '39': { name: 'Barrio del Pilar' },
    '40': { name: 'Vallecas' },
    '47': { name: 'Méndez Álvaro' },
    '48': { name: 'Pº Castellana' },
    '49': { name: 'Retiro' },
    '50': { name: 'Plaza Castilla' },
    '54': { name: 'Ensanche de Vallecas' },
    '55': { name: 'Urb. Embajada' },
    '56': { name: 'Pza. Elíptica' },
    '57': { name: 'Sanchinarro' },
    '58': { name: 'El Pardo' },
    '59': { name: 'Juan Carlos I' },
    '60': { name: 'Tres Olivos' },
};

const POLLUTANT_CODE_TO_KEY_MAP: Record<PollutantCode, Pollutant> = {
    '1': Pollutant.SO2,
    '8': Pollutant.NO2,
    '9': Pollutant.PM25,
    '10': Pollutant.PM10,
    '14': Pollutant.O3,
};

interface HourlyData {
    hour: number;
    value: number;
}
interface RealTimeRecord {
    pollutantCode: PollutantCode;
    stationCode: string;
    hour: number;
    value: number;
}

interface Station {
    code: string;
    name: string;
}

type ParsedData = {
    records: RealTimeRecord[];
    stations: Station[];
    date: Date | null;
};

const parseCsvData = (csvText: string): ParsedData => {
    const lines = csvText.trim().split('\n');
    const headerLine = lines.shift();
    if (!headerLine) return { records: [], stations: [], date: null };

    const header = headerLine.split(',').map(h => h.trim());

    const colMap: Record<string, number> = header.reduce((acc, col, idx) => {
        acc[col] = idx;
        return acc;
    }, {} as Record<string, number>);

    const requiredCols = ['ESTACION', 'MAGNITUD', 'ANO', 'MES', 'DIA', 'Hora', 'Valor', 'Validacion'];
    for (const col of requiredCols) {
        if (colMap[col] === undefined) {
            console.error(`La columna requerida '${col}' no se encuentra en el fichero CSV.`);
            return { records: [], stations: [], date: null };
        }
    }

    const records: RealTimeRecord[] = [];
    let fileDate: Date | null = null;
    const foundStations = new Map<string, string>();

    lines.forEach(line => {
        if (!line.trim()) return;
        const values = line.split(',');
        if (values.length < header.length) return;

        const validacion = values[colMap['Validacion']]?.trim().replace(/"/g, '');
        if (validacion !== 'V') return;

        const pollutantCode = values[colMap['MAGNITUD']]?.trim().replace(/"/g, '') as PollutantCode;
        if (!POLLUTANT_MAP[pollutantCode]) return;

        const stationCode = values[colMap['ESTACION']]?.trim().replace(/"/g, '');
        if (!STATION_MAP[stationCode]) return;

        const horaStr = values[colMap['Hora']]?.trim().replace(/"/g, '');
        const valorStr = values[colMap['Valor']]?.trim().replace(/"/g, '');

        const hora = parseInt(horaStr, 10);
        const valor = parseFloat(valorStr);

        if (isNaN(hora) || isNaN(valor) || hora < 0 || hora > 24) return;
        
        records.push({ pollutantCode, stationCode, hour: hora, value: valor });
        if (!foundStations.has(stationCode)) {
            foundStations.set(stationCode, STATION_MAP[stationCode].name);
        }

        if (!fileDate) {
            const year = parseInt(values[colMap['ANO']]?.trim().replace(/"/g, ''));
            const month = parseInt(values[colMap['MES']]?.trim().replace(/"/g, '')) - 1;
            const day = parseInt(values[colMap['DIA']]?.trim().replace(/"/g, ''));
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                fileDate = new Date(year, month, day);
            }
        }
    });
    
    const stations = Array.from(foundStations.entries())
        .map(([code, name]) => ({ code, name }))
        .sort((a,b) => a.name.localeCompare(b.name));

    return { records, stations, date: fileDate };
};


export const RealTimeData: React.FC<RealTimeDataProps> = ({ onClose, userName, historicalData }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [selectedPollutant, setSelectedPollutant] = useState<PollutantCode>('8');
    const [selectedStation, setSelectedStation] = useState<string>('all');
    const [view, setView] = useState<'chart' | 'map'>('chart');
    const [stationLocations, setStationLocations] = useState<StationLocation[]>([]);

    const hasAwardedPoints = useRef(false);

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
                let response = await fetch(DATASET_URL); // Intento 1: Proxy
                
                if (!response.ok) {
                    console.warn(`El proxy falló (${response.status}). Intentando acceso directo a ${TARGET_RAW_URL}`);
                    response = await fetch(TARGET_RAW_URL); // Intento 2: Fallback directo
                }

                if (!response.ok) {
                    let errorMessage = `Fallo en la red (${response.status})`;
                    try {
                        // El proxy puede enviar errores JSON, intentamos parsearlos para un mejor mensaje.
                        const errorJson = await response.json();
                        if (errorJson.error) {
                            errorMessage = errorJson.error;
                        }
                    } catch (jsonError) {
                        // La respuesta no era JSON, usar el mensaje de error HTTP original.
                    }
                    throw new Error(errorMessage);
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

        const loadStationLocations = () => {
            try {
                const locations = stationLocationsGeoJSON.features.map((feature: any) => {
                    const { id_station, nombre } = feature.properties;
                    const [lon, lat] = feature.geometry.coordinates;
                    return { code: String(id_station), name: nombre, lat, lon };
                });
                setStationLocations(locations);
            } catch (e) {
                console.error("Failed to process station locations:", e);
                setError(prev => prev ? `${prev}\nError al procesar ubicaciones.` : 'Error al procesar ubicaciones.');
            }
        };

        fetchData();
        loadStationLocations();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, userName]);

    const chartData = useMemo<HourlyData[] | null>(() => {
        if (!parsedData) return null;

        let filteredRecords = parsedData.records.filter(r => r.pollutantCode === selectedPollutant);

        if (selectedStation !== 'all') {
            filteredRecords = filteredRecords.filter(r => r.stationCode === selectedStation);
        }
        if (filteredRecords.length === 0) return null;

        const hourlyAgg: Record<number, { sum: number, count: number }> = {};
        for(const record of filteredRecords) {
            if (!hourlyAgg[record.hour]) {
                hourlyAgg[record.hour] = { sum: 0, count: 0 };
            }
            hourlyAgg[record.hour].sum += record.value;
            hourlyAgg[record.hour].count++;
        }
        
        return Object.entries(hourlyAgg).map(([hour, { sum, count }]) => {
            return { hour: parseInt(hour), value: parseFloat((sum / count).toFixed(2)) };
        }).sort((a,b) => a.hour - b.hour);

    }, [parsedData, selectedPollutant, selectedStation]);

    const dailyAverage = useMemo(() => {
        if (!chartData || chartData.length === 0) return undefined;
        const sum = chartData.reduce((acc, curr) => acc + curr.value, 0);
        return sum / chartData.length;
    }, [chartData]);


    const stationAverages = useMemo<StationDailyAverage[]>(() => {
        if (!parsedData) return [];

        const recordsForPollutant = parsedData.records.filter(r => r.pollutantCode === selectedPollutant);
        if (recordsForPollutant.length === 0) return [];

        const avgMap = new Map<string, { sum: number, count: number }>();
        recordsForPollutant.forEach(record => {
            if (!avgMap.has(record.stationCode)) {
                avgMap.set(record.stationCode, { sum: 0, count: 0 });
            }
            const current = avgMap.get(record.stationCode)!;
            current.sum += record.value;
            current.count++;
        });
        
        const averages: StationDailyAverage[] = [];
        avgMap.forEach((data, stationCode) => {
            const avgValue = data.sum / data.count;
            averages.push({
                stationCode,
                value: avgValue,
                // FIX: The calculateAQI function does not support SO2 ('1').
                // We'll calculate AQI only for supported pollutants and default to 0 otherwise.
                aqi: selectedPollutant !== '1' ? calculateAQI(selectedPollutant, avgValue) : 0,
            });
        });

        return averages;
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

    const subtitle = useMemo(() => {
        const dateStr = formattedDate;
        if (selectedStation === 'all' || !parsedData) {
            return `Media horaria de todas las estaciones para el día ${dateStr}`;
        }
        const stationName = parsedData.stations.find(s => s.code === selectedStation)?.name;
        return `Datos horarios de la estación "${stationName}" para el día ${dateStr}`;
    }, [formattedDate, selectedStation, parsedData]);
    
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
    
    const ViewToggleButton: React.FC<{onClick: () => void, isActive: boolean, children: React.ReactNode}> = ({ onClick, isActive, children }) => (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 border-2 ${
                isActive
                ? 'bg-gray-200 border-gray-100 text-gray-900'
                : 'bg-gray-700/50 border-gray-600 hover:border-gray-200 text-gray-300'
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
                        <p className="text-sm text-gray-400">{view === 'chart' ? subtitle : `Mapa de calor para ${POLLUTANT_MAP[selectedPollutant].name} el ${formattedDate}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ViewToggleButton onClick={() => setView('chart')} isActive={view === 'chart'}>Gráfico</ViewToggleButton>
                        <ViewToggleButton onClick={() => setView('map')} isActive={view === 'map'}>Mapa</ViewToggleButton>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none ml-4" aria-label="Cerrar">&times;</button>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div>
                        <h3 className="text-xs sm:text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Contaminante</h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(POLLUTANT_MAP).map(([code, {name}]) => (
                                <ControlButton key={code} onClick={() => setSelectedPollutant(code as PollutantCode)} isActive={selectedPollutant === code}>
                                    {name.match(/\(([^)]+)\)/)?.[1] || name}
                                </ControlButton>
                            ))}
                        </div>
                    </div>
                    {view === 'chart' && !loading && parsedData && parsedData.stations.length > 0 && (
                        <div>
                             <h3 className="text-xs sm:text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Estación</h3>
                             <select
                                id="station-select"
                                value={selectedStation}
                                onChange={e => setSelectedStation(e.target.value)}
                                className="p-2 bg-gray-700/50 border-2 border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-400 h-full w-full sm:w-auto"
                            >
                                <option value="all">Todas (Media)</option>
                                {parsedData.stations.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                            </select>
                        </div>
                     )}
                </div>


                <div className="flex-grow min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">Cargando datos...</div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full text-center text-red-400">{error}</div>
                    ) : (
                        view === 'chart' ? (
                            chartData && chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                                        {dailyAverage !== undefined && (
                                        <ReferenceLine y={dailyAverage} stroke="#a78bfa" strokeDasharray="4 4">
                                            <Label value={`Media del Día (${dailyAverage.toFixed(1)})`} position="insideTop" fill="#a78bfa" fontSize={12} dy={5}/>
                                        </ReferenceLine>
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">No hay datos disponibles para la selección actual.</div>
                                )
                        ) : ( // Map View
                            // FIX: The Heatmap component does not support SO2 ('1'), as it relies on AQI.
                            // We show a message instead of rendering the map for this pollutant.
                            selectedPollutant !== '1' ?
                                <Heatmap 
                                    stationAverages={stationAverages}
                                    stationLocations={stationLocations}
                                />
                                :
                                <div className="flex items-center justify-center h-full text-gray-500">El mapa de calor no está disponible para Dióxido de Azufre (SO₂).</div>
                        )
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