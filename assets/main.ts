// src/main.ts
import { Application } from 'pixi.js';  
import * as PIXI from 'pixi.js';

// Khởi tạo ứng dụng PixiJS
async function setupPixi() {
    const app = new PIXI.Application();

    // Cấu hình ứng dụng để chiếm toàn bộ cửa sổ trình duyệt
    await app.init({ 
        resizeTo: window,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        backgroundColor: 0x1099bb,
    });

    document.body.appendChild(app.canvas);
    
    // Tạm thời hiển thị một dòng chữ để kiểm tra
    const basicText = new PIXI.Text({ text: 'PIXI V8 SETUP OK - STARTING ASSET LOAD', style: { fill: 0xffffff } });
    basicText.anchor.set(0.5);
    basicText.x = app.screen.width / 2;
    basicText.y = app.screen.height / 2;
    app.stage.addChild(basicText);
}

setupPixi();