import { _decorator, Component, Node, Sprite, Color, color, UITransform, Vec2, Size, v2, Vec3, randomRange, pingPong } from 'cc';
import { ElementManager } from '../../Managers/ElementManager';
const { ccclass, property } = _decorator;

export enum ElementType {
    ELE_1,
    ELE_2,
    ELE_3,
    ELE_4,
    // ELE_5,
    ALL
}

export enum SuperEffectType {
    NONE,
    X1,
    X2,
    X3,
    X4
}

@ccclass('Element')
export class Element extends Component {
    type: ElementType = ElementType.ALL;
    superEffect:SuperEffectType = SuperEffectType.NONE;

    sprtMain: Sprite = null;
    uiTrasnform: UITransform = null;
    onLoad() {
        this.sprtMain = this.getComponent(Sprite);
        this.uiTrasnform = this.getComponent(UITransform);
    }
    
    update(dt) {
        this.updateFollowing(dt);
    }

    setSize(size: Size) {
        this.uiTrasnform.setContentSize(size);
    }

    isSame(ele: Element) {
        return this.type == ele.type;
    }

    init(type: ElementType) {
        this.type = type;
        this.setSuperEffect(SuperEffectType.NONE);
    }

    setSuperEffect(type: SuperEffectType) {
        this.superEffect = type;
        var sprite = ElementManager.instance.getElementSprite(this.type, this.superEffect);
        if (sprite == null) {
            sprite = ElementManager.instance.getElementSprite(this.type, SuperEffectType.NONE);
        }
        this.sprtMain.spriteFrame = sprite;
    }

    getColor() {
        switch(this.type){
            case ElementType.ELE_1:
                return Color.BLUE;
            case ElementType.ELE_2:
                return Color.GREEN;
            case ElementType.ELE_3:
                return Color.CYAN;
            case ElementType.ELE_4:
                return Color.MAGENTA;
            // case ElementType.ELE_5:
            //     return Color.YELLOW;
            default:
                return Color.BLACK;
            }
    }

    speedRange: Vec2 = v2(2500, 2500);
    randomXRange: Vec2 = v2(-300, 300);
    randomX: number = 0;
    speed: number = 3000.0;
    target: Node = null;
    dirVec: Vec3 = null;
    setFollowTarget(target: Node) {
        this.target = target;
        if (target != null) {
            this.speed = randomRange(this.speedRange.x, this.speedRange.y);
            this.randomX = randomRange(this.randomXRange.x, this.randomXRange.y);
            this.dirVec = target.worldPosition;
        }
    }

    updateFollowing(dt) {
        if (this.target == null) return;
        var ratio = Math.min((this.speed * dt) / Vec3.distance(this.node.worldPosition, this.target.worldPosition), 1.0);
        var finalVec = new Vec3();
        Vec3.lerp(finalVec, this.node.worldPosition, this.target.worldPosition, ratio);
        this.node.worldPosition = finalVec;
    }
}

