#!/bin/bash
# Full build: render 1800 frames -> mix audio -> encode MP4.   usage: tools/build.sh [workers]
set -e
cd "$(dirname "$0")/.."
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
rm -rf out/frames && mkdir -p out/frames
node render.js --range 0:1800 --workers ${1:-4} --out out/frames
python3 tools/mix.py
$FF -y -framerate 30 -i out/frames/%05d.jpg -i audio/master.wav \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high -tune animation \
  -c:a aac -b:a 256k -movflags +faststart -shortest out/packet_from_home.mp4
ls -la out/packet_from_home.mp4
