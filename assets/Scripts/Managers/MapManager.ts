import { _decorator, Component, Node, TextAsset, Prefab, randomRangeInt, resources, game, director } from 'cc';
import { LevelState } from '../Modules/Map/MapLevelItem';
const { ccclass, property } = _decorator;

@ccclass('LevelData')
export class LevelData {
    @property(Number)
    level: number = 0;

    @property(String)
    loadFolderName: string = "";

    @property(Prefab)
    prefab: Prefab = null;

    currentMap = "";
    getRandomData(onLoaded: (text: TextAsset) => void) {
        var path = "maps/" + this.loadFolderName;
        path += "/map_" + randomRangeInt(1, 101);
        this.currentMap = path;
        resources.load(path, TextAsset, (err, text) => {
            onLoaded && onLoaded(text);
        });
    }
}

@ccclass('MapData')
export class MapData{
    level: number = 0;
    stars: number = 0;
    time: number = 0;
    score: number = 0;
    turns: number = 0;
}

@ccclass('MapManager')
export class MapManager extends Component {
    @property(TextAsset)
    assetMapData: TextAsset = null;

    public static instance: MapManager;

    @property([LevelData])
    levelData: LevelData[] = [];

    mapData: MapData[] = [];
    rewardLevel: number[] = [3, 6, 9, 12, 15, 18, 20];

    onLoad() {
        MapManager.instance = this;
        game.addPersistRootNode(this.node);
        this.initMapData();
    }

    getLevelData(level: number): LevelData {
        //only have 4 difficulty level 
        level = Math.min(Math.floor(level / 5.1), this.levelData.length - 1);

        for (var i = 0; i < this.levelData.length; i++) {
            if (this.levelData[i].level == level) return this.levelData[i];
        }
        return null;
    }

    isLevelHaveReward(level: number) {
        return this.rewardLevel.indexOf(level) >= 0;
    }

    initMapData() {
        var csvStr = this.assetMapData.text;
        var splitedCSV = csvStr.split('\n');
        //load by csv later
        this.mapData = [];
        for (var i = 0; i < 20; i++) {
            if (i < splitedCSV.length) {
                let spliedLine = splitedCSV[i].split(',');
                this.mapData.push({
                    level: i + 1,
                    stars: 0,
                    time: parseInt(spliedLine[1]),
                    turns: parseInt(spliedLine[3]),
                    score: parseInt(spliedLine[2])
                })
                continue;
            }
            this.mapData.push({
                level: i + 1,
                stars: 0,
                time: 300,
                turns: 30,
                score: 1000
            })
        }
    }

    getDataByLevel(level: number) {
        try {
            return this.mapData[level - 1];
        }   
        catch {
            return null;
        }
    } 

    setServerMapData(data) {
        data.forEach(map => {
            if (this.mapData[map.level - 1] != null) {
                //update data depend on server
                this.mapData[map.level - 1].stars = map.star;
            }
        });
    }
}

