#!/usr/bin/env python3
"""
GOTV v7 -- new SFX for the four holds, same toolkit/approach as v6/sfx_v6.py (which it extends: every v6 sound is
still available through sfx_v6.build).  python3 sfx_v7.py  -> v7/sfx/*.wav + hits.json

  thx_swell        cinema moment (T 11.11 -> 13.19): trailer boom + a THX-style swell -- 30 detuned saw voices wander
                   from random pitches, glide together into a huge C chord over ~1.2 s, bloom, fade by 2.08 s
  projector        old 35 mm projector (2.13 s): 24 fps claw pull-down clicks, shutter flutter, sprocket rattle, motor hum
  tur_dum          Turkish-drama zoom hit "dum dum DUM": timpani + low strings/brass + taiko body; hits 0.0 / 0.17 / 0.36
  tear_drop        single tear drop falling onto paper/water: tiny pluck "plip" (resonant bubble) -- 0.4 s
  heart_pops       K-drama hearts: 6 soft bubbly pops rising in pitch + warm sparkle (1.4 s)
  anime_sting      anime transformation sting: rising glitter sweep into a bright chord 'kirakira' flash at 0.32 s (1.6 s)
"""
import os
import sys
import json
import numpy as np
import soundfile as sf

sys.path.insert(0, '/home/user/I/gotv5/audio/v6')
sys.path.insert(0, '/home/user/I/anim/audio/tools')
import sfx_v6 as S6  # noqa: E402
from sfx_v6 import (SR, N, tax, white, pink, brown, lp, hp, bp, reson, peq, env, expdec, attack, fade, phase_of,  # noqa: E402
                    sine, saw, sat, pan, haas, st, add_at, reverb, thump, mtof, IR_ROOM, IR_HALL, stft_shape, bandsweep,
                    slow_noise, square)
from sfx import make_ir  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sfx')
NEW = []


def reg(name, hit, desc, pitched=False):
    NEW.append(name)
    return S6.reg(name, hit, desc, pitched)


def IR_CINEMA():
    return make_ir(rt60=3.4, predelay=0.03, hf=0.4, lf=1.3, er=16, er_span=0.12, bright=6000, seed=91)


@reg('thx_swell', 0.0, 'Trailer boom + THX-style converging swell into a huge chord; 2.08 s, hit 0.0.', True)
def _(r, root=36):
    dur = 2.08
    n = N(dur)
    t = tax(n)
    y = np.zeros((2, n))
    targets = [root + i for i in (-12, 0, 7, 12, 19, 24, 28, 31, 36)]
    k = 0
    for vi in range(30):
        tgt = mtof(targets[vi % len(targets)]) * (1 + r.uniform(-0.002, 0.002))
        f_start = r.uniform(180, 420)
        wander = 1 + 0.08 * np.sin(2 * np.pi * r.uniform(0.6, 1.4) * t + r.uniform(0, 6))
        u = np.clip((t - 0.25) / 1.0, 0, 1)
        u = u * u * (3 - 2 * u)
        f = np.exp(np.log(f_start * wander) * (1 - u) + np.log(tgt) * u)
        v = saw(f, n)
        y += pan(v, r.uniform(-0.9, 0.9)) / 30
        k += 1
    y = stft_shape(y, S6.lpsweep(lambda tt: 500 + 6000 * np.clip((tt - 0.2) / 1.2, 0, 1) ** 1.5, 12.0), nper=2048)
    a = env(n, [(0, 0), (0.15, 0.35), (1.25, 1.0), (1.6, 0.8), (dur, 0.0)])
    y = y * a
    boom = S6._boom(r, 0.9)
    boom = boom[:, :n] if boom.shape[1] >= n else np.hstack([boom, np.zeros((2, n - boom.shape[1]))])
    sub = np.sin(phase_of(np.full(n, mtof(root - 12)))) * env(n, [(0, 0), (0.3, 0.3), (1.25, 1.0), (dur, 0)]) * 0.5
    y = sat(y * 1.2, 1.3) + boom * 0.9 + st(sub)
    y = reverb(y, IR_CINEMA(), 0.3, tail=False)
    return fade(y, 0, 0.35)


@reg('projector', 0.0, 'Old 35 mm film projector running, 2.13 s: 24 fps pull-down clicks, shutter flutter, sprocket rattle, '
     'motor hum; 0.08 s fade in/out.')
def _(r):
    dur = 2.13
    n = N(dur)
    t = tax(n)
    y = np.zeros(n)
    for i in range(int(dur * 24)):
        L = N(0.02)
        ex = white(L, r) * expdec(L, 0.0008)
        c = reson(ex, 2300 * r.uniform(0.95, 1.05), 8) * 2 + reson(ex, 820, 6) * 1.2 + reson(ex, 5200, 10) * 0.6
        add_at(y, c * r.uniform(0.7, 1.0), i / 24 + r.uniform(0, 0.0015))
        add_at(y, reson(white(N(0.01), r) * expdec(N(0.01), 0.0005), 3600, 9) * 0.4, i / 24 + 0.021)  # claw return
    flutter = bp(white(n, r), 700, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * 48 * t)) ** 2 * 0.05
    hum = (np.sin(2 * np.pi * 50 * t) * 0.3 + np.sin(2 * np.pi * 100 * t) * 0.5 + np.sin(2 * np.pi * 150 * t) * 0.2) * 0.012
    rattle = bp(white(n, r), 1500, 6000) * slow_noise(n, r, 30, 0, 1) ** 4 * 0.05
    y = y + flutter + hum + rattle
    y = fade(y, 0.08, 0.08)
    return reverb(pan(y, 0.35) + haas(y * 0.2, 1.2), IR_ROOM(), 0.2, tail=False)


def _timp(r, f, dur, amp):
    n = N(dur)
    t = tax(n)
    ex = white(n, r) * expdec(n, 0.003)
    body = sum(a * np.sin(2 * np.pi * f * m * t + r.uniform(0, 6)) * np.exp(-t / d) for m, a, d in
               ((1.0, 1.0, 0.9), (1.5, 0.5, 0.6), (1.99, 0.35, 0.45), (2.44, 0.2, 0.3)))
    body *= attack(n, 0.002) * (1 + 0.04 * np.exp(-t / 0.05))
    return (body + lp(ex, 1500) * 0.6) * amp


@reg('tur_dum', 0.0, 'Turkish TV-drama zoom hit "dum dum DUM": timpani + low strings/brass stab + taiko; hits at 0.0, 0.17, '
     '0.36 (the big one rings); 1.6 s.', True)
def _(r, root=38):
    dur = 1.6
    n = N(dur)
    y = np.zeros((2, n))
    for i, (tm, a, big) in enumerate(((0.0, 0.55, False), (0.17, 0.6, False), (0.36, 1.0, True))):
        f = mtof(root - 12 + (0 if i < 2 else -1))       # the last one a half step down: the classic drama drop
        tp = _timp(r, f, 1.2 if big else 0.35, a)
        add_at(y, st(tp), tm)
        m = N(1.1 if big else 0.22)
        tt = tax(m)
        stab = sum(saw(mtof(root - 12 + iv + (0 if i < 2 else -1)) * (1 + dt), m) for iv in (0, 12, 15, 19) for dt in (-0.004, 0.004))
        stab = lp(stab, 1400, 2) * env(m, [(0, 0), (0.012, 1), (0.1 if not big else 0.5, 0.6), (tt[-1], 0)]) * 0.12 * a
        add_at(y, pan(stab, -0.3) + pan(stab * 0.9, 0.3), tm)
        add_at(y, st(thump(0.5, 110, 45, 0.12, 0.4, r) * 0.7 * a), tm)
    y = reverb(y, IR_HALL(), 0.3, tail=False)
    return fade(y, 0, 0.3)


@reg('tear_drop', 0.0, 'A single tear drop: tiny resonant water "plip" with a short upward bubble chirp. 0.4 s.')
def _(r):
    n = N(0.4)
    t = tax(n)
    f = 1500 * (1 + 0.6 * np.clip(t / 0.03, 0, 1))
    y = np.sin(phase_of(f)) * expdec(n, 0.018) * attack(n, 0.0005)
    y += reson(white(n, r) * expdec(n, 0.0006), 3100, 6) * 0.6
    return reverb(pan(y, 0.2), IR_ROOM(), 0.25, tail=False)


@reg('heart_pops', 0.0, 'K-drama hearts floating: 6 soft bubbly pops rising in pitch + warm sparkle. 1.4 s.', True)
def _(r, root=72):
    dur = 1.4
    n = N(dur)
    y = np.zeros((2, n))
    for k, iv in enumerate((0, 4, 7, 12, 16, 19)):
        L = N(0.25)
        tt = tax(L)
        f = mtof(root + iv) * (0.75 + 0.25 * np.clip(tt / 0.02, 0, 1))
        p = np.sin(phase_of(f)) * np.exp(-tt / 0.06) * attack(L, 0.002)
        p += np.sin(phase_of(2 * f)) * np.exp(-tt / 0.03) * 0.2
        add_at(y, pan(p * (0.6 + 0.08 * k), r.uniform(-0.7, 0.7)), 0.03 + k * 0.13 + r.uniform(0, 0.02))
    for k in range(20):
        tm = abs(r.normal(0.4, 0.3))
        L = N(0.05)
        tw = np.sin(2 * np.pi * r.uniform(5000, 9000) * tax(L)) * np.exp(-tax(L) / 0.01)
        add_at(y, pan(tw * 0.08, r.uniform(-0.9, 0.9)), tm)
    return reverb(y, IR_HALL(), 0.3, tail=False)


@reg('anime_sting', 0.32, 'Anime transformation sting: rising glitter sweep (0-0.32 s) into a bright chord flash + sparkles. '
     'Flash (hit) at 0.32 s. 1.6 s.', True)
def _(r, root=72):
    dur = 1.6
    n = N(dur)
    t = tax(n)
    y = np.zeros((2, n))
    # glitter sweep: fast upward stream of tiny sine grains
    for k in range(60):
        tm = 0.32 * (k / 60) ** 0.8
        L = N(0.04)
        f = 800 * 2 ** (4 * tm / 0.32) * r.uniform(0.95, 1.05)
        g = np.sin(2 * np.pi * f * tax(L)) * np.hanning(L)
        add_at(y, pan(g * 0.15 * (0.3 + tm / 0.32), r.uniform(-0.8, 0.8)), tm)
    sw = stft_shape(white(N(0.34), r), bandsweep(lambda tt: 1500 * 6 ** (tt / 0.34), 0.6)) * np.linspace(0, 1, N(0.34)) ** 2 * 0.15
    add_at(y, st(sw), 0.0)
    # chord flash
    for iv, p in ((0, -0.4), (4, 0.4), (7, -0.1), (12, 0.2), (19, 0.0), (24, -0.3)):
        g = S6._glock(mtof(root + iv), 1.2, r, 1.0)
        add_at(y, pan(g * 0.45, p), 0.32 + 0.008 * (iv % 5))
    m = N(1.2)
    pad = sum(saw(mtof(root - 12 + iv) * (1 + dt), m) for iv in (0, 4, 7, 12) for dt in (-0.005, 0.005)) * 0.04
    pad = lp(pad, 4000) * env(m, [(0, 0), (0.02, 1), (0.4, 0.4), (1.2, 0)])
    add_at(y, pan(pad, -0.3) + pan(pad, 0.3), 0.32)
    for k in range(30):
        tm = 0.32 + abs(r.normal(0, 0.35))
        L = N(0.05)
        tw = np.sin(2 * np.pi * r.uniform(5000, 11000) * tax(L)) * np.exp(-tax(L) / 0.01)
        add_at(y, pan(tw * 0.12, r.uniform(-0.9, 0.9)), tm)
    return reverb(hp(y, 150), IR_HALL(), 0.3, tail=False)


def main():
    os.makedirs(OUT, exist_ok=True)
    for nm in NEW:
        x = S6.build(nm, write=False)
        sf.write(os.path.join(OUT, nm + '.wav'), x.T.astype(np.float32), SR, subtype='PCM_24')
        print('%-14s %.2fs peak %.1f' % (nm, x.shape[1] / SR, 20 * np.log10(np.abs(x).max())))
    json.dump({k: S6.REG[k]['hit'] for k in NEW}, open(os.path.join(OUT, 'hits.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
