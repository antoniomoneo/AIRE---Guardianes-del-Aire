import type p5 from 'p5';
import type { DashboardDataPoint, VisualizationSketchOptions } from '../types';

export const geometricSpiralSketch = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => (p: p5) => {
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
            p.translate(p.width / 2, p.height / 2);

            if (data.length === 0) return;

            for (let i = 0; i < totalFrames; i++) {
                if (i > currentFrame) break;
                const record = data[i];
                if(!record) continue;

                const value = record.value;
                const angle = i * 0.1;
                const radius = 10 + i * (p.width / (totalFrames * 2.5));
                const x = radius * p.cos(angle);
                const y = radius * p.sin(angle);
                
                const hue = isDataFlat ? 120 : p.map(value, minVal, maxVal, 180, 0);
                const size = isDataFlat ? 5 : p.map(value, minVal, maxVal, 2, 10);
                
                p.fill(hue, 90, 90);
                p.ellipse(x, y, size, size);
            }
        }
    };
};
