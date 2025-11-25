import { _decorator, Component, Node, Sprite, Label, tween, Tween, v3, Vec3, easing, pingPong } from 'cc';
import { MapManager } from '../../Managers/MapManager';
import { SoundController } from '../../Managers/SoundController';
import { MapController } from './MapController';
const { ccclass, property } = _decorator;

export enum LevelState {
    LOCKED,
    UNLOCKED,
    STAR_1,
    STAR_2,
    STAR_3,
    ALL
}

@ccclass('MapLevelItem')
export class MapLevelItem extends Component {
    @property(Label) 
    lbLevel: Label = null;

    @property(Node)
    nodeStateContainer: Node = null;

    @property(Node)
    nodeReward: Node = null;
    
    levelStateNodes: Sprite[] = []; //mapping by enum levelState
    data = null;
    isLocking = false;
    isFocusing = false;
    state = LevelState.LOCKED;
    onLoad() {
        this.levelStateNodes = this.nodeStateContainer.getComponentsInChildren(Sprite);
    }

    init(data, isLocking: boolean) {
        this.data = data;
        this.isLocking = isLocking;

        this.setLevelState(this.getLevelState());
        if (data != null) {
            this.lbLevel.string = isLocking ? "" : this.data.level;
        }
    }
    
    isHaveReward() {
        return this.state == LevelState.UNLOCKED && this.nodeReward != null && MapManager.instance.isLevelHaveReward(this.data.level);
    }

    getLevelState() {
        if (this.isLocking || this.data == null)
            return LevelState.LOCKED;
        return this.data.stars + 1;
    }

    setLevelState(state: LevelState) {
        this.state = state;
        for (var i = 0; i < this.levelStateNodes.length; i++) {
            this.levelStateNodes[i].node.active = i == state;
        }
        
        if (this.isHaveReward()) {
            this.nodeReward.active = true;
        } 
    }

    setFocus(isFocusing: boolean) {
        this.isFocusing = isFocusing;
        if (this.isFocusing == false) {
            tween(this.node)
            .to(0.25,
                {
                    scale: Vec3.ONE,
                })
            .start();
        }
    }

    update(deltaTime) {
        this.updateFocusingState(deltaTime);
    }

    scaleValue = 0;
    updateFocusingState(dt) {
        if (this.isFocusing == false) return;
        this.scaleValue += dt * 0.75;
        var finalValue = pingPong(this.scaleValue, 0.35) + 0.95;
        this.node.setScale(v3(finalValue, finalValue, finalValue));
    }

    //#region callbacks

    onTouch_Main() {
        if (this.isLocking) return;
        MapController.instance.onSelectedLevel(this);
        SoundController.instance.play("button");
    }

    //#endregion
}

