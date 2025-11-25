import { _decorator, Component, Node, Vec2, misc, v2, debug, Sprite, Color, color, Tween, tween, easing, Vec3, v3, UITransform } from 'cc';
import { ElementManager } from '../../../Managers/ElementManager';
import { Element, ElementType, SuperEffectType } from '../Element';
const { ccclass, property } = _decorator;

export class TileData {
    id: string = "";
    elementType: ElementType = ElementType.ALL;
}

@ccclass('Tile')
export class Tile extends Component {

    @property({type: Node})
    nodeDirection: Node = null;
7
    @property({type: Node})
    nodeDebugDirectionArrow: Node = null;

    currentElement: Element = null;

    idVec: Vec2 = null;
    id: string = null;

    swapableTileId: String[] = [];

    sprtMain: Sprite = null;
    directionTile: Tile = null;
    transMain: UITransform = null;
    onLoad() {
        if (this.nodeDirection != null) {
            let tile = this.nodeDirection.getComponent(Tile);
            this.setDirection(tile);
        }
        this.sprtMain = this.getComponent(Sprite);
        this.transMain = this.getComponent(UITransform);
    }

    isEmpty() {
        return this.currentElement == null;
    }

    isOccupied() {
        return this.currentElement != null;
    }

    getSuperEffect() {
        if (this.currentElement == null) return SuperEffectType.NONE;
        return this.currentElement.superEffect;
    }

    exploseElement() {
        let retVal = this.currentElement;
        this.currentElement = null;
        return retVal;
    }

    claimTween: Tween<Node> = null;
    claimElement(ele: Element, isNow: boolean, onDone: () => void = null) {
        this.currentElement = ele;
        this.currentElement.setSize(this.transMain.contentSize)
        if (isNow) 
        {
            ele.node.worldPosition = this.node.worldPosition;
            ele.node.setSiblingIndex(this.node.getSiblingIndex());
            onDone && onDone();
            return;
        }
        let time = 0.5;
        tween(ele.node).stop();
        this.claimTween?.removeSelf() 
        this.claimTween = tween(ele.node)
        .to(0.5, 
            {
                worldPosition: this.node.worldPosition
            },
            {
                easing: easing.quartOut
            }
            )
            .call(() => {
                //complete
                ele.node.setSiblingIndex(this.node.getSiblingIndex());
                onDone && onDone();
            })
            .start();

        //zoom action
        let centerScale = 1.35;
        if (ele.node.worldPosition.x < this.node.worldPosition.x || 
            ele.node.worldPosition.y < this.node.worldPosition.y) {
                centerScale = 0.7;
        }
        tween(ele.node)
        .sequence(
            tween(ele.node)
            .to(
                time / 2.0,
                {
                    scale: v3(centerScale, centerScale, centerScale)
                },
                {
                    easing: easing.quartOut
                }
            ),
            tween(ele.node)
            .to(
                time / 2.0,
                {
                    scale: Vec3.ONE,
                }
            )
        )
        .start();
    }

    claimNewElement(ele: Element, distance: number, onDone: () => void = null) {
        ele.node.worldPosition = v3(this.node.worldPosition.x, this.node.worldPosition.y + distance, this.node.worldPosition.z);
        this.claimElement(ele, false, onDone);
    }

    setDirection(tile: Tile) {
        if (tile == null) return;
        this.nodeDirection = tile.node;
        this.directionTile = tile;

        //draw debug arrow
        return;
        if (this.nodeDebugDirectionArrow != null) {
            if (this.nodeDirection != null) {
                this.nodeDebugDirectionArrow.active = true;
                var directionVec = v2(this.nodeDirection.position.x - this.node.position.x, this.nodeDirection.position.y - this.node.position.y).normalize(); 
                var angle = misc.radiansToDegrees(Vec2.UNIT_Y.angle(directionVec));
                this.nodeDebugDirectionArrow.angle = -angle;
            }
            else {
                this.nodeDebugDirectionArrow.active = false;
            }
        }
    }

    setId(idVec: Vec2) {
        this.idVec = idVec;
        this.id = idVec.toString();
    }

    setSelectedState(isSelecting: boolean) {
        var selectionColor = Color.RED;
        if (this.currentElement != null) {
            selectionColor = ElementManager.instance.getElementColor(this.currentElement.type);
        }
        this.sprtMain.color = isSelecting ? selectionColor : Color.WHITE;
    }

    isSwapable(tile: Tile) {
        return this.swapableTileId.indexOf(tile.id) >= 0;
    }

    swap(tile: Tile, onDone: () => void) {
        if (tile.isEmpty() || this.isEmpty()) {
            //console.log("can not swap two empty tile");
            return false;
        }
        var tmpElement = tile.currentElement;
        tile.claimElement(this.currentElement, false, null);
        this.claimElement(tmpElement, false, onDone);
        return true;
    }

    setElementFollowing(isFollowing: boolean) {
        if (this.currentElement == null) return;
        this.currentElement.setFollowTarget(isFollowing ? this.node : null);
    }

    getDirection() {
        return this.nodeDirection;
    }

    start() {
    }
}

