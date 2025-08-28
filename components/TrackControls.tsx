import React from 'react';
import type { TrackOptions, Pollutant, Instrument, Rhythm, DashboardDataPoint } from '../types';
import { Pollutant as PollutantEnum } from '../types';
import { POLLUTANT_NAMES } from '../constants';

interface TrackControlsProps {
    trackOptions: TrackOptions;
    onUpdate: (options: Partial<TrackOptions>) => void;
    onRemove: () => void;
    allPollutantData: Record<Pollutant, DashboardDataPoint[]>;
}

export const TrackControls: React.FC<TrackControlsProps> = ({ trackOptions, onUpdate, onRemove, allPollutantData }) => {
    const { pollutant, instrument, octave, rhythm, filterRange, volume, isMuted } = trackOptions;
    
    const currentPollutantData = allPollutantData[pollutant];
    const minVal = currentPollutantData?.length > 0 ? Math.floor(Math.min(...currentPollutantData.map(d => d.value))) : 0;
    const maxVal = currentPollutantData?.length > 0 ? Math.ceil(Math.max(...currentPollutantData.map(d => d.value))) : 100;
    
    const handleFilterChange = (type: 'min' | 'max', value: number) => {
        const newRange = { ...filterRange };
        if (type === 'min') {
            newRange.min = Math.min(value, filterRange.max);
        } else {
            newRange.max = Math.max(value, filterRange.min);
        }
        onUpdate({ filterRange: newRange });
    };

    const isMelodic = instrument !== 'rhythmicKit';

    return (
        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 space-y-3">
            <div className="flex justify-between items-center">
                <select value={pollutant} onChange={e => onUpdate({ pollutant: e.target.value as Pollutant })} className="w-full p-1 bg-gray-700 border border-gray-600 rounded-md text-sm truncate focus:ring-green-400">
                    {Object.values(PollutantEnum).map(p => (<option key={p} value={p}>{POLLUTANT_NAMES[p]}</option>))}
                </select>
                <div className="flex items-center ml-2">
                     <button onClick={() => onUpdate({ isMuted: !isMuted })} className={`p-1 rounded-full ${isMuted ? 'bg-gray-600' : 'bg-green-500/50'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{isMuted ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707a1 1 0 011.414 0v17.414a1 1 0 01-1.414 0L5.586 15z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707a1 1 0 011.414 0v17.414a1 1 0 01-1.414 0L5.586 15z" />}</svg>
                     </button>
                    <button onClick={onRemove} className="p-1 text-gray-500 hover:text-red-400 ml-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
            
            <div className={`grid gap-2 ${isMelodic ? 'grid-cols-3' : 'grid-cols-1'}`}>
                <select value={instrument} onChange={e => onUpdate({ instrument: e.target.value as Instrument })} className="w-full p-1 bg-gray-700 border border-gray-600 rounded-md text-xs truncate">
                    <option value="synthPad">Synth Pad</option>
                    <option value="crystalPluck">Crystal Pluck</option>
                    <option value="rhythmicKit">Rhythmic Kit</option>
                </select>
                {isMelodic && (
                    <>
                        <select value={rhythm} onChange={e => onUpdate({ rhythm: e.target.value as Rhythm })} className="w-full p-1 bg-gray-700 border border-gray-600 rounded-md text-xs truncate">
                            <option value="sustained">Sostenido</option>
                            <option value="arpUp">Arp. Asc</option>
                            <option value="arpDown">Arp. Desc</option>
                        </select>
                        <select value={octave} onChange={e => onUpdate({ octave: parseInt(e.target.value) })} className="w-full p-1 bg-gray-700 border border-gray-600 rounded-md text-xs truncate">
                            <option value="3">Grave</option>
                            <option value="4">Media</option>
                            <option value="5">Aguda</option>
                        </select>
                    </>
                )}
            </div>

            <div>
                 <label className="font-bold text-gray-500 text-xs">Volumen</label>
                 <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => onUpdate({ volume: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"/>
            </div>
            
             <div>
                 <label className="font-bold text-gray-500 text-xs">Filtro de Valores ({filterRange.min.toFixed(0)} - {filterRange.max.toFixed(0)})</label>
                 <div className="flex items-center space-x-2">
                    <input type="range" min={minVal} max={maxVal} step={1} value={filterRange.min} onChange={e => handleFilterChange('min', parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"/>
                    <input type="range" min={minVal} max={maxVal} step={1} value={filterRange.max} onChange={e => handleFilterChange('max', parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"/>
                 </div>
            </div>

        </div>
    );
};