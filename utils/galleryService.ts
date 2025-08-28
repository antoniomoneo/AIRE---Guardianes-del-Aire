
import { v4 as uuidv4 } from 'uuid';
import type { GalleryItem, AudioVizGalleryItem, Model3DGalleryItem, InsightGalleryItem } from '../types';
import { awardPoints } from './scoringService';

const VOTED_KEY_PREFIX = 'aire_gallery_voted_';

// --- GitHub Integration ---
const GITHUB_OWNER = 'antoniomoneo';
const GITHUB_REPO = 'Aire-gallery';
// This token is assumed to be provided in the execution environment, similar to the Gemini API_KEY.
// It is NOT stored in the code.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const API_BASE_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;

const FOLDER_MAP: Record<GalleryItem['type'], string> = {
    'insight': 'insights',
    'audio-viz': 'audio-viz',
    '3d-model': '3d-models',
};

// Helper for GitHub API requests
async function githubApiRequest(path: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}/${path}`;
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };

    if (options.headers) {
        Object.assign(headers, options.headers);
    }
    
    // For write operations, a token is required.
    if (['PUT', 'POST', 'DELETE'].includes(options.method?.toUpperCase() || '')) {
        if (!GITHUB_TOKEN) {
             console.error('GitHub token is not configured. Write operations will fail.');
        } else {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`GitHub API Error (${response.status}): ${errorData.message}`);
    }
    
    // Handle responses with no body content
    if (response.status === 204 || (response.status === 200 && options.method?.toUpperCase() === 'DELETE') || response.status === 201) {
        return null;
    }
    
    return response.json();
}


let galleryCache: (GalleryItem & { _sha: string, _path: string })[] | null = null;

export const getGalleryItems = async (): Promise<GalleryItem[]> => {
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
                            const fileData = await githubApiRequest(file.path);
                            if (fileData.encoding !== 'base64') return null;
                            const decodedContent = atob(fileData.content);
                            const item = JSON.parse(decodedContent);
                            return { ...item, _sha: fileData.sha, _path: fileData.path };
                        } catch (e) {
                            console.error(`Failed to fetch or parse ${file.path}`, e);
                            return null;
                        }
                    });
                
                return (await Promise.all(fileContentPromises)).filter(Boolean);
            } catch (e) {
                 if (e instanceof Error && e.message.includes('404')) {
                    // Directory doesn't exist yet, which is fine.
                    return [];
                }
                throw e; // Re-throw other errors
            }
        });

        const results = await Promise.all(dirPromises);
        results.forEach(folderItems => allItems.push(...folderItems as any));

        allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        galleryCache = allItems;
        return allItems;

    } catch (error) {
        console.error(`Failed to get gallery items from GitHub:`, error);
        throw error;
    }
};

export const addGalleryItem = async (itemData: Omit<AudioVizGalleryItem, 'id' | 'createdAt' | 'votes'> | Omit<Model3DGalleryItem, 'id' | 'createdAt' | 'votes'> | Omit<InsightGalleryItem, 'id' | 'createdAt' | 'votes'>): Promise<void> => {
    if (!GITHUB_TOKEN) {
        throw new Error('No se puede publicar. El token de GitHub no está configurado en el entorno de la aplicación.');
    }
    const newItem: Omit<GalleryItem, 'votes'> & { votes: number } = {
        ...itemData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        votes: 0,
    } as any;
    
    const folder = FOLDER_MAP[newItem.type as keyof typeof FOLDER_MAP];
    if (!folder) {
        throw new Error('Invalid gallery item type');
    }
    const filePath = `${folder}/${newItem.id}.json`;
    const commitMessage = `feat: Add ${newItem.type} "${newItem.title}" by ${newItem.author}`;

    // btoa is a browser function for base64 encoding
    const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(newItem, null, 2))));

    await githubApiRequest(filePath, {
        method: 'PUT',
        body: JSON.stringify({
            message: commitMessage,
            content: encodedContent,
        }),
    });
    
    galleryCache = null; // Invalidate cache
};

export const deleteGalleryItem = async (id: string): Promise<void> => {
    if (!GITHUB_TOKEN) {
        throw new Error('No se puede eliminar. El token de GitHub no está configurado.');
    }
    if (!galleryCache) {
        await getGalleryItems();
    }
    const itemToDelete = galleryCache?.find(item => item.id === id);
    if (!itemToDelete) {
        throw new Error("Item not found for deletion. It might have been already deleted.");
    }

    const commitMessage = `fix: Delete item ${itemToDelete.title} (${itemToDelete.id})`;

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

    if (!GITHUB_TOKEN) {
         alert('La función de votar está deshabilitada porque no hay un token de GitHub configurado para guardar los votos.');
         return;
    }

    if (!galleryCache) {
       await getGalleryItems();
    }

    const itemToVote = galleryCache?.find(item => item.id === id);
    if (!itemToVote) {
        throw new Error("Item not found for voting.");
    }

    const updatedItem = { ...itemToVote, votes: itemToVote.votes + 1 };
    // remove internal properties before saving
    const {_sha, _path, ...itemToSave} = updatedItem;

    const commitMessage = `chore: Upvote for ${itemToVote.title} (${itemToVote.id})`;
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
        window.localStorage.setItem(`${VOTED_KEY_PREFIX}${id}`, 'true');
    } catch (error) {
        console.warn(`Failed to set vote status in localStorage:`, error);
    }

    galleryCache = null; // Invalidate cache
};

// This remains in localStorage as it's user-specific
export const hasVotedForItem = (id: string): boolean => {
    try {
        return window.localStorage.getItem(`${VOTED_KEY_PREFIX}${id}`) === 'true';
    } catch (error) {
        console.warn(`Failed to check vote status in localStorage:`, error);
        return false;
    }
};
