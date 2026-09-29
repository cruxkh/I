#!/usr/bin/env python3
"""37 s Hebrew streaming-app ad: original music generator (reproducible).

Renders audio/music/music.wav (48 kHz stereo, exactly 37.000 s, peak -3 dBFS) plus stems in
audio/music/stems/{drums,bass,harmony,lead,fx}.wav and audio/music/hits.json.

Sources: GeneralUser GS SoundFont via tinysoundfont (celesta, glock, marimba, harp, pizz, pads, brass,
orchestral hit, timpani, taiko, guitar) + numpy synthesis (drums, bass, plucks, supersaw, risers, booms,
oud (Karplus-Strong), darbuka). Master: EQ dip at 2.5 kHz for VO room, bus compressor, look-ahead limiter;
the same gain curve is applied to every stem so stems sum to the master.

Key map: C major (0-25.5), D major (25.6-37: the "goal" key lift).  Beat 0.5 s (120 BPM); sections
that must land on VO hits use a slightly different local beat (noted where used).
"""
import json
import os
import sys

import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MUS = os.path.join(ROOT, 'audio', 'music')
SF2 = os.path.join(MUS, 'sf', 'GeneralUser-GS.sf2')
SR = 48000
DUR = 37.0
N = int(round(SR * DUR))
rng = np.random.default_rng(3705)
STEMS = ['drums', 'bass', 'harmony', 'lead', 'fx']
ST = {k: np.zeros((N, 2)) for k in STEMS}
SEND = {k: np.zeros((N, 2)) for k in STEMS}
KICKS = []          # (t, depth) for sidechain pump
HITS = {}
MUTE = []           # (t0, t1): groove drums skipped (stings)

# ------------------------------------------------------------------ utils
NOTE_IDX = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def m(name):
    if isinstance(name, (int, np.integer)):
        return int(name)
    p = NOTE_IDX[name[0]]
    i = 1
    while i < len(name) and name[i] in '#b':
        p += 1 if name[i] == '#' else -1
        i += 1
    return p + 12 * (int(name[i:]) + 1)


def mtof(n):
    return 440.0 * 2 ** ((np.asarray(n, float) - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, min(f, SR * .45), 'low', fs=SR, output='sos'), x)


def hp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, o=2):
    return signal.sosfilt(signal.butter(o, [lo, min(hi, SR * .45)], 'band', fs=SR, output='sos'), x)


def sweep(x, f0, f1, kind='low', blk=512):
    """time-varying filter (exp sweep f0->f1) with carried state"""
    n = len(x)
    out = np.empty(n)
    zi = None
    nb = (n + blk - 1) // blk
    for i in range(nb):
        f = f0 * (f1 / f0) ** ((i + .5) / nb)
        if kind == 'band':
            sos = signal.butter(2, [f * .7, min(f * 1.5, SR * .45)], 'band', fs=SR, output='sos')
        else:
            sos = signal.butter(2, min(f, SR * .45), kind, fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y, zi = signal.sosfilt(sos, x[i * blk:(i + 1) * blk], zi=zi)
        out[i * blk:(i + 1) * blk] = y
    return out


def panl(x, pan):
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a) * 1.4142, x * np.sin(a) * 1.4142], 1)


def put(stem, sig, t, g=1.0, pan=0.0, rev=0.0):
    sig = np.asarray(sig, float)
    if sig.ndim == 1:
        sig = panl(sig, pan)
    a = int(round(t * SR))
    if a >= N or a + len(sig) <= 0:
        return
    s0 = max(0, -a)
    e = min(N, a + len(sig))
    seg = sig[s0:s0 + e - max(a, 0)] * g
    ST[stem][max(a, 0):e] += seg
    if rev:
        SEND[stem][max(a, 0):e] += seg * rev


def db(x):
    return 10 ** (x / 20)


# ------------------------------------------------------------------ drum / fx synth
def kick(v=1.0, f0=48, body=0.17):
    t = tt(0.45)
    f = f0 + 125 * np.exp(-t / 0.028)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / body)
    y += 0.3 * hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.004)
    y = np.tanh(1.8 * y) / 1.3
    y[-300:] *= np.linspace(1, 0, 300)
    return y * v


def snare(decay=0.11, v=1.0, tone=190):
    t = tt(0.32)
    nz = bp(rng.standard_normal(len(t)), 1800, 9500) * np.exp(-t / decay)
    tn = np.sin(2 * np.pi * (tone + 70 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.06)
    y = 0.85 * nz + 0.55 * tn
    y[-200:] *= np.linspace(1, 0, 200)
    return y * v


def clap(v=1.0, tail=0.09):
    t = tt(0.4)
    nz = bp(rng.standard_normal(len(t)), 1100, 6000)
    env = np.zeros(len(t))
    for o in (0, .011, .023, .036):
        k = t >= o
        env[k] += np.exp(-(t[k] - o) / 0.004) * 0.7
    k = t >= 0.036
    env[k] += np.exp(-(t[k] - 0.036) / tail)
    y = nz * env
    y[-300:] *= np.linspace(1, 0, 300)
    return y * 0.9 * v


def hat(open_=False, v=1.0):
    t = tt(0.35 if open_ else 0.1)
    y = hp(rng.standard_normal(len(t)), 7000) * np.exp(-t / (0.11 if open_ else 0.028))
    y[-100:] *= np.linspace(1, 0, 100)
    return y * v


def shaker(v=1.0):
    t = tt(0.09)
    y = bp(rng.standard_normal(len(t)), 4500, 11000) * np.minimum(t / .012, 1) * np.exp(-t / .03)
    return y * v


def tick(f=1900, v=1.0, dec=0.012):
    t = tt(0.12)
    y = (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.4 * t)) * np.exp(-t / dec)
    y += .3 * hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / .003)
    return y * v


def tom(f=110, v=1.0, dec=0.22):
    t = tt(0.5)
    y = np.sin(2 * np.pi * np.cumsum(f * (1 + .5 * np.exp(-t / .04))) / SR) * np.exp(-t / dec)
    y += .2 * hp(rng.standard_normal(len(t)), 2000) * np.exp(-t / .004)
    return np.tanh(1.4 * y) * v * .8


def crash(dur=2.4, v=1.0, dec=0.7):
    t = tt(dur)
    y = hp(rng.standard_normal(len(t)), 3500, 3) * np.exp(-t / dec)
    for fr in (5230, 6710, 8330, 9770):
        y += .05 * np.sin(2 * np.pi * fr * t + rng.uniform(0, 6)) * np.exp(-t / (dec * 1.2))
    y[-400:] *= np.linspace(1, 0, 400)
    return y * v * .7


def rev_crash(dur=1.2, v=1.0):
    y = crash(dur * 1.6, 1.0, dec=dur * .55)[::-1][:int(dur * SR)].copy()
    y *= np.linspace(0, 1, len(y)) ** 1.2
    return y * v


def sub_boom(dur=1.6, f0=70, f1=27, v=1.0, dec=0.7):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.35)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / dec)
    y += .4 * lp(rng.standard_normal(len(t)), 220) * np.exp(-t / .12)
    y = np.tanh(1.3 * y)
    y[-500:] *= np.linspace(1, 0, 500)
    return y * v


def saw(f, n=None, ph0=0.0):
    f = np.asarray(f, float)
    ph = (ph0 + np.cumsum(f) / SR) % 1.0 if f.ndim else (ph0 + f * np.arange(n) / SR) % 1.0
    return 2 * ph - 1


def supersaw(freqs, dur, cutoff=3000, a=0.02, r=0.4, det=(-15, -7, 0, 7, 15), v=1.0):
    n = int((dur + r) * SR)
    y = np.zeros(n)
    for f in freqs:
        for d in det:
            y += saw(f * 2 ** (d / 1200), n, rng.random())
    y /= len(freqs) * len(det) / 2.5
    env = np.ones(n)
    na = max(1, int(a * SR))
    env[:na] = np.linspace(0, 1, na)
    nd = int(dur * SR)
    env[nd:] = np.exp(-np.arange(n - nd) / (r * SR / 4))
    return lp(y, cutoff) * env * v


def pluck(f, dur=0.3, v=1.0, bright=6000):
    n = int((dur + .1) * SR)
    t = np.arange(n) / SR
    y = saw(f, n, rng.random()) + saw(f * 1.004, n, rng.random()) * .8 + .5 * np.sign(np.sin(2 * np.pi * f * t))
    dark = lp(y, max(f * 1.5, 500))
    bri = lp(y, min(bright, f * 10))
    y = dark + bri * np.exp(-t / 0.07) * 1.3
    env = np.minimum(t / 0.002, 1) * np.exp(-t / (dur * .55))
    env[-int(.05 * SR):] *= np.linspace(1, 0, int(.05 * SR))
    return y * env * v * .35


def bass(f, dur, v=1.0, f_end=None, glide=0.0):
    n = int((dur + .06) * SR)
    t = np.arange(n) / SR
    if f_end is None:
        ff = np.full(n, float(f))
    else:
        u = np.clip(t / max(glide, 1e-3), 0, 1)
        u = u * u * (3 - 2 * u)
        ff = f * (f_end / f) ** u
    ph = np.cumsum(ff) / SR
    y = .55 * (2 * (ph % 1) - 1) + .9 * np.sin(2 * np.pi * ph) + .2 * np.sin(4 * np.pi * ph)
    y = lp(y, 520 + 700 * 0) * 1.0
    env = np.minimum(t / .006, 1) * np.where(t < dur, 1.0, np.exp(-(t - dur) / .015))
    env *= .75 + .25 * np.exp(-t / .12)
    return np.tanh(1.2 * y * env) * v * .8


def riser(dur, f0=300, f1=9000, v=1.0, tone=(150, 1800), curve=2.2, noise=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    y = sweep(rng.standard_normal(n), f0, f1, 'high') * noise
    y += 0.45 * sweep(rng.standard_normal(n), f0 * 1.5, f1 * .8, 'band') * 1.2
    if tone:
        fr = tone[0] * (tone[1] / tone[0]) ** (u ** 1.3)
        for d in (-.012, 0, .012):
            y += .12 * (2 * (np.cumsum(fr * (1 + d)) / SR % 1) - 1)
        y = y * 1.0
    env = u ** curve * (1 - .0 * u)
    y *= env
    y[-64:] *= np.linspace(1, 0, 64)
    return y * v * .6


def pings(t0, t1, cnt, fmin, fmax, v=1.0, stem='fx', pan_w=.8, rev=.5):
    for _ in range(cnt):
        t = rng.uniform(t0, t1)
        f = np.exp(rng.uniform(np.log(fmin), np.log(fmax)))
        d = tt(.4)
        y = np.sin(2 * np.pi * f * d) * np.exp(-d / .12) + .3 * np.sin(2 * np.pi * f * 2.76 * d) * np.exp(-d / .05)
        put(stem, y, t, v * rng.uniform(.4, 1), rng.uniform(-pan_w, pan_w), rev)


def ks_string(f, dur, vel, seed, t60=1.2, bright=0.6, pick=0.13):
    r = np.random.default_rng(seed)
    n = int((dur + t60 * 0.8) * SR)
    P = SR / f
    L = int(np.floor(P - 0.5))
    fr = P - 0.5 - L
    c0, c1, c2 = 0.5 * (1 - fr), 0.5, 0.5 * fr
    gper = 10 ** (-3 / (t60 * f))
    ex = r.uniform(-1, 1, L)
    a = 0.15 + 0.8 * bright * (vel / 127)
    ex = signal.lfilter([a], [1, -(1 - a)], ex)
    d = max(1, int(pick * P))
    ex = ex - np.concatenate([np.zeros(d), ex[:-d]])
    y = np.zeros(n + L + 3)
    y[3:3 + L] = ex
    pos, end, doff = 3 + L, 3 + n, 3 + int(dur * SR)
    while pos < end:
        k = min(L, end - pos)
        gg = gper if pos < doff else gper ** 6
        y[pos:pos + k] += gg * (c0 * y[pos - L:pos - L + k] + c1 * y[pos - L - 1:pos - L - 1 + k]
                                + c2 * y[pos - L - 2:pos - L - 2 + k])
        pos += k
    return y[3:end] * (vel / 127) ** 1.3


def oud_note(n, dur, vel, seed):
    f = float(mtof(n))
    s = .5 * (ks_string(f, dur, vel, seed) + ks_string(f * 2 ** (4 / 1200), dur, vel, seed + 900))
    return lp(s, 6500) * 1.8


def darbuka(kind, v, seed):
    r = np.random.default_rng(seed)
    if kind == 'doum':
        t = tt(.5)
        f = 92 * (1 + .35 * np.exp(-t / .018))
        ph = 2 * np.pi * np.cumsum(f) / SR
        y = np.sin(ph) * np.exp(-t / .2) + .3 * np.sin(ph * 1.59) * np.exp(-t / .07)
        y += .4 * lp(r.standard_normal(len(t)), 900) * np.exp(-t / .006)
        return np.tanh(1.6 * y) / 1.2 * v
    t = tt(.2)
    modes = [(680, .035), (1420, .02), (2550, .012), (3900, .008)] if kind == 'tek' else [(610, .028), (1300, .016), (2300, .01)]
    y = sum(.5 * np.sin(2 * np.pi * fr * t + r.uniform(0, 6)) * np.exp(-t / d) for fr, d in modes)
    y += .8 * hp(r.standard_normal(len(t)), 2200) * np.exp(-t / .004)
    return y * v * (.9 if kind == 'tek' else .55)


# ------------------------------------------------------------------ SoundFont tracks
class Trk:
    def __init__(s, stem, prog, gain=1.0, pan=0.0, rev=0.2, bank=0):
        s.stem, s.prog, s.gain, s.pan, s.rev, s.bank = stem, prog, gain, pan, rev, bank
        s.notes, s.ctl = [], []

    def n(s, t, dur, note, vel=90):
        if isinstance(note, (list, tuple)):
            for x in note:
                s.n(t, dur, x, vel)
            return
        s.notes.append((float(t), float(dur), m(note), int(np.clip(vel, 1, 127))))

    def cc(s, t, num, val):
        s.ctl.append((float(t), num, int(np.clip(val, 0, 127))))

    def expr(s, t0, t1, v0, v1, curve=1.0, step=0.02):
        k = max(2, int((t1 - t0) / step))
        for i in range(k + 1):
            u = i / k
            s.cc(t0 + (t1 - t0) * u, 11, v0 + (v1 - v0) * u ** curve)


TRKS = []


def trk(*a, **k):
    t = Trk(*a, **k)
    TRKS.append(t)
    return t


_SY = None


def render_sf(tr):
    global _SY
    import tinysoundfont as tsf
    if _SY is None:
        s = tsf.Synth(samplerate=SR, gain=-6)
        _SY = (s, s.sfload(SF2))
    s, sfid = _SY
    ch = 0
    s.sounds_off()
    s.program_select(ch, sfid, tr.bank, tr.prog, False)
    s.control_change(ch, 7, 127)
    s.control_change(ch, 11, 127)
    s.control_change(ch, 10, 64)
    ev = []
    for t, dur, n, vel in tr.notes:
        ev.append((int(round(t * SR)), 1, n, vel))
        ev.append((int(round((t + dur) * SR)), 0, n, 0))
    for t, num, val in tr.ctl:
        ev.append((int(round(t * SR)), 2, num, val))
    ev.sort(key=lambda e: (e[0], e[1]))
    first = min(int(round(t * SR)) for t, *_ in tr.notes)
    last = max(int(round((t + d) * SR)) for t, d, *_ in tr.notes)
    stop = min(N, last + int(3.0 * SR))
    out = np.zeros((N, 2), np.float32)
    pos = None
    for smp, typ, a, b in ev:
        if smp > stop:
            break
        if pos is None:
            if smp >= first:
                pos = first
            else:
                if typ == 2:
                    s.control_change(ch, a, b)
                continue
        smp = max(smp, pos)
        if smp > pos:
            out[pos:smp] = np.frombuffer(s.generate(smp - pos), dtype=np.float32).reshape(-1, 2)
            pos = smp
        if typ == 1:
            s.noteon(ch, a, b)
        elif typ == 0:
            s.noteoff(ch, a)
        else:
            s.control_change(ch, a, b)
    if pos is not None and pos < stop:
        out[pos:stop] = np.frombuffer(s.generate(stop - pos), dtype=np.float32).reshape(-1, 2)
    s.sounds_off()
    return out.astype(np.float64)


# ------------------------------------------------------------------ composition helpers
CHORD = {'M': [0, 4, 7], 'm': [0, 3, 7], 'M7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], 'add9': [0, 4, 7, 14],
         '7': [0, 4, 7, 10], 'm9': [0, 3, 7, 10, 14], 'M9': [0, 4, 7, 11, 14], '5': [0, 7, 12], 'sus': [0, 5, 7, 10]}


def chord(root, kind, base=55, key=0):
    """chord tones (midi) with lowest root at/above base"""
    r = base + ((root + key - base) % 12)
    return [r + i for i in CHORD[kind]]


def broot(root, key=0, lo=36):
    return lo + ((root + key - lo) % 12)


def D(name, t, v=1.0, pan=0.0, rev=0.0, groove=True):
    if groove and any(a <= t < b for a, b in MUTE):
        return
    smp = {'kick': lambda: KIK, 'snare': lambda: SNR, 'clap': lambda: CLP, 'hatc': lambda: HATC[int(rng.integers(3))],
           'hato': lambda: HATO, 'shk': lambda: SHK[int(rng.integers(3))]}[name]()
    put('drums', smp, t, v, pan, rev)


def K(t, v=1.0, pump=0.6, groove=True):
    if groove and any(a <= t < b for a, b in MUTE):
        return
    put('drums', KIK, t, v)
    if pump:
        KICKS.append((t, pump * v))


def roll(t0, t1, i0, i1, v0, v1, pan=0.0, rev=.25):
    t = t0
    while t < t1 - 1e-6:
        u = (t - t0) / (t1 - t0)
        put('drums', SNRS, t, (v0 + (v1 - v0) * u ** 1.4) * rng.uniform(.9, 1.0), pan, rev)
        t += i0 + (i1 - i0) * u


KIK = kick()
SNR = snare()
SNRS = snare(0.06, 1.0, 210)
CLP = clap()
HATC = [hat(False, rng.uniform(.8, 1)) for _ in range(3)]
HATO = hat(True)
SHK = [shaker(rng.uniform(.8, 1)) for _ in range(3)]

# ---- instruments (SoundFont)
pizz = trk('lead', 45, 1.6, -.25, .2)
marim = trk('lead', 12, 1.0, .25, .25)
xylo = trk('lead', 13, 1.2, .35, .2)
clar = trk('lead', 71, 1.2, -.35, .2)
cel = trk('lead', 8, 1.0, .1, .45)
glo = trk('lead', 9, .8, -.1, .45)
harp = trk('harmony', 46, 1.0, 0, .4)
vib = trk('harmony', 11, .8, .2, .4)
epn = trk('harmony', 4, .8, -.2, .35)
pad = trk('harmony', 89, 1.0, 0, .5)
pad2 = trk('harmony', 91, .8, 0, .5)
strs = trk('harmony', 48, .9, 0, .4)
strs_stac = trk('harmony', 45, .8, .15, .3)
tremstr = trk('harmony', 44, .8, 0, .4)
brass = trk('lead', 61, .9, 0, .35)
trumpet = trk('lead', 56, .8, 0, .35)
lowbr = trk('fx', 61, 1.0, 0, .4)
orch = trk('fx', 55, 1.0, 0, .4)
timp = trk('fx', 47, 1.0, 0, .3)
taiko = trk('fx', 116, 1.0, 0, .3)
od_gtr = trk('lead', 29, .9, 0, .25)
strings_hit = trk('fx', 48, 1.0, 0, .4)
nyl = trk('harmony', 24, .9, -.3, .3)
mut = trk('harmony', 28, .9, .25, .25)

KEYC, KEYD = 0, 2
# hook (in C, midi) as (step8th, midi, len in steps); chords F G Em Am
HOOK = [
    [(0, 72, 1.6), (2, 69, 1), (3, 72, 1), (5, 77, 1), (6, 76, 1), (7, 72, 1)],
    [(0, 74, 1.6), (2, 71, 1), (3, 74, 1), (5, 79, 1), (6, 77, 1), (7, 74, 1)],
    [(0, 76, 1.6), (2, 79, 1), (3, 76, 1), (4, 74, 1), (6, 72, 1), (7, 71, 1)],
    [(0, 72, 1), (1, 69, 1), (3, 72, 1), (4, 76, 2), (6, 74, 1), (7, 72, 1.5)],
]
HOOK_CH = [(5, 'M7'), (7, 'M'), (4, 'm7'), (9, 'm7')]


def hook_bar(bar, t0, beat, key, insts, vel=90, octv=0, len_mul=0.9):
    st = beat / 2
    for step, mid, ln in HOOK[bar]:
        for i in insts:
            i.n(t0 + step * st, ln * st * len_mul, mid + key + octv, vel)


def hook_pluck(bar, t0, beat, key, v=1.0, octv=0):
    st = beat / 2
    for step, mid, ln in HOOK[bar]:
        put('lead', pluck(mtof(mid + key + octv), ln * st * .9, v), t0 + step * st, 1.0, .1, .3)


# ================================================================== S0: 0-3.0  curious / searching
def sec0():
    scale = [60, 62, 63, 66, 67, 70, 72, 75, 74, 69, 65]
    r = np.random.default_rng(11)
    g = .125
    pat = [0, 3, 6, 8, 11, 14]
    tt_ = 0.0
    for bar in range(3):
        for k, st in enumerate(pat):
            t = bar * 1.0 + st * g
            if t > 2.95:
                continue
            u = t / 2.95
            n = scale[(bar * 3 + k * 2) % 8] + (12 if k % 3 == 2 else 0)
            pizz.n(t, .12, n, 62 + 30 * u)
    # marimba offbeat answers
    for i, t in enumerate(np.arange(.5, 2.95, .5)):
        marim.n(t + .0625, .15, [64, 68, 71, 66, 70][i % 5] + 12 * (i % 2), 58 + 30 * t / 3)
    # clarinet stutters from 1.0
    for i, t in enumerate(np.arange(1.0, 2.95, .375)):
        clar.n(t, .1, [63, 66, 70, 75, 69, 72][i % 6], 55 + 30 * (t - 1) / 2)
    # xylophone chaos ramp from 1.5, accelerating
    t = 1.5
    while t < 2.94:
        u = (t - 1.5) / 1.45
        xylo.n(t, .06, int(r.choice(scale)) + 12, 50 + 60 * u)
        t += .25 - .17 * u
    # celesta / glock rising chromatic clutter 2.2..2.94
    t, n = 2.2, 72
    while t < 2.94:
        cel.n(t, .08, n, 55 + (t - 2.2) * 60)
        glo.n(t + .03, .08, n + 7, 50 + (t - 2.2) * 50)
        n += int(r.choice([1, 2, 3])); t += .09 - .04 * (t - 2.2) / .74
    # muted beat: soft lp kick + rim ticks off-kilter
    for k, st in enumerate([0, 3, 6, 8, 11, 14, 16, 19, 22]):
        t = st * g + 0
        if t < 2.95:
            u = t / 3
            put('drums', lp(KIK, 220) * (.5 + .4 * u), t, 1.0)
    for i in range(24):
        t = i * .125 + (.0 if i % 3 else 0)
        if t > 2.95 or (t < 1.0 and i % 2 == 0):
            continue
        put('drums', tick(2200 if i % 2 else 1500, .5 + .5 * t / 3), t, 1.0, (-.5 if i % 2 else .5))
    if True:
        for t in np.arange(1.5, 2.95, .0625 * 2):
            put('drums', HATC[int(rng.integers(3))], t, .25 + .5 * (t - 1.5) / 1.45, rng.uniform(-.6, .6))
    # snare accelerating clutter 2.3-2.95
    roll(2.35, 2.95, .1, .045, .15, .8, rev=.2)
    # low tension note + riser
    lowbr.n(0.0, 1.0, 'C2', 40)
    put('fx', riser(1.6, 400, 10000, .6, tone=(200, 2600), curve=2.0), 1.45, 1.0, 0, .3)
    for i, t in enumerate([2.4, 2.65, 2.85]):
        put('fx', tick(900 + 500 * i, .9, .05), t, .8, rng.uniform(-.7, .7), .3)
    put('fx', rev_crash(1.0, .8), 2.05, 1, 0, .2)
    HITS.update({'clutter_peak': 2.9})


# ================================================================== A: 3.05-15.81
T_A = 3.05
B = 0.5
BLIP = [(0, 'add9'), (5, 'M7'), (7, 'M'), (4, 'm7'), (9, 'm7'), (2, 'm7')]


def secA():
    t0 = T_A
    # --- arrival: sparkling chord (gold-light)
    ch = chord(0, 'add9', 60)
    put('fx', supersaw([mtof(x) for x in [48, 55, 60, 64, 67, 74]], 1.6, 5200, .01, 1.2, v=.55), t0, 1, 0, .5)
    pad.n(t0, 2.0, ch + [48, 72], 90)
    harp.n(t0, 2, chord(0, 'add9', 55), 95)
    for i, n in enumerate([72, 76, 79, 83, 86, 88, 91, 95, 98, 100]):
        cel.n(t0 + i * .05, .3, n, 92 - i * 2)
        glo.n(t0 + .03 + i * .05, .3, n - 12, 80 - i * 2)
    put('fx', crash(3.0, .8, .9), t0, 1, 0, .4)
    put('fx', sub_boom(1.4, 60, 30, .8), t0, 1)
    K(t0, 1.2, .9, groove=False)
    pings(t0, t0 + 1.6, 26, 3000, 9000, .25)
    HITS['drop'] = t0
    # --- bars 0..5
    prog = [(0, 'add9'), (5, 'M7'), (7, 'M'), (4, 'm7'), (9, 'm7'), (2, 'm7')]
    for b in range(6):
        tb = t0 + 2 * b
        root, kind = prog[b]
        ch = chord(root, kind, 55)
        bs = broot(root)
        # bass groove (bar b0 beats 0..)
        for step, off, ln in [(0, 0, 1.6), (2, 0, .9), (3, 12, .9), (4, 0, 1.6), (6, 0, .9), (7, 7, .9)]:
            if b == 5 and step >= 4:
                continue
            put('bass', bass(mtof(bs + off), ln * .25, 1.0), tb + step * .25)
        # kick / drums
        stadium = 3 <= b <= 4
        for beat in range(4):
            tk = tb + beat * B
            if b == 0 and beat == 0:
                continue
            if stadium:
                if beat in (0, 2):
                    K(tk, 1.0, .55); K(tk + .25, .85, .5)
            else:
                K(tk, 1.0 if beat != 2 else .9, .55)
        if b >= 1 and not stadium:
            D('clap', tb + B, .55, 0, .25); D('clap', tb + 3 * B, .6, 0, .25)
        if stadium:
            for beat in (1, 3):
                D('clap', tb + beat * B, 1.0, 0, .45)
                D('clap', tb + beat * B, .6, .2, .3)
                D('snare', tb + beat * B, .5)
            for beat in (1, 3):
                for x in (0, .25):
                    pass
        for st in range(8):
            tk = tb + st * .25
            if st % 2 == 1:
                D('hato' if st in (3, 7) and b >= 1 else 'hatc', tk, .35 if st % 4 == 1 else .4, .3)
            elif b >= 1 and not stadium:
                D('hatc', tk, .18, -.2)
        if b >= 1:
            for st in range(16):
                if st % 2:
                    D('shk', tb + st * .125, .22 + .08 * (b % 2), .25 * (1 if st % 4 == 1 else -1))
        # harmony: pads, arps
        if b >= 1:
            pad.n(tb, 1.95, ch, 62)
        if b >= 2:
            for st in range(8):
                nn = ch[(0, 1, 2, 3, 2, 1, 2, 3)[st] % len(ch)] + (12 if st % 4 == 3 else 0) + 12
                put('harmony', pluck(mtof(nn), .22, .8), tb + st * .25, 1.0, (-.35 if st % 2 else .35), .3)
        if b >= 2:
            strs.n(tb, 1.95, [c for c in ch], 55 + 6 * b)
        if b == 0:
            for st in range(1, 8):
                nn = ch[(0, 1, 2, 3, 2, 1, 2, 3)[st] % len(ch)] + 12
                put('harmony', pluck(mtof(nn), .2, .6), tb + st * .25, 1.0, (-.3 if st % 2 else .3), .3)
    # --- hook bars 1-4 (5.05-13.05)
    for j in range(4):
        tb = t0 + 2 + 2 * j
        insts = [marim]
        hook_pluck(j, tb, B, KEYC, .55 if j < 2 else .75)
        marim.n  # noqa
        hook_bar(j, tb, B, KEYC, [marim], 62 + 8 * j)
        if j >= 2:
            hook_bar(j, tb, B, KEYC, [cel], 70, 12)
        if j == 3:
            pass
    # b0: quick motif on bright plucks
    for st, n in [(1, 76), (2, 79), (3, 84), (5, 83), (6, 79), (7, 76)]:
        put('lead', pluck(mtof(n), .2, .5), t0 + st * .25, 1.0, .15, .3)
    # riser-in sweeps every 2s: small energy adds
    for tb in (5.05, 7.05, 11.05):
        put('fx', rev_crash(.5, .35), tb - .5, 1, 0, .2)
    put('fx', crash(1.5, .4, .5), 5.05, 1, 0, .2)
    put('fx', crash(1.5, .4, .5), 7.05, 1, 0, .2)
    put('fx', crash(1.5, .4, .5), 11.05, 1, 0, .2)
    # b3.. strings riff (11.05-13.05 bar4)
    for st in range(8):
        strs_stac.n(11.05 + st * .25, .2, [chord(9, 'm7', 57)[k] for k in (0, 2, 1, 2, 0, 2, 3, 2)][st], 78)
    # --- stings
    # 6.7 cinematic low hit
    MUTE.append((6.62, 7.05))
    put('fx', sub_boom(1.3, 65, 26, 1.0, .75), 6.7, 1)
    put('fx', rev_crash(.55, .6), 6.15, 1, 0, .2)
    lowbr.n(6.7, .7, ['F1', 'C2', 'F2', 'C3'], 105)
    strings_hit.n(6.7, .6, ['F2', 'C3', 'F3'], 100)
    put('fx', crash(1.8, .55, .6), 6.7, 1, 0, .45)
    put('fx', tom(70, 1.0, .5), 6.7, 1, 0, .3)
    # 8.0 magical glock/celesta run
    run = [84, 86, 88, 91, 93, 96, 98, 100, 103]
    for i, n in enumerate(run):
        cel.n(8.0 + i * .0556, .3, n, 92); glo.n(8.0 + i * .0556 + .01, .3, n - 12, 84)
    harp.n(8.0, .5, [72, 76, 79, 84], 90)
    pings(8.0, 8.6, 22, 3500, 10000, .28)
    put('fx', rev_crash(.45, .3), 7.55, 1, 0, .2)
    HITS['magic_run'] = 8.0
    # 9.05 sports fanfare stab + snare roll into stadium groove
    MUTE.append((8.5, 9.05))
    roll(8.55, 9.05, .0833, .05, .25, 1.0, rev=.25)
    ff = [chord(0, 'M', 60), chord(0, 'M', 67)]
    brass.n(9.05, .45, ff[0] + [48], 112)
    trumpet.n(9.05, .3, [72, 76, 79], 110)
    brass.n(9.05 + .0, .45, [60, 64, 67, 72], 110)
    trumpet.n(9.0 + .55, .18, [72, 76, 79], 100)
    put('fx', crash(2.4, .8, .8), 9.05, 1, 0, .3)
    timp.n(9.05, .5, 'C3', 110)
    # 13.1 oud/darbuka lick
    hij = [62, 63, 66, 67, 69, 70, 72, 74]
    lick = [(0, 74), (.1, 72), (.2, 70), (.3, 69), (.4, 67), (.5, 66), (.6, 63), (.75, 62)]
    lick = [(0, 69, .1), (.11, 70, .1), (.22, 74, .12), (.34, 72, .1), (.45, 70, .1), (.56, 69, .1), (.67, 67, .1), (.78, 66, .1), (.89, 63, .1), (1.0, 62, .3)]
    for i, (dt, n, ln) in enumerate(lick):
        put('lead', oud_note(n, ln, 105, 40 + i), 13.1 + dt * .82, 1.0, -.1, .3)
    for t, k, v in [(13.1, 'doum', .9), (13.35, 'tek', .8), (13.5, 'tek', .6), (13.6, 'ka', .5), (13.75, 'doum', .8),
                    (13.85, 'tek', .8), (13.92, 'ka', .6), (13.97, 'tek', .8)]:
        put('drums', darbuka(k, v, int(t * 100)), t, 1.0, .1, .2)
    HITS['oud'] = 13.1
    # 14.0 K-pop stab (double)
    for t, ch2, v in [(14.0, [65, 69, 72, 76, 79], 1.0), (14.25, [67, 71, 74, 79], .9)]:
        put('lead', supersaw([mtof(x) for x in ch2], .16, 6500, .003, .06, v=.9 * v), t, 1.0, 0, .3)
        put('lead', supersaw([mtof(x + 12) for x in ch2[:3]], .12, 9000, .002, .05, v=.5 * v), t, 1.0, 0, .3)
    put('drums', clap(1.0), 14.0, 1, 0, .3); put('drums', clap(.9), 14.25, .9, 0, .3)
    put('lead', pluck(mtof(88), .14, .9), 14.5, 1, .3, .3); put('lead', pluck(mtof(91), .14, .9), 14.375, 1, -.3, .3)
    HITS['kpop'] = 14.0
    # 14.6 anime taiko + power chord
    taiko.n(14.6, .5, 'D2', 122); taiko.n(14.6, .5, 'D3', 118)
    taiko.n(14.85, .3, 'D2', 100)
    for n in ('D2', 'A2', 'D3', 'A3', 'D4'):
        od_gtr.n(14.6, .4, n, 118)
    put('fx', crash(1.5, .55, .55), 14.6, 1, 0, .3)
    put('fx', sub_boom(.9, 60, 36, .6), 14.6, 1)
    K(14.6, 1.1, 0, groove=False)
    HITS['anime'] = 14.6
    # bass for bar 5 lick zone: sustained D
    # 15.05 - 15.81 build
    roll(15.05, 15.81, .125, .04, .2, 1.0, rev=.2)
    put('fx', riser(.76, 500, 12000, 1.1, tone=(300, 3200), curve=1.6), 15.05, 1, 0, .2)
    for i in range(4):
        put('drums', tom(200 - 30 * i, .8, .15), 15.05 + i * .19, 1, 0, .3)
    put('fx', supersaw([mtof(x) for x in [50, 57, 62, 66, 69]], .76, 4000, .1, .01, v=.35), 15.05, 1, 0, .2)
    HITS['build_start'] = 15.05
    HITS['build_cut'] = 15.81


# ================================================================== B: 15.81-20.64
def secB():
    t0 = 15.81
    prog = [(0, 'add9', 15.81, 16.81), (9, 'm7', 16.81, 17.81), (5, 'M7', 17.81, 18.81), (7, 'M', 18.81, 19.81),
            (0, 'add9', 19.81, 20.64)]
    cel.n(t0, .9, 'G6', 62)
    for i, (root, kind, a, b) in enumerate(prog):
        ch = chord(root, kind, 60)
        pad.n(a, b - a + .2, chord(root, kind, 48), 45)
        harp.n(a, b - a, ch, 60)
        bs = broot(root)
        st_ = 0 if i else 2
        if a > 16.3:
            for k in range(2):
                tb = a + k * .5
                put('bass', bass(mtof(bs + (0 if k == 0 else 12 if i % 2 else 0)), .16, .9), tb + .0)
                put('bass', bass(mtof(bs), .12, .7), tb + .25)
        # celesta 8th arpeggio, playful
        for s in range(4):
            t = a + s * .25
            if t < 16.3:
                continue
            cel.n(t, .2, ch[(0, 2, 1, 3)[s] % len(ch)] + 12 + (12 if s == 3 else 0), 68)
        for s in range(2):
            t = a + .125 + s * .5
            if t < 16.3:
                continue
            put('lead', pluck(mtof(ch[(s * 2 + 1) % len(ch)] + 24), .12, .55), t, 1, (-.4 if s else .4), .3)
        # playful motif at phrase starts
        if i in (2, 4):
            for st, n in [(0, 79), (1, 76), (2, 79), (3, 84)]:
                marim.n(a + .5 + st * .125, .1, n, 70)
    # tick-tock: 8th-note-pair "tick tock" every 0.25
    t = 16.06
    k = 0
    while t < 20.6:
        put('drums', tick(2100 if k % 2 == 0 else 1250, .38 if k % 2 == 0 else .5, .010 if k % 2 == 0 else .016), t, 1.0,
            -.5 if k % 2 == 0 else .5, .12)
        t += .25; k += 1
    # soft kick & sidestick
    for t in np.arange(16.81, 20.6, .5):
        b = int(round((t - 16.81) / .5)) % 2
        if b == 0:
            K(t, .55, .35, groove=False)
        else:
            put('drums', lp(tick(1000, 1.2, .03), 3000), t, .8, .1, .25)
    for t in np.arange(16.81 + .25, 20.6, .5):
        put('drums', HATC[int(rng.integers(3))], t, .25, .3)
    for t in np.arange(16.81, 20.6, .125):
        put('drums', SHK[int(rng.integers(3))], t, .1, rng.uniform(-.3, .3))
    put('fx', rev_crash(.8, .3), 20.1, 1, 0, .2)
    HITS['light_start'] = t0


# ================================================================== C: 20.64-23.5  smooth
def secC():
    t0 = 20.64
    segs = [(9, 'm9', 20.64, 22.07), (5, 'M9', 22.07, 23.5)]
    for root, kind, a, b in segs:
        ch = chord(root, kind, 55)
        pad.n(a, b - a + .15, ch, 66)
        pad2.n(a, b - a, chord(root, kind, 43)[:3], 50)
        put('harmony', supersaw([mtof(x) for x in ch[:4]], b - a, 1500, .25, .5, v=.45), a, 1, 0, .5)
        # slidey bass glide
        bs = broot(root)
        put('bass', bass(mtof(bs), b - a - .05, .55, f_end=mtof(bs - 5 if root == 9 else bs - 2), glide=.55), a, 1)
        put('bass', bass(mtof(bs - 5 if root == 9 else bs - 2), .01, 0), a)
        # flowing arpeggio (harp/vibes), 16ths, up and down
        seq = [0, 1, 2, 3, 4, 3, 2, 1]
        k = 0
        t = a + .0
        while t < b - .05:
            n = ch[seq[k % 8] % len(ch)] + 12 * (1 + seq[k % 8] // len(ch))
            harp.n(t, .3, n, 58 + 6 * (k % 4 == 0))
            if k % 2 == 0:
                vib.n(t, .3, n + 12, 46)
            t += .125; k += 1
    # filtered sweep (silky)
    n = int(2.86 * SR)
    ns = sweep(rng.standard_normal(n), 300, 7000, 'band')
    ns2 = sweep(rng.standard_normal(n), 7000, 500, 'band')
    u = np.linspace(0, 1, n)
    sw = (ns * np.sin(np.pi * u * .5) ** 2 * .8 + ns2 * 0)
    sw = sw * (np.sin(np.pi * u) ** 1.5)
    put('fx', sw * .55, t0, 1, 0, .5)
    # brushed / soft groove
    for t in np.arange(20.64, 23.5, .5):
        K(t, .5 if int(round((t - 20.64) / .5)) % 2 == 0 else .0, .35, groove=False) if int(round((t - 20.64) / .5)) % 2 == 0 else None
    for t in np.arange(20.64 + .25, 23.5, .25):
        put('drums', HATC[int(rng.integers(3))], t, .22, .3)
    for t in np.arange(20.64, 23.5, .125):
        put('drums', SHK[int(rng.integers(3))], t, .12, rng.uniform(-.3, .3))
    put('drums', clap(.5, .18), 21.64, .4, 0, .5)
    put('drums', clap(.5, .18), 22.64, .4, 0, .5)
    put('fx', crash(2.0, .35, .8), 20.64, 1, 0, .5)
    HITS['smooth_start'] = t0


# ================================================================== tension 23.5-25.5
def sec_tension():
    put('fx', riser(2.0, 250, 9000, 1.2, tone=(90, 1500), curve=2.6), 23.5, 1, 0, .25)
    # low drone A1 (+ Bb b9) rising
    n = int(2.0 * SR)
    t = np.arange(n) / SR
    u = t / 2.0
    dr = np.sin(2 * np.pi * 55 * t) * 1.0 + .5 * np.sin(2 * np.pi * 58.27 * t)
    dr2 = sweep(saw(np.full(n, 110.0), n) + saw(np.full(n, 110.6), n), 150, 1400, 'low')
    y = dr * (.5 + .5 * u) + dr2 * .35 * u ** 1.5
    y *= np.minimum(t / .3, 1)
    put('fx', y * .9, 23.5, 1.0, 0, .2)
    tremstr.n(23.9, 1.6, ['A2', 'E3', 'A3', 'C4'], 60)
    tremstr.expr(23.9, 25.5, 30, 127, 1.5)
    lowbr.n(24.7, .8, ['A1', 'E2'], 60)
    lowbr.expr(24.7, 25.5, 20, 110, 1.4)
    # snare roll crescendo 23.9-25.5
    roll(23.9, 25.5, .125, .047, .1, 1.0, rev=.2)
    # heartbeat
    t, per = 23.55, .62
    while t < 25.35:
        u = (t - 23.55) / 1.8
        put('drums', lp(kick(1.0, 45, .1), 140) * 1.0, t, .55 + .35 * u, 0, .1)
        put('drums', lp(kick(1.0, 50, .08), 130), t + .15 * (1 - .3 * u), .35 + .3 * u, 0, .1)
        t += per * (1 - .35 * u)
    HITS['tension_start'] = 23.5
    HITS['roll_start'] = 23.9


# ================================================================== impact 25.61 / accent 26.55
def sec_impact():
    t0 = 25.61
    put('fx', sub_boom(2.4, 75, 25, 1.4, 1.0), t0, 1)
    put('fx', crash(4.5, 1.0, 1.4), t0, 1, 0, .5)
    put('drums', kick(1.3, 42, .3), t0, 1, 0, .15)
    D_ = ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4', 'A4']
    orch.n(t0, 1.0, ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], 127)
    strings_hit.n(t0, 1.2, D_, 118)
    lowbr.n(t0, 1.0, ['D2', 'A2', 'D3', 'A3'], 120)
    timp.n(t0, 1.0, 'D2', 127); timp.n(t0 + .001, 1.0, 'D3', 118)
    put('fx', tom(60, 1.4, .6), t0, 1, 0, .3)
    put('fx', riser(.0 + 1.0, 300, 3000, .0), t0)
    # 26.55 accent (period)
    t1 = 26.55
    put('fx', sub_boom(1.2, 66, 30, .9, .6), t1, 1)
    put('fx', crash(2.5, .55, .8), t1, 1, 0, .4)
    orch.n(t1, .55, ['D3', 'A3', 'D4', 'F#4'], 100)
    brass.n(t1, .5, ['D3', 'A3', 'D4'], 100)
    timp.n(t1, .4, 'D2', 110)
    put('drums', kick(1.0, 48, .2), t1, 1, 0, .15)
    put('drums', clap(1.0, .2), t1, .7, 0, .5)
    # reverse riser into 27.2
    put('fx', rev_crash(.6, .7), 26.6, 1, 0, .1)
    roll(26.95, 27.2, .125, .0625, .3, .9, rev=.2)
    HITS['impact'] = 25.61
    HITS['accent'] = 26.55


# ================================================================== D: 27.2-30.1 triumphant
def secD():
    t0, bt = 27.2, .525
    tr_ = 4 * bt
    put('fx', crash(2.4, .8, .8), t0, 1, 0, .3)
    ch_seq = [(5, 'M', 0), (5, 'M', 1), (5, 'M', 2), (7, 'M', 3)]  # rel. to C: F F F G  -> in D: G G G A
    for beat in range(4):
        tb = t0 + beat * bt
        K(tb, 1.1, .6, groove=False)
        D('hatc', tb + bt / 2, .4, .3, groove=False)
        for s in range(4):
            D('shk', tb + s * bt / 4, .25, .3 * (-1) ** s, groove=False)
        if beat in (1, 3) and beat != 3:
            D('clap', tb, 1.0, 0, .35, groove=False); D('snare', tb, .6, groove=False)
        K(tb + bt / 2, .8, .45, groove=False) if beat in (0, 2) else None
    roll(t0 + 3 * bt, 29.3, .105, .04, .3, 1.0, rev=.25)
    D('clap', t0 + 3 * bt, .9, 0, .35, groove=False)
    # bass 8ths driving
    for beat in range(4):
        tb = t0 + beat * bt
        root = ch_seq[beat][0]
        bs = broot(root, KEYD)
        put('bass', bass(mtof(bs), bt * .45, 1.0), tb)
        put('bass', bass(mtof(bs + (12 if beat % 2 else 0)), bt * .4, .9), tb + bt / 2)
    # harmony: strings ostinato + pad + brass hook phrase
    for beat in range(4):
        root = ch_seq[beat][0]
        ch = chord(root, 'M', 57, KEYD)
        for s in range(2):
            strs_stac.n(t0 + beat * bt + s * bt / 2, bt * .4, [ch[0], ch[1], ch[2]], 85)
        strs.n(t0 + beat * bt, bt * .95, ch + [ch[0] + 12], 88)
    pad.n(t0, 2.2, chord(5, 'M', 50, KEYD), 70)
    # hook bar 1 in D on brass + pluck (heroic)
    hook_bar(0, t0, bt, KEYD, [brass], 100)
    hook_bar(0, t0, bt, KEYD, [trumpet], 92, 0)
    hook_pluck(0, t0, bt, KEYD, .6, 12)
    # 29.3 peak: net ripple / goal accent
    p = 29.3
    put('fx', crash(3.0, 1.0, 1.1), p, 1, 0, .5)
    put('fx', sub_boom(1.5, 68, 30, 1.0, .8), p, 1)
    put('drums', kick(1.2, 45, .25), p, 1, 0, .1)
    orch.n(p, .5, ['D3', 'A3', 'D4', 'F#4'], 105)
    brass.n(p, .8, ['D3', 'A3', 'D4', 'F#4', 'A4'], 108)
    strings_hit.n(p, 1.0, ['D3', 'A3', 'D4', 'F#4', 'A4', 'D5'], 100)
    timp.n(p, .6, 'D2', 115)
    for i in range(14):   # net ripple: harp gliss + celesta shimmer
        n = 74 + [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23][i]
        harp.n(p + .03 + i * .03, .5, n, 88 - i)
        cel.n(p + .03 + i * .03, .5, n + 12, 80 - i)
    pings(p, p + 1.0, 30, 3000, 11000, .3)
    put('fx', hp(rng.standard_normal(int(.8 * SR)), 5000) * np.exp(-tt(.8) / .25) * .3, p, 1, 0, .3)
    # airy 29.3-30.1
    pad.n(p, 1.0, chord(2, 'M9', 62, 0), 70)
    pad2.n(p, 1.0, [62, 66, 69, 74], 50)
    put('harmony', supersaw([mtof(x) for x in [62, 66, 69, 74, 81]], .8, 3500, .05, .5, v=.35), p, 1, 0, .6)
    for i in range(8):
        cel.n(p + .35 + i * .1, .5, [86, 90, 93, 98, 93, 90, 86, 81][i], 60 - 4 * i)
    HITS['goal_peak'] = 29.3
    HITS['triumph_start'] = 27.2


# ================================================================== E: 30.12-32.04 gentle
def secE():
    t0 = 30.12
    put('fx', (np.sin(2 * np.pi * (2300 + 700 * (tt(.05) / .05)) * tt(.05)) * np.exp(-tt(.05) / .018)), t0, .55, 0, .3)
    put('fx', (np.sin(2 * np.pi * 3400 * tt(.06)) * np.exp(-tt(.06) / .02)), t0 + .001, .25, 0, .3)
    HITS['press_blip'] = t0
    pad.n(t0 + .05, 1.4, [50, 57, 62, 66, 69], 35)
    pad.expr(t0 + .05, 31.1, 20, 105, 1.3)
    pad2.n(t0 + .05, 1.4, [62, 66, 69, 74], 30)
    pad2.expr(t0 + .05, 31.1, 15, 95, 1.3)
    n = int(.98 * SR)
    sw = sweep(rng.standard_normal(n), 400, 5000, 'band') * np.linspace(0, 1, n) ** 2
    put('fx', sw * .3, t0, 1, 0, .4)
    epn.n(t0 + .0, .9, ['D4', 'F#4', 'A4', 'E5'], 55)
    cel.n(t0 + .5, .5, 'A5', 55); cel.n(t0 + .74, .5, 'F#5', 50)
    # groove re-enters at 31.1 ("watch")
    bt = .49
    for i, (root, kind, a, b) in enumerate([(2, 'add9', 31.1, 31.59), (11, 'm7', 31.59, 32.04)]):
        pass
    for k in range(2):
        tb = 31.1 + k * bt
        K(tb, 1.0, .6, groove=False)
        D('hatc', tb + bt / 2, .4, .3, groove=False)
        D('clap', tb + bt, .6, groove=False) if False else None
        root = 9 if k == 0 else 5
        put('bass', bass(mtof(broot(root, KEYD)), .4, .95), tb)
        ch = chord(root, 'm7' if k == 0 else 'M', 57, 0)
    for s in range(4):
        t = 31.1 + s * .245
        put('harmony', pluck(mtof([74, 78, 81, 86][s]), .2, .7), t, 1, (-.3 if s % 2 else .3), .3)
    strs.n(31.1, .95, chord(11, 'm7', 57, 0), 65)
    strs.expr(31.1, 32.04, 40, 100)
    roll(31.7, 32.04, .085, .04, .2, .8)
    put('fx', rev_crash(.5, .6), 31.54, 1, 0, .2)
    HITS['watch'] = 31.1


# ================================================================== F: 32.04-36.2 anthem
def secF():
    t0, bt = 32.04, .52
    put('fx', crash(2.5, .9, 1.0), t0, 1, 0, .4)
    chs = [(5, 'M'), (7, 'M')]   # rel. to C; in D: G, A
    for bar in range(2):
        tb = t0 + bar * 4 * bt
        root, kind = chs[bar]
        ch = chord(root, kind, 55, KEYD)
        bs = broot(root, KEYD)
        # drums
        for beat in range(4):
            tk = tb + beat * bt
            K(tk, 1.1, .7, groove=False)
            D('hato', tk + bt / 2, .55, .3, groove=False)
            for s in range(4):
                D('shk', tk + s * bt / 4, .3, .3 * (-1) ** s, groove=False)
            if beat in (1, 3):
                D('clap', tk, 1.0, 0, .4, groove=False); D('snare', tk, .8, groove=False)
            D('hatc', tk, .3, -.3, groove=False)
        # bass 8ths
        for s in range(8):
            put('bass', bass(mtof(bs + (12 if s in (3, 7) else 0)), bt * .4, 1.0), tb + s * bt / 2)
        # harmony
        pad.n(tb, 4 * bt, ch, 75)
        strs.n(tb, 4 * bt * .98, ch + [ch[0] + 12, ch[1] + 12], 92)
        put('harmony', supersaw([mtof(x) for x in ch], 4 * bt * .96, 3500 + 2500 * bar, .04, .3, v=.5), tb, 1, 0, .4)
        for s in range(8):
            nn = ch[(0, 1, 2, 1)[s % 4] % 3] + 12
            put('harmony', pluck(mtof(nn + 12), bt * .35, .7), tb + s * bt / 2, 1, .3 * (-1) ** s, .3)
        hook_bar(bar, tb, bt, KEYD, [brass], 104)
        hook_bar(bar, tb, bt, KEYD, [trumpet], 90)
        hook_bar(bar, tb, bt, KEYD, [cel], 85, 12)
        hook_pluck(bar, tb, bt, KEYD, .9, 12)
        hook_pluck(bar, tb, bt, KEYD, .5, 0)
    # fills
    roll(t0 + 3.5 * bt, t0 + 4 * bt, .06, .04, .3, .8)
    roll(t0 + 7 * bt, 36.14, .075, .035, .3, 1.0)
    put('fx', riser(1.0, 500, 12000, 1.0, tone=(200, 3000), curve=2.0), 35.15, 1, 0, .2)
    put('fx', rev_crash(.9, .6), 35.3, 1, 0, .1)
    # 36.2 final chord (tagline)
    p = 36.2
    D_ = [50, 57, 62, 66, 69, 74]
    put('harmony', supersaw([mtof(x) for x in D_ + [76, 81]], 1.0, 5500, .008, 1.4, v=.9), p, 1, 0, .55)
    put('fx', crash(4.0, 1.0, 1.3), p, 1, 0, .5)
    put('fx', sub_boom(1.5, 60, 36, 1.0, 1.0), p, 1)
    put('drums', kick(1.2, 46, .28), p, 1, 0, .15)
    strs.n(p, 1.1, D_ + [78, 86], 100)
    brass.n(p, .9, ['D3', 'A3', 'D4', 'F#4', 'A4'], 104)
    orch.n(p, .5, ['D3', 'A3', 'D4', 'F#4'], 95)
    timp.n(p, .8, 'D2', 110)
    pad.n(p, 1.3, [62, 66, 69, 74, 78], 85)
    harp.n(p, 1, [62, 66, 69, 74, 81], 90)
    for i, n in enumerate([86, 90, 93, 98, 102, 105]):
        cel.n(p + .03 * i, 1.0, n, 88 - 3 * i); glo.n(p + .03 * i, 1.0, n - 12, 75 - 3 * i)
    lead = [74, 78, 81]
    marim.n(p, .3, [74, 78, 86], 90)
    pings(p, p + 1.0, 18, 3000, 9500, .25)
    HITS['anthem_start'] = 32.04
    HITS['tagline_chord'] = 36.2
    HITS['fade_end'] = 37.0


# ================================================================== master
def make_ir(t60, length, seed):
    r = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for c in range(2):
        x = r.standard_normal(n)
        x = .6 * x + .4 * lp(x, 2500)
        x *= np.exp(-6.9 * t / t60) * np.minimum(t / .012, 1)
        x = np.concatenate([np.zeros(int(.012 * SR)), x])[:n]
        out[:, c] = x
    return out / np.sqrt((out ** 2).sum(0).mean()) * 0.35


def peaking(x, f0, gain_db, q):
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]
    a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    sos = np.array([[b[0] / a[0], b[1] / a[0], b[2] / a[0], 1, a[1] / a[0], a[2] / a[0]]])
    return signal.sosfilt(sos, x, axis=0)


def build():
    sec0(); secA(); secB(); secC(); sec_tension(); sec_impact(); secD(); secE(); secF()
    for tr in TRKS:
        if not tr.notes:
            continue
        y = render_sf(tr)
        put(tr.stem, panl(y[:, 0], -1) * 0 + y, 0, tr.gain, 0, 0) if False else None
        y = y * tr.gain
        if tr.pan:
            y = y * np.array([np.sqrt(.5 * (1 - tr.pan)) * 1.41, np.sqrt(.5 * (1 + tr.pan)) * 1.41])
        ST[tr.stem] += y
        if tr.rev:
            SEND[tr.stem] += y * tr.rev
    # reverbs
    t60 = {'drums': .7, 'bass': .3, 'harmony': 1.8, 'lead': 1.5, 'fx': 2.4}
    for k in STEMS:
        if not np.any(SEND[k]):
            continue
        ir = make_ir(t60[k], t60[k] * 1.2, hash(k) % 97)
        wet = np.stack([signal.fftconvolve(SEND[k][:, c], ir[:, c])[:N] for c in range(2)], 1)
        wet = hp(lp(wet, 9000), 220, 2) if False else signal.sosfilt(
            signal.butter(2, [220, 9000], 'band', fs=SR, output='sos'), wet, axis=0)
        ST[k] += wet
    # sidechain pump on bass/harmony/(lead lightly)
    pump = {'bass': 1.0, 'harmony': .8, 'lead': .25}
    for stem, amt in pump.items():
        env = np.ones(N)
        for t, d in KICKS:
            a = int(t * SR)
            L = int(.22 * SR)
            if a >= N:
                continue
            e = min(N, a + L)
            seg = 1 - min(d, 1.0) * amt * .55 * np.exp(-np.arange(e - a) / (.07 * SR))
            env[a:e] = np.minimum(env[a:e], seg)
        env = uniform_filter1d(env, int(.004 * SR))
        ST[stem] *= env[:, None]


AUTO = [(15.81, 20.6, -3.5), (20.64, 23.5, -2.5), (30.12, 31.1, -4), (29.3, 30.1, -1.5), (0, 3.0, -1.0)]
GATES = [(3.035, 3.05), (15.80, 15.81), (25.50, 25.61), (36.16, 36.2)]


def master():
    # EQ (linear per stem)
    for k in STEMS:
        y = ST[k]
        y = signal.sosfilt(signal.butter(2, 30, 'high', fs=SR, output='sos'), y, axis=0)
        if k != 'fx':
            y = peaking(y, 2600, -2.5, .7)
        else:
            y = peaking(y, 2600, -1.5, .7)
        ST[k] = y
    GN = {'drums': .6, 'bass': .8, 'harmony': 1.5, 'lead': 1.7, 'fx': .85}
    tv = np.arange(N) / SR
    auto = np.ones(N)
    for a, b, gdb in AUTO:
        w = np.clip(np.minimum((tv - a) / .15, (b - tv) / .15), 0, 1)
        auto *= 10 ** (gdb * w / 20)
    for k in STEMS:
        ST[k] = ST[k] * GN[k] * auto[:, None]
    mix = sum(ST.values())
    # bus compressor gain (glue)
    env = np.abs(mix).max(1)
    env = signal.lfilter([1 - .9993], [1, -.9993], env ** 2)
    rms_db = 10 * np.log10(env + 1e-12)
    gr = -(1 - 1 / 2.0) * np.maximum(0, rms_db + 13)
    g = 10 ** (gr / 20)
    g = signal.lfilter([1 - .996], [1, -.996], g, zi=[.996 * g[0] * 0 + g[0] * (1 - .996)])[0] if False else g
    g = uniform_filter1d(g, int(.02 * SR))
    mk = db(3.0)
    y = mix * (g * mk)[:, None]
    # limiter
    pk = np.abs(y).max(1)
    ceil = db(-3.0)
    gl = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    L = int(.005 * SR)
    gl = minimum_filter1d(gl, 2 * L + 1)
    gl = uniform_filter1d(gl, 2 * L + 1)
    gl = np.minimum(gl, np.minimum(1.0, ceil / np.maximum(pk, 1e-9)) * 1.0) if False else gl
    G = g * mk * gl
    # final fade (natural ring-out), gates (hard cuts)
    fade = np.ones(N)
    t = np.arange(N) / SR
    k = t > 36.55
    fade[k] = (np.cos(np.clip((t[k] - 36.55) / .45, 0, 1) * np.pi / 2)) ** 2
    fade[-int(.02 * SR):] *= np.linspace(1, 0, int(.02 * SR))
    for a, b in GATES:
        i0, i1 = int(round(a * SR)), int(round(b * SR))
        f0 = int(.002 * SR)
        fade[i0 - f0:i0] *= np.linspace(1, 0, f0)
        fade[i0:i1] = 0
    G = G * fade
    out = {k: ST[k] * G[:, None] for k in STEMS}
    mixo = sum(out.values())
    peak = np.abs(mixo).max()
    sc = db(-3.0) / peak
    mixo *= sc
    for k in out:
        out[k] *= sc
    return mixo, out


def main():
    build()
    mixo, stems = master()
    assert mixo.shape[0] == N
    os.makedirs(os.path.join(MUS, 'stems'), exist_ok=True)
    sf.write(os.path.join(MUS, 'music.wav'), mixo.astype(np.float32), SR, subtype='PCM_24')
    for k, y in stems.items():
        sf.write(os.path.join(MUS, 'stems', k + '.wav'), y.astype(np.float32), SR, subtype='PCM_24')
    HITS.update({'bpm': 120, 'beat': .5, 'silence': [25.50, 25.61], 'gold_riser_land': 3.05,
                 'genre_stings': {'cinematic': 6.7, 'magic': 8.0, 'sports': 9.05, 'oud': 13.1, 'kpop': 14.0, 'anime': 14.6},
                 'build_cut': 15.81, 'light_start': 15.81, 'smooth_start': 20.64, 'tension': [23.5, 25.5]})
    with open(os.path.join(MUS, 'hits.json'), 'w') as f:
        json.dump(HITS, f, indent=1)
    print('wrote music.wav', mixo.shape, 'peak', 20 * np.log10(np.abs(mixo).max()))


if __name__ == '__main__':
    main()
