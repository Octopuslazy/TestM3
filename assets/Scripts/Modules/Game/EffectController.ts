import { _decorator, Component, Node, Prefab, Pool, NodePool, instantiate, Vec2, Vec3, Animation, tween, v3, easing, setDefaultLogTimes, v2, NodeEventType } from 'cc';
import { SoundController } from '../../Managers/SoundController';
import { Element, SuperEffectType } from './Element';
import { GameController } from './GameController';
import { Tile } from './Tile/Tile';
import { TileContainerSquare } from './Tile/TileContainerSquare';
const { ccclass, property } = _decorator;

export enum EffectType {
    STAR_5_BIG,
    STAR_5_SMALL,
    STAR_3,
    LINE,
    NORMAL,
}

@ccclass('EffectController')
export class EffectController extends Component {
    static instance: EffectController;

    @property([Prefab]) 
    effectData: Prefab[] = [];

    @property(Node) 
    effectContainer: Node = null;

    mapPoolEffect: Map<EffectType, NodePool> = null;
    mapDataEffect: Map<EffectType, Prefab> = null;
    mapAnimator: Map<Node, Animation> = null;

    onLoad() {
        EffectController.instance = this;
        this.initData();
    }

    initData() {
        this.mapPoolEffect = new Map();
        this.mapDataEffect = new Map();
        this.mapAnimator = new Map();

        for (var i = 0; i < this.effectData.length; i++) {
            //init pool 
            var pool = new NodePool(EffectType[i].toString());
            for (var j = 0; j < 10; j++) {
                var obj = instantiate(this.effectData[i]);
                pool.put(obj);
            }
            this.mapPoolEffect.set(i, pool);
            this.mapDataEffect.set(i, this.effectData[i]);
        }
    }

    getEffectData(type: EffectType): Prefab {
        return this.mapDataEffect.get(type);
    }

    getEffect(type: EffectType): Node {
        let pool = this.mapPoolEffect.get(type);
        if (pool != null) {
            var retVal = pool.get();
            if (retVal == null) {
                let prefab = this.getEffectData(type);
                retVal = instantiate(prefab);
            }           
            return retVal; 
        }
        return null;
    }

    putEffect(type: EffectType, nodeEffect: Node) {
        let pool = this.mapPoolEffect.get(type);
        if (pool != null) {
            pool.put(nodeEffect);
        }
    }

    spawnEffect(type: SuperEffectType, scoredTiles: Tile[], predicateTile: (tile: Tile) => boolean, onTileNeedAction: (tile: Tile) => void, onDone: () => void) {
        if (scoredTiles.length <= 0) return;
        switch(type) {
            case SuperEffectType.NONE:
                this.effectNone(type, scoredTiles, predicateTile, onTileNeedAction, onDone);
                break;
            case SuperEffectType.X1:
                this.effectX1(type, scoredTiles, predicateTile, onTileNeedAction, onDone);
                break;
            case SuperEffectType.X2:
                this.effectX2(type, scoredTiles, predicateTile, onTileNeedAction, onDone);
                break;
            case SuperEffectType.X3:
                this.effectX3(type, scoredTiles, predicateTile, onTileNeedAction, onDone);
                break;
            case SuperEffectType.X4:
                this.effectX4(type, scoredTiles, predicateTile, onTileNeedAction, onDone);
                break;
        }
    }

    effectNone(type: SuperEffectType, scoredTiles: Tile[], predicateTile: (tile: Tile) => boolean, onTileNeedAction: (tile: Tile) => void, onDone: () => void) {
        let willEffecTiles: Tile[] = [];
        scoredTiles.forEach(tile => {
            if (predicateTile(tile)) {
                willEffecTiles.push(tile);
            }
        })
        if (willEffecTiles.length <= 0) {
            onDone && onDone();
            return;
        }
        for (var i = 1; i < willEffecTiles.length; i++) {

            this.doNormalEffect(willEffecTiles[i], onTileNeedAction, null);
        }
        this.doNormalEffect(willEffecTiles[0], onTileNeedAction, onDone);
        SoundController.instance.play("normal");
    }

    effectX1(type: SuperEffectType, scoredTiles: Tile[], predicateTile: (tile: Tile) => boolean, onTileNeedAction: (tile: Tile) => void, onDone: () => void) {
        let tileHaveSuperEffect = scoredTiles.find(tile => tile.getSuperEffect() == type);
        if (tileHaveSuperEffect == null) {
            onDone && onDone();
            return;
        }
        
        //super tile
        this.doStar3Effect(tileHaveSuperEffect, onTileNeedAction, null);
        SoundController.instance.play("normal");

        //line effected
        //need to wait supertile a litle bit
        let willEffecTiles: Tile[] = [];
        scoredTiles.forEach(tile => {
            if (predicateTile(tile) && tile != tileHaveSuperEffect) {
                willEffecTiles.push(tile);
            }
        })
        setTimeout(() => {
            this.doLineEffect(willEffecTiles, tileHaveSuperEffect, onTileNeedAction, onDone);
            SoundController.instance.play("line");
        }, 250);
    }
    
    effectX2(type: SuperEffectType, scoredTiles: Tile[], predicateTile: (tile: Tile) => boolean, onTileNeedAction: (tile: Tile) => void, onDone: () => void) {
        if (scoredTiles.length <= 0) {
            onDone && onDone();
            return;
        }
        //file the center pos
        let tileHaveSuperEffect = scoredTiles.find(tile => tile.getSuperEffect() == type);
        var minVec = scoredTiles[0].node.worldPosition;
        var maxVec = scoredTiles[0].node.worldPosition;
        scoredTiles.forEach(tile => {
                let comparePos = tile.node.worldPosition;
                if (comparePos.x < minVec.x || comparePos.y < minVec.y) {
                    minVec = comparePos;
                }
                if (comparePos.x > maxVec.x || comparePos.y > maxVec.y) {
                    maxVec = comparePos;
                }
        })

        var centerPos: Vec3 = new Vec3();
        centerPos = Vec3.lerp(centerPos, minVec, maxVec, 0.5);
        let willEffecTiles: Tile[] = [];
            scoredTiles.forEach(tile => {
                if (predicateTile(tile)) {
                    willEffecTiles.push(tile);
                }
            })

        //spawn center effect first
        this.do5StarsEffect(true, type, tileHaveSuperEffect, centerPos, null);
        SoundController.instance.play("x2");

        //wait a bit then play all normal effects
        setTimeout(() => {
            SoundController.instance.play("normal");
            var firstTile = null;
            willEffecTiles.forEach(tile => {
                if (firstTile == null) {
                    firstTile = tile;
                }
                else {
                    this.doNormalEffect(tile, onTileNeedAction, null);
                }
            })
            this.doNormalEffect(firstTile, onTileNeedAction, onDone);
        }, 400);
    }
    
    effectX3(type: SuperEffectType, scoredTiles: Tile[], predicateTile: (tile: Tile) => boolean, onTileNeedAction: (tile: Tile) => void, onDone: () => void) {
        if (scoredTiles.length <= 0) {
            onDone && onDone();
            return;
        }
        //break multi lines
        //logic only applied for square container
        let squareContainer: TileContainerSquare = GameController.instance.currentTileContainer as TileContainerSquare;
        if (squareContainer == null) {
            //console.log("only support square container now");
            onDone && onDone();
            return;
        }

        let maxCol = squareContainer.numberColumns.valueOf();
        let checkTile = scoredTiles[0];
        let checkHeadTileId = v2(0, checkTile.idVec.y).toString();
        let checkTailTileId = v2(maxCol- 1, checkTile.idVec.y).toString();
        var isValidHead = false;
        var isValidTail = false;
        for (var i = 0; i < scoredTiles.length; i++) {
            if (scoredTiles[i].id == checkHeadTileId) {
                isValidHead = true;
            }
            else if (scoredTiles[i].id == checkTailTileId) {
                isValidTail = true;
            }
        }
        let isHorizontal = isValidHead && isValidTail;
        var mapLines: Map<number, Tile[]> = new Map();
        scoredTiles.forEach(tile => {
            let lineIndex = isHorizontal ? tile.idVec.y : tile.idVec.x;
            if (mapLines.has(lineIndex) == false) {
                mapLines.set(lineIndex, []);
            }
            mapLines.get(lineIndex).push(tile);
        });

        //play multi effect after having all lines
        var firstLine = null;
        mapLines.forEach(tiles => {
            if (firstLine == null) {
                firstLine = tiles;
            }
            else {
                let willEffectTiles = [];
                tiles.forEach(tile => {
                    if (predicateTile(tile)) {
                        willEffectTiles.push(tile);
                    }
                })
                this.doLineEffect(willEffectTiles, null, onTileNeedAction, null);
            }
        })
        if (firstLine != null) {
            SoundController.instance.play("line");
            let willEffectTiles = [];
            firstLine.forEach(tile => {
                    if (predicateTile(tile)) {
                        willEffectTiles.push(tile);
                    }
                })
            this.doLineEffect(willEffectTiles, null, onTileNeedAction, () => {
                onDone && onDone();
            });
        }
    }

    effectX4(type: SuperEffectType, scoredTiles: Tile[], predicateTile: (tile: Tile) => boolean, onTileNeedAction: (tile: Tile) => void, onDone: () => void) {
        if (scoredTiles.length < 0) {
            onDone && onDone();
            return;
        }

        let superTile = scoredTiles.find(tile => tile.getSuperEffect() != SuperEffectType.NONE);
         //logic only applied for square container
         let squareContainer: TileContainerSquare = GameController.instance.currentTileContainer as TileContainerSquare;
         if (squareContainer == null) {
             //console.log("only support square container now");
             onDone && onDone();
             return;
         }

        var colIndexs: number[] = [];
        var rowIndexs: number[] = [];
        scoredTiles.forEach(tile => {
            let checkX = tile.idVec.x;
            let checkY = tile.idVec.y; 
            if (checkX == 0 && rowIndexs.indexOf(checkY) < 0) {
                rowIndexs.push(checkY);
            }
            if (checkY == 0 && colIndexs.indexOf(checkX) < 0) {
                colIndexs.push(checkX);
            }
        });

        let maxColIndex = squareContainer.numberColumns.valueOf() - 1;
        let maxRowIndex = squareContainer.numberRows.valueOf() - 1;
        let maxTilesExceptOneRow = maxColIndex * maxRowIndex;
        if (colIndexs.length == squareContainer.numberColumns.valueOf() && scoredTiles.length < maxTilesExceptOneRow) {
            //effect at border need to check order side
            colIndexs = [];
            rowIndexs = [];
            scoredTiles.forEach(tile => {
                let checkX = tile.idVec.x;
                let checkY = tile.idVec.y; 
                if (checkX == maxColIndex && rowIndexs.indexOf(checkY) < 0) {
                    rowIndexs.push(checkY);
                }
                if (checkY == maxRowIndex && colIndexs.indexOf(checkX) < 0) {
                    colIndexs.push(checkX);
                }
            });
        }

        //sort increase indexs to matching x-y later
        colIndexs.sort((a, b) => a - b);
        rowIndexs.sort((a, b) => a - b);

        let diagonalLineIds: string[] = [];
        for (var i = 0; i < colIndexs.length; i++) {
            if (i < rowIndexs.length) {
                diagonalLineIds.push(v2(colIndexs[i], rowIndexs[i]).toString());
            }
        }

        let diagonalLines: Tile[] = [];
        scoredTiles.forEach(tile => {
            if (diagonalLineIds.indexOf(tile.id) >= 0) {
                diagonalLines.push(tile);
            }
        })

        if (diagonalLines.length <= 0) {
            //console.log("x4 must have diagonalLines")
            onDone && onDone();
            return;
        }
        var centerVec = new Vec3();
        let headDiaVec = diagonalLines[0].node.worldPosition;
        let tailDiaVec = diagonalLines[diagonalLines.length - 1].node.worldPosition;
        centerVec = Vec3.lerp(centerVec, headDiaVec, tailDiaVec, 0.5);

        //first spawn the bir circle effect at center
        let starEffect = this.do5StarsEffect(false, type, superTile, centerVec, null);
        SoundController.instance.play("x4");

        //prepare lines data
        var mapLines: Map<number, Tile[]> = new Map();
        var checkDefinedTiles = []; //use to check duplicate tile
        let addLine = (cachedIndex: number, tile: Tile) => {
            if (mapLines.has(cachedIndex) == false) {
                mapLines.set(cachedIndex, []);
            }
            if (checkDefinedTiles.indexOf(tile) < 0 && predicateTile(tile)) {
                mapLines.get(cachedIndex).push(tile);
                checkDefinedTiles.push(tile)
            }
        }
        scoredTiles.forEach(tile => {
            //check rows
            if (rowIndexs.indexOf(tile.idVec.y) >= 0) {
                let cachedIndex = tile.idVec.y;
                addLine(cachedIndex, tile);
            }
            //check cols
            else if (colIndexs.indexOf(tile.idVec.x) >= 0) {
                let cachedIndex = tile.idVec.x + 50;
                addLine(cachedIndex, tile);
            }            
        });

        //wait a bit then play all line effects
        //play multi effect after having all lines
        var diaTileIndex = -1;
        var nextDiatile = () => {
            return diagonalLines[++diaTileIndex % diagonalLines.length];
        }
        setTimeout(() => {
            SoundController.instance.play("line");
            var firstLine = null;
            mapLines.forEach(tiles => {
                if (firstLine == null) {
                    firstLine = tiles;
                }
                else {
                    this.doLineEffect(tiles, nextDiatile(), onTileNeedAction, null);
                }
            })
            if (firstLine != null) {
                this.doLineEffect(firstLine, nextDiatile(), onTileNeedAction, onDone);
            }
            if (starEffect != null) {
                starEffect.setSiblingIndex(999);
            }
        }, 400);
    }

    getAnimator(node: Node) {
        let anim = this.mapAnimator.get(node);
        if (anim == null) {
            anim = node.getComponent(Animation);
            this.mapAnimator.set(node, anim);
        }

        return anim;
    }

    do5StarsEffect(isSmall: boolean, superType: SuperEffectType, superTile: Tile, pos: Vec3, onDone: () => void): Node {
        let type = isSmall ? EffectType.STAR_5_SMALL : EffectType.STAR_5_BIG;
        let effect = this.getEffect(type);
        // let eleNode = superTile.currentElement.node;
        if (effect == null) {
            onDone && onDone();
            return null;
        }
        //anim elements first
        if (superTile != null){
            superTile.currentElement.setSuperEffect(superType);
            let eleNode = instantiate(superTile.currentElement.node)
            setTimeout(() => {
                eleNode.parent = effect;
                eleNode.worldPosition = effect.worldPosition;
                tween(eleNode).stop();
                tween(eleNode)
                    .to(0.2, {
                        scale: v3(3, 3, 3)
                    }, {
                        easing: easing.backInOut,
                    })
                    .to (0.2, {
                        scale: v3(2, 2, 2)
                    }, {
                        easing: easing.linear
                    })
                    .delay(0.15)
                    .to(0.35, {
                        scale: Vec3.ZERO,
                    }, {
                        easing: easing.backIn
                    })
                    .call(() => {
                        eleNode.destroy();
                    })
                    .start();
            }, 200);
        }

        setTimeout(() => {
            this.playAnimationEffectAt(effect, pos);
        }, superTile != null ? 150 : 0);

        setTimeout(() => {
            this.putEffect(type, effect);
        }, 1000);

        return effect;
    }

    doLineEffect(tiles: Tile[], centerTile: Tile, onTileNeedAction: (tile: Tile) => void, onDone: () => void) {
        if (tiles.length <= 1) {
            onDone && onDone();
            return;
        }
        let animTime = 0.6;
        let isHorizontal = tiles[0].idVec.y == tiles[1].idVec.y;

        //re-sort for sure 
        var centerVec: Vec3 = new Vec3();
        tiles = tiles.sort((a, b) => isHorizontal ? b.idVec.x - a.idVec.x : b.idVec.y - a.idVec.y);
        let headVec = tiles[0].node.worldPosition;
        let tailVec = tiles[tiles.length - 1].node.worldPosition;

        //find supereffectTiles
        if (centerTile != null) {
            centerVec = centerTile.node.worldPosition;
        }
        else {
            centerVec = Vec3.lerp(centerVec, headVec, tailVec, 0.5);
        }

        //spawn anim effect at center first
        let effect = this.getEffect(EffectType.LINE);
        if (effect == null) {
            onDone && onDone();
            return;
        }

        this.playAnimationEffectAt(effect, centerVec);
        effect.angle = isHorizontal ? 90.0 : 0.0; //set angle depend on horizontal or vertical

        let maxDistance = Vec3.distance(headVec, centerVec);
        let checkDistance = Vec3.distance(tailVec, centerVec);
        if (maxDistance < checkDistance) {
            maxDistance = checkDistance;
        }
        let delayTime = 0.25;

        //action disappear for tiles
        for (var i = 0; i < tiles.length; i++) {
            let tileDistance = Vec3.distance(tiles[i].node.worldPosition, centerVec);
            let actionTile = tiles[i];
            setTimeout(() => {
                if (actionTile != null) {
                    this.doNormalEffect(actionTile, onTileNeedAction, null);
                }
            }, Math.min((tileDistance / maxDistance), 1.0) * 300 * (animTime + delayTime));
        }
        
        setTimeout(() => {
            this.putEffect(EffectType.LINE, effect);
            onDone && onDone();
        }, 1000 * (animTime + delayTime));
    }

    doStar3Effect(superTile: Tile, onTileNeedAction: (tile: Tile) => void, onDone: () => void) {
        let superElement = superTile.currentElement;
        let eleNode = superElement.node;
        //first spawn effect on super effect tile
        let effect = this.getEffect(EffectType.STAR_3);
        if (effect == null) return;

        //element anim first //zoom out in
        tween(eleNode).stop();
        tween(eleNode)
            .to(0.15, {
                scale: v3(1.35, 1.35, 1.35)
            }, {
                easing: easing.backInOut,
            })
            .to (0.15, {
                scale: Vec3.ONE,
            }, {
                easing: easing.linear
            })
            .delay(0.15)
            .call(() => {
                //tile now can disable now 
                onTileNeedAction && onTileNeedAction(superTile);
            })
            .start();
        
        //play animator 
        setTimeout(() => {
            this.playAnimationEffectAt(effect,  superTile.node.worldPosition);
        }, 150);

        //overlay element after time
        setTimeout(() => {
            eleNode.parent = this.effectContainer;
            eleNode.setSiblingIndex(effect.getSiblingIndex() + 1);
        }, 250);

        setTimeout(() => {
            onDone && onDone();
        }, 800);

        //put effect back to pool
        setTimeout(() => {
            this.putEffect(EffectType.STAR_3, effect);
        }, 1000);
    }

    doNormalEffect(tile: Tile, onTileNeedAction: (tile: Tile) => void, onDone: () => void) {
        let normalEffect = this.getEffect(EffectType.NORMAL);
        if (normalEffect == null) return;
        //tile should disappear first
        onTileNeedAction && onTileNeedAction(tile);
        setTimeout(() => {
            this.playAnimationEffectAt(normalEffect,  tile.node.worldPosition);
        }, 200);

        //put pool
        setTimeout(() => {
            this.putEffect(EffectType.NORMAL,  normalEffect);
        }, 1000);

        setTimeout(() => {
            onDone && onDone();
        }, 500);

    }

    playAnimationEffectAt(node: Node, worldPos: Vec3) {
        node.parent = this.effectContainer;
        node.worldPosition = worldPos;
        let animator = this.getAnimator(node);
        let state = animator.createState(animator.defaultClip);
        state.time = 0.0;
        state.play();
        animator.play();
    }
}

