import { _decorator, Component, Node, Label, UITransform, v3, tween, Vec3, easing, randomRangeInt, TiledTile, SpriteFrame, Sprite } from 'cc';
import { UIFadeNode } from '../../CommonUIs/UIFadeNode';
import { GameManager } from '../../Managers/GameManager';
import { SoundController } from '../../Managers/SoundController';
import { PopupBase } from '../Popups/PopupBase';
import { GameController, GameState } from './GameController';
const { ccclass, property } = _decorator;

@ccclass('UIGameController')
export class UIGameController extends Component {
    static instance: UIGameController = null;

    //#region ingames
    @property(Label)
    lbRemainTurns: Label = null;

    @property(Label)
    lbScore: Label = null;

    @property(Label)
    lbTime: Label = null;

    @property(Label)
    lbLevel: Label = null;

    @property([Node])
    nodeStars: Node[] = [];

    @property(UITransform)
    transScoreProgressBG: UITransform = null;

    @property(UITransform)
    transScoreProgressFG: UITransform = null;

    data = null;

    onLoad() {
        UIGameController.instance = this;
    }

    setGameData(data) {
        this.data = data;

        this.lbLevel.string = data.level;
        this.lbRemainTurns.string = data.turns;
        this.lbTime.string = this.converTime(data.time);
        this.lbScore.string = "0";
        this.updateProgress(0, 0);
    }

    converTime(seconds: number): string {
        let result = new Date(seconds * 1000).toISOString().slice(14, 19);
        return result;
    }

    updateTime(time: number) {
        //second conver 
        this.lbTime.string = this.converTime(time);
        //anim 
        if (time < 20) {
            this.animLabel(this.lbTime.node);
        }
    }

    updateTurns(turns: number) {
        this.lbRemainTurns.string = turns + "";
        //anim 
        this.animLabel(this.lbRemainTurns.node);
    }

    updateScore(score: number) {
        this.lbScore.string = score + "";
        //anim 
        this.animLabel(this.lbScore.node);
    }

    oldStar: number = 0;
    updateProgress(ratio: number, stars: number) {
        if (this.oldStar != stars) {
            this.oldStar = stars;
            this.animStar();
        }
        //progress
        this.transScoreProgressFG.width = this.transScoreProgressBG.width * Math.min(1.0, (0.1 + ratio* 0.9));

        //stars
        for (var i = 0; i < this.nodeStars.length; i++) {
            this.nodeStars[i].active = i < stars;
        }
    }

    animStar() {
        var animedStar = this.nodeStars[this.oldStar - 1];
        if (animedStar == null) return;
        animedStar.scale = v3(2.0, 2.0, 2.0);
        tween(animedStar)
        .to(1.0, 
            {
                scale: Vec3.ONE,
            }, {
                easing: easing.quartIn,
            })
        .start();

        tween(animedStar)
        .to(0.2, 
            {
                angle: -randomRangeInt(15, 45)
            }, {
                easing: easing.backOut
            })
        .to(0.2, 
            {
                angle: randomRangeInt(15, 45)
            }, {
                easing: easing.backOut
            })
        .to(0.2, 
            {
                angle: -randomRangeInt(15, 45)
            }, {
                easing: easing.backOut
            })
        .to(0.2, 
            {
                angle: randomRangeInt(15, 45)
            }, {
                easing: easing.backOut
            })
        .to(0.1, 
            {
                angle: 0
            }, {
                easing: easing.backOut
            })
        .start();
    }

    animLabel(node: Node) {
        node.scale = v3(1.2, 1.2, 1.2);
        tween(node) 
        .to(
            0.35, 
            {
                scale: Vec3.ONE
            }, {
                easing: easing.backOut
            }
        )
        .start();
    }

    //#endregion

    //#region loading

    //#region show reward

    @property(PopupBase)
    popupReward: PopupBase = null;

    @property(Label)
    lbReward: Label = null;

    rewardClaimCallback: () => void = null;
    showReward(reward: string, onClaim: () => void) {
        this.rewardClaimCallback = () => {
            this.rewardClaimCallback = null;
            this.popupReward.hide();
            onClaim && onClaim();
        };

        this.lbReward.string = "BẠN NHẬN ĐƯỢC\n" + reward.toUpperCase();
        this.popupReward.show();
    }

    //#endregion

    @property(Node)
    nodeLoading: Node = null;

    setLoading(isLoading: boolean) {
        this.nodeLoading.active = isLoading;
    }

    //#endregion

    //#region end game 

    @property(PopupBase)
    popupEndGame: PopupBase = null;

    @property(Label)
    lbEndGameTitle: Label = null;

    @property(Label)
    lbEndGameMessage: Label = null;
    
    @property(Label)
    lbEndGameConfirm: Label = null;

    @property([Node])
    nodeEndGameStars: Node[] = [];

    @property(Sprite)
    sprtEndGamePanel: Sprite = null;

    @property([SpriteFrame])
    sfEndGamePanel: SpriteFrame[] = [];

    gameEndConfirmCallback: () => void = null;

    showEndGame(title: string, message: string, confirm: string, stars: number, confirmCallback: () => void) {
        this.lbEndGameTitle.string = title;
        this.lbEndGameConfirm.string = confirm;
        this.lbEndGameMessage.string = message;
        
        this.gameEndConfirmCallback = confirmCallback;

        try {
            //stars
            for (var i = 0; i < this.nodeEndGameStars.length; i++) {
                let isActive = i == stars - 1;
                this.nodeEndGameStars[i].active = isActive;
                if (isActive) {
                    //anim 
                    let animNode = this.nodeEndGameStars[i];
                    animNode.setScale(v3(1.3, 1.3, 1.3));
                    tween(animNode).stop();
                    tween(animNode)
                    .to(1.0, 
                        {
                            scale: Vec3.ONE,
                        },
                        {
                            easing: easing.elasticInOut
                        })
                        .start();
                    SoundController.instance.play("star" + stars);
                }
            }
            this.sprtEndGamePanel.spriteFrame = this.sfEndGamePanel[stars];
        }
        catch {
            //console.log("ERROR show end game")
        }

        this.popupEndGame.show();
    }  
    
    hideEndGame() {
        this.popupEndGame.hide();
        this.gameEndConfirmCallback = null;
    }

    //#endregion

    //#region tutorials

    //#region back to map

    @property(PopupBase)
    popupBackToMap: PopupBase = null;

    //#endregion

    @property(PopupBase)
    popupTutorial: PopupBase = null;

    @property([UIFadeNode])
    tutorials: UIFadeNode[] = [];

    currentTutorialIndex = 0;
    onDoneTutorial: () => void = null;
    showTutorial(onDone: () => void) {
        GameManager.instance.isHaveTutorial = false;
        this.onDoneTutorial = onDone;
        this.popupTutorial.show();
        this.currentTutorialIndex = -1;
        this.goNextTutorial();
    }

    doneTutorial() {
        this.popupTutorial.hide();
        this.onDoneTutorial && this.onDoneTutorial();
    }

    setTutorialIndex(index: number) {
        for (var i = 0; i < this.tutorials.length; i++) {
            this.tutorials[i].setState(i == index);
        }
    }

    goNextTutorial() {
        this.setTutorialIndex(++this.currentTutorialIndex);
        if (this.currentTutorialIndex >= this.tutorials.length) {
            this.doneTutorial();
        }
    }

    //#endregion

    //#region callbacks
    
    onTouch_TutorialNext() 
    {
        this.goNextTutorial();
    }

    onTouch_TutorialSkip() {            
        this.doneTutorial();
    }

    onTouch_Reward_Claim() {
        this.rewardClaimCallback && this.rewardClaimCallback();
    }

    onTouch_GameEnd_Confirm() {
        this.gameEndConfirmCallback && this.gameEndConfirmCallback();
        this.gameEndConfirmCallback = null;
        this.hideEndGame();
        SoundController.instance.play("button");
    }

    onTouch_BackToMap() {
        if (GameController.instance.state == GameState.INIT) return;
        this.popupBackToMap.show();
    }

    onTouch_Back() {
        if (this.gameEndConfirmCallback != null) {
            this.hideEndGame();
        }
        GameController.instance.doLoadScene();
        SoundController.instance.play("button");
    }

    //#endregion
}

