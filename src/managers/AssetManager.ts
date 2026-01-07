// src/managers/AssetManager.ts - Centralized asset loading for Pixi v8
import { Assets, Texture } from 'pixi.js';
// If generated, embedded-assets exports a map of 'assets/..' -> dataURI strings
import embeddedAssets from '../embedded-assets';
const EMBEDDED_ASSETS: Record<string, string> = (embeddedAssets as unknown) as Record<string, string>;

function resolveSrc(src: string) {
    if (!src) return src;
    if (EMBEDDED_ASSETS && EMBEDDED_ASSETS[src]) return EMBEDDED_ASSETS[src];
    // Some code might provide paths without leading 'assets/'
    const alt = src.replace(/^\/*/, 'assets/');
    return EMBEDDED_ASSETS && EMBEDDED_ASSETS[alt] ? EMBEDDED_ASSETS[alt] : src;
}

export class AssetManager {
    private static textures: Map<string, Texture> = new Map();

    static async loadAssets(): Promise<void> {
        // Define asset manifest
        const manifest = {
            bundles: [
                {
                    name: 'gems',
                    assets: [
                        { alias: 'gem_red', src: 'assets/Arts/Textures/elements/Icon_Dot.png' },
                        { alias: 'gem_blue', src: 'assets/Arts/Textures/elements/Icon_Game.png' },
                        { alias: 'gem_green', src: 'assets/Arts/Textures/elements/Icon_Halo.png' },
                        { alias: 'gem_yellow', src: 'assets/Arts/Textures/elements/Icon_Money.png' },
                        { alias: 'gem_purple', src: 'assets/Arts/Textures/elements/Icon_Phone.png' },
                        { alias: 'gem_orange', src: 'assets/Arts/Textures/elements/Icon_Shop.png' },
                        { alias: 'Items_Dot_x1', src: 'assets/Arts/Textures/elements/Items_Dot_x1.png' },
                        { alias: 'Items_Game_x1', src: 'assets/Arts/Textures/elements/Items_Game_x1.png' },
                        { alias: 'Items_Halo_x1', src: 'assets/Arts/Textures/elements/Items_Halo_x1.png' },
                        { alias: 'Items_Money_x1', src: 'assets/Arts/Textures/elements/Items_Money_x1.png' },
                        { alias: 'Items_Phone_x1', src: 'assets/Arts/Textures/elements/Items_Phone_x1.png' },
                        { alias: 'Items_Shop_x1', src: 'assets/Arts/Textures/elements/Items_Shop_x1.png' },
                        { alias: 'Items_Money_x2', src: 'assets/Arts/Textures/elements/Items_Money_x2.png' },
                        { alias: 'Items_Dot_x2', src: 'assets/Arts/Textures/elements/Items_Dot_x2.png' },
                        { alias: 'Items_Game_x2', src: 'assets/Arts/Textures/elements/Items_Game_x2.png' },
                        { alias: 'Items_Halo_x2', src: 'assets/Arts/Textures/elements/Items_Halo_x2.png' },
                        { alias: 'Items_Phone_x2', src: 'assets/Arts/Textures/elements/Items_Phone_x2.png' },
                        { alias: 'Items_Shop_x2', src: 'assets/Arts/Textures/elements/Items_Shop_x2.png' },
                        { alias: 'Items_Money_x3', src: 'assets/Arts/Textures/elements/Items_Money_x3.png' },
                        { alias: 'Items_Money_x4', src: 'assets/Arts/Textures/elements/Items_Money_x4.png' },
                        // Plus effect frames (thanhDai sequence)
                        { alias: 'X1_FN_thanhDai_00006', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00006.png' },
                        { alias: 'X1_FN_thanhDai_00007', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00007.png' },
                        { alias: 'X1_FN_thanhDai_00008', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00008.png' },
                        { alias: 'X1_FN_thanhDai_00009', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00009.png' },
                        { alias: 'X1_FN_thanhDai_00010', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00010.png' },
                        { alias: 'X1_FN_thanhDai_00011', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00011.png' },
                        { alias: 'X1_FN_thanhDai_00012', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00012.png' },
                        { alias: 'X1_FN_thanhDai_00013', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00013.png' },
                        { alias: 'X1_FN_thanhDai_00014', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00014.png' },
                        { alias: 'X1_FN_thanhDai_00015', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00015.png' },
                        { alias: 'X1_FN_thanhDai_00016', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00016.png' },
                        { alias: 'X1_FN_thanhDai_00017', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00017.png' },
                        { alias: 'X1_FN_thanhDai_00018', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00018.png' },
                        { alias: 'X1_FN_thanhDai_00019', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00019.png' },
                        { alias: 'X1_FN_thanhDai_00020', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00020.png' },
                        { alias: 'X1_FN_thanhDai_00021', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00021.png' },
                        { alias: 'X1_FN_thanhDai_00022', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00022.png' },
                        { alias: 'X1_FN_thanhDai_00023', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00023.png' },
                        { alias: 'X1_FN_thanhDai_00024', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00024.png' },
                        { alias: 'X1_FN_thanhDai_00025', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00025.png' },
                        { alias: 'X1_FN_thanhDai_00026', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00026.png' },
                        { alias: 'X1_FN_thanhDai_00027', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00027.png' },
                        { alias: 'X1_FN_thanhDai_00028', src: 'assets/Arts/Textures/effects/X1+ X3_FN thanhDai/X1_FN thanhDai_00028.png' },
                        // Bomb effect frames (X4 sequence used for bomb)
                        { alias: 'X4_FN_00003', src: 'assets/Arts/Textures/effects/X4/X4_FN_00003.png' },
                        { alias: 'X4_FN_00004', src: 'assets/Arts/Textures/effects/X4/X4_FN_00004.png' },
                        { alias: 'X4_FN_00005', src: 'assets/Arts/Textures/effects/X4/X4_FN_00005.png' },
                        { alias: 'X4_FN_00006', src: 'assets/Arts/Textures/effects/X4/X4_FN_00006.png' },
                        { alias: 'X4_FN_00007', src: 'assets/Arts/Textures/effects/X4/X4_FN_00007.png' },
                        { alias: 'X4_FN_00008', src: 'assets/Arts/Textures/effects/X4/X4_FN_00008.png' },
                        { alias: 'X4_FN_00009', src: 'assets/Arts/Textures/effects/X4/X4_FN_00009.png' },
                        { alias: 'X4_FN_00010', src: 'assets/Arts/Textures/effects/X4/X4_FN_00010.png' },
                        { alias: 'X4_FN_00011', src: 'assets/Arts/Textures/effects/X4/X4_FN_00011.png' },
                        { alias: 'X4_FN_00012', src: 'assets/Arts/Textures/effects/X4/X4_FN_00012.png' },
                        { alias: 'X4_FN_00013', src: 'assets/Arts/Textures/effects/X4/X4_FN_00013.png' },
                        { alias: 'X4_FN_00014', src: 'assets/Arts/Textures/effects/X4/X4_FN_00014.png' },
                        { alias: 'X4_FN_00015', src: 'assets/Arts/Textures/effects/X4/X4_FN_00015.png' },
                        { alias: 'X4_FN_00016', src: 'assets/Arts/Textures/effects/X4/X4_FN_00016.png' },
                        { alias: 'X4_FN_00017', src: 'assets/Arts/Textures/effects/X4/X4_FN_00017.png' },
                        { alias: 'X4_FN_00018', src: 'assets/Arts/Textures/effects/X4/X4_FN_00018.png' },
                        { alias: 'X4_FN_00019', src: 'assets/Arts/Textures/effects/X4/X4_FN_00019.png' },
                        { alias: 'X4_FN_00020', src: 'assets/Arts/Textures/effects/X4/X4_FN_00020.png' },
                        { alias: 'X4_FN_00021', src: 'assets/Arts/Textures/effects/X4/X4_FN_00021.png' },
                        { alias: 'X4_FN_00022', src: 'assets/Arts/Textures/effects/X4/X4_FN_00022.png' },
                        // Normal hit frames (Nornal sequence)
                        { alias: 'Nornal+FN_00001', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00001.png' },
                        { alias: 'Nornal+FN_00002', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00002.png' },
                        { alias: 'Nornal+FN_00003', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00003.png' },
                        { alias: 'Nornal+FN_00004', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00004.png' },
                        { alias: 'Nornal+FN_00005', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00005.png' },
                        { alias: 'Nornal+FN_00006', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00006.png' },
                        { alias: 'Nornal+FN_00007', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00007.png' },
                        { alias: 'Nornal+FN_00008', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00008.png' },
                        { alias: 'Nornal+FN_00009', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00009.png' },
                        { alias: 'Nornal+FN_00010', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00010.png' },
                        { alias: 'Nornal+FN_00011', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00011.png' },
                        { alias: 'Nornal+FN_00012', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00012.png' },
                        { alias: 'Nornal+FN_00013', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00013.png' },
                        { alias: 'Nornal+FN_00014', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00014.png' },
                        { alias: 'Nornal+FN_00015', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00015.png' },
                        { alias: 'Nornal+FN_00016', src: 'assets/Arts/Textures/effects/Nornal/Nornal+FN_00016.png' },
                    ]
                },
                {
                    name: 'ui',
                    assets: [
                        { alias: 'bg', src: 'assets/Arts/Textures/BG.png' },
                        // new design assets for reward popup
                        { alias: 'happy_bg', src: 'assets/Arts/Textures/new_design/happy.png' },
                        { alias: 'button_2', src: 'assets/Arts/Textures/new_design/button_2.png' },
                    ]
                }
            ]
        };

        // Replace manifest src entries with embedded data-URIs when available
        for (const bundle of manifest.bundles) {
            for (const a of bundle.assets) {
                a.src = resolveSrc(a.src as string) as string;
            }
        }

        // Initialize asset loader
        await Assets.init({ manifest });

        // Load bundles
        await Assets.loadBundle('gems');
        await Assets.loadBundle('ui');

        // Cache textures
        this.textures.set('gem_red', Assets.get('gem_red'));
        this.textures.set('gem_blue', Assets.get('gem_blue'));
        this.textures.set('gem_green', Assets.get('gem_green'));
        this.textures.set('gem_yellow', Assets.get('gem_yellow'));
        this.textures.set('gem_purple', Assets.get('gem_purple'));
        this.textures.set('gem_orange', Assets.get('gem_orange'));
        // Item overlays (x1 for each gem type)
        this.textures.set('Items_Dot_x1', Assets.get('Items_Dot_x1'));
        this.textures.set('Items_Game_x1', Assets.get('Items_Game_x1'));
        this.textures.set('Items_Halo_x1', Assets.get('Items_Halo_x1'));
        this.textures.set('Items_Money_x1', Assets.get('Items_Money_x1'));
        this.textures.set('Items_Phone_x1', Assets.get('Items_Phone_x1'));
        this.textures.set('Items_Shop_x1', Assets.get('Items_Shop_x1'));
        // keep extra money variants cached
        this.textures.set('Items_Money_x2', Assets.get('Items_Money_x2'));
        // plus effect frames cache
        const plusFrames: string[] = [
            'X1_FN_thanhDai_00006','X1_FN_thanhDai_00007','X1_FN_thanhDai_00008','X1_FN_thanhDai_00009','X1_FN_thanhDai_00010',
            'X1_FN_thanhDai_00011','X1_FN_thanhDai_00012','X1_FN_thanhDai_00013','X1_FN_thanhDai_00014','X1_FN_thanhDai_00015',
            'X1_FN_thanhDai_00016','X1_FN_thanhDai_00017','X1_FN_thanhDai_00018','X1_FN_thanhDai_00019','X1_FN_thanhDai_00020',
            'X1_FN_thanhDai_00021','X1_FN_thanhDai_00022','X1_FN_thanhDai_00023','X1_FN_thanhDai_00024','X1_FN_thanhDai_00025','X1_FN_thanhDai_00026','X1_FN_thanhDai_00027','X1_FN_thanhDai_00028'
        ];
        // cache each plus frame texture and store order
        for (const alias of plusFrames) {
            this.textures.set(alias, Assets.get(alias));
        }
        this.textures.set('__plus_frames_order__', (plusFrames as unknown) as any);

        // Bomb frames (X4) cache list
        const bombFrames = [
            'X4_FN_00003','X4_FN_00004','X4_FN_00005','X4_FN_00006','X4_FN_00007','X4_FN_00008','X4_FN_00009','X4_FN_00010',
            'X4_FN_00011','X4_FN_00012','X4_FN_00013','X4_FN_00014','X4_FN_00015','X4_FN_00016','X4_FN_00017','X4_FN_00018',
            'X4_FN_00019','X4_FN_00020','X4_FN_00021','X4_FN_00022'
        ];
        for (const a of bombFrames) this.textures.set(a, Assets.get(a));
        this.textures.set('__bomb_frames_order__', (bombFrames as unknown) as any);
        // Normal hit frames cache list
        const normalFrames = [
            'Nornal+FN_00001','Nornal+FN_00002','Nornal+FN_00003','Nornal+FN_00004','Nornal+FN_00005','Nornal+FN_00006','Nornal+FN_00007','Nornal+FN_00008',
            'Nornal+FN_00009','Nornal+FN_00010','Nornal+FN_00011','Nornal+FN_00012','Nornal+FN_00013','Nornal+FN_00014','Nornal+FN_00015','Nornal+FN_00016'
        ];
        for (const a of normalFrames) this.textures.set(a, Assets.get(a));
        this.textures.set('__normal_frames_order__', (normalFrames as unknown) as any);
        // x2 variants for each type
        this.textures.set('Items_Dot_x2', Assets.get('Items_Dot_x2'));
        this.textures.set('Items_Game_x2', Assets.get('Items_Game_x2'));
        this.textures.set('Items_Halo_x2', Assets.get('Items_Halo_x2'));
        this.textures.set('Items_Phone_x2', Assets.get('Items_Phone_x2'));
        this.textures.set('Items_Shop_x2', Assets.get('Items_Shop_x2'));
        this.textures.set('Items_Money_x3', Assets.get('Items_Money_x3'));
        this.textures.set('Items_Money_x4', Assets.get('Items_Money_x4'));
        this.textures.set('bg', Assets.get('bg'));
        // cache new design assets
        try {
            this.textures.set('happy_bg', Assets.get('happy_bg'));
            this.textures.set('button_2', Assets.get('button_2'));
        } catch (e) {
            // ignore if assets not present in bundle
        }
    }

    static getTexture(alias: string): Texture {
        const texture = this.textures.get(alias);
        if (!texture) {
            console.warn(`Texture not found: ${alias}`);
            return Texture.WHITE;
        }
        return texture;
    }

    static getGemTexture(type: number): Texture {
        const gemNames = ['gem_red', 'gem_blue', 'gem_green', 'gem_yellow', 'gem_purple', 'gem_orange'];
        return this.getTexture(gemNames[type] || 'gem_red');
    }

    static getBombOverlayForType(type: number): Texture {
        // Map gem type to a bomb overlay asset (x1 variant for each type)
        switch (type) {
            case 0: return this.getTexture('Items_Dot_x1');
            case 1: return this.getTexture('Items_Game_x1');
            case 2: return this.getTexture('Items_Halo_x1');
            case 3: return this.getTexture('Items_Money_x1');
            case 4: return this.getTexture('Items_Phone_x1');
            case 5: return this.getTexture('Items_Shop_x1');
            default: return this.getGemTexture(type);
        }
    }

    static getPlusOverlayForType(type: number): Texture {
        // Map gem type to the x2 overlay asset for 'plus' special
        switch (type) {
            case 0: return this.getTexture('Items_Dot_x2');
            case 1: return this.getTexture('Items_Game_x2');
            case 2: return this.getTexture('Items_Halo_x2');
            case 3: return this.getTexture('Items_Money_x2');
            case 4: return this.getTexture('Items_Phone_x2');
            case 5: return this.getTexture('Items_Shop_x2');
            default: return this.getGemTexture(type);
        }
    }

    static getPlusFrames(): Texture[] {
        // read stored order
        const order = (this.textures.get('__plus_frames_order__') as unknown) as string[] | undefined;
        if (!order || !Array.isArray(order)) return [];
        return order.map(alias => this.getTexture(alias));
    }

    static getBombFrames(): Texture[] {
        const order = (this.textures.get('__bomb_frames_order__') as unknown) as string[] | undefined;
        if (!order || !Array.isArray(order)) return [];
        return order.map(alias => this.getTexture(alias));
    }

    static getNormalFrames(): Texture[] {
        const order = (this.textures.get('__normal_frames_order__') as unknown) as string[] | undefined;
        if (!order || !Array.isArray(order)) return [];
        return order.map(alias => this.getTexture(alias));
    }
}
