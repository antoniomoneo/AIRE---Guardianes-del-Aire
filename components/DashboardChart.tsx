

import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DashboardDataPoint } from '../types';

interface DashboardChartProps {
  data: DashboardDataPoint[];
  pollutantName: string;
}

export const DashboardChart: React.FC<DashboardChartProps> = ({ data, pollutantName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (el && el.clientWidth > 0 && el.clientHeight > 0) {
      setIsReady(true);
    }
  }, []);


  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No hay datos disponibles para la selección actual.
      </div>
    );
  }

  const xAxisTickFormatter = (tick: string) => {
    // If showing many years of monthly data, only show the year for January
    if (tick.includes('-01')) {
      return tick.substring(0, 4);
    }
    // For annual data, always show the year
    if (!tick.includes('-')) {
        return tick;
    }
    return '';
  };

  return (
    <div className="w-full h-full" ref={containerRef}>
      {isReady ? (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
                dataKey="date" 
                stroke="#9ca3af" 
                tick={{ fontSize: 12 }} 
                tickFormatter={data.length > 48 ? xAxisTickFormatter : undefined}
                angle={data.length > 12 ? -35 : 0}
                textAnchor="end"
                height={data.length > 12 ? 50 : 30}
                interval="preserveStartEnd"
            />
            <YAxis 
                stroke="#9ca3af" 
                tick={{ fontSize: 12 }} 
                domain={['auto', 'auto']} 
                label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fill: '#9ca3af', dy: 40 }} 
            />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(31, 41, 55, 0.8)', 
                    borderColor: '#06b6d4',
                    color: '#e5e7eb'
                }}
                labelStyle={{ color: '#67e8f9', fontWeight: 'bold' }}
                formatter={(value: number) => [value.toFixed(2), pollutantName]}
            />
            <Legend wrapperStyle={{ color: '#e5e7eb', fontSize: '14px', paddingTop: '20px' }} verticalAlign="top" />
            <Line type="monotone" dataKey="value" name={pollutantName} stroke="#67e8f9" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
        </ResponsiveContainer>
      ) : (
         <div className="flex items-center justify-center h-full text-gray-400">
            Cargando gráfico...
        </div>
      )}
    </div>
  );
};