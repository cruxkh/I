#!/usr/bin/env python3
"""ConnectTV 'LIQUID POP' film score: original epic-pop trailer anthem (E minor -> G major).  python3 score_ctv.py
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


