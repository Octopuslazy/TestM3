import { _decorator, Component, Node } from 'cc';
import { MapData } from './MapManager';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager {
    static instance: GameManager = null;
    isInitialized = false;

    gameData: MapData = null;
    userData = null;
    isHaveTutorial = false;
    isHaveRewardTutorial = true;
    static initialize() {
        if (GameManager.instance == null) {
            let manager = new GameManager();
            GameManager.instance = manager;
            GameManager.instance.initializeStats();
        }
    }

    initializeStats() {
        if (this.isInitialized) return;
        this.isInitialized = true;
    }

    setGameData(data: MapData) {
        this.gameData = data;
    }

    setUserData(data) {
        this.userData = data;
    }

    backToHome() {
        window.top.postMessage('exit-game', '*')
        // window.location = "https://www.songvuihomecredit.com/";
    }
}

