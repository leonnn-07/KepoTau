# Format naskah per gaya

## Gaya `flat` (untuk video-flat-edukasi)

Satu baris per scene. Setiap kalimat dipecah menjadi **teks kecil** (pengantar, huruf kecil) dan
**KATA KUNCI** (1–4 kata, huruf besar), ditambah ide visual dari komponen flat (bakteri, molekul,
wajah, panel perbandingan, ikon, label pil, kaca pembesar, grafik batang, ponsel, dll.).

Contoh di bawah hanya ilustrasi format; angkanya bukan fakta terverifikasi. Selalu pakai angka dari riset.

| No | Teks kecil | KATA KUNCI | Visual | VO (jika beda) |
|---|---|---|---|---|
| 1 | kenapa airbag bisa | MENGEMBANG SECEPAT ITU? | mobil tabrakan, tanda tanya | |
| 2 | cuma butuh | <ANGKA DETIK> | jam/stopwatch, label "lebih cepat dari kedipan" | (angka dibaca dalam kata) |

Aturan:
- Teks kecil + kata kunci dibaca berurutan menjadi satu kalimat utuh.
- Kata kunci ≤ 22 karakter agar muat satu baris.
- Satu scene satu ide; 2–4 detik per scene.
- Kolom VO diisi hanya jika teks layar mengandung angka, simbol, atau singkatan yang dibaca aneh
  oleh TTS.
- Gunakan "gegara/ternyata gara-garanya..." untuk masuk ke penyebab, dan "jadi, X itu
  sebenarnya / ANALOGI" untuk penutup lucu.

## Gaya `3d` (untuk video-3d-diorama)

Satu baris per shot. Kalimat VO (yang juga menjadi caption kata per kata), objek 3D yang
muncul/dirakit, area/lokasi, gerak kamera, dan transisi.

| No | Kalimat (VO + caption) | Objek muncul | Area | Kamera | Transisi |
|---|---|---|---|---|---|
| 1 | bayangin kamu kerja di pabrik airbag | gedung pabrik, papan "pabrik" | A | reveal | cut |
| 2 | pertama, kain nilon dipotong pakai laser | gulungan kain, meja potong, sinar laser | A | push | fly |
| 3 | potongannya dijahit jadi kantong | mesin jahit, kantong airbag | B (sebelah A) | orbitR | whip |

Aturan:
- Kalimat ≤ 10 kata, sudut pandang orang kedua ("kamu"), santai.
- Proses dipecah menjadi tahap-tahap fisik yang bisa **dirakit** satu per satu di maket.
- Area: tahapan berurutan ditaruh di area bersebelahan (A, B, C) agar bisa disambung **whip pan**;
  lokasi berbeda jauh (dalam mobil, laboratorium) memakai `cut`.
- Kamera bervariasi; jangan memakai gerak yang sama dua kali berturut-turut, termasuk sesudah cut (push, pull, zoomIn,
  zoomOut, orbitL/R, craneUp/Down, truckL/R, reveal, dive).
- Papan tahun/era bila ceritanya sejarah ("1953 → sekarang").

## Rumus hook yang sering berhasil

- **Kenapa + hal sehari-hari**: "kenapa sabun bisa ngilangin minyak?"
- **Angka mengejutkan**: "airbag mengembang lebih cepat dari kedipan mata"
- **Bayangin**: "bayangin kamu harus bikin palu tanpa mesin"
- **Ternyata salah**: "selama ini kita salah soal..."
- **Dulu vs sekarang**: "dulu orang ngambil air pakai ember, sekarang..."
- **Rahasia di balik**: "ada bahan rahasia di setiap..."

## Contoh daftar ide (kategori "proses pembuatan alat perkakas")

| No | Topik | Hook | Gaya | Kenapa menarik |
|---|---|---|---|---|
| 1 | Proses pembuatan palu: tempa panas sampai gagang | "palu itu dibikin pakai... palu yang lebih besar" | 3d | ironi + proses tempa visual |
| 2 | Kenapa obeng magnetis bisa narik baut | "obeng kamu diam-diam itu magnet" | flat | sains sederhana sehari-hari |
| 3 | Proses pembuatan kunci pas: dari batang baja ke krom mengilap | "kenapa kunci pas nggak pernah karatan?" | 3d | tahap tempa → pelapisan |
| ... | | | | |
