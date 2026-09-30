#!/usr/bin/env python3
"""GOTV v5 PAPER COLLAGE final mix -> audio/master.wav (40.000 s, 48 kHz stereo 24-bit, ~-14 LUFS, TP < -1 dBTP).
   python3 audio/tools/mix_v5.py [--out path] [--report]
Layers: VO (t=0) / procedural handmade score (GeneralUser GS via tinysoundfont + numpy percussion) / paper-stop-motion SFX bed.
Cues: base table below (word starts from words.js) + every `// CUE <t> <name> [gain_db]` comment found in scenes/*.js
(scene cues override base cues within 50 ms). Names: pop slap stamp slam thump rip tape squeak snip flip shutter cheer ding
click rustle whoosh riser goal sting.  Everything is deterministic (seeded).
"""
import os, re, sys, json, glob, argparse
import numpy as np
import soundfile as sf
from scipy.signal import sosfilt, butter, resample_poly, fftconvolve, lfilter
from scipy.ndimage import uniform_filter1d, minimum_filter1d
import pyloudnorm as pyln

HERE = os.path.dirname(os.path.abspath(__file__)); AUD = os.path.normpath(os.path.join(HERE, '..')); PROJ = os.path.dirname(AUD)
SR = 48000; TOTAL = 40.0; N = int(round(TOTAL * SR))
SF2 = next(p for p in ['/home/user/I/promo/audio/music/sf/GeneralUser-GS.sf2', '/home/user/I/anim/audio/music/sf/GeneralUser-GS.sf2'] if os.path.exists(p))
VO_CANDS = [os.path.join(AUD, 'vo.wav'), '/home/user/I/gotv4/audio/vo.wav', '/home/user/I/gotv/audio/vo.wav']
TARGET_LUFS = -14.0; TP_CEIL = -1.3
IMPACT = 25.64; END_HIT = 36.9; RISER0, RISER1 = 24.0, 25.3; BREATH0, BREATH1 = 25.3, 25.6
B = (END_HIT - IMPACT) / 21.0            # beat = 0.53619 s (111.9 bpm); 25.64 and 36.9 both on the grid
DB = lambda d: 10 ** (d / 20)
def bt(k): return IMPACT + k * B

# ------------------------------------------------------------ dsp helpers
def sos(kind, f, order=2): return butter(order, f, btype=kind, fs=SR, output='sos')
def bp(x, a, b, o=2): return sosfilt(sos('bandpass', [a, min(b, 22000)], o), x, axis=-1)
def hp(x, f, o=2): return sosfilt(sos('highpass', f, o), x, axis=-1)
def lp(x, f, o=2): return sosfilt(sos('lowpass', f, o), x, axis=-1)
def peq(x, f, q, g):
    A = 10 ** (g / 40); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q); c = np.cos(w)
    b = [1 + al * A, -2 * c, 1 - al * A]; a = [1 + al / A, -2 * c, 1 - al / A]
    return lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=-1)
def fit(x, n=N):
    if x.shape[-1] >= n: return x[..., :n]
    return np.pad(x, [(0, 0)] * (x.ndim - 1) + [(0, n - x.shape[-1])])
def add(dst, src, t, g=1.0):
    i = int(round(t * SR)); s0 = max(0, -i); i0 = max(0, i); e = min(src.shape[-1], dst.shape[-1] - i0 + s0)
    if e > s0: dst[:, i0:i0 + e - s0] += src[:, s0:e] * g
def st(x, pan=0.0):
    a = (pan + 1) * np.pi / 4; return np.vstack([x * np.cos(a) * 1.414, x * np.sin(a) * 1.414])
def env_exp(n, tau): return np.exp(-np.arange(n) / SR / tau)
def fade(x, a=0.002, b=0.004):
    x = x.copy(); na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x
def rng(seed): return np.random.default_rng(seed)
def ir(rt60, seed, pre=0.012, bright=6000):
    r = rng(seed); n = int(rt60 * 1.2 * SR); t = np.arange(n) / SR
    L = [lp(r.standard_normal(n) * np.exp(-6.9 * t / rt60), bright, 1) for _ in range(2)]
    L = np.vstack(L); L[:, :int(pre * SR)] = 0; return L / np.sqrt(np.sum(L ** 2, axis=1, keepdims=True)) * 0.9
def reverb(x, rt60=1.2, wet=0.15, seed=3):
    R = ir(rt60, seed); y = np.vstack([fftconvolve(x[0], R[0])[:x.shape[1]], fftconvolve(x[1], R[1])[:x.shape[1]]])
    return x + y * wet

# ------------------------------------------------------------ tuned SFX synth (pitched to the score key; no noise textures)
def mf(m): return 440.0 * 2 ** ((m - 69) / 12)
def pluck(f, d=.4, bright=1.0):
    """warm marimba/FM-bell pluck"""
    n = int(d * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / (.16 * d / .4)) + .30 * bright * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t / .045) + .08 * bright * np.sin(2 * np.pi * 9.9 * f * t) * np.exp(-t / .015)
    y += .25 * np.sin(2 * np.pi * f * .5 * t) * np.exp(-t / .1)
    return fade(lp(y, 9000, 2), .002, .03) * .8
def fmbell(f, d=1.6):
    n = int(d * SR); t = np.arange(n) / SR
    m = 1.8 * np.exp(-t / .25) * np.sin(2 * np.pi * f * 3.5 * t)
    y = np.sin(2 * np.pi * f * t + m) * np.exp(-t / (d * .3)) + .3 * np.sin(2 * np.pi * f * 2 * t + .5 * m) * np.exp(-t / (d * .15))
    return fade(y * .7, .001, .06)
def rev_tail(x, d=.45, wet_rt=.7, seed=4):
    R = ir(wet_rt, seed)[0]; y = fftconvolve(x, R)[:int(d * SR)]; y = y[::-1].copy()
    y *= np.linspace(0, 1, len(y)) ** 1.5; return y / (np.abs(y).max() + 1e-9)
def s_sweep(f_land, d=.45, up=True, tail=True, ring=True):
    """tonal swoosh: band-limited saw glide + sub sine, ends on a soft pluck exactly at t=d (the beat)"""
    n = int(d * SR); u = np.arange(n) / n
    span = 2 ** (1.6 * (1 - u) ** 1.8) if up else 2 ** (-1.4 * (1 - u) ** 1.8)   # ratio to the landing pitch
    fr = f_land * .5 * span; ph = np.cumsum(fr) / SR; fc = 350 + 3800 * (u ** 1.2) if up else 4200 - 3300 * u
    y = np.zeros(n)
    for h in range(1, 14):
        y += np.sin(2 * np.pi * h * ph) / h * np.exp(-(h * fr / fc) ** 2)
    y += .5 * np.sin(2 * np.pi * ph * .5)
    env = (np.sin(np.pi / 2 * u) ** 2 if up else np.sin(np.pi * np.clip(u * 1.0, 0, 1)) ** .8)
    y *= env * .5; y[-int(.012 * SR):] *= np.linspace(1, 0, int(.012 * SR))
    out = np.zeros(n + int(.5 * SR)); out[:n] += y * .7
    p = pluck(f_land * 2, .45); out[n:n + len(p)] += p[:len(out) - n] * .9
    if tail:
        rv = rev_tail(pluck(f_land * 2, .3), min(d, .4)); out[n - len(rv):n] += rv * .35
    return out, d
def s_thwip(f_land):
    """short pitched thwip: 0.2 s upward formant glide + soft pluck"""
    d = .2; n = int(d * SR); u = np.arange(n) / n
    fr = f_land * 2 ** (-1.2 * (1 - u) ** 2); ph = np.cumsum(fr) / SR
    y = sum(np.sin(2 * np.pi * h * ph) / h * np.exp(-(h * fr / (600 + 1800 * u)) ** 2) for h in range(1, 10)) * np.sin(np.pi / 2 * u) ** 2
    y[-int(.008 * SR):] *= np.linspace(1, 0, int(.008 * SR))
    out = np.zeros(n + int(.4 * SR)); out[:n] += y * .55; p = pluck(f_land * 2, .35); out[n:n + len(p)] += p[:len(out) - n] * .8
    return out, d
def s_wood(f=420, d=.09):
    n = int(d * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * (1 + .6 * np.exp(-t / .006)) * t) * np.exp(-t / .018) + .35 * np.sin(2 * np.pi * f * 2.3 * t) * np.exp(-t / .01)
    return fade(y * .7, 0, .01)
def s_thump(big=False, root=48):
    d = 1.3 if big else .5; n = int(d * SR); t = np.arange(n) / SR
    f = mf(root) * .5 + 90 * np.exp(-t / .05)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (.4 if big else .13))
    y = sub * 1.3; y[:int(.09 * SR)] += s_wood(300, .09)[:int(.09 * SR)] * .5
    return fade(y * .8, .001, .03)
def s_impact():
    d = 3.4; n = int(d * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(np.maximum(36, 140 * np.exp(-t / .1))) / SR) * np.exp(-t / .8)
    body = (np.sin(2 * np.pi * 65.4 * t) * .5 + np.sin(2 * np.pi * 98 * t) * .3) * np.exp(-t / .5)
    y = sub * 1.6 + body; y[:int(.1 * SR)] += s_wood(260, .1)[:int(.1 * SR)] * .8
    for i, m in enumerate((60, 67, 72, 76, 84)):
        b = fmbell(mf(m), 2.6); k = len(b); y[:k] += b * (.32 if i < 4 else .16)
    y = np.tanh(y * .8)
    return fade(y, .0005, .08)
def s_tick(f=3200):        # tasteful very short tick (tape rip / snip / click), pitched sine, no hiss
    n = int(.03 * SR); t = np.arange(n) / SR
    return fade(np.sin(2 * np.pi * f * t) * np.exp(-t / .004) * .6 + np.sin(2 * np.pi * f * .5 * t) * np.exp(-t / .008) * .3, 0, .003)
def s_snip(f=2600):
    y = np.zeros(int(.25 * SR))
    for t0, g, ff in ((0, 1, f), (.08, .8, f * 1.26)): k = s_tick(ff); y[int(t0 * SR):int(t0 * SR) + len(k)] += k * g
    return y
def s_click():
    n = int(.05 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 1500 * t) * np.exp(-t / .004) + np.sin(2 * np.pi * 700 * t) * np.exp(-t / .01) * .6
    return fade(y * .7, 0, .004)
def s_shutter():
    y = np.zeros(int(.25 * SR))
    for t0, g in ((0, 1), (.06, .7)): k = s_click(); y[int(t0 * SR):int(t0 * SR) + len(k)] += k * g
    return y
def s_ding():
    y = fmbell(mf(88), 2.4) * .9; b = fmbell(mf(76), 2.0) * .35; y[:len(b)] += b
    return fade(y * .6, .001, .12)
def s_cheer(r, d=2.6, peak=.55, goal=False):
    """band-limited crowd (350-2400 Hz, low level) + tuned bell arpeggio on goal; the crowd is the only noise and is voiced/enveloped"""
    n = int(d * SR); t = np.arange(n) / SR; u = t / d
    a = np.exp(-((u - peak) / .28) ** 2) * (u <= peak) + np.exp(-((u - peak) / .35) ** 2) * (u > peak)
    w = bp(r.standard_normal(n), 350, 2400, 3)
    voices = sum(np.sin(2 * np.pi * np.cumsum(f * (1 + .04 * np.sin(2 * np.pi * (v + 2) * t + v))) / SR) * (.5 + .5 * np.sin(2 * np.pi * (.5 + v * .13) * t + v)) for v, f in enumerate((310, 420, 540, 690, 880, 1010))) * .09
    y = (w * .8 + voices) * a
    y = lp(y, 3000, 2)
    if goal:
        for i, m in enumerate((72, 76, 79, 84, 88)):
            b = pluck(mf(m), .5); k = int((.35 + i * .09) * SR); y[k:k + len(b)] += b[:n - k] * .35
    return fade(y, .05, .3)
def s_riser(d):
    """tension: tonal saw riser (sweeping lowpass) + octave sine + accelerating sub heartbeat, no noise"""
    n = int(d * SR); t = np.arange(n) / SR; u = t / d
    fr = 98 * 2 ** (u * 3.2); ph = np.cumsum(fr) / SR; fc = 300 + 5200 * u ** 1.5
    y = sum(np.sin(2 * np.pi * h * ph) / h * np.exp(-(h * fr / fc) ** 2) for h in range(1, 16)) * .5
    y += .25 * np.sin(2 * np.pi * np.cumsum(fr * 2.0) / SR + 1.0) * u
    y *= u ** 1.5
    hb = np.zeros(n); tk = 0.0; gap = .55
    while tk < d - .05:
        m = int(.15 * SR); i = int(tk * SR); tt = np.arange(m) / SR
        k = np.sin(2 * np.pi * np.cumsum(np.maximum(52, 130 * np.exp(-tt / .03))) / SR) * np.exp(-tt / .07)
        hb[i:i + m] += k[:max(0, min(m, n - i))] * (.4 + .6 * tk / d); tk += gap; gap = max(.13, gap * .82)
    y = y * .9 + hb * .3
    return fade(y, .01, .002)
# drum kit (custom, tight)
def d_kick(r=None):
    n = int(.32 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * np.cumsum(46 + 110 * np.exp(-t / .028)) / SR) * np.exp(-t / .13) + .25 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t / .002)
    return fade(y, .0005, .02)
def d_snare(r):
    n = int(.25 * SR); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * 185 * t) * np.exp(-t / .06) * .7 + np.sin(2 * np.pi * 330 * t) * np.exp(-t / .03) * .3)
    y += bp(r.standard_normal(n), 1800, 7000) * np.exp(-t / .05) * .55
    return fade(lp(y, 11000, 2), 0, .02)
def d_clap(r, big=False):
    n = int(.25 * SR); y = np.zeros(n)
    for i, o in enumerate((0, .011, .023, .036) if not big else (0, .009, .019, .03, .042)):
        m = int(.09 * SR); j = int(o * SR); y[j:j + m] += bp(r.standard_normal(m), 1000, 4200) * env_exp(m, .012 if i < 3 else .045) * (.6 if i < 3 else 1)
    return fade(lp(y, 9000, 1) * .9, 0, .01)
def d_hat(r, op=False):
    d = .16 if op else .04; n = int(d * SR); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 6500, 10500, 2) * np.exp(-t / (.05 if op else .008))
    return fade(y * .5, 0, .005)
def d_shake(r):
    n = int(.1 * SR); t = np.arange(n) / SR
    return fade(bp(r.standard_normal(n), 5500, 9500, 2) * np.minimum(t / .02, 1) * np.exp(-t / .04) * .45, .003, .01)

def snd(nm, r, f):
    if nm == 'pop': return pluck(f, .4), 0
    if nm == 'slap': return s_wood(300, .1) * .9, 0
    if nm in ('stamp', 'thump'): return s_thump(False, 48), 0.0
    if nm == 'slam': return s_thump(True, 48), 0.0
    if nm == 'tick': return s_tick(), 0
    if nm == 'snip': return s_snip(), 0
    if nm == 'flip': return s_sweep(f * .5, .38, False, False)
    if nm == 'shutter': return s_shutter(), 0
    if nm == 'click': return s_click(), 0
    if nm == 'ding': return s_ding(), 0
    if nm == 'cheer': return s_cheer(r, 2.6, .55), 0
    if nm == 'goal': return s_cheer(r, 3.0, .5, True), 0
    if nm == 'whoosh': return s_sweep(f * .5, .5, True, True)
    if nm == 'whoosh_s': return s_thwip(f * .5)
    if nm == 'impact': return s_impact(), 0
    return pluck(f, .4), 0
LEVEL = {'pop': -9, 'slap': -8, 'stamp': -6, 'slam': -7, 'thump': -8, 'tick': -14, 'snip': -13, 'flip': -8, 'shutter': -11, 'click': -12, 'ding': -9,
         'cheer': -10, 'goal': -8, 'whoosh': -9, 'whoosh_s': -10, 'impact': 0}
ALIAS = {'sting': 'ding', 'peel': 'flip', 'wipe': 'whoosh', 'swipe': 'whoosh', 'tear': 'tick', 'rip': 'tick', 'tape': 'tick', 'marker': 'pop', 'scribble': 'pop', 'squeak': 'pop',
         'scissors': 'snip', 'cut': 'snip', 'camera': 'shutter', 'crowd': 'cheer', 'tv': 'ding', 'remote': 'click', 'button': 'click', 'paper': 'pop', 'rustle': 'pop',
         'page': 'flip', 'boom': 'impact', 'hit': 'slap', 'drop': 'slap', 'slide': 'whoosh', 'zoom': 'whoosh_s', 'sticker': 'pop', 'logo': 'pop', 'reveal': 'pop', 'crash': 'impact'}

# ------------------------------------------------------------ cue tables
def base_cues():
    C = []
    def c(t, n, g=0, pan=0.0): C.append((t, n, g, pan))
    for t, n in ((4.77, 'whoosh'), (8.6, 'flip'), (11.6, 'whoosh_s'), (15.4, 'whoosh'), (20.3, 'flip'), (29.75, 'whoosh')): c(t, n)
    for t, n, p in ((0.77, 'pop', -.3), (1.34, 'pop', .3), (1.98, 'slam', 0), (2.46, 'pop', 0), (3.18, 'pop', -.2), (3.58, 'pop', .2), (4.28, 'slap', 0), (4.64, 'shutter', 0)): c(t, n, 0, p)
    for t, n, p in ((4.975, 'slap', -.3), (5.16, 'pop', .3), (5.63, 'pop', -.2), (5.86, 'pop', .2), (6.69, 'slap', -.3), (7.02, 'pop', .3), (7.69, 'slap', .3), (8.2, 'pop', -.3), (8.55, 'pop', .3)): c(t, n, 0, p)
    for t, n, p in ((9.02, 'slap', -.4), (9.26, 'pop', -.2), (9.68, 'pop', .2), (10.2, 'slap', .3), (10.44, 'pop', -.3), (10.66, 'stamp', 0), (11.1, 'pop', .2), (11.3, 'pop', .3)): c(t, n, 0, p)
    for t, n, p in ((12.0, 'slap', 0), (12.39, 'pop', -.4), (13.095, 'pop', .4), (13.99, 'pop', -.3), (14.53, 'pop', .3), (14.8, 'pop', -.2), (15.11, 'snip', .2)): c(t, n, 0, p)
    for t, n, p in ((15.79, 'slap', 0), (16.1, 'pop', .3), (16.72, 'slap', -.3), (17.14, 'pop', .3), (17.61, 'pop', -.2), (17.97, 'pop', .2), (18.17, 'pop', -.3),
                    (18.8, 'slap', 0), (19.39, 'pop', -.3), (19.54, 'pop', .2), (19.77, 'pop', .3), (20.05, 'pop', 0)): c(t, n, 0, p)
    for t, n, p in ((20.68, 'slap', 0), (21.08, 'whoosh_s', -.3), (21.49, 'pop', .3), (22.22, 'whoosh_s', .3), (22.72, 'pop', -.3), (23.14, 'whoosh_s', .3), (24.01, 'click', 0)): c(t, n, 0, p)
    c(26.52, 'stamp', -2); c(27.19, 'slap', 0, -.2); c(27.41, 'pop', 0, .2); c(27.99, 'pop', 0, -.2); c(28.53, 'pop', 0, .2)
    c(27.5, 'cheer', -3); c(28.7, 'goal', -3); c(29.25, 'pop', 0)
    c(30.12, 'slap', 0); c(30.6, 'click', -1); c(31.0, 'ding', 0); c(31.12, 'pop', 0)
    for t, p in ((32.05, -.3), (32.22, .3), (32.53, -.2), (32.86, .3), (33.44, -.3), (33.99, .3), (34.36, -.2), (34.63, .2), (35.21, -.3), (35.63, .3), (36.18, -.2), (36.39, .3)): c(t, 'pop', -2, p)
    c(36.5, 'snip', -4)
    return C
KW = [('slam', 'slam'), ('stamp', 'stamp'), ('goal', 'goal'), ('cheer', 'cheer'), ('crowd', 'cheer'), ('flip', 'flip'), ('peel', 'flip'), ('snip', 'snip'), ('scissor', 'snip'),
      ('rip', 'tick'), ('tear', 'tick'), ('tape', 'tick'), ('shutter', 'shutter'), ('camera', 'shutter'),
      ('ding', 'ding'), ('click', 'click'), ('press', 'click'), ('whoosh', 'whoosh'), ('wipe', 'whoosh'), ('fly', 'whoosh'), ('avalanche', 'whoosh'), ('wave', 'whoosh'),
      ('drop', 'slap'), ('slap', 'slap'), ('thump', 'thump'), ('burst', 'pop'), ('confetti', 'pop'), ('pop', 'pop'), ('flash', 'pop'), ('logo', 'slam')]
def kind_of(txt):
    txt = txt.lower(); hit = [(txt.find(k), v) for k, v in KW if k in txt]
    return min(hit)[1] if hit else 'pop'
def scene_cues():
    out = []
    for f in sorted(glob.glob(os.path.join(PROJ, 'scenes', '*.js'))):
        for ln in open(f, encoding='utf8', errors='ignore'):
            if 'CUE' not in ln: continue
            part = ln[ln.index('CUE'):]
            for m in re.finditer(r'CUE\s+([0-9]+(?:\.[0-9]+)?)\s*([^|]*?)(?=\s*(?:CUE|\||$))', part):
                t = float(m.group(1))
                if t >= TOTAL: continue
                out.append((t, kind_of(m.group(2)), 0.0, 0.0, os.path.basename(f)))
    return out
def merged_cues():
    base = base_cues(); sc = scene_cues(); keep = [b for b in base if not any(abs(b[0] - s[0]) < .05 for s in sc)]
    return sorted(keep + [(t, n, g, p) for t, n, g, p, _ in sc]), len(sc)

# ------------------------------------------------------------ score
_SY = None
def sf_render(notes, prog, bank=0, vol=127):
    global _SY
    import tinysoundfont as tsf
    if _SY is None:
        s = tsf.Synth(samplerate=SR, gain=-4); _SY = (s, s.sfload(SF2))
    s, sfid = _SY; ch = 0
    s.sounds_off(); s.program_select(ch, sfid, bank, prog, False); s.control_change(ch, 7, vol); s.control_change(ch, 11, 127); s.control_change(ch, 10, 64)
    ev = []
    for t, d, n, v in notes:
        if t >= TOTAL or n < 0: continue
        ev.append((int(round(max(t, 0) * SR)), 1, int(n), int(v))); ev.append((int(round(min(t + d, TOTAL + 2) * SR)), 0, int(n), 0))
    ev.sort(key=lambda e: (e[0], e[1]))
    out = np.zeros((N + 3 * SR, 2), np.float32); pos = 0
    for smp, typ, a, b in ev:
        if smp >= N + 2 * SR: break
        if smp > pos: out[pos:smp] = np.frombuffer(s.generate(smp - pos), dtype=np.float32).reshape(-1, 2); pos = smp
        s.noteon(ch, a, b) if typ else s.noteoff(ch, a)
    end = min(N + 3 * SR, pos + 3 * SR); out[pos:end] = np.frombuffer(s.generate(end - pos), dtype=np.float32).reshape(-1, 2)
    return out[:N].T.astype(np.float64)

# ---- famous public-domain themes, arranged as a modern pop-kit mashup
#  A  0.44-8.48 s   Beethoven "Fur Elise" (A minor)      | B 8.48-24.0 s  Beethoven "Ode to Joy" (C major)
#  C  24.0-25.3 s   Grieg "Hall of the Mountain King" (A minor, accelerating) | breath 25.3-25.6
#  D  25.64-36.9 s  Rossini "William Tell" finale gallop (C major) -> fanfare exactly on 36.9 | end card: Ode to Joy last phrase on celesta/glock
TRI = {'Am': [57, 60, 64], 'E': [52, 56, 59], 'C': [55, 60, 64], 'G': [55, 59, 62], 'F': [53, 57, 60], 'Dm': [50, 53, 57], 'Em': [52, 55, 59]}
BR = {'Am': 45, 'E': 40, 'C': 36, 'G': 43, 'F': 41, 'Dm': 38, 'Em': 40}
KA = -47; KB = -32; KB2 = -16; KC = -3.05          # section starts in beats (relative to the 25.64 downbeat)
CYC12 = ['E', 'Am', 'Am', 'Am', 'E', 'Am', 'E', 'Am', 'Am', 'Am', 'E', 'Am']
def harm(k):
    if k < KB: return CYC12[(k - KA) % 12]
    if k < KB2:
        b, p = divmod(k - KB, 4); return ['C', 'G', 'C', 'C' if p < 2 else 'G'][b]
    if k < -4:
        b, p = divmod(k - KB2, 4); return ['C', 'G', 'G' if p < 2 else 'C'][b]
    if k < 0: return 'G' if k < -3 else 'Am'
    if 16 <= k < 18: return 'F'
    if 18 <= k < 21: return 'G'
    if k >= 21: return 'C'
    return ['C', 'G', 'C', 'G'][k // 4]
def sec(t):
    if t < bt(KB): return 'A'
    if t < RISER0: return 'B'
    if t < IMPACT - .001: return 'C'
    return 'D'
def humanize(rr, t, v, j=.005): return t + rr.uniform(-j, j), int(np.clip(v + rr.integers(-6, 7), 20, 127))
def g16(k, s): return bt(k + s / 4 + (0.035 if s % 2 else 0) + (0.02 if s == 2 else 0))

FE = [(0, 76, 1), (1, 75, 1), (2, 76, 1), (3, 75, 1), (4, 76, 1), (5, 71, 1), (6, 74, 1), (7, 72, 1), (8, 69, 3), (11, 60, 1), (12, 64, 1), (13, 69, 1), (14, 71, 3), (17, 64, 1), (18, 68, 1), (19, 71, 1), (20, 72, 3),
      (24, 76, 1), (25, 75, 1), (26, 76, 1), (27, 75, 1), (28, 76, 1), (29, 71, 1), (30, 74, 1), (31, 72, 1), (32, 69, 3), (35, 60, 1), (36, 64, 1), (37, 69, 1), (38, 71, 3), (41, 64, 1), (42, 72, 1), (43, 71, 1), (44, 69, 4)]
ODE1 = [(0, 76, 1), (1, 76, 1), (2, 77, 1), (3, 79, 1), (4, 79, 1), (5, 77, 1), (6, 76, 1), (7, 74, 1), (8, 72, 1), (9, 72, 1), (10, 74, 1), (11, 76, 1), (12, 76, 1.5), (13.5, 74, .5), (14, 74, 2)]
ODE2 = ODE1[:8 + 0] + [(8, 74, 1.5), (9.5, 72, .5), (10, 72, 2)]
ODE2 = [n for n in ODE1 if n[0] < 8] + [(8, 74, 1.5), (9.5, 72, .5), (10, 72, 2)]
MK_T = [57, 59, 60, 62, 64, 60, 64]; MK_A = [63, 59, 63]
TELL = [((79, 79, 84),) * 3 + ((84, 88),), ((74, 74, 79),) * 3 + ((79, 83),), ((79, 79, 88),) * 3 + ((88, 91),), ((74, 74, 83),) * 3 + ((86, 91),)]

def build_score():
    rr = rng(11); tr = {k: [] for k in ('uke', 'kal', 'mar', 'vib', 'xyl', 'glock', 'cel', 'pizz', 'bass', 'sbass', 'pad', 'str', 'hit', 'brass', 'trump', 'timp', 'bsn', 'lowpz', 'gal')}
    dr = {k: [] for k in ('kick', 'snare', 'clap', 'bigclap', 'hat', 'ohat', 'shake', 'wood')}
    def nb(trk, kk, dur, n, v, j=.004):
        tm, vv = humanize(rr, bt(kk), v, j); tr[trk].append((tm, dur * B * .95, n, vv))
    KICKS = {'A': {0, 10}, 'B1': {0, 6, 8, 11}, 'B2': {0, 6, 8, 10, 14}, 'D': {0, 3, 6, 8, 10, 14}}
    k0 = KA; k1 = int(np.ceil((END_HIT - IMPACT) / B))
    for k in range(k0, k1 + 1):
        pb = k % 4; t = bt(k)
        if t >= END_HIT - .02 or t < -.6 or t >= RISER0 and t < IMPACT - .01: continue
        ch = harm(k); tri = TRI[ch]; root = BR[ch]
        for s in range(4):
            tt = g16(k, s)
            if tt < 0 or tt >= END_HIT - .02 or (RISER0 - .05 <= tt < IMPACT - .01): continue
            S = sec(tt); key = 'A' if S == 'A' else ('B1' if (S == 'B' and k < KB2) else ('B2' if S == 'B' else 'D')); p = pb * 4 + s
            if p in KICKS[key]: dr['kick'].append((tt, 108 if p == 0 else 92 if key in ('B2', 'D') else 75))
            if S != 'A' and p in (4, 12): dr['snare'].append((tt, 100)); dr['clap'].append((tt, 80))
            elif S == 'A' and p in (4, 12): dr['clap'].append((tt, 50)); dr['wood'].append((tt, 55))
            if key in ('B2', 'D') and p in (7, 15, 9): dr['snare'].append((tt, 26))
            if key == 'D' and p in (7, 15): dr['snare'].append((tt, 40))
            if (S != 'A' and s in (0, 2)) or (S == 'A' and s == 2): dr['hat'].append((tt, 60 if s == 0 else 44))
            if key in ('B2', 'D') and s % 2: dr['hat'].append((tt, 26))
            if S != 'A' and p in ((14,) if key == 'B1' else (6, 14)): dr['ohat'].append((tt, 55))
            if s == 2 or key in ('B2', 'D'): dr['shake'].append((tt, 38 if s % 2 == 0 else 26))
            if S != 'A':
                bp_ = {0: 0, 3: 0, 6: 7, 8: 0, 11: 12, 14: 7}.get(p)
                if bp_ is not None and not (key == 'D' and False):
                    tm, v = humanize(rr, tt, 96 if p in (0, 8) else 84); tr['bass'].append((tm, (.22 if p in (0, 8) else .16) * B * 4, root + bp_, v))
                    if key in ('B2', 'D'): tr['sbass'].append((tm, .2 * B * 4, root + bp_ + 12, 70))
            if (S == 'A' and p in (2, 6, 10, 14)) or (S != 'A' and p in (2, 6, 10, 14)) or (key == 'D' and p in (4, 12)):
                for i, n in enumerate(tri):
                    tm, v = humanize(rr, tt + i * .009, 60 + 8 * (key in ('B2', 'D')) + 6 * (p % 4 == 2)); tr['uke'].append((tm, .28, n, v))
            if S != 'A' and p in (5, 13): tm, v = humanize(rr, tt, 72); tr['pizz'].append((tm, .2, tri[2 if p == 5 else 1] + 12, v))
        S = sec(t)
        if pb == 3 and S in ('B', 'D') and t + B < END_HIT - .3 and t + B < RISER0 - .1:
            for s in range(4): dr['snare'].append((g16(k, s), 36 + 22 * s + 8 * (S == 'D')))
        if S == 'B' and pb == 0 and k < -4:                       # warm pads / strings
            for n in [x - 12 for x in tri] + [tri[1]]: tr['pad'].append((t - .02, 4 * B * 1.02, n, 50))
            if k >= KB2:
                for n in tri: tr['str'].append((t - .02, 4 * B * 1.02, n + 12, 58))
        if S == 'D' and pb == 0 and k < 21:
            for n in [x - 12 for x in tri] + [tri[1]]: tr['pad'].append((t - .02, 4 * B * 1.02, n, 56))
            for n in tri: tr['str'].append((t - .02, 4 * B * 1.02, n + 12, 56))
    # ---------------- A: Fur Elise, 16th-note theme (marimba + kalimba), cycle of 12 beats, cut at the B downbeat
    endA = bt(KB)
    for cyc0, lim in ((KA, 48), (KA + 12, 12)):
        for s16, n, ln in FE:
            if s16 >= lim: continue
            kk = cyc0 + s16 / 4; tt = bt(kk)
            if tt >= endA: continue
            d = min(ln * B / 4, endA - tt) * .9
            tm, v = humanize(rr, tt, 84, .003); tr['mar'].append((tm, d, n, v)); tr['kal'].append((tm + .002, d * 1.3, n, 66))
    # ---------------- B: Ode to Joy in two lines (line 2 shortened by one bar to fit 24.0)
    for line, (ks, mel) in enumerate(((KB, ODE1), (KB2, ODE2))):
        for bar in range(4 if line == 0 else 3):
            ck = ks + bar * 4; tri_ = TRI[harm(ck)]
            for j, off in enumerate((1.5, 3.5)):                 # bell counter-line on the off-beats
                kk = ck + off; n = TRI[harm(int(kk))][(bar + j) % 3] + 24 + (12 if line else 0)
                nb('glock', kk, .5, n, 64 + 8 * line); nb('cel', kk, .5, n - 12, 50)
        for off, n, ln in mel:
            kk = ks + off; d = ln
            nb('mar', kk, d, n, 92 if line else 86); nb('vib', kk, d * 1.3, n, 60)
            if line == 1: nb('xyl', kk, d, n + 12, 78)
            if line == 0 and int(off // 4) % 2 == 1: nb('xyl', kk, d, n + 12, 60)
    for i, n in enumerate((72, 76, 79, 83)): nb('mar', -4 + i * .25, .2, n, 70 + i * 6)      # pickup into the suspense
    # ---------------- C: Mountain King, staccato low pizz + bassoon, faster and higher each time
    gaps = .085; t0 = 24.0; seq = MK_T + MK_A
    for i, n in enumerate(seq):
        tt = t0 + i * gaps; tr['lowpz'].append((tt, .07, n - 12, 96)); tr['bsn'].append((tt, .07, n, 84))
    t1 = t0 + len(seq) * gaps + .02
    for i, n in enumerate(MK_T):
        tt = t1 + i * .048; tr['lowpz'].append((tt, .05, n - 5 + 4, 104)); tr['bsn'].append((tt, .05, n + 4, 92)); tr['str'].append((tt, .05, n + 16, 88))
    for tt in (25.16, 25.21): tr['str'].append((tt, .05, 76, 110)); tr['bsn'].append((tt, .05, 64, 100))
    gp = 0.16; tt = 24.0; vel = 30
    while tt < 25.27:
        dr['snare'].append((tt, vel)); tt += gp; gp = max(.04, gp * .9); vel = min(118, vel + 6)
    # ---------------- D: William Tell gallop (triplet figures per beat), trumpets + brass, galloping strings, timpani
    for k in range(0, 21):
        ch = harm(k); tri = TRI[ch]; root = BR[ch]; bar, pb = divmod(k, 4)
        for i in range(3):                                        # galloping strings da-da-DUM
            nb('gal', k + i / 3, .28, root + 12 + (7 if i == 2 else 0), 78 + 24 * (i == 2), .002)
        if pb in (0, 2) or k >= 16: tr['timp'].append((bt(k), .3, root + (12 if k >= 16 and False else 0) if root >= 36 else root, 100 if pb == 0 else 84))
        if pb == 0 and k < 16:
            for n in [x + 12 for x in tri]: tr['brass'].append((bt(k), .32, n, 92))
    for bar, figs in enumerate(TELL):
        for b, fig in enumerate(figs):
            kk = 4 * bar + b
            if len(fig) == 3:
                for i, n in enumerate(fig):
                    v = 120 if i == 2 else 86; d = .17 if i == 2 else .12
                    nb('trump', kk + i / 3, d / B * 1.0, n, v, .002); nb('brass', kk + i / 3, d / B, n - 12, v - 24, .002)
            else:
                for i, n in enumerate(fig):
                    nb('trump', kk + i * .5, .45, n, 122, .002); nb('brass', kk + i * .5, .45, n - 12, 100, .002)
    for kk, figs in ((16, ((77, 77, 81),)), (17, ((77, 77, 81),)), (18, ((79, 79, 83),)), (19, ((79, 79, 83),))):
        for i, n in enumerate(figs[0]):
            v = 122 if i == 2 else 90; nb('trump', kk + i / 3, .35 if i == 2 else .25, n, v, .002); nb('brass', kk + i / 3, .35 if i == 2 else .25, n - 12, v - 22, .002)
    for i, n in enumerate((74, 79, 83)): nb('trump', 20 + i / 3, .3, n, 100 + 8 * i); nb('brass', 20 + i / 3, .3, n - 12, 90)
    for i in range(6): tr['timp'].append((bt(20 + i / 6), .12, 43, 70 + 9 * i))               # timpani roll into the resolution
    tr['brass'].append((IMPACT, .5, 60, 110)); tr['brass'].append((IMPACT, .5, 67, 110)); tr['brass'].append((IMPACT, .5, 76, 110)); tr['timp'].append((IMPACT, .6, 36, 118))
    # ---------------- final fanfare exactly on 36.9
    for n in (48, 55, 64, 67, 69, 74): tr['hit'].append((END_HIT, 2.6, n, 100))
    for n in (60, 64, 67, 72, 76): tr['brass'].append((END_HIT, 1.8, n, 122))
    for n in (84, 79): tr['trump'].append((END_HIT, 1.6, n, 124))
    for n in (60, 64, 67, 72): tr['str'].append((END_HIT, 2.4, n, 110))
    tr['timp'].append((END_HIT, 2.0, 36, 127)); tr['timp'].append((END_HIT, 2.0, 48, 120))
    tr['bass'].append((END_HIT, 2.5, 36, 118)); tr['bass'].append((END_HIT, 2.5, 24, 100))
    for n in (72, 76, 79, 81, 86): tr['mar'].append((END_HIT + (n - 72) * .006, 1.6, n, 112))
    for n in (84, 88, 91): tr['glock'].append((END_HIT + .01, 1.5, n, 100))
    for n in (60, 64, 67, 69, 74): tr['uke'].append((END_HIT + (n - 60) * .012, 1.5, n - 12, 96))
    # end card sting: last phrase of Ode to Joy (D. C C) softly on celesta + glock over a warm pad
    for kk, n, ln, v in ((21.5, 74, 1.4, 64), (23.0, 72, .5, 58), (23.5, 72, 4.0, 60)):
        nb('cel', kk, ln, n + 12, v); nb('glock', kk, ln, n + 12, v - 10); nb('cel', kk, ln, n, v - 14)
    for n in (48, 55, 60, 64, 67, 74): tr['pad'].append((END_HIT, 3.1, n, 58)); tr['str'].append((END_HIT + 1.0, 2.1, n + 12, 44))
    dr['kick'].append((END_HIT, 118)); dr['bigclap'].append((END_HIT, 0)); dr['bigclap'].append((IMPACT, 0)); dr['kick'].append((IMPACT, 118))
    return tr, dr

def widen(x, ms=14, amt=1.0):
    d = int(ms * SR / 1000); y = x.copy(); y[1] = np.concatenate([np.zeros(d), x[1, :-d]]) * amt + x[1] * (1 - amt); return y
def pan_st(x, p):
    a = (p + 1) * np.pi / 4; return np.vstack([x[0] * np.cos(a) * 1.414, x[1] * np.sin(a) * 1.414])
def comp(x, thr=-20, ratio=2.5, att=.01, rel=.14, makeup=0.0):
    e = uniform_filter1d(np.abs(x).max(axis=0), int(.005 * SR)); cs = 400; ec = e[::SR // cs]; g = np.zeros_like(ec); s = 0.0
    dbv = 20 * np.log10(ec + 1e-9); need = np.maximum(0, (dbv - thr) * (1 - 1 / ratio))
    for i, v in enumerate(need):
        c = np.exp(-1 / (cs * (att if v > s else rel))); s = c * s + (1 - c) * v; g[i] = s
    gg = np.interp(np.arange(x.shape[1]) / SR, np.arange(len(g)) / cs, g)
    return x * DB(-gg + makeup)

def render_score():
    tr, dr = build_score(); r = rng(21); t = np.arange(N) / SR
    G = {'uke': (24, -8, -.45), 'kal': (108, -8, .3), 'mar': (12, -3, .15), 'vib': (11, -13, -.25), 'xyl': (13, -12, .4), 'glock': (9, -13, .5), 'cel': (8, -13, -.4), 'pizz': (45, -7, -.3),
         'bass': (33, -2, 0), 'sbass': (38, -13, 0), 'pad': (89, -12, 0), 'str': (48, -14, 0), 'hit': (21, -12, 0),
         'brass': (61, -9, 0), 'trump': (56, -8, .1), 'timp': (47, -6, 0), 'bsn': (70, -6, -.2), 'lowpz': (45, -4, .2), 'gal': (48, -13, -.2)}
    SIDE = {'bass': 1.0, 'sbass': 1.0, 'pad': 1.0, 'str': .8, 'uke': .4, 'pizz': .3, 'gal': .3}
    # sidechain envelope from kicks
    kt = [tk for tk, _ in dr['kick']]; sc = np.ones(N)
    for tk in kt:
        i = int(tk * SR); m = int(.3 * SR)
        if i >= N: continue
        x = np.arange(min(m, N - i)) / SR; sc[i:i + len(x)] = np.minimum(sc[i:i + len(x)], 1 - .55 * np.exp(-x / .11) * np.minimum(x / .004, 1))
    melodic = np.zeros((2, N)); stems = {}
    for k, (prog, g, pan) in G.items():
        if not tr[k]: continue
        y = sf_render(tr[k], prog)
        if k == 'bass': y = lp(y, 800, 2); y = np.vstack([y.mean(0)] * 2)
        if k == 'sbass': y = lp(y, 1200, 2); y = np.vstack([y.mean(0)] * 2)
        if k in ('pad', 'str', 'uke'): y = widen(y, 16 if k == 'uke' else 22)
        y = pan_st(y, pan) if k not in ('pad', 'str', 'hit') else y
        if k in SIDE: y = y * (1 - SIDE[k] * (1 - sc))
        stems[k] = y * DB(g); melodic += stems[k]
    melodic = peq(melodic, 2800, .8, -2.0)
    P = np.zeros((2, N))
    for tk, v in dr['kick']: add(P, st(d_kick(), 0), tk, DB(-3) * v / 100)
    for tk, v in dr['snare']: add(P, st(d_snare(r), .05), tk, DB(-8) * v / 100)
    for tk, v in dr['clap']: add(P, st(d_clap(r), .2), tk, DB(-11) * v / 80)
    for tk, _ in dr['bigclap']: add(P, st(d_clap(r, True), 0), tk, DB(-6))
    for tk, v in dr['hat']: add(P, st(d_hat(r), .25), tk, DB(-13) * v / 60)
    for tk, v in dr['ohat']: add(P, st(d_hat(r, True), .3), tk, DB(-14) * v / 55)
    for tk, v in dr['shake']: add(P, st(d_shake(r), r.uniform(-.5, .5)), tk, DB(-15) * v / 38)
    for tk, v in dr['wood']: add(P, st(s_wood(1350, .08), .3), tk, DB(-14) * v / 55)
    P = lp(P, 12000, 2)
    # reverb send on melodic content (tasteful) + short room on drums
    mel = reverb(melodic, 1.4, .16, seed=5); P = reverb(P, .35, .05, seed=6)
    mix = mel + P
    # gating: score muted 24.0 -> 25.64 (riser only), end-card fade
    m = np.ones(N); s_ = (t >= 23.92) & (t < IMPACT); m[s_] = np.interp(t[s_], [23.92, 24.05, IMPACT], [1, 0, 0])
    mix *= m; mix *= np.interp(t, [0, 0.05, 39.0, 40.0], [0, 1, .8, 0])
    # master-bus glue + soft saturation
    mix = comp(mix, -22, 2.2, .012, .16, 2.0); mix = np.tanh(mix * 1.1) / 1.1
    rs = s_riser(RISER1 - RISER0); riser = np.zeros((2, N)); add(riser, st(rs, 0), RISER0, DB(-6))
    return mix, riser, tr, dr

# ------------------------------------------------------------ VO / duck
def load_vo():
    p = next(p for p in VO_CANDS if os.path.exists(p)); x, sr = sf.read(p, always_2d=True); x = x.mean(axis=1)
    if sr != SR:
        from math import gcd
        g = gcd(SR, sr); x = resample_poly(x, SR // g, sr // g)
    x = fit(x[None, :])[0]
    return x
def duck_curve(vo, depth_db=-9.0, att=.025, rel=.28):
    rms = np.sqrt(uniform_filter1d(vo ** 2, int(.02 * SR))); thr = 0.03 * rms.max()
    act = (rms > thr).astype(float); act = uniform_filter1d(act, int(.05 * SR))
    cs = 200; a = act[::SR // cs]; o = np.zeros_like(a); s = 0.0
    for i, v in enumerate(a):
        c = np.exp(-1 / (cs * (att if v > s else rel))); s = c * s + (1 - c) * v; o[i] = s
    cur = np.interp(np.arange(N) / SR, np.arange(len(o)) / cs, o)
    return DB(depth_db * np.clip(cur, 0, 1)), cur

def limiter(x, ceil_db=TP_CEIL, look=.003, rel=.08):
    ceil = DB(ceil_db); pk = np.abs(resample_poly(x, 4, 1, axis=-1)).max(axis=0); pk = pk[:len(pk) // 4 * 4].reshape(-1, 4).max(axis=1)
    need = np.minimum(1.0, ceil / (pk + 1e-12)); la = int(look * SR)
    g = minimum_filter1d(need, 2 * la + 1, mode='nearest'); g = uniform_filter1d(g, 2 * la + 1, mode='nearest')
    # release smoothing (only lets gain recover slowly)
    c = np.exp(-1 / (rel * SR)); out = np.empty_like(g); s = 1.0
    b = 16; gb = g[:len(g) // b * b].reshape(-1, b).min(axis=1); ob = np.empty_like(gb)
    cb = np.exp(-b / (rel * SR))
    for i, v in enumerate(gb): s = v if v < s else 1 - (1 - s) * cb if False else min(v, s + (1 - s) * (1 - cb)); ob[i] = s
    g2 = np.repeat(ob, b); g2 = np.pad(g2, (0, len(g) - len(g2)), constant_values=g2[-1]); g2 = np.minimum(g2, g)
    return x * np.minimum(g2, 1.0)
def lufs(x): return pyln.Meter(SR).integrated_loudness(x.T)
def tp(x): return 20 * np.log10(np.abs(resample_poly(x, 4, 1, axis=-1)).max() + 1e-12)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', default=os.path.join(AUD, 'master.wav')); ap.add_argument('--report', action='store_true'); a = ap.parse_args()
    vo = load_vo(); vo = sosfilt(sos('highpass', 80, 2), vo); vo = peq(vo, 3200, .9, 2.0); vo = peq(vo, 250, 1.0, -1.0)
    vo_st = np.vstack([vo, vo]); duck, cur = duck_curve(vo)
    score, riser, tr, perc = render_score()
    ref = (t0 := np.arange(N) / SR); mm = ((ref > 12) & (ref < 24)) | ((ref > 26) & (ref < 36))
    score = score * DB(-24 - 10 * np.log10(np.mean(score[:, mm] ** 2)))     # normalise score bus to -24 dBFS rms
    # SFX bus: every sound is pitched to the chord under it (chord tones, arpeggiating through consecutive cues)
    cues, nsc = merged_cues(); r = rng(77); sfx = np.zeros((2, N)); ncue = 0; SEQ = [0, 1, 2, 3, 2, 1]
    for i, (t_, name, g, pan) in enumerate(cues):
        nm = name if name in LEVEL else ALIAS.get(name, 'pop')
        k = int(round((t_ - IMPACT) / B)); tones = TRI[harm(k)] + [TRI[harm(k)][0] + 12]; f = mf(tones[SEQ[i % 6]] + 12)
        y, hit = snd(nm, rng(1000 + i), f)
        add(sfx, st(y, pan), t_ - hit, DB(LEVEL[nm] + g)); ncue += 1
    hero = np.zeros((2, N)); add(hero, st(s_impact(), 0), IMPACT, DB(-1))
    sfx = reverb(sfx, .7, .08); sfx = lp(hp(sfx, 45, 2), 12000, 4); hero = lp(hero, 12000, 2)
    t = np.arange(N) / SR; bm = np.ones(N)
    sel = (t > 25.22) & (t < IMPACT); bm[sel] = np.interp(t[sel], [25.22, 25.30, 25.60, 25.635, IMPACT], [1, .02, .02, .02, 1])
    sfx *= bm; score *= bm
    MG, SG = -5.0, -8.0
    lift = np.interp(t, [0, 9, 20, 20.3, 36.8, 36.95, 40], [6, 6, 3, 3, 0, 12, 12])   # dB: quiet early sections up, end card up (no VO)
    bed_score = score * duck * DB(MG + lift)
    bed_sfx = sfx * (duck ** .5) * DB(SG)
    rise = riser * (duck ** .3) * DB(-8) * np.interp(t, [24, 25.3, 25.32], [1, 1, 0])
    mix = vo_st * DB(-1.0) + bed_score + bed_sfx + rise + hero * DB(-3)
    # loudness
    mix = fit(mix)
    for _ in range(4):
        gain = DB(TARGET_LUFS - lufs(mix.T.T if False else mix)); mix = limiter(mix * gain)
        # limiter changes loudness a bit -> loop
    mix = np.clip(mix, -1, 1)
    sf.write(a.out, fit(mix).T, SR, subtype='PCM_24')
    # ---------- report
    y, sr = sf.read(a.out); assert y.shape == (N, 2), y.shape
    y = y.T; L = lufs(y); TPk = tp(y); clip = int((np.abs(y) >= .9999).sum())
    sp = (t >= 0.1) & (t <= 36.8)
    voA = np.sqrt(np.mean((vo_st * DB(-1.0) * (DB(TARGET_LUFS - 0)))[:, sp] ** 2))
    def rms_db(x, m): return 10 * np.log10(np.mean(x[:, m] ** 2) + 1e-12)
    g_final = 10 ** ((L - lufs(mix)) / 20)
    vo_act = (np.abs(vo) > 0.02 * np.abs(vo).max())
    bedm = (bed_score + bed_sfx + hero * DB(-3))
    vo_r = rms_db(vo_st * DB(-1.0), vo_act); bed_r = rms_db(bedm, vo_act)
    print(f'master: {a.out}  len={y.shape[1] / SR:.3f}s  LUFS={L:.2f}  TP={TPk:.2f} dBTP  clipped_samples={clip}  cues={ncue} (scene CUE comments={nsc})')
    for nm_,x_ in (('vo',vo_st*DB(-1.0)),('score',bed_score),('sfx',bed_sfx),('hero',hero*DB(-3))): print('   comp',nm_,'%.1f'%rms_db(x_,vo_act))
    fg = 10 ** ((L - lufs(mix)) / 20) if False else 1.0
    print('  per 3 s window (dB rms, pre-master): vo | score | sfx+hero+riser | VO-minus-bed')
    for a0 in range(0, 40, 3):
        m = (t >= a0) & (t < a0 + 3); v_ = rms_db(vo_st * DB(-1.0), m); b_ = rms_db(bed_score + bed_sfx + hero * DB(-3) + rise, m); sc_ = rms_db(bed_score, m); o_ = rms_db(bed_sfx + hero * DB(-3) + rise, m)
        print(f'   {a0:2d}-{a0 + 3:2d}s  {v_:6.1f} {sc_:6.1f} {o_:6.1f}  {v_ - b_:5.1f}')
    print(f'VO vs bed (music+sfx) during speech: {vo_r - bed_r:.1f} dB  | duck depth applied {20 * np.log10(duck.min()):.1f} dB')
    for nm, (t0, t1) in (('riser 24.0-25.3', (24.0, 25.3)), ('breath 25.32-25.6', (25.32, 25.6)), ('impact 25.64-26.0', (25.64, 26.0)), ('end 37-40', (37, 40)), ('crowd 27.5-29.5', (27.5, 29.5))):
        m = (t >= t0) & (t < t1); print(f'  {nm}: {rms_db(y, m):.1f} dBFS rms')
    from scipy.signal import stft
    def spec_stats(x, name):
        f, tt, Z = stft(x.mean(0), SR, nperseg=2048); P_ = np.abs(Z) ** 2 + 1e-20; en = P_.sum(0); ok = en > en.max() * 1e-4
        flat = np.exp(np.mean(np.log(P_[:, ok]), 0)) / np.mean(P_[:, ok], 0)
        print(f'  {name}: spectral flatness (median active frame) {np.median(flat):.4f} | energy >8 kHz {100 * P_[f > 8000].sum() / P_.sum():.2f}% | >12 kHz {100 * P_[f > 12000].sum() / P_.sum():.3f}% | centroid {np.sum(f[:, None] * P_[:, ok]) / P_[:, ok].sum():.0f} Hz')
    spec_stats(bed_sfx + hero * DB(-3), 'SFX bed'); spec_stats(bed_score, 'score bed'); spec_stats(y, 'master')
    print('  peak time: %.3f s' % (np.abs(y).max(axis=0).argmax() / SR), ' first-sample/last-sample abs: %.2e %.2e' % (np.abs(y[:, 0]).max(), np.abs(y[:, -1]).max()))
if __name__ == '__main__': main()
