import type p5 from 'p5';
import type { DashboardDataPoint, VisualizationSketchOptions } from '../types';

class Symbol {
    x: number; y: number; value!: string; speed: number; p: p5;
    constructor(x: number, y: number, speed: number, p: p5) {
        this.x = x; this.y = y; this.speed = speed; this.p = p; this.setToRandomSymbol();
    }
    setToRandomSymbol() {
        const charType = this.p.random(100);
        if (charType > 60) this.value = String.fromCharCode(0x30A0 + this.p.round(this.p.random(0, 96)));
        else if (charType > 30) this.value = this.p.round(this.p.random(0,9)).toString();
        else this.value = String.fromCharCode(0x0041 + this.p.round(this.p.random(0, 25)));
    }
    rain() { this.y = (this.y >= this.p.height) ? 0 : this.y += this.speed; }
}

class Stream {
    symbols: Symbol[] = []; totalSymbols: number; speed: number; p: p5;
    constructor(x: number, p: p5) {
        this.p = p; this.speed = p.random(2, 8); this.totalSymbols = p.round(p.random(5, 30));
        let y = p.random(-500, 0);
        for (let i = 0; i < this.totalSymbols; i++) {
            this.symbols.push(new Symbol(x, y, this.speed, p)); y -= 20;
        }
    }
    render(hue: number, glitch: number) {
        this.symbols.forEach((symbol, i) => {
            const isGlitching = this.p.random(100) < glitch;
            if(isGlitching) { this.p.fill(this.p.random(360), 100, 100); symbol.setToRandomSymbol(); } 
            else { this.p.fill(hue, 90, i === this.symbols.length - 1 ? 100: 80); }
            this.p.text(symbol.value, symbol.x, symbol.y);
            symbol.rain();
            if (this.p.random(100) < 30) symbol.setToRandomSymbol();
        });
    }
}

export const glitchMatrixSketch = (data: DashboardDataPoint[], options: VisualizationSketchOptions) => (p: p5) => {
    const values = data.map(d => d.value);
    const minVal = Math.min(...values); const maxVal = Math.max(...values);
    const streams: Stream[] = [];
    const isDataFlat = minVal === maxVal;
    let symbolSize = 20;

    return {
        setup: () => {
            // Canvas creation is now handled by the main component
            symbolSize = p.width / 25; // Make symbol size responsive
            for (let i = 0; i <= p.width / symbolSize; i++) streams.push(new Stream(i * symbolSize, p));
            p.textSize(symbolSize); p.textFont('monospace'); p.colorMode(p.HSB, 360, 100, 100);
        },
        draw: () => {
            const frame = (p as any).getCurrentFrameIndex?.() || 0;
            p.background(0, 0.1 * 255);
            
            if (data.length === 0) return;
            const record = data[frame];
            if(!record) return;

            const value = record.value;
            const hue = isDataFlat ? 120 : p.map(value, minVal, maxVal, 120, 0);
            const glitchFactor = isDataFlat ? 2 : p.map(value, minVal, maxVal, 0, 15);

            streams.forEach(stream => {
                stream.speed = isDataFlat ? 4 : p.map(value, minVal, maxVal, 2, 10);
                stream.render(hue, glitchFactor);
            });
        }
    };
};
