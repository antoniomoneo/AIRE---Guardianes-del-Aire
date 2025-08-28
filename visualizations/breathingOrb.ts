import type p5 from 'p5';
import type { DashboardDataPoint, VisualizationSketchOptions } from '../types';

export const breathingOrbSketch = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => (p: p5) => {
    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const isDataFlat = minVal === maxVal;

    return {
        setup: () => {
            // Canvas creation is now handled by the main component
            p.background(0);
            p.noStroke();
        },
        draw: () => {
            const frame = (p as any).getCurrentFrameIndex?.() || 0;
            p.background(0, 15); // Fading effect

            if (data.length === 0) return;
            const record = data[frame];
            if (!record) return;

            const { value, date } = record;

            const radius = isDataFlat ? p.width / 3 : p.map(value, minVal, maxVal, p.width * 0.1, p.width / 2.5);
            const hue = isDataFlat ? 120 : p.map(value, minVal, maxVal, 180, 0); // Cyan (180) to Red (0)

            p.colorMode(p.HSB, 360, 100, 100, 100);

            // Outer glow
            for (let i = 20; i > 0; i--) {
                p.fill(hue, 90, 90, i * 2);
                p.ellipse(p.width / 2, p.height / 2, radius + i * 4, radius + i * 4);
            }

            // Orb
            p.fill(hue, 80, 100);
            p.ellipse(p.width / 2, p.height / 2, radius, radius);

            // Display info
            p.colorMode(p.RGB);
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textFont('Orbitron');
            p.textSize(p.width * 0.06);
            p.text(date, p.width / 2, p.height / 2 - p.width * 0.05);
            p.textSize(p.width * 0.04);
            p.text(`${value.toFixed(2)} µg/m³`, p.width / 2, p.height / 2 + p.width * 0.05);
        }
    }
};
