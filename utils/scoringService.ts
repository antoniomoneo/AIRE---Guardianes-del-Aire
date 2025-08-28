

import type { User } from '../types';

const USERS_KEY = 'aire_users';
const NARRATIVE_COMPLETED_KEY = 'aire_narrative_completed_v2'; // v2 to reset for users of old version

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

export const awardNarrativePoints = (userName: string): void => {
    try {
        // Only award points if the narrative has not been completed before
        if (window.localStorage.getItem(NARRATIVE_COMPLETED_KEY) === 'completed') {
            return;
        }

        const users = getUsers();
        let user = users.find(u => u.name.toLowerCase() === userName.toLowerCase());

        if (!user) {
            user = { name: userName, score: 0 };
            users.push(user);
        }

        user.score += 200; // Award 200 points for first-time story completion
        saveUsers(users);

        // Mark as completed to prevent re-awarding
        window.localStorage.setItem(NARRATIVE_COMPLETED_KEY, 'completed');
    } catch (error) {
        console.warn(`Failed to award narrative points in localStorage:`, error);
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