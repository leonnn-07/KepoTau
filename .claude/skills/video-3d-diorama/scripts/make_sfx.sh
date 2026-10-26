#!/usr/bin/env bash
# Membuat ulang sound effect bawaan (disintesis dengan ffmpeg, bebas lisensi) ke assets/sfx/.
# Hanya perlu dijalankan jika ingin mengubah karakter suaranya; file .wav sudah disertakan.
set -e
D="$(cd "$(dirname "$0")/.." && pwd)/assets/sfx"; mkdir -p "$D"
f() { ffmpeg -v error -y -f lavfi -i "$2" ${3:+-af "$3"} -ar 44100 -ac 1 "$D/$1.wav"; }
# pop: nada turun cepat (objek/kata kunci muncul)
f pop    "aevalsrc='0.9*exp(-t*38)*sin(2*PI*(260*t+700*(1-exp(-45*t))/45))':d=0.16" "afade=t=out:st=0.12:d=0.04"
# pop2: versi lebih tinggi & pendek (detail/label)
f pop2   "aevalsrc='0.7*exp(-t*50)*sin(2*PI*(520*t+900*(1-exp(-55*t))/55))':d=0.11" "afade=t=out:st=0.08:d=0.03"
# whoosh: desis udara (pergantian scene)
f whoosh "aevalsrc='(random(0)*2-1)*pow(sin(PI*min(t/0.32\,1)),2)':d=0.32" "highpass=f=500,lowpass=f=3500,volume=0.55"
# swish: desis pendek (objek meluncur masuk)
f swish  "aevalsrc='(random(1)*2-1)*pow(sin(PI*min(t/0.18\,1)),2)':d=0.18" "highpass=f=1500,lowpass=f=6000,volume=0.45"
# ding: lonceng (benar / fakta penting)
f ding   "aevalsrc='exp(-t*5)*(0.55*sin(2*PI*1320*t)+0.25*sin(2*PI*2640*t)+0.12*sin(2*PI*3960*t))':d=0.9"
# buzz: salah / mitos
f buzz   "aevalsrc='0.35*exp(-t*4)*(sin(2*PI*140*t)+0.6*sin(2*PI*210*t)+0.3*sin(2*PI*280*t))':d=0.35" "afade=t=out:st=0.28:d=0.07"
# boing: tanda tanya / lucu
f boing  "aevalsrc='0.6*exp(-t*5)*sin(2*PI*(180*t+60*sin(2*PI*9*t)/(2*PI*9)*t*8))':d=0.55" "afade=t=out:st=0.45:d=0.1"
# rise: nada naik (logo outro terisi)
f rise   "aevalsrc='0.35*min(t*3\,1)*sin(2*PI*(300*t+500*t*t/1.3))':d=1.3" "afade=t=out:st=1.1:d=0.2"
# sparkle: kilau (logo selesai / bintang)
f sparkle "aevalsrc='0.3*(exp(-t*9)*sin(2*PI*2093*t)+exp(-max(t-0.07\,0)*9)*sin(2*PI*2637*t)*gt(t\,0.07)+exp(-max(t-0.14\,0)*9)*sin(2*PI*3136*t)*gt(t\,0.14))':d=0.8"
# clunk: ketukan kayu/benda mendarat (objek dirakit)
f clunk  "aevalsrc='0.9*exp(-t*28)*(sin(2*PI*(110*t+80*(1-exp(-30*t))/30))+0.4*sin(2*PI*330*t)*exp(-t*40))+0.25*(random(2)*2-1)*exp(-t*60)':d=0.3" "lowpass=f=2500"
# splash: air mengalir / percikan
f splash "aevalsrc='(random(3)*2-1)*(1-exp(-t*30))*exp(-t*3.5)':d=0.9" "highpass=f=700,lowpass=f=5000,volume=0.6"
# ambience: angin + burung samar, 12 dtk, di-loop pelan sepanjang video
ffmpeg -v error -y -f lavfi -i "anoisesrc=c=pink:a=0.25:d=12:r=44100" -f lavfi -i "aevalsrc='0.05*sin(2*PI*(3200+400*sin(2*PI*14*t))*t)*lt(mod(t\,4.3)\,0.25)+0.04*sin(2*PI*(3800+500*sin(2*PI*18*t))*t)*lt(mod(t+2\,6.1)\,0.18)':d=12:s=44100" -filter_complex "[0]lowpass=f=600,volume=0.5[a];[a][1]amix=inputs=2:normalize=0,afade=t=in:d=0.5,afade=t=out:st=11.5:d=0.5" -ac 1 "$D/ambience.wav"
echo "SFX dibuat di $D"
