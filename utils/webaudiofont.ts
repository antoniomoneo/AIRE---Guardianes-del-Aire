// utils/webaudiofont.ts
import type { Instrument } from '../types';

declare global {
    interface Window {
        WebAudioFontPlayer?: any;
        [k: string]: any;
    }
}

async function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Falló la carga del script: ${src}`));
        document.head.appendChild(script);
    });
}

export async function ensureWAFReady(): Promise<{ player: any; context: AudioContext }> {
    if (typeof window.WebAudioFontPlayer === 'undefined') {
        const scriptCandidates = [
            '/vendor/WebAudioFontPlayer.js', // 1. Local copy
            'https://surikov.github.io/webaudiofont/scripts/WebAudioFontPlayer.js', // 2. Author's CDN
            'https://surikov.github.io/webaudiofont/webaudiofont.compressed.js', // 3. Fallback
        ];
        let loaded = false;
        for (const url of scriptCandidates) {
            try {
                await loadScript(url);
                if (typeof window.WebAudioFontPlayer !== 'undefined') {
                    loaded = true;
                    break;
                }
            } catch (error) {
                console.warn(`WAF load failed from ${url}`, error);
            }
        }
        if (!loaded) {
            throw new Error('WebAudioFontPlayer no disponible');
        }
    }
    
    if (!(window as any).__WAF_CTX__) {
        (window as any).__WAF_CTX__ = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const context = (window as any).__WAF_CTX__;

    return { player: new window.WebAudioFontPlayer(), context };
}

export async function tryResume(ctx: AudioContext) {
    if (ctx.state !== 'running') {
        await ctx.resume();
    }
}

export const instrumentPresets: Record<Instrument | 'pad1' | 'marimba' | 'drumkit', { url: string; globalName: string }> = {
    piano: { url: 'https://surikov.github.io/webaudiofontdata/sound/0000_JCLive_sf2_file.js', globalName: '_tone_0000_JCLive_sf2_file' },
    marimba: { url: 'https://surikov.github.io/webaudiofontdata/sound/0120_Chaos_sf2_file.js', globalName: '_tone_0120_Chaos_sf2_file' },
    strings: { url: 'https://surikov.github.io/webaudiofontdata/sound/0048_Chaos_sf2_file.js', globalName: '_tone_0048_Chaos_sf2_file' },
    pad1: { url: 'https://surikov.github.io/webaudiofontdata/sound/0089_Chaos_sf2_file.js', globalName: '_tone_0089_Chaos_sf2_file' },
    flute: { url: 'https://surikov.github.io/webaudiofontdata/sound/0073_Chaos_sf2_file.js', globalName: '_tone_0073_Chaos_sf2_file' },
    drumkit: { url: 'https://surikov.github.io/webaudiofontdata/sound/12835_Chaos_sf2_file.js', globalName: '_tone_12835_Chaos_sf2_file' },
    synthPad: { url: 'https://surikov.github.io/webaudiofontdata/sound/0089_Chaos_sf2_file.js', globalName: '_tone_0089_Chaos_sf2_file' },
    crystalPluck: { url: 'https://surikov.github.io/webaudiofontdata/sound/0120_Chaos_sf2_file.js', globalName: '_tone_0120_Chaos_sf2_file' },
    rhythmicKit: { url: 'https://surikov.github.io/webaudiofontdata/sound/12835_Chaos_sf2_file.js', globalName: '_tone_12835_Chaos_sf2_file' },
};

export const instrumentNameMap: Record<Instrument, keyof typeof instrumentPresets> = {
    synthPad: 'pad1',
    crystalPluck: 'marimba',
    rhythmicKit: 'drumkit',
    piano: 'piano',
    strings: 'strings',
    flute: 'flute',
};

const loadedPresets = new Set<string>();
export async function loadPreset(context: AudioContext, player: any, name: keyof typeof instrumentPresets): Promise<any> {
    const presetInfo = instrumentPresets[name];
    if (!presetInfo) throw new Error(`Preset not found: ${name}`);

    if (!(window as any)[presetInfo.globalName]) {
        await loadScript(presetInfo.url);
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
    if (isDrum) {
        return player.queueWaveTable(context, dest, preset, when, midi, duration, gain, 9);
    }
    return player.queueWaveTable(context, dest, preset, when, midi, duration, gain);
}

export function stopNodes(nodes: any[]) {
    nodes.forEach(node => {
        try {
            if (node) node.stop(0);
        } catch (e) {
            // Ignore if node is already stopped
        }
    });
}
