import type p5 from 'p5';
import type { DashboardDataPoint, VisualizationSketchOptions } from '../types';

export const barGraphSketch = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => (p: p5) => {
    const values = data.map(d => d.value);
    let maxVal = Math.max(...values);
    if (maxVal === 0) maxVal = 1;
    
    return {
        setup: () => {
            // Canvas creation is now handled by the main component
            p.background(0);
            p.noStroke();
            p.colorMode(p.HSB, 360, 100, 100);
        },
        draw: () => {
            const currentFrame = (p as any).getCurrentFrameIndex?.() || 0;
            p.background(0);
            
            if (data.length === 0) return;
            const barWidth = p.width / data.length;

            for (let i = 0; i < data.length; i++) {
                if (i > currentFrame) break;

                const record = data[i];
                const value = record.value;

                const barHeight = p.map(value, 0, maxVal, 0, p.height);
                const hue = p.map(value, 0, maxVal, 180, 0); // Cyan to Red

                p.fill(hue, 90, 90);
                p.rect(i * barWidth, p.height - barHeight, barWidth, barHeight);
            }

            const currentRecord = data[currentFrame];
            if (currentRecord) {
                p.colorMode(p.RGB);
                p.fill(255);
                p.textAlign(p.LEFT, p.TOP);
                p.textFont('Orbitron');
                p.textSize(p.width * 0.04);
                p.text(currentRecord.date, 10, 10);
                p.textAlign(p.RIGHT, p.TOP);
                p.text(`${currentRecord.value.toFixed(2)} µg/m³`, p.width - 10, 10);
                p.colorMode(p.HSB, 360, 100, 100);
            }
        }
    };
};
