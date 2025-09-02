



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

// Helper for GitHub API requests via our own proxy
async function githubApiRequest(path: string, options: RequestInit = {}) {
    const url = `/api/github/${path}`; // Use our new proxy endpoint

    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };
    
    if (options.method?.toUpperCase() !== 'GET' && options.body) {
        headers['Content-Type'] = 'application/json';
    }

    if (options.headers) {
        Object.assign(headers, options.headers);
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        const errorMessage = errorData.message || errorData.error || 'Unknown error from proxy.';
        throw new Error(`Proxy API Error (${response.status}): ${errorMessage}`);
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
                 if (e instanceof Error && (e.message.includes('404') || e.message.includes('Not Found'))) {
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

export const addGalleryItem = async (itemData: Omit<AudioVizGalleryItem, 'id' | 'createdAt' | 'votes'> | Omit<Model3DGalleryItem, 'id' | 'createdAt' | 'votes'> | Omit<InsightGalleryItem, 'id' | 'createdAt' | 'votes'> | Omit<AIScenarioGalleryItem, 'id' | 'createdAt' | 'votes'>): Promise<void> => {
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
