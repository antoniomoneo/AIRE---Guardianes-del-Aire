
// utils/ttsService.ts

/**
 * Cancels any ongoing speech from the browser's Speech Synthesis API.
 */
const cancelBrowserSpeech = () => {
    try {
        if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    } catch (e) {
        console.warn("Speech Synthesis API is not available for cancelling.", e);
    }
};


/**
 * Speaks the given text using the browser's built-in Text-to-Speech engine.
 * It prioritizes Google voices for a more natural, human-like quality.
 * @param text The text to be spoken.
 */
const speakWithBrowser = (text: string) => {
    try {
        if (typeof window.speechSynthesis === 'undefined') {
            console.warn('Browser Speech Synthesis not supported.');
            return;
        }
        
        const voices = window.speechSynthesis.getVoices();
        
        // 1. Prioritize Google voices for the highest quality.
        let spanishVoice = voices.find(voice => voice.lang.startsWith('es') && voice.name.includes('Google'));
        
        // 2. Fallback to other known high-quality Spanish voices like Mónica.
        if (!spanishVoice) {
            spanishVoice = voices.find(voice => voice.name === 'Mónica' && voice.lang.startsWith('es'));
        }

        // 3. Generic fallback to the first available Spanish voice.
        if (!spanishVoice) {
            spanishVoice = voices.find(voice => voice.lang.startsWith('es'));
        }

        const utterance = new SpeechSynthesisUtterance(text);
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        utterance.lang = 'es-ES';
        utterance.rate = 0.95; // Slightly slower for clarity
        utterance.pitch = 1.0; // Natural pitch

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.warn("Speech Synthesis API failed to speak.", e);
    }
};


/**
 * Speaks the given text using the browser's speech synthesis capabilities.
 * It ensures that voices are loaded before attempting to speak.
 * @param text The text to be spoken.
 */
export const speak = (text: string) => {
    cancel(); 

    if (!text || !text.trim()) {
        return;
    }

    const initBrowserTTS = () => {
        try {
            // Check if voices are loaded
            if (window.speechSynthesis.getVoices().length > 0) {
                speakWithBrowser(text);
            } else {
                 // If not, wait for the 'voiceschanged' event
                window.speechSynthesis.onvoiceschanged = () => {
                    speakWithBrowser(text);
                    // Important: remove the listener to prevent it from firing multiple times
                    window.speechSynthesis.onvoiceschanged = null;
                };
            }
        } catch (e) {
            console.warn("Speech Synthesis API not available for initialization.", e);
        }
    };
    
    try {
        if (typeof window.speechSynthesis !== 'undefined') {
            initBrowserTTS();
        }
    } catch (e) {
        console.warn("Speech Synthesis API is not accessible.", e);
    }
};


/**
 * Cancels any ongoing speech narration from the browser.
 */
export const cancel = () => {
    cancelBrowserSpeech();
};
