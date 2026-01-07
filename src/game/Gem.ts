// src/game/Gem.ts - Individual gem/element in the grid
import { Container, Sprite } from 'pixi.js';
import { AssetManager } from '../managers/AssetManager';

export type SpecialType = 'none' | 'bomb' | 'plus';

export class Gem extends Container {
    public type: number;
    public gridX: number;
    public gridY: number;
    private sprite: Sprite;
    
    public isMoving: boolean = false;
    public isMatched: boolean = false;
    public special: SpecialType = 'none';
    private bombOverlay: Sprite | null = null;
    private plusOverlay: Sprite | null = null;

    constructor(type: number, gridX: number, gridY: number, special: SpecialType = 'none') {
        super();
        
        this.type = type;
        this.gridX = gridX;
        this.gridY = gridY;
        this.special = special;

        // If special bomb, we'll later add overlay after sprite is created
        // Create sprite
        const texture = AssetManager.getGemTexture(type);
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.width = 90;
        this.sprite.height = 90;
        
        this.addChild(this.sprite);

        if (this.special === 'bomb') {
            this.makeBombVisual();
        } else if (this.special === 'plus') {
            this.makePlusVisual();
        }
        
        // Set interactive
        this.eventMode = 'static';
        this.cursor = 'pointer';
    }

    public isBomb(): boolean {
        return this.special === 'bomb';
    }

    public isPlus(): boolean {
        return this.special === 'plus';
    }

    public makeBomb(): void {
        this.special = 'bomb';
        this.makeBombVisual();
        // visually make special gems slightly larger
        this.scale.set(1.1);
    }

    public makePlus(): void {
        this.special = 'plus';
        this.makePlusVisual();
        this.scale.set(1.1);
    }

    private makeBombVisual(): void {
        // create a visual overlay for the bomb depending on gem type
        try {
            const overlayTex = AssetManager.getBombOverlayForType(this.type);
            const overlay = new Sprite(overlayTex);
            overlay.anchor.set(0.5);
            // Match overlay size to gem sprite so bomb visually matches other gems
            overlay.width = this.sprite.width;
            overlay.height = this.sprite.height;
            this.bombOverlay = overlay;
            this.addChild(this.bombOverlay);
            // hide the base gem sprite so only the special item image shows
            this.sprite.visible = false;
        } catch (e) {
            // fallback: ignore
        }
    }

    private makePlusVisual(): void {
        try {
            const overlayTex = AssetManager.getPlusOverlayForType(this.type);
            const overlay = new Sprite(overlayTex);
            overlay.anchor.set(0.5);
            overlay.width = this.sprite.width;
            overlay.height = this.sprite.height;
            this.plusOverlay = overlay;
            this.addChild(this.plusOverlay);
            this.sprite.visible = false;
        } catch (e) {
            // ignore
        }
    }

    /**
     * Update grid position
     */
    public setGridPosition(x: number, y: number): void {
        this.gridX = x;
        this.gridY = y;
    }

    /**
     * Get display info for debugging
     */
    public toString(): string {
        return `Gem(${this.type}) at [${this.gridX},${this.gridY}]`;
    }

    /**
     * Destroy gem and cleanup
     */
    public dispose(): void {
        this.removeFromParent();
        this.destroy();
    }
}
