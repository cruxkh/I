set -e
cd /home/user/I/gotv
F=/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
$F -y -loglevel error -framerate 30 -i out/frames/%05d.jpg -i audio/master.wav -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -tune animation -c:a aac -b:a 256k -movflags +faststart -shortest out/gotv_full.mp4
VB=$(python3 -c "print(int(28.5*8192/39.5)-170)")
$F -y -loglevel error -framerate 30 -i out/frames/%05d.jpg -c:v libx264 -preset slow -tune animation -b:v ${VB}k -pass 1 -passlogfile out/gp -pix_fmt yuv420p -an -f mp4 /dev/null
$F -y -loglevel error -framerate 30 -i out/frames/%05d.jpg -i audio/master.wav -c:v libx264 -preset slow -tune animation -b:v ${VB}k -pass 2 -passlogfile out/gp -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest out/gotv_mobile.mp4
cp audio/master.wav out/gotv_audio.wav
ls -la out/gotv_full.mp4 out/gotv_mobile.mp4 out/gotv_audio.wav
