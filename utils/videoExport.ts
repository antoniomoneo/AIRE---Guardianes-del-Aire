import p5 from 'p5';
import * as Tone from 'tone';
import WebMMuxer from 'webm-muxer';
import type { SonificationOptions, P5SketchFunction, DashboardDataPoint, Pollutant } from '../types';
import { renderSonification } from './sonification';

// Add declarations for WebCodecs API types to prevent TypeScript errors
declare var VideoEncoder: any;
declare var AudioEncoder: any;
declare var VideoFrame: any;
declare var AudioData: any;


interface ExportOptions {
    sonificationOptions: SonificationOptions;
    visualData: DashboardDataPoint[];
    dataByPollutant: Record<Pollutant, DashboardDataPoint[]>;
    sketch: P5SketchFunction;
    onProgress: (progress: number) => void;
    masterLength: number;
}

export const exportToVideo = async (options: ExportOptions): Promise<Blob> => {
    const { sonificationOptions, visualData, dataByPollutant, sketch, onProgress, masterLength } = options;

    if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined') {
        alert('Tu navegador no soporta WebCodecs API, que es necesaria para exportar vídeo. Por favor, utiliza una versión reciente de Chrome, Edge o Opera.');
        throw new Error('WebCodecs API not supported in this browser.');
    }

    // FIX: Define a fixed size for the exported video canvas to resolve undefined variable errors.
    const canvasSize = 800;

    const frameRate = 1 / sonificationOptions.stepDuration;
    const duration = masterLength * sonificationOptions.stepDuration;

    onProgress(1);
    
    // 1. Render Audio using Tone.Offline
    // Clean up any lingering transport schedules before starting offline render.
    Tone.Transport.stop();
    Tone.Transport.cancel();

    const audioBuffer = await Tone.Offline(() => {
        // Schedule all the notes using the same logic as real-time playback
        renderSonification(dataByPollutant, { ...sonificationOptions, masterLength });
        // Start the transport so Tone.Offline can render the scheduled events.
        Tone.Transport.start();
    }, duration);

    // Clean up transport again after offline rendering is complete.
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    onProgress(10);
    
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position: absolute; top: -9999px; left: -9999px;';
    document.body.appendChild(tempContainer);
    
    // 2. Initialize Video Muxer
    const target = new WebMMuxer.ArrayBufferTarget();
    let muxer = new WebMMuxer.Muxer({
        target: target,
        video: { codec: 'V_VP9', width: canvasSize, height: canvasSize, frameRate: frameRate },
        audio: { codec: 'A_OPUS', sampleRate: audioBuffer.sampleRate, numberOfChannels: audioBuffer.numberOfChannels },
    });

    // 3. Setup encoders
    const videoEncoder = new VideoEncoder({
        output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
        error: (e: any) => console.error('VideoEncoder error:', e)
    });
    videoEncoder.configure({
        codec: 'vp09.00.10.08', width: canvasSize, height: canvasSize,
        framerate: frameRate, bitrate: 2_000_000,
    });

    const audioEncoder = new AudioEncoder({
        output: (chunk: any, meta: any) => muxer.addAudioChunk(chunk, meta),
        error: (e: any) => console.error('AudioEncoder error:', e)
    });
    audioEncoder.configure({
        codec: 'opus', sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels, bitrate: 128000,
    });
    
    // 4. Setup Headless p5 instance for rendering frames
    const p5Promise = new Promise<p5>(resolve => {
        const p5Sketch = sketch(visualData, { speed: 1 });
        const wrappedSketch = (p: p5) => {
            p.setup = () => { p.createCanvas(canvasSize, canvasSize); p5Sketch(p).setup(); p.noLoop(); resolve(p); };
            p.draw = () => { p5Sketch(p).draw(); };
        };
        new p5(wrappedSketch, tempContainer);
    });

    const p = await p5Promise;
    onProgress(15);


    // 5. Render video frames and encode
    const canvasElement = tempContainer.querySelector('canvas');
    if (!canvasElement) throw new Error("Canvas element not found for exporting.");

    const totalFrames = masterLength;
    for (let i = 0; i < totalFrames; i++) {
        (p as any).getCurrentFrameIndex = () => i;
        p.redraw();
        
        await new Promise(resolve => requestAnimationFrame(resolve));

        const frame = new VideoFrame(canvasElement, {
            timestamp: i * sonificationOptions.stepDuration * 1_000_000,
        });

        videoEncoder.encode(frame, { keyFrame: i % 60 === 0 });
        frame.close();
        onProgress(15 + (i / totalFrames) * 70);
    }
    
    await videoEncoder.flush();
    onProgress(85);
    
    // 6. Encode audio track
    const allChannelsData = new Float32Array(audioBuffer.length * audioBuffer.numberOfChannels);
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        allChannelsData.set(audioBuffer.getChannelData(channel), channel * audioBuffer.length);
    }
    
    const audioData = new AudioData({
        format: 'f32-planar', sampleRate: audioBuffer.sampleRate,
        numberOfFrames: audioBuffer.length, numberOfChannels: audioBuffer.numberOfChannels,
        timestamp: 0, data: allChannelsData,
    });

    audioEncoder.encode(audioData);
    audioData.close();
    await audioEncoder.flush();
    onProgress(95);

    // 7. Finalize and clean up
    muxer.finalize();
    const buffer = target.buffer;
    p.remove();
    document.body.removeChild(tempContainer);
    onProgress(100);

    return new Blob([buffer], { type: 'video/webm' });
};
