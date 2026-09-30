#!/usr/bin/env python3
"""GOTV v7 - epic hybrid-orchestral ACTION ANTHEM (original).  python3 score_v7.py

Output: audio/v7/score_v7.wav (46.200 s, 48 kHz, stereo, 24-bit, peak -1.0 dBFS), stems in audio/v7/stems/,
audio/v7/score_v7_spectrogram.png, numeric report on stderr.

SOUND SOURCES (real recorded samples, rendered by the numpy sampler in sampler.py)
  * VSCO-2-CE (Versilian Studios, CC0) - github.com/sgossner/VSCO-2-CE (sparse checkout, see fetch_samples()):
    violin / viola / cello section spiccato + sustain-vibrato + tremolo, contrabass spiccato + sustain,
    french horns / trumpets / tenor trombones / tuba sustain + staccato, 5 timpani (principal tones measured),
    concert bass drum, orchestral snare + roll, crash + suspended-cymbal crescendos, gong, harp, upright piano.
  * Virtuosity Drums (CC0) - github.com/sfzinstruments/virtuosity_drums: kick / rimshot snare / hats / toms / crash,
    kick-mic + mid + room mics blended per hit, velocity layers + round robins.
  * GeneralUser GS (tinysoundfont) only where no samples exist: choir 'ah', shakuhachi-as-ney, glockenspiel, celesta.
  * numpy: taiko + trailer-drum bodies, sub booms, braaam synth layer, Karplus-Strong distorted power-chord guitar
    (double-tracked, amp + cab), supersaw anime lead, sub bass, darbuka, KS kanun, filtered-noise risers,
    generated convolution IRs (room + hall).

GRID / KEY (output clock T; VO holds: cin 11.79-13.19, tur 14.465-16.065, kor 16.94-18.54, ani 19.13-20.73)
  A   131.55 BPM  3.58 logo hit ... 11.79 braaam (18 beats)       D minor, hook phrase (Dm Bb F C|A)
  bridges on the beat at 13.19 / 16.065 / 18.54 (hook cell 'da-da DAAA' octave leap)
  B   129.61 BPM  20.73 ... 31.84 (24 beats): hook, library tick 22.9-24.4, lift 26.5, suspense on A 29.99-31.52
  C/D 131.87 BPM  DROP 31.84 on F major (chromatic-mediant lift), freeze 33.39-34.00, restart 34.00,
                  goal lift 35.1, button 36.50, TV-on 37.30, final cadence F 43.10 (downbeat), end card -> 46.2
Hook (horns + trumpets in octaves): D D D'(octave leap) C A | Bb A G F | F F F' E C | E D C A ; chorus in F major.
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

SMP = os.path.join(HERE, 'samples')
VS = os.path.join(SMP, 'vsco')
VD = os.path.join(SMP, 'vd', 'Samples')
SF2 = '/home/user/I/anim/audio/music/sf/GeneralUser-GS.sf2'
SR = 48000
DUR = 46.2
N = int(round(SR * DUR))
RNG = np.random.default_rng(7007)

HOLDS = [('cin', 11.79, 1.4), ('tur', 13.065, 1.6), ('kor', 13.94, 1.6), ('ani', 14.53, 1.6)]   # (k, v, d)
HOLD_T = {'cin': (11.79, 13.19), 'tur': (14.465, 16.065), 'kor': (16.94, 18.54), 'ani': (19.13, 20.73)}
T_SIL0, T_SIL1 = 31.52, 31.84
T_DROP = 31.84
T_FRZ0, T_FRZ1 = 33.39, 34.00
T_END = 43.10


def v2T(v, incl=False):
    return v + sum(d for _, hv, d in HOLDS if (hv <= v if incl else hv < v))


VLINES = [(0.10, 2.66), (3.00, 4.64), (4.97, 6.41), (6.69, 8.82), (9.02, 10.09), (10.20, 11.80), (12.00, 15.44),
          (15.79, 18.56), (18.80, 20.34), (20.68, 23.56), (24.01, 25.22), (25.64, 27.23), (27.19, 29.96),
          (30.12, 32.09), (32.05, 35.25), (35.21, 36.90)]
LINES = []
for a, b in VLINES:
    pts = [a] + [hv for _, hv, _ in HOLDS if a < hv < b] + [b]
    for i in range(len(pts) - 1):
        s = v2T(pts[i], incl=i > 0)
        e = v2T(pts[i + 1])
        if e - s > 0.05:
            LINES.append((s, e))


def speaking(t, pad=0.05):
    return any(a - pad < t < b + pad for a, b in LINES)


def in_hold(t):
    return any(a <= t < b for a, b in HOLD_T.values())


# ----------------------------------------------------------------------------------------------
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


class Grid:
    def __init__(self, t0, b):
        self.t0, self.b = t0, b

    def __call__(self, beat):
        return self.t0 + beat * self.b


BA = 8.21 / 18          # 131.55 BPM
BB = 11.11 / 24         # 129.61 BPM
BC = 9.1 / 20           # 131.87 BPM
GA = Grid(3.58, BA)
GB1, GB2, GB3 = Grid(13.19, BA), Grid(16.065, BA), Grid(18.54, BA)
GS = Grid(20.73, BB)
GC = Grid(T_DROP, BC)
GD = Grid(T_FRZ1, BC)


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


# ---- GM (tinysoundfont) -----------------------------------------------------------------------
_TSF = None


def tsf_synth():
    global _TSF
    if _TSF is None:
        import tinysoundfont as tsf
        s = tsf.Synth(samplerate=SR, gain=-6)
        _TSF = (s, s.sfload(SF2))
    return _TSF


class GMEngine:
    def __init__(self, prog, bank=0, bendrange=2):
        self.prog, self.bank, self.br = prog, bank, bendrange

    def render(self, p, notes):
        s, sfid = tsf_synth()
        ch = 0
        s.sounds_off()
        s.program_select(ch, sfid, self.bank, self.prog, False)
        for c, v in ((7, 127), (11, 127), (10, 64), (1, 0), (64, 0)):
            s.control_change(ch, c, v)
        s.pitchbend_range(ch, self.br)
        s.pitchbend(ch, 8192)
        ev = []
        for t, d, n, v, kw in notes:
            ev.append((int(round(t * SR)), 1, int(round(n)), v))
            ev.append((int(round((t + d) * SR)), 0, int(round(n)), 0))
        for t, kind, a, b in p.ctl:
            ev.append((int(round(t * SR)), 2 if kind == 'cc' else 3, a, b))
        ev.sort(key=lambda e: (e[0], e[1]))
        out = np.zeros((N, 2), np.float32)
        pos = 0
        for smp, typ, a, b in ev:
            smp = min(max(smp, pos), N)
            if smp > pos:
                out[pos:smp] = np.frombuffer(s.generate(smp - pos), np.float32).reshape(-1, 2)
                pos = smp
            if typ == 1:
                s.noteon(ch, a, b)
            elif typ == 0:
                s.noteoff(ch, a)
            elif typ == 2:
                s.control_change(ch, a, b)
            else:
                s.pitchbend(ch, int(np.clip(8192 + a / self.br * 8192, 0, 16383)))
        if pos < N:
            out[pos:] = np.frombuffer(s.generate(N - pos), np.float32).reshape(-1, 2)
        s.sounds_off()
        s.generate(SR // 4)
        return out.astype(np.float64)


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
                fs = 45 * (1 + 0.6 * np.exp(-tt / 0.06))
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
            f0, f1 = kw.get('f0', 90), max(40, kw.get('f1', 40))
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
        f = 92 * (1 + 0.35 * np.exp(-t / 0.018)) * rng.uniform(0.98, 1.02)
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
ney = part('ney', 'choir', GMEngine(77), pan=-0.2, hall=0.5)
glock = part('glock', 'choir', GMEngine(9), pan=0.3, hall=0.4)
celesta = part('celesta', 'choir', GMEngine(8), pan=0.3, width=1.2, hall=0.45)

# balance trims (dB) from per-part analysis (see report)
TRIM = dict(taiko=-14, trailer=-7, sub=-13, gtr=-15, kick=-2, snare=4, hh=9, hho=6, crash=2, tomh=4, toml=4, snc=2,
            vc_sp=7, vla_sp=10, vln_sp=9, cb_sp=12, vln_su=15, vla_su=3, vc_su=6, cb_su=7, vln_tr=3, vc_tr=3,
            hn_su=8, hn_st=9, tp_su=4, tp_st=10, tb_su=9, tb_st=9, tu_su=10, tu_st=13, choir=17, oohs=15,
            timp=10, ocym=5, gong=3, riser=-3, boom=-10, braaam=-4, harp=14, celesta=10, glock=16, piano=2,
            ney=12, kanun=2, darb=-4, tamb=10, oroll=3, bd=2)
for _k, _db in TRIM.items():
    PARTS[_k].gain *= 10 ** (_db / 20)

# ----------------------------------------------------------------------------------------------
# Harmony + hook
# ----------------------------------------------------------------------------------------------
QUAL = {'m': [0, 3, 7], 'M': [0, 4, 7]}
CHORD = {'Dm': (2, 'm'), 'Bb': (10, 'M'), 'F': (5, 'M'), 'C': (0, 'M'), 'A': (9, 'M'), 'Gm': (7, 'm'),
         'D': (2, 'M'), 'Eb': (3, 'M'), 'Am': (9, 'm')}


def ct(ch):
    r, q = CHORD[ch]
    return r, [(r + i) % 12 for i in QUAL[q]]


def near(pc, lo):
    """lowest midi >= lo with pitch class pc."""
    x = int(lo)
    while x % 12 != pc:
        x += 1
    return x


HOOK_MIN = [(0, .75, 'D4'), (.75, .25, 'D4'), (1, 1.5, 'D5'), (2.5, .5, 'C5'), (3, 1, 'A4'),
            (4, .75, 'Bb4'), (4.75, .25, 'A4'), (5, 1, 'G4'), (6, 2, 'F4'),
            (8, .75, 'F4'), (8.75, .25, 'F4'), (9, 1.5, 'F5'), (10.5, .5, 'E5'), (11, 1, 'C5'),
            (12, .75, 'E5'), (12.75, .25, 'D5'), (13, 1, 'C5'), (14, 2, 'A4')]
HOOK_MAJ = [(0, .75, 'F4'), (.75, .25, 'F4'), (1, 1.5, 'F5'), (2.5, .5, 'E5'), (3, 1, 'C5'),
            (4, .75, 'E5'), (4.75, .25, 'D5'), (5, 1, 'C5'), (6, 2, 'G4'),
            (8, .75, 'A4'), (8.75, .25, 'A4'), (9, 1.5, 'A5'), (10.5, .5, 'G5'), (11, 1, 'F5'),
            (12, .75, 'D5'), (12.75, .25, 'C5'), (13, 1, 'Bb4'), (14, 1, 'C5'), (15, 1, 'E5'),
            (16, .75, 'Bb4'), (16.75, .25, 'C5'), (17, 1, 'D5'), (18, .75, 'E5'), (18.75, .25, 'F5'), (19, 1, 'G5')]


def brass_line(g, b0, line, vel, beats=(-99, 99), parts=('hn', 'tp'), hn_oct=-12, tp_oct=0, legato=1.0):
    """hook in horns (octave below) + trumpets; long notes -> sustain samples, short -> staccato samples."""
    for b, d, n_ in line:
        if not (beats[0] <= b < beats[1]):
            continue
        t = g(b0 + b) + hum(4)
        dur = g.b * d * (legato if d >= .75 else 0.9)
        v = vel + (6 if d >= 1 else 0) + rv(-3, 3)
        for pn, octv in (('hn', hn_oct), ('tp', tp_oct)):
            if pn not in parts:
                continue
            nn = m(n_) + octv
            if d >= .75:
                PARTS[pn + '_su'].n(t, dur, nn, v)
            else:
                PARTS[pn + '_st'].n(t, dur, nn, v - 4)


def ost(g, b0, beats, ch, lvl=1.0, layers=('vc', 'cb', 'vla', 'vln'), vln_lo='D5'):
    """driving 16th spiccato ostinato with 3-3-2 accents."""
    r, pcs = ct(ch)
    acc = {0, 3, 6, 8, 11, 14}
    for i in range(int(round(beats * 4))):
        bt = b0 + i / 4
        t = g(bt) + hum(3)
        p16 = i % 16
        a = p16 in acc
        v = (108 if a else 74) * lvl
        if 'vc' in layers:
            root = near(r, m('C3'))
            nn = root + (12 if p16 in (7, 15) else (7 if p16 == 10 else 0))
            vc_sp.n(t, g.b / 4 * 0.9, nn, v + rv(-4, 4))
        if 'cb' in layers and a:
            cb_sp.n(t, g.b / 4 * 0.95, near(r, m('C2')), v + 2 + rv(-3, 3))
        if 'vla' in layers:
            seq = [pcs[2], pcs[0], pcs[1], pcs[0]]
            vla_sp.n(t, g.b / 4 * 0.85, near(seq[i % 4], m('G3')), v - 8 + rv(-4, 4))
        if 'vln' in layers:
            seq = [pcs[0] + 12, pcs[2], pcs[1], pcs[2]]
            base = m(vln_lo)
            vln_sp.n(t, g.b / 4 * 0.85, near(seq[i % 4] % 12, base), v - 12 + rv(-4, 4))


def pads(t0, t1, ch, lvl=80, strings=True, choir_on=False, low=True, ex=None):
    r, pcs = ct(ch)
    d = t1 - t0
    if strings:
        vln_su.n(t0, d, [near(pcs[1], m('A4')), near(pcs[0], m('D5'))], lvl)
        vla_su.n(t0, d, [near(pcs[2], m('F3')), near(pcs[0], m('C4'))], lvl)
        if low:
            vc_su.n(t0, d, near(r, m('C3')), lvl)
            cb_su.n(t0, d, near(r, m('C2')), lvl - 4)
    if choir_on:
        choir.n(t0, d, [near(pcs[0], m('D4')), near(pcs[1], m('F4')), near(pcs[2], m('A4'))], lvl)


def kit_bar(g, b0, style, lvl=1.0, beats=4, fill_from=None):
    for i in range(int(beats * 4)):
        bt = b0 + i / 4
        if fill_from is not None and bt >= fill_from:
            break
        t = g(bt) + hum(2.5)
        p = i % 16
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
                hho.n(t, g.b * 0.4, 60, 90 * lvl)
            else:
                hh.n(t, 0.08, 60, [100, 52, 76, 58][p % 4] * lvl + rv(-5, 5))
        elif style == 'build':
            if p % 4 == 0:
                kick.n(t, 0.3, 60, 112 * lvl)
            if p in (4, 12):
                snare.n(t, 0.3, 60, 116 * lvl)
            hh.n(t, 0.08, 60, [90, 50, 70, 50][p % 4] * lvl + rv(-5, 5))


def taiko_pat(g, b0, beats, style='A', lvl=1.0):
    pats = {'A': [(0, 124), (1.75, 96), (2, 112), (3.5, 100)],
            'C': [(0, 124), (0.75, 90), (1.5, 104), (2, 118), (2.75, 90), (3, 100), (3.5, 110)],
            '8': [(i / 2, 118 if i % 2 == 0 else 96) for i in range(8)]}[style]
    for bar in range(int(np.ceil(beats / 4))):
        for off, v in pats:
            bt = b0 + bar * 4 + off
            if bt < b0 + beats - 1e-6:
                taiko.n(g(bt) + hum(3), 0.5, 60 if off % 1 == 0 else 64, v * lvl + rv(-4, 4))


def lowbrass_stab(t, ch, vel=110, dur=0.18):
    r, pcs = ct(ch)
    tb_st.n(t, dur, [near(r, m('A#1')), near(pcs[2], m('F2')), near(r, m('A#2'))], vel)
    tu_st.n(t, dur, near(r, m('A#0')), vel)


def tutti_hit(t, ch, big=1.0, dur=0.45, crash_on=True):
    r, pcs = ct(ch)
    v = int(min(127, 124 * big))
    hn_su.n(t, dur, [near(r, m('C4')), near(pcs[1], m('C4')), near(pcs[2], m('C4'))], v)
    tp_su.n(t, dur, [near(pcs[1], m('F4')), near(r, m('A4'))], v)
    tb_su.n(t, dur, [near(r, m('A#1')), near(pcs[2], m('F2')), near(r, m('A#2'))], v)
    tu_su.n(t, dur, near(r, m('A#0')), v)
    vln_su.n(t, dur, [near(r, m('D5')), near(pcs[1], m('D5'))], v)
    vla_su.n(t, dur, near(pcs[2], m('F3')), v)
    vc_su.n(t, dur, near(r, m('C3')), v)
    cb_su.n(t, dur, near(r, m('C2')), v)
    timp.n(t, 1.0, near(r, m('C#2')) if near(r, m('C#2')) <= 45 else near(r, m('F#1')), v)
    trailer.n(t, 1.5, 58, v)
    bd.n(t, 2.0, 60, v)
    boom.n(t, 1.6, 60, int(100 * big), f0=85, f1=30)
    if crash_on:
        ocym.n(t, 3.0, 60, v)
        crash.n(t + 0.004, 2.0, 60, v)


# ----------------------------------------------------------------------------------------------
# Sections
# ----------------------------------------------------------------------------------------------
def intro():
    g = GA
    # bar -2 (-0.07) and bar -1 (1.76): low pulse, cellos 8ths building, horn tease of the cell, riser into 3.58
    trailer.n(0.02, 1.5, 58, 96)
    boom.n(0.02, 1.8, 60, 70, f0=70, f1=30)
    vc_su.n(0.02, 3.5, 'D2', 70)
    cb_su.n(0.02, 3.5, 'D2', 72)
    vc_su.ex(0.0, 3.55, -10, 0)
    for i in range(14):
        bt = -7.5 + i / 2
        vc_sp.n(g(bt) + hum(3), g.b * 0.4, 'D3', 70 + 3 * i)
        if i % 2 == 1:
            vla_sp.n(g(bt) + hum(3), g.b * 0.4, 'A3', 58 + 3 * i)
    for i in range(8):                        # 16ths in the last bar
        bt = -2 + i / 4
        vc_sp.n(g(bt), g.b / 4 * 0.9, 'D3', 88 + 3 * i)
        vla_sp.n(g(bt), g.b / 4 * 0.9, ['A3', 'D4', 'F4', 'D4'][i % 4], 80 + 3 * i)
    for bt in (-8, -6, -4, -3, -2, -1.5, -1, -0.5):
        if g(bt) > 0.3:
            taiko.n(g(bt), 0.5, 60, 80 + int(6 * (bt + 8)))
    # horns tease the hook cell (mp)
    for b, d, n_ in [(-4, .75, 'D3'), (-3.25, .25, 'D3'), (-3, 1.5, 'D4'), (-1.5, .5, 'C4'), (-1, 1, 'A3')]:
        (hn_su if d >= .75 else hn_st).n(g(b), g.b * d, n_, 84)
    for i in range(8):
        snc.n(g(-2 + i / 4), 0.1, 60, 40 + 9 * i)
    for i in range(8):
        snc.n(g(-0.5 + i / 16), 0.08, 60, 90 + 4 * i)
    riser.n(1.7, 3.58 - 1.7, 60, 90, kind='noise', lo=250, hi=9000, n0=38)
    riser.n(3.58, 1.8, 60, 110, kind='cym', len='s')
    tb_su.n(g(-2), 2 * g.b, ['D2', 'A2'], 90)
    tb_su.ex(g(-2), g(0) - 0.02, -14, 0, 1.5)


def sectionA():
    g = GA
    tutti_hit(3.58, 'Dm', 1.0, dur=0.5)
    prog = [(0, 4, 'Dm'), (4, 4, 'Bb'), (8, 4, 'F'), (12, 2, 'C'), (14, 2, 'A'), (16, 2, 'Dm')]
    for b0, d, ch in prog:
        ost(g, b0, d, ch, lvl=0.85, layers=('vc', 'cb', 'vla') if b0 < 8 else ('vc', 'cb', 'vla', 'vln'))
        pads(g(b0), g(b0 + d) - 0.02, ch, lvl=66, strings=True, low=False)
        r, _ = ct(ch)
        sub.n(g(b0), g.b * d - 0.05, near(r, m('E1')), 88)
    for bar in range(4):
        kit_bar(g, bar * 4, 'half', 0.92, fill_from=15.5 if bar == 3 else None)
        taiko_pat(g, bar * 4, 4, 'A', 0.9)
    kit_bar(g, 16, 'build', 1.0, beats=2)
    # hook phrase on horns (+ trumpets from bar 2) under the voice
    brass_line(g, 0, HOOK_MIN, 92, beats=(0, 8), parts=('hn',), hn_oct=-12)
    brass_line(g, 0, HOOK_MIN, 96, beats=(8, 16), parts=('hn', 'tp'), hn_oct=-12, tp_oct=0)
    # Netflix 7.02 : push accent (a of 4 in bar 1 = 7.001)
    t = g(7.75)
    lowbrass_stab(t, 'F', 112)
    taiko.n(t, 0.5, 60, 118)
    crash.n(t, 1.5, 60, 96)
    # sports 9.0 : stadium hit on bar 3 downbeat (9.05) + gong-less crash, big drums
    t = g(12)
    lowbrass_stab(t, 'C', 118)
    trailer.n(t, 1.2, 58, 118)
    ocym.n(t, 2.0, 60, 100)
    for i in range(8):
        taiko.n(g(12 + i / 2), 0.4, 60 if i % 2 == 0 else 66, 104 + 2 * i)
    for i in range(4):
        tomh.n(g(15 + i / 4), 0.3, 60, 90 + 8 * i) if i % 2 == 0 else toml.n(g(15 + i / 4), 0.3, 60, 94 + 8 * i)
    # bar 4 (10.88-11.79): 2 beats Dm, build: low brass 'da-da-da' + snare into the braaam
    for bt, v in [(16, 100), (16.75, 104), (17.25, 110), (17.5, 116)]:
        lowbrass_stab(g(bt), 'Dm', v, 0.14)
    for i in range(8):
        snc.n(g(16 + i / 4), 0.08, 60, 60 + 8 * i)
    vln_sp.n(g(17), g.b * 0.9, ['D5', 'A5'], 100)


def cin():
    t0, t1 = HOLD_T['cin']
    # BRAAAM: low brass cluster (samples) + synth layer, trailer drum, gong, sub boom
    for pp, ns, v in [(tb_su, ['D2', 'A2', 'D3'], 127), (tu_su, ['D1', 'D2'], 127), (hn_su, ['D3', 'A3', 'D4'], 124)]:
        pp.n(t0, 0.95, ns, v)
    braaam.n(t0, 0.95, 'D1', 118)
    braaam.n(t0, 0.95, 'A1', 90)
    trailer.n(t0, 2.0, 55, 127)
    boom.n(t0, 2.0, 60, 120, f0=95, f1=28)
    gong.n(t0 + 0.01, 3.0, 60, 118)
    bd.n(t0, 2.0, 60, 124)
    ocym.n(t0, 2.0, 60, 110)
    # timpani roll crescendo on D (real hits, alternating round robins)
    tt = t0 + 0.12
    while tt < 13.17:
        u = (tt - t0) / (13.17 - t0)
        timp.n(tt + hum(3), 0.12, 'D2', int(40 + 80 * u ** 1.3))
        tt += 0.052
    # choir swell (dark D minor) and low strings, then the hush
    choir.cc(t0, 11, 30)
    choir.n(t0 + 0.2, 13.19 - t0 - 0.2, ['D3', 'A3', 'D4', 'F4', 'A4'], 110)
    choir.expr(t0 + 0.2, 13.15, 30, 127, 1.6)
    oohs.cc(t0, 11, 20)
    oohs.n(t0 + 0.3, 13.19 - t0 - 0.3, ['D5', 'F5'], 90)
    oohs.expr(t0 + 0.3, 13.15, 20, 118, 1.8)
    vc_tr.n(t0 + 0.1, 13.19 - t0 - 0.1, ['D3', 'A3'], 100)
    cb_su.n(t0 + 0.1, 13.19 - t0 - 0.1, 'D2', 100)
    vc_tr.ex(t0, 13.15, -12, 0, 1.5)
    riser.n(12.72, 0.8, 60, 90, kind='cym', len='s')
    trailer.n(12.72, 1.0, 55, 118)
    boom.n(12.72, 1.0, 60, 100, f0=80, f1=30)
    # NO hush (client: it felt like the end of the film). Instead a forward-driving pickup into the bridge at 13.19:
    # string spiccato run accelerating (16ths then 32nds) up the D minor scale + snare roll crescendo, landing on 13.19.
    run = ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5']
    ts = [12.73, 12.845, 12.96, 13.075] + [13.075 + 0.0575 * k for k in range(1, 4)] + [13.19 - 0.02]
    for k, (tk, nt) in enumerate(zip(ts, run)):
        v = int(78 + 6 * k)
        vln_sp.n(tk, 0.1, [nt, run[min(k + 2, 7)]], v)
        vla_sp.n(tk, 0.1, nt, v - 6)
        vc_sp.n(tk, 0.1, 'D3' if k % 2 == 0 else 'A3', v - 4)
    tt = 12.72
    while tt < 13.17:
        u = (tt - 12.72) / 0.45
        snc.n(tt, 0.05, 60, int(38 + 80 * u ** 1.4))
        tt += 0.038


def bridge(g, cell_root, ch, beats, tp=True):
    ost(g, 0, beats, ch, lvl=0.95)
    kit_bar(g, 0, 'drive', 0.95, beats=beats)
    taiko_pat(g, 0, beats, 'C', 0.95)
    r, _ = ct(ch)
    sub.n(g(0), g.b * beats - 0.05, near(r, m('E1')), 92)
    crash.n(g(0), 1.5, 60, 100)
    pads(g(0), g(beats) - 0.03, ch, lvl=76)


def bridges():
    # B1 13.19 (2.8 beats): D D D' cell on horns + trumpets, into the Turkish sting at 14.465
    g = GB1
    bridge(g, 'D4', 'Dm', 2.75)
    brass_line(g, 0, [(0, .75, 'D4'), (.75, .25, 'D4'), (1, 1.5, 'D5')], 104, parts=('hn', 'tp'))
    tutti_hit(13.19, 'Dm', 0.9, dur=0.3, crash_on=True)
    # B2 16.065 (1.9 beats): the cell on F
    g = GB2
    bridge(g, 'F4', 'F', 1.9)
    brass_line(g, 0, [(0, .75, 'F4'), (.75, .25, 'F4'), (1, 0.85, 'F5')], 104, parts=('hn', 'tp'))
    lowbrass_stab(16.065, 'F', 116)
    trailer.n(16.065, 1.0, 58, 110)
    # B3 18.54 (1.3 beats): fast cell on A into the anime sting
    g = GB3
    ost(g, 0, 1.25, 'A', 1.0)
    kit_bar(g, 0, 'drive', 1.0, beats=1.25)
    for t_, n_, d, st in [(18.54, 'A4', 0.2, True), (18.77, 'A4', 0.1, True), (18.88, 'A5', 0.25, False)]:
        (tp_st if st else tp_su).n(t_, d, n_, 110)
        (hn_st if st else hn_su).n(t_, d, m(n_) - 12, 108)
    lowbrass_stab(18.54, 'A', 116)
    taiko.n(18.54, 0.5, 60, 120)
    for i in range(4):
        snare.n(18.88 + i * 0.06, 0.1, 60, 90 + 8 * i)


def tur():
    t0, t1 = HOLD_T['tur']
    # zoom-hit at the start: timp + low strings sfz + low brass + darbuka doum + crash
    timp.n(t0, 1.0, 'D2', 127)
    lowbrass_stab(t0, 'Dm', 124, 0.3)
    vc_su.n(t0, 0.3, ['D2', 'D3'], 124)
    cb_su.n(t0, 0.3, 'D2', 124)
    darb.n(t0, 0.3, 60, 127, kind='doum')
    ocym.n(t0, 1.5, 60, 104)
    riser.n(t0 - 0.35, 0.36, 60, 70, kind='noise', lo=600, hi=12000, n0=50, oct=3)
    # dramatic string tremolo (D Hijaz colour: D-Eb-F#-G-A-Bb-C), swelling
    vln_tr.n(t0 + 0.08, t1 - t0 - 0.12, ['A4', 'D5', 'F#5'], 110)
    vc_tr.n(t0 + 0.08, t1 - t0 - 0.12, ['D3', 'A3'], 108)
    vln_tr.ex(t0, t0 + 0.5, -14, -4, post=False)
    vln_tr.ex(t0 + 0.5, t1 - 0.05, -4, 0, pre=False)
    vc_tr.ex(t0, t1 - 0.05, -10, 0)
    # ney: mournful Hijaz line with scoops + vibrato
    ney.cc(t0, 11, 110)
    ln = [(14.62, 'A4', 0.28, 90), (14.9, 'Bb4', 0.1, 92), (15.0, 'A4', 0.12, 88), (15.12, 'G4', 0.12, 86),
          (15.24, 'F#4', 0.2, 88), (15.44, 'Eb4', 0.16, 86), (15.6, 'D4', 0.45, 84)]
    for t, n_, d, v in ln:
        ney.n(t, d, n_, v)
    ney.bend(14.6, -0.7)
    for i in range(8):
        ney.bend(14.62 + i * 0.012, -0.7 + 0.7 * (i + 1) / 8)
    for i in range(24):
        tt = 15.62 + i * 0.018
        ney.bend(tt, 0.14 * np.sin(2 * np.pi * 5.5 * (tt - 15.62)))
    ney.bend(16.06, 0)
    # "Neden?!" at +0.5 (14.965): dramatic accent
    timp.n(14.965, 0.8, 'A1', 120)
    darb.n(14.965, 0.3, 60, 124, kind='doum')
    lowbrass_stab(14.965, 'A', 118, 0.2)
    ocym.n(14.965, 1.2, 60, 90)
    # darbuka dramatic figure + kanun tremolo run answering the ney
    for tt, k, v in [(14.7, 'tek', 90), (14.78, 'tek', 70), (15.2, 'doum', 110), (15.33, 'tek', 88),
                     (15.45, 'tek', 80), (15.7, 'doum', 116), (15.78, 'tek', 84), (15.86, 'tek', 94), (15.94, 'tek', 104)]:
        darb.n(tt, 0.2, 60, v, kind=k)
    run = ['D6', 'C6', 'Bb5', 'A5', 'G5', 'F#5', 'Eb5', 'D5']
    for i, n_ in enumerate(run):
        for k in range(2):
            kanun.n(15.42 + i * 0.07 + k * 0.035, 0.05, n_, 96 - 3 * i)
    kanun.n(15.98, 0.3, ['D5', 'A5'], 100)


def kor():
    t0, t1 = HOLD_T['kor']
    # K-drama ballad: warm Bbmaj7 -> C, upright piano phrase + soft strings; bubble '사랑해요' at +0.3 (17.24)
    for i, n_ in enumerate(['Bb2', 'F3', 'A3', 'D4']):
        piano.n(t0 + 0.02 + i * 0.045, 1.2, n_, 64 + 3 * i)
    for i, n_ in enumerate(['C3', 'G3', 'E4']):
        piano.n(17.86 + i * 0.045, 0.75, n_, 62 + 3 * i)
    mel = [(17.24, 'A5', 0.3, 80), (17.52, 'G5', 0.2, 70), (17.7, 'F5', 0.16, 68), (17.86, 'C6', 0.6, 78)]
    for t, n_, d, v in mel:
        piano.n(t, d, n_, v)
        piano.n(t + 0.004, d, m(n_) - 12, v - 22)
    celesta.n(17.24, 0.5, ['A6', 'D7'], 60)
    vln_su.n(t0 + 0.05, 0.92, ['D5', 'F5'], 70)
    vln_su.n(17.86, 0.62, ['E5', 'G5'], 72)
    vla_su.n(t0 + 0.05, 0.92, 'A3', 64)
    vla_su.n(17.86, 0.62, 'C4', 64)
    vc_su.n(t0 + 0.05, 0.92, 'Bb2', 70)
    vc_su.n(17.86, 0.62, 'C3', 70)
    for p_ in (vln_su, vla_su, vc_su):
        p_.ex(t0, t0 + 0.4, -12, -3, post=False)
        p_.ex(18.2, t1 - 0.02, -3, -12, pre=False)
    harp.n(17.86, 0.6, ['C5', 'G5', 'C6'], 56)


def ani():
    t0, t1 = HOLD_T['ani']
    b = 60 / 184
    g = Grid(t0, b)
    hit = 20.43
    # fast punk-rock drums
    crash.n(t0, 1.5, 60, 118)
    k = 0
    while g(k / 2) < hit - 0.2:
        t = g(k / 2)
        kick.n(t, 0.2, 60, 116 if k % 2 == 0 else 100)
        if k % 2 == 1:
            snare.n(t, 0.2, 60, 118)
        hh.n(t, 0.05, 60, 96 if k % 2 == 0 else 80)
        k += 1
    for i in range(6):
        (snare if i % 2 == 0 else tomh).n(hit - 0.3 + i * 0.05, 0.1, 60, 96 + 5 * i)
    # distorted power chords D5 | Bb5 C5 | D5
    for t, n_, d, pm in [(t0, 'D3', 0.16, True), (g(0.5), 'D3', 0.16, True), (g(1), 'D3', 0.16, True),
                         (g(1.5), 'D3', 0.3, False), (g(2), 'Bb2', 0.5, False), (g(3), 'C3', 0.5, False),
                         (g(3.5), 'C3', 0.2, True)]:
        gtr.n(t, d, n_, 118, pm=pm)
    gtr.n(hit, 0.3, 'D3', 124)
    # bright synth lead fanfare (enters on the 'sugoi' bubble 19.38)
    for t, n_, d in [(19.38, 'A5', 0.15), (19.55, 'D6', 0.15), (19.72, 'E6', 0.12), (19.86, 'F#6', 0.3),
                     (20.2, 'E6', 0.1), (20.3, 'F#6', 0.1), (hit, 'A6', 0.26)]:
        lead.n(t, d, n_, 110)
    sub.n(t0, g(2) - t0 - 0.02, 'D1', 100)
    sub.n(g(2), b - 0.02, 'Bb0', 100)
    sub.n(g(3), b - 0.02, 'C1', 100)
    # big final hit: D major tutti
    for pp, ns in [(tp_st, ['F#4', 'A4', 'D5']), (hn_st, ['D4', 'F#4', 'A4']), (tb_st, ['D2', 'A2', 'D3']), (tu_st, ['D1'])]:
        pp.n(hit, 0.25, ns, 124)
    vln_sp.n(hit, 0.2, ['D5', 'F#5', 'A5', 'D6'], 124)
    trailer.n(hit, 1.2, 58, 127)
    boom.n(hit, 1.0, 60, 110, f0=90, f1=35)
    choir.cc(hit - 0.01, 11, 120)
    choir.n(hit, 0.3, ['D4', 'F#4', 'A4', 'D5'], 120)
    bd.n(hit, 1.0, 60, 124)
    crash.n(hit, 1.5, 60, 124)
    ocym.n(hit, 1.5, 60, 110)
    glock.n(hit, 0.4, ['D6', 'A6'], 90)


def sectionB():
    g = GS
    tutti_hit(20.73, 'Dm', 0.9, dur=0.35, crash_on=True)
    prog = [(0, 4, 'Dm'), (4, 4, 'Bb'), (8, 4, 'F'), (12, 2, 'Gm'), (14, 2, 'Bb'), (16, 2, 'C'), (18, 2, 'Eb')]
    for b0, d, ch in prog:
        lift = b0 >= 12
        ost(g, b0, d, ch, lvl=0.88 if not lift else 1.0, layers=('vc', 'cb', 'vla', 'vln'))
        r, _ = ct(ch)
        sub.n(g(b0), g.b * d - 0.05, near(r, m('E1')), 92)
        if not lift:
            pads(g(b0), g(b0 + d) - 0.02, ch, lvl=64, low=False)
    brass_line(g, 0, HOOK_MIN, 94, beats=(0, 12), parts=('hn', 'tp'))
    for bar in range(3):
        kit_bar(g, bar * 4, 'half', 0.92)
        taiko_pat(g, bar * 4, 4, 'A', 0.9)
    # library ticking 22.9-24.4: clock ticks (high staccato violins + closed hat), 8ths
    t = 22.9
    i = 0
    while t < 24.4:
        vln_sp.n(t, 0.08, 'A6' if i % 2 == 0 else 'E6', 70 if i % 2 == 0 else 58)
        hh.n(t, 0.05, 60, 80 if i % 2 == 0 else 60)
        i += 1
        t = 22.9 + i * g.b / 2
    glock.n(24.4, 0.5, ['A6', 'D7'], 70)
    # LIFT 26.5: drive, rising strings, choir + brass swell (Gm Bb | C Eb)
    for bar in (3, 4):
        kit_bar(g, bar * 4, 'drive', 1.0, fill_from=19 if bar == 4 else None)
        taiko_pat(g, bar * 4, 4, '8', 0.95)
    crash.n(g(12), 1.8, 60, 110)
    line = ['G4', 'A4', 'Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'A5', 'Bb5', 'C6', 'D6', 'Eb6', 'F6', 'G6', 'A6']
    for i, n_ in enumerate(line):
        vln_su.n(g(12 + i / 2) + hum(3), g.b / 2 * 1.05, n_, 90 + i)
    vln_su.ex(g(12), g(20), -8, 0)
    for b0, d, ch in [(12, 2, 'Gm'), (14, 2, 'Bb'), (16, 2, 'C'), (18, 2, 'Eb')]:
        r, pcs = ct(ch)
        hn_su.n(g(b0) + 0.01, g.b * d - 0.03, [near(pcs[1], m('F3')), near(pcs[2], m('A3'))], 100)
        tb_su.n(g(b0) + 0.01, g.b * d - 0.03, [near(r, m('A#1')), near(pcs[2], m('F2'))], 96)
        vc_su.n(g(b0), g.b * d - 0.02, near(r, m('C3')), 96)
        cb_su.n(g(b0), g.b * d - 0.02, near(r, m('C2')), 96)
        choir.n(g(b0), g.b * d - 0.02, [near(pcs[0], m('D4')), near(pcs[1], m('F4')), near(pcs[2], m('A4'))], 96)
    choir.cc(g(12) - 0.1, 11, 50)
    choir.expr(g(12), g(20), 50, 118, 1.2)
    hn_su.ex(g(12), g(20), -8, 0)
    riser.n(g(16), g(20) - g(16), 60, 80, kind='noise', lo=300, hi=8000, n0=43)
    for i in range(4):
        snare.n(g(19 + i / 4), 0.15, 60, 90 + 9 * i)
    gtr_on = [(12, 'G2'), (14, 'Bb2'), (16, 'C3'), (18, 'Eb3')]
    for b0, n_ in gtr_on:
        for k in range(4):
            gtr.n(g(b0 + k / 2), g.b * 0.45, n_, 96 if k else 110, pm=k > 0)
    # SUSPENSE 29.99 -> 31.52 on A (dominant of Dm): timp + low string pulse, trem strings rising, snare roll
    t0 = g(20)
    tutti_hit(t0, 'A', 0.8, dur=0.25, crash_on=True)
    k = 1
    while g(20 + k / 2) < T_SIL0 - 0.05:
        t = g(20 + k / 2)
        u = (t - t0) / (T_SIL0 - t0)
        cb_sp.n(t, g.b * 0.4, 'A1', int(84 + 30 * u))
        vc_sp.n(t, g.b * 0.4, 'A2', int(80 + 30 * u))
        timp.n(t, 0.3, 'A1', int(70 + 45 * u))
        if k % 2 == 0:
            kick.n(t, 0.2, 60, int(90 + 25 * u))
        k += 1
    rise = ['A4', 'Bb4', 'B4', 'C5', 'C#5']
    seg = (T_SIL0 - t0) / len(rise)
    for i, n_ in enumerate(rise):
        vln_tr.n(t0 + i * seg, seg + 0.03, [n_, m(n_) + 12], 104)
    vln_tr.ex(t0, T_SIL0, -16, 0, 1.5)
    tb_su.n(30.6, T_SIL0 - 30.6, ['A1', 'E2', 'A2'], 110)
    hn_su.n(30.6, T_SIL0 - 30.6, ['C#4', 'E4', 'G4'], 104)
    tb_su.ex(30.6, T_SIL0, -18, 0, 1.6)
    hn_su.ex(30.6, T_SIL0, -18, 0, 1.6)
    oroll.n(30.35, T_SIL0 - 30.35, 60, 120)
    oroll.ex(30.35, T_SIL0, -24, 0, 1.3)
    riser.n(30.2, T_SIL0 - 30.2, 60, 100, kind='noise', lo=250, hi=11000, n0=45, oct=3)
    riser.n(T_SIL0, T_SIL0 - 30.0, 60, 96, kind='cym', len='s')


def chorus():
    # ---- DROP 31.84 : F major (chromatic-mediant lift from the A suspense) ----
    g = GC
    tutti_hit(T_DROP, 'F', 1.1, dur=0.5)
    braaam.n(T_DROP, 0.8, 'F1', 110)
    gong.n(T_DROP, 3.0, 60, 110)
    choir.cc(T_DROP - 0.01, 11, 118)
    oohs.cc(T_DROP - 0.01, 11, 100)
    # bar C1 (cut by the freeze at 33.39)
    ost(g, 0, 4, 'F', 1.0)
    kit_bar(g, 0, 'drive', 1.0)
    taiko_pat(g, 0, 4, 'C', 1.0)
    brass_line(g, 0, HOOK_MAJ, 112, beats=(0, 4), parts=('hn', 'tp'), hn_oct=-12)
    pads(T_DROP + 0.3, g(4) - 0.02, 'F', lvl=92, choir_on=True)
    sub.n(T_DROP, 4 * g.b - 0.05, 'F1', 100)
    for k in range(4):
        gtr.n(g(k), g.b * 0.45, 'F2', 116 if k == 0 else 100, pm=k > 0)
    # ---- FREEZE 33.39-34.00 : frozen F chord (sagging choir + strings), the hook's C5 stuck, then restart
    for pp, ns, v in [(vln_su, ['F4', 'A4', 'C5'], 96), (hn_su, ['F3', 'C4'], 92), (vc_su, ['F2'], 90)]:
        pp.n(T_FRZ0, T_FRZ1 - T_FRZ0 - 0.04, ns, v, keep=True)
        pp.ex(T_FRZ0, T_FRZ1 - 0.04, -3, -12)
    choir.n(T_FRZ0, T_FRZ1 - T_FRZ0 - 0.05, ['F4', 'A4', 'C5'], 90, keep=True)
    choir.bend(T_FRZ0, 0)
    for i in range(20):
        choir.bend(T_FRZ0 + 0.1 + i * 0.022, -0.5 * ((i + 1) / 20) ** 1.4)
    choir.bend(T_FRZ1 - 0.02, 0)
    tt, gap = T_FRZ0, 0.05
    for i in range(8):
        tp_st.n(tt, 0.05, 'C5', 104 - 7 * i, keep=True)
        glock.n(tt, 0.05, 'C6', 90 - 6 * i, keep=True)
        tt += gap
        gap *= 1.15
    for i, bt in enumerate((-0.5, -0.25, -0.125)):
        snare.n(GD(bt), 0.1, 60, 96 + 10 * i, keep=True)
    taiko.n(GD(-0.5), 0.4, 60, 110, keep=True)
    # ---- 34.00 restart : D1..D5 full hook (F C Dm Bb|C Bb|C) -> F at 43.10 ----
    g = GD
    plan = [(0, 4, 'F'), (4, 4, 'C'), (8, 4, 'Dm'), (12, 2, 'Bb'), (14, 2, 'C'), (16, 2, 'Bb'), (18, 2, 'C')]
    for b0, d, ch in plan:
        ost(g, b0, d, ch, 1.0)
        r, pcs = ct(ch)
        sub.n(g(b0), g.b * d - 0.05, near(r, m('E1')), 100)
        pads(g(b0) + 0.01, g(b0 + d) - 0.02, ch, lvl=90, choir_on=True)
        for k in range(int(d * 2)):
            gtr.n(g(b0 + k / 2), g.b * 0.45, near(r, m('E2')), 116 if k == 0 else 98, pm=(k % 4 != 0))
        if b0 > 0:
            lowbrass_stab(g(b0 - 0.5), ch, 112)
    for bar in range(5):
        kit_bar(g, bar * 4, 'drive', 1.0, fill_from=19 if bar == 4 else None)
        taiko_pat(g, bar * 4, 4, 'C' if bar < 4 else '8', 1.0)
        if bar:
            crash.n(g(bar * 4), 1.8, 60, 108)
    crash.n(g(0), 2.0, 60, 118)
    ocym.n(g(0), 2.5, 60, 110)
    trailer.n(g(0), 1.2, 58, 124)
    brass_line(g, 0, HOOK_MAJ, 114, parts=('hn', 'tp'), hn_oct=-12)
    # violins double the hook an octave up in the last two bars (climax)
    for b, d, n_ in HOOK_MAJ:
        if b >= 12:
            (vln_su if d >= .75 else vln_sp).n(g(b) + hum(3), g.b * d * (1.0 if d >= .75 else 0.9), m(n_) + 12, 104)
    # goal lift 35.1-35.6 : string run up into bar D2, cymbal swell
    run = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'Bb5', 'C6']
    for i, n_ in enumerate(run):
        vln_sp.n(g(2.5 + i * 0.1875), g.b * 0.2, [n_, m(n_) - 12], 100 + 3 * i)
    riser.n(g(4), 0.8, 60, 80, kind='cym', len='s')
    # button press 36.50 (D2 beat 1.5): stab
    t = g(5.5)
    lowbrass_stab(t, 'C', 124)
    tp_st.n(t, 0.15, ['E5', 'G5'], 118)
    taiko.n(t, 0.5, 60, 124)
    tamb.n(t, 0.3, 60, 110)
    # TV-on sparkle 37.30 (D2 beat 7.25): harp + celesta + glock glissando upward, bell-like
    t = g(7.25)
    for i, n_ in enumerate(['F5', 'A5', 'C6', 'E6', 'F6', 'A6', 'C7']):
        harp.n(t + i * 0.03, 0.8, m(n_) - 12, 80 + 3 * i)
        celesta.n(t + i * 0.03 + 0.01, 0.6, n_, 70 + 4 * i)
    glock.n(t + 0.2, 0.6, ['C7', 'F7'], 80)
    # the final build into 43.10
    riser.n(g(16), g(20) - g(16), 60, 90, kind='noise', lo=300, hi=10000, n0=41)
    riser.n(T_END, 1.8, 60, 110, kind='cym', len='s')
    for i in range(8):
        snare.n(g(19 + i / 8), 0.1, 60, 90 + 4 * i)
    tt = g(18)
    while tt < T_END - 0.03:
        timp.n(tt, 0.1, 'C2', int(70 + 50 * (tt - g(18)) / (T_END - g(18))))
        tt += 0.055


def ending():
    T = T_END
    tutti_hit(T, 'F', 1.15, dur=1.6)
    braaam.n(T, 1.2, 'F1', 118)
    gong.n(T, 4.0, 60, 124)
    trailer.n(T + 0.002, 2.0, 55, 127)
    lead_t = 44.1
    # ring: F major bed (strings, horns, choir) decaying to the end; soft horn + piano echo of the hook cell
    for pp, ns, v in [(vln_su, ['A4', 'C5', 'F5'], 96), (vla_su, ['C4', 'F4'], 92), (vc_su, ['F2', 'C3'], 94),
                      (cb_su, ['F1'], 92), (hn_su, ['F3', 'A3', 'C4'], 94)]:
        pp.n(T + 0.3, 46.1 - T - 0.3, ns, v)
        pp.ex(T + 0.3, 46.15, 0, -30, 0.8)
    choir.n(T + 0.1, 46.1 - T - 0.1, ['F3', 'C4', 'F4', 'A4', 'C5'], 104)
    choir.expr(T + 0.2, 46.1, 118, 20, 0.9)
    for b, d, n_ in [(0, .75, 'F4'), (.75, .25, 'F4'), (1, 1.5, 'F5')]:
        piano.n(lead_t + b * 0.5, d * 0.5 + (0.9 if d > 1 else 0), n_, 72)
        piano.n(lead_t + b * 0.5 + 0.004, d * 0.5 + (0.9 if d > 1 else 0), m(n_) - 12, 56)
    for b, d, n_ in [(0, .75, 'F3'), (.75, .25, 'F3'), (1, 1.5, 'F4')]:
        (hn_su if d >= .75 else hn_st).n(lead_t + 0.02 + b * 0.5, d * 0.5 + (0.8 if d > 1 else 0), n_, 78)
    harp.n(T + 0.4, 1.5, ['F3', 'C4', 'F4', 'A4', 'C5', 'F5'], 70)
    celesta.n(45.0, 0.9, ['F6', 'C7'], 50)


def compose():
    intro()
    sectionA()
    cin()
    bridges()
    tur()
    kor()
    ani()
    sectionB()
    chorus()
    ending()
    # freeze: drop / truncate every note in 33.39-34.00 except the 'keep' notes
    for p in PARTS.values():
        out = []
        for t, d, n_, v, kw in p.notes:
            if kw.get('keep'):
                out.append([t, d, n_, v, kw])
                continue
            if T_FRZ0 <= t < T_FRZ1 - 0.005:
                continue
            if t < T_FRZ0 < t + d:
                d = max(0.02, T_FRZ0 - t - 0.004)
            out.append([t, d, n_, v, kw])
        p.notes = out


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


STEMS = ['drums', 'perc', 'strings', 'brass', 'choir', 'synth', 'fx']
STEM_EQ = {
    'drums': [hp_sos(35, 4), peq_sos(380, -2.5, 1.0), peq_sos(60, 1.5, 1.0), peq_sos(4500, 1.5, 0.8)],
    'perc': [hp_sos(38, 4), peq_sos(220, -2.5, 0.9)],
    'strings': [hp_sos(38, 4), peq_sos(220, -2.0, 0.9), peq_sos(650, -1.5, 1.0), shelf_sos(6000, 3.0)],
    'brass': [hp_sos(60, 2), peq_sos(220, -2.0, 1.0), peq_sos(600, -2.0, 1.0), peq_sos(1500, 1.5, 1.0), shelf_sos(6000, 2.0)],
    'choir': [hp_sos(120, 2), peq_sos(300, -2.0, 1.0)],
    'synth': [hp_sos(32, 4), peq_sos(250, -2.0, 1.0)],
    'fx': [hp_sos(40, 4), peq_sos(60, -2.0, 1.0)],
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
    for name, p in PARTS.items():
        if not p.notes:
            continue
        for sg in (0, 1):
            notes = [tuple(x) for x in p.notes if (x[0] < 31.6) == (sg == 0)]
            if not notes:
                continue
            y = p.engine.render(p, notes)
            c = auto_curve(p)
            if c is not None:
                y = y * c[:, None]
            for s_ in p.eq:
                y = signal.sosfilt(s_, y, axis=0)
            y = pan_st(y, p.pan, p.width) * p.gain
            d = segs.setdefault((p.stem, sg), [np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))])
            d[0] += y
            d[1] += y * p.room
            d[2] += y * p.hall
            for wn, (w0, w1) in (('A', (4.0, 11.7)), ('chorus', (34.0, 43.0)), ('holds', (11.8, 20.7))):
                lvl.setdefault(name, {}).setdefault(wn, 0.0)
                lvl[name][wn] += float(np.mean(y[int(w0 * SR):int(w1 * SR)] ** 2))
        print('rendered %-8s %4d notes' % (name, len(p.notes)), file=sys.stderr)
    stems = {s: np.zeros((N, 2)) for s in STEMS}
    for (stem, sg), (dry, rs, hs) in segs.items():
        y = dry + 0.5 * conv(rs, ir_room) + 0.45 * conv(hs, ir_hall)
        if sg == 0:
            a = int(T_SIL0 * SR)
            f = int(0.008 * SR)
            y[a - f:a] *= np.linspace(1, 0, f)[:, None]
            y[a:] = 0
        stems[stem] += y
    return stems, lvl


def env_pts(points):
    return np.interp(np.arange(N) / SR, [p[0] for p in points], [p[1] for p in points])


def mixdown(stems):
    for s in STEMS:
        y = stems[s]
        for s_ in STEM_EQ[s]:
            y = signal.sosfilt(s_, y, axis=0)
        stems[s] = y
    # freeze: rhythm + percussion + synth stop dead, drums re-open for the pickup
    fr = env_pts([(0, 1), (T_FRZ0 - 0.004, 1), (T_FRZ0 + 0.004, 0), (GD(-0.5) - 0.03, 0), (GD(-0.5) - 0.02, 1), (DUR, 1)])
    for s in ('drums', 'perc', 'synth', 'fx'):
        stems[s] *= fr[:, None]
    # voice-range carve (-2.5 dB 1-4 kHz) only while the VO speaks (never inside the holds)
    spk = np.zeros(N)
    for a, b in LINES:
        spk[int((a - 0.04) * SR):int((b + 0.06) * SR)] = 1
    k = int(0.05 * SR)
    spk = np.convolve(spk, np.ones(k) / k, mode='same')
    band = signal.butter(2, [1000, 4000], 'band', fs=SR, output='sos')
    depth = 1 - 10 ** (-2.5 / 20)
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
    # section dynamics: holds forward (+2.5 dB, voice is silent), verse under VO -1.5, drop/final peak
    H = HOLD_T
    dyn = [(0, -1.5), (3.5, -1.5), (3.58, 0), (4.3, -1.5), (11.7, -1.5), (11.79, 2.0), (12.8, 2.0), (13.185, -1.0),
           (14.4, -1.0), (14.465, 2.5), (16.0, 2.5), (16.065, -1.0), (16.9, -1.0), (16.94, 5.0), (18.5, 5.0),
           (18.54, -1.0), (19.1, -1.0), (19.13, 2.5), (20.7, 2.5), (20.73, -1.5), (26.3, -1.5), (29.9, -0.5),
           (31.84, 0.5), (43.0, 0.5), (43.1, 1.5), (DUR, 1.5)]
    dc = 10 ** (env_pts(dyn) / 20)
    fade = np.ones(N)
    a, e = int(44.9 * SR), int(46.15 * SR)
    fade[a:e] = np.cos(np.linspace(0, np.pi / 2, e - a)) ** 1.5
    fade[e:] = 0
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
    thr, ratio, knee = -20.0, 2.0, 6.0
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
    g1 = 10 ** ((-14.5 - meter.integrated_loudness(mix)) / 20)
    mix *= g1
    # lookahead limiter
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    ceil = 10 ** (-1.05 / 20)
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
    gt = gcomp * g1 * lim
    for s in STEMS:
        stems[s] *= gt[:, None]
    g2 = 10 ** (-1.0 / 20) / np.max(np.abs(mix))
    mix *= g2
    a, b = int(round(T_SIL0 * SR)), int(round(T_SIL1 * SR))
    ez = int(46.15 * SR)
    for y in [mix] + [stems[s] for s in STEMS]:
        if y is not mix:
            y *= g2
        y[a:b] = 0
        y[ez:] = 0
    print('glue comp max %.1f dB mean %.2f dB | limiter max %.1f dB' % (sm.max(), sm[:int(43 * SR / blk)].mean(),
                                                                        -20 * np.log10(lim.min())), file=sys.stderr)
    bl = lim[:N // 4800 * 4800].reshape(-1, 4800).min(1)
    print('limiter GR>2dB at: ' + ', '.join('%.1f:%.1f' % (i * 0.1, -20 * np.log10(v)) for i, v in enumerate(bl)
                                             if v < 10 ** (-2 / 20)), file=sys.stderr)
    return mix, stems


def report(mix, stems, lvl):
    import pyloudnorm as pyln
    path = os.path.join(HERE, 'score_v7.wav')
    x, _ = sf.read(path)
    info = sf.info(path)
    print('\n== score_v7.wav %d Hz %d ch %s %.4f s' % (info.samplerate, info.channels, info.subtype, info.frames / SR),
          file=sys.stderr)
    tp = 20 * np.log10(np.max(np.abs(signal.resample_poly(x, 4, 1, axis=0))))
    print('peak %.2f dBFS  true-peak %.2f dBTP  %.1f LUFS' % (20 * np.log10(np.max(np.abs(x))), tp,
                                                              pyln.Meter(SR).integrated_loudness(x)), file=sys.stderr)
    a, b = int(round(T_SIL0 * SR)), int(round(T_SIL1 * SR))
    print('silence %.2f-%.2f max %g; first nonzero after %.4f; tail(46.15-) max %g' % (
        T_SIL0, T_SIL1, np.max(np.abs(x[a:b])), (b + np.argmax(np.abs(x[b:, 0]) > 0)) / SR,
        np.max(np.abs(x[int(46.15 * SR):]))), file=sys.stderr)
    print('stems sum - mix max %.1e' % np.max(np.abs(sum(stems.values()) - mix)), file=sys.stderr)
    bands = [(20, 35), (35, 60), (60, 120), (120, 250), (250, 500), (500, 1000), (1000, 2000), (2000, 4000),
             (4000, 8000), (8000, 16000)]
    secs = [('intro', 0, 3.58), ('A', 3.58, 11.79), ('cin', 11.79, 13.19), ('tur', 14.465, 16.065),
            ('kor', 16.94, 18.54), ('ani', 19.13, 20.73), ('B', 20.73, 29.9), ('susp', 29.99, 31.52),
            ('chorus', 31.84, 43.1), ('end', 43.1, 46.2)]
    print('section  rms dBFS | band dB rel section total: ' + ' '.join('%d-%d' % bb for bb in bands), file=sys.stderr)
    for nm, t0, t1 in secs:
        seg = x[int(t0 * SR):int(t1 * SR)]
        f, P = signal.welch(seg.mean(1), SR, nperseg=4096)
        tot = P.sum()
        print('  %-7s %6.1f | ' % (nm, 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)) +
              ' '.join('%5.1f' % (10 * np.log10(P[(f >= lo) & (f < hi)].sum() / tot + 1e-12)) for lo, hi in bands) +
              '  corr %.2f' % np.corrcoef(seg[:, 0], seg[:, 1])[0, 1], file=sys.stderr)
    c0, c1 = int(34.0 * SR), int(43.0 * SR)
    ref = np.sqrt(np.mean(mix[c0:c1] ** 2))
    print('stems in chorus (dB rel mix): ' + ', '.join('%s %.1f' % (s, 20 * np.log10(np.sqrt(np.mean(stems[s][c0:c1] ** 2)) / ref + 1e-12))
                                                      for s in STEMS), file=sys.stderr)
    for wn in ('A', 'holds', 'chorus'):
        print('parts %s: ' % wn + ', '.join('%s %.0f' % (k, 10 * np.log10(v.get(wn, 0) + 1e-14)) for k, v in lvl.items()),
              file=sys.stderr)
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(2, 1, figsize=(20, 8), gridspec_kw=dict(height_ratios=[3, 1]))
    ff, tt, S = signal.spectrogram(x.mean(1), SR, nperseg=4096, noverlap=3072)
    ax[0].pcolormesh(tt, ff, 10 * np.log10(S + 1e-14), shading='auto', vmin=-130, vmax=-40, cmap='magma')
    ax[0].set_yscale('symlog', linthresh=200)
    ax[0].set_ylim(20, 20000)
    for tv in (3.58, 11.79, 13.19, 14.465, 16.065, 16.94, 18.54, 19.13, 20.73, 26.5, 30.2, 31.52, 31.84, 33.39, 34.0,
               36.5, 37.3, 43.1, 46.2):
        ax[0].axvline(tv, color='c', lw=0.6, alpha=0.7)
    ax[0].set_title('GOTV v7 score - spectrogram (cyan = cues / holds)')
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
    plt.savefig(os.path.join(HERE, 'score_v7_spectrogram.png'), dpi=85)


SPARSE = """/Strings/Violin Section/Spic/
/Strings/Violin Section/susVib/
/Strings/Violin Section/Trem/
/Strings/Viola Section/spic/
/Strings/Viola Section/susvib/
/Strings/Cello Section/spic/
/Strings/Cello Section/susvib/
/Strings/Cello Section/trem/
/Strings/Solo Contrabass/Spic/
/Strings/Solo Contrabass/SusVib/
/Strings/Harp/
/Brass/F Horn/sus/
/Brass/F Horn/stac/
/Brass/Trumpet/sus/
/Brass/Trumpet/stac/
/Brass/Tenor Trombone/sus/
/Brass/Tenor Trombone/stac/
/Brass/Tuba/sus/
/Brass/Tuba/stac/
/Percussion/Timpani/
/Percussion/BDrumNewhit*
/Percussion/cymbal-crash1*
/Percussion/susCymb1-cresc*
/Percussion/gongHit*
/Percussion/Snare2*
/Percussion/Tamb1-Hit*
/Keys/Upright Nr1/
"""


def fetch_samples():
    """re-create samples/ from GitHub (sparse checkouts, .git removed afterwards to save disk)."""
    os.makedirs(SMP, exist_ok=True)
    if not os.path.isdir(VS):
        d = VS
        subprocess.check_call(['git', 'clone', '--depth', '1', '--filter=blob:none', '--no-checkout',
                               'https://github.com/sgossner/VSCO-2-CE', d])
        subprocess.check_call(['git', '-C', d, 'sparse-checkout', 'init', '--no-cone'])
        open(os.path.join(d, '.git', 'info', 'sparse-checkout'), 'w').write(SPARSE)
        subprocess.check_call(['git', '-C', d, 'checkout', 'HEAD'])
        subprocess.check_call(['rm', '-rf', os.path.join(d, '.git')])
    if not os.path.isdir(VD):
        d = os.path.join(SMP, 'vd')
        subprocess.check_call(['git', 'clone', '--depth', '1', '--filter=blob:none', '--no-checkout',
                               'https://github.com/sfzinstruments/virtuosity_drums', d])
        subprocess.check_call(['git', '-C', d, 'sparse-checkout', 'init', '--no-cone'])
        lines = ['/README.md', '/LICENSE']
        for mic in ('mid', 'room', 'kickmic'):
            for p in ('kick/{m}_kick_snoff', 'snare/{m}_snare_rimshot', 'snare/{m}_snare_center', 'hh/{m}_hh_closed',
                      'hh/{m}_hh_open', 'crash/{m}_crash_crash', 'ltom/{m}_ltom_center', 'htom/{m}_htom_center'):
                lines.append('/Samples/%s/%s*' % (mic, p.format(m=mic)))
        open(os.path.join(d, '.git', 'info', 'sparse-checkout'), 'w').write('\n'.join(lines) + '\n')
        subprocess.check_call(['git', '-C', d, 'checkout', 'HEAD'])
        subprocess.check_call(['rm', '-rf', os.path.join(d, '.git')])


def main():
    fetch_samples()
    stems, lvl = render_all()
    mix, stems = mixdown(stems)
    os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
    sf.write(os.path.join(HERE, 'score_v7.wav'), mix, SR, subtype='PCM_24')
    for s in STEMS:
        sf.write(os.path.join(HERE, 'stems', f'{s}.wav'), stems[s], SR, subtype='PCM_24')
    report(mix, stems, lvl)


if __name__ == '__main__':
    main()
