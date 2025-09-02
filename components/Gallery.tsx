

import React, { useState, useEffect, useMemo } from 'react';
import type { GalleryItem, AirQualityRecord } from '../types';
import { getGalleryItems, deleteGalleryItem, voteForItem, hasVotedForItem } from '../utils/galleryService';
import { GalleryCard } from './GalleryCard';
import { DecisionPanel as GalleryDetailModal } from './DecisionPanel';

interface GalleryProps {
  onClose: () => void;
  data: AirQualityRecord[];
}

export const Gallery: React.FC<GalleryProps> = ({ onClose, data }) => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    const loadGallery = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const allItems = await getGalleryItems();
            setItems(allItems);
            
            const newVotedIds = new Set<string>();
            allItems.forEach(item => {
                if (hasVotedForItem(item.id)) {
                    newVotedIds.add(item.id);
                }
            });
            setVotedIds(newVotedIds);

        } catch(e) {
            console.error("Failed to load gallery", e);
            if (e instanceof Error) {
                setError(`No se pudieron cargar las creaciones. Error: ${e.message}`);
            } else {
                setError("Ocurrió un error desconocido al cargar la galería.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (selectedItem) {
                    setSelectedItem(null);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        loadGallery();
        
        const params = new URLSearchParams(window.location.search);
        setIsAdmin(params.get('admin') === 'true');

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, selectedItem]);

    const handleVote = async (id: string) => {
        try {
            setVotedIds(prev => new Set(prev).add(id)); // Optimistic UI for vote button
            await voteForItem(id);
            await loadGallery(); // Refetch all to get updated votes and order
        } catch (e) {
            console.error("Failed to vote:", e);
            alert("Hubo un error al registrar el voto.");
            setVotedIds(prev => { // Revert optimistic update on failure
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteGalleryItem(id);
            await loadGallery(); // Refetch to confirm deletion
            setSelectedItem(null); // Close modal after deletion
        } catch (e) {
            console.error("Failed to delete:", e);
            alert("Hubo un error al eliminar el elemento.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/90 border border-yellow-500/30 rounded-2xl shadow-2xl w-full max-w-7xl h-full sm:h-[90vh] p-4 sm:p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl sm:text-2xl font-orbitron text-yellow-300">Galería de Creaciones</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto pt-4">
                    {error ? (
                        <div className="flex items-center justify-center h-full text-center text-red-400">{error}</div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center h-full text-gray-400">Cargando creaciones...</div>
                    ) : items.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {items.map(item => (
                                <GalleryCard
                                    key={item.id}
                                    item={item}
                                    onClick={() => setSelectedItem(item)}
                                    onVote={handleVote}
                                    onDelete={handleDelete}
                                    isVoted={votedIds.has(item.id)}
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <h3 className="text-2xl font-orbitron">Vacío por ahora...</h3>
                            <p className="mt-2 max-w-md">Parece que nadie ha publicado nada todavía. ¡Sé el primero en compartir tu creación o análisis!</p>
                        </div>
                    )}
                </div>
            </div>
             {selectedItem && (
                <GalleryDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onVote={handleVote}
                    onDelete={handleDelete}
                    isVoted={votedIds.has(selectedItem.id)}
                    isAdmin={isAdmin}
                    historicalData={data}
                />
            )}
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