
import { _decorator, Component, Node, AudioClip, game, Prefab, AudioSource, pingPong, assert } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Predefined variables
 * Name = SoundController
 * DateTime = Thu Dec 23 2021 22:56:49 GMT+0700 (Indochina Time)
 * Author = wisky3107
 * FileBasename = SoundController.ts
 * FileBasenameNoExtension = SoundController
 * URL = db://assets/Scripts/Modules/Game/SoundController.ts
 * ManualUrl = https://docs.cocos.com/creator/3.3/manual/en/
 *
 */

@ccclass('AudioData')
export class AudioData {
    @property(String)
    name: String = "";
    @property(AudioClip)
    clip: AudioClip = null;
}

@ccclass('SoundController')
export class SoundController extends Component {

    public static instance: SoundController = null;

    @property([AudioData])
    clips: AudioData[] = [];

    @property(AudioData)
    backgroundClip: AudioData = null;

    clipData = {};
    audioSourceMap: AudioSource[] = [];
    audioSourceBackground: AudioSource = null;
    onLoad() {
        SoundController.instance = this;
        game.addPersistRootNode(this.node);
        this.clipData = {};
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = this.clips[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var clip = _step.value;
                this.clipData[clip.name] = clip.clip;
            }

            // this.audioEngineMap = {};
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        this.audioSourceMap = [];
        for (let i = 0; i < 10; i++) {
            let as = this.node.addComponent(AudioSource);
            assert(as, "the as is null");
            this.audioSourceMap.push(as);
        }

        //init play background music
        if (this.audioSourceBackground == null) {
            this.audioSourceBackground = this.node.addComponent(AudioSource);
            assert(this.audioSourceBackground, "the audioSourceBackground is null");
        }
        this.backgroundPlay();
    }

    setMute(isMuted: boolean) {
        let backgroundVolume = isMuted ? 0.0 : 0.5;
        let sfxVolume = isMuted ? 0.0 : 1.0;

        this.audioSourceBackground.volume = backgroundVolume;
        this.audioSourceMap.forEach(as => as.volume = sfxVolume);
    }

    backgroundPlay() {
        this.audioSourceBackground.clip = this.backgroundClip.clip;
        this.audioSourceBackground.loop = true;
        this.audioSourceBackground.volume = 0.5;
        this.audioSourceBackground.play();
    }

    backgroundResume() {
        this.audioSourceBackground.play();
    }

    backgroundPause() {
        this.audioSourceBackground.pause();
    }

    backgroundStop() {
        this.audioSourceBackground.stop();
    }

    currentSourceIndex = 0;
    getFreeSource() {
        this.currentSourceIndex = pingPong(++this.currentSourceIndex, this.audioSourceMap.length - 1);
        return this.audioSourceMap[this.currentSourceIndex];
    }

    play(clipName, isLoop = false) {
        //console.log("play sound name: " + clipName);
        if (this.clipData[clipName]) {
            try {
                const as = this.getFreeSource();
                if (as === null) return null;
                as.enabled = true;
                as.stop();
                as.clip = this.clipData[clipName];
                as.loop = isLoop;
                as.play();

                return as;
            }
            catch (e) {
                return null;
            }

        }

        return null;
    }

    stopAllEffects() {
        this.audioSourceMap.forEach(as => {
            as.stop();
            as.clip = null;
            as.enabled = false;
        });
    }
}
