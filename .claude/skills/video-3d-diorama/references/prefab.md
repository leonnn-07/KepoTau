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
| `cam` | `{ pos:[x,y,z], look:[x,y,z], to:{pos?,look?}, fov? }`: kamera bergerak pelan dari pos ke `to.pos` sepanjang shot (ease in-out). Antar shot = potongan (cut). |
| `add` | `K => [ ...objek ]`: objek baru yang muncul di shot ini. Bungkus dengan `A()` untuk animasi |
| `remove` | `['id', ...]`: objek ber-id yang hilang mulai shot ini |
| `minDur` | durasi minimum (dtk) bila animasi butuh waktu lebih lama dari VO |
| `sfx` | `[{at, s, v}]` SFX tambahan; `false` = tanpa SFX |

Tanpa VO, durasi shot = jumlah kata / 2.6 + 0.9 dtk (atau `dur`). Dengan VO, durasi = panjang suara + 0.7 dtk.

### Animasi muncul: `A(objek, anim, delay, sfx?)`

`anim`: `rise` (naik dari bawah tanah, cocok untuk bangunan/mesin), `drop` (jatuh memantul, cocok untuk
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

**Bangunan & mesin**

| Prefab | Keterangan |
|---|---|
| `waterWheel(pos, {r, width, speed})` | kincir air kayu berputar terus |
| `tower(pos, {h, w, tank})` | menara kayu + tangki logam (otomatis ada papan KepoTau kecil) |
| `pipe([[x,y,z], ...], {r, color})` | pipa lurus antar titik; `grow` = memanjang |
| `pump(pos, {h})` | pompa piston naik-turun |
| `house(pos, {w,d,h,wall,roof})` | rumah dinding gelap + atap genteng |
| `tank(pos, {w,d,h})` | bak beton cutaway (dinding depan terbuka) |
| `layers(pos, [w,d], [{h,color}, ...])` | lapisan bertumpuk dari bawah (kerikil, pasir, tanah) |
| `room(pos, {w,d,h,floor,wall})` | ruangan keramik (lantai + dinding belakang & kiri), untuk adegan dalam rumah |
| `tub(pos)`, `tap(pos)`, `stream(pos, len, {color})`, `bucket(pos, color)` | bak mandi, keran, aliran air jatuh, ember |

**Teks & branding**

| Prefab | Keterangan |
|---|---|
| `sign(pos, '1582', {w,h,rot})` | papan putih bertiang, untuk tahun/era/nama tempat |
| `brandBoard(pos, rotY, scale)` | papan biru **KepoTau + @kepotau.ofc**; tempel di dinding/tangki (pos = tengah papan) |
| `label(pos, text)` | label pil putih melayang (selalu menghadap kamera) |

**Partikel & primitif**

| Prefab | Keterangan |
|---|---|
| `particles(pos, [w,h,d], {n, color, size, motion})` | butiran di dalam kotak; motion `down` (air menetes/mengalir), `up` (gelembung), `settle` (kotoran mengendap ke atas lapisan), `float` |
| `box(pos, [w,h,d], color)`, `cylinder(pos, r, h, color)` | primitif bebas |

## Objek baru (custom)

Gunakan helper engine: `grp(pos, ...anak)`, `box(w,h,d, mat, pos)`, `cyl(rTop, rBot, h, mat, pos)`,
`mesh(geo, mat, pos)`, material `M.std(color, {rough, metal, opacity, map})`, `M.wood()`, `M.metal(color)`,
tekstur `textTex(text, {...})`, `tileTex(color, grout)`, `concreteTex()`. Animasi berkelanjutan:
`g.userData.update = (t, lt) => { ... }` (t = waktu global, lt = sejak muncul; harus fungsi waktu,
jangan memakai Date/akumulasi, supaya render per frame konsisten).

Aturan gaya: proporsi realistis (pintu ±2 m, ember ±0.5 m), warna natural agak pudar (kayu `#8a6a4a`,
beton `#8d8a84`, logam `#b9c2cb`), material kasar (rough .8–.9) kecuali air/logam. Taruh bangunan di
atas tanah dan mesin air di dasar parit, karena penonton membaca cerita dari penampang tanah.

## Kamera

Layar portrait (FOV 38°) membuat pandangan horizontal sempit, sekitar 0.4 × jarak. Untuk memperlihatkan
objek selebar W meter, jarak kamera ≈ 2.5 × W. Pola yang enak:
- **establishing**: tinggi 6–7 m, jarak 15–18 m, melihat ke pusat diorama;
- **detail di parit/galian**: tinggi 0–2.5 m (sedikit di atas tanah), jarak 10–15 m, `look` ke y negatif;
- gerak kecil (1–3 m) per shot dengan `to.pos`, jangan berputar jauh.
Pindah ke area/lokasi lain (dalam rumah, era berikutnya) dengan membangunnya di x lain (mis. x = 40, 70)
lalu arahkan kamera ke sana. Antar area cukup berjarak ±30 m agar tidak saling terlihat.
