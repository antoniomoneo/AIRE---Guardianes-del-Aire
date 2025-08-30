

// Pollutant codes used by the Madrid City Council API
export const POLLUTANT_INFO = {
    '8': { name: 'Dióxido de Nitrógeno (NO₂)', code: 'NO2' },
    '9': { name: 'Partículas < 2.5 µm (PM₂.₅)', code: 'PM25' },
    '10': { name: 'Partículas < 10 µm (PM₁₀)', code: 'PM10' },
    '14': { name: 'Ozono (O₃)', code: 'O3' },
};
export type RealTimePollutantCode = keyof typeof POLLUTANT_INFO;

// European Air Quality Index (EAQI) levels and colors
export const AQI_LEVELS = [
    { label: 'Buena', color: 'bg-green-500 text-black' },
    { label: 'Razonable', color: 'bg-green-300 text-black' },
    { label: 'Moderada', color: 'bg-yellow-400 text-black' },
    { label: 'Desfavorable', color: 'bg-red-500 text-white' },
    { label: 'Muy Desfavorable', color: 'bg-red-700 text-white' },
    { label: 'Extremadamente Desfavorable', color: 'bg-purple-800 text-white' },
];

// EAQI breakpoints for each pollutant (in µg/m³)
// Each array corresponds to the upper boundary of an AQI level (index 0 to 5)
const BREAKPOINTS: Record<string, number[]> = {
    'NO2': [40, 90, 120, 230, 340, 1000], 
    'O3':  [50, 100, 130, 240, 380, 800],
    'PM10': [20, 40, 50, 100, 150, 1200],
    'PM25': [10, 20, 25, 50, 75, 800],
};


/**
 * Calculates the Air Quality Index (AQI) level index for a given pollutant and its value.
 * @param pollutantCode The code of the pollutant ('8', '9', '10', '14').
 * @param value The measured concentration in µg/m³.
 * @returns The AQI level index (0-5), where 0 is 'Good' and 5 is 'Extremely Poor'.
 */
export const calculateAQI = (pollutantCode: RealTimePollutantCode, value: number): number => {
    const pollutantInfo = POLLUTANT_INFO[pollutantCode];
    if (!pollutantInfo) return 0;
    
    const pollutantBreakpoints = BREAKPOINTS[pollutantInfo.code];
    if (!pollutantBreakpoints) return 0;

    for (let i = 0; i < pollutantBreakpoints.length; i++) {
        if (value <= pollutantBreakpoints[i]) {
            return i;
        }
    }
    return 5; // If value is higher than the last breakpoint, it's the highest (worst) level
};

/**
 * Determines the overall AQI for a station by finding the worst AQI among all its pollutants.
 * @param pollutants An object with pollutant codes as keys and their values.
 * @returns The AQI level object (label and color) for the station.
 */
export const getOverallAQI = (pollutants: Record<RealTimePollutantCode, number>) => {
    let worstAqiIndex = -1;
    for (const [code, value] of Object.entries(pollutants)) {
        const aqiIndex = calculateAQI(code as RealTimePollutantCode, value);
        if (aqiIndex > worstAqiIndex) {
            worstAqiIndex = aqiIndex;
        }
    }

    if(worstAqiIndex === -1) return AQI_LEVELS[0];
    return AQI_LEVELS[worstAqiIndex];
};