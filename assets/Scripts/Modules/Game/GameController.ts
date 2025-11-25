import { _decorator, Component, Node, Prefab, NodePool, instantiate, TiledUserNodeData, tween, Vec3, easing, v2, director, MATH_FLOAT_ARRAY, v3, Vec2, resources, ResolutionPolicy } from 'cc';
import { GameplayConst, SceneName } from '../../Constants/Constants';
import { requestClaimReward, requestCompleteGame, requestGetData, requestPlayGame } from '../../Managers/APIManager';
import { GameManager } from '../../Managers/GameManager';
import { LevelData, MapData, MapManager } from '../../Managers/MapManager';
import { SoundController } from '../../Managers/SoundController';
import { EffectController } from './EffectController';
import { Element, ElementType, SuperEffectType } from './Element';
import { Tile, TileData } from './Tile/Tile';
import { TileContainer } from './Tile/TileContainer';
import { TileContainerSquare } from './Tile/TileContainerSquare';
import { UIGameController } from './UIGameController';
const { ccclass, property } = _decorator;

export enum GameState {
    NONE,
    INIT,
    PLAYING,
    GAMEOVER,
}

@ccclass('GameController')
export class GameController extends Component {

    static instance: GameController = null;

    @property(Prefab)
    elementPrefab: Prefab = null;

    @property(Node) 
    elementContainer: Node = null;

    @property(Node) 
    tileMapContainer: Node = null;

    levelData: LevelData;
    gameData: MapData = null;
    state: GameState = GameState.NONE;

    //#region life cycles

    onLoad() {
        if (GameManager.instance == null) {
            director.loadScene(SceneName.SPLASH);
            return;
        }
        GameController.instance = this;
    }

    start() {
        this.state = GameState.INIT;
        this.doProcess();
    }

    //#endregion

    //#region commons

    isBacking = false;
    doLoadScene(sceneName: string = SceneName.MAP) {
        if (this.state == GameState.INIT) return;
        if (this.isEarningScore) return;
        if (this.isBacking) return;

        this.isBacking = true;  
        this.disappearMap(() => {
            director.loadScene(sceneName);
        })
        SoundController.instance.stopAllEffects();
    }

    disappearMap(onDone: () => void) {
        if (this.currentTileContainer == null) {
            onDone && onDone();
            return;
        }

        var actionNode = this.currentTileContainer.node;
        this.currentTileContainer.setElementFollowTiles(true);
        tween(actionNode).stop();
        tween(actionNode)
        .to(
            1.0,
            {
                scale: Vec3.ZERO,
                angle: -360,
                position: v3(0.0, cc.visibleRect.height, 0.0)
            }, {
                easing: easing.backIn,
            }
        )
        .call(() => {
            setTimeout(() => {
                this.currentTileContainer.setElementFollowTiles(false);
                onDone && onDone();
            }, 500);
        })
        .start();
        
    }

    //#endregion

    //#region loadgame process

    doProcess() {
        this.step_GetData()
        .then(res => this.step_SetUpUIs())
        .then(res => this.step_LoadTileContainer())
        .then(res => this.step_LoadElementData())
        .then(res => this.step_CreateElement())
        .then(res => this.step_MapAppear())
        .then(res => this.step_CheckShowTutorial())
        .then(res => this.step_StartGame())
        .catch(error => {

        });
    }

    step_GetData() {
        return new Promise((resolve, reject) => {
            this.gameData = GameManager.instance.gameData;
            this.levelData = MapManager.instance.getLevelData(this.gameData.level);
            resolve("step_SetUpUIs");
        });
    }

    step_SetUpUIs() {
        return new Promise((resolve, reject) => {
            UIGameController.instance.setGameData(this.gameData);
            resolve("step_SetUpUIs");
        });
    }


    step_LoadTileContainer() {
        return new Promise((resolve, reject) => {
            //init for tile container
            if (this.levelData == null) {
                reject("map data is null");
                return;
            }

            //create tile container prefab
            var tileMap = instantiate(this.levelData.prefab);
            tileMap.parent = this.tileMapContainer;
            var script = tileMap.getComponent(TileContainer);
            this.currentTileContainer = script;
            this.initContainer(this.currentTileContainer);

            //move aside to appear later 
            tileMap.position = v3(0.0, cc.visibleRect.height, 0.0);

            setTimeout(()  => {
                resolve("step_LoadTileContainer");
            }, 500)
        });
    }

    step_LoadElementData() {
        return new Promise((resolve, reject) => {
            if (this.levelData == null) {
                reject("map data is null");
                return;
            }

            if (this.currentTileContainer == null) {
                reject("tile map is null")
                return;
            }
            
            //load elements data then set it into tile map container
            this.currentTileContainer.setData(this.levelData, () => {
                resolve("step_LoadElementData");
            });

        });
    }

    step_CreateElement() {
        return new Promise((resolve, reject) => {
            this.initElement();
            var data: TileData[] = this.currentTileContainer.getDataForNextEmptyTile();
            data.forEach(tileData => {
                var element = this.createElement(tileData.elementType);
                var tile = this.currentTileContainer.getTile(tileData.id);
                tile.claimElement(element, true);
            });

            //set test value
            // this.currentTileContainer.getTile(v2(0, 1).toString()).currentElement.init(ElementType.ELE_1);
            // this.currentTileContainer.getTile(v2(0, 3).toString()).currentElement.init(ElementType.ELE_1);
            // this.currentTileContainer.getTile(v2(0, 4).toString()).currentElement.init(ElementType.ELE_1);
            // this.currentTileContainer.getTile(v2(1, 2).toString()).currentElement.init(ElementType.ELE_1);
            // this.currentTileContainer.getTile(v2(2, 2).toString()).currentElement.init(ElementType.ELE_1);
            // this.currentTileContainer.getTile(v2(3, 2).toString()).currentElement.init(ElementType.ELE_1);
            
            // this.currentTileContainer.getTile(v2(0, 4).toString()).currentElement.setSuperEffect(SuperEffectType.X1);
            // this.currentTileContainer.getTile(v2(0, 1).toString()).currentElement.setSuperEffect(SuperEffectType.X1);
            // this.currentTileContainer.getTile(v2(2, 2).toString()).currentElement.setSuperEffect(SuperEffectType.X2);
            resolve("step_CreateElement");
        });
    }

    step_MapAppear() {
        return new Promise((resolve, reject) => {
            var actionNode = this.currentTileContainer.node;
            actionNode.active = true;
            actionNode.scale = Vec3.ZERO;
            actionNode.angle = -360.0;

            this.currentTileContainer.setElementFollowTiles(true);
            tween(actionNode).stop();
            tween(actionNode)
            .to(
                1.0,
                {
                    scale: Vec3.ONE,
                    angle: 0,
                    position: Vec3.ZERO
                }, {
                    easing: easing.backOut,
                }
            )
            .call(() => {
                setTimeout(() => {
                    this.currentTileContainer.setElementFollowTiles(false);
                    resolve("success")
                }, 500);
            })
            .start();
        });
    }

    step_CheckShowTutorial() {
        return new Promise((resolve, reject) => {
            if (GameManager.instance.isHaveTutorial == false) {
                resolve("already shown tutorials");
                return;
            }

            UIGameController.instance.showTutorial(() => {
                resolve("Had just shown tutorial");
            })
        })
    }

    step_StartGame() {
        return new Promise((resolve, reject) => {
            if (this.gameData == null) reject("game data is null")
            this.currentRemainTime = this.gameData.time;
            this.currentRemainTurn = this.gameData.turns;
            this.currentScore = 0;
            this.startCountingDown();
            this.state = GameState.PLAYING;
            this.actionLogs = "";
            resolve("step_StartGame");
        });
    }

    //#endregion    

    //#region logics

    //#region gameplay data

    currentRemainTime = 0;
    currentRemainTurn = 0;
    currentScore = 0;
    currentStars = 0;
    coutingDownSchdedule = null;
    actionLogs = "";

    multiScore = 3.3;
    getScore() {
        return Math.floor(this.currentScore / this.multiScore);
    }

    setScore(score: number) {
        this.currentScore = score * this.multiScore;
    }
    
    startCountingDown() {
        if (this.gameData == null) return;
        this.coutingDownSchdedule = this.schedule(() => {
            this.currentRemainTime--;
            if (this.currentRemainTime < 0) {
                this.unschedule(this.coutingDownSchdedule);
                if (this.state == GameState.PLAYING) {
                    this.gameOver("out_of_time");
                }
            }
            else {
                UIGameController.instance.updateTime(this.currentRemainTime);
            }
            this.unschedule(this.coutingDownSchdedule);
        }, 1, this.gameData.time);
    }

    onUseOneMove(){
        if (this.state == GameState.GAMEOVER) return;
        if (--this.currentRemainTurn <= 0) {
            this.gameOver("out_of_turn");
        }
        UIGameController.instance.updateTurns(this.currentRemainTurn);
    }

    onGainScore(exploseElementCount: number, combo: number) {
        var baseScore = GameplayConst.SCORE_PER_ELEMENT;
        for (var i = 1; i < exploseElementCount - 3; i++) {
            baseScore += i * GameplayConst.SCORE_BONUS_EXTRA_ELEMENT;
        }
        var score = (baseScore) * Math.pow(GameplayConst.MULTI_COMBO_SCORE, combo);
        this.setScore(this.getScore() + Math.floor(score));
        UIGameController.instance.updateScore(this.getScore());
        //update progress
        var ratio = this.getScore() / this.gameData.score;
        this.currentStars = this.getStars(ratio);
        UIGameController.instance.updateProgress(ratio, this.currentStars);
    }

    onRecordAction(dir: Tile, des: Tile) {
        var offsetVec = v2(des.idVec.x - dir.idVec.x, des.idVec.y - dir.idVec.y);
        var actStr = "" + dir.idVec.x + dir.idVec.y;
        if (offsetVec.x == 0) {
            if (offsetVec.y == 1){
                actStr += "u";
            }
            else {
                actStr += "d";
            }
        }
        else {
            if (offsetVec.x == 1) {
                actStr += "r";
            }
            else {
                actStr += "l";
            }
        }
        this.actionLogs += actStr;
    }

    checkScore(){
        if (this.getScore() >= this.gameData.score) {
            this.gameOver("enough_score");
        }
    }

    getStars(ratio: number): number {
        if (ratio >= GameplayConst.STAR_3_SCORE_RATIO) return 3;
        if (ratio >= GameplayConst.STAR_2_SCORE_RATIO) return 2;
        if (ratio >= GameplayConst.STAR_1_SCORE_RATIO) return 1;
        return 0;
    }

    getGameOverReason(code: string) {
        switch(code) {
            case "enough_score":
                return "KHÔNG ĐỦ ĐIỂM YÊU CẦU";
            case "out_of_time":
                return "HẾT THỜI GIAN";
            case "out_of_turn":
                return "HẾT LƯỢT DI CHUYỂN";
        }
    }

    getGameOverMessage(code: string) {
        switch(code) {
            case "enough_score":
                return "Tiếc quá, Bạn vẫn chưa đạt đủ điểm yêu cầu!\nChơi lại để vượt qua màn bạn nhé!";
            case "out_of_time":
                return "Tiếc quá, đã hết thời gian rồi.\nChơi lại để vượt qua màn bạn nhé!";
            case "out_of_turn":
                return "Tiếc quá, đã hết lượt di chuyển rồi.\nChơi lại để qua màn bạn nhé!";
        }
    }

    goToNextLevel() {
        //back directly to map
        GameController.instance.doLoadScene();
        return;
    }

    replay() {
        UIGameController.instance.setLoading(true);
        let gameData = GameController.instance.gameData;
        requestPlayGame(gameData.level, result => {
            UIGameController.instance.setLoading(true);
            if (result.isSuccess) 
            {
                gameData.turn_id = result.data.turn_id;
                GameManager.instance.setGameData(gameData);
                GameController.instance.doLoadScene(SceneName.GAME);
            }
            else {    
                //back directly to map
                GameController.instance.doLoadScene();
            }
        })
    }

    gameOver(reason: string) {
        if (this.state != GameState.PLAYING) return;
        UIGameController.instance.setLoading(true);
        this.state = GameState.GAMEOVER;
        this.currentTileContainer.setInteracting(false);
        let isWin = this.currentStars > 0; 

        var requestData = {
            turn_id: this.gameData.turn_id,
            star: this.currentStars,
            is_completed: isWin || this.gameData.stars > 0,
            moves: this.actionLogs,
            map_name: this.levelData.currentMap,
            point: this.getScore()
        }
        let title = this.currentStars > 0 ? "BẠN ĐÃ NHẬN ĐƯỢC " + this.currentStars + " SAO" : this.getGameOverReason(reason);
        let message = this.currentStars > 0 ? "" : this.getGameOverMessage(reason);
        let isCanNextPlay = isWin && this.gameData.level < 20;
        var endGameCallback = isCanNextPlay ? this.goToNextLevel : this.replay;

        let showGameOver = () => {
            UIGameController.instance.setLoading(false);
            UIGameController.instance.showEndGame(
                title,
                message,
                isCanNextPlay ? "CHƠI TIẾP" :"CHƠI LẠI",
                this.currentStars,
                endGameCallback
            );
        }
      
        //todo: tmp flow need to improve when UX ready
        requestCompleteGame(requestData, result => {
            if (result.isSuccess == false) {
                showGameOver();
                return;
            }
                //get new data after win 1 game
            requestGetData(result => {
                if (result.isSuccess) {
                    //set map
                    MapManager.instance.setServerMapData(result.data.history);
                    //set game data
                    GameManager.instance.setUserData(result.data);
                }

                if (requestData.is_completed == true) {
                    this.checkReward((result, rewards) => {
                        if (result && rewards.length > 0) {
                            UIGameController.instance.setLoading(false);
                            this.showReward(rewards, showGameOver);
                        }
                        else {
                            showGameOver();
                        }
                    })
                }
                else {
                    showGameOver();
                }
            })
        })
    }

    showReward(rewards, onDone: () => void) {
        var currentIndex = -1;
        let showEachReward = () => {
            var reward = null;
            if (++currentIndex < rewards.length) {
                reward = rewards[currentIndex];
            }
            if (reward == null) {
                onDone();
                return;
            }
            UIGameController.instance.showReward(reward, showEachReward);
        }
        showEachReward();
    }

    checkReward(onDone: (result: boolean, rewards) => void) {
        if (MapManager.instance.isLevelHaveReward(this.gameData.level) == false) {
            onDone(false, null);
            return;
        }

        requestClaimReward(this.gameData.level, (res) => {
            if (res.isSuccess) {
                onDone(true, res.data.rewards);
            }
            else {
                onDone(false, null);
            }
        })
    }

    //#endregion

    //#region element relate
    
    elementPool: NodePool;
    initElement() {
        this.elementPool = new NodePool("Element_Pooling");
        for (var i = 0; i < this.currentTileContainer.getTileSize() + 5; i++) {
            var elementObj = instantiate(this.elementPrefab);
            this.elementPool.put(elementObj);
        }
    }

    createElement(type: ElementType): Element {
        // var element = null;
        let element = this.elementPool.get();
        if (element == null) {
            element = instantiate(this.elementPrefab);
            element.parent = this.elementContainer;
        }
        element.parent = this.elementContainer;
        element.active = true;
        element.setScale(Vec3.ONE);
        let script = element.getComponent(Element);
        script.init(type);
        return script;
    }
    //#endregion

    //#region elements/tiles container logic 
    currentTileContainer: TileContainer = null;
    isEarningScore = false;
    numberOfRealign = 0;
    
    initContainer(container: TileContainer) {
        this.currentTileContainer = container;
        this.currentTileContainer.onSwapTile = this.onSwapTile.bind(this);
        this.currentTileContainer.onStartSwapTile = this.onStartSwapTile.bind(this);
        this.currentTileContainer.onRevertSwapTile = this.onRevertSwapTile.bind(this);
    }
    
    onStartSwapTile(dir: Tile, des: Tile) {
        this.currentTileContainer.setInteracting(false);
    }

    onRevertSwapTile() {
        this.currentTileContainer.setInteracting(true);
    }

    getScoredTileAndSuperEffectTile(tile: Tile, scoredTile: Tile[], effects: Tile[]): [Tile[], Tile[], SuperEffectType]{
        let scored = this.currentTileContainer.checkScoredTiles(tile);
        let [explosedTileByEffect, superEffecType] = this.getSuperEffectExplosedTiles(scored);
        if (explosedTileByEffect.length > 0)  {
            scored = explosedTileByEffect;
        }
        else {
            let superEffect = this.getSuperEffectTile(tile, scored);
            if (superEffect != null) {
                effects.push(superEffect);
            }
        }
        scoredTile = scoredTile.concat(scored);
        return [scoredTile, effects, superEffecType];
    }

    doElementsExploseAnim(scoreTiles: Tile[], superEffectItemTiles: Tile[], superEffectType: SuperEffectType, predicateTile: (tile: Tile) => boolean, onDone: () => void){
        EffectController.instance.spawnEffect(
            superEffectType,
            scoreTiles, 
            predicateTile,
            (tile) => {
                if (superEffectItemTiles.indexOf(tile) < 0) {
                    let ele = tile.exploseElement(); //remove element from tile
                    if (ele != null) {
                        //play element disappear
                        this.earnElementAnim(ele);
                    }
                }
            },
            onDone);
    }

    onSwapTile(dir: Tile, des: Tile) {
        if (this.state == GameState.GAMEOVER) return;
        //console.log("swap tile " + dir.id + " to " + des.id);
        var actionCount = 0;
        var totalActionCount = 0;
        var doneAction = () => {
            if (++actionCount >= totalActionCount) {
                this.realignAllElements();
            }
        }
        var scoredTile: Tile[] = [];
        let isSameElement = dir.currentElement.type == des.currentElement.type;
        let [scoredTile1, superEffectTile1, superEffectType1] = this.getScoredTileAndSuperEffectTile(dir, [], []);
        let [scoredTile2, superEffectTile2, superEffectType2] = this.getScoredTileAndSuperEffectTile(des, [], []);

        //do anim
        if (scoredTile1.length > 0) {
            totalActionCount++;
            this.doElementsExploseAnim(scoredTile1, superEffectTile1, superEffectType1, (tile) => true, doneAction);
            scoredTile = scoredTile.concat(scoredTile1);
        }
        if (scoredTile2.length > 0 && isSameElement == false) {
            totalActionCount++;
            this.doElementsExploseAnim(scoredTile2, superEffectTile2, superEffectType2, (tile) => scoredTile.indexOf(tile) < 0 , doneAction);
            scoredTile = scoredTile.concat(scoredTile2);
        }

        //calculate score
        if (totalActionCount > 0) totalActionCount++;
        scoredTile = scoredTile.distinct();
        if (scoredTile != null && scoredTile.length > 0) {
            //first score 
            this.isEarningScore = true;
            this.numberOfRealign = 0;
            this.onGainScore(scoredTile.length, this.numberOfRealign);

            setTimeout(() => {
                doneAction();
            }, 200);

            //record swap action
            this.onRecordAction(dir, des);
        }
        else {
            this.currentTileContainer.revertSwapTile();
            this.onUseOneMove();
        }
    }
    
    realignAllElements() {
        this.numberOfRealign++;
        //on tile container elements
        let onContainerTiles = this.currentTileContainer.realignAllElements();

        //outside tile container elements
        let emptyTileData = this.currentTileContainer.getDataForNextEmptyTile();
        var newTiles: Tile[] = [];
        emptyTileData.forEach(tileData => {
            var element = this.createElement(tileData.elementType);
            var tile = this.currentTileContainer.getTile(tileData.id);
            tile.claimNewElement(element, this.currentTileContainer.getSpawnDistance());
            newTiles.push(tile);
        })

        //delay next check
        setTimeout(() => {
            let checkTiles = onContainerTiles.concat(newTiles);
            var scoredTiles: Tile[] = [];

            var actionCount = 0;
            var totalActionCount = 0;
            var doneAction = () => {
                if (++actionCount >= totalActionCount) {
                    this.realignAllElements();
                }
            }

            checkTiles.forEach(tile => {
                if (scoredTiles.indexOf(tile) < 0) {
                    let [tmpScoredTiles, superEffectTiles, superEffectType] = this.getScoredTileAndSuperEffectTile(tile, [], []);
                    if (tmpScoredTiles.length > 0) {
                        totalActionCount++;
                        this.doElementsExploseAnim(tmpScoredTiles, superEffectTiles, superEffectType, (tile) => scoredTiles.indexOf(tile) < 0, doneAction);
                        scoredTiles = scoredTiles.concat(tmpScoredTiles);
                    }
                }
            })
            scoredTiles = scoredTiles.distinct();
            if (scoredTiles.length > 0) {
                totalActionCount++;
                
                //gain score after realign, number as combo
                this.onGainScore(scoredTiles.length, this.numberOfRealign);
                doneAction();

            }else {
                this.currentTileContainer.setInteracting(true);
                this.checkScore();
                this.onUseOneMove(); //only call when not earning score anymore calculate as a move
                this.isEarningScore = false;
            }
        }, 500);
    }

    getSuperEffectTile(tile: Tile, tiles: Tile[]): Tile {
        let superEffectType = this.getSuperEffect(tiles);
        if (superEffectType == SuperEffectType.NONE) return null; 
        
        if (tile == null) {
            tile = tiles[0];
        }

        tile.currentElement.setSuperEffect(superEffectType);
        return tile;
    }

    getSuperEffectExplosedTiles(scoredTiles: Tile[]): [Tile[], SuperEffectType] {
        var superEffects: SuperEffectType[] = [];
        scoredTiles.forEach(tile => {
            let checkingEffect = tile.getSuperEffect();
            if (checkingEffect != SuperEffectType.NONE) {
                superEffects.push(checkingEffect);
            }
        });

        //get final super effect
        let x1Count = 0;
        let x2Count = 0;
        superEffects.forEach(e => {
            if (e == SuperEffectType.X1) x1Count++;
            if (e == SuperEffectType.X2) x2Count++;
        })

        let superEffectType = this.getFinalSuperEffect(x1Count, x2Count);

        return [this.currentTileContainer.getSuperEffectTiles(superEffectType, scoredTiles), superEffectType];
    }

    getFinalSuperEffect(x1Count: number, x2Count: number): SuperEffectType {
        if (x2Count > 0 && (x1Count > 0 || x2Count > 1)) {
            return SuperEffectType.X4;   
        }
        if (x1Count > 1) {
            return SuperEffectType.X3;
        }

        if (x2Count > 0) {
            return SuperEffectType.X2;
        }

        if (x1Count > 0) {
            return SuperEffectType.X1;
        }
        return SuperEffectType.NONE;
    }

    getSuperEffect(tiles: Tile[]): SuperEffectType {
        if (tiles.length >= 5) return SuperEffectType.X2;
        if (tiles.length >= 4) return SuperEffectType.X1;
        return SuperEffectType.NONE;
    }

    earnElementAnim(ele: Element) {
        tween(ele.node).stop();
        tween(ele.node)
        .to(0.35,
            {
                scale: Vec3.ZERO
            },{
                easing: easing.backIn
            })
            .call(() => {
                this.elementPool.put(ele.node);
            })
            .start();
    }


    //#endregion

    //#endregion
}

