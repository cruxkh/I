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

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(1, '/home/user/I/promo/audio/tools')
ROOT = os.path.normpath(os.path.join(HERE, '..'))     # /home/user/I/gotv/audio
PROMO = '/home/user/I/promo/audio'
SR = 48000; DUR = 39.5; NS = int(round(DUR * SR))
SIL0, SIL1, IMPACT = 25.50, 25.61, 25.61
TARGET_LUFS = -14.0; TP_CEIL = -1.2

# ---- tunables (dB)
VO_TRIM = 0.0          # VO is the anchor
MUSIC_GAIN = -12.0      # music bed level before ducking (relative to file)
DUCK_DB = -7.0         # music duck while narrator speaks (mids); lows duck less
SFX_GAIN = -6.0
SFX_DUCK = -4.0        # SFX dip under narration (excluding big hits)
MAX_LOUD_OVERLAP = 4
MAXLEN = {'impact_boom': 6.0, 'crowd_roar': 2.4, 'goal_horn': 1.2, 'stadium_crowd_swell': 2.6, 'button_ripple_chime': 2.0, 'goal_crowd_roar': 3.2}
def maxlen(nm): return MAXLEN.get(nm, 3.6)
BOOST = {('impact_boom', 25.61): 5.0, ('glass_shatter', 25.61): 2.0}   # the hero moment stays huge

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
    vo = fitn(load(os.path.join(PROMO, 'vo.wav')), NS)
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
    ex = np.maximum.reduce([win(SIL0, IMPACT + 0.22, 1.0, .08), win(36.2, DUR, .70, .12)])
    return d * (1 - ex), act

# ---------------------------------------------------------------- SFX
def load_cues():
    cues = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'cues', '*.json'))):
        sc = os.path.basename(f)[:-5]
        for c in json.load(open(f)): c['scene'] = sc; cues.append(c)
    cues.sort(key=lambda c: c['t'])
    return cues

def build_sfx(cues, vo_dry, vo_act):
    hits = json.load(open(os.path.join(PROMO, 'sfx', 'hits.json')))
    if os.path.exists(os.path.join(ROOT, 'sfx', 'hits.json')): hits.update(json.load(open(os.path.join(ROOT, 'sfx', 'hits.json'))))
    cache = {}
    items = []
    for c in cues:
        nm = c['sound']
        if c['gain_db'] <= -90: c['skip'] = 'mute cue'; continue
        p = os.path.join(ROOT, 'sfx', nm + '.wav')
        if not os.path.exists(p): p = os.path.join(PROMO, 'sfx', nm + '.wav')
        if not os.path.exists(p): c['skip'] = 'missing wav'; continue
        if nm not in cache: cache[nm] = load(p)
        x = cache[nm]; h = hits.get(nm, 0.0)
        x = x[:, :int((h + maxlen(nm)) * SR)]
        # loudness estimate for overlap limiter: rms of 0.6 s after the hit, plus cue gain
        a = int(max(h - .02, 0) * SR); seg = x[:, a:a + int(.6 * SR)]
        rms = 10 * np.log10(np.mean(seg ** 2) + 1e-12)
        c['loud'] = c['gain_db'] + rms
        c['start'] = c['t'] - h; c['len'] = x.shape[1] / SR; c['h'] = h
        items.append(c)
    # ---- overlap limiter: effective audible span (until -25 dB) and loudness; >4 louder concurrent cues -> -2 dB each extra
    for c in items:
        x = cache[c['sound']]; e = np.sqrt(uniform_filter1d(np.mean(x ** 2, axis=0), 480))
        idx = np.nonzero(e > e.max() * db(-25))[0]
        c['span'] = float(np.clip(idx[-1] / SR - c['h'], 0.08, 1.5)) if len(idx) else 0.1
        c['red'] = 0.0
    LOUD_FLOOR = -30.0
    for c in items:
        worst = 0
        for tt in np.arange(c['t'] - .03, c['t'] + c['span'], 0.04):
            louder = sum(1 for o in items if o is not c and o['loud'] > LOUD_FLOOR and o['t'] - .03 <= tt <= o['t'] + o['span']
                         and (o['loud'] > c['loud'] or (o['loud'] == c['loud'] and id(o) < id(c))))
            worst = max(worst, louder)
        if worst >= MAX_LOUD_OVERLAP:
            c['red'] = max(-8.0, -2.0 * (worst - MAX_LOUD_OVERLAP + 1))
    # ---- VO-aware limiter: during narration no non-hero cue may exceed (VO band level - 3 dB) in the 300-4k intelligibility band
    vob = sosfilt(sos('bandpass', [300, 4000], 4), vo_dry[0])
    for c in items:
        c['vo_red'] = 0.0
        if (c['sound'], round(c['t'], 2)) in BOOST: continue
        i = int(c['t'] * SR); w = int(min(c['span'], 1.0) * SR) + 480
        v = np.sqrt(np.mean(vob[i:i + w] ** 2)) if i < NS else 0
        if v < 10 ** (-52 / 20): continue                          # narrator silent here
        xb = sosfilt(sos('bandpass', [300, 4000], 4), cache[c['sound']][0])
        a = int(max(c['h'] - .01, 0) * SR); sx = np.sqrt(np.mean(xb[a:a + w] ** 2)) * db(c['gain_db'] + c['red'] + SFX_GAIN + SFX_DUCK)
        over = 20 * np.log10(sx / v + 1e-9) + 3.0
        if over > 0: c['vo_red'] = -min(8.0, over)
    bus = np.zeros((2, NS))
    for c in items:
        x = cache[c['sound']][:, :int((c['h'] + maxlen(c['sound'])) * SR)]
        L = x.shape[1]
        # soft fade tail
        fo = min(int(.4 * SR), L // 3); x = x.copy(); x[:, L - fo:] *= np.cos(np.linspace(0, np.pi / 2, fo)) ** 2
        p = float(np.clip(c['pan'], -1, 1))
        a = (p + 1) * np.pi / 4
        g = np.array([np.cos(a), np.sin(a)]) * np.sqrt(2)          # unity at centre
        if np.abs(x[0] - x[1]).max() > 1e-4 * np.abs(x).max():      # true stereo file: balance
            g = np.array([min(1, 1 - p), min(1, 1 + p)])
        gain = db(c['gain_db'] + c['red'] + c['vo_red'] + SFX_GAIN + BOOST.get((c['sound'], round(c['t'], 2)), 0.0))
        i = int(round(c['start'] * SR))
        s0 = max(0, -i); i0 = max(0, i)
        e = min(L, NS - i0 + s0)
        if e <= s0: continue
        bus[:, i0:i0 + (e - s0)] += x[:, s0:e] * g[:, None] * gain
    return bus, items

# ---------------------------------------------------------------- master
def true_peak_db(x):
    y = resample_poly(x, 4, 1, axis=-1); return 20 * np.log10(np.abs(y).max() + 1e-12)

def limiter(x, ceil_db=TP_CEIL, look_ms=2.0, rel_ms=80):
    """lookahead limiter, peak detection on a 4x oversampled signal (true-peak safe), block-rate release follower"""
    from scipy.ndimage import maximum_filter1d
    pk = np.abs(resample_poly(x, 4, 1, axis=-1)).max(axis=0).reshape(-1, 4).max(axis=1)
    need = np.maximum(0.0, np.log(pk / db(ceil_db) + 1e-12))        # nepers of reduction required per sample
    B = 12; nb = int(np.ceil(len(need) / B))
    rp = np.pad(need, (0, nb * B - len(need))).reshape(nb, B).max(axis=1)
    la = max(1, int(look_ms / 1000 * SR / B))
    rp = maximum_filter1d(rp, 2 * la + 1)                            # start reducing before the peak
    cr = np.exp(-B / (SR * rel_ms / 1000)); env = np.empty_like(rp); s = 0.0
    for i, v in enumerate(rp):
        s = v if v >= s else s * cr
        env[i] = s
    env = uniform_filter1d(env, la + 1, mode='nearest')
    env = np.maximum(env, 0)
    g = np.exp(-np.repeat(env, B)[:x.shape[-1]])
    y = x * g[None, :]
    tp = true_peak_db(y)
    if tp > ceil_db + 0.02: y = y * db(ceil_db - tp)
    return y

def lufs(x):
    return pyln.Meter(SR).integrated_loudness(x.T)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--no-sfx-build', action='store_true'); ap.add_argument('--out', default=os.path.join(ROOT, 'master.wav'))
    args = ap.parse_args()
    if not args.no_sfx_build:
        import gotv_sfx
        sys.argv = [sys.argv[0]]; gotv_sfx.main()
    vo_dry, vo_wet = build_vo()
    duck, act = duck_curve(vo_dry)
    music, msrc = build_music(duck)
    cues = load_cues()
    sfx, items = build_sfx(cues, vo_dry, act)
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
    fin = np.ones(NS); f0 = 39.20; sel = t >= f0
    fin[sel] = np.cos(np.linspace(0, np.pi / 2, sel.sum())) ** 2; fin[-1] = 0.0
    y = y * fin[None, :]
    y = y * M[None, :]
    y = fitn(y, NS)
    out = args.out
    sf.write(out, y.T, SR, subtype='PCM_24')
    print(f'music source: {msrc}   pre-limiter gain {gain:+.2f} dB   glue GR max {gr.max():.1f} dB')
    # dump stems for verification
    np.savez_compressed(os.path.join(os.path.dirname(out), '_mix_stems_v2.npz'),
                        vo=(vo_dry + vo_wet).astype(np.float32), music=music.astype(np.float32), sfx=sfx.astype(np.float32), act=act, duck=duck)
    json.dump([{k: (v if not isinstance(v, np.floating) else float(v)) for k, v in c.items()} for c in cues], open(os.path.join(os.path.dirname(out), '_mix_cues_v2.json'), 'w'), indent=0, default=float)
    return y

if __name__ == '__main__':
    main()
