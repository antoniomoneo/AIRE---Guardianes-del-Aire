
import React, { useState, useEffect } from 'react';
import { getAllUsersSorted } from '../utils/scoringService';
import type { User } from '../types';

interface RankingProps {
  onClose: () => void;
}

const getMedal = (rank: number): string => {
    switch(rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return '';
    }
}

export const Ranking: React.FC<RankingProps> = ({ onClose }) => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            onClose();
          }
        };
        window.addEventListener('keydown', handleKeyDown);

        setUsers(getAllUsersSorted());

        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/95 border border-green-500/30 rounded-2xl shadow-2xl w-full max-w-2xl h-full max-h-[90vh] p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-2xl font-orbitron text-green-300">Ranking de Guardianes y Guardianas</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                <div className="flex-grow mt-4 pr-2 overflow-y-auto">
                    {users.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700 text-sm uppercase text-gray-400">
                                    <th className="p-2 w-1/6 text-center">Rango</th>
                                    <th className="p-2 w-3/6">Guardián/a</th>
                                    <th className="p-2 w-2/6 text-right">Puntuación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr key={user.name} className={`border-b border-gray-800 ${index < 3 ? 'text-lg' : ''}`}>
                                        <td className="p-3 text-center font-orbitron font-bold">
                                            <span className="text-2xl">{getMedal(index + 1)}</span>
                                            <span className={`${index < 3 ? 'hidden' : ''}`}>{index + 1}</span>
                                        </td>
                                        <td className={`p-3 font-semibold truncate ${index < 3 ? 'text-green-200' : 'text-gray-200'}`}>{user.name}</td>
                                        <td className={`p-3 font-orbitron font-bold text-right ${index < 3 ? 'text-green-300' : 'text-gray-300'}`}>{user.score.toLocaleString('es-ES')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <h3 className="text-2xl font-orbitron">El Ranking está vacío</h3>
                            <p className="mt-2 max-w-md">¡Todavía no hay Guardianes en la clasificación! Publica tu primer análisis o creación en la galería para empezar a ganar puntos y aparecer aquí.</p>
                        </div>
                    )}
                </div>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
