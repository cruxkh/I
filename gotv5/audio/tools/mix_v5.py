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

# ------------------------------------------------------------ SFX synth (all handmade-paper flavoured)
def s_pop(r, f=1.0):
    n = int(.14 * SR); t = np.arange(n) / SR
    fr = (260 + 900 * np.exp(-t / .012)) * f; y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_exp(n, .035)
    y += hp(r.standard_normal(n), 2500) * env_exp(n, .006) * .35
    return fade(y * .9)
def s_slap(r, f=1.0):     # paper scrap slapped on the table
    n = int(.22 * SR); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 900, 5500) * env_exp(n, .028) * 1.2
    y += np.sin(2 * np.pi * np.cumsum(140 * f * (1 + 1.5 * np.exp(-t / .02))) / SR) * env_exp(n, .05) * .8
    y += hp(r.standard_normal(n), 4000) * env_exp(n, .004) * .5
    return fade(y * .8)
def s_stamp(r, big=False):
    d = 1.2 if big else .5; n = int(d * SR); t = np.arange(n) / SR
    k = np.sin(2 * np.pi * np.cumsum(np.maximum(48, 130 * np.exp(-t / .07))) / SR) * env_exp(n, .35 if big else .12)
    c = bp(r.standard_normal(n), 300, 3500) * env_exp(n, .05) * .9 + hp(r.standard_normal(n), 3000) * env_exp(n, .012) * .5
    y = k * 1.3 + c
    return fade(y * .9, .001, .02)
def s_impact(r):
    d = 3.5; n = int(d * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(np.maximum(38, 150 * np.exp(-t / .09))) / SR) * env_exp(n, .9)
    thud = bp(r.standard_normal(n), 120, 2500) * env_exp(n, .16) * 1.0
    crack = hp(r.standard_normal(n), 1500) * env_exp(n, .05) * .9 + hp(r.standard_normal(n), 6000) * env_exp(n, .25) * .25
    body = np.sin(2 * np.pi * 82 * t) * env_exp(n, .45) * .6
    y = boom * 1.6 + thud + crack + body
    y = np.tanh(y * .9) * 1.0
    return fade(y, .0005, .05)
def s_rip(r, d=.55):
    n = int(d * SR); t = np.arange(n) / SR
    w = r.standard_normal(n) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 90 * t * (1 + t))))
    y = bp(w, 1500, 9000) * (0.4 + 0.6 * np.sin(np.pi * t / d) ** 0.7)
    y *= (r.random(n) > .12) * 1.0
    return fade(y * .8, .01, .04)
def s_squeak(r, d=.28, f0=2300):
    n = int(d * SR); t = np.arange(n) / SR
    fr = f0 * (1 + .08 * np.sin(2 * np.pi * 9 * t) + .25 * t / d); ph = 2 * np.pi * np.cumsum(fr) / SR
    y = (np.sin(ph) + .4 * np.sin(2 * ph)) * np.sin(np.pi * t / d) ** .6 * (0.7 + 0.3 * np.sin(2 * np.pi * 31 * t))
    y += bp(r.standard_normal(n), 3000, 8000) * .15 * np.sin(np.pi * t / d)
    return fade(y * .5, .01, .03)
def s_snip(r):
    y = np.zeros(int(.3 * SR))
    for t0, g in ((0, 1), (.09, .8)):
        m = int(.06 * SR); c = bp(r.standard_normal(m), 3500, 11000) * env_exp(m, .008) + np.sin(2 * np.pi * 4200 * np.arange(m) / SR) * env_exp(m, .012) * .3
        y[int(t0 * SR):int(t0 * SR) + m] += c * g
    return fade(y * .8)
def s_flip(r):
    n = int(.5 * SR); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 700, 7000) * (np.exp(-((t - .12) / .07) ** 2) * 1.0 + np.exp(-((t - .27) / .1) ** 2) * .6)
    y *= 0.6 + 0.4 * np.sin(2 * np.pi * 38 * t)
    return fade(y, .01, .05)
def s_shutter(r):
    y = np.zeros(int(.35 * SR))
    for t0, g, f in ((0, 1, 2500), (.055, .8, 1800)):
        m = int(.03 * SR); c = bp(r.standard_normal(m), f, 9000) * env_exp(m, .005) + np.sin(2 * np.pi * f * .7 * np.arange(m) / SR) * env_exp(m, .006) * .5
        y[int(t0 * SR):int(t0 * SR) + m] += c * g
    return fade(y)
def s_whoosh(r, d=.5, up=True, lo=400, hi=7000):
    n = int(d * SR); t = np.arange(n) / SR; u = t / d
    fc = lo * (hi / lo) ** (u if up else 1 - u); w = r.standard_normal(n)
    out = np.zeros(n); edges = np.geomspace(lo / 1.5, hi * 1.5, 14)
    for a, b in zip(edges[:-1], edges[1:]):
        c = np.sqrt(a * b); g = np.exp(-(np.log(c / fc) ** 2) / (2 * .45 ** 2)); out += sosfilt(sos('bandpass', [a, min(b, 21000)], 2), w) * g
    out *= np.sin(np.pi * np.clip(u, 0, 1)) ** 1.5
    return fade(out * .9, .01, .03)
def s_rustle(r, d=.6):
    n = int(d * SR); t = np.arange(n) / SR
    w = bp(r.standard_normal(n), 2000, 9000); a = np.abs(uniform_filter1d(r.standard_normal(n), 900)) * 14
    a = np.clip(a, 0, 1.5) ** 2 * (0.5 + .5 * np.sin(np.pi * t / d))
    y = w * a * (r.random(n) > .25)
    return fade(y * .7, .01, .05)
def s_click(r):
    n = int(.08 * SR); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 1500, 7000) * env_exp(n, .004) + np.sin(2 * np.pi * 1100 * t) * env_exp(n, .008) * .6
    y2 = np.zeros(int(.16 * SR)); y2[:n] += y; y2[int(.07 * SR):int(.07 * SR) + n] += y * .5
    return fade(y2 * .8)
def s_ding(r):
    n = int(2.2 * SR); t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * t) * env_exp(n, d) for f, a, d in ((1319, 1, .9), (1976, .5, .6), (2637, .25, .35), (3951, .1, .2)))
    y += np.sin(2 * np.pi * 659 * t) * env_exp(n, .5) * .3
    return fade(y * .5, .001, .1)
def s_cheer(r, d=2.6, peak=.6, goal=False):
    n = int(d * SR); t = np.arange(n) / SR; u = t / d
    a = np.exp(-((u - peak) / .28) ** 2) * (u <= peak) + np.exp(-((u - peak) / .35) ** 2) * (u > peak)
    w = r.standard_normal(n); pink = np.cumsum(w); pink = hp(pink, 60, 1); pink /= np.abs(pink).max()
    crowd = bp(pink * .5 + w * .5, 350, 3800) * (0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * t + 1))
    voices = sum(np.sin(2 * np.pi * np.cumsum(f * (1 + .05 * np.sin(2 * np.pi * (v + 2) * t + v))) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * (.5 + v * .13) * t + v)) for v, f in enumerate((310, 420, 540, 690, 880, 1010))) * .06
    y = (crowd * 1.0 + voices) * a
    cl = np.zeros(n)
    for _ in range(int(d * 14)):
        tc = int(r.uniform(0.05, .95) * n); m = min(int(.05 * SR), n - tc); cl[tc:tc + m] += bp(r.standard_normal(m), 1200, 6000) * env_exp(m, .01) * .5 * a[tc]
    y += cl
    if goal:
        m = int(.6 * SR); h = np.sin(2 * np.pi * 470 * np.arange(m) / SR) * (np.sin(2 * np.pi * 8 * np.arange(m) / SR) > -.3) * .15
        add_ = np.zeros(n); i = int(.45 * n); add_[i:i + m] = h[:n - i] * np.linspace(1, 0, m)[:n - i]; y += add_ * a
    return fade(y * 1.0, .05, .3)
def s_riser(r, d):
    n = int(d * SR); t = np.arange(n) / SR; u = t / d
    fc = 500 * (9000 / 500) ** u; w = r.standard_normal(n); out = np.zeros(n)
    edges = np.geomspace(300, 12500, 16)
    for a, b in zip(edges[:-1], edges[1:]):
        c = np.sqrt(a * b); g = np.exp(-(np.log(c / fc) ** 2) / (2 * .5 ** 2)); out += sosfilt(sos('bandpass', [a, min(b, 21000)], 2), w) * g
    tone = np.sin(2 * np.pi * np.cumsum(180 * (2 ** (u * 3))) / SR) * .18 + np.sin(2 * np.pi * np.cumsum(360 * (2 ** (u * 3))) / SR) * .08
    y = (out * .9 + tone) * u ** 1.7
    hb = np.zeros(n)                                  # accelerating ticks (heartbeat)
    tk = 0.0; gap = .55
    while tk < d - .05:
        m = int(.12 * SR); i = int(tk * SR)
        k = np.sin(2 * np.pi * np.cumsum(np.maximum(55, 140 * np.exp(-np.arange(m) / SR / .03))) / SR) * env_exp(m, .06)
        hb[i:i + m] += k[:max(0, min(m, n - i))] * (0.4 + .6 * tk / d); tk += gap; gap = max(.13, gap * .82)
    y = y + hb * .8
    return fade(y, .01, .002)
def s_crash(r, d=2.8):
    n = int(d * SR); t = np.arange(n) / SR
    y = hp(r.standard_normal(n), 3000) * env_exp(n, .7) + bp(r.standard_normal(n), 6000, 12000) * env_exp(n, 1.1) * .5
    return fade(y * .5, .001, .1)
def s_clap(r, big=False):
    n = int(.25 * SR); y = np.zeros(n)
    for i, o in enumerate((0, .011, .023, .036) if not big else (0, .009, .019, .03, .042)):
        m = int(.09 * SR); j = int(o * SR); y[j:j + m] += bp(r.standard_normal(m), 900, 4500) * env_exp(m, .012 if i < 3 else .045) * (.6 if i < 3 else 1)
    return fade(y * .9, 0, .01)
def s_shake(r, long=False):
    n = int((.16 if not long else .3) * SR); t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 5000, 12000) * np.minimum(t / .03, 1) * env_exp(n, .06 if not long else .12)
    return fade(y * .6, .005, .01)
def s_kick(r):
    n = int(.3 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-t / .03)) / SR) * env_exp(n, .11) + bp(r.standard_normal(n), 800, 4000) * env_exp(n, .005) * .3
    return fade(y, .001, .02)
def s_wood(r):
    n = int(.12 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 1350 * t) * env_exp(n, .018) + np.sin(2 * np.pi * 2100 * t) * env_exp(n, .01) * .4
    return fade(y * .6, 0, .01)

SFX = {'pop': lambda r: s_pop(r, r.uniform(.9, 1.15)), 'slap': s_slap, 'stamp': lambda r: s_stamp(r), 'slam': lambda r: s_stamp(r, True),
       'thump': lambda r: s_stamp(r), 'rip': s_rip, 'tape': s_rip, 'squeak': lambda r: s_squeak(r, .28, r.uniform(2000, 2700)), 'snip': s_snip,
       'flip': s_flip, 'shutter': s_shutter, 'cheer': lambda r: s_cheer(r, 2.6, .55), 'goal': lambda r: s_cheer(r, 3.0, .5, True), 'ding': s_ding,
       'click': s_click, 'rustle': s_rustle, 'whoosh': lambda r: s_whoosh(r, .5), 'whoosh_s': lambda r: s_whoosh(r, .3, True, 800, 9000),
       'impact': s_impact, 'crash': s_crash}
# per-type default level (dB, before the SFX bus) and pan
LEVEL = {'pop': -6, 'slap': -7, 'stamp': -6, 'slam': -7, 'thump': -8, 'rip': -8, 'tape': -8, 'squeak': -10, 'snip': -8, 'flip': -8, 'shutter': -7,
         'cheer': -9, 'goal': -6, 'ding': -8, 'click': -9, 'rustle': -12, 'whoosh': -10, 'whoosh_s': -12, 'impact': 0, 'crash': -9}
ALIAS = {'sting': 'ding', 'peel': 'flip', 'wipe': 'whoosh', 'swipe': 'whoosh', 'tear': 'rip', 'marker': 'squeak', 'scribble': 'squeak', 'scissors': 'snip',
         'cut': 'snip', 'camera': 'shutter', 'crowd': 'cheer', 'tv': 'ding', 'remote': 'click', 'button': 'click', 'paper': 'rustle', 'page': 'flip',
         'tick': 'click', 'boom': 'impact', 'hit': 'slap', 'drop': 'slap', 'slide': 'whoosh', 'zoom': 'whoosh', 'sticker': 'pop', 'logo': 'pop', 'reveal': 'pop'}

# ------------------------------------------------------------ cue tables
def base_cues():
    C = []
    def c(t, n, g=0, pan=0.0): C.append((t, n, g, pan))
    # scene changes (0.2 s before the phrase)
    for t, n in ((4.77, 'whoosh'), (8.6, 'rip'), (11.6, 'flip'), (15.4, 'whoosh'), (20.3, 'whoosh'), (29.75, 'whoosh')): c(t, n)
    c(0.02, 'rustle', -4)
    # s0 hook
    for t, n, p in ((0.77, 'pop', -.3), (1.34, 'pop', .3), (1.98, 'slam', 0), (2.46, 'pop', 0), (3.18, 'pop', -.2), (3.58, 'pop', .2), (4.28, 'slap', 0), (4.64, 'shutter', 0)): c(t, n, 0, p)
    # s1 live + streamers
    for t, n, p in ((4.975, 'slap', -.3), (5.16, 'pop', .3), (5.63, 'pop', -.2), (5.86, 'pop', .2), (6.69, 'slap', -.3), (7.02, 'pop', .3), (7.69, 'slap', .3), (8.2, 'pop', -.3), (8.55, 'pop', .3)): c(t, n, 0, p)
    c(8.3, 'squeak', -3)
    # s2 sports
    for t, n, p in ((9.02, 'slap', -.4), (9.26, 'pop', -.2), (9.68, 'pop', .2), (10.2, 'slap', .3), (10.44, 'pop', -.3), (10.66, 'stamp', 0), (11.1, 'squeak', .2), (11.3, 'pop', .3)): c(t, n, 0, p)
    # s3 series
    for t, n, p in ((12.0, 'slap', 0), (12.39, 'pop', -.4), (13.095, 'pop', .4), (13.99, 'pop', -.3), (14.53, 'pop', .3), (14.8, 'pop', -.2), (15.11, 'snip', .2)): c(t, n, 0, p)
    # s4 library
    for t, n, p in ((15.79, 'slap', 0), (16.1, 'pop', .3), (16.72, 'slap', -.3), (17.14, 'pop', .3), (17.61, 'squeak', -.2), (17.97, 'pop', .2), (18.17, 'pop', -.3),
                    (18.8, 'slap', 0), (19.39, 'pop', -.3), (19.54, 'pop', .2), (19.77, 'pop', .3), (20.05, 'pop', 0)): c(t, n, 0, p)
    # s5 smooth
    for t, n, p in ((20.68, 'slap', 0), (21.08, 'whoosh_s', -.3), (21.49, 'pop', .3), (22.22, 'whoosh_s', .3), (22.72, 'pop', -.3), (23.14, 'whoosh_s', .3), (24.01, 'click', 0)): c(t, n, 0, p)
    # s6 no freezing: stamp handled by IMPACT
    c(26.52, 'stamp', -2); c(27.19, 'slap', 0, -.2); c(27.41, 'pop', 0, .2); c(27.99, 'pop', 0, -.2); c(28.53, 'pop', 0, .2)
    c(27.5, 'cheer', -5); c(28.7, 'goal', -3); c(29.25, 'pop', 0)
    # s7 press and watch
    c(30.12, 'slap', 0); c(30.6, 'click', -1); c(31.0, 'ding', 0); c(31.12, 'pop', 0)
    for t, p in ((32.05, -.3), (32.22, .3), (32.53, -.2), (32.86, .3), (33.44, -.3), (33.99, .3), (34.36, -.2), (34.63, .2), (35.21, -.3), (35.63, .3), (36.18, -.2), (36.39, .3)): c(t, 'pop', -2, p)
    c(36.5, 'snip', -4)
    return C
KW = [('slam', 'slam'), ('stamp', 'stamp'), ('goal', 'goal'), ('cheer', 'cheer'), ('crowd', 'cheer'), ('flip', 'flip'), ('peel', 'flip'), ('snip', 'snip'), ('scissor', 'snip'),
      ('squeak', 'squeak'), ('marker', 'squeak'), ('scribble', 'squeak'), ('rip', 'rip'), ('tear', 'rip'), ('tape', 'rip'), ('shutter', 'shutter'), ('camera', 'shutter'),
      ('ding', 'ding'), ('click', 'click'), ('press', 'click'), ('whoosh', 'whoosh'), ('wipe', 'whoosh'), ('fly', 'whoosh'), ('avalanche', 'whoosh'), ('wave', 'whoosh'),
      ('drop', 'slap'), ('slap', 'slap'), ('thump', 'thump'), ('rustle', 'rustle'), ('burst', 'pop'), ('confetti', 'pop'), ('pop', 'pop'), ('flash', 'pop'), ('logo', 'slam')]
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
                t = float(m.group(1)); txt = m.group(2)
                if t >= TOTAL: continue
                out.append((t, kind_of(txt), 0.0, 0.0, os.path.basename(f)))
    return out
def merged_cues():
    base = base_cues(); sc = scene_cues(); keep = [b for b in base if not any(abs(b[0] - s[0]) < .05 for s in sc)]
    allc = [(t, n, g, p) for t, n, g, p in keep] + [(t, n, g, p) for t, n, g, p, _ in sc]
    return sorted(allc), len(sc)

# ------------------------------------------------------------ score
_SY = None
def sf_render(notes, prog, bank=0, vol=127):
    """notes: (t, dur, midi, vel) -> stereo float (N,2)->(2,N)"""
    global _SY
    import tinysoundfont as tsf
    if _SY is None:
        s = tsf.Synth(samplerate=SR, gain=-4); _SY = (s, s.sfload(SF2))
    s, sfid = _SY; ch = 0
    s.sounds_off(); s.program_select(ch, sfid, bank, prog, False); s.control_change(ch, 7, vol); s.control_change(ch, 11, 127); s.control_change(ch, 10, 64)
    ev = []
    for t, d, n, v in notes:
        if t >= TOTAL: continue
        ev.append((int(round(max(t, 0) * SR)), 1, int(n), int(v))); ev.append((int(round(min(t + d, TOTAL + 2) * SR)), 0, int(n), 0))
    ev.sort(key=lambda e: (e[0], e[1]))
    out = np.zeros((N + 3 * SR, 2), np.float32); pos = 0
    for smp, typ, a, b in ev:
        if smp >= N + 2 * SR: break
        if smp > pos: out[pos:smp] = np.frombuffer(s.generate(smp - pos), dtype=np.float32).reshape(-1, 2); pos = smp
        s.noteon(ch, a, b) if typ else s.noteoff(ch, a)
    end = min(N + 3 * SR, pos + 3 * SR); out[pos:end] = np.frombuffer(s.generate(end - pos), dtype=np.float32).reshape(-1, 2)
    return out[:N].T.astype(np.float64)

CH = {'C': (36, [60, 64, 67, 71]), 'Am': (45, [60, 64, 67, 69]), 'F': (41, [60, 64, 65, 69]), 'G': (43, [59, 62, 64, 67]), 'Csix': (36, [60, 64, 67, 69])}
CYC = ['C', 'Am', 'F', 'G']
def chord_at(k):
    if 16 <= k < 18: return 'F'
    if 18 <= k < 21: return 'G'
    if k >= 21: return 'Csix'
    return CYC[(k // 4) % 4]
def lvl(t):
    if t < RISER0: return 1 if t < 9.0 else (2 if t < 20.3 else 3)
    if t < IMPACT - 0.001: return 0
    return 4
def humanize(rr, t, v): return t + rr.uniform(-.006, .006), int(np.clip(v + rr.integers(-6, 7), 20, 127))

MAR_A = [(0, 3, 0, 1), (1, 2, 0, 1), (3, 1, 0, 1), (4, 0, 0, 2), (6, 2, 0, 1), (7, 3, 0, 1)]
MAR_B = [(0, 2, 0, 1), (2, 3, 0, 1), (3, 2, 0, 1), (4, 1, 0, 1), (5, 2, 0, 1), (6, 3, 1, 2)]
def build_score():
    rr = rng(11); tr = {k: [] for k in ('mar', 'xyl', 'uke', 'pizz', 'bass', 'glock', 'pad', 'hit')}
    perc = {k: [] for k in ('kick', 'clap', 'shake', 'wood', 'bigclap')}
    k0 = int(np.floor((0 - IMPACT) / B)); k1 = int(np.ceil((END_HIT - IMPACT) / B))
    def sw(e):                 # eighth index -> beat offset with light swing
        return (e // 2) + (0.5 + .06 if e % 2 else 0)
    for k in range(k0, k1 + 1):
        bar = k // 4; pos_in_bar = k - 4 * bar
        # eighth-grid events: iterate each beat's two eighths
        for half in (0, 1):
            e = pos_in_bar * 2 + half; kk = k + (0.5 + .06 if half else 0); t = bt(kk)
            if t < 0 or t >= END_HIT - 0.02: continue
            L = lvl(t)
            if L == 0: continue
            ch = chord_at(k); root, tones = CH[ch]
            # shaker (16ths at lvl 4)
            if L >= 1: perc['shake'].append((t, 40 + (14 if half == 0 else 0) + (10 if e == 0 else 0)))
            if L >= 4: perc['shake'].append((bt(k + (.25 if half == 0 else .75)), 34))
            if L >= 1 and half == 0 and pos_in_bar in (1, 3): perc['wood'].append((t, 55))
            # uke
            if (L == 1 and half == 1) or (L >= 2 and (half == 1 or (L >= 3 and pos_in_bar in (1, 3)))):
                for i, n in enumerate(sorted(x - 12 for x in tones)):
                    tt, v = humanize(rr, t + i * .011, 62 + 8 * (L >= 3)); tr['uke'].append((tt, .35, n, v))
        # per-beat events
        t = bt(k)
        if t < 0 or t >= END_HIT - 0.02: continue
        L = lvl(t)
        if L == 0: continue
        ch = chord_at(k); root, tones = CH[ch]
        if L >= 2 and pos_in_bar in (1, 3): perc['clap'].append((t, 90 if L >= 3 else 70))
        if L >= 4 and pos_in_bar in (1, 3): perc['clap'].append((bt(k + .5 + .06), 55))
        if L >= 3 and pos_in_bar in (0, 2): perc['kick'].append((t, 100 if L == 4 else 80))
        elif L == 2 and pos_in_bar == 0: perc['kick'].append((t, 70))
        if L >= 4 and pos_in_bar == 0 and t < END_HIT - 2: perc['bigclap'].append((t, 0))
        # marimba pattern on bar start
        if pos_in_bar == 0:
            pat = MAR_A if (bar % 2 == 0) else MAR_B; ch_, tn = ch, tones
            for e_, ti, oct_, du in pat:
                kk = k + sw(e_); tt = bt(kk)
                if tt < 0 or tt >= END_HIT - .02 or lvl(tt) == 0: continue
                LL = lvl(tt); c2 = chord_at(int(np.floor(kk)))
                n = CH[c2][1][ti] + 12 * oct_ + (12 if LL <= 1 and ti == 3 else 0)
                tm, v = humanize(rr, tt, 78 + 8 * (LL >= 3)); tr['mar'].append((tm, .4 * du * B, n, v))
                if LL >= 3: tr['xyl'].append((tm + .004, .2, n + 12, 60 + 12 * (LL >= 4)))
        # pizz + bass
        if L >= 2:
            for hf, ti in ((.5 + .06, 2), (0.0, 0)):
                if pos_in_bar in (1, 3) and hf > 0: tm, v = humanize(rr, bt(k + hf), 70); tr['pizz'].append((tm, .25, tones[ti] + 0, v))
            if pos_in_bar == 0: tr['pizz'].append((bt(k + .5 + .06), .25, tones[3] + 12, 66))
        if L >= 2:
            pat = {0: [(0, 0, .9), (.75, 7, .4)], 1: [(0, 12, .4), (.5 + .06, 7, .4)], 2: [(0, 0, .8), (.75, 7, .4)], 3: [(0, 7, .4), (.5 + .06, 12, .4)]}[pos_in_bar]
            for hf, iv, du in pat:
                tm, v = humanize(rr, bt(k + hf), 92); tr['bass'].append((tm, du * B, root + iv, v))
        # glock sparkle on bar starts in big sections
        if L >= 3 and pos_in_bar == 0: tr['glock'].append((bt(k) + .01, .5, tones[3] + 24, 70)); tr['glock'].append((bt(k + 2) + .01, .5, tones[1] + 24, 60))
    # ---- pre-24: light fill leading into tension, pickup arpeggio
    for i, n in enumerate((72, 76, 79, 83)): tr['mar'].append((23.35 + i * .13, .2, n, 70 + i * 6))
    # ---- final resolution hit (36.9)
    for n in (48, 55, 64, 67, 69, 74): tr['hit'].append((END_HIT, 2.6, n, 100))
    tr['bass'].append((END_HIT, 2.5, 36, 118)); tr['bass'].append((END_HIT, 2.5, 24, 100))
    for n in (72, 76, 79, 81, 86): tr['mar'].append((END_HIT + (n - 72) * .006, 1.6, n, 112))
    for n in (84, 88, 91): tr['glock'].append((END_HIT + .01, 1.5, n, 100))
    for n in (60, 64, 67, 69, 74): tr['uke'].append((END_HIT + (n - 60) * .012, 1.5, n - 12, 96))
    # warm end-card sting (36.9-40): rising celesta/marimba tag over a soft pad
    for i, n in enumerate((72, 76, 79, 84, 88)): tr['glock'].append((37.55 + i * .16, 1.2, n + 12, 62 - 3 * i))
    for i, n in enumerate((79, 76, 72)): tr['mar'].append((38.55 + i * .2, .5, n, 60 - 6 * i))
    for n in (48, 55, 60, 64, 67, 74): tr['pad'].append((END_HIT, 3.1, n, 58))
    return tr, perc

def render_score():
    tr, perc = build_score(); r = rng(21)
    G = {'mar': (12, -3, -.25), 'xyl': (13, -11, .3), 'uke': (24, -6, .35), 'pizz': (45, -5, -.4), 'bass': (32, -3, 0), 'glock': (9, -12, .45), 'pad': (89, -14, 0), 'hit': (21, -11, 0)}
    mix = np.zeros((2, N)); stems = {}
    for k, (prog, g, pan) in G.items():
        if not tr[k]: continue
        y = sf_render(tr[k], prog); y = np.vstack([y[0] * (1 - .5 * max(pan, 0)) , y[1] * (1 + .5 * max(pan, 0))]) if pan >= 0 else np.vstack([y[0] * (1 - pan * .5), y[1] * (1 + pan * .5)])
        if k == 'bass': y = lp(y, 900, 2); y = np.vstack([y.mean(0)] * 2)
        stems[k] = y * DB(g); mix += stems[k]
    # percussion
    P = np.zeros((2, N)); cache = {}
    def snd(name, f, *a):
        if name not in cache: cache[name] = []
        cache[name].append(f(*a)); return cache[name][-1]
    for t, v in perc['kick']: add(P, st(s_kick(r), 0), t, DB(-4) * v / 100)
    for t, v in perc['clap']: add(P, st(s_clap(r), .15), t, DB(-6) * v / 90)
    for t, _ in perc['bigclap']: add(P, st(s_clap(r, True), 0), t, DB(-4)); add(P, st(s_clap(r, True), .2), t + .003, DB(-10))
    for t, v in perc['shake']: add(P, st(s_shake(r), r.uniform(-.5, .5)), t, DB(-8) * v / 50)
    for t, v in perc['wood']: add(P, st(s_wood(r), .3), t, DB(-13) * v / 55)
    mix += P * DB(-2)
    # ---- tension: riser under 24.0-25.3, silence (breath) 25.3-25.6
    rs = s_riser(rng(5), RISER1 - RISER0); riser = np.zeros((2, N)); add(riser, st(rs, 0), RISER0, DB(-8))
    # ---- score gating: muted 24.0 -> 25.64 except riser (notes already gated); fade tail of score into 24.0
    m = np.ones(N); t = np.arange(N) / SR
    m[(t >= 23.92) & (t < IMPACT)] = np.interp(t[(t >= 23.92) & (t < IMPACT)], [23.92, 24.05, IMPACT], [1, 0, 0])
    mix *= m
    # end card fade: whole score fades to exact silence by 40.0
    mix *= np.interp(t, [0, 0.05, 39.0, 40.0], [0, 1, .8, 0])
    return mix, riser, tr, perc

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
    score = peq(score, 2600, .8, -3.0); score = reverb(score, 1.0, .10)
    # SFX bus
    cues, nsc = merged_cues(); r = rng(77); sfx = np.zeros((2, N)); cache = {}; ncue = 0
    for i, (t, name, g, pan) in enumerate(cues):
        nm = name if name in SFX else ALIAS.get(name, 'pop')
        big = nm in ('cheer', 'goal', 'ding', 'impact')
        y = SFX[nm](rng(1000 + i)); lv = LEVEL[nm] + g
        add(sfx, st(y, pan), t, DB(lv)); ncue += 1
    # the hero impact at exactly 25.64 (+ crash) and breath handling
    hero = np.zeros((2, N)); add(hero, st(s_impact(rng(9)), 0), IMPACT, DB(-1)); add(hero, st(s_crash(rng(10)), .0), IMPACT, DB(-8))
    # exact TV power-on ding already in cue list. SFX go through a light space
    sfx = reverb(sfx, .7, .08)
    # breath: everything except VO muted 25.30-25.60 (near silent), tiny room tone
    t = np.arange(N) / SR; bm = np.ones(N)
    sel = (t > 25.22) & (t < IMPACT); bm[sel] = np.interp(t[sel], [25.22, 25.30, 25.60, 25.635, IMPACT], [1, .02, .02, .02, 1])
    sfx *= bm; score *= bm
    MG, SG = -6.0, -8.0
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
    print('  peak time: %.3f s' % (np.abs(y).max(axis=0).argmax() / SR), ' first-sample/last-sample abs: %.2e %.2e' % (np.abs(y[:, 0]).max(), np.abs(y[:, -1]).max()))
if __name__ == '__main__': main()
