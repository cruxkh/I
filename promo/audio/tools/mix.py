#!/usr/bin/env python3
"""Final mix of the 37 s promo: VO + sidechain-ducked music + cue-placed SFX -> audio/master.wav (48k stereo 24-bit).
   python3 audio/tools/mix.py [--no-sfx-build]
"""
import os, sys, json, glob, argparse
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly, lfilter
from scipy.ndimage import minimum_filter1d, uniform_filter1d
import pyloudnorm as pyln

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
ROOT = os.path.normpath(os.path.join(HERE, '..'))
SR = 48000; DUR = 37.0; NS = int(round(DUR * SR))
SIL0, SIL1, IMPACT = 25.50, 25.61, 25.61
TARGET_LUFS = -14.0; TP_CEIL = -1.2

# ---- tunables (dB)
VO_TRIM = 0.0          # VO is the anchor
MUSIC_GAIN = -5.0      # music bed level before ducking (relative to file)
DUCK_DB = -7.0         # music duck while narrator speaks (mids); lows duck less
SFX_GAIN = 0.0
SFX_DUCK = -2.5        # SFX dip under narration (excluding big hits)
MAX_LOUD_OVERLAP = 4

db = lambda x: 10 ** (x / 20.0)
def sos(kind, f, order=2): return butter(order, f, kind, fs=SR, output='sos')
def hp(x, f, o=2): return sosfilt(sos('highpass', f, o), x, axis=-1)
def lp(x, f, o=2): return sosfilt(sos('lowpass', f, o), x, axis=-1)
def peq(x, f, q, g):
    A = 10 ** (g / 40); w0 = 2 * np.pi * f / SR; al = np.sin(w0) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w0), 1 - al * A]); a = np.array([1 + al / A, -2 * np.cos(w0), 1 - al / A])
    return lfilter(b / a[0], a / a[0], x, axis=-1)
def hshelf(x, f, g):
    A = 10 ** (g / 40); w0 = 2 * np.pi * f / SR; al = np.sin(w0) / 2 * np.sqrt(2)
    c = np.cos(w0); sq = 2 * np.sqrt(A) * al
    b = np.array([A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)])
    a = np.array([(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq])
    return lfilter(b / a[0], a / a[0], x, axis=-1)

# ---- control-rate helpers (1 kHz)
CR = 1000; HOP = SR // CR
def ctl_level_db(x, win_ms=20):
    p = np.mean(x ** 2, axis=0) if x.ndim == 2 else x ** 2
    p = uniform_filter1d(p, int(SR * win_ms / 1000))[::HOP]
    return 10 * np.log10(p + 1e-12)
def smooth_ar(v, att_ms, rel_ms, init=0.0):
    """asymmetric one-pole on control signal; 'attack' when v increases"""
    ca = np.exp(-1 / (CR * att_ms / 1000)); cr = np.exp(-1 / (CR * rel_ms / 1000)); y = np.empty_like(v); s = init
    for i, x in enumerate(v):
        c = ca if x > s else cr
        s = c * s + (1 - c) * x; y[i] = s
    return y
def up(c, n):
    t = np.arange(n) / HOP
    return np.interp(t, np.arange(len(c)), c)
def compress(x, thr, ratio, att, rel, makeup=0.0, knee=4.0, win=15):
    L = ctl_level_db(x, win)
    over = L - thr
    gr = np.where(over <= -knee / 2, 0, np.where(over >= knee / 2, over * (1 - 1 / ratio), (over + knee / 2) ** 2 / (2 * knee) * (1 - 1 / ratio)))
    g = smooth_ar(gr, att, rel)
    return x * db(-up(g, x.shape[-1]) + makeup), g

# ---- reverb (plate-ish IR from sfx lib)
def plate_ir():
    from sfx import make_ir
    return make_ir(rt60=1.5, predelay=0.018, hf=0.5, lf=0.6, er=6, er_span=0.03, bright=7500, seed=42)

def load(p):
    x, sr = sf.read(p, always_2d=True); assert sr == SR, p
    return x.T.copy()
def fitn(x, n):
    if x.shape[-1] >= n: return x[..., :n].copy()
    return np.pad(x, [(0, 0)] * (x.ndim - 1) + [(0, n - x.shape[-1])])

# ---------------------------------------------------------------- VO
def build_vo():
    vo = fitn(load(os.path.join(ROOT, 'vo.wav')), NS)
    dry = hp(vo, 80, 2)
    dry = peq(dry, 250, 1.0, -1.5)                     # mud
    dry, g1 = compress(dry, -24, 2.5, 8, 90, 0.0)       # light leveler
    dry = peq(dry, 3200, 0.9, 2.5)                      # presence
    dry = hshelf(dry, 7500, 1.5)                        # air
    dry = dry * db(VO_TRIM)
    # plate send
    from scipy.signal import fftconvolve
    ir = plate_ir(); send = hp(lp(dry, 6500), 300)
    wet = np.vstack([fftconvolve(send[0], ir[0]), fftconvolve(send[1], ir[1])])[:, :NS] * db(-19)
    return dry, wet

# ---------------------------------------------------------------- music
def build_music(vo_env_duck):
    mp = os.path.join(ROOT, 'music', 'music.wav')
    if os.path.exists(mp):
        m = fitn(load(mp), NS); src = 'music.wav'
    else:
        m = np.zeros((2, NS)); src = 'SILENT PLACEHOLDER'
    m = m * db(MUSIC_GAIN)
    lo = lp(m, 220, 2); rest = m - lo
    d = vo_env_duck  # control-rate 0..1 amount
    dbmid = up(d, NS) * DUCK_DB; dblow = up(d, NS) * (DUCK_DB * 0.45)
    out = lo * db(dblow) + rest * db(dbmid)
    # dip 1.5-4 kHz another 2 dB during speech (clarity)
    mid = hp(lp(rest, 4200), 1500)
    out = out + mid * (db(dbmid - 2.0 * up(d, NS)) - db(dbmid)) if False else out
    return out, src

def duck_curve(vo_dry):
    """0..1 duck amount at 1 kHz from the VO envelope"""
    L = ctl_level_db(vo_dry, 30)
    act = (L > -50).astype(float)
    # hold: bridge gaps < 140 ms
    k = int(0.14 * CR); act = np.convolve(act, np.ones(k), 'same') > 0
    act = act.astype(float)
    d = smooth_ar(act, 35, 380)
    t = np.arange(len(d)) / CR
    # exemptions: full music at the impact, and at the tagline ending
    def win(a, b, depth, ramp=0.15):
        m = np.clip(np.minimum((t - (a - ramp)) / ramp, ((b + ramp) - t) / ramp), 0, 1); return m * depth
    ex = np.maximum.reduce([win(SIL0, IMPACT + 0.22, 1.0, .08), win(36.2, 37.0, .70, .12)])
    return d * (1 - ex), act

# ---------------------------------------------------------------- SFX
def load_cues():
    cues = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'cues', '*.json'))):
        sc = os.path.basename(f)[:-5]
        for c in json.load(open(f)): c['scene'] = sc; cues.append(c)
    cues.sort(key=lambda c: c['t'])
    return cues

def build_sfx(cues, vo_act):
    hits = json.load(open(os.path.join(ROOT, 'sfx', 'hits.json')))
    cache = {}
    items = []
    for c in cues:
        nm = c['sound']
        if c['gain_db'] <= -90: c['skip'] = 'mute cue'; continue
        p = os.path.join(ROOT, 'sfx', nm + '.wav')
        if not os.path.exists(p): c['skip'] = 'missing wav'; continue
        if nm not in cache: cache[nm] = load(p)
        x = cache[nm]; h = hits.get(nm, 0.0)
        maxlen = 3.6 + h if nm not in ('impact_boom',) else 6.0
        x = x[:, :int((h + maxlen) * SR)]
        # loudness estimate for overlap limiter: rms of 0.6 s after the hit, plus cue gain
        a = int(max(h - .02, 0) * SR); seg = x[:, a:a + int(.6 * SR)]
        rms = 10 * np.log10(np.mean(seg ** 2) + 1e-12)
        c['loud'] = c['gain_db'] + rms
        c['start'] = c['t'] - h; c['len'] = x.shape[1] / SR; c['h'] = h
        items.append(c)
    # ---- overlap limiter: rank by loudness among concurrent (active over first 1.2 s after start) cues
    grid = int(DUR * 100) + 1
    for c in items:
        c['red'] = 0.0
    for c in items:
        a0 = c['t'] - .03; a1 = c['t'] + min(1.2, c['len'] - c['h'])
        worst = 0
        for tt in np.arange(a0, a1, 0.05):
            act = [o for o in items if o['t'] - .03 <= tt <= o['t'] + min(1.2, o['len'] - o['h']) and o['loud'] > -40]
            louder = sum(1 for o in act if o is not c and (o['loud'] > c['loud'] or (o['loud'] == c['loud'] and id(o) < id(c))))
            worst = max(worst, louder)
        if worst >= MAX_LOUD_OVERLAP:
            c['red'] = -2.5 * (worst - MAX_LOUD_OVERLAP + 1)
    bus = np.zeros((2, NS))
    for c in items:
        x = cache[c['sound']][:, :int((c['h'] + (3.6 if c['sound'] != 'impact_boom' else 6.0)) * SR)]
        L = x.shape[1]
        # soft fade tail
        fo = min(int(.4 * SR), L // 3); x = x.copy(); x[:, L - fo:] *= np.cos(np.linspace(0, np.pi / 2, fo)) ** 2
        p = float(np.clip(c['pan'], -1, 1))
        a = (p + 1) * np.pi / 4
        g = np.array([np.cos(a), np.sin(a)]) * np.sqrt(2)          # unity at centre
        if np.abs(x[0] - x[1]).max() > 1e-4 * np.abs(x).max():      # true stereo file: balance
            g = np.array([min(1, 1 - p), min(1, 1 + p)])
        gain = db(c['gain_db'] + c['red'] + SFX_GAIN)
        i = int(round(c['start'] * SR))
        s0 = max(0, -i); i0 = max(0, i)
        e = min(L, NS - i0 + s0)
        if e <= s0: continue
        bus[:, i0:i0 + (e - s0)] += x[:, s0:e] * g[:, None] * gain
    return bus, items

# ---------------------------------------------------------------- master
def true_peak_db(x):
    y = resample_poly(x, 4, 1, axis=-1); return 20 * np.log10(np.abs(y).max() + 1e-12)

def tp_limiter(x, ceil_db=TP_CEIL, look_ms=2.5, rel_ms=90):
    """lookahead limiter with 4x-oversampled peak detection (approximate true-peak)"""
    os_ = resample_poly(x, 4, 1, axis=-1)
    pk = np.abs(os_).max(axis=0)
    pk = pk.reshape(-1, 4).max(axis=1)                      # back to SR
    thr = db(ceil_db)
    need = np.minimum(1.0, thr / (pk + 1e-9))
    la = int(look_ms / 1000 * SR)
    g = minimum_filter1d(need, 2 * la + 1, origin=0)
    g = uniform_filter1d(g, la * 2 + 1)                     # smooth attack (symmetric window ~ lookahead)
    g = np.minimum(g, need)                                 # never above required
    # release smoothing: slow recovery
    rel = np.exp(-1 / (SR * rel_ms / 1000))
    out = np.empty_like(g); s = 1.0
    # vectorised: use lfilter on (1-g) with instantaneous attack via running max
    r = 1 - g
    from scipy.signal import lfilter as lf
    # envelope follower with instant attack, exponential release
    y = np.empty_like(r); s = 0.0
    for i0 in range(0, len(r), 1):   # python loop, ~1.8M iterations
        pass
    return None

def limiter(x, ceil_db=TP_CEIL, look_ms=2.0, rel_ms=80):
    os_ = resample_poly(x, 4, 1, axis=-1)
    pk = np.abs(os_).reshape(2, -1, 4).max(axis=(0, 2)) if False else np.abs(os_).max(axis=0).reshape(-1, 4).max(axis=1)
    thr = db(ceil_db)
    red = np.maximum(0.0, 1 - thr / (pk + 1e-12)) if False else np.maximum(0.0, np.log(pk / thr + 1e-12))  # nepers of needed reduction
    # process at 4 kHz control for the release envelope: block max, then follower
    B = 12
    nb = int(np.ceil(len(red) / B)); rp = np.pad(red, (0, nb * B - len(red))).reshape(nb, B).max(axis=1)
    la = max(1, int(look_ms / 1000 * SR / B))
    rp = np.maximum.accumulate(rp[::-1])[::-1] if False else rp
    # lookahead: take max over window [i-?, i+la] so gain starts falling before the peak
    from scipy.ndimage import maximum_filter1d
    rp = maximum_filter1d(rp, 2 * la + 1)
    cr = np.exp(-B / (SR * rel_ms / 1000)); env = np.empty_like(rp); s = 0.0
    for i, v in enumerate(rp):
        s = v if v > s else cr * s + (1 - cr) * v * 0 + (1 - cr) * 0
        s = max(s, v) if v >= s else s * cr
        env[i] = s
    env = uniform_filter1d(env, 2 * la + 1)                 # smooth edges
    env = np.maximum(env, rp * 0)  # safety
    g = np.exp(-np.repeat(env, B)[:len(red)])
    # ensure sample-wise guarantee: final hard safety on the residual
    y = x * g[None, :x.shape[-1]]
    tp = true_peak_db(y)
    if tp > ceil_db + 0.05: y = y * db(ceil_db - tp)
    return y

def lufs(x):
    return pyln.Meter(SR).integrated_loudness(x.T)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--no-sfx-build', action='store_true'); ap.add_argument('--out', default=os.path.join(ROOT, 'master.wav'))
    args = ap.parse_args()
    if not args.no_sfx_build:
        import promo_sfx; promo_sfx.main.__globals__  # ensure module importable
        sys.argv = [sys.argv[0]]; promo_sfx.main()
    vo_dry, vo_wet = build_vo()
    duck, act = duck_curve(vo_dry)
    music, msrc = build_music(duck)
    cues = load_cues()
    sfx, items = build_sfx(cues, act)
    # SFX dips under narration (not for large hits: handled by cue loudness, keep simple broad dip)
    sfx_duck = up(duck, NS) * SFX_DUCK
    sfx = sfx * db(sfx_duck)
    # hard silence mask over music + sfx + vo reverb (pre-master); also applied post
    t = np.arange(NS) / SR
    def mask():
        m = np.ones(NS)
        m[(t >= SIL0) & (t < SIL1)] = 0
        pre = (t >= SIL0 - 0.006) & (t < SIL0)
        m[pre] = np.linspace(1, 0, pre.sum())
        post = (t >= SIL1) & (t < SIL1 + 0.0005); m[post] = np.linspace(0.3, 1, post.sum())
        return m
    M = mask()
    mix = (vo_dry + vo_wet) + music + sfx
    mix *= M[None, :]
    # ---- master bus: glue comp, tone, level, limiter
    mix, gr = compress(mix, -20, 1.8, 30, 220, 0.0, knee=6, win=30)
    mix = hp(mix, 30, 2)
    # calibrate to target LUFS, limiter in the loop
    gain = 0.0
    for it in range(8):
        y = limiter(mix * db(gain))
        y = y * M[None, :]
        cur = lufs(y)
        if abs(cur - TARGET_LUFS) < 0.08: break
        gain += TARGET_LUFS - cur
    # end fade
    fin = np.ones(NS); f0 = 36.70; sel = t >= f0
    fin[sel] = np.cos(np.linspace(0, np.pi / 2, sel.sum())) ** 2; fin[-1] = 0.0
    y = y * fin[None, :]
    y = y * M[None, :]
    y = fitn(y, NS)
    out = args.out
    sf.write(out, y.T, SR, subtype='PCM_24')
    print(f'music source: {msrc}   pre-limiter gain {gain:+.2f} dB   glue GR max {gr.max():.1f} dB')
    # dump stems for verification
    np.savez_compressed(os.path.join(os.path.dirname(out), '_mix_stems.npz'),
                        vo=(vo_dry + vo_wet).astype(np.float32), music=music.astype(np.float32), sfx=sfx.astype(np.float32), act=act, duck=duck)
    json.dump([{k: (v if not isinstance(v, np.floating) else float(v)) for k, v in c.items()} for c in cues], open(os.path.join(os.path.dirname(out), '_mix_cues.json'), 'w'), indent=0, default=float)
    return y

if __name__ == '__main__':
    main()
