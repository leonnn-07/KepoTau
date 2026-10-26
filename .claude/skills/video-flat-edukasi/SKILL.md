---
name: video-flat-edukasi
description: Membuat video animasi edukasi pendek vertikal 9:16 (TikTok/Reels/Shorts) bergaya flat vector ala akun sains "GEGARA" — latar navy, teks kecil + KATA KUNCI besar berwarna, ilustrasi flat (tanah, awan, bakteri, wajah profil, molekul, label pil), animasi pop/fade cepat per scene. Inputnya topik + naskah per scene; outputnya MP4 1080x1920 lengkap dengan voiceover bahasa Indonesia otomatis (edge-tts) yang sinkron per scene, plus file HTML sumber dan subtitle. Gunakan skill ini setiap kali pengguna minta dibuatkan video edukasi/explainer/fakta unik/sains singkat, konten "kenapa ...?", animasi motion graphic untuk TikTok/Reels, atau menyebut video-flat-edukasi / gaya GEGARA — walaupun pengguna hanya memberi topik tanpa naskah.
---

# Video Flat Edukasi

Mengubah **topik + naskah** menjadi video animasi edukasi vertikal bergaya flat vector. Satu
"mesin" animasi sudah tersedia di `assets/template.html`; pekerjaanmu hanya menulis `CONFIG`
dan `SCENES`, bukan membuat animasi dari nol. Dengan begitu semua video dalam satu seri tampil
konsisten dan cepat dibuat.

## Input dari pengguna

- **Topik** (wajib), misalnya "Kenapa bau hujan enak?"
- **Naskah per scene** (opsional). Formatnya bebas; yang paling enak:
  ```
  1. Kenapa bau hujan | ENAK BANGET? | orang menghirup bau dari tanah, hujan
  2. apalagi hujan pertama | SETELAH KEMARAU | matahari terik, tanah retak
  ```
  (teks kecil | KATA KUNCI | ide visual). Kolom visual boleh kosong; kamu yang merancang.
- **Brand & handle** (opsional). Default `GEGARA` dan `@namaakun`. Tanyakan sekali jika belum
  jelas, lalu gunakan terus untuk seri yang sama.

Kalau pengguna hanya memberi topik, tulis naskahnya sendiri dengan struktur di bawah. Tampilkan
naskah itu dalam tabel singkat di jawaban akhir supaya mudah direvisi, tapi jangan berhenti untuk
meminta persetujuan; langsung buat videonya.

## Struktur naskah yang bekerja

Video gaya ini terasa seperti teman yang bercerita cepat. Setiap scene berisi satu ide, dengan
kalimat yang dipotong menjadi **teks kecil (pengantar) + KATA KUNCI (1–4 kata)**.

1. **Hook** (1–2 scene): pertanyaan relatable. "Kenapa bau hujan / ENAK BANGET?"
2. **Penyebab** (3–6 scene): "gegaranya... / BAKTERI". Kata "gegaranya..." adalah ciri khas seri.
3. **Fakta wow** (2–4 scene): angka atau perbandingan yang bisa divisualkan
   ("cuma 5 tetes" di "kolam renang olimpiade").
4. **Mekanisme** (4–8 scene): proses langkah demi langkah, tiap langkah satu visual.
5. **Twist** (2–4 scene): "terus, buat apa...?" lalu jawaban yang mengejutkan, dengan sumber
   singkat ("penelitian / TAHUN 2020" + `C.paper`).
6. **Kesimpulan lucu** (1–2 scene): "jadi, X itu sebenarnya / ANALOGI SEHARI-HARI".
7. **CTA** (1 scene): pertanyaan ke penonton + `cta: "tulis di komentar"`, lalu `{type:"outro"}`.

Target 18–30 scene, 50–90 detik. Bahasa Indonesia santai, huruf kecil di teks pengantar.
Pakai fakta yang benar; kalau tidak yakin dengan angka atau sumber, pakai kata "sekitar" atau
"peneliti menduga" daripada mengarang.

Agar penonton tidak tersesat, objek yang sama tetap di posisi yang sama antar scene (tanah, koloni
bakteri di kiri bawah, wajah di kanan). Crossfade otomatis membuat elemen yang diulang terlihat
diam, sementara elemen baru muncul.

## Langkah kerja

1. Salin template: `cp <skill>/assets/template.html <folder-output>/<slug-topik>.html`
   (folder output = direktori kerja pengguna kecuali disebut lain).
2. Baca `references/komponen.md` untuk daftar komponen `C.*`, kelas animasi, dan aturan
   menggambar objek baru.
3. Ganti **hanya** blok `CONFIG` dan `SCENES` (contoh "bau hujan" di template dihapus seluruhnya).
   Engine di bawahnya jangan diubah. Helper SVG khusus topik boleh ditambahkan di atas `SCENES`.
4. Rancang tiap scene: satu objek utama yang besar dan jelas, 1–3 label `pill`, animasi masuk
   bertahap. Layar 9:16 sempit, jadi lebih baik sedikit objek besar daripada banyak objek kecil.
5. Tulis voiceover per scene di field `vo` bila perlu (lihat bagian Voiceover). Tanpa `vo`, suara
   membacakan teks kecil + kata kunci.
6. Cek visual: `node <skill>/scripts/render.js <file>.html --preview <file>-preview.png`, lalu
   **lihat gambar pratinjaunya**. Perbaiki teks yang bertumpuk, objek yang keluar layar, art yang
   menutupi caption (y < 580), atau scene kosong. Jika skrip melaporkan "Error di halaman",
   perbaiki scene yang disebut. Pratinjau memakai durasi `dur`, tanpa suara.
7. Render MP4 final dengan voiceover: `node <skill>/scripts/render.js <file>.html <file>.mp4`
   (opsi: `--voice id-ID-ArdiNeural` untuk suara pria, `--rate +15%`, `--music lagu.mp3`).
   Skrip membuat suara tiap scene dengan edge-tts, memperpanjang scene yang suaranya lebih panjang
   dari `dur`, lalu menggabungkan semuanya. Hasilnya `<file>.mp4`, `<file>-narasi.txt`, dan
   `<file>.srt`. Lama render ± 2× durasi video.

## Voiceover

Suara default adalah `id-ID-GadisNeural` (wanita) dari edge-tts: gratis dan natural, tapi butuh
internet ke `speech.platform.bing.com` dan `pip install edge-tts`. Pilihan lain: `id-ID-ArdiNeural`
(pria).

Teks di layar ditulis untuk mata, sedangkan `vo` ditulis untuk telinga. Isi `vo` jika:
- teks layar mengandung singkatan, simbol, atau angka yang dibaca aneh oleh TTS:
  "±2,5 juta liter" → `vo: "sekitar dua setengah juta liter air"`, "MIT" → "em ai ti",
  "GEOSMIN + MINYAK" → "geosmin dan minyak";
- kalimat butuh kata sambung agar mengalir ("nah,", "ternyata,", "bayangin,");
- scene yang hanya visual tidak perlu suara: `vo: ""`.

Satu scene sebaiknya bersuara ≤ 12 kata (± 3 detik), karena tempo cepat adalah inti gaya ini.
Outro tidak bersuara kecuali diberi `vo`.

Jika edge-tts gagal (tidak ada internet atau host diblokir), skrip berhenti dengan pesan jelas.
Jangan diam-diam membuat video tanpa suara: beri tahu pengguna, render `--no-vo` sebagai
cadangan, dan serahkan `-narasi.txt` serta perintah render agar mereka bisa menjalankannya di
komputer sendiri. Pengguna yang punya rekaman suara sendiri bisa memakai `--audio rekaman.mp3`
(durasi scene tidak diubah).

## Kebutuhan

Node, `playwright` (Chromium), `ffmpeg`, dan `edge-tts` untuk suara. Jika tidak tersedia,
serahkan file HTML-nya saja: pengguna bisa membukanya di Chrome (klik PUTAR atau spasi;
`?autoplay` di URL) lalu merekam layar. `?t=12` menampilkan detik ke-12 untuk pengecekan.

## Hasil akhir untuk pengguna

- `<slug>.mp4`: video final 1080x1920, 30 fps, dengan voiceover (dan musik jika diberikan)
- `<slug>.html`: sumber animasi, bisa diedit lalu dirender ulang
- `<slug>-narasi.txt` dan `<slug>.srt`: naskah bertimestamp dan subtitle
- Tabel naskah singkat di chat (no | teks layar | voiceover | detik), plus saran musik/SFX
  (lo-fi pelan, bunyi "pop" setiap kata kunci muncul)
