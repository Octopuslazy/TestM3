
import { _decorator, Component, Node } from 'cc';
import { SoundController } from '../../Managers/SoundController';
import { PopupAnimation } from './PopupAnimation';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = PopupBase
 * DateTime = Thu Nov 25 2021 22:37:14 GMT+0700 (Indochina Time)
 * Author = wisky3107
 * FileBasename = PopupBase.ts
 * FileBasenameNoExtension = PopupBase
 * URL = db://assets/Scripts/Modules/Popups/PopupBase.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/en/
 *
 */
 
@ccclass('PopupBase')
export class PopupBase extends Component {
    
    @property(PopupAnimation)
    animMain: PopupAnimation = null;

    onLoad() {
        
    }

    start () {
    }

    show(callback: () => void = null) {
        SoundController.instance.play("popupShow");
        this.node.active = true;
        this.animMain.show(() => {
            this.shown();
            if (callback != null) {
                callback();
            }
        });
    }

    shown() {

    }

    doHide() {
        this.hide();
    }

    hide(callback: () => void = null) {
        SoundController.instance.play("popupHide");
        this.animMain.hide(() => {
            if (callback != null) {
                callback();
            }
            this.node.active = false;
        });
    }

}

