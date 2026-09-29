"""Client v2 of the add-on after the bear's "GO TV!": no radio effect. The client's line "וכל זה ב 350₪ תשלום חד פעמי, פעיל לשנה"
at natural speed as a big excited ANNOUNCEMENT: presence/chest EQ, compression, big-hall reverb, extra hall + deep boom on the price,
over an excited section of the film's own score (score_v7 39.3 to 44.2, whose final cadence hit lands right after "פעיל לשנה").
master_v7t (44.6 s) -> master_v7g (48.3 s). Nothing before T 43.2 changes."""
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve
from voices_v7 import hall_ir
SR = 48000; S = 43.5; TOTAL = 48.3
x, _ = sf.read('master_v7t.wav', always_2d=True)
N = int(TOTAL * SR); t = np.arange(N) / SR
y = np.zeros((N, 2)); y[:len(x)] = x
y *= np.interp(t, [S - 0.3, S + 0.05], [1, 0.12])[:, None]          # the GO TV echo tail hands over to the announcement
# ---- music bed: the film's own chorus -> final cadence (score_v7 time 39.3 .. 44.2)
sc, _ = sf.read('score_v7.wav', always_2d=True)
a0 = 39.3 - 0.3; seg = sc[int(a0 * SR):int(44.2 * SR)]
b0 = int((S - 0.3) * SR); L = min(len(seg), N - b0)
bed = np.zeros((N, 2)); bed[b0:b0 + L] = seg[:L]
bed *= np.interp(t, [S - 0.3, S + 0.05], [0, 1])[:, None]
# ---- voice
v, _ = sf.read('disclaimer_hype.wav')
nar, _ = sf.read('voices/narrator_48k.wav'); nar = nar if nar.ndim == 1 else nar.mean(1)
rms = lambda a: np.sqrt(np.mean(a[np.abs(a) > 1e-3] ** 2))
v = v / rms(v) * rms(nar) * 1.12
vt = np.arange(len(v)) / SR
send = np.interp(vt, [0, 0.55, 0.65, 1.8, 1.95, 99], [.14, .14, .34, .34, .14, .14])   # extra hall on "שלוש מאות וחמישים שקל"
ir = hall_ir(3.2, 6000, 81)
wet = np.vstack([fftconvolve(v * send, ir[0]), fftconvolve(v * send, ir[1])]).T
i = int(S * SR)
Lw = min(len(wet), N - i); y[i:i + Lw] += wet[:Lw] * 0.9
y[i:i + len(v)] += v[:, None]
# duck the bed under the words (keeps the energy between them), then let the final hit ring
env = np.abs(v); k = int(0.06 * SR); env = np.convolve(env, np.ones(k) / k, 'same'); sp = (env > 0.02).astype(float)
sp = np.convolve(sp, np.ones(int(0.12 * SR)) / int(0.12 * SR), 'same')
duck = np.ones(N); duck[i:i + len(v)] = 1 - 0.6 * np.clip(sp, 0, 1)
y += bed * (10 ** (-3 / 20)) * duck[:, None]
# deep boom under the price
bb, _ = sf.read('../v6/sfx/boom_big.wav', always_2d=True)
j = int((S + 0.62) * SR); Lb = min(len(bb), N - j); y[j:j + Lb] += bb[:Lb] * 10 ** (-15 / 20)
y[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))[:, None] ** 1.5
lim = 10 ** (-1.3 / 20); s0 = int((S - 0.3) * SR); pk = np.abs(y[s0:]).max()
if pk > lim:   # scale only the new section down smoothly (the film before it keeps its exact level)
    g = np.ones(N); g[s0:] = lim / pk; ramp = int(0.25 * SR); g[s0:s0 + ramp] = np.linspace(1, lim / pk, ramp); y *= g[:, None]
sf.write('master_v7g.wav', y.astype(np.float32), SR, subtype='PCM_24')
m = y.mean(1)
for s0 in [40, 42, S + .3, S + 1.0, S + 2.2, S + 3.4, S + 4.0]:
    q = m[int(s0 * SR):int((s0 + .4) * SR)]; print(round(s0, 2), round(20 * np.log10(np.sqrt((q ** 2).mean()) + 1e-9), 1))
print('dur', len(y) / SR, 'peak', round(20 * np.log10(np.abs(y).max()), 2))
