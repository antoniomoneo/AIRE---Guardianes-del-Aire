
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { ProcessedData } from '../types';

interface ChartProps {
  data: ProcessedData;
}

export const Chart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="w-full h-80">
      <h3 className="text-center font-orbitron text-cyan-300 mb-4">Evolución del NO₂ en Madrid</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
      </ResponsiveContainer>
    </div>
  );
};
