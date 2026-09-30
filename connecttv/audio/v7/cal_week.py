"""Calendar 'the week plays a melody' (v 16.72-18.26): each torn day page = one note of a rising phrase in the score's key,
played on real samples: harp + violin-section spiccato doubling (+ upright piano on the last day), then a harp glissando sparkle.
Replaces the old UI click + notification ding (client: "metallic, not professional")."""
import os, re, glob
import numpy as np
from sampler import Sampler, SR
VS = os.path.join(os.path.dirname(__file__), 'samples', 'vsco')

def _s(sub, parse, **kw):
    return Sampler(sorted(glob.glob(os.path.join(VS, sub, '*.wav'))), parse, **kw)

def build(ding):
    harp = _s('Strings/Harp', lambda n: (re.search(r'_([A-G]#?\d)_', n).group(1), 1, 1), release=0.9)
    def sp(n):
        m = re.search(r'_([A-G]#?\d)_v(\d)_rr(\d)', n); return (m.group(1), int(m.group(2)), int(m.group(3))) if m else None
    pizz = _s('Strings/Violin Section/Spic', sp, offset=0, release=0.25)
    def pp(n):
        m = re.search(r'([A-G]#?\d)', n); return (m.group(1), 1, 1) if m else None
    piano = _s('Keys/Upright Nr1', pp, release=0.8)
    notes = [int(x) for x in ding]
    N = int(2.4 * SR)
    H, P, K = [], [], []
    for k, m in enumerate(notes):
        t = 0.24 * k
        H.append((t, 0.55, m, 70 + 6 * k, {}))
        H.append((t + 0.004, 0.5, m - 12, 50 + 4 * k, {}))
        P.append((t + 0.002, 0.12, m, 60 + 5 * k, {}))
    last = 0.24 * (len(notes) - 1)
    K.append((last, 1.2, notes[-1], 78, {})); K.append((last, 1.2, notes[-1] - 12, 70, {})); K.append((last, 1.2, notes[-1] - 5, 64, {}))
    for i, m in enumerate([notes[-1] + d for d in (2, 4, 7, 9, 12, 14, 16, 19)]):   # sparkle gliss after Saturday
        H.append((last + 0.12 + i * 0.035, 0.6, m, 62 - i * 2, {}))
    x = 0.8 * harp.render(H, N) + 0.35 * pizz.render(P, N) + 0.45 * piano.render(K, N)
    # small warm room (short exponential-decay stereo reverb tail)
    rng = np.random.default_rng(5); L = int(0.9 * SR); env = np.exp(-np.arange(L) / (0.22 * SR))
    ir = np.stack([rng.standard_normal(L) * env, rng.standard_normal(L) * env], 1) * 0.012
    from scipy.signal import fftconvolve
    wet = np.stack([fftconvolve(x[:, 0], ir[:, 0])[:N], fftconvolve(x[:, 1], ir[:, 1])[:N]], 1)
    y = x + wet
    y = y / (np.abs(y).max() + 1e-9) * 0.89
    return y.T
