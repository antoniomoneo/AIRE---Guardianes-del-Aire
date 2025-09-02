import type { DashboardDataPoint, SonificationOptions, TrackOptions, Pollutant, Instrument } from '../types';
import { ensureWAFReady, loadPreset, queueNote, stopNodes, instrumentPresets, instrumentNameMap } from './webaudiofont';

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    if (inMin === inMax) return Math.floor((outMin + outMax) / 2);
    const mapped = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return Math.floor(mapped);
};

export interface NoteEvent {
    trackId: string;
    presetName: keyof typeof instrumentPresets;
    midi: number;
    whenSec: number;
    durationSec: number;
    gain: number;
    isDrum: boolean;
}

export const buildNotes = (
    dataByPollutant: Record<Pollutant, DashboardDataPoint[]>,
    options: SonificationOptions & { masterLength: number }
): NoteEvent[] => {
    const notes: NoteEvent[] = [];

    options.tracks.forEach(track => {
        if (track.isMuted) return;

        const data = dataByPollutant[track.pollutant];
        if (!data || data.length === 0) return;

        const values = data.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const scale = options.key === 'major' ? MAJOR_SCALE : MINOR_SCALE;
        
        const presetName = instrumentNameMap[track.instrument];

        for (let i = 0; i < options.masterLength; i++) {
            if (i >= data.length) continue;
            const point = data[i];
            
            if (point.value < track.filterRange.min || point.value > track.filterRange.max) continue;

            const time = i * options.stepDuration;

            if (track.instrument === 'rhythmicKit') {
                const kickThreshold = minVal + (maxVal - minVal) * 0.2;
                const snareThreshold = minVal + (maxVal - minVal) * 0.6;
                if (point.value <= kickThreshold) notes.push({ trackId: track.id, presetName, midi: 36, whenSec: time, durationSec: 0.5, gain: track.volume, isDrum: true }); // Acoustic Bass Drum
                if (point.value > kickThreshold) notes.push({ trackId: track.id, presetName, midi: 42, whenSec: time, durationSec: 0.2, gain: track.volume * 0.5, isDrum: true }); // Closed Hi-Hat
                if (point.value >= snareThreshold) notes.push({ trackId: track.id, presetName, midi: 38, whenSec: time, durationSec: 0.5, gain: track.volume * 0.8, isDrum: true }); // Acoustic Snare
            } else {
                const scaleIndex = mapRange(point.value, minVal, maxVal, 0, scale.length * 2 - 1);
                const baseOctave = 12 * track.octave;
                const noteInScale = scale[scaleIndex % scale.length];
                const noteOctaveOffset = Math.floor(scaleIndex / scale.length) * 12;
                const rootNoteMidi = baseOctave + noteInScale + noteOctaveOffset;

                if (track.rhythm === 'sustained') {
                    notes.push({ trackId: track.id, presetName, midi: rootNoteMidi, whenSec: time, durationSec: options.stepDuration * 0.9, gain: track.volume, isDrum: false });
                } else {
                    const third = rootNoteMidi + (options.key === 'major' ? 4 : 3);
                    const fifth = rootNoteMidi + 7;
                    const arpNotes = track.rhythm === 'arpUp' ? [rootNoteMidi, third, fifth] : [fifth, third, rootNoteMidi];
                    const noteDur = options.stepDuration / 3;
                    arpNotes.forEach((midi, noteIdx) => {
                        notes.push({ trackId: track.id, presetName, midi, whenSec: time + (noteIdx * noteDur), durationSec: noteDur * 0.9, gain: track.volume, isDrum: false });
                    });
                }
            }
        }
    });
    return notes;
};


export async function renderSonificationWAF(
    dataByPollutant: Record<Pollutant, DashboardDataPoint[]>,
    options: SonificationOptions & { masterLength: number }
) {
    const { player, context } = await ensureWAFReady();
    await context.resume();

    const allNotes = buildNotes(dataByPollutant, options);
    
    const requiredPresets = new Set(allNotes.map(n => n.presetName));
    const presetObjects: Partial<Record<keyof typeof instrumentPresets, any>> = {};
    
    for (const presetName of requiredPresets) {
        presetObjects[presetName] = await loadPreset(context, player, presetName);
    }
    
    const scheduledNodes: any[] = [];
    let nextNoteIndex = 0;
    const lookaheadMs = 25.0;
    const scheduleAheadSec = 0.15;
    let schedulerTimer: number | null = null;
    let startTime = context.currentTime + 0.2;

    const schedule = () => {
        while (nextNoteIndex < allNotes.length && allNotes[nextNoteIndex].whenSec < context.currentTime - startTime + scheduleAheadSec) {
            const note = allNotes[nextNoteIndex];
            const preset = presetObjects[note.presetName];
            if (preset) {
                const node = queueNote({
                    context, player, preset, 
                    when: startTime + note.whenSec, 
                    midi: note.midi, 
                    duration: note.durationSec, 
                    gain: note.gain,
                    isDrum: note.isDrum,
                });
                scheduledNodes.push(node);
            }
            nextNoteIndex++;
        }
    };

    schedulerTimer = window.setInterval(schedule, lookaheadMs);

    return {
        stop: () => {
            if (schedulerTimer) clearInterval(schedulerTimer);
            stopNodes(scheduledNodes);
        }
    };
}