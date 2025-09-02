import { v4 as uuidv4 } from 'uuid';
import type { GalleryItem, AudioVizGalleryItem, Model3DGalleryItem, InsightGalleryItem, AIScenarioGalleryItem } from '../types';
import { awardPoints } from './scoringService';

const VOTED_KEY_PREFIX = 'aire_gallery_voted_';

// --- GitHub Integration ---
const FOLDER_MAP: Record<GalleryItem['type'], string> = {
    'insight': 'insights',
    'audio-viz': 'audio-viz',
    '3d-model': '3d-models',
    'ai-scenario': 'ai-scenarios',
};

// Helper for GitHub API requests via our own secure server proxy
async function githubApiRequest(path: string, options: RequestInit = {}) {
    const url = `/api/github/${path}`;

    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    
    if (options.method?.toUpperCase() !== 'GET' && options.body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData;
        
        if (contentType && contentType.includes('application/json')) {
            try {
                errorData = await response.json();
            } catch (jsonError) {
                errorData = { message: `Error del servidor: ${response.statusText} (respuesta JSON malformada)` };
            }
        } else {
            // The response is not JSON (e.g., HTML error page), so we can't parse it.
            // We'll build a message from status text and content type.
            errorData = { message: `Respuesta no válida del servidor (tipo: ${contentType || 'desconocido'})` };
        }
        
        const detailedMessage = errorData.message || errorData.error || 'Error desconocido del proxy.';
        throw new Error(`Error en la API (${response.status}): ${detailedMessage}`);
    }
    
    // Handle responses with no body content (e.g., 204 No Content, successful DELETE)
    if (response.status === 204 || response.status === 201 || (response.status === 200 && options.method?.toUpperCase() === 'DELETE')) {
        return null;
    }
    
    return response.json();
}


let galleryCache: (GalleryItem & { _sha: string, _path: string })[] | null = null;

export const getGalleryItems = async (): Promise<GalleryItem[]> => {
    // Return cached data if available to improve performance and reduce API calls
    if (galleryCache) {
        return galleryCache;
    }

    try {
        const allItems: (GalleryItem & { _sha: string, _path: string })[] = [];
        const folders = Object.values(FOLDER_MAP);

        const dirPromises = folders.map(async (folder) => {
            try {
                const files = await githubApiRequest(folder);
                if (!Array.isArray(files)) return [];

                const fileContentPromises = files
                    .filter(file => file.name.endsWith('.json'))
                    .map(async (file) => {
                        try {
                            // The content of the file is included in the directory listing if the files are small enough
                            if (file.content) {
                                const decodedContent = atob(file.content);
                                const item = JSON.parse(decodedContent);
                                return { ...item, _sha: file.sha, _path: file.path };
                            }
                            // Fallback to fetch individual file if content is not in the directory listing
                            const fileData = await githubApiRequest(file.path);
                            if (fileData.encoding !== 'base64') return null;
                            const decodedContent = atob(fileData.content);
                            const item = JSON.parse(decodedContent);
                            return { ...item, _sha: fileData.sha, _path: fileData.path };
                        } catch (e) {
                            console.error(`Error al obtener o procesar ${file.path}`, e);
                            return null;
                        }
                    });
                
                return (await Promise.all(fileContentPromises)).filter(Boolean);
            } catch (e) {
                 if (e instanceof Error && e.message.includes('404')) {
                    // It's normal for a folder to not exist yet, especially on first run.
                    return [];
                }
                throw e; // Re-throw other, more critical errors
            }
        });

        const results = await Promise.all(dirPromises);
        results.forEach(folderItems => allItems.push(...folderItems as any));

        // Sort all items by creation date, descending
        allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        galleryCache = allItems;
        return allItems;

    } catch (error) {
        console.error(`Error al obtener los elementos de la galería:`, error);
        throw error;
    }
};

export const addGalleryItem = async (itemData: Omit<AudioVizGalleryItem, 'id' | 'createdAt' | 'votes'> | Omit<Model3DGalleryItem, 'id' | 'createdAt' | 'votes'> | Omit<InsightGalleryItem, 'id' | 'createdAt' | 'votes'> | Omit<AIScenarioGalleryItem, 'id' | 'createdAt' | 'votes'>): Promise<void> => {
    const newItem: Omit<GalleryItem, 'votes'> & { votes: number } = {
        ...itemData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        votes: 0,
    } as any;
    
    const folder = FOLDER_MAP[newItem.type];
    if (!folder) throw new Error('Tipo de elemento de galería inválido.');

    const filePath = `${folder}/${newItem.id}.json`;
    const commitMessage = `feat: Añadir ${newItem.type} "${newItem.title}" por ${newItem.author}`;

    const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(newItem, null, 2))));

    await githubApiRequest(filePath, {
        method: 'PUT',
        body: JSON.stringify({
            message: commitMessage,
            content: encodedContent,
        }),
    });
    
    galleryCache = null; // Invalidate cache after modification
};

export const deleteGalleryItem = async (id: string): Promise<void> => {
    if (!galleryCache) await getGalleryItems();
    
    const itemToDelete = galleryCache?.find(item => item.id === id);
    if (!itemToDelete) throw new Error("El elemento a eliminar no fue encontrado. Puede que ya haya sido borrado.");

    const commitMessage = `fix: Eliminar "${itemToDelete.title}" (${itemToDelete.id})`;

    await githubApiRequest(itemToDelete._path, {
        method: 'DELETE',
        body: JSON.stringify({
            message: commitMessage,
            sha: itemToDelete._sha,
        }),
    });
    
    galleryCache = null; // Invalidate cache
};

export const voteForItem = async (id: string): Promise<void> => {
    if (hasVotedForItem(id)) return;

    if (!galleryCache) await getGalleryItems();

    const itemToVote = galleryCache?.find(item => item.id === id);
    if (!itemToVote) throw new Error("El elemento a votar no fue encontrado.");

    const updatedItem = { ...itemToVote, votes: itemToVote.votes + 1 };
    const {_sha, _path, ...itemToSave} = updatedItem; // Exclude internal cache properties

    const commitMessage = `chore: Voto para "${itemToVote.title}" (${itemToVote.id})`;
    const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(itemToSave, null, 2))));

    await githubApiRequest(itemToVote._path, {
        method: 'PUT',
        body: JSON.stringify({
            message: commitMessage,
            content: encodedContent,
            sha: itemToVote._sha,
        }),
    });

    awardPoints(itemToVote.author, 10);
    try {
        localStorage.setItem(`${VOTED_KEY_PREFIX}${id}`, 'true');
    } catch (error) {
        console.warn(`No se pudo guardar el estado del voto en localStorage:`, error);
    }

    galleryCache = null; // Invalidate cache
};

export const hasVotedForItem = (id: string): boolean => {
    try {
        return localStorage.getItem(`${VOTED_KEY_PREFIX}${id}`) === 'true';
    } catch (error) {
        console.warn(`No se pudo comprobar el estado del voto en localStorage:`, error);
        return false;
    }
};