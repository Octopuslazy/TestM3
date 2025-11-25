import { _decorator, Component, Node, Scene, UIOpacity, director } from 'cc';
import { SceneName } from '../../Constants/Constants';
import { requestGetData, setToken } from '../../Managers/APIManager';
import { GameManager } from '../../Managers/GameManager';
import { MapManager } from '../../Managers/MapManager';
import { getTokenParam } from '../../Utils/Utils';
import { PopupBase } from '../Popups/PopupBase';
const { ccclass, property } = _decorator;

@ccclass('SplashController')
export class SplashController extends Component {
   preloadStepCount = 0;

   onLoad() {
       this.checkCreateGameManager();
       this.preloadStepCount = 0;
       this.processSplash();
       this.processAPI();
   }

   checkCreateGameManager() {
       GameManager.initialize();
   }

   processSplash() {
       //init managers
       GameManager.instance.initializeStats();
       this.checkToLoadScene = this.checkToLoadScene.bind(this);
   }

   processAPI() {
        this.step_GetToken()
        .then(res => this.step_GetGameData())
        .then(res => this.step_LoadMapScene())
        .then( res => {
            //all done
        })
        .catch(error => {
            this.showError();
        });
   }
   
   step_GetToken() {
    return new Promise((resolve, reject) => {
        var token = window.localStorage.getItem('match_3_token');
        // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF5ZXJfaWQiOjYwOTAsImdhbWVfaWQiOiI0NDkzIiwicm9sZXMiOlsibWF0Y2hfMyJdLCJleHAiOjE2NzI5ODk5ODR9.0DcwU2_TZx_5_3IiA0RKrgncAKwCgYeoi1UaIWROgtw";
        if (token != '') {
            //console.log("Token is " + token);
            setToken(token); 
        }
        resolve("success");
    })
   }

   step_GetGameData() {
    return new Promise((resolve, reject) => {
        requestGetData(result => {
            if (result.isSuccess) {
                //set map
                MapManager.instance.setServerMapData(result.data.history);
                //set game data
                GameManager.instance.setUserData(result.data);
                //set tutorial
                GameManager.instance.isHaveTutorial = result.data.history.length <= 0;
                resolve("success");
            }
            else {
                reject(result.message);
            }
        })
    })
   }

   step_LoadMapScene() {
    return new Promise((resolve, reject) => {
        this.checkToLoadScene();
        resolve("success");
    })
   }

   checkToLoadScene() {
       director.preloadScene(SceneName.MAP, () => {
        //    SoundController.instance.stopAllEffects();
           director.loadScene(SceneName.MAP);
       })
   }

   //#region erroes

   @property(PopupBase) 
   popupError: PopupBase = null;

   showError() {
    this.popupError.show();
   }

   //#endregion

   onTouch_Error_Confirm() {
        GameManager.instance.backToHome();
   }
}

