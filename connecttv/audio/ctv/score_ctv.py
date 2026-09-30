#!/usr/bin/env python3
"""ConnectTV 'LIQUID POP' film score v2 "premiere night": D major -> Eb major, ~120 BPM feel-good pop-orchestral.  python3 score_ctv.py
(engines/sampler infrastructure adapted from the GOTV v7 score; composition, key, hook, tempo map are new.)
"""
import os
import re
import sys
import glob
import subprocess

import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from sampler import Sampler, std_parse, dyn_parse, load48, trim_onset  # noqa: E402

SMP = os.path.join(HERE, '..', 'v7', 'samples')      # VSCO-2-CE (core) + Virtuosity Drums, downloaded for the v7 score
VS = os.path.join(SMP, 'vsco')
VD = os.path.join(SMP, 'vd', 'Samples')
XS = os.path.join(HERE, 'samples_extra')             # extra VSCO-2-CE folders (flute, oboe, glock, solo violin, pizz, ethnic drums)
SF2 = os.path.join(HERE, 'sf', 'GeneralUser-GS.sf2')
SR = 48000
DUR = 34.1
N = int(round(SR * DUR))
RNG = np.random.default_rng(2027)

NOTE_IDX = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def m(name):
    if isinstance(name, (int, float, np.integer, np.floating)):
        return float(name)
    p = NOTE_IDX[name[0]]
    i = 1
    while i < len(name) and name[i] in '#b':
        p += 1 if name[i] == '#' else -1
        i += 1
    return float(p + 12 * (int(name[i:]) + 1))



def hum(ms=4.0):
    return float(RNG.uniform(-ms, ms)) / 1000


def rv(a, b):
    return int(RNG.integers(a, b + 1))


# ----------------------------------------------------------------------------------------------
# Parts
# ----------------------------------------------------------------------------------------------
class Part:
    def __init__(self, name, stem, engine, gain_db=0.0, pan=0.0, width=1.0, room=0.0, hall=0.25, eq=None):
        self.name, self.stem, self.engine = name, stem, engine
        self.gain = 10 ** (gain_db / 20)
        self.pan, self.width, self.room, self.hall, self.eq = pan, width, room, hall, eq or []
        self.notes = []
        self.ctl = []          # GM controllers
        self.auto = []         # (t, dB) expression breakpoints (sample-based parts)

    def n(self, t, dur, note, vel=90, **kw):
        if isinstance(note, (list, tuple)):
            for x in note:
                self.n(t, dur, x, vel, **kw)
            return
        self.notes.append([float(t), float(max(dur, 0.02)), m(note), int(np.clip(vel, 1, 127)), kw])

    def ex(self, t0, t1, d0, d1, curve=1.0, pre=True, post=True):
        if pre:
            self.auto.append((t0 - 0.02, 0.0))
        if post:
            self.auto.append((t1 + 0.03, 0.0))
        k = max(2, int((t1 - t0) / 0.02))
        for i in range(k + 1):
            u = i / k
            self.auto.append((t0 + (t1 - t0) * u, d0 + (d1 - d0) * u ** curve))

    def cc(self, t, num, val):
        self.ctl.append((float(t), 'cc', num, int(np.clip(val, 0, 127))))

    def expr(self, t0, t1, v0, v1, curve=1.0):
        k = max(2, int((t1 - t0) / 0.02))
        for i in range(k + 1):
            u = i / k
            self.cc(t0 + (t1 - t0) * u, 11, v0 + (v1 - v0) * u ** curve)

    def bend(self, t, semis):
        self.ctl.append((float(t), 'bend', semis, 0))


PARTS = {}


def part(name, *a, **k):
    PARTS[name] = Part(name, *a, **k)
    return PARTS[name]


# ---- engines ---------------------------------------------------------------------------------
_CACHE = {}


def vs(sub, offset=12, release=0.25, maxlen=None, gain=1.0, velcurve=1.6, filt=None, parse=std_parse):
    key = (sub, offset, release, maxlen)
    if key not in _CACHE:
        files = sorted(glob.glob(os.path.join(VS, sub, '*.wav')))
        if filt:
            files = [f for f in files if re.search(filt, os.path.basename(f))]
        _CACHE[key] = Sampler(files, parse, offset=offset, release=release, maxlen=maxlen, gain=gain,
                              velcurve=velcurve)
    return _CACHE[key]


def vd_piece(folder, stem_re, mics):
    """Virtuosity drums: blend mics per (layer, rr) into one stereo sample; key 0."""
    key = ('vd', folder, stem_re)
    if key in _CACHE:
        return _CACHE[key]
    groups = {}
    for mic, g in mics.items():
        for f in glob.glob(os.path.join(VD, mic, folder, f'{mic}_{stem_re}_vl*.flac')):
            mm = re.search(r'_vl(\d+)(?:_rr(\d+))?\.flac$', f)
            groups.setdefault((int(mm.group(1)), int(mm.group(2) or 1)), []).append((f, g))
    tmp = os.path.join(SMP, '_vdmix', f'{folder}_{stem_re}')
    os.makedirs(tmp, exist_ok=True)
    files = []
    for (vl, rr), lst in sorted(groups.items()):
        out = os.path.join(tmp, f'x_C4_v{vl}_rr{rr}.wav')
        if not os.path.exists(out):
            xs = [load48(f) * g for f, g in lst]
            L = max(len(x) for x in xs)
            y = np.zeros((L, 2))
            for x in xs:
                y[:len(x)] += x
            sf.write(out, y.astype(np.float32), SR, subtype='FLOAT')
        files.append(out)
    s = Sampler(files, std_parse, offset=0, release=0.15, trim=False, velcurve=1.3)
    _CACHE[key] = s
    return s


class SmpEngine:
    def __init__(self, fn, oneshot=None):
        self.fn, self.oneshot = fn, oneshot

    def render(self, p, notes):
        os_ = self.oneshot
        return self.fn().render([(t, max(d, os_) if os_ else d, n, v, kw) for t, d, n, v, kw in notes], N)


def tim():
    """5 timpani, keyed by their measured principal tones."""
    if 'timp' not in _CACHE:
        pitch = {1: 41.47, 2: 46.75, 3: 49.48, 4: 52.42, 5: 54.58}

        def parse(nm):
            mm = re.match(r'Timpani(\d)_Hit_v(\d)_rr(\d)', nm)
            return (pitch[int(mm.group(1))], int(mm.group(2)), int(mm.group(3))) if mm else None
        _CACHE['timp'] = Sampler(sorted(glob.glob(os.path.join(VS, 'Percussion/Timpani/Timpani*_Hit_*.wav'))), parse,
                                 offset=0, release=0.6, maxlen=4.0, velcurve=1.5)
    return _CACHE['timp']


def perc1(pattern, release=0.3, maxlen=None, velcurve=1.4):
    key = ('perc', pattern)
    if key not in _CACHE:
        files = sorted(glob.glob(os.path.join(VS, 'Percussion', pattern)))

        def parse(nm):
            v = re.search(r'_v(\d+)', nm)
            dyn = re.search(r'_(pp|p|mp|mf|f|ff|fff)(?:_|\.)', nm)
            lay = int(v.group(1)) if v else {'pp': 1, 'p': 2, 'mp': 3, 'mf': 4, 'f': 5, 'ff': 6, 'fff': 7}[dyn.group(1)]
            r_ = re.search(r'_rr(\d)', nm)
            return 60, lay, int(r_.group(1)) if r_ else 1
        _CACHE[key] = Sampler(files, parse, offset=0, release=release, maxlen=maxlen, velcurve=velcurve)
    return _CACHE[key]


# ---- numpy synths -----------------------------------------------------------------------------
def mtof(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(out, y, t):
    a = int(round(t * SR))
    if a >= N:
        return
    if y.ndim == 1:
        y = np.stack([y, y], 1)
    if a < 0:
        y, a = y[-a:], 0
    e = min(N, a + len(y))
    out[a:e] += y[:e - a]


def lp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, 'low', fs=SR, output='sos'), x, axis=0)


def hpf(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x, axis=0)


class TaikoEngine:
    """big taiko/trailer drum: pitched membrane body + skin slap + stick; layered with a concert-bass-drum sample."""
    def __init__(self, f0=62, decay=0.5, bd_mix=0.8, sub=0.0):
        self.f0, self.decay, self.bd_mix, self.sub = f0, decay, bd_mix, sub

    def render(self, p, notes):
        out = np.zeros((N, 2))
        bd = perc1('BDrumNewhit_*', release=0.4, maxlen=3.0)
        for i, (t, d, n, v, kw) in enumerate(notes):
            rng = np.random.default_rng(900 + i)
            L = int((self.decay * 3 + 0.2) * SR)
            tt = np.arange(L) / SR
            f0 = self.f0 * 2 ** ((n - 60) / 12) * rng.uniform(0.98, 1.02)
            f = f0 * (1 + 0.8 * np.exp(-tt / 0.025))
            ph = 2 * np.pi * np.cumsum(f) / SR
            y = np.sin(ph) * np.exp(-tt / self.decay)
            y += 0.45 * np.sin(ph * 1.52 + 1) * np.exp(-tt / (self.decay * 0.4))
            y += 0.25 * np.sin(ph * 2.3 + 2) * np.exp(-tt / (self.decay * 0.2))
            nz = rng.standard_normal(L)
            y += 0.7 * lp(nz, 1400) * np.exp(-tt / 0.03)
            y += 0.18 * hpf(nz, 2500) * np.exp(-tt / 0.004)
            if self.sub:
                fs = 0.99 * f0 * (1 + 0.6 * np.exp(-tt / 0.06))
                y += self.sub * np.sin(2 * np.pi * np.cumsum(fs) / SR) * np.exp(-tt / (self.decay * 1.8))
            y = np.tanh(1.5 * y) / 1.1
            a = int(0.0015 * SR)
            y[:a] *= np.linspace(0, 1, a)
            vv = (v / 127) ** 1.5
            st = np.stack([y, y], 1) * vv
            if self.bd_mix:
                b = bd.voice(60 + (n - 60) * 0.5, v, 2.5, 0.3)
                st[:min(len(b), L)] += self.bd_mix * b[:L] * 3.0
            place(out, st, t)
        return out


class BoomEngine:
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            L = int(d * SR)
            tt = np.arange(L) / SR
            f0, f1 = kw.get('f0', 90), max(28, kw.get('f1', 40))
            f = f1 + (f0 - f1) * np.exp(-tt / 0.1)
            y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (d * 0.33))
            nz = np.random.default_rng(40 + i).standard_normal(L) * np.exp(-tt / 0.012)
            y = np.tanh(1.7 * (y + 0.3 * lp(nz, 2000)))
            y[:96] *= np.linspace(0, 1, 96)
            place(out, y * (v / 127), t)
        return out


def saw_add(f, dur_n, ph0=0.0, nh=None, nyq=20000):
    """band-limited saw by additive synthesis, f may be an array (per-sample)."""
    f = np.broadcast_to(f, (dur_n,)).astype(float)
    ph = 2 * np.pi * np.cumsum(f) / SR + ph0
    fmax = f.max()
    K = nh or max(1, int(nyq / fmax))
    y = np.zeros(dur_n)
    for k in range(1, K + 1):
        y += np.sin(k * ph) / k
    return y * 0.55


class BraaamEngine:
    """trailer braaam synth layer (detuned saws + square-ish, filter swell, drive) - layered with real brass."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            L = int((d + 0.4) * SR)
            tt = np.arange(L) / SR
            f = mtof(n)
            y = np.zeros(L)
            for j, det in enumerate((-9, -3, 4, 10)):
                y += saw_add(f * 2 ** (det / 1200), L, ph0=j, nyq=6000)
            y += 0.6 * saw_add(f * 2, L, nyq=6000)
            env = np.minimum(1, tt / 0.04) * np.exp(-np.maximum(tt - 0.05, 0) / (d * 0.55))
            env[int(d * SR):] *= np.exp(-(tt[int(d * SR):] - d) / 0.12)
            fc = 180 + 2200 * np.exp(-tt / 0.18) + 400 * np.exp(-tt / 0.8)
            # time-varying lowpass: block-wise
            yo = np.zeros(L)
            zi = None
            blk = 480
            for b0 in range(0, L, blk):
                sos = signal.butter(2, min(fc[b0], 18000), 'low', fs=SR, output='sos')
                if zi is None:
                    zi = np.zeros((sos.shape[0], 2))
                yo[b0:b0 + blk], zi = signal.sosfilt(sos, y[b0:b0 + blk], zi=zi)
            yo = np.tanh(2.2 * yo * env) * (v / 127)
            st = np.stack([yo, np.roll(yo, 180)], 1)
            place(out, st, t)
        return out


def ks_string(f, dur, vel, seed, t60=1.2, bright=0.6, pick=0.15, mute_after=8):
    rng = np.random.default_rng(seed)
    n = int((dur + 0.5) * SR)
    P = SR / f
    L = int(np.floor(P - 0.5))
    fr = P - 0.5 - L
    c0, c1, c2 = 0.5 * (1 - fr), 0.5, 0.5 * fr
    gper = 10 ** (-3 / (t60 * f))
    ex = rng.uniform(-1, 1, L)
    a = 0.15 + 0.8 * bright * (vel / 127)
    ex = signal.lfilter([a], [1, -(1 - a)], ex)
    dd = max(1, int(pick * P))
    ex = ex - np.concatenate([np.zeros(dd), ex[:-dd]])
    y = np.zeros(n + L + 3)
    off = 3
    y[off:off + L] = ex
    pos, end, doff = off + L, off + n, off + int(dur * SR)
    while pos < end:
        k = min(L, end - pos)
        gg = gper if pos < doff else gper ** mute_after
        y[pos:pos + k] += gg * (c0 * y[pos - L:pos - L + k] + c1 * y[pos - L - 1:pos - L - 1 + k]
                                + c2 * y[pos - L - 2:pos - L - 2 + k])
        pos += k
    return y[off:end] * (vel / 127)


class GuitarEngine:
    """distorted power-chord guitar: KS strings (root/5th/octave), palm-mute via note length, amp + cab, double-tracked."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for side, (sd, dl) in enumerate(((11, 0.0), (29, 0.013))):
            di = np.zeros(N)
            for i, (t, d, n, v, kw) in enumerate(notes):
                pm = kw.get('pm', False)
                for j, iv in enumerate((0, 7, 12)):
                    s_ = ks_string(mtof(n + iv), d, v, sd * 1000 + i * 7 + j, t60=0.5 if pm else 1.6,
                                   bright=0.5 if pm else 0.8, mute_after=12)
                    place_1d(di, s_ * (0.7 if pm else 1.0), t + dl + j * 0.003 + hum(2))
            x = hpf(di, 110)
            x = x + 1.5 * hpf(x, 900)                     # pre-emphasis
            x = np.tanh(14 * x) + 0.3 * np.tanh(40 * x)
            x = lp(lp(x, 5200), 6500)
            x = x + 0.6 * signal.sosfilt(peq_sos(1900, 3, 1.0), x)
            x = signal.sosfilt(peq_sos(350, -3, 1.0), x)
            x = hpf(x, 85, 3) * 0.35
            if side == 0:
                out[:, 0] += x
                out[:, 1] += 0.25 * x
            else:
                out[:, 1] += x
                out[:, 0] += 0.25 * x
        return out


def place_1d(buf, y, t):
    a = int(round(t * SR))
    if a >= len(buf) or a < 0:
        return
    e = min(len(buf), a + len(y))
    buf[a:e] += y[:e - a]


class LeadEngine:
    """bright supersaw lead with glide, vibrato and filter envelope (anime fanfare)."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        notes = sorted(notes, key=lambda x: x[0])
        for i, (t, d, n, v, kw) in enumerate(notes):
            L = int((d + 0.25) * SR)
            tt = np.arange(L) / SR
            prev = notes[i - 1][2] if i > 0 and t - (notes[i - 1][0] + notes[i - 1][1]) < 0.05 else n
            glide = prev + (n - prev) * (1 - np.exp(-tt / 0.025))
            vib = 0.12 * np.sin(2 * np.pi * 6 * tt) * np.clip((tt - 0.15) / 0.2, 0, 1)
            f = mtof(glide + vib)
            y = np.zeros((L, 2))
            for j, det in enumerate((-14, -8, -3, 0, 3, 8, 14)):
                s_ = saw_add(f * 2 ** (det / 1200), L, ph0=j * 1.3, nyq=16000)
                pan = (j - 3) / 3 * 0.8
                y[:, 0] += s_ * np.sqrt(0.5 * (1 - pan))
                y[:, 1] += s_ * np.sqrt(0.5 * (1 + pan))
            y /= 3.5
            env = np.minimum(1, tt / 0.01) * (0.8 + 0.2 * np.exp(-tt / 0.1))
            env[int(d * SR):] *= np.exp(-(tt[int(d * SR):] - d) / 0.06)
            y = lp(y, 7500) * env[:, None] * (v / 127)
            place(out, y, t)
        return out


class SubEngine:
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for t, d, n, v, kw in notes:
            L = int((d + 0.08) * SR)
            tt = np.arange(L) / SR
            f = mtof(n)
            y = np.sin(2 * np.pi * f * tt) + 0.25 * saw_add(f, L, nh=6)
            env = np.minimum(1, tt / 0.006) * np.exp(-tt / 1.5)
            env[int(d * SR):] *= np.exp(-(tt[int(d * SR):] - d) / 0.02)
            place(out, lp(y * env, 400) * (v / 127), t)
        return out


def darbuka_hit(kind, vel, seed):
    rng = np.random.default_rng(seed)
    v = (vel / 127) ** 1.4
    if kind == 'doum':
        n = int(0.55 * SR)
        t = np.arange(n) / SR
        f = 73.4 * (1 + 0.35 * np.exp(-t / 0.018)) * rng.uniform(0.98, 1.02)
        ph = 2 * np.pi * np.cumsum(f) / SR
        y = np.sin(ph) * np.exp(-t / 0.22) + 0.35 * np.sin(ph * 1.59 + 0.3) * np.exp(-t / 0.07)
        y += 0.2 * np.sin(ph * 2.14) * np.exp(-t / 0.04)
        y += 0.5 * lp(rng.standard_normal(n) * np.exp(-t / 0.006), 900)
        y += 0.25 * np.sin(2 * np.pi * 240 * t) * np.exp(-t / 0.05)
        return np.tanh(1.6 * y) / 1.2 * v
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    modes = [(680, 0.035, 0.5), (1420, 0.02, 0.45), (2550, 0.012, 0.4), (3900, 0.008, 0.3)] if kind == 'tek' else \
        [(610, 0.028, 0.5), (1300, 0.016, 0.4), (2300, 0.01, 0.3)]
    y = np.zeros(n)
    for fr, dec, a in modes:
        y += a * np.sin(2 * np.pi * fr * rng.uniform(0.985, 1.015) * t + rng.uniform(0, 6)) * np.exp(-t / dec)
    y += 0.9 * hpf(rng.standard_normal(n) * np.exp(-t / 0.004), 2500 if kind == 'tek' else 1800)
    return y * v * (1.0 if kind == 'tek' else 0.6) * 0.9


class DarbEngine:
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            k = kw.get('kind', 'doum')
            h = darbuka_hit(k, v, 700 + i)
            pan = -0.1 if k == 'doum' else 0.2
            place(out, np.stack([h * np.sqrt(1 - pan), h * np.sqrt(1 + pan)], 1), t)
        return out


class KanunEngine:
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            s_ = ks_string(mtof(n), d, v, 300 + i, t60=0.9, bright=0.9, pick=0.08)
            s_ = s_ + 0.5 * ks_string(mtof(n) * 1.0015, d, v, 800 + i, t60=0.9, bright=0.9, pick=0.1)
            place(out, np.stack([s_, np.roll(s_, 40)], 1) * 0.6, t)
        return hpf(out, 150)


class RiserEngine:
    """filtered-noise riser + rising tone, or a real suspended-cymbal crescendo aligned so its peak lands on t."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            kind = kw.get('kind', 'noise')
            if kind == 'cym':
                fn = {'s': 'susCymb1-cresc-Short_v1.wav', 'm': 'susCymb1-cresc-Median_v1.wav',
                      'l': 'susCymb1-cresc-Long_v1.wav'}[kw.get('len', 's')]
                x = load48(os.path.join(VS, 'Percussion', fn))
                env = np.abs(x).max(1)
                env = np.convolve(env, np.ones(2400) / 2400, mode='same')
                pk = int(np.argmax(env))
                a = max(0, pk - int(d * SR))
                y = x[a:pk + int(0.05 * SR)].copy()
                fi = min(len(y), int(0.3 * SR))
                y[:fi] *= np.linspace(0, 1, fi)[:, None]
                y[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))[:, None]
                y = y / (np.max(np.abs(y)) + 1e-9) * (v / 127)
                place(out, y, t - (len(y) - int(0.05 * SR)) / SR)
                continue
            L = int(d * SR)
            tt = np.arange(L) / SR
            x = np.random.default_rng(60 + i).standard_normal(L)
            ff, ts, Z = signal.stft(x, fs=SR, nperseg=1024)
            u = np.clip(ts / d, 0, 1)
            fc = kw.get('lo', 300) * (kw.get('hi', 9000) / kw.get('lo', 300)) ** (u ** 1.8)
            mask = np.exp(-0.5 * ((np.log2(np.maximum(ff, 1))[:, None] - np.log2(fc)[None, :]) / 0.6) ** 2)
            _, y = signal.istft(Z * mask, fs=SR, nperseg=1024)
            y = y[:L]
            fr = mtof(kw.get('n0', 45)) * 2 ** (kw.get('oct', 2.5) * (tt / d) ** 1.5)
            y = y / (np.std(y) + 1e-9) * 0.3 + 0.25 * lp(saw_add(fr, L, nyq=8000), 4000)
            y *= (tt / d) ** 2.2
            y[-240:] *= np.linspace(1, 0, 240)
            place(out, np.stack([y, np.roll(y, 300)], 1) * (v / 127) * 0.5, t)
        return out


# ---- EQ helpers ------------------------------------------------------------------------------
def peq_sos(f0, gdb, q):
    A = 10 ** (gdb / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]
    a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return signal.tf2sos(np.array(b) / a[0], np.array(a) / a[0])


def shelf_sos(f0, gdb, hi=True, S=0.8):
    A = 10 ** (gdb / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / 2 * np.sqrt((A + 1 / A) * (1 / S - 1) + 2)
    c = np.cos(w)
    sA = 2 * np.sqrt(A) * al
    if hi:
        b = [A * ((A + 1) + (A - 1) * c + sA), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sA)]
        a = [(A + 1) - (A - 1) * c + sA, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sA]
    else:
        b = [A * ((A + 1) - (A - 1) * c + sA), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sA)]
        a = [(A + 1) + (A - 1) * c + sA, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sA]
    return signal.tf2sos(np.array(b) / a[0], np.array(a) / a[0])


def hp_sos(f, o=2):
    return signal.butter(o, f, 'high', fs=SR, output='sos')




# ---- GM soundfont via the fluidsynth CLI (choir aahs / voice oohs / celesta) -----------------------
class GMEngine:
    """renders notes + CC11 expression + pitch bends through GeneralUser GS with the fluidsynth command line."""
    def __init__(self, prog, bank=0, bendrange=2):
        self.prog, self.bank, self.br = prog, bank, bendrange

    def render(self, p, notes):
        import mido
        import tempfile
        mid = mido.MidiFile(ticks_per_beat=960)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tempo = 500000                       # 120 BPM -> 1 s = 2 beats = 1920 ticks
        tr.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))
        tick = lambda t: int(round(t * 1920))
        ev = []
        ev.append((0, 0, mido.Message('control_change', control=101, value=0)))
        ev.append((0, 0, mido.Message('control_change', control=100, value=0)))
        ev.append((0, 0, mido.Message('control_change', control=6, value=self.br)))
        ev.append((0, 0, mido.Message('control_change', control=7, value=127)))
        ev.append((0, 0, mido.Message('control_change', control=11, value=127)))
        ev.append((0, 0, mido.Message('program_change', program=self.prog)))
        for t, d, n, v, kw in notes:
            ev.append((tick(t), 2, mido.Message('note_on', note=int(round(n)), velocity=int(v))))
            ev.append((tick(t + d), 1, mido.Message('note_off', note=int(round(n)), velocity=0)))
        for t, kind, a, b in p.ctl:
            if kind == 'cc':
                ev.append((tick(t), 1, mido.Message('control_change', control=a, value=b)))
            else:
                pb = int(np.clip(8192 + a / self.br * 8192, 0, 16383)) - 8192
                ev.append((tick(t), 1, mido.Message('pitchwheel', pitch=int(np.clip(pb, -8192, 8191)))))
        endt = max([t + d for t, d, *_ in notes] + [1.0]) + 3.0
        ev.append((tick(endt), 9, mido.MetaMessage('end_of_track')))
        ev.sort(key=lambda e: (e[0], e[1]))
        last = 0
        for tk, _, msg in ev:
            msg.time = tk - last
            last = tk
            tr.append(msg)
        with tempfile.TemporaryDirectory() as td:
            mp, wp = os.path.join(td, 'a.mid'), os.path.join(td, 'a.wav')
            mid.save(mp)
            subprocess.check_call(['fluidsynth', '-ni', '-q', '-r', str(SR), '-g', '0.8',
                                   '-o', 'synth.reverb.active=0', '-o', 'synth.chorus.active=0',
                                   '-F', wp, SF2, mp], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            x, sr = sf.read(wp, always_2d=True, dtype='float64')
        out = np.zeros((N, 2))
        k = min(N, len(x))
        out[:k] = x[:k, :2]
        return out


def resamp_var(x, ratio):
    """variable-rate resampling of a stereo array; ratio is per output sample (playback speed)."""
    pos = np.cumsum(ratio) - ratio[0]
    m_ = pos < len(x) - 2
    pos = pos[m_]
    i0 = pos.astype(int)
    fr = (pos - i0)[:, None]
    return x[i0] * (1 - fr) + x[i0 + 1] * fr


class WindEngine:
    """sample-based flute/oboe with portamento, scoops, vibrato and a looped sustain (for bansuri / ney / duduk-like lines).
    kw: from=semitone offset to glide from, gl=glide time, vib=depth semitones, vr=vibrato rate, vd=vibrato delay."""
    def __init__(self, sampler_fn, gain=1.0):
        self.fn, self.gain = sampler_fn, gain

    def render(self, p, notes):
        smp = self.fn()
        out = np.zeros((N, 2))
        for t, d, n, v, kw in notes:
            k, x, li, nl = smp.pick(n, v)
            base = 2 ** ((n - k) / 12)
            L = int((d + 0.25) * SR)
            tt = np.arange(L) / SR
            sm = kw.get('from', 0.0) * np.exp(-tt / max(kw.get('gl', 0.06), 1e-3))
            vib = kw.get('vib', 0.18) * np.sin(2 * np.pi * kw.get('vr', 5.6) * tt) * np.clip((tt - kw.get('vd', 0.2)) / 0.25, 0, 1)
            bend = kw.get('bend')
            bd = 0.0
            if bend:                                   # (semitones, start_frac): slide at the end of the note (sob / fall)
                bd = bend[0] * np.clip((tt / d - bend[1]) / max(1e-3, 1 - bend[1]), 0, 1) ** 1.5
            ratio = base * 2 ** ((sm + vib + bd) / 12)
            need = int(L * ratio.max() * 1.05) + 16
            xs = x
            if len(xs) < need:                          # loop the sustain part with an equal-power crossfade
                a0 = int(0.35 * len(xs)); a1 = int(0.85 * len(xs)); xf = int(0.08 * SR)
                seg = xs[a0:a1]
                buf = [xs[:a1]]
                tot = a1
                while tot < need:
                    prev = buf[-1]
                    nxt = seg.copy()
                    w = np.linspace(0, 1, xf)[:, None]
                    prev = prev.copy()
                    prev[-xf:] = prev[-xf:] * np.cos(w * np.pi / 2) + nxt[:xf] * np.sin(w * np.pi / 2)
                    buf[-1] = prev
                    buf.append(nxt[xf:])
                    tot += len(nxt) - xf
                xs = np.concatenate(buf)
            y = resamp_var(xs[:need], ratio)[:L]
            L = len(y)
            env = np.ones(L)
            a = int(kw.get('att', 0.03) * SR)
            env[:a] *= np.linspace(0, 1, a)
            n_on = int(d * SR)
            if n_on < L:
                r = L - n_on
                env[n_on:] *= np.linspace(1, 0, r) ** 1.5
            g = (v / 127) ** 1.2 * smp.keynorm[k] * self.gain
            place(out, y * env[:, None] * g, t)
        return out


class SitarEngine:
    """plucked sitar-like string: KS with a jawari-style buzz (asymmetric soft clip = grazing bridge), bright 2-5 kHz body,
    sympathetic-string resonances (tuned to the tonic/fifth) and meend slides.  kw: from (semitones, start offset), gl (glide s)."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            f = mtof(n)
            s_ = ks_string(f, d, v, 1200 + i, t60=kw.get('t60', 1.1), bright=1.0, pick=0.04, mute_after=kw.get('mute', 3))
            L = len(s_)
            tt = np.arange(L) / SR
            fr = kw.get('from', 0.0)
            if fr:
                ratio = 2 ** ((fr * np.exp(-tt / kw.get('gl', 0.08))) / 12)
                s_ = resamp_var(np.stack([s_, s_], 1), ratio)[:, 0]
            z = np.tanh(5.0 * s_ + 1.2 * s_ ** 2) * 0.55                    # jawari buzz
            z = z + 0.14 * hpf(np.tanh(9.0 * s_), 2200) * np.exp(-tt[:len(z)] / 0.25)   # bright buzzing top
            z = z + 0.5 * signal.sosfilt(peq_sos(f * 2.0, 8, 6.0), z)
            z = signal.sosfilt(peq_sos(2600, 3, 0.9), z)
            for sf_ in (mtof(62), mtof(69), mtof(74)):               # sympathetic strings D4 A4 D5
                z = z + 0.18 * signal.sosfilt(peq_sos(sf_, 20, 40.0), z)
            z = hpf(lp(z, 7500), 140)
            place(out, np.stack([z, np.roll(z, 55)], 1) * 0.5, t)
        return out


class HarmoniumEngine:
    """harmonium: three detuned reed voices (musette), reedy odd-rich wave, bellows tremolo, nasal EQ; kw: trem (Hz)"""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            L = int((d + 0.15) * SR)
            tt = np.arange(L) / SR
            f = mtof(n)
            y = np.zeros(L)
            for det in (-7, 0, 6):
                fr = f * 2 ** (det / 1200)
                ph = 2 * np.pi * fr * tt
                K = int(min(3800 / fr, 28))
                for k in range(1, K + 1):
                    y += np.sin(k * ph + 0.7 * k * det / 1200) / k ** 0.85
            y *= 1 + kw.get('td', 0.06) * np.sin(2 * np.pi * kw.get('trem', 5.0) * tt)
            env = np.minimum(1, tt / 0.03)
            n_on = int(d * SR)
            env[n_on:] *= np.exp(-(tt[n_on:] - d) / 0.05)
            y = lp(y, 3200) * env
            y = signal.sosfilt(peq_sos(1100, 5, 1.0), y)
            y = y / (np.max(np.abs(y)) + 1e-9) * (v / 127) * 0.35
            place(out, np.stack([y, np.roll(y, 70)], 1), t)
        return out


class VoxEngine:
    """formant-synthesised female 'aa' (F1 850, F2 1220, F3 2810 Hz) with vibrato, portamento and gamak trills (ornamental vocalise, no words).
    kw: from, gl, vib, trill=(semitones, rate Hz), vd (vibrato delay)"""
    FORM = [(850, 100, 1.0), (1220, 120, 0.6), (2810, 200, 0.28), (3600, 260, 0.12)]

    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            rng = np.random.default_rng(6000 + i)
            L = int((d + 0.2) * SR)
            tt = np.arange(L) / SR
            semi = kw.get('from', 0.0) * np.exp(-tt / kw.get('gl', 0.05))
            vib = kw.get('vib', 0.28) * np.sin(2 * np.pi * 5.9 * tt) * np.clip((tt - kw.get('vd', 0.12)) / 0.2, 0, 1)
            tr = kw.get('trill')
            if tr:
                semi = semi + tr[0] * 0.5 * (1 - np.cos(2 * np.pi * tr[1] * tt)) * np.clip((tt - 0.06) / 0.06, 0, 1)
            fcur = mtof(n + semi + vib)
            ph = 2 * np.pi * np.cumsum(fcur) / SR
            f0b = mtof(n)
            K = int(min(5200 / f0b, 40))
            y = np.zeros(L)
            for k in range(1, K + 1):
                fk = k * f0b
                a = sum(g * np.exp(-0.5 * ((fk - fc) / bw) ** 2) for fc, bw, g in self.FORM) + 0.03
                y += a / k * np.sin(k * ph)
            y += 0.05 * hpf(lp(rng.standard_normal(L), 5000), 2000) * np.minimum(1, tt / 0.05)
            env = np.minimum(1, tt / 0.03)
            n_on = int(d * SR)
            env[n_on:] *= np.exp(-(tt[n_on:] - d) / 0.06)
            env *= 1 - 0.18 * (0.5 - 0.5 * np.cos(2 * np.pi * 5.9 * tt)) * np.clip((tt - 0.15) / 0.2, 0, 1)
            y = y * env
            y = y / (np.max(np.abs(y)) + 1e-9) * (v / 127) * 0.5
            place(out, np.stack([y, np.roll(y, 45)], 1), t)
        return out


class TablaEngine:
    """synthetic tabla/dhol-ish hits: kinds: ge (bayan bass with pitch rise), na (dayan ring), tin, dha (both), tak, dhol (deep + skin)."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            rng = np.random.default_rng(3000 + i)
            k = kw.get('kind', 'ge')
            vv = (v / 127) ** 1.3
            L = int(0.7 * SR)
            tt = np.arange(L) / SR
            y = np.zeros(L)
            if k in ('ge', 'dha', 'dhol'):
                f0 = (73.4 if k != 'dhol' else 55.0) * 2 ** ((n - 60) / 12)
                f = f0 * (1 + 0.45 * np.exp(-tt / 0.03) - 0.25 * np.exp(-tt / 0.012) * 0)
                f = f0 * (0.8 + 0.2 * (1 - np.exp(-tt / 0.06))) * (1 + 0.5 * np.exp(-tt / 0.02))
                ph = 2 * np.pi * np.cumsum(f) / SR
                y += np.sin(ph) * np.exp(-tt / (0.18 if k != 'dhol' else 0.26))
                y += 0.3 * np.sin(1.5 * ph + 0.4) * np.exp(-tt / 0.05)
                y += 0.55 * lp(rng.standard_normal(L), 1100) * np.exp(-tt / 0.012)
            if k in ('na', 'tin', 'dha'):
                fd = 370.0 * 2 ** ((n - 60) / 12) if k != 'tin' else 587.3 * 2 ** ((n - 60) / 12)
                for j, (r_, a_, dc) in enumerate(((1, 1.0, 0.16), (2.0, 0.55, 0.1), (3.0, 0.4, 0.07), (4.1, 0.25, 0.04))):
                    y += 0.55 * a_ * np.sin(2 * np.pi * fd * r_ * tt + j) * np.exp(-tt / (dc if k != 'na' else dc * 0.6))
                y += 0.5 * hpf(rng.standard_normal(L) * np.exp(-tt / 0.004), 2000)
            if k == 'tak':
                y += 0.9 * hpf(rng.standard_normal(L) * np.exp(-tt / 0.006), 1800)
                y += 0.4 * np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt / 0.01)
            if k == 'dhol':
                y += 0.7 * hpf(lp(rng.standard_normal(L), 4500), 800) * np.exp(-tt / 0.02)
            y = np.tanh(1.5 * y) / 1.2 * vv
            y[:24] *= np.linspace(0, 1, 24)
            pan = kw.get('pan', 0.0)
            place(out, np.stack([y * np.sqrt(1 - pan), y * np.sqrt(1 + pan)], 1), t)
        return out


class ZapEngine:
    """the bolt: electric crack (pitch-dived sine + noise burst + comb buzz) - a synthesised sting for the screen crack."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            rng = np.random.default_rng(4000 + i)
            L = int(d * SR)
            tt = np.arange(L) / SR
            f = 90 + 5200 * np.exp(-tt / 0.03)
            y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16)
            nz = rng.standard_normal(L)
            y += 0.9 * hpf(nz, 2500) * np.exp(-tt / 0.05)
            # crackle: sparse random clicks decaying
            cl = (rng.random(L) < 0.004 * np.exp(-tt / 0.12)) * rng.standard_normal(L) * 3
            y += hpf(cl, 1500)
            y = np.tanh(2.5 * y) * np.exp(-tt / (d * 0.5))
            y[:48] *= np.linspace(0, 1, 48)
            place(out, np.stack([y, np.roll(y, 120)], 1) * (v / 127) * 0.6, t)
        return out


class ShimmerEngine:
    """sparkle: rapid random high sine 'glints' (magic dust) within a note window; kw: lo, hi midi range, dens per s."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            rng = np.random.default_rng(5000 + i)
            dens = kw.get('dens', 60)
            scale = kw.get('scale', [0, 2, 4, 7, 9])
            root = kw.get('root', 7)
            k = int(d * dens)
            for j in range(k):
                u = rng.random()
                tj = t + u * d
                o = rng.integers(kw.get('o0', 6), kw.get('o1', 8))
                nn = 12 * o + root + scale[rng.integers(0, len(scale))]
                fr = mtof(nn)
                Lg = int(0.25 * SR)
                tg = np.arange(Lg) / SR
                g = np.sin(2 * np.pi * fr * tg) * np.exp(-tg / 0.06) + 0.3 * np.sin(2 * np.pi * fr * 2.76 * tg) * np.exp(-tg / 0.03)
                g[:20] *= np.linspace(0, 1, 20)
                amp = (v / 127) * (0.25 + 0.75 * (1 - abs(u - kw.get('peak', 0.5)))) * 0.25
                pan = rng.uniform(-0.8, 0.8)
                place(out, np.stack([g * np.sqrt(0.5 * (1 - pan)), g * np.sqrt(0.5 * (1 + pan))], 1) * amp, tj)
        return out


def bass_synth_note(f, L, drive=2.0):
    tt = np.arange(L) / SR
    y = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)
    return np.tanh(drive * y)
# ----------------------------------------------------------------------------------------------
# Instruments
# ----------------------------------------------------------------------------------------------
E = SmpEngine
vln_sp = part('vln_sp', 'strings', E(lambda: vs('Strings/Violin Section/Spic', release=0.12)), pan=-0.35, width=1.2, hall=0.3)
vla_sp = part('vla_sp', 'strings', E(lambda: vs('Strings/Viola Section/spic', release=0.12)), pan=0.1, hall=0.28)
vc_sp = part('vc_sp', 'strings', E(lambda: vs('Strings/Cello Section/spic', release=0.12)), pan=0.3, hall=0.25)
cb_sp = part('cb_sp', 'strings', E(lambda: vs('Strings/Solo Contrabass/Spic', release=0.15)), pan=0.35, hall=0.22)
vln_su = part('vln_su', 'strings', E(lambda: vs('Strings/Violin Section/susVib', release=0.45)), pan=-0.3, width=1.3, hall=0.4)
vla_su = part('vla_su', 'strings', E(lambda: vs('Strings/Viola Section/susvib', release=0.45)), pan=0.1, hall=0.38)
vc_su = part('vc_su', 'strings', E(lambda: vs('Strings/Cello Section/susvib', release=0.45)), pan=0.28, hall=0.35)
cb_su = part('cb_su', 'strings', E(lambda: vs('Strings/Solo Contrabass/SusVib', release=0.4)), pan=0.35, hall=0.3)
vln_tr = part('vln_tr', 'strings', E(lambda: vs('Strings/Violin Section/Trem', release=0.35)), pan=-0.25, width=1.3, hall=0.4)
vc_tr = part('vc_tr', 'strings', E(lambda: vs('Strings/Cello Section/trem', release=0.35)), pan=0.28, hall=0.35)
harp = part('harp', 'choir', E(lambda: vs('Strings/Harp', offset=0, release=0.8, parse=lambda nm: (
    re.search(r'_([A-G]#?\d)_', nm).group(1), 1, 1))), pan=-0.3, width=1.2, hall=0.45)
hn_su = part('hn_su', 'brass', E(lambda: vs('Brass/F Horn/sus', release=0.3)), pan=-0.28, width=1.2, hall=0.42)
hn_st = part('hn_st', 'brass', E(lambda: vs('Brass/F Horn/stac', release=0.15)), pan=-0.28, width=1.2, hall=0.42)
tp_su = part('tp_su', 'brass', E(lambda: vs('Brass/Trumpet/sus', release=0.25)), pan=0.25, hall=0.35)
tp_st = part('tp_st', 'brass', E(lambda: vs('Brass/Trumpet/stac', release=0.12)), pan=0.25, hall=0.35)
tb_su = part('tb_su', 'brass', E(lambda: vs('Brass/Tenor Trombone/sus', release=0.3)), pan=0.12, hall=0.33)
tb_st = part('tb_st', 'brass', E(lambda: vs('Brass/Tenor Trombone/stac', release=0.15)), pan=0.12, hall=0.33)
tu_su = part('tu_su', 'brass', E(lambda: vs('Brass/Tuba/sus', release=0.3, filt='_rr1_')), pan=0.05, hall=0.28)
tu_st = part('tu_st', 'brass', E(lambda: vs('Brass/Tuba/stac', release=0.15)), pan=0.05, hall=0.28)
timp = part('timp', 'perc', E(tim), hall=0.33, room=0.1)
bd = part('bd', 'perc', E(lambda: perc1('BDrumNewhit_*', release=0.5, maxlen=4.0)), hall=0.35)
osn = part('osn', 'perc', E(lambda: perc1('Snare2-HitSN_*', release=0.2, maxlen=1.5)), pan=-0.1, hall=0.3, room=0.15)
oroll = part('oroll', 'perc', E(lambda: perc1('Snare2-rollSN_v5*', release=0.08, maxlen=9.0)), pan=-0.1, hall=0.3)
ocym = part('ocym', 'perc', E(lambda: perc1('cymbal-crash1_*', release=1.5, maxlen=6.0)), width=1.4, hall=0.35)
gong = part('gong', 'perc', E(lambda: perc1('gongHit_*', release=2.0, maxlen=8.0)), width=1.3, hall=0.3)
tamb = part('tamb', 'perc', E(lambda: perc1('Tamb1-Hit_*', release=0.1, maxlen=1.0)), pan=0.35, hall=0.2)
piano = part('piano', 'choir', E(lambda: Sampler(sorted(glob.glob(os.path.join(VS, 'Keys/Upright Nr1/UR1_*.wav'))), dyn_parse,
                                                   offset=0, release=0.6, maxlen=6.0, velcurve=1.4)), width=0.9, hall=0.45)
kick = part('kick', 'drums', E(lambda: vd_piece('kick', 'kick_snoff', {'kickmic': 1.0, 'mid': 0.45, 'room': 0.3}), oneshot=1.2), room=0.08)
snare = part('snare', 'drums', E(lambda: vd_piece('snare', 'snare_rimshot', {'mid': 1.0, 'room': 0.5, 'kickmic': 0.15}), oneshot=1.2), room=0.2, hall=0.12)
snc = part('snc', 'drums', E(lambda: vd_piece('snare', 'snare_center', {'mid': 1.0, 'room': 0.45}), oneshot=1.2), room=0.2, hall=0.1)
hh = part('hh', 'drums', E(lambda: vd_piece('hh', 'hh_closed', {'mid': 1.0, 'room': 0.25}), oneshot=0.3), pan=0.25, room=0.1)
hho = part('hho', 'drums', E(lambda: vd_piece('hh', 'hh_open', {'mid': 1.0, 'room': 0.25}), oneshot=0.5), pan=0.25, room=0.1)
crash = part('crash', 'drums', E(lambda: vd_piece('crash', 'crash_crash', {'mid': 1.0, 'room': 0.4})), pan=-0.2, width=1.3, hall=0.15)
tomh = part('tomh', 'drums', E(lambda: vd_piece('htom', 'htom_center', {'mid': 1.0, 'room': 0.4, 'kickmic': 0.2}), oneshot=1.2), pan=0.15, room=0.2, hall=0.1)
toml = part('toml', 'drums', E(lambda: vd_piece('ltom', 'ltom_center', {'mid': 1.0, 'room': 0.4, 'kickmic': 0.3}), oneshot=1.2), pan=-0.15, room=0.2, hall=0.1)
taiko = part('taiko', 'perc', TaikoEngine(62, 0.45, 0.6), width=1.3, room=0.15, hall=0.3)
trailer = part('trailer', 'perc', TaikoEngine(48, 0.9, 1.0, sub=0.6), width=1.2, hall=0.45)
boom = part('boom', 'fx', BoomEngine(), hall=0.2)
braaam = part('braaam', 'fx', BraaamEngine(), width=1.2, hall=0.35)
riser = part('riser', 'fx', RiserEngine(), width=1.4, hall=0.3)
gtr = part('gtr', 'synth', GuitarEngine(), room=0.1, hall=0.08)
lead = part('lead', 'synth', LeadEngine(), hall=0.3)
sub = part('sub', 'synth', SubEngine(), hall=0.0)
darb = part('darb', 'perc', DarbEngine(), room=0.2, hall=0.2)
kanun = part('kanun', 'choir', KanunEngine(), pan=0.3, hall=0.35)

choir = part('choir', 'choir', GMEngine(52), width=1.4, hall=0.5)
oohs = part('oohs', 'choir', GMEngine(53), width=1.4, hall=0.5)
celesta = part('celesta', 'choir', GMEngine(8), pan=0.3, width=1.2, hall=0.45)


def xs(sub, offset=12, release=0.25, maxlen=None, gain=1.0, velcurve=1.6, filt=None, parse=std_parse):
    key = ('xs', sub, offset, release, maxlen, filt)
    if key not in _CACHE:
        files = sorted(glob.glob(os.path.join(XS, sub, '*.wav')))
        if filt:
            files = [f for f in files if re.search(filt, os.path.basename(f))]
        _CACHE[key] = Sampler(files, parse, offset=offset, release=release, maxlen=maxlen, gain=gain, velcurve=velcurve)
    return _CACHE[key]


def pf_parse(name):
    """LLVln_Pizz_A4_f_RR1 / LLVln_ArcoVib_A4_p : p -> layer 1, f -> layer 2"""
    toks = name.rsplit('.', 1)[0].split('_')
    note = next((t for t in toks if re.match(r'^[A-G]#?-?\d$', t)), None)
    if note is None:
        return None
    lay = 2 if 'f' in toks else 1
    return note, lay, 1


def glk_parse(name):
    mm = re.search(r'_([A-G]#?\d)\.wav', name)
    return (mm.group(1), 1, 1) if mm else None


def dyn_any(name):
    """ethnic drum names ..._hit_f_2.wav / _pp_ / _ff_ ; key fixed (60)"""
    mm = re.search(r'_(ppp|pp|p|mp|mf|f|ff|fff)_(\d)', name)
    if not mm:
        return None
    return 60, {'ppp': 1, 'pp': 2, 'p': 3, 'mp': 4, 'mf': 5, 'f': 6, 'ff': 7, 'fff': 8}[mm.group(1)], int(mm.group(2))


ETH = 'VSCO 1 Percussion/drums/other/ethnic'
# winds (bansuri / ney / duduk colours), solo violin, pizzicati, glockenspiel
flute_sv = part('flute_sv', 'choir', WindEngine(lambda: xs('Woodwinds/Flute/susvib', 12, release=0.2)), pan=-0.2, width=1.1, hall=0.45)
flute_ex = part('flute_ex', 'choir', WindEngine(lambda: xs('Woodwinds/Flute/expvib', 12, release=0.2)), pan=-0.2, width=1.1, hall=0.45)
flute_nv = part('flute_nv', 'choir', WindEngine(lambda: xs('Woodwinds/Flute/susNV', 12, release=0.2)), pan=-0.15, width=1.1, hall=0.45)
oboe = part('oboe', 'choir', WindEngine(lambda: xs('Woodwinds/Oboe/Vib', 12, release=0.2)), pan=0.15, width=1.0, hall=0.45)
vln_solo = part('vln_solo', 'strings', WindEngine(lambda: xs('Strings/Solo Violin/Arco Vib', 0, release=0.3, parse=pf_parse)), pan=-0.1, hall=0.45)
vlnpz = part('vlnpz', 'strings', E(lambda: xs('Strings/Violin Section/Pizz', 12, release=0.25)), pan=-0.3, width=1.2, hall=0.3)
vlapz = part('vlapz', 'strings', E(lambda: xs('Strings/Viola Section/pizz', 12, release=0.25)), pan=0.1, hall=0.28)
vcpz = part('vcpz', 'strings', E(lambda: xs('Strings/Cello Section/pizzT', 12, release=0.25)), pan=0.3, hall=0.25)
cbpz = part('cbpz', 'strings', E(lambda: xs('Strings/Solo Contrabass/Pizz', 12, release=0.25)), pan=0.35, hall=0.22)
vsol_sp = part('vsol_sp', 'strings', E(lambda: xs('Strings/Solo Violin/spic', 12, release=0.1)), pan=-0.15, hall=0.3)
vsol_tr = part('vsol_tr', 'strings', E(lambda: xs('Strings/Solo Violin/Trem', 12, release=0.3)), pan=-0.15, hall=0.4)
glock = part('glock', 'choir', E(lambda: xs('Percussion/Glock', 12, release=0.6, parse=glk_parse)), pan=0.3, hall=0.4)
dhol_h = part('dhol_h', 'perc', E(lambda: xs(ETH + '/giant/hand', 0, release=0.3, parse=dyn_any, maxlen=2.0)), pan=-0.1, hall=0.2, room=0.2)
dhol_s = part('dhol_s', 'perc', E(lambda: xs(ETH + '/giant/sticks', 0, release=0.2, parse=dyn_any, maxlen=1.5)), pan=0.1, hall=0.2, room=0.2)
conga_o = part('conga_o', 'perc', E(lambda: xs(ETH + '/congo/open', 0, release=0.2, parse=dyn_any, maxlen=1.2, filt='ethnicHighOpen|ethnicLowOpen')), pan=0.2, hall=0.2, room=0.2)
# 'days' stem: the 7 day-pop notes (harp + violin pizzicato) - separate so the mixer can keep or drop them
harp_d = part('harp_d', 'days', E(lambda: vs('Strings/Harp', offset=0, release=0.9, parse=lambda nm: (
    re.search(r'_([A-G]#?\d)_', nm).group(1), 1, 1))), pan=-0.2, width=1.2, hall=0.45)
pz_d = part('pz_d', 'days', E(lambda: xs('Strings/Violin Section/Pizz', 12, release=0.25)), pan=-0.1, hall=0.3)
pno_d = part('pno_d', 'days', E(lambda: Sampler(sorted(glob.glob(os.path.join(VS, 'Keys/Upright Nr1/UR1_*.wav'))), dyn_parse,
                                                offset=0, release=0.8, maxlen=6.0, velcurve=1.4)), width=0.9, hall=0.45)
sitar = part('sitar', 'choir', SitarEngine(), pan=0.2, hall=0.28)
vln_si = part('vln_si', 'strings', E(lambda: vs('Strings/Violin Section/Spic', release=0.12)), pan=-0.3, width=1.2, hall=0.3)
vla_si = part('vla_si', 'strings', E(lambda: vs('Strings/Viola Section/spic', release=0.12)), pan=0.1, hall=0.28)
harmon = part('harmon', 'choir', HarmoniumEngine(), pan=-0.1, hall=0.3)
vox = part('vox', 'choir', VoxEngine(), pan=0.0, width=1.1, hall=0.42)
shehnai = part('shehnai', 'choir', WindEngine(lambda: xs('Woodwinds/Oboe/Vib', 12, release=0.2)), pan=0.12, width=1.0, hall=0.35,
               eq=[peq_sos(1300, 5, 1.1), peq_sos(2600, 4, 1.4), shelf_sos(5000, 2.0)])
tabla = part('tabla', 'perc', TablaEngine(), room=0.2, hall=0.15)
zap = part('zap', 'fx', ZapEngine(), hall=0.25)
shim = part('shim', 'fx', ShimmerEngine(), width=1.4, hall=0.4)

cb_dr = part('cb_dr', 'strings', E(lambda: vs('Strings/Solo Contrabass/SusVib', release=0.4)), pan=0.35, hall=0.3)
vc_dr = part('vc_dr', 'strings', E(lambda: vs('Strings/Cello Section/susvib', release=0.45)), pan=0.28, hall=0.35)

# balance trims (dB); calibrated by the per-part level report (see report())
TRIM = dict(taiko=-14, trailer=-16, sub=-21, kick=-4, snare=4, hh=9, hho=6, crash=2, tomh=4, toml=4, snc=2,
            vc_sp=7, vla_sp=7, vln_sp=9, cb_sp=12, vln_su=15, vla_su=3, vc_su=6, cb_su=7, vln_tr=3, vc_tr=3,
            hn_su=15, hn_st=12, tp_su=4, tp_st=10, tb_su=9, tb_st=9, tu_su=10, tu_st=13, choir=1, oohs=1,
            timp=10, ocym=5, gong=3, riser=-3, boom=-17, braaam=-4, harp=14, celesta=10, glock=17, piano=-2,
            kanun=2, darb=-4, tamb=10, oroll=3, bd=2,
            flute_sv=12, flute_ex=12, flute_nv=8, oboe=8, vln_solo=8, cb_dr=7, vc_dr=6, vlnpz=8, vlapz=8, vcpz=8, cbpz=8, vsol_sp=8, vsol_tr=8,
            dhol_h=3.4, dhol_s=2, conga_o=4, harp_d=19, pz_d=11, pno_d=2, vln_si=2, vla_si=4, sitar=-10, harmon=-9, vox=-5, shehnai=7, tabla=-12, zap=0, shim=0)
for _k, _db in TRIM.items():
    PARTS[_k].gain *= 10 ** (_db / 20)


# ----------------------------------------------------------------------------------------------
# Time map (output clock T = voice clock v + holds), grids, cue table
# ----------------------------------------------------------------------------------------------
HOLDS = [('cin', 8.85, 1.4), ('tur', 9.98, 1.0), ('ind', 11.03, 1.1)]      # (k, v, d)  as timeline.js


def TofV(v):
    return v + sum(d for _, hv, d in HOLDS if hv < v)


HOLD_T = {'cin': (8.85, 10.25), 'tur': (11.38, 12.38), 'ind': (13.43, 14.53)}


class Grid:
    """uniform grid: t = t0 + beat * b"""
    def __init__(self, t0, b):
        self.t0, self.b = t0, b

    def __call__(self, beat):
        return self.t0 + beat * self.b


class PW:
    """piece-wise tempo map: anchors [(beat, T), ...]; linear inside, last/first slope outside."""
    def __init__(self, anchors):
        self.bt = np.array([a[0] for a in anchors], float)
        self.tt = np.array([a[1] for a in anchors], float)
        self.b = (self.tt[1] - self.tt[0]) / (self.bt[1] - self.bt[0])

    def __call__(self, beat):
        if beat <= self.bt[0]:
            return self.tt[0] + (beat - self.bt[0]) * (self.tt[1] - self.tt[0]) / (self.bt[1] - self.bt[0])
        if beat >= self.bt[-1]:
            return self.tt[-1] + (beat - self.bt[-1]) * (self.tt[-1] - self.tt[-2]) / (self.bt[-1] - self.bt[-2])
        return float(np.interp(beat, self.bt, self.tt))


# cue table (voice clock v -> T).  Adapted to the scene files' // CUE comments (see SCORE_NOTES.md)
T_BOLT = 0.74                      # v0.74  bolt crack on "המסך"
T_SHARD = 1.26                     # v1.26  shard burst
T_OPEN = 2.33                      # v2.33  "נפתח" big hit
T_HOOK = 3.40                      # theme statement
T_NFX = TofV(4.34)                 # netflix slam
T_DIS = TofV(5.99)                 # disney sparkle
T_SLAM = TofV(8.32)                # Charlton slam
T_CIN0, T_CIN1 = HOLD_T['cin']     # 8.85 .. 10.25 (braaam -> pickup landing)
T_LAND1 = 10.26                    # cin landing tutti (voice resumes 10.28)
T_TUR0, T_TUR1 = HOLD_T['tur']
T_LAND2 = 12.39                    # tur landing (voice resumes 12.40)
T_IND0, T_IND1 = HOLD_T['ind']
T_LAND3 = 14.54                    # ind landing (voice resumes 14.55)
T_VORTEX = TofV(13.82)             # 17.32 "אחד"
T_NAGISH = TofV(14.87)             # 18.37 tap
T_DAY0, T_DAYN = TofV(15.86), TofV(16.75)      # 7 evenly spaced day pops 19.36 .. 20.25
T_GOAL = TofV(17.40)               # 20.90
T_WAIT = TofV(18.78)               # 22.28 anticipation
T_FUN = TofV(21.29)                # 24.79 box pops open (v21.29 "כיף")
T_NO1, T_NO2 = TofV(22.36), TofV(23.55)        # 25.86, 27.05
T_XSLAM = TofV(23.18)              # 26.68 X on the magnifier
T_XOUT = TofV(24.43)               # 27.93 bolts cross out
T_RELIEF = TofV(24.80)             # 28.30 calm-tv-resolve
T_PICK = TofV(25.08)               # 28.58
T_TAP = TofV(26.05)                # 29.55 tap impact
T_BURST = TofV(26.30)              # 29.80 tile burst fullscreen
T_PLAY = TofV(26.94)               # 30.44 playback burst
T_GOALB = TofV(27.20)              # 30.70 goal burst
T_SUCK = TofV(27.42)               # 30.92 iris suck
T_LOGO = TofV(27.60)               # 31.10 LOGO SLAM (final cadence / tutti)
T_TAG = TofV(28.10)                # 31.60 tagline pop
T_FADE0 = 33.05
DAY_T = [T_DAY0 + i * (T_DAYN - T_DAY0) / 6 for i in range(7)]

_words = __import__('json').loads(open(os.path.join(HERE, '..', '..', 'words.js')).read().split('=', 1)[1].strip().rstrip(';'))


def _speech_segments():
    segs = []
    for w in _words:
        a, b = TofV(w['t0']), TofV(w['t1'])
        if segs and a - segs[-1][1] < 0.25:
            segs[-1][1] = b
        else:
            segs.append([a, b])
    return [tuple(x) for x in segs]


LINES = _speech_segments()


def hum(ms=3.0):
    return float(RNG.uniform(-ms, ms)) / 1000


def rv(a, b):
    return int(RNG.integers(a, b + 1))


# ----------------------------------------------------------------------------------------------
# Harmony helpers (key: E minor -> G major)
# ----------------------------------------------------------------------------------------------
QUAL = {'m': [0, 3, 7], 'M': [0, 4, 7]}
CHORD = {'Em': (4, 'm'), 'E': (4, 'M'), 'C': (0, 'M'), 'G': (7, 'M'), 'D': (2, 'M'), 'Am': (9, 'm'), 'A': (9, 'M'),
         'B': (11, 'M'), 'Bm': (11, 'm'), 'F#': (6, 'M'), 'F': (5, 'M')}


def ct(ch):
    r, q = CHORD[ch]
    return r, [(r + i) % 12 for i in QUAL[q]]


def near(pc, lo):
    x = int(lo)
    while x % 12 != pc % 12:
        x += 1
    return x


def _fr_tr(ch):
    r, _ = ct(ch)
    return 36.7 * 2 ** (((r - 2) % 12) / 12)


def tr_n(ch):
    """'trailer' drum note number tuned to the chord root (drum body 36-68 Hz)"""
    return 58 + 12 * np.log2(_fr_tr(ch) / 42.76)


def tk_n(ch):
    """taiko note number tuned to the chord root (55-103 Hz)"""
    r, _ = ct(ch)
    return 60 + 12 * np.log2(55 * 2 ** (((r - 9) % 12) / 12) / 62.0)


def _tune(ch, base):
    r, _ = ct(ch)
    cand = [r + 12 * k for k in range(1, 6)]
    return 60 + (min(cand, key=lambda x: abs(x - base)) - base)


def bdn(ch):
    """concert bass drum note number so its body (~F2) sits on the chord root"""
    return _tune(ch, 41.0)


def kn(ch):
    """kick note number so its body (~E2) sits on the chord root"""
    return _tune(ch, 40.5)


def bm(ch):
    f1 = _fr_tr(ch)
    return dict(f0=2.1 * f1, f1=f1)


def brass_line(g, line, vel, parts=('hn', 'tp'), hn_oct=-12, tp_oct=0, beats=(-99, 99), legato=1.0, oct_up=0):
    """hook on horns (octave below) + trumpets; long notes on sustain samples, short on staccato."""
    for b, d, n_ in line:
        if not (beats[0] <= b < beats[1]):
            continue
        t = g(b) + hum(3)
        dur = (g(b + d) - g(b)) * (legato if d >= .75 else 0.9)
        v = vel + (6 if d >= 1 else 0) + rv(-3, 3)
        for pn, octv in (('hn', hn_oct), ('tp', tp_oct)):
            if pn not in parts:
                continue
            nn = m(n_) + octv + oct_up
            if d >= .75:
                PARTS[pn + '_su'].n(t, dur, nn, v)
            else:
                PARTS[pn + '_st'].n(t, dur, nn, v - 4)


def strings_line(g, line, vel, octv=12, beats=(-99, 99)):
    for b, d, n_ in line:
        if not (beats[0] <= b < beats[1]):
            continue
        t = g(b) + hum(3)
        dur = (g(b + d) - g(b)) * (1.0 if d >= .75 else 0.9)
        (vln_su if d >= .75 else vln_sp).n(t, dur, m(n_) + octv, vel + rv(-3, 3))


ACC = {0, 3, 6, 8, 11, 14}


def ost16(t0, s, n, ch, lvl=1.0, layers=('vc', 'cb', 'vla', 'vln'), ph=0, vln_lo='D5', cresc=None):
    """driving 16th spiccato ostinato (3-3-2 accents): cellos + basses on the root, violas + violins on a rocking arpeggio."""
    r, pcs = ct(ch)
    for i in range(n):
        u = i / max(1, n - 1)
        L = lvl * (1.0 if cresc is None else cresc[0] + (cresc[1] - cresc[0]) * u)
        t = t0 + i * s + hum(2.5)
        p16 = (i + ph) % 16
        a = p16 in ACC
        v = (108 if a else 74) * L
        if 'vc' in layers:
            root = near(r, m('C3'))
            nn = root + (12 if p16 in (7, 15) else (7 if p16 == 10 else 0))
            vc_sp.n(t, s * 0.9, nn, v + rv(-4, 4))
        if 'cb' in layers and a:
            cb_sp.n(t, s * 0.95, near(r, m('C2')), v + 2 + rv(-3, 3))
        if 'vla' in layers:
            seq = [pcs[2], pcs[0], pcs[1], pcs[0]]
            vla_sp.n(t, s * 0.85, near(seq[i % 4], m('G3')), v - 8 + rv(-4, 4))
        if 'vln' in layers:
            seq = [pcs[0], pcs[1], pcs[2], pcs[1]]
            vln_sp.n(t, s * 0.85, near(seq[i % 4], m(vln_lo)), v - 12 + rv(-4, 4))


def pads(t0, t1, ch, lvl=80, strings=True, choir_on=False, low=True, hi=True):
    r, pcs = ct(ch)
    d = t1 - t0
    if strings:
        if hi:
            vln_su.n(t0, d, [near(pcs[1], m('B4')), near(pcs[0], m('E5'))], lvl)
        vla_su.n(t0, d, [near(pcs[2], m('G3')), near(pcs[0], m('E4'))], lvl)
        if low:
            vc_su.n(t0, d, near(r, m('C3')), lvl)
            cb_su.n(t0, d, near(r, m('C2')), lvl - 4)
    if choir_on:
        choir.n(t0, d, [near(pcs[0], m('E4')), near(pcs[1], m('G4')), near(pcs[2], m('B4'))], lvl)


def kit16(t0, s, n, style, lvl=1.0, ph=0, mute=None):
    for i in range(n):
        t = t0 + i * s + hum(2.0)
        p = (i + ph) % 16
        if mute and mute[0] <= t <= mute[1]:
            if style in ('drive', 'four', 'half', 'lite'):
                if p % 2 == 0 and style != 'lite':
                    hh.n(t, 0.08, 60, 60 + rv(-4, 4))
                continue
        if style == 'half':          # half-time: kick 1 & 'and' of 2, snare on 3
            if p in (0, 6, 10):
                kick.n(t, 0.3, 60, (118 if p == 0 else 100) * lvl + rv(-3, 3))
            if p == 8:
                snare.n(t, 0.3, 60, 118 * lvl + rv(-3, 3))
            if p % 2 == 0:
                hh.n(t, 0.1, 60, (96 if p % 4 == 0 else 70) * lvl + rv(-5, 5))
        elif style == 'drive':       # straight 2 & 4 with 16th hats
            if p in (0, 6, 8, 10, 14):
                kick.n(t, 0.3, 60, (120 if p in (0, 8) else 96) * lvl + rv(-3, 3))
            if p in (4, 12):
                snare.n(t, 0.3, 60, 122 * lvl + rv(-2, 2))
            if p in (7, 15) and RNG.random() < 0.6:
                snc.n(t, 0.1, 60, 36 + rv(-4, 4))
            if p == 14:
                hho.n(t, s * 1.6, 60, 90 * lvl)
            else:
                hh.n(t, 0.08, 60, [100, 52, 76, 58][p % 4] * lvl + rv(-5, 5))
        elif style == 'four':        # four on the floor + off-beat open hat (pop drop)
            if p % 4 == 0:
                kick.n(t, 0.3, 60, 118 * lvl + rv(-3, 3))
            if p in (4, 12):
                snare.n(t, 0.3, 60, 116 * lvl + rv(-2, 2))
            if p % 4 == 2:
                hho.n(t, s * 1.6, 60, 84 * lvl)
            elif p % 2 == 1:
                hh.n(t, 0.06, 60, 56 * lvl + rv(-4, 4))
        elif style == 'lite':        # light pulse under speech
            if p in (0, 8):
                kick.n(t, 0.3, 60, 104 * lvl)
            if p % 4 == 0:
                hh.n(t, 0.08, 60, 70 * lvl + rv(-5, 5))
        elif style == 'build':
            if p % 4 == 0:
                kick.n(t, 0.3, 60, 112 * lvl)
            if p in (4, 12):
                snare.n(t, 0.3, 60, 116 * lvl)
            hh.n(t, 0.08, 60, [90, 50, 70, 50][p % 4] * lvl + rv(-5, 5))


def taiko8(t0, b, beats, style='A', lvl=1.0, mute=None, ch='Em'):
    pats = {'A': [(0, 124), (1.75, 96), (2, 112), (3.5, 100)],
            'C': [(0, 124), (0.75, 90), (1.5, 104), (2, 118), (2.75, 90), (3, 100), (3.5, 110)],
            '8': [(i / 2, 118 if i % 2 == 0 else 96) for i in range(8)]}[style]
    for bar in range(int(np.ceil(beats / 4))):
        for off, v in pats:
            bt = bar * 4 + off
            if bt < beats - 1e-6 and not (mute and mute[0] <= t0 + bt * b <= mute[1]):
                taiko.n(t0 + bt * b + hum(3), 0.5, tk_n(ch) + (0 if off % 1 == 0 else 7), v * lvl + rv(-4, 4))


def stab(t, ch, vel=110, dur=0.18):
    """low-brass + tuba stab"""
    r, pcs = ct(ch)
    tb_st.n(t, dur, [near(r, m('E2')), near(pcs[2], m('B2')), near(r, m('E3'))], vel)
    tu_st.n(t, dur, near(r, m('E1')), vel)


def tutti(t, ch, big=1.0, dur=0.45, crash_on=True, choir_on=True, top=None, lead=0.08):
    """full-orchestra hit. Slow-attack sustains (horns, violins, violas, choir) start `lead` s early so their body peaks on the hit."""
    r, pcs = ct(ch)
    v = int(min(127, 124 * big))
    tl = t - lead
    dl = dur + lead
    hn_su.n(tl, dl, [near(r, m('E3')), near(pcs[1], m('E3')), near(pcs[2], m('E3'))], v)
    tp_su.n(t - 0.02, dur + 0.02, [near(pcs[1], m('G4')), near(r, m('C5'))], v)
    tb_su.n(t - 0.02, dur + 0.02, [near(r, m('E2')), near(pcs[2], m('B2')), near(r, m('E3'))], v)
    tu_su.n(t - 0.02, dur + 0.02, near(r, m('E1')), v)
    vln_su.n(tl, dl, [near(r, m('E5')), near(pcs[1], m('G5'))], v)
    vla_su.n(tl, dl, near(pcs[2], m('G3')), v)
    vc_su.n(t - 0.04, dur + 0.04, near(r, m('C3')), v)
    cb_su.n(t - 0.03, dur + 0.03, near(r, m('C2')), v)
    timp.n(t, 1.0, near(r, m('D2')), v)
    trailer.n(t, 1.5, tr_n(ch), v)
    bd.n(t, 2.0, bdn(ch), v)
    boom.n(t, 1.6, 60, int(100 * big), **bm(ch))
    sub.n(t, dur + 0.6, near(r, m('E1')), int(100 * big))
    if choir_on:
        choir.n(tl - 0.03, dl + 0.03, [near(pcs[0], m('E4')), near(pcs[1], m('G4')), near(pcs[2], m('B4'))], int(min(127, 110 * big)))
    if crash_on:
        ocym.n(t, 3.0, 60, v)
        crash.n(t + 0.004, 2.0, 60, v)


def sparkle(t, root_pc, notes=10, dur=0.5, scale=(0, 2, 4, 7, 9), base='E5', vel=80, dens=70):
    """harp glissando + glockenspiel + celesta + glint dust (magic accent)"""
    b0 = m(base)
    seq = []
    o = 0
    i = 0
    while len(seq) < notes:
        seq.append(b0 - 12 + root_pc - (b0 % 12) + 12 * o + scale[i % len(scale)] + (0 if (root_pc - (b0 % 12) + scale[i % len(scale)]) >= 0 else 12))
        i += 1
        if i % len(scale) == 0:
            o += 1
    for k, nn in enumerate(seq):
        harp.n(t + k * dur / notes, 0.8, nn, vel + 2 * k)
    for k, nn in enumerate(seq[-4:]):
        glock.n(t + dur * 0.6 + k * 0.05, 0.6, nn + 12, vel - 6 + k * 3)
        celesta.n(t + dur * 0.6 + k * 0.05 + 0.01, 0.6, nn + 12, vel - 14 + 3 * k)
    shim.n(t, dur + 0.5, 60, int(vel * 0.9), dens=dens, root=root_pc, scale=list(scale), o0=6, o1=8, peak=0.3)


# ----------------------------------------------------------------------------------------------
# The hook (E minor) and the chorus hook (G major).  Beats are quarter notes from the grid origin.
#   brand motif "Con-nect-T-V" = B E F# G (minor)  /  D G A B (major)
# ----------------------------------------------------------------------------------------------
HOOK_MIN = [(0, 1, 'B4'), (1, .5, 'E5'), (1.5, .5, 'F#5'), (2, 1.5, 'G5'), (3.5, .5, 'F#5'),
            (4, 1, 'E5'), (5, .5, 'D5'), (5.5, .5, 'E5'), (6, 1, 'F#5'), (7, 1, 'A5')]
CHO_A = [(0, 1, 'D5'), (1, .5, 'G5'), (1.5, .5, 'A5'), (2, 1.5, 'B5'), (3.5, .5, 'A5')]
CHO_B = [(0, 1.5, 'D6'), (1.5, .5, 'B5'), (2, 1, 'G5'), (3, 1, 'A5')]



# ----------------------------------------------------------------------------------------------
# NEW COMPOSITION (v2 "premiere night"): D major (verses, holds) -> half-step lift to Eb major on the vortex drop; ~120 BPM feel-good
# pop-orchestral: four-on-the-floor kick, rimshot/tambourine claps, syncopated piano + pizzicato + staccato strings, flute / glock / pizzicato /
# bright trumpet lead.  Hook "premiere motif": A A B D | F#~  (D major)  ->  Bb Bb C Eb | G~  (Eb major).  All real sampled instruments.
# ----------------------------------------------------------------------------------------------
CHORD.update({'Dm': (2, 'm'), 'Bm': (11, 'm'), 'F#m': (6, 'm'), 'Gm': (7, 'm'), 'Cm': (0, 'm'), 'Bb': (10, 'M'), 'Eb': (3, 'M'),
              'Ab': (8, 'M'), 'Fm': (5, 'm'), 'Db': (1, 'M'), 'Ebm': (3, 'm'), 'Bbm': (10, 'm')})

HOOK_D = [(-2, .5, 'A4'), (-1.5, .5, 'A4'), (-1, .5, 'B4'), (-.5, .5, 'D5'), (0, 1.5, 'F#5'), (1.5, .5, 'E5'), (2, 1, 'D5'), (3, .5, 'E5'),
          (3.5, .5, 'D5'), (4, 1, 'F#5'), (5, .5, 'E5'), (5.5, .5, 'D5'), (6, 1, 'C#5'), (7, .5, 'E5'), (7.5, .5, 'A5')]
LIVE_D = [(0, 1.5, 'F#5'), (1.5, .5, 'E5'), (2, 1, 'D5'), (3, .5, 'E5'), (3.5, .5, 'F#5')]
CH_EB = [(0, .5, 'Bb4'), (.5, .5, 'Bb4'), (1, .5, 'C5'), (1.5, .5, 'Eb5'), (2, 1.5, 'G5'), (3.5, .5, 'F5')]
DAYS_EB = ['Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'D5']            # rising major scale, ends on the leading tone D (goal resolves on Eb)


def lead(g, line, vel, mode='verse', sh=0, beats=(-99, 99)):
    """the tune.  verse: flute + pizzicato + glock (light, under the voice).  chorus: bright trumpet + horn (octave below) + flute + violins.
    Every note gets its own humanised timing / velocity."""
    for b, d, n0 in line:
        if not (beats[0] <= b < beats[1]):
            continue
        t = g(b) + hum(5)
        dur = max(0.07, (g(b + d) - g(b)) * (0.95 if d >= 1 else 0.82))
        v = vel + rv(-4, 4) + (4 if d >= 1 else 0)
        nn = m(n0) + sh
        if mode == 'verse':
            flute_sv.n(t, dur, nn, v)
            vlnpz.n(t + 0.004, 0.1, nn, v - 16)
            glock.n(t + 0.003, 0.5, nn + 12, v - 26)
        elif mode == 'chorus':
            (tp_su if d >= .75 else tp_st).n(t, dur, nn, v + 6)
            (hn_su if d >= .75 else hn_st).n(t - (0.04 if d >= .75 else 0), dur, nn - 12, v)
            flute_sv.n(t, dur, nn + 12, v - 14)
            if d >= .75:
                vln_su.n(t - 0.05, dur + 0.05, nn + 12, v - 6)
            else:
                vln_sp.n(t, dur, nn + 12, v - 10)
            glock.n(t + 0.003, 0.5, nn + 12, v - 22)
        else:                              # 'tutti'
            (tp_su if d >= .75 else tp_st).n(t, dur, nn, v + 8)
            (hn_su if d >= .75 else hn_st).n(t - (0.04 if d >= .75 else 0), dur, nn - 12, v + 2)
            (vln_su if d >= .75 else vln_sp).n(t - (0.05 if d >= .75 else 0), dur, nn + 12, v)
            flute_sv.n(t, dur, nn + 12, v - 10)
            glock.n(t + 0.003, 0.6, nn + 12, v - 18)


def groove(g, b0, nb, ch, lvl=1.0, mode='verse', mute=None, ph=0):
    """one stretch of the feel-good pop-orchestral groove (8th-note resolution, beats from the tempo grid g):
    four-on-the-floor kick, rimshot + tambourine backbeat, open off-beat hat, pizzicato bass on the off-beats, syncopated (3-3-2) piano + staccato strings."""
    r, pcs = ct(ch)
    lo = near(r, m('E1'))
    n8 = int(round(nb * 2))
    for i in range(n8):
        beat = b0 + i / 2
        t = g(beat)
        on = (i % 2 == 0)
        p8 = (i + ph) % 8
        hi = 1.0 if mode != 'verse' else 0.85
        if mute and mute[0] <= t <= mute[1]:
            if not on:
                hh.n(t + hum(3), 0.05, 60, 46 + rv(-4, 4))
            continue
        if on:
            kick.n(t + hum(2.5), 0.3, kn(ch), (114 if p8 == 0 else 104) * lvl * hi + rv(-4, 3))
        if p8 in (2, 6):
            snare.n(t + hum(3), 0.3, 60, 92 * lvl * hi + rv(-5, 4))
            tamb.n(t + 0.004 + hum(2), 0.15, 60, 76 * lvl + rv(-5, 5))
            snc.n(t + 0.002, 0.1, 60, 46 * lvl)
        if on:
            hh.n(t + hum(3), 0.06, 60, (56 if mode == 'verse' else 66) * lvl + rv(-6, 6))
        elif p8 == 7:
            hho.n(t + hum(3), 0.3, 60, 82 * lvl * hi)
        else:
            hh.n(t + hum(3), 0.06, 60, 80 * lvl * hi + rv(-6, 6))
        if not on:                                       # bass pumps between the kicks
            cbpz.n(t + hum(4), 0.24, lo + (12 if p8 in (3,) else 0), 92 * lvl + rv(-5, 5))
            if mode != 'verse':
                sub.n(t, 0.2, lo, 62 * lvl)
        elif p8 == 0:
            cbpz.n(t + hum(4), 0.4, lo, 100 * lvl + rv(-4, 4))
        if p8 in (0, 3, 6):                              # syncopated piano stabs
            piano.n(t + hum(6), 0.32, [near(pcs[0], m('C4')), near(pcs[1], m('C4')), near(pcs[2], m('C4'))], (88 if p8 == 0 else 78) * lvl * (1.0 if mode != 'verse' else 0.92) + rv(-6, 6))
            if mode != 'verse':
                hn_st.n(t + hum(5), 0.2, [near(pcs[0], m('C4')), near(pcs[1], m('C4'))], 74 * lvl + rv(-5, 5))
                tp_st.n(t + hum(5), 0.2, near(pcs[1], m('G4')), 80 * lvl + rv(-5, 5))
        if not on:
            vln_sp.n(t + hum(6), 0.11, [near(pcs[1], m('B4')), near(pcs[2], m('B4'))], (64 if mode == 'verse' else 78) * lvl + rv(-6, 6))
            vla_sp.n(t + hum(6), 0.11, near(pcs[2], m('G3')), 62 * lvl + rv(-6, 6))
        vc_sp.n(t + hum(5), 0.12, near(r, m('C3')), (58 if on else 72) * lvl + rv(-6, 6))


def bed(t0, t1, ch, lvl=76, horn=False, hi=True):
    """real string sustains (+ optional horn) under a chord"""
    r, pcs = ct(ch)
    d = t1 - t0
    if hi:
        vln_su.n(t0 + hum(8), d, [near(pcs[1], m('B4')), near(pcs[0], m('E5'))], lvl - 8)
    vla_su.n(t0 + hum(8), d, [near(pcs[2], m('G3')), near(pcs[0], m('E4'))], lvl)
    vc_su.n(t0 + hum(6), d, near(r, m('C3')), lvl + 4)
    cb_su.n(t0 + hum(6), d, near(r, m('C2')), lvl)
    if horn:
        hn_su.n(t0 + hum(8), d, [near(pcs[1], m('E3')), near(pcs[2], m('E3'))], lvl + 4)


def X(n):
    """transposed note (-2 semitones): the E-based Turkish/Bollywood holds are re-keyed to D"""
    return m(n) - 2


# ---- cue table (v -> T); words.js was retimed, scene // CUE comments followed -------------------------------
V = TofV
T_BOLT, T_SHARD, T_PING1, T_PING2, T_OPEN = 0.74, 1.26, 1.76, 1.90, 2.36
T_HOOK, T_FAN, T_NFX, T_FLIP, T_DIS, T_PLUS, T_LIGHTS = 3.41, 3.95, 4.36, 5.35, 6.06, 6.54, 6.78
T_SPOP = [7.02, 7.13, 7.24, 7.35]
T_HERO, T_BALL, T_SLAM = 7.47, 7.58, 8.36
DRUM = [8.045, 8.10, 8.16, 8.22, 8.27, 8.31, 8.33, 8.35]
T_TURSPL, T_INDSPL = V(9.215), V(10.345)
T_ALLB, T_ORBIT, T_VORTEX = V(13.08), V(13.435), V(13.815)
T_LUB, T_DUB, T_ISR = V(11.78), V(12.03), V(12.16)
T_THUMB, T_NAGISH, T_CAL = V(14.43), V(14.89), V(15.36)
DAY_T = [V(x) for x in (15.98, 16.126, 16.271, 16.417, 16.563, 16.709, 16.855)]
T_DAY0, T_DAYN = DAY_T[0], DAY_T[-1]
T_GOAL, T_BNC, T_GOALB2 = V(17.40), V(17.845), V(18.295)
T_WAIT, T_C2, T_C1, T_OPENC, T_CHEST, T_BOW, T_FUN = V(18.78), V(19.21), V(19.58), V(20.09), V(20.42), V(20.97), V(21.29)
REV = [V(x) for x in (21.58, 21.65, 21.75, 21.85, 21.95, 22.08)]
T_NO1, T_XSLAM, T_NO2, T_DEV, T_XOUT, T_RELIEF = V(22.36), V(23.29), V(23.55), V(23.67), V(24.41), V(24.95)
T_PICK, T_BNCE, T_TAP, T_BURST, T_PLAY = V(25.08), V(25.365), V(26.055), V(26.30), V(26.99)
T_GOALB, T_SUCK, T_LOGO, T_TAG = V(27.18), V(27.42), V(27.60), V(28.10)
T_CIN0, T_CIN1 = HOLD_T['cin']
T_LAND1 = 10.26
T_TUR0, T_TUR1 = HOLD_T['tur']
T_LAND2 = 12.39
T_IND0, T_IND1 = HOLD_T['ind']
T_LAND3 = 14.54
T_FADE0 = 33.05


def sparkle(t, root_pc, notes=10, dur=0.5, scale=(0, 2, 4, 7, 9), base='E5', vel=80, dens=70):
    """harp glissando + glockenspiel + celesta (magic accent); all sampled"""
    b0 = m(base)
    seq = []
    o = 0
    i = 0
    while len(seq) < notes:
        seq.append(b0 - 12 + root_pc - (b0 % 12) + 12 * o + scale[i % len(scale)] + (0 if (root_pc - (b0 % 12) + scale[i % len(scale)]) >= 0 else 12))
        i += 1
        if i % len(scale) == 0:
            o += 1
    for k, nn in enumerate(seq):
        harp.n(t + k * dur / notes + hum(4), 0.8, nn, vel + 2 * k + rv(-3, 3))
    for k, nn in enumerate(seq[-4:]):
        glock.n(t + dur * 0.6 + k * 0.05, 0.6, nn + 12, vel - 6 + k * 3)
        celesta.n(t + dur * 0.6 + k * 0.05 + 0.01, 0.6, nn + 12, vel - 20 + 3 * k)


# ----------------------------------------------------------------------------------------------
# Sections
# ----------------------------------------------------------------------------------------------
def intro():
    """0 - 3.41: suspense drone + riser -> bolt crack 0.74 -> the world floods open (D major arpeggios) -> 2.36 burst (D major) -> A pedal -> hook pickup"""
    g = Grid(T_BOLT, 0.53)
    cb_dr.n(0.0, 1.6, 'D1', 80)
    vc_dr.n(0.0, 1.6, ['D2', 'A2'], 74)
    vc_dr.ex(0.0, 0.7, -22, -2, 1.3, pre=False, post=False)
    cb_dr.ex(0.0, 0.7, -22, -2, 1.3, pre=False, post=False)
    tb_su.n(0.25, 0.5, ['D2', 'A2'], 70)
    tb_su.ex(0.25, T_BOLT, -20, -4, 1.4, pre=False, post=False)
    vln_tr.n(0.05, 0.75, ['A5', 'D6'], 70)
    vln_tr.ex(0.03, T_BOLT, -24, -4, 1.4, pre=False, post=False)
    riser.n(0.05, T_BOLT - 0.05, 60, 80, kind='noise', lo=200, hi=8000, n0=38)
    riser.n(T_BOLT, T_BOLT - 0.02, 60, 90, kind='cym', len='s')
    for i, tt in enumerate((0.05, 0.36)):
        timp.n(tt + hum(4), 0.4, 'D2', 44 + 10 * i)
    # 0.74 the bolt cracks the screen
    zap.n(T_BOLT, 0.5, 60, 118)
    timp.n(T_BOLT, 1.2, 'D2', 127)
    bd.n(T_BOLT, 2.0, bdn('Dm'), 124)
    trailer.n(T_BOLT, 1.5, tr_n('Dm'), 116)
    boom.n(T_BOLT, 1.6, 60, 110, **bm('Dm'))
    sub.n(T_BOLT, 1.4, 'D1', 96)
    stab(T_BOLT, 'Dm', 120, 0.35)
    tb_su.n(T_BOLT, 0.5, ['D2', 'A2', 'D3'], 110)
    ocym.n(T_BOLT, 2.5, 60, 100)
    for k, nn in enumerate(['D6', 'F6', 'A6', 'D7']):
        glock.n(T_BOLT + 0.02 + k * 0.035, 0.6, nn, 80)
    # 0.74 - 2.36 flood: harp + pizzicato + glock arpeggios rise, strings swell, timpani + snare roll
    arp = [['D4', 'F#4', 'A4', 'D5', 'F#5', 'A5'], ['G4', 'B4', 'D5', 'G5', 'B5', 'D6'], ['A4', 'C#5', 'E5', 'A5', 'C#6', 'E6']]
    for bt in range(3):
        for k in range(6):
            tt = g(bt + 0.15 + k * 0.14)
            if tt < T_OPEN - 0.03:
                harp.n(tt + hum(4), 0.5, arp[bt][k], 68 + 6 * bt + 2 * k + rv(-3, 3))
                if k % 2 == 1:
                    vlnpz.n(tt + 0.01 + hum(4), 0.1, arp[bt][k], 60 + 6 * bt)
    for k, nn in enumerate(['A5', 'D6', 'F#6', 'A6', 'D7']):
        glock.n(g(1.0) + k * 0.11, 0.5, nn, 62 + 3 * k)
    vln_su.n(T_BOLT + 0.3, T_OPEN - T_BOLT - 0.3, [m('D5'), m('A5')], 80)
    vln_su.ex(T_BOLT + 0.3, T_OPEN, -22, -2, 1.4)
    vla_su.n(T_BOLT + 0.3, T_OPEN - T_BOLT - 0.3, [m('F#4'), m('D5')], 78)
    vla_su.ex(T_BOLT + 0.3, T_OPEN, -22, -2, 1.4)
    cb_su.n(T_BOLT + 0.3, T_OPEN - T_BOLT - 0.3, 'D2', 90)
    cb_su.ex(T_BOLT + 0.3, T_OPEN, -22, -2, 1.4)
    tb_st.n(T_SHARD, 0.15, ['D2', 'A2'], 92)
    taiko.n(T_SHARD, 0.5, tk_n('Dm'), 96)
    sparkle(T_SHARD, 2, notes=8, dur=0.35, scale=(0, 2, 4, 6, 7, 9, 11), base='D5', vel=74)
    tt = T_OPEN - 0.55
    while tt < T_OPEN - 0.01:
        u = (tt - (T_OPEN - 0.55)) / 0.55
        timp.n(tt + hum(3), 0.1, 'D2', int(46 + 76 * u ** 1.2))
        tt += 0.06
    tt = T_OPEN - 0.42
    while tt < T_OPEN - 0.01:
        u = (tt - (T_OPEN - 0.42)) / 0.42
        snc.n(tt, 0.05, 60, int(36 + 80 * u ** 1.4))
        tt += 0.045
    riser.n(T_OPEN, 0.85, 60, 100, kind='cym', len='s')
    riser.n(T_BOLT + 0.5, T_OPEN - T_BOLT - 0.5, 60, 84, kind='noise', lo=300, hi=10000, n0=52, oct=2.2)
    # 2.36 the world opens: D major, radiant
    tutti(T_OPEN, 'D', 1.15, dur=0.9)
    gong.n(T_OPEN + 0.005, 3.0, 60, 96)
    sparkle(T_OPEN + 0.02, 2, notes=14, dur=0.55, scale=(0, 2, 4, 6, 7, 9, 11), base='D5', vel=88)
    for k, nn in enumerate(['D6', 'A5', 'F#5', 'A5', 'D6', 'F#6']):
        harp.n(T_OPEN + 0.25 + k * 0.13 + hum(4), 0.5, nn, 66 + 2 * k)
    bed(T_OPEN + 0.05, T_HOOK - 0.02, 'D', lvl=78)
    # A pedal (V) into the hook pickup: pizzicato ticks + soft snare crescendo
    for k in range(6):
        tt = T_OPEN + 0.55 + k * 0.14
        vlnpz.n(tt + hum(4), 0.1, ['A5', 'E6'], 70 + 4 * k)
        vcpz.n(tt + hum(4), 0.1, 'A2', 80 + 3 * k)
    riser.n(T_OPEN + 0.4, T_HOOK - T_OPEN - 0.4, 60, 70, kind='noise', lo=400, hi=9000, n0=45)
    for i in range(5):
        snc.n(T_HOOK - 0.24 + i * 0.05, 0.06, 60, 60 + 12 * i)


def sectionA():
    """3.41 - 8.36: the tune.  Pickup A A B D on the flute/pizzicato/glock, F#5 on the Netflix slam (4.36), Disney sparkle 6.06, sports build, Charlton slam 8.36.
    Tempo: 127 BPM pickup, then 120 BPM (b = 0.5 s) so the slam is beat 8 exactly."""
    g = PW([(-2, T_HOOK), (0, T_NFX), (8, T_SLAM)])
    for b0, nb, ch, lv in [(0, 2, 'D', 0.8), (2, 2, 'G', 0.85), (4, 2, 'Bm', 0.95), (6, 2, 'A', 1.0)]:
        groove(g, b0, nb, ch, lv, 'verse')
        bed(g(b0), g(b0 + nb) - 0.02, ch, lvl=72)
    # pickup beats (-2..0): only bass pizz + soft strings so the tune is heard
    for k in range(2):
        cbpz.n(g(-2 + k) + hum(4), 0.3, 'A1', 80)
    vc_sp.n(g(-1), 0.12, 'A2', 66)
    lead(g, HOOK_D, 88, 'verse', beats=(-2, 4))
    lead(g, HOOK_D, 98, 'verse', beats=(4, 8))
    # sports build 6.78 -> 8.36: toms, snare drum-roll on the scene's hits, timpani, trumpet crescendo on A
    for i in range(4):
        (tomh if i % 2 == 0 else toml).n(g(6.5 + i / 2) + hum(3), 0.3, 60, 84 + 8 * i)
    for tt, v in zip(DRUM, [66, 74, 82, 90, 98, 106, 114, 122]):
        snare.n(tt, 0.1, 60, v)
    oroll.n(T_SLAM - 0.75, 0.77, 60, 96)
    oroll.ex(T_SLAM - 0.75, T_SLAM, -20, 0, 1.3, pre=False, post=False)
    for i in range(6):
        taiko.n(g(6.0 + i * 0.33) + hum(3), 0.3, tk_n('A') + (0 if i % 2 == 0 else 7), 92 + 5 * i)
    tp_su.n(g(6), T_SLAM - g(6) - 0.02, ['A4', 'E5'], 96)
    tp_su.ex(g(6), T_SLAM, -14, 0, 1.3, pre=False, post=False)
    hn_su.n(g(6), T_SLAM - g(6) - 0.02, ['A3', 'C#4', 'E4'], 92)
    riser.n(T_LIGHTS, T_SLAM - T_LIGHTS, 60, 76, kind='noise', lo=400, hi=11000, n0=45, oct=2.6)
    # scene accents
    snare.n(T_HOOK, 0.2, 60, 100)                                  # clapper slam 3.41
    taiko.n(T_HOOK, 0.4, tk_n('D'), 100)
    for k, nt in enumerate(['A5', 'D6', 'F#6']):                   # episode fan 3.95
        glock.n(T_FAN + k * 0.06, 0.4, nt, 72)
        harp.n(T_FAN + k * 0.06, 0.5, nt, 62)
    riser.n(T_FLIP - 0.25, 0.25, 60, 60, kind='noise', lo=600, hi=9000, n0=59, oct=2)
    # NETFLIX 4.36: tutti stab on D, hook peak F#5
    stab(T_NFX, 'D', 116, 0.25)
    taiko.n(T_NFX, 0.5, tk_n('D'), 122)
    crash.n(T_NFX, 1.6, 60, 108)
    kick.n(T_NFX, 0.3, 60, 120)
    tutti(T_NFX, 'D', 0.8, dur=0.3, crash_on=False, choir_on=False)
    tp_su.n(T_NFX, 0.7, 'F#5', 100)
    # DISNEY+ 6.06 magical sparkle (D lydian, pickup into bar 2 at 6.36)
    sparkle(T_DIS - 0.02, 2, notes=16, dur=0.5, scale=(0, 2, 4, 6, 7, 9, 11), base='F#5', vel=84)
    ocym.n(T_DIS, 2.0, 60, 72)
    hn_su.n(T_DIS, 0.6, ['F#4', 'A4'], 84)
    vln_su.n(T_DIS, 0.7, ['A5', 'D6'], 74)
    glock.n(T_PLUS, 0.5, ['A6', 'D7'], 76)                          # plus-pop 6.54
    harp.n(T_PLUS, 0.6, ['A5', 'D6'], 70)
    # hero slam 7.47 (on A)
    stab(T_HERO, 'A', 108, 0.2)
    timp.n(T_HERO, 0.8, 'A1', 112)
    taiko.n(T_HERO, 0.5, tk_n('A'), 112)
    crash.n(T_HERO, 1.2, 60, 96)
    # CHARLTON slam 8.36: D power chord, trailer drum, gong; a low stab a moment later
    t = T_SLAM
    tutti(t, 'D', 1.2, dur=0.5)
    trailer.n(t, 1.6, tr_n('D'), 127)
    gong.n(t, 3.0, 60, 110)
    braaam.n(t, 0.45, 'D1', 96)
    tp_su.n(t, 0.5, ['D5', 'A5'], 118)
    stab(t + 0.245, 'Dm', 104, 0.2)
    timp.n(t + 0.245, 0.6, 'D2', 108)
    for i in range(3):
        snc.n(t + 0.36 + i * 0.045, 0.05, 60, 60 + 14 * i)


def cin():
    """hold 8.85 - 10.25: cinema-trailer braaam (D minor), low brass, choir swell, timpani roll; the run + snare roll land on a bright D MAJOR tutti at 10.26"""
    t0, t1, tl = T_CIN0, T_CIN1, T_LAND1
    for pp, ns, v in [(tb_su, ['D2', 'A2', 'D3'], 127), (tu_su, ['D1', 'D2'], 127), (hn_su, ['D3', 'A3', 'D4'], 124)]:
        pp.n(t0, 1.0, ns, v)
    braaam.n(t0, 1.0, 'D1', 116)
    braaam.n(t0, 1.0, 'A1', 88)
    trailer.n(t0, 2.0, tr_n('Dm'), 127)
    boom.n(t0, 2.0, 60, 120, **bm('Dm'))
    gong.n(t0 + 0.01, 3.0, 60, 118)
    bd.n(t0, 2.0, bdn('Dm'), 124)
    ocym.n(t0, 2.0, 60, 110)
    sub.n(t0, 1.2, 'D1', 108)
    t2 = t0 + 0.7
    for pp, ns, v in [(tb_su, ['Eb2', 'Bb2', 'Eb3'], 118), (tu_su, ['Eb1', 'Eb2'], 118)]:
        pp.n(t2, 0.45, ns, v)
    braaam.n(t2, 0.5, 'Eb1', 100)
    trailer.n(t2, 1.0, tr_n('Eb'), 116)
    tt = t0 + 0.12
    while tt < tl - 0.01:
        u = (tt - t0) / (tl - t0)
        timp.n(tt + hum(3), 0.12, 'D2', int(40 + 84 * u ** 1.3))
        tt += 0.052
    choir.cc(t0, 11, 30)
    choir.n(t0 + 0.2, tl - t0 - 0.2, ['D3', 'A3', 'D4', 'F4', 'A4'], 96)
    choir.expr(t0 + 0.2, tl - 0.03, 30, 120, 1.6)
    vc_tr.n(t0 + 0.1, tl - t0 - 0.1, ['D3', 'A3'], 100)
    vc_tr.ex(t0, tl - 0.03, -12, 0, 1.5)
    cb_su.n(t0 + 0.1, tl - t0 - 0.1, 'D2', 100)
    vln_tr.n(t0 + 0.5, tl - t0 - 0.5, ['D5', 'F5', 'A5'], 90)
    vln_tr.ex(t0 + 0.5, tl - 0.03, -18, -2, 1.4)
    scale = ['D3', 'E3', 'F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'F5']
    ts = [tl - 0.02 - 0.62 * ((15 - k) / 15) ** 1.35 for k in range(16)]
    for k, (tk, nt) in enumerate(zip(ts, scale)):
        v = int(72 + 3.4 * k)
        vln_sp.n(tk + hum(3), 0.09, [nt, m(nt) + 12], v)
        vla_sp.n(tk + hum(3), 0.09, nt, v - 6)
        vc_sp.n(tk + hum(3), 0.09, m(nt) - 12 if k % 2 == 0 else nt, v - 4)
    tt = tl - 0.55
    while tt < tl - 0.01:
        u = (tt - (tl - 0.55)) / 0.55
        snc.n(tt, 0.05, 60, int(38 + 84 * u ** 1.4))
        tt += 0.038
    riser.n(tl, 0.9, 60, 100, kind='cym', len='s')
    riser.n(tl - 0.7, 0.7, 60, 90, kind='noise', lo=250, hi=11000, n0=45, oct=3)
    trailer.n(tl - 0.7, 1.0, tr_n('Dm'), 110)
    tutti(tl, 'D', 1.1, dur=0.5)
    lead(Grid(tl, 0.448), [(0, 1.4, 'F#5'), (1.5, .35, 'E5'), (1.9, .5, 'D5')], 104, 'tutti')


def series1():
    """10.26 - 11.38 'סדרות טורקיות': the groove keeps going (D major); the last slots cock the hammer; F natural stab on the Turkish splash 10.615"""
    t0 = T_LAND1
    g = Grid(t0, (T_TUR0 - t0) / 2.5)
    groove(g, 0, 2, 'D', 1.05, 'chorus')
    bed(t0, T_TUR0 - 0.03, 'D', lvl=76, horn=True)
    for i in range(4):
        snare.n(T_TUR0 - 0.05 - (3 - i) * 0.05 + hum(2), 0.08, 60, 90 + 9 * i)
    timp.n(T_TUR0 - 0.03, 0.3, 'A1', 100)
    tb_st.n(T_TURSPL, 0.2, ['Eb2', 'Bb2'], 104)
    timp.n(T_TURSPL, 0.8, 'Eb2', 104)
    crash.n(T_TURSPL, 1.0, 60, 84)
    lead(g, [(0.0, .5, 'A4'), (.5, .5, 'A4'), (1, .5, 'B4'), (1.5, .5, 'D5'), (2, .5, 'F#5')], 96, 'chorus')


def series2():
    """12.39 - 13.43 'סדרות הודיות': landing hit (D), 3-3-3 push, A (V) tension into the Bollywood hold; bollywood-burst accent 12.745"""
    t0 = T_LAND2
    s = (T_IND0 - t0) / 9
    tutti(t0, 'D', 0.95, dur=0.3, crash_on=True, choir_on=False)
    bed(t0, T_IND0 - 0.03, 'D', lvl=74, horn=True)
    for grp in range(3):
        tt = t0 + grp * 3 * s
        ch = 'D' if grp < 2 else 'A'
        r, pcs = ct(ch)
        kick.n(tt + hum(2.5), 0.2, 60, 116 - 4 * grp)
        snare.n(tt + 1.5 * s + hum(3), 0.2, 60, 98 + 6 * grp)
        tamb.n(tt + 1.5 * s + 0.004, 0.15, 60, 80)
        hho.n(tt + 2 * s, s, 60, 80)
        piano.n(tt + hum(5), 0.3, [near(pcs[0], m('C4')), near(pcs[1], m('C4')), near(pcs[2], m('C4'))], 92 + rv(-4, 4))
        hn_st.n(tt + hum(4), s * 0.9, [near(pcs[1], m('E4')), near(pcs[2], m('E4'))], 96 + 5 * grp)
        tp_st.n(tt + hum(4), s * 0.9, near(pcs[2], m('A4')), 92 + 5 * grp)
        cbpz.n(tt + 2 * s + hum(4), 0.2, near(r, m('E1')), 92)
        vln_sp.n(tt + 1.5 * s + hum(5), 0.1, [near(pcs[1], m('B4')), near(pcs[2], m('B4'))], 84)
    taiko.n(t0, 0.3, tk_n('D'), 118)
    timp.n(t0 + 6 * s, 0.4, 'A1', 100)
    for i in range(3):
        snc.n(T_IND0 - 0.09 + i * 0.03, 0.04, 60, 70 + 14 * i)
    stab(T_INDSPL, 'D', 104, 0.15)
    tabla.n(T_INDSPL, 0.2, 60, 100, kind='dha')
    sparkle(T_INDSPL, 2, notes=8, dur=0.25, scale=(0, 1, 4, 5, 7, 8, 11), base='D5', vel=68)


def live():
    """14.54 - 17.315: the theme returns in D (trumpet + flute + violins), heartbeat break 15.14-15.62 (lub-dub), israel hit 15.66, voice pause 16.16-16.58 = rising build,
    all-burst 16.58, orbit riser, A -> Bb (the half-step lift), suck-in gap, vortex 17.315"""
    t0 = T_LAND3
    g = PW([(0, t0), (4, T_ALLB), (6, T_VORTEX)])
    mute = (T_LUB - 0.11, T_ISR - 0.05)
    tutti(t0, 'D', 1.05, dur=0.35, crash_on=True)
    groove(g, 0, 2, 'D', 1.05, 'chorus', mute=mute)
    groove(g, 2, 2, 'G', 1.05, 'chorus', mute=mute)
    groove(g, 4, 1, 'A', 1.1, 'chorus')
    groove(g, 5, 1, 'Bb', 1.15, 'chorus')
    bed(t0, g(4) - 0.02, 'D', lvl=76, horn=True)
    bed(g(4), g(5) - 0.02, 'A', lvl=80, horn=True)
    bed(g(5), T_VORTEX - 0.1, 'Bb', lvl=84, horn=True)
    lead(g, LIVE_D, 100, 'chorus', beats=(0, 4))
    lead(g, [(4, .75, 'A5'), (4.75, .25, 'A5'), (5, .5, 'Bb5'), (5.5, .5, 'D6')], 108, 'chorus')
    stab(T_ISR, 'D', 112, 0.2)
    timp.n(T_ISR, 0.8, 'D2', 112)
    taiko.n(T_ISR, 0.5, tk_n('D'), 118)
    crash.n(T_ISR, 1.4, 60, 100)
    sparkle(T_ISR, 2, notes=8, dur=0.25, scale=(0, 2, 4, 6, 7, 9, 11), base='A5', vel=74)
    # pause build: rising strings scale (A major -> Bb), timpani, riser; all-burst 16.58; orbit riser
    scl = ['A4', 'B4', 'C#5', 'D5', 'E5', 'F5', 'G5', 'A5']
    for k in range(8):
        tk = g(4) + k * (g(6) - g(4) - 0.15) / 8
        vln_su.n(tk + hum(3), 0.11, scl[k], 86 + 4 * k)
        vla_sp.n(tk + hum(3), 0.09, m(scl[k]) - 12, 80 + 4 * k)
    tt = g(4)
    while tt < T_VORTEX - 0.12:
        u = (tt - g(4)) / (T_VORTEX - 0.12 - g(4))
        timp.n(tt + hum(2), 0.1, 'Bb1', int(56 + 66 * u))
        tt += 0.075 - 0.03 * u
    stab(T_ALLB, 'A', 112, 0.2)
    crash.n(T_ALLB, 1.4, 60, 104)
    sparkle(T_ALLB, 9, notes=10, dur=0.3, scale=(0, 2, 4, 6, 7, 9, 11), base='A5', vel=80)
    riser.n(g(3.5), T_VORTEX - g(3.5) - 0.02, 60, 92, kind='noise', lo=300, hi=12000, n0=46, oct=3)
    riser.n(T_ORBIT, T_VORTEX - T_ORBIT - 0.02, 60, 90, kind='noise', lo=600, hi=14000, n0=58, oct=2.5)
    riser.n(T_VORTEX, T_VORTEX - g(4) - 0.05, 60, 100, kind='cym', len='m')
    tb_su.n(g(4), T_VORTEX - g(4) - 0.1, ['Bb1', 'F2', 'D3'], 100)
    tb_su.ex(g(4), T_VORTEX - 0.1, -14, 0, 1.4, pre=False, post=False)


def chorus():
    """17.315 - 22.28: Eb MAJOR (half-step lift).  Vortex 'אחד' = Eb drop, hook peak G5 on the tap (18.39), 7 rising day notes Eb F G Ab Bb C D (harp + pizz),
    goal 20.90 resolves on Eb, GOAL burst 21.795 lifts to Ab."""
    g = PW([(0, T_VORTEX), (2, T_NAGISH), (4, T_DAY0)])
    tutti(T_VORTEX, 'Eb', 1.25, dur=0.6)
    gong.n(T_VORTEX, 3.0, 60, 100)
    braaam.n(T_VORTEX, 0.5, 'Eb1', 78)
    crash.n(T_VORTEX, 2.0, 60, 118)
    groove(g, 0, 2, 'Eb', 1.08, 'chorus')
    groove(g, 2, 2, 'Cm', 1.08, 'chorus')
    bed(T_VORTEX + 0.01, g(2) - 0.02, 'Eb', lvl=88, horn=True)
    bed(g(2), g(4) - 0.02, 'Cm', lvl=88, horn=True)
    choir.n(T_VORTEX, g(4) - T_VORTEX - 0.02, ['Eb4', 'G4', 'Bb4', 'Eb5'], 70)
    lead(g, CH_EB, 108, 'chorus')
    stab(T_NAGISH, 'Cm', 116, 0.22)
    timp.n(T_NAGISH, 0.6, 'C2', 118)
    crash.n(T_NAGISH, 1.4, 60, 104)
    sparkle(T_NAGISH, 7, notes=8, dur=0.3, scale=(0, 2, 4, 7, 9), base='Bb4', vel=78)
    # pops region: strings only, soft kick heartbeat, no ostinato (leave room)
    for (a, b, ch) in [(T_DAY0 - 0.01, DAY_T[3] - 0.02, 'Eb'), (DAY_T[3] - 0.01, DAY_T[6] - 0.02, 'Ab'), (DAY_T[6] - 0.01, T_GOAL - 0.02, 'Bb')]:
        bed(a, b, ch, lvl=76)
        r, _ = ct(ch)
        hn_su.n(a, b - a, [near(ct(ch)[1][1], m('E3')), near(ct(ch)[1][2], m('E3'))], 66)
    for i, k in enumerate((0, 3, 6)):
        kick.n(DAY_T[k] + hum(3), 0.25, 60, 74 + 9 * i)
        cbpz.n(DAY_T[k] + 0.22, 0.25, ['Eb2', 'Ab1', 'Bb1'][i], 84)
    tt = DAY_T[6] + 0.10
    while tt < T_GOAL - 0.01:
        u = (tt - (DAY_T[6] + 0.10)) / (T_GOAL - DAY_T[6] - 0.11)
        snc.n(tt, 0.04, 60, int(40 + 80 * u ** 1.4))
        tt += 0.04
    riser.n(DAY_T[3], T_GOAL - DAY_T[3] - 0.02, 60, 70, kind='noise', lo=400, hi=10000, n0=55, oct=2.4)
    riser.n(T_GOAL, T_GOAL - DAY_T[5], 60, 90, kind='cym', len='s')
    # the 7 day notes (separate 'days' stem): rising major scale in Eb, harp + violin pizzicato; D = leading tone, the goal resolves on Eb
    for k, (tt, nt) in enumerate(zip(DAY_T, DAYS_EB)):
        harp_d.n(tt, 0.55, nt, 74 + 5 * k)
        harp_d.n(tt + 0.004, 0.5, m(nt) - 12, 52 + 4 * k)
        pz_d.n(tt + 0.002, 0.12, nt, 62 + 5 * k)
    pno_d.n(DAY_T[6], 1.0, ['D4', 'A4'], 70)
    for i, nn in enumerate(['G5', 'Bb5', 'D6', 'Eb6', 'G6']):
        harp_d.n(DAY_T[6] + 0.05 + i * 0.03, 0.6, nn, 62 - i * 3)
    # ---- GOAL: ball lands 20.90 (Eb tutti), bounce 21.345, GOAL burst 21.795 (Ab)
    gg = PW([(0, T_GOAL), (1, T_BNC), (2, T_GOALB2), (3, T_WAIT)])
    tutti(T_GOAL, 'Eb', 1.3, dur=0.8)
    gong.n(T_GOAL, 3.0, 60, 108)
    trailer.n(T_GOAL, 1.5, tr_n('Eb'), 120)
    crash.n(T_GOAL, 2.0, 60, 118)
    groove(gg, 0, 2, 'Eb', 1.1, 'chorus')
    groove(gg, 2, 1, 'Ab', 1.1, 'chorus')
    bed(T_GOAL + 0.01, T_GOALB2 - 0.02, 'Eb', lvl=90, horn=True)
    bed(T_GOALB2, T_WAIT - 0.02, 'Ab', lvl=92, horn=True)
    lead(gg, [(0, .9, 'Bb5'), (1, .5, 'G5'), (1.5, .5, 'Bb5'), (2, 1, 'C6')], 112, 'tutti')
    stab(T_BNC, 'Eb', 104, 0.15)
    snare.n(T_BNC, 0.2, 60, 100)
    crash.n(T_BNC, 1.0, 60, 84)
    tutti(T_GOALB2, 'Ab', 1.25, dur=0.6, crash_on=True)
    gong.n(T_GOALB2, 3.0, 60, 100)
    sparkle(T_GOALB2, 8, notes=12, dur=0.4, scale=(0, 2, 4, 7, 9), base='C6', vel=86)
    taiko8(T_GOAL, gg.b if hasattr(gg, 'b') else 0.46, 3, 'C', 1.0, ch='Eb')


def wait():
    """22.28 - 24.79 the premiere countdown (Eb world): Cm | Fm | Bb | Ab (curtains open 23.59) | Cm (chest 23.92) | Bb (bow 24.47) -> box 24.79"""
    plan = [(T_WAIT, T_C2, 'Cm'), (T_C2, T_C1, 'Fm'), (T_C1, T_OPENC, 'Bb'), (T_OPENC, T_CHEST, 'Ab'), (T_CHEST, T_BOW, 'Cm'), (T_BOW, T_FUN, 'Bb')]
    for k, (a, b, ch) in enumerate(plan):
        r, pcs = ct(ch)
        bed(a + 0.01, b - 0.02, ch, lvl=80 + 2 * k, hi=True)
        if k >= 2:
            vln_tr.n(a + 0.01, b - a - 0.03, [near(pcs[1], m('B4')), near(pcs[0], m('E5'))], 90)
        if k in (0, 3, 4):
            hn_su.n(a + 0.01, b - a - 0.03, [near(pcs[1], m('E3')), near(pcs[2], m('E3'))], 70)
    stab(T_WAIT, 'Cm', 116, 0.25)
    timp.n(T_WAIT, 1.0, 'C2', 116)
    kick.n(T_WAIT, 0.3, 60, 114)
    crash.n(T_WAIT, 1.6, 60, 100)
    trailer.n(T_WAIT, 1.2, tr_n('Cm'), 100)
    for tt, nt, v in ((T_C2, 'F2', 108), (T_C1, 'Bb1', 116)):
        timp.n(tt, 0.7, nt, v)
        kick.n(tt, 0.3, 60, int(v))
        vsol_sp.n(tt, 0.1, 'Bb6', 96)
        glock.n(tt, 0.5, 'Bb6', 70)
    # clock-like pizzicato ticks tightening toward the curtain
    for k in range(8):
        tt = T_C2 + 0.05 + k * (T_OPENC - T_C2 - 0.1) / 8 * (1 - 0.03 * k)
        vsol_sp.n(tt + hum(3), 0.08, 'F6' if k % 2 == 0 else 'Bb5', 66 + 4 * k)
    vln_tr.ex(T_C1, T_OPENC, -16, -1, 1.4, pre=False, post=False)
    # the hook head in the flute: Bb Bb C -> Eb6 on the curtain
    for tt, n0, d, v in [(T_C1 + 0.01, 'Bb5', 0.15, 88), (T_C1 + 0.19, 'Bb5', 0.15, 90), (T_C1 + 0.37, 'C6', 0.16, 92), (T_OPENC, 'Eb6', 0.9, 98)]:
        flute_sv.n(tt, d, n0, v)
    tt = T_OPENC - 0.45
    while tt < T_OPENC - 0.01:
        u = (tt - (T_OPENC - 0.45)) / 0.45
        snc.n(tt, 0.05, 60, int(40 + 80 * u ** 1.3))
        tt += 0.04
    riser.n(T_C1, T_OPENC - T_C1 - 0.02, 60, 88, kind='noise', lo=300, hi=12000, n0=52, oct=3)
    riser.n(T_OPENC, T_OPENC - T_C1, 60, 96, kind='cym', len='m')
    tutti(T_OPENC, 'Ab', 1.05, dur=0.7, crash_on=True)
    sparkle(T_OPENC, 8, notes=14, dur=0.5, scale=(0, 2, 4, 6, 7, 9, 11), base='C5', vel=88)
    tp_su.n(T_OPENC, 0.7, ['Eb6', 'Ab5'], 100)
    timp.n(T_CHEST, 0.9, 'C2', 120)
    bd.n(T_CHEST, 1.4, bdn('Cm'), 116)
    sub.n(T_CHEST, 0.5, 'C1', 96)
    vcpz.n(T_CHEST, 0.2, ['C2', 'G2'], 110)
    cbpz.n(T_CHEST, 0.2, 'C1', 110)
    kick.n(T_CHEST, 0.3, 60, 112)
    stab(T_CHEST, 'Cm', 100, 0.15)
    tp_st.n(T_BOW, 0.1, ['Bb5', 'D6'], 96)
    glock.n(T_BOW, 0.5, ['Bb6', 'F7'], 82)
    harp.n(T_BOW, 0.5, ['Bb4', 'F5', 'Bb5'], 76)
    vlnpz.n(T_BOW, 0.1, ['Bb4', 'D5', 'F5'], 88)
    tt = T_FUN - 0.30
    while tt < T_FUN - 0.01:
        u = (tt - (T_FUN - 0.30)) / 0.30
        snc.n(tt, 0.04, 60, int(50 + 76 * u ** 1.3))
        tt += 0.035
    riser.n(T_BOW, T_FUN - T_BOW - 0.02, 60, 80, kind='noise', lo=500, hi=13000, n0=57, oct=2.5)
    riser.n(T_FUN, T_FUN - T_BOW, 60, 96, kind='cym', len='s')


def fun():
    """24.79 - 25.86: the box pops open: Eb major burst (confetti); six reveals (25.08 ... 25.58) = rising Eb pentatonic on glock + celesta + harp + pizz; sweep; micro gap; NO"""
    tutti(T_FUN, 'Eb', 1.05, dur=0.5, crash_on=True)
    braaam.n(T_FUN, 0.4, 'Eb1', 66)
    sparkle(T_FUN, 3, notes=20, dur=0.6, scale=(0, 2, 4, 7, 9), base='Eb5', vel=92)
    choir.n(T_FUN, 0.9, ['Eb4', 'G4', 'Bb4', 'Eb5'], 80)
    hn_su.n(T_FUN - 0.06, 1.0, ['Eb3', 'Bb3', 'G4'], 96)
    tp_su.n(T_FUN, 0.7, ['Bb5', 'Eb6'], 96)
    vln_su.n(T_FUN - 0.08, 1.0, ['G5', 'Bb5', 'Eb6'], 90)
    r, pcs = ct('Eb')
    for dt in (0.10, 0.19):
        vlnpz.n(T_FUN + dt + hum(3), 0.1, [near(pcs[0], m('G4')), near(pcs[1], m('G4'))], 84)
        vlapz.n(T_FUN + dt + hum(3), 0.1, near(pcs[2], m('Bb3')), 80)
        vcpz.n(T_FUN + dt + hum(3), 0.1, near(r, m('C3')), 90)
    casc = ['Eb5', 'F5', 'G5', 'Bb5', 'C6', 'Eb6']
    for k, (tt, nt) in enumerate(zip(REV, casc)):
        glock.n(tt, 0.4, m(nt) + 12, 74 + 2 * k)
        celesta.n(tt + 0.004, 0.4, m(nt) + 12, 58 + 2 * k)
        harp.n(tt, 0.7, nt, 74 + 2 * k)
        vlnpz.n(tt, 0.1, nt, 70 + 3 * k)
    kick.n(T_FUN, 0.3, 60, 116)
    for tt in REV[::2]:
        kick.n(tt + hum(3), 0.3, 60, 92)
    for tt in REV[1::2]:
        snare.n(tt + hum(3), 0.2, 60, 84)
    for tt in REV:
        tamb.n(tt + 0.05, 0.2, 60, 76)
    bed(T_FUN + 0.5, REV[-1], 'Eb', lvl=84)
    bed(REV[-1], T_NO1 - 0.02, 'Bb', lvl=80)
    riser.n(REV[-1], T_NO1 - REV[-1] - 0.02, 60, 96, kind='noise', lo=400, hi=13000, n0=58, oct=2.6)
    riser.n(T_NO1, T_NO1 - REV[-1], 60, 100, kind='cym', len='s')
    tt = REV[-1]
    i = 0
    while tt < T_NO1 - 0.09:
        u = (tt - REV[-1]) / (T_NO1 - 0.09 - REV[-1])
        snc.n(tt, 0.04, 60, int(50 + 76 * u))
        i += 1
        tt = REV[-1] + i * 0.04


def accents():
    """small accents on the scene agents' // CUE comments"""
    glock.n(T_PING1, 0.5, 'A6', 62)
    glock.n(T_PING2, 0.5, 'D7', 66)
    harp.n(T_PING1, 0.5, 'A5', 58)
    for k, nt in enumerate(['A5', 'B5', 'D6', 'F#6']):              # the four sport logos pop (7.02 .. 7.35)
        glock.n(T_SPOP[k], 0.5, nt, 68 + 3 * k)
        vlnpz.n(T_SPOP[k], 0.1, nt, 66 + 3 * k)
    ocym.n(T_LIGHTS, 1.5, 60, 66)
    vlnpz.n(T_THUMB, 0.1, ['Bb5', 'Eb6'], 86)                       # thumb enters
    harp.n(T_THUMB, 0.4, ['Bb5', 'Eb6'], 72)
    for k, nt in enumerate(['Eb4', 'G4', 'Bb4', 'Eb5', 'G5', 'Bb5', 'Eb6']):     # calendar-in 18.86
        harp.n(T_CAL - 0.02 + k * 0.045 + hum(3), 0.6, nt, 62 + 2 * k)


def nos():
    """25.86 - 28.30: two NO slams (Cm low, dry; the second a half-step up on Db), tension pulse between, X slam 26.79, dizzy pulse, cross-out 27.91, wave sweep"""
    for t, big in ((T_NO1, 1.0), (T_NO2, 1.1)):
        ch = 'Cm' if t == T_NO1 else 'Db'
        stab(t, ch, 124, 0.35)
        tb_su.n(t, 0.5, [near(ct(ch)[0], m('C2')), near(ct(ch)[0], m('C2')) + 7, near(ct(ch)[0], m('C2')) + 12], 122)
        timp.n(t, 1.2, 'C2' if ch == 'Cm' else 'Db2', 127)
        bd.n(t, 2.0, bdn(ch), 124)
        trailer.n(t, 1.6, tr_n(ch), 122)
        boom.n(t, 1.6, 60, 116, **bm(ch))
        sub.n(t, 1.4, 'C1' if ch == 'Cm' else 'Db1', 104)
        crash.n(t, 1.6, 60, 108)
        cb_su.n(t, 0.6, 'C2' if ch == 'Cm' else 'Db2', 110)
        vc_su.n(t, 0.6, ['C2', 'G2'] if ch == 'Cm' else ['Db2', 'Ab2'], 104)
    braaam.n(T_NO1, 0.45, 'C1', 92)
    braaam.n(T_NO2, 0.5, 'Db1', 96)
    # tension pulse (real cello / bass spiccato 8ths + timpani) between the NOs
    n = 0
    tt = T_NO1 + 0.3
    step = (T_NO2 - T_NO1 - 0.35) / 12
    while tt < T_NO2 - 0.1:
        u = (tt - T_NO1) / (T_NO2 - T_NO1)
        vc_sp.n(tt + hum(4), step * 0.7, 'C3' if n % 4 else 'C2', int(64 + 30 * u))
        cb_sp.n(tt + hum(4), step * 0.7, 'C2', int(60 + 30 * u))
        if n % 2 == 0:
            timp.n(tt, 0.2, 'C2', int(50 + 40 * u))
        n += 1
        tt += step
    vln_tr.n(T_NO1 + 0.3, T_NO2 - T_NO1 - 0.4, ['C5', 'G5'], 70)
    vln_tr.ex(T_NO1 + 0.3, T_NO2 - 0.1, -22, -8, 1.0, pre=False, post=False)
    stab(T_XSLAM, 'Cm', 106, 0.15)
    timp.n(T_XSLAM, 0.5, 'G1', 108)
    crash.n(T_XSLAM + 0.12, 1.0, 60, 84)
    sparkle(T_XSLAM + 0.12, 0, notes=8, dur=0.3, scale=(0, 3, 6, 7, 10), base='C6', vel=66)
    # dizzy pulse 27.17 -> 27.91: staccato strings + kick + hats, accelerating
    t0 = T_NO2 + 0.14
    n = 0
    tt = t0
    step = 0.25
    while tt < T_XOUT - 0.02:
        u = (tt - t0) / (T_XOUT - t0)
        v = int((100 if n % 2 == 0 else 70) * (0.75 + 0.35 * u))
        vc_sp.n(tt + hum(3), step * 0.5, 'C3' if n % 4 else 'C4', v)
        cb_sp.n(tt + hum(3), step * 0.5, 'C2', v)
        vsol_sp.n(tt, 0.06, ['C5', 'Eb5', 'G5', 'Eb5'][n % 4], int(56 + 30 * u))
        vlnpz.n(tt + hum(3), 0.08, ['G5', 'C6'][n % 2], int(60 + 24 * u))
        if n % 2 == 0:
            kick.n(tt, 0.2, 60, int(84 + 24 * u))
        hh.n(tt, 0.05, 60, int(60 + 30 * u))
        n += 1
        step = 0.25 - 0.09 * u
        tt += step
    stab(T_XOUT, 'Cm', 120, 0.25)
    timp.n(T_XOUT, 0.8, 'C2', 122)
    trailer.n(T_XOUT, 1.2, tr_n('Cm'), 114)
    crash.n(T_XOUT, 1.8, 60, 112)
    riser.n(T_RELIEF, T_RELIEF - T_XOUT - 0.05, 60, 92, kind='cym', len='s')
    riser.n(T_XOUT + 0.05, T_RELIEF - T_XOUT - 0.07, 60, 70, kind='noise', lo=400, hi=11000, n0=55, oct=2.4)


def relief():
    """28.30 relief (Eb, warm); finale build 28.58 -> LOGO SLAM 31.10: pick, bounce 28.865, tap 29.555 (Ab), burst 29.80, playback 30.49 (Bb), goal burst 30.70,
    iris suck 30.92; hook head Bb Bb C Eb -> G5 on the logo; final cadence Bb -> Eb"""
    r0 = T_RELIEF
    for pp, ns, v in [(vln_su, ['Bb4', 'Eb5', 'G5'], 74), (vla_su, ['G3', 'Bb3', 'Eb4'], 72), (vc_su, ['Eb2', 'Bb2'], 76), (cb_su, ['Eb1'], 72),
                      (hn_su, ['Bb3', 'Eb4'], 70)]:
        pp.n(r0 + hum(6), T_PICK + 0.1 - r0, ns, v)
        pp.ex(r0, T_PICK + 0.1, -12, -4, 0.9, pre=False, post=False)
    for k, nn in enumerate(['Eb4', 'Bb4', 'G4', 'Eb5', 'Bb5', 'G5']):
        harp.n(r0 + 0.02 + k * 0.06 + hum(3), 0.8, nn, 66 + 2 * k)
    cbpz.n(r0, 0.5, 'Eb2', 84)
    g = PW([(0, T_PICK), (2, T_TAP), (4, T_PLAY), (5.5, T_LOGO)])
    plan = [(0, 1, 'Eb', 0.62), (1, 1, 'Cm', 0.78), (2, 2, 'Ab', 1.0), (4, 1.5, 'Bb', 1.12)]
    for b0, nb, ch, lv in plan:
        groove(g, b0, nb, ch, lv, 'verse' if b0 < 2 else 'chorus')
        bed(g(b0), g(b0 + nb) - 0.02, ch, lvl=66 + int(24 * lv), horn=b0 >= 2)
    # pick: pizzicato/harp/flute motif Eb G Bb as the tiles glide in; bounce 28.865
    for k, nn in enumerate(['Bb4', 'Eb5', 'F5', 'G5']):
        vlnpz.n(T_PICK + k * 0.22 + hum(4), 0.1, nn, 70 + 4 * k)
        harp.n(T_PICK + k * 0.22 + hum(4), 0.6, nn, 64 + 4 * k)
    flute_sv.n(T_PICK, 0.9, 'Bb5', 62)
    stab(T_BNCE, 'Ab', 96, 0.12)
    tamb.n(T_BNCE, 0.2, 60, 90)
    for t, ch, big in ((T_TAP, 'Ab', 0.8), (T_BURST, 'Ab', 0.95), (T_PLAY, 'Bb', 1.0)):
        stab(t, ch, 108 + int(10 * big), 0.2)
        timp.n(t, 0.8, near(ct(ch)[0], m('D2')), 100 + int(20 * big))
        crash.n(t, 1.6, 60, 96 + int(14 * big))
        taiko.n(t, 0.5, tk_n(ch), 118)
        tutti(t, ch, big * 0.85, dur=0.28, crash_on=False, choir_on=False)
    sparkle(T_TAP, 8, notes=8, dur=0.25, scale=(0, 2, 4, 7, 9), base='C5', vel=78)
    sparkle(T_BURST, 3, notes=10, dur=0.3, scale=(0, 2, 4, 7, 9), base='Eb5', vel=84)
    riser.n(T_PLAY, T_LOGO - T_PLAY - 0.02, 60, 100, kind='noise', lo=300, hi=12000, n0=46, oct=3)
    riser.n(T_LOGO, T_LOGO - T_PLAY, 60, 100, kind='cym', len='m')
    dm = ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'A5', 'Bb5']
    for k, nt in enumerate(dm):
        tk = T_GOALB + k * (T_SUCK - T_GOALB) / len(dm)
        vln_sp.n(tk + hum(3), 0.06, [nt, m(nt) - 12], 84 + 4 * k)
        vla_sp.n(tk + hum(3), 0.06, m(nt) - 12, 78 + 3 * k)
    tt = T_GOALB
    i = 0
    while tt < T_LOGO - 0.10:
        u = (tt - T_GOALB) / (T_LOGO - 0.10 - T_GOALB)
        snc.n(tt, 0.04, 60, int(50 + 76 * u))
        i += 1
        tt = T_GOALB + i * 0.045 * (1 - 0.4 * u)
    tt = T_PLAY
    while tt < T_LOGO - 0.12:
        timp.n(tt, 0.1, 'Bb1', int(70 + 50 * (tt - T_PLAY) / (T_LOGO - T_PLAY)))
        tt += 0.06
    for dt, nt, v in [(-0.8, 'Bb4', 100), (-0.6, 'Bb4', 102), (-0.4, 'C5', 106), (-0.2, 'Eb5', 110)]:      # hook head into the logo
        tt = T_LOGO + dt
        for pp in (tp_st, hn_st):
            pp.n(tt + hum(3), 0.16, m(nt) - (12 if pp is hn_st else 0), v)
        vln_sp.n(tt, 0.16, m(nt) + 12, v - 8)
    t = T_LOGO
    tutti(t, 'Eb', 1.35, dur=2.4)
    gong.n(t, 4.0, 60, 124)
    trailer.n(t + 0.002, 2.4, tr_n('Eb'), 127)
    braaam.n(t, 1.4, 'Eb1', 110)
    tp_su.n(t, 2.4, ['G5', 'Bb5'], 120)
    hn_su.n(t, 2.4, ['G4', 'Bb4', 'Eb4'], 116)
    vln_su.n(t, 2.6, ['G5', 'Bb5', 'Eb6'], 112)
    sparkle(t + 0.01, 3, notes=16, dur=0.6, scale=(0, 2, 4, 7, 9), base='Bb5', vel=92)
    crash.n(t, 2.5, 60, 127)
    for pp, ns, v in [(vln_su, ['G4', 'Bb4', 'Eb5'], 92), (vla_su, ['Bb3', 'Eb4'], 90), (vc_su, ['Eb2', 'Bb2'], 92), (cb_su, ['Eb1'], 90),
                      (hn_su, ['Eb3', 'Bb3', 'G4'], 90)]:
        pp.n(t + 2.4, 34.1 - t - 2.4, ns, v)
        pp.ex(t + 2.4, 34.1, 0, -24, 0.8, pre=False, post=False)
    choir.n(t + 0.1, 34.1 - t - 0.1, ['Eb3', 'Bb3', 'Eb4', 'G4', 'Bb4'], 90)
    choir.expr(t + 0.2, 34.0, 110, 55, 0.9)
    for k, nn in enumerate(['Eb3', 'Bb3', 'Eb4', 'G4', 'Bb4', 'Eb5', 'G5', 'Bb5']):
        harp.n(t + 0.35 + k * 0.11 + hum(4), 1.4, nn, 74 - k)
    for k, nn in enumerate(['Bb4', 'Bb4', 'C5', 'Eb5', 'G5']):                      # hook head echo (flute + harp + celesta), soft
        tt = t + 1.45 + [0, 0.22, 0.44, 0.66, 0.95][k]
        flute_sv.n(tt, 0.3 if k < 4 else 1.4, nn, 66)
        celesta.n(tt, 0.5, m(nn) + 12, 52)
        harp.n(tt, 0.7, nn, 62)
    sparkle(T_TAG, 3, notes=8, dur=0.4, scale=(0, 2, 4, 7, 9), base='Bb5', vel=70)
    piano.n(t + 0.02, 3.0, ['Eb2', 'Bb2', 'Eb3', 'G3'], 80)


def compose():
    intro()
    accents()
    sectionA()
    cin()
    series1()
    tur()
    series2()
    ind()
    live()
    chorus()
    wait()
    fun()
    nos()
    relief()


def tur():
    """hold 11.38 - 12.38: Turkish drama pastiche (D Hijaz): dum-dum-DUM, string tremolo, oboe (duduk) lament, kanun, sob; roll -> pickup 12.39"""
    t0, t1 = T_TUR0, T_TUR1
    timp.n(t0, 1.0, X('E2'), 127)
    stab(t0, 'D', 124, 0.3)
    vc_su.n(t0, 0.3, [X('E2'), X('E3')], 124)
    cb_su.n(t0, 0.3, X('E2'), 124)
    darb.n(t0, 0.3, 60, 127, kind='doum')
    ocym.n(t0, 1.5, 60, 104)
    sub.n(t0, 0.5, X('E1'), 110)
    riser.n(t0 - 0.30, 0.31, 60, 70, kind='noise', lo=600, hi=12000, n0=52, oct=3)
    # dum - dum - DUM
    timp.n(t0 + 0.25, 0.6, X('E2'), 100)
    darb.n(t0 + 0.25, 0.3, 60, 104, kind='doum')
    timp.n(t0 + 0.50, 1.0, X('B1'), 127)
    darb.n(t0 + 0.50, 0.3, 60, 127, kind='doum')
    stab(t0 + 0.50, 'D', 120, 0.25)
    ocym.n(t0 + 0.50, 1.2, 60, 92)
    # tremolo strings on the E-major triad with F (Hijaz colour), swelling
    vln_tr.n(t0 + 0.08, t1 - t0 - 0.30, [X('B4'), X('E5'), X('G#5')], 104)
    vc_tr.n(t0 + 0.08, t1 - t0 - 0.30, [X('E3'), X('B3')], 104)
    vln_tr.ex(t0, t0 + 0.5, -14, -3, post=False)
    vln_tr.ex(t0 + 0.5, t1 - 0.28, -3, 0, pre=False)
    vc_tr.ex(t0, t1 - 0.28, -10, 0)
    # oboe (duduk-like) lament: Hijaz descending with scoops, and a sob (fall) on the last note
    ln = [(0.05, X('B4'), 0.30, 96, dict(**{'from': -1.0, 'gl': 0.05})), (0.38, X('A4'), 0.12, 90, {}), (0.52, X('G#4'), 0.14, 92, {}),
          (0.68, X('F4'), 0.16, 92, {}), (0.86, X('E4'), 0.34, 96, dict(bend=(-2.2, 0.35), vib=0.35, vd=0.05))]
    for dt, n_, d, v, kw in ln:
        oboe.n(t0 + dt, d, n_, v, **kw)
    vln_solo.n(t0 + 0.05, 0.9, X('B5'), 80, **{'from': 1.5, 'gl': 0.12, 'vib': 0.3, 'vd': 0.1, 'bend': (-2.5, 0.5)})
    # darbuka figure + kanun tremolo run answering the oboe
    for dt, k, v in [(0.10, 'tek', 88), (0.16, 'tek', 66), (0.38, 'tek', 90), (0.62, 'doum', 108), (0.68, 'tek', 82),
                     (0.74, 'tek', 92)]:
        darb.n(t0 + dt, 0.2, 60, v, kind=k)
    run = [X('E6'), X('D6'), X('C6'), X('B5'), X('A5'), X('G#5'), X('F5'), X('E5')]
    for i, n_ in enumerate(run):
        for k in range(2):
            kanun.n(t0 + 0.56 + i * 0.045 + k * 0.022, 0.05, n_, 96 - 3 * i)
    # pickup: darbuka + snare roll and a Hijaz string run landing on T_LAND2
    tl = T_LAND2
    for i in range(10):
        darb.n(tl - 0.22 + i * 0.022, 0.06, 60, 80 + 4 * i, kind='tek')
    tt = tl - 0.30
    while tt < tl - 0.01:
        u = (tt - (tl - 0.30)) / 0.30
        snc.n(tt, 0.04, 60, int(46 + 80 * u ** 1.3))
        tt += 0.03
    hij = [X('E4'), X('F4'), X('G#4'), X('A4'), X('B4'), X('C5'), X('D#5'), X('E5')]
    for k, nt in enumerate(hij):
        tk = tl - 0.02 - 0.26 * ((7 - k) / 7) ** 1.2
        vln_sp.n(tk, 0.06, [nt, m(nt) + 12], 84 + 5 * k)
        vla_sp.n(tk, 0.06, nt, 80 + 4 * k)
    timp.n(tl - 0.25, 0.3, X('B1'), 96)
    riser.n(tl, 0.45, 60, 88, kind='cym', len='s')



def ind():
    """hold 13.43 - 14.53: BOLLYWOOD / filmi pastiche (original), the star of the hold.  Bounce = 3+3+3 sixteenths (bhangra/filmi feel, ~122 BPM),
    downbeat accent, bright sitar riff with jawari buzz + meend slides (Bhairav-flavoured: E F G# A B C), harmonium drone, dhol + tabla groove,
    shehnai (double-reed) long line with ornaments, ornamental female 'aa-aa' vocalise with a gamak trill, bansuri answer, playful staccato
    filmi violins; then a tirakita / violin-run pickup that lands on the theme at 14.54."""
    t0, tl = T_IND0, T_LAND3
    s = (tl - t0) / 9                                     # 0.1233 s
    ts = lambda k: t0 + k * s
    # ---- downbeat accent
    dhol_h.n(ts(0), 0.5, 60, 127)
    dhol_s.n(ts(0), 0.2, 60, 112)
    tabla.n(ts(0), 0.3, 60, 120, kind='dha')
    sitar.n(ts(0), 0.5, [X('E4'), X('B4'), X('E5')], 118)
    harmon.n(ts(0), 1.06, [X('E3'), X('B3'), X('E4'), X('G#4')], 96)
    vln_si.n(ts(0), 0.12, [X('E5'), X('G#5'), X('B5'), X('E6')], 110)
    vlnpz.n(ts(0), 0.12, [X('E5'), X('B5')], 96)
    sub.n(ts(0), 0.45, X('E1'), 108)
    crash.n(ts(0), 1.0, 60, 96)
    tamb.n(ts(0), 0.2, 60, 100)
    # ---- dhol / tabla groove (3+3+3 bounce): dhol bass on 0,3,6; sticks on the off-slots; tabla fills the subdivisions
    for k, v in ((3, 108), (6, 112)):
        dhol_h.n(ts(k), 0.4, 60, v)
    for k, v in ((2, 84), (4, 96), (5, 102), (7, 92), (8, 100)):
        dhol_s.n(ts(k), 0.2, 60, v)
    for k, kind, v in ((1, 'na', 74), (2, 'tin', 92), (3, 'ge', 104), (4, 'na', 90), (5, 'tin', 98), (6, 'dha', 110), (7, 'na', 84)):
        tabla.n(ts(k), 0.2, 60, v, kind=kind, pan=0.15 if kind in ('na', 'tin') else -0.1)
    for i in range(9):
        tamb.n(ts(i) + 0.5 * s, 0.1, 60, 58 + 16 * (i % 2))
    # ---- harmonium drone continues under everything (E + B), bellows tremolo
    harmon.n(ts(0), 1.06, [X('E2'), X('B2')], 70)
    # ---- sitar riff (slots 0-5): E F G# A B with meend slides (augmented 2nd F->G#), then rhythmic chikari plucks
    sit = [(1.0, X('F5'), 0.5, 96, dict(**{'from': -1.0, 'gl': 0.02})), (1.5, X('G#5'), 1.0, 102, dict(**{'from': -3.0, 'gl': 0.05})),
           (2.5, X('A5'), 0.5, 98, dict(**{'from': -1.0, 'gl': 0.03})), (3.0, X('B5'), 1.5, 110, dict(**{'from': -3.0, 'gl': 0.09})),
           (4.5, X('A5'), 0.5, 94, dict(**{'from': 2.0, 'gl': 0.04})), (5.0, X('G#5'), 0.5, 92, {}), (5.5, X('E5'), 0.5, 96, dict(**{'from': -2.0, 'gl': 0.05})),
           (6.5, X('E5'), 0.5, 90, {}), (7.5, X('B4'), 0.5, 92, dict(**{'from': -2.0, 'gl': 0.04}))]
    for k, n_, d, v, kw in sit:
        sitar.n(ts(k), d * s * 1.8, n_, v, **kw)
    # ---- ornamental female vocalise 'aa-aa' + gamak trill (B5 <-> C6)
    for k, n_, d, v, kw in [(2.0, X('E5'), 0.8, 88, dict(**{'from': -2.0, 'gl': 0.05, 'vib': 0.15})), (3.0, X('G#5'), 0.85, 92, {}),
                            (3.9, X('B5'), 2.3, 100, dict(trill=(1.0, 7.0), vd=0.05))]:
        vox.n(ts(k), d * s, n_, v, **kw)
    vox.n(ts(6.4), 0.8 * s, X('G#5'), 84)
    # ---- shehnai (double reed, detuned pair) long line with ornaments
    she = [(3.0, X('B4'), 2.0, 100, dict(**{'from': -1.5, 'gl': 0.06, 'vib': 0.4, 'vr': 6.0, 'vd': 0.08})), (5.1, X('C5'), 0.5, 92, {}), (5.6, X('B4'), 0.5, 94, {}),
           (6.2, X('A4'), 1.0, 94, dict(vib=0.3)), (7.3, X('G#4'), 0.8, 92, {}), (8.1, X('E4'), 0.85, 98, dict(vib=0.45, vd=0.05))]
    for k, n_, d, v, kw in she:
        for dt, dv, det in ((0.0, 0, 0.0), (0.006, -8, 0.14)):
            shehnai.n(ts(k) + dt, d * s, m(n_) + det, v + dv, **kw)
    # ---- bansuri answer (descending, with a b2 touch), overlapping the tail
    for k, n_, d, v, kw in [(5.5, X('B5'), 0.5, 92, dict(**{'from': -2.0, 'gl': 0.05, 'vib': 0.3})), (6.0, X('A5'), 0.5, 90, {}), (6.5, X('G#5'), 0.5, 90, {}),
                            (7.0, X('F5'), 0.5, 92, {}), (7.5, X('E5'), 1.4, 96, dict(vib=0.3, vd=0.05))]:
        flute_ex.n(ts(k), d * s, n_, v, **kw)
    # ---- playful staccato filmi violins (unison, octave) and a bouncy pizzicato
    for k, n_ in ((1.0, X('E5')), (1.5, X('G#5')), (2.0, X('B5')), (4.0, X('B5')), (4.5, X('A5')), (5.0, X('G#5'))):
        vln_si.n(ts(k), 0.1, [n_, m(n_) + 12], 92)
    for k, n_ in ((1.5, X('E5')), (2.5, X('G#5')), (4.5, X('B5')), (5.5, X('E6'))):
        vlnpz.n(ts(k) + 0.02, 0.1, n_, 84)
    vla_si.n(ts(2.0), 0.1, X('E4'), 84)
    vln_solo.n(ts(0.05), 0.8 * s, X('E6'), 70, **{'from': -5.0, 'gl': 0.1, 'vib': 0.2})       # filmi swoop up into the riff
    # ---- pickup: tirakita fill + dhol sticks roll + accelerating E major violin run, landing on the theme (14.54)
    for i in range(8):
        tabla.n(tl - 0.24 + i * 0.03, 0.06, 60, 80 + 5 * i, kind='tak' if i % 2 else 'na', pan=0.1)
        dhol_s.n(tl - 0.24 + i * 0.03, 0.06, 60, 70 + 6 * i)
    scl = [X('G#4'), X('A4'), X('B4'), X('C#5'), X('D#5'), X('E5'), X('F#5'), X('G#5'), X('A5'), X('B5')]
    for k, nt in enumerate(scl):
        tk = tl - 0.03 - 0.36 * ((9 - k) / 9) ** 1.25
        vln_si.n(tk, 0.06, [nt, m(nt) + 12], 80 + 4 * k)
        vla_si.n(tk, 0.06, nt, 74 + 4 * k)
    riser.n(tl, 0.45, 60, 88, kind='cym', len='s')




# ----------------------------------------------------------------------------------------------
# Render + mix
# ----------------------------------------------------------------------------------------------
def pan_st(x, pan, width):
    mid = 0.5 * (x[:, 0] + x[:, 1])
    side = 0.5 * (x[:, 0] - x[:, 1]) * width
    return np.stack([(mid + side) * np.sqrt(1 - pan), (mid - side) * np.sqrt(1 + pan)], 1)


def make_ir(t60, length, seed, predelay=0.015, lpf=6500, er=10, damp_hi=0.45):
    rng = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    lo = signal.butter(2, 2500, 'low', fs=SR, output='sos')
    for c in range(2):
        nz = rng.standard_normal(n)
        l_ = signal.sosfilt(lo, nz)
        ir[:, c] = l_ * np.exp(-6.9 * t / t60) + 0.6 * (nz - l_) * np.exp(-6.9 * t / (t60 * damp_hi))
        pd = int(predelay * SR)
        ir[:pd, c] = 0
        for _ in range(er):
            d = int(rng.uniform(predelay + 0.004, predelay + 0.07) * SR)
            ir[d, c] += rng.uniform(0.25, 0.7) * (1 if rng.random() > 0.5 else -1)
    pd = int(predelay * SR)
    fade = int(0.03 * SR)
    ir[:pd + fade] *= np.linspace(0, 1, pd + fade)[:, None] ** 0.5
    ir = signal.sosfilt(signal.butter(2, lpf, 'low', fs=SR, output='sos'), ir, axis=0)
    ir = signal.sosfilt(signal.butter(2, 200, 'high', fs=SR, output='sos'), ir, axis=0)
    return ir / np.sqrt((ir ** 2).sum(0).mean())


def conv(x, ir):
    return np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], 1)


STEMS = ['drums', 'perc', 'strings', 'brass', 'choir', 'synth', 'fx', 'days']
STEM_EQ = {
    'drums': [hp_sos(35, 4), peq_sos(380, -2.5, 1.0), peq_sos(60, 1.5, 1.0), peq_sos(4500, 1.5, 0.8)],
    'perc': [hp_sos(38, 4), peq_sos(220, -2.5, 0.9)],
    'strings': [hp_sos(38, 4), peq_sos(220, -2.0, 0.9), peq_sos(650, -1.5, 1.0), shelf_sos(6000, 3.0)],
    'brass': [hp_sos(60, 2), peq_sos(220, -2.0, 1.0), peq_sos(600, -2.0, 1.0), peq_sos(1500, 1.5, 1.0), shelf_sos(6000, 2.0)],
    'choir': [hp_sos(120, 2), peq_sos(300, -2.0, 1.0)],
    'synth': [hp_sos(32, 4), peq_sos(250, -2.0, 1.0)],
    'fx': [hp_sos(40, 4), peq_sos(60, -2.0, 1.0)],
    'days': [hp_sos(120, 2)],
}


def auto_curve(p):
    if not p.auto:
        return None
    pts = sorted(p.auto)
    ts = np.array([x[0] for x in pts])
    ds = np.array([x[1] for x in pts])
    return 10 ** (np.interp(np.arange(N) / SR, ts, ds, left=ds[0], right=ds[-1]) / 20)


def render_all():
    compose()
    ir_room = make_ir(0.8, 1.2, 11, predelay=0.006, lpf=8000, er=14, damp_hi=0.5)
    ir_hall = make_ir(2.4, 3.6, 3, predelay=0.025, lpf=6500, er=8, damp_hi=0.4)
    segs = {}
    lvl = {}
    WIN = (('intro', (0.0, 3.4)), ('A', (3.4, 8.3)), ('holds', (8.85, 14.5)), ('live', (14.6, 20.9)), ('end', (28.6, 34.0)))
    for name, p in PARTS.items():
        if not p.notes:
            continue
        notes = [tuple(x) for x in p.notes]
        y = p.engine.render(p, notes)
        c = auto_curve(p)
        if c is not None:
            y = y * c[:, None]
        for s_ in p.eq:
            y = signal.sosfilt(s_, y, axis=0)
        y = pan_st(y, p.pan, p.width) * p.gain
        d = segs.setdefault(p.stem, [np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))])
        d[0] += y
        d[1] += y * p.room
        d[2] += y * p.hall
        for wn, (w0, w1) in WIN:
            lvl.setdefault(name, {})[wn] = float(np.mean(y[int(w0 * SR):int(w1 * SR)] ** 2))
        print('rendered %-8s %4d notes' % (name, len(p.notes)), file=sys.stderr)
    stems = {s: np.zeros((N, 2)) for s in STEMS}
    for stem, (dry, rs, hs) in segs.items():
        stems[stem] += dry + 0.5 * conv(rs, ir_room) + 0.45 * conv(hs, ir_hall)
    return stems, lvl


def env_pts(points):
    return np.interp(np.arange(N) / SR, [p[0] for p in points], [p[1] for p in points])


GAPS = [(T_VORTEX - 0.085, T_VORTEX - 0.004), (T_LOGO - 0.085, T_LOGO - 0.004), (T_NO1 - 0.07, T_NO1 - 0.004)]      # 'suck-in' micro gaps before the two big drops


def mixdown(stems):
    for s in STEMS:
        y = stems[s]
        for s_ in STEM_EQ[s]:
            y = signal.sosfilt(s_, y, axis=0)
        stems[s] = y
    # micro gaps (everything but the risers) so the drop hits from silence
    gm = np.ones(N)
    for a, b in GAPS:
        f = int(0.004 * SR)
        ia, ib = int(a * SR), int(b * SR)
        gm[ia:ib] = 0
        gm[ia - f:ia] = np.linspace(1, 0, f)
    for s in STEMS:
        if s != 'fx':
            stems[s] *= gm[:, None]
    # voice-range carve (-3 dB, 250-3000 Hz) only while the VO speaks (never in the holds): duck-friendly mids
    spk = np.zeros(N)
    for a, b in LINES:
        spk[max(0, int((a - 0.04) * SR)):int((b + 0.06) * SR)] = 1
    k = int(0.05 * SR)
    spk = np.convolve(spk, np.ones(k) / k, mode='same')
    band = signal.butter(2, [250, 3000], 'band', fs=SR, output='sos')
    depth = 1 - 10 ** (-3.0 / 20)
    for s in STEMS:
        stems[s] = stems[s] - depth * spk[:, None] * signal.sosfiltfilt(band, stems[s], axis=0)
    # master tone + width (linear, per stem)
    for s in STEMS:
        y = signal.sosfilt(shelf_sos(9000, 2.5), stems[s], axis=0)
        y = signal.sosfilt(peq_sos(3300, -1.0, 1.2), y, axis=0)
        mid = 0.5 * (y[:, 0] + y[:, 1])
        side = 0.5 * (y[:, 0] - y[:, 1])
        slo = signal.sosfiltfilt(signal.butter(2, 140, 'low', fs=SR, output='sos'), side)
        side = (side - slo) * 1.15
        stems[s] = np.stack([mid + side, mid - side], 1)
    # section dynamics (dB): intro a little lower, holds forward, drop/final peak
    dyn = [(0, -1.0), (T_OPEN - 0.05, -1.0), (T_OPEN, 0.5), (T_HOOK, -0.5), (T_SLAM - 0.05, -0.5), (T_SLAM, 1.5), (T_CIN0 + 0.4, 1.5),
           (T_LAND1 - 0.05, 1.5), (T_LAND1, 0.0), (T_TUR0 - 0.05, 0.0), (T_TUR0, 2.0), (T_TUR1 - 0.05, 2.0), (T_LAND2, -0.5),
           (T_IND0 - 0.05, -0.5), (T_IND0, 2.0), (T_IND1 - 0.05, 2.0), (T_LAND3, -0.5), (T_VORTEX - 0.1, -0.5), (T_VORTEX, 0.8),
           (T_GOAL - 0.3, 0.8), (T_GOAL, 1.2), (T_WAIT, -1.0), (T_WAIT + 1.2, -0.5), (T_FUN - 0.05, 0.0), (T_FUN, 0.5), (T_NO1 - 0.1, 0.5), (T_NO1, 1.0),
           (T_RELIEF - 0.05, 0.0), (T_RELIEF, -1.5), (T_PICK + 0.4, -1.5), (T_PLAY, 0.0), (T_LOGO - 0.01, 0.5), (T_LOGO, 2.0), (DUR, 2.0)]
    dc = 10 ** (env_pts(dyn) / 20)
    fade = np.ones(N)
    a, e = int(T_FADE0 * SR), N
    fade[a:e] = np.cos(np.linspace(0, np.pi / 2, e - a)) ** 1.5
    for s in STEMS:
        stems[s] *= (dc * fade)[:, None]
    mix = sum(stems[s] for s in STEMS)
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    g0 = 10 ** ((-16.0 - meter.integrated_loudness(mix)) / 20)
    mix *= g0
    for s in STEMS:
        stems[s] *= g0
    # glue compressor (2:1, soft knee, 15/180 ms, 10 ms RMS on a HP'd sidechain)
    sc = signal.sosfilt(hp_sos(120), mix.mean(1))
    blk = 48
    nb = N // blk
    pw = np.convolve((sc[:nb * blk] ** 2).reshape(nb, blk).mean(1), np.ones(10) / 10, mode='same')
    lv = 10 * np.log10(pw + 1e-12)
    thr, ratio, knee = -23.0, 2.5, 6.0
    over = lv - thr
    gr = np.where(over <= -knee / 2, 0.0, np.where(over >= knee / 2, (1 - 1 / ratio) * over,
                                                   (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee)))
    at, rl = np.exp(-blk / (0.015 * SR)), np.exp(-blk / (0.18 * SR))
    sm = np.empty(nb)
    pv = 0.0
    for i in range(nb):
        v = gr[i]
        pv = at * pv + (1 - at) * v if v > pv else rl * pv + (1 - rl) * v
        sm[i] = pv
    gcomp = 10 ** (-np.interp(np.arange(N), np.arange(nb) * blk + blk / 2, sm) / 20)
    mix *= gcomp[:, None]
    g1 = 10 ** ((-14.0 - meter.integrated_loudness(mix)) / 20)
    mix *= g1
    # soft peak shaper (gain applied to mix AND stems so they still sum): tames the tutti-hit crest factor
    pk = np.max(np.abs(mix), 1)
    knee0 = 0.45
    shp = np.where(pk <= knee0, pk, knee0 + (1 - knee0) * np.tanh((pk - knee0) / (1 - knee0)))
    gsh = shp / np.maximum(pk, 1e-9)
    mix *= gsh[:, None]
    g3 = 10 ** ((-14.0 - meter.integrated_loudness(mix)) / 20)
    mix *= g3
    g1 = g1 * g3
    # lookahead limiter
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    ceil = 10 ** (-1.6 / 20)
    need = np.minimum(1.0, ceil / np.maximum(np.max(np.abs(mix), 1), 1e-9))
    la = int(0.003 * SR)
    need = minimum_filter1d(need, 2 * la + 1)
    rel = np.exp(-1 / (0.06 * SR))
    lim = np.empty(N)
    pv = 1.0
    for i in range(N):
        v = need[i]
        pv = v if v < pv else pv * rel + v * (1 - rel)
        lim[i] = pv
    lim = uniform_filter1d(lim, la, mode='nearest')
    mix *= lim[:, None]
    gt = gcomp * g1 * gsh * lim
    for s in STEMS:
        stems[s] *= gt[:, None]
    tpk = np.max(np.abs(signal.resample_poly(mix, 4, 1, axis=0)))
    g2 = 10 ** (-1.3 / 20) / tpk                       # true-peak ceiling -1.3 dBTP
    mix *= g2
    for s in STEMS:
        stems[s] *= g2
    print('glue comp max %.1f dB | limiter max %.1f dB' % (sm.max(), -20 * np.log10(lim.min())), file=sys.stderr)
    return mix, stems


def onsets(x, t0, t1, hop=0.002):
    """spectral-flux-like onset times inside [t0, t1]: returns list of (t, strength) for the strongest peaks"""
    y = x.mean(1) if x.ndim > 1 else x
    y = signal.sosfilt(hp_sos(60), y)
    h = int(hop * SR)
    seg = y[int(t0 * SR):int(t1 * SR)]
    n = len(seg) // h
    e = np.sqrt((seg[:n * h] ** 2).reshape(n, h).mean(1)) + 1e-9
    de = np.maximum(0, np.diff(20 * np.log10(e)))
    return de, hop


def cue_check(x, cues):
    """for every cue time: strongest energy rise within +-60 ms -> offset in ms (positive = music late)."""
    rows = []
    for name, tc in cues:
        de, hop = onsets(x, tc - 0.08, tc + 0.08)
        if len(de) == 0:
            continue
        k = int(np.argmax(de))
        off = (k * hop - 0.08) * 1000
        rows.append((name, tc, off, float(de[k])))
    return rows


def report(mix, stems, lvl, path):
    import pyloudnorm as pyln
    x, _ = sf.read(path)
    info = sf.info(path)
    print('\n== %s %d Hz %d ch %s %.4f s' % (os.path.basename(path), info.samplerate, info.channels, info.subtype, info.frames / SR),
          file=sys.stderr)
    tp = 20 * np.log10(np.max(np.abs(signal.resample_poly(x, 4, 1, axis=0))))
    print('peak %.2f dBFS  true-peak %.2f dBTP  %.1f LUFS' % (20 * np.log10(np.max(np.abs(x))), tp,
                                                              pyln.Meter(SR).integrated_loudness(x)), file=sys.stderr)
    print('clip count (>=0.999): %d' % int(np.sum(np.abs(x) >= 0.999)), file=sys.stderr)
    bands = [(20, 35), (35, 60), (60, 120), (120, 250), (250, 500), (500, 1000), (1000, 2000), (2000, 4000),
             (4000, 8000), (8000, 16000)]
    secs = [('intro', 0, 3.4), ('A', 3.4, 8.3), ('cin', T_CIN0, T_CIN1), ('s1', 10.3, 11.3), ('tur', T_TUR0, T_TUR1), ('ind', T_IND0, T_IND1),
            ('live', 14.6, 17.3), ('chorus', 17.35, 20.9), ('wait', 22.3, 24.8), ('no', 25.9, 28.2), ('finale', 28.6, 31.1),
            ('tail', 31.2, 34.1)]
    print('section  rms dBFS | band dB rel section total: ' + ' '.join('%d-%d' % bb for bb in bands), file=sys.stderr)
    for nm, t0, t1 in secs:
        seg = x[int(t0 * SR):int(t1 * SR)]
        f, P = signal.welch(seg.mean(1), SR, nperseg=4096)
        tot = P.sum()
        print('  %-7s %6.1f | ' % (nm, 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)) +
              ' '.join('%5.1f' % (10 * np.log10(P[(f >= lo) & (f < hi)].sum() / tot + 1e-12)) for lo, hi in bands) +
              '  corr %.2f' % np.corrcoef(seg[:, 0], seg[:, 1])[0, 1], file=sys.stderr)
    c0, c1 = int(17.4 * SR), int(20.9 * SR)
    ref = np.sqrt(np.mean(mix[c0:c1] ** 2))
    print('stems in chorus (dB rel mix): ' + ', '.join('%s %.1f' % (s, 20 * np.log10(np.sqrt(np.mean(stems[s][c0:c1] ** 2)) / ref + 1e-12))
                                                      for s in STEMS), file=sys.stderr)
    if lvl:
        for wn in ('intro', 'A', 'holds', 'live', 'end'):
            print('parts %s: ' % wn + ', '.join('%s %.0f' % (k, 10 * np.log10(v.get(wn, 0) + 1e-14)) for k, v in lvl.items()), file=sys.stderr)
    # speech-band (250-3000 Hz) energy under the VO vs elsewhere
    band = signal.sosfiltfilt(signal.butter(2, [250, 3000], 'band', fs=SR, output='sos'), x.mean(1))
    spk = np.zeros(N)
    for a, b in LINES:
        spk[int(a * SR):int(b * SR)] = 1
    print('mid-band (250-3k) level: under VO %.1f dBFS rms, outside VO %.1f dBFS rms' % (
        20 * np.log10(np.sqrt(np.mean(band[spk > 0] ** 2))), 20 * np.log10(np.sqrt(np.mean(band[spk == 0] ** 2)))), file=sys.stderr)
    cues = [('bolt', T_BOLT), ('open', T_OPEN), ('netflix', T_NFX), ('disney', T_DIS), ('charlton', T_SLAM), ('cin-land', T_LAND1),
            ('tur-hit', T_TUR0), ('tur-land', T_LAND2), ('ind-hit', T_IND0), ('ind-land', T_LAND3), ('vortex', T_VORTEX),
            ('nagish', T_NAGISH), ('goal', T_GOAL), ('fun', T_FUN), ('no1', T_NO1), ('no2', T_NO2), ('xout', T_XOUT), ('tap', T_TAP),
            ('burst', T_BURST), ('playback', T_PLAY), ('LOGO', T_LOGO)]
    print('cue alignment: nearest programmed impact onset (timp/bd/taiko/trailer/crash/cymbal/low-brass stab/kick) to each cue:', file=sys.stderr)
    hits = sorted(set(round(n[0], 4) for k in ('timp', 'bd', 'taiko', 'trailer', 'crash', 'ocym', 'tb_st', 'kick', 'snare', 'tutti') if k in PARTS
                      for n in PARTS[k].notes))
    hits = np.array(hits)
    for nm, tc in cues:
        j = int(np.argmin(np.abs(hits - tc)))
        print('   %-9s cue T=%.3f   nearest impact %.3f  offset %+5.1f ms' % (nm, tc, hits[j], (hits[j] - tc) * 1000), file=sys.stderr)
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(2, 1, figsize=(20, 8), gridspec_kw=dict(height_ratios=[3, 1]))
    ff, tt, S = signal.spectrogram(x.mean(1), SR, nperseg=4096, noverlap=3072)
    ax[0].pcolormesh(tt, ff, 10 * np.log10(S + 1e-14), shading='auto', vmin=-130, vmax=-40, cmap='magma')
    ax[0].set_yscale('symlog', linthresh=200)
    ax[0].set_ylim(20, 20000)
    for _, tv in cues:
        ax[0].axvline(tv, color='c', lw=0.6, alpha=0.7)
    ax[0].set_title('ConnectTV score - spectrogram (cyan = cue times)')
    h = int(0.02 * SR)
    e = np.sqrt(np.mean(x[:len(x) // h * h].mean(1).reshape(-1, h) ** 2, 1))
    ax[1].plot(np.arange(len(e)) * 0.02, 20 * np.log10(e + 1e-9))
    for a_, b_ in LINES:
        ax[1].axvspan(a_, b_, color='orange', alpha=0.15)
    for a_, b_ in HOLD_T.values():
        ax[1].axvspan(a_, b_, color='green', alpha=0.15)
    ax[1].set_ylim(-80, 0)
    for a_ in ax:
        a_.set_xlim(0, DUR)
    ax[1].set_ylabel('RMS dBFS; orange=VO green=holds')
    plt.tight_layout()
    plt.savefig(os.path.join(HERE, 'score_ctv_spectrogram.png'), dpi=85)


def main():
    stems, lvl = render_all()
    mix, stems = mixdown(stems)
    out = os.path.join(HERE, 'score_ctv.wav')
    os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
    sf.write(out, mix, SR, subtype='PCM_24')
    for s in STEMS:
        sf.write(os.path.join(HERE, 'stems', f'{s}.wav'), stems[s], SR, subtype='PCM_24')
    nod = mix - stems['days']
    sf.write(os.path.join(HERE, 'score_ctv_nodays.wav'), nod, SR, subtype='PCM_24')
    report(mix, stems, lvl, out)


if __name__ == '__main__':
    main()
