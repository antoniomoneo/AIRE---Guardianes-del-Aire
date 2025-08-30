import React, { useState, useMemo } from 'react';
import type { StationLocation, StationDailyAverage } from '../types';
import { madridDistrictsSvgPaths, madridBasemapUrl } from '../utils/assets';
import { AQI_LEVELS, POLLUTANT_INFO } from '../utils/realTimeDataUtils';
import type { RealTimePollutantCode } from '../utils/realTimeDataUtils';

interface HeatmapProps {
    stationAverages: StationDailyAverage[];
    stationLocations: StationLocation[];
    selectedPollutant: RealTimePollutantCode;
}

export const Heatmap: React.FC<HeatmapProps> = ({ stationAverages, stationLocations, selectedPollutant }) => {
    const [tooltip, setTooltip] = useState<{ x: number, y: number, content: string } | null>(null);

    const dataMap = useMemo(() => {
        const map = new Map<string, StationDailyAverage>();
        stationAverages.forEach(avg => map.set(avg.stationCode, avg));
        return map;
    }, [stationAverages]);
    
    const pollutantName = POLLUTANT_INFO[selectedPollutant as keyof typeof POLLUTANT_INFO]?.name || '';

    const handleMouseOver = (e: React.MouseEvent<SVGCircleElement>, station: StationLocation) => {
        const stationData = dataMap.get(station.code);
        if (stationData) {
            const parentRect = e.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect();
            if(parentRect) {
                setTooltip({
                    x: e.clientX - parentRect.left,
                    y: e.clientY - parentRect.top,
                    content: `${station.name}: ${stationData.value.toFixed(1)} µg/m³`,
                });
            }
        }
    };
    
    const handleMouseOut = () => {
        setTooltip(null);
    };

    return (
        <div className="w-full h-full relative flex items-center justify-center">
            <svg viewBox="0 0 300 300" className="w-full h-full max-w-full max-h-full">
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                
                {/* Render the new basemap image */}
                <image href={madridBasemapUrl} x="0" y="0" width="300" height="300" />
                
                {/* Render the district paths as a subtle, semi-transparent overlay */}
                <g id="basemap-overlay">
                    {madridDistrictsSvgPaths.map((path, index) => (
                        <path
                            key={`district-${index}`}
                            d={path}
                            fill="#27272a"
                            fillOpacity="0.3"
                            stroke="#6b7280"
                            strokeWidth="0.5"
                        />
                    ))}
                </g>
                
                {stationLocations.map(station => {
                    const stationData = dataMap.get(station.code);
                    if (!stationData) return null;

                    const aqiLevel = AQI_LEVELS[stationData.aqi];
                    let color = '#808080'; // Default gray
                    if (aqiLevel) {
                        const colorMap: Record<string, string> = {
                            'bg-green-500': '#22c55e', 'bg-green-300': '#86efac', 'bg-yellow-400': '#facc15',
                            'bg-red-500': '#ef4444', 'bg-red-700': '#b91c1c', 'bg-purple-800': '#6b21a8'
                        };
                        const colorClass = aqiLevel.color.split(' ')[0];
                        color = colorMap[colorClass] || '#808080';
                    }

                    return (
                        <g key={station.code}>
                            <circle
                                cx={station.x}
                                cy={station.y}
                                r="12"
                                fill={color}
                                fillOpacity="0.3"
                                filter="url(#glow)"
                            />
                            <circle
                                cx={station.x}
                                cy={station.y}
                                r="4"
                                fill={color}
                                stroke="white"
                                strokeWidth="0.5"
                                onMouseOver={(e) => handleMouseOver(e, station)}
                                onMouseOut={handleMouseOut}
                                className="cursor-pointer"
                            />
                        </g>
                    );
                })}
            </svg>

            {tooltip && (
                 <div
                    className="absolute p-2 bg-gray-900/90 text-white text-sm rounded-md pointer-events-none border border-gray-600 shadow-lg"
                    style={{ left: tooltip.x, top: tooltip.y, transform: `translate(-50%, -120%)` }}
                >
                    {tooltip.content}
                </div>
            )}

            <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap max-w-full">
                {AQI_LEVELS.map(level => (
                    <div key={level.label} className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-gray-800/80 backdrop-blur-sm">
                        <span className={`w-2.5 h-2.5 rounded-full block ${level.color}`}></span>
                        <span className="text-gray-300">{level.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};