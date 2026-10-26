#!/usr/bin/env node
/*
 * Render video HTML (dari template video-flat-edukasi) ke MP4, frame demi frame.
 *
 *   node render.js video.html video.mp4 [--fps 30] [--audio narasi.mp3]
 *   node render.js video.html --preview preview.png      # lembar kontak 1 frame per scene
 *
 * Butuh: Node, playwright (npm i playwright && npx playwright install chromium), ffmpeg.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const input = args[0];
if (!input || !fs.existsSync(input)) { console.error('Pemakaian: node render.js video.html out.mp4 [--fps 30] [--audio file] | --preview out.png'); process.exit(1); }
const fps = +opt('--fps', 30);
const audio = opt('--audio');
const preview = opt('--preview');
const out = preview ? null : (args[1] && !args[1].startsWith('--') ? args[1] : input.replace(/\.html?$/, '') + '.mp4');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('file://' + path.resolve(input) + '?render=1');
  const total = await page.evaluate(() => window.__ready);
  const scenes = await page.evaluate(() => window.__SCENES);

  if (preview) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vfe-'));
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i], t = Math.min(s.end - 0.05, s.start + Math.max(1.4, (s.end - s.start) * 0.7));
      await page.evaluate(t => window.__seek(t), t);
      await page.screenshot({ path: path.join(dir, `f${String(i).padStart(3, '0')}.png`) });
    }
    const cols = Math.min(6, scenes.length), rows = Math.ceil(scenes.length / cols);
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(dir, 'f%03d.png'),
      '-vf', `scale=270:-1,tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', preview], { stdio: 'inherit' });
    fs.rmSync(dir, { recursive: true, force: true });
    if (r.status !== 0) process.exit(1);
    console.log(`Preview: ${preview} (${scenes.length} scene, total ${total.toFixed(1)} detik)`);
  } else {
    const ff = ['-v', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(fps), '-i', '-'];
    if (audio) ff.push('-i', audio, '-c:a', 'aac', '-b:a', '192k', '-shortest');
    ff.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18', '-movflags', '+faststart', out);
    const proc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
    const frames = Math.ceil(total * fps);
    for (let f = 0; f < frames; f++) {
      await page.evaluate(t => window.__seek(t), f / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!proc.stdin.write(buf)) await new Promise(r => proc.stdin.once('drain', r));
      if (f % (fps * 5) === 0) process.stdout.write(`\rRender ${f}/${frames} frame`);
    }
    proc.stdin.end();
    const code = await new Promise(r => proc.on('close', r));
    if (code !== 0) { console.error('\nffmpeg gagal'); process.exit(1); }
    console.log(`\nSelesai: ${out} (${total.toFixed(1)} detik, ${fps} fps)`);
  }
  if (errors.length) { console.error('Error di halaman:\n' + errors.join('\n')); process.exitCode = 2; }
  await browser.close();
})();
