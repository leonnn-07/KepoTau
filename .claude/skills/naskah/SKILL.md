---
name: naskah
description: Generator ide dan naskah video edukasi pendek KepoTau (TikTok/Reels/Shorts) dari sebuah kategori atau topik. Dipanggil dengan "/naskah <kategori atau topik>", misalnya "/naskah chemical", "/naskah proses pembuatan alat perkakas", "/naskah proses pembuatan airbag mobil". Jika inputnya kategori luas, berikan daftar ide topik bernomor untuk dipilih; jika topiknya sudah spesifik (atau pengguna memilih nomor), tulis naskah lengkap siap pakai untuk skill video-flat-edukasi atau video-3d-diorama, plus judul, caption, dan hashtag. Gunakan juga setiap kali pengguna minta ide konten, list topik, "bikinin naskah/script", brainstorming konten edukasi, atau bertanya "enaknya bikin video tentang apa" untuk KepoTau.
---

# Naskah KepoTau

Ubah sebuah **kategori** menjadi pilihan ide, atau sebuah **topik** menjadi naskah video pendek
yang siap dirender oleh `video-flat-edukasi` atau `video-3d-diorama`.

Argumen setelah `/naskah` adalah input pengguna. Jika kosong, tanyakan satu kalimat: "Kategori atau
topik apa?" dan beri 4–5 contoh kategori (sains sehari-hari, proses pembuatan, sejarah teknologi,
tubuh manusia, kimia di rumah).

## Langkah 1: Kategori atau topik?

- **Kategori**: terlalu luas untuk satu video 45–80 detik ("chemical", "proses pembuatan alat
  perkakas", "otomotif", "luar angkasa"). Lanjut ke Langkah 2 (daftar ide).
- **Topik spesifik**: cukup untuk satu video, karena ada satu benda/proses/pertanyaan
  ("proses pembuatan airbag mobil", "kenapa es batu mengapung"). Pilih gaya sendiri dengan kriteria
  **Gaya** di Langkah 2 (jangan bertanya), sebutkan pilihannya di awal jawaban, lalu lanjut ke
  Langkah 3. Pengguna bisa meminta ganti gaya kapan saja; tulis ulang dengan format gaya lain.
- **Ragu**: anggap kategori, karena memilih dari daftar lebih murah daripada menulis ulang naskah.

## Langkah 2: Daftar ide (untuk kategori)

Buat **10 ide**, bernomor, dalam tabel:

| No | Topik | Hook (kalimat pembuka) | Gaya | Kenapa menarik |
|---|---|---|---|---|

- **Topik**: spesifik dan konkret ("Proses pembuatan obeng: dari batang baja jadi obeng"), bukan
  umum ("Tentang obeng").
- **Hook**: kalimat pertama video, maksimal 10 kata, berupa pertanyaan, fakta mengejutkan, atau
  situasi relatable. Contoh: "kenapa obeng nggak pernah bengkok walau diputer kenceng?"
- **Gaya**: `flat` (video-flat-edukasi: konsep, sains, kimia, tubuh, fakta unik, perbandingan) atau
  `3d` (video-3d-diorama: proses fisik/pabrik bertahap, mesin, bangunan, bawah tanah, evolusi
  teknologi dari zaman dulu ke sekarang).
- **Kenapa menarik**: unsur kejutan atau kedekatan dengan penonton, dalam satu frasa.

Variasikan sudut pandang dalam satu daftar: proses ("gimana dibuat"), alasan ("kenapa"), sejarah
("dulu vs sekarang"), mitos vs fakta, perbandingan, bahaya/keamanan. Utamakan benda yang dipakai
sehari-hari di Indonesia. Hindari topik yang menuntut instruksi berbahaya (lihat Batasan).

Tutup dengan: **"Pilih nomor (boleh lebih dari satu), atau ketik `lagi` untuk 10 ide lain."**
Lalu berhenti dan tunggu pilihan pengguna. Jika pengguna memilih beberapa nomor, tulis naskahnya
satu per satu.

## Langkah 3: Riset singkat

Naskah edukasi harus benar. Jika ada alat pencarian web, cari 2–4 sumber tepercaya (situs produsen,
ensiklopedia, jurnal, situs edukasi/pemerintah) tentang tahapan proses, angka, dan tahun penting,
lalu cocokkan fakta yang akan dipakai. Tanpa alat pencarian, tulis dari pengetahuan sendiri dan
tandai angka/tahun yang kurang pasti dengan "sekitar", atau hilangkan.

## Langkah 4: Tulis naskah

Baca `references/format.md` untuk format per gaya. Pegangan umum:

- **Durasi** 45–80 detik: 18–28 scene (flat) atau 12–22 shot (3d).
- **Struktur**: Hook → Konteks/masalah → Proses atau penyebab langkah demi langkah → Fakta wow
  (angka atau perbandingan yang bisa divisualkan) → Twist/kejutan → Penutup + pertanyaan ke
  penonton (CTA komentar).
- **Bahasa**: Indonesia santai seperti teman bercerita ("ternyata", "nah", "bayangin"), huruf
  kecil, kalimat pendek. Gaya `3d` memakai sudut pandang orang kedua ("kamu pasang...").
- **Visual**: setiap scene/shot punya ide visual konkret yang bisa digambar oleh skill videonya.
- **Branding**: video ditutup outro KepoTau secara otomatis oleh skill video, jadi tidak perlu
  ditulis di naskah. CTA boleh menyebut "follow KepoTau biar makin kepo" sekali saja.

## Langkah 5: Output

Tampilkan di chat:

1. **Judul** (3 opsi, ≤ 60 karakter, memancing rasa penasaran)
2. **Hook alternatif** (3 opsi)
3. **Naskah** dalam format gaya yang dipilih (tabel)
4. **Caption** TikTok/IG (2–3 kalimat + pertanyaan) dan **hashtag** (8–12, campuran umum dan niche,
   termasuk `#kepotau`)
5. **Catatan fakta**: poin yang perlu dicek ulang, beserta sumber jika ada riset

Tampilkan semuanya lengkap di chat, lalu simpan juga ke file `naskah/<slug-topik>.md` di direktori
kerja (buat foldernya bila belum ada) dengan isi yang sama, supaya bisa dipakai ulang atau diedit.

Momen "fakta wow" dan twist cukup ditulis di kolom kalimat/kata kunci; tidak perlu kolom khusus.
Jika CTA berupa pertanyaan tebakan, tulis jawabannya di Catatan fakta (bukan di naskah), supaya
bisa dipakai untuk membalas komentar.

Tutup dengan tawaran: **"Mau langsung dibikin videonya? (gaya flat / 3d)"**. Jika pengguna setuju,
jalankan skill `video-flat-edukasi` atau `video-3d-diorama` dengan naskah ini sebagai input.

## Batasan

Topik kimia, senjata, bahan peledak, obat, atau perkakas tetap boleh dijelaskan pada tingkat
**konsep dan proses industri** (apa yang terjadi dan kenapa aman/berbahaya). Jangan menuliskan
resep, takaran, suhu/tekanan spesifik, atau langkah praktis yang bisa dipakai untuk membuat sesuatu
yang berbahaya di rumah. Contohnya, airbag dijelaskan sebagai "reaksi kimia yang menghasilkan gas
sangat cepat", tanpa formula dan takaran propelan. Jika sebuah kategori condong ke arah berbahaya,
arahkan idenya ke sisi keamanan, sejarah, atau sains di baliknya.
