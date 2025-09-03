import * as Tone from 'tone';
import type { DashboardDataPoint, SonificationOptions, Instrument, Pollutant } from '../types';

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    if (inMin === inMax) return Math.floor((outMin + outMax) / 2);
    const mapped = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return Math.floor(mapped);
};

const getToneSynth = (instrument: Instrument): Tone.PolySynth | Tone.Sampler => {
    switch (instrument) {
        case 'synthPad':
            return new Tone.PolySynth({
                maxPolyphony: 16,
                voice: Tone.Synth,
                options: {
                    oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
                    envelope: { attack: 0.4, decay: 0.1, sustain: 0.8, release: 0.4 }
                }
            }).toDestination();
        case 'crystalPluck':
            return new Tone.PolySynth({
                maxPolyphony: 12,
                voice: Tone.FMSynth,
                options: {
                    harmonicity: 8,
                    modulationIndex: 2,
                    envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.5 },
                    modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 }
                }
            }).toDestination();
        case 'piano': 
            return new Tone.Sampler({ urls: { C4: "C4.mp3" }, baseUrl: "https://tonejs.github.io/audio/salamander/" }).toDestination();
        case 'strings': 
            return new Tone.PolySynth({
                voice: Tone.Synth,
                options: {
                    oscillator: { type: 'triangle' },
                    envelope: { attack: 0.5, release: 1 }
                }
            }).toDestination();
        case 'flute': 
            return new Tone.PolySynth({
                voice: Tone.Synth,
                options: {
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.1, release: 0.3 }
                }
            }).toDestination();
        default: 
            return new Tone.PolySynth({ voice: Tone.Synth }).toDestination();
    }
};

export const renderSonification = (
    dataByPollutant: Record<Pollutant, DashboardDataPoint[]>,
    options: SonificationOptions & { masterLength: number }
): () => void => {
    
    // Create all synthesizers and samplers upfront for this sonification instance.
    const synthsByTrackId: Record<string, Tone.PolySynth | Tone.Sampler> = {};
    options.tracks.forEach(track => {
        if (!track.isMuted && track.instrument !== 'rhythmicKit') {
            synthsByTrackId[track.id] = getToneSynth(track.instrument);
        }
    });
    const drumKit = new Tone.Sampler({ urls: { C1: "kick.mp3", C2: "snare.mp3", C3: "hihat.mp3" }, baseUrl: "https://tonejs.github.io/audio/drum-samples/CR78/" }).toDestination();

    const parts: Tone.Part[] = [];

    options.tracks.forEach(track => {
        if (track.isMuted) return;

        const data = dataByPollutant[track.pollutant];
        if (!data || data.length === 0) return;

        const values = data.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const scale = options.key === 'major' ? MAJOR_SCALE : MINOR_SCALE;
        
        const noteEvents = [];

        for (let i = 0; i < options.masterLength; i++) {
            if (i >= data.length) continue;
            const point = data[i];
            
            if (point.value < track.filterRange.min || point.value > track.filterRange.max) continue;

            const time = i * options.stepDuration;

            if (track.instrument === 'rhythmicKit') {
                const kickThreshold = minVal + (maxVal - minVal) * 0.2;
                const snareThreshold = minVal + (maxVal - minVal) * 0.6;
                if (point.value <= kickThreshold) noteEvents.push({ time, pitch: 'C1', duration: '8n', velocity: track.volume });
                if (point.value > kickThreshold) noteEvents.push({ time, pitch: 'C3', duration: '16n', velocity: track.volume * 0.5 });
                if (point.value >= snareThreshold) noteEvents.push({ time, pitch: 'C2', duration: '8n', velocity: track.volume * 0.8 });
            } else {
                const scaleIndex = mapRange(point.value, minVal, maxVal, 0, scale.length * 2 - 1);
                const baseOctave = 12 * track.octave;
                const noteInScale = scale[scaleIndex % scale.length];
                const noteOctaveOffset = Math.floor(scaleIndex / scale.length) * 12;
                const rootNoteMidi = baseOctave + noteInScale + noteOctaveOffset;
                const rootNote = Tone.Frequency(rootNoteMidi, 'midi').toNote();

                if (track.rhythm === 'sustained') {
                    noteEvents.push({ time, pitch: rootNote, duration: options.stepDuration * 0.9, velocity: track.volume });
                } else {
                    const thirdMidi = rootNoteMidi + (options.key === 'major' ? 4 : 3);
                    const fifthMidi = rootNoteMidi + 7;
                    const arpNotes = track.rhythm === 'arpUp' 
                        ? [rootNoteMidi, thirdMidi, fifthMidi] 
                        : [fifthMidi, thirdMidi, rootNoteMidi];
                    
                    const noteDur = options.stepDuration / 3;
                    arpNotes.forEach((midi, noteIdx) => {
                        noteEvents.push({ 
                            time: time + (noteIdx * noteDur), 
                            pitch: Tone.Frequency(midi, 'midi').toNote(), 
                            duration: noteDur * 0.9, 
                            velocity: track.volume 
                        });
                    });
                }
            }
        }
        
        if (noteEvents.length > 0) {
            // In the Part callback, we only reference pre-created instruments.
            const part = new Tone.Part((time, value) => {
                if (track.instrument === 'rhythmicKit') {
                    if (drumKit && !drumKit.disposed) {
                        drumKit.triggerAttackRelease(value.pitch, value.duration, time, value.velocity);
                    }
                } else {
                    const synth = synthsByTrackId[track.id];
                    if (synth && !synth.disposed) {
                       synth.triggerAttackRelease(value.pitch, value.duration, time, value.velocity);
                    }
                }
            }, noteEvents).start(0);
            parts.push(part);
        }
    });

    // The cleanup function now correctly disposes of all pre-created instruments.
    return () => {
        parts.forEach(part => {
            try {
                part.stop(0);
                part.clear();
                part.dispose();
            } catch (e) {
                // Ignore errors if already disposed.
            }
        });

        Object.values(synthsByTrackId).forEach(synth => {
            try {
                if (synth && !synth.disposed) {
                    synth.dispose();
                }
            } catch (e) {
                // Ignore errors.
            }
        });

        try {
            if (drumKit && !drumKit.disposed) {
                drumKit.dispose();
            }
        } catch (e) {
            // Ignore errors.
        }
    };
};