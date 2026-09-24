#!/bin/bash
# Full build: render 1800 frames -> mix audio -> encode MP4.   usage: tools/build.sh [workers]
set -e
cd "$(dirname "$0")/.."
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
rm -rf out/frames_${OUT:-final} && mkdir -p out/frames_${OUT:-final}
node render.js --range 0:1800 --workers ${1:-4} --out out/frames_${OUT:-final}
python3 tools/mix.py
$FF -y -loglevel error -stats_period 30 -framerate 30 -i out/frames_${OUT:-final}/%05d.jpg -i audio/master.wav \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -profile:v high -tune animation \
  -c:a aac -b:a 256k -movflags +faststart -shortest out/${OUT:-packet_from_home}.mp4
# lighter copy for phones / messaging
$FF -y -loglevel error -i out/${OUT:-packet_from_home}.mp4 -c:v libx264 -preset medium -b:v 3200k -maxrate 4500k -bufsize 6000k -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart out/${OUT:-packet_from_home}_mobile.mp4
ls -la out/${OUT:-packet_from_home}*.mp4
