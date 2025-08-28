import * as Tone from 'tone';
import type { DashboardDataPoint, SonificationOptions, TrackOptions, Pollutant, Key, Instrument } from '../types';

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    if (inMin === inMax) return Math.floor((outMin + outMax) / 2);
    const mapped = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return Math.floor(mapped);
};

const createSynth = (instrument: Instrument) => {
    switch(instrument) {
        case 'synthPad':
            return new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
                envelope: { attack: 0.4, decay: 0.1, sustain: 0.8, release: 0.7 }
            }).toDestination();
        case 'crystalPluck':
            return new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 8,
                modulationIndex: 2,
                envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.9 },
                modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 }
            }).toDestination();
        default: return null;
    }
};

const createDrumKit = () => {
    const hat = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
    }).toDestination();
    hat.frequency.value = 200;

    return {
        kick: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' } }).toDestination(),
        snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.15 } }).toDestination(),
        hat,
    };
};


export const renderSonification = (
    dataByPollutant: Record<Pollutant, DashboardDataPoint[]>,
    options: SonificationOptions & { masterLength?: number }
) => {
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = (1 / options.stepDuration) * 60;
    
    const synths: (Tone.PolySynth | null)[] = [];
    const drumKit = createDrumKit();

    options.tracks.forEach(track => {
        if (track.isMuted) return;

        const data = dataByPollutant[track.pollutant];
        if (!data || data.length === 0) return;

        const values = data.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const scale = options.key === 'major' ? MAJOR_SCALE : MINOR_SCALE;

        const synth = createSynth(track.instrument);
        if (synth) {
            synths.push(synth);
            const part = new Tone.Part((time, note) => {
                synth.triggerAttackRelease(note.note, note.duration, time, note.velocity);
            }, []).start(0);

            for (let i = 0; i < (options.masterLength || data.length); i++) {
                if (i >= data.length) continue;
                const point = data[i];
                if (point.value >= track.filterRange.min && point.value <= track.filterRange.max) {
                    const scaleIndex = mapRange(point.value, minVal, maxVal, 0, scale.length * 2 - 1);
                    const baseOctave = 12 * track.octave;
                    const noteInScale = scale[scaleIndex % scale.length];
                    const noteOctaveOffset = Math.floor(scaleIndex / scale.length) * 12;
                    const rootNoteMidi = baseOctave + noteInScale + noteOctaveOffset;
                    
                    const rootNoteFreq = Tone.Frequency(rootNoteMidi, 'midi');

                    if(track.rhythm === 'sustained') {
                        part.add(i * options.stepDuration, { note: rootNoteFreq, duration: options.stepDuration * 0.9, velocity: track.volume });
                    } else {
                        const third = Tone.Frequency(rootNoteMidi + (options.key === 'major' ? 4:3), 'midi');
                        const fifth = Tone.Frequency(rootNoteMidi + 7, 'midi');
                        const arpNotes = track.rhythm === 'arpUp' ? [rootNoteFreq, third, fifth] : [fifth, third, rootNoteFreq];
                        const noteDur = options.stepDuration / 3;
                        arpNotes.forEach((note, noteIdx) => {
                            part.add(i * options.stepDuration + (noteIdx * noteDur), {note, duration: noteDur * 0.9, velocity: track.volume});
                        });
                    }
                }
            }
        } else if (track.instrument === 'rhythmicKit') {
             for (let i = 0; i < (options.masterLength || data.length); i++) {
                if (i >= data.length) continue;
                const point = data[i];
                 if (point.value >= track.filterRange.min && point.value <= track.filterRange.max) {
                    const kickThreshold = minVal + (maxVal - minVal) * 0.2;
                    const snareThreshold = minVal + (maxVal - minVal) * 0.6;
                    const time = i * options.stepDuration;

                    if (point.value <= kickThreshold) drumKit.kick.triggerAttackRelease('C1', '8n', time, track.volume);
                    if (point.value > kickThreshold) drumKit.hat.triggerAttackRelease('16n', time, track.volume * 0.5);
                    if (point.value >= snareThreshold) drumKit.snare.triggerAttackRelease('8n', time, track.volume * 0.8);
                 }
             }
        }
    });

    return () => { // Cleanup function
        synths.forEach(synth => synth?.dispose());
        drumKit.kick.dispose();
        drumKit.snare.dispose();
        drumKit.hat.dispose();
    };
};