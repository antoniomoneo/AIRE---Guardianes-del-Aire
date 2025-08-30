import { useState, useEffect } from 'react';
import type { AirQualityRecord, Pollutant } from '../types';
import { Pollutant as PollutantEnum } from '../types';
import { rawCsvData } from '../data/airQualityData';

const POLLUTANT_MAP: { [key: string]: Pollutant } = {
    'Dióxido de Nitrógeno': PollutantEnum.NO2,
    'Partículas < 2.5 µm': PollutantEnum.PM25,
    'Partículas < 10 µm': PollutantEnum.PM10,
    'Ozono': PollutantEnum.O3,
    'Dióxido de Azufre': PollutantEnum.SO2,
};

const parseAggregatedCSV = (csvText: string): AirQualityRecord[] => {
    const lines = csvText.trim().split('\n');
    lines.shift(); // Remove header

    const dataByMonth = new Map<string, Partial<AirQualityRecord>>();

    for (const line of lines) {
        if (!line.trim() || line.startsWith(',')) continue;

        const parts = line.split(',');
        if (parts.length < 4) continue;
        
        const [yearStr, monthStr, magnitude, valueStr] = parts;
        
        const pollutantKey = POLLUTANT_MAP[magnitude];
        if (!pollutantKey) continue;

        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const value = parseFloat(valueStr);

        if (isNaN(year) || isNaN(month) || isNaN(value)) {
            continue;
        }

        const key = `${year}-${month}`;
        if (!dataByMonth.has(key)) {
            dataByMonth.set(key, {
                ANO: year,
                MES: month,
                ESTACION: 0, // Use a dummy station ID as data is pre-aggregated
                NO2: null,
                PM25: null,
                PM10: null,
                O3: null,
                SO2: null,
            });
        }

        const record = dataByMonth.get(key)!;
        record[pollutantKey] = value;
    }
    
    return Array.from(dataByMonth.values()) as AirQualityRecord[];
};

export const useAirQualityData = () => {
  const [data, setData] = useState<AirQualityRecord[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reverted to local data loading to fix broken remote URL and improve reliability.
    const processLocalData = () => {
        setLoading(true);
        setError(null);
        try {
            if (!rawCsvData) {
                throw new Error("El archivo de datos local está vacío.");
            }
            const parsedData = parseAggregatedCSV(rawCsvData);

            if (parsedData.length === 0) {
                throw new Error("No se pudieron procesar los datos locales. El archivo podría estar malformado.");
            }
            setData(parsedData);
        } catch (e) {
             if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('Ocurrió un error desconocido al procesar los datos locales.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Use a small timeout to allow the loading spinner to be visible for a better UX.
    const timer = setTimeout(processLocalData, 300);
    return () => clearTimeout(timer);

  }, []);

  return { data, loading, error };
};