---
name: video-flat-edukasi
description: Membuat video animasi edukasi pendek vertikal 9:16 (TikTok/Reels/Shorts) bergaya flat vector ala akun sains "GEGARA" — latar navy, teks kecil + KATA KUNCI besar berwarna, ilustrasi flat (tanah, awan, bakteri, wajah profil, molekul, label pil), animasi pop/fade cepat per scene. Inputnya topik + naskah per scene; outputnya file HTML animasi siap diputar dan MP4 1080x1920. Gunakan skill ini setiap kali pengguna minta dibuatkan video edukasi/explainer/fakta unik/sains singkat, konten "kenapa ...?", animasi motion graphic untuk TikTok/Reels, atau menyebut video-flat-edukasi / gaya GEGARA — walaupun pengguna hanya memberi topik tanpa naskah.
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
5. Cek visual: `node <skill>/scripts/render.js <file>.html --preview <file>-preview.png`, lalu
   **lihat gambar pratinjaunya**. Perbaiki teks yang bertumpuk, objek yang keluar layar, art yang
   menutupi caption (y < 580), atau scene kosong. Jika skrip melaporkan "Error di halaman",
   perbaiki scene yang disebut.
6. Render MP4: `node <skill>/scripts/render.js <file>.html <file>.mp4` (± 2× durasi video). Kalau
   pengguna punya voiceover, tambahkan `--audio narasi.mp3`.
7. Tulis `<slug>-narasi.txt`, yaitu gabungan teks kecil dan kata kunci per scene sebagai naskah
   voiceover/TTS (satu baris per scene, dengan perkiraan detik mulainya).

Butuh Node, `playwright` (Chromium), dan `ffmpeg`. Jika tidak tersedia, serahkan file HTML-nya
saja: pengguna bisa membukanya di Chrome (klik PUTAR atau spasi; `?autoplay` di URL) lalu merekam
layar. `?t=12` menampilkan detik ke-12 untuk pengecekan.

## Hasil akhir untuk pengguna

- `<slug>.html` (animasi; bisa diedit lagi)
- `<slug>.mp4` (1080x1920, 30 fps) jika render berhasil
- `<slug>-narasi.txt`
- Tabel naskah singkat di chat (no | teks kecil | KATA KUNCI | detik) dan saran musik/SFX
  (lo-fi pelan, bunyi "pop" setiap kata kunci muncul).
