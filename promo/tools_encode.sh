set -e
cd /home/user/I/promo
FF=/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
$FF -y -loglevel error -framerate 30 -i out/frames/%05d.jpg -i audio/master.wav -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -tune animation -c:a aac -b:a 256k -movflags +faststart -shortest out/promo_full.mp4
D=37; VB=$(python3 -c "print(int(28.5*8192/$D)-170)")
$FF -y -loglevel error -framerate 30 -i out/frames/%05d.jpg -c:v libx264 -preset slow -tune animation -b:v ${VB}k -pass 1 -passlogfile out/p -pix_fmt yuv420p -an -f mp4 /dev/null
$FF -y -loglevel error -framerate 30 -i out/frames/%05d.jpg -i audio/master.wav -c:v libx264 -preset slow -tune animation -b:v ${VB}k -pass 2 -passlogfile out/p -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest out/promo_mobile.mp4
ls -la out/promo*.mp4
