import { _decorator, Component, Node, Vec2, v2, randomRangeInt, UITransform, Canvas, View, Layout, math } from 'cc';
import { LevelData } from '../../../Managers/MapManager';
import { ElementType, SuperEffectType } from '../Element';
import { Tile, TileData } from './Tile';
import { TileContainer } from './TileContainer';
const { ccclass, property } = _decorator;

@ccclass('TileContainerSquare')
export class TileContainerSquare extends TileContainer {
    @property(Number)
    numberColumns: Number = 0;

    @property(Number)
    numberRows: Number = 0;

    @property(Layout)
    layoutGrid: Layout = null;

    //#region overrides
    setTilesBehaviour() {
        this.tileMap = new Map();
        var currentRowIndex = 0;
        var currentColIndex = -1;
        this.tiles.forEach(tile => {
            currentColIndex += 1;
            if (currentColIndex >= this.numberColumns) {
                currentColIndex = 0;
                currentRowIndex += 1;
            }

            tile.setId(v2(currentColIndex, currentRowIndex))
            this.tileMap.set(tile.id, tile);

            //set swapble tiles
            var swapIds: String[] = [];
            //left
            if (currentColIndex - 1 >= 0) {
                swapIds.push(v2(currentColIndex - 1, currentRowIndex).toString());
            }
            
            //right
            if (currentColIndex + 1 < this.numberColumns) {
                swapIds.push(v2(currentColIndex + 1, currentRowIndex).toString());
            }

            //upsite
            if (currentRowIndex + 1 < this.numberRows){
                swapIds.push(v2(currentColIndex, currentRowIndex + 1).toString());
            }

            //downsite
            if (currentRowIndex - 1 >= 0){
                swapIds.push(v2(currentColIndex, currentRowIndex - 1).toString());
            }

            tile.swapableTileId = swapIds;

            //set direction to the tile right below this tile on map
            if (tile.getDirection() == null) {
                var belowId = v2(currentColIndex, currentRowIndex - 1).toString();
                var directionNode = this.tileMap.get(belowId);
                tile.setDirection(directionNode);
            }
        });
    }

    dataByColumnMap: Map<number, ElementType[]> = null;
    dataIndexByColumnMap: Map<number, number> = null;

    setData(data: LevelData, onDone: () => void) {
        //temp set test data
        super.setData(data, onDone);

        this.dataByColumnMap = new Map();
        this.dataIndexByColumnMap = new Map();

        this.mapData.getRandomData(ta => {
            var dataStr = ta.text;
            var splitedLine = dataStr.split('\n');

            //init data map 
            for (var i = 0; i < this.numberColumns; i++) {
                this.dataByColumnMap.set(i, []);
                this.dataIndexByColumnMap.set(i, -1);//should set to -1 for current data index to ++ later 
            }

            splitedLine.forEach(line => {
                var elementStr = line.split(' ');
                for (var i = 0; i < this.numberColumns; i++) {
                    var element = ElementType.ELE_1;
                    try {
                        var lineNumberStr = elementStr[i];
                        if (lineNumberStr != null) {
                            element = parseInt(lineNumberStr);
                        }else {
                            element = randomRangeInt(0, ElementType.ALL);
                        }
                    }
                    catch(e) {
                        element = randomRangeInt(0, ElementType.ALL);
                    }

                    this.dataByColumnMap.get(i).push(element);
                }
            })

            onDone && onDone();
        });
    }

    getTileSize(): number {
        return (this.numberColumns.valueOf() * this.numberRows.valueOf());
    }

    getNextElementAtColumn(col: number) {
        var nextIndex = this.dataIndexByColumnMap.get(col) + 1;
        if (nextIndex >= this.dataByColumnMap.get(col).length) return randomRangeInt(0, ElementType.ALL);
        this.dataIndexByColumnMap.set(col, nextIndex);
        return this.dataByColumnMap.get(col)[nextIndex];
    }

    getDataForNextEmptyTile(): TileData[] {
        var retVal: TileData[] = [];

        this.tiles.forEach(tile => {
            if (tile.isEmpty()) {
                var tileData = new TileData();
                tileData.id = tile.id;
                tileData.elementType = this.getNextElementAtColumn(tile.idVec.x);
                retVal.push(tileData);
            }
        })

        return retVal;
    }

    minVec: Vec2 = null;
    getTileAtPosition(position: Vec2) {
        if (this.minVec == null) {
            let uiTrans = this.tileContainer.getComponent(UITransform);
            this.minVec = v2(
                cc.visibleRect.width  / 2.0 +  this.node.position.x - uiTrans.width / 2.0,
                cc.visibleRect.height / 2.0 + this.node.position.y - uiTrans.height / 2.0
            );
        }
        var pointOnContainer = v2(position.x - this.minVec.x, position.y - this.minVec.y);
        
        //calculate tile
        //col 
        let col = Math.floor(pointOnContainer.x / (this.layoutGrid.cellSize.x + this.layoutGrid.spacingX));
        let row = Math.floor(pointOnContainer.y / (this.layoutGrid.cellSize.y + this.layoutGrid.spacingY));

        return this.getTile(v2(col, row).toString());
    }

    checkHorizontal(tile: Tile): Tile[] {
        let retVal: Tile[] = [tile];
        var tileVec = tile.idVec;
        
        //left
        for (var i = tileVec.x - 1; i >= 0; i--) {
            let checkTile = this.checkValidTile(i, tileVec.y, tile);
            if (checkTile != null) {
                retVal.push(checkTile);
            }
            else {
                break;
            }
        }

        //right
        for (var i = tileVec.x + 1; i < this.numberColumns; i++) {
            let checkTile = this.checkValidTile(i, tileVec.y, tile);
            if (checkTile != null) {
                retVal.push(checkTile);
            }
            else {
                break;
            }
        }

        return retVal.length >= 3 ? retVal : [];
    } 
    
    checkVertical(tile: Tile): Tile[] {
        let retVal: Tile[] = [tile];
        var tileVec = tile.idVec;
        
        //bottom
        for (var i = tileVec.y - 1; i >= 0; i--) {
            let checkTile = this.checkValidTile(tileVec.x, i, tile);
            if (checkTile != null) {
                retVal.push(checkTile);
            }
            else {
                break;
            }
        }

        //up
        for (var i = tileVec.y + 1; i < this.numberRows; i++) {
            let checkTile = this.checkValidTile(tileVec.x, i, tile);
            if (checkTile != null) {
                retVal.push(checkTile);
            }
            else {
                break;
            }
        }

        return retVal.length >= 3 ? retVal : [];
    } 

    checkValidTile(col: number, row: number, tile: Tile): Tile {
        let checkVec = v2(col, row).toString();
        let checkTile = this.getTile(checkVec);
        if (checkTile == null) return null;
        if (checkTile.isEmpty()) return null;
        if (tile.isEmpty()) return null;
        if (checkTile != null && checkTile.currentElement.isSame(tile.currentElement)) { //same elelment
            return checkTile;
        }
        return null;
    }

    realignAllElements(): Tile[] {
        var moveToTiles: Tile[] = [];
        this.tiles.forEach(tile => {
            if (tile.isOccupied()) {
                if (tile.directionTile != null && tile.directionTile.isEmpty()) {
                    //find the last empty tile
                    var checkTile = tile.directionTile;
                    while(checkTile.isEmpty() && checkTile.directionTile != null && checkTile.directionTile.isEmpty()) {
                        checkTile = checkTile.directionTile;
                    }

                    this.moveElement(tile, checkTile);
                    moveToTiles.push(checkTile);
                }
            }
        })

        return moveToTiles;
    }

    moveElement(from: Tile, to: Tile, onDone: () => void = null): boolean {
        if (from.currentElement == null) return false;
        if (to.currentElement != null) return false;
        let element = from.currentElement;
        from.currentElement = null;
        to.claimElement(element, false, onDone);
    }

    getSpawnDistance(): number {
        return (this.layoutGrid.cellSize.y + this.layoutGrid.spacingY) * this.numberRows.valueOf();
    }

    getSuperEffectTiles(type: SuperEffectType, scoredTiles: Tile[]): Tile[]{
        var retVal: Tile[] = [];

        let addTile = (col: number, row: number) => {
            let tile = this.getTile(v2(col, row).toString());
                if (tile != null && retVal.indexOf(tile) < 0) {
                    retVal.push(tile);
                }
        }

        let getMinMax = () => {
            var minX = this.numberColumns.valueOf();
            var maxX = 0;
            var minY = this.numberRows.valueOf();
            var maxY = 0;

            scoredTiles.forEach(tile => {
                if (tile.idVec.x < minX) minX = tile.idVec.x;
                if (tile.idVec.x > maxX) maxX = tile.idVec.x;

                if (tile.idVec.y < minY) minY = tile.idVec.y;
                if (tile.idVec.y > maxY) maxY = tile.idVec.y;
            }); 
            return [minX, maxX, minY, maxY];
        }
        
        if (type == SuperEffectType.X1) {
            let superTile = scoredTiles.find(tile => tile.getSuperEffect() == type);
            let unSuperTile = scoredTiles.find(tile => tile.getSuperEffect() != type);
            let isHorizontal = superTile.idVec.y == unSuperTile.idVec.y;
            let maxIndex = isHorizontal ? this.numberColumns : this.numberRows;
            for (var i = 0; i < maxIndex; i++) {
                addTile(isHorizontal ? i : scoredTiles[0].idVec.x, isHorizontal ? scoredTiles[0].idVec.y : i)
            }
            return retVal;
        }

        if (type == SuperEffectType.X2) {
            var [minX, maxX, minY, maxY] = getMinMax();

            if (minX == maxX) {
                minX = Math.max(0, minX - Math.floor(scoredTiles.length / 2.0))
                maxX = Math.min(this.numberColumns.valueOf(), minX + scoredTiles.length - 1);
            }

            if (minY == maxY) {
                minY = Math.max(0, minY - Math.floor(scoredTiles.length / 2.0))
                maxY = Math.min(this.numberRows.valueOf(), minY + scoredTiles.length - 1);
            }

            //add all the tile to zones
            for (var i = minX; i <= maxX; i++) {    
                for (var j = minY; j <= maxY; j++) {
                    addTile(i, j);                    
                }
            }

            return retVal;
        }

        if (type == SuperEffectType.X3) {
            var [minX, maxX, minY, maxY] = getMinMax();

            if (minX == maxX) {
                minX = Math.max(0, minX - Math.floor(scoredTiles.length / 2.0));
                maxX = Math.min(this.numberColumns.valueOf(), minX + scoredTiles.length - 1);
                minY = 0;
                maxY = this.numberRows.valueOf();
            }
            else{
                minY = Math.max(0, minY - Math.floor(scoredTiles.length / 2.0))
                maxY = Math.min(this.numberRows.valueOf(), minY + scoredTiles.length - 1);
                minX = 0;
                maxX = this.numberColumns.valueOf();
            }

            //add all the tile to zones
            for (var i = minX; i <= maxX; i++) {    
                for (var j = minY; j <= maxY; j++) {
                    addTile(i, j);                    
                }
            }

            return retVal;
        }

        if (type == SuperEffectType.X4) {
            var [minX, maxX, minY, maxY] = getMinMax();

            if (minX == maxX) {
                minX = Math.max(0, minX - Math.floor(scoredTiles.length / 2.0));
                maxX = Math.min(this.numberColumns.valueOf(), minX + scoredTiles.length - 1);
                minY = 0;
                maxY = this.numberRows.valueOf();
            }
            else {
                minY = Math.max(0, minY - Math.floor(scoredTiles.length / 2.0))
                maxY = Math.min(this.numberRows.valueOf(), minY + scoredTiles.length - 1);
                minX = 0;
                maxX = this.numberColumns.valueOf();
            }

            //add all the tile to zones
            for (var i = minX; i <= maxX; i++) {    
                for (var j = minY; j <= maxY; j++) {
                    addTile(i, j);                    
                }
            }

            [minX, maxX, minY, maxY] = getMinMax();
            if (minX == maxX) {
                minX = 0;
                maxX = this.numberColumns.valueOf();
            }

            if (minY == maxY) {
                minY = 0;
                maxY = this.numberRows.valueOf();
            }
             //add all the tile to zones
             for (var i = minX; i <= maxX; i++) {    
                for (var j = minY; j <= maxY; j++) {
                    addTile(i, j);                    
                }
            }
            return retVal;
        }

        return retVal;
    }
    //#endregion
}

