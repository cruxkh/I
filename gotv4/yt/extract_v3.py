import json,subprocess
need=json.load(open('need_frames_v3.json'))
runs=[];s=p=need[0]
for i in need[1:]:
    if i!=p+1: runs.append((s,p)); s=i
    p=i
runs.append((s,p))
FF='/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
V='/root/.claude/uploads/f7a6b85c-eec4-5092-86d8-a8833e1e74b9/d9090503-7262665-uhd_2160_3840_25fps.mp4'
for a,b in runs:
    subprocess.run([FF,'-y','-loglevel','error','-i',V,'-vf',f"select='between(n\\,{a}\\,{b})',scale=1620:2880",'-vsync','0','-start_number',str(a),'-q:v','3','src/f%04d.jpg'],check=True)
print('extracted',len(need),'frames in',len(runs),'runs')
