import type p5 from 'p5';
import type { DashboardDataPoint, VisualizationSketchOptions } from '../types';

export const dataSpireSketch = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => (p: p5) => {
    const values = data.map(d => d.value);
    const minVal = Math.min(...values); const maxVal = Math.max(...values);
    const totalFrames = data.length;
    const isDataFlat = minVal === maxVal;

    return {
        setup: () => { 
            // Canvas creation is now handled by the main component
            p.colorMode(p.HSB, 360, 100, 100); 
            p.noStroke(); 
        },
        draw: () => {
            const currentFrame = (p as any).getCurrentFrameIndex?.() || 0;
            p.background(0);

            if (data.length === 0) return;
            const segmentHeight = p.height / totalFrames;

            for (let i = 0; i < totalFrames; i++) {
                 if (i > currentFrame) break;
                const record = data[i];
                if(!record) continue;

                const value = record.value;
                const hue = isDataFlat ? 120 : p.map(value, minVal, maxVal, 180, 0);
                const segmentWidth = isDataFlat ? p.width / 2 : p.map(value, minVal, maxVal, 10, p.width);
                
                p.fill(hue, 90, 90);
                p.rect((p.width - segmentWidth) / 2, p.height - (i + 1) * segmentHeight, segmentWidth, segmentHeight);
            }
        }
    };
};
