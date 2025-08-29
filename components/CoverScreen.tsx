

import React, { useState } from 'react';
import { logoUrl, coverUrl } from '../utils/assets';

interface CoverScreenProps {
    onStart: (name: string) => void;
    isLoading: boolean;
    error: string | null;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({ onStart, isLoading, error }) => {
    const [name, setName] = useState('');

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gray-900 animate-fade-in">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${coverUrl})`, opacity: 0.3 }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <img src={logoUrl} alt="Tangible Data Logo" className="w-auto h-16 mb-8" />
                <h1 className="text-5xl md:text-7xl font-orbitron text-cyan-300">A.I.R.E</h1>
                <h2 className="text-2xl md:text-3xl font-orbitron text-white mt-2">Guardianes del Aire de Madrid</h2>
                
                <div className="mt-12 w-full max-w-sm">
                     {error ? (
                        <div className="p-4 bg-red-900/50 rounded-lg">
                            <h3 className="text-xl font-bold text-red-300">Error de Carga</h3>
                            <p className="mt-1 text-red-200">{error}</p>
                        </div>
                    ) : (
                        <form onSubmit={(e) => { e.preventDefault(); onStart(name); }}>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Escribe tu nombre de Guardián/a"
                                className="w-full px-6 py-4 bg-gray-800/70 border-2 border-cyan-500/50 text-white text-center text-xl font-orbitron rounded-lg shadow-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 backdrop-blur-sm"
                                maxLength={50}
                                required
                                autoFocus
                            />
                            <button 
                                type="submit"
                                disabled={isLoading || !name.trim()}
                                className="mt-4 w-full px-8 py-4 bg-purple-600 text-white font-orbitron text-xl rounded-lg shadow-lg shadow-purple-500/20 hover:bg-purple-500 transition-all transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-wait"
                            >
                                {isLoading ? 'Cargando Datos...' : 'Comenzar Misión'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 1s ease-in forwards;
                }
            `}</style>
        </div>
    );
};