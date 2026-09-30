"""Client: after 'טורקיות' / 'קוריאניות' / 'אנימה' the genre moment felt like a pause. Splice the tail out of those three holds
(the genre voice + sting stay, the dead tail goes) with equal-power crossfades. Holds become tur 1.0 s, kor 1.0 s, ani 1.2 s.
Must match timeline.js (HOLDS d values)."""
import numpy as np, soundfile as sf
SR = 48000
CUTS = [(15.465, 16.065), (17.94, 18.54), (19.95, 20.35)]   # original master_v7 time
XF = 0.06
x, sr = sf.read('master_v7.wav', always_2d=True); assert sr == SR
out = x[:0]; pos = 0.0
n = int(XF * SR); fo = np.cos(np.linspace(0, np.pi / 2, n))[:, None]; fi = np.sin(np.linspace(0, np.pi / 2, n))[:, None]
segs = []; a = 0.0
for c0, c1 in CUTS: segs.append((a, c0)); a = c1
segs.append((a, len(x) / SR))
y = x[int(segs[0][0] * SR):int(segs[0][1] * SR)]
for s0, s1 in segs[1:]:
    nxt = x[int(s0 * SR) - n:int(s1 * SR)]   # start XF early so the crossfade eats into the cut, not the timeline
    tail = x[int(0):0]
    y = np.concatenate([y[:-n], y[-n:] * fo + nxt[:n] * fi, nxt[n:]])
sf.write('master_v7t.wav', y.astype(np.float32), SR, subtype='PCM_24')
print(len(y) / SR)
