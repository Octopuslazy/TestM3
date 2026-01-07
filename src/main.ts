// src/main.ts - Entry point for Match-3 game on Pixi v8
import { Application } from 'pixi.js';
import { Game } from './game/Game';
import { AssetManager } from './managers/AssetManager';

export class Main {
    private app: Application;
    private game: Game | null = null;

    constructor() {
        this.app = new Application();
        this.init();
    }

    private async init(): Promise<void> {
        // Initialize Pixi Application
        await this.app.init({
            width: 1920,
            height: 1080,
            backgroundColor: 0x1a1a2e,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        // Ensure document body is available (script may run in <head> after inlining)
        if (!document.body) {
            await new Promise<void>((resolve) => {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
                } else {
                    resolve();
                }
            });
        }

        document.body.appendChild(this.app.canvas);

        // Show loading
        console.log('Loading assets...');

        try {
            // Load all game assets
            await AssetManager.loadAssets();
            console.log('Assets loaded successfully');

            // Start game
            this.game = new Game(this.app);
            this.game.start();

        } catch (error) {
            console.error('Failed to load assets:', error);
        }
    }
}

// Start the application
new Main();
