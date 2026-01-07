// src/game/popupManager.ts
import { Application, Container, Graphics, Sprite, Text } from 'pixi.js';
import { AssetManager } from '../managers/AssetManager';
import soundController from '../managers/SoundController';
import gsap from 'gsap';

export class PopupManager {
    private app: Application;
    private overlay: Container | null = null;
    private shown: boolean = false;

    constructor(app: Application) {
        this.app = app;
    }

    public showRewardPopupIfNeeded(score: number, threshold = 500) {
        if (this.shown) return;
        if (score < threshold) return;
        this.showRewardPopup();
        this.shown = true;
    }

    public showRewardPopup() {
        if (this.overlay) return; // already visible

        const overlay = new Container();
        overlay.eventMode = 'static';

        const blocker = new Graphics();
        blocker.fill({ color: 0x000000, alpha: 0.6 }).rect(0, 0, this.app.screen.width, this.app.screen.height);
        blocker.eventMode = 'static';
        overlay.addChild(blocker);

        // center position
        const cx = this.app.screen.width / 2;
        const cy = this.app.screen.height / 2;

        // popup container (centered, will scale in)
        const popup = new Container();
        popup.x = cx;
        popup.y = cy;
        popup.scale.set(0);
        overlay.addChild(popup);

        // background image (happy)
        const bgTex = AssetManager.getTexture('happy_bg');
        const bgSprite = new Sprite(bgTex);
        bgSprite.anchor.set(0.5);
        bgSprite.x = 0;
        bgSprite.y = 0;
        const maxW = this.app.screen.width * 0.7;
        if (bgSprite.width > maxW) bgSprite.scale.set(maxW / bgSprite.width);
        popup.addChild(bgSprite);

        // message text — center inside the blank area and enable wrapping
        const contentWidth = Math.min(bgSprite.width * 0.55, maxW - 80);
        const msg = new Text({ text: 'You have enough points to claim your reward', style: { fontSize: 28, fill: 0x222222, fontWeight: 'bold', wordWrap: true, wordWrapWidth: contentWidth, align: 'center' } as any });
        msg.anchor.set(0.5);
        msg.x = 0;
        // position message roughly near popup center (slightly above center to fit the blank area)
        msg.y = bgSprite.y + 120;
        popup.addChild(msg);

        // button sprite
        const btnTex = AssetManager.getTexture('button_2');
        const button = new Sprite(btnTex);
        button.anchor.set(0.5);
        button.x = 0;
        // place button below the message
        button.y = msg.y + 200;
        button.eventMode = 'static';
        button.cursor = 'pointer';
        popup.addChild(button);

        const btnLabel = new Text({ text: 'GET', style: { fontSize: 22, fill: 0xffffff, fontWeight: 'bold' } });
        btnLabel.anchor.set(0.5);
        btnLabel.x = 0;
        btnLabel.y = button.y;
        popup.addChild(btnLabel);

        // click handler: animate button press, spawn simple particles, then close popup and play video
        button.on('pointerdown', () => {
            // play button sound
            try { soundController.playButton(); } catch (e) {}

            // visual press animation (scale down and back)
            try {
                const tl = gsap.timeline();
                tl.to(button.scale, { x: 0.88, y: 0.88, duration: 0.08 })
                  .to(button.scale, { x: 1, y: 1, duration: 0.12 });

                // spawn small particle burst at button global position
                try {
                    const gp = (button as any).getGlobalPosition ? (button as any).getGlobalPosition() : { x: 0, y: 0 };
                    const particlesParent = new Container();
                    particlesParent.x = gp.x; particlesParent.y = gp.y;
                    overlay.addChild(particlesParent);
                    const count = 8;
                    for (let i = 0; i < count; i++) {
                        const g = new Graphics();
                        const color = 0xffffff;
                        const r = 4 + Math.random() * 4;
                        g.fill({ color, alpha: 1 }).circle(0, 0, r);
                        particlesParent.addChild(g);
                        const angle = (Math.PI * 2) * (i / count) + (Math.random() - 0.5) * 0.6;
                        const dist = 24 + Math.random() * 20;
                        gsap.to(g, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, alpha: 0, duration: 0.6, onComplete: () => { try { g.destroy(); } catch (e) {} } });
                    }
                    gsap.to(particlesParent, { alpha: 0, duration: 0.7, onComplete: () => { try { particlesParent.destroy(); } catch (e) {} } });
                } catch (e) {
                    // ignore particle errors
                }

                // after animation completes, hide and play video
                tl.eventCallback('onComplete', () => {
                    // hide popup
                    this.hide();
                    // pause background music, then start video playback
                    try { soundController.pauseBg(); } catch (e) {}
                    const videoSrc = 'assets/Arts/Textures/effects/videoplayback.mp4';
                    this.playVideoOverlay(videoSrc).then(() => {
                        try { soundController.resumeBg(); } catch (e) {}
                    }).catch((e) => {
                        console.warn('[PopupManager] video playback failed', e);
                        try { soundController.resumeBg(); } catch (er) {}
                    });
                });
            } catch (e) {
                // fallback: immediate hide/play if animation errors
                try { soundController.pauseBg(); } catch (er) {}
                this.hide();
                const videoSrc = 'assets/Arts/Textures/effects/videoplayback.mp4';
                this.playVideoOverlay(videoSrc).then(() => { try { soundController.resumeBg(); } catch (e) {} }).catch(() => { try { soundController.resumeBg(); } catch (e) {} });
            }
        });

        this.app.stage.addChild(overlay);
        this.overlay = overlay;

        // animate popup scale in over 1s
        try {
            gsap.to(popup.scale, { x: 1, y: 1, duration: 1, ease: 'power3.out' });
        } catch (e) {
            popup.scale.set(1);
        }
    }

    public hide() {
        if (!this.overlay) return;
        try {
            this.overlay.destroy({ children: true });
        } catch (e) {}
        this.overlay = null;
    }

    private async playVideoOverlay(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const video = document.createElement('video');
                video.src = src;
                video.playsInline = true;
                video.autoplay = true;
                video.controls = false;
                video.preload = 'auto';
                // ensure the browser starts buffering early
                try { video.load(); } catch (e) {}
                video.style.position = 'fixed';
                video.style.left = '0';
                video.style.top = '0';
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.zIndex = '9999';
                video.style.background = 'black';
                // append and play
                document.body.appendChild(video);

                const clean = () => {
                    try { video.pause(); } catch (e) {}
                    try { video.remove(); } catch (e) {}
                };

                video.addEventListener('ended', () => {
                    clean();
                    resolve();
                });

                video.addEventListener('error', (ev) => {
                    clean();
                    reject(new Error('Video playback error'));
                });

                // user click triggered, so play should be allowed — attempt to play immediately
                const p = video.play();
                if (p && p.catch) {
                    p.catch(err => {
                        // autoplay blocked? show controls and try again
                        video.controls = true;
                        console.warn('[PopupManager] video.play() rejected', err);
                    });
                }
            } catch (e) {
                reject(e);
            }
        });
    }
}
