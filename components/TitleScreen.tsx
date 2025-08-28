
import React from 'react';

export const TitleScreen: React.FC = () => {
    return (
        <div className="w-full h-full flex items-center justify-center text-center p-4 bg-gray-900 animate-fade-in-out">
            <div>
                <h1 className="text-4xl md:text-6xl font-orbitron text-cyan-300">A.I.R.E</h1>
                <h2 className="text-2xl md:text-4xl font-orbitron text-white mt-2">Los Guardianes del Aire de Madrid</h2>
                <p className="text-md md:text-lg text-gray-400 mt-4 max-w-2xl mx-auto">
                    Una aventura generativa sobre la calidad del aire en Madrid con datos abiertos
                </p>
            </div>
            <style>{`
                @keyframes fade-in-out {
                    0% { opacity: 0; transform: scale(0.98); }
                    20% { opacity: 1; transform: scale(1); }
                    80% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0.98); }
                }
                .animate-fade-in-out {
                    animation: fade-in-out 3.5s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};
