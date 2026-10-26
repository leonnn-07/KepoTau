# Referensi komponen & format scene

Kanvas 1080 × 1920. Konstanta `G = 1520` = garis atas tanah. Zona aman untuk art: y 600–1500
(di atas tanah) dan y 1520–1800 (di dalam tanah). Teks kecil + KATA KUNCI menempati y 290–520,
jadi jangan taruh art di atas y ≈ 580.

## Format satu scene

```js
{ dur: 3,                 // detik minimum (2–4); otomatis diperpanjang jika voiceover lebih panjang
  small: "teks pengantar",// baris kecil putih; kalau sama dengan scene sebelumnya, tidak dianimasikan ulang
  big: "KATA KUNCI",      // huruf besar, otomatis mengecil agar muat satu baris
  color: "yellow",        // warna kata kunci: yellow|purple|mint|blue|red|orange|white|pink|green atau hex
  ground: "dry",          // opsional, timpa CONFIG.ground: "normal"|"dry"|"wet"|false
  rain: "light",          // opsional: hujan di seluruh layar, "light"|"heavy"
  cta: "tulis di komentar", // opsional: tombol putih di bawah
  bigSize: 110,           // opsional: ukuran awal kata kunci
  vo: "teks untuk dibacakan", // opsional: voiceover; default = small + big; "" = tanpa suara
  art: C => A('pop',.3, C.sun(760,760)) + C.sprout(300,G,true) }
{ type: "outro", dur: 2.5 }   // layar penutup: brand + kolom cari @handle
```

`art` mengembalikan **string SVG**. Gabungkan komponen dengan `+`. Urutan = urutan tumpukan
(yang belakang ditulis dulu).

## Animasi: `A(kelas, delay, isi)`

Masuk (sekali): `pop` (membesar dan memantul, default untuk objek), `fade`, `rise` (naik dari bawah),
`slideL` / `slideR` (masuk dari kiri/kanan), `grow` (tumbuh dari bawah, cocok untuk batang/grafik).
Berulang: `bob` (naik-turun), `sway` (bergoyang dari bawah), `wiggle`, `pulse`, `spin`.

Delay dalam detik. Pola yang enak: caption besar muncul di 0.3 dtk, objek utama 0.3–0.5,
label/detail 0.6–1.0. Lebih dari 1.5 dtk terasa telat untuk scene 3 detik.

Untuk menggabungkan animasi masuk dengan animasi berulang, bungkus berlapis:
`A('pop',.3, A('bob',0, C.drop(540,900)))`.

Untuk objek yang "berjalan masuk": `A('walk',.2, isi, '--from:500px;--dur:2s')`.

## Komponen `C.*`

| Komponen | Kegunaan |
|---|---|
| `text(x,y,str,{size,color,weight,anchor})` | teks bebas di dalam art |
| `cloud(x,y,s)` | awan lavender, otomatis bob |
| `sun(x,y,s)` | matahari dengan sinar berputar |
| `rain(kind, box?)` | hujan; `box={x,y,w,h}` untuk membatasi area (mis. di dalam panel) |
| `ground(type)` | tanah (biasanya otomatis) |
| `sprout(x,y=G,wilt)` | tunas tanaman; `wilt=true` = layu kekuningan |
| `face(x,y,s,dir)` | kepala manusia profil; `dir=1` menghadap kanan, `-1` kiri. Hidung ±150·s dari x |
| `smell(x1,y1,x2,y2,color,amp)` | dua garis putus-putus berliuk dan mengalir (bau, aliran, sinyal, gelombang) |
| `bacterium(x,y,rot,s,fill)` | satu bakteri kapsul berwajah |
| `colony(x,y,s,fill)` | gerombolan 6 bakteri bergoyang (lebar ≈ 260·s) |
| `molecule(x,y,s,color)` | molekul dua heksagon + OH |
| `pill(x,y,text,color,size)` | label kecil berbentuk pil (untuk penamaan objek) |
| `chip(x,y,text,color,size)` | label besar berisi warna (BANYAK / SEDIKIT / BENAR / MITOS) |
| `magnifier(x,y,r,inner,{bg})` | kaca pembesar; `inner` digambar di koordinat absolut, dipotong lingkaran |
| `drop(x,y,s,color)` | tetes air |
| `dome(x,w,y=G)` | tetes air setengah bola di permukaan |
| `particles(x,y,{n,spread,dist,colors,angle})` | butiran menyembur terus-menerus (angle -90 = ke atas) |
| `panel(x,y,w,h,label,color,inner)` | bingkai perbandingan; (x,y) = titik tengah |
| `paper(x,y,title,sub,rot)` | kertas jurnal/penelitian ("Nature 2020") |
| `card(x,y,w,h,{title,subtitle,lines})` | kartu krem bergaris putus-putus (undangan, catatan, kutipan) |
| `qmark(x,y,s,color)` | tanda tanya besar |
| `check(x,y,s)` / `cross(x,y,s)` | benar / salah |
| `sparkle(x,y,s)` | kilauan |
| `arrow(x1,y1,x2,y2,color)` | panah putus-putus mengalir |
| `icon(name,x,y,s)` | `cup` `book` `glass` `bulb` `phone` `leaf` |

## Menggambar objek baru (custom SVG)

Kalau topik butuh objek yang tidak ada (otak, planet, kucing, gigi, sel darah, uang, dll.), tulis SVG
langsung di `art` dengan aturan gaya yang sama supaya tetap seragam:

- Bentuk geometris sederhana (circle, rect rx besar, path halus), maksimal ±8 elemen per objek.
- Isi warna flat dari palet: `#A78BFA` ungu, `#6EE7B7` mint, `#7DD3FC` biru, `#FBBF24` kuning,
  `#F87171` merah, `#F2B98B` kulit, `#6B4423` coklat, `#F8FAFC` putih.
- Outline `stroke="#16132E" stroke-width="4-6" stroke-linejoin="round"` untuk objek "karakter";
  diagram garis (molekul, grafik) tanpa fill, stroke warna aksen 6–7 px.
- Makhluk kecil diberi wajah titik-titik (2 mata + mulut) supaya lucu dan konsisten dengan bakteri.
- Bungkus dengan `<g transform="translate(x y) scale(s)">` agar mudah dipindah dan dianimasikan.
- Setiap objek penting diberi `C.pill(...)` sebagai label nama.

Contoh hewan kecil bersegmen (springtail):
```js
const bug=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})" stroke="#16132E" stroke-width="4">
 ${[0,1,2,3,4].map(i=>`<circle cx="${i*-48}" cy="0" r="${i?30:36}" fill="#8EA2F8"/>`).join('')}
 <circle cx="12" cy="-8" r="6" fill="#16132E"/><path d="M20 -30 C40 -80 70 -90 90 -95 M5 -32 C15 -80 40 -100 60 -110" fill="none"/></g>`;
```
Fungsi helper seperti ini boleh ditaruh di atas `const SCENES`.
