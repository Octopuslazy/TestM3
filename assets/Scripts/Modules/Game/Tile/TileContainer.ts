import { _decorator, Component, NodeEventType, Vec2, Node, v2, Sprite } from 'cc';
import { LevelData } from '../../../Managers/MapManager';
import { SuperEffectType } from '../Element';
import { Tile, TileData } from './Tile';
const { ccclass, property } = _decorator;

@ccclass('TileContainer')
export class TileContainer extends Component {

    @property(Component) 
    tileContainer: Component = null;
    
    @property(Node)
    nodeSelection: Node = null;

    tiles: Tile[] = [];
    tileMap: Map<String, Tile> = null; //mapping by id each container have diff id
    isInteractable = true;
    mapData: LevelData;

    onSwapTile: (dir: Tile, des: Tile) => void = null;
    onStartSwapTile: (dir: Tile, des: Tile) => void = null;
    onRevertSwapTile: () => void = null;

    onLoad() {
        var beginPos = Vec2.ZERO;
        this.node.on(NodeEventType.TOUCH_START, function(event){
            beginPos = event.getUILocation();
            let tile = this.getTileAtPosition(beginPos);
            this.onSelectTile(tile);
        }.bind(this), this.node);
    
        this.node.on(NodeEventType.TOUCH_MOVE, function (event) {
            //control swipe
            let dragPos = event.getUILocation();
            let distance = Vec2.distance(beginPos, dragPos);
            if (distance >= 80.0) {
                let isHorizontal = Math.abs(dragPos.x - beginPos.x) > Math.abs(dragPos.y - beginPos.y);
                if (isHorizontal) {
                    this.onSwipe(v2(dragPos.x > beginPos.x ? 1 : -1, 0));
                }
                else { //vertical
                    this.onSwipe(v2(0, dragPos.y > beginPos.y ? 1 : -1));
                }
            }

        }.bind(this), this.node);
    
        this.node.on(NodeEventType.TOUCH_END, function (event) {

        }, this.node);
    }

    onSwipe(direction: Vec2) {
        if (this.isInteractable == false) return;
        if (this.currentSelectedTile == null) return;
        let targetTileId = v2(this.currentSelectedTile.idVec.x + direction.x, this.currentSelectedTile.idVec.y  + direction.y).toString();
        let targetTile = this.getTile(targetTileId);
        if (targetTile != null) {
            this.setSelectionState(this.currentSelectedTile, false);
            if (this.currentSelectedTile.isSwapable(targetTile)) {
                this.swapTile(this.currentSelectedTile, targetTile);
            }
            
            this.currentSelectedTile = null;
        }
    }

    swapDirTile: Tile = null;
    swapDesTile: Tile = null;
    swapTile(dir: Tile, des: Tile, onDone: () => void = null) {
        this.onStartSwapTile && this.onStartSwapTile(dir, des);
        let result = dir.swap(des, () => {
            if (result) {
                this.onSwapTile && this.onSwapTile(dir, des);
            }
            onDone && onDone();
        })
        if (result) {
            this.swapDirTile = dir;
            this.swapDesTile = des;
        }
    }

    setInteracting(isInteractable: boolean) {
        this.isInteractable = isInteractable;
    }

    revertSwapTile(): boolean {
        if (this.swapDesTile == null || this.swapDirTile == null) return false;
        this.swapTile(this.swapDesTile, this.swapDirTile, () => {
            this.onRevertSwapTile && this.onRevertSwapTile();
        });

        //reset value
        this.swapDesTile = null;
        this.swapDirTile = null;
    }

    currentSelectedTile: Tile = null;
    onSelectTile(tile: Tile) {
        if (this.isInteractable == false) return;
        if (tile == null) return;
        //console.log("selected tile " + tile.id);
        if (this.currentSelectedTile == null) {
            this.currentSelectedTile = tile;
            this.setSelectionState(this.currentSelectedTile, true);
        }
        else {
            if (this.currentSelectedTile.isSwapable(tile)) {
                this.swapTile(this.currentSelectedTile, tile);
                this.setSelectionState(this.currentSelectedTile, false);
                this.currentSelectedTile = null;
            }
            else {
                this.setSelectionState(this.currentSelectedTile, false);
                this.currentSelectedTile = tile;
                this.setSelectionState(this.currentSelectedTile, true);
            }
        }
    }

    setSelectionState(tile: Tile, isCurrentInteracting: boolean) {
        if (tile != null) {
            tile.setSelectedState(isCurrentInteracting);
        }
        if (isCurrentInteracting) {
            this.nodeSelection.active = true;
            this.nodeSelection.worldPosition = tile.node.worldPosition;
        }
        else {
            this.nodeSelection.active = false;
        }
    }

    getSpawnDistance(): number {
        return 0;
    }

    getTileAtPosition(position: Vec2) {
    }

    getSuperEffectTiles(type: SuperEffectType, scoredTiles: Tile[]): Tile[]{
        return [];
    }

    checkScoredTiles(tile: Tile): Tile[] {
        let calTiles = this.checkHorizontal(tile).concat(this.checkVertical(tile));
        var retVal: Tile[] = calTiles.distinct();
        // calTiles.forEach(result => {
        //     if (retVal.indexOf(result) < 0) {
        //         retVal.push(result);
        //     }
        // })
        return retVal;
    }

    checkHorizontal(tile: Tile): Tile[] {
        return [];
    } 
    
    checkVertical(tile: Tile): Tile[] {
        return [];
    } 

    start() {
        //need to init outsite this class
        this.initTiles();
    }

    initTiles() {
        this.tiles = this.tileContainer.getComponentsInChildren(Tile);

        //set Behaviour for eachtiles
        this.setTilesBehaviour();
    }

    //each container have their own logic
    setTilesBehaviour() {

    }

    getTileSize(): number {
        return 0;
    }

    getTile(id: String) {
        return this.tileMap.get(id);
    }

    //each type of container have difference data
    setData(data: LevelData, onDone: () => void) {
        this.mapData = data;
    }

    getDataForNextEmptyTile(): TileData[] {
        return [];
    }

    realignAllElements(): Tile[] {
        return [];
    }

    //elements effect
    setElementFollowTiles(isFollow: boolean) {
        this.tiles.forEach(tile => tile.setElementFollowing(isFollow));
    }
}

