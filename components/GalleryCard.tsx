import React from 'react';
import type { GalleryItem } from '../types';

interface GalleryCardProps {
    item: GalleryItem;
    onClick: () => void;
    onVote: (id: string) => void;
    onDelete: (id: string) => void;
    isVoted: boolean;
    isAdmin: boolean;
}

const TYPE_INFO: Record<GalleryItem['type'], { label: string, color: string }> = {
    'insight': { label: 'Análisis', color: 'bg-cyan-500/80' },
    'ai-scenario': { label: 'Escenario IA', color: 'bg-indigo-500/80' },
    'audio-viz': { label: 'Audio & Viz', color: 'bg-purple-500/80' },
    '3d-model': { label: 'Modelo 3D', color: 'bg-orange-500/80' },
};

export const GalleryCard: React.FC<GalleryCardProps> = ({ item, onClick, onVote, onDelete, isVoted, isAdmin }) => {
    const creationDate = new Date(item.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const currentTypeInfo = TYPE_INFO[item.type];

    const renderCardContent = () => {
        switch (item.type) {
            case 'insight':
                return (
                    <div className="p-4 flex-grow flex flex-col justify-center bg-black/20 min-h-[15rem]">
                        <div>
                            <h5 className="font-bold text-gray-400 mb-1 text-sm">Conclusión:</h5>
                            <blockquote className="border-l-4 border-cyan-500 pl-3 italic text-gray-300 text-sm mb-4 line-clamp-3">
                               "{item.conclusion}"
                            </blockquote>
                        </div>
                        <div>
                             <h5 className="font-bold text-gray-400 mb-1 text-sm">Recomendación:</h5>
                            <blockquote className="border-l-4 border-yellow-500 pl-3 italic text-gray-300 text-sm line-clamp-3">
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
                            <blockquote className="border-l-4 border-indigo-400 pl-3 italic text-gray-300 text-sm mb-4 line-clamp-3">
                               "{item.userPrompt}"
                            </blockquote>
                        </div>
                        <div>
                             <h5 className="font-bold text-gray-400 mb-1 text-sm">Explicación de la IA:</h5>
                            <blockquote className="border-l-4 border-green-400 pl-3 italic text-gray-300 text-sm line-clamp-3">
                               "{item.aiExplanation}"
                            </blockquote>
                        </div>
                    </div>
                );
            case 'audio-viz':
                return (
                    <div className="aspect-square bg-black flex items-center justify-center relative group">
                        <video src={item.videoDataUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                );
            case '3d-model':
                 return (
                    <div className="aspect-square bg-black flex items-center justify-center relative group">
                        <img src={item.imageDataUrl} alt={item.title} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    return (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-yellow-400/50">
            <div onClick={onClick} className="cursor-pointer flex-grow relative">
                 {currentTypeInfo && (
                    <div className={`absolute top-2 right-2 text-white text-xs font-bold px-2 py-1 rounded-full z-10 ${currentTypeInfo.color}`}>
                        {currentTypeInfo.label}
                    </div>
                )}
                {renderCardContent()}
            </div>
            <div className="p-3 bg-gray-900/40 flex justify-between items-center text-xs">
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-white truncate" title={item.title}>{item.title}</span>
                    <span className="text-gray-400 truncate">por {item.author} - {creationDate}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {isAdmin && (
                        <button onClick={() => onDelete(item.id)} className="p-2 rounded-full hover:bg-red-500/20 text-red-400" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                    <div className="flex items-center gap-1 text-yellow-300">
                        <span className="font-bold">{item.votes}</span>
                        <button onClick={() => onVote(item.id)} disabled={isVoted} className={`p-1 rounded-full ${isVoted ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-300'}`} title="Votar">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h8a1 1 0 001-1v-6.667a2.25 2.25 0 00-.75-1.666l-3.42-3.42a2.25 2.25 0 00-3.18 0l-3.42 3.42A2.25 2.25 0 006 10.333z" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};