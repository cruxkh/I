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
    if na: x[..., :na] *= np.linspace(0, 1, na)
    if nb: x[..., -nb:] *= np.linspace(1, 0, nb)
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

# ============================================================ 2026 short-form-video sound language (all synthesised sound-alikes, no samples, no hiss)
def saw_stack(f, n, dets=(-12, 0, 12), fc=None, nh=28):
    """band-limited detuned saw stack; f may be array (Hz per sample); fc lowpass shaping per sample (array or None)"""
    f = np.broadcast_to(np.asarray(f, float), (n,)); y = np.zeros(n)
    for c in dets:
        ph = np.cumsum(f * 2 ** (c / 1200)) / SR
        for h in range(1, nh):
            w = 1.0 / h
            if fc is not None: w = w * np.exp(-(h * f / fc) ** 2)
            else: w = w * (h * f[0] < 16000)
            y += np.sin(2 * np.pi * h * ph + c * .01) * w
    return y / len(dets)
def s_pop2(f):
    n = int(.14 * SR); t = np.arange(n) / SR
    fr = f * (.65 + .55 * (1 - np.exp(-t / .018)))
    y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / .04) + .25 * np.sin(2 * np.pi * np.cumsum(fr * 2) / SR) * np.exp(-t / .02)
    return fade(y * .9, .001, .02)
def s_notif(f=None):
    y = np.zeros(int(.75 * SR))
    for t0, m, g in ((0, 88, 1), (.13, 95, .85)):
        n = int(.55 * SR); t = np.arange(n) / SR; fq = mf(m)
        b = (np.sin(2 * np.pi * fq * t + .6 * np.exp(-t / .05) * np.sin(2 * np.pi * fq * 2 * t)) * np.exp(-t / .12)); y[int(t0 * SR):int(t0 * SR) + n] += b * g
    return fade(y * .5, .001, .05)
def s_boom(big=False, root=33, d=None):
    """vine-boom sound-alike: pitch-dropping 808 sub + saturated body + wood-ish punch (no noise)"""
    d = d or (2.4 if big else 1.0); n = int(d * SR); t = np.arange(n) / SR
    f = mf(root) * .5 + (mf(root) * 3.2) * np.exp(-t / .05) + 40 * np.exp(-t / .3) * 0
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (.55 if big else .26))
    body = np.sin(2 * np.pi * np.cumsum(mf(root + 12) * (1 + 1.4 * np.exp(-t / .03))) / SR) * np.exp(-t / .12) * .7
    punch = np.sin(2 * np.pi * 180 * (1 + 1.5 * np.exp(-t / .01)) * t) * np.exp(-t / .03) * .8
    y = np.tanh((sub * 1.5 + body + punch) * 1.8) * .8
    return fade(y, .0004, .06)
def s_braaam(f=55.0, d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    fr = f * (1 + .06 * np.exp(-t / .07)) * np.ones(n); fc = 350 + 2600 * np.exp(-((t - .08) / .12) ** 2) + 700 * np.exp(-t / .5)
    y = saw_stack(fr, n, (-14, 0, 14), fc, 40) + .8 * saw_stack(fr * 2, n, (-10, 10), fc, 30) + .4 * saw_stack(fr * 1.5, n, (0,), fc, 30)
    e = np.minimum(t / .012, 1) * np.exp(-t / (d * .42)); y = np.tanh(y * e * .8) * 1.0
    return fade(y * .6, .001, .08)
def s_swipe(f_land, up=True):
    y, hit = s_sweep(f_land, .34, up, False)
    c = s_click(); y[int(hit * SR):int(hit * SR) + len(c)] += c * .5
    return y, hit
def s_rdrop(f_land):
    """riser (tonal saw sweep + sub pulses) -> 0.3 s pre-drop silence -> 808 boom; returns audio with the boom at offset 0.9 s"""
    rd = .6; n = int(rd * SR); u = np.arange(n) / n
    fr = f_land * .5 * 2 ** (3 * u); fc = 300 + 6500 * u ** 1.3
    r = saw_stack(fr, n, (-12, 0, 12), fc, 30) * u ** 1.6 * .5; r[-int(.01 * SR):] *= np.linspace(1, 0, int(.01 * SR))
    out = np.zeros(int(.9 * SR) + int(2.2 * SR)); out[:n] += r * .8
    b = s_boom(True, 33, 2.2); out[int(.9 * SR):int(.9 * SR) + len(b)] += b[:len(out) - int(.9 * SR)]
    return out, .9
def s_tapestop(f=220.0, d=.6):
    n = int(d * SR); u = np.arange(n) / n; fr = f * (1 - u) ** 1.6 + 8
    y = saw_stack(fr, n, (-8, 8), 300 + 3000 * (1 - u) ** 2, 20) * np.exp(-u * 1.2)
    y += np.sin(2 * np.pi * np.cumsum(fr * .5) / SR) * .6
    return fade(y * .5, .002, .03)
def s_stutter(f=220.0):
    """glitch stutter of a chord slice that slows/pitches down, ending in a tape stop"""
    n = int(.6 * SR); src = np.zeros(int(.09 * SR)); t = np.arange(len(src)) / SR
    for m in (0, 3, 7): src += np.sin(2 * np.pi * f * 2 ** (m / 12) * t) * np.exp(-t / .05) + .4 * np.sin(2 * np.pi * f * 2 ** (m / 12) * 2 * t) * np.exp(-t / .03)
    out = np.zeros(int(1.0 * SR)); pos = 0.0
    for i in range(9):
        sp = .93 ** i; idx = np.arange(int(len(src) * .55 / sp)) * sp; sl = np.interp(idx, np.arange(len(src)), src); sl = fade(sl, .001, .004)
        k = int(pos * SR); out[k:k + len(sl)] += sl * (1 - i * .06); pos += .05 + .012 * i
    ts = s_tapestop(f * .6, .35) * .7; k = int(pos * SR); out[k:k + len(ts)] += ts[:len(out) - k]
    return fade(lp(out, 6000, 2) * .8, .001, .02)
def s_scratch():
    n = int(.42 * SR); t = np.arange(n) / SR
    fr = 420 * 2 ** (1.6 * np.sin(2 * np.pi * 5.0 * t) * np.exp(-t / .4)) + 60
    y = saw_stack(fr, n, (-6, 6), 2600, 18) * (np.abs(np.sin(2 * np.pi * 2.5 * t + .3)) ** .35) * np.exp(-t / .3)
    return fade(lp(y, 5000, 2) * .5, .002, .04)
def s_tada(f=None):
    out = np.zeros(int(1.6 * SR)); hit = .2
    for t0, notes, d in ((0, (67,), .13), (.1, (72,), .12), (hit, (72, 76, 79, 84), 1.2)):
        for m in notes:
            n = int(d * SR); fr = mf(m); tt = np.arange(n) / SR
            b = saw_stack(np.full(n, fr), n, (-10, 0, 10), 500 + 5000 * np.exp(-tt / .3), 24) * np.minimum(tt / .006, 1) * np.exp(-tt / (d * .6)); b = fade(b * .28, .001, .05)
            out[int(t0 * SR):int(t0 * SR) + n] += b
    b = fmbell(mf(96), 1.2) * .3; k = int(hit * SR); out[k:k + len(b)] += b[:len(out) - k]
    return out, hit
def s_tvon(f=None):
    n = int(.5 * SR); t = np.arange(n) / SR
    fr = 350 * (2600 / 350) ** np.minimum(t / .09, 1); y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / .16) * np.minimum(t / .004, 1)
    y += .3 * np.sin(2 * np.pi * np.cumsum(fr * 2) / SR) * np.exp(-t / .08); k = int(.11 * SR); b = fmbell(mf(100), .5)[:n - k]; y[k:k + len(b)] += b * .35
    return fade(y * .6, .001, .05)
def snd(nm, r, f):
    if nm == 'pop': return s_pop2(f), 0
    if nm == 'notif': return s_notif(), 0
    if nm == 'slap': return s_boom(False, 33, .35), 0
    if nm in ('stamp', 'thump'): return s_boom(False, 33, 1.0), 0
    if nm == 'slam': return s_boom(True, 33, 1.8), 0
    if nm == 'braaam': return s_braaam(55.0 if f < 900 else 110.0, 1.0), 0
    if nm == 'tick': return s_tick(), 0
    if nm == 'snip': return s_snip(), 0
    if nm == 'flip': return s_swipe(f * .5, False)
    if nm == 'shutter': return s_shutter(), 0
    if nm == 'click': return s_click(), 0
    if nm == 'tvon': return s_tvon(), 0
    if nm == 'cheer': return s_cheer(r, 2.6, .55), 0
    if nm == 'goal': return s_cheer(r, 3.0, .5, True), 0
    if nm == 'whoosh': return s_swipe(f * .5, True)
    if nm == 'whoosh_s': return s_thwip(f * .5)
    if nm == 'rdrop': return s_rdrop(f * .5)
    if nm == 'tapestop': return s_tapestop(), 0
    if nm == 'stutter': return s_stutter(), 0
    if nm == 'scratch': return s_scratch(), 0
    if nm == 'tada': return s_tada()
    if nm == 'impact': return s_impact2(), 0
    return s_pop2(f), 0
def s_impact2():
    b = s_boom(True, 33, 3.2); y = b.copy(); y *= 1.0
    br = s_braaam(55.0, 1.4); y[:len(br)] += br * .55
    for i, m in enumerate((69, 81, 88)):
        bb = fmbell(mf(m), 2.4) * .12; y[:len(bb)] += bb
    return np.tanh(y * .9)
LEVEL = {'pop': -10, 'notif': -11, 'slap': -13, 'stamp': -10, 'slam': -9, 'thump': -11, 'braaam': -10, 'tick': -12, 'snip': -13, 'flip': -8, 'shutter': -10, 'click': -10, 'tvon': -8,
         'cheer': -10, 'goal': -8, 'whoosh': -8, 'whoosh_s': -9, 'rdrop': -8, 'tapestop': -8, 'stutter': -7, 'scratch': -9, 'tada': -7, 'impact': 0}
ALIAS = {'sting': 'tada', 'peel': 'flip', 'wipe': 'whoosh', 'swipe': 'whoosh', 'tear': 'tick', 'rip': 'tick', 'tape': 'tick', 'marker': 'pop', 'scribble': 'pop', 'squeak': 'pop',
         'scissors': 'snip', 'cut': 'snip', 'camera': 'shutter', 'crowd': 'cheer', 'tv': 'tvon', 'remote': 'click', 'button': 'click', 'paper': 'pop', 'rustle': 'pop', 'ding': 'notif',
         'page': 'flip', 'boom': 'slam', 'hit': 'slap', 'drop': 'slap', 'slide': 'whoosh', 'zoom': 'whoosh_s', 'sticker': 'pop', 'logo': 'braaam', 'reveal': 'braaam', 'crash': 'impact'}
FORCE_BRAAAM = (3.58, 7.02, 37.08)          # big reveals: Netflix, GOTV logo, end card
RDROPS = (8.6, 15.4, 20.3)                  # big transitions: riser -> 0.3 s silence -> drop
GAP = .3
def base_cues():
    C = []
    def c(t, n, g=0, pan=0.0): C.append((t, n, g, pan))
    for t, n in ((4.77, 'whoosh'), (8.6, 'rdrop'), (11.6, 'whoosh_s'), (15.4, 'rdrop'), (20.3, 'rdrop'), (29.75, 'whoosh')): c(t, n)
    for t, n, p in ((0.77, 'pop', -.3), (1.34, 'pop', .3), (1.98, 'slam', 0), (2.46, 'pop', 0), (3.18, 'pop', -.2), (3.58, 'braaam', .2), (4.28, 'tada', 0), (4.64, 'shutter', 0)): c(t, n, 0, p)
    for t, n, p in ((4.975, 'slap', -.3), (5.16, 'pop', .3), (5.63, 'pop', -.2), (5.86, 'pop', .2), (6.69, 'slap', -.3), (7.02, 'braaam', .3), (7.69, 'slap', .3), (8.2, 'pop', -.3), (8.55, 'pop', .3)): c(t, n, 0, p)
    for t, n, p in ((9.02, 'slap', -.4), (9.26, 'pop', -.2), (9.68, 'pop', .2), (10.2, 'slap', .3), (10.44, 'pop', -.3), (10.66, 'stamp', 0), (11.1, 'slam', .2), (11.3, 'pop', .3)): c(t, n, 0, p)
    for t, n, p in ((12.0, 'slap', 0), (12.39, 'pop', -.4), (13.095, 'pop', .4), (13.99, 'pop', -.3), (14.53, 'pop', .3), (14.8, 'pop', -.2), (15.11, 'snip', .2)): c(t, n, 0, p)
    for t, n, p in ((15.79, 'slap', 0), (16.1, 'notif', .3), (16.72, 'slap', -.3), (17.14, 'tick', .3), (17.61, 'tick', -.2), (17.97, 'tick', .2), (18.17, 'notif', -.3),
                    (18.8, 'slap', 0), (19.39, 'pop', -.3), (19.54, 'pop', .2), (19.77, 'stamp', .3), (20.05, 'pop', 0)): c(t, n, 0, p)
    for t, n, p in ((20.68, 'slap', 0), (21.08, 'whoosh_s', -.3), (21.49, 'pop', .3), (22.22, 'whoosh_s', .3), (22.72, 'pop', -.3), (23.14, 'whoosh_s', .3), (24.01, 'click', 0)): c(t, n, 0, p)
    c(26.52, 'stamp', -2); c(27.19, 'stutter', 0); c(27.41, 'pop', 0, .2); c(27.99, 'pop', 0, -.2); c(28.53, 'pop', 0, .2)
    c(27.5, 'cheer', -3); c(28.7, 'goal', -3); c(29.25, 'pop', 0)
    c(30.12, 'slap', 0); c(30.6, 'click', -1); c(31.0, 'tvon', 0); c(31.12, 'pop', 0)
    for t, p in ((32.05, -.3), (32.22, .3), (32.53, -.2), (32.86, .3), (33.44, -.3), (33.99, .3), (34.36, -.2), (34.63, .2), (35.21, -.3), (35.63, .3), (36.18, -.2)): c(t, 'pop', -2, p)
    c(36.39, 'scratch', 0); c(36.5, 'snip', -4)
    return C
KW = [('slam', 'slam'), ('stamp', 'stamp'), ('goal', 'goal'), ('cheer', 'cheer'), ('crowd', 'cheer'), ('flip', 'flip'), ('peel', 'flip'), ('snip', 'snip'), ('scissor', 'snip'),
      ('freeze', 'stutter'), ('buffer', 'stutter'), ('stutter', 'stutter'), ('cross', 'scratch'), ('check', 'tada'), ('calendar', 'tick'), ('day ', 'tick'),
      ('rip', 'tick'), ('tear', 'tick'), ('tape', 'tick'), ('shutter', 'shutter'), ('camera', 'shutter'),
      ('ding', 'notif'), ('click', 'click'), ('press', 'click'), ('whoosh', 'whoosh'), ('wipe', 'whoosh'), ('fly', 'whoosh'), ('avalanche', 'whoosh'), ('wave', 'whoosh'),
      ('drop', 'slap'), ('slap', 'slap'), ('thump', 'thump'), ('burst', 'pop'), ('confetti', 'pop'), ('pop', 'pop'), ('flash', 'pop'), ('logo', 'braaam')]
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
                kd = 'braaam' if any(abs(t - x) < .06 for x in FORCE_BRAAAM) else kind_of(m.group(2))
                if any(abs(t - x) < .06 for x in RDROPS): kd = 'rdrop' if kd in ('whoosh', 'pop', 'slap') else kd
                out.append((t, kd, 0.0, 0.0, os.path.basename(f)))
    return out
def merged_cues():
    base = base_cues(); sc = scene_cues(); keep = [b for b in base if not any(abs(b[0] - s[0]) < .05 for s in sc)]
    return sorted(keep + [(t, n, g, p) for t, n, g, p, _ in sc]), len(sc)

# ------------------------------------------------------------ score: 2026 hit-radio / short-form production (original)
# key A minor, Am F C G (vi IV I V feel), resolves to C major; 4-note topline hook (original).  ~112 bpm (21 beats = 25.64 -> 36.9)
TRI = {'Am': [57, 60, 64], 'F': [53, 57, 60], 'C': [55, 60, 64], 'G': [55, 59, 62], 'E': [52, 56, 59]}
BR = {'Am': 33, 'F': 29 + 12, 'C': 36, 'G': 31 + 12}      # 808 roots (F and G taken up an octave so the line stays smooth)
HOOK = {'Am': [(0, 81, 3), (3, 79, 3), (6, 76, 4), (10, 79, 2)], 'F': [(0, 81, 3), (3, 84, 3), (6, 81, 4), (10, 77, 2)],
        'C': [(0, 79, 3), (3, 76, 3), (6, 79, 4), (10, 84, 2)], 'G': [(0, 83, 3), (3, 81, 3), (6, 79, 4), (10, 74, 4)]}
def harm(k):
    if 16 <= k < 18: return 'F'
    if 18 <= k < 21: return 'G'
    if k >= 21: return 'C'
    return ['Am', 'F', 'C', 'G'][(k // 4) % 4]
T_VERSE, T_PRE = 9.0, 20.3
def sec(t):
    if t < T_VERSE: return 'I'
    if t < T_PRE: return 'V'
    if t < RISER0: return 'P'
    if t < IMPACT - .001: return 'S'
    return 'D'
def humanize(rr, t, v, j=.004): return t + rr.uniform(-j, j), int(np.clip(v + rr.integers(-5, 6), 20, 127))
def g16(k, s): return bt(k + s / 4 + (0.03 if s % 2 else 0))

def build_score():
    rr = rng(11); tr = {k: [] for k in ('pad', 'ep', 'glock', 'lead', 'chop', 'b808', 'arp')}
    dr = {k: [] for k in ('kick', 'snare', 'clap', 'bigclap', 'hat', 'ohat', 'rim', 'shake')}
    KICK = {'I': {0, 10}, 'V': {0, 3, 7, 10}, 'P': {0, 4, 8, 12}, 'D': {0, 3, 6, 10, 13}}
    prev = None
    for k in range(-47, 22):
        t = bt(k); ch = harm(k); tri = TRI[ch]; pb = k % 4
        if t >= END_HIT - .02 or bt(k + 1) <= 0: continue
        for s in range(4):
            tt = g16(k, s)
            if tt < 0.02 or tt >= END_HIT - .02 or (RISER0 - .03 <= tt < IMPACT - .01): continue
            S = sec(tt); p = pb * 4 + s
            if p in KICK[S]: dr['kick'].append((tt, 110 if p == 0 else 92))
            if S == 'I':
                if p == 8: dr['clap'].append((tt, 80))
                if p == 12: dr['rim'].append((tt, 70))
            elif p in (4, 12):
                dr['clap'].append((tt, 100)); dr['snare'].append((tt, 90 if S in ('V', 'P') else 100))
            if S == 'D' and p in (7, 15): dr['rim'].append((tt, 80))
            if S == 'V' and p == 14: dr['rim'].append((tt, 60))
            if S == 'I': hv = 42 if s in (0, 2) else 0
            elif S == 'V': hv = (64 if s == 0 else 50 if s == 2 else 28)
            else: hv = (68 if s == 0 else 54 if s == 2 else 32)
            if hv: dr['hat'].append((tt, hv))
            if S in ('V', 'P', 'D') and p in ((6, 14) if S != 'V' else (14,)): dr['ohat'].append((tt, 60))
            if S in ('D',) : dr['shake'].append((tt, 30))
        # hat rolls / triplet fills on the last beat of a bar (verse: every 2nd bar, drop: every bar)
        S = sec(t)
        if pb == 3 and S in ('V', 'P', 'D') and t + B < END_HIT - .3 and (S == 'D' or (k // 4) % 2 == 1) and t + B < RISER0 - .05:
            n_ = 6 if (k // 4) % 2 == 0 else 8
            for i in range(n_): dr['hat'].append((bt(k + i / n_), 30 + 50 * i / n_))
        # 808: rhythm follows the kick; slides on the last note of a bar
        if S in ('I', 'V', 'D') and t < END_HIT - .3:
            root = BR[ch]
            pat = {'I': [(0, 0, 10, 100)], 'V': [(0, 0, 3, 110), (3, 0, 3, 95), (7, 7 if False else 0, 2, 92), (10, 12, 4, 98)], 'D': [(0, 0, 3, 118), (3, 0, 2, 100), (6, 0, 3, 104), (10, 0, 2, 110), (13, 12, 3, 100)]}[S]
            for p0, iv, ln, v in pat:
                if p0 // 4 != 0 and False: pass
                kk = k + p0 / 16 * 4 if False else None
            # patterns are per bar: place on bar starts only
            if pb == 0:
                for p0, iv, ln, v in pat:
                    tt = g16(k + p0 // 4, p0 % 4)
                    if tt >= END_HIT - .3 or (RISER0 - .03 <= tt < IMPACT): continue
                    tr['b808'].append((tt, ln * B / 4 * .95, root + iv, v, prev))
                    prev = root + iv
        # pads (sidechained later) + electric piano stabs
        if pb == 0 and S in ('I', 'V', 'P', 'D') and k < 21 and not (RISER0 - .1 <= t < IMPACT):
            for n in [x - 12 for x in tri] + [tri[1] + 12]: tr['pad'].append((t - .02, 4 * B * 1.03, n, 50 if S == 'I' else 60))
        if S in ('V', 'D') and pb in (0, 2) and t < END_HIT - .3:
            for i, n in enumerate(tri):
                tm, v = humanize(rr, g16(k, 3) if False else bt(k + .75), 70); tr['ep'].append((tm, .22, n + 12, v))
                tm, v = humanize(rr, bt(k + 2.5 if pb == 0 else k + .75) if False else bt(k + .75), 60)
        # topline hook (original 4-note figure): plucky synth lead; intro = quiet tease every 2nd bar
        if pb == 0 and t < END_HIT - .3 and not (RISER0 - .1 <= t < IMPACT):
            S = sec(t)
            if S in ('V', 'D') or (S == 'I' and (k // 4) % 2 == 0) or S == 'P':
                for st16, n, ln in HOOK[ch]:
                    tt = g16(k + st16 // 4, st16 % 4)
                    if tt >= END_HIT - .3: continue
                    if S == 'P' and st16 not in (0, 6): continue
                    tm, v = humanize(rr, tt, 96 if S == 'D' else 84, .003)
                    tr['lead'].append((tm, ln * B / 4 * 1.1, n + (12 if S == 'D' and k % 8 >= 4 else 0), v))
                    if S == 'D': tr['glock'].append((tm, ln * B / 4, n + 12, 70))
                # vocal-chop style formant stabs on the off-beats
                if S in ('V', 'D', 'I') and t < END_HIT - .3:
                    for st16, m_ in ((6, 1), (11, 2)) if S != 'I' else ((11, 2),):
                        tt = g16(k + st16 // 4, st16 % 4); tr['chop'].append((tt, .16, tri[m_ % 3] + 24, 80))
    # pre-chorus lift: 8th-note rising Am arpeggio into the suspense, then the suspense arpeggio (24.0-25.3) accelerating
    t = 22.4; g = .27; i = 0; ar = (69, 72, 76, 81)
    while t < 24.0: tr['arp'].append((t, .1, ar[i % 4] + 12 * (i // 4 % 2), 70 + min(40, i * 3))); t += g; g = max(.09, g * .93); i += 1
    t = 24.0; g = .16; i = 0
    while t < 25.27: tr['arp'].append((t, .06, ar[i % 4] + 12 * (1 + i // 4), 80 + min(40, i * 3))); t += g; g = max(.035, g * .88); i += 1
    t = 24.0; gp = .16; vel = 30                                             # snare roll
    while t < 25.27: dr['snare'].append((t, vel)); t += gp; gp = max(.04, gp * .9); vel = min(118, vel + 6)
    t = 22.6; gp = .27; vel = 25
    while t < 23.96: dr['snare'].append((t, vel)); t += gp; gp = max(.07, gp * .9); vel = min(90, vel + 6)
    # the DROP (25.64) and final resolve (36.9)
    dr['kick'].append((IMPACT, 118)); dr['bigclap'].append((IMPACT, 0)); dr['snare'].append((IMPACT, 110))
    tr['b808'].append((IMPACT, 1.3, 33, 127, None))
    for n in (57, 60, 64, 69): tr['ep'].append((IMPACT, .5, n, 110))
    tr['b808'].append((END_HIT, 2.2, 36, 127, None)); dr['kick'].append((END_HIT, 120)); dr['bigclap'].append((END_HIT, 0)); dr['snare'].append((END_HIT, 110))
    for n in (60, 64, 67, 72, 76): tr['ep'].append((END_HIT, 1.5, n, 118)); tr['lead'].append((END_HIT, 1.4, n + 12, 100)); tr['pad'].append((END_HIT, 3.1, n - 12, 64))
    for n in (84, 88, 91): tr['glock'].append((END_HIT + .01, 1.5, n, 100))
    # warm outro: hook fragment on soft pluck + glock over pad (C major), dies away by 40
    for kk, n, ln, v in ((22.0, 79, 1.0, 60), (23.0, 76, 1.0, 54), (24.0, 72, 4.0, 50)):
        tr['glock'].append((bt(kk), ln * B, n + 12, v)); tr['lead'].append((bt(kk), ln * B, n, v - 14))
    for n in (48, 55, 60, 64, 67, 71): tr['pad'].append((END_HIT + .1, 3.0, n, 56))
    return tr, dr

def synth_notes(notes, fn, gain=1.0):
    y = np.zeros((2, N + 2 * SR))
    for tt, d, n, v in notes:
        if tt < 0 or tt >= TOTAL: continue
        x = fn(mf(n), d, v / 127.0)
        i = int(tt * SR); y[:, i:i + x.shape[-1]] += x[:, :y.shape[1] - i]
    return y[:, :N] * gain
def n_lead(f, d, v):
    L = int((d + .35) * SR); t = np.arange(L) / SR
    fc = 900 + 5200 * np.exp(-t / .12) * v; y = []
    for dets in ((-9, 4), (9, -4)):
        s_ = saw_stack(np.full(L, f), L, dets, fc, 26)
        y.append(s_)
    e = np.minimum(t / .004, 1) * np.exp(-t / (max(d, .12) * .8 + .08)) * np.where(t < d, 1, np.exp(-(t - d) / .05))
    return fade(np.vstack(y) * e * v * .5, 0, .02)
def n_arp(f, d, v):
    L = int(.2 * SR); t = np.arange(L) / SR; s_ = saw_stack(np.full(L, f), L, (-8, 8), 400 + 4500 * np.exp(-t / .04), 22)
    y = s_ * np.exp(-t / .06) * v * .5; return np.vstack([y, y])
def n_chop(f, d, v):
    """vocal-chop sound-alike: formant-filtered saw (ah -> oh), pitched, airy top, gated"""
    L = int((d + .06) * SR); t = np.arange(L) / SR; s_ = saw_stack(np.full(L, f), L, (-6, 6), None, 30)
    a = bp(s_, 700, 1100, 2) * 1.0 + bp(s_, 1000, 1700, 2) * .7 + bp(s_, 2400, 3300, 2) * .3
    y = a * np.minimum(t / .008, 1) * np.where(t < d, 1, np.exp(-(t - d) / .03)); y = fade(y * v * .55, 0, .01)
    return np.vstack([y, y * .8])
def n_808(f, d, v, f_prev=None):
    L = int((d + .15) * SR); t = np.arange(L) / SR
    fs = f + 2.2 * f * np.exp(-t / .025)
    if f_prev: fs = np.where(t < .07, f_prev + (f - f_prev) * (t / .07), fs)
    ph = np.cumsum(fs) / SR; y = np.sin(2 * np.pi * ph)
    y = np.tanh(y * (1.8 + 1.0 * v)) * .85 + .15 * np.sin(4 * np.pi * ph)
    e = np.minimum(t / .003, 1) * np.where(t < d, np.exp(-t / (d * 1.1 + .25)), np.exp(-d / (d * 1.1 + .25)) * np.exp(-(t - d) / .05))
    y = y * e * v; return np.vstack([y, y])
def d_snare2(r):
    n = int(.22 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 210 * (1 + .4 * np.exp(-t / .01)) * t) * np.exp(-t / .05) * .8 + bp(r.standard_normal(n), 2200, 7500, 2) * np.exp(-t / .045) * .5
    return fade(lp(np.tanh(y * 1.4), 11000, 2), 0, .02)
def d_rim(r):
    n = int(.06 * SR); t = np.arange(n) / SR
    return fade((np.sin(2 * np.pi * 1750 * t) * np.exp(-t / .006) + .6 * np.sin(2 * np.pi * 480 * t) * np.exp(-t / .012)) * .8, 0, .005)
def d_kick2(r=None):
    n = int(.36 * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * np.cumsum(48 + 130 * np.exp(-t / .022)) / SR) * np.exp(-t / .16) + .3 * np.sin(2 * np.pi * 2200 * t) * np.exp(-t / .0015)
    return fade(np.tanh(y * 1.5) * .9, .0005, .02)

def render_score():
    tr, dr = build_score(); r = rng(21); t = np.arange(N) / SR
    kt = [tk for tk, _ in dr['kick']]; sc = np.ones(N)
    for tk in kt:
        i = int(tk * SR); m = int(.3 * SR)
        if i >= N: continue
        x = np.arange(min(m, N - i)) / SR; sc[i:i + len(x)] = np.minimum(sc[i:i + len(x)], 1 - .6 * np.exp(-x / .11) * np.minimum(x / .004, 1))
    def scd(y, a=1.0): return y * (1 - a * (1 - sc))
    pad = widen(sf_render(tr['pad'], 89), 22) * DB(-11); pad = scd(pad, 1.0)
    ep = pan_st(sf_render(tr['ep'], 4), -.25) * DB(-11); ep = scd(ep, .7)
    gl = pan_st(sf_render(tr['glock'], 9), .4) * DB(-13)
    lead = synth_notes(tr['lead'], n_lead, DB(-5)); lead = scd(widen(lead, 10), .35)
    arp = synth_notes(tr['arp'], n_arp, DB(-8)); chop = pan_st(synth_notes(tr['chop'], n_chop, DB(-6)), .2)
    b8 = np.zeros((2, N + 2 * SR))
    for tt, d, n, v, prv in tr['b808']:
        x = n_808(mf(n), d, v / 127, mf(prv) if prv else None); i = int(tt * SR); b8[:, i:i + x.shape[1]] += x[:, :b8.shape[1] - i]
    b8 = b8[:, :N] * DB(-6); b8 = scd(b8, 1.0)
    P = np.zeros((2, N))
    for tk, v in dr['kick']: add(P, st(d_kick2(), 0), tk, DB(-3) * v / 110)
    for tk, v in dr['snare']: add(P, st(d_snare2(r), .05), tk, DB(-8) * v / 100)
    for tk, v in dr['clap']: add(P, st(d_clap(r), .2), tk, DB(-9) * v / 100)
    for tk, _ in dr['bigclap']: add(P, st(d_clap(r, True), 0), tk, DB(-5))
    for tk, v in dr['hat']: add(P, st(d_hat(r), r.uniform(.1, .4)), tk, DB(-8) * v / 60)
    for tk, v in dr['ohat']: add(P, st(d_hat(r, True), -.3), tk, DB(-10) * v / 60)
    for tk, v in dr['rim']: add(P, st(d_rim(r), .3), tk, DB(-11) * v / 80)
    for tk, v in dr['shake']: add(P, st(d_shake(r), r.uniform(-.5, .5)), tk, DB(-15) * v / 38)
    P = lp(P, 12000, 2)
    tones = pad + ep + gl + lead + chop; tones = peq(tones, 2800, .8, -1.5)
    # intro tease: filtered, opening up toward the verse at 9.0 s
    lo = lp(tones, 900, 2); mid = lp(tones, 2400, 2); w = np.clip(t / T_VERSE, 0, 1)
    tones = np.where(t < T_VERSE, np.where(w < .55, lo, np.where(w < .9, mid, tones)), tones)
    m = np.ones(N); s_ = (t >= 23.98) & (t < IMPACT); m[s_] = 0                      # suspense: pads/808/hook off, only arp + snare roll + riser
    mel = reverb(tones, 1.3, .16, seed=5) * m + reverb(arp * 1.0, .5, .1, seed=8); P = reverb(P, .35, .05, seed=6); b8 = lp(b8, 6000, 2) * m
    mix = mel + P + b8
    mix *= np.interp(t, [0, 0.05, 39.0, 40.0], [0, 1, .8, 0])
    mix = comp(mix, -22, 2.4, .012, .16, 2.0); mix = np.tanh(mix * 1.1) / 1.1
    rs = s_riser(RISER1 - RISER0); riser = np.zeros((2, N)); add(riser, st(rs, 0), RISER0, DB(-6))
    return mix, riser, tr, dr


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
    cues, nsc = merged_cues(); r = rng(77); sfx = np.zeros((2, N)); ncue = 0; SEQ = [0, 1, 2, 3, 2, 1]; gaps = []
    for i, (t_, name, g, pan) in enumerate(cues):
        nm = name if name in LEVEL else ALIAS.get(name, 'pop')
        k = int(round((t_ - IMPACT) / B)); tones = TRI[harm(k)] + [TRI[harm(k)][0] + 12]; f = mf(tones[SEQ[i % 6]] + 12)
        if nm == 'rdrop': gaps.append(t_)
        y, hit = snd(nm, rng(1000 + i), f)
        add(sfx, st(y, pan), t_ - hit, DB(LEVEL[nm] + g)); ncue += 1
    hero = np.zeros((2, N)); add(hero, st(s_impact2(), 0), IMPACT, DB(-1))
    sfx = reverb(sfx, .7, .08); sfx = lp(hp(sfx, 45, 2), 12000, 4); hero = lp(hero, 12000, 2)
    t = np.arange(N) / SR; bm = np.ones(N)
    sel = (t > 25.22) & (t < IMPACT); bm[sel] = np.interp(t[sel], [25.22, 25.30, 25.60, 25.635, IMPACT], [1, .02, .02, .02, 1])
    sfx *= bm; score *= bm
    gm = np.ones(N)                                        # 0.3 s pre-drop silence before each riser->drop, and glitch-stutter gate on the score while the wheel freezes
    for tg in gaps: s_ = (t >= tg - GAP) & (t < tg); gm[s_] = np.minimum(gm[s_], np.interp(t[s_], [tg - GAP, tg - GAP + .01, tg - .004, tg], [1, 0, 0, 1]) * 0 + (t[s_] < tg - .004) * 0.0 + 0.0)
    gm = uniform_filter1d(gm, 240); score *= gm
    s_ = (t >= 27.19) & (t < 27.8); gg = np.ones(N); gg[s_] = ((np.sin(2 * np.pi * 16.7 * t[s_]) > 0) * 1.0) * (t[s_] < 27.6); score *= gg
    for tg in gaps: s_ = (t >= tg - GAP) & (t < tg - .0001); sfx[:, s_] *= 0.0
    MG, SG = -5.0, -6.0
    lift = np.interp(t, [0, 9, 20, 20.3, 36.8, 36.95, 40], [6, 6, 3, 3, 0, 8, 8])   # dB: quiet early sections up, end card up (no VO)
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
