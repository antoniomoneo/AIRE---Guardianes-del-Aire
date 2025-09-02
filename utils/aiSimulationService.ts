import type { DashboardDataPoint } from '../types';

interface AIScenarioResponse {
    explanation: string;
    simulatedData: DashboardDataPoint[];
}

// The schema is now a plain JSON object, as it will be sent to the backend.
const responseSchema = {
    type: 'OBJECT',
    properties: {
        explanation: {
            type: 'STRING',
            description: "Una breve explicación (2-3 frases) de la lógica aplicada para generar la simulación, dirigida al usuario final."
        },
        simulatedData: {
            type: 'ARRAY',
            description: "La serie temporal completa de datos simulados.",
            items: {
                type: 'OBJECT',
                properties: {
                    date: {
                        type: 'STRING',
                        description: "El año del dato (ej: '2023')."
                    },
                    value: {
                        type: 'NUMBER',
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
        const response = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema,
                },
            }),
        });
        
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Error del servidor (${response.status}): ${errorBody}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('La respuesta del servidor no es un JSON válido.');
        }

        const backendResponse = await response.json();
        
        // The model output is a stringified JSON inside the backend response
        const modelOutputText = backendResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!modelOutputText || typeof modelOutputText !== 'string') {
            throw new Error("La respuesta de la IA está vacía o tiene un formato incorrecto.");
        }
        
        // Parse the stringified JSON from the model
        const parsedResponse = JSON.parse(modelOutputText);
        
        // Basic validation of the final object
        if (!parsedResponse.explanation || !Array.isArray(parsedResponse.simulatedData)) {
            throw new Error("Los datos de la simulación de la IA no tienen el formato esperado (faltan 'explanation' o 'simulatedData').");
        }

        return parsedResponse as AIScenarioResponse;

    } catch (error) {
        console.error("Error al generar el escenario con IA:", error);
        if (error instanceof Error) {
            throw new Error(`No se pudo generar el escenario: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido al generar el escenario con la IA.");
    }
};