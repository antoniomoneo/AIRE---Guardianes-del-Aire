
import React, { useState, useEffect } from 'react';

interface PublishModalProps {
  onClose: () => void;
  onPublish: (authorName: string) => void;
  isPublishing: boolean;
  userName: string;
}

export const PublishModal: React.FC<PublishModalProps> = ({ onClose, onPublish, isPublishing, userName }) => {
    const [author, setAuthor] = useState(userName || '');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (author.trim() && !isPublishing) {
            onPublish(author.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-orbitron text-cyan-300 mb-4">Publicar en la Galería</h2>
                <p className="text-gray-400 mb-6">Tu creación será visible para otros usuarios. Por favor, introduce tu nombre o un alias.</p>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="authorName" className="font-bold text-gray-400 mb-2 block uppercase tracking-wider text-sm">Tu Nombre</label>
                    <input
                        id="authorName"
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Guardián/a del Aire"
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        maxLength={50}
                        required
                        autoFocus
                    />
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">Cancelar</button>
                        <button type="submit" disabled={!author.trim() || isPublishing} className="px-6 py-2 bg-cyan-600 rounded-md hover:bg-cyan-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {isPublishing ? 'Publicando...' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
