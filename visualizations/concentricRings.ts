import type p5 from 'p5';
import type { DashboardDataPoint, VisualizationSketchOptions } from '../types';

export const concentricRingsSketch = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => (p: p5) => {
    const values = data.map(d => d.value);
    const minVal = Math.min(...values); const maxVal = Math.max(...values);
    const totalFrames = data.length;
    const isDataFlat = minVal === maxVal;

    return {
        setup: () => { 
            // Canvas creation is now handled by the main component
            p.noFill(); 
            p.strokeWeight(2); 
            p.colorMode(p.HSB, 360, 100, 100); 
        },
        draw: () => {
            const currentFrame = (p as any).getCurrentFrameIndex?.() || 0;
            p.background(0);
            
            if (data.length === 0) return;

            for (let i = 0; i < totalFrames; i++) {
                if (i > currentFrame) break;
                const record = data[i];
                if(!record) continue;

                const value = record.value;
                const hue = isDataFlat ? 120 : p.map(value, minVal, maxVal, 180, 0);
                const diameter = p.map(i, 0, totalFrames, 10, p.width);
                p.stroke(hue, 90, 90);
                p.ellipse(p.width / 2, p.height / 2, diameter, diameter);
            }
        }
    };
};
