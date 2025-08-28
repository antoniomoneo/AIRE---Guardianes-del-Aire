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

    // Check for WebCodecs support, as it's required for this functionality.
    if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined') {
        alert('Tu navegador no soporta WebCodecs API, que es necesaria para exportar vídeo. Por favor, utiliza una versión reciente de Chrome, Edge o Opera.');
        throw new Error('WebCodecs API not supported in this browser.');
    }

    const frameRate = 1 / sonificationOptions.stepDuration;
    const totalFrames = masterLength;
    const duration = totalFrames * sonificationOptions.stepDuration;

    // 1. Render Audio using Tone.Offline
    onProgress(1);
    const audioBuffer = await Tone.Offline(async () => {
        renderSonification(dataByPollutant, { ...sonificationOptions, masterLength });
        Tone.Transport.start();
    }, duration);
    onProgress(10);
    
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position: absolute; top: -9999px; left: -9999px;';
    document.body.appendChild(tempContainer);
    
    const canvasSize = 500;

    // 2. Initialize Video Muxer
    const target = new WebMMuxer.ArrayBufferTarget();
    let muxer = new WebMMuxer.Muxer({
        target: target,
        video: {
            codec: 'V_VP9',
            width: canvasSize,
            height: canvasSize,
            frameRate: frameRate
        },
        audio: {
            codec: 'A_OPUS',
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels
        },
    });

    // 3. Setup encoders
    const videoEncoder = new VideoEncoder({
        output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
        error: (e: any) => console.error('VideoEncoder error:', e)
    });
    videoEncoder.configure({
        codec: 'vp09.00.10.08', // VP9, profile 0, level 1.0, 8-bit color
        width: canvasSize,
        height: canvasSize,
        framerate: frameRate,
        bitrate: 2_000_000, // 2 Mbps
    });

    const audioEncoder = new AudioEncoder({
        output: (chunk: any, meta: any) => muxer.addAudioChunk(chunk, meta),
        error: (e: any) => console.error('AudioEncoder error:', e)
    });
    audioEncoder.configure({
        codec: 'opus',
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        bitrate: 128000, // 128 kbps
    });
    
    // 4. Setup Headless p5 instance for rendering frames
    let p5Instance: p5 | null = null;
    const p5Promise = new Promise<p5>(resolve => {
        const p5Sketch = sketch(visualData, { speed: 1 });
        const wrappedSketch = (p: p5) => {
            const userSetup = p5Sketch(p).setup;
            p.setup = () => {
                p.createCanvas(canvasSize, canvasSize);
                if (userSetup) userSetup();
                p.noLoop();
                resolve(p);
            };
             p.draw = () => {
                p5Sketch(p).draw();
             };
        };
        p5Instance = new p5(wrappedSketch, tempContainer);
    });

    const p = await p5Promise;
    onProgress(15);


    // 5. Render video frames and encode
    const canvasElement = tempContainer.querySelector('canvas');
    if (!canvasElement) throw new Error("Canvas element not found for exporting.");

    const keyFrameInterval = Math.floor(frameRate * 10); // Insert a keyframe every 10 seconds

    for (let i = 0; i < totalFrames; i++) {
        (p as any).getCurrentFrameIndex = () => i;
        p.redraw();
        
        // Yield to allow canvas to update before creating the frame
        await new Promise(resolve => requestAnimationFrame(resolve));

        const frame = new VideoFrame(canvasElement, {
            timestamp: i * sonificationOptions.stepDuration * 1_000_000, // timestamp in microseconds
            duration: sonificationOptions.stepDuration * 1_000_000
        });

        const encodeOptions = {
            keyFrame: i % keyFrameInterval === 0
        };

        videoEncoder.encode(frame, encodeOptions);
        frame.close();

        onProgress(15 + (i / totalFrames) * 70);
    }
    
    await videoEncoder.flush();
    onProgress(85);
    
    // 6. Encode audio track
    // For planar audio, the data for each channel must be concatenated into a single buffer.
    const totalSamples = audioBuffer.length * audioBuffer.numberOfChannels;
    const allChannelsData = new Float32Array(totalSamples);
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        allChannelsData.set(audioBuffer.getChannelData(channel), channel * audioBuffer.length);
    }
    
    const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate: audioBuffer.sampleRate,
        numberOfFrames: audioBuffer.length,
        numberOfChannels: audioBuffer.numberOfChannels,
        timestamp: 0,
        data: allChannelsData,
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