// utils/webaudiofont.ts
import type { Instrument } from '../types';

// WebAudioFontPlayer declaration to satisfy TypeScript before the script is loaded.
declare var WebAudioFontPlayer: any;
declare var _tone_0000_JCLive_sf2_file: any;
declare var _tone_0120_Chaos_sf2_file: any;
declare var _tone_0048_Chaos_sf2_file: any;
declare var _tone_0089_Chaos_sf2_file: any;
declare var _tone_0073_Chaos_sf2_file: any;
declare var _tone_12835_Chaos_sf2_file: any;

let audioContext: AudioContext | null = null;
let wafPlayer: any | null = null;

const WAF_SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/surikov/webaudiofont@master/webaudiofont.js';

export const instrumentPresets: Record<Instrument | 'pad1' | 'marimba' | 'drumkit', { url: string; globalName: string }> = {
    piano: { url: 'https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/0000_JCLive_sf2_file.js', globalName: '_tone_0000_JCLive_sf2_file' },
    marimba: { url: 'https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/0120_Chaos_sf2_file.js', globalName: '_tone_0120_Chaos_sf2_file' },
    strings: { url: 'https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/0048_Chaos_sf2_file.js', globalName: '_tone_0048_Chaos_sf2_file' },
    pad1: { url: 'https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/0089_Chaos_sf2_file.js', globalName: '_tone_0089_Chaos_sf2_file' },
    flute: { url: 'https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/0073_Chaos_sf2_file.js', globalName: '_tone_0073_Chaos_sf2_file' },
    drumkit: { url: 'https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/12835_Chaos_sf2_file.js', globalName: '_tone_12835_Chaos_sf2_file' },
    // Mappings for old names
    synthPad: { url: 'https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/0089_Chaos_sf2_file.js', globalName: '_tone_0089_Chaos_sf2_file' },
    crystalPluck: { url: 'https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/0120_Chaos_sf2_file.js', globalName: '_tone_0120_Chaos_sf2_file' },
    rhythmicKit: { url: 'https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/12835_Chaos_sf2_file.js', globalName: '_tone_12835_Chaos_sf2_file' },
};

export const instrumentNameMap: Record<Instrument, keyof typeof instrumentPresets> = {
    synthPad: 'pad1',
    crystalPluck: 'marimba',
    rhythmicKit: 'drumkit',
    piano: 'piano',
    strings: 'strings',
    flute: 'flute',
};

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

export function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
}

export async function ensureWAFReady(customContext?: AudioContext): Promise<{ player: any, context: AudioContext }> {
    const context = customContext || getAudioContext();
    if (typeof WebAudioFontPlayer === 'undefined') {
        await loadScript(WAF_SCRIPT_URL);
    }
    const player = customContext ? new WebAudioFontPlayer() : (wafPlayer || (wafPlayer = new WebAudioFontPlayer()));
    return { player, context };
}

const loadedPresets = new Set<string>();
export async function loadPreset(context: AudioContext, player: any, name: keyof typeof instrumentPresets): Promise<any> {
    const presetInfo = instrumentPresets[name];
    if (!presetInfo) throw new Error(`Preset not found: ${name}`);

    if (!loadedPresets.has(presetInfo.url)) {
        await loadScript(presetInfo.url);
        loadedPresets.add(presetInfo.url);
    }
    
    const preset = (window as any)[presetInfo.globalName];
    if (!preset) throw new Error(`Preset global variable not found: ${presetInfo.globalName}`);

    player.loader.decodeAfterLoading(context, presetInfo.globalName);
    return preset;
}

interface QueueNoteParams {
    context: AudioContext;
    player: any;
    preset: any;
    when: number;
    midi: number;
    duration: number;
    gain: number;
    destination?: AudioNode;
    isDrum?: boolean;
}

export function queueNote({ context, player, preset, when, midi, duration, gain, destination, isDrum = false }: QueueNoteParams) {
    const dest = destination || context.destination;
    // For drums, the channel is 10 (MIDI standard) and the "pitch" is the drum sound.
    // For melodic instruments, channel is 0 and pitch is the MIDI note.
    if (isDrum) {
        return player.queueWaveTable(context, dest, preset, when, midi, duration, gain, 9);
    }
    return player.queueWaveTable(context, dest, preset, when, midi, duration, gain);
}

export function stopNodes(nodes: any[]) {
    nodes.forEach(node => {
        try {
            if (node) {
                node.stop(0);
            }
        } catch (e) {
            // Ignore errors if node is already stopped
        }
    });
}