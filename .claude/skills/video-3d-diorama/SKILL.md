---
name: video-3d-diorama
description: Membuat video edukasi vertikal 9:16 (TikTok/Reels/Shorts) bergaya 3D diorama potongan tanah (cutaway) untuk brand "KepoTau" — maket 3D realistis dengan penampang tanah berlapis, kamera bergerak pelan, objek dirakit satu per satu (kincir, pipa, menara, rumah, bak saringan), papan tahun/era, caption putih kata per kata, papan branding KepoTau di dalam adegan, dan outro logo KepoTau. Cocok untuk cerita "evolusi teknologi / gimana caranya ... di zaman dulu", cara kerja sistem (air bersih, sumur, irigasi, saluran, bendungan, pembangkit listrik, septic tank, tambang) dan proses bawah tanah. Input topik + naskah; output MP4 1080x1920 dengan voiceover Indonesia otomatis (ElevenLabs / edge-tts / situs TTS via browser), sound effect, ambience, musik opsional, plus subtitle. Gunakan skill ini setiap kali pengguna minta video 3D, diorama, cutaway/penampang, "kayak video simulasi 3D", evolusi/sejarah teknologi, atau menyebut video-3d-diorama — walaupun hanya memberi topik.
---

# Video 3D Diorama (KepoTau)

Mengubah **topik + naskah** menjadi video 3D bergaya maket potongan tanah. Ceritanya biasanya
"kamu sebagai orang di zaman X, gimana caranya ...?". Engine Three.js di `assets/template.html`
sudah menangani render, caption, kamera, animasi muncul, VO, SFX, dan outro. Pekerjaanmu adalah
merancang dunia 3D (`WORLD`) dan urutan shot (`SHOTS`).

## Ciri gaya (pertahankan)

- **Diorama cutaway**: blok tanah dengan rumput di atas dan strata tanah terlihat di sisi depan; parit
  sungai atau galian memperlihatkan isinya dari samping. Padang rumput dan pohon di latar, langit biru pucat.
- **Dirakit bertahap**: setiap kalimat menambah satu-dua objek (kincir naik dari tanah, pipa
  memanjang, rumah jatuh di tempat). Penonton melihat solusi tersusun langkah demi langkah.
- **Narasi orang kedua, santai**: "kamu pasang kincir air", "buat naikin airnya", "tapi warnanya
  kayak teh susu". Masalah → solusi → masalah baru → solusi lebih maju.
- **Penanda era**: papan putih bertiang berisi tahun (1582 → 1829 → 1900-an), muncul dengan bunyi *ding*.
- **Caption** putih tebal di tengah layar, 1–3 kata muncul satu per satu mengikuti suara (otomatis dari `say`).
- **Branding KepoTau**: papan biru KepoTau + @kepotau.ofc di dalam adegan (`K.brandBoard`, otomatis
  ada di tangki menara), watermark @kepotau.ofc, dan outro logo KepoTau terisi warna + 2 baris akun
  (ikon TikTok & Instagram). Brand dan handle sudah default di `CONFIG`, tidak perlu ditanyakan.

## Input

- **Topik** (wajib). Jika hanya topik, tulis naskahnya sendiri (lihat struktur di bawah) dan tampilkan
  tabelnya di jawaban akhir, tanpa berhenti meminta persetujuan.
- **Naskah** (opsional): satu kalimat per baris; boleh disertai ide visual setelah `|`.

## Struktur cerita

1. **Setup** (1–2 shot): "kamu tinggal di tahun 1582" + papan tahun; masalah: "airnya ada di sungai,
   tapi gimana cara naikinnya?"
2. **Solusi bertahap** (3–6 shot): satu alat per kalimat, dan kamera menyorot alat yang baru muncul.
3. **Masalah baru** (1–2 shot): biasanya pindah ke lokasi lain (dalam rumah) dan terlihat masalahnya
   (air keruh).
4. **Era berikutnya** (3–6 shot): papan tahun baru dan solusi yang lebih maju (saringan pasir,
   pompa, menara air beton, pipa kota). Ulangi pola 3–4 sesuai topik.
5. **Penutup** (1 shot): kalimat kesimpulan atau pertanyaan ke penonton, lalu `{ type: "outro", dur: 3.5 }`.

Total 12–25 shot, 40–80 detik. Kalimat ≤ 10 kata per shot. Pakai fakta yang benar; jika tidak yakin
dengan tahun atau angka, pakai "sekitar" atau era umum ("zaman dulu", "abad 19").

## Langkah kerja

1. Buat folder output, lalu salin **dua** file: `assets/template.html` → `<slug>.html` dan
   `assets/three.min.js` (harus satu folder dengan HTML).
2. Baca `references/prefab.md` (prefab `K.*`, animasi `A()`, kamera, aturan gaya).
3. Ganti blok `WORLD` dan `SHOTS` (contoh "air bersih" di template dihapus). `CONFIG` biarkan.
   Rancang dulu tata letaknya: area utama di x ≈ 0, area lain (dalam rumah, era berikutnya) di
   x = 40, 70, ... Objek yang muncul belakangan masuk lewat `add` di shot-nya.
4. Cek: `node <skill>/scripts/render.js <slug>.html --preview <slug>-preview.png` dan **lihat
   gambarnya**. Periksa: objek utama terlihat jelas dan tidak terpotong, kamera tidak menembus
   tanah/dinding, caption tidak menutupi objek penting (caption ada di y ≈ 60% layar), dan tidak ada
   area kosong/void yang terlihat. Untuk detail: `--frames 5,12.5`.
5. Render final: `node <skill>/scripts/render.js <slug>.html <slug>.mp4` (opsi `--music`, `--voice`,
   `--fps 24` agar lebih cepat). Render 3D berat: dengan GPU ± 2–4× durasi video; tanpa GPU (server)
   ± 15–20× durasi. Kabari pengguna perkiraan waktunya.

## Voiceover

Teks VO = `say` tiap shot (atau `vo` jika pelafalan perlu beda: "1582" → `vo: "seribu lima ratus
delapan puluh dua"` bila TTS salah baca). Durasi shot otomatis mengikuti panjang suara, dan caption
kata per kata disinkronkan ke suara itu. Gunakan `minDur` jika animasi shot butuh waktu lebih
lama dari kalimatnya.

### Memilih sumber suara

Coba berurutan dan pakai yang pertama berhasil. Setiap jalur menghasilkan satu klip per scene,
jadi durasi scene, `-narasi.txt`, dan `.srt` selalu sinkron dengan suara aslinya.

1. **ElevenLabs API**, jika `ELEVENLABS_API_KEY` tersedia di environment (render.js otomatis
   memakainya). Gratis ± 10.000 karakter/bulan, dan satu video ≈ 1.000–1.500 karakter. Suara
   default "Rachel" (multilingual v2); pengguna bisa memilih voice ID lain lewat `--voice <id>`.
2. **edge-tts** (default tanpa key; gratis, suara Indonesia natural `id-ID-GadisNeural` /
   `id-ID-ArdiNeural`). Cukup jalankan `render.js`. Butuh `pip install edge-tts` dan internet ke
   `speech.platform.bing.com`.
3. **Situs TTS lewat browser**, jika kedua cara di atas gagal (host diblokir, tidak ada key) DAN
   kamu punya alat browser (Claude in Chrome `mcp__claude-in-chrome__*`, atau browser bawaan
   aplikasi desktop `mcp__Claude_Browser__*` / `mcp__remote-devices__Claude_Browser__*`). Muat
   skill browser yang sesuai sebelum langkah browser pertama, lalu:
   - `node <skill>/scripts/render.js <slug>.html --list-vo` → `<slug>-vo-lines.txt` berisi
     `01 | kalimat`, `02 | kalimat`, ...
   - Buka tab baru ke situs TTS. Utamakan **elevenlabs.io** (Text to Speech, model Multilingual v2,
     pengguna biasanya sudah login). Jika tidak bisa, pakai situs gratis lain yang mendukung
     bahasa Indonesia dan unduhan MP3, misalnya **ttsmaker.com**. Pakai suara yang sama untuk
     semua kalimat.
   - Buat dan unduh **satu file per kalimat**, lalu ganti namanya sesuai nomor: `vo-01.mp3`,
     `vo-02.mp3`, ... ke satu folder. Penomoran ini yang menyinkronkan suara ke scene.
   - `node <skill>/scripts/render.js <slug>.html <slug>.mp4 --vo-dir <folder>`
   - Jika situs meminta login, CAPTCHA, atau pembayaran, berhenti dan minta pengguna
     menyelesaikannya. Jangan membuat akun atau mengisi data pembayaran atas nama pengguna.

   Catatan: unduhan dari browser masuk ke komputer pengguna. Jalur ini hanya bisa jika Claude
   berjalan di komputer yang sama (Claude Code lokal / aplikasi desktop). Di sesi cloud, file
   unduhan tidak sampai ke container, jadi lewati jalur ini.
4. **Tanpa suara** (cadangan terakhir, beri tahu pengguna; jangan diam-diam): render `--no-vo`.
   Mode ini tetap menulis `-narasi.txt` dan `.srt` dengan rentang detik tiap kalimat
   (`[3.5s - 6.1s] ...`) sesuai timeline video, untuk direkam atau di-dub sendiri. Berikan juga
   `-vo-lines.txt` dan perintah `--vo-dir` agar pengguna bisa membuat versi bersuara nanti.
   Sebutkan host yang diblokir (`speech.platform.bing.com`, `api.elevenlabs.io`) supaya pengguna
   bisa mengizinkannya.

Pengguna yang punya rekaman utuh sendiri bisa memakai `--audio rekaman.mp3` (durasi scene tidak
diubah); yang punya rekaman per kalimat sebaiknya memakai `--vo-dir`.


## Sound effect, ambience & musik

Otomatis: *whoosh* pelan saat pergantian shot, *clunk* saat objek naik/jatuh di tempat, *splash* saat
air mengisi, *swish* saat pipa memanjang, *pop* untuk objek pop, *ding* untuk papan tahun (`A(..., 'year')`),
serta *rise* dan *sparkle* di outro. Ambience angin dan burung samar mengalun di bawah semuanya
(`CONFIG.ambience`). Tambahan manual: `sfx: [{at: 1.0, s: 'ding'}]` di shot; matikan semua dengan
`--no-sfx`. Musik latar opsional: `--music file.mp3` (bebas royalti; jangan mengunduh musik berhak cipta).

## Hasil akhir untuk pengguna

- `<slug>.mp4`: 1080x1920, VO + SFX + ambience (+ musik)
- `<slug>.html` + `three.min.js`: sumber, bisa diedit lalu dirender ulang
- `<slug>-narasi.txt` dan `<slug>.srt`
- Tabel naskah di chat (no | kalimat | objek yang muncul | detik)

## Kebutuhan

Node, `playwright` (Chromium), `ffmpeg`, dan sumber suara (lihat Voiceover). Tanpa itu, serahkan
HTML + `three.min.js`: dibuka di Chrome bisa diputar (spasi / tombol PUTAR) dan direkam layar.
