
import React, { useState, useEffect, useRef } from 'react';
import { AIEye } from './AIEye';

interface IntroScreenProps {
  onComplete: () => void;
  userName: string;
}

const getIntroDialogues = (name: string) => [
    { text: `¡Hola, ${name}! Te doy la bienvenida a A.I.R.E.`, image: "https://images.unsplash.com/photo-1543786659-a74de5e35e78?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { text: "El aire que respiramos en nuestras ciudades es un tesoro invisible. Décadas de tráfico y actividad industrial lo han puesto en peligro, afectando nuestra salud y la del planeta.", image: "https://images.unsplash.com/photo-1627870313596-85e3d239103b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { text: "Tu misión es viajar por los datos para entender el pasado y dar forma a un futuro más limpio. Serás un Guardián o Guardiana del Aire, con el conocimiento y la creatividad como herramientas.", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { text: "He preparado un centro de aplicaciones con potentes herramientas para analizar, crear y simular. Úsalas para cumplir tu misión. ¿Estás listo/a?", image: "https://images.unsplash.com/photo-1587440871875-191322ee64b0?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }
];

export const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete, userName }) => {
    const [step, setStep] = useState(0);
    const introDialogues = getIntroDialogues(userName);
    const [displayText, setDisplayText] = useState('');
    const typingIntervalRef = useRef<number | null>(null);

    const currentDialogue = introDialogues[step];
    const fullText = currentDialogue.text;
    const isFinishedTyping = displayText === fullText;

    useEffect(() => {
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
        }
        setDisplayText('');
        
        let i = 0;
        typingIntervalRef.current = window.setInterval(() => {
            if (i < fullText.length) {
                setDisplayText(prev => fullText.substring(0, i + 1));
                i++;
            } else {
                if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
            }
        }, 40);

        return () => {
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        };
    }, [step, fullText]);

    const handleNextClick = () => {
        if (isFinishedTyping) {
            if (step < introDialogues.length - 1) {
                setStep(s => s + 1);
            } else {
                onComplete();
            }
        } else {
            if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
            setDisplayText(fullText);
        }
    };
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-900 animate-fade-in">
            <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2">
                    <img 
                        key={step}
                        src={currentDialogue.image} 
                        alt="Imagen introductoria" 
                        className="rounded-lg shadow-2xl shadow-cyan-500/10 w-full aspect-video object-cover animate-fade-in-slow"
                    />
                </div>
                <div className="w-full md:w-1/2">
                    <div className="p-6 bg-gray-800/50 rounded-xl border border-cyan-500/20">
                         <div className="flex items-center mb-3">
                            <AIEye />
                            <h3 className="font-bold font-orbitron text-cyan-300 text-xl ml-3">A.I.R.E.</h3>
                        </div>
                        <p className="text-gray-200 leading-relaxed text-lg min-h-[10rem]">{displayText}</p>
                         <div className="flex justify-between items-center mt-4">
                            <button onClick={onComplete} className="text-gray-400 hover:text-white text-sm transition-colors">
                                Saltar Introducción
                            </button>
                            <button onClick={handleNextClick} className="px-6 py-2 bg-purple-600 text-white font-orbitron rounded-lg hover:bg-purple-500 transition-all">
                                {step === introDialogues.length - 1 && isFinishedTyping ? 'Entrar al Centro de Apps' : 'Siguiente'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 1s ease-in forwards; }
                .animate-fade-in-slow { animation: fade-in 1.5s ease-in forwards; }
            `}</style>
        </div>
    );
};
