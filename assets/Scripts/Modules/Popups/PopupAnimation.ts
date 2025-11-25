
import { _decorator, Component, Node, Animation, AnimationClip, tween, Vec3, easing } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = PopupAnimation
 * DateTime = Fri Nov 26 2021 14:22:25 GMT+0700 (Indochina Time)
 * Author = wisky3107
 * FileBasename = PopupAnimation.ts
 * FileBasenameNoExtension = PopupAnimation
 * URL = db://assets/Scripts/Modules/Popups/PopupAnimation.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/en/
 *
 */
 
@ccclass('PopupAnimation')
export class PopupAnimation extends Component {
    
    mainAnim: Animation = null;
    clips: AnimationClip[] = [];
    onLoad() {
        this.mainAnim = this.getComponent(Animation);
        this.clips = this.mainAnim.clips;
    }

    showTimeout = -1;
    hideTimeout = -1;

    show(callback: () => void = null) {
        this.onShownCallback = callback;
        if (this.mainAnim) {
            this.mainAnim.play("show");
        }
        clearTimeout(this.showTimeout);
        clearTimeout(this.hideTimeout);
        this.showTimeout = setTimeout(() => {
            this.onShown();
        }, 500);
    }

    hide(callback: () => void = null) {
        this.onHidedCallback = callback;
        if (this.mainAnim) {
            this.mainAnim.play("hide");
        }

        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            this.onHided();
        }, 500);
    }

    onShownCallback: () => void = null;
    onShown() {
        //console.log("onShown")
        if (this.onShownCallback) {
            this.onShownCallback();
        }
    }

    onHidedCallback: () => void = null;
    onHided() {
        //console.log("onHide")
        if (this.onHidedCallback) {
            this.onHidedCallback();
        }
    }

}
