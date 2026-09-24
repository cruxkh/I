#!/bin/bash
# Full build: render 1800 frames -> mix audio -> encode MP4.   usage: tools/build.sh [workers]
set -e
cd "$(dirname "$0")/.."
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
rm -rf out/frames_${OUT:-final} && mkdir -p out/frames_${OUT:-final}
node render.js --range 0:2610 --workers ${1:-4} --out out/frames_${OUT:-final}
python3 tools/mix.py
$FF -y -loglevel error -stats_period 30 -framerate 30 -i out/frames_${OUT:-final}/%05d.jpg -i audio/master.wav \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -profile:v high -tune animation \
  -c:a aac -b:a 256k -movflags +faststart -shortest out/${OUT:-packet_from_home}.mp4
# lighter copy for phones / messaging
VB=$(python3 -c "import json;d=json.load(open('audio/script.json')).get('duration',60);print(int(28.5*8192/d)-170)")k
M=out/${OUT:-packet_from_home}
$FF -y -loglevel error -i $M.mp4 -c:v libx264 -preset slow -tune animation -b:v $VB -pass 1 -passlogfile out/x264pass -an -f mp4 /dev/null
$FF -y -loglevel error -i $M.mp4 -c:v libx264 -preset slow -tune animation -b:v $VB -pass 2 -passlogfile out/x264pass -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart ${M}_mobile.mp4
ls -la out/${OUT:-packet_from_home}*.mp4
