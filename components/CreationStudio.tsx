

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import p5 from 'p5';
import * as Tone from 'tone';
import { v4 as uuidv4 } from 'uuid';
import type { AirQualityRecord, DashboardDataPoint, VisualizationOption, TrackOptions, Pollutant, Key, SonificationOptions, Instrument, Rhythm } from '../types';
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
  // Common state
  const [startYear, setStartYear] = useState(MIN_YEAR);
  const [endYear, setEndYear] = useState(MAX_YEAR);
  const [title, setTitle] = useState('');

  // Visual state
  const [visualPollutant, setVisualPollutant] = useState<Pollutant>(PollutantEnum.NO2);
  const [selectedVizId, setSelectedVizId] = useState<string>(VISUALIZATION_OPTIONS[0].id);
  
  // Audio state
  const [tracks, setTracks] = useState<TrackOptions[]>([]);
  const [key, setKey] = useState<Key>('major');
  const [stepDuration, setStepDuration] = useState(0.25);

  // Playback & Export state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<{ blob: Blob, url: string } | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);


  // Refs
  const p5InstanceRef = useRef<p5 | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const currentFrameIndexRef = useRef(0);

  // Add a default track on mount
  useEffect(() => {
    if (tracks.length === 0) addTrack();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        Tone.Transport.stop();
        Tone.Transport.cancel();
    };
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

  // Reset generated video when parameters change
  useEffect(() => { setGeneratedVideo(null); }, [dataByPollutant, tracks, key, stepDuration, visualPollutant, selectedVizId, title]);

    // p5 instance management for responsive canvas
    useEffect(() => {
        if (p5InstanceRef.current) {
            p5InstanceRef.current.remove();
        }

        const viz = VISUALIZATION_OPTIONS.find(v => v.id === selectedVizId);
        if (!viz || !canvasWrapperRef.current) return;

        const sketchFunc = viz.sketch(visualData, { speed: 1 });

        const wrappedSketch = (p: p5) => {
            (p as any).getCurrentFrameIndex = () => currentFrameIndexRef.current;
            
            p.setup = () => {
                const size = canvasWrapperRef.current?.clientWidth || 400;
                p.createCanvas(size, size).parent(canvasWrapperRef.current!);
                sketchFunc(p).setup();
                p.noLoop(); // We control drawing manually
            };

            p.draw = () => {
                sketchFunc(p).draw();
            };

            p.windowResized = () => {
                if (!canvasWrapperRef.current) return;
                const newSize = canvasWrapperRef.current.clientWidth;
                p.resizeCanvas(newSize, newSize);
                 if (!isPlaying) {
                   setTimeout(() => p.redraw(), 0);
                }
            };
        };

        p5InstanceRef.current = new p5(wrappedSketch);
        
        setTimeout(() => p5InstanceRef.current?.redraw(), 50);

        return () => {
            if(p5InstanceRef.current) {
                p5InstanceRef.current.remove();
                p5InstanceRef.current = null;
            }
        };
    }, [selectedVizId, visualData]);


    const addTrack = () => {
        const newTrack: TrackOptions = {
            ...DEFAULT_TRACK,
            id: uuidv4(),
            pollutant: Object.values(PollutantEnum)[tracks.length % Object.values(PollutantEnum).length],
        };
        setTracks(prev => [...prev, newTrack]);
    };
    const removeTrack = (id: string) => setTracks(prev => prev.filter(t => t.id !== id));
    const updateTrack = (id: string, newOptions: Partial<TrackOptions>) => setTracks(prev => prev.map(t => t.id === id ? { ...t, ...newOptions } : t));
    
    const sonificationOptions: SonificationOptions = useMemo(() => ({ tracks, key, stepDuration }), [tracks, key, stepDuration]);

    const handlePlay = useCallback(async () => {
        if (isPlaying) {
            Tone.Transport.stop();
            setIsPlaying(false);
            return;
        }

        if (visualData.length === 0) return;
        await Tone.start();
        
        setIsPlaying(true);
        currentFrameIndexRef.current = 0;

        // Clear previous events
        Tone.Transport.cancel();
        
        renderSonification(dataByPollutant, { ...sonificationOptions, masterLength: visualData.length });
        
        // Schedule visual updates
        const timelineLength = visualData.length;
        for(let i=0; i < timelineLength; i++){
            Tone.Draw.schedule(() => {
                currentFrameIndexRef.current = i;
                if(p5InstanceRef.current) p5InstanceRef.current.redraw();
            }, i * stepDuration);
        }
        
        Tone.Transport.scheduleOnce(() => {
             setIsPlaying(false);
        }, timelineLength * stepDuration);

        Tone.Transport.start();
    }, [isPlaying, dataByPollutant, sonificationOptions, visualData.length]);


  const handleGenerateVideo = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setGeneratedVideo(null);
    try {
      const viz = VISUALIZATION_OPTIONS.find(v => v.id === selectedVizId);
      if (!viz) throw new Error("Visualización no encontrada.");

      const blob = await exportToVideo({
        sonificationOptions,
        visualData,
        dataByPollutant,
        sketch: viz.sketch,
        onProgress: setRenderProgress,
        masterLength: visualData.length
      });

      setGeneratedVideo({ blob, url: URL.createObjectURL(blob) });
    } catch (error) {
        console.error("Failed to generate video:", error);
        alert("Hubo un error al generar el vídeo.");
    } finally {
        setIsRendering(false);
    }
  };

  const handlePublish = async (authorName: string) => {
    if (!generatedVideo) return;
    setIsPublishing(true);
    try {
        const videoDataUrl = await blobToDataURL(generatedVideo.blob);
        addGalleryItem({
            type: 'audio-viz',
            author: authorName,
            title: title || 'Mi Creación Audiovisual',
            videoDataUrl,
            config: {
                title, visualPollutant, selectedVizId, startYear, endYear, sonificationOptions
            }
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
    <div className="fixed inset-0 bg-gray-900 z-40 flex flex-col p-2 sm:p-4" onClick={onClose}>
      <div className="w-full h-full bg-gray-900/90 border border-purple-500/30 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-orbitron text-purple-300">Audio & Viz Studio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
        </div>
        
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 pt-4 overflow-y-auto lg:overflow-y-hidden">
            {/* --- Left Sidebar --- */}
            <div className="lg:col-span-1 space-y-6 lg:overflow-y-auto lg:pr-4 pb-4 lg:border-r lg:border-gray-700/50">
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

            {/* --- Right Main Area --- */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center p-4 min-w-0">
                <div className="flex items-center justify-start gap-3 px-2 pb-2 w-full">
                    <img src={logoUrl} alt="Tangible Data Logo" className="h-6 w-auto" />
                    <h3 className="text-lg font-orbitron text-purple-200 text-left truncate">{title || 'Mi Creación'}</h3>
                </div>
                <div ref={canvasWrapperRef} className="w-full aspect-square bg-black rounded-lg shadow-lg shadow-purple-500/10">
                    {/* P5 Canvas will be mounted here */}
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