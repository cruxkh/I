set -e
cd /home/user/I/promo
F=/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
$F -y -loglevel error -framerate 30 -i out/ytframes/%05d.jpg -i audio/master_yt.wav -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -tune animation -c:a aac -b:a 256k -movflags +faststart -shortest out/promo_youtuber_full.mp4
VB=$(python3 -c "print(int(28.5*8192/37)-170)")
$F -y -loglevel error -framerate 30 -i out/ytframes/%05d.jpg -c:v libx264 -preset slow -tune animation -b:v ${VB}k -pass 1 -passlogfile out/pp -pix_fmt yuv420p -an -f mp4 /dev/null
$F -y -loglevel error -framerate 30 -i out/ytframes/%05d.jpg -i audio/master_yt.wav -c:v libx264 -preset slow -tune animation -b:v ${VB}k -pass 2 -passlogfile out/pp -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest out/promo_youtuber_mobile.mp4
cp audio/master_yt.wav out/promo_voice_music_mix.wav
ls -la out/promo_youtuber*.mp4 out/promo_voice_music_mix.wav
