
import { _decorator, Component, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = BackgroundAutoFitWidth
 * DateTime = Wed Nov 17 2021 22:06:29 GMT+0700 (Indochina Time)
 * Author = wisky3107
 * FileBasename = BackgroundAutoFitWidth.ts
 * FileBasenameNoExtension = BackgroundAutoFitWidth
 * URL = db://assets/Scripts/Modules/CommonUIs/BackgroundAutoFitWidth.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/en/
 *
 */
 
@ccclass('BackgroundAutoFitWidth')
export class BackgroundAutoFitWidth extends Component {
    // [1]
    // dummy = '';

    // [2]
    @property(cc.Node)  
    target: cc.Node = null;

    onLoad() {
        let transTarget = this.target.getComponent(UITransform);
        var ratioWidth = cc.visibleRect.width / transTarget.width 
        var ratioHeight = cc.visibleRect.height / transTarget.height 
        if (ratioWidth > ratioHeight) 
        {
            transTarget.width = cc.visibleRect.width
            transTarget.height = transTarget.height * ratioWidth
        }
    }

    start () {
        // [3]
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.3/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.3/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.3/manual/en/scripting/life-cycle-callbacks.html
 */
