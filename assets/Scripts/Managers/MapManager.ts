// asset/Managers/MapManager.ts
// Singleton class managing all level data, loading, and progression information.

import { MapData as ImportedMapData } from './MapManager'; // For recursive typing in LevelData
// NOTE: Assuming PIXI.Texture/PIXI.Container are used for assets later.

// Placeholder types for Prefab/TextAsset loading used in the original Cocos code.
export type MapPrefabType = string;
export type TextAssetType = { text: string }; 

// --- Data Models (Original classes preserved as pure TypeScript) ---

/**
 * Data structure for an individual level's setup.
 */
export class LevelData {
    level: number = 0;
    loadFolderName: string = "";
    prefab: MapPrefabType = ""; // Pixi: Placeholder for map structure asset
    currentMap: string = "";

    /**
     * Loads a random map file for the current level folder.
     * In a real Pixi setup, this needs a resource loader implementation.
     * @param onLoaded - Callback function when the text asset is loaded.
     */
    getRandomData(onLoaded: (text: TextAssetType) => void) {
        var path = "maps/" + this.loadFolderName;
        // In Cocos, randomRangeInt(1, 101) includes 1 but excludes 101.
        path += "/map_" + Math.floor(Math.random() * (101 - 1) + 1); 
        this.currentMap = path;
        
        // --- Mocking Async Asset Load in Pixi ---
        setTimeout(() => {
            // Mock map data (Example: 6 columns)
            onLoaded && onLoaded({
                text: "0 1 2 3 4 5\n0 1 2 3 4 5\n0 1 2 3 4 5" 
            }); 
        }, 50);
    }
}

/**
 * Data structure for level requirements and player progress (stars, time, score, turns).
 */
export class MapData{
    level: number = 0;
    stars: number = 0; // Player's best score in stars
    time: number = 0; // Required time limit
    score: number = 0; // Required score goal
    turns: number = 0; // Required moves limit
}


// --- MapManager Singleton ---

export class MapManager {
    // Singleton instance
    private static _instance: MapManager | null = null;
    public static get instance(): MapManager {
        if (MapManager._instance === null) {
            MapManager._instance = new MapManager();
        }
        return MapManager._instance;
    }
    
    // Configuration asset (set manually after loading TextAsset)
    public assetMapData: TextAssetType = { text: "" }; 

    // Level configuration groups (e.g., Easy, Medium, Hard)
    public levelData: LevelData[] = []; //
    // Parsed map data (requirements) for all levels
    public mapData: MapData[] = []; //
    // Levels that grant an additional reward upon completion
    public rewardLevel: number[] = [3, 6, 9, 12, 15, 18, 20]; //

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Finds the LevelData based on the level number (grouping levels by difficulty).
     * @param level - The game level number.
     * @returns The corresponding LevelData object.
     */
    public getLevelData(level: number): LevelData | null {
        // Logic: groups levels into 5s (0-5, 6-10, 11-15, etc.)
        const index = Math.min(Math.floor(level / 5.1), this.levelData.length - 1);

        for (var i = 0; i < this.levelData.length; i++) {
            if (this.levelData[i].level == index) return this.levelData[i];
        }
        return null;
    }

    /**
     * Checks if a specific level has an additional claimable reward (Level Milestone).
     * @param level - The game level number.
     * @returns True if the level is a reward milestone.
     */
    public isLevelHaveReward(level: number): boolean {
        return this.rewardLevel.indexOf(level) >= 0; //
    }

    /**
     * Parses the CSV-like map data (from assetMapData.text) to initialize level requirements.
     * NOTE: This must be called after the main asset configuration file is loaded.
     */
    public initMapData(): void {
        var csvStr = this.assetMapData.text; //
        var splitedCSV = csvStr.split('\n'); //
        
        this.mapData = [];
        // The original game configures up to 20 levels in the config file.
        for (var i = 0; i < 20; i++) {
            if (i < splitedCSV.length) {
                let spliedLine = splitedCSV[i].split(',');
                this.mapData.push({
                    level: i + 1,
                    stars: 0,
                    time: parseInt(spliedLine[1]), // Column 1: Time limit
                    turns: parseInt(spliedLine[3]), // Column 3: Move limit
                    score: parseInt(spliedLine[2]) // Column 2: Score requirement
                })
                continue;
            }
            // Fallback default data for levels beyond config
            this.mapData.push({
                level: i + 1,
                stars: 0,
                time: 300,
                turns: 30,
                score: 1000
            })
        }
    }

    /**
     * Retrieves the MapData (requirements) for a specific level (1-based index).
     * @param level - The level number.
     * @returns The MapData object or null.
     */
    public getDataByLevel(level: number): MapData | null {
        try {
            return this.mapData[level - 1]; //
        }   
        catch {
            return null;
        }
    } 

    /**
     * Updates the player's star progression based on server history data.
     * @param data - Array of level history objects from the server API.
     */
    public setServerMapData(data: Array<{ level: number, star: number }>): void {
        data.forEach(map => {
            if (this.mapData[map.level - 1] != null) {
                // Update stars based on server data
                this.mapData[map.level - 1].stars = map.star;
            }
        });
    }
}

// Global accessor for convenience (MM)
export const MM = MapManager.instance;