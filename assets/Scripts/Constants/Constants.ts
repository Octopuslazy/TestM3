// src/Constants/Constants.ts
// Defines static constants for scene navigation and core gameplay values.

export class SceneName {
    // Game flow scene names
    static SPLASH = "Splash";
    static MAP = "Map";
    static GAME = "Game";
}

export class GameplayConst {
    // Base score awarded for each element in a match
    static SCORE_PER_ELEMENT = 40;
    // Bonus score for each element matched beyond the required three
    static SCORE_BONUS_EXTRA_ELEMENT = 20;
    // Multiplier applied to score for each combo chain (e.g., 1.2^combo)
    static MULTI_COMBO_SCORE = 1.2;
    
    // Score ratio thresholds for achieving stars (Ratio = Current Score / Target Score)
    static STAR_1_SCORE_RATIO = 0.3;
    static STAR_2_SCORE_RATIO = 0.6;
    static STAR_3_SCORE_RATIO = 0.85;
}