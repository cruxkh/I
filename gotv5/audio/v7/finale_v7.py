"""Client add-on after the bear's "GO TV!": the radio-style fast disclaimer "וכל זה ב 350₪ תשלום חד פעמי, פעיל לשנה"
(client's Cartesia file, trimmed, sped up x1.3 with pitch kept, announcer EQ + compression) at T 43.5, on air over a
soft piano/harp bed with a tape fast-forward whoosh in. master_v7t (44.6 s) -> master_v7f (47.1 s). Nothing earlier changes."""
import numpy as np, soundfile as sf, os
from scipy.signal import fftconvolve, resample_poly
import cal_week
from sampler import SR
S = 43.5; TOTAL = 47.1
x, sr = sf.read('master_v7t.wav', always_2d=True); assert sr == SR
N = int(TOTAL * SR); y = np.zeros((N, 2)); y[:len(x)] = x
# the end-card tail steps back 9 dB under the disclaimer (echo tail keeps ringing softly)
t = np.arange(N) / SR; g = np.interp(t, [S - 0.25, S - 0.05], [1, 10 ** (-9 / 20)]); y *= g[:, None]
v, vsr = sf.read('disclaimer_fast.wav'); assert vsr == SR
nar, _ = sf.read('voices/narrator_48k.wav'); nar = nar if nar.ndim == 1 else nar.mean(1)
rms = lambda a: np.sqrt(np.mean(a[np.abs(a) > 1e-3] ** 2))
v = v / rms(v) * rms(nar) * 1.05
i = int(S * SR); y[i:i + len(v)] += v[:, None]
# fast-forward whoosh in (library whip pan, hit 0.32 s)
wp, wsr = sf.read('/home/user/I/anim/audio/sfx/whip_pan.wav', always_2d=True)
if wsr != SR: wp = resample_poly(wp, SR, wsr, axis=0)
j = int((S - 0.32) * SR); L = min(len(wp), N - j); y[j:j + L] += wp[:L] * 10 ** (-14 / 20)
# soft bed: F major harp arpeggio + piano chord, real samples
harp = cal_week._s('Strings/Harp', lambda n: (__import__('re').search(r'_([A-G]#?\d)_', n).group(1), 1, 1), release=1.2)
def pp(n):
    m = __import__('re').search(r'([A-G]#?\d)', n); return (m.group(1), 1, 1) if m else None
piano = cal_week._s('Keys/Upright Nr1', pp, release=1.5)
D = TOTAL - S
H = [(k * 0.18, 0.9, [53, 57, 60, 65, 69, 72, 77, 72, 69, 65, 60, 57][k % 12], 52, {}) for k in range(int((D - 0.4) / 0.18))]
K = [(0.0, D - 0.3, n, 46, {}) for n in (41, 53, 57, 60)] + [(D - 0.55, 0.9, n, 70, {}) for n in (65, 69, 72, 77)]
bed = 0.8 * harp.render(H, int(D * SR)) + 0.6 * piano.render(K, int(D * SR))
bed = bed / (np.abs(bed).max() + 1e-9) * 10 ** (-22 / 20)
fo = np.ones(len(bed)); fo[-int(0.35 * SR):] = np.linspace(1, 0, int(0.35 * SR)); bed *= fo[:, None]
y[i:i + len(bed)] += bed
pk = np.abs(y).max(); lim = 10 ** (-1.3 / 20)
if pk > lim: y *= lim / pk
y[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))[:, None]
sf.write('master_v7f.wav', y.astype(np.float32), SR, subtype='PCM_24'); print('ok', len(y) / SR, 'peak', 20 * np.log10(np.abs(y).max()))
