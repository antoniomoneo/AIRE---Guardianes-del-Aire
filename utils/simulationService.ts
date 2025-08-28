
import type { DashboardDataPoint } from '../types';

export type ScenarioId = 'NO_CRISIS_2008' | 'NO_MADRID_CENTRAL' | 'NO_PANDEMIC' | 'AMBITIOUS_FUTURE';

export const SCENARIOS: Record<ScenarioId, { name: string; description: string }> = {
    NO_CRISIS_2008: {
        name: 'Sin Crisis de 2008',
        description: 'Simula qué hubiera pasado si la actividad económica y el tráfico no se hubieran reducido, continuando la tendencia de principios de siglo.'
    },
    NO_MADRID_CENTRAL: {
        name: 'Sin Madrid Central',
        description: 'Proyecta los niveles de NO₂ si la Zona de Bajas Emisiones del centro no se hubiera implementado a finales de 2018.'
    },
    NO_PANDEMIC: {
        name: 'Sin Confinamiento COVID-19',
        description: 'Visualiza cómo hubiera sido la contaminación en 2020 sin la drástica caída del tráfico por la pandemia.'
    },
    AMBITIOUS_FUTURE: {
        name: 'Futuro Ambicioso (Post-2024)',
        description: 'Proyecta una reducción acelerada de la contaminación gracias a políticas medioambientales más estrictas en el futuro.'
    }
};

// A simple linear regression to find the trend
const getTrend = (data: { x: number, y: number }[]) => {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: data[0]?.y || 0 };
    const sumX = data.reduce((acc, p) => acc + p.x, 0);
    const sumY = data.reduce((acc, p) => acc + p.y, 0);
    const sumXY = data.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumXX = data.reduce((acc, p) => acc + p.x * p.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
};

export const generateSimulation = (historicalData: DashboardDataPoint[], scenarioId: ScenarioId): DashboardDataPoint[] => {
    const simulation: DashboardDataPoint[] = [];

    switch (scenarioId) {
        case 'NO_CRISIS_2008': {
            const preCrisisData = historicalData.filter(d => parseInt(d.date) < 2008);
            const trendData = preCrisisData.map(d => ({ x: parseInt(d.date), y: d.value }));
            const { slope, intercept } = getTrend(trendData);
            historicalData.forEach(d => {
                const year = parseInt(d.date);
                if (year < 2008) {
                    simulation.push(d);
                } else {
                    const simulatedValue = slope * year + intercept;
                    simulation.push({ date: d.date, value: parseFloat(Math.max(20, simulatedValue).toFixed(2)) });
                }
            });
            break;
        }
        case 'NO_MADRID_CENTRAL': {
             const preMadridCentralData = historicalData.filter(d => parseInt(d.date) < 2019 && parseInt(d.date) >= 2011);
             const trendData = preMadridCentralData.map(d => ({ x: parseInt(d.date), y: d.value }));
             const { slope } = getTrend(trendData);
             const slowerSlope = slope * 0.5;

             historicalData.forEach(d => {
                const year = parseInt(d.date);
                if (year < 2019) {
                    simulation.push(d);
                } else {
                    const lastRealValue = simulation[simulation.length -1].value;
                    const simulatedValue = lastRealValue + slowerSlope;
                    simulation.push({ date: d.date, value: parseFloat(simulatedValue.toFixed(2))});
                }
            });
            break;
        }
        case 'NO_PANDEMIC': {
            const prePandemicValue = historicalData.find(d => d.date === '2019')?.value || 35;
            const prePandemicDecline = prePandemicValue - (historicalData.find(d => d.date === '2018')?.value || prePandemicValue);

            historicalData.forEach(d => {
                const year = parseInt(d.date);
                if (year !== 2020 && year !== 2021) {
                    simulation.push(d);
                } else {
                    const yearsSince = year - 2019;
                    const simulatedValue = prePandemicValue + (prePandemicDecline * yearsSince);
                    simulation.push({ date: d.date, value: parseFloat(simulatedValue.toFixed(2)) });
                }
            });
            break;
        }
        case 'AMBITIOUS_FUTURE': {
            simulation.push(...historicalData);
            const lastValue = historicalData[historicalData.length - 1];
            if (lastValue) {
                let currentYear = parseInt(lastValue.date) + 1;
                let currentValue = lastValue.value;
                for (let i = 0; i < 6; i++) {
                    currentValue *= 0.85; // 15% reduction per year
                    simulation.push({ date: String(currentYear), value: parseFloat(currentValue.toFixed(2)) });
                    currentYear++;
                }
            }
            break;
        }
        default:
            return historicalData;
    }

    return simulation;
};
