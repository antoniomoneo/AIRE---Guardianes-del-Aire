
import React, { useState, useRef, useLayoutEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import type { ProcessedData } from '../types';

interface ChartProps {
  data: ProcessedData;
}

export const Chart: React.FC<ChartProps> = ({ data }) => {
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

  return (
    <div className="w-full h-80 flex flex-col">
      <h3 className="text-center font-orbitron text-cyan-300 mb-4 flex-shrink-0">Evolución del NO₂ en Madrid</h3>
      <div className="flex-grow min-h-0" ref={containerRef}>
        {(size.width > 0 && size.height > 0) && data && data.length > 0 ? (
            <LineChart width={size.width} height={size.height} data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} domain={[0, 70]} label={{ value: 'µg/m³', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(31, 41, 55, 0.8)', 
                    borderColor: '#06b6d4',
                    color: '#e5e7eb'
                }}
                labelStyle={{ color: '#67e8f9', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ color: '#e5e7eb', fontSize: '14px' }} />
                <Line type="monotone" dataKey="NO2" name="NO₂ (media)" stroke="#67e8f9" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                <ReferenceLine y={40} label={{ value: "Límite UE (2010)", position: 'insideTopRight', fill: '#f87171' }} stroke="#f87171" strokeDasharray="3 3" />
                <ReferenceLine y={20} label={{ value: "Objetivo UE (2030)", position: 'insideTopRight', fill: '#facc15' }} stroke="#facc15" strokeDasharray="3 3" />
                <ReferenceLine y={10} label={{ value: "Recom. OMS", position: 'insideTopRight', fill: '#4ade80' }} stroke="#4ade80" strokeDasharray="3 3" />
            </LineChart>
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">Cargando gráfico...</div>
        )}
      </div>
    </div>
  );
};
