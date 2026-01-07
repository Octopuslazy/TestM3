// src/managers/SoundController.ts
// Simple sound controller using HTMLAudioElement

import embeddedAssets from '../embedded-assets';
const EMBEDDED_ASSETS: Record<string, string> = (embeddedAssets as unknown) as Record<string, string>;

export class SoundController {
    private bgAudio: HTMLAudioElement | null = null;
    private buttonAudio: HTMLAudioElement | null = null;
    private lineAudio: HTMLAudioElement | null = null;
    private normalAudio: HTMLAudioElement | null = null;
    private x4Audio: HTMLAudioElement | null = null;
    private bgPlaying: boolean = false;

    constructor() {
        // default paths relative to project root / served static folder
        // Use actual files present under assets/Sounds
        this.bgAudio = this.createAudio('assets/Sounds/bg.mp3');
        this.buttonAudio = this.createAudio('assets/Sounds/button.m4a');
        this.lineAudio = this.createAudio('assets/Sounds/line.wav');
        this.normalAudio = this.createAudio('assets/Sounds/normal.wav');
        this.x4Audio = this.createAudio('assets/Sounds/x4_circle.wav');

        // configure looping for bg
        if (this.bgAudio) {
            this.bgAudio.loop = true;
            this.bgAudio.volume = 0.6;
        }
        if (this.buttonAudio) this.buttonAudio.volume = 0.9;
        if (this.lineAudio) this.lineAudio.volume = 0.75;
        if (this.normalAudio) this.normalAudio.volume = 0.55;
        if (this.x4Audio) this.x4Audio.volume = 0.65;
    }

    private createAudio(src: string): HTMLAudioElement | null {
        try {
            const finalSrc = (EMBEDDED_ASSETS && EMBEDDED_ASSETS[src]) ? EMBEDDED_ASSETS[src] : src;
            const a = new Audio(finalSrc);
            a.preload = 'auto';
            return a;
        } catch (e) {
            console.warn('[SoundController] failed to create audio', src, e);
            return null;
        }
    }

    public setBgSource(src: string) {
        if (!this.bgAudio) this.bgAudio = this.createAudio(src);
        else {
            this.bgAudio.src = src;
            try { this.bgAudio.load(); } catch (e) {}
        }
    }

    public async playBg() {
        if (!this.bgAudio) return;
        try {
            await this.bgAudio.play();
            this.bgPlaying = true;
        } catch (e) {
            // play may be blocked until user gesture
            console.warn('[SoundController] playBg failed', e);
        }
    }

    public pauseBg() {
        if (!this.bgAudio) return;
        try {
            this.bgAudio.pause();
            this.bgPlaying = false;
        } catch (e) {}
    }

    public async resumeBg() {
        if (!this.bgAudio) return;
        if (this.bgPlaying) return;
        await this.playBg();
    }

    public playButton() {
        if (!this.buttonAudio) return;
        try { this.buttonAudio.currentTime = 0; this.buttonAudio.play(); } catch (e) {}
    }

    public playLine() {
        if (!this.lineAudio) return;
        try { this.lineAudio.currentTime = 0; this.lineAudio.play(); } catch (e) {}
    }

    public playNormal() {
        if (!this.normalAudio) return;
        try { this.normalAudio.currentTime = 0; this.normalAudio.play(); } catch (e) {}
    }

    public playX4() {
        if (!this.x4Audio) return;
        try { this.x4Audio.currentTime = 0; this.x4Audio.play(); } catch (e) {}
    }
}

const soundController = new SoundController();
export default soundController;
