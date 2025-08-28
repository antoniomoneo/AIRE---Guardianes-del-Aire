import type p5 from 'p5';
import type { DashboardDataPoint, VisualizationSketchOptions } from '../types';

class Particle {
    pos: p5.Vector; vel: p5.Vector; acc: p5.Vector; maxSpeed: number; p: p5;
    constructor(p: p5) {
        this.p = p; this.pos = p.createVector(p.random(p.width), p.random(p.height));
        this.vel = p.createVector(0, 0); this.acc = p.createVector(0, 0); this.maxSpeed = 2;
    }
    update() { this.vel.add(this.acc); this.vel.limit(this.maxSpeed); this.pos.add(this.vel); this.acc.mult(0); }
    follow(flowfield: p5.Vector) { this.acc.add(flowfield); }
    edges() {
        if (this.pos.x > this.p.width) { this.pos.x = 0; this.pos.y = this.p.random(this.p.height); }
        if (this.pos.x < 0) { this.pos.x = this.p.width; this.pos.y = this.p.random(this.p.height); }
        if (this.pos.y > this.p.height) { this.pos.y = 0; this.pos.x = this.p.random(this.p.width); }
        if (this.pos.y < 0) { this.pos.y = this.p.height; this.pos.x = this.p.random(this.p.width); }
    }
    show(hue: number) { this.p.stroke(hue, 90, 90, 0.5); this.p.strokeWeight(2); this.p.point(this.pos.x, this.pos.y); }
}

export const particleFlowSketch = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => (p: p5) => {
    const values = data.map(d => d.value);
    const minVal = Math.min(...values); const maxVal = Math.max(...values);
    let particles: Particle[] = [];
    const isDataFlat = minVal === maxVal;

    return {
        setup: () => {
            // Canvas creation is now handled by the main component
            for (let i = 0; i < 200; i++) particles[i] = new Particle(p);
            p.background(0);
        },
        draw: () => {
            const frame = (p as any).getCurrentFrameIndex?.() || 0;
            p.background(0, 25);
            
            if (data.length === 0) return;
            const record = data[frame];
            if (!record) return;
            const value = record.value;
            
            const angle = isDataFlat ? p.PI : p.map(value, minVal, maxVal, 0, p.TWO_PI * 2);
            const flowVector = p5.Vector.fromAngle(angle);
            flowVector.setMag(0.1);

            const hue = isDataFlat ? 120 : p.map(value, minVal, maxVal, 180, 0);
            p.colorMode(p.HSB, 360, 100, 100, 1);
            
            for (let particle of particles) { particle.follow(flowVector); particle.update(); particle.edges(); particle.show(hue); }
        }
    };
};
