
import { _decorator, Component, Node, tween, UIOpacity, easing } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = UIFadeNode
 * DateTime = Wed Nov 17 2021 22:18:32 GMT+0700 (Indochina Time)
 * Author = wisky3107
 * FileBasename = UIFadeNode.ts
 * FileBasenameNoExtension = UIFadeNode
 * URL = db://assets/Scripts/Modules/CommonUIs/UIFadeNode.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/en/
 *
 */
 
@ccclass('UIFadeNode')
export class UIFadeNode extends Component {
  
  @property(UIOpacity)
  mainOpacity: UIOpacity = null;  
    
  isOn = false;

  setState(isOn, isNow = false) {
      if (this.isOn === isOn) return;
      this.isOn = isOn;
      if (isNow) {
        this.node.active = isOn
        return;
      }
      if (isOn) {
        this.mainOpacity.opacity = 0;
        this.node.active = true;
      }
      tween(this.mainOpacity).stop();
      tween(this.mainOpacity)
      .to(0.35, 
        {
          opacity: isOn ? 255 : 0
        },{
          easing: easing.linear
        })
        .call(() => {
          this.node.active = isOn;
          if (isOn) this.shown();
          else this.hided();
        })
        .start();
  }

  shown() {

  }

  hided() {

  }
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
