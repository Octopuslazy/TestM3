import { _decorator, Component, Node, SpriteFrame, Color } from 'cc';
import { ElementType, SuperEffectType } from '../Modules/Game/Element';
const { ccclass, property } = _decorator;

@ccclass('ElementManager')
export class ElementManager extends Component {
    static instance: ElementManager;
    
    @property([Color])
    elementColors: Color[] = []; //note that mapping by enum ElementTypeIndex

    @property([SpriteFrame])
    elementSprites: SpriteFrame[] = []; //note that mapping by enum ElementTypeIndex

    @property([SpriteFrame])
    elementX1Sprites: SpriteFrame[] = []; //note that mapping by enum ElementTypeIndex

    @property([SpriteFrame])
    elementX2Sprites: SpriteFrame[] = []; //note that mapping by enum ElementTypeIndex

    @property([SpriteFrame])
    elementX3Sprites: SpriteFrame[] = []; //note that mapping by enum ElementTypeIndex

    @property([SpriteFrame])
    elementX4Sprites: SpriteFrame[] = []; //note that mapping by enum ElementTypeIndex
    
    onLoad() {
        ElementManager.instance = this;
    }

    getElementSprite(type: ElementType, superType: SuperEffectType = SuperEffectType.NONE): SpriteFrame {
        var spriteArrays = [];
        switch(superType) {
            case SuperEffectType.X1:
                spriteArrays = this.elementX1Sprites;
                break;
            case SuperEffectType.X2:
                spriteArrays = this.elementX2Sprites;
                break;
            case SuperEffectType.X3:
                spriteArrays = this.elementX3Sprites;
                break;
            case SuperEffectType.X4:
                spriteArrays = this.elementX4Sprites;
                break;
            default:
                spriteArrays = this.elementSprites;
                break;
        }
        try {
            return spriteArrays[type];
        }
        catch(e) {
            return null;
        }
    }

    getElementColor(type: ElementType) {
        try {
            return this.elementColors[type]
        }catch{
            return null;
        }
    }
}

