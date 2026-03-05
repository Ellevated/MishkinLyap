/**
 * Module: ShareManager
 * Role: Captures game screenshot, composes result card, shares via Web Share API
 * Uses: Phaser.Renderer.snapshot, navigator.share (Web API)
 * Used by: GameOverScene (share button)
 * Does NOT: Modify game state, manage score, call Yandex SDK
 */

import Phaser from 'phaser';

interface ShareData { score: number; best: number; highestTier: number; }

export class ShareManager {
  async captureAndShare(scene: Phaser.Scene, data: ShareData): Promise<void> {
    const image = await this.capture(scene);
    const canvas = this.drawCard(image, data);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
    const file = new File([blob], 'mishkin-lyap-result.png', { type: 'image/png' });

    if (navigator.share && (navigator as any).canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: 'Мишкин Ляп — мой результат!', text: `Мой счёт: ${data.score}! Сможешь лучше?`, files: [file] });
        return;
      } catch { /* user cancelled */ }
    }
    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mishkin-lyap-result.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private capture(scene: Phaser.Scene): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      (scene.game.renderer as Phaser.Renderer.Canvas.CanvasRenderer).snapshot((img) => {
        resolve(img as HTMLImageElement);
      });
    });
  }

  private drawCard(screenshot: HTMLImageElement, data: ShareData): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 480; c.height = 640;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#F5EDD8';
    ctx.fillRect(0, 0, 480, 640);

    // Screenshot scaled to fit
    const scale = Math.min(440 / screenshot.width, 400 / screenshot.height);
    const sw = screenshot.width * scale, sh = screenshot.height * scale;
    ctx.drawImage(screenshot, (480 - sw) / 2, 20, sw, sh);

    // Score overlay
    ctx.fillStyle = 'rgba(61, 43, 31, 0.85)';
    ctx.fillRect(0, 440, 480, 200);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F5EDD8';
    ctx.font = 'bold 28px Marmelad, sans-serif';
    ctx.fillText('Мишкин Ляп', 240, 480);
    ctx.font = 'bold 36px Nunito, sans-serif';
    ctx.fillStyle = '#D4A24C';
    ctx.fillText(`Счёт: ${data.score}`, 240, 530);
    ctx.font = '20px Nunito, sans-serif';
    ctx.fillStyle = '#EDE0C4';
    ctx.fillText(`Рекорд: ${data.best}`, 240, 565);
    ctx.font = '16px Nunito, sans-serif';
    ctx.fillText('Сможешь лучше? Играй на Яндекс Играх!', 240, 610);

    return c;
  }
}
