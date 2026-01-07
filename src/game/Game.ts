// src/game/Game.ts - Main game controller
import { Application, Container, Text, Graphics, AnimatedSprite, Texture, Sprite } from 'pixi.js';
import { Grid } from './Grid';
import { Gem } from './Gem';
import { AssetManager } from '../managers/AssetManager';
import { PopupManager } from './popupManager';
import gsap from 'gsap';
import soundController from '../managers/SoundController';

export enum GameState {
    IDLE,
    SWAPPING,
    MATCHING,
    FILLING
}

export class Game {
    private app: Application;
    private container: Container;
    private grid: Grid;
    private uiContainer: Container;
    
    private state: GameState = GameState.IDLE;
    private selectedGem: Gem | null = null;
    
    // Game stats
    private score: number = 0;
    private moves: number = 30;
    private scoreText: Text;
    private movesText: Text;
    private popupManager!: PopupManager;
    // Drag state
    private draggingGem: Gem | null = null;
    private highlight: import('pixi.js').Graphics | null = null;
    private dragStartStagePoint: { x: number; y: number } | null = null;
    private dragThreshold: number = 0;

    constructor(app: Application) {
        this.app = app;
        
        // Main container (centered and scaled down)
        this.container = new Container();
        this.container.position.set(app.screen.width / 2, app.screen.height / 2);
        this.container.scale.set(0.8); // Scale down to 80%
        app.stage.addChild(this.container);

        // Create grid (smaller rows/cols) and a background frame to contain the board
        const GRID_ROWS = 7;
        const GRID_COLS = 7;
        this.grid = new Grid(GRID_ROWS, GRID_COLS);

        // Create frame/background behind the grid
        const pad = 18;
        const gw = this.grid.config.cols * this.grid.config.cellSize;
        const gh = this.grid.config.rows * this.grid.config.cellSize;

        const shadow = new Graphics();
        shadow.fill({ color: 0x000000, alpha: 0.28 }).roundRect(0, 0, gw + pad * 2, gh + pad * 2, 18);
        shadow.position.set(this.grid.position.x - pad + 6, this.grid.position.y - pad + 8);
        shadow.alpha = 0.85;
        this.container.addChild(shadow);

        const frame = new Graphics();
        // outer border as filled rounded rect, then inner fill to simulate stroke (Pixi v8 prefers fill/stroke style API)
        const border = 6;
        frame.fill({ color: 0xffffff, alpha: 1 }).roundRect(0, 0, gw + pad * 2, gh + pad * 2, 18);
        // inner rect inset by half the border to simulate stroke thickness
        const innerRadius = Math.max(8, 18 - Math.floor(border / 2));
        frame.fill({ color: 0xf7fbff, alpha: 1 }).roundRect(border / 2, border / 2, gw + pad * 2 - border, gh + pad * 2 - border, innerRadius);
        frame.position.set(this.grid.position.x - pad, this.grid.position.y - pad);
        this.container.addChild(frame);

        // Draw slightly darker tiles inside the frame to visually separate cells
        const tilesContainer = new Container();
        tilesContainer.position.set(this.grid.position.x, this.grid.position.y);
        const tileBg = new Graphics();
        const cell = this.grid.config.cellSize;
        const innerPad = Math.max(8, Math.floor(cell * 0.12));
        const tileSize = cell - innerPad;
        const corner = Math.max(8, Math.floor(tileSize * 0.12));
        const tileColor = 0xe0e6eb; // slightly darker than white frame (darker tint)
        for (let r = 0; r < this.grid.config.rows; r++) {
            for (let c = 0; c < this.grid.config.cols; c++) {
                const x = c * cell + innerPad / 2;
                const y = r * cell + innerPad / 2;
                tileBg.fill({ color: tileColor, alpha: 1 }).roundRect(x, y, tileSize, tileSize, corner);
            }
        }
        tilesContainer.addChild(tileBg);
        this.container.addChild(tilesContainer);

        // Add grid above tiles and frame
        this.container.addChild(this.grid);

        // Create UI
        this.uiContainer = new Container();
        this.container.addChild(this.uiContainer);

        // Score display
        this.scoreText = new Text({ text: 'Score: 0', style: { fontSize: 36, fill: 0xFFFFFF, fontWeight: 'bold' } });
        this.scoreText.position.set(-200, -550);
        this.uiContainer.addChild(this.scoreText);

        // Moves display
        this.movesText = new Text({ text: 'Moves: 30', style: { fontSize: 36, fill: 0xFFFFFF, fontWeight: 'bold' } });
        this.movesText.position.set(50, -550);
        this.uiContainer.addChild(this.movesText);

        // Setup input
        this.setupInput();

        // Popup manager
        this.popupManager = new PopupManager(this.app);
    }

    /**
     * Attach pointer handlers to each gem so they can start dragging.
     */
    private attachGemHandlers(): void {
        const gems = this.getAllGems();
        gems.forEach(gem => {
            // ensure interactive
            gem.eventMode = 'static';

            gem.off('pointerdown');
            gem.on('pointerdown', (e: any) => {
                if (this.state !== GameState.IDLE) return;
                // bring to top
                gem.parent && gem.parent.addChild(gem);
                gsap.to(gem.scale, { x: 1.1, y: 1.1, duration: 0.08 });
                // Pass original DOM event so we can compute stage coords
                const domEvent = e?.data?.originalEvent || e;
                this.startDragging(gem, domEvent);
            });
            // click / tap to trigger special gem actions or selection
            gem.off('pointertap');
            // Do NOT explode bombs on tap/click. Taps only select (for swap) — bombs trigger via swap.
            gem.on('pointertap', () => {
                if (this.state !== GameState.IDLE) return;
                this.handleGemClick(gem);
            });
        });
    }

    public start(): void {
        console.log('[Game] Starting...');
        this.grid.initializeGrid();
        this.state = GameState.IDLE;
        // Attach per-gem handlers for interactive dragging
        this.attachGemHandlers();
        console.log('[Game] Grid initialized');
        // start background music: browsers often block autoplay, so start on first user gesture
        const startBgOnce = () => {
            try { soundController.playBg(); } catch (e) {}
            try { window.removeEventListener('pointerdown', startBgOnce); } catch (e) {}
            try { window.removeEventListener('keydown', startBgOnce); } catch (e) {}
        };
        window.addEventListener('pointerdown', startBgOnce, { once: true });
        window.addEventListener('keydown', startBgOnce, { once: true });
    }

    private checkRewardThreshold(): void {
        this.popupManager.showRewardPopupIfNeeded(this.score, 500);
    }

    

    private setupInput(): void {
        // No-op here: per-gem handlers will call startDragging
        // We still keep stage pointerdown/up to prevent accidental selection outside gems
        this.app.stage.on('pointerdown', () => {});
    }

    private startDragging(gem: Gem, domEvent?: PointerEvent | any): void {
        if (this.state !== GameState.IDLE) return;
        this.draggingGem = gem;
        // bring to top
        gem.parent && gem.parent.addChild(gem);
        gsap.to(gem.scale, { x: 1.1, y: 1.1, duration: 0.08 });
        // initialize highlight and threshold
        if (!this.highlight) {
            const g = new Graphics();
            g.fill({ color: 0xffffff, alpha: 0.12 }).rect(0, 0, this.grid.config.cellSize, this.grid.config.cellSize);
            g.visible = false;
            this.highlight = g;
            this.grid.addChild(g);
        }
        this.dragThreshold = this.grid.config.cellSize * 0.3; // reduce threshold to 30% of cell

        // store initial stage point and snap gem to pointer immediately
        if (domEvent) {
            this.dragStartStagePoint = this.domEventToStagePoint(domEvent);
            const local = this.grid.toLocal(this.dragStartStagePoint, this.app.stage);
            gem.x = local.x;
            gem.y = local.y;
        } else {
            this.dragStartStagePoint = null;
        }

        // Add document-level listeners to capture pointer across canvas
        const onMove = (ev: PointerEvent) => this.onPointerMove(ev as any);
        const onUp = async (ev: PointerEvent) => { await this.onPointerUp(ev as any); };

        // store handlers on instance so we can remove them later
        (this as any)._docMove = onMove;
        (this as any)._docUp = onUp;
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
    }

    private onPointerMove(event: any): void {
        if (!this.draggingGem) return;
        const stagePoint = this.domEventToStagePoint(event);
        const local = this.grid.toLocal(stagePoint, this.app.stage);
        this.draggingGem.x = local.x;
        this.draggingGem.y = local.y;

        // check threshold for auto-swap direction
        if (this.dragStartStagePoint) {
            const dx = stagePoint.x - this.dragStartStagePoint.x;
            const dy = stagePoint.y - this.dragStartStagePoint.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (absDx > this.dragThreshold || absDy > this.dragThreshold) {
                // determine direction (horizontal or vertical)
                const dirX = absDx >= absDy ? Math.sign(dx) : 0;
                const dirY = absDy > absDx ? Math.sign(dy) : 0;
                const targetCol = this.draggingGem.gridX + dirX;
                const targetRow = this.draggingGem.gridY + dirY;
                const target = this.grid.getGemAt(targetRow, targetCol);
                if (target) {
                    // show highlight at target
                    if (this.highlight) {
                        const wp = this.grid.getWorldPosition(target.gridY, target.gridX);
                        this.highlight.position.set(wp.x - this.grid.config.cellSize / 2, wp.y - this.grid.config.cellSize / 2);
                        this.highlight.visible = true;
                    }
                    // Auto-swap immediately when threshold crossed
                    if (this.state === GameState.IDLE) {
                        (async () => {
                            // hide highlight
                            this.highlight && (this.highlight.visible = false);
                            await this.performSwap(this.draggingGem!, target);
                            // cleanup listeners
                            const onMove = (this as any)._docMove;
                            const onUp = (this as any)._docUp;
                            if (onMove) window.removeEventListener('pointermove', onMove);
                            if (onUp) window.removeEventListener('pointerup', onUp);
                            window.removeEventListener('pointercancel', onUp);
                            this.draggingGem = null;
                        })();
                    }
                }
            } else if (this.highlight) {
                this.highlight.visible = false;
            }
        }
    }

    private async onPointerUp(event: any): Promise<void> {
        if (!this.draggingGem) return;
        const source = this.draggingGem;
        const stagePoint = this.domEventToStagePoint(event);

        // if highlight visible, prefer that target
        let target: Gem | null = null;
        if (this.highlight && this.highlight.visible) {
            // compute target from highlight pos
            const local = this.grid.toLocal({ x: this.highlight.x + this.grid.config.cellSize / 2, y: this.highlight.y + this.grid.config.cellSize / 2 }, this.app.stage);
            const col = Math.floor((local.x) / this.grid.config.cellSize);
            const row = Math.floor((local.y) / this.grid.config.cellSize);
            target = this.grid.getGemAt(row, col);
        } else {
            target = this.getGemAtPointer(stagePoint);
        }

        gsap.to(source.scale, { x: 1, y: 1, duration: 0.08 });

        if (target && this.grid.areAdjacent(source, target)) {
            console.log('[Game] Drag-swap:', source.toString(), '->', target.toString());
            await this.performSwap(source, target);
        } else {
            const home = this.grid.getWorldPosition(source.gridY, source.gridX);
            await gsap.to(source, { x: home.x, y: home.y, duration: 0.18 });
        }

        // hide highlight
        if (this.highlight) this.highlight.visible = false;

        // remove document listeners
        const onMove = (this as any)._docMove;
        const onUp = (this as any)._docUp;
        if (onMove) window.removeEventListener('pointermove', onMove);
        if (onUp) window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);

        this.draggingGem = null;
    }

    /**
     * Convert a DOM PointerEvent to stage coordinates (object with x,y)
     */
    private domEventToStagePoint(ev: PointerEvent | any): { x: number; y: number } {
        // Use Pixi's interaction plugin to map DOM coordinates -> renderer coordinates
        const interaction = (this.app.renderer as any).plugins?.interaction;
        if (interaction && typeof interaction.mapPositionToPoint === 'function') {
            const pt = { x: 0, y: 0 } as any;
            interaction.mapPositionToPoint(pt, ev.clientX, ev.clientY);
            return { x: pt.x, y: pt.y };
        }

        // Fallback: normalized mapping to renderer size
        const rect = (this.app.canvas as HTMLCanvasElement).getBoundingClientRect();
        const nx = (ev.clientX - rect.left) / rect.width;
        const ny = (ev.clientY - rect.top) / rect.height;
        const x = nx * this.app.renderer.width;
        const y = ny * this.app.renderer.height;
        return { x, y };
    }

    private getGemAtPointer(globalPos: any): Gem | null {
        // `globalPos` can be a PIXI InteractionEvent.global or a plain {x,y} in stage coordinates
        const stagePoint = (globalPos && 'x' in globalPos && 'y' in globalPos) ? globalPos : (globalPos && (globalPos as any).global ? (globalPos as any).global : { x: 0, y: 0 });
        const localPos = this.grid.toLocal(stagePoint, this.app.stage);

        const col = Math.floor((localPos.x) / this.grid.config.cellSize);
        const row = Math.floor((localPos.y) / this.grid.config.cellSize);
        
        return this.grid.getGemAt(row, col);
    }

    private handleGemClick(gem: Gem): void {
        if (!this.selectedGem) {
            // Select first gem
            this.selectedGem = gem;
            gsap.to(gem.scale, { x: 1.2, y: 1.2, duration: 0.1 });
            console.log(`[Game] Selected: ${gem}`);
        } else {
            // Check if adjacent
            if (this.grid.areAdjacent(this.selectedGem, gem)) {
                console.log(`[Game] Swapping: ${this.selectedGem} <-> ${gem}`);
                this.performSwap(this.selectedGem, gem);
            } else {
                // Deselect and select new
                gsap.to(this.selectedGem.scale, { x: 1, y: 1, duration: 0.1 });
                this.selectedGem = gem;
                gsap.to(gem.scale, { x: 1.2, y: 1.2, duration: 0.1 });
            }
        }
    }

    private async performSwap(gem1: Gem, gem2: Gem): Promise<void> {
        this.state = GameState.SWAPPING;

        // Deselect visually
        gsap.to(gem1.scale, { x: 1, y: 1, duration: 0.08 });
        this.selectedGem = null;

        // Get target positions
        const pos1 = this.grid.getWorldPosition(gem1.gridY, gem1.gridX);
        const pos2 = this.grid.getWorldPosition(gem2.gridY, gem2.gridX);

        // Temporarily disable interactions on the grid to avoid accidental input during animation
        const prevInteractive = (this.grid as any).interactiveChildren;
        try {
            (this.grid as any).interactiveChildren = false;

            // Create a smoother GSAP timeline with easing and a subtle scale "puff"
            const duration = 0.32;
            const tl: any = gsap.timeline();

            // Slight pop when starting the swap
            tl.to([gem1.scale, gem2.scale], { x: 1.06, y: 1.06, duration: duration * 0.3, ease: 'sine.out' }, 0);
            // Move gems to targets with easing
            tl.to(gem1, { x: pos2.x, y: pos2.y, duration, ease: 'power2.inOut' }, 0);
            tl.to(gem2, { x: pos1.x, y: pos1.y, duration, ease: 'power2.inOut' }, 0);
            // Return scale to normal at end
            tl.to([gem1.scale, gem2.scale], { x: 1, y: 1, duration: duration * 0.25, ease: 'sine.in' }, duration * 0.65);

            // Wait for animation to complete
            await new Promise<void>(resolve => tl.eventCallback('onComplete', () => resolve()));

            // Update grid logical positions
            this.grid.swapGems(gem1, gem2);

            // Special interactions: bombs and pluses
            const gem1IsBomb = (gem1 as any).isBomb && (gem1 as any).isBomb();
            const gem2IsBomb = (gem2 as any).isBomb && (gem2 as any).isBomb();
            const gem1IsPlus = (gem1 as any).isPlus && (gem1 as any).isPlus();
            const gem2IsPlus = (gem2 as any).isPlus && (gem2 as any).isPlus();

            // Two plus swap => clear entire board
            if (gem1IsPlus && gem2IsPlus) {
                await this.clearBoard();
                await this.applyGravityAndFill();
                const cascadeMatches = this.grid.findMatches();
                if (cascadeMatches.length > 0) await this.processMatches(cascadeMatches);
                return;
            }

            // Bomb + plus => trigger both effects
            if ((gem1IsBomb && gem2IsPlus) || (gem2IsBomb && gem1IsPlus)) {
                const bombGem = gem1IsBomb ? gem1 : gem2;
                const plusGem = gem1IsPlus ? gem1 : gem2;
                // explode bomb (radius 1) and activate plus (cross)
                await this.explodeAt(bombGem, 1);
                await this.explodePlusAt(plusGem);
                await this.applyGravityAndFill();
                const cascadeMatches = this.grid.findMatches();
                if (cascadeMatches.length > 0) await this.processMatches(cascadeMatches);
                return;
            }

            // Two bombs swapped => larger explosion
            if (gem1IsBomb && gem2IsBomb) {
                await this.explodeAt(gem1, 2);
                await this.explodeAt(gem2, 2);
                await this.applyGravityAndFill();
                const cascadeMatches = this.grid.findMatches();
                if (cascadeMatches.length > 0) await this.processMatches(cascadeMatches);
                return;
            }

            // Check for matches
            const matches = this.grid.findMatches();

            if (matches.length > 0) {
                // Valid move
                this.moves--;
                this.movesText.text = `Moves: ${this.moves}`;
                await this.processMatches(matches);
            } else {
                // Invalid move - animate swap-back smoothly
                console.log('[Game] No matches, swapping back');

                const tlBack: any = gsap.timeline();
                const backDur = 0.28;
                tlBack.to([gem1.scale, gem2.scale], { x: 1.06, y: 1.06, duration: backDur * 0.25, ease: 'sine.out' }, 0);
                tlBack.to(gem1, { x: pos1.x, y: pos1.y, duration: backDur, ease: 'power2.inOut' }, 0);
                tlBack.to(gem2, { x: pos2.x, y: pos2.y, duration: backDur, ease: 'power2.inOut' }, 0);
                tlBack.to([gem1.scale, gem2.scale], { x: 1, y: 1, duration: backDur * 0.3, ease: 'sine.in' }, backDur * 0.6);

                await new Promise<void>(resolve => tlBack.eventCallback('onComplete', () => resolve()));
                // restore logical grid
                this.grid.swapGems(gem1, gem2);
            }
        } finally {
            // restore interactivity
            (this.grid as any).interactiveChildren = prevInteractive;
            this.state = GameState.IDLE;
        }

        // Check game over
        if (this.moves <= 0) {
            console.log('[Game] Game Over! Final Score:', this.score);
        }
    }

    private async processMatches(matches: Gem[][]): Promise<void> {
        this.state = GameState.MATCHING;
        // We'll process each match group separately so we can
        // - spawn new bombs for 4+ matches (new object), and
        // - detect existing bombs inside matched groups and explode them (chain reaction).
        const toRemove = new Set<Gem>();
        const bombsToSpawn: Array<{ row: number; col: number; type: number }> = [];
        const plusesToSpawn: Array<{ row: number; col: number; type: number }> = [];
        const bombsToExplode = new Set<Gem>();
        const plusesToExplode = new Set<Gem>();

        // Detect L/T shaped matches (intersection of a horizontal and vertical run)
        // We'll combine those pairs into a single union group and mark them to spawn a bomb at the pivot cell.
        const ltPivots: (Gem | undefined)[] = [];
        // Build map gem -> groups indices
        const gemToGroups = new Map<Gem, number[]>();
        matches.forEach((group, idx) => {
            for (const g of group) {
                const arr = gemToGroups.get(g) || [];
                arr.push(idx);
                gemToGroups.set(g, arr);
            }
        });

        const ltGroupsToRemove = new Set<number>();
        const ltUnions: Gem[][] = [];

        const detectOrientation = (group: Gem[]) => {
            if (group.length === 0) return 'm';
            const sameRow = group.every(g => g.gridY === group[0].gridY);
            if (sameRow) return 'h';
            const sameCol = group.every(g => g.gridX === group[0].gridX);
            if (sameCol) return 'v';
            return 'm';
        };

        for (const [gem, idxs] of gemToGroups.entries()) {
            if (!idxs || idxs.length < 2) continue;
            for (let i = 0; i < idxs.length; i++) {
                for (let j = i + 1; j < idxs.length; j++) {
                    const gi = matches[idxs[i]];
                    const gj = matches[idxs[j]];
                    if (!gi || !gj) continue;
                    const oi = detectOrientation(gi);
                    const oj = detectOrientation(gj);
                    // require one horizontal and one vertical run of length >= 3
                    if (oi === oj) continue;
                    if (gi.length >= 3 && gj.length >= 3) {
                        // create union set
                        const s = new Set<Gem>();
                        gi.forEach(x => s.add(x));
                        gj.forEach(x => s.add(x));
                        const unionArr = Array.from(s);
                        ltUnions.push(unionArr);
                        ltGroupsToRemove.add(idxs[i]);
                        ltGroupsToRemove.add(idxs[j]);
                        // mark a pivot for this union (the intersection gem)
                        // We'll push pivot alignment later when composing new matches
                    }
                }
            }
        }

        // compose new matches array: keep groups not merged, then append unions
        if (ltUnions.length > 0) {
            const newMatches: Gem[][] = [];
            const ltPivotMap: (Gem | undefined)[] = [];
            for (let mi = 0; mi < matches.length; mi++) {
                if (!ltGroupsToRemove.has(mi)) {
                    newMatches.push(matches[mi]);
                    ltPivotMap.push(undefined);
                }
            }
            // Append unions and set pivot to be the intersection gem (choose first shared gem)
            for (const unionArr of ltUnions) {
                newMatches.push(unionArr);
                // find a pivot gem inside union where it was part of both original runs
                // we'll pick the first gem whose group count >1
                let pivot: Gem | undefined = undefined;
                for (const g of unionArr) {
                    const arr = gemToGroups.get(g) || [];
                    if (arr.length > 1) { pivot = g; break; }
                }
                ltPivotMap.push(pivot);
            }
            matches = newMatches;
            // copy ltPivotMap into ltPivots (aligned with matches indices)
            for (let k = 0; k < ltPivotMap.length; k++) ltPivots[k] = ltPivotMap[k];
        }

        // First pass: collect removals, spawn requests, and bombs included in matches
        for (let mIndex = 0; mIndex < matches.length; mIndex++) {
            const group = matches[mIndex];
            const ltPivot = ltPivots[mIndex];
            
            // detect existing special gems inside group
            const bombInGroup = group.find(g => (g as any).isBomb && (g as any).isBomb());
            const plusInGroup = group.find(g => (g as any).isPlus && (g as any).isPlus());

            // If this group was detected as an L/T union, spawn a bomb at pivot and mark all union gems for removal
            if (ltPivot) {
                const chosen = ltPivot;
                bombsToSpawn.push({ row: chosen.gridY, col: chosen.gridX, type: chosen.type });
                for (const g of group) {
                    toRemove.add(g);
                    if ((g as any).isBomb && (g as any).isBomb()) bombsToExplode.add(g);
                    if ((g as any).isPlus && (g as any).isPlus()) plusesToExplode.add(g);
                }
                continue;
            }

            // If group contains both plus and bomb, queue both to explode and remove group
            if (plusInGroup && bombInGroup) {
                for (const g of group) {
                    toRemove.add(g);
                    if ((g as any).isPlus && (g as any).isPlus()) plusesToExplode.add(g);
                    if ((g as any).isBomb && (g as any).isBomb()) bombsToExplode.add(g);
                }
            } else if (plusInGroup) {
                // mark group and queue plus activation
                for (const g of group) {
                    toRemove.add(g);
                    if ((g as any).isPlus && (g as any).isPlus()) plusesToExplode.add(g);
                }
            } else if (bombInGroup) {
                // mark group and queue bomb activation
                for (const g of group) {
                    toRemove.add(g);
                    if ((g as any).isBomb && (g as any).isBomb()) bombsToExplode.add(g);
                }
            } else if (group.length >= 5) {
                // spawn plus for 5-match
                const chosen = group[Math.floor(group.length / 2)];
                plusesToSpawn.push({ row: chosen.gridY, col: chosen.gridX, type: chosen.type });
                for (const g of group) toRemove.add(g);
            } else if (group.length >= 4) {
                // spawn bomb for 4-match
                const chosen = group[Math.floor(group.length / 2)];
                bombsToSpawn.push({ row: chosen.gridY, col: chosen.gridX, type: chosen.type });
                for (const g of group) toRemove.add(g);
            } else {
                // normal 3-match
                for (const g of group) toRemove.add(g);
            }
        }

        // Keep snapshot of initial removals to distinguish explosion-added removals
        const initialRemoved = new Set(toRemove);
        const explosionAdded = new Set<Gem>();

        // Expand removal set by processing queued bombs and pluses (allow chaining)
        const queueBombs: Gem[] = Array.from(bombsToExplode);
        const queuePluses: Gem[] = Array.from(plusesToExplode);

        while (queueBombs.length > 0 || queuePluses.length > 0) {
            if (queueBombs.length > 0) {
                const bomb = queueBombs.shift()!;
                const cx = bomb.gridX;
                const cy = bomb.gridY;
                for (let r = cy - 1; r <= cy + 1; r++) {
                    for (let c = cx - 1; c <= cx + 1; c++) {
                        const g = this.grid.getGemAt(r, c);
                        if (g && !toRemove.has(g)) {
                            toRemove.add(g);
                            explosionAdded.add(g);
                            if ((g as any).isBomb && (g as any).isBomb() && !bombsToExplode.has(g)) {
                                bombsToExplode.add(g);
                                queueBombs.push(g);
                            }
                            if ((g as any).isPlus && (g as any).isPlus() && !plusesToExplode.has(g)) {
                                plusesToExplode.add(g);
                                queuePluses.push(g);
                            }
                        }
                    }
                }
            } else {
                const plus = queuePluses.shift()!;
                const cx = plus.gridX;
                const cy = plus.gridY;
                // full row (all columns at row=cy)
                for (let col = 0; col < this.grid.config.cols; col++) {
                    const g = this.grid.getGemAt(cy, col);
                    if (g && !toRemove.has(g)) {
                        toRemove.add(g);
                        explosionAdded.add(g);
                        if ((g as any).isBomb && (g as any).isBomb() && !bombsToExplode.has(g)) {
                            bombsToExplode.add(g);
                            queueBombs.push(g);
                        }
                        if ((g as any).isPlus && (g as any).isPlus() && !plusesToExplode.has(g)) {
                            plusesToExplode.add(g);
                            queuePluses.push(g);
                        }
                    }
                }
                // full column (all rows at col=cx)
                for (let row = 0; row < this.grid.config.rows; row++) {
                    const g = this.grid.getGemAt(row, cx);
                    if (g && !toRemove.has(g)) {
                        toRemove.add(g);
                        explosionAdded.add(g);
                        if ((g as any).isBomb && (g as any).isBomb() && !bombsToExplode.has(g)) {
                            bombsToExplode.add(g);
                            queueBombs.push(g);
                        }
                        if ((g as any).isPlus && (g as any).isPlus() && !plusesToExplode.has(g)) {
                            plusesToExplode.add(g);
                            queuePluses.push(g);
                        }
                    }
                }
            }
        }

        // Prepare scoring: base 10 per removed gem, +20 per bomb spawned, and extra +10 for each explosion-added gem
        const removedCount = toRemove.size;
        const bonusFromSpawns = bombsToSpawn.length * 20 + plusesToSpawn.length * 30;
        const extraExplosionBonus = explosionAdded.size * 10;
        const points = removedCount * 10 + bonusFromSpawns + extraExplosionBonus;
        this.score += points;
        this.scoreText.text = `Score: ${this.score}`;
        this.checkRewardThreshold();

        console.log(`[Game] Matched groups: ${matches.length}. Removing ${removedCount} gems (explosion-added ${explosionAdded.size}), spawning ${bombsToSpawn.length} bombs and ${plusesToSpawn.length} pluses. +${points} points`);

        // Compute average visual position from initially-removed gems for popup
        const removedList = Array.from(initialRemoved.size > 0 ? initialRemoved : toRemove);
        const avgLocal = removedList.reduce((acc, g) => ({ x: acc.x + (g?.x || 0), y: acc.y + (g?.y || 0) }), { x: 0, y: 0 });
        if (removedList.length > 0) {
            avgLocal.x /= removedList.length;
            avgLocal.y /= removedList.length;
        }

        // Animate removals (use the full toRemove set)
        const toRemoveList = Array.from(toRemove);

            // Play plus visual effects for any queued plus activations
            if (plusesToExplode.size > 0) {
                try { soundController.playLine(); } catch (e) {}
                for (const plus of Array.from(plusesToExplode)) {
                    const px = plus.gridX;
                    const py = plus.gridY;
                    // spawn along row
                    for (let col = 0; col < this.grid.config.cols; col++) {
                        const wp = this.grid.getWorldPosition(py, col);
                        // row is horizontal: rotate 90deg
                        this.spawnPlusEffect({ x: this.grid.x + wp.x, y: this.grid.y + wp.y }, Math.PI / 2);
                    }
                    // spawn along column
                    for (let row = 0; row < this.grid.config.rows; row++) {
                        const wp = this.grid.getWorldPosition(row, px);
                        // column is vertical: no rotation
                        this.spawnPlusEffect({ x: this.grid.x + wp.x, y: this.grid.y + wp.y }, 0);
                    }
                }
            }
            
            // Play bomb visual effects for any queued bomb activations (spawn per-cell bomb anims)
            if (bombsToExplode.size > 0) {
                try { soundController.playX4(); } catch (e) {}
                for (const bomb of Array.from(bombsToExplode)) {
                    const cx = bomb.gridX;
                    const cy = bomb.gridY;
                    for (let r = cy - 1; r <= cy + 1; r++) {
                        for (let c = cx - 1; c <= cx + 1; c++) {
                            if (r < 0 || r >= this.grid.config.rows || c < 0 || c >= this.grid.config.cols) continue;
                            const wpb = this.grid.getWorldPosition(r, c);
                            this.spawnBombEffect({ x: this.grid.x + wpb.x, y: this.grid.y + wpb.y });
                        }
                    }
                }
            }

            // spawn normal hit effects for non-special gems
            let hadNormalHit = false;
            for (const gem of toRemoveList) {
                if ((gem as any).isBomb && (gem as any).isBomb()) continue;
                if ((gem as any).isPlus && (gem as any).isPlus()) continue;
                hadNormalHit = true;
                const wp = this.grid.getWorldPosition(gem.gridY, gem.gridX);
                this.spawnNormalEffect({ x: this.grid.x + wp.x, y: this.grid.y + wp.y });
            }
            if (hadNormalHit) { try { soundController.playNormal(); } catch (e) {} }

            await Promise.all(toRemoveList.map(gem => gsap.to(gem.scale, { x: 0, y: 0, duration: 0.22 })));

        // Remove from grid (this will destroy gem objects)
        if (toRemoveList.length > 0) this.grid.removeGems(toRemoveList);

        // Spawn new bomb gems at recorded positions
        const spawnedBombs: Gem[] = [];
        for (const b of bombsToSpawn) {
            const bombGem = this.grid.createGemAt(b.row, b.col, b.type, 'bomb');
            bombGem.scale.set(1.1);
            spawnedBombs.push(bombGem);
        }

        // Spawn new plus gems at recorded positions
        const spawnedPluses: Gem[] = [];
        for (const p of plusesToSpawn) {
            const plusGem = this.grid.createGemAt(p.row, p.col, p.type, 'plus');
            plusGem.scale.set(1.1);
            spawnedPluses.push(plusGem);
        }

        if (spawnedBombs.length > 0 || spawnedPluses.length > 0) this.attachGemHandlers();

        // If any newly spawned special lies inside the explosion area of an existing
        // bomb/plus that was queued earlier, activate it immediately (chain trigger).
        const triggeredSpawnBombs: Gem[] = [];
        const triggeredSpawnPluses: Gem[] = [];

        if (spawnedBombs.length > 0) {
            for (const sb of spawnedBombs) {
                let triggered = false;
                for (const exb of Array.from(bombsToExplode)) {
                    const dx = Math.abs(sb.gridX - exb.gridX);
                    const dy = Math.abs(sb.gridY - exb.gridY);
                    if (dx <= 1 && dy <= 1) { triggered = true; break; }
                }
                if (!triggered) {
                    for (const exp of Array.from(plusesToExplode)) {
                        if (sb.gridY === exp.gridY || sb.gridX === exp.gridX) { triggered = true; break; }
                    }
                }
                if (triggered) triggeredSpawnBombs.push(sb);
            }
        }

        if (spawnedPluses.length > 0) {
            for (const sp of spawnedPluses) {
                let triggered = false;
                for (const exb of Array.from(bombsToExplode)) {
                    const dx = Math.abs(sp.gridX - exb.gridX);
                    const dy = Math.abs(sp.gridY - exb.gridY);
                    if (dx <= 1 && dy <= 1) { triggered = true; break; }
                }
                if (!triggered) {
                    for (const exp of Array.from(plusesToExplode)) {
                        if (sp.gridY === exp.gridY || sp.gridX === exp.gridX) { triggered = true; break; }
                    }
                }
                if (triggered) triggeredSpawnPluses.push(sp);
            }
        }

        // Process any triggered spawned specials immediately so they chain correctly
        if (triggeredSpawnBombs.length > 0 || triggeredSpawnPluses.length > 0) {
            const seedBombs = triggeredSpawnBombs.map(g => ({ gem: g, radius: 1 }));
            await this.processExplosions(seedBombs, triggeredSpawnPluses);
        }

        // Spawn popup/particles at avgLocal (grid-local -> container)
        const popupPos = { x: this.grid.x + avgLocal.x, y: this.grid.y + avgLocal.y };
        if (toRemoveList.length > 0) this.spawnScorePopup(`+${points}`, popupPos);
        if (toRemoveList.length > 0) this.spawnParticles(popupPos);

        // Apply gravity and fill
        await this.applyGravityAndFill();

        // Check for cascading matches
        const newMatches = this.grid.findMatches();
        if (newMatches.length > 0) {
            console.log('[Game] Cascade detected!');
            await this.processMatches(newMatches);
        }
    }

    private async applyGravityAndFill(): Promise<void> {
        this.state = GameState.FILLING;

        // Apply gravity
        const hasMoved = this.grid.applyGravity();
        
        if (hasMoved) {
            // Animate gems falling
            const gems = this.getAllGems();
            await Promise.all(gems.map(gem => {
                const targetPos = this.grid.getWorldPosition(gem.gridY, gem.gridX);
                return gsap.to(gem, { 
                    x: targetPos.x, 
                    y: targetPos.y, 
                    duration: 0.4,
                    ease: 'bounce.out'
                });
            }));
        }

        // Fill empty spaces
        const newGems = this.grid.fillEmpty();
        
        if (newGems.length > 0) {
            // Animate new gems falling
            await Promise.all(newGems.map(gem => {
                const targetPos = this.grid.getWorldPosition(gem.gridY, gem.gridX);
                return gsap.to(gem, { 
                    y: targetPos.y, 
                    duration: 0.5,
                    ease: 'bounce.out'
                });
            }));
            // Make sure new gems are interactive
            this.attachGemHandlers();
        }
    }

    private getAllGems(): Gem[] {
        const gems: Gem[] = [];
        for (let row = 0; row < this.grid.config.rows; row++) {
            for (let col = 0; col < this.grid.config.cols; col++) {
                const gem = this.grid.getGemAt(row, col);
                if (gem) gems.push(gem);
            }
        }
        return gems;
    }

    private spawnScorePopup(text: string, pos: { x: number; y: number }) {
        const t = new Text({ text, style: { fontSize: 28, fill: 0xffff66, fontWeight: 'bold' } });
        t.anchor.set(0.5);
        t.x = pos.x; t.y = pos.y;
        this.container.addChild(t);
        gsap.to(t, { y: pos.y - 40, alpha: 0, duration: 0.9, onComplete: () => t.destroy() });
    }

    private spawnParticles(pos: { x: number; y: number }) {
        const particleCount = 12;
        const parent = new Container();
        parent.x = pos.x; parent.y = pos.y;
        this.container.addChild(parent);

        for (let i = 0; i < particleCount; i++) {
            const g = new Graphics();
            const color = Math.floor(0xffffff * Math.random());
            const radius = 4 + Math.random() * 4;
            g.fill({ color, alpha: 1 }).circle(0, 0, radius);
            parent.addChild(g);

            const angle = (Math.PI * 2) * (i / particleCount);
            const dist = 20 + Math.random() * 40;
            gsap.to(g, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, alpha: 0, duration: 0.6, onComplete: () => g.destroy() });
        }

        gsap.to(parent, { alpha: 0, duration: 0.7, onComplete: () => parent.destroy() });
    }

    /**
     * Explode a bomb gem: destroy all gems in 1-cell radius around the bomb (including bomb)
     */
    private async explodeAt(bombGem: Gem, radius = 1): Promise<void> {
        if (!bombGem) return;
        // Delegate to shared explosion processor so chained specials activate
        const result = await this.processExplosions([{ gem: bombGem, radius }], []);
        // popup at center
        const wp = this.grid.getWorldPosition(bombGem.gridY, bombGem.gridX);
        const popupPos = { x: this.grid.x + wp.x, y: this.grid.y + wp.y };
        if (result.removed.length > 0) this.spawnScorePopup(`+${result.points}`, popupPos);
        if (result.removed.length > 0) this.spawnParticles(popupPos);
    }

    /**
     * Shared explosion processing that expands chained bombs and pluses.
     * Seeds: initial bombs (with radius) and plus gems.
     * Returns removed gems and points awarded.
     */
    private async processExplosions(seedBombs: Array<{ gem: Gem; radius: number }>, seedPluses: Gem[]): Promise<{ removed: Gem[]; points: number }> {
        const toRemove = new Set<Gem>();
        const bombsQueue: Array<{ gem: Gem; radius: number }> = [];
        const plusQueue: Gem[] = [];
        const bombsProcessed = new Set<Gem>();
        const plusesProcessed = new Set<Gem>();

        // seed
        for (const b of seedBombs) bombsQueue.push(b);
        for (const p of seedPluses) plusQueue.push(p);

        while (bombsQueue.length > 0 || plusQueue.length > 0) {
            if (bombsQueue.length > 0) {
                const item = bombsQueue.shift()!;
                const bomb = item.gem;
                const radius = item.radius || 1;
                if (bombsProcessed.has(bomb)) continue;
                bombsProcessed.add(bomb);

                try { soundController.playX4(); } catch (e) {}

                const cx = bomb.gridX;
                const cy = bomb.gridY;

                // spawn visual for this bomb (3x3)
                for (let r = cy - radius; r <= cy + radius; r++) {
                    for (let c = cx - radius; c <= cx + radius; c++) {
                        if (r < 0 || r >= this.grid.config.rows || c < 0 || c >= this.grid.config.cols) continue;
                        const g = this.grid.getGemAt(r, c);
                        if (g && !toRemove.has(g)) {
                            toRemove.add(g);
                            // spawn normal effect for non-special gems
                            if (!((g as any).isBomb && (g as any).isBomb()) && !((g as any).isPlus && (g as any).isPlus())) {
                                const wp = this.grid.getWorldPosition(g.gridY, g.gridX);
                                this.spawnNormalEffect({ x: this.grid.x + wp.x, y: this.grid.y + wp.y });
                            }
                            // if special, queue them to process as well
                            if ((g as any).isBomb && (g as any).isBomb() && !bombsProcessed.has(g)) bombsQueue.push({ gem: g, radius: 1 });
                            if ((g as any).isPlus && (g as any).isPlus() && !plusesProcessed.has(g)) plusQueue.push(g);
                        }
                        // spawn bomb visual at each affected cell
                        const wpb = this.grid.getWorldPosition(r, c);
                        this.spawnBombEffect({ x: this.grid.x + wpb.x, y: this.grid.y + wpb.y });
                    }
                }
            } else {
                const plus = plusQueue.shift()!;
                if (plusesProcessed.has(plus)) continue;
                plusesProcessed.add(plus);
                try { soundController.playLine(); } catch (e) {}

                const cx = plus.gridX;
                const cy = plus.gridY;

                // full row
                for (let col = 0; col < this.grid.config.cols; col++) {
                    const g = this.grid.getGemAt(cy, col);
                    if (g && !toRemove.has(g)) {
                        toRemove.add(g);
                        // spawn normal effect for non-special gems
                        if (!((g as any).isBomb && (g as any).isBomb()) && !((g as any).isPlus && (g as any).isPlus())) {
                            const wp = this.grid.getWorldPosition(g.gridY, g.gridX);
                            this.spawnNormalEffect({ x: this.grid.x + wp.x, y: this.grid.y + wp.y });
                        }
                        if ((g as any).isBomb && (g as any).isBomb() && !bombsProcessed.has(g)) bombsQueue.push({ gem: g, radius: 1 });
                        if ((g as any).isPlus && (g as any).isPlus() && !plusesProcessed.has(g)) plusQueue.push(g);
                    }
                    const wp = this.grid.getWorldPosition(cy, col);
                    this.spawnPlusEffect({ x: this.grid.x + wp.x, y: this.grid.y + wp.y }, Math.PI / 2);
                }
                // full column
                for (let row = 0; row < this.grid.config.rows; row++) {
                    const g = this.grid.getGemAt(row, cx);
                    if (g && !toRemove.has(g)) {
                        toRemove.add(g);
                        if ((g as any).isBomb && (g as any).isBomb() && !bombsProcessed.has(g)) bombsQueue.push({ gem: g, radius: 1 });
                        if ((g as any).isPlus && (g as any).isPlus() && !plusesProcessed.has(g)) plusQueue.push(g);
                    }
                    const wp = this.grid.getWorldPosition(row, cx);
                    this.spawnPlusEffect({ x: this.grid.x + wp.x, y: this.grid.y + wp.y }, 0);
                }
            }
        }

        // Animate removals
        const removedList = Array.from(toRemove);
        if (removedList.length === 0) return { removed: [], points: 0 };
        const points = removedList.length * 20;
        this.score += points;
        this.scoreText.text = `Score: ${this.score}`;

        // if there are any normal (non-special) gems removed, play normal sound
        const hasNormalRemoved = removedList.some(g => !((g as any).isBomb && (g as any).isBomb()) && !((g as any).isPlus && (g as any).isPlus()));
        if (hasNormalRemoved) { try { soundController.playNormal(); } catch (e) {} }

        await Promise.all(removedList.map(g => gsap.to(g.scale, { x: 0, y: 0, duration: 0.22 })));
        this.grid.removeGems(removedList);

        return { removed: removedList, points };
    }

    private spawnBombEffect(pos: { x: number; y: number }) {
        try {
            const frames = AssetManager.getBombFrames();
            console.log('[Game] spawnBombEffect frames:', frames?.length, 'pos:', pos);
            if (!frames || frames.length === 0) {
                // fallback: show particles so user sees something
                this.spawnParticles(pos);
                return;
            }
            const anim = new AnimatedSprite(frames as unknown as Texture[]);
            anim.animationSpeed = 0.7;
            anim.loop = false;
            anim.anchor.set(0.5);
            anim.scale.set(0.8);
            anim.x = pos.x; anim.y = pos.y;
            // add to UI container so effect renders above grid gems
            (this.uiContainer || this.container).addChild(anim);
            anim.play();
            // destroy when animation completes
            try {
                anim.onComplete = () => {
                    try { anim.destroy(); } catch (e) {}
                };
            } catch (e) {
                // fallback to timed destroy if onComplete not supported
                const approxMs = (frames.length / 24) * 1000 / Math.max(anim.animationSpeed, 0.0001);
                setTimeout(() => { try { anim.destroy(); } catch (e) {} }, approxMs + 120);
            }
        } catch (e) {
            console.warn('[Game] spawnBombEffect failed', e);
            this.spawnParticles(pos);
        }
    }

    private async explodePlusAt(plusGem: Gem): Promise<void> {
        if (!plusGem) return;
        try { soundController.playLine(); } catch (e) {}
        const cx = plusGem.gridX;
        const cy = plusGem.gridY;

        const toExplode: Gem[] = [];
        // full row
        for (let col = 0; col < this.grid.config.cols; col++) {
            const g = this.grid.getGemAt(cy, col);
            if (g) toExplode.push(g);
        }
        // full column
        for (let row = 0; row < this.grid.config.rows; row++) {
            const g = this.grid.getGemAt(row, cx);
            if (g) toExplode.push(g);
        }

        if (toExplode.length === 0) return;

        const unique = Array.from(new Set(toExplode));

        // Play plus effect on each affected cell before removal
        for (const g of unique) {
            const wp = this.grid.getWorldPosition(g.gridY, g.gridX);
            const globalPos = { x: this.grid.x + wp.x, y: this.grid.y + wp.y };
            // determine orientation: if gem shares same row -> horizontal (rotate), if shares same col -> vertical
            let rot = 0;
            if (g.gridY === cy && g.gridX !== cx) rot = Math.PI / 2; // same row
            else rot = 0; // same col or center
            this.spawnPlusEffect(globalPos, rot);
        }

        const points = unique.length * 20;
        this.score += points;
        this.scoreText.text = `Score: ${this.score}`;

        const wp = this.grid.getWorldPosition(cy, cx);
        const popupPos = { x: this.grid.x + wp.x, y: this.grid.y + wp.y };

        await Promise.all(unique.map(g => gsap.to(g.scale, { x: 0, y: 0, duration: 0.22 })));

        this.grid.removeGems(unique);

        this.spawnScorePopup(`+${points}`, popupPos);
        this.spawnParticles(popupPos);
    }

    private spawnPlusEffect(pos: { x: number; y: number }, rotation = 0) {
        try {
            const frames = AssetManager.getPlusFrames();
            if (!frames || frames.length === 0) return;
            const anim = new AnimatedSprite(frames as unknown as Texture[]);
            anim.animationSpeed = 0.6;
            anim.loop = false;
            anim.anchor.set(0.5);
            anim.rotation = rotation;
            // enlarge plus effect by 30%
            anim.scale.set(1.5);
            anim.x = pos.x; anim.y = pos.y;
            // add to UI container so effect renders above grid gems
            (this.uiContainer || this.container).addChild(anim);
            anim.play();
            anim.onComplete = () => anim.destroy();
        } catch (e) {
            // ignore effect errors
        }
    }

    private spawnNormalEffect(pos: { x: number; y: number }) {
        try {
            const frames = AssetManager.getNormalFrames();
            if (!frames || frames.length === 0) return;
            const anim = new AnimatedSprite(frames as unknown as Texture[]);
            anim.animationSpeed = 0.9;
            anim.loop = false;
            anim.anchor.set(0.5);
            anim.scale.set(1.0);
            anim.x = pos.x; anim.y = pos.y;
            (this.uiContainer || this.container).addChild(anim);
            anim.play();
            anim.onComplete = () => anim.destroy();
        } catch (e) {
            // ignore
        }
    }

    private async clearBoard(): Promise<void> {
        const all = this.getAllGems();
        if (all.length === 0) return;
        const points = all.length * 50; // big reward
        this.score += points;
        this.scoreText.text = `Score: ${this.score}`;

        // center popup
        const popupPos = { x: 0, y: 0 };
        await Promise.all(all.map(g => gsap.to(g.scale, { x: 0, y: 0, duration: 0.28 })));
        this.grid.removeGems(all);
        this.spawnScorePopup(`+${points}`, popupPos);
        this.spawnParticles(popupPos);
    }
}
