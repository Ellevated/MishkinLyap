/**
 * Module: PreloadScene
 * Role: Loads all game assets, shows branded loading screen, transitions to Menu
 * Uses: config/GameConfig (ANIMALS for asset keys, BRAND for theming)
 * Used by: main.ts (first scene in Phaser config)
 * Does NOT: Contain game logic, call SDK
 */

import Phaser from 'phaser';
import { ANIMALS, BRAND } from '../config/GameConfig';
import type { IPlatformBridge } from '../sdk/IGamePlatform';
import { LuckySpinScene } from './LuckySpinScene';
import { SeasonManager } from '../game/SeasonManager';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(BRAND.BG_CREAM);

    // Title
    const title = this.add.text(width / 2, height * 0.38, 'Мишкин\nЛяп', {
      fontSize: '44px',
      color: BRAND.TEXT_INK,
      fontFamily: BRAND.FONT_DISPLAY,
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    // Decorative paw emoji
    const paw = this.add.text(width / 2, height * 0.28, '\uD83D\uDC3E', {
      fontSize: '36px',
    }).setOrigin(0.5).setAlpha(0);

    // Progress bar — rounded, branded
    const barW = width * 0.55;
    const barH = 14;
    const barY = height * 0.54;

    const barBg = this.add.graphics();
    barBg.fillStyle(0xd6c6a9, 0.6);
    barBg.fillRoundedRect((width - barW) / 2, barY - barH / 2, barW, barH, barH / 2);
    barBg.lineStyle(1, 0x3d2b1f, 0.15);
    barBg.strokeRoundedRect((width - barW) / 2, barY - barH / 2, barW, barH, barH / 2);

    const barFillMask = this.add.graphics();
    const barFill = this.add.graphics();

    const drawFill = (progress: number) => {
      const w = Math.max(barH, barW * progress);
      barFill.clear();
      barFill.fillStyle(0xd4a24c, 1);
      barFill.fillRoundedRect((width - barW) / 2, barY - barH / 2, w, barH, barH / 2);
    };
    drawFill(0);

    // Status text
    const label = this.add.text(width / 2, barY + 22, 'Загружаем зверят...', {
      fontSize: '14px',
      color: BRAND.TEXT_SECONDARY,
      fontFamily: BRAND.FONT_BODY,
    }).setOrigin(0.5).setAlpha(0);

    // Fade in elements
    this.tweens.add({ targets: [title, paw, label], alpha: 1, duration: 400, ease: 'Sine.easeOut' });

    // Gentle paw bounce
    this.tweens.add({
      targets: paw, y: paw.y - 6, duration: 800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.load.on('progress', (value: number) => {
      drawFill(value);
      const loaded = Math.floor(value * ANIMALS.length);
      if (loaded > 0 && loaded <= ANIMALS.length) {
        const animal = ANIMALS[loaded - 1];
        label.setText(`${animal.name}...`);
      }
    });

    this.load.on('complete', () => {
      label.setText('Готово!');
      this.tweens.add({
        targets: [title, paw, label, barBg, barFill],
        alpha: 0, duration: 300, ease: 'Sine.easeIn',
        onComplete: () => {
          barBg.destroy(); barFill.destroy(); barFillMask.destroy();
          title.destroy(); paw.destroy(); label.destroy();
        },
      });
    });

    // Load UI assets
    this.load.image('mascot', 'assets/ui/mascot.png');
    this.load.image('title', 'assets/ui/title.png');
    this.load.image('gameover_frame', 'assets/ui/gameover_frame.png');

    // Load container assets per theme
    for (const theme of ['meadow', 'trunk', 'barrel'] as const) {
      if (theme === 'barrel') {
        this.load.image(`${theme}_frame`, `assets/containers/${theme}/frame.png`);
      } else {
        this.load.image(`${theme}_bg`, `assets/containers/${theme}/bg.png`);
        this.load.image(`${theme}_wall_left`, `assets/containers/${theme}/wall_left.png`);
        this.load.image(`${theme}_wall_right`, `assets/containers/${theme}/wall_right.png`);
        this.load.image(`${theme}_floor`, `assets/containers/${theme}/floor.png`);
      }
    }

    // Load animal sprites
    for (const animal of ANIMALS) {
      this.load.image(
        animal.key,
        `assets/animals/ml_sprite_tier${animal.tier}_${animal.key}.png`,
      );
    }
  }

  create(): void {
    // Generate particle texture (runtime, no asset file)
    const g = this.add.graphics();
    g.fillStyle(0xffffff); g.fillCircle(4, 4, 4); g.generateTexture('particle', 8, 8); g.destroy();

    // Init season manager
    const bridge = this.registry.get('bridge') as IPlatformBridge;
    const seasonMgr = new SeasonManager(bridge);
    this.registry.set('seasonManager', seasonMgr);
    seasonMgr.tryRemoteOverride().catch(() => { /* ok */ });

    this.scene.add('LuckySpin', LuckySpinScene, false);
    this.scene.start('Menu');
  }
}
