"""Tiny numpy sampler for the VSCO-2-CE / Virtuosity Drums sample sets (CC0).

Sampler(dir, pattern, offset): parses note / velocity layer / round-robin from file names, resamples to 48 kHz,
trims to the attack onset, then render(notes) -> stereo buffer: nearest-pitch sample, pitch-shift by resampling
(cubic interpolation), velocity-layer choice + gain curve, round-robin rotation, release fade after note-off.
"""
import glob
import os
import re

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
NOTE_IDX = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def name2midi(tok):
    m_ = re.match(r'([A-G])(#|b)?(-?\d)$', tok)
    p = NOTE_IDX[m_.group(1)] + (1 if m_.group(2) == '#' else -1 if m_.group(2) == 'b' else 0)
    return p + 12 * (int(m_.group(3)) + 1)


def load48(path):
    x, sr = sf.read(path, always_2d=True, dtype='float64')
    if x.shape[1] == 1:
        x = np.repeat(x, 2, 1)
    x = x[:, :2]
    if sr != SR:
        g = np.gcd(sr, SR)
        x = signal.resample_poly(x, SR // g, sr // g, axis=0)
    return x


def trim_onset(x, thr_db=-38, pre=0.002):
    a = np.abs(x).max(1)
    pk = a.max() + 1e-12
    idx = np.argmax(a > pk * 10 ** (thr_db / 20))
    s = max(0, idx - int(pre * SR))
    return x[s:]


class Sampler:
    def __init__(self, files, parse, offset=0, release=0.25, trim=True, maxlen=None, gain=1.0, velcurve=1.6):
        """files: list of paths; parse(basename) -> (note_name_or_midi, layer, rr)"""
        self.zones = {}           # midi -> {layer: [samples...]}
        self.release, self.gain, self.velcurve = release, gain, velcurve
        for f in sorted(files):
            r = parse(os.path.basename(f))
            if r is None:
                continue
            nt, layer, rr = r
            midi = (name2midi(nt) if isinstance(nt, str) else float(nt)) + offset
            x = load48(f)
            if trim:
                x = trim_onset(x)
            if maxlen:
                x = x[:int(maxlen * SR)]
            self.zones.setdefault(midi, {}).setdefault(layer, []).append(x)
        self.keys = np.array(sorted(self.zones))
        self.rr = {}
        # normalise loudness across keys (per key: loudest layer peak-RMS) so pitch mapping stays even
        ref = []
        for k in self.keys:
            top = self.zones[k][max(self.zones[k])][0]
            ref.append(np.sqrt(np.mean(top[:int(0.3 * SR)] ** 2)) + 1e-9)
        med = np.median(ref)
        self.keynorm = {k: float(np.clip(med / r, 0.35, 2.8)) for k, r in zip(self.keys, ref)}

    def pick(self, note, vel):
        i = np.argmin(np.abs(self.keys - note) + 0.01 * (self.keys > note))   # prefer shifting up (less dulling)
        k = self.keys[i]
        layers = sorted(self.zones[k])
        li = min(len(layers) - 1, int(vel / 128 * len(layers)))
        lay = layers[li]
        lst = self.zones[k][lay]
        c = self.rr.get((k, lay), 0)
        self.rr[(k, lay)] = c + 1
        return k, lst[c % len(lst)], li, len(layers)

    def voice(self, note, vel, dur, rel=None):
        k, x, li, nl = self.pick(note, vel)
        ratio = 2 ** ((note - k) / 12)
        rel = self.release if rel is None else rel
        need = int((dur + rel) * SR * ratio) + 8
        x = x[:need]
        if abs(ratio - 1) > 1e-6:
            n_out = int(len(x) / ratio)
            pos = np.arange(n_out) * ratio
            x = np.stack([np.interp(pos, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
        n_on = int(dur * SR)
        nr = int(rel * SR)
        env = np.ones(len(x))
        if n_on < len(x):
            e = min(len(x), n_on + nr)
            env[n_on:e] = np.linspace(1, 0, e - n_on) ** 1.5
            env[e:] = 0
            x = x[:e]
            env = env[:e]
        f = min(len(x), 48)
        env[:f] *= np.linspace(0, 1, f)
        # velocity inside a layer: smooth gain so layer switches are not jumps
        lo = li / nl * 127
        g = (vel / 127) ** self.velcurve / max(((lo + 127 / nl) / 127) ** self.velcurve, 1e-3) ** 0.35
        return x * env[:, None] * g * self.keynorm[k] * self.gain

    def render(self, notes, N):
        out = np.zeros((N, 2))
        for t, dur, note, vel, kw in notes:
            y = self.voice(note, vel, dur, kw.get('rel'))
            a = int(round(t * SR))
            if a >= N:
                continue
            if a < 0:
                y = y[-a:]
                a = 0
            e = min(N, a + len(y))
            out[a:e] += y[:e - a]
        return out


def std_parse(name):
    """VSCO names like VlnEns_Spic_A2_v1_rr1.wav / spic_A2_v1_RR1.wav / MOHorn_sus_A#1_v2_1.wav"""
    base = name.rsplit('.', 1)[0]
    toks = base.split('_')
    note = next((t for t in toks if re.match(r'^[A-G]#?-?\d$', t)), None)
    if note is None:
        return None
    lay = next((int(t[1:]) for t in toks if re.match(r'^v\d+$', t)), 1)
    rr = next((int(re.sub(r'\D', '', t)) for t in toks if re.match(r'^(rr|RR)\d+$', t)), 1)
    return note, lay, rr


def dyn_parse(name):
    """UR1_C4_mf_RR2.wav"""
    toks = name.rsplit('.', 1)[0].split('_')
    dyn = {'pp': 1, 'mf': 2, 'f': 3}.get(toks[2])
    return toks[1], dyn, int(toks[3][2:])
