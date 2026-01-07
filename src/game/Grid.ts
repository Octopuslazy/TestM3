// src/game/Grid.ts - Grid system for managing gem positions and matching
import { Container } from 'pixi.js';
import { Gem } from './Gem';

export interface GridConfig {
    rows: number;
    cols: number;
    cellSize: number;
    gemTypes: number;
}

export class Grid extends Container {
    public config: GridConfig;
    public gems: (Gem | null)[][] = [];
    
    private readonly CELL_SIZE = 110;
    private readonly GEM_TYPES = 4; // Use 4 types initially for easier matches

    constructor(rows: number = 9, cols: number = 6) {
        super();
        
        this.config = {
            rows,
            cols,
            cellSize: this.CELL_SIZE,
            gemTypes: this.GEM_TYPES
        };

        // Initialize grid array
        this.gems = Array.from({ length: rows }, () => Array(cols).fill(null));

        // Center the grid
        const gridWidth = cols * this.CELL_SIZE;
        const gridHeight = rows * this.CELL_SIZE;
        this.position.set(-gridWidth / 2, -gridHeight / 2);
    }

    /**
     * Initialize grid with random gems (no initial matches)
     */
    public initializeGrid(): void {
        for (let row = 0; row < this.config.rows; row++) {
            for (let col = 0; col < this.config.cols; col++) {
                let type = this.getRandomGemType();
                
                // Avoid initial matches
                let attempts = 0;
                while (this.wouldCreateMatch(row, col, type) && attempts < 10) {
                    type = this.getRandomGemType();
                    attempts++;
                }
                
                this.createGemAt(row, col, type);
            }
        }
    }

    /**
     * Create a gem at specific grid position
     */
    public createGemAt(row: number, col: number, type: number, special: 'none' | 'bomb' | 'plus' = 'none'): Gem {
        const gem = new Gem(type, col, row, special);
        
        // Position in world space
        gem.position.set(
            col * this.CELL_SIZE + this.CELL_SIZE / 2,
            row * this.CELL_SIZE + this.CELL_SIZE / 2
        );
        
        this.gems[row][col] = gem;
        this.addChild(gem);
        
        return gem;
    }

    /**
     * Get gem at grid position
     */
    public getGemAt(row: number, col: number): Gem | null {
        if (row < 0 || row >= this.config.rows || col < 0 || col >= this.config.cols) {
            return null;
        }
        return this.gems[row][col];
    }

    /**
     * Swap two gems
     */
    public swapGems(gem1: Gem, gem2: Gem): void {
        const row1 = gem1.gridY;
        const col1 = gem1.gridX;
        const row2 = gem2.gridY;
        const col2 = gem2.gridX;

        // Swap in grid array
        this.gems[row1][col1] = gem2;
        this.gems[row2][col2] = gem1;

        // Update gem grid positions
        gem1.setGridPosition(col2, row2);
        gem2.setGridPosition(col1, row1);
    }

    /**
     * Check if placing a gem type would create a match
     */
    private wouldCreateMatch(row: number, col: number, type: number): boolean {
        // Check horizontal
        let horizontalCount = 1;
        
        // Check left
        for (let c = col - 1; c >= 0; c--) {
            const gem = this.gems[row][c];
            if (gem && gem.type === type) horizontalCount++;
            else break;
        }
        
        // Check right
        for (let c = col + 1; c < this.config.cols; c++) {
            const gem = this.gems[row][c];
            if (gem && gem.type === type) horizontalCount++;
            else break;
        }
        
        if (horizontalCount >= 3) return true;

        // Check vertical
        let verticalCount = 1;
        
        // Check up
        for (let r = row - 1; r >= 0; r--) {
            const gem = this.gems[r][col];
            if (gem && gem.type === type) verticalCount++;
            else break;
        }
        
        // Check down
        for (let r = row + 1; r < this.config.rows; r++) {
            const gem = this.gems[r][col];
            if (gem && gem.type === type) verticalCount++;
            else break;
        }
        
        if (verticalCount >= 3) return true;

        return false;
    }

    /**
     * Find all matches in the grid
     */
    public findMatches(): Gem[][] {
        const matches: Gem[][] = [];

        // Check horizontal matches
        for (let row = 0; row < this.config.rows; row++) {
            for (let col = 0; col < this.config.cols - 2; col++) {
                const gem1 = this.gems[row][col];
                const gem2 = this.gems[row][col + 1];
                const gem3 = this.gems[row][col + 2];

                if (gem1 && gem2 && gem3 &&
                    gem1.type === gem2.type && gem2.type === gem3.type) {

                    const matchGroup = [gem1, gem2, gem3];

                    // Extend match if possible
                    for (let c = col + 3; c < this.config.cols; c++) {
                        const nextGem = this.gems[row][c];
                        if (nextGem && nextGem.type === gem1.type) {
                            matchGroup.push(nextGem);
                        } else {
                            break;
                        }
                    }

                    matches.push(matchGroup);
                    // skip ahead past this run
                    col += matchGroup.length - 1;
                }
            }
        }

        // Check vertical matches
        for (let col = 0; col < this.config.cols; col++) {
            for (let row = 0; row < this.config.rows - 2; row++) {
                const gem1 = this.gems[row][col];
                const gem2 = this.gems[row + 1][col];
                const gem3 = this.gems[row + 2][col];

                if (gem1 && gem2 && gem3 &&
                    gem1.type === gem2.type && gem2.type === gem3.type) {

                    const matchGroup = [gem1, gem2, gem3];

                    // Extend match if possible
                    for (let r = row + 3; r < this.config.rows; r++) {
                        const nextGem = this.gems[r][col];
                        if (nextGem && nextGem.type === gem1.type) {
                            matchGroup.push(nextGem);
                        } else {
                            break;
                        }
                    }

                    matches.push(matchGroup);
                    // skip ahead past this run
                    row += matchGroup.length - 1;
                }
            }
        }

        return matches;
    }

    /**
     * Remove matched gems from grid
     */
    public removeGems(gems: Gem[]): void {
        gems.forEach(gem => {
            gem.isMatched = true;
            this.gems[gem.gridY][gem.gridX] = null;
            gem.dispose();
        });
    }

    /**
     * Apply gravity - move gems down to fill empty spaces
     */
    public applyGravity(): boolean {
        let hasMoved = false;

        for (let col = 0; col < this.config.cols; col++) {
            // Start from bottom
            for (let row = this.config.rows - 1; row >= 0; row--) {
                if (this.gems[row][col] === null) {
                    // Find gem above to drop
                    for (let r = row - 1; r >= 0; r--) {
                        if (this.gems[r][col] !== null) {
                            const gem = this.gems[r][col]!;
                            
                            // Move gem down
                            this.gems[row][col] = gem;
                            this.gems[r][col] = null;
                            gem.setGridPosition(col, row);
                            
                            hasMoved = true;
                            break;
                        }
                    }
                }
            }
        }

        return hasMoved;
    }

    /**
     * Fill empty top cells with new gems
     */
    public fillEmpty(): Gem[] {
        const newGems: Gem[] = [];

        for (let col = 0; col < this.config.cols; col++) {
            for (let row = 0; row < this.config.rows; row++) {
                if (this.gems[row][col] === null) {
                    const type = this.getRandomGemType();
                    const gem = this.createGemAt(row, col, type);
                    
                    // Start above screen
                    gem.position.y = -this.CELL_SIZE;
                    
                    newGems.push(gem);
                }
            }
        }

        return newGems;
    }

    /**
     * Check if two gems are adjacent
     */
    public areAdjacent(gem1: Gem, gem2: Gem): boolean {
        const dx = Math.abs(gem1.gridX - gem2.gridX);
        const dy = Math.abs(gem1.gridY - gem2.gridY);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    /**
     * Get world position for grid coordinates
     */
    public getWorldPosition(row: number, col: number): { x: number, y: number } {
        return {
            x: col * this.CELL_SIZE + this.CELL_SIZE / 2,
            y: row * this.CELL_SIZE + this.CELL_SIZE / 2
        };
    }

    private getRandomGemType(): number {
        return Math.floor(Math.random() * this.config.gemTypes);
    }
}
