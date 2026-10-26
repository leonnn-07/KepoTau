# VO ElevenLabs — Kenapa es batu mengapung?

Video: `kenapa-es-batu-mengapung.mp4` (87 detik, sudah ada SFX, belum ada VO).

## Pengaturan ElevenLabs

- **Model:** Eleven Multilingual v2
- **Voice:** pilih dari Voice Library dengan filter bahasa *Indonesian*, gaya ceria/santai. Pakai voice yang sama untuk semua kalimat.
- **Stability** 45% · **Similarity** 75% · **Style** 25% · **Speed** 1.05

## Cara A (direkomendasikan): per kalimat, sinkron otomatis

Buat **satu audio per baris** di bawah, unduh, lalu beri nama sesuai nomor (`vo-01.mp3`, `vo-02.mp3`, …). Kirim semua filenya ke Claude, nanti videonya dirender ulang dan durasi tiap scene otomatis menyesuaikan suaramu.

| No | Slot di video | Teks untuk ElevenLabs |
|---|---|---|
| 01 | 0.3–2.5 dtk | harusnya es itu tenggelam |
| 02 | 2.9–5.1 dtk | tapi kok malah ngambang? |
| 03 | 5.5–8.7 dtk | padahal kebanyakan zat makin rapat saat beku |
| 04 | 9.1–11.9 dtk | contohnya lilin, yang padat malah tenggelam |
| 05 | 12.3–15.5 dtk | tapi air beda sendiri, dia si pemberontak |
| 06 | 15.8–18.7 dtk | ternyata gara-garanya ada di bentuk molekulnya |
| 07 | 19.1–21.6 dtk | molekul air suka gandengan tangan |
| 08 | 21.9–24.5 dtk | gandengan ini namanya ikatan hidrogen |
| 09 | 24.8–27.7 dtk | waktu air masih cair, gandengannya lepas-pasang |
| 10 | 28.0–30.3 dtk | jadi molekulnya bisa dempet-dempetan |
| 11 | 30.6–33.5 dtk | tapi pas membeku, mereka baris rapi |
| 12 | 33.9–36.1 dtk | polanya segi enam |
| 13 | 36.5–39.3 dtk | dan di tengahnya ada ruang kosong |
| 14 | 39.7–42.5 dtk | makanya es lebih ringan dari air |
| 15 | 42.9–46.1 dtk | pas membeku, air memuai sekitar sembilan persen |
| 16 | 46.5–49.7 dtk | itu sebabnya botol di freezer bisa retak |
| 17 | 50.1–54.8 dtk | dan gunung es, sekitar sembilan puluh persennya ada di bawah air |
| 18 | 55.2–59.5 dtk | uniknya lagi, air paling padat di suhu empat derajat celcius |
| 19 | 59.9–63.1 dtk | jadi pas danau membeku, esnya di atas |
| 20 | 63.5–65.7 dtk | es itu jadi selimut |
| 21 | 66.1–68.6 dtk | ikan di bawahnya tetap hidup |
| 22 | 69.0–72.6 dtk | coba kalau es tenggelam, danau bisa beku total |
| 23 | 73.0–76.2 dtk | jadi, es ngambang itu sebenarnya penyelamat kehidupan |
| 24 | 76.6–80.2 dtk | selain air, ada juga yang memuai saat beku |
| 25 | 80.6–83.8 dtk | menurut kamu yang mana? tulis di komentar! |

## Cara B: satu file sekaligus (edit sendiri di CapCut)

Tempel teks ini ke ElevenLabs sebagai satu generate. Tag `<break>` memberi jeda antar kalimat. Taruh audionya di detik 0 di CapCut, lalu geser potongannya supaya pas dengan timeline di tabel Cara A. File `kenapa-es-batu-mengapung.srt` bisa diimpor sebagai subtitle untuk patokan.

```
harusnya es itu tenggelam <break time="0.8s" /> tapi kok malah ngambang? <break time="0.8s" /> padahal kebanyakan zat makin rapat saat beku <break time="0.8s" /> contohnya lilin, yang padat malah tenggelam <break time="0.8s" /> tapi air beda sendiri, dia si pemberontak <break time="0.8s" /> ternyata gara-garanya ada di bentuk molekulnya <break time="0.8s" /> molekul air suka gandengan tangan <break time="0.8s" /> gandengan ini namanya ikatan hidrogen <break time="0.8s" /> waktu air masih cair, gandengannya lepas-pasang <break time="0.8s" /> jadi molekulnya bisa dempet-dempetan <break time="0.8s" /> tapi pas membeku, mereka baris rapi <break time="0.8s" /> polanya segi enam <break time="0.8s" /> dan di tengahnya ada ruang kosong <break time="0.8s" /> makanya es lebih ringan dari air <break time="0.8s" /> pas membeku, air memuai sekitar sembilan persen <break time="0.8s" /> itu sebabnya botol di freezer bisa retak <break time="0.8s" /> dan gunung es, sekitar sembilan puluh persennya ada di bawah air <break time="0.8s" /> uniknya lagi, air paling padat di suhu empat derajat celcius <break time="0.8s" /> jadi pas danau membeku, esnya di atas <break time="0.8s" /> es itu jadi selimut <break time="0.8s" /> ikan di bawahnya tetap hidup <break time="0.8s" /> coba kalau es tenggelam, danau bisa beku total <break time="0.8s" /> jadi, es ngambang itu sebenarnya penyelamat kehidupan <break time="0.8s" /> selain air, ada juga yang memuai saat beku <break time="0.8s" /> menurut kamu yang mana? tulis di komentar!
```

Outro (83,9–87,4 dtk) tanpa suara: logo KepoTau + @kepotau.ofc.
