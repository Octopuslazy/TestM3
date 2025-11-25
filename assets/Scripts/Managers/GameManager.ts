// asset/Managers/GameManager.ts
// Singleton class for managing global game state and user data.

import { MapData } from './MapManager'; // Import MapData model

export class GameManager {
    // Singleton instance storage
    private static _instance: GameManager | null = null;

    isInitialized: boolean = false; //
    gameData: MapData | null = null; // Current level's data (requirements + turn_id added later)
    userData: any = null; // User's progress/API info
    isHaveTutorial: boolean = false; // Flag to check if tutorial should be shown
    isHaveRewardTutorial: boolean = true; // Flag for reward tutorial

    /**
     * Static method used by SplashController to ensure instance creation.
     */
    public static initialize(): void {
        if (GameManager._instance === null) {
            GameManager._instance = new GameManager();
            GameManager._instance.initializeStats(); //
        }
    }
    
    // Public static method (Property Getter) to get the single instance
    public static get instance(): GameManager {
        if (GameManager._instance === null) {
            GameManager.initialize();
        }
        return GameManager._instance!;
    }

    private constructor() {
        // Private constructor enforces singleton pattern
    }

    private initializeStats(): void {
        if (this.isInitialized) return; //
        this.isInitialized = true; //
    }

    /**
     * Setter for the current level's operational data (e.g., score goal, time, turns).
     */
    public setGameData(data: MapData): void {
        this.gameData = data; //
    }

    /**
     * Setter for user data retrieved from API (e.g., total stars, turns remaining).
     */
    public setUserData(data: any): void {
        this.userData = data; //
    }

    /**
     * Sends a post message to the top window to exit the game (Cocos original logic).
     */
    public backToHome(): void {
        window.top?.postMessage('exit-game', '*'); //
    }
}

// Global accessor for convenience (GM)
export const GM = GameManager.instance;