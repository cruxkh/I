import os, numpy as np
from PIL import Image
os.makedirs('mask_rgba',exist_ok=True)
for f in sorted(os.listdir('mask')):
    o='mask_rgba/'+f
    if os.path.exists(o): continue
    try: m=np.array(Image.open('mask/'+f).convert('L'))
    except Exception: continue
    a=np.zeros(m.shape+(4,),np.uint8); a[...,:3]=255; a[...,3]=m
    Image.fromarray(a).save(o)
