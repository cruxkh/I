#!/usr/bin/env python3
"""GOTV v6 - original score (reproducible).  python3 score_v6.py

Renders audio/v6/score.wav (40.000 s, 48 kHz, stereo, 24-bit, peak -1.0 dBFS, music only)
+ audio/v6/stems/*.wav (drums, orch, bass, keys, brass, strings, hook; they sum to score.wav)
+ audio/v6/score_v6_spectrogram.png and a numeric report on stderr.

Sound sources
  * GeneralUser GS SoundFont rendered offline with tinysoundfont (same engine as anim/audio/tools/score.py):
    Standard + Orchestral drum kits, finger bass, Funk Guitar / Muted Guitar, Tine EP, grand piano,
    brass section / trumpet / trombone / french horns, fast/slow/tremolo/pizzicato strings, harp,
    timpani, orchestra hit, glockenspiel, xylophone, "Whistlin'" (real whistle), music box, celesta.
  * numpy: Karplus-Strong nylon pluck (doubled courses + body resonance), reversed-crash swells
    (rendered from the kit's own crash sample), generated stereo convolution IRs (room + hall).

Key C major (A-minor colour in the verse), ~120 BPM.  Exactly 120 BPM cannot put both 25.64 and 36.90 on
downbeats (11.26 s = 22.52 beats), so the grid is:
  G1  119.67 BPM, downbeats 3.58 (logo stab) ... 25.64 (drop) - 11 bars exactly (22.06 s / 44 beats)
  GD  118.68 BPM from the freeze restart 27.80 (2/4 bar) + 4 bars -> final hit 36.90 on a downbeat
      (button 30.33 = beat 4 of bar D1, TV-on sparkle 31.09 = "and" of D2)
Hook (the GOTV motif, sol-do-mi-SOL-mi re . ti re): Q = G C E G E D B D / answer A = C E A G F E C.

Timeline (s)
  0.00- 3.58 HOOK    tiptoe pizz/pluck search (Am), question-mark Bdim rise, STOP 2.33-2.83, GO run, stab @3.58
  3.58-20.3  VERSE   C|G hook on glock/xylo; groove (Am7 Fmaj7) Netflix push 6.96, stadium toms bar 9.60
                     (Dm7 G7), hook returns 11.60 (series 11.98), library tick 16.74-18.24, hook develops 17.62
 20.30-23.64 LIFT    four-on-floor, rising strings, horns swell (F G | Am F) -> hit 23.64
 23.89-25.32 SUSPENSE timp/low-string G pulse, trem strings rising, snare roll, reverse crash; ZERO 25.32-25.64
 25.64-36.90 CHORUS  tutti C drop; freeze gag 27.19-27.80 (held G/B + stuck glock), restart 27.80,
                     goal lift = hook ascent 28.81-29.3, button stab 30.33, TV sparkle 31.09, cadence hit 36.90
 36.90-40.00 END     ringing Cmaj9 + music-box/celesta echo of the hook, fade to digital zero at 40.0
"""
import os
import sys

import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
SF2 = '/home/user/I/anim/audio/music/sf/GeneralUser-GS.sf2'
SR = 48000
DUR = 40.0
N = int(SR * DUR)
RNG = np.random.default_rng(6060)

T_SIL0, T_SIL1 = 25.32, 25.64          # digital silence window
T_FRZ0, T_FRZ1 = 27.19, 27.80          # freeze gag
T_END = 36.90

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


class Grid:
    def __init__(self, t0, beat):
        self.t0, self.b = t0, beat

    def __call__(self, beat):
        return self.t0 + beat * self.b


B1 = 22.06 / 44            # 0.501364 s  (119.67 BPM)
G1 = Grid(3.58, B1)        # bar k downbeat = G1(4k); bar 11 = 25.64
B2 = 9.1 / 18              # 0.505556 s  (118.68 BPM)
GC = Grid(25.64, B2)       # chorus bar C1 (cut by the freeze)
GD = Grid(27.80, B2)       # restart: 2/4 bar at 27.80, bars D1..D4 at GD(2), GD(6), GD(10), GD(14); GD(18) = 36.90


def bar1(k, beat=0.0):
    return G1(4 * k + beat)


def barD(k, beat=0.0):
    return GD(2 + 4 * k + beat)


# voice-over phrases (lines.js, measured on audio/vo.wav)
LINES = [(0.10, 2.66), (3.00, 4.64), (4.97, 6.41), (6.69, 8.82), (9.02, 10.09), (10.20, 11.80), (12.00, 15.44),
         (15.79, 18.56), (18.80, 20.34), (20.68, 23.56), (24.01, 25.22), (25.64, 27.23), (27.19, 29.96),
         (30.12, 32.09), (32.05, 35.25), (35.21, 36.90)]


def speaking(t, pad=0.04):
    return any(a - pad < t < b + pad for a, b in LINES)


def hum(ms=5.0):
    return float(RNG.uniform(-ms, ms)) / 1000.0


def rv(lo, hi):
    return int(RNG.integers(lo, hi + 1))


# ----------------------------------------------------------------------------------------------
# Tracks
# ----------------------------------------------------------------------------------------------
class Track:
    def __init__(self, name, stem, prog=0, bank=0, drums=False, gain=1.0, pan=0.0, width=1.0,
                 room=0.0, hall=0.2, synth=None, eq=None):
        self.eq = eq or []
        self.name, self.stem, self.prog, self.bank, self.drums = name, stem, prog, bank, drums
        self.gain, self.pan, self.width, self.room, self.hall, self.synth = gain, pan, width, room, hall, synth
        self.notes = []
        self.ctl = []
        self.bendrange = 2

    def n(self, t, dur, note, vel=90, **kw):
        if isinstance(note, (list, tuple)):
            for x in note:
                self.n(t, dur, x, vel, **kw)
            return
        self.notes.append([float(t), float(max(dur, 0.02)), m(note), int(np.clip(vel, 1, 127)), kw])

    def strum(self, t, dur, notes, vel, up=False, spread=0.007, **kw):
        ns = [m(x) for x in notes]
        if up:
            ns = ns[::-1]
        for i, x in enumerate(ns):
            self.n(t + i * spread, dur - i * spread, x, vel - (3 * i if not up else 0), **kw)

    def cc(self, t, num, val):
        self.ctl.append((float(t), 'cc', num, int(np.clip(val, 0, 127))))

    def expr(self, t0, t1, v0, v1, curve=1.0, step=0.02):
        k = max(2, int((t1 - t0) / step))
        for i in range(k + 1):
            u = i / k
            self.cc(t0 + (t1 - t0) * u, 11, v0 + (v1 - v0) * (u ** curve))

    def bend(self, t, semis):
        self.ctl.append((float(t), 'bend', semis, 0))

    def scoop(self, t, semis=-0.6, dur=0.07):
        for i in range(8):
            self.bend(t - 0.002 + dur * i / 7, semis * (1 - i / 7) ** 1.5)

    def vib(self, t0, t1, depth=0.12, rate=5.3, delay=0.18):
        tt = t0
        while tt < t1:
            ramp = min(1.0, max(0.0, (tt - t0 - delay) / 0.25))
            self.bend(tt, depth * ramp * np.sin(2 * np.pi * rate * (tt - t0)))
            tt += 0.015
        self.bend(t1, 0.0)


TR = {}


def track(name, *a, **k):
    TR[name] = Track(name, *a, **k)
    return TR[name]


# drums (GM Standard 1 kit, split into elements so each can be balanced / EQ'd)
kick = track('kick', 'drums', 0, 128, True, gain=1.0, room=0.10, hall=0.0)
snare = track('snare', 'drums', 0, 128, True, gain=1.0, pan=0.03, room=0.30, hall=0.10)
hats = track('hats', 'drums', 0, 128, True, gain=1.0, pan=0.22, room=0.15, hall=0.03)
cym = track('cym', 'drums', 0, 128, True, gain=1.0, pan=-0.08, width=1.3, room=0.10, hall=0.18)
toms = track('toms', 'drums', 0, 128, True, gain=1.0, room=0.28, hall=0.12, width=1.2)
perc = track('perc', 'drums', 0, 128, True, gain=1.0, pan=-0.28, room=0.2, hall=0.12)
revcym = track('revcym', 'drums', 0, 128, True, gain=1.0, width=1.4, hall=0.25, synth='revcym')
okit = track('okit', 'orch', 48, 128, True, gain=1.0, room=0.1, hall=0.32)
timp = track('timp', 'orch', 47, gain=1.0, hall=0.3, room=0.1)
ohit = track('ohit', 'orch', 55, gain=1.0, hall=0.3)
# bass / keys / guitars
bass = track('bass', 'bass', 33, gain=1.0, room=0.04, hall=0.0)
gtr = track('gtr', 'keys', 28, 8, gain=1.0, pan=-0.42, room=0.14, hall=0.06)
gtr2 = track('gtr2', 'keys', 28, 8, gain=1.0, pan=0.42, room=0.14, hall=0.06)
mgtr = track('mgtr', 'keys', 28, 0, gain=1.0, pan=-0.35, room=0.12, hall=0.04)
ep = track('ep', 'keys', 4, gain=1.0, pan=0.28, width=1.2, hall=0.22)
piano = track('piano', 'keys', 0, gain=1.0, pan=0.08, width=1.1, hall=0.22)
pluck = track('pluck', 'keys', synth='ks', gain=1.0, pan=0.32, hall=0.22, room=0.1)
# brass
brass = track('brass', 'brass', 61, gain=1.0, pan=0.12, width=1.2, hall=0.25)
tpt = track('tpt', 'brass', 56, gain=1.0, pan=0.3, hall=0.28)
tbn = track('tbn', 'brass', 57, gain=1.0, pan=-0.22, hall=0.25)
horns = track('horns', 'brass', 60, gain=1.0, pan=-0.3, hall=0.38)
# strings
strings = track('strings', 'strings', 48, gain=1.0, pan=-0.12, width=1.35, hall=0.36)
slowstr = track('slowstr', 'strings', 49, gain=1.0, pan=0.12, width=1.35, hall=0.4)
lowstr = track('lowstr', 'strings', 48, gain=1.0, pan=0.2, hall=0.3)
trem = track('trem', 'strings', 44, gain=1.0, pan=-0.05, width=1.3, hall=0.36)
pizz = track('pizz', 'strings', 45, gain=1.0, pan=-0.22, hall=0.28)
pizzlo = track('pizzlo', 'strings', 45, gain=1.0, pan=0.15, hall=0.22)
harp = track('harp', 'strings', 46, gain=1.0, pan=-0.32, width=1.2, hall=0.42)
# hook colours
glock = track('glock', 'hook', 9, gain=1.0, pan=0.26, hall=0.34)
xylo = track('xylo', 'hook', 13, gain=1.0, pan=-0.26, hall=0.24)
whistle = track('whistle', 'hook', 78, 11, gain=1.0, pan=0.04, hall=0.32)
mbox = track('mbox', 'hook', 10, gain=1.0, pan=0.0, hall=0.45)
celesta = track('celesta', 'hook', 8, gain=1.0, pan=0.3, width=1.2, hall=0.45)

# balance trims (dB) - set from per-track analysis of the rendered stems (see report)
TRIM = dict(kick=-1.5, snare=2.5, hats=15.0, cym=2.0, toms=2.0, perc=7.0, revcym=-2.0, okit=-1.0, timp=-1.0, ohit=-13.0,
            bass=0.0, gtr=6.0, gtr2=6.0, mgtr=4.0, ep=7.0, piano=2.0, pluck=-8.0,
            brass=2.0, tpt=1.0, tbn=2.0, horns=5.0,
            strings=8.0, slowstr=8.0, lowstr=6.0, trem=5.0, pizz=3.0, pizzlo=4.0, harp=1.0,
            glock=6.0, xylo=4.0, whistle=2.5, mbox=3.0, celesta=3.0)
for _k, _db in TRIM.items():
    TR[_k].gain *= 10 ** (_db / 20)

# GM drum map
KICK, KICK2, STICK, SNR, CLAP, HHC, HHP, HHO = 35, 36, 37, 38, 39, 42, 44, 46
CR1, CR2, RIDE, TAMB, TRI_O, WB_HI, WB_LO, MARACA = 49, 57, 51, 54, 81, 76, 77, 70
TOM_LF, TOM_HF, TOM_L, TOM_LM, TOM_HM, TOM_H = 41, 43, 45, 47, 48, 50

# ----------------------------------------------------------------------------------------------
# Harmony + hook material
# ----------------------------------------------------------------------------------------------
CH = {
    'C':     dict(b='C2', gtr=['G3', 'C4', 'E4'], ep=['E3', 'G3', 'C4', 'D4'], lo=['C3', 'G3'], hi=['E5', 'G5', 'C6'],
                  br=['E4', 'G4', 'C5'], tb=['C3', 'G3']),
    'G/B':   dict(b='B1', gtr=['G3', 'B3', 'D4'], ep=['D3', 'G3', 'B3'], lo=['B2', 'D3'], hi=['D5', 'G5', 'B5'],
                  br=['D4', 'G4', 'B4'], tb=['B2', 'G3']),
    'G':     dict(b='G1', gtr=['G3', 'B3', 'D4'], ep=['D3', 'G3', 'B3'], lo=['G2', 'D3'], hi=['D5', 'G5', 'B5'],
                  br=['D4', 'G4', 'B4'], tb=['G2', 'D3']),
    'G7':    dict(b='G1', gtr=['F3', 'B3', 'D4'], ep=['F3', 'B3', 'D4'], lo=['G2', 'D3'], hi=['D5', 'F5', 'B5'],
                  br=['D4', 'F4', 'B4'], tb=['G2', 'F3']),
    'Am':    dict(b='A1', gtr=['A3', 'C4', 'E4'], ep=['E3', 'A3', 'C4'], lo=['A2', 'E3'], hi=['C5', 'E5', 'A5'],
                  br=['C4', 'E4', 'A4'], tb=['A2', 'E3']),
    'Am7':   dict(b='A1', gtr=['G3', 'C4', 'E4'], ep=['G3', 'C4', 'E4'], lo=['A2', 'E3'], hi=['C5', 'E5', 'G5'],
                  br=['C4', 'E4', 'G4'], tb=['A2', 'E3']),
    'F':     dict(b='F1', gtr=['A3', 'C4', 'F4'], ep=['F3', 'A3', 'C4'], lo=['F2', 'C3'], hi=['C5', 'F5', 'A5'],
                  br=['C4', 'F4', 'A4'], tb=['F2', 'C3']),
    'Fmaj7': dict(b='F1', gtr=['A3', 'C4', 'E4'], ep=['E3', 'A3', 'C4'], lo=['F2', 'C3'], hi=['C5', 'E5', 'A5'],
                  br=['C4', 'E4', 'A4'], tb=['F2', 'C3']),
    'Dm7':   dict(b='D2', gtr=['F3', 'A3', 'C4'], ep=['F3', 'A3', 'C4'], lo=['D3', 'A3'], hi=['C5', 'F5', 'A5'],
                  br=['C4', 'F4', 'A4'], tb=['D3', 'A3']),
    'Em7':   dict(b='E2', gtr=['G3', 'B3', 'D4'], ep=['G3', 'B3', 'D4'], lo=['E3', 'B3'], hi=['D5', 'G5', 'B5'],
                  br=['B3', 'D4', 'G4'], tb=['E3', 'B3']),
}

# (beat, dur in beats, note) - one bar; the GOTV hook
HOOK_PU = [(-0.5, .5, 'G4')]
HOOK_Q = [(0, .5, 'C5'), (.5, .5, 'E5'), (1, .75, 'G5'), (1.75, .25, 'E5'), (2, 1, 'D5'), (3, .5, 'B4'), (3.5, .5, 'D5')]
HOOK_A = [(0, .5, 'C5'), (.5, .5, 'E5'), (1, .75, 'A5'), (1.75, .25, 'G5'), (2, .5, 'F5'), (2.5, .5, 'E5'), (3, 1, 'C5')]
HOOK_Q2 = [(0, .5, 'C5'), (.5, .5, 'E5'), (1, .75, 'G5'), (1.75, .25, 'A5'), (2, 1, 'G5'), (3, .5, 'E5'), (3.5, .5, 'D5')]
HOOK_DEV = [(0, .5, 'B4'), (.5, .5, 'E5'), (1, .75, 'G5'), (1.75, .25, 'E5'), (2, .5, 'C5'), (2.5, .5, 'E5'), (3, 1, 'A5')]
HOOK_END = [(0, .5, 'D5'), (.5, .5, 'F5'), (1, .75, 'A5'), (1.75, .25, 'G5'), (2, .5, 'F5'), (2.5, .5, 'D5'),
            (3, .5, 'B4'), (3.5, .5, 'D5')]


def play_line(tr, g, beat0, line, vel, octave=0, stacc=0.9, legato=False, accent=True, hm=3.0, scoop=False):
    for b, d, n_ in line:
        t = g(beat0 + b) + hum(hm)
        v = vel + (6 if (accent and d >= .75) else 0) + (4 if abs(b - round(b)) < 1e-6 else -2) + rv(-3, 3)
        dur = g.b * d * (1.0 if legato else stacc)
        tr.n(t, dur, m(n_) + 12 * octave, v)
        if scoop and d >= .75:
            tr.scoop(t, -0.5, 0.06)
            tr.vib(t + 0.02, t + dur - 0.03, depth=0.1, rate=5.5, delay=0.12)


# ----------------------------------------------------------------------------------------------
# Rhythm-section helpers (16th grids with swing + humanising)
# ----------------------------------------------------------------------------------------------
SWING = 0.006


def s16(g, beat):
    """time of a 16th position with a light funk swing on the 'e' and 'a'."""
    q = beat * 4
    return g(beat) + (SWING if int(round(q)) % 2 == 1 else 0.0)


def drums_bar(g, b0, style, lvl=1.0, beats=4, fill=None, open_hat=True, hat_skip=()):
    """One bar of kit from beat b0. style: light | verse | chorus | lift"""
    b = g.b
    for p in range(beats * 4):
        bt = b0 + p / 4
        t = s16(g, bt) + hum(3)
        beat_in, sub = p // 4, p % 4
        if fill is not None and bt >= fill:
            continue
        # kick
        kpat = {'light': {0: 100, 8: 86},
                'verse': {0: 112, 6: 92, 8: 106, 11: 72},
                'chorus': {0: 118, 6: 96, 8: 110, 10: 84, 14: 70},
                'lift': {0: 116, 4: 104, 8: 112, 12: 106, 10: 64}}[style]
        if p in kpat:
            v = int(kpat[p] * lvl) + rv(-3, 3)
            kick.n(t, 0.2, KICK, v)
            kick.n(t, 0.2, KICK2, v - 18)
        # snare backbeat + ghosts
        if p in (4, 12):
            if style == 'light':
                snare.n(t, 0.1, STICK, int(84 * lvl) + rv(-4, 4))
            else:
                v = int((108 if style != 'verse' else 100) * lvl) + rv(-3, 3)
                snare.n(t + 0.002, 0.15, SNR, v)
                snare.n(t + 0.009, 0.15, CLAP, v - (12 if style == 'verse' else 4))
                if style in ('chorus', 'lift'):
                    perc.n(t + 0.004, 0.15, TAMB, int(78 * lvl) + rv(-4, 4))
        elif style in ('verse', 'chorus') and p in (7, 9, 14, 15):
            if RNG.random() < (0.75 if p in (7, 14) else 0.45):
                snare.n(t, 0.06, SNR, int(RNG.integers(24, 38) * lvl))
        # hats
        if p in hat_skip:
            continue
        if style == 'lift':
            if sub == 2 and open_hat:
                hats.n(t, b * 0.45, HHO, int(74 * lvl) + rv(-4, 4))
            elif sub in (0, 1):
                hats.n(t, 0.05, HHC, int([98, 50][sub] * lvl) + rv(-4, 4))
        elif style == 'light':
            if sub == 0 or sub == 2:
                hats.n(t, 0.05, HHC, int((82 if sub == 0 else 60) * lvl) + rv(-4, 4))
        else:
            if style == 'chorus' and open_hat and p == 14:
                hats.n(t, b * 0.45, HHO, int(80 * lvl) + rv(-3, 3))
                continue
            acc = [100, 44, 72, 52][sub] if style == 'chorus' else [92, 38, 66, 46][sub]
            hats.n(t, 0.05, HHC, int(acc * lvl) + rv(-5, 5))
        if style in ('chorus', 'verse') and p == 0 and open_hat:
            hats.n(t + 0.001, 0.05, HHP, 50)


def bass_seg(g, b0, beats, chord, nxt=None, style='verse', lvl=1.0):
    """Finger-bass figure for a chord lasting `beats` from b0 (16th positions, ghost 'dead' notes)."""
    r = m(CH[chord]['b'])
    fifth = r + 7
    tgt = m(CH[nxt]['b']) if nxt else r
    app = tgt - 1 if (tgt - r) % 12 not in (1, 11) else tgt + 2
    if beats >= 4:
        pat = {'verse': [(0, 'R', 3.2, 102), (3, 'R', .35, 40), (6, 'O', 1.0, 86), (8, 'R', 2.2, 96),
                         (11, 'R', .35, 38), (13, 'O', .9, 84), (14, '5', .9, 80), (15, 'A', .9, 82)],
               'chorus': [(0, 'R', 2.4, 110), (3, 'R', .35, 44), (4, 'O', .8, 90), (6, 'R', 1.4, 92), (7, 'R', .35, 42),
                          (8, 'R', 1.8, 104), (10, 'O', .9, 90), (11, '5', .9, 84), (13, 'R', .35, 44), (14, 'O', .9, 90),
                          (15, 'A', .9, 86)],
               'stadium': [(p, 'R' if p % 4 == 0 else 'O', 1.7, 100 if p % 4 == 0 else 86) for p in range(0, 16, 2)],
               'lift': [(p, 'R' if p % 4 == 0 else 'O', 1.7, 104 if p % 4 == 0 else 92) for p in range(0, 16, 2)]}[style]
    else:
        pat = {'verse': [(0, 'R', 2.6, 100), (3, 'R', .35, 40), (4, 'O', .9, 84), (6, '5', .9, 80), (7, 'A', .9, 80)],
               'chorus': [(0, 'R', 2.2, 108), (3, 'R', .35, 44), (4, 'O', .9, 90), (6, 'R', .9, 88), (7, 'A', .9, 84)],
               'stadium': [(0, 'R', 1.7, 100), (2, 'O', 1.7, 86), (4, 'R', 1.7, 98), (6, 'O', 1.7, 88)],
               'lift': [(0, 'R', 1.7, 104), (2, 'O', 1.7, 92), (4, 'R', 1.7, 102), (6, 'O', 1.7, 94)]}[style]
    for p, kind, d16, v in pat:
        bt = b0 + p / 4
        if bt >= b0 + beats - 1e-6:
            continue
        if kind == 'A' and nxt is None:
            kind = '5'
        note = {'R': r, 'O': r + 12, '5': fifth if fifth <= m('E2') + 7 else fifth - 12, 'A': app}[kind]
        dur = g.b / 4 * d16 * (0.92 if d16 > .5 else 1.0)
        bass.n(s16(g, bt) + hum(4), dur, note, int(v * lvl) + rv(-4, 4))


def gtr_seg(g, b0, beats, chord, style='verse', lvl=1.0, double=False):
    """Funky 16th chops: accented 'chank' strums + muted scratches, up/down stroke by position."""
    vo = CH[chord]['gtr']
    pats = {'verse': {4: 92, 12: 96, 10: 70}, 'chorus': {2: 78, 4: 100, 7: 84, 10: 80, 12: 104, 15: 78},
            'light': {4: 80, 12: 84}}
    scr = {'verse': (2, 6, 7, 14), 'chorus': (3, 6, 9, 11, 14), 'light': ()}
    for p in range(int(beats * 4)):
        bt = b0 + p / 4
        t = s16(g, bt) + hum(4)
        up = p % 2 == 1
        if p in pats[style]:
            v = int(pats[style][p] * lvl) + rv(-4, 4)
            gtr.strum(t, g.b / 4 * 0.85, vo, v, up=up)
            if double:
                gtr2.strum(t + 0.011 + hum(3), g.b / 4 * 0.8, [m(x) + 12 if i == 0 else m(x) for i, x in enumerate(vo)],
                           v - 8, up=not up)
        elif p in scr[style]:
            mgtr.strum(t, 0.035, vo, int(RNG.integers(34, 50) * lvl), up=up, spread=0.005)


# ----------------------------------------------------------------------------------------------
# Sections
# ----------------------------------------------------------------------------------------------
def intro():
    g = G1
    # --- tiptoe search (Am, with a G# 'where is it?' colour) : pizz + KS pluck + soft shaker
    srch = [(-7.0, 'A4', 74), (-6.5, 'C5', 66), (-6.0, 'B4', 70), (-5.75, 'A4', 56), (-5.5, 'G#4', 64),
            (-5.0, 'A4', 70), (-4.5, 'E5', 72), (-4.25, 'D5', 58), (-4.0, 'C5', 66), (-3.75, 'B4', 58)]
    for bt, n_, v in srch:
        t = g(bt) + hum(4)
        pizz.n(t, 0.2, n_, v)
        pluck.n(t + 0.004, 0.18, n_, v + 6)
    for bt, n_ in [(-7, 'A2'), (-6, 'E2'), (-5, 'A2'), (-4, 'E2')]:
        pizzlo.n(g(bt) + hum(3), 0.3, n_, 76)
        pizz.n(g(bt + .5) + hum(3), 0.14, ['C4', 'E4'], 46)
    for i in range(14):
        perc.n(s16(g, -7 + i / 4) + hum(3), 0.05, MARACA, [46, 22, 34, 24][i % 4])
    # --- question mark: rising Bdim (ti-re-fa?) left hanging
    for bt, n_, v in [(-3.5, 'B4', 70), (-3.25, 'D5', 76), (-3.0, 'F5', 84)]:
        xylo.n(g(bt), 0.25, m(n_) + 12, v)
        pizz.n(g(bt), 0.2, n_, v - 6)
    xylo.n(g(-3.0), 0.6, 'F6', 60)
    glock.n(g(-3.0) + 0.06, 0.6, 'F6', 44)
    pizzlo.n(g(-3.5), 0.4, 'G2', 70)
    # ---- STOP 2.33 - 2.83 (nothing plays: the stop-and-go gag) ----
    # ---- GO at beat -1.5 (2.83): brass 'bap!' + 16th pizz/pluck run up the G7 into the 3.58 stab
    t_go = g(-1.5)
    brass.n(t_go, 0.12, ['G3', 'B3', 'D4', 'F4'], 96)
    tbn.n(t_go, 0.12, ['G2', 'D3'], 92)
    snare.n(t_go, 0.1, SNR, 104)
    kick.n(t_go, 0.2, KICK, 104)
    run = ['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4']
    for i, n_ in enumerate(run[:6]):
        t = g(-1.25 + i * 0.125)
        pizz.n(t, 0.1, n_, 66 + 4 * i)
        pluck.n(t + 0.003, 0.1, n_, 70 + 4 * i)
    # snare 16ths + timp roll crescendo into the logo
    for i in range(4):
        snare.n(s16(g, -1 + i / 4), 0.08, SNR, 62 + 12 * i)
    toms.n(g(-0.5), 0.2, TOM_L, 92)
    toms.n(g(-0.25), 0.2, TOM_LF, 100)
    tt = g(-1.0)
    while tt < g(0) - 0.02:
        timp.n(tt, 0.06, 'G2', int(40 + 60 * (tt - g(-1)) / B1))
        tt += 0.055
    for tr_, ns, v in [(tbn, ['G2', 'D3', 'F3'], 84), (horns, ['B3', 'D4', 'F4'], 80)]:
        tr_.cc(g(-1.02), 11, 50)
        tr_.n(g(-1.0), B1 - 0.03, ns, v)
        tr_.expr(g(-1.0), g(0) - 0.03, 50, 120, 1.6)
    revcym.n(g(0), 0.95, CR2, 90)
    # hook pickup
    for tr_, v in [(glock, 80), (xylo, 70)]:
        tr_.n(g(-0.5), B1 * 0.45, m('G4') + 12, v)
    pizz.n(g(-0.5), 0.14, 'G4', 70)


def stab(t, chord='C', big=1.0, dur=0.22, crash=True, low=True):
    c = CH[chord]
    r = m(c['b'])
    v = int(118 * big)
    brass.cc(t - 0.003, 11, 127)
    brass.n(t, dur, [m(x) for x in c['tb']] + [m(x) for x in c['br']], v)
    tpt.n(t, dur, [m(c['br'][1]), m(c['br'][2])], v - 6)
    tbn.n(t, dur, [m(x) for x in c['tb']], v - 2)
    strings.n(t, dur * 0.9, [r + 12, r + 24] + [m(x) for x in c['hi']], v - 6)
    piano.n(t, dur * 1.4, [r, r + 12] + [m(x) for x in c['ep']], v - 10)
    ohit.n(t, 0.2, [r + 24, r + 31], int(100 * big))
    if low:
        timp.n(t, 0.6, r + 12 if r + 12 <= m('D3') else r, int(112 * big))
        okit.n(t, 1.2, 36, int(110 * big))
        kick.n(t, 0.2, KICK, int(118 * big))
        kick.n(t, 0.2, KICK2, int(100 * big))
    if crash:
        cym.n(t, 2.0, CR1, int(112 * big))
        cym.n(t + 0.006, 2.0, CR2, int(96 * big))


def verse():
    g = G1
    b = B1
    # ================= bar 0 (3.58) C | G : logo stab + hook Q on glock / xylo / pizz ===============
    stab(g(0), 'C', 1.0, dur=0.26)
    bass.n(g(0), 0.6, 'C2', 104)
    play_line(glock, g, 0, HOOK_Q, 86, octave=1)
    play_line(xylo, g, 0, HOOK_Q, 70, octave=1)
    play_line(pizz, g, 0, HOOK_Q, 58)
    slowstr.cc(g(0), 11, 80)
    slowstr.n(g(0) + 0.05, 2 * b, ['C3', 'G3', 'E4'], 70)
    slowstr.n(g(2), 2 * b, ['B2', 'D3', 'G3'], 66)
    slowstr.expr(g(0.1), g(3.9), 80, 55)
    bass_seg(g, 2, 2, 'G/B', 'Am7', 'verse', 0.9)
    for bt in (1, 2, 3):
        hats.n(g(bt), 0.05, HHC, 60 + rv(-4, 4))
        hats.n(g(bt + .5), 0.05, HHC, 44 + rv(-4, 4))
    snare.n(g(1), 0.1, STICK, 72)
    snare.n(g(3), 0.1, STICK, 76)
    kick.n(g(2), 0.2, KICK, 92)
    # fill in the VO gap into the groove
    for i, (bt, n_, v) in enumerate([(3.25, SNR, 40), (3.5, TOM_HM, 74), (3.625, TOM_LM, 78), (3.75, TOM_L, 84),
                                     (3.875, TOM_LF, 90)]):
        (snare if n_ == SNR else toms).n(s16(g, bt), 0.15, n_, v)

    # ================= bars 1-2 : groove (Am7 | Fmaj7) ===========================================
    prog = {1: [('Am7', 4)], 2: [('Fmaj7', 4)], 3: [('Dm7', 2), ('G7', 2)], 4: [('C', 2), ('G/B', 2)],
            5: [('Am', 2), ('F', 2)], 6: [('Dm7', 2), ('G', 2)], 7: [('Em7', 2), ('Am', 2)]}
    order = [(k, i, c, d) for k in sorted(prog) for i, (c, d) in enumerate(prog[k])]
    flat = []
    for k, i, c, d in order:
        b0 = 4 * k + (0 if i == 0 else prog[k][0][1])
        flat.append((b0, d, c))
    for idx, (b0, d, c) in enumerate(flat):
        nxt = flat[idx + 1][2] if idx + 1 < len(flat) else 'F'
        k = int(b0 // 4)
        sty = 'stadium' if k == 3 else 'verse'
        bass_seg(g, b0, d, c, nxt, sty, 0.95)
        if k != 3:
            gtr_seg(g, b0, d, c, 'verse' if k not in (1,) else 'light', lvl=0.9)
        # EP: soft sustained pad on each chord (the mids stay sparse under the voice)
        ep.n(g(b0) + 0.01, d * b * 0.95, CH[c]['ep'], 50 + rv(-3, 3))
        # low strings pad
        lowstr.n(g(b0) + 0.02, d * b, CH[c]['lo'], 62)
    lowstr.cc(g(4), 11, 60)
    lowstr.expr(g(4), g(28), 60, 78)
    # drums bars 1-2, 4-7
    for k in (1, 2, 4, 5, 6, 7):
        fill = None
        if k == 2:
            fill = 2.75 + 8        # sports lead-in fill
        if k == 5:
            fill = 3.5 + 20
        drums_bar(g, 4 * k, 'verse', lvl=0.92 if k < 4 else 0.97, fill=fill,
                  hat_skip=tuple(range(9, 16)) if k == 6 else (tuple(range(0, 5)) if k == 7 else ()))
    cym.n(g(4), 1.6, CR1, 84)
    # --- Netflix 7.02 : push accent on 'a' of 3 (6.96) - Am7 short stab + open hat
    tN = s16(g, 4 + 2.75)
    brass.n(tN, 0.13, ['C4', 'E4', 'G4'], 86)
    tpt.n(tN, 0.13, 'E5', 78)
    piano.n(tN, 0.2, ['A2', 'A3', 'C4', 'E4', 'G4'], 84)
    hats.n(tN, 0.3, HHO, 76)
    glock.n(tN, 0.4, ['E6', 'A6'], 62)
    # --- sports 9.0 : accent at 8.97 + tom run into the stadium bar
    tS = s16(g, 8 + 2.75)
    brass.n(tS, 0.14, ['D4', 'F4', 'A4'], 96)
    tbn.n(tS, 0.14, ['D3', 'A3'], 92)
    cym.n(tS, 1.2, CR2, 88)
    kick.n(tS, 0.2, KICK, 108)
    for i in range(5):
        bt = 8 + 2.75 + (i + 1) * 0.25
        if bt < 12:
            toms.n(s16(g, bt), 0.2, [TOM_HM, TOM_LM, TOM_L, TOM_HF, TOM_LF][i], 80 + 7 * i)
    # --- bar 3 (9.60) STADIUM: concert bass drum stomp, floor-tom 8ths, stacked claps, brass 'hey' stabs
    cym.n(g(12), 2.0, CR1, 110)
    cym.n(g(12) + 0.01, 2.0, CR2, 90)
    for i in range(8):
        bt = 12 + i / 2
        toms.n(g(bt) + hum(3), 0.3, TOM_LF if i % 2 == 0 else TOM_HF, (96 if i % 2 == 0 else 78) + rv(-4, 4))
        if i % 2 == 0:
            okit.n(g(bt) + hum(2), 0.8, 36, 104 + rv(-4, 4))
            kick.n(g(bt), 0.2, KICK, 106)
        hats.n(g(bt), 0.05, HHP, 60)
    for bt in (13, 15):
        for j, dt in enumerate((0.0, 0.011, 0.023, 0.034)):
            snare.n(g(bt) + dt, 0.15, CLAP, 108 - 8 * j)
        snare.n(g(bt), 0.15, SNR, 96)
    for bt in (15.5, 15.75):
        snare.n(s16(g, bt), 0.1, SNR, 70 + 20 * (bt == 15.75))
    for bt, ch_ in [(13.5, 'Dm7'), (15.5, 'G7')]:
        brass.n(g(bt), 0.12, CH[ch_]['br'][:2], 92)
        tbn.n(g(bt), 0.12, CH[ch_]['tb'], 90)
    ep.cc(0, 11, 100)

    # ================= bar 4 (11.60) hook returns (C | G/B), series 11.98 ======================
    cym.n(g(16), 1.8, CR1, 96)
    play_line(glock, g, 16, HOOK_Q, 84, octave=1)
    play_line(xylo, g, 16, HOOK_Q, 68, octave=1)
    play_line(pluck, g, 16, HOOK_Q, 70)
    tSe = s16(g, 16.75)
    hats.n(tSe, 0.3, HHO, 72)
    horns.n(tSe, 0.25, ['E4', 'G4'], 70)
    for i, n_ in enumerate(['C6', 'E6', 'G6', 'C7']):
        celesta.n(tSe + i * 0.03, 0.4, n_, 52 + 3 * i)
    # ================= bar 5 (13.61) hook answer (Am | F) =======================================
    play_line(glock, g, 20, HOOK_A, 82, octave=1)
    play_line(xylo, g, 20, HOOK_A, 66, octave=1)
    play_line(pluck, g, 20, HOOK_A, 68)
    # fill in the VO gap 15.44-15.79
    for i, (bt, n_) in enumerate([(23.5, TOM_HM), (23.625, TOM_LM), (23.75, TOM_L), (23.875, TOM_LF)]):
        toms.n(s16(g, bt), 0.2, n_, 80 + 6 * i)
    slowstr.cc(g(16), 11, 50)
    slowstr.n(g(16), 8 * b, ['E5', 'G5'], 60)
    slowstr.n(g(20), 4 * b, ['E5', 'A5'], 60)
    slowstr.expr(g(16), g(23.8), 50, 72)
    # ================= bar 6-7 : library updating 16.74-18.24 (clock tick) + hook development ====
    t = s16(g, 26.25)
    i = 0
    while t < 18.2:
        perc.n(t + hum(2), 0.05, WB_HI if i % 2 == 0 else WB_LO, (86 if i % 2 == 0 else 70) + rv(-4, 4))
        if i % 2 == 0:
            xylo.n(t, 0.05, 'E7' if i % 4 == 0 else 'B6', 34)
        i += 1
        t = s16(g, 26.25 + i * 0.25)
    perc.n(s16(g, 29.25), 1.2, TRI_O, 84)
    glock.n(s16(g, 29.25), 0.5, ['E6', 'B6'], 66)
    play_line(glock, g, 28, HOOK_DEV[4:], 80, octave=1)
    play_line(xylo, g, 28, HOOK_DEV[:4], 60, octave=1)
    play_line(pluck, g, 28, HOOK_DEV, 64)
    slowstr.n(g(24), 4 * b, ['F5', 'A5'], 58)
    slowstr.n(g(28), 4 * b, ['G5', 'B5'], 60)


def lift():
    g = G1
    b = B1
    # bars 8-9 (19.62 - 23.64) : F G | Am F ; the lift proper starts 20.3
    prog = [(32, 2, 'F'), (34, 2, 'G'), (36, 2, 'Am'), (38, 2, 'F')]
    for i, (b0, d, c) in enumerate(prog):
        nxt = prog[i + 1][2] if i + 1 < len(prog) else 'G'
        bass_seg(g, b0, d, c, nxt, 'verse' if b0 < 33 else 'lift', 1.0)
        gtr_seg(g, b0, d, c, 'verse' if b0 < 34 else 'chorus', 0.9, double=b0 >= 36)
        lowstr.n(g(b0), d * b, [m(CH[c]['b']) + 12, m(CH[c]['b']) + 24], 80)
        horns.n(g(b0) + 0.02, d * b * 0.98, CH[c]['br'][:2], 72 + 4 * i)
    horns.cc(g(32), 11, 60)
    horns.expr(g(33), g(39.9), 60, 112, 1.3)
    drums_bar(g, 32, 'verse', 0.95, fill=34)
    drums_bar(g, 34, 'lift', 0.95, beats=2)
    drums_bar(g, 36, 'lift', 1.0, fill=39)
    for i in range(4):   # snare fill into the lift hit
        snare.n(s16(g, 39 + i / 4), 0.08, SNR, 70 + 12 * i)
        toms.n(s16(g, 39 + i / 4) + 0.003, 0.2, [TOM_HM, TOM_LM, TOM_L, TOM_LF][i], 70 + 10 * i)
    for i in range(24):
        perc.n(s16(g, 34 + i / 4) + hum(2), 0.05, MARACA, [60, 30, 44, 32][i % 4])
    # rising strings: 8ths legato climbing two octaves (fast and smooth), CC swell
    line = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']
    strings.cc(g(33) - 0.05, 11, 55)
    for i, n_ in enumerate(line):
        bt = 33 + i * 0.5
        strings.n(g(bt) + hum(2), b * 0.5 * 1.02, [n_, m(n_) - 12], 78 + i)
    strings.expr(g(33), g(39.95), 55, 120, 1.2)
    slowstr.cc(g(32), 11, 50)
    slowstr.n(g(32), 4 * b, ['A4', 'C5', 'F5'], 70)
    slowstr.n(g(36), 2 * b, ['C5', 'E5', 'A5'], 76)
    slowstr.n(g(38), 2 * b, ['C5', 'F5', 'A5', 'C6'], 80)
    slowstr.expr(g(32), g(39.95), 50, 118, 1.4)
    for i, n_ in enumerate(['C5', 'F5', 'A5', 'C6', 'F6']):      # harp glint at the start of the lift
        harp.n(20.30 + i * 0.045, 0.6, n_, 60 + 4 * i)
    glock.n(g(36), 0.4, ['A6'], 60)
    glock.n(g(38), 0.4, ['C7'], 64)
    cym.n(g(34), 1.4, CR2, 80)
    # hit on bar 10 (23.64) - G, then the band falls away into the suspense
    t = g(40)
    brass.n(t, 0.2, ['G3', 'D4', 'G4', 'B4'], 104)
    tbn.n(t, 0.2, ['G2', 'D3'], 100)
    tpt.n(t, 0.2, ['D5', 'G5'], 96)
    strings.n(t, 0.2, ['G3', 'D4', 'G4', 'B4', 'D5', 'G5'], 104)
    piano.n(t, 0.3, ['G1', 'G2', 'D3', 'G3', 'B3'], 96)
    bass.n(t, 0.2, 'G1', 108)
    kick.n(t, 0.2, KICK, 112)
    kick.n(t, 0.2, KICK2, 96)
    cym.n(t, 1.0, CR1, 100)
    timp.n(t, 0.5, 'G2', 108)
    snare.n(t, 0.1, SNR, 100)


def suspense():
    g = G1
    b = B1
    # tense pulse 23.89 -> 25.32 : low strings + timp 8ths on G, kick heartbeat, rising trem strings, snare roll
    t0 = g(40.5)
    k = 0
    while True:
        t = g(40.5 + k * 0.5)
        if t >= T_SIL0 - 0.05:
            break
        u = (t - t0) / (T_SIL0 - t0)
        lowstr.n(t + hum(2), b * 0.4, ['G1', 'G2'], int(78 + 30 * u))
        timp.n(t, 0.3, 'G2', int(64 + 44 * u))
        if k % 2 == 1:
            kick.n(t, 0.2, KICK, int(80 + 30 * u))
        hats.n(t + b * 0.25, 0.05, HHP, int(40 + 30 * u))
        k += 1
    lowstr.cc(g(40.4), 11, 100)
    trem.cc(t0 - 0.02, 11, 40)
    rise = ['D4', 'Eb4', 'E4', 'F4', 'F#4']
    seg = (T_SIL0 - t0) / len(rise)
    for i, n_ in enumerate(rise):
        trem.n(t0 + i * seg, seg + 0.02, [m(n_), m(n_) + 12, m('G3')], 90)
    trem.expr(t0, T_SIL0, 40, 124, 1.6)
    for tr_, ns, v in [(tbn, ['G2', 'D3', 'F3'], 80), (horns, ['B3', 'D4', 'F4', 'Ab4'], 76)]:
        tr_.cc(24.55, 11, 30)
        tr_.n(24.6, T_SIL0 - 24.6, ns, v)
        tr_.expr(24.6, T_SIL0, 30, 122, 1.8)
    t = 24.35
    while t < T_SIL0 - 0.01:
        u = (t - 24.35) / (T_SIL0 - 24.35)
        snare.n(t, 0.05, SNR, int(30 + 90 * u ** 1.3))
        t += 0.062 - 0.02 * u
    revcym.n(T_SIL0, 1.3, CR2, 104)
    for i, n_ in enumerate(['G4', 'B4', 'D5', 'F5', 'G5', 'B5', 'D6', 'F6']):
        harp.n(24.9 + i * 0.05, 0.3, n_, 58 + 5 * i)


def chorus():
    # ---------------- 25.64 DROP : tutti C ----------------------------------------------------------
    g = GC
    b = B2
    stab(25.64, 'C', 1.06, dur=0.3)
    cym.n(25.64 + 0.004, 2.5, RIDE, 60)
    # bar C1 : C | G/B (cut by the freeze at 27.19)
    drums_bar(g, 0, 'chorus', 1.0)
    bass_seg(g, 0, 2, 'C', 'G/B', 'chorus')
    bass_seg(g, 2, 2, 'G/B', 'Am', 'chorus')
    gtr_seg(g, 0, 2, 'C', 'chorus', 0.95, double=True)
    gtr_seg(g, 2, 2, 'G/B', 'chorus', 0.95, double=True)
    for tr_, v in [(whistle, 96), (glock, 84), (xylo, 64)]:
        play_line(tr_, g, 0, HOOK_Q, v, octave=1, legato=tr_ is whistle, scoop=tr_ is whistle)
    whistle.cc(25.6, 11, 110)
    strings.cc(25.63, 11, 110)
    strings.n(25.64 + 0.3, 2 * b - 0.3, ['C4', 'E4', 'G4', 'C5', 'E5'], 88)
    strings.n(g(2), 1.2 * b, ['B3', 'D4', 'G4', 'B4', 'D5'], 86)
    lowstr.n(25.64, 2 * b, ['C2', 'C3'], 96)
    lowstr.n(g(2), 1.2 * b, ['B1', 'B2'], 94)
    for bt, ch_ in [(1.5, 'C'), (3.0, 'G/B')]:
        brass.n(g(bt), 0.12, CH[ch_]['br'], 96)
        tbn.n(g(bt), 0.12, CH[ch_]['tb'], 92)

    # ---------------- FREEZE 27.19 - 27.80 : held G/B chord, the hook's last note stuck ------------
    # the frozen chord sags a little flat (a 'stuck' tape feel), bends reset before the restart
    for tr_, ns, v in [(slowstr, ['B2', 'D4', 'G4', 'B4', 'D5'], 72), (horns, ['D4', 'G4'], 62),
                       (ep, ['B2', 'D3', 'G3', 'B3', 'D4'], 58), (whistle, ['B5'], 70)]:
        tr_.cc(T_FRZ0 - 0.01, 11, 96)
        tr_.n(T_FRZ0, T_FRZ1 - T_FRZ0 - (0.1 if tr_ is whistle else 0.03), ns, v, keep=True)
        tr_.expr(T_FRZ0 + 0.05, T_FRZ1 - 0.04, 96, 58)
        tr_.bend(T_FRZ0 - 0.01, 0.0)
        for i in range(20):
            tr_.bend(T_FRZ0 + 0.12 + i * 0.022, -0.45 * ((i + 1) / 20) ** 1.4)
        tr_.bend(T_FRZ1 - 0.02, 0.0)
        tr_.cc(T_FRZ1 - 0.01, 11, {'slowstr': 80, 'horns': 82, 'ep': 100, 'whistle': 118}[tr_.name])
    # stuck glock: the same note repeating, each a little later and softer (buffer stutter)
    tt, gap = T_FRZ0, 0.055
    for i in range(7):
        glock.n(tt, 0.05, 'B5', 86 - 7 * i, keep=True)
        xylo.n(tt, 0.05, 'B5', 60 - 5 * i, keep=True)
        tt += gap
        gap *= 1.16
    bass.n(T_FRZ0, 0.5, 'B1', 84, keep=True)
    # restart pickup (snare 'ta-ta' + bass slide) into 27.80
    for i, bt in enumerate((-0.5, -0.25, -0.125)):
        snare.n(GD(bt), 0.08, SNR, 84 + 12 * i, keep=True)
    kick.n(GD(-0.5), 0.2, KICK, 96, keep=True)
    cym.n(GD(0), 1.5, CR1, 104)

    # ---------------- 27.80 restart: 2/4 bar F | G, then D1..D4 ----------------------------------
    g = GD
    plan = [(0, 1, 'F'), (1, 1, 'G'),
            (2, 2, 'C'), (4, 2, 'G/B'), (6, 2, 'Am'), (8, 2, 'F'),
            (10, 2, 'C'), (12, 2, 'G/B'), (14, 2, 'Dm7'), (16, 2, 'G7')]
    for i, (b0, d, c) in enumerate(plan):
        nxt = plan[i + 1][2] if i + 1 < len(plan) else 'C'
        bass_seg(g, b0, d, c, nxt, 'chorus')
        gtr_seg(g, b0, d, c, 'chorus', 0.95, double=True)
        # EP offbeat chords (2-and, 4)
        for off in (0.5, 1.5):
            if off < d:
                ep.n(s16(g, b0 + off) + hum(3), b * 0.35, CH[c]['ep'], 66 + rv(-3, 3))
        # strings: sustained top voicing + low octaves
        strings.n(g(b0) + 0.01, d * b * 0.98, [m(x) - 12 for x in CH[c]['hi'][:2]] + [m(x) for x in CH[c]['hi'][:2]], 84)
        lowstr.n(g(b0), d * b * 0.98, [m(CH[c]['b']) + 12, m(CH[c]['b']) + 24], 90)
        # brass: pads on horns, stabs on the push
        if b0 != 2:
            horns.n(g(b0) + 0.02, d * b * 0.95, CH[c]['br'][:2], 70)
        if b0 >= 2:
            tpos = b0 + d - 0.5
            brass.n(s16(g, tpos), 0.12, CH[nxt]['br'], 90 + rv(-3, 3))
            tbn.n(s16(g, tpos), 0.12, CH[nxt]['tb'], 88)
    strings.cc(27.75, 11, 96)
    lowstr.cc(27.75, 11, 100)
    horns.cc(27.75, 11, 82)
    drums_bar(g, 0, 'chorus', 1.0, beats=2, fill=1.5)
    for i, bt in enumerate((1.5, 1.625, 1.75, 1.875)):
        snare.n(s16(g, bt), 0.08, SNR, 80 + 9 * i)
        toms.n(s16(g, bt), 0.2, [TOM_H, TOM_HM, TOM_L, TOM_LF][i], 82 + 6 * i)
    for k in range(4):
        fill = 3.0 if k == 3 else (3.5 if k in (0, 1, 2) else None)
        drums_bar(g, 2 + 4 * k, 'chorus', 1.0 if k != 1 else 0.97, fill=2 + 4 * k + fill if fill else None)
    # end-of-bar fills
    for k in range(3):
        base = 2 + 4 * k + 3.5
        for i in range(2):
            snare.n(s16(g, base + i * 0.25), 0.08, SNR, 66 + 14 * i)
            kick.n(s16(g, base), 0.2, KICK, 96)
    for i in range(6):                               # big fill into the final hit (16ths)
        bt = 16.5 + i / 4
        if i % 2 == 0:
            snare.n(s16(GD, bt), 0.12, SNR, 80 + 7 * i)
        else:
            toms.n(s16(GD, bt), 0.2, [TOM_HM, TOM_L, TOM_LF][i // 2], 84 + 6 * i)
    for p in (1, 2, 3):
        cym.n(barD(p), 1.4, CR1 if p % 2 else CR2, 92)
    # the hook : pickup + Q (goal lift 28.81), A, Q2, END -> C on 36.90
    whistle.cc(27.7, 11, 118)
    for tr_, v, octv in [(whistle, 98, 1), (glock, 86, 1), (xylo, 66, 1)]:
        is_w = tr_ is whistle
        play_line(tr_, g, 2, HOOK_PU, v - 6, octave=octv, legato=is_w)
        play_line(tr_, g, 2, HOOK_Q, v, octave=octv, legato=is_w, scoop=is_w)
        play_line(tr_, g, 6, HOOK_A, v, octave=octv, legato=is_w, scoop=is_w)
        play_line(tr_, g, 10, HOOK_PU, v - 6, octave=octv, legato=is_w)
        play_line(tr_, g, 10, HOOK_Q2, v + 2, octave=octv, legato=is_w, scoop=is_w)
        play_line(tr_, g, 14, HOOK_END, v + 4, octave=octv, legato=is_w, scoop=is_w)
    # trumpets double the last bar of the hook (the voice is winding down) and answer in the VO gap 29.96-30.12
    tpt.cc(34.8, 11, 90)
    play_line(tpt, g, 14, HOOK_END, 88, legato=True)
    tpt.expr(barD(3), barD(3, 4) - 0.02, 90, 118)
    # goal lift 28.81 - 29.4 : horns + strings rise with the hook ascent, crash
    for tr_, ns, v in [(horns, ['C4', 'E4', 'G4'], 88), (slowstr, ['E5', 'G5', 'C6'], 86)]:
        tr_.cc(barD(0) - 0.02, 11, 70)
        tr_.n(barD(0), 3 * b * 0.95, ns, v)
        tr_.expr(barD(0), barD(0, 2.9), 70, 118, 0.8)
    for i, n_ in enumerate(['G4', 'C5', 'E5', 'G5', 'C6', 'E6', 'G6']):
        harp.n(28.81 + i * 0.07, 0.5, n_, 60 + 5 * i)
    # button press 30.33 = beat 4 of D1
    tB = barD(0, 3)
    for tr_, ns, v in [(brass, ['D4', 'G4', 'B4'], 104), (piano, ['G2', 'B3', 'D4', 'G4'], 98), (tpt, ['B4', 'D5'], 96)]:
        tr_.n(tB, 0.13, ns, v)
    snare.n(tB + 0.004, 0.15, CLAP, 110)
    perc.n(tB, 0.1, TAMB, 96)
    # TV-on sparkle 31.09 ('and' of D2 beat 1)
    tV = barD(1, 0.5)
    for i, n_ in enumerate(['C6', 'E6', 'G6', 'A6', 'C7', 'E7', 'G7']):
        celesta.n(tV + i * 0.035, 0.6, n_, 58 + 4 * i)
        if i % 2 == 0:
            glock.n(tV + i * 0.035 + 0.01, 0.5, n_, 50 + 3 * i)
    for i, n_ in enumerate(['A4', 'C5', 'E5', 'A5', 'C6', 'E6']):
        harp.n(tV + 0.01 + i * 0.04, 0.5, n_, 58 + 4 * i)
    perc.n(tV, 1.0, TRI_O, 70)
    # D3 : second-half strings octave line (fills the gaps between phrases)
    slowstr.cc(barD(2) - 0.02, 11, 80)
    slowstr.n(barD(2), 2 * b, ['C5', 'E5', 'G5'], 78)
    slowstr.n(barD(2, 2), 2 * b, ['B4', 'D5', 'G5'], 78)
    slowstr.n(barD(3), 2 * b, ['C5', 'F5', 'A5'], 80)
    slowstr.n(barD(3, 2), 2 * b - 0.02, ['B4', 'D5', 'F5', 'G5'], 84)
    slowstr.expr(barD(3), barD(4) - 0.03, 80, 124, 1.4)
    horns.expr(barD(3), barD(4) - 0.03, 82, 122, 1.4)
    tbn.cc(barD(3, 2) - 0.02, 11, 70)
    tbn.n(barD(3, 2), 2 * b - 0.03, ['G2', 'D3', 'F3'], 90)
    tbn.expr(barD(3, 2), barD(4) - 0.03, 70, 124, 1.5)
    revcym.n(T_END, 1.6, CR2, 100)


def ending():
    # 36.90 final cadence hit (C) and the ringing end card
    T = T_END
    stab(T, 'C', 1.1, dur=0.5)
    bass.n(T, 1.2, 'C2', 110)
    for tr_ in (brass, tpt, tbn, strings, piano):
        tr_.cc(T - 0.002, 11, 127)
    cym.n(T + 0.002, 3.0, CR2, 118)
    # ring: Cmaj9 bed
    for tr_, ns, v, e0 in [(slowstr, ['C3', 'G3', 'E4', 'B4', 'D5'], 88, 110), (horns, ['E4', 'G4'], 70, 90),
                           (lowstr, ['C2', 'C3'], 80, 100)]:
        tr_.cc(T - 0.005, 11, e0)
        tr_.n(T + 0.02, 39.9 - T, ns, v)
        tr_.expr(T + 0.3, 39.9, e0, 18, 0.7)
    ep.n(T + 0.35, 2.6, ['C3', 'G3', 'B3', 'D4', 'E4'], 58)
    for i, n_ in enumerate(['C3', 'G3', 'C4', 'E4', 'G4', 'B4', 'D5', 'E5', 'G5']):
        harp.n(T + 0.25 + i * 0.07, 1.4, n_, 62 - 2 * i)
    # music box + celesta echo of the hook, rubato and a little slower
    mb = [(37.45, 'G5', .22), (37.68, 'C6', .22), (37.90, 'E6', .22), (38.14, 'G6', .38), (38.52, 'E6', .16),
          (38.70, 'D6', .38), (39.10, 'C6', 0.8)]
    for t, n_, d in mb:
        mbox.n(t, d, n_, 80 if d > .3 else 72)
        celesta.n(t + 0.004, d, m(n_) - 12, 44)
    glock.n(39.10, 0.6, 'C7', 44)
    pluck.n(39.10, 0.6, ['C4', 'G4', 'E5'], 50)


def compose():
    intro()
    verse()
    lift()
    suspense()
    chorus()
    ending()
    # freeze: nothing sounds in 27.19-27.80 except notes flagged keep
    for tr in TR.values():
        out = []
        for nt in tr.notes:
            t, d, n_, v, kw = nt
            if kw.get('keep'):
                out.append(nt)
                continue
            if T_FRZ0 <= t < T_FRZ1 - 0.005:
                continue
            if t < T_FRZ0 < t + d:
                d = max(0.02, T_FRZ0 - t - 0.005)
            out.append([t, d, n_, v, kw])
        tr.notes = out


# ----------------------------------------------------------------------------------------------
# Rendering
# ----------------------------------------------------------------------------------------------
_SYNTH = None


def sf_synth():
    global _SYNTH
    if _SYNTH is None:
        import tinysoundfont as tsf
        s = tsf.Synth(samplerate=SR, gain=-6)
        _SYNTH = (s, s.sfload(SF2))
    return _SYNTH


def render_sf(tr, notes, ctl):
    s, sfid = sf_synth()
    ch = 9 if tr.drums else 0
    s.sounds_off()
    s.program_select(ch, sfid, tr.bank, tr.prog, tr.drums)
    for c, v in ((7, 127), (11, 127), (10, 64), (1, 0), (64, 0)):
        s.control_change(ch, c, v)
    s.pitchbend_range(ch, tr.bendrange)
    s.pitchbend(ch, 8192)
    ev = []
    for t, dur, n, vel, kw in notes:
        ev.append((int(round(t * SR)), 1, n, vel))
        ev.append((int(round((t + dur) * SR)), 0, n, 0))
    for t, kind, a, b in ctl:
        ev.append((int(round(t * SR)), 2 if kind == 'cc' else 3, a, b))
    ev.sort(key=lambda e: (e[0], e[1]))
    first = min(int(round(t * SR)) for t, *_ in notes)
    last = max(int(round((t + d) * SR)) for t, d, *_ in notes)
    stop = min(N, last + int(3.0 * SR))
    out = np.zeros((N, 2), np.float32)
    pos = None
    bmul = 8192 / tr.bendrange
    for smp, typ, a, b in ev:
        if smp > stop:
            break
        if pos is None:
            if smp >= first:
                pos = max(0, first)
            else:
                if typ == 2:
                    s.control_change(ch, a, b)
                elif typ == 3:
                    s.pitchbend(ch, int(np.clip(8192 + a * bmul, 0, 16383)))
                continue
        smp = max(smp, pos)
        if smp > pos:
            out[pos:smp] = np.frombuffer(s.generate(smp - pos), dtype=np.float32).reshape(-1, 2)
            pos = smp
        if typ == 1:
            s.noteon(ch, a, b)
        elif typ == 0:
            s.noteoff(ch, a)
        elif typ == 2:
            s.control_change(ch, a, b)
        else:
            s.pitchbend(ch, int(np.clip(8192 + a * bmul, 0, 16383)))
    if pos is not None and pos < stop:
        out[pos:stop] = np.frombuffer(s.generate(stop - pos), dtype=np.float32).reshape(-1, 2)
    s.sounds_off()
    s.generate(SR // 4)
    return out.astype(np.float64)


def mtof(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def ks_string(f, dur, vel, seed, t60=1.2, bright=0.55, pick=0.18):
    """Karplus-Strong string (fractional-delay loop, plectrum-position comb, finger-mute after note-off)."""
    rng = np.random.default_rng(seed)
    n = int((dur + 0.6) * SR)
    P = SR / f
    L = int(np.floor(P - 0.5))
    fr = P - 0.5 - L
    c0, c1, c2 = 0.5 * (1 - fr), 0.5, 0.5 * fr
    gper = 10 ** (-3 / (t60 * f))
    ex = rng.uniform(-1, 1, L)
    a = 0.15 + 0.8 * bright * (vel / 127)
    ex = signal.lfilter([a], [1, -(1 - a)], ex)
    d = max(1, int(pick * P))
    ex = ex - np.concatenate([np.zeros(d), ex[:-d]])
    y = np.zeros(n + L + 3)
    off = 3
    y[off:off + L] = ex
    pos, end, doff = off + L, off + n, off + int(dur * SR)
    while pos < end:
        k = min(L, end - pos)
        gg = gper if pos < doff else gper ** 8
        y[pos:pos + k] += gg * (c0 * y[pos - L:pos - L + k] + c1 * y[pos - L - 1:pos - L - 1 + k]
                                + c2 * y[pos - L - 2:pos - L - 2 + k])
        pos += k
    return y[off:end] * (vel / 127) ** 1.3


def render_ks(notes):
    out = np.zeros(N)
    for i, (t, dur, n, vel, kw) in enumerate(notes):
        f = mtof(n)
        s_ = 0.5 * (ks_string(f, dur, vel, 100 + i) + ks_string(f * 2 ** (3 / 1200), dur, vel, 900 + i))
        a = int(t * SR)
        e = min(N, a + len(s_))
        if a < N:
            out[a:e] += s_[:e - a]
    tt = np.arange(int(0.1 * SR)) / SR
    body = np.zeros_like(tt)
    for fr, dec, amp in [(98, 0.045, 1.0), (196, 0.03, 0.7), (410, 0.02, 0.5), (1150, 0.007, 0.3), (2900, 0.003, 0.15)]:
        body += amp * np.sin(2 * np.pi * fr * tt) * np.exp(-tt / dec)
    body /= np.abs(body).sum() * 0.02
    wet = signal.fftconvolve(out, body)[:N]
    y = 0.6 * out + 0.4 * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(out))
    y = signal.sosfilt(signal.butter(2, 7000, 'low', fs=SR, output='sos'), y)
    y = signal.sosfilt(signal.butter(2, 90, 'high', fs=SR, output='sos'), y)
    # slight stereo: Haas-free decorrelation via tiny allpass on one side
    r = signal.lfilter([0.6, 1.0], [1.0, 0.6], y)
    return np.stack([y, r], 1)


def render_revcym(tr, notes):
    """Reverse crash swell ending exactly at note time t (rendered from the kit's own crash)."""
    out = np.zeros((N, 2))
    for t, dur, n, vel, kw in notes:
        one = Track('tmp', 'x', 0, 128, True)
        x = render_sf(one, [(0.0, 3.0, n, vel, {})], [])[:int(3.2 * SR)]
        L = int(dur * SR)
        seg = x[:L][::-1].copy()
        fi = int(0.4 * L)
        seg[:fi] *= np.linspace(0, 1, fi)[:, None] ** 2
        seg[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))[:, None]
        e = int(round(t * SR))
        a = e - L
        out[max(0, a):e] += seg[max(0, -a):]
    return out


def pan_st(x, pan, width=1.0):
    mid = 0.5 * (x[:, 0] + x[:, 1])
    side = 0.5 * (x[:, 0] - x[:, 1]) * width
    l, r = mid + side, mid - side
    gl, gr = np.sqrt(1 - pan), np.sqrt(1 + pan)
    return np.stack([l * gl, r * gr], 1)


def make_ir(t60, length, seed, predelay=0.015, lp=6000, er=8, damp_hi=0.45):
    rng = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    lo = signal.butter(2, 2500, 'low', fs=SR, output='sos')
    for c in range(2):
        nz = rng.standard_normal(n)
        l_ = signal.sosfilt(lo, nz)
        h = nz - l_
        ir[:, c] = l_ * np.exp(-6.9 * t / t60) + 0.6 * h * np.exp(-6.9 * t / (t60 * damp_hi))
        pd = int(predelay * SR)
        ir[:pd, c] = 0
        for _ in range(er):
            d = int(rng.uniform(predelay + 0.004, predelay + 0.06) * SR)
            ir[d, c] += rng.uniform(0.25, 0.7) * (1 if rng.random() > 0.5 else -1)
    fade = int(0.03 * SR)
    pd = int(predelay * SR)
    ir[:pd + fade] *= np.linspace(0, 1, pd + fade)[:, None] ** 0.5
    ir = signal.sosfilt(signal.butter(2, lp, 'low', fs=SR, output='sos'), ir, axis=0)
    ir = signal.sosfilt(signal.butter(2, 180, 'high', fs=SR, output='sos'), ir, axis=0)   # no reverb mud
    ir /= np.sqrt((ir ** 2).sum(0).mean())
    return ir


def conv(x, ir):
    return np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], 1)


# ----- EQ helpers (RBJ biquads) ---------------------------------------------------------------
def peq(f0, gdb, q):
    A = 10 ** (gdb / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]
    a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return signal.tf2sos(np.array(b) / a[0], np.array(a) / a[0])


def shelf(f0, gdb, hi=True, S=0.8):
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


def hp(f, order=2):
    return signal.butter(order, f, 'high', fs=SR, output='sos')


def eqf(x, *soss):
    for s_ in soss:
        x = signal.sosfilt(s_, x, axis=0)
    return x


STEM_EQ = {
    'drums': [hp(35, 4), peq(175, -3.0, 1.0), peq(400, -1.5, 1.2), shelf(9000, 1.0)],
    'orch': [hp(35, 4), peq(180, -2.5, 1.0)],
    'bass': [hp(35, 4), peq(170, -2.0, 1.2), peq(90, 1.0, 1.0), peq(900, 1.5, 1.2), signal.butter(2, 4500, 'low', fs=SR, output='sos')],
    'keys': [hp(130, 2), peq(200, -3.0, 1.0)],
    'brass': [hp(90, 2), peq(190, -2.5, 1.0)],
    'strings': [hp(38, 4), peq(180, -2.5, 0.9), shelf(7000, 1.0)],
    'hook': [hp(250, 2), peq(2600, -1.0, 1.4)],
}
kick.eq = [peq(210, -5.0, 1.0), peq(58, 2.0, 1.2), peq(3200, 3.0, 0.9)]
bass.eq = [peq(220, -3.0, 1.3)]
STEMS = ['drums', 'orch', 'bass', 'keys', 'brass', 'strings', 'hook']


def render_all():
    compose()
    ir_room = make_ir(0.75, 1.1, 11, predelay=0.006, lp=7000, er=12, damp_hi=0.5)
    ir_hall = make_ir(2.0, 3.2, 3, predelay=0.022, lp=6500, er=8, damp_hi=0.4)
    dry = {s: [np.zeros((N, 2)), np.zeros((N, 2))] for s in STEMS}   # seg 0 (pre-drop), seg 1
    rsend = {s: [np.zeros((N, 2)), np.zeros((N, 2))] for s in STEMS}
    hsend = {s: [np.zeros((N, 2)), np.zeros((N, 2))] for s in STEMS}
    trk_rms = {}
    for name, tr in TR.items():
        if not tr.notes:
            continue
        for sg in (0, 1):
            notes = [tuple(x) for x in tr.notes if (x[0] < 25.5) == (sg == 0)]
            if not notes:
                continue
            ctl = [c for c in tr.ctl]
            if tr.synth == 'ks':
                y = render_ks(notes)
            elif tr.synth == 'revcym':
                y = render_revcym(tr, notes)
            else:
                y = render_sf(tr, notes, ctl)
            for s_ in tr.eq:
                y = signal.sosfilt(s_, y, axis=0)
            y = pan_st(y, tr.pan, tr.width) * tr.gain
            dry[tr.stem][sg] += y
            rsend[tr.stem][sg] += y * tr.room
            hsend[tr.stem][sg] += y * tr.hall
            for wn, (w0, w1) in (('verse', (5.6, 20.2)), ('chorus', (25.7, 36.8))):
                seg_ = y[int(w0 * SR):int(w1 * SR)]
                trk_rms.setdefault(name, {}).setdefault(wn, 0.0)
                trk_rms[name][wn] += float(np.mean(seg_ ** 2))
        print('rendered %-8s %4d notes' % (name, len(tr.notes)), file=sys.stderr)
    stems = {}
    for s in STEMS:
        acc = np.zeros((N, 2))
        for sg in (0, 1):
            y = dry[s][sg] + 0.55 * conv(rsend[s][sg], ir_room) + 0.42 * conv(hsend[s][sg], ir_hall)
            if sg == 0:            # everything before the drop is cut dead at 25.32
                a = int(T_SIL0 * SR)
                f = int(0.006 * SR)
                y[a - f:a] *= np.linspace(1, 0, f)[:, None]
                y[a:] = 0
            acc += y
        stems[s] = acc
    return stems, trk_rms


# ----------------------------------------------------------------------------------------------
# Mix bus
# ----------------------------------------------------------------------------------------------
def env_gate(points):
    tt = np.arange(N) / SR
    return np.interp(tt, [p[0] for p in points], [p[1] for p in points])


def mixdown(stems):
    # per-stem EQ (linear)
    for s in STEMS:
        stems[s] = eqf(stems[s], *STEM_EQ[s])
    # freeze gag: rhythm section + orch perc hard-stop at 27.19, drums re-open for the pickup 27.52, bass at 27.79
    fr = [(0, 1), (T_FRZ0 - 0.004, 1), (T_FRZ0 + 0.004, 0), (27.515, 0), (27.525, 1), (40, 1)]
    frb = [(0, 1), (T_FRZ0 - 0.004, 1), (T_FRZ0 + 0.006, 0.0), (27.785, 0.0), (27.795, 1), (40, 1)]
    drum_env = env_gate(fr)
    stems['drums'] *= drum_env[:, None]
    stems['orch'] *= drum_env[:, None]
    # bass: allow the held 'keep' B1 during the freeze at low level
    stems['bass'] *= (0.35 + 0.65 * env_gate(frb))[:, None]
    # vocal-range carve under speech: -2.5 dB, 1-4 kHz, smoothed windows (linear per stem)
    spk = np.zeros(N)
    for a, b in LINES:
        spk[int((a - 0.04) * SR):int((b + 0.06) * SR)] = 1
    k = int(0.05 * SR)
    spk = np.convolve(spk, np.ones(k) / k, mode='same')
    band = signal.butter(2, [1000, 4000], 'band', fs=SR, output='sos')
    depth = 1 - 10 ** (-2.5 / 20)
    for s in STEMS:
        if s == 'drums':
            continue
        stems[s] = stems[s] - depth * spk[:, None] * signal.sosfiltfilt(band, stems[s], axis=0)
    # master tone (linear -> applied per stem): air, de-harsh, mono lows, wider mids/highs
    for s in STEMS:
        y = eqf(stems[s], shelf(10000, 1.5), peq(3400, -1.0, 1.2))
        mid = 0.5 * (y[:, 0] + y[:, 1])
        side = 0.5 * (y[:, 0] - y[:, 1])
        s_lo = signal.sosfiltfilt(signal.butter(2, 140, 'low', fs=SR, output='sos'), side)
        side = (side - s_lo) * 1.18 + s_lo * 0.0
        stems[s] = np.stack([mid + side, mid - side], 1)
    # section dynamics: verse sits a touch lower, the drop / final hit are the peak
    dyn = [(0, -1.0), (3.5, -1.0), (3.58, 0.0), (4.2, -1.0), (20.2, -1.0), (23.6, 0.0), (25.6, 0.0), (25.64, 0.8),
           (27.0, 0.3), (36.8, 0.5), (36.9, 1.0), (40.0, 1.0)]
    dc = 10 ** (np.interp(np.arange(N) / SR, [d[0] for d in dyn], [d[1] for d in dyn]) / 20)
    for s in STEMS:
        stems[s] *= dc[:, None]
    # end: ring out, fade 38.4 -> 39.95, digital zero from 39.95
    fade = np.ones(N)
    a, e = int(38.4 * SR), int(39.95 * SR)
    fade[a:e] = np.cos(np.linspace(0, np.pi / 2, e - a)) ** 1.6
    fade[e:] = 0
    for s in STEMS:
        stems[s] *= fade[:, None]
    mix = sum(stems[s] for s in STEMS)
    # --- glue compressor (2:1, soft knee, 12 ms / 160 ms, HP'd sidechain), gain curve shared by the stems
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    g0 = 10 ** ((-16.5 - meter.integrated_loudness(mix)) / 20)
    mix *= g0
    for s in STEMS:
        stems[s] *= g0
    sc = signal.sosfilt(hp(120, 2), mix.mean(1))
    blk = 48
    nb = N // blk
    pw = (sc[:nb * blk] ** 2).reshape(nb, blk).mean(1)
    pw = np.convolve(pw, np.ones(10) / 10, mode='same')      # 10 ms RMS detector
    lvl = 10 * np.log10(pw + 1e-12)
    thr, ratio, knee = -21.0, 2.0, 6.0
    over = lvl - thr
    gr = np.where(over <= -knee / 2, 0.0,
                  np.where(over >= knee / 2, (1 - 1 / ratio) * over, (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee)))
    at, rl = np.exp(-blk / (0.012 * SR)), np.exp(-blk / (0.16 * SR))
    sm = np.empty(nb)
    p = 0.0
    for i in range(nb):
        v = gr[i]
        p = at * p + (1 - at) * v if v > p else rl * p + (1 - rl) * v
        sm[i] = p
    gcomp = 10 ** (-np.interp(np.arange(N), np.arange(nb) * blk + blk / 2, sm) / 20)
    print('glue comp: max GR %.1f dB, mean GR (music) %.2f dB' % (sm.max(), sm[:int(36.9 * SR / blk)].mean()), file=sys.stderr)
    mix *= gcomp[:, None]
    # --- make-up to -15 LUFS, lookahead peak limiter to -1.0 dBFS
    g1 = 10 ** ((-15.0 - meter.integrated_loudness(mix)) / 20)
    mix *= g1
    ceil = 10 ** (-1.05 / 20)
    peak = np.max(np.abs(mix), 1)
    need = np.minimum(1.0, ceil / np.maximum(peak, 1e-9))
    from scipy.ndimage import minimum_filter1d
    la = int(0.003 * SR)
    need = minimum_filter1d(need, 2 * la + 1)
    # smooth: instant attack (lookahead window), 60 ms release; blockwise for speed then refine
    rel = np.exp(-1 / (0.06 * SR))
    lim = np.empty(N)
    p = 1.0
    nd = need
    for i in range(N):
        v = nd[i]
        p = v if v < p else p * rel + v * (1 - rel)
        lim[i] = p
    from scipy.ndimage import uniform_filter1d
    lim = uniform_filter1d(lim, la, mode='nearest')
    mix *= lim[:, None]
    gtot = gcomp * g1 * lim
    for s in STEMS:
        stems[s] *= gtot[:, None]
    # exact -1.00 dBFS sample peak
    g2 = 10 ** (-1.0 / 20) / np.max(np.abs(mix))
    mix *= g2
    for s in STEMS:
        stems[s] *= g2
    # hard zero windows (exact)
    a, b = int(round(T_SIL0 * SR)), int(round(T_SIL1 * SR))
    mix[a:b] = 0
    mix[int(39.95 * SR):] = 0
    for s in STEMS:
        stems[s][a:b] = 0
        stems[s][int(39.95 * SR):] = 0
    print('limiter: max GR %.1f dB' % (-20 * np.log10(lim.min())), file=sys.stderr)
    blkl = lim[:N // 4800 * 4800].reshape(-1, 4800).min(1)
    print('limiter GR > 1.5 dB at (s): ' + ', '.join('%.1f:%.1f' % (i * 0.1, -20 * np.log10(v)) for i, v in enumerate(blkl)
                                                    if v < 10 ** (-1.5 / 20)), file=sys.stderr)
    blkc = sm[:len(sm) // 100 * 100].reshape(-1, 100).max(1)
    print('comp GR > 3 dB at (s): ' + ', '.join('%.1f:%.1f' % (i * 0.1, v) for i, v in enumerate(blkc) if v > 3), file=sys.stderr)
    return mix, stems


# ----------------------------------------------------------------------------------------------
# Verification
# ----------------------------------------------------------------------------------------------
def report(mix, stems, trk):
    import pyloudnorm as pyln
    x, sr = sf.read(os.path.join(HERE, 'score.wav'))
    info = sf.info(os.path.join(HERE, 'score.wav'))
    print('\n== score.wav: %s, %d Hz, %d ch, %s, %.4f s' % (info.format, info.samplerate, info.channels, info.subtype,
                                                          info.frames / info.samplerate), file=sys.stderr)
    pk = 20 * np.log10(np.max(np.abs(x)))
    up = signal.resample_poly(x, 4, 1, axis=0)
    tp = 20 * np.log10(np.max(np.abs(up)))
    lufs = pyln.Meter(SR).integrated_loudness(x)
    print('peak %.2f dBFS, true-peak(4x) %.2f dBTP, integrated %.1f LUFS' % (pk, tp, lufs), file=sys.stderr)
    a, b = int(round(T_SIL0 * SR)), int(round(T_SIL1 * SR))
    print('silence 25.32-25.64: max |x| = %g (samples %d..%d);  last 50 ms max = %g;  first nonzero after = %.4f s'
          % (np.max(np.abs(x[a:b])), a, b, np.max(np.abs(x[int(39.95 * SR):])), (b + np.argmax(np.abs(x[b:, 0]) > 0)) / SR),
          file=sys.stderr)
    ssum = sum(stems.values())
    print('stems sum vs mix: max diff %.2e' % np.max(np.abs(ssum - mix)), file=sys.stderr)
    bands = [(20, 35), (35, 60), (60, 120), (120, 250), (250, 500), (500, 1000), (1000, 2000), (2000, 4000),
             (4000, 8000), (8000, 16000)]
    f, P = signal.welch(x.mean(1), SR, nperseg=8192)
    tot = P.sum()
    print('spectral balance (% power / dB rel total):', file=sys.stderr)
    print('   ' + '  '.join('%d-%d: %.1f%% (%.1f)' % (lo, hi, 100 * P[(f >= lo) & (f < hi)].sum() / tot,
                                                       10 * np.log10(P[(f >= lo) & (f < hi)].sum() / tot + 1e-12))
                            for lo, hi in bands), file=sys.stderr)
    secs = [('hook', 0, 3.58), ('verse', 3.58, 20.3), ('lift', 20.3, 23.8), ('susp', 23.9, 25.32), ('chorus', 25.64, 36.9),
            ('end', 36.9, 40)]
    for nm, t0, t1 in secs:
        seg = x[int(t0 * SR):int(t1 * SR)]
        r = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)
        f, P = signal.welch(seg.mean(1), SR, nperseg=4096)
        tot = P.sum()
        lowmid = 10 * np.log10(P[(f >= 150) & (f < 250)].sum() / tot)
        sub = 10 * np.log10(P[f < 35].sum() / tot)
        pres = 10 * np.log10(P[(f >= 2000) & (f < 5000)].sum() / tot)
        corr = np.corrcoef(seg[:, 0], seg[:, 1])[0, 1] if seg.std() > 0 else 1
        print('  %-7s %5.1f-%5.1f  rms %6.1f dBFS  sub<35 %6.1f dB  150-250 %6.1f dB  2-5k %6.1f dB  L/R corr %.2f'
              % (nm, t0, t1, r, sub, lowmid, pres, corr), file=sys.stderr)
    c0, c1 = int(25.7 * SR), int(36.8 * SR)
    ref = np.sqrt(np.mean(mix[c0:c1] ** 2))
    print('stem levels in chorus (dB rel mix): ' + ', '.join('%s %.1f' % (s, 20 * np.log10(np.sqrt(np.mean(stems[s][c0:c1] ** 2)) / ref + 1e-12)) for s in STEMS), file=sys.stderr)
    for wn in ('verse', 'chorus'):
        print('track levels %s (pre-bus dBFS): ' % wn + ', '.join(
            '%s %.1f' % (k, 10 * np.log10(v.get(wn, 0) + 1e-14)) for k, v in trk.items()), file=sys.stderr)
    # spectrogram
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(2, 1, figsize=(18, 8), gridspec_kw=dict(height_ratios=[3, 1]))
    ff, tt, S = signal.spectrogram(x.mean(1), SR, nperseg=4096, noverlap=3072)
    ax[0].pcolormesh(tt, ff, 10 * np.log10(S + 1e-14), shading='auto', vmin=-130, vmax=-40, cmap='magma')
    ax[0].set_yscale('symlog', linthresh=200)
    ax[0].set_ylim(20, 20000)
    for tv in (3.58, 7.02, 9.0, 12.0, 16.7, 18.2, 20.3, 24.0, 25.32, 25.64, 27.19, 27.8, 28.9, 30.34, 31.12, 36.9, 40):
        ax[0].axvline(tv, color='c', lw=0.6, alpha=0.7)
    ax[0].set_title('GOTV v6 score - spectrogram (cyan = picture cues)')
    h = int(0.02 * SR)
    e = np.sqrt(np.mean(x[:len(x) // h * h].mean(1).reshape(-1, h) ** 2, 1))
    ax[1].plot(np.arange(len(e)) * 0.02, 20 * np.log10(e + 1e-9))
    for a_, b_ in LINES:
        ax[1].axvspan(a_, b_, color='orange', alpha=0.15)
    ax[1].set_ylim(-80, 0)
    ax[1].set_xlim(0, 40)
    ax[0].set_xlim(0, 40)
    ax[1].set_ylabel('RMS dBFS (20 ms); orange = VO')
    plt.tight_layout()
    plt.savefig(os.path.join(HERE, 'score_v6_spectrogram.png'), dpi=90)


def main():
    stems, trk = render_all()
    mix, stems = mixdown(stems)
    os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
    sf.write(os.path.join(HERE, 'score.wav'), mix, SR, subtype='PCM_24')
    for s in STEMS:
        sf.write(os.path.join(HERE, 'stems', f'{s}.wav'), stems[s], SR, subtype='PCM_24')
    report(mix, stems, trk)


if __name__ == '__main__':
    main()
