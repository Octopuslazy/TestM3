// // main.ts
// import { Application, Assets, Text, Container, Sprite, Texture, Graphics, TextStyle } from 'pixi.js';
// import gsap from 'gsap';
// import { PixiPlugin } from 'gsap/PixiPlugin';

// // --- Imports: Managers ---
// import { MM } from './Scripts/Managers/MapManager.ts';
// import { GM } from './Scripts/Managers/GameManager.ts';
// import { EM } from './Scripts/Managers/ElementManager.ts';
// import { SC, AudioData } from './Scripts/Managers/SoundController.ts';

// // --- Imports: Controllers ---
// import { SplashController } from './Scripts/Modules/Splash/SplashController';
// import { MapController, MapUIComponents } from './Scripts/Modules/Map/MapController';
// import { GameController } from './Scripts/Modules/Game/GameController';
// import { UIGameController, GameUIComponents } from './Scripts/Modules/Game/UIGameController';

// // --- Imports: Game Objects & Popups ---
// import { ElementType } from './Scripts/Modules/Game/Element';
// import { PopupBase } from './Scripts/Modules/Popups/PopupBase';
// import { RankController } from './Scripts/Modules/Ranking/RankController';
// import { ItemRank } from './Scripts/Modules/Ranking/ItemRank';
// import { MapLevelItem } from './Scripts/Modules/Map/MapLevelItem';

// // --- Imports: Utils & Constants ---
// import { loadGameAssets, loadAudioAssets } from './Scripts/Utils/AssetLoader';
// import { SceneName } from './Scripts/Constants/Constants';
// import './Scripts/Utils/Utils'; // Đăng ký prototype extensions

// // --- Setup GSAP ---
// gsap.registerPlugin(PixiPlugin);
// PixiPlugin.registerPIXI({ Application, Container, Sprite, Text, Texture, Graphics });

// // --- 1. INIT PIXI APPLICATION ---
// const app = new Application();
// window.__PIXI_APP__ = app; // Enable Pixi DevTools

// async function initGame() {
//     await app.init({
//         resizeTo: window,
//         resolution: window.devicePixelRatio || 1,
//         autoDensity: true,
//         backgroundColor: 0x232323,
//         preference: 'webgl', // Khắc phục lỗi ClassRef trên một số môi trường
//     });
//     document.body.appendChild(app.canvas);

//     // Loading Text
//     const loadingText = new Text({ text: 'LOADING ASSETS...', style: { fill: 0xffffff, fontSize: 24 } });
//     loadingText.anchor.set(0.5);
//     loadingText.position.set(app.screen.width / 2, app.screen.height / 2);
//     app.stage.addChild(loadingText);

//     // --- 2. LOAD ASSETS ---
//     try {
//         // Tải toàn bộ tài nguyên từ AssetLoader
//         await loadGameAssets();
        
//         // Load audio assets manually
//         const audioAssets = loadAudioAssets();
//         window.audioAssets = audioAssets;
        
//         app.stage.removeChild(loadingText);
        
//         // Khởi tạo các Manager sau khi có Asset
//         initializeManagers();
        
//         // Bắt đầu Game Flow
//         startGameFlow();
//     } catch (e) {
//         loadingText.text = "LOAD ERROR: " + e;
//         console.error(e);
//     }
// }

// // --- 3. INITIALIZE MANAGERS ---
// function initializeManagers() {
//     console.log("[Main] Initializing Managers...");

//     // A. Map Manager
//     const mapConfig = Assets.get('map_config');
//     if (mapConfig) {
//         MM.assetMapData = { text: mapConfig }; // Giả lập TextAsset
//         MM.initMapData();
//     } else {
//         console.warn("[Main] Map config not found!");
//     }

//     // B. Element Manager
//     EM.init();
    
//     // Ánh xạ Texture cho tất cả elements
//     console.log('[Main] Loading element textures...');
//     // ElementType: ELE_1=0, ELE_2=1, ..., ELE_7=6
//     const textureTests = [];
//     if (Assets.get('ele_1_base')) { EM.elementSprites[ElementType.ELE_1] = Assets.get('ele_1_base'); console.log('[Main] ✓ Loaded ele_1_base'); textureTests.push(1); } else { console.error('[Main] ✗ FAILED to load ele_1_base'); }
//     if (Assets.get('ele_2_base')) { EM.elementSprites[ElementType.ELE_2] = Assets.get('ele_2_base'); console.log('[Main] ✓ Loaded ele_2_base'); textureTests.push(2); } else { console.error('[Main] ✗ FAILED to load ele_2_base'); }
//     if (Assets.get('ele_3_base')) { EM.elementSprites[ElementType.ELE_3] = Assets.get('ele_3_base'); console.log('[Main] ✓ Loaded ele_3_base'); textureTests.push(3); } else { console.error('[Main] ✗ FAILED to load ele_3_base'); }
//     if (Assets.get('ele_4_base')) { EM.elementSprites[ElementType.ELE_4] = Assets.get('ele_4_base'); console.log('[Main] ✓ Loaded ele_4_base'); textureTests.push(4); } else { console.error('[Main] ✗ FAILED to load ele_4_base'); }
//     if (Assets.get('ele_5_base')) { EM.elementSprites[ElementType.ELE_5] = Assets.get('ele_5_base'); console.log('[Main] ✓ Loaded ele_5_base'); textureTests.push(5); } else { console.error('[Main] ✗ FAILED to load ele_5_base'); }
//     if (Assets.get('ele_6_base')) { EM.elementSprites[ElementType.ELE_6] = Assets.get('ele_6_base'); console.log('[Main] ✓ Loaded ele_6_base'); textureTests.push(6); } else { console.error('[Main] ✗ FAILED to load ele_6_base'); }
//     if (Assets.get('ele_7_base')) { EM.elementSprites[ElementType.ELE_7] = Assets.get('ele_7_base'); console.log('[Main] ✓ Loaded ele_7_base'); textureTests.push(7); } else { console.warn('[Main] ⚠ ele_7_base not found (optional)'); }
    
//     console.log(`[Main] Texture test complete: ${textureTests.length}/7 loaded`, textureTests);
//     console.log('[Main] EM.elementSprites array:', EM.elementSprites.map((t, i) => `${i}:${t ? 'OK' : 'NULL'}`));
    
//     // Super Effects x1
//     if (Assets.get('ele_1_x1')) EM.elementX1Sprites[ElementType.ELE_1] = Assets.get('ele_1_x1');
//     if (Assets.get('ele_2_x1')) EM.elementX1Sprites[ElementType.ELE_2] = Assets.get('ele_2_x1');
//     if (Assets.get('ele_3_x1')) EM.elementX1Sprites[ElementType.ELE_3] = Assets.get('ele_3_x1');
//     if (Assets.get('ele_4_x1')) EM.elementX1Sprites[ElementType.ELE_4] = Assets.get('ele_4_x1');
//     if (Assets.get('ele_5_x1')) EM.elementX1Sprites[ElementType.ELE_5] = Assets.get('ele_5_x1');
//     if (Assets.get('ele_6_x1')) EM.elementX1Sprites[ElementType.ELE_6] = Assets.get('ele_6_x1');
//     if (Assets.get('ele_7_x1')) EM.elementX1Sprites[ElementType.ELE_7] = Assets.get('ele_7_x1');
    
//     // Super Effects x2
//     if (Assets.get('ele_1_x2')) EM.elementX2Sprites[ElementType.ELE_1] = Assets.get('ele_1_x2');
//     if (Assets.get('ele_2_x2')) EM.elementX2Sprites[ElementType.ELE_2] = Assets.get('ele_2_x2');
//     if (Assets.get('ele_3_x2')) EM.elementX2Sprites[ElementType.ELE_3] = Assets.get('ele_3_x2');
//     if (Assets.get('ele_4_x2')) EM.elementX2Sprites[ElementType.ELE_4] = Assets.get('ele_4_x2');
//     if (Assets.get('ele_5_x2')) EM.elementX2Sprites[ElementType.ELE_5] = Assets.get('ele_5_x2');
//     if (Assets.get('ele_6_x2')) EM.elementX2Sprites[ElementType.ELE_6] = Assets.get('ele_6_x2');
//     if (Assets.get('ele_7_x2')) EM.elementX2Sprites[ElementType.ELE_7] = Assets.get('ele_7_x2');

//     // C. Sound Controller
//     const audioAssets = window.audioAssets || {};
    
//     const bgClip = new AudioData();
//     bgClip.name = "bg";
//     bgClip.clip = audioAssets['bg_music'] || null;

//     const sfxBtn = new AudioData();
//     sfxBtn.name = "button";
//     sfxBtn.clip = audioAssets['sfx_button'] || null;
    
//     const sfxSwap = new AudioData();
//     sfxSwap.name = "swap";
//     sfxSwap.clip = audioAssets['sfx_swap'] || null;

//     // Khởi tạo SC (SoundController đã được sửa lỗi singleton)
//     if (bgClip.clip && sfxBtn.clip && sfxSwap.clip) {
//         SC.init([sfxBtn, sfxSwap], bgClip);
//     } else {
//         console.warn('Some audio assets not loaded:', { 
//             bg: !!bgClip.clip, 
//             button: !!sfxBtn.clip, 
//             swap: !!sfxSwap.clip 
//         });
//     }
// }

// // --- 4. SCENE FLOW & UI MOCKUP ---
// let currentScene: Container | null = null;

// function startGameFlow() {
//     // Background chung (nếu có)
//     let bg: Sprite;
//     try {
//         bg = Sprite.from('bg'); // Alias từ AssetLoader
//     } catch {
//         bg = new Sprite(Texture.WHITE);
//         bg.tint = 0x333333;
//     }
//     bg.anchor.set(0.5);
//     bg.x = app.screen.width / 2;
//     bg.y = app.screen.height / 2;
//     // Cover screen
//     const scale = Math.max(app.screen.width / bg.width, app.screen.height / bg.height);
//     bg.scale.set(scale);
//     app.stage.addChildAt(bg, 0);

//     // Bắt đầu vào Splash
//     loadScene(SceneName.SPLASH);
// }

// // Hàm chuyển cảnh (Global)
// function loadScene(sceneName: string) {
//     // Dọn dẹp cảnh cũ
//     if (currentScene) {
//         app.stage.removeChild(currentScene);
//         // Lưu ý: destroy({children: true}) sẽ xóa texture nếu không cẩn thận, 
//         // với Pixi v8 chỉ nên destroy container logic.
//         currentScene.destroy(); 
//         currentScene = null;
//     }

//     console.log(`[Main] Switching to: ${sceneName}`);
//     const sceneContainer = new Container();
//     // Căn giữa scene container
//     sceneContainer.position.set(app.screen.width / 2, app.screen.height / 2);
//     app.stage.addChild(sceneContainer);
//     currentScene = sceneContainer;

//     switch (sceneName) {
//         case SceneName.SPLASH:
//             const splashCtrl = new SplashController(sceneContainer);
//             // Override hàm chuyển cảnh của Splash
//             (splashCtrl as any).checkToLoadScene = () => {
//                 loadScene(SceneName.MAP);
//             };
//             break;

//         case SceneName.MAP:
//             createMapScene(sceneContainer);
//             break;
            
//         case SceneName.GAME:
//             createGameScene(sceneContainer);
//             break;
//     }
// }

// // --- HELPERS: CREATE SCENE UI ---

// function createMapScene(container: Container) {
//     // Vì không có Prefab, ta phải tạo UI bằng code (Mockup)
    
//     // Level Grid Container
//     const levelContainer = new Container();
//     levelContainer.position.set(-300, -400); // Offset giả định
    
//     // Tạo các MapLevelItem giả lập
//     const mmData = MM.mapData;
//     // Grid Layout đơn giản (5 cột)
//     const cols = 5;
//     const spacing = 120;
    
//     if (mmData) {
//         mmData.forEach((data, index) => {
//             const x = (index % cols) * spacing;
//             const y = Math.floor(index / cols) * spacing;
            
//             // Tạo visual cho Level Item
//             const txt = new Text({ text: "", style: { fontSize: 24, fill: 0xffffff } });
//             txt.anchor.set(0.5);
//             const stateCont = new Container();
//             // Placeholder Sprites cho states (Locked, Stars...)
//             // Bạn cần thêm sprite thật vào đây
//             const locked = new Sprite(Texture.WHITE); locked.tint = 0x555555; locked.width=80; locked.height=80; locked.anchor.set(0.5);
//             const unlocked = new Sprite(Texture.WHITE); unlocked.tint = 0x00ff00; unlocked.width=80; unlocked.height=80; unlocked.anchor.set(0.5); unlocked.visible = false;
//             // ...
//             stateCont.addChild(locked, unlocked); // Index 0, 1... khớp với LevelState
            
//             const item = new MapLevelItem(txt, stateCont, null);
//             item.position.set(x, y);
//             levelContainer.addChild(item);
//         });
//     }
    
//     container.addChild(levelContainer);

//     // Tạo Mock UI Components cho MapController
//     const mapUI: MapUIComponents = {
//         levelContainer: levelContainer,
//         opacityMain: container, // Fade toàn bộ container
//         lbStars: new Text({ text: '0', style: { fill: 0xffff00 } }),
//         lbTurns: new Text({ text: '0', style: { fill: 0xffffff } }),
//         lbRemainTime: new Text({ text: '00:00', style: { fill: 0xffffff } }),
//         nodeBlocking: new Container(), // Overlay chặn click
//         nodeSoundOff: new Container(),
        
//         // Rewards
//         lbRewardStreak: new Text({ text: '' }),
//         lbRewardStars: new Text({ text: '' }),
//         nodeStreaks: [],
//         nodeStars: [],
//         fillerProgressStreak: new Sprite(Texture.WHITE),
//         fillerProgressStars: new Sprite(Texture.WHITE),
//         btnClaimStreak: new Container(),
//         btnClaimStars: new Container(),

//         // Popups (Mock)
//         popupRank: createMockRankPopup(),
//         popupHowToPlay: new PopupBase(),
//         popupError: new PopupBase(),
//         popupReward: new PopupBase(),
//         popupRewardTutorial: new PopupBase(),
//         popupTutorial: new PopupBase(),
//         lbRewardLabel: new Text({ text: '' }),
//         lbErrorLabel: new Text({ text: '' }),
//         nodeLoading: new Container(),
//     };

//     // Layout sơ bộ cho UI Stats
//     mapUI.lbStars.position.set(-200, -500);
//     container.addChild(mapUI.lbStars);
    
//     mapUI.lbRemainTime.position.set(200, -500);
//     container.addChild(mapUI.lbRemainTime);

//     // Khởi tạo Controller
//     new MapController(mapUI);
// }

// function createGameScene(container: Container) {
//     console.log('[Main] Creating game scene...');
    
//     // 1. Single container for both tiles and elements (Pixi v8 best practice)
//     const tileMapLayer = new Container();
//     const uiLayer = new Container();
    
//     tileMapLayer.visible = true;
//     uiLayer.visible = true;
    
//     console.log('[Main] Layers created (single container architecture)');
    
//     // TileMapLayer at (0,0) - TileContainer inside will handle centering
//     tileMapLayer.position.set(0, 0);
    
//     container.addChild(tileMapLayer);
//     container.addChild(uiLayer);
    
//     console.log('[Main] TileMapLayer added at:', tileMapLayer.position.x, tileMapLayer.position.y);
//     console.log('[Main] Scene container:', container.position.x, container.position.y, 'size:', app.screen.width, 'x', app.screen.height);

//     // 2. UI Components for UIGameController
//     const gameUI: GameUIComponents = {
//         lbRemainTurns: new Text({ text: '0', style: { fontSize: 40, fill: 0xffffff } }),
//         lbScore: new Text({ text: '0', style: { fontSize: 30, fill: 0xffff00 } }),
//         lbTime: new Text({ text: '00:00', style: { fill: 0xffffff } }),
//         lbLevel: new Text({ text: '1', style: { fill: 0xffffff } }),
        
//         nodeStars: [new Container(), new Container(), new Container()],
//         transScoreProgressBG: new Container(),
//         transScoreProgressFG: new Sprite(Texture.WHITE),
        
//         nodeLoading: new Container(),
        
//         popupReward: new PopupBase(),
//         lbReward: new Text({ text: '' }),
        
//         popupEndGame: createMockEndGamePopup(uiLayer), // Helper below
//         lbEndGameTitle: new Text({ text: '' }), // Sẽ được gán lại trong Mock
//         lbEndGameMessage: new Text({ text: '' }),
//         lbEndGameConfirm: new Text({ text: '' }),
//         nodeEndGameStars: [],
//         sprtEndGamePanel: new Sprite(Texture.WHITE),
//         sfEndGamePanel: [],
        
//         popupBackToMap: new PopupBase(),
//         popupTutorial: new PopupBase(),
//         tutorials: []
//     };

//     // Layout UI
//     gameUI.lbRemainTurns.position.set(0, -400);
//     uiLayer.addChild(gameUI.lbRemainTurns);

//     gameUI.lbScore.position.set(0, -350);
//     uiLayer.addChild(gameUI.lbScore);

//     // 3. Init Controllers
//     // Init UI Controller trước
//     const uiCtrl = new UIGameController(gameUI);
//     // Gán lại các ref trong popup mock vào uiCtrl nếu cần thiết
    
//     // Init Game Controller - pass tileMapLayer as BOTH element and tile container
//     const gameCtrl = new GameController(tileMapLayer, tileMapLayer);
//     gameCtrl.start();
    
//     // Back button mock
//     const btnBack = new Sprite(Texture.WHITE); // Thay bằng 'btn_back' nếu load được
//     btnBack.width = 50; btnBack.height = 50;
//     btnBack.position.set(-350, -500);
//     btnBack.eventMode = 'static';
//     btnBack.cursor = 'pointer';
//     btnBack.on('pointertap', () => {
//         uiCtrl.onTouch_Back();
//     });
//     uiLayer.addChild(btnBack);
// }

// // --- HELPER: MOCK POPUPS ---

// function createMockRankPopup(): RankController {
//     const container = new Container();
//     const bg = new Graphics().rect(-200, -300, 400, 600).fill(0x000000);
//     bg.alpha = 0.8;
//     container.addChild(bg);
    
//     const lbNoti = new Text({ text: "Loading...", style: { fill: 0xffffff } });
//     const content = new Container();
    
//     // Factory for items
//     const factory = () => {
//         return new ItemRank(
//             new Text({ text: "", style: { fontSize: 18, fill: 0xffffff } }),
//             new Text({ text: "", style: { fontSize: 18, fill: 0xffff00 } })
//         );
//     };
    
//     const popup = new RankController({
//         lbNoti: lbNoti,
//         nodeUserContainer: content,
//         itemFactory: factory
//     });
    
//     popup.addChild(bg, content, lbNoti); // Add visual children manually since PopupBase logic varies
//     return popup;
// }

// function createMockEndGamePopup(parent: Container): PopupBase {
//     // Tạo cấu trúc visual cho popup Endgame để UIGameController có thể điều khiển
//     const popup = new PopupBase();
//     const bg = new Graphics().rect(-250, -200, 500, 400).fill(0x222222);
//     popup.addChild(bg);
    
//     // Các label sẽ được UIGameController trỏ tới, nhưng ta cần tạo và add vào popup ở đây
//     // Lưu ý: Trong UIGameController, nó mong đợi các biến lbEndGameTitle... được truyền vào qua interface.
//     // Ở đây ta tạo object popup nhưng các label thực tế đang nằm "lơ lửng" trong interface.
//     // Ta cần gán chúng vào popup để hiển thị.
    
//     // Đây là hạn chế khi không dùng Prefab: Ta phải setup scene graph thủ công.
//     parent.addChild(popup);
//     return popup;
// }

// // Expose loadScene globally for GameController
// (globalThis as any).loadScene = loadScene;

// // RUN!
// initGame();