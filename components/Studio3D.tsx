

import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { AirQualityRecord, DashboardDataPoint, Pollutant, Visualization3DOption } from '../types';
import { Pollutant as PollutantEnum } from '../types';
import { POLLUTANT_NAMES } from '../constants';
import { terrainGenerator } from '../visualizations3d/terrainGenerator';
import { spikesGenerator } from '../visualizations3d/spikesGenerator';
import { ringsGenerator } from '../visualizations3d/ringsGenerator';
import { PublishModal } from './PublishModal';
import { addGalleryItem } from '../utils/galleryService';
import { awardPoints } from '../utils/scoringService';


interface Studio3DProps {
    data: AirQualityRecord[];
    onClose: () => void;
    userName: string;
}

const VIZ_OPTIONS: Visualization3DOption[] = [
    { id: 'terrain', name: 'Terreno 3D', generator: terrainGenerator },
    { id: 'spikes', name: 'Picos de Datos', generator: spikesGenerator },
    { id: 'rings', name: 'Anillos Temporales', generator: ringsGenerator },
];

const MIN_YEAR = 2001;
const MAX_YEAR = 2024;

export const Studio3D: React.FC<Studio3DProps> = ({ data, onClose, userName }) => {
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    const [selectedPollutant, setSelectedPollutant] = useState<Pollutant>(PollutantEnum.NO2);
    const [startYear, setStartYear] = useState(2015);
    const [endYear, setEndYear] = useState(MAX_YEAR);
    const [selectedVizId, setSelectedVizId] = useState<string>(VIZ_OPTIONS[0].id);
    const [heightMultiplier, setHeightMultiplier] = useState(1);
    const [colorScheme, setColorScheme] = useState<'pollutant' | 'terrain'>('pollutant');

    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const processedData = useMemo<DashboardDataPoint[]>(() => {
        const filteredByYear = data.filter(d => d.ANO >= startYear && d.ANO <= endYear);
        const pollutantKey = selectedPollutant as keyof AirQualityRecord;
        const monthlyData = filteredByYear.reduce((acc, curr) => {
            const value = curr[pollutantKey] as number | null;
            if (value !== null && !isNaN(value)) {
                const dateKey = `${curr.ANO}-${String(curr.MES).padStart(2, '0')}`;
                if (!acc[dateKey]) acc[dateKey] = { sum: 0, count: 0 };
                acc[dateKey].sum += value;
                acc[dateKey].count++;
            }
            return acc;
        }, {} as Record<string, { sum: number; count: number }>);
        return Object.entries(monthlyData).map(([date, { sum, count }]) => ({
            date, value: parseFloat((sum / count).toFixed(2)),
        })).sort((a, b) => a.date.localeCompare(b.date));
    }, [data, startYear, endYear, selectedPollutant]);
    
    // Main Three.js setup effect
    useLayoutEffect(() => {
        if (!canvasContainerRef.current) return;
        
        const container = canvasContainerRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111827);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 50, 80);

        const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        const currentRenderer = renderer; // Capture instance for currency check

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.minDistance = 10;
        controls.maxDistance = 300;
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(50, 50, 50);
        scene.add(directionalLight);

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            // Currency check: stop animation if renderer has been replaced
            if (rendererRef.current !== currentRenderer) {
                cancelAnimationFrame(animationFrameId);
                return;
            }

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            // Currency check: only resize if the renderer and container are still valid
            if (!container || !rendererRef.current || rendererRef.current !== currentRenderer) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            if(container.contains(renderer.domElement)) {
                 container.removeChild(renderer.domElement);
            }
            renderer.dispose();
            rendererRef.current = null;
            if (cleanupRef.current) cleanupRef.current();
        };
    }, []);

    // Effect for updating the visualization when data or options change
    useEffect(() => {
        if (sceneRef.current) {
            if (cleanupRef.current) cleanupRef.current();
            
            const viz = VIZ_OPTIONS.find(v => v.id === selectedVizId);
            if (viz && processedData.length > 0) {
                const options = { heightMultiplier, colorScheme };
                cleanupRef.current = viz.generator(sceneRef.current, processedData, options);
            }
        }
    }, [processedData, selectedVizId, heightMultiplier, colorScheme]);

    const captureImage = () => {
        if (!rendererRef.current) return;
        const dataURL = rendererRef.current.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `aire-madrid-3d-${selectedVizId}.png`;
        link.click();
    };

    const exportGLB = () => {
        const scene = sceneRef.current;
        if (!scene) return;
        const modelGroup = scene.getObjectByName('data_model_group');
        if (!modelGroup) {
            alert("No hay un modelo 3D para exportar.");
            return;
        }

        const exporter = new GLTFExporter();
        exporter.parse(modelGroup, (gltf) => {
            const blob = new Blob([gltf as ArrayBuffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `aire-madrid-3d-${selectedVizId}.glb`;
            link.click();
        }, (error) => {
            console.error('Error al exportar a GLB', error);
            alert("Hubo un error al exportar el modelo.");
        }, { binary: true });
    };

    const handlePublish = (authorName: string) => {
        if (!rendererRef.current) return;
        setIsPublishing(true);
        try {
            const imageDataUrl = rendererRef.current.domElement.toDataURL('image/png');
            const vizName = VIZ_OPTIONS.find(v => v.id === selectedVizId)?.name || 'Modelo 3D';
            const title = `${vizName} de ${POLLUTANT_NAMES[selectedPollutant]}`;

            addGalleryItem({
                type: '3d-model',
                author: authorName,
                title,
                imageDataUrl,
                config: { title, selectedPollutant, selectedVizId, startYear, endYear, heightMultiplier, colorScheme }
            });
            awardPoints(authorName, 100);
            alert('¡Publicado en la galería con éxito! (+100 Puntos)');
            setIsPublishModalOpen(false);
        } catch (error) {
            console.error("Error publishing to gallery:", error);
            alert("Hubo un error al publicar en la galería.");
        } finally {
            setIsPublishing(false);
        }
    };


    return (
        <>
        <div className="fixed inset-0 bg-gray-900 z-40 p-2 sm:p-4" onClick={onClose}>
            <div className="w-full h-full bg-gray-900/90 border border-orange-500/30 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl sm:text-2xl font-orbitron text-orange-300">3D Studio</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 pt-4 overflow-y-auto lg:overflow-y-hidden">
                    <div className="lg:col-span-1 space-y-4 lg:overflow-y-auto lg:pr-2">
                         <div>
                            <label className="font-bold text-gray-400 mb-2 block uppercase tracking-wider text-sm">Contaminante</label>
                            <select value={selectedPollutant} onChange={(e) => setSelectedPollutant(e.target.value as Pollutant)}
                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400">
                            {Object.values(PollutantEnum).map(p => <option key={p} value={p}>{POLLUTANT_NAMES[p]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="font-bold text-gray-400 mb-1 block text-center text-sm">Años: <span className="text-orange-300 font-orbitron">{startYear} - {endYear}</span></label>
                            <div className="flex gap-2">
                                <input type="range" min={MIN_YEAR} max={MAX_YEAR} value={startYear} onChange={e => setStartYear(Math.min(parseInt(e.target.value), endYear))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"/>
                                <input type="range" min={MIN_YEAR} max={MAX_YEAR} value={endYear} onChange={e => setEndYear(Math.max(parseInt(e.target.value), startYear))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"/>
                            </div>
                        </div>
                        <div>
                            <label className="font-bold text-gray-400 mb-2 block uppercase tracking-wider text-sm">Visualización</label>
                            <select value={selectedVizId} onChange={(e) => setSelectedVizId(e.target.value)}
                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400">
                            {VIZ_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="font-bold text-gray-400 mb-1 block uppercase tracking-wider text-sm">Multiplicador Altura: <span className="text-orange-300 font-orbitron">{heightMultiplier.toFixed(1)}x</span></label>
                            <input type="range" min="0.1" max="5" step="0.1" value={heightMultiplier} onChange={e => setHeightMultiplier(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"/>
                        </div>
                         <div>
                            <label className="font-bold text-gray-400 mb-2 block uppercase tracking-wider text-sm">Esquema de Color</label>
                            <select value={colorScheme} onChange={e => setColorScheme(e.target.value as any)}
                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400">
                                <option value="pollutant">Mapa de Calor</option>
                                <option value="terrain">Terreno Natural</option>
                            </select>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-gray-700">
                            <button onClick={captureImage} className="w-full font-bold py-2 px-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all">Capturar Imagen (PNG)</button>
                            <button onClick={exportGLB} className="w-full font-bold py-2 px-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all">Exportar Modelo (GLB)</button>
                             <button onClick={() => setIsPublishModalOpen(true)} className="w-full font-bold py-2 px-4 bg-yellow-600 rounded-lg hover:bg-yellow-500 transition-all">Publicar en Galería</button>
                        </div>
                    </div>
                    <div ref={canvasContainerRef} className="w-full aspect-square lg:aspect-auto lg:h-full lg:col-span-3 bg-gray-900 rounded-lg overflow-hidden">
                        {/* Three.js canvas will mount here */}
                    </div>
                </div>
            </div>
        </div>
        {isPublishModalOpen && (
            <PublishModal
                onClose={() => setIsPublishModalOpen(false)}
                onPublish={handlePublish}
                isPublishing={isPublishing}
                userName={userName}
            />
        )}
        </>
    );
};
