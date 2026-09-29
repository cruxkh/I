import sys, json, os
import numpy as np
from PIL import Image
from rembg import remove, new_session
need=json.load(open('need_frames.json')); k,n=int(sys.argv[1]),int(sys.argv[2])
s=new_session('u2net_human_seg')
for i in need[k::n]:
    out=f'mask/f{i:04d}.png'
    if os.path.exists(out): continue
    im=Image.open(f'src/f{i:04d}.jpg').convert('RGB').resize((540,960),Image.LANCZOS)
    m=remove(im,session=s,only_mask=True); m.save(out)
