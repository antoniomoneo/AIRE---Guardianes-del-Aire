import React, { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import p5 from 'p5';
import { v4 as uuidv4 } from 'uuid';
import * as Tone from 'tone';
import type { AirQualityRecord, DashboardDataPoint, VisualizationOption, TrackOptions, Pollutant, Key, SonificationOptions } from '../types';
import { Pollutant as PollutantEnum } from '../types';
import { POLLUTANT_NAMES } from '../constants';
import { breathingOrbSketch } from '../visualizations/breathingOrb';
import { barGraphSketch } from '../visualizations/barGraph';
import { particleFlowSketch } from '../visualizations/particleFlow';
import { citySmogSketch } from '../visualizations/citySmog';
import { concentricRingsSketch } from '../visualizations/concentricRings';
import { dataSpireSketch } from '../visualizations/dataSpire';
import { waveformSketch } from '../visualizations/waveform';
import { geometricSpiralSketch } from '../visualizations/geometricSpiral';
import { starfieldSketch } from '../visualizations/starfield';
import { glitchMatrixSketch } from '../visualizations/glitchMatrix';
import { TrackControls } from './TrackControls';
import { renderSonification } from '../utils/sonification';
import { exportToVideo } from '../utils/videoExport';
import { PublishModal } from './PublishModal';
import { addGalleryItem } from '../utils/galleryService';
import { awardPoints } from '../utils/scoringService';
import { logoUrl } from '../utils/assets';

interface CreationStudioProps {
  data: AirQualityRecord[];
  onClose: () => void;
  userName: string;
}

const VISUALIZATION_OPTIONS: VisualizationOption[] = [
    { id: 'orb', name: 'Orbe Reactivo', sketch: breathingOrbSketch },
    { id: 'bars', name: 'Barras Dinámicas', sketch: barGraphSketch },
    { id: 'particles', name: 'Flujo de Partículas', sketch: particleFlowSketch },
    { id: 'smog', name: 'Niebla Urbana', sketch: citySmogSketch },
    { id: 'rings', name: 'Anillos de Datos', sketch: concentricRingsSketch },
    { id: 'spire', name: 'Aguja de Contaminación', sketch: dataSpireSketch },
    { id: 'wave', name: 'Forma de Onda', sketch: waveformSketch },
    { id: 'spiral', name: 'Espiral Temporal', sketch: geometricSpiralSketch },
    { id: 'starfield', name: 'Campo de Estrellas', sketch: starfieldSketch },
    { id: 'matrix', name: 'Matrix Contaminada', sketch: glitchMatrixSketch },
];

const MIN_YEAR = 2001;
const MAX_YEAR = 2024;

const DEFAULT_TRACK: Omit<TrackOptions, 'id' | 'pollutant'> = {
    instrument: 'synthPad', octave: 4, rhythm: 'sustained',
    filterRange: { min: 0, max: 100 }, volume: 0.7, isMuted: false,
};

const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};

export const CreationStudio: React.FC<CreationStudioProps> = ({ data, onClose, userName }) => {
  const [startYear, setStartYear] = useState(MIN_YEAR);
  const [endYear, setEndYear] = useState(MAX_YEAR);
  const [title, setTitle] = useState('');

  const [visualPollutant, setVisualPollutant] = useState<Pollutant>(PollutantEnum.NO2);
  const [selectedVizId, setSelectedVizId] = useState<string>(VISUALIZATION_OPTIONS[0].id);
  
  const [tracks, setTracks] = useState<TrackOptions[]>([]);
  const [key, setKey] = useState<Key>('major');
  const [stepDuration, setStepDuration] = useState(0.25);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<{ blob: Blob, url: string } | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const p5InstanceRef = useRef<p5 | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const currentFrameIndexRef = useRef(0);
  const sonifyCleanupRef = useRef<(() => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const sonificationOptions: SonificationOptions = useMemo(() => ({ tracks, key, stepDuration }), [tracks, key, stepDuration]);
  
  useEffect(() => {
    if (tracks.length === 0) addTrack();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        // Final cleanup on component unmount
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        Tone.Transport.stop();
        Tone.Transport.cancel();
        sonifyCleanupRef.current?.();
        sonifyCleanupRef.current = null;
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dataByPollutant = useMemo(() => {
    const filteredByYear = data.filter(d => d.ANO >= startYear && d.ANO <= endYear);
    const result: Record<Pollutant, DashboardDataPoint[]> = {} as any;
    Object.values(PollutantEnum).forEach(p => {
        const pollutantKey = p as keyof AirQualityRecord;
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
        result[p] = Object.entries(monthlyData).map(([date, {sum, count}]) => ({
            date, value: parseFloat((sum / count).toFixed(2)),
        })).sort((a,b) => a.date.localeCompare(b.date));
    });
    return result;
  }, [data, startYear, endYear]);

  const visualData = dataByPollutant[visualPollutant] || [];

  useEffect(() => { setGeneratedVideo(null); }, [dataByPollutant, tracks, key, stepDuration, visualPollutant, selectedVizId, title]);

    useLayoutEffect(() => {
        const viz = VISUALIZATION_OPTIONS.find(v => v.id === selectedVizId);
        const container = canvasWrapperRef.current;
        if (!viz || !container) return;

        // Ensure the canvas never overflows its container
        container.style.overflow = 'hidden';

        let p5Instance: p5;
        const sketchFunc = viz.sketch(visualData, { speed: 1 });
        const wrappedSketch = (p: p5) => {
            (p as any).getCurrentFrameIndex = () => currentFrameIndexRef.current;
            p.setup = () => {
                p.createCanvas(container.clientWidth, container.clientHeight).parent(container);
                sketchFunc(p).setup();
                p.noLoop();
            };
            p.draw = () => { sketchFunc(p).draw(); };
        };

        p5Instance = new p5(wrappedSketch);
        const currentP5Instance = p5Instance;
        p5InstanceRef.current = p5Instance;
        
        let pending = false;
        const handleResize = () => {
            if (pending) return;
            pending = true;
            requestAnimationFrame(() => {
                pending = false;
                if (p5InstanceRef.current === currentP5Instance && container) {
                    const newWidth = container.clientWidth;
                    const newHeight = container.clientHeight;
                    currentP5Instance.resizeCanvas(newWidth, newHeight);
                    currentP5Instance.redraw();
                }
            });
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);
        
        const initialDrawTimeout = setTimeout(() => { p5InstanceRef.current?.redraw(); }, 50);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(initialDrawTimeout);
            currentP5Instance?.remove();

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            // CRITICAL: Full audio cleanup when visualization or data changes
            Tone.Transport.stop();
            Tone.Transport.cancel();
            sonifyCleanupRef.current?.();
            sonifyCleanupRef.current = null;
            setIsPlaying(false);
        };
    }, [selectedVizId, visualData]);


    const addTrack = () => {
        const newTrack: TrackOptions = { ...DEFAULT_TRACK, id: uuidv4(), pollutant: Object.values(PollutantEnum)[tracks.length % Object.values(PollutantEnum).length] };
        setTracks(prev => [...prev, newTrack]);
    };
    const removeTrack = (id: string) => setTracks(prev => prev.filter(t => t.id !== id));
    const updateTrack = (id: string, newOptions: Partial<TrackOptions>) => setTracks(prev => prev.map(t => t.id === id ? { ...t, ...newOptions } : t));
    
    const handlePlay = useCallback(async () => {
        // --- STOP LOGIC ---
        if (isPlaying) {
            setIsPlaying(false);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            Tone.Transport.stop();
            Tone.Transport.cancel();
            sonifyCleanupRef.current?.();
            sonifyCleanupRef.current = null;
            return;
        }

        // --- PLAY LOGIC ---
        // 1. Full cleanup before starting
        Tone.Transport.stop();
        Tone.Transport.cancel();
        sonifyCleanupRef.current?.();
        sonifyCleanupRef.current = null;
        
        if (visualData.length === 0) {
            alert("No hay datos para el rango de años seleccionado.");
            return;
        }

        await Tone.start();

        // 2. Create new sonification and store its cleanup function
        sonifyCleanupRef.current = renderSonification(dataByPollutant, { ...sonificationOptions, masterLength: visualData.length });
        
        // 3. Start playback and animation
        Tone.Transport.start();
        setIsPlaying(true);
        currentFrameIndexRef.current = 0;

        const startedAt = performance.now();
        const total = visualData.length;
        const currentStepDuration = sonificationOptions.stepDuration;

        const tick = () => {
            const elapsedTimeSec = (performance.now() - startedAt) / 1000;
            const newFrameIndex = Math.min(total - 1, Math.floor(elapsedTimeSec / currentStepDuration));

            if (currentFrameIndexRef.current !== newFrameIndex) {
                currentFrameIndexRef.current = newFrameIndex;
                p5InstanceRef.current?.redraw();
            }
            
            if (elapsedTimeSec < total * currentStepDuration) {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else {
                // Playback finished, automatically stop
                setIsPlaying(false);
                Tone.Transport.stop();
                Tone.Transport.cancel();
                sonifyCleanupRef.current?.();
                sonifyCleanupRef.current = null;
            }
        };
        animationFrameRef.current = requestAnimationFrame(tick);

    }, [isPlaying, visualData, dataByPollutant, sonificationOptions]);


  const handleGenerateVideo = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setGeneratedVideo(null);
    try {
      const viz = VISUALIZATION_OPTIONS.find(v => v.id === selectedVizId);
      if (!viz) throw new Error("Visualización no encontrada.");
      const blob = await exportToVideo({ sonificationOptions, visualData, dataByPollutant, sketch: viz.sketch, onProgress: setRenderProgress, masterLength: visualData.length });
      setGeneratedVideo({ blob, url: URL.createObjectURL(blob) });
    } catch (error) {
        console.error("Failed to generate video:", error);
        alert("Hubo un error al generar el vídeo.");
    } finally { setIsRendering(false); }
  };

  const handlePublish = async (authorName: string) => {
    if (!generatedVideo) return;
    setIsPublishing(true);
    try {
        const videoDataUrl = await blobToDataURL(generatedVideo.blob);
        addGalleryItem({
            type: 'audio-viz', author: authorName, title: title || 'Mi Creación Audiovisual', videoDataUrl,
            config: { title, visualPollutant, selectedVizId, startYear, endYear, sonificationOptions }
        });
        awardPoints(authorName, 100);
        alert('¡Publicado en la galería con éxito! (+100 Puntos)');
        setIsPublishModalOpen(false);
    } catch (error) {
        console.error("Error publishing to gallery:", error);
        alert("Hubo un error al publicar en la galería.");
    } finally { setIsPublishing(false); }
  };

  return (
    <>
    <div className="fixed inset-0 bg-gray-900 z-40 flex flex-col p-2 sm:p-4 font-roboto" onClick={onClose}>
        <div 
            className="w-full h-full bg-gray-900/90 border border-purple-500/30 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col relative overflow-y-auto sm:overflow-hidden pb-[env(safe-area-inset-bottom)]" 
            onClick={e => e.stopPropagation()}
            style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
            <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-orbitron text-purple-300">Audio & Viz Studio</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
            </div>
            
            <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0 pt-4 overflow-y-auto lg:overflow-hidden">
                <div className="order-2 lg:order-1 w-full lg:w-[420px] lg:flex-shrink-0 space-y-6 overflow-y-auto pr-2 lg:-mr-2 pb-4 min-h-0 lg:border-r lg:border-gray-700/50" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <section>
                        <h3 className="text-lg font-orbitron text-purple-100 border-b border-purple-500/20 pb-2 mb-4">Controles Visuales</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="font-bold text-gray-400 mb-2 block uppercase tracking-wider text-sm">Título</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mi Creación Audiovisual"
                                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400" />
                            </div>
                            <div>
                                <label className="font-bold text-gray-400 mb-2 block uppercase tracking-wider text-sm">Contaminante Visual</label>
                                <select value={visualPollutant} onChange={(e) => setVisualPollutant(e.target.value as Pollutant)}
                                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400">
                                {Object.values(PollutantEnum).map(p => <option key={p} value={p}>{POLLUTANT_NAMES[p]}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="font-bold text-gray-400 mb-2 block uppercase tracking-wider text-sm">Visualización</label>
                                <select value={selectedVizId} onChange={(e) => setSelectedVizId(e.target.value)}
                                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400">
                                {VISUALIZATION_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-orbitron text-cyan-100 border-b border-cyan-500/20 pb-2 mb-4">Controles Globales</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="font-bold text-gray-400 mb-1 block text-center text-sm">Años: <span className="text-cyan-300 font-orbitron">{startYear} - {endYear}</span></label>
                                <div className="flex gap-2">
                                    <input type="range" min={MIN_YEAR} max={MAX_YEAR} value={startYear} onChange={e => setStartYear(Math.min(parseInt(e.target.value), endYear))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"/>
                                    <input type="range" min={MIN_YEAR} max={MAX_YEAR} value={endYear} onChange={e => setEndYear(Math.max(parseInt(e.target.value), startYear))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"/>
                                </div>
                            </div>
                            <div>
                                <label className="font-bold text-gray-400 mb-1 block uppercase tracking-wider text-sm">Velocidad: <span className="text-green-300 font-orbitron">{(0.5 / stepDuration).toFixed(1)}x</span></label>
                                <input type="range" min="0.1" max="1.0" step="0.05" value={stepDuration} onChange={e => setStepDuration(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500" style={{direction: 'rtl'}}/>
                            </div>
                            <div>
                                <label className="font-bold text-gray-400 mb-1 block uppercase tracking-wider text-sm">Tonalidad</label>
                                <select value={key} onChange={e => setKey(e.target.value as Key)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400">
                                    <option value="major">Mayor (Alegre)</option>
                                    <option value="minor">Menor (Melancólica)</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-orbitron text-green-100 border-b border-green-500/20 pb-2 mb-4">Pistas de Audio</h3>
                        <div className="flex flex-col space-y-2">
                            {tracks.map((track) => (
                                <TrackControls key={track.id} trackOptions={track} onUpdate={(opts) => updateTrack(track.id, opts)} onRemove={() => removeTrack(track.id)} allPollutantData={dataByPollutant}/>
                            ))}
                        </div>
                        <button onClick={addTrack} className="w-full mt-4 font-bold py-2 px-4 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition-all">
                            + Añadir Pista de Audio
                        </button>
                    </section>
                    
                    <div className="pt-4 border-t border-gray-700/50">
                        <section>
                            <h3 className="text-lg font-orbitron text-yellow-100 border-b border-yellow-500/20 pb-2 mb-4">Reproducir y Exportar</h3>
                            <div className="space-y-4">
                                <button onClick={handlePlay} disabled={isRendering || tracks.length === 0 || visualData.length === 0} className="w-full font-bold py-3 px-4 bg-purple-600 rounded-lg hover:bg-purple-500 transition-all disabled:bg-gray-600 text-lg">
                                    {isPlaying ? 'DETENER' : 'REPRODUCIR'}
                                </button>
                                {!generatedVideo ? (
                                    <button onClick={handleGenerateVideo} disabled={isRendering || isPlaying || tracks.length === 0 || visualData.length === 0} className="w-full font-bold py-3 px-4 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition-all disabled:bg-gray-600">
                                        {isRendering ? `Renderizando Vídeo... ${renderProgress.toFixed(0)}%` : 'Generar Vídeo (con Audio)'}
                                    </button>
                                ) : (
                                    <div className="space-y-2 pt-2">
                                        <p className="text-center text-green-400 text-sm">¡Tu vídeo está listo!</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <a href={generatedVideo.url} download={`${title || 'aire-madrid'}.webm`} className="w-full block text-center font-bold py-2 px-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-all text-sm">Descargar Vídeo</a>
                                            <button onClick={() => setIsPublishModalOpen(true)} className="w-full font-bold py-2 px-2 bg-yellow-600 rounded-lg hover:bg-yellow-500 transition-all text-sm">Publicar en Galería</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <div className="order-1 lg:order-2 w-full lg:flex-1 flex flex-col items-center justify-center p-4 min-w-0">
                    <div className="flex items-center justify-start gap-3 px-2 pb-2 w-full">
                        <img src={logoUrl} alt="Tangible Data Logo" className="h-6 w-auto" />
                        <h3 className="text-lg font-orbitron text-purple-200 text-left truncate">{title || 'Mi Creación'}</h3>
                    </div>
                    <div ref={canvasWrapperRef} className="w-full aspect-square bg-black rounded-lg overflow-hidden shadow-lg shadow-purple-500/10">
                    </div>
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