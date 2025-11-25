
import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = UIAutoActive
 * DateTime = Wed Dec 22 2021 11:13:58 GMT+0700 (Indochina Time)
 * Author = wisky3107
 * FileBasename = UIAutoActive.ts
 * FileBasenameNoExtension = UIAutoActive
 * URL = db://assets/Scripts/Modules/CommonUIs/UIAutoActive.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/en/
 *
 */
 
@ccclass('UIAutoActive')
export class UIAutoActive extends Component {
    @property(Node) 
    target: Node = null;
    onLoad() {
        setTimeout(() => {
            if (this.node == null) return;
            this.target.active = true;
        }, Math.random() * 3000.0);
    }
}
