# host/sticker.py: turns src/fNNNN.jpg + mask_rgba/fNNNN.png into die-cut sticker frames sticker/fNNNN.png
# (original RGB inside a closed/hole-filled/dilated silhouette + thick white outline + soft candy shadow, padded, 0.65 scale)
import sys, glob, os, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from skimage.morphology import disk
S = .65; PADX, PADT, PADB = 44, 44, 90
def dil(m, r): return ndi.binary_dilation(m, structure=disk(r)) if r > 0 else m
def clo(m, r):
    p = np.pad(m, r + 2); return ndi.binary_closing(p, structure=disk(r))[r + 2:-r - 2, r + 2:-r - 2]
def proc(f):
    n = os.path.basename(f)[1:5]; out = f'sticker/f{n}.png'
    if os.path.exists(out): return True
    try: mk = Image.open(f'mask_rgba/f{n}.png').convert('RGBA'); mk.load()
    except Exception: return False
    src = Image.open(f'src/f{n}.jpg').convert('RGB')
    w, h = int(720 * S), int(1280 * S); src = src.resize((w, h), Image.LANCZOS); a = np.array(mk.resize((w, h), Image.LANCZOS))[..., 3] > 100
    lab, k = ndi.label(a); 
    if k:
        sz = ndi.sum(a, lab, range(1, k + 1)); keep = [i + 1 for i, s in enumerate(sz) if s > 350]; a = np.isin(lab, keep)
    a[:int(240 * S)] &= True
    # extend below the frame bottom so the sticker continues off-screen
    rgb = np.array(src); rgb = np.pad(rgb, ((PADT, PADB), (PADX, PADX), (0, 0)), mode='edge'); a = np.pad(a, ((PADT, 0), (PADX, PADX)))
    a = np.concatenate([a, np.repeat(a[-1:], PADB, 0)], 0)
    a = clo(a, 38); a = ndi.binary_fill_holes(a); a = dil(a, 5)
    # smooth the silhouette
    af = ndi.gaussian_filter(a.astype(np.float32), 5.0) > .5; a = af
    lab, k = ndi.label(a)
    if k > 1: sz = ndi.sum(a, lab, range(1, k + 1)); a = lab == (1 + int(np.argmax(sz)))
    ol = dil(a, 17); ol = ndi.gaussian_filter(ol.astype(np.float32), 1.6)
    al = ndi.gaussian_filter(a.astype(np.float32), 1.1)
    H_, W_ = a.shape; canvas = np.zeros((H_, W_, 4), np.float32)
    sh = ndi.gaussian_filter(np.roll(np.roll(dil(a, 17).astype(np.float32), 14, 0), 7, 1), 9) * .55
    col_sh = np.array([70, 20, 150], np.float32)
    canvas[..., :3] = col_sh; canvas[..., 3] = sh
    def over(top_rgb, top_a):
        ta = top_a[..., None]; oa = canvas[..., 3:4]; na = ta + oa * (1 - ta)
        canvas[..., :3] = (top_rgb * ta + canvas[..., :3] * oa * (1 - ta)) / np.maximum(na, 1e-5); canvas[..., 3:4] = na
    over(np.full((H_, W_, 3), 255, np.float32), ol); over(rgb.astype(np.float32), al)
    canvas[..., 3] *= 255; Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), 'RGBA').save(out, optimize=False)
    return True
if __name__ == '__main__':
    fs = sorted(glob.glob('src/f*.jpg')); sel = [f for f in fs if (len(sys.argv) < 2 or os.path.basename(f)[1:5] in sys.argv[1:])]
    d = sum(proc(f) for f in sel); print('done', d, '/', len(sel))
