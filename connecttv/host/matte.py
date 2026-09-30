import sys, glob, os, numpy as np
from PIL import Image
from rembg import new_session, remove
part,parts=int(sys.argv[1]),int(sys.argv[2])
sess=new_session('u2net_human_seg')
fs=sorted(glob.glob('src/f*.jpg'))[part::parts]
for f in fs:
    out='mask_rgba/'+os.path.basename(f).replace('.jpg','.png')
    if os.path.exists(out): continue
    im=Image.open(f).convert('RGB'); r=remove(im,session=sess,only_mask=False,post_process_mask=True)
    r.save(out)
print('done',part)
