# Referensi engine 3D diorama

Satuan meter. Sumbu: x ke kanan, y ke atas, z ke arah kamera (depan diorama = z besar).
Permukaan tanah y = 0. Semua prefab ber-origin **di tengah bawah**, jadi `pos` = titik di tanah.

## Struktur file

```js
const CONFIG = { brand, brandSplit, tagline, handle, socials, ambience };
const WORLD = K => [ ...objek yang ada sejak awal (lingkungan) ];
const SHOTS = [ { say, vo?, cam, add?, remove?, minDur?, sfx? }, ..., { type: "outro", dur: 3.5 } ];
```

### Shot

| Field | Isi |
|---|---|
| `say` | kalimat narasi = caption kata per kata (gaya bicara santai, huruf kecil) |
| `vo` | opsional: teks yang dibacakan TTS bila berbeda dari `say` (angka, singkatan) |
| `cam` | preset `{ focus, dist, angle, pitch, move, amount, fov, shake }` (lihat **Kamera**), atau bebas `{ pos, look, to:{pos,look,fov}, fov }` |
| `trans` | transisi masuk ke shot ini: `cut` (default), `whip`, `fly`, `zoom` (lihat **Transisi**) |
| `add` | `K => [ ...objek ]`: objek baru yang muncul di shot ini. Bungkus dengan `A()` untuk animasi |
| `remove` | `['id', ...]`: objek ber-id yang hilang mulai shot ini (berlaku juga untuk objek WORLD yang diberi `userData.id`) |
| `minDur` | durasi minimum (dtk) bila animasi butuh waktu lebih lama dari kalimatnya (berlaku dengan dan tanpa VO) |
| `sfx` | `[{at, s, v}]` SFX tambahan; `false` = tanpa SFX |

Tanpa VO, durasi shot = jumlah kata / 2.6 + 0.9 dtk (atau `dur`). Dengan VO, durasi = panjang suara + 0.7 dtk.

### Animasi muncul: `A(objek, anim, delay, sfx?)`

`anim`: `dig` (tanah berkurang dari atas = menggali; pakai pada `K.plug`), `rise` (naik dari bawah tanah, cocok untuk bangunan/mesin), `drop` (jatuh memantul, cocok untuk
rumah/papan), `pop` (membesar), `grow` (pipa memanjang dari titik awal, air/lapisan mengisi dari bawah),
`fade`, `none`. `delay` dalam detik sejak shot dimulai (biasanya 0.2–1.0, harus < durasi VO).
Argumen ke-4 (opsional): `'year'` (bunyi *ding* untuk papan tahun), nama SFX (`clunk`, `splash`,
`pop2`, `ding`, ...), sebuah id untuk dipakai di `remove` (mis. `'kincir'`), atau `{ id, sfx }`.
Tanpa argumen ini, SFX mengikuti animasi: rise/drop → `clunk`, pop → `pop2`, grow air → `splash`,
grow lainnya → `swish`.

## Prefab `K.*`

**Tanah & lingkungan**

| Prefab | Keterangan |
|---|---|
| `ground({x:[x0,x1], z:[z0,z1], depth, cuts:[{x:[a,b], depth, z?:[c,d]}]})` | tanah diorama berpenampang (rumput di atas, strata tanah di sisi). `cuts` tanpa `z` = parit memanjang (sungai, saluran); dengan `z:[c, z1]` = galian terbuka ke depan, sehingga isinya terlihat dari kamera |
| `soil(pos, [w,h,d], {grass})` | satu blok tanah; `pos` = tengah ATAS blok |
| `field({cutZ})` | padang rumput luas di belakang z < cutZ (pakai cutZ = tepi belakang diorama) |
| `forest({count, rMin, rMax, cutZ})` | pepohonan latar melingkar |
| `tree(pos, s)` / `rock(pos, s)` / `fence(a, b)` | pohon low-poly, batu, pagar kayu dari titik a ke b |
| `water(pos, [w,h,d], {color, opacity})` | air (kotak transparan). Keruh `#8a7a5c`/`#B79A72`, bersih `#5aa3c8` |
| `plug({x, z, depth})` | sumbat tanah seukuran sebuah cut. Lubang yang baru akan digali: buat cut di `ground`, taruh `plug` di WORLD (lubang tertutup), lalu di shot penggalian `A(K.plug(...), 'dig', .2)` (set `userData.digDur`). Atau beri plug WORLD sebuah id dan `remove` |
| `aquifer({x:[a,b], top, h, z, color})` | lapisan air tanah biru di muka depan penampang (`z` = z1 tanah) |

**Bangunan & mesin**

| Prefab | Keterangan |
|---|---|
| `waterWheel(pos, {r, width, speed})` | kincir air kayu berputar terus |
| `tower(pos, {h, w, tank})` | menara kayu + tangki logam (otomatis ada papan KepoTau kecil) |
| `pipe([[x,y,z], ...], {r, color, opacity})` | pipa lurus antar titik; `grow` = memanjang; `opacity` < 1 untuk pipa bening (isi pipa terlihat) |
| `pump(pos, {h})` | piston sederhana naik-turun |
| `handPump(pos)` | pompa tangan (dragon) dengan tuas bergerak |
| `electricPump(pos)` | pompa air listrik di atas pondasi beton |
| `toren(pos, {h, color})` | toren air plastik di menara besi (+ papan KepoTau) |
| `person(pos, {pose, rot, color, s})` | figur orang sederhana (tokoh "kamu"); pose `stand`, `walk`, `work` (lengan bergerak) |
| `house(pos, {w,d,h,wall,roof})` | rumah dinding gelap + atap genteng |
| `tank(pos, {w,d,h})` | bak beton cutaway (dinding depan terbuka) |
| `layers(pos, [w,d], [{h,color}, ...])` | lapisan bertumpuk dari bawah (kerikil, pasir, tanah) |
| `room(pos, {w,d,h,floor,wall})` | ruangan keramik (lantai + dinding belakang & kiri), untuk adegan dalam rumah |
| `tub(pos)`, `tap(pos)`, `stream(pos, len, {color})`, `bucket(pos, color)` | bak mandi, keran, aliran air jatuh, ember |

**Teks & branding**

| Prefab | Keterangan |
|---|---|
| `sign(pos, '1582', {w,h,rot})` | papan putih bertiang, untuk tahun/era/nama tempat |
| `brandBoard(pos, rotY, scale)` | papan berlogo resmi KepoTau + @kepotau.ofc; tempel di dinding/tangki (pos = tengah papan) |
| `banner(pos, {w, h, pole, rot})` | **spanduk kain** berlogo KepoTau di antara dua tiang, berkibar pelan |
| `flag(pos, {h, fw, fh, rot})` | **bendera** berlogo KepoTau di tiang tinggi, berkibar (kain memanjang ke +x lokal; putar `rot` 180 untuk ke kiri) |
| `label(pos, text)` | label pil putih melayang (selalu menghadap kamera, terlihat menembus objek). Otomatis hilang di akhir shot tempat ia muncul; set `userData.keep = true` agar bertahan |

**Partikel & primitif**

| Prefab | Keterangan |
|---|---|
| `particles(pos, [w,h,d], {n, color, size, motion})` | butiran di dalam kotak; motion `down` (air menetes/mengalir), `up` (gelembung), `settle` (kotoran mengendap ke atas lapisan), `float` |
| `box(pos, [w,h,d], color)`, `cylinder(pos, r, h, color)` | primitif bebas |

## Mesin dengan bagian bergerak

Setiap mesin harus **memperlihatkan cara kerjanya**: gerigi berputar dan saling mengunci, piston
naik-turun, sabuk berjalan, baling-baling berputar. Jangan mewakili mesin dengan tabung/kotak diam.
Jika prefab di bawah tidak cukup, buat sendiri dari bagian-bagiannya dan animasikan lewat
`userData.update` (animasi bagian yang dibungkus di dalam grup tetap berjalan otomatis).

| Prefab | Gerak |
|---|---|
| `gear(pos, {r, teeth, thick, speed, color, axis})` | roda gigi bergerigi + jari-jari, berputar (axis `z` menghadap kamera, `y` rebah) |
| `gears(pos, {list:[{r,teeth}], speed, angle})` | rangkaian gigi yang **benar-benar mengunci**: posisi, fase gigi, arah (berlawanan) & rasio kecepatan dihitung otomatis. Pakai teeth ≈ 20 × r agar ukuran gigi sama |
| `crankPiston(pos, {r, rod, speed, bore})` | roda engkol berputar → batang penghubung → piston naik-turun di silinder bening (mesin, pompa, kompresor) |
| `turbine(pos, {r, blades, speed, axis})` | turbin/baling-baling/kipas berputar |
| `conveyor(pos, {len, w, h, speed, items, item})` | ban berjalan: sabuk bergeser, rol berputar, barang ikut berjalan (`item` warna atau fungsi pembuat objek) |
| `press(pos, {w, h, speed, color})` | mesin press: palu menghantam lalu naik (pabrik, cetak logam) |
| `screwPump(pos, {len, r, angle, speed})` | ulir Archimedes berputar di tabung bening |
| `valve(pos, {r, speed, color})` | roda katup diputar bolak-balik |
| `smoke(pos, {n, rise, size, color})` | asap/uap naik dan membesar (cerobong, ketel, mesin uap) |
| `waterWheel`, `pump`, `handPump`, `person` | (lihat atas) juga beranimasi |

Kecepatan: putaran lambat lebih "terbaca" (speed 0.6–2 rad/dtk untuk gigi besar). Untuk transmisi
(kincir → gigi → piston), samakan arah/kecepatan logisnya: gigi pertama mengikuti kecepatan poros.

## Reklame / branding KepoTau

Video 3D memakai banyak branding **di dalam dunia** seperti iklan sungguhan (selain logo kecil di
pojok kiri atas yang otomatis). Semua memakai logo resmi + handle `CONFIG.handle` (@3d.kepotau.ofc).

| Prefab | Keterangan |
|---|---|
| `ads({x:[a,b], z, every, skip})` | **pasang ini di setiap area**: deretan reklame otomatis di sepanjang tepi belakang (billboard → 2 bendera → bunting + standee → spanduk, bergantian). `skip` mengosongkan rentang x di belakang objek penting |
| `billboard(pos, {w, h, legs, rot, tagline})` | billboard iklan besar berkaki baja + lampu sorot, berisi logo, tagline, dan "TIKTOK & INSTAGRAM @handle" |
| `standee(pos, {h, w, rot})` | roll-up banner berdiri |
| `bunting(a, b, {h, n, sag})` | untaian bendera segitiga kuning-navy berlogo di antara dua tiang, bergoyang |
| `poster(pos, {w, h, rot})` | poster logo yang ditempel di dinding bangunan (tempel di rumah, pabrik, tangki) |
| `banner`, `flag`, `brandBoard` | spanduk kain, bendera berkibar, papan logo |

Aturan: minimal satu reklame tertangkap kamera di hampir setiap shot (selain close-up detail), tapi
jangan menutupi objek utama atau caption. Untuk bangunan, tempel `poster` di dindingnya.

## Objek baru (custom)

Gunakan helper engine: `grp(pos, ...anak)`, `box(w,h,d, mat, pos)`, `cyl(rTop, rBot, h, mat, pos)`,
`mesh(geo, mat, pos)`, `canvasTex(w,h,draw)`, `speckle(...)`, `soilSideTex(h, grass, kedalamanAtas)`, `TEX` (cache), material `M.std(color, {rough, metal, opacity, map})`, `M.wood()`, `M.metal(color)`,
tekstur `textTex(text, {...})`, `tileTex(color, grout)`, `concreteTex()`. Animasi berkelanjutan:
`g.userData.update = (t, lt) => { ... }` (t = waktu global, lt = sejak muncul; harus fungsi waktu,
jangan memakai Date/akumulasi, supaya render per frame konsisten).

Aturan gaya: proporsi realistis (pintu ±2 m, ember ±0.5 m), warna natural agak pudar (kayu `#8a6a4a`,
beton `#8d8a84`, logam `#b9c2cb`), material kasar (rough .8–.9) kecuali air/logam. Taruh bangunan di
atas tanah dan mesin air di dasar parit, karena penonton membaca cerita dari penampang tanah.

## Tata letak & kedalaman

- `ground.depth` minimal 12–14 m, karena shot lebar dari atas akan memperlihatkan "void" berwarna langit
  di bawah blok tanah yang dangkal. Untuk sumur bor/tambang, pakai 18–25 m.
- Caption ada di ±60–66% tinggi layar. Preset kamera otomatis menaruh `focus` di ±42% dari atas
  (`frameY`, bisa diubah 0.3–0.5), jadi cukup arahkan `focus` ke objek utamanya.

## Kamera

Pakai **preset** supaya gerak kamera bervariasi tanpa menghitung koordinat:

```js
cam: { focus: [x, y, z], dist: 14, angle: 20, pitch: 22, move: 'push', amount: 1, fov: 38, shake: 0 }
```

- `focus`: titik yang disorot (objek utama shot itu).
- `dist`: jarak kamera ke focus (m).
- `angle`: arah datang dalam derajat; 0 = tepat dari depan (+z), positif = dari kanan, negatif = dari kiri. Jaga ±40 agar penampang tanah tetap terlihat.
- `pitch`: sudut menunduk dalam derajat; 5–10 = setinggi tanah (dramatis), 20–30 = tiga-perempat, 40+ = dari atas.
- `amount`: kekuatan gerak (0.5 halus, 1 normal, 1.5 kuat).
- `shake`: 0..1, goyang tangan halus untuk momen tegang/lucu.

| `move` | Efek | Pakai untuk |
|---|---|---|
| `push` / `pull` | kamera maju / mundur (dolly) | fokus ke objek baru / memperlihatkan konteks |
| `zoomIn` / `zoomOut` | lensa zoom (FOV), posisi tetap | penekanan detail / "lihat sekelilingnya" |
| `orbitL` / `orbitR` | memutari focus ±28° | memperlihatkan bentuk 3D objek |
| `craneUp` / `craneDown` | kamera naik / turun sambil menengadah | objek tinggi (menara), turun ke galian |
| `truckL` / `truckR` | geser ke samping sejajar | mengikuti pipa/aliran |
| `reveal` | dekat & rendah → lebar & tinggi | pembuka / hasil akhir |
| `dive` | tinggi & lebar → dekat & rendah | masuk ke detail bawah tanah |
| `static` | diam | momen singkat |

Kombinasi boleh dipakai: `move: ['zoomIn', 'orbitR'], amount: .6`.

Aturan variasi: jangan memakai `move` atau `angle` yang sama dua shot berturut-turut. Selang-seling
dekat ↔ jauh (dist 7–10 ↔ 16–22) dan rendah ↔ tinggi (pitch 6–12 ↔ 22–30). Shot pembuka biasanya
`reveal`, shot detail `zoomIn`/`dive`, shot objek tinggi `craneUp`, shot pipa/aliran `truckL/R`.

Layar portrait membuat pandangan horizontal sempit (± 0.4 × jarak dengan FOV 38). Untuk memperlihatkan
objek selebar W meter, `dist` ≈ 2.5 × W. Jangan biarkan kamera berada di bawah tanah atau di dalam
blok (pitch kecil + dist kecil di dekat dinding galian).

Bentuk bebas `{ pos, look, to: { pos, look, fov } }` tetap bisa dipakai untuk gerak khusus.

## Transisi (`trans` di shot tujuan)

| `trans` | Durasi | Efek | Pakai untuk |
|---|---|---|---|
| `cut` | 0 | potong langsung (default) | pindah ke lokasi jauh/berbeda (dalam rumah, era lain) |
| `whip` | 0.5 dtk | **kamera melesat cepat** dari posisi akhir shot sebelumnya ke shot ini + motion blur + whoosh keras | pindah ke **area yang bersebelahan** ("di sebelahnya", "lalu") |
| `fly` | 0.9 dtk | kamera terbang halus | pindah sudut di area yang sama |
| `zoom` | 0.45 dtk | punch-in (FOV menyempit sesaat) | penekanan, masuk ke detail |

Objek di `add` otomatis muncul **setelah** transisi selesai (delay dihitung dari akhir transisi).

**Membuat whip pan seperti "scene 1 dan 2 bersebelahan"**: bangun kedua area di satu `K.ground` yang
menyambung, dengan pusat berjarak 18–30 m di sumbu x (mis. area A x≈0, area B x≈26). Shot terakhir di
area A dan shot pertama di area B sebaiknya memakai `angle`/`pitch` yang mirip, sehingga kamera
benar-benar terlihat bergeser ke kanan (atau ke kiri) melewati tanah yang menyambung. Lokasi yang tidak
bersebelahan (dalam rumah) taruh jauh (x ≥ 80) dan masuki dengan `cut`.
