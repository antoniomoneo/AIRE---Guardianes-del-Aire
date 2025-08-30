import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import type { StationLocation, StationDailyAverage } from '../types';
import { AQI_LEVELS } from '../utils/realTimeDataUtils';

interface HeatmapProps {
    stationAverages: StationDailyAverage[];
    stationLocations: StationLocation[];
}

const mapStyle = {
    height: '100%',
    width: '100%',
    backgroundColor: '#333', // Dark background for tiles loading
};

export const Heatmap: React.FC<HeatmapProps> = ({ stationAverages, stationLocations }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerRef = useRef<L.LayerGroup | null>(null);

    const dataMap = useMemo(() => {
        const map = new Map<string, StationDailyAverage>();
        stationAverages.forEach(avg => map.set(avg.stationCode, avg));
        return map;
    }, [stationAverages]);

    // Initialize map effect
    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [40.4168, -3.7038],
                zoom: 12,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            mapRef.current = map;
            layerRef.current = L.layerGroup().addTo(map);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update markers effect
    useEffect(() => {
        const layer = layerRef.current;
        const map = mapRef.current;
        if (!layer || !map) return;

        layer.clearLayers();
        if (stationLocations.length === 0) return;

        const bounds = L.latLngBounds([]);

        stationLocations.forEach(station => {
            const stationData = dataMap.get(station.code);
            if (!stationData || typeof station.lat !== 'number' || typeof station.lon !== 'number') return;
            
            const aqiLevel = AQI_LEVELS[stationData.aqi];
            let color = '#9ca3af';

            if (aqiLevel) {
                const colorMap: Record<string, string> = {
                    'bg-green-500': '#22c55e', 'bg-green-300': '#86efac', 'bg-yellow-400': '#facc15',
                    'bg-red-500': '#ef4444', 'bg-red-700': '#b91c1c', 'bg-purple-800': '#6b21a8'
                };
                const colorClass = aqiLevel.color.split(' ')[0];
                color = colorMap[colorClass] || color;
            }
            
            const latLng = L.latLng(station.lat, station.lon);
            bounds.extend(latLng);

            const marker = L.circleMarker(latLng, {
                radius: 8,
                fillColor: color,
                color: '#ffffff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.9
            });

            marker.bindTooltip(`
                <div style="font-weight: bold; margin-bottom: 4px;">${station.name}</div>
                Valor: <b>${stationData.value.toFixed(1)} µg/m³</b>
            `);

            marker.addTo(layer);
        });
        
        if(bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }

    }, [stationAverages, stationLocations, dataMap]);

    return (
        <div className="w-full h-full relative rounded-lg overflow-hidden border border-gray-700">
            <div ref={mapContainerRef} style={mapStyle} />
             <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap max-w-full z-[1000] p-1 bg-gray-900/50 rounded backdrop-blur-sm">
                {AQI_LEVELS.map(level => (
                    <div key={level.label} className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-gray-800/80">
                        <span className={`w-2.5 h-2.5 rounded-full block ${level.color}`}></span>
                        <span className="text-gray-300">{level.label}</span>
                    </div>
                ))}
            </div>
            <div className="absolute bottom-2 right-2 z-[1000] p-1.5 bg-gray-900/50 rounded backdrop-blur-sm">
                <p className="text-gray-300 text-[10px] leading-tight max-w-[200px] text-right">
                    El color representa el Índice de Calidad del Aire (ICA) Europeo, basado en la media diaria del contaminante.
                </p>
            </div>
        </div>
    );
};