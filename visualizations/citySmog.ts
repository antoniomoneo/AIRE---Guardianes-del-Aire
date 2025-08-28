import type p5 from 'p5';
import type { DashboardDataPoint, VisualizationSketchOptions } from '../types';

export const citySmogSketch = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => (p: p5) => {
    const values = data.map(d => d.value);
    const minVal = Math.min(...values); const maxVal = Math.max(...values);
    const isDataFlat = minVal === maxVal;
    
    const buildings: {x: number, w: number, h: number}[] = [];

    return {
        setup: () => {
            // Canvas creation is now handled by the main component
            p.background(10, 20, 30); 
            p.randomSeed(42);
            for (let i = 0; i < p.width; i += p.random(15, 40)) {
                buildings.push({
                    x: i,
                    w: p.random(10, 30),
                    h: p.random(p.height * 0.1, p.height * 0.4)
                });
            }
        },
        draw: () => {
            const frame = (p as any).getCurrentFrameIndex?.() || 0;
            p.background(10, 20, 30); 
            
            p.fill(30, 40, 50); p.noStroke();
            buildings.forEach(b => {
                p.rect(b.x, p.height - b.h, b.w, b.h);
            });

            if (data.length === 0) return;
            const record = data[frame];
            if (!record) return;

            const { value, date } = record;
            const smogDensity = isDataFlat ? 0.5 : p.map(value, minVal, maxVal, 0.1, 0.9);
            const smogColor = isDataFlat ? 80 : p.map(value, minVal, maxVal, 120, 40);

            p.fill(smogColor, smogColor - 20, smogColor - 40, smogDensity * 200);
            p.rect(0, 0, p.width, p.height);

            p.fill(255); p.textAlign(p.CENTER, p.TOP); p.textFont('Orbitron');
            p.textSize(p.width * 0.04); 
            p.text(`${date}: ${value.toFixed(2)} µg/m³`, p.width / 2, 15);
        }
    };
};
