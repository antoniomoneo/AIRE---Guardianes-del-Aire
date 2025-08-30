
import React from 'react';
import type { GalleryItem } from '../types';

interface GalleryCardProps {
    item: GalleryItem;
    onVote: (id: string) => void;
    onDelete: (id: string) => void;
    isVoted: boolean;
    isAdmin: boolean;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ item, onVote, onDelete, isVoted, isAdmin }) => {
    const creationDate = new Date(item.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const renderCardContent = () => {
        switch (item.type) {
            case 'insight':
                return (
                    <div className="p-4 flex-grow flex flex-col justify-center bg-black/20 min-h-[15rem]">
                        <div>
                            <h5 className="font-bold text-gray-400 mb-1 text-sm">Conclusión:</h5>
                            <blockquote className="border-l-4 border-cyan-500 pl-3 italic text-gray-300 text-sm mb-4">
                               "{item.conclusion}"
                            </blockquote>
                        </div>
                        <div>
                             <h5 className="font-bold text-gray-400 mb-1 text-sm">Recomendación:</h5>
                            <blockquote className="border-l-4 border-yellow-500 pl-3 italic text-gray-300 text-sm">
                               "{item.recommendation}"
                            </blockquote>
                        </div>
                    </div>
                );
            case 'ai-scenario':
                return (
                    <div className="p-4 flex-grow flex flex-col justify-center bg-black/20 min-h-[15rem]">
                        <div>
                            <h5 className="font-bold text-gray-400 mb-1 text-sm">Escenario del usuario:</h5>
                            <blockquote className="border-l-4 border-indigo-400 pl-3 italic text-gray-300 text-sm mb-4">
                               "{item.userPrompt}"
                            </blockquote>
                        </div>
                        <div>
                             <h5 className="font-bold text-gray-400 mb-1 text-sm">Explicación de la IA:</h5>
                            <blockquote className="border-l-4 border-green-400 pl-3 italic text-gray-300 text-sm">
                               "{item.aiExplanation}"
                            </blockquote>
                        </div>
                    </div>
                );
            case 'audio-viz':
                return (
                    <div className="aspect-square bg-black flex items-center justify-center">
                        <video src={item.videoDataUrl} controls className="w-full h-full object-cover" />
                    </div>
                );
            case '3d-model':
                return (
                    <div className="aspect-square bg-black flex items-center justify-center">
                        <img src={item.imageDataUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden flex flex-col transition-shadow hover:shadow-lg hover:shadow-cyan-500/10">
            {renderCardContent()}
            <div className="p-4 flex flex-col flex-grow">
                <h4 className="font-orbitron text-lg text-cyan-200 truncate" title={item.title}>{item.title}</h4>
                <p className="text-sm text-gray-400">Por: <span className="font-semibold text-gray-300">{item.author}</span></p>
                <p className="text-xs text-gray-500">Publicado: {creationDate}</p>
                <div className="flex-grow" />
                <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-700/50">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onVote(item.id)}
                            disabled={isVoted}
                            className="flex items-center gap-1 text-gray-300 disabled:text-cyan-400 hover:text-white transition-colors disabled:cursor-default"
                            aria-label={isVoted ? "Ya has votado" : "Votar"}
                            title={isVoted ? "Ya has votado" : "Votar"}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h8a1 1 0 001-1v-6.667a2.25 2.25 0 00-.75-1.666l-3.42-3.42a2.25 2.25 0 00-3.18 0l-3.42 3.42A2.25 2.25 0 006 10.333z" /></svg>
                            <span className="font-bold text-lg">{item.votes}</span>
                        </button>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => { if (window.confirm('¿Seguro que quieres eliminar esta creación? Esta acción no se puede deshacer.')) onDelete(item.id) }}
                            className="px-2 py-1 bg-red-800 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                            Eliminar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};