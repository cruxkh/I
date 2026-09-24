"""Final mix: dialogue (with per-location treatment) + SFX cues + score -> audio/master.wav (60 s, 48k stereo).

Dialogue fx: room | pa | tv | data | under | small  (see audio/script.json)
Music is sidechain-ducked under dialogue. Master: glue compression, look-ahead limiter, -15 LUFS.
"""
import json, glob, os
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
DUR = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'audio/script.json'))).get('duration', 60.0)
N = int(SR * DUR)
rng = np.random.default_rng(7)


def db(x): return 10 ** (x / 20)
def bp(x, lo=None, hi=None, order=4):
    if lo: x = sosfilt(butter(order, lo, 'hp', fs=SR, output='sos'), x, axis=0)
    if hi: x = sosfilt(butter(order, hi, 'lp', fs=SR, output='sos'), x, axis=0)
    return x
def load(p):
    x, sr = sf.read(p, always_2d=True)
    if sr != SR:
        from scipy.signal import resample_poly
        x = resample_poly(x, SR, sr, axis=0)
    if x.shape[1] == 1: x = np.repeat(x, 2, 1)
    return x[:, :2]
def ir(decay, pre=0.01, lo=200, hi=6000, width=1.0, seed=0):
    r = np.random.default_rng(seed); n = int(SR * decay * 1.5); t = np.arange(n) / SR
    env = np.exp(-6.9 * t / decay) * (t > pre)
    L = r.standard_normal(n) * env; R = (width * r.standard_normal(n) + (1 - width) * L / (np.abs(L).max() + 1e-9)) * env
    h = bp(np.stack([L, R], 1), lo, hi, 2); return h / np.sqrt((h ** 2).sum() / 2)
def verb(x, h, wet):
    y = np.stack([fftconvolve(x[:, c], h[:, c])[:len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 0.35
def pan(x, p):  # constant power, x stereo
    a = (p + 1) * np.pi / 4; return np.stack([x[:, 0] * np.cos(a) * 1.414, x[:, 1] * np.sin(a) * 1.414], 1)
def place(bus, x, t, g=1.0):
    i = int(round(t * SR)); j0 = max(0, -i); i = max(0, i); n = min(len(x) - j0, N - i)
    if n > 0: bus[i:i + n] += x[j0:j0 + n] * g

IR = {'room': ir(0.45, lo=250, hi=7000, seed=1), 'pa': ir(2.4, 0.03, 300, 5000, seed=2), 'data': ir(1.2, lo=400, hi=9000, seed=3),
      'under': ir(1.8, lo=100, hi=2500, seed=4), 'tv': ir(0.35, lo=300, hi=5000, seed=5)}

def treat(x, fx):
    if fx == 'room':  return verb(bp(x, 90, 14000), IR['room'], 0.22)
    if fx == 'small': return verb(bp(x, 150, 12000), IR['room'], 0.12)
    if fx == 'pa':
        y = bp(x, 400, 4200); y = np.tanh(y * 2.2) / 1.6
        slap = np.zeros_like(y); d = int(0.19 * SR); slap[d:] = y[:-d] * 0.35
        return verb(y + slap, IR['pa'], 0.55)
    if fx == 'tv':    y = bp(x, 350, 5500); return verb(np.tanh(y * 1.8) / 1.4, IR['tv'], 0.25)
    if fx == 'data':
        t = np.arange(len(x)) / SR; d = (0.004 + 0.002 * np.sin(2 * np.pi * 0.7 * t)) * SR
        idx = np.clip(np.arange(len(x)) - d, 0, len(x) - 1).astype(int)
        y = bp(x, 110, 15000); y = y * 0.8 + y[idx] * 0.35
        return verb(y, IR['data'], 0.28)
    if fx == 'under': return verb(bp(x, 120, 9000), IR['under'], 0.3)
    return x

tl = json.load(open(f"{ROOT}/audio/timeline.json"))["lines"]
dia = np.zeros((N, 2)); side = np.zeros(N)
GAIN = {'SABA': -1.0, 'NOA': -1.5, 'BIT': -1.0, 'CATPACKET': 0.0, 'ANNOUNCER': -3.0}
PAN = {'SABA': -0.12, 'NOA': 0.15}
for L in tl:
    x = load(f"{ROOT}/audio/dialogue/{L['id']}.wav")
    y = treat(x, L['fx']) * db(GAIN.get(L['who'], 0))
    if L['who'] in PAN: y = pan(y, PAN[L['who']])
    tail = np.zeros((int(SR * 1.5), 2)); y = np.concatenate([y, tail])  # (tail already in verb length-limited; fine)
    place(dia, y, L['t'])
    i = int(L['t'] * SR); side[i:i + len(x)] = 1

sfx = np.zeros((N, 2)); missing = set()
# scene cue files authored in a scene's own (shifted) time base, see A.SHIFT in index.html
CUE_SHIFT = {'s5_ocean': 12.9, 's6_lastmile': 12.9}
for cf in sorted(glob.glob(f"{ROOT}/audio/cues/*.json")):
    sh = CUE_SHIFT.get(os.path.basename(cf)[:-5], 0.0)
    for c in json.load(open(cf)):
        c = {**c, 't': c['t'] + sh}
        p = f"{ROOT}/audio/sfx/{c['sfx']}.wav"
        if not os.path.exists(p): missing.add(c['sfx']); continue
        x = load(p)
        if 'dur' in c: x = x[:int(c['dur'] * SR)]
        if c.get('fade_out'):
            k = min(len(x), int(c['fade_out'] * SR)); x[-k:] *= np.linspace(1, 0, k)[:, None]
        place(sfx, pan(x, c.get('pan', 0)) if c.get('pan') else x, c['t'], db(c.get('gain_db', 0)))
if missing: print("MISSING sfx:", sorted(missing))

mus = np.zeros((N, 2))
if os.path.exists(f"{ROOT}/audio/music/score.wav"):
    m = load(f"{ROOT}/audio/music/score.wav"); mus[:min(N, len(m))] = m[:N]
# sidechain duck: smooth envelope (attack 80ms, release 350ms), -6 dB music, -3 dB sfx beds under dialogue
env = np.zeros(N); a, r = np.exp(-1 / (0.08 * SR)), np.exp(-1 / (0.35 * SR)); e = 0.0
side_s = np.convolve(side, np.ones(4800) / 4800, 'same')
for i in range(0, N, 48):  # control rate 1 kHz
    v = side_s[i]; e = a * e + (1 - a) * v if v > e else r * e + (1 - r) * v; env[i:i + 48] = e
duck_m, duck_s = db(-4.5 * env)[:, None], db(-3 * env)[:, None]

MUS_DB, SFX_DB, DIA_DB = float(os.environ.get('MUS_DB', -3)), float(os.environ.get('SFX_DB', -2)), 0.0
mix = dia * db(DIA_DB) + sfx * db(SFX_DB) * duck_s + mus * db(MUS_DB) * duck_m
mix = bp(mix, 25, None, 2)

# glue compressor (RMS, 2:1 above -18 dBFS)
rms = np.sqrt(np.convolve((mix ** 2).mean(1), np.ones(2400) / 2400, 'same') + 1e-12)
lvl = 20 * np.log10(rms); gr = np.minimum(0, (-18 - lvl) * 0.5); mix *= db(gr)[:, None]

import pyloudnorm as pyln
meter = pyln.Meter(SR); lufs = meter.integrated_loudness(mix); mix *= db(-15 - lufs)
# look-ahead limiter to -1.0 dBFS
ceil = db(-1.0); pk = np.abs(mix).max(1); la = 240
need = np.maximum(pk / ceil, 1.0)
from scipy.ndimage import maximum_filter1d, uniform_filter1d
g = 1 / maximum_filter1d(need, size=2 * la + 1)
g = np.minimum(g, uniform_filter1d(g, la))
mix *= g[:, None]; mix = np.clip(mix, -ceil, ceil)
print(f"integrated {meter.integrated_loudness(mix):.1f} LUFS, peak {20*np.log10(np.abs(mix).max()):.2f} dBFS")
sf.write(f"{ROOT}/audio/master.wav", mix.astype(np.float32), SR, subtype='PCM_24')
