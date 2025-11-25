import { _decorator, Component, Node, director, randomRangeInt, UIOpacity, tween, earcut, easing, v3, pingPong, Label, Button, Sprite } from 'cc';
import { UIFadeNode } from '../../CommonUIs/UIFadeNode';
import { SceneName } from '../../Constants/Constants';
import { requestClaimStarsReward, requestClaimStreakReward, requestGetData, requestPlayGame } from '../../Managers/APIManager';
import { GameManager } from '../../Managers/GameManager';
import { MapData, MapManager } from '../../Managers/MapManager';
import { SoundController } from '../../Managers/SoundController';
import { isMuted, setMute } from '../../Utils/Utils';
import { PopupBase } from '../Popups/PopupBase';
import { RankController } from '../Ranking/RankController';
import { LevelState, MapLevelItem } from './MapLevelItem';
const { ccclass, property } = _decorator;

@ccclass('MapController')
export class MapController extends Component {
    static instance: MapController = null;

    @property(Node) 
    levelContainer: Node = null;
    
    @property(UIOpacity) 
    opacityMain: UIOpacity = null;

    @property(Label)
    lbStars: Label = null;

    @property(Label)
    lbTurns: Label = null;

    @property(Label)
    lbRemainTime: Label = null;

    @property(Node) 
    nodeBlocking: Node = null;

    levelItems: MapLevelItem[] = [];
    currentSelectedLevel: MapLevelItem = null;
    onLoad() {
        if (GameManager.instance == null) {
            director.loadScene(SceneName.SPLASH);
            return;
        }
        MapController.instance = this;
    }

    start() {
        this.initLevels();
        this.initData();
        this.initSound();
        this.initUIs();
        this.checkShowTutorial();
        // this.checkShowRewardTutorial();
    }

    checkShowTutorial() {
        if (GameManager.instance.isHaveTutorial) {
            this.showTutorial();
        }
    }
    checkShowRewardTutorial() {
        if (GameManager.instance.isHaveRewardTutorial) {
            GameManager.instance.isHaveRewardTutorial = false;
            this.showRewardTutorial();
        }
    }

    initLevels() {
        this.levelItems = this.levelContainer.getComponentsInChildren(MapLevelItem);
    }

    initData() {
        //fake data 
        var data = MapManager.instance.mapData;
        this.updateLevel(data);

        //recall sync data for sure 
        this.requestSyncData();
    }

    updateLevel(data) {
        var isLocking = false;
        for (var i = 0; i < this.levelItems.length; i++) {
            if (i > 0 && isLocking == false && data[i - 1].stars <= 0 ) {
                isLocking = true;

                //set focus on last item
                this.levelItems[i - 1].setFocus(true);
                this.levelItems[i - 1].node.setSiblingIndex(this.levelItems.length);
            }
            this.levelItems[i].init(data[i], isLocking);
        }
    }

    setBlocking(isBlocking: boolean) {
        this.nodeBlocking.active = isBlocking;
    }

    timeInterval = -1;
    timeOut = -1;
    remainTime = 0;
    startCoutingDown(remainTime: number) {
        this.remainTime = remainTime + 1;
        clearInterval(this.timeInterval);
        clearTimeout(this.timeOut);
        this.timeInterval = setInterval(() => {
            if (--remainTime < 0) {
                clearInterval(this.timeInterval);
                remainTime = 0;
            }
            this.updateTime(remainTime);
        }, 1000)

        this.timeOut = setTimeout(() => {
            this.requestSyncData();
        }, (this.remainTime + 5) * 1000);
    }

    setTimeRemain(remainTime: number, earn: number, max: number) {
        if (earn >= max) return;
        if (remainTime == undefined || remainTime <= 0) return;
        this.startCoutingDown(remainTime);
    }

    requestSyncData() {
        requestGetData(result => {
            if (result.isSuccess) {
                GameManager.instance.setUserData(result.data);
                if (MapController.instance != null) {
                    this.setTimeRemain(result.data.remain_time_next_turn, result.data.total_turn_earn, result.data.total_turn_max);
                    this.initUIs();//reupdate uis
                }
            }
        })
    }

    requestLoadGame() {
        if (this.currentSelectedLevel == null) return;
        this.setBlocking(true);
        this.currentSelectedLevel.node.setSiblingIndex(this.levelItems.length);
        var gameData = this.currentSelectedLevel.data;

        //request 
        requestPlayGame(gameData.level, result => {
            if (result.isSuccess) 
            {
                gameData.turn_id = result.data.turn_id;
                this.loadGame(gameData);
            }
            else {
                //set failed api
                this.setBlocking(false);
                this.showErrorMessage("Tiếc quá, đã hết lượt chơi rồi.\nBạn hãy quay trở lại vào ngày mai\nđể có lượt chơi tiếp nhé!");
                // this.showErrorMessage(`${result.error.code}\n${result.error.message}`);
            }
        })
    }
    
    loadGame(gameData) {
        clearInterval(this.timeInterval);
        clearTimeout(this.timeOut);

        var loadedCount = 0;
        var checkLoadGame = () => {
            if (++loadedCount >= 2) {
                GameManager.instance.setGameData(gameData);
                director.loadScene(SceneName.GAME);
            } 
        }

        //do anim
        //fade
        tween(this.opacityMain)
        .delay(0.35)
        .to(
            0.5, 
            {
                opacity: 0,
            },
            {
                easing: easing.linear
            }
        )
        .call(() => checkLoadGame())
        .start();
        //scale up 
        tween(this.opacityMain.node)
        .delay(0.35)
        .to(
            0.35, 
            {
                scale: v3(1.5, 1.5, 1.5)
            }
        )
        .start();

        //selected level
        this.currentSelectedLevel.setFocus(false);
        tween(this.currentSelectedLevel.node)
        .to(
            0.35,
            {
                worldPosition: this.opacityMain.node.worldPosition,
            }, {
                easing: easing.backOut
            }
        )
        .start();
        tween(this.currentSelectedLevel.node)
        .to(
            0.35,
            {
                scale: v3(2.0, 2.0, 2.0),
            }, {
                easing: easing.backOut
            }
        )
        .start();
        
        //do load ingame
        director.preloadScene(SceneName.GAME, () => {
            checkLoadGame();
        })
    }

    onSelectedLevel(item: MapLevelItem) {
        this.currentSelectedLevel = item;
        this.requestLoadGame();
    }

    backToHome() {
        GameManager.instance.backToHome();
    }

    //#region UIs

    initUIs() {
        //calculate stars
        var userData = GameManager.instance.userData;
        var data = MapManager.instance.mapData;
        var totalStars = 0;
        data.forEach(map => totalStars += map.stars);
        this.lbStars.string = userData.total_star;

        //turns
        this.lbTurns.string = userData.unused_turn;

        this.setRewardData(userData);
    }

    converTime(seconds: number): string {
        try {
            let result = new Date(seconds * 1000).toISOString().slice(14, 19);
            return result;
        }
        catch {
            return "00:00";
        }
    }

    updateTime(time: number) {
        //second conver 
        this.lbRemainTime.string = this.converTime(time);
    }

    @property(PopupBase)
    popupHowToPlay: PopupBase = null;

    showHowToPlay() {
        this.popupHowToPlay.show();
    }

    
    @property(PopupBase)
    popupError: PopupBase = null;

    @property(Label)
    lbError: Label = null;

    showErrorMessage(error: string) 
    {
        this.lbError.string = error;
        this.popupError.show();
    }

    //#endregion

    //#region ranking

    @property(RankController)
    popupRank: RankController = null;

    showRank() {
        this.popupRank.show();
    }

    //#endregion

    //#region tutorials

    //#region streak and stars rewards

    @property(Label)
    lbRewardStreak: Label = null;

    @property(Label)
    lbRewardStars: Label = null;

    @property([Node])
    nodeStreaks: Node[] = [];

    @property([Node])
    nodeStars: Node[] = [];

    @property(Sprite)
    fillerProgressStreak: Sprite = null;

    @property(Sprite)
    fillerProgressStars: Sprite = null;

    @property(Button)
    btnClaimStreak: Button = null;

    @property(Button)
    btnClaimStars: Button = null;
    
    @property(PopupBase)
    popupReward: PopupBase = null;

    @property(Label)
    lbReward: Label = null;

    STREAK_MILESTONES = [3, 6, 9];
    STARS_MILESTONES = [10, 20, 30, 40, 50, 60];
    claimableStreakValue = 0;
    claimableStarsValue = 0;
    setRewardData(data) {
        this.lbRewardStars.string = data.total_star;
        this.lbRewardStreak.string = data.win_streak;

        //set active for streak
        for (var i = 0; i < this.nodeStreaks.length; i++) {
            try {
                this.nodeStreaks[i].active = data.win_streak >= this.STREAK_MILESTONES[i]
            }
            catch {

            }
        }

        //set active for stars
        for (var i = 0; i < this.nodeStars.length; i++) {
            try {
                this.nodeStars[i].active = data.total_star >= this.STARS_MILESTONES[i]
            }
            catch {
                    
            }
        }

        //set progress
        let streakRatio = data.win_streak / this.STREAK_MILESTONES[this.STREAK_MILESTONES.length - 1];
        let starsRatio = data.total_star / this.STARS_MILESTONES[this.STARS_MILESTONES.length - 1];

        this.fillerProgressStreak.fillRange = Math.min(streakRatio, 1.0);
        this.fillerProgressStars.fillRange = Math.min(starsRatio, 1.0);

        //set claimable
        this.claimableStreakValue = this.getClaimableStreak(data);
        this.claimableStarsValue = this.getClaimableStars(data);
        this.btnClaimStreak.interactable = this.claimableStreakValue > 0;
        this.btnClaimStars.interactable = this.claimableStarsValue > 0;
    }

    getClaimableStars(data): number {
        for (var i = 0; i < this.STARS_MILESTONES.length; i++) {
            let checkingStars = this.STARS_MILESTONES[i];
            if (data.total_star < checkingStars) return -1;
            if (data.star_rewards[checkingStars] == false) {
                return this.STARS_MILESTONES[i];
            }
        }
        return -1;
    }

    getClaimableStreak(data): number  {
        for (var i = 0; i < this.STREAK_MILESTONES.length; i++) {
            let checkingValue = this.STREAK_MILESTONES[i];
            if (data.win_streak < checkingValue) return -1;
            if (data.win_streak_rewards[checkingValue] == false) {
                return this.STREAK_MILESTONES[i];
            }
        }
        return -1;
    }

    claimStreakReward() {
        this.btnClaimStreak.interactable = false;
        this.setLoading(true);
        requestClaimStreakReward(this.claimableStreakValue, res => {
            this.setLoading(false);
            if (res.isSuccess) {
                //recheck if can claimable again
                if (res.data.rewards.length > 0) {
                    this.showRewards(res.data.rewards, null);
                    this.requestSyncData();
                }
            }
            else {
                this.showErrorMessage(`${res.error.code}\n${res.error.message}`);
            }
        });
    }

    claimStarReward() {
        this.setLoading(true);
        this.btnClaimStars.interactable = false;
        requestClaimStarsReward(this.claimableStarsValue, res => {
            this.setLoading(false);
            if (res.isSuccess) {
                //recheck if can claimable again
                if (res.data.rewards.length > 0) {
                    this.showRewards(res.data.rewards, null);
                    this.requestSyncData();
                }
            }
            else {
                this.showErrorMessage(`${res.error.code}\n${res.error.message}`);
            }
        });
    }

    showRewards(rewards, onDone: () => void) {
        var currentIndex = -1;
        let showEachReward = () => {
            var reward = null;
            if (++currentIndex < rewards.length) {
                reward = rewards[currentIndex];
            }
            if (reward == null) {
                onDone && onDone();
                return;
            }
            this.showReward(reward, showEachReward);
        }
        showEachReward();
    }


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

    @property(PopupBase)
    popupTutorial: PopupBase = null;

    @property([UIFadeNode])
    tutorials: UIFadeNode[] = [];

    currentTutorialIndex = 0;
    showTutorial() {
        this.popupTutorial.show();
        this.currentTutorialIndex = -1;
        this.goNextTutorial();
    }

    setTutorialIndex(index: number) {
        for (var i = 0; i < this.tutorials.length; i++) {
            this.tutorials[i].setState(i == index);
        }
    }

    goNextTutorial() {
        this.setTutorialIndex(++this.currentTutorialIndex);
        if (this.currentTutorialIndex >= this.tutorials.length) {
            this.popupTutorial.hide();
        }
    }

    //#endregion

    //#region sound handle

    @property(Node)
    nodeSoundOff: Node = null;
    isMuting = false;
    initSound() {
        this.isMuting = isMuted();
        this.nodeSoundOff.active = this.isMuting;
        SoundController.instance.setMute(this.isMuting);
    }

    toggleSound() {
        this.isMuting = !this.isMuting;
        this.nodeSoundOff.active = this.isMuting;
        SoundController.instance.setMute(this.isMuting);
        setMute(this.isMuting);
    }

    //#endregion

    @property(Node)
    nodeLoading: Node = null;

    setLoading(isLoading: boolean) {
        this.nodeLoading.active = isLoading;
    }

    //#region rewards tutorials

    @property(PopupBase) 
    popupRewardTutorial: PopupBase = null;

    showRewardTutorial() {
        this.popupRewardTutorial.show();
    }

    //#endregion

    //#region callbacks

    onTouch_Reward_ClaimStreak() {
        this.claimStreakReward();
    }

    onTouch_Reward_ClaimStars() {
        this.claimStarReward();
    }

    onTouch_Reward_Claim() {
        this.rewardClaimCallback && this.rewardClaimCallback();
    }

    onTouch_Rank() {
        this.showRank();
    }

    onTouch_HowToPlay() {
        this.showHowToPlay();
    }

    onTouch_TutorialNext() 
    {
        this.goNextTutorial();
    }

    onTouch_TutorialSkip() {
        this.popupTutorial.hide();
    }

    onTouch_Sound() {
        this.toggleSound();
    }

    onTouch_RewardTutorial() {
        this.showRewardTutorial();
    }
    //#endregion
}

