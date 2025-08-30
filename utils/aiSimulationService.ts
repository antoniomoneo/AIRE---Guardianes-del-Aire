


import { GoogleGenAI, Type } from "@google/genai";
import type { DashboardDataPoint } from '../types';

interface AIScenarioResponse {
    explanation: string;
    simulatedData: DashboardDataPoint[];
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        explanation: {
            type: Type.STRING,
            description: "Una breve explicación (2-3 frases) de la lógica aplicada para generar la simulación, dirigida al usuario final."
        },
        simulatedData: {
            type: Type.ARRAY,
            description: "La serie temporal completa de datos simulados.",
            items: {
                type: Type.OBJECT,
                properties: {
                    date: {
                        type: Type.STRING,
                        description: "El año del dato (ej: '2023')."
                    },
                    value: {
                        type: Type.NUMBER,
                        description: "El valor simulado del contaminante para ese año."
                    }
                },
                required: ["date", "value"]
            }
        }
    },
    required: ["explanation", "simulatedData"]
};


export const generateScenarioWithAI = async (
    userPrompt: string,
    historicalData: DashboardDataPoint[],
    pollutantName: string,
): Promise<AIScenarioResponse> => {
    
    const historicalDataString = JSON.stringify(historicalData);

    const fullPrompt = `
        Eres un científico de datos experto en calidad del aire y modelado de escenarios.
        Tu tarea es generar una simulación de los niveles de ${pollutantName} en Madrid basándote en un escenario hipotético propuesto por el usuario.

        Aquí están los datos históricos reales para ${pollutantName} (formato: [{date: 'año', value: valor}, ...]):
        ${historicalDataString}

        El escenario del usuario es: "${userPrompt}"

        Debes generar una nueva serie temporal COMPLETA que cubra los mismos años que los datos históricos (y extiéndela si el escenario lo requiere, como en proyecciones futuras).
        Modifica los valores a partir del punto de la historia que el escenario del usuario implique, manteniendo los datos anteriores sin cambios. Sé creativo pero plausible en tu simulación.

        Tu respuesta DEBE ser un objeto JSON que se ajuste estrictamente al siguiente esquema. No incluyas nada más en tu respuesta.

        Ejemplo de respuesta esperada:
        Si el usuario pide "qué pasaría si la contaminación se redujera a la mitad a partir de 2022", tu respuesta debería ser un JSON con una clave 'explanation' y una clave 'simulatedData' con la serie temporal completa, donde los valores a partir de 2022 son la mitad de los históricos.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);

        // Basic validation
        if (!parsedResponse.explanation || !Array.isArray(parsedResponse.simulatedData)) {
            throw new Error("La respuesta de la IA no tiene el formato esperado.");
        }

        return parsedResponse as AIScenarioResponse;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            if(error.message.includes('API key not valid')) {
                 throw new Error("La clave de API de Gemini no es válida o no está configurada.");
            }
        }
        throw new Error("No se pudo generar el escenario desde la IA.");
    }
};