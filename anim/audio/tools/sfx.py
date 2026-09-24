#!/usr/bin/env python3
"""
PACKET FROM HOME -- procedural SFX library generator.

Everything is synthesised from scratch (numpy/scipy), seeded per sound name, so the
library is fully reproducible:

    python3 audio/tools/sfx.py            # build every sound
    python3 audio/tools/sfx.py boing chomp # build only some

Writes 48 kHz 24-bit WAVs to audio/sfx/ and regenerates audio/sfx/INDEX.md.
Levels: one-shots are peak-normalised to -1 dBFS; beds/ambiences are RMS-normalised
(see INDEX.md) -- the cue sheet's gain_db does the actual mixing.
"""
import os
import sys
import zlib
import json
import numpy as np
import soundfile as sf
from scipy import signal
from scipy.signal import butter, sosfilt, lfilter, fftconvolve, stft, istft

SR = 48000
BASE_SEED = 5401
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', 'sfx'))

# ----------------------------------------------------------------------------------------
# basic utilities
# ----------------------------------------------------------------------------------------

def N(d):
    return int(round(d * SR))


def tax(n):
    return np.arange(n) / SR


def rng_for(name):
    return np.random.default_rng((zlib.crc32(name.encode()) ^ BASE_SEED) & 0xFFFFFFFF)


def fit(x, n):
    """pad / trim last axis to n samples"""
    if x.shape[-1] >= n:
        return x[..., :n]
    pad = [(0, 0)] * (x.ndim - 1) + [(0, n - x.shape[-1])]
    return np.pad(x, pad)


def db(x):
    return 10 ** (x / 20.0)


def white(n, r):
    return r.standard_normal(n)


def colored(n, r, slope=-3.0):
    """noise with spectral slope in dB/octave (-3 pink, -6 brown, 0 white)"""
    X = np.fft.rfft(r.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = f[1]
    X *= (f / 1000.0) ** (slope / 6.0206)
    y = np.fft.irfft(X, n)
    return y / (np.std(y) + 1e-12)


def pink(n, r):
    return colored(n, r, -3.0)


def brown(n, r):
    return colored(n, r, -6.0)


def _sos(kind, f, order):
    if kind == 'bp':
        lo, hi = f
        hi = min(hi, SR / 2 * 0.95)
        return butter(order, [lo, hi], 'bandpass', fs=SR, output='sos')
    f = min(f, SR / 2 * 0.95)
    return butter(order, f, kind, fs=SR, output='sos')


def lp(x, f, order=2):
    return sosfilt(_sos('lowpass', f, order), x, axis=-1)


def hp(x, f, order=2):
    return sosfilt(_sos('highpass', f, order), x, axis=-1)


def bp(x, lo, hi, order=2):
    return sosfilt(_sos('bp', (lo, hi), order), x, axis=-1)


def reson(x, f, q, gain=1.0):
    """RBJ constant-0dB-peak bandpass (resonator)"""
    w0 = 2 * np.pi * min(f, SR * 0.47) / SR
    al = np.sin(w0) / (2 * q)
    b = np.array([al, 0, -al])
    a = np.array([1 + al, -2 * np.cos(w0), 1 - al])
    return gain * lfilter(b / a[0], a / a[0], x, axis=-1)


def peq(x, f, q, g_db):
    A = 10 ** (g_db / 40)
    w0 = 2 * np.pi * f / SR
    al = np.sin(w0) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w0), 1 - al * A])
    a = np.array([1 + al / A, -2 * np.cos(w0), 1 - al / A])
    return lfilter(b / a[0], a / a[0], x, axis=-1)


def shelf_lo(x, f, g_db):
    # simple: add/subtract lowpassed component
    return x + (db(g_db) - 1) * lp(x, f, 2)


def env(n, pts, curve=None):
    """breakpoint envelope. pts = [(time_s, value), ...]"""
    ts = np.array([p[0] for p in pts]) * SR
    vs = np.array([p[1] for p in pts], dtype=float)
    return np.interp(np.arange(n), ts, vs)


def smooth(x, sec):
    k = max(1, int(sec * SR))
    if k < 2:
        return x
    w = np.hanning(k)
    w /= w.sum()
    return fftconvolve(x, w, mode='same')


def slow_noise(n, r, rate_hz, lo=0.0, hi=1.0):
    """smooth random curve (cubic-ish interpolated), values in [lo,hi]"""
    npts = max(4, int(n / SR * rate_hz) + 4)
    v = r.uniform(0, 1, npts)
    xs = np.linspace(0, n, npts)
    y = np.interp(np.arange(n), xs, v)
    y = smooth(y, 1.0 / rate_hz * 0.8)
    y = (y - y.min()) / (y.max() - y.min() + 1e-9)
    return lo + (hi - lo) * y


def expdec(n, tau, delay=0):
    t = tax(n)
    e = np.exp(-np.maximum(t - delay, 0) / tau)
    e[t < delay] = 0
    return e


def attack(n, a=0.002):
    t = tax(n)
    return np.clip(t / max(a, 1e-6), 0, 1)


def fade(x, fin=0.0, fout=0.0):
    x = x.copy()
    n = x.shape[-1]
    if fin > 0:
        k = min(n, N(fin))
        x[..., :k] *= np.sin(np.linspace(0, np.pi / 2, k)) ** 2
    if fout > 0:
        k = min(n, N(fout))
        x[..., n - k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    return x


def phase_of(freq, n=None, ph0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,)) if n else np.asarray(freq, float)
    return ph0 + 2 * np.pi * np.cumsum(f) / SR


def sine(freq, n=None, ph0=0.0):
    return np.sin(phase_of(freq, n, ph0))


def _polyblep(t, dt):
    y = np.zeros_like(t)
    m = t < dt
    tt = t[m] / dt[m]
    y[m] = tt + tt - tt * tt - 1
    m2 = t > 1 - dt
    tt = (t[m2] - 1) / dt[m2]
    y[m2] = tt * tt + tt + tt + 1
    return y


def saw(freq, n=None, ph0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,)) if n else np.asarray(freq, float)
    dt = np.clip(f / SR, 1e-6, 0.5)
    ph = (ph0 + np.cumsum(dt)) % 1.0
    return 2 * ph - 1 - _polyblep(ph, dt)


def square(freq, n=None, duty=0.5):
    f = np.broadcast_to(np.asarray(freq, float), (n,)) if n else np.asarray(freq, float)
    dt = np.clip(f / SR, 1e-6, 0.5)
    ph = np.cumsum(dt) % 1.0
    y = np.where(ph < duty, 1.0, -1.0)
    y += _polyblep(ph, dt)
    y -= _polyblep((ph - duty) % 1.0, dt)
    return y


def sat(x, drive=2.0):
    return np.tanh(drive * x) / np.tanh(drive)


def norm_peak(x, dbfs=-1.0):
    p = np.max(np.abs(x)) + 1e-12
    return x * db(dbfs) / p


def norm_rms(x, dbfs=-24.0):
    r = np.sqrt(np.mean(x ** 2)) + 1e-12
    return x * db(dbfs) / r


def mono_to_st(x):
    return np.vstack([x, x])


def pan(x, p):
    """equal-power pan of mono -> stereo (2,n)"""
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)])


def pan_dyn(x, p_curve):
    a = (np.clip(p_curve, -1, 1) + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)])


def haas(x, ms=0.6, side=1):
    d = N(ms / 1000)
    y = np.concatenate([np.zeros(d), x])[:len(x)]
    return np.vstack([x, y]) if side > 0 else np.vstack([y, x])


def st(x):
    return x if x.ndim == 2 else mono_to_st(x)


def add_at(dst, src, t, gain=1.0):
    """mix src (mono or stereo) into dst (same dims) at time t (s)"""
    i = N(t)
    if i >= dst.shape[-1]:
        return dst
    if src.ndim == 1 and dst.ndim == 2:
        src = mono_to_st(src)
    L = min(src.shape[-1], dst.shape[-1] - i)
    if i < 0:
        src = src[..., -i:]
        L = min(src.shape[-1], dst.shape[-1])
        i = 0
    dst[..., i:i + L] += gain * src[..., :L]
    return dst


def stft_shape(x, fn, nper=2048):
    """time-varying spectral filter. fn(tt, ff) -> gain matrix (freq x time)."""
    if x.ndim == 2:
        return np.vstack([stft_shape(c, fn, nper) for c in x])
    n = len(x)
    f, t, Z = stft(x, SR, nperseg=nper, noverlap=nper * 3 // 4, boundary='even')
    G = fn(t[None, :], f[:, None])
    _, y = istft(Z * G, SR, nperseg=nper, noverlap=nper * 3 // 4, boundary=True)
    return fit(y, n)


def bandsweep(fc_of_t, bw_oct=1.0, floor=0.0):
    def fn(tt, ff):
        fc = fc_of_t(tt)
        d = np.log2(np.maximum(ff, 1) / fc)
        return floor + (1 - floor) * np.exp(-0.5 * (d / bw_oct) ** 2)
    return fn


def lpsweep(fc_of_t, slope=12.0):
    def fn(tt, ff):
        fc = fc_of_t(tt)
        d = np.log2(np.maximum(ff, 1) / fc)
        return np.where(d > 0, db(-slope * d), 1.0)
    return fn


def resample_curve(src, pos):
    """read src at fractional positions (samples) -> array"""
    return np.interp(pos, np.arange(len(src)), src, left=0, right=0)


def bitcrush(x, bits=6, hold=4):
    q = 2 ** (bits - 1)
    y = np.round(x * q) / q
    if hold > 1:
        idx = (np.arange(len(y)) // hold) * hold
        y = y[idx]
    return y


# ----------------------------------------------------------------------------------------
# reverb: home-made impulse responses + convolution
# ----------------------------------------------------------------------------------------
_IR_CACHE = {}


def make_ir(rt60=1.2, predelay=0.01, hf=0.45, lf=1.15, er=10, er_span=0.05, bright=9000,
            dur=None, seed=1, diffuse_attack=0.01):
    key = (rt60, predelay, hf, lf, er, er_span, bright, dur, seed, diffuse_attack)
    if key in _IR_CACHE:
        return _IR_CACHE[key]
    r = np.random.default_rng(seed)
    dur = dur or min(rt60 * 1.25, 7.0)
    n = N(dur)
    t = tax(n)
    chans = []
    for ch in range(2):
        nz = r.standard_normal(n)
        lo = lp(nz, 350, 2)
        hi = hp(nz, 3500, 2)
        mid = nz - lo - hi
        e = lambda rt: np.exp(-6.91 * t / max(rt, 1e-3))
        y = lo * e(rt60 * lf) + mid * e(rt60) + hi * e(rt60 * hf)
        y *= 1 - np.exp(-t / diffuse_attack)
        y = lp(y, bright, 2)
        y *= 0.35
        for _ in range(er):
            d = r.uniform(0.003, er_span)
            i = N(d)
            if i < n:
                y[i] += r.uniform(0.25, 0.9) * r.choice([-1, 1]) * np.exp(-d / (rt60 * 0.3))
        y = np.concatenate([np.zeros(N(predelay)), y])
        chans.append(y)
    ir = np.vstack(chans)
    ir /= np.sqrt(np.sum(ir ** 2) / 2) + 1e-12
    _IR_CACHE[key] = ir
    return ir


def reverb(x, ir, wet=0.3, dry=1.0, tail=True):
    """x mono or stereo; returns stereo, length extended by the IR when tail=True"""
    xs = st(x)
    n = xs.shape[1]
    out_n = n + ir.shape[1] if tail else n
    w = np.vstack([fftconvolve(xs[0], ir[0]), fftconvolve(xs[1], ir[1])])
    w = fit(w, out_n)
    return fit(dry * xs, out_n) + wet * w


# room presets
def IR_stadium():   # open-air bowl: long-ish, sparse slap echoes
    return make_ir(rt60=2.2, predelay=0.03, hf=0.35, er=18, er_span=0.35, bright=7000, seed=11)


def IR_hall():
    return make_ir(rt60=2.8, predelay=0.02, hf=0.5, er=12, er_span=0.08, bright=10000, seed=12)


def IR_room():      # cosy living room
    return make_ir(rt60=0.45, predelay=0.004, hf=0.5, er=8, er_span=0.02, bright=8000, seed=13)


def IR_tunnel():    # data tunnel: metallic, long, bright
    return make_ir(rt60=1.8, predelay=0.012, hf=0.8, lf=0.9, er=14, er_span=0.06, bright=13000, seed=14)


def IR_water():     # underwater: dark, long, smeared
    return make_ir(rt60=3.5, predelay=0.02, hf=0.25, lf=1.3, er=6, er_span=0.1, bright=2500,
                   seed=15, diffuse_attack=0.05)


def IR_street():    # snowy street: snow absorbs, but buildings slap
    return make_ir(rt60=0.9, predelay=0.02, hf=0.3, er=10, er_span=0.12, bright=6000, seed=16)


def IR_huge():      # cinematic big space
    return make_ir(rt60=4.5, predelay=0.03, hf=0.55, er=10, er_span=0.08, bright=12000, seed=17)


# ----------------------------------------------------------------------------------------
# voice / crowd synthesis
# ----------------------------------------------------------------------------------------
VOWELS = {
    'a': [(760, 1.0, 110), (1150, 0.55, 120), (2500, 0.25, 180), (3500, 0.12, 250)],
    'o': [(520, 1.0, 90), (860, 0.5, 100), (2450, 0.14, 180), (3400, 0.07, 250)],
    'u': [(330, 1.0, 70), (820, 0.25, 90), (2300, 0.08, 180), (3300, 0.04, 250)],
    'e': [(500, 1.0, 80), (1800, 0.5, 120), (2550, 0.3, 180), (3500, 0.12, 250)],
    'i': [(290, 1.0, 70), (2250, 0.45, 130), (3000, 0.35, 200), (3700, 0.15, 250)],
    'ae': [(680, 1.0, 110), (1700, 0.55, 130), (2450, 0.3, 180), (3500, 0.12, 250)],
}


def formant(src, vowel, shift=1.0):
    y = np.zeros_like(src)
    for f, a, bw in VOWELS[vowel]:
        fc = f * shift
        y += reson(src, fc, fc / bw, a)
    return y


def glottal(f0, n, r, breath=0.08, jitter=0.01, shimmer=0.05, tilt=1800):
    f0 = np.asarray(f0, float) * (1 + jitter * slow_noise(n, r, 12, -1, 1))
    src = saw(f0, n)
    src = lp(src, tilt, 1) * 0.8 + 0.2 * src
    src *= 1 + shimmer * slow_noise(n, r, 20, -1, 1)
    nz = hp(white(n, r), 400, 1)
    return (1 - breath) * src + breath * nz * 0.6


def syllable_plan(dur, r, rate=4.0, fill=0.7, vowels='aeiou'):
    """list of (start, length, vowel) for one talker"""
    out = []
    t = r.uniform(0, 0.4)
    while t < dur:
        L = r.uniform(0.08, 0.28) * 4.0 / rate
        if r.uniform() < fill:
            out.append((t, L, vowels[r.integers(len(vowels))]))
        t += L + r.uniform(0.01, 0.12) * 4.0 / rate
        if r.uniform() < 0.12:
            t += r.uniform(0.2, 0.7)  # phrase break
    return out


def talker(dur, r, f0=140, shift=1.0, rate=4.0, vowels='aeiou', breath=0.1, excite=None, f0_span=0.25):
    n = N(dur)
    plan = syllable_plan(dur, r, rate, vowels=vowels)
    amp = np.zeros(n)
    w = {v: np.zeros(n) for v in set(vowels)}
    pitch = np.full(n, float(f0))
    for (s, L, v) in plan:
        i0, i1 = N(s), min(n, N(s + L))
        if i1 <= i0 + 8:
            continue
        seg = np.hanning(i1 - i0) ** 0.6
        amp[i0:i1] = np.maximum(amp[i0:i1], seg * r.uniform(0.5, 1.0))
        w[v][i0:i1] = 1.0
        pitch[i0:i1] = f0 * (1 + f0_span * r.uniform(-0.6, 1)) * np.linspace(1.04, 0.96, i1 - i0)
    pitch = smooth(pitch, 0.03)
    if excite is not None:
        pitch *= 1 + 0.35 * excite
        amp *= 0.35 + 0.65 * excite
    src = glottal(pitch, n, r, breath=breath)
    y = np.zeros(n)
    for v, wv in w.items():
        if wv.any():
            y += formant(src, v, shift) * smooth(wv, 0.02)
    return y * amp


def roar_layer(n, r, level_env, vowels=('a', 'o'), shift=1.0, bright=1.0):
    """dense noise 'walla' -- many voices blurred into formant-coloured noise"""
    base = pink(n, r)
    y = np.zeros(n)
    for v in vowels:
        c = formant(base, v, shift * r.uniform(0.95, 1.05))
        y += c * slow_noise(n, r, 3.0, 0.5, 1.0)
    y += bright * 0.25 * bp(white(n, r), 2000, 6000) * slow_noise(n, r, 6, 0.3, 1)
    return y * level_env


def crowd_voices(dur, r, count, f0_range=(95, 240), rate=4.0, vowels='aeiou', excite=None,
                 spread=1.0, dist_lp=(2500, 7000), breath=0.12, f0_span=0.25):
    n = N(dur)
    out = np.zeros((2, n))
    for k in range(count):
        female = r.uniform() < 0.35
        f0 = r.uniform(*f0_range) * (1.7 if female else 1.0)
        shift = 1.15 if female else 1.0
        rr = np.random.default_rng(r.integers(1 << 31))
        v = talker(dur, rr, f0=f0, shift=shift, rate=rate * r.uniform(0.8, 1.25), vowels=vowels,
                   excite=excite, breath=breath, f0_span=f0_span)
        v = lp(v, r.uniform(*dist_lp), 2)
        g = r.uniform(0.25, 1.0)
        out += pan(v * g, r.uniform(-spread, spread))
    return out / np.sqrt(count)


# ----------------------------------------------------------------------------------------
# reusable building blocks
# ----------------------------------------------------------------------------------------

def whoosh(dur, r, peak=0.5, f_lo=250, f_hi=4000, bw=0.9, pan_from=-0.6, pan_to=0.6, sharp=3.0,
           tone=0.0):
    n = N(dur)
    t = tax(n)
    nz = pink(n, r) * 0.6 + white(n, r) * 0.4
    # frequency rides with amplitude (doppler-ish): rises to peak then falls
    def fc(tt):
        u = np.clip(tt / peak, 0, None)
        rise = np.clip(tt / peak, 0, 1)
        fall = np.clip((tt - peak) / max(dur - peak, 1e-3), 0, 1)
        return np.where(tt < peak, f_lo * (f_hi / f_lo) ** rise ** 1.5,
                        f_hi * (f_lo * 1.4 / f_hi) ** fall ** 0.6)
    y = stft_shape(nz, bandsweep(fc, bw))
    a = np.where(t < peak, (t / peak) ** sharp, np.exp(-(t - peak) / ((dur - peak) / 3.5)))
    y *= a
    if tone > 0:
        fz = np.where(t < peak, 300 + 600 * (t / peak), 900 * np.exp(-(t - peak) * 2))
        y += tone * sine(fz) * a * 0.3
    pc = np.interp(t, [0, peak, dur], [pan_from, (pan_from + pan_to) / 2, pan_to])
    return pan_dyn(y, pc)


def bell(f, dur, r, partials=((1, 1, 1.0), (2.76, 0.5, 0.55), (5.4, 0.28, 0.35), (8.93, 0.15, 0.2)),
         decay=1.0, detune=0.002):
    n = N(dur)
    y = np.zeros(n)
    for ratio, amp, dk in partials:
        fr = f * ratio * (1 + r.uniform(-detune, detune))
        y += amp * np.sin(2 * np.pi * fr * tax(n) + r.uniform(0, 6.28)) * expdec(n, decay * dk)
        y += amp * 0.3 * np.sin(2 * np.pi * fr * 1.003 * tax(n)) * expdec(n, decay * dk)
    return y * attack(n, 0.001)


def click(n, r, f=3000, q=6, tau=0.004):
    x = white(n, r) * expdec(n, tau * 0.3)
    return reson(x, f, q) * 3 + x * 0.1


def thump(dur, f0=90, f1=35, tau=0.25, click_amt=0.3, r=None):
    n = N(dur)
    t = tax(n)
    f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    y = np.sin(phase_of(f)) * expdec(n, tau) * attack(n, 0.0015)
    if click_amt and r is not None:
        y += click_amt * lp(white(n, r), 3000) * expdec(n, 0.006)
    return y


def cartoon_horn(f, dur, r, bend=0.06, nasal=1.0):
    """bulb / clown horn honk"""
    n = N(dur)
    t = tax(n)
    fc = f * (1 - bend + bend * np.clip(t / 0.03, 0, 1)) * (1 - 0.03 * t / dur)
    fc *= 1 + 0.01 * np.sin(2 * np.pi * 28 * t)
    src = 0.6 * saw(fc) + 0.4 * square(fc * 1.003, duty=0.35)
    y = reson(src, 1100, 3, 1.0) + reson(src, 2200, 4, 0.6 * nasal) + reson(src, 600, 2, 0.5)
    y = sat(y * 1.5, 1.8)
    a = env(n, [(0, 0), (0.012, 1), (dur * 0.6, 0.85), (dur, 0)])
    # squeeze onset noise
    y += 0.25 * bp(white(n, r), 1500, 5000) * expdec(n, 0.02)
    return y * a


def electric_arc(dur, r, density=40, hum=120):
    n = N(dur)
    y = np.zeros(n)
    # crackle impulses
    k = int(dur * density)
    for _ in range(k):
        i = r.integers(0, n - 400)
        L = r.integers(40, 400)
        burst = white(L, r) * np.exp(-np.arange(L) / (L / 4))
        y[i:i + L] += burst * r.uniform(0.2, 1.0)
    y = hp(y, 1500) * 0.8 + bp(y, 300, 2000) * 0.5
    # buzzing hum modulated noise
    bz = sat(np.sin(2 * np.pi * hum * tax(n)) * 3, 3) * bp(white(n, r), 200, 5000) * 0.4
    y += bz * slow_noise(n, r, 15, 0.2, 1)
    return y


def pops(dur, r, count, f_range=(800, 3000), q=5, dens_curve=None, amp_range=(0.3, 1.0)):
    n = N(dur)
    y = np.zeros((2, n))
    times = r.uniform(0, 1, count)
    if dens_curve == 'decay':
        times = -np.log(1 - times * 0.97) / 3.5
        times = times / times.max() * dur * 0.9
    else:
        times = times * dur * 0.95
    for tm in times:
        L = N(0.03)
        p = white(L, r) * np.exp(-np.arange(L) / N(0.002))
        p = reson(p, r.uniform(*f_range), q) * 4 + p * 0.3
        add_at(y, pan(p * r.uniform(*amp_range), r.uniform(-0.8, 0.8)), tm)
    return y


# ----------------------------------------------------------------------------------------
# the library
# ----------------------------------------------------------------------------------------
REG = {}


def sfx(name, desc, hit=0.0, kind='oneshot', level=None):
    def deco(fn):
        REG[name] = dict(fn=fn, desc=desc, hit=hit, kind=kind, level=level)
        return fn
    return deco


def finish(x, kind, level=None):
    x = np.nan_to_num(x)
    if kind == 'bed':
        x = norm_rms(x, level if level is not None else -24.0)
        p = np.max(np.abs(x))
        if p > db(-1):
            x *= db(-1) / p
    else:
        # safety tail: never end a one-shot on a non-zero sample
        x = fade(x, 0, min(0.3, 0.15 * x.shape[-1] / SR))
        x = norm_peak(x, level if level is not None else -1.0)
    return x


# ---------------------------------------------------------------- stadium / Tel Aviv

def _stadium_bed(dur, r, excite_env=None, count=48):
    n = N(dur)
    ex = excite_env if excite_env is not None else np.full(n, 0.3)
    v = crowd_voices(dur, r, count, rate=4.5, excite=ex, dist_lp=(1800, 4500), breath=0.15)
    roar = np.vstack([roar_layer(n, r, 0.4 + 0.6 * ex), roar_layer(n, r, 0.4 + 0.6 * ex)])
    roar = lp(roar, 3500)
    # distant drums of the ultras (a slow darbuka/bass drum pulse)
    drum = np.zeros(n)
    beat = 60 / 132
    for k in range(int(dur / beat)):
        tt = k * beat + r.normal(0, 0.006)
        a = 1.0 if k % 4 == 0 else 0.6
        add_at(drum, thump(0.3, 140, 60, 0.08, 0.2, r) * a, tt)
    drum = lp(drum, 900)
    y = v * 1.0 + roar * 0.55 + pan(drum, -0.3) * 0.12
    y = reverb(y, IR_stadium(), wet=0.45, tail=False)
    return hp(y, 70)


@sfx('stadium_crowd_bed', 'Packed floodlit stadium heard from the wide Tel Aviv shot: dense murmur/walla, '
     'distant ultras drum, open-air slap echoes. Energy lifts over the 7 s. Stereo bed.', 0.0, 'bed', -22)
def _(r):
    dur = 7.2
    n = N(dur)
    ex = env(n, [(0, 0.35), (3, 0.5), (6, 0.65), (7.2, 0.6)])
    y = _stadium_bed(dur, r, ex)
    return fade(y, 0.3, 0.9)


@sfx('crowd_swell_ooh', 'Crowd "ooOOH" rising-excitement swell: thousands of voices gliding u->o->a and up in pitch, '
     'roar underneath. Peak at 2.2 s, then settles.', 2.2, 'oneshot')
def _(r):
    dur = 4.2
    n = N(dur)
    t = tax(n)
    ex = env(n, [(0, 0), (1.2, 0.35), (2.2, 1.0), (3.0, 0.6), (4.2, 0.2)])
    out = np.zeros((2, n))
    for k in range(44):
        rr = np.random.default_rng(r.integers(1 << 31))
        female = rr.uniform() < 0.35
        f0 = rr.uniform(110, 190) * (1.7 if female else 1)
        sh = 1.15 if female else 1.0
        onset = rr.uniform(0.0, 0.8)
        pitch = f0 * (1 + 0.45 * env(n, [(0, 0), (onset, 0), (2.2 + rr.normal(0, .08), 1), (4.2, 0.7)]))
        src = glottal(pitch, n, rr, breath=0.2, jitter=0.02)
        wu = env(n, [(0, 1), (1.3, 1), (2.0, 0), (4.2, 0)])
        wo = env(n, [(0, 0), (1.3, 0), (2.0, 1), (2.5, 1), (3.2, 0.3), (4.2, 0.3)])
        wa = 1 - wu - wo
        y = formant(src, 'u', sh) * wu + formant(src, 'o', sh) * wo + formant(src, 'a', sh) * np.clip(wa, 0, 1)
        a = env(n, [(0, 0), (onset, 0), (onset + 0.4, 0.3), (2.2 + rr.normal(0, 0.05), 1), (3.2, 0.5), (4.2, 0)])
        out += pan(lp(y * a, rr.uniform(2500, 6000)), rr.uniform(-1, 1)) * rr.uniform(0.4, 1)
    out /= np.sqrt(44)
    roar = np.vstack([roar_layer(n, r, ex, ('u', 'o')), roar_layer(n, r, ex, ('o', 'a'))]) * 0.5
    y = out + roar
    y = reverb(y, IR_stadium(), wet=0.5, tail=False)
    return fade(hp(y, 80), 0.05, 0.6)


def _air_horn(dur, r, f=410):
    n = N(dur)
    t = tax(n)
    fc = f * (0.94 + 0.06 * np.clip(t / 0.06, 0, 1)) * (1 + 0.004 * np.sin(2 * np.pi * 5 * t))
    src = saw(fc) + 0.7 * saw(fc * 1.259) + 0.5 * saw(fc * 1.498 * 1.002)  # major triad horn
    y = reson(src, 900, 1.5) + reson(src, 1800, 3, 0.7) + reson(src, 3200, 4, 0.3)
    y = sat(y * 2, 2.5)
    a = env(n, [(0, 0), (0.02, 1), (dur - 0.08, 0.9), (dur, 0)])
    return y * a


def _whistle(dur, r, f=3100, trill=32, slide=False):
    n = N(dur)
    t = tax(n)
    if slide:
        fc = f * env(n, [(0, 0.55), (0.12, 1.0), (dur * 0.7, 1.02), (dur, 0.8)])
        tr = 1 + 0.004 * np.sin(2 * np.pi * 6 * t)
    else:
        tr = 1 + 0.035 * np.sign(np.sin(2 * np.pi * trill * t)) * 0.6 + 0.02 * np.sin(2 * np.pi * trill * t)
        fc = f
    y = np.sin(phase_of(fc * tr, n)) + 0.1 * np.sin(2 * phase_of(fc * tr, n))
    y += 0.15 * bp(white(n, r), f * 0.8, f * 1.3)
    a = env(n, [(0, 0), (0.015, 1), (dur - 0.05, 0.8), (dur, 0)])
    if not slide:
        a *= 0.8 + 0.2 * np.sign(np.sin(2 * np.pi * trill * t))
    return y * a


def _claps(dur, r, times, count=30, spread=0.03):
    n = N(dur)
    y = np.zeros((2, n))
    for tm in times:
        for k in range(count):
            L = N(0.05)
            c = white(L, r)
            e = np.exp(-np.arange(L) / N(0.009))
            # multi-transient hand clap
            e2 = np.zeros(L)
            for j in range(3):
                e2 += np.roll(np.exp(-np.arange(L) / N(0.0015)), N(0.004 * j)) * (1 - 0.25 * j)
            c = c * (e * 0.6 + e2 * 0.6)
            c = reson(c, r.uniform(900, 1900), 1.8) * 2 + hp(c, 2500) * 0.4
            add_at(y, pan(c * r.uniform(0.3, 1.0), r.uniform(-1, 1)), tm + r.normal(0, spread))
    return y / np.sqrt(count)


def _chant(dur, r, start, cycle=2.0, count=34):
    """Mac-ca-BI!  (clap clap clap) repeated"""
    n = N(dur)
    out = np.zeros((2, n))
    syl = [(0.00, 0.16, 'a', 1.0), (0.24, 0.16, 'a', 1.0), (0.48, 0.42, 'i', 1.12)]
    for k in range(count):
        rr = np.random.default_rng(r.integers(1 << 31))
        female = rr.uniform() < 0.3
        f0 = rr.uniform(150, 230) * (1.6 if female else 1)
        sh = 1.15 if female else 1.0
        amp = np.zeros(n)
        wa = np.zeros(n)
        wi = np.zeros(n)
        pitch = np.full(n, f0)
        cons = np.zeros(n)
        c = start
        while c < dur:
            for (so, sl, v, pm) in syl:
                s0 = c + so + rr.normal(0, 0.025)
                i0, i1 = N(s0), min(n, N(s0 + sl + rr.normal(0, 0.02)))
                if i1 - i0 < 10 or i0 < 0:
                    continue
                seg = np.hanning(i1 - i0) ** 0.35
                amp[i0:i1] = seg
                (wa if v == 'a' else wi)[i0:i1] = 1
                pitch[i0:i1] = f0 * pm
                if so > 0.2 and so < 0.3:  # 'cc' = k burst before 2nd syllable
                    kb = N(0.03)
                    if i0 - kb > 0:
                        cons[i0 - kb:i0] = np.hanning(kb)
            c += cycle
        pitch = smooth(pitch, 0.025)
        src = glottal(pitch, n, rr, breath=0.25, jitter=0.02)
        y = formant(src, 'a', sh) * smooth(wa, 0.015) + formant(src, 'i', sh) * smooth(wi, 0.015)
        y = y * amp + bp(white(n, rr), 1800, 4500) * cons * 0.5
        out += pan(lp(y, rr.uniform(3000, 6000)), rr.uniform(-1, 1)) * rr.uniform(0.5, 1)
    out /= np.sqrt(count)
    claps = []
    c = start
    while c < dur:
        claps += [c + 1.0, c + 1.25, c + 1.5]
        c += cycle
    return out, _claps(dur, r, claps, count=28)


@sfx('stadium_goal_eruption', 'HUGE goal eruption: instant roar of the whole stadium (screaming voices + roar walla), '
     'fans\' two-finger whistles, air horns, then from ~3.4 s the rhythmic "Ma-cca-BI! (clap clap clap)" chant. '
     'Hit at 0.05 s. 11 s, fades out over the last 1.5 s.', 0.05, 'oneshot')
def _(r):
    dur = 11.0
    n = N(dur)
    t = tax(n)
    ex = env(n, [(0, 0), (0.05, 0.4), (0.25, 1.0), (1.8, 1.0), (3.5, 0.75), (6, 0.65), (11, 0.55)])
    # screaming voices: sustained 'aaa'/'o', high pitch, all starting within ~0.25s
    out = np.zeros((2, n))
    cnt = 46
    for k in range(cnt):
        rr = np.random.default_rng(r.integers(1 << 31))
        female = rr.uniform() < 0.35
        f0 = rr.uniform(190, 330) * (1.5 if female else 1)
        sh = 1.15 if female else 1.0
        on = 0.03 + abs(rr.normal(0, 0.1))
        L1 = rr.uniform(1.8, 3.4)
        pitch = f0 * env(n, [(0, 0.85), (on, 0.85), (on + 0.15, 1.08), (on + L1, 0.9), (dur, 0.85)])
        pitch *= 1 + 0.02 * np.sin(2 * np.pi * rr.uniform(4, 7) * t)
        src = glottal(pitch, n, rr, breath=0.3, jitter=0.03, tilt=3000)
        v = rr.choice(['a', 'o', 'ae', 'e'])
        y = formant(src, v, sh)
        # after the first scream, individuals keep yelling in bursts
        a = env(n, [(0, 0), (on, 0), (on + 0.04, 1), (on + L1, 0.6), (on + L1 + 0.3, 0.0), (dur, 0)])
        y2 = talker(dur, rr, f0=f0 * 0.9, shift=sh, rate=3.0, vowels='aoe', breath=0.3, f0_span=0.3)
        y2 *= np.clip((t - on - L1 + 0.2) / 0.5, 0, 1) * 0.6
        y = sat(y * a * 1.2, 1.5) + y2
        out += pan(lp(y, rr.uniform(3000, 8000)), rr.uniform(-1, 1)) * rr.uniform(0.4, 1.0)
    out /= np.sqrt(cnt)
    roar = np.vstack([roar_layer(n, r, ex, ('a', 'o', 'ae')), roar_layer(n, r, ex, ('a', 'e', 'o'))])
    y = out * 1.1 + roar * 0.8
    # onset punch: low thump + noise burst (the crowd physically jumping)
    add_at(y, st(thump(0.6, 80, 40, 0.18, 0.4, r)), 0.03, 0.6)
    # whistles
    for k in range(9):
        wt = r.uniform(0.2, 5.5)
        w = _whistle(r.uniform(0.5, 1.2), r, f=r.uniform(2200, 3400), slide=r.uniform() < 0.6,
                     trill=r.uniform(26, 38))
        add_at(y, pan(w, r.uniform(-0.9, 0.9)), wt, r.uniform(0.08, 0.2))
    # air horns
    for (ht, hf, hl, hp_) in [(0.35, 415, 1.2, -0.6), (0.9, 392, 0.8, 0.5), (1.3, 440, 0.5, 0.1),
                               (1.9, 415, 0.9, -0.3), (2.7, 370, 1.4, 0.7), (5.2, 415, 0.6, -0.7),
                               (7.4, 392, 1.0, 0.4)]:
        h = _air_horn(hl, r, hf)
        add_at(y, pan(lp(h, 5000), hp_), ht, 0.28)
    # chant + claps
    ch, cl = _chant(dur, r, 3.4, cycle=2.0)
    chant_env = np.clip((t - 3.2) / 1.5, 0, 1)
    y += ch * chant_env * 1.2 + cl * chant_env * 1.0
    y = reverb(y, IR_stadium(), wet=0.4, tail=False)
    y = hp(y, 45)
    return fade(y, 0.0, 1.5)


@sfx('city_night_telaviv', 'Tel Aviv night ambience: slow Mediterranean waves washing the promenade, distant traffic '
     'hum + a passing car and a far-off moped, crickets in stereo. 7 s bed.', 0.0, 'bed', -26)
def _(r):
    dur = 7.0
    n = N(dur)
    t = tax(n)
    # waves: two crests
    wv = np.zeros((2, n))
    for (c0, pk, L, p) in [(-1.0, 1.4, 5.5, -0.3), (2.8, 4.6, 5.0, 0.35)]:
        e = env(n, [(0, 0), (max(c0, 0), 0), (pk, 1), (pk + 0.4, 0.8), (c0 + L, 0)]) if c0 >= 0 else \
            env(n, [(0, 0.5), (pk, 1), (pk + 0.4, 0.8), (c0 + L, 0)])
        nz = pink(n, r)
        crash = stft_shape(nz, lpsweep(lambda tt: 400 + 3500 * np.interp(tt, [0, pk, pk + 1.5, dur], [0, 1, 0.4, 0.1]), 10))
        wash = hp(bp(white(n, r), 2000, 9000), 1500) * 0.25 * env(n, [(0, 0), (pk, 0), (pk + 0.3, 1), (min(pk + 3, dur), 0)])
        wv += pan(crash * e + wash * e, p) + haas(crash * e * 0.3, 7)
    rumble = lp(brown(n, r), 180) * 0.6
    wv += st(rumble)
    # distant traffic
    tr = lp(brown(n, r), 400) * 0.5 + bp(pink(n, r), 200, 900) * 0.2
    car = bp(pink(n, r), 150, 2500)
    ce = np.exp(-((t - 3.8) / 1.3) ** 2)
    carp = np.clip((t - 3.8) / 2.5, -1, 1) * 0.8
    trf = st(tr) + pan_dyn(car * ce * 0.8, carp)
    # moped (Tel Aviv!) far away: buzzy 2-stroke with gear change
    mf = 95 * env(n, [(0, 0.8), (2.5, 1.2), (2.7, 0.85), (5.5, 1.25), (7, 1.1)])
    mop = bp(saw(mf, n) * (1 + 0.3 * np.sin(2 * np.pi * mf * 0.5 * t)), 300, 2200) * 0.12
    mop *= env(n, [(0, 0.2), (3, 1), (7, 0.3)])
    trf += pan(lp(mop, 1800), 0.6)
    trf = reverb(trf, IR_street(), 0.3, tail=False)
    # crickets
    cr = np.zeros((2, n))
    for k in range(5):
        f = r.uniform(4200, 5600)
        rate = r.uniform(2.2, 3.5)
        p = r.uniform(-0.9, 0.9)
        amp = r.uniform(0.3, 1.0)
        c = np.zeros(n)
        tt = r.uniform(0, 0.4)
        while tt < dur:
            # chirp = 3-4 pulses
            for j in range(r.integers(3, 5)):
                L = N(0.018)
                pulse = np.sin(2 * np.pi * f * np.arange(L) / SR) * np.hanning(L)
                add_at(c, pulse, tt + j * 0.028)
            tt += 1 / rate + r.normal(0, 0.02)
        cr += pan(c * amp, p)
    y = wv * 0.9 + trf * 0.5 + cr * 0.06
    y = hp(y, 30)
    return fade(y, 0.3, 0.8)


# ---------------------------------------------------------------- transitions / whooshes

@sfx('whip_pan', 'Fast camera whip swish: bright air-rip with L->R motion, tiny low body. Peak at 0.32 s.', 0.32)
def _(r):
    y = whoosh(0.9, r, peak=0.32, f_lo=500, f_hi=5000, bw=1.1, pan_from=-0.8, pan_to=0.8, sharp=2.5)
    y += whoosh(0.9, r, peak=0.30, f_lo=120, f_hi=600, bw=0.8, pan_from=-0.3, pan_to=0.3, sharp=3) * 0.5
    y = reverb(y, IR_hall(), 0.12, tail=False)
    return fade(y, 0, 0.1)


@sfx('data_whoosh', 'Digital data whoosh: filtered air sweep with a glassy tonal rise and bit-crushed sparkle. '
     'Peak at 0.7 s; 1.8 s.', 0.7)
def _(r):
    n = N(1.8)
    y = whoosh(1.8, r, peak=0.7, f_lo=300, f_hi=6000, bw=1.0, pan_from=-0.5, pan_to=0.7, sharp=2.2, tone=0.6)
    t = tax(n)
    fz = np.where(t < 0.7, 400 * (2 ** (3 * t / 0.7)), 3200 * np.exp(-(t - 0.7) * 1.5))
    tone = (sine(fz) + 0.3 * sine(fz * 1.5)) * np.where(t < 0.7, (t / 0.7) ** 2, np.exp(-(t - 0.7) * 4))
    sp = bitcrush(tone, 5, 6) - tone
    y += st(tone * 0.15 + hp(sp, 3000) * 0.1)
    y = reverb(y, IR_tunnel(), 0.25, tail=False)
    return fade(y, 0, 0.2)


@sfx('broadcast_launch', 'Packets launch from the IPTV mast: electric zap + a volley of 7 staggered "pew" packet '
     'launches spraying L->R, sub thump, data whoosh tail over the sea. Hit at 0.02 s.', 0.02)
def _(r):
    dur = 2.6
    n = N(dur)
    t = tax(n)
    y = np.zeros((2, n))
    # zap: FM saw downward
    zn = N(0.35)
    tz = tax(zn)
    zf = 3000 * np.exp(-tz / 0.06) + 120
    z = saw(zf * (1 + 0.3 * np.sin(2 * np.pi * 70 * tz))) * expdec(zn, 0.08)
    z = bp(z, 150, 8000)
    add_at(y, st(z * 0.6), 0.0)
    add_at(y, st(electric_arc(0.4, r, 60)) * 0.25 * np.vstack([expdec(N(0.4), 0.1)] * 2), 0.0)
    # pews
    for k in range(7):
        pn = N(0.28)
        tp = tax(pn)
        f0 = r.uniform(1400, 2400)
        pf = f0 * np.exp(-tp / 0.09) + 300
        p = (sine(pf) + 0.35 * square(pf * 0.5, duty=0.3)) * expdec(pn, 0.07) * attack(pn, 0.001)
        p = lp(p, 7000)
        add_at(y, pan(p, -0.4 + k * 0.17), 0.03 + k * 0.075 + r.uniform(0, 0.02), 0.45)
    # sub thump
    add_at(y, st(thump(0.6, 110, 38, 0.2, 0.5, r)) * 0.8, 0.0)
    # whoosh carrying them out over the water
    wh = whoosh(2.3, r, peak=0.55, f_lo=250, f_hi=5000, bw=1.0, pan_from=-0.3, pan_to=0.9, sharp=1.6, tone=0.4)
    add_at(y, wh * 0.9, 0.12)
    y = reverb(y, IR_hall(), 0.28, tail=False)
    return fade(y, 0, 0.3)


# ---------------------------------------------------------------- Toronto apartment

@sfx('snow_wind_window', 'Snowy Toronto wind heard through a frosted window: soft gusts and a low howl, muffled. '
     'Fades out over 2 s as we push inside (6.2 cut). 2.6 s.', 0.0, 'bed', -24)
def _(r):
    return _wind(2.6, r, muffled=True, gust_rate=0.7, fout=1.8, fin=0.12)


def _wind(dur, r, muffled=False, gust_rate=0.5, fin=0.3, fout=0.6, howl=0.4):
    n = N(dur)
    ch = []
    g = slow_noise(n, r, gust_rate * 2, 0.3, 1.0) ** 1.5
    for c in range(2):
        nz = pink(n, r)
        fcurve = slow_noise(n, r, gust_rate * 3, 0, 1)
        fcs = 250 + 900 * g * (0.6 + 0.4 * fcurve)
        # time-varying bandpass by stft -- use curve sampled on stft frames
        def fn(tt, ff, fcs=fcs):
            fc = np.interp(tt, tax(n), fcs)
            d = np.log2(np.maximum(ff, 1) / fc)
            return np.exp(-0.5 * (d / 1.3) ** 2)
        y = stft_shape(nz, fn)
        # howl: narrow resonances wandering
        hw = reson(white(n, r), 1.0, 1.0) * 0
        base = white(n, r)
        hf = 520 + 380 * g
        hw = stft_shape(base, bandsweep(lambda tt, hf=hf: np.interp(tt, tax(n), hf), 0.07))
        y = y * g + howl * hw * g ** 2 * 1.5
        y += 0.15 * hp(white(n, r), 4000) * g ** 2  # snow hiss
        ch.append(y)
    y = np.vstack(ch)
    if muffled:
        y = lp(y, 1400, 2) + 0.05 * y
    y = hp(y, 50)
    return fade(y, fin, fout)


@sfx('room_tone_cozy', 'Cosy apartment room tone: warm air + faint fridge/electric hum, radiator hiss with an '
     'occasional metallic tick, wall clock tick-tock (left), faint muffled wind outside. 23.4 s (S2 v2 6.2-29.2 + '
     'tail), 0.8 s fade-in/out.', 0.0, 'bed', -30)
def _(r):
    return _room(23.4, r)


@sfx('room_tone_tag', 'Same cosy room tone, 19.2 s version for S7 v2 (58.9 -> fades out by 78.1 under the end card).',
     0.0, 'bed', -30)
def _(r):
    return _room(19.2, r)


def _room(dur, r):
    n = N(dur)
    t = tax(n)
    air = lp(pink(n, r), 900) * 0.5
    air = np.vstack([air, lp(pink(n, r), 900) * 0.5])
    hum = (np.sin(2 * np.pi * 60 * t) * 0.3 + np.sin(2 * np.pi * 120 * t) * 0.5 + np.sin(2 * np.pi * 180 * t) * 0.15)
    hum *= 0.04 * (1 + 0.1 * slow_noise(n, r, 0.5, -1, 1))
    hiss = bp(white(n, r), 3500, 9000) * 0.08 * (0.8 + 0.2 * slow_noise(n, r, 0.4))
    rad = pan(hiss, 0.6)
    # radiator ticks / pings
    for tm in np.arange(2.3, dur - 1, 4.7):
        pn = N(0.4)
        p = bell(r.uniform(1800, 2600), 0.4, r, decay=0.12) * 0.25 + click(pn, r, 2500, 8, 0.003) * 0.2
        add_at(rad, pan(p, 0.6), tm + r.uniform(-0.3, 0.3), 0.35)
    # clock
    clk = np.zeros(n)
    for k in range(int(dur)):
        tm = k * 1.0 + 0.37
        L = N(0.12)
        c = white(L, r) * np.exp(-np.arange(L) / N(0.0012))
        f = 3200 if k % 2 == 0 else 2300
        c = reson(c, f, 12) * 3 + reson(c, 900, 5) * 1.5 + reson(c, 5200, 10) * 1.0
        add_at(clk, c, tm)
    clk = reverb(pan(clk, -0.55), IR_room(), 0.35, tail=False)
    wind = _wind(dur, r, muffled=True, gust_rate=0.3, fin=0, fout=0) * 0.25
    wind = lp(wind, 600)
    y = air * 1.0 + st(hum) + rad + clk * 0.2 + wind
    y = hp(y, 35)
    return fade(y, 0.8, 0.8)


def tv_speaker(x, r, drive=1.5):
    """small TV speaker: band-limit, boxy resonance, slight breakup, little room reflection. mono out"""
    m = x.mean(axis=0) if x.ndim == 2 else x
    m = hp(m, 280, 4)
    m = lp(m, 5200, 4)
    m = peq(m, 1100, 1.2, 5)
    m = peq(m, 450, 2.0, 3)
    m = sat(m / (np.max(np.abs(m)) + 1e-9) * drive, drive) * 0.8
    return m


@sfx('tv_crowd_live', 'Live match crowd from the living-room TV (small band-limited speaker, mono): excited '
     'murmur building to a rising "ooOOH" as the striker breaks away; ends HARD at 9.1 s (= the 15.3 freeze). '
     'Cue at 6.2.', 0.0, 'bed', -22)
def _(r):
    dur = 9.1
    n = N(dur)
    t = tax(n)
    ex = env(n, [(0, 0.35), (6.3, 0.5), (7.2, 0.7), (9.1, 1.0)])
    base = _stadium_bed(dur, r, ex, count=30)
    # rising ooh near the end
    sw = np.zeros((2, n))
    rr = np.random.default_rng(99)
    for k in range(24):
        f0 = rr.uniform(110, 190)
        pitch = f0 * (1 + 0.5 * np.clip((t - 7.0) / 2.1, 0, 1) ** 1.5)
        src = glottal(pitch, n, rr, breath=0.2)
        wo = np.clip((t - 8.0) / 0.8, 0, 1)
        y = formant(src, 'u') * (1 - wo) + formant(src, 'o') * wo
        a = np.clip((t - 6.8 - rr.uniform(0, 0.5)) / 2.0, 0, 1) ** 1.5
        sw += pan(y * a, rr.uniform(-1, 1))
    sw /= np.sqrt(24)
    y = base + sw * 1.2
    m = tv_speaker(y, r, 1.4)
    m = norm_peak(m, -1)
    m = fade(m, 0.2, 0.0)
    m[-N(0.004):] *= np.linspace(1, 0, N(0.004))
    return m


@sfx('tv_crowd_goal', 'The goal eruption heard through the TV speaker (band-limited, mono, slight breakup). '
     'Hit at 0.05 s. 10 s.', 0.05, 'oneshot')
def _(r):
    src = build('stadium_goal_eruption', write=False)
    m = tv_speaker(src[:, :N(10.0)], r, 1.15)
    return fade(m, 0, 1.5)


@sfx('freeze_glitch', 'THE FREEZE: the TV sound stutters in shrinking buffer-repeats, bit-crushes into digital '
     'garbage and blips, then tape-stops down to a dead thud. Hit (first stutter) at 0.0 s. 1.6 s. Mono-ish, TV side.',
     0.0)
def _(r):
    tvc = build('tv_crowd_live', write=False)
    tvc = tvc if tvc.ndim == 1 else tvc[0]
    grain_src = tvc[-N(0.25):]
    dur = 1.6
    n = N(dur)
    y = np.zeros(n)
    # stutter: repeat a 70 ms grain, shrinking
    pos = 0
    g = N(0.07)
    k = 0
    while pos < N(0.42):
        gr = grain_src[-g:] * np.hanning(g) ** 0.1
        gr = gr if k < 2 else bitcrush(gr, max(3, 8 - k), 1 + k)
        y[pos:pos + g] += gr[:max(0, min(g, n - pos))] * (1.0 - 0.05 * k)
        pos += g
        g = max(N(0.012), int(g * 0.8))
        k += 1
    # digital blips
    for j in range(10):
        bn = N(r.uniform(0.01, 0.03))
        b = square(r.choice([880, 1320, 1760, 2640, 3520]), bn, duty=r.uniform(0.2, 0.5)) * 0.25
        add_at(y, b, r.uniform(0.0, 0.5))
    # macro-block crunch noise
    cr = bitcrush(white(N(0.45), r) * 0.3, 3, 40)
    add_at(y, hp(cr, 500) * expdec(N(0.45), 0.15), 0.02)
    # tape-stop of the last 0.8 s of crowd
    ts_src = tvc[-N(0.8):]
    tn = N(1.1)
    rate = np.linspace(1.0, 0.0, tn) ** 1.6
    ts = resample_curve(ts_src, np.cumsum(rate) * 0.9)
    ts *= np.linspace(1, 0, tn) ** 0.5
    add_at(y, ts * 0.8, 0.42)
    # low thud at the end of the stop
    add_at(y, thump(0.4, 70, 35, 0.12, 0.2, r) * 0.6, 1.25)
    y = sat(y * 1.2, 1.5)
    return fade(y, 0.0, 0.08)


@sfx('record_scratch', 'Vinyl record scratch sting ("wikka-wiiip") -- the comic brake. Hit at 0.01 s. 0.9 s.', 0.01)
def _(r):
    # source: a bright music-like chord
    sn = N(2.0)
    ts = tax(sn)
    chord = sum(saw(f, sn) for f in [196, 247, 294, 392, 494]) * 0.2
    chord = lp(chord, 5000) + 0.2 * bp(white(sn, r), 2000, 8000)
    dur = 0.9
    n = N(dur)
    t = tax(n)
    # position curve: forward, back fast, forward, stop
    vel = np.interp(t, [0, 0.08, 0.12, 0.26, 0.30, 0.52, 0.9], [1, 1, -2.6, -2.6, 3.2, 0.2, 0])
    pos = N(0.5) + np.cumsum(vel)
    y = resample_curve(chord, pos)
    y *= np.clip(np.abs(vel) / 1.5, 0.15, 1)
    crackle = np.zeros(n)
    idx = r.integers(0, n, 60)
    crackle[idx] = r.uniform(-1, 1, 60)
    y = hp(y, 200) + lp(crackle, 6000) * 0.3
    y *= env(n, [(0, 0), (0.005, 1), (0.6, 0.8), (0.9, 0)])
    return y


@sfx('buffering_tick_loop', 'Buffering spinner: soft, patient digital "tk" ticks (8 per second, subtle pitch '
     'alternation) -- the sound of waiting. Loopable 5.0 s (period-exact).', 0.0, 'bed', -26)
def _(r):
    dur = 5.0
    n = N(dur)
    y = np.zeros(n)
    for k in range(40):
        L = N(0.03)
        f = 2400 if k % 8 == 0 else (1900 if k % 2 == 0 else 1750)
        c = np.sin(2 * np.pi * f * tax(L)) * np.exp(-tax(L) / 0.004) * attack(L, 0.0005)
        c += click(L, r, 4000, 5, 0.002) * 0.1
        add_at(y, c * (1.0 if k % 8 == 0 else 0.6), k * 0.125)
    return y


@sfx('sad_trombone', 'Subtle muted "wah-wah-wah-waaah" sad trombone (plunger-muted, soft, comic despair). '
     'First note at 0.03 s. 2.8 s.', 0.03)
def _(r):
    dur = 2.8
    n = N(dur)
    t = tax(n)
    notes = [(0.03, 0.42, 293.7), (0.48, 0.42, 277.2), (0.93, 0.42, 261.6), (1.38, 1.3, 246.9)]
    f = np.full(n, 293.7)
    a = np.zeros(n)
    wah = np.zeros(n)
    for (s, L, fr) in notes:
        i0, i1 = N(s), N(s + L)
        f[i0:i1] = fr * np.linspace(1.0, 0.985, i1 - i0)
        a[i0:i1] = np.hanning(i1 - i0) ** 0.25
        # wah opening per note
        wah[i0:i1] = np.sin(np.linspace(0, np.pi, i1 - i0)) ** 0.7
    f = smooth(f, 0.03)
    last = t > 1.6
    f = f * (1 + np.where(last, 0.018 * np.sin(2 * np.pi * 5.5 * (t - 1.6)) * np.clip((t - 1.6) / 0.3, 0, 1), 0))
    src = saw(f) * 0.7 + saw(f * 1.004) * 0.3
    src = sat(src * 1.5, 1.4)
    wah = smooth(wah, 0.05)
    a = smooth(a, 0.03)
    y = stft_shape(src * a, lpsweep(lambda tt: 350 + 1300 * np.interp(tt, t, wah), 18), nper=1024)
    y = reson(y, 520, 1.5) * 0.6 + y * 0.6
    y = reverb(y, IR_room(), 0.3, tail=False)
    return fade(y, 0, 0.3)


@sfx('router_beeps', 'Router status beeps: three short square-ish blips + a lower confirm blip, cute and small. '
     'First beep at 0.0 s. 0.9 s.', 0.0)
def _(r):
    n = N(0.9)
    y = np.zeros(n)
    for (s, f, L) in [(0.0, 2350, 0.07), (0.12, 2350, 0.07), (0.24, 2350, 0.07), (0.42, 1570, 0.16)]:
        bn = N(L)
        b = (square(f, bn, 0.5) * 0.3 + np.sin(2 * np.pi * f * tax(bn))) * env(bn, [(0, 0), (0.003, 1), (L - 0.01, 1), (L, 0)])
        add_at(y, lp(b, 6000), s)
    y = reverb(y, IR_room(), 0.25, tail=False)
    return y


@sfx('dive_whoosh', 'Deep dive INTO the router LED: sub rising from 30 Hz, reversed-air suck and a huge sweeping '
     'whoosh that peaks at 1.0 s (= the 29.2 flash in v2), then roars away into a tunnel tail. 2.4 s.', 1.0)
def _(r):
    dur = 2.4
    n = N(dur)
    t = tax(n)
    pk = 1.0
    fsub = 30 + 90 * np.clip(t / pk, 0, 1) ** 2
    sub = np.sin(phase_of(fsub)) * np.where(t < pk, (t / pk) ** 2, np.exp(-(t - pk) / 0.35))
    wh = whoosh(dur, r, peak=pk, f_lo=120, f_hi=7000, bw=1.3, pan_from=0, pan_to=0, sharp=2.5, tone=0.0)
    wh2 = whoosh(dur, r, peak=pk + 0.02, f_lo=80, f_hi=1200, bw=0.8, pan_from=-0.5, pan_to=0.5, sharp=3.0)
    # flanged tunnel tail
    tail = pink(n, r) * np.clip((t - pk) / 0.05, 0, 1) * np.exp(-np.maximum(t - pk, 0) / 0.5)
    fl = stft_shape(tail, lambda tt, ff: 0.3 + 0.7 * np.abs(np.cos(np.pi * ff / (300 + 600 * tt)))) * 0.5
    y = wh * 1.0 + wh2 * 0.7 + st(sub * 0.9) + haas(fl, 3)
    y = reverb(y, IR_tunnel(), 0.3, tail=False)
    return fade(y, 0.05, 0.3)


@sfx('light_shimmer', 'Into-the-light shimmer: a swelling major chord of glassy partials and twinkling sparkles, '
     'blooming at 0.7 s (use hit 0.7 on a flash), long airy tail. 2.8 s.', 0.7)
def _(r):
    dur = 2.8
    n = N(dur)
    t = tax(n)
    y = np.zeros((2, n))
    sw = env(n, [(0, 0), (0.7, 1), (1.2, 0.6), (2.8, 0)]) ** 1.2
    for f in [523.3, 659.3, 784.0, 1046.5, 1318.5, 1568.0, 2093.0, 2637.0]:
        for d in (-1, 1):
            fr = f * (1 + d * 0.0025)
            s = np.sin(phase_of(fr * (1 + 0.002 * np.sin(2 * np.pi * r.uniform(3, 6) * t)), n))
            y += pan(s * sw * (800 / f) ** 0.5, d * r.uniform(0.3, 0.9)) * 0.2
    # sparkles
    for k in range(40):
        tm = r.uniform(0.2, 2.0)
        b = bell(r.uniform(2500, 7000), 0.5, r, decay=0.12)
        add_at(y, pan(b, r.uniform(-1, 1)), tm, 0.12 * np.interp(tm, [0, 0.7, 2.0], [0.3, 1, 0.3]))
    y += st(hp(pink(n, r), 5000) * sw * 0.2)
    y = reverb(y, IR_huge(), 0.5, tail=False)
    return fade(y, 0.02, 0.6)


# ---------------------------------------------------------------- data world

@sfx('dataworld_ambience', 'Inside the fibre: electric hum with slow beating, flowing data streams (fluttering '
     'filtered noise), tiny random digital pips flicking past in stereo, low tunnel air. 14.4 s bed (29.2-43.4 + tail).', 0.0, 'bed', -24)
def _(r):
    dur = 14.4
    n = N(dur)
    t = tax(n)
    hum = (np.sin(2 * np.pi * 100 * t) + 0.5 * np.sin(2 * np.pi * 200.7 * t) + 0.25 * np.sin(2 * np.pi * 301.5 * t)
           + 0.12 * sat(np.sin(2 * np.pi * 100 * t) * 4, 4))
    hum = hum * 0.15
    humst = np.vstack([hum, np.sin(2 * np.pi * 100.4 * t) * 0.15 + 0.5 * hum])
    flow = []
    for c in range(2):
        nz = pink(n, r)
        fl = stft_shape(nz, bandsweep(lambda tt: 900 + 500 * np.sin(2 * np.pi * 0.13 * tt + c), 1.2))
        fl *= 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * (7 + 2 * c) * t + slow_noise(n, r, 1, 0, 6)))
        flow.append(fl)
    flow = np.vstack(flow)
    pips = np.zeros((2, n))
    for k in range(100):
        pn = N(0.05)
        f = r.choice([1200, 1600, 2000, 2400, 3000, 3600, 4800]) * r.uniform(0.98, 1.02)
        p = np.sin(2 * np.pi * f * tax(pn)) * np.exp(-tax(pn) / 0.012) * attack(pn, 0.001)
        add_at(pips, pan(p, r.uniform(-1, 1)), r.uniform(0, dur), r.uniform(0.05, 0.25))
    air = st(lp(brown(n, r), 250)) * 0.5
    y = humst * 0.6 + flow * 0.5 + pips * 0.5 + air
    y = reverb(y, IR_tunnel(), 0.3, tail=False)
    return fade(hp(y, 30), 0.1, 1.0)


@sfx('traffic_jam_grumble', 'Traffic jam of idling packets: low chugging engine rumble (many slow-pulsing sub '
     'motors), impatient grumbling murmurs. 12.6 s bed (29.2 -> the 41.5 boost), fades out over the last 1 s.', 0.0, 'bed', -24)
def _(r):
    dur = 12.6
    n = N(dur)
    t = tax(n)
    y = np.zeros((2, n))
    for k in range(10):
        f = r.uniform(32, 60)
        rate = r.uniform(7, 14)
        eng = saw(f * (1 + 0.02 * np.sin(2 * np.pi * 0.3 * t + k)), n)
        eng *= 0.5 + 0.5 * np.maximum(np.sin(2 * np.pi * rate * t + r.uniform(0, 6)), 0) ** 2
        eng = lp(eng, r.uniform(180, 400))
        y += pan(eng * r.uniform(0.3, 1), r.uniform(-0.8, 0.8))
    mut = crowd_voices(dur, r, 10, f0_range=(70, 120), rate=2.5, vowels='uoe', dist_lp=(700, 1400), breath=0.2)
    y = y * 0.5 + mut * 0.8
    y = reverb(y, IR_tunnel(), 0.25, tail=False)
    return fade(hp(y, 25), 0.2, 1.0)


def _honk(r, f, dbl=False):
    h = cartoon_horn(f, 0.26, r)
    if dbl:
        h2 = cartoon_horn(f * 1.06, 0.22, r)
        out = np.zeros(N(0.62))
        add_at(out, h, 0)
        add_at(out, h2, 0.3)
        h = out
    return reverb(h, IR_tunnel(), 0.2, tail=False)


@sfx('packet_honk_hi', 'Little cartoon bulb-horn honk, high (packet annoyance). Hit 0.01 s.', 0.01)
def _(r):
    return _honk(r, 520)


@sfx('packet_honk_mid', 'Cartoon bulb-horn honk, mid pitch. Hit 0.01 s.', 0.01)
def _(r):
    return _honk(r, 390)


@sfx('packet_honk_lo', 'Cartoon honk, low and grumpy. Hit 0.01 s.', 0.01)
def _(r):
    return _honk(r, 260)


@sfx('packet_honk_double', 'Impatient double honk ("honk-HONK"). Hits at 0.01 and 0.31 s.', 0.01)
def _(r):
    return _honk(r, 440, True)


@sfx('squeeze_squeak', 'Rubbery squeak of Bit squeezing between packets (balloon-rub wobble). Hit 0.02 s. 0.35 s.',
     0.02)
def _(r):
    n = N(0.35)
    t = tax(n)
    f = 900 + 500 * np.sin(np.pi * t / 0.35) + 120 * np.sin(2 * np.pi * 23 * t)
    y = (saw(f) * 0.3 + np.sin(phase_of(f))) * env(n, [(0, 0), (0.02, 1), (0.28, 0.7), (0.35, 0)])
    y *= 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * t))
    y = bp(y, 500, 5000)
    return reverb(y, IR_tunnel(), 0.15, tail=False)


@sfx('bit_charge', 'Bit crouches and CHARGES: accelerating electric whine 150->2400 Hz with tremolo and crackle, '
     'building to the launch. Hit (end/peak) at 0.6 s -- cue so 0.6 s lands on the boost.', 0.6)
def _(r):
    dur = 0.66
    n = N(dur)
    t = tax(n)
    f = 150 * (16 ** (np.clip(t / 0.6, 0, 1) ** 1.3))
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * (6 + 40 * t / 0.6) * t)
    y = (sine(f) + 0.4 * saw(f * 0.5)) * trem
    y = lp(y, 9000)
    a = np.clip(t / 0.6, 0, 1) ** 1.8
    y = y * a + electric_arc(dur, r, 50) * a * 0.3
    y[N(0.6):] *= np.linspace(1, 0, n - N(0.6))
    return reverb(y, IR_tunnel(), 0.2, tail=False)


@sfx('bit_rocket_launch', 'BOOST: explosive rocket ignition (punchy thump + burst), roaring flame that fades over 2 s, '
     'rising whistle as Bit climbs over the jam. Hit 0.01 s.', 0.01)
def _(r):
    dur = 2.4
    n = N(dur)
    t = tax(n)
    burst = (white(n, r) * 0.6 + brown(n, r) * 0.4) * expdec(n, 0.08) * attack(n, 0.001)
    burst = lp(burst, 6000)
    flame = (pink(n, r) * 0.6 + brown(n, r) * 0.5)
    flame *= (0.6 + 0.4 * np.abs(slow_noise(n, r, 30, -1, 1)))
    flame = stft_shape(flame, lpsweep(lambda tt: 3500 * np.exp(-tt / 1.2) + 400, 9))
    fe = env(n, [(0, 0), (0.02, 1), (0.6, 0.7), (2.4, 0)])
    wh = np.sin(phase_of(600 + 1600 * np.clip(t / 1.4, 0, 1))) * env(n, [(0, 0), (0.1, 0.3), (1.2, 0.2), (2.0, 0)])
    y = st(burst * 1.0 + thump(dur, 120, 40, 0.3, 0.3, r) * 0.9) + pan_dyn(flame * fe * 0.7, np.interp(t, [0, 2.4], [-0.1, 0.4]))
    y += st(wh * 0.15)
    y = sat(y, 1.3)
    y = reverb(y, IR_tunnel(), 0.3, tail=False)
    return fade(y, 0, 0.4)


@sfx('sonic_whoosh', 'Sonic pass-by: Bit bursts out of the jam -- a hard doppler whoosh with a sonic-boom N-wave '
     'thump at the peak (0.35 s), stereo sweep R->L... tail into open fibre. 1.8 s.', 0.35)
def _(r):
    dur = 1.8
    n = N(dur)
    t = tax(n)
    y = whoosh(dur, r, peak=0.35, f_lo=400, f_hi=6000, bw=1.2, pan_from=-0.9, pan_to=0.9, sharp=2.0, tone=0.5)
    # N-wave boom
    bn = N(0.5)
    tb = tax(bn)
    nw = np.where(tb < 0.012, 1 - 2 * tb / 0.012, 0) + 0
    boom = lp(nw, 300) * 4 + thump(0.5, 90, 32, 0.25, 0.3, r) * 1.0
    add_at(y, st(boom * 0.5), 0.35)
    y = y + whoosh(dur, r, peak=0.36, f_lo=150, f_hi=2500, bw=1.0, pan_from=-0.6, pan_to=0.6, sharp=1.8) * 0.8
    fz = 1400 * np.where(t < 0.35, 1.0, 0.6) * (1 + 0.1 * np.exp(-np.abs(t - 0.35) * 10))
    y += st(np.sin(phase_of(fz)) * np.exp(-np.abs(t - 0.35) / 0.15) * 0.15)
    y = reverb(y, IR_tunnel(), 0.35, tail=False)
    return fade(y, 0, 0.3)


@sfx('zip_streak', 'Short zippy light-streak "fwip" -- fast pass, bright, for speed lines / cut streaks. '
     'Peak 0.1 s. 0.55 s.', 0.1)
def _(r):
    y = whoosh(0.55, r, peak=0.1, f_lo=1200, f_hi=8000, bw=1.0, pan_from=-0.7, pan_to=0.7, sharp=1.5)
    n = N(0.55)
    t = tax(n)
    y += st(np.sin(phase_of(2600 * np.exp(-t / 0.2) + 500)) * np.exp(-np.abs(t - 0.1) / 0.06) * 0.2)
    return reverb(y, IR_tunnel(), 0.15, tail=False)


# ---------------------------------------------------------------- ocean

@sfx('underwater_ambience', 'Deep ocean bed: heavy low rumble and pressure, muffled currents, bubble trickles, '
     'distant whale-ish groans in a huge dark reverb. 11.2 s.', 0.0, 'bed', -23)
def _(r):
    dur = 11.2
    n = N(dur)
    t = tax(n)
    rum = np.vstack([lp(brown(n, r), 140), lp(brown(n, r), 140)]) * (0.8 + 0.2 * slow_noise(n, r, 0.3))
    cur = []
    for c in range(2):
        cur.append(stft_shape(pink(n, r), bandsweep(lambda tt: 250 + 150 * np.sin(0.4 * tt + c * 2), 1.0)) * 0.35)
    cur = np.vstack(cur) * slow_noise(n, r, 0.5, 0.4, 1)
    bub = np.zeros((2, n))
    for k in range(120):
        size = r.uniform(0, 1) ** 2
        f0 = 400 + 1600 * (1 - size)
        L = N(0.04 + 0.08 * size)
        tb = tax(L)
        b = np.sin(phase_of(f0 * (1 + 2.5 * tb / (L / SR)))) * np.exp(-tb / (0.012 + 0.03 * size)) * attack(L, 0.001)
        # bubble trickles come in clusters
        cl = r.integers(0, 6)
        tm = (cl * 1.9 + r.uniform(0, 1.2)) % dur
        add_at(bub, pan(b, r.uniform(-0.8, 0.8)), tm, r.uniform(0.05, 0.3))
    bub = lp(bub, 2500)
    wh = np.zeros(n)
    for (s, L, f0, f1) in [(1.0, 3.2, 180, 120), (6.0, 3.8, 110, 170)]:
        wn = N(L)
        tw = tax(wn)
        fw = np.interp(tw, [0, L * 0.4, L], [f0, f0 * 1.15, f1])
        src = saw(fw, wn) * 0.5 + np.sin(phase_of(fw)) * 0.5
        g = formant(src, 'u', 0.6) * 0.8 + formant(src, 'o', 0.6) * 0.4 * np.sin(np.pi * tw / L)
        g *= np.sin(np.pi * tw / L) ** 2
        add_at(wh, g, s)
    whst = reverb(lp(wh, 900), IR_water(), 1.0, dry=0.1, tail=False)
    y = rum * 1.0 + cur + bub * 0.9 + whst * 0.35
    y = reverb(y, IR_water(), 0.25, tail=False)
    return fade(hp(y, 22), 0.03, 0.4)


@sfx('underwater_plunge', 'Hard-cut entry into the deep: muffled plunge boom + bubble burst swirling up. Hit 0.0 s.',
     0.0)
def _(r):
    dur = 1.8
    n = N(dur)
    y = st(thump(dur, 70, 30, 0.35, 0.0, r) * 0.9)
    y += st(lp(pink(n, r), 700) * expdec(n, 0.25))
    for k in range(45):
        L = N(0.08)
        tb = tax(L)
        f0 = r.uniform(500, 1800)
        b = np.sin(phase_of(f0 * (1 + 2 * tb / 0.08))) * np.exp(-tb / 0.02)
        add_at(y, pan(b, r.uniform(-0.7, 0.7)), abs(r.normal(0.1, 0.35)), r.uniform(0.05, 0.25))
    y = lp(y, 2600)
    y = reverb(y, IR_water(), 0.4, tail=False)
    return fade(y, 0, 0.4)


@sfx('sonar_ping', 'Distant sonar ping: pure 1.5 kHz ping with a long, dark underwater echo tail. Hit 0.0 s. 3 s.', 0.0)
def _(r):
    n = N(3.0)
    pn = N(0.8)
    p = np.sin(2 * np.pi * 1480 * tax(pn)) * np.exp(-tax(pn) / 0.09) * attack(pn, 0.003)
    y = np.zeros(n)
    add_at(y, p, 0)
    add_at(y, p * 0.25, 0.9)
    return fade(reverb(y, IR_water(), 0.8, tail=False), 0, 0.5)


@sfx('cable_hum', 'The glowing undersea cable: glassy singing hum (beating partials) over a mains-like electric '
     'drone, faint crackle, with regular pulse "whum"s of data racing through. 11 s bed.', 0.0, 'bed', -26)
def _(r):
    dur = 11.0
    n = N(dur)
    t = tax(n)
    drone = np.sin(2 * np.pi * 55 * t) * 0.4 + np.sin(2 * np.pi * 110 * t) * 0.3 + sat(np.sin(2 * np.pi * 55 * t) * 3, 3) * 0.1
    glass = sum(np.sin(2 * np.pi * f * t + r.uniform(0, 6)) * a for f, a in
                [(880, 0.2), (882.5, 0.2), (1320, 0.12), (1763, 0.08), (2641, 0.05)])
    pul = np.zeros(n)
    for k in range(int(dur / 0.45)):
        pn = N(0.4)
        tp = tax(pn)
        w = lp(pink(pn, r), 1200) * np.sin(np.pi * tp / 0.4) ** 3
        add_at(pul, w, k * 0.45)
    cr = electric_arc(dur, r, 8, 110) * 0.08
    y = np.vstack([drone + glass * 0.5 + pul * 0.4 + cr, drone + glass[::-1] * 0 + 0.5 * sum(
        np.sin(2 * np.pi * f * t) * a for f, a in [(880.7, 0.2), (1320.4, 0.12)]) + pul * 0.4 + cr])
    y = lp(y, 3500)
    y = reverb(y, IR_water(), 0.3, tail=False)
    return fade(y, 0.1, 0.6)


@sfx('shark_lunge', 'Shark lunge: surging water rush and low body swoosh with gulping bubbles, building to the bite. '
     'Peak at 0.4 s (lands on the CHOMP). 1.2 s.', 0.4)
def _(r):
    dur = 1.2
    n = N(dur)
    t = tax(n)
    y = whoosh(dur, r, peak=0.4, f_lo=90, f_hi=1100, bw=1.1, pan_from=-0.6, pan_to=0.1, sharp=2.0)
    y += st(np.sin(phase_of(40 + 50 * np.clip(t / 0.4, 0, 1))) * np.where(t < 0.4, (t / 0.4) ** 2, np.exp(-(t - 0.4) / 0.15)) * 0.7)
    for k in range(20):
        L = N(0.06)
        tb = tax(L)
        b = np.sin(phase_of(r.uniform(300, 900) * (1 + 2 * tb / 0.06))) * np.exp(-tb / 0.015)
        add_at(y, pan(b, r.uniform(-0.5, 0.5)), r.uniform(0.05, 0.5), 0.2)
    y = lp(y, 3000)
    y = reverb(y, IR_water(), 0.25, tail=False)
    return fade(y, 0, 0.3)


@sfx('chomp', 'Cartoon shark CHOMP on the cable: double teeth clack, crunchy bite, low jaw thump. Hit 0.005 s. 1.1 s.', 0.005)
def _(r):
    dur = 1.1
    n = N(dur)
    y = np.zeros(n)
    for (s, f) in [(0.0, 2200), (0.035, 1700)]:
        L = N(0.08)
        c = white(L, r) * np.exp(-tax(L) / 0.004)
        c = reson(c, f, 4) * 3 + reson(c, f * 2.3, 6) * 2 + c * 0.3
        add_at(y, c, s)
    cr = np.zeros(N(0.3))
    for k in range(40):
        i = r.integers(0, len(cr) - 200)
        cr[i:i + 120] += white(120, r) * np.exp(-np.arange(120) / 20) * r.uniform(0.2, 1)
    cr = bp(cr, 700, 6000) * np.linspace(1, 0.1, len(cr))
    add_at(y, cr * 0.6, 0.03)
    y += thump(dur, 140, 55, 0.08, 0.2, r) * 0.9
    y = sat(y * 1.3, 1.6)
    return reverb(y, IR_water(), 0.12, tail=False)


@sfx('spark_zap', 'Electric spark zap from the bitten cable: sharp arc crack, crackling sparks and a buzzing 120 Hz '
     'discharge that sputters out. Hit 0.0 s. 1.3 s.', 0.0)
def _(r):
    dur = 1.3
    n = N(dur)
    t = tax(n)
    arc = electric_arc(dur, r, 70, 120) * np.exp(-t / 0.35)
    crack = hp(white(n, r), 2000) * expdec(n, 0.01) * 2
    zf = 2500 * np.exp(-t / 0.05) + 200
    zap = saw(zf) * expdec(n, 0.12) * 0.5
    y = arc + crack + zap
    y = pan(y, 0) + haas(arc * 0.5, 1.2)
    y = reverb(y, IR_water(), 0.15, tail=False)
    return fade(y, 0, 0.2)


@sfx('boing', 'Cartoon BOING: Bit bounces off the shark\'s nose -- sproingy jaw-harp spring with decaying vibrato '
     'and a rubbery thud. Hit 0.0 s. 1.0 s.', 0.0)
def _(r):
    dur = 1.0
    n = N(dur)
    t = tax(n)
    f = 170 * (1 + 0.5 * np.clip(t / 0.08, 0, 1)) * (1 + 0.18 * np.sin(2 * np.pi * 13 * t) * np.exp(-t / 0.35))
    src = saw(f) * 0.5 + np.sin(phase_of(f)) * 0.8
    formant_sweep = stft_shape(src, bandsweep(lambda tt: 700 + 900 * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * tt)) * np.exp(-tt / 0.4), 1.0), nper=512)
    y = (formant_sweep * 1.3 + np.sin(phase_of(f)) * 0.4) * expdec(n, 0.3) * attack(n, 0.002)
    y += np.pad(thump(0.25, 200, 80, 0.05, 0.3, r), (0, n - N(0.25))) * 0.6
    y = reverb(y, IR_room(), 0.2, tail=False)
    return fade(y, 0, 0.1)


@sfx('dazed_stars', 'Dazed "tweety" stars: little bird chirps and twinkly glockenspiel dings circling the shark\'s '
     'head (stereo orbit). 2.6 s.', 0.05)
def _(r):
    dur = 2.6
    n = N(dur)
    t = tax(n)
    y = np.zeros(n)
    for k in range(9):
        L = N(0.12)
        tb = tax(L)
        f0 = r.uniform(3000, 4200)
        fch = f0 * (1 + 0.35 * np.sin(np.pi * tb / 0.12)) if k % 2 else f0 * (1.3 - 0.3 * tb / 0.12)
        c = np.sin(phase_of(fch)) * np.sin(np.pi * tb / 0.12) ** 2
        add_at(y, c * 0.5, 0.05 + k * 0.26)
        add_at(y, bell(r.choice([2093, 2349, 2637, 3136]), 0.6, r, decay=0.3) * 0.3, 0.18 + k * 0.26)
    orbit = 0.8 * np.sin(2 * np.pi * 1.1 * t)
    y = pan_dyn(y, orbit)
    y = reverb(y, IR_room(), 0.35, tail=False)
    return fade(y, 0, 0.4)


@sfx('map_ding', 'Map pin "ding": warm glassy bell with sparkle -- one per city pin. Hit 0.0 s. 2.0 s.', 0.0)
def _(r):
    y = bell(1760, 2.0, r, decay=0.7) + bell(2637, 2.0, r, decay=0.4) * 0.3
    return fade(reverb(y, IR_hall(), 0.3, tail=False), 0, 0.6)


@sfx('map_ding_arrive', 'Arrival pin: two-note rising chime (Toronto reached). Hits at 0.0 and 0.14 s. 1.8 s.', 0.0)
def _(r):
    n = N(1.8)
    y = np.zeros(n)
    add_at(y, bell(1318.5, 1.6, r, decay=0.8), 0)
    add_at(y, bell(1975.5, 1.6, r, decay=1.0) + bell(2637, 1.6, r, decay=0.6) * 0.4, 0.14)
    return reverb(y, IR_hall(), 0.3, tail=False)


@sfx('km_counter_ticks', 'Mechanical/digital km counter rolling 0 -> 11,000: fast soft ticks that accelerate then '
     'slow, ending with a "clunk" at 9.9 s (= arrival). 10.4 s.', 0.0, 'bed', -28)
def _(r):
    dur = 10.4
    n = N(dur)
    y = np.zeros(n)
    tt = 0.0
    while tt < 9.8:
        rate = np.interp(tt, [0, 2, 7, 9.8], [8, 18, 18, 6])
        L = N(0.02)
        c = click(L, r, 3400 if int(tt * rate) % 10 else 2400, 8, 0.002)
        add_at(y, c * (0.6 + 0.2 * r.uniform()), tt)
        tt += 1 / rate
    add_at(y, click(N(0.2), r, 1200, 3, 0.01) * 0.8 + thump(0.2, 200, 90, 0.04) * 0.5, 9.9)
    return fade(reverb(y, IR_room(), 0.2, tail=False), 0, 0.1)


@sfx('shore_arrival_swell', 'Cable rising to the shore: a big rolling water swell + magical upward shimmer that '
     'crests at 1.6 s (= 53.4 in v2), then washes out. 3.2 s.', 1.6)
def _(r):
    dur = 3.2
    n = N(dur)
    t = tax(n)
    sw = env(n, [(0, 0), (1.6, 1), (2.2, 0.6), (3.2, 0)])
    wat = stft_shape(pink(n, r), lpsweep(lambda tt: 300 + 3000 * np.interp(tt, [0, 1.6, 3.2], [0, 1, 0.2]), 12))
    y = pan_dyn(wat * sw, np.interp(t, [0, 3.2], [-0.3, 0.3])) + haas(wat * sw * 0.3, 9)
    up = sum(np.sin(phase_of(f * (1 + 0.5 * np.clip(t / 1.6, 0, 1)))) for f in [440, 554, 659, 880]) * sw ** 2 * 0.08
    y += st(up)
    y = reverb(y, IR_huge(), 0.4, tail=False)
    return fade(y, 0.05, 0.4)


# ---------------------------------------------------------------- last mile

@sfx('snowy_street_wind', 'Snowy Toronto street at night: gusting wind with howl, snow hiss, far-off city hum and '
     'a distant streetcar bell. 5.0 s bed.', 0.0, 'bed', -24)
def _(r):
    dur = 5.0
    n = N(dur)
    w = _wind(dur, r, muffled=False, gust_rate=0.9, fin=0.03, fout=0.6, howl=0.6)
    city = st(lp(brown(n, r), 300)) * 0.4
    bellx = bell(1180, 1.5, r, decay=0.5) * 0.08
    y = w + city
    add_at(y, pan(lp(bellx, 3000), -0.7), 2.4)
    y = hp(reverb(y, IR_street(), 0.3, tail=False), 40, 3)
    return fade(y, 0.02, 0.5)


@sfx('pole_buzz', 'Utility-pole transformer buzz: 120 Hz mains buzz with gritty harmonics and faint arcing '
     'sizzle (Toronto = 60 Hz grid). 5 s bed.', 0.0, 'bed', -28)
def _(r):
    dur = 5.0
    n = N(dur)
    t = tax(n)
    b = sat(np.sin(2 * np.pi * 120 * t) * 2.5 + 0.3 * np.sin(2 * np.pi * 240 * t), 2.5)
    b = bp(b, 100, 3000) * (0.85 + 0.15 * slow_noise(n, r, 3))
    b += 0.05 * electric_arc(dur, r, 5, 120)
    y = pan(b, 0.25)
    y = reverb(y, IR_street(), 0.3, tail=False)
    return fade(y, 0.05, 0.5)


@sfx('wire_zip', 'Zip along the power line: metallic zipline whirr rising in pitch, wire-singing tone, spark '
     'ticks, doppler pan L->R. Starts 0.0 s, peak ~1.2 s. 2.2 s.', 0.0)
def _(r):
    dur = 2.2
    n = N(dur)
    t = tax(n)
    a = env(n, [(0, 0), (0.08, 0.6), (1.2, 1.0), (1.8, 0.4), (2.2, 0)])
    fr = 400 + 900 * np.clip(t / 1.4, 0, 1)
    whirr = stft_shape(white(n, r), bandsweep(lambda tt: 2000 + 2500 * np.clip(tt / 1.4, 0, 1), 0.5))
    tone = (np.sin(phase_of(fr)) + 0.5 * np.sin(phase_of(fr * 2.01)) + 0.3 * np.sin(phase_of(fr * 3.03)))
    tone *= 0.6 + 0.4 * np.sin(2 * np.pi * 45 * t)
    y = (whirr * 0.7 + tone * 0.25) * a
    for k in range(18):
        add_at(y, click(N(0.02), r, r.uniform(3000, 6000), 6, 0.002) * 0.4, r.uniform(0.1, 1.9))
    y = pan_dyn(y, np.interp(t, [0, 2.2], [-0.7, 0.8]))
    y = reverb(y, IR_street(), 0.25, tail=False)
    return fade(y, 0.01, 0.3)


def _shatter(dur, r, count=80):
    n = N(dur)
    y = np.zeros((2, n))
    for k in range(count):
        tm = abs(r.normal(0, 0.12)) + (0 if k < count // 2 else r.uniform(0.05, 0.6))
        f = r.uniform(2000, 9000)
        L = N(r.uniform(0.1, 0.5))
        s = sum(np.sin(2 * np.pi * f * m * tax(L) + r.uniform(0, 6)) * a for m, a in [(1, 1), (2.3, 0.4), (3.7, 0.2)])
        s *= np.exp(-tax(L) / r.uniform(0.02, 0.12)) * attack(L, 0.0005)
        add_at(y, pan(s, r.uniform(-1, 1)), tm, r.uniform(0.05, 0.3) * np.exp(-tm * 1.5))
    crack = hp(white(n, r), 1500) * expdec(n, 0.03)
    return y + st(crack * 0.8)


@sfx('delivered_impact', 'DELIVERED: Bit slams into the router -- reverse-air suck-in, then a huge punchy boom '
     '(sub drop + distorted punch), glass & pixel shatter spraying across stereo, digital square-wave debris, '
     'long cinematic tail. Hit at 0.25 s. 3.4 s.', 0.25)
def _(r):
    dur = 3.4
    n = N(dur)
    t = tax(n)
    y = np.zeros((2, n))
    # pre-suck (reversed noise swell)
    sn = N(0.25)
    suck = (hp(pink(sn, r), 800) * np.linspace(0, 1, sn) ** 3)
    add_at(y, st(suck * 0.6), 0.0)
    h = 0.25
    boom = thump(3.0, 110, 30, 0.55, 0.0, r)
    punch = lp(white(N(0.15), r), 2500) * expdec(N(0.15), 0.02)
    body = sat((boom * 1.2 + fit(punch, len(boom)) * 0.8) * 1.5, 2.0)
    add_at(y, st(body), h)
    add_at(y, _shatter(2.5, r, 90) * 0.9, h + 0.005)
    # pixel debris
    deb = np.zeros((2, N(1.8)))
    for k in range(30):
        bn = N(r.uniform(0.02, 0.06))
        b = square(r.choice([660, 990, 1320, 1980, 2640, 3960]) * r.uniform(0.99, 1.01), bn, 0.3) * np.exp(-tax(bn) / 0.02)
        tm = abs(r.normal(0, 0.25))
        add_at(deb, pan(b, r.uniform(-1, 1)), tm, 0.25 * np.exp(-tm * 2))
    add_at(y, lp(deb, 8000), h + 0.02)
    y = reverb(y, IR_huge(), 0.35, tail=False)
    return fade(y, 0, 0.6)


@sfx('pixel_shatter', 'Glass/pixel shatter layer on its own (tinkly shards + digital square debris). Hit 0.0 s. 2 s.',
     0.0)
def _(r):
    y = _shatter(2.0, r, 70)
    return reverb(y, IR_hall(), 0.25, tail=False)


# ---------------------------------------------------------------- goal / celebration

@sfx('tv_unfreeze_pop', 'TV unfreezes: cheerful "bloop" pop (pitch drop) + digital snap-back sparkle. Hit 0.004 s.',
     0.004)
def _(r):
    n = N(0.6)
    t = tax(n)
    f = 1400 * np.exp(-t / 0.03) + 280
    y = np.sin(phase_of(f)) * expdec(n, 0.07) * attack(n, 0.001)
    y += click(n, r, 4000, 3, 0.003) * 0.4
    for k in range(6):
        add_at(y, np.sin(2 * np.pi * (2000 + 400 * k) * tax(N(0.04))) * np.exp(-tax(N(0.04)) / 0.01) * 0.2, 0.05 + k * 0.03)
    return reverb(y, IR_room(), 0.2, tail=False)


@sfx('ball_net_swish', 'Ball smashes into the net: strike thud + rushing net swish/rustle with rope creak. '
     'Hit 0.01 s. 1.0 s.', 0.01)
def _(r):
    dur = 1.0
    n = N(dur)
    t = tax(n)
    th = thump(dur, 160, 60, 0.07, 0.4, r)
    sw = stft_shape(white(n, r), bandsweep(lambda tt: 4500 * np.exp(-tt / 0.4) + 1500, 1.0))
    sw *= env(n, [(0, 0), (0.02, 1), (0.25, 0.5), (0.8, 0)])
    rustle = np.zeros(n)
    for k in range(60):
        i = r.integers(N(0.01), N(0.6))
        rustle[i:i + 60] += white(60, r) * np.exp(-np.arange(60) / 10) * r.uniform(0.2, 1)
    rustle = bp(rustle, 1500, 7000)
    y = th * 0.9 + sw * 0.5 + rustle * 0.4
    y = pan(y, 0) + haas(sw * 0.2, 5)
    return reverb(y, IR_stadium(), 0.2, tail=False)


@sfx('popcorn_burst', 'Popcorn bowl explodes: dozens of kernels popping (dense then sparse) + a whump of the bowl. '
     'Hit 0.0 s. 1.8 s.', 0.0)
def _(r):
    dur = 1.8
    y = pops(dur, r, 70, (700, 2800), 4, 'decay')
    y += st(thump(dur, 180, 70, 0.08, 0.5, r)) * 0.5
    y += st(lp(white(N(dur), r), 3000) * expdec(N(dur), 0.06)) * 0.3
    return reverb(y, IR_room(), 0.25, tail=False)


@sfx('confetti_popper', 'Party popper: sharp pop + shower of paper confetti fluttering down (fine stereo '
     'crackle). Hit 0.0 s. 2.6 s.', 0.0)
def _(r):
    dur = 2.6
    n = N(dur)
    t = tax(n)
    popn = N(0.2)
    pop = (white(popn, r) * np.exp(-tax(popn) / 0.006) * 1.5 + np.sin(2 * np.pi * 150 * tax(popn)) * np.exp(-tax(popn) / 0.03))
    y = np.zeros((2, n))
    add_at(y, st(sat(pop, 1.5)), 0)
    fl = pops(dur, r, 260, (3000, 9000), 2, None, (0.05, 0.25))
    fl *= env(n, [(0, 0), (0.1, 1), (1.2, 0.6), (2.6, 0)])
    y += hp(fl, 2500) + np.vstack([hp(pink(n, r), 4000), hp(pink(n, r), 4000)]) * 0.04 * env(n, [(0, 0), (0.1, 1), (2.6, 0)])
    return reverb(y, IR_room(), 0.25, tail=False)


def _whoop(r, f0=240, shift=1.0, dur=0.9, two=False):
    n = N(dur)
    t = tax(n)
    if two:  # woo-HOO
        pitch = f0 * env(n, [(0, 1), (0.25, 1.1), (0.32, 0.95), (0.42, 1.5), (dur, 1.35)])
        a = env(n, [(0, 0), (0.03, 1), (0.25, 0.9), (0.3, 0.3), (0.36, 1), (dur - 0.15, 0.9), (dur, 0)])
        wu = env(n, [(0, 1), (0.36, 1), (0.5, 0.2), (dur, 0.2)])
    else:
        pitch = f0 * env(n, [(0, 0.8), (0.15, 1.4), (dur * 0.6, 1.5), (dur, 1.2)])
        a = env(n, [(0, 0), (0.04, 1), (dur - 0.2, 0.9), (dur, 0)])
        wu = env(n, [(0, 1), (0.12, 0.8), (dur, 0.3)])
    pitch *= 1 + 0.015 * np.sin(2 * np.pi * 6 * t)
    src = glottal(pitch, n, r, breath=0.18, jitter=0.02, tilt=2500)
    y = formant(src, 'u', shift) * wu + formant(src, 'o', shift) * (1 - wu)
    return y * a


@sfx('cheer_whoop', 'Cheer sweetener: a single "whoooo!" + a "woo-HOO!" from different people, small-room close. '
     'Hit 0.03 s. 1.7 s.', 0.03)
def _(r):
    n = N(1.7)
    y = np.zeros((2, n))
    add_at(y, pan(_whoop(r, 260, 1.0, 0.9), -0.3), 0.0)
    add_at(y, pan(_whoop(r, 330, 1.12, 1.0, two=True), 0.35), 0.55, 0.8)
    return fade(reverb(y, IR_room(), 0.3, tail=False), 0, 0.2)


@sfx('cheer_group', 'Small group "yaaay!" cheer sweetener (6 voices + claps), room acoustic. Hit 0.04 s. 2.2 s.', 0.04)
def _(r):
    dur = 2.2
    n = N(dur)
    t = tax(n)
    y = np.zeros((2, n))
    for k in range(6):
        rr = np.random.default_rng(r.integers(1 << 31))
        f0 = rr.uniform(200, 360)
        on = abs(rr.normal(0.04, 0.05))
        pitch = f0 * env(n, [(0, 0.9), (on + 0.1, 1.25), (1.2, 1.15), (dur, 1.0)])
        src = glottal(pitch, n, rr, breath=0.25)
        v = formant(src, 'ae', rr.uniform(1, 1.15))
        v *= env(n, [(0, 0), (on, 0), (on + 0.05, 1), (1.0 + rr.uniform(0, 0.4), 0.6), (1.8, 0), (dur, 0)])
        y += pan(v, rr.uniform(-0.7, 0.7))
    y /= 2.5
    y += _claps(dur, r, list(np.arange(0.9, 2.1, 0.19)), 5, 0.02) * 0.6
    return fade(reverb(y, IR_room(), 0.3, tail=False), 0, 0.3)


@sfx('bit_flop', 'Tiny exhausted flop: Bit plops out of the LED port -- soft squishy thud + tiny deflating squeak. '
     'Hit 0.02 s. 0.7 s.', 0.02)
def _(r):
    n = N(0.7)
    t = tax(n)
    th = thump(0.7, 260, 110, 0.05, 0.15, r)
    sq = np.sin(phase_of(np.interp(t, [0, 0.12, 0.45], [700, 900, 380]))) * env(n, [(0, 0), (0.1, 0), (0.14, 0.25), (0.45, 0)])
    y = np.zeros(n)
    add_at(y, th, 0.02)
    y += sq * 0.6
    return reverb(y, IR_room(), 0.2, tail=False)


@sfx('wink_ding', 'Sparkly wink "ting!": bright high bell + glitter swirl. Hit 0.0 s. 1.6 s.', 0.0)
def _(r):
    n = N(1.6)
    y = st(bell(3136, 1.6, r, decay=0.8) + bell(4186, 1.6, r, decay=0.5) * 0.4)
    for k in range(14):
        tm = 0.03 + k * 0.035
        add_at(y, pan(bell(r.uniform(5000, 9000), 0.3, r, decay=0.08), r.uniform(-0.8, 0.8)), tm, 0.12)
    return reverb(y, IR_hall(), 0.35, tail=False)


@sfx('title_slam', 'TITLE CARD SLAM: 0.35 s reverse-cymbal suck, then a cinematic hit (sub boom, punchy mid thump, '
     'snare-crack, metallic ring) with a bright major-chord shimmer tail that fades by 2.95 s. Hit at 0.35 s.', 0.35)
def _(r):
    dur = 3.0
    n = N(dur)
    t = tax(n)
    y = np.zeros((2, n))
    h = 0.35
    # reverse cymbal
    cn = N(h)
    cym = hp(white(cn, r), 3000) * np.linspace(0, 1, cn) ** 4
    add_at(y, np.vstack([cym, hp(white(cn, r), 3000) * np.linspace(0, 1, cn) ** 4]) * 0.5, 0)
    hn = n - N(h)
    boom = thump(hn / SR, 95, 32, 0.6, 0.0, r)
    mid = thump(hn / SR, 220, 110, 0.07, 0.0, r)
    crack = bp(white(hn, r), 900, 6000) * expdec(hn, 0.05)
    ring = sum(np.sin(2 * np.pi * f * tax(hn)) * a for f, a in [(523, 0.3), (1245, 0.2), (2080, 0.15), (3311, 0.1)])
    ring *= expdec(hn, 0.5)
    hit = sat(boom * 1.3 + mid * 0.8 + crack * 0.7, 1.8) + ring * 0.2
    add_at(y, st(hit), h)
    # shimmer tail (D major: Maccabi yellow!)
    sh = np.zeros((2, hn))
    th = tax(hn)
    for f in [587.3, 740.0, 880.0, 1174.7, 1480.0, 1760.0, 2349.3]:
        for d in (-1, 1):
            s = np.sin(2 * np.pi * f * (1 + d * 0.003) * th) * (0.5 + 0.5 * np.sin(2 * np.pi * r.uniform(3, 7) * th))
            sh += pan(s * (700 / f) ** 0.5 * np.exp(-th / 0.9) * np.clip(th / 0.03, 0, 1), d * 0.7) * 0.12
    add_at(y, sh, h)
    y = reverb(y, IR_huge(), 0.4, tail=False)
    y = hp(y, 25)
    # guarantee silence by the end (film ends at 60.0 with hit at 57.3 -> 2.7 s after hit)
    y *= np.vstack([env(n, [(0, 1), (2.2, 1), (2.95, 0), (3.0, 0)])] * 2)
    return y


# ---------------------------------------------------------------- VERSION 2 additions (81 s cut)

def _ticks(dur, r, fout=0.0):
    n = N(dur)
    y = np.zeros(n)
    for k in range(int(dur / 0.125)):
        L = N(0.03)
        f = 2400 if k % 8 == 0 else (1900 if k % 2 == 0 else 1750)
        c = np.sin(2 * np.pi * f * tax(L)) * np.exp(-tax(L) / 0.004) * attack(L, 0.0005)
        c += click(L, r, 4000, 5, 0.002) * 0.1
        add_at(y, c * (1.0 if k % 8 == 0 else 0.6), k * 0.125)
    return fade(y, 0, fout)


@sfx('buffering_ticks_long', 'Buffering spinner ticks, 12.0 s non-looping version (15.55 -> 27.55, stops just before '
     'the GOTV switch); same sound as buffering_tick_loop, 0.4 s fade-out.', 0.0, 'bed', -26)
def _(r):
    return _ticks(12.0, r, 0.4)


@sfx('tv_crowd_calm', 'Calm live match crowd on the TV speaker (mono), smooth and relaxed -- the background TV '
     'during the backgammon payoff. 5.2 s: 1.5 s fade-in, 0.6 s fade-out.', 0.0, 'bed', -22)
def _(r):
    dur = 5.2
    y = _stadium_bed(dur, r, np.full(N(dur), 0.3), count=24)
    m = tv_speaker(y, r, 1.2)
    return fade(m, 1.5, 0.6)


def _wood_hit(r, body=((230, 14, 0.8), (520, 12, 0.6), (980, 10, 0.4)), bright=((2600, 14, 1.0), (4300, 18, 0.7)),
              dur=0.25, hard=1.0, tau=0.0008):
    n = N(dur)
    ex = white(n, r) * np.exp(-tax(n) / tau)
    y = sum(reson(ex, f, q, a) for f, q, a in bright) * hard * 2.5
    y += sum(reson(ex, f, q, a) for f, q, a in body) * 2.0
    return y + ex * 0.15


@sfx('dice_roll', 'Backgammon dice thrown onto the wooden board: two dice bounce with shrinking gaps, tumble-rattle, '
     'clack against each other, settle. First landing = hit 0.0 s; settled by ~0.8 s. 1.3 s.', 0.0)
def _(r):
    dur = 1.3
    n = N(dur)
    y = np.zeros((2, n))
    for d, (t0, p) in enumerate([(0.0, -0.15), (0.035, 0.2)]):
        tt, gap, amp = t0, r.uniform(0.11, 0.14), 1.0
        for k in range(7):
            h = _wood_hit(r, hard=r.uniform(0.7, 1.2),
                          bright=((r.uniform(2300, 3000), 14, 1.0), (r.uniform(3900, 5200), 18, 0.7)))
            add_at(y, pan(h, p + r.uniform(-0.05, 0.05)), tt, amp)
            tt += gap
            gap *= 0.68
            amp *= 0.72
        # tumble/roll rattle
        rt = tt
        while rt < tt + 0.18:
            add_at(y, pan(_wood_hit(r, hard=0.6, dur=0.05), p), rt, amp * r.uniform(0.3, 0.6))
            rt += r.uniform(0.022, 0.035)
        add_at(y, pan(_wood_hit(r, hard=0.5), p), rt + 0.05, amp * 0.5)  # settle
    # dice clack into each other
    add_at(y, st(click(N(0.03), r, 5200, 10, 0.002)) * 0.35, 0.2)
    y = reverb(y, IR_room(), 0.25, tail=False)
    return y


@sfx('checker_clack', 'Backgammon checker slapped down on a point: hard wood-on-wood clack + board knock, tiny '
     'settle click. Hit 0.0 s. 0.5 s.', 0.0)
def _(r):
    n = N(0.5)
    y = np.zeros(n)
    add_at(y, _wood_hit(r, body=((180, 12, 1.0), (420, 12, 0.7), (760, 10, 0.4)),
                        bright=((1850, 9, 1.0), (3100, 11, 0.6)), dur=0.3, hard=1.2, tau=0.0006), 0)
    add_at(y, _wood_hit(r, dur=0.05, hard=0.5) * 0.25, 0.028)
    return reverb(y, IR_room(), 0.25, tail=False)


@sfx('case_open', 'Wooden backgammon case opened: two metal latches (click ... click, hit 0.02 / 0.20 s), a short '
     'hinge creak, lid lands open with a wooden thunk (0.95 s) and checkers rattle inside. 1.8 s.', 0.02)
def _(r):
    dur = 1.8
    n = N(dur)
    y = np.zeros((2, n))
    for (tm, p) in [(0.02, -0.25), (0.20, 0.25)]:
        L = N(0.25)
        ex = white(L, r) * np.exp(-tax(L) / 0.0006)
        c = reson(ex, 3600, 22) * 3 + reson(ex, 5900, 28) * 2 + reson(ex, 1400, 8) * 1.2 + ex * 0.2
        c += np.sin(2 * np.pi * 6200 * tax(L)) * np.exp(-tax(L) / 0.03) * 0.08  # spring tink
        add_at(y, pan(c, p), tm)
    # hinge creak: stick-slip impulse train
    cn = N(0.5)
    tc = tax(cn)
    rate = 70 + 60 * np.sin(np.pi * tc / 0.5) + 20 * slow_noise(cn, r, 8, -1, 1)
    ph = np.cumsum(rate / SR)
    imp = np.diff(np.floor(ph), prepend=0) * r.uniform(0.6, 1.0, cn)
    cr = reson(imp, 950, 12) + reson(imp, 1750, 14) * 0.7 + reson(imp, 2700, 16) * 0.4
    cr *= np.sin(np.pi * tc / 0.5) ** 0.7
    add_at(y, pan(cr * 1.5, 0.1), 0.40)
    # lid thunk + checker rattle
    th = _wood_hit(r, body=((140, 10, 1.0), (330, 10, 0.7), (700, 9, 0.4)), bright=((1900, 8, 0.5), (3000, 10, 0.3)),
                   dur=0.4, hard=0.8, tau=0.0015)
    add_at(y, st(th + thump(0.4, 120, 60, 0.05, 0.0, r) * 0.4), 0.95)
    for k in range(9):
        add_at(y, pan(_wood_hit(r, dur=0.05, hard=0.8), r.uniform(-0.4, 0.4)), 0.97 + abs(r.normal(0, 0.08)),
               r.uniform(0.1, 0.3))
    return reverb(y, IR_room(), 0.25, tail=False)


@sfx('gotv_switch', 'GOTV "switch activated" success: button click (hit 0.0 s), soft power-up sweep, rising D-major '
     'bell arpeggio, confirming chord at 0.34 s with warm low swell and a swirl of gold sparkle. 2.4 s.', 0.0)
def _(r):
    dur = 2.4
    n = N(dur)
    t = tax(n)
    y = np.zeros((2, n))
    add_at(y, st(click(N(0.04), r, 2800, 6, 0.002) * 0.6 + _wood_hit(r, dur=0.04, hard=0.3) * 0.2), 0)
    sw = np.sin(phase_of(300 * 4 ** np.clip(t / 0.3, 0, 1))) * env(n, [(0, 0), (0.05, 0.25), (0.3, 0.3), (0.4, 0)])
    y += st(sw * 0.4)
    bp_ = ((1, 1, 1.0), (2.0, 0.35, 0.5), (3.0, 0.15, 0.3), (4.2, 0.08, 0.2))
    for k, f in enumerate([587.3, 740.0, 880.0, 1174.7]):
        add_at(y, pan(bell(f, 1.2, r, bp_, decay=0.35), -0.4 + 0.27 * k), 0.06 + 0.07 * k, 0.45)
    ch = sum(bell(f, 2.0, r, bp_, decay=0.9) for f in [1174.7, 1480.0, 1760.0, 2349.3]) * 0.3
    add_at(y, np.vstack([ch, np.roll(ch, N(0.004))]), 0.34)
    pad = sum(np.sin(2 * np.pi * f * t) for f in [146.8, 220.0, 293.7]) * env(n, [(0, 0), (0.34, 0), (0.5, 0.12),
                                                                                    (1.4, 0.05), (2.4, 0)])
    y += st(pad * 0.5)
    for k in range(45):
        tm = 0.34 + abs(r.normal(0, 0.35))
        add_at(y, pan(bell(r.uniform(4000, 9500), 0.3, r, decay=0.07), np.sin(tm * 9)), tm,
               0.12 * np.exp(-(tm - 0.34) * 1.2))
    y += np.vstack([hp(pink(n, r), 6000), hp(pink(n, r), 6000)]) * 0.03 * env(n, [(0, 0), (0.34, 0), (0.45, 1), (2.2, 0)])
    return reverb(y, IR_hall(), 0.35, tail=False)


@sfx('error_bonk', 'Old-provider error: dull cheap two-tone "bonk-bonk" (descending buzzy square through the TV '
     'speaker) + a dead thunk. Mono. Hit 0.005 s; second bonk at 0.21 s. 0.8 s.', 0.005)
def _(r):
    n = N(0.8)
    y = np.zeros(n)
    for (tm, f, L) in [(0.005, 392, 0.16), (0.21, 277, 0.32)]:
        bn = N(L)
        tb = tax(bn)
        fb = f * (1 + 0.25 * np.exp(-tb / 0.012))
        b = (square(fb, None, 0.4) * 0.6 + np.sin(phase_of(fb)) * 0.6) * env(bn, [(0, 0), (0.004, 1), (L * 0.5, 0.7), (L, 0)])
        add_at(y, lp(b, 2500), tm)
    add_at(y, thump(0.3, 150, 70, 0.05, 0.2, r) * 0.5, 0.21)
    m = tv_speaker(y, r, 1.3)
    return reverb(m, IR_room(), 0.2, tail=False)[0]


@sfx('sleepy_tuba_wah', 'Comic deflating tuba "wuaaah..." for the sleepy buffering packet: one long low note sagging '
     'F2 -> C2 with a lazy widening wobble, closing wah and a deflating hiss/pfft. Hit 0.05 s. 2.2 s.', 0.05)
def _(r):
    dur = 2.2
    n = N(dur)
    t = tax(n)
    f = np.interp(t, [0, 0.3, 1.9, 2.2], [87.3, 90.0, 65.4, 62.0])
    f *= 1 + np.clip(t / 1.5, 0, 1) * 0.03 * np.sin(2 * np.pi * (4.5 - 1.5 * t / dur) * t)
    src = saw(f) * 0.8 + square(f, None, 0.45) * 0.2
    a = env(n, [(0, 0), (0.05, 1), (1.2, 0.8), (1.9, 0.4), (2.2, 0)])
    y = stft_shape(src * a, lpsweep(lambda tt: np.interp(tt, [0, 0.4, 2.2], [350, 900, 220]), 14), nper=2048)
    y = formant(y, 'o', 0.55) * 0.8 + y * 0.6
    hiss = bp(white(n, r), 1800, 6000) * env(n, [(0, 0), (0.8, 0), (1.3, 0.08), (2.0, 0.03), (2.2, 0)])
    pf = bp(white(n, r), 400, 3000) * env(n, [(0, 0), (1.95, 0), (1.98, 0.4), (2.15, 0)])
    y = sat(y * 1.3, 1.3) + hiss + pf
    return reverb(y, IR_tunnel(), 0.25, tail=False)


@sfx('packet_pant', 'Two little exhausted packets panting "hh-hh-hh" (tiny breathy voices, slightly out of step, '
     'L/R), arriving late. 3.6 s with fade-in 0.3 / fade-out 0.8.', 0.0)
def _(r):
    dur = 3.6
    n = N(dur)
    y = np.zeros((2, n))
    for (per, p, f0, sh) in [(0.27, -0.35, 520, 1.7), (0.33, 0.35, 440, 1.55)]:
        tt = r.uniform(0, 0.1)
        k = 0
        while tt < dur:
            out = (k % 2 == 0)
            L = r.uniform(0.09, 0.13) if out else r.uniform(0.07, 0.1)
            bn = N(L)
            br = white(bn, r)
            v = glottal(np.full(bn, f0 * (1.05 if out else 0.95)), bn, r, breath=0.6)
            src = br * 0.7 + v * (0.35 if out else 0.1)
            s = formant(src, 'ae' if out else 'e', sh) * (np.hanning(bn) ** 0.8)
            add_at(y, pan(hp(s, 500), p), tt, 1.0 if out else 0.55)
            tt += per * (0.45 if out else 0.55) + r.normal(0, 0.01)
            k += 1
    y = reverb(y, IR_room(), 0.2, tail=False)
    return fade(y, 0.3, 0.8)


# ----------------------------------------------------------------------------------------
# build / index
# ----------------------------------------------------------------------------------------
_BUILT = {}


def build(name, write=True):
    if name in _BUILT:
        x = _BUILT[name]
    else:
        spec = REG[name]
        r = rng_for(name)
        x = spec['fn'](r)
        x = finish(np.asarray(x, float), spec['kind'], spec['level'])
        _BUILT[name] = x
    if write:
        path = os.path.join(OUT, name + '.wav')
        data = x.T if x.ndim == 2 else x
        sf.write(path, data.astype(np.float32), SR, subtype='PCM_24')
    return x


def write_index():
    lines = ['# SFX library -- PACKET FROM HOME', '',
             'All sounds are synthesised procedurally by `audio/tools/sfx.py` (seeded, reproducible: '
             '`python3 audio/tools/sfx.py`). 48 kHz, 24-bit WAV.', '',
             '**Hit offset** = seconds from file start to the sync transient/peak. '
             'Place a cue at `t = sync_time - hit`.', '',
             '**Levels:** one-shots are peak-normalised to -1 dBFS; beds (kind = bed) are RMS-normalised '
             '(value in the table) and meant to be pulled down with `gain_db` in the cue sheet. '
             'Mono files should be panned with an equal-power pan; stereo files with a balance pan.', '',
             '| name | ch | dur (s) | hit (s) | kind / level | description |',
             '|---|---|---|---|---|---|']
    for name, spec in REG.items():
        p = os.path.join(OUT, name + '.wav')
        if not os.path.exists(p):
            continue
        info = sf.info(p)
        x, _ = sf.read(p)
        rms = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
        pk = 20 * np.log10(np.max(np.abs(x)) + 1e-12)
        kind = 'bed, RMS %.0f dBFS' % rms if spec['kind'] == 'bed' else 'one-shot, peak %.0f dBFS' % pk
        lines.append('| `%s` | %s | %.2f | %.3f | %s | %s |' % (
            name, 'st' if info.channels == 2 else 'mono', info.duration, spec['hit'], kind, spec['desc']))
    lines += ['', 'See `audio/cues/base.json` for how these are placed on the 60 s timeline; '
              'mixing notes are in the header of `audio/tools/preview_mix.py`.', '']
    with open(os.path.join(OUT, 'INDEX.md'), 'w') as f:
        f.write('\n'.join(lines))


def main(argv):
    os.makedirs(OUT, exist_ok=True)
    names = argv or list(REG)
    for nm in names:
        if nm not in REG:
            print('unknown', nm)
            continue
        x = build(nm)
        pk = 20 * np.log10(np.max(np.abs(x)) + 1e-12)
        rms = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
        print('%-24s %5.2fs %s peak %6.1f rms %6.1f' % (nm, x.shape[-1] / SR, 'st' if x.ndim == 2 else 'mo', pk, rms),
              flush=True)
    write_index()
    # also dump hit offsets as json for tools
    with open(os.path.join(OUT, 'hits.json'), 'w') as f:
        json.dump({k: v['hit'] for k, v in REG.items()}, f, indent=1)


if __name__ == '__main__':
    main(sys.argv[1:])
