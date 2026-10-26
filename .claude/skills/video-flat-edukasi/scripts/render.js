#!/usr/bin/env node
/*
 * Render video HTML (dari template video-flat-edukasi) ke MP4 lengkap dengan voiceover.
 *
 *   node render.js video.html [video.mp4] [opsi]
 *     --tts edge|elevenlabs       sumber suara. Default: elevenlabs jika ELEVENLABS_API_KEY ada, selain itu edge
 *     --voice id-ID-GadisNeural   suara edge-tts (id-ID-ArdiNeural = pria) atau voice_id ElevenLabs
 *     --rate +10%                 kecepatan bicara (edge-tts)
 *     --vo-dir folder/            pakai file suara jadi per scene: vo-01.mp3, vo-02.mp3, ... (mis. hasil
 *                                 unduhan dari situs TTS di browser); durasi scene tetap disesuaikan
 *     --music lagu.mp3            musik latar (otomatis di-loop & dikecilkan)
 *     --sfx-vol 0.5               volume sound effect (0 = mati); --no-sfx juga mematikan
 *     --audio narasi.mp3          pakai rekaman suara sendiri (tanpa TTS, durasi scene tidak diubah)
 *     --no-vo                     video tanpa suara
 *     --fps 30
 *   node render.js video.html --preview preview.png      # lembar kontak 1 frame per scene
 *   node render.js video.html --frames 11.5,67           # screenshot ukuran penuh di detik tertentu
 *   node render.js video.html --list-vo                  # tulis <nama>-vo-lines.txt: kalimat VO per scene
 *
 * Voiceover: teks tiap scene (field `vo`, default teks kecil + kata kunci) diubah jadi suara
 * per scene (edge-tts / ElevenLabs API / file di --vo-dir), lalu durasi scene otomatis diperpanjang agar pas dengan suaranya.
 * Hasil tambahan: <nama>-narasi.txt dan <nama>.srt (subtitle).
 *
 * Butuh: Node, playwright (npm i playwright && npx playwright install chromium), ffmpeg,
 *        untuk voiceover: pip install edge-tts (internet ke speech.platform.bing.com),
 *        atau ELEVENLABS_API_KEY (api.elevenlabs.io; paket gratis ± 10.000 karakter/bulan).
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = k => args.includes(k);
const input = args[0];
if (!input || !fs.existsSync(input)) { console.error('Pemakaian: node render.js video.html [out.mp4] [--voice ...] [--music file] [--audio file] [--no-vo] | --preview out.png'); process.exit(1); }
const fps = +opt('--fps', 30);
const engine = opt('--tts', process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'edge');
const voice = opt('--voice', engine === 'elevenlabs' ? '21m00Tcm4TlvDq8ikWAM' : 'id-ID-GadisNeural');
const voDir = opt('--vo-dir');
const listVO = flag('--list-vo');
const rate = opt('--rate', '+10%');
const music = opt('--music');
const sfxVol = flag('--no-sfx') ? 0 : +opt('--sfx-vol', 0.5);
const SFX_DIR = path.join(__dirname, '..', 'assets', 'sfx');
const ownAudio = opt('--audio');
const preview = opt('--preview');
const framesAt = opt('--frames');
const useVO = !preview && !framesAt && !listVO && !ownAudio && !flag('--no-vo');
const out = (preview || framesAt || listVO) ? null : (args[1] && !args[1].startsWith('--') ? args[1] : input.replace(/\.html?$/, '') + '.mp4');
const base = (out || input).replace(/\.(mp4|html?)$/, '');
const LEAD = 0.25, TAIL = 0.45; // jeda sebelum & sesudah suara di tiap scene

const sh = (cmd, a) => spawnSync(cmd, a, { encoding: 'utf8' });
const dur = f => parseFloat(sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).stdout);
const ts = t => { const ms = Math.round(t * 1000); const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };

function ttsElevenLabs(text, file) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY belum di-set.');
  const r = sh('curl', ['-sS', '-w', '%{http_code}', '-o', file, '-X', 'POST',
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
    '-H', `xi-api-key: ${key}`, '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })]);
  const code = (r.stdout || '').trim();
  if (code !== '200') {
    const msg = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').slice(0, 300) : (r.stderr || '');
    throw new Error(`ElevenLabs gagal (HTTP ${code || '-'}): ${msg}`);
  }
}

function voFile(i) {
  const n = String(i + 1).padStart(2, '0');
  for (const ext of ['mp3', 'wav', 'm4a', 'ogg']) { const f = path.join(voDir, `vo-${n}.${ext}`); if (fs.existsSync(f)) return f; }
  return null;
}

function tts(text, file) {
  if (engine === 'elevenlabs') return ttsElevenLabs(text, file);
  const a = ['-m', 'edge_tts', '--voice', voice, `--rate=${rate}`, '--text', text, '--write-media', file];
  if (process.env.HTTPS_PROXY) a.push('--proxy', process.env.HTTPS_PROXY);
  for (let k = 0; k < 3; k++) {
    const r = sh('python3', a);
    if (r.status === 0 && fs.existsSync(file) && fs.statSync(file).size > 0) return;
    if (k === 2) throw new Error('edge-tts gagal: ' + (r.stderr || '').trim().split('\n').pop() +
      '\nPastikan `pip install edge-tts` dan ada internet ke speech.platform.bing.com, atau pakai --audio / --no-vo.');
  }
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  const url = 'file://' + path.resolve(input) + '?render=1';
  await page.goto(url);
  let total = await page.evaluate(() => window.__ready);
  let scenes = await page.evaluate(() => window.__SCENES);
  if (!(await page.evaluate(async () => { try { await Promise.all(['500 40px Poppins', '900 40px Poppins'].map(f => document.fonts.load(f))); } catch (e) {} return document.fonts.check('900 40px Poppins'); })))
    console.warn('Peringatan: font Poppins gagal dimuat (offline?) — teks memakai font cadangan.');

  if (listVO) {
    const f = base + '-vo-lines.txt';
    fs.writeFileSync(f, scenes.map((sc, i) => (sc.vo || '').trim() ? `${String(i + 1).padStart(2, '0')} | ${sc.vo.trim()}` : null).filter(Boolean).join('\n') + '\n');
    console.log(`Kalimat VO: ${f}  (simpan suaranya sebagai vo-01.mp3, vo-02.mp3, ... sesuai nomor)`);
    await browser.close(); return;
  }

  // ---- voiceover per scene ----
  let clips = [];
  if (useVO) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vfe-vo-'));
    const durs = [];
    for (let i = 0; i < scenes.length; i++) {
      const text = (scenes[i].vo || '').trim();
      if (!text) { durs.push(scenes[i].dur); continue; }
      let f;
      if (voDir) {
        f = voFile(i);
        if (!f) { console.warn(`\nScene ${i + 1}: file vo-${String(i + 1).padStart(2, '0')}.* tidak ada di ${voDir}, scene ini tanpa suara.`); durs.push(scenes[i].dur); continue; }
      } else {
        process.stdout.write(`\rVoiceover ${i + 1}/${scenes.length} (${engine})`);
        f = path.join(dir, `vo${i}.mp3`); tts(text, f);
      }
      const d = dur(f); clips.push({ i, f, d, text });
      durs.push(Math.max(scenes[i].dur, LEAD + d + TAIL));
    }
    console.log('');
    await page.addInitScript(d => { window.__DURS = d; }, durs);
    await page.goto(url);
    total = await page.evaluate(() => window.__ready);
    scenes = await page.evaluate(() => window.__SCENES);
    clips.forEach(c => { c.at = scenes[c.i].start + LEAD; });
    fs.writeFileSync(base + '-narasi.txt', clips.map(c => `[${c.at.toFixed(1)}s - ${(c.at + c.d).toFixed(1)}s] ${c.text}`).join('\n') + '\n');
    fs.writeFileSync(base + '.srt', clips.map((c, k) => `${k + 1}\n${ts(c.at)} --> ${ts(c.at + c.d)}\n${c.text}\n`).join('\n'));
  }

  if (!useVO && !preview && !framesAt) {
    // tanpa TTS: tetap tulis naskah VO bertimestamp sesuai timeline video untuk direkam/di-dub manual
    const rows = scenes.map(sc => ({ at: sc.start + LEAD, end: sc.end - 0.1, text: (sc.vo || '').trim() })).filter(r => r.text);
    fs.writeFileSync(base + '-narasi.txt', rows.map(r => `[${r.at.toFixed(1)}s - ${r.end.toFixed(1)}s] ${r.text}`).join('\n') + '\n');
    fs.writeFileSync(base + '.srt', rows.map((r, k) => `${k + 1}\n${ts(r.at)} --> ${ts(r.end)}\n${r.text}\n`).join('\n'));
  }

  if (framesAt) {
    for (const t of framesAt.split(',').map(Number)) {
      await page.evaluate(t => window.__seek(t), t);
      const f = `${base}-t${t}.png`; await page.screenshot({ path: f }); console.log(f);
    }
  } else if (preview) {
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
    // ---- track sound effect: tiap event dari engine ditaruh di detiknya ----
    let sfxTrack = null;
    if (sfxVol > 0) {
      const ev = (await page.evaluate(() => window.__sfxEvents ? window.__sfxEvents() : []))
        .filter(e => fs.existsSync(path.join(SFX_DIR, e.s + '.wav')));
      if (ev.length) {
        sfxTrack = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vfe-sfx-')), 'sfx.wav');
        const a = ['-v', 'error', '-y'];
        ev.forEach(e => a.push('-i', path.join(SFX_DIR, e.s + '.wav')));
        const fc = ev.map((e, k) => `[${k}:a]volume=${e.v ?? 1},adelay=${Math.round(e.t * 1000)}:all=1[s${k}]`).join(';')
          + ';' + ev.map((_, k) => `[s${k}]`).join('') + `amix=inputs=${ev.length}:normalize=0:duration=longest,apad,atrim=0:${total.toFixed(3)}[o]`;
        a.push('-filter_complex', fc, '-map', '[o]', '-ar', '44100', sfxTrack);
        const r = sh('ffmpeg', a);
        if (r.status !== 0) { console.warn('Peringatan: gagal membuat track SFX, lanjut tanpa SFX.\n' + r.stderr); sfxTrack = null; }
        else console.log(`Sound effect: ${ev.length} event`);
      }
    }

    // ---- susun audio: klip VO di posisi masing-masing (+ SFX + musik) ----
    const ain = [], parts = [];
    let n = 1;
    if (sfxTrack) { ain.push('-i', sfxTrack); parts.push(`[${n}:a]volume=${sfxVol}[v${n}]`); n++; }
    clips.forEach(c => { ain.push('-i', c.f); parts.push(`[${n}:a]adelay=${Math.round(c.at * 1000)}:all=1[v${n}]`); n++; });
    if (ownAudio) { ain.push('-i', ownAudio); parts.push(`[${n}:a]anull[v${n}]`); n++; }
    if (music) { ain.push('-stream_loop', '-1', '-i', music); parts.push(`[${n}:a]volume=${clips.length || ownAudio ? 0.12 : 0.35},afade=t=out:st=${Math.max(0, total - 2)}:d=2[v${n}]`); n++; }
    const ff = ['-v', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(fps), '-i', '-', ...ain];
    if (n > 1) {
      const labels = Array.from({ length: n - 1 }, (_, k) => `[v${k + 1}]`).join('');
      ff.push('-filter_complex', `${parts.join(';')};${labels}amix=inputs=${n - 1}:normalize=0:duration=longest,apad[aout]`,
        '-map', '0:v', '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k', '-t', total.toFixed(3));
    }
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
    console.log(`\nSelesai: ${out} (${total.toFixed(1)} detik, ${fps} fps${clips.length ? `, voiceover ${clips.length} klip, ${voDir ? voDir : engine + ' ' + voice}` : ''})`);
    console.log(`Naskah VO: ${base}-narasi.txt  Subtitle: ${base}.srt`);
  }
  if (errors.length) { console.error('Error di halaman:\n' + errors.join('\n')); process.exitCode = 2; }
  await browser.close();
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
