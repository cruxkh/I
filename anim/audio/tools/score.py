#!/usr/bin/env python3
"""PACKET FROM HOME - original score generator (reproducible).

Renders audio/music/score.wav (60.000 s, 48 kHz, stereo) and stems in audio/music/stems/.

Sound sources
  * GeneralUser GS SoundFont (audio/music/sf/GeneralUser-GS.sf2, downloaded from
    github.com/mrbumpy409/GeneralUser-GS) rendered offline with `tinysoundfont`
    - strings, pizzicato, brass, clarinet, ney (shakuhachi patch), celesta,
    music box, harp, timpani, choir, orchestral + standard drum kits.
  * numpy synthesis - Karplus-Strong oud (doubled courses + body resonance),
    darbuka (doum / tek / ka), sub booms, risers, reverse swells, cartoon boing.

Structure (global seconds; every section has its own beat grid anchored to its hit):
  S1  0.00- 6.20  Tel Aviv       116.13 BPM  ney call, shimmer, darbuka pulse, rising horns, stinger @6.2
  S2  6.20-14.50  Living room    115.66 BPM  pizz + oud comedy, build under "go go go", TAPE STOP @14.5
  F  14.50-21.00  Freeze         120 BPM     lonely held note, sneaky pizz, magic shimmer to 21.0
  S4 21.00-30.50  Data world     126.32 BPM  synth bass + darbuka groove, traffic-jam stabs, BOOST @28.6
  S5 30.50-41.50  Ocean          120 BPM     Hijaz ostinato, shark menace, CHOMP @36.0, boing @36.2
  S6 41.50-46.00  Last mile      141.18 BPM  accelerating build, silence 44.8, IMPACT @44.9
  S7 46.40-54.50  Goal (E)       135 BPM     full tutti Bit theme, 4 bars exactly 46.4 -> 53.51
  T  54.50-57.30  Tag            ~90 BPM     music-box theme, wink @56.9
  TC 57.30-60.00  Title          final E-Hijaz cadence hit @57.3, ring & fade
"""
import json
import os
import sys

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MUS = os.path.join(ROOT, 'audio', 'music')
SF2 = os.path.join(MUS, 'sf', 'GeneralUser-GS.sf2')
SR = 48000
DUR = 81.0
N = int(SR * DUR)
RNG = np.random.default_rng(5401)

# segment boundaries: music before 14.5 is tape-stopped, music of 14.5..44.8 is hard-gated at 44.8
SEG_BOUNDS = [15.3, 57.75]


def seg_of(t):
    for i, b in enumerate(SEG_BOUNDS):
        if t < b:
            return i
    return len(SEG_BOUNDS)


NOTE_IDX = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def m(name):
    """'Eb4' -> midi."""
    if isinstance(name, (int, np.integer)):
        return int(name)
    p = NOTE_IDX[name[0]]
    i = 1
    while i < len(name) and name[i] in '#b':
        p += 1 if name[i] == '#' else -1
        i += 1
    return p + 12 * (int(name[i:]) + 1)


class Grid:
    def __init__(self, t0, bpm):
        self.t0, self.bpm, self.b = t0, bpm, 60.0 / bpm

    def __call__(self, beat):
        return self.t0 + beat * self.b


def hum(amount=0.006):
    return float(RNG.uniform(-amount, amount))


# ----------------------------------------------------------------------------------------------
# Tracks
# ----------------------------------------------------------------------------------------------
SHIFT = [0.0]   # global time offset applied to every event (lets v1 sections be re-placed)


def speaking(t, pad0=0.05, pad1=0.0):
    t = t + SHIFT[0]
    return any(l[0] - pad0 < t < l[1] + pad1 for l in LINES)


class Track:
    def __init__(self, name, stem, prog=None, bank=0, drums=False, gain=1.0, pan=0.0, rev=0.25,
                 synth=None, width=1.0):
        self.name, self.stem, self.prog, self.bank, self.drums = name, stem, prog, bank, drums
        self.gain, self.pan, self.rev, self.synth, self.width = gain, pan, rev, synth, width
        self.notes = []   # (t, dur, midi, vel, extra)
        self.ctl = []     # (t, kind, a, b)   kind 'cc' | 'bend'

    def n(self, t, dur, note, vel=90, **kw):
        if isinstance(note, (list, tuple)):
            for x in note:
                self.n(t, dur, x, vel, **kw)
            return
        vel = int(np.clip(vel, 1, 127))
        self.notes.append((float(t) + SHIFT[0], float(dur), m(note), vel, kw))

    def cc(self, t, num, val):
        self.ctl.append((float(t) + SHIFT[0], 'cc', num, int(np.clip(val, 0, 127))))

    def expr(self, t0, t1, v0, v1, curve=1.0, step=0.02):
        """CC11 ramp."""
        k = max(2, int((t1 - t0) / step))
        for i in range(k + 1):
            u = i / k
            self.cc(t0 + (t1 - t0) * u, 11, v0 + (v1 - v0) * (u ** curve))

    def bend(self, t, semis):
        self.ctl.append((float(t) + SHIFT[0], 'bend', semis, 0))


TR = {}


def track(name, *a, **k):
    TR[name] = Track(name, *a, **k)
    return TR[name]


# SoundFont instruments
strings = track('strings', 'strings', 48, gain=0.9, pan=-0.15, rev=0.35, width=1.0)
slowstr = track('slowstr', 'strings', 49, gain=0.8, pan=0.1, rev=0.4)
lowstr = track('lowstr', 'strings', 48, gain=0.9, pan=0.2, rev=0.3)
violins = track('violins', 'strings', 48, gain=0.75, pan=-0.3, rev=0.35)
trem = track('trem', 'strings', 44, gain=0.8, pan=0.05, rev=0.35)
pizz = track('pizz', 'plucks', 45, gain=1.0, pan=-0.2, rev=0.25)
pizzlo = track('pizzlo', 'plucks', 45, gain=1.1, pan=0.15, rev=0.2)
solo = track('solo', 'strings', 40, gain=0.6, pan=0.25, rev=0.5)
horns = track('horns', 'brass', 60, gain=0.95, pan=0.25, rev=0.4)
trumpet = track('trumpet', 'brass', 56, gain=0.8, pan=0.35, rev=0.35)
trombone = track('trombone', 'brass', 57, gain=0.85, pan=0.3, rev=0.3)
tuba = track('tuba', 'brass', 58, gain=0.9, pan=0.1, rev=0.25)
mute = track('mute', 'brass', 59, gain=0.7, pan=0.4, rev=0.25)
clar = track('clar', 'winds', 71, gain=0.7, pan=-0.35, rev=0.35)
bassoon = track('bassoon', 'winds', 70, gain=0.8, pan=-0.1, rev=0.25)
ney = track('ney', 'winds', 77, gain=0.75, pan=-0.25, rev=0.55)
choir = track('choir', 'winds', 52, gain=0.55, pan=0.0, rev=0.5)
celesta = track('celesta', 'keys', 8, gain=0.65, pan=0.3, rev=0.5)
mbox = track('mbox', 'keys', 10, gain=0.85, pan=0.0, rev=0.45)
glock = track('glock', 'keys', 9, gain=0.45, pan=0.35, rev=0.45)
vibes = track('vibes', 'keys', 11, gain=0.5, pan=-0.3, rev=0.45)
xylo = track('xylo', 'keys', 13, gain=0.45, pan=0.3, rev=0.3)
harp = track('harp', 'plucks', 46, gain=0.8, pan=-0.35, rev=0.5)
timp = track('timp', 'perc', 47, gain=1.0, pan=0.0, rev=0.35)
ohit = track('ohit', 'brass', 55, gain=0.55, pan=0.0, rev=0.4)
synbass = track('synbass', 'synth', 39, gain=0.75, pan=0.0, rev=0.08)
pad = track('pad', 'synth', 94, gain=0.55, pan=0.0, rev=0.5)
crystal = track('crystal', 'synth', 98, gain=0.45, pan=0.0, rev=0.5)
blips = track('blips', 'synth', 80, gain=0.22, pan=0.3, rev=0.3)
okit = track('okit', 'perc', 48, bank=128, drums=True, gain=0.9, pan=0.0, rev=0.35)
kit = track('kit', 'perc', 0, bank=128, drums=True, gain=0.7, pan=0.0, rev=0.2)
accord = track('accord', 'winds', 21, gain=0.5, pan=-0.3, rev=0.3)
# balance trims (dB) found by per-stem analysis
for _k, _db in dict(strings=9, slowstr=9, lowstr=8, violins=10, trem=9, solo=18, horns=8, trumpet=7, trombone=7,
                    tuba=8, mute=6, ohit=3, clar=6, bassoon=6, ney=5, choir=6, timp=-2, okit=-3, kit=-5).items():
    TR[_k].gain *= 10 ** (_db / 20)
# numpy instruments
oud = track('oud', 'plucks', synth='oud', gain=0.9, pan=0.3, rev=0.3)
darb = track('darb', 'perc', synth='darbuka', gain=0.36, pan=-0.1, rev=0.22)
fx = track('fx', 'fx', synth='fx', gain=0.6, pan=0.0, rev=0.3)

# ----------------------------------------------------------------------------------------------
# Musical material
# ----------------------------------------------------------------------------------------------
# Bit's leitmotif - (beat, dur, semitone above tonic).  Hijaz: 1 b2 3 4 5 b6 b7
THEME = [(-0.5, .5, -5), (0, 1, 0), (1, .5, 0), (1.5, .5, 1), (2, 1, 4), (3, 1, 7),
         (4, .75, 8), (4.75, .25, 7), (5, .5, 5), (5.5, .5, 4), (6, 2, 7),
         (8, .5, 12), (8.5, .5, 10), (9, .5, 8), (9.5, .5, 7), (10, .5, 5), (10.5, .5, 4),
         (11, .5, 5), (11.5, .5, 7),
         (12, .5, 4), (12.5, .5, 1), (13, 1, 0), (14.5, .25, -5), (15, .5, 0)]
# (beat0, beat1, root semitone, quality)  I | iv I | iv bvii | bII I
THEME_CHORDS = [(0, 4, 0, 'M'), (4, 6, 5, 'm'), (6, 8, 0, 'M'), (8, 10, 5, 'm'), (10, 12, -2, 'm'),
                (12, 13, 1, 'M'), (13, 16, 0, 'M')]
HIJAZ = [0, 1, 4, 5, 7, 8, 10]


def triad(root, q, inv=0):
    iv = [0, 4, 7] if q == 'M' else [0, 3, 7]
    ns = [root + i for i in iv]
    for _ in range(inv):
        ns = ns[1:] + [ns[0] + 12]
    return ns


def hijaz_notes(tonic, lo, hi):
    return [x for x in range(lo, hi + 1) if (x - tonic) % 12 in HIJAZ]


def play_theme(tr, g, tonic, beats=(-1, 16), vel=100, octave=0, stacc=0.92, velcurve=None, legato=False):
    for b, d, s in THEME:
        if beats[0] <= b < beats[1]:
            v = vel if velcurve is None else velcurve(b)
            # accent the heroic notes
            if s in (7, 12) and d >= 1:
                v += 6
            tr.n(g(b), g.b * d * (1.02 if legato else stacc), tonic + s + 12 * octave, v)


def theme_chords(g, tonic, fn, beats=(0, 16)):
    for b0, b1, r, q in THEME_CHORDS:
        if b1 <= beats[0] or b0 >= beats[1]:
            continue
        fn(g(max(b0, beats[0])), g(min(b1, beats[1])), tonic + r, q, max(b0, beats[0]))


# dialogue windows (for arrangement decisions + the 1-4 kHz carve)
with open(os.path.join(ROOT, 'audio', 'timeline.json')) as f:
    LINES = [(l['t'], l['end'], l['who']) for l in json.load(f)['lines']]


# ============================================================================================
# S1  Tel Aviv 0 - 6.2
# ============================================================================================
def s1():
    g = Grid(0.0, 60 * 12 / 6.2)   # 12 beats -> 6.2 s
    D = 62
    # night pad (halo) fades in
    pad.cc(0, 11, 0)
    pad.n(0.0, 6.1, ['D4', 'A4', 'D5'], 70)
    pad.expr(0.0, 2.4, 0, 95, 0.7)
    pad.expr(4.8, 6.15, 95, 40)
    # ney call over the city (with scoop)
    ney.cc(0, 11, 100)
    ph = [(0.18, 'A4', .5, 70), (0.70, 'Bb4', .14, 74), (0.84, 'A4', .12, 70), (0.96, 'G4', .12, 66),
          (1.08, 'F#4', .14, 64), (1.22, 'G4', .16, 60), (1.38, 'A4', 1.3, 58)]
    for t, n_, d, v in ph:
        ney.n(t, d, n_, v)
    ney.bend(0.0, -0.8)
    for i in range(12):
        ney.bend(0.18 + i * 0.012, -0.8 + 0.8 * (i + 1) / 12)
    ney.expr(1.38, 2.7, 100, 30)
    # vibrato on the long note
    for i in range(60):
        tt = 1.6 + i * 0.02
        ney.bend(tt, 0.12 * np.sin(2 * np.pi * 5.2 * (tt - 1.6)) * min(1, (tt - 1.6) / 0.3))
    ney.bend(2.9, 0)
    # celesta sparkle (city lights)
    sp = hijaz_notes(D, 86, 98)
    t = 0.25
    while t < 4.6:
        if RNG.random() < 0.7:
            celesta.n(t + hum(0.01), 0.4, int(RNG.choice(sp)), int(RNG.integers(30, 52)))
        t += g.b / 2
    # low drone swell (stadium tension)
    slowstr.cc(0, 11, 30)
    slowstr.n(0.4, 5.75, ['D2', 'A2', 'D3'], 80)
    slowstr.expr(0.4, 6.1, 30, 118, 1.6)
    # timp soft roll for crowd swell at 0.5
    for i in range(int(0.9 / 0.06)):
        tt = 0.1 + i * 0.06
        timp.n(tt, 0.1, 'D2', int(25 + 40 * np.sin(np.pi * i / 15)))
    # low pulse eighths (bar 2 on)
    for k in range(8, 24):
        b = k / 2
        lowstr.n(g(b) + hum(0.004), g.b * 0.42, ['D2', 'D3'], int(48 + 50 * (k - 8) / 16) + (8 if k % 2 == 0 else 0))
    # darbuka pulse growing into maqsum
    for b in (2, 3):
        darb.n(g(b), 0.3, 'doum', 50 + 5 * b)
    maq = [(0, 'doum'), (.5, 'tek'), (1.5, 'tek'), (2, 'doum'), (3, 'tek')]
    for bar in (1, 2):
        for off, k in maq:
            b = bar * 4 + off
            if b >= 10:
                break
            darb.n(g(b) + hum(0.004), 0.3, k, 62 + 14 * bar + (6 if k == 'doum' else 0))
        for off in (0.75, 2.5, 2.75, 3.5):
            b = bar * 4 + off
            if b < 10:
                darb.n(g(b) + hum(0.004), 0.2, 'ka', 40 + 10 * bar)
    for i in range(8):                            # 16th fill into the stinger
        b = 10 + i * 0.25
        darb.n(g(b), 0.2, 'tek' if i % 2 == 0 else 'ka', 70 + 6 * i)
    # rising horns: Bit's call in augmentation (A - D - Eb - F# - A)
    horns.cc(0, 11, 70)
    for b, n_, d in [(4, 'A3', 1), (5, 'D4', 1), (6, 'Eb4', 1), (7, 'F#4', 1), (8, 'A4', 2)]:
        horns.n(g(b), g.b * d * 1.0, n_, 78 + 4 * (b - 4))
    horns.n(g(4), g.b * 4, 'D3', 62)
    horns.expr(g(4), g(10), 70, 115)
    trombone.n(g(8), g.b * 2, ['D3', 'A3'], 70)
    # bII tension swell (Eb) under the packet launch 5.0 -> 6.2
    for tr_, ns, v in [(horns, ['Eb4', 'G4', 'Bb4'], 96), (trombone, ['Eb3', 'Bb3'], 92),
                       (trumpet, ['G4', 'Bb4'], 80), (strings, ['Eb4', 'G4', 'Bb4', 'Eb5'], 90),
                       (tuba, ['Eb2'], 90)]:
        tr_.n(g(10), 6.19 - g(10), ns, v)
    trumpet.cc(0, 11, 40)
    trumpet.expr(g(10), 6.18, 40, 120, 1.5)
    strings.cc(0, 11, 45)
    strings.expr(g(10), 6.18, 45, 120, 1.5)
    tuba.cc(0, 11, 60)
    tuba.expr(g(10), 6.18, 60, 125, 1.5)
    trombone.expr(g(10), 6.18, 80, 125, 1.5)
    # harp gliss up the Hijaz scale (packets fly)
    gl = hijaz_notes(D, 62, 98)
    for i, n_ in enumerate(gl):
        u = i / len(gl)
        harp.n(5.0 + 1.1 * (u ** 0.8), 0.5, n_, int(55 + 50 * u))
    fx.n(4.75, 1.45, 'riser', 90, lo=300, hi=7000, curve=2.2)
    fx.n(5.2, 1.0, 'revcym', 85)
    # ---- STINGER at 6.2: D major tutti stab
    T = 6.2
    stab = dict(horns=['D4', 'F#4', 'A4', 'D5'], trumpet=['A4', 'D5', 'F#5'], trombone=['D3', 'A3', 'F#4'],
                tuba=['D2'], strings=['D3', 'A3', 'D4', 'F#4', 'A4', 'D5'], lowstr=['D2'])
    for k, ns in stab.items():
        TR[k].cc(T - 0.001, 11, 127)
        TR[k].n(T, 0.2, ns, 118)
    ohit.n(T, 0.3, ['D4', 'A4'], 100)
    timp.n(T, 0.8, 'D2', 120)
    okit.n(T, 1.5, 36, 110)
    okit.n(T, 2.0, 57, 95)
    darb.n(T, 0.3, 'doum', 120)
    fx.n(T, 1.2, 'boom', 70, f0=80, f1=38)


# ============================================================================================
# S2  Living room 6.2 - 14.5 (tape stop)
# ============================================================================================
def s2():
    g = Grid(6.2, 60 * 16 / 9.1)
    b = g.b
    # post-stinger snow twinkle
    for i, n_ in enumerate(['D6', 'A5', 'F#5', 'Eb5', 'D5']):
        celesta.n(6.42 + i * 0.09, 0.5, n_, 48 - 4 * i)
    # oud lick (comedic, fast Hijaz descent) - ends as Saba starts
    for i, n_ in enumerate(['A3', 'Bb3', 'A3', 'G3', 'F#3', 'Eb3', 'D3']):
        oud.n(g(0.75) + i * b / 4, 0.4, n_, 88 - 3 * i)
    oud.n(g(0.75) + 7 * b / 4, 0.8, 'D2', 80)
    # tip-toe pizz ostinato: bass on beats, soft chords on offbeats
    harm = {0: (50, [66, 69]), 1: (50, [66, 69]), 2: (55, [70, 74]), 3: (48, [67, 70])}   # D D Gm Cm (bar 4 = build)
    bassnotes = {0: ['D2', 'A1', 'D2', 'A1'], 1: ['D2', 'A1', 'D2', 'F#2'], 2: ['G2', 'D2', 'G2', 'D2'],
                 3: ['C2', 'G1', 'C2', 'Eb2']}
    for bar in range(3):
        for beat in range(4):
            bb = bar * 4 + beat
            if bb == 0:
                continue
            speak = speaking(g(bb))
            pizzlo.n(g(bb) + hum(0.005), 0.3, bassnotes[bar][beat], 88 if beat % 2 == 0 else 74)
            root, up = harm[bar]
            if bar == 2 and beat >= 2:
                up = [67, 72]    # Cm colour under "it's just football"
            pizz.n(g(bb + 0.5) + hum(0.005), 0.2, [u - 12 for u in up], 52 if speak else 66)
    # gentle string bed
    slowstr.cc(6.3, 11, 50)
    slowstr.n(g(1), b * 7, ['D3', 'F#3', 'A3'], 55)
    slowstr.n(g(8), b * 2, ['D3', 'G3', 'Bb3'], 55)
    slowstr.n(g(10), b * 2, ['C3', 'Eb3', 'G3'], 55)
    # soft darbuka heartbeat (doum only while talking)
    for bb in range(1, 12):
        if bb % 2 == 0:
            darb.n(g(bb) + hum(0.004), 0.3, 'doum', 50)
        else:
            darb.n(g(bb + 0.5) + hum(0.004), 0.2, 'ka', 30)
    # gap answers
    for i, (n_, d) in enumerate([('F#4', .11), ('G4', .11), ('A4', .09)]):  # clarinet "hiccup" 10.24-10.5
        clar.n(10.24 + i * 0.085, d, n_, 66)
    for i, n_ in enumerate(['A3', 'D4', 'F#4', 'A4']):   # little "come play" hint on oud (backgammon payoff later)
        oud.n(10.25 + i * 0.06, 0.25, n_, 64 + 4 * i)
    for i, n_ in enumerate(['D4', 'Eb4', 'D4']):
        oud.n(12.36 + i * 0.045, 0.3, n_, 70)
    # ---- bar 4: rising excitement under "Just football? Go go go go!"
    t0 = g(12)
    chrom = list(range(m('D3'), m('D3') + 16))
    trem.cc(6.2, 11, 45)
    for i, n_ in enumerate(chrom):
        trem.n(t0 + i * b / 4, b / 2 * 1.05, [n_, n_ + 12], 70 + 3 * i)
    trem.expr(t0, 15.29, 45, 125, 1.3)
    for i in range(8):
        pizzlo.n(g(12 + i / 2), 0.2, 'D2', 80 + 4 * i)
    horns.cc(t0 - 0.01, 11, 40)
    horns.n(t0, 15.29 - t0, ['A3', 'D4', 'Eb4'], 90)
    horns.expr(t0, 15.29, 40, 122, 1.5)
    tuba.cc(t0 - 0.01, 11, 50)
    tuba.n(t0, 15.29 - t0, 'D2', 90)
    tuba.expr(t0, 15.29, 50, 120, 1.5)
    for i in range(int((15.29 - t0) / 0.055)):
        tt = t0 + i * 0.055
        timp.n(tt, 0.08, 'D2', int(40 + 70 * (tt - t0) / (15.3 - t0)))
    for i in range(16):
        k = 'doum' if i % 4 == 0 else ('tek' if i % 2 == 0 else 'ka')
        darb.n(g(12 + i / 4), 0.2, k, 60 + 3 * i)
    for i in range(8):
        darb.n(g(14 + i / 8), 0.15, 'tek' if i % 2 else 'ka', 90 + 3 * i)
    fx.n(14.0, 1.3, 'riser', 70, lo=400, hi=6000, curve=2.0)


# ============================================================================================
# v2  FREEZE / FRUSTRATION / GOTV HOPE / ROUTER  15.3 - 29.2
# ============================================================================================
def freeze():
    # lonely held note under "No! Not now!" (16.0-17.3)
    solo.cc(15.4, 11, 30)
    solo.n(15.75, 1.9, 'A5', 60)
    solo.expr(15.75, 16.4, 40, 100)
    solo.expr(16.9, 17.65, 100, 0)
    for i in range(90):
        tt = 16.0 + i * 0.02
        solo.bend(tt, 0.08 * np.sin(2 * np.pi * 5.5 * (tt - 16.0)))
    slowstr.cc(15.4, 11, 30)
    slowstr.n(15.8, 1.9, ['D2'], 55)
    slowstr.expr(15.8, 17.7, 30, 10)
    # "Again?! Every single game it gets stuck!" - Bit's first two notes caught in a buffering loop,
    # each repeat later and flatter, finally drooping
    loop = [17.55, 18.05, 18.6, 19.25, 19.95]
    for i, tt in enumerate(loop):
        v = 70 - 4 * i
        pizzlo.n(tt, 0.2, 'A2', v)
        pizzlo.n(tt + 0.16, 0.25, 'D3', v)
        bassoon.n(tt, 0.14, 'A2', v - 12)
        bassoon.n(tt + 0.16, 0.2 if i < 4 else 0.6, 'D3', v - 12)
        darb.n(tt + 0.16, 0.15, 'ka', 30)
    for i in range(12):
        bassoon.bend(20.15 + i * 0.03, -1.5 * (i + 1) / 12)
    bassoon.bend(20.7, 0)
    for i, n_ in enumerate(['A4', 'G#4', 'G4', 'F#4', 'F4']):   # clarinet sigh in the gap
        clar.n(20.3 + i * 0.055, 0.07, n_, 60 - 3 * i)
    # 20.6-24.7 the hopeful turn (Noa: "Everyone switched to GOTV!")
    for i, n_ in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4', 'D5']):
        harp.n(20.58 + i * 0.07, 0.8, n_, 58 + 2 * i)
    slowstr.cc(20.5, 11, 40)
    for t0, t1, ns in [(20.6, 22.3, ['D3', 'F#3', 'A3']), (22.3, 22.97, ['Eb3', 'G3', 'Bb3']),
                       (22.97, 24.3, ['D3', 'F#3', 'A3', 'D4']), (24.3, 24.6, ['Bb2', 'D3', 'F3', 'Bb3']),
                       (24.6, 25.0, ['C3', 'E3', 'G3', 'C4'])]:
        slowstr.n(t0, t1 - t0 + 0.02, ns, 70)
        pizzlo.n(t0, 0.3, m(ns[0]) - 12, 62)
    slowstr.expr(20.6, 24.9, 40, 88)
    # the idea: Bit's theme, first bar, softly on a solo horn
    horns.cc(20.5, 11, 72)
    gh = Grid(21.3, 90)
    play_theme(horns, gh, 62, beats=(-1, 4), vel=70, legato=True)
    # "GOTV!" sparkle on the word (24.43)
    for i, n_ in enumerate(['A5', 'D6', 'Eb6', 'F#6', 'A6']):
        celesta.n(24.43 + i * 0.05, 0.5, n_, 62)
    glock.n(24.43, 0.4, 'D7', 55)
    # 25.0 - 27.65 Noa at the router: curious pizzicato + a "progress bar" celesta climb
    g = Grid(25.0, 120)
    line = [(0, 'D4', 62), (1, 'F#4', 58), (1.5, 'G4', 60), (2, 'A4', 64), (3, 'Bb4', 60), (3.5, 'A4', 56),
            (4, 'G4', 60), (4.5, 'F#4', 56), (5, 'Eb4', 58)]
    for bt, n_, v in line:
        pizz.n(g(bt) + hum(0.005), 0.2, n_, v)
    for bt, n_ in [(0, 'D2'), (1, 'A1'), (2, 'D2'), (3, 'A1'), (4, 'G1'), (5, 'A1')]:
        pizzlo.n(g(bt), 0.3, n_, 66)
    for bt in (0.5, 2.5, 4.5):
        bassoon.n(g(bt), 0.12, ['D3', 'A2', 'G2'][int(bt // 2)], 50)
        darb.n(g(bt + 0.25), 0.15, 'ka', 26)
    prog = hijaz_notes(62, 74, 93)
    for i in range(12):
        celesta.n(26.0 + i * 0.135, 0.2, prog[i % len(prog)], 34 + 2 * i)
    # "...now!" (27.65) - the switch clicks
    T = 27.65
    pizz.n(T, 0.2, ['D4', 'A4', 'D5'], 96)
    glock.n(T, 0.5, ['D6', 'A6'], 80)
    timp.n(T, 0.5, 'D2', 80)
    darb.n(T, 0.3, 'doum', 90)
    # 27.7 -> 29.2 magical GOLD rise into the LED
    crystal.cc(27.6, 11, 0)
    crystal.n(27.7, 1.5, ['D5', 'A5', 'D6'], 90)
    crystal.expr(27.7, 29.18, 0, 120, 1.4)
    gl = hijaz_notes(62, 50, 98)
    for i, n_ in enumerate(gl):
        u = i / (len(gl) - 1)
        harp.n(27.75 + 1.4 * (u ** 0.7), 0.6, n_, int(48 + 60 * u))
    arp = hijaz_notes(62, 74, 98)
    for i in range(18):
        celesta.n(27.8 + i * 0.077, 0.4, arp[i % len(arp)], 45 + 3 * i)
    slowstr.n(27.7, 1.49, ['D4', 'A4', 'D5', 'F#5'], 70)
    slowstr.expr(27.7, 29.18, 20, 112, 1.6)
    choir.cc(27.6, 11, 20)
    choir.n(27.8, 1.39, ['D4', 'A4', 'D5'], 70)
    choir.expr(27.8, 29.18, 20, 100, 1.5)
    fx.n(27.8, 1.4, 'riser', 85, lo=900, hi=12000, curve=1.8)
    fx.n(28.2, 1.0, 'revcym', 90)


# ============================================================================================
# v2  S4 Data world + the queue 29.2 - 43.4   (26 beats -> BOOST 41.5 on the grid)
# ============================================================================================
def s4():
    g = Grid(29.2, 60 / (12.3 / 26))
    b = g.b
    fx.n(29.2, 1.0, 'boom', 60, f0=70, f1=40)
    okit.n(29.2, 1.5, 57, 60)
    call = [(0, 'A4', .12), (.119, 'D5', .2), (.356, 'Eb5', .1), (.475, 'F#5', .2), (.71, 'A5', .35)]
    for dt, n_, d in call:
        glock.n(29.2 + dt, d, n_, 88)
        pizz.n(29.2 + dt, d, n_, 80)
    bassline = [(0, 'D2', .25), (.5, 'D3', .2), (.75, 'D2', .2), (1.5, 'Eb2', .25), (2, 'D2', .4),
                (2.75, 'F#2', .2), (3, 'G2', .25), (3.5, 'A2', .25)]
    maq = [(0, 'doum'), (.5, 'tek'), (1.5, 'tek'), (2, 'doum'), (3, 'tek')]
    orn = [.75, 1.0, 2.5, 3.25, 3.5, 3.75]

    def groove(b0, b1, vel=1.0, hats=True):
        for bar in range(int(b0 // 4), int(np.ceil(b1 / 4))):
            for off, n_, d in bassline:
                bt = bar * 4 + off
                if b0 <= bt < b1:
                    synbass.n(g(bt), b * d * 1.6, n_, int(100 * vel))
            for off, k in maq:
                bt = bar * 4 + off
                if b0 <= bt < b1:
                    darb.n(g(bt) + hum(0.003), 0.25, k, int((96 if k == 'doum' else 84) * vel))
            for off in orn:
                bt = bar * 4 + off
                if b0 <= bt < b1:
                    darb.n(g(bt) + hum(0.003), 0.2, 'ka', int(52 * vel))
            for i in range(16):
                bt = bar * 4 + i / 4
                if hats and b0 <= bt < b1:
                    kit.n(g(bt), 0.05, 42, int((70 if i % 2 == 0 else 45) * vel))
            for off in (1, 3):
                bt = bar * 4 + off
                if b0 <= bt < b1:
                    kit.n(g(bt), 0.1, 39, int(62 * vel))
            for off in (0.5, 1.5, 2.5, 3.5):
                bt = bar * 4 + off
                if b0 <= bt < b1:
                    pizz.n(g(bt), 0.15, ['F#3', 'A3'], int(58 * vel))

    groove(0, 6, 0.95)
    for i in range(6):
        blips.n(g(1 + i * 0.25), 0.08, int(RNG.choice(hijaz_notes(62, 86, 98))), 60)
    # traffic jam: honk honk
    for tt in (g(6), g(6.5)):
        mute.n(tt, 0.12, ['D5', 'Eb5', 'A4'], 100)
        synbass.n(tt, 0.1, 'D2', 100)
        pizz.n(tt, 0.1, ['D4', 'Eb4'], 90)
    darb.n(g(6), 0.25, 'doum', 100)
    # ILVIP 32.4-34.9: the waiting room - tick-tock clock, bored bassoon
    for k_ in range(7, 12):
        pizzlo.n(g(k_), 0.2, ['D3', 'A2'][k_ % 2], 62)
        kit.n(g(k_ + 0.5), 0.05, 76 if k_ % 2 else 77, 50)
    bassoon.n(g(7), b * 5 * 0.95, 'D2', 52)
    # whiny "wah-waah" on the tail of "...first half!"
    mute.cc(34.6, 11, 90)
    mute.n(34.78, 0.16, 'D5', 78)
    mute.n(34.96, 0.3, 'C#5', 74)
    for i in range(8):
        mute.bend(35.0 + i * 0.03, -0.9 * (i + 1) / 8)
    mute.bend(35.4, 0)
    # EMBY 35.1-36.55 "Still... buffering..." - sleepy vibes, then the deflating tuba/bassoon
    for tt, n_ in [(35.2, 'Eb5'), (35.55, 'D5'), (35.95, 'D5')]:
        vibes.n(tt, 0.6, n_, 44)
    tuba.bendrange = 12
    bassoon.bendrange = 12
    tuba.cc(35.9, 11, 100)
    tuba.n(36.0, 0.9, 'A1', 84)
    bassoon.n(36.0, 0.9, 'A2', 62)
    for i in range(28):
        tt = 36.3 + i * 0.02
        bnd = -7 * ((i + 1) / 28) ** 1.3 + 0.35 * np.sin(2 * np.pi * 9 * (tt - 36.3))
        tuba.bend(tt, bnd)
        bassoon.bend(tt, bnd)
    tuba.bend(36.93, 0)
    bassoon.bend(36.93, 0)
    # Catpacket 36.9-39.4: grumpy plod
    for i, n_ in enumerate(['D2', 'C2', 'Bb1', 'A1', 'G1']):
        tuba.n(g(16 + i), b * 0.55, n_, 96)
        bassoon.n(g(16 + i), b * 0.45, m(n_) + 12, 58)
        kit.n(g(16 + i + 0.5), 0.05, 42, 34)
    # 39.5 "dun!" between Cat and Bit
    T = 39.5
    ohit.n(T, 0.2, ['D3', 'D4'], 90)
    trombone.n(T, 0.25, ['D2', 'D3'], 110)
    tuba.n(T, 0.25, 'D1', 110)
    darb.n(T, 0.25, 'doum', 110)
    # Bit 39.7-41.4 "Sorry! GOTV doesn't wait in line!" - the build
    groove(22, 24, 0.9, hats=True)
    for i in range(8):
        synbass.n(g(24 + i / 4), b / 4 * 0.9, 'D2', 96 + 3 * i)
    for i in range(16):
        bt = 24 + i / 8
        okit.n(g(bt), 0.05, 38, 40 + 5 * i)
        darb.n(g(bt), 0.15, 'tek' if i % 2 else 'ka', 50 + 4 * i)
    run = ['A3', 'Bb3', 'C4', 'D4', 'Eb4', 'F#4', 'G4']
    strings.cc(39.0, 11, 100)
    for i, n_ in enumerate(run):
        strings.n(g(24 + i / 4), b / 4 * 1.05, [n_, m(n_) + 12], 78 + 5 * i)
    for i in range(int((41.48 - 40.5) / 0.05)):
        timp.n(40.5 + i * 0.05, 0.06, 'D2', 40 + 4 * i)
    fx.n(40.3, 1.2, 'riser', 80, lo=500, hi=9000, curve=2.5)
    # ---- 41.5 BOOST: Bit's theme bursts out over the whole queue
    T = g(26)
    gt = Grid(T, g.bpm)
    horns.cc(T - 0.3, 11, 120)
    trumpet.cc(T - 0.3, 11, 120)
    play_theme(trumpet, gt, 62, beats=(-1, 4), vel=108, legato=True)
    play_theme(horns, gt, 62, beats=(-1, 4), vel=108, legato=True)
    play_theme(violins, gt, 62, beats=(-1, 4), vel=100, octave=1, legato=True)
    ohit.n(T, 0.3, ['D4', 'A4'], 105)
    okit.n(T, 1.5, 57, 110)
    okit.n(T, 1.0, 36, 115)
    timp.n(T, 0.6, 'D2', 120)
    fx.n(T, 1.2, 'boom', 90, f0=90, f1=35)
    fx.n(T, 1.2, 'rocket', 80)
    trombone.n(T, b * 4 - 0.02, ['D3', 'A3'], 100)
    tuba.n(T, b * 4 - 0.02, 'D2', 100)
    strings.n(T, b * 4 - 0.02, ['D3', 'A3', 'F#4'], 95)
    strings.expr(T, 43.39, 90, 122)
    for i in range(16):
        synbass.n(gt(i / 4), b / 4 * 0.9, 'D2' if i % 4 else 'D1', 105 + (10 if i % 4 == 0 else 0))
    # 42.7 bursts into open fibre - full energy
    F = 42.7
    okit.n(F, 1.5, 57, 120)
    kit.n(F, 1.5, 49, 110)
    fx.n(F, 0.6, 'swoosh', 70)
    for i in range(16):
        tt = gt(i / 4)
        k = 'doum' if i in (0, 3, 8) else ('tek' if i % 2 == 0 else 'ka')
        darb.n(tt + hum(0.002), 0.2, k, 92 + (10 if tt >= F else 0))
    tt = F
    i = 0
    while tt < 43.38:
        kit.n(tt, 0.05, 42, 80)
        strings.n(tt, b / 4, ['D4', 'Eb4', 'F#4', 'Eb4'][i % 4], 105)
        i += 1
        tt = F + i * b / 4
    choir.cc(41.4, 11, 60)
    choir.n(F, 43.4 - F, ['D4', 'F#4', 'A4'], 90)
    choir.expr(F, 43.39, 60, 120)


# ============================================================================================
# S5  Ocean race 30.5 - 41.5
# ============================================================================================
def s5():
    g = Grid(30.5, 120)
    s = 0.125  # 16th
    # cut downbeat
    fx.n(30.5, 1.6, 'boom', 85, f0=60, f1=30)
    timp.n(30.5, 0.8, 'D2', 110)
    okit.n(30.5, 1.5, 57, 85)
    # Hijaz strings ostinato (16ths); chord map per half bar (seconds)
    patt = {'D': ['D3', 'Eb3', 'F#3', 'Eb3', 'D3', 'Eb3', 'F#3', 'G3'],
            'Gm': ['G2', 'A2', 'Bb2', 'A2', 'G2', 'A2', 'Bb2', 'D3'],
            'Cm': ['C3', 'D3', 'Eb3', 'D3', 'C3', 'D3', 'Eb3', 'G3'],
            'Eb': ['Eb3', 'F3', 'G3', 'F3', 'Eb3', 'G3', 'Bb3', 'G3']}
    plan = [(30.5, 'Gm'), (31.5, 'D'), (32.5, 'D'), (33.5, 'Cm'), (34.5, 'D'),
            (38.0, 'Gm'), (39.0, 'Cm'), (39.5, 'Eb'), (40.5, 'D'), (41.0, 'D')]
    ends = {34.5: 35.0, 39.5: 40.5}
    lowstr.cc(30.4, 11, 110)
    for i, (t0, ch) in enumerate(plan):
        t1 = ends.get(t0, plan[i + 1][0] if i + 1 < len(plan) else 41.5)
        if t0 == 39.0:
            t1 = 39.5
        k = 0
        tt = t0
        while tt < t1 - 1e-6:
            n_ = patt[ch][k % 8]
            speak = speaking(tt, 0.1)
            lowstr.n(tt + hum(0.003), s * 0.95, n_, (84 if k % 4 == 0 else 70) - (10 if speak else 0))
            if not speak:
                strings.n(tt + hum(0.003), s * 0.9, m(n_) + 12, 66 if k % 4 == 0 else 56)
            if k % 2 == 0:
                oud.n(tt + hum(0.003), 0.25, m(n_) + 12, 74 if k % 4 == 0 else 62)
            k += 1
            tt = t0 + k * s
    # driving darbuka (2-beat cycle of 16ths)
    cyc = ['doum', None, 'ka', 'tek', 'doum', None, 'tek', 'ka']
    fill = ['doum', 'ka', 'tek', 'ka', 'tek', 'ka', 'tek', 'tek']
    for base in list(np.arange(30.5, 35.0, 1.0)) + list(np.arange(38.0, 41.5, 1.0)):
        use = fill if base in (33.5, 40.5) else cyc
        for i, k in enumerate(use):
            tt = base + i * s
            if k and tt < (35.0 if base < 36 else 41.5):
                darb.n(tt + hum(0.003), 0.2, k, (96 if k == 'doum' else 80) + (6 if i == 0 else 0))
    for tt in np.arange(30.5, 35.0, 0.25):
        kit.n(tt + 0.125, 0.05, 54, 40)
    # low brass & horns: theme bar 2 continues over the cut
    horns.cc(30.4, 11, 115)
    play_theme(horns, Grid(30.5 - 4 * 0.5, 120), 62, beats=(4, 8), vel=104, legato=True)
    play_theme(trumpet, Grid(30.5 - 4 * 0.5, 120), 62, beats=(4, 6), vel=90, legato=True)
    trombone.n(30.5, 1.0, ['G2', 'D3', 'Bb3'], 95)
    trombone.n(31.5, 1.0, ['D3', 'A3', 'F#3'], 95)
    tuba.n(30.5, 1.0, 'G1', 100)
    tuba.n(31.5, 3.4, 'D2', 92)
    tuba.expr(31.5, 34.9, 110, 70)
    trombone.n(33.5, 1.0, ['C3', 'G3'], 60)
    # --- shark menace 35.0 - 36.0
    men = [(35.0, .25), (35.25, .25), (35.5, .125), (35.625, .125), (35.75, .0625), (35.8125, .0625),
           (35.875, .0625), (35.9375, .0625)]
    for i, (tt, d) in enumerate(men):
        n_ = ['D1', 'Eb1'][i % 2]
        tuba.n(tt, d * 0.9, [n_], 100 + 3 * i)
        lowstr.n(tt, d * 0.9, [m(n_) + 12, m(n_) + 24], 100 + 3 * i)
        trombone.n(tt, d * 0.9, [m(n_) + 24], 90 + 4 * i)
    tuba.cc(34.9, 11, 120)
    trem.cc(34.95, 11, 30)
    trem.n(35.0, 0.99, ['D6', 'Eb6', 'A5'], 80)
    trem.expr(35.0, 35.99, 30, 110, 1.5)
    for i in range(int(1.0 / 0.05)):
        timp.n(35.0 + i * 0.05, 0.06, 'D2', 40 + 4 * i)
    # --- 36.0 CHOMP
    T = 36.0
    for tr_, ns in [(trombone, ['D2', 'Eb3', 'A3']), (tuba, ['D1', 'D2']), (horns, ['Eb4', 'A4', 'D5']),
                    (trumpet, ['Eb5', 'A5']), (strings, ['D3', 'Eb4', 'A4', 'Eb5']), (lowstr, ['D2', 'Eb2'])]:
        tr_.cc(T - 0.01, 11, 127)
        tr_.n(T, 0.14, ns, 124)
    ohit.n(T, 0.2, ['D3', 'Eb4'], 118)
    okit.n(T, 1.5, 36, 127)
    okit.n(T, 1.6, 57, 112)
    timp.n(T, 0.6, 'D2', 127)
    darb.n(T, 0.3, 'doum', 124)
    fx.n(T, 1.0, 'boom', 100, f0=75, f1=32)
    # --- 36.2 boing
    fx.n(36.2, 0.9, 'boing', 95)
    pizz.n(36.2, 0.2, ['D3', 'A3', 'D4'], 100)
    xylo.n(36.2, 0.2, ['D6'], 90)
    # dazed: wobbly chromatic clarinet descent + stars
    clar.cc(36.3, 11, 100)
    for i, n_ in enumerate(range(m('D5'), m('D5') - 8, -1)):
        clar.n(36.35 + i * 0.135, 0.14, n_, 78 - 2 * i)
    for i in range(60):
        tt = 36.35 + i * 0.02
        clar.bend(tt, 0.35 * np.sin(2 * np.pi * 7 * (tt - 36.35)))
    clar.bend(37.6, 0)
    for tt, n_ in [(36.45, 'A6'), (36.7, 'F#6'), (36.95, 'D6'), (37.2, 'Eb6')]:
        vibes.n(tt, 0.5, n_, 60)
    # --- 37.6 cheeky theme snippet
    snip = [(37.6, 'A3', .12), (37.75, 'D4', .2), (38.0, 'D4', .1), (38.125, 'Eb4', .1), (38.25, 'F#4', .2),
            (38.5, 'A4', .3)]
    for tt, n_, d in snip:
        pizz.n(tt, d, n_, 96)
        oud.n(tt, d, n_, 90)
        xylo.n(tt, d, m(n_) + 24, 58)
    # --- groove resumes 38.0; run into the 40.5 arrival
    trombone.n(38.0, 1.0, ['G2', 'D3', 'Bb3'], 80)
    trombone.n(39.0, 0.5, ['C3', 'G3', 'Eb4'], 90)
    trombone.n(39.5, 1.0, ['Eb3', 'Bb3', 'G4'], 100)
    tuba.n(38.0, 1.0, 'G1', 90)
    tuba.n(39.0, 0.5, 'C2', 95)
    tuba.n(39.5, 1.0, 'Eb2', 100)
    for tr_ in (trombone, tuba):
        tr_.cc(37.9, 11, 100)
        tr_.expr(39.5, 40.49, 100, 125)
    run = ['D5', 'C5', 'Bb4', 'A4', 'G4', 'F#4', 'G4', 'A4']
    violins.cc(38.9, 11, 110)
    clar.cc(38.9, 11, 115)
    for i, n_ in enumerate(run):
        violins.n(39.0 + i * s, s * 1.02, [n_, m(n_) - 12], 100)
        clar.n(39.0 + i * s, s * 1.02, n_, 92)
    for tt, n_, d in [(40.0, 'F#4', .25), (40.25, 'Eb4', .25)]:
        violins.n(tt, d, [n_, m(n_) + 12], 108)
        clar.n(tt, d, m(n_) + 12, 96)
        horns.n(tt, d, n_, 104)
    # 40.5 ARRIVAL - Toronto shore
    T = 40.5
    for tr_, ns, v in [(horns, ['D4', 'F#4', 'A4', 'D5'], 112), (trumpet, ['A4', 'D5', 'F#5'], 104),
                       (trombone, ['D3', 'A3', 'F#4'], 108), (tuba, ['D2'], 112),
                       (violins, ['D5', 'D6'], 110), (trem, ['D4', 'F#4', 'A4', 'D5'], 100),
                       (lowstr, ['D2', 'D3'], 110), (choir, ['D4', 'F#4', 'A4', 'D5'], 100)]:
        tr_.cc(T - 0.01, 11, 100)
        tr_.n(T, 41.48 - T, ns, v)
        tr_.expr(T, 41.48, 100, 124)
    timp.n(T, 0.8, 'D2', 120)
    okit.n(T, 2.0, 57, 105)
    kit.n(T, 1.5, 49, 90)
    fx.n(38.6, 1.9, 'revcym', 80)
    for i in range(int(1.0 / 0.05)):
        timp.n(40.5 + i * 0.05, 0.06, 'A1', 45 + 3 * i)


# ============================================================================================
# S6  Last mile 41.5 - 46.0
# ============================================================================================
def s6():
    g = Grid(41.5, 60 / 0.425)       # 8 beats -> impact on beat 8 = 44.9
    b = g.b
    steps = [(0, 'D2', 'M'), (2, 'Eb2', 'M'), (4, 'E2', 'M'), (6, 'F2', 'M')]
    fx.n(41.5, 0.6, 'swoosh', 80)
    for i, n_ in enumerate(hijaz_notes(62, 62, 86)[::1]):
        harp.n(41.5 + i * 0.025, 0.3, n_, 70 + i)
    for bi, (bt, root, q) in enumerate(steps):
        r = m(root)
        chord = triad(r + 12, q)
        tend = min(g(bt + 2), 44.795)
        # bass pedal
        tuba.n(g(bt), tend - g(bt), r, 96 + 6 * bi)
        lowstr.n(g(bt), tend - g(bt), [r, r + 12], 90 + 8 * bi)
        # arpeggiated ostinato, 8ths then 16ths
        div = 2 if bt < 4 else 4
        pat = [chord[0], chord[1], chord[2], chord[0] + 12]
        k = 0
        while True:
            tt = g(bt + k / div)
            if tt >= tend - 1e-4 or k >= 2 * div:
                break
            strings.n(tt, b / div * 0.9, pat[k % 4] + (12 if bi >= 2 else 0), 76 + 8 * bi + (8 if k % div == 0 else 0))
            oud.n(tt, 0.2, pat[k % 4], 70 + 6 * bi)
            k += 1
        # brass "ta-DAA" rising sequence at each step
        horns.n(g(bt) - b / 2, b / 2 * 0.9, r + 7, 86 + 6 * bi)
        horns.n(g(bt), min(b * 2 * 0.95, tend - g(bt)), [r + 12, r + 16 if q == 'M' else r + 15, r + 19], 92 + 7 * bi)
        trombone.n(g(bt), min(b * 2 * 0.95, tend - g(bt)), [r + 12, r + 19], 90 + 7 * bi)
        timp.n(g(bt), 0.5, r if r >= m('D2') else r + 12, 90 + 8 * bi)
    horns.cc(41.4, 11, 100)
    horns.expr(41.5, 44.79, 90, 126)
    trumpet.cc(43.1, 11, 70)
    trumpet.n(g(4), 44.79 - g(4), ['E4', 'B4'], 90)
    trumpet.n(g(6), 44.79 - g(6), ['F4', 'C5', 'A4'], 100)
    trumpet.expr(g(4), 44.79, 70, 127)
    strings.cc(41.4, 11, 95)
    strings.expr(41.5, 44.79, 95, 127)
    lowstr.cc(41.4, 11, 110)
    # darbuka: 8ths -> 16ths -> 32nd roll
    tt = 41.5
    while tt < 44.79:
        bt = (tt - 41.5) / b
        div = 2 if bt < 4 else (4 if bt < 6 else 8)
        k = 'doum' if abs(bt - round(bt)) < 1e-6 and int(round(bt)) % 2 == 0 else ('tek' if int(bt * div) % 2 == 0 else 'ka')
        darb.n(tt, 0.15, k, int(70 + 45 * bt / 7.8))
        tt += b / div
    # snare roll crescendo
    tt = g(4)
    while tt < 44.79:
        okit.n(tt, 0.05, 38, int(40 + 80 * (tt - g(4)) / (44.8 - g(4))))
        tt += 0.045
    fx.n(42.3, 2.5, 'riser', 100, lo=200, hi=11000, curve=2.4)
    fx.n(43.5, 1.3, 'revcym', 95)
    # ---- (music gated silent 44.80 - 44.90) ----
    # 44.9 IMPACT "Delivered!" - F major (bII of E), resolves at the goal
    T = 44.9
    imp = dict(horns=['F3', 'C4', 'F4', 'A4', 'C5'], trumpet=['F4', 'A4', 'C5', 'F5'], trombone=['F2', 'C3', 'A3'],
               tuba=['F1', 'F2'], strings=['F3', 'C4', 'F4', 'A4', 'C5', 'F5'], lowstr=['F1', 'F2'],
               choir=['F3', 'C4', 'A4'])
    for k_, ns in imp.items():
        TR[k_].cc(T - 0.002, 11, 127)
        TR[k_].n(T, 0.45, ns, 127)
    ohit.n(T, 0.4, ['F3', 'C4', 'F4'], 127)
    timp.n(T, 1.0, 'F2', 127)
    okit.n(T, 2.0, 36, 127)
    okit.n(T, 2.0, 57, 127)
    kit.n(T, 2.0, 49, 120)
    darb.n(T, 0.4, 'doum', 127)
    fx.n(T, 2.2, 'boom', 127, f0=95, f1=28)
    # 45.3 - 46.4: breath, then anticipation into the goal
    trem.cc(45.2, 11, 25)
    trem.n(45.25, 46.39 - 45.25, ['F2', 'C3', 'F3', 'A3'], 90)
    trem.expr(45.25, 46.39, 25, 125, 2.2)
    for i in range(int((46.38 - 45.55) / 0.05)):
        tt = 45.55 + i * 0.05
        timp.n(tt, 0.06, 'F2', int(35 + 85 * (tt - 45.55) / 0.85))
    tt = 45.95
    while tt < 46.38:
        okit.n(tt, 0.05, 38, int(50 + 70 * (tt - 45.95) / 0.43))
        darb.n(tt + 0.012, 0.1, 'tek', int(55 + 60 * (tt - 45.95) / 0.43))
        tt += 0.04
    gl = hijaz_notes(64, 59, 83)
    for i, n_ in enumerate(gl):
        harp.n(46.0 + 0.17 * i / len(gl), 0.3, n_, 70 + 2 * i)
    fx.n(45.5, 0.9, 'revcym', 100)


# ============================================================================================
# S7  GOAL 46.4 - 54.5 (E Hijaz)
# ============================================================================================
def s7():
    E = 64
    g = Grid(46.4, 135)
    b = g.b
    # melody
    for tr_, octv, v in [(trumpet, 0, 116), (horns, 0, 112), (violins, 1, 110), (clar, 1, 84), (oud, 0, 100)]:
        tr_.cc(46.0, 11, 122)
        play_theme(tr_, g, E, beats=(-1, 16), vel=v, octave=octv, legato=(tr_ is not oud and tr_ is not clar))
    # oud tremolo on the long notes
    for bt, d, s_ in THEME:
        if d >= 1:
            k = 1
            while k * b / 4 < b * d * 0.9:
                oud.n(g(bt) + k * b / 4, 0.12, E + s_, 72)
                k += 1

    def chordfn(t0, t1, root, q, b0):
        ns = triad(root, q)
        strings.n(t0, t1 - t0, [ns[0] - 12, ns[1] - 12, ns[2] - 12, ns[0]], 96)
        trombone.n(t0, t1 - t0, [ns[0] - 12, ns[2] - 12, ns[1]], 94)
        choir.n(t0, t1 - t0, [ns[0], ns[1], ns[2]], 88)
        tuba.n(t0, (t1 - t0) * 0.5, ns[0] - 24, 100)
        tuba.n(t0 + (t1 - t0) * 0.5, (t1 - t0) * 0.45, ns[0] - 24 + 7, 92)
        # bass pizz/low strings in quarter notes
        k = 0
        while t0 + k * b < t1 - 1e-4:
            lowstr.n(t0 + k * b, b * 0.8, ns[0] - 24 + (12 if k % 2 else 0), 100)
            k += 1

    for tr_ in (strings, trombone, choir, tuba, lowstr):
        tr_.cc(46.3, 11, 118)
    theme_chords(g, E, chordfn)
    # dip under dialogue (Saba 48.3-50.5, Noa 51.4-52.9)
    for tr_ in (strings, trombone, choir, horns, trumpet, violins):
        tr_.expr(48.2, 48.5, 122, 108)
        tr_.expr(50.4, 50.7, 108, 120)
        tr_.expr(51.3, 51.5, 120, 104)
        tr_.expr(52.8, 53.0, 104, 122)
    # timpani + perc
    for bar in range(4):
        timp.n(g(bar * 4), 0.6, 'E2', 118)
        timp.n(g(bar * 4 + 2), 0.4, 'B1', 96)
    for i in range(4):
        timp.n(g(7 + i / 4), 0.2, 'B1', 90 + 6 * i)
    okit.n(g(0), 2.5, 57, 124)
    okit.n(g(0), 1.5, 36, 124)
    kit.n(g(0), 2.5, 49, 120)
    kit.n(g(8), 2.0, 57, 100)
    okit.n(g(8), 2.0, 57, 100)
    maq = [(0, 'doum'), (.5, 'tek'), (1.5, 'tek'), (2, 'doum'), (3, 'tek')]
    for bar in range(4):
        for off, k in maq:
            darb.n(g(bar * 4 + off) + hum(0.003), 0.25, k, 104 if k == 'doum' else 90)
        for off in (.75, 1.0, 2.5, 3.25, 3.5, 3.75):
            darb.n(g(bar * 4 + off) + hum(0.003), 0.2, 'ka', 64)
        for off in (1, 3):
            kit.n(g(bar * 4 + off), 0.1, 39, 100)          # stadium claps
            kit.n(g(bar * 4 + off) + 0.012, 0.1, 39, 80)
        for i in range(8):
            kit.n(g(bar * 4 + i / 2), 0.1, 54, 70 if i % 2 == 0 else 55)
    for i in range(8):
        darb.n(g(15 + i / 8), 0.15, 'tek' if i % 2 else 'ka', 80 + 4 * i)
    # the "ta-DA" button lands right after Noa's line (52.84 / 53.07)
    okit.n(g(15), 1.5, 57, 90)
    timp.n(g(15), 0.5, 'E2', 110)
    # settle 53.5 -> 54.5
    T = g(16)
    for tr_, ns, v in [(slowstr, ['E3', 'B3', 'E4', 'G#4'], 80), (choir, ['E4', 'G#4', 'B4'], 60),
                       (horns, ['E4', 'G#4'], 60)]:
        tr_.cc(T - 0.01, 11, 90)
        tr_.n(T, 54.15 - T, ns, v)
        tr_.expr(T, 54.1, 90, 30)
    for i, n_ in enumerate(['E3', 'B3', 'E4', 'G#4', 'B4', 'E5', 'G#5']):
        harp.n(T + i * 0.12, 0.8, n_, 70 - 3 * i)
    for i in range(10):
        oud.n(T + 0.06 * i, 0.1, 'E4', 60 - 3 * i)


# ============================================================================================
# v2  BACKGAMMON payoff 67.0 - 72.4 (E Hijaz, warm family groove: oud, darbuka, accordion)
# ============================================================================================
def backgammon():
    E = 64
    g = Grid(67.0, 60 / 0.54)          # 10 beats -> 72.4
    b = g.b
    chords = [(0, 2, 'E'), (2, 4, 'F'), (4, 5, 'E'), (5, 7, 'E'), (7, 9, 'Am'), (9, 9.5, 'F'), (9.5, 10, 'E')]
    tri = {'E': (52, 'M'), 'F': (53, 'M'), 'Am': (57, 'm')}
    for b0, b1, c in chords:
        r, q = tri[c]
        ns = triad(r, q)
        k = b0
        while k < b1 - 1e-6:
            pizzlo.n(g(k), 0.3, r - 12 if (k - b0) % 1 == 0 and int(k) % 2 == 0 else r - 5, 80)
            oud.n(g(k + 0.5) + hum(0.004), 0.2, ns, 70 if speaking(g(k + 0.5)) else 80)
            accord.n(g(k + 0.5), b * 0.4, [n_ + 12 for n_ in ns], 58 if speaking(g(k + 0.5)) else 70)
            k += 1
        slowstr.n(g(b0), (b1 - b0) * b, [n_ for n_ in ns], 50)
    slowstr.cc(66.95, 11, 60)
    accord.cc(66.95, 11, 100)
    # baladi on the darbuka + riq, claps once Saba finishes talking
    bal = [(0, 'doum'), (.5, 'doum'), (1.5, 'tek'), (2, 'doum'), (3, 'tek')]
    for bar in range(3):
        for off, k in bal:
            bt = bar * 4 + off
            if bt < 10:
                darb.n(g(bt) + hum(0.004), 0.25, k, 92 if k == 'doum' else 80)
        for off in (.75, 1.0, 2.5, 3.25, 3.5, 3.75):
            bt = bar * 4 + off
            if bt < 10:
                darb.n(g(bt) + hum(0.004), 0.2, 'ka', 52)
        for i in range(8):
            bt = bar * 4 + i / 2
            if bt < 10:
                kit.n(g(bt), 0.1, 54, 58 if i % 2 == 0 else 44)
    for bt in (5, 7, 9):
        kit.n(g(bt), 0.1, 39, 78)
        kit.n(g(bt) + 0.015, 0.1, 39, 62)
    # the payoff: Bit's theme as a folk dance tune (oud + klezmer clarinet), cadence F -> E at 72.4
    play_theme(oud, g.__class__(g(5), g.bpm), E, beats=(-1, 4), vel=96)
    clar.cc(69.2, 11, 105)
    play_theme(clar, g.__class__(g(5), g.bpm), E, beats=(-1, 4), vel=82, octave=1)
    for tr_, octv, v in [(oud, 0, 92), (clar, 1, 80)]:
        tr_.n(g(9), b * 0.45, E + 1 + 12 * octv, v)          # F (bII)
        tr_.n(g(9.5), b * 0.9, E + 12 * octv, v + 4)         # -> E
    # oud tremolo on the long notes
    for bt, d, s_ in THEME:
        if d >= 1 and bt < 4:
            k = 1
            while k * b / 4 < b * d * 0.9:
                oud.n(g(5 + bt) + k * b / 4, 0.1, E + s_, 66)
                k += 1
    for i in range(4):
        darb.n(g(9 + i / 4), 0.15, 'tek' if i % 2 else 'ka', 80 + 5 * i)


# ============================================================================================
# v2  TAG 72.4 - 77.8: music box, comic sag as the late competitors pant in, wink 77.4
# ============================================================================================
def tag():
    mbox.n(72.4, 0.28, 'B4', 70)
    mbox.n(72.7, 0.75, 'E5', 76)
    # 73.0 the competitors stagger in - the music box winds down (sags flat) and stops
    for i in range(18):
        mbox.bend(72.98 + i * 0.02, -1.2 * ((i + 1) / 18) ** 1.2)
    mbox.bend(73.5, 0)
    celesta.n(72.4, 0.6, ['E4', 'G#4', 'B4'], 34)
    # panting: wheezy tuba / bassoon huff-puff under "Did... did we miss the goal?"
    tuba.cc(72.9, 11, 80)
    for i, tt in enumerate([73.05, 73.35, 73.65, 73.95, 74.25]):
        tuba.n(tt, 0.1, 'B1', 62 - 3 * i)
        tuba.n(tt + 0.14, 0.1, 'C2', 56 - 3 * i)
        bassoon.n(tt, 0.08, 'B2', 50 - 3 * i)
        bassoon.n(tt + 0.14, 0.08, 'C3', 46 - 3 * i)
    # rewind (quick celesta sweep) then the theme again, tender, under Bit's line
    for i, n_ in enumerate(hijaz_notes(64, 71, 88)):
        celesta.n(74.5 + i * 0.022, 0.2, n_, 40 + i)
    mel = [(74.75, 'B4', .28, 70), (75.05, 'E5', .45, 76), (75.55, 'E5', .18, 66), (75.75, 'F5', .28, 68),
           (76.05, 'G#5', .36, 72), (76.45, 'B5', .6, 76)]
    for tt, n_, d, v in mel:
        mbox.n(tt, d, n_, v)
    for tt, ns in [(74.75, ['E4', 'G#4', 'B4']), (75.75, ['F4', 'A4', 'C5']), (76.45, ['E4', 'G#4', 'B4'])]:
        celesta.n(tt, 0.7, ns, 34)
    slowstr.cc(72.35, 11, 35)
    slowstr.n(72.4, 5.2, ['E3', 'B3'], 60)
    slowstr.expr(76.6, 77.6, 35, 10)
    # wink button (the theme's own "ta-DA")
    for tt, n_ in [(77.26, 'B5'), (77.4, 'E6')]:
        mbox.n(tt, 0.12, n_, 84)
        pizz.n(tt, 0.1, m(n_) - 24, 84)
    glock.n(77.4, 0.2, 'E7', 70)
    fx.n(77.4, 0.3, 'blip', 70)


def title():
    """Written in v1 time (57.3); placed with SHIFT = +20.5 -> end-card hit 77.8."""
    for i, tt in enumerate([57.13, 57.215]):
        darb.n(tt, 0.1, 'tek', 88 + 10 * i)
        okit.n(tt, 0.05, 38, 80 + 10 * i)
    trumpet.n(57.13, 0.15, ['F4', 'A4', 'C5'], 96)
    T = 57.3
    fin = dict(horns=['E3', 'B3', 'E4', 'G#4', 'B4'], trumpet=['B4', 'E5', 'G#5'], trombone=['E2', 'B2', 'G#3'],
               tuba=['E1', 'E2'], strings=['E3', 'B3', 'E4', 'G#4', 'B4', 'E5'], lowstr=['E1', 'E2'],
               choir=['E3', 'B3', 'G#4', 'E5'], violins=['G#5', 'B5', 'E6'], slowstr=['E4', 'B4', 'E5'])
    for k_, ns in fin.items():
        TR[k_].cc(T - 0.002, 11, 127)
        TR[k_].n(T, 3.1, ns, 118)
        TR[k_].expr(T + 0.35, 60.4, 118, 70, 0.6)
    ohit.n(T, 0.4, ['E3', 'B3', 'E4'], 118)
    timp.n(T, 1.5, 'E2', 127)
    okit.n(T, 2.5, 36, 127)
    okit.n(T, 2.7, 57, 124)
    kit.n(T, 2.7, 49, 118)
    darb.n(T, 0.4, 'doum', 127)
    fx.n(T, 2.5, 'boom', 110, f0=80, f1=30)
    for i in range(24):
        oud.n(T + 0.3 + i * 0.06, 0.1, ['E3', 'B3'][i % 2], 70 - i)
    ney.cc(57.5, 11, 100)
    orn = [(57.75, 'B5', .2), (57.95, 'C6', .12), (58.07, 'B5', .12), (58.19, 'A5', .12), (58.31, 'G#5', .14),
           (58.45, 'F5', .16), (58.61, 'G#5', .2), (58.81, 'E5', 1.5)]
    for tt, n_, d in orn:
        ney.n(tt, d, n_, 72)
    ney.expr(58.9, 60.4, 100, 30)
    for i in range(70):
        tt = 58.95 + i * 0.02
        ney.bend(tt, 0.13 * np.sin(2 * np.pi * 5.0 * (tt - 58.95)))


# ----------------------------------------------------------------------------------------------
# numpy instruments
# ----------------------------------------------------------------------------------------------
def mtof(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def ks_string(f, dur, vel, seed, t60=1.4, bright=0.6, pick=0.13):
    rng = np.random.default_rng(seed)
    n = int((dur + t60 * 0.8) * SR)
    P = SR / f
    L = int(np.floor(P - 0.5))
    fr = P - 0.5 - L
    c0, c1, c2 = 0.5 * (1 - fr), 0.5, 0.5 * fr
    gper = 10 ** (-3 / (t60 * f))
    # excitation: plectrum = filtered noise burst with pluck-position comb
    ex = rng.uniform(-1, 1, L)
    a = 0.15 + 0.8 * bright * (vel / 127)
    ex = signal.lfilter([a], [1, -(1 - a)], ex)
    d = max(1, int(pick * P))
    ex = ex - np.concatenate([np.zeros(d), ex[:-d]])
    y = np.zeros(n + L + 3)
    y[3:3 + L] = ex   # offset 3 so y[n-L-2] indexes safely
    off = 3
    pos = off + L
    end = off + n
    # damping: after note-off (dur), stronger loss (finger mute)
    doff = off + int(dur * SR)
    while pos < end:
        k = min(L, end - pos)
        gg = gper if pos < doff else gper ** 6
        seg = gg * (c0 * y[pos - L:pos - L + k] + c1 * y[pos - L - 1:pos - L - 1 + k] + c2 * y[pos - L - 2:pos - L - 2 + k])
        y[pos:pos + k] += seg
        pos += k
    out = y[off:end]
    return out * (vel / 127) ** 1.3


def render_oud(notes):
    out = np.zeros(N)
    for i, (t, dur, n, vel, kw) in enumerate(notes):
        f = mtof(n)
        s1 = ks_string(f, dur, vel, 1000 + i, t60=1.3 if n < 60 else 0.9)
        s2 = ks_string(f * 2 ** (4 / 1200), dur, vel, 5000 + i, t60=1.3 if n < 60 else 0.9)   # doubled course
        s_ = 0.5 * (s1 + s2)
        # pick click
        cl = np.random.default_rng(i).standard_normal(int(0.004 * SR)) * np.exp(-np.arange(int(0.004 * SR)) / 60)
        s_[:len(cl)] += cl * 0.05 * vel / 127
        a = int(t * SR)
        e = min(N, a + len(s_))
        if a < N:
            out[a:e] += s_[:e - a]
    # body resonance (short IR of damped modes)
    tt = np.arange(int(0.12 * SR)) / SR
    body = np.zeros_like(tt)
    for fr, dec, amp in [(105, 0.05, 1.0), (205, 0.035, 0.8), (390, 0.02, 0.6), (1050, 0.008, 0.35), (2600, 0.004, 0.2)]:
        body += amp * np.sin(2 * np.pi * fr * tt) * np.exp(-tt / dec)
    body /= np.abs(body).sum() * 0.02
    wet = signal.fftconvolve(out, body)[:N]
    y = 0.55 * out + 0.45 * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(out))
    sos = signal.butter(2, 6500, 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, y)


def darbuka_hit(kind, vel, seed):
    rng = np.random.default_rng(seed)
    v = (vel / 127) ** 1.4
    if kind == 'doum':
        n = int(0.55 * SR)
        t = np.arange(n) / SR
        f = 92 * (1 + 0.35 * np.exp(-t / 0.018)) * rng.uniform(0.98, 1.02)
        ph = 2 * np.pi * np.cumsum(f) / SR
        y = np.sin(ph) * np.exp(-t / 0.22)
        y += 0.35 * np.sin(ph * 1.59 + 0.3) * np.exp(-t / 0.07)
        y += 0.2 * np.sin(ph * 2.14) * np.exp(-t / 0.04)
        nz = rng.standard_normal(n) * np.exp(-t / 0.006)
        y += 0.5 * signal.sosfilt(signal.butter(2, 900, 'low', fs=SR, output='sos'), nz)
        # goblet body (Helmholtz) ring
        y += 0.25 * np.sin(2 * np.pi * 240 * t) * np.exp(-t / 0.05)
        y = np.tanh(1.6 * y) / 1.2
        return y * v
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    if kind == 'tek':
        modes = [(680, 0.035, 0.5), (1420, 0.02, 0.45), (2550, 0.012, 0.4), (3900, 0.008, 0.3), (5300, 0.005, 0.2)]
        amp, hp = 1.0, 2500
    else:  # ka (other hand, softer, darker)
        modes = [(610, 0.028, 0.5), (1300, 0.016, 0.4), (2300, 0.01, 0.3), (3500, 0.006, 0.15)]
        amp, hp = 0.6, 1800
    y = np.zeros(n)
    for fr, dec, a in modes:
        fr *= rng.uniform(0.985, 1.015)
        y += a * np.sin(2 * np.pi * fr * t + rng.uniform(0, 6)) * np.exp(-t / dec)
    nz = rng.standard_normal(n) * np.exp(-t / 0.004)
    y += 0.9 * signal.sosfilt(signal.butter(2, hp, 'high', fs=SR, output='sos'), nz)
    return y * v * amp * 0.9


def render_darbuka(notes):
    out = np.zeros((N, 2))
    for i, (t, dur, n, vel, kw) in enumerate(notes):
        kind = kw.get('kind', 'doum')
        h = darbuka_hit(kind, vel, 777 + i)
        pan = -0.1 if kind == 'doum' else (0.15 if kind == 'tek' else -0.25)
        a = int(t * SR)
        e = min(N, a + len(h))
        if a >= N:
            continue
        out[a:e, 0] += h[:e - a] * np.sqrt(0.5 * (1 - pan))
        out[a:e, 1] += h[:e - a] * np.sqrt(0.5 * (1 + pan))
    return out


def noise_sweep(dur, lo, hi, curve, seed, env_curve=2.0, bw=0.5):
    """Filtered-noise riser via STFT spectral masking."""
    n = int(dur * SR)
    x = np.random.default_rng(seed).standard_normal(n)
    f, tt, Z = signal.stft(x, fs=SR, nperseg=1024)
    u = np.clip(tt / dur, 0, 1)
    fc = lo * (hi / lo) ** (u ** curve)
    lf = np.log2(np.maximum(f, 1))[:, None]
    mask = np.exp(-0.5 * ((lf - np.log2(fc)[None, :]) / bw) ** 2)
    mask += 0.15 * (f[:, None] > fc[None, :] * 0.5)
    _, y = signal.istft(Z * mask, fs=SR, nperseg=1024)
    y = y[:n]
    env = (np.arange(n) / n) ** env_curve
    return y * env / (np.max(np.abs(y * env)) + 1e-9)


def render_fx(notes):
    out = np.zeros((N, 2))
    for i, (t, dur, n, vel, kw) in enumerate(notes):
        kind = kw['kind']
        v = vel / 127
        tt = np.arange(int(dur * SR)) / SR
        if kind == 'riser':
            y = noise_sweep(dur, kw.get('lo', 300), kw.get('hi', 8000), kw.get('curve', 2), 91 + i)
            # add a rising tonal sweep (two detuned saws, soft)
            f = 110 * 2 ** (2.5 * (tt / dur) ** 1.6)
            ph = np.cumsum(f) / SR
            saw = ((ph % 1) - 0.5) + ((ph * 1.007 % 1) - 0.5)
            saw = signal.sosfilt(signal.butter(2, 3000, 'low', fs=SR, output='sos'), saw)
            y = 0.8 * y + 0.18 * saw * (tt / dur) ** 2
            st = np.stack([y, np.roll(y, 240)], 1) * 0.5 * v
        elif kind == 'revcym':
            nz = np.random.default_rng(31 + i).standard_normal(len(tt))
            nz = signal.sosfilt(signal.butter(2, 4000, 'high', fs=SR, output='sos'), nz)
            env = np.exp((tt - dur) / (dur * 0.35))
            env[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
            y = nz * env
            st = np.stack([y, np.roll(y, 360)], 1) * 0.28 * v
        elif kind == 'boom':
            f0, f1 = kw.get('f0', 80), kw.get('f1', 35)
            f = f1 + (f0 - f1) * np.exp(-tt / 0.12)
            y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (dur * 0.35))
            nz = np.random.default_rng(7 + i).standard_normal(len(tt)) * np.exp(-tt / 0.015)
            nz = signal.sosfilt(signal.butter(2, 2500, 'low', fs=SR, output='sos'), nz)
            y = np.tanh(1.8 * (y + 0.35 * nz))
            a = int(0.002 * SR)
            y[:a] *= np.linspace(0, 1, a)
            st = np.stack([y, y], 1) * 0.55 * v
        elif kind == 'rocket':
            y = noise_sweep(dur, 400, 9000, 0.7, 55 + i, env_curve=0.3)
            y *= np.exp(-np.maximum(tt - dur * 0.7, 0) / 0.15)
            f = 180 * 2 ** (3 * (tt / dur) ** 0.7)
            sq = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.12 * np.exp(-tt / (dur * 0.6))
            y = 0.8 * y + sq
            st = np.stack([y, np.roll(y, 200)], 1) * 0.35 * v
        elif kind == 'swoosh':
            y = noise_sweep(dur, 800, 9000, 0.6, 71 + i, env_curve=0.4)
            y *= np.exp(-tt / (dur * 0.4))
            st = np.stack([y * 0.8, y], 1) * 0.3 * v
        elif kind == 'boing':
            base = 150 * (1 + 0.9 * (1 - np.exp(-tt / 0.08)))
            f = base * (1 + 0.28 * np.exp(-tt / 0.25) * np.sin(2 * np.pi * 13 * tt))
            ph = 2 * np.pi * np.cumsum(f) / SR
            y = (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)) * np.exp(-tt / 0.28)
            a = int(0.003 * SR)
            y[:a] *= np.linspace(0, 1, a)
            st = np.stack([y, y], 1) * 0.3 * v
        elif kind == 'blip':
            f = 900 * 2 ** (1.5 * tt / dur)
            y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.07)
            st = np.stack([y * 0.7, y], 1) * 0.2 * v
        else:
            continue
        a = int(t * SR)
        e = min(N, a + len(st))
        out[a:e] += st[:e - a]
    return out


# ----------------------------------------------------------------------------------------------
# Rendering
# ----------------------------------------------------------------------------------------------
_SYNTH = None


def sf_synth():
    global _SYNTH
    if _SYNTH is None:
        import tinysoundfont as tsf
        s = tsf.Synth(samplerate=SR, gain=-6)
        sfid = s.sfload(SF2)
        _SYNTH = (s, sfid)
    return _SYNTH


def render_sf(tr, notes):
    s, sfid = sf_synth()
    ch = 9 if tr.drums else 0
    s.sounds_off()
    s.program_select(ch, sfid, tr.bank, tr.prog, tr.drums)
    s.control_change(ch, 7, 127)
    s.control_change(ch, 11, 127)
    s.control_change(ch, 10, 64)
    s.pitchbend(ch, 8192)
    s.pitchbend_range(ch, getattr(tr, 'bendrange', 2))
    ev = []
    for t, dur, n, vel, kw in notes:
        ev.append((int(round(t * SR)), 1, n, vel))
        ev.append((int(round((t + dur) * SR)), 0, n, 0))
    for t, kind, a, b in tr.ctl:
        ev.append((int(round(t * SR)), 2 if kind == 'cc' else 3, a, b))
    ev.sort(key=lambda e: (e[0], e[1]))   # note-offs before note-ons at the same sample
    first = min(int(round(t * SR)) for t, *_ in notes)
    last = max(int(round((t + d) * SR)) for t, d, *_ in notes)
    stop = min(N, last + int(3.5 * SR))
    out = np.zeros((N, 2), np.float32)
    pos = None
    for smp, typ, a, b in ev:
        if smp > stop:
            break
        if pos is None:
            if smp >= first:
                pos = max(0, first)
            else:   # apply controllers before first note instantly
                if typ == 2:
                    s.control_change(ch, a, b)
                elif typ == 3:
                    s.pitchbend(ch, int(np.clip(8192 + a / getattr(tr, 'bendrange', 2) * 8192, 0, 16383)))
                continue
        smp = max(smp, pos)
        if smp > pos:
            buf = np.frombuffer(s.generate(smp - pos), dtype=np.float32).reshape(-1, 2)
            out[pos:smp] = buf
            pos = smp
        if typ == 1:
            s.noteon(ch, a, b)
        elif typ == 0:
            s.noteoff(ch, a)
        elif typ == 2:
            s.control_change(ch, a, b)
        else:
            s.pitchbend(ch, int(np.clip(8192 + a / getattr(tr, 'bendrange', 2) * 8192, 0, 16383)))
    if pos is not None and pos < stop:
        buf = np.frombuffer(s.generate(stop - pos), dtype=np.float32).reshape(-1, 2)
        out[pos:stop] = buf
    s.sounds_off()
    return out.astype(np.float64)


def render_track(tr, notes):
    if tr.synth == 'oud':
        y = render_oud(notes)
        return np.stack([y, y], 1)
    if tr.synth == 'darbuka':
        return render_darbuka(notes)
    if tr.synth == 'fx':
        return render_fx(notes)
    return render_sf(tr, notes)


def pan_st(x, pan, width=1.0):
    mid = 0.5 * (x[:, 0] + x[:, 1])
    side = 0.5 * (x[:, 0] - x[:, 1]) * width
    l, r = mid + side, mid - side
    gl, gr = np.sqrt(0.5 * (1 - pan)) * np.sqrt(2), np.sqrt(0.5 * (1 + pan)) * np.sqrt(2)
    return np.stack([l * gl, r * gr], 1)


def make_ir(t60=2.1, length=3.2, seed=3):
    rng = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    lo = signal.butter(2, 2500, 'low', fs=SR, output='sos')
    for c in range(2):
        nz = rng.standard_normal(n)
        l = signal.sosfilt(lo, nz)
        h = nz - l
        ir[:, c] = l * np.exp(-6.9 * t / t60) + 0.6 * h * np.exp(-6.9 * t / (t60 * 0.4))
        ir[:int(0.018 * SR), c] = 0      # predelay
        for k in range(8):                # early reflections
            d = int(rng.uniform(0.02, 0.08) * SR)
            ir[d, c] += rng.uniform(0.3, 0.8) * (1 if rng.random() > 0.5 else -1)
    fade = int(0.03 * SR)
    ir[:int(0.018 * SR) + fade] *= np.linspace(0, 1, int(0.018 * SR) + fade)[:, None] ** 0.5
    ir /= np.sqrt((ir ** 2).sum(0).mean())
    return ir


def tape_stop(x, t0, T=0.55):
    n0 = int(t0 * SR)
    nT = int(T * SR)
    u = np.arange(nT) / nT
    speed = (1 - u) ** 1.7
    pos = n0 + np.cumsum(speed)
    y = x.copy()
    for c in range(2):
        y[n0:n0 + nT, c] = np.interp(pos, np.arange(len(x)), x[:, c])
    fo = int(0.03 * SR)
    y[n0 + nT - fo:n0 + nT] *= np.linspace(1, 0, fo)[:, None]
    y[n0 + nT:] = 0
    # gentle darkening as it slows
    return y


def gate_at(x, t0, fade=0.012):
    n0 = int(t0 * SR)
    f = int(fade * SR)
    y = x.copy()
    y[n0 - f:n0] *= np.linspace(1, 0, f)[:, None]
    y[n0:] = 0
    return y


def compose():
    s1()
    s2()
    freeze()
    s4()
    for fn, sh in [(s5, 12.9), (s6, 12.9), (s7, 12.9), (title, 20.5)]:
        SHIFT[0] = sh
        fn()
    SHIFT[0] = 0.0
    backgammon()
    tag()
    # map darbuka / fx pseudo-notes
    for tr in (darb, fx):
        tr.notes = [(t, d, 0, v, dict(kw, kind=k)) for t, d, k, v, kw in
                    [(a, b, c_, d_, e_) for a, b, c_, d_, e_ in _pseudo[tr.name]]]


# darbuka / fx use string "notes" - intercept before m() parsing
_pseudo = {'darb': [], 'fx': []}


def _pseudo_n(self, t, dur, note, vel=90, **kw):
    _pseudo[self.name].append((float(t) + SHIFT[0], float(dur), note, int(np.clip(vel, 1, 127)), kw))


darb.n = _pseudo_n.__get__(darb)
fx.n = _pseudo_n.__get__(fx)


def main():
    compose()
    ir = make_ir()
    stems = {}
    nseg = len(SEG_BOUNDS) + 1
    for name, tr in TR.items():
        if not tr.notes:
            continue
        for sg in range(nseg):
            notes = [x for x in tr.notes if seg_of(x[0]) == sg]
            if not notes:
                continue
            y = render_track(tr, notes)
            y = pan_st(y, tr.pan, tr.width) * tr.gain
            key = (tr.stem, sg)
            if key not in stems:
                stems[key] = [np.zeros((N, 2)), np.zeros((N, 2))]
            stems[key][0] += y
            stems[key][1] += y * tr.rev
        print('rendered', name, len(tr.notes), file=sys.stderr)
    # reverb + segment processing
    final = {}
    for (stem, sg), (dry, send) in stems.items():
        wet = np.stack([signal.fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], 1) * 0.5
        y = dry + wet
        if sg == 0:
            y = tape_stop(y, 15.3)
        elif sg == 1:
            y = gate_at(y, 57.7)
        final.setdefault(stem, np.zeros((N, 2)))
        final[stem] += y
    # carve 1-4 kHz under dialogue (gentle, ~-3.5 dB) - linear, so applied per stem
    env = np.zeros(N)
    for t0, t1, who in LINES:
        env[int((t0 - 0.05) * SR):int((t1 + 0.1) * SR)] = 1
    k = int(0.06 * SR)
    env = np.convolve(env, np.ones(k) / k, mode='same')
    sos = signal.butter(2, [1000, 4000], 'band', fs=SR, output='sos')
    depth = 1 - 10 ** (-3.5 / 20)
    for stem in final:
        band = signal.sosfiltfilt(sos, final[stem], axis=0)
        final[stem] = final[stem] - depth * env[:, None] * band
    # master fade: ring out, fade 58.6 -> 60
    fade = np.ones(N)
    a = int(80.2 * SR)
    fade[a:] = np.cos(np.linspace(0, np.pi / 2, N - a)) ** 1.2
    for stem in final:
        final[stem] *= fade[:, None]
    # section dynamics (emotional shape): the goal must be the peak, ocean a notch below, tag intimate
    dyn = [(0, 0), (43.3, 0), (43.5, -2.5), (47.9, -2.5), (48.2, -1), (50.9, -2), (53.2, -1.5), (53.5, 0),
           (59.2, 0), (59.35, 1.5), (66.4, 1.5), (67.0, 0), (72.3, 0), (72.45, 3), (77.7, 3), (77.79, 0), (81, 0)]
    dcurve = 10 ** (np.interp(np.arange(N) / SR, [d[0] for d in dyn], [d[1] for d in dyn]) / 20)
    for stem in final:
        final[stem] *= dcurve[:, None]
    mix = sum(final.values())
    # loudness normalise to -18 LUFS and peak-limit to -1.2 dBFS; same gain curve applied to stems
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    gcurve = np.ones(N)
    for it in range(3):
        cur = mix * gcurve[:, None]
        lufs = meter.integrated_loudness(cur)
        gcurve *= 10 ** ((-18.0 - lufs) / 20)
        cur = mix * gcurve[:, None]
        peak = np.max(np.abs(cur), 1)
        thr = 10 ** (-1.3 / 20)
        need = np.minimum(1.0, thr / np.maximum(peak, 1e-9))
        # lookahead min filter + smooth release
        la = int(0.004 * SR)
        from scipy.ndimage import minimum_filter1d
        need = minimum_filter1d(need, 2 * la + 1)
        rel = np.exp(-1 / (0.08 * SR))
        sm = np.empty_like(need)
        prev = 1.0
        # attack-instant, release-smooth (vectorised via reversed scan approximated in python loop chunks)
        for i in range(len(need)):
            v = need[i]
            prev = v if v < prev else prev * rel + v * (1 - rel)
            sm[i] = prev
        gcurve *= sm
    mix = mix * gcurve[:, None]
    print('LUFS', meter.integrated_loudness(mix), 'peak dBFS', 20 * np.log10(np.max(np.abs(mix))), file=sys.stderr)
    os.makedirs(os.path.join(MUS, 'stems'), exist_ok=True)
    sf.write(os.path.join(MUS, 'score.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
    for stem, y in final.items():
        sf.write(os.path.join(MUS, 'stems', f'{stem}.wav'), (y * gcurve[:, None]).astype(np.float32), SR,
                 subtype='PCM_24')
    print('wrote', os.path.join(MUS, 'score.wav'), file=sys.stderr)


if __name__ == '__main__':
    main()
