import type p5 from 'p5';
import type { DashboardDataPoint, VisualizationSketchOptions } from '../types';

export const waveformSketch = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => (p: p5) => {
    const values = data.map(d => d.value);
    const minVal = Math.min(...values); const maxVal = Math.max(...values);
    const totalFrames = data.length;
    const isDataFlat = minVal === maxVal;

    return {
        setup: () => { 
            // Canvas creation is now handled by the main component
            p.noFill(); 
        },
        draw: () => {
            const frame = (p as any).getCurrentFrameIndex?.() || 0;
            p.background(0);
            
            if (data.length === 0) return;

            p.colorMode(p.HSB, 360, 100, 100);
            p.noFill(); p.strokeWeight(2);
            p.beginShape();
            for (let i = 0; i < totalFrames; i++) {
                if(i > frame) break;
                const record = data[i];
                if(!record) continue;

                const y = isDataFlat ? p.height / 2 : p.map(record.value, minVal, maxVal, p.height * 0.9, p.height * 0.1);
                const hue = isDataFlat ? 120 : p.map(record.value, minVal, maxVal, 180, 0);
                p.stroke(hue, 90, 90);
                p.vertex(p.map(i, 0, totalFrames, 0, p.width), y);
            }
            p.endShape();
        }
    };
};
