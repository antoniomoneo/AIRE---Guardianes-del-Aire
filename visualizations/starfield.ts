import type p5 from 'p5';
import type { DashboardDataPoint, VisualizationSketchOptions } from '../types';

class Star {
    x: number; y: number; z: number; pz: number; p: p5;
    constructor(p: p5) {
        this.p = p; this.x = p.random(-p.width, p.width);
        this.y = p.random(-p.height, p.height); this.z = p.random(p.width);
        this.pz = this.z;
    }
    update(speed: number) {
        this.z -= speed;
        if (this.z < 1) {
            this.z = this.p.width; this.x = this.p.random(-this.p.width, this.p.width);
            this.y = this.p.random(-this.p.height, this.p.height); this.pz = this.z;
        }
    }
    show(brightness: number) {
        this.p.fill(brightness); this.p.noStroke();
        const sx = this.p.map(this.x / this.z, 0, 1, 0, this.p.width);
        const sy = this.p.map(this.y / this.z, 0, 1, 0, this.p.height);
        const r = this.p.map(this.z, 0, this.p.width, 4, 0);
        this.p.ellipse(sx, sy, r, r);
    }
}

export const starfieldSketch = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => (p: p5) => {
    const values = data.map(d => d.value);
    const minVal = Math.min(...values); const maxVal = Math.max(...values);
    const stars: Star[] = [];
    const isDataFlat = minVal === maxVal;

    return {
        setup: () => {
            // Canvas creation is now handled by the main component
            for (let i = 0; i < 400; i++) stars.push(new Star(p));
        },
        draw: () => {
            const frame = (p as any).getCurrentFrameIndex?.() || 0;
            p.background(0);
            p.translate(p.width / 2, p.height / 2);
            
            if (data.length === 0) return;
            const record = data[frame];
            if(!record) return;

            const value = record.value;
            const starSpeed = isDataFlat ? 4 : p.map(value, minVal, maxVal, 1, 10);
            const starBrightness = isDataFlat ? 200 : p.map(value, minVal, maxVal, 255, 50);
            const hazeOpacity = isDataFlat ? 50 : p.map(value, minVal, maxVal, 0, 150);

            for (const star of stars) { star.update(starSpeed); star.show(starBrightness); }
            
            p.resetMatrix();
            p.fill(100, 90, 80, hazeOpacity);
            p.rect(0, 0, p.width, p.height);
        }
    };
};
