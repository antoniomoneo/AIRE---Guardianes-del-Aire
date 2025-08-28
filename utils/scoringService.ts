
import type { User } from '../types';

const USERS_KEY = 'aire_users';
const NARRATIVE_COMPLETED_KEY = 'aire_narrative_completed';

const getUsers = (): User[] => {
    try {
        const item = window.localStorage.getItem(USERS_KEY);
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.warn(`localStorage not available or failed to parse users:`, error);
        return [];
    }
};

const saveUsers = (users: User[]): void => {
    try {
        window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
        console.warn(`Failed to save users to localStorage:`, error);
    }
};

export const setNarrativeCompletedFlag = (): void => {
    try {
        // Only set the flag if it hasn't been set before to prevent re-awarding points
        if (window.localStorage.getItem(NARRATIVE_COMPLETED_KEY) !== 'completed') {
            window.localStorage.setItem(NARRATIVE_COMPLETED_KEY, 'true');
        }
    } catch (error) {
        console.warn(`Failed to set narrative flag in localStorage:`, error);
    }
};

export const awardPoints = (userName: string, points: number): void => {
    try {
        const users = getUsers();
        let user = users.find(u => u.name.toLowerCase() === userName.toLowerCase());

        if (!user) {
            user = { name: userName, score: 0 };
            users.push(user);
        }
        
        // Check if narrative was just completed and add bonus points.
        // This is separate from the item publication points.
        if (window.localStorage.getItem(NARRATIVE_COMPLETED_KEY) === 'true') {
            user.score += 300; // Award 300 points for first-time story completion
            window.localStorage.setItem(NARRATIVE_COMPLETED_KEY, 'completed'); // Mark as completed to prevent re-awarding
        }

        user.score += points;
        saveUsers(users);
    } catch (error) {
        console.warn(`Failed to award points in localStorage:`, error);
    }
};

export const getAllUsersSorted = (): User[] => {
    try {
        return getUsers().sort((a, b) => b.score - a.score);
    } catch (error) {
        console.warn(`Failed to get sorted users from localStorage:`, error);
        return [];
    }
};
