#!/usr/bin/env python3
"""
GOTV v6 -- new premium SFX, synthesised with the PACKET FROM HOME toolkit
(anim/audio/tools/sfx.py: physically modelled layers, resonator banks, convolution reverb).

    python3 sfx_v6.py              # build every sound into v6/sfx/
    python3 sfx_v6.py boom_big     # only some

48 kHz, 24-bit WAV, one-shots peak-normalised to -1 dBFS. `sfx/hits.json` holds the hit offset
(seconds from file start to the sync transient) of every file -> place a cue at t = sync - hit.
Pitched sounds (brass stab, riser, win chime, dings) take a MIDI root so mix_v6.py can retune
them to the key of the score at each moment (build_pitched()).
"""
import os
import sys
import json
import numpy as np
import soundfile as sf

sys.path.insert(0, '/home/user/I/anim/audio/tools')
from sfx import (SR, N, tax, rng_for, fit, db, white, pink, brown, lp, hp, bp, reson, peq, env,  # noqa: E402
                 slow_noise, expdec, attack, fade, phase_of, sine, saw, square, sat, norm_peak, pan,
                 pan_dyn, haas, st, add_at, stft_shape, bandsweep, lpsweep, resample_curve, bitcrush,
                 make_ir, reverb, whoosh, click, thump)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'sfx')
LIB = '/home/user/I/anim/audio/sfx'


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def lib(name):
    x, sr = sf.read(os.path.join(LIB, name + '.wav'), always_2d=True)
    assert sr == SR
    return x.T


# rooms
def IR_ROOM():      # tight studio room for impacts / foley
    return make_ir(rt60=0.55, predelay=0.006, hf=0.45, lf=1.0, er=14, er_span=0.035, bright=9000, seed=61)


def IR_LIVING():    # living room (remote, TV)
    return make_ir(rt60=0.4, predelay=0.004, hf=0.5, er=8, er_span=0.02, bright=8000, seed=64)


def IR_STAGE():
    return make_ir(rt60=1.3, predelay=0.012, hf=0.5, er=12, er_span=0.05, bright=10000, seed=62)


def IR_HALL():
    return make_ir(rt60=2.2, predelay=0.02, hf=0.55, er=12, er_span=0.07, bright=11000, seed=63)


REG = {}


def reg(name, hit, desc, pitched=False):
    def deco(fn):
        REG[name] = dict(fn=fn, hit=hit, desc=desc, pitched=pitched)
        return fn
    return deco


def finish(x, tail_fade=True):
    x = np.nan_to_num(np.asarray(x, float))
    x = hp(st(x), 18, 2)
    if tail_fade:   # never end a one-shot on a non-zero sample
        x = fade(x, 0, min(0.3, 0.15 * x.shape[-1] / SR))
    return norm_peak(x, -1.0)


# =========================================================================== IMPACTS
def _boom(r, size=1.0):
    """Trailer hit: sub drop + punchy kick + heavy rubber stamp on a wooden desk + air whump + room.
    Transient exactly at sample 0 (safe to start right after digital silence)."""
    dur = 1.1 + 2.3 * size
    n = N(dur)
    t = tax(n)
    # 1+2) one phase-continuous body oscillator = kick punch (fast pitch/amp decay) flowing into the sub drop
    #      (~220 Hz click-sweep -> ~95 Hz -> 27 Hz), so kick and sub never cancel each other
    f_b = 27 + (58 + 36 * size - 27) * np.exp(-t / (0.07 + 0.10 * size)) + 150 * np.exp(-t / 0.016)
    a_b = 1.0 * np.exp(-t / (0.11 + 0.05 * size)) + (0.15 + 0.75 * size) * np.exp(-t / (0.22 + 0.5 * size))
    body = np.sin(phase_of(f_b)) * a_b * attack(n, 0.0006)
    body = sat(body * 1.8, 1.8)
    sub = 0 * t
    kick = body
    bex = white(n, r) * expdec(n, 0.0009)
    beater = reson(bex, 3100, 1.6) * 3.0 + hp(white(n, r), 2500) * expdec(n, 0.0022) * 0.5
    # 3) heavy rubber stamp slammed on a wooden desk: resonator bank (desk modes) + rubber squash + paper smack
    ex = white(n, r) * expdec(n, 0.0016)
    desk = sum(reson(ex, f, q, a) for f, q, a in
               [(98, 3, 1.0), (168, 4, 1.0), (285, 5, 0.9), (450, 6, 0.7), (720, 7, 0.5), (1150, 8, 0.35),
                (1900, 9, 0.2)]) * 56.0
    desk *= expdec(n, 0.07 + 0.04 * size)
    rubber = lp(white(n, r), 800, 2) * expdec(n, 0.018) * attack(n, 0.001) * 3.5
    smack = bp(white(n, r), 900, 5500) * expdec(n, 0.006) * 2.2
    # 4) air-pressure whump
    whump = lp(brown(n, r), 160, 2) * expdec(n, 0.08 + 0.10 * size) * attack(n, 0.004) * 0.6
    # 5) cinematic crack: tight snare-like noise crack + a faint inharmonic metal ring (bigger hits only)
    crack = bp(white(n, r), 1400, 9000, 2) * expdec(n, 0.022 + 0.02 * size) * attack(n, 0.0005) * 1.6
    ring = sum(a * np.sin(2 * np.pi * f * t + r.uniform(0, 6.3)) * np.exp(-t / d) for f, a, d in
               ((523, 0.5, 0.5), (1377, 0.35, 0.35), (2461, 0.25, 0.25), (3890, 0.18, 0.18))) * attack(n, 0.001)
    low = kick * 1.0 + whump
    mid = desk * 0.85 + rubber + smack + beater * 0.5 + crack + ring * 0.05 * size
    y = st(low) + reverb(mid, IR_ROOM(), wet=0.32, tail=False)
    y += haas(hp(smack, 2000) * 0.25, 0.7)
    if size >= 0.55:   # cinematic bloom: dark long tail of the body
        bloom = reverb(lp(mid * 0.6 + kick * 0.5, 2200), IR_HALL(), wet=1.0, dry=0.0, tail=False)
        y += bloom * 0.22 * size
    y = sat(y * 1.1, 1.25)
    return y


@reg('boom_big', 0.0, 'THE big trailer hit (25.64): sub drop 98->27 Hz, kick, heavy rubber stamp on a wooden desk, '
     'air whump, room + dark hall bloom. Transient at sample 0. 3.4 s.')
def _(r):
    return _boom(r, 1.0)


@reg('boom_med', 0.0, 'Cinematic stamp/logo slam, medium: same layers, shorter sub. 2.3 s.')
def _(r):
    return _boom(r, 0.62)


@reg('boom_med_b', 0.0, 'Medium slam, second take (different grain) for back-to-back stamps. 2.3 s.')
def _(r):
    return _boom(r, 0.55)


@reg('stamp_thud', 0.0, 'Lighter stamp/poster slam: kick + rubber stamp + paper smack, small sub. 1.4 s.')
def _(r):
    return _boom(r, 0.2)


@reg('stamp_thud_b', 0.0, 'Lighter slam, alternate take. 1.4 s.')
def _(r):
    return _boom(r, 0.25)


@reg('sub_drop', 0.0, 'Pure sub drop (65->25 Hz sine, 1.6 s) with a soft kick click: the "drop" after a riser.')
def _(r):
    n = N(1.8)
    t = tax(n)
    f = 25 + 40 * np.exp(-t / 0.18)
    y = np.sin(phase_of(f)) * np.exp(-t / 0.7) * attack(n, 0.003)
    y = sat(y * 1.3, 1.5) + 0.15 * np.sin(phase_of(47 + 120 * np.exp(-t / 0.02))) * expdec(n, 0.08)
    return y


# =========================================================================== REVEAL: brass stab
def brass_stab(r, root=50, dur=2.2):
    """classy synth-brass 'braam' stab: 5 voices of 3 detuned saws with a brass lip-scoop, a fast-opening /
    closing low-pass (the 'blat'), brass formant peaks, breath chiff, hall reverb. Power voicing (no 3rd)."""
    n = N(dur)
    t = tax(n)
    notes = [(root - 12, 0.85), (root, 1.0), (root + 7, 0.8), (root + 12, 0.65), (root + 19, 0.38), (root + 24, 0.2)]
    scoop = 1 - 0.03 * np.exp(-t / 0.028)
    y = np.zeros((2, n))
    for m, a in notes:
        f = mtof(m)
        for k, dt in enumerate((-0.0055, 0.0, 0.006)):
            vib = 1 + 0.0012 * np.sin(2 * np.pi * r.uniform(4.8, 5.8) * t + r.uniform(0, 6.3))
            v = saw(f * (1 + dt) * scoop * vib, n)
            y += pan(v * a / 3, (k - 1) * (0.55 if m > root else 0.2))

    def fc(tt):
        rise = np.clip(tt / 0.018, 0, 1) ** 0.6
        return 300 + rise * (6800 * np.exp(-np.maximum(tt - 0.018, 0) / 0.2) + 900 * np.exp(-tt / 0.7))
    y = stft_shape(y, lpsweep(fc, 18.0), nper=1024)
    y = peq(y, 1150, 1.1, 4.5)
    y = peq(y, 2700, 1.8, 2.5)
    y = hp(y, 45, 2)
    a = env(n, [(0, 0), (0.010, 1.0), (0.07, 0.82), (0.3, 0.55), (0.6, 0.22), (0.95, 0.0), (dur, 0.0)])
    y = sat(y * 1.8, 1.6) * a
    chiff = bp(white(n, r), 900, 4500) * expdec(n, 0.012) * 0.12
    y += pan(chiff, -0.1) + pan(chiff[::-1][::-1] * 0.8, 0.15)
    return reverb(y, IR_HALL(), wet=0.3, tail=False)


@reg('brass_stab', 0.0, 'Classy synth-brass "braam" stab (short power chord, lip scoop, blat filter, hall). Hit 0.0.', True)
def _(r, root=50):
    return brass_stab(r, root)


# =========================================================================== TRANSITIONS
def riser(r, dur, root=62, semis=12):
    """clean tonal riser: stacked sine/soft-saw voices (root, 5th, octaves) gliding up `semis` with an accelerating
    curve, Shepard octave cross-fade, accelerating tremolo, opening filter; ends dead at `dur` (sudden drop)."""
    n = N(dur)
    t = tax(n)
    u = t / dur
    bend = 2 ** (semis * u ** 2.0 / 12.0)
    trem_rate = 3 + 22 * u ** 2
    trem = 1 - (0.55 * u ** 1.6) * (0.5 + 0.5 * np.sin(phase_of(trem_rate)))
    y = np.zeros((2, n))
    for iv, a0, a1, p in [(-12, 0.7, 0.0, 0.0), (0, 1.0, 0.8, -0.35), (7, 0.55, 0.7, 0.35), (12, 0.45, 0.8, 0.0),
                          (19, 0.0, 0.5, -0.5), (24, 0.0, 0.35, 0.5)]:
        f = mtof(root + iv) * bend
        a = a0 + (a1 - a0) * u
        for dt, pp in ((-0.004, -1), (0.004, 1)):
            v = 0.65 * sine(f * (1 + dt), n) + 0.35 * lp(saw(f * (1 + dt), n), 2500, 1)
            y += pan(v * a * 0.5, np.clip(p + 0.25 * pp, -1, 1))
    y = stft_shape(y, lpsweep(lambda tt: 700 + 9000 * (tt / dur) ** 2, 12.0), nper=2048)
    air = stft_shape(white(n, r), bandsweep(lambda tt: 1200 * 8 ** (tt / dur), 0.5)) * 0.05 * u ** 2
    y = y + haas(air, 3)
    y *= trem * db(-34 * (1 - u) ** 1.3)
    y[:, -N(0.004):] *= np.linspace(1, 0, N(0.004))
    return y


@reg('riser_long', 1.30, 'Clean tonal riser 1.30 s (octave glide, tremolo accelerating), dead stop at 1.30 s = hit.', True)
def _(r, root=62):
    return fit(riser(r, 1.30, root, 12), N(1.32))


@reg('riser_short', 0.48, 'Clean tonal riser 0.48 s, dead stop at 0.48 s = hit.', True)
def _(r, root=62):
    return fit(riser(r, 0.48, root, 7), N(0.50))


def _swoosh(r, dur, peak, f_lo, f_hi, pan_from, pan_to, body=0.35, bw=0.8, sharp=2.5):
    y = whoosh(dur, r, peak, f_lo, f_hi, bw, pan_from, pan_to, sharp, tone=0.0)
    n = y.shape[1]
    t = tax(n)
    # low body (the displaced air of a big paper sheet): short sine swell doppler 70->160->60 Hz
    fb = np.where(t < peak, 70 + 90 * (t / peak), 160 * np.exp(-(t - peak) * 5) + 55)
    a = np.where(t < peak, (t / peak) ** 3, np.exp(-(t - peak) / 0.09))
    y += st(np.sin(phase_of(fb)) * a * body)
    # second, darker air layer for depth
    y2 = whoosh(dur, r, peak * 1.05, f_lo * 0.5, f_hi * 0.35, 1.1, pan_from * 0.5, pan_to * 0.5, sharp)
    y = y + 0.6 * y2
    return reverb(y, IR_ROOM(), 0.18, tail=False)


@reg('wipe_whoosh_a', 0.26, 'Paper-wipe whoosh: fast air rip L->R + low paper-sheet body. Peak 0.26 s. 0.8 s.')
def _(r):
    return _swoosh(r, 0.8, 0.26, 300, 5200, -0.7, 0.7)


@reg('wipe_whoosh_b', 0.24, 'Paper-wipe whoosh R->L, a little darker. Peak 0.24 s. 0.75 s.')
def _(r):
    return _swoosh(r, 0.75, 0.24, 220, 4200, 0.7, -0.7)


@reg('wipe_whoosh_c', 0.2, 'Upward paper-wipe whoosh (bottom->top sheet), bright and quick. Peak 0.2 s. 0.65 s.')
def _(r):
    return _swoosh(r, 0.65, 0.2, 350, 6000, -0.2, 0.2, body=0.25)


@reg('flick', 0.09, 'Tiny card flick "fwip" (fast, bright, short). Peak 0.09 s. 0.35 s.')
def _(r):
    return _swoosh(r, 0.35, 0.09, 700, 7500, -0.4, 0.4, body=0.08, bw=0.7, sharp=2.0)


@reg('curtain_swoosh', 0.34, 'Heavy stage-curtain swoosh closing: low wide air + cloth-weight body. Peak 0.34 s. 0.9 s.')
def _(r):
    y = _swoosh(r, 0.9, 0.34, 120, 2200, -0.9, 0.9, body=0.6, bw=1.1, sharp=2.0)
    return y


# =========================================================================== GLITCH / SCRATCH
def _music_src(r, dur, root=50):
    """a short bright music-ish source: chord stab + bass + kick/snare/hat groove (what the TV / record plays)"""
    n = N(dur)
    t = tax(n)
    y = np.zeros(n)
    beat = 0.3
    for k in range(int(dur / beat) + 1):
        i = k * beat
        if k % 2 == 0:
            add_at(y, thump(0.25, 140, 50, 0.08, 0.3, r) * 0.9, i)
        else:
            L_ = N(0.2)
            sn = bp(white(L_, r), 900, 7000) * expdec(L_, 0.05) + np.sin(2 * np.pi * 190 * tax(L_)) * expdec(L_, 0.03) * 0.5
            add_at(y, sn * 0.7, i)
        L_ = N(0.05)
        add_at(y, hp(white(L_, r), 7000) * expdec(L_, 0.01) * 0.25, i + beat / 2)
    ch = sum(saw(mtof(m) * 1.002 ** j, n) for m in (root + 12, root + 16, root + 19, root + 24) for j in (-1, 1)) * 0.08
    ch = lp(ch, 3500, 2) * (0.6 + 0.4 * (np.sin(2 * np.pi * t / (beat * 2)) > 0))
    bass = sat(np.sin(phase_of(np.full(n, mtof(root - 12)))) * 1.5, 1.5) * 0.4
    return lp(y + ch + bass, 9000, 2)


@reg('glitch_freeze', 0.0, 'Buffer FREEZE: TV sound stutters in shrinking buffer repeats, bit-crush + digital blips, '
     'then tape-stops dead by 0.24 s with a low thud; silent from 0.30 s. Hit 0.0.')
def _(r):
    src = _music_src(r, 1.2) * 0.7 + fit(lib('tv_crowd_live')[0][-N(1.2):], N(1.2)) * 0.5
    dur = 0.42
    n = N(dur)
    y = np.zeros(n)
    g = N(0.05)
    pos = 0
    k = 0
    base = N(0.6)
    while pos < N(0.11):
        gr = src[base:base + g] * np.hanning(g) ** 0.08
        gr = gr if k < 1 else bitcrush(gr, max(3, 7 - k), 1 + 2 * k)
        add_at(y, gr * (1 - 0.06 * k), pos / SR)
        pos += g
        g = max(N(0.011), int(g * 0.72))
        k += 1
    for j in range(9):
        bn = N(r.uniform(0.008, 0.022))
        b = square(float(r.choice([1320, 1760, 2640, 3520, 4400])), bn, duty=r.uniform(0.2, 0.5)) * 0.2
        add_at(y, b * np.hanning(bn) ** 0.2, r.uniform(0.0, 0.13))
    cr = bitcrush(white(N(0.14), r) * 0.25, 3, 30)
    add_at(y, hp(cr, 700) * expdec(N(0.14), 0.05), 0.01)
    # tape stop of the music (0.10 -> 0.24 s)
    tn = N(0.15)
    rate = np.linspace(1.0, 0.0, tn) ** 1.4
    ts = resample_curve(src[N(0.2):], np.cumsum(rate))
    ts = lp(ts * np.linspace(1, 0.2, tn), 5000, 2)
    add_at(y, ts * 0.9, 0.10)
    add_at(y, thump(0.14, 80, 38, 0.05, 0.15, r) * 0.45, 0.235)
    y = sat(y * 1.3, 1.4)
    y[N(0.30):] = 0
    y[N(0.26):N(0.30)] *= np.linspace(1, 0, N(0.30) - N(0.26))
    return pan(y, 0.0) + haas(hp(y, 3000) * 0.25, 0.8)


def _scratch(r, prof_t, prof_v, dur, root=50):
    src = _music_src(r, 3.0, root)
    src = lp(src, 8000, 4)
    n = N(dur)
    t = tax(n)
    vel = np.interp(t, prof_t, prof_v)
    vel = np.convolve(vel, np.hanning(N(0.006)) / np.hanning(N(0.006)).sum(), 'same')
    pos = N(1.0) + np.cumsum(vel)
    y = resample_curve(src, pos)
    sp = np.abs(vel)
    y *= np.clip(sp / 1.2, 0.12, 1.0) ** 0.7
    # stylus friction in the groove, only while moving
    fr = bp(white(n, r), 1800, 7000) * sp * 0.035
    crack = np.zeros(n)
    idx = r.integers(0, n, 40)
    crack[idx] = r.uniform(-1, 1, 40)
    crack = bp(crack, 1000, 7000) * 0.25
    # hand grabbing the record
    grab = lp(white(n, r), 900) * expdec(n, 0.01) * 0.2
    y = hp(y, 150) + fr + crack + grab
    y *= env(n, [(0, 0), (0.004, 1), (dur - 0.08, 0.9), (dur, 0)])
    return reverb(pan(y, 0.05) + haas(y * 0.15, 0.6), IR_LIVING(), 0.12, tail=False)


@reg('record_scratch_v6', 0.012, 'Vinyl record scratch "wikka-wiiip": groove source, hand grab, back-forth cuts, '
     'stylus friction, living-room air. Hit 0.012 s. 0.62 s.')
def _(r):
    return _scratch(r, [0, 0.012, 0.03, 0.06, 0.1, 0.14, 0.2, 0.24, 0.3, 0.52, 0.62],
                    [1, 1, 0, -2.4, -2.4, 2.6, 2.6, -2.2, 3.0, 0.3, 0], 0.62)


@reg('record_scratch_v6b', 0.012, 'Record scratch, second take: quick "wiki-wiiiip" pull-back. 0.55 s.')
def _(r):
    return _scratch(r, [0, 0.012, 0.03, 0.07, 0.11, 0.16, 0.2, 0.46, 0.55],
                    [1, 1, 0, -2.6, 2.4, 2.4, -3.2, -0.3, 0], 0.55)


# =========================================================================== WIN / NOTIFY / UI
def _glock(f, dur, r, bright=1.0):
    n = N(dur)
    tt = tax(n)
    y = np.zeros(n)
    for ratio, amp, tau in ((1.0, 1.0, 0.9), (2.0, 0.18, 0.4), (2.71, 0.35 * bright, 0.25), (5.2, 0.18 * bright, 0.08)):
        y += amp * np.sin(2 * np.pi * f * ratio * tt + r.uniform(0, 6.3)) * np.exp(-tt / tau)
    y += 0.06 * hp(white(n, r), 4000) * np.exp(-tt / 0.002)   # mallet
    return y * attack(n, 0.0008)


def win_chime(r, root=74, quality='maj'):
    dur = 2.4
    n = N(dur)
    y = np.zeros((2, n))
    third = 4 if quality == 'maj' else 3
    seq = [0, third, 7, 12, 12 + third, 19, 24]
    step = 0.042
    for k, iv in enumerate(seq):
        f = mtof(root + iv)
        g = _glock(f, 1.4, r, 1.0) * (0.75 + 0.25 * k / len(seq))
        add_at(y, pan(g, -0.6 + 1.2 * k / (len(seq) - 1)), k * step)
    # confirming bright chord on top, a hair after the arpeggio
    t_ch = len(seq) * step
    for iv, p in ((12, -0.3), (12 + third, 0.3), (19, -0.1), (24, 0.2)):
        add_at(y, pan(_glock(mtof(root + iv), 1.8, r, 0.8) * 0.55, p), t_ch)
    # warm soft pad underneath (sine chord, fast swell, short)
    m = N(1.4)
    pad = sum(np.sin(2 * np.pi * mtof(root - 12 + iv) * tax(m)) for iv in (0, third, 7, 12)) * 0.08
    pad *= env(m, [(0, 0), (0.08, 1), (0.5, 0.5), (1.4, 0)])
    add_at(y, st(pad), 0.02)
    # glitter: tiny high sine twinkles
    for k in range(34):
        tm = 0.05 + abs(r.normal(0, 0.35))
        L_ = N(0.06)
        tw = np.sin(2 * np.pi * r.uniform(4500, 10000) * tax(L_)) * np.exp(-tax(L_) / 0.012) * attack(L_, 0.001)
        add_at(y, pan(tw * r.uniform(0.05, 0.14) * np.exp(-tm * 1.5), r.uniform(-0.9, 0.9)), tm)
    y = hp(y, 150, 2)
    return reverb(y, IR_HALL(), 0.3, tail=False)


@reg('win_chime', 0.0, 'Game-win success chime: fast sparkly glockenspiel major arpeggio (7 notes, L->R), bright '
     'confirming chord, warm pad, glitter twinkles, hall. First note = hit 0.0. 2.4 s.', True)
def _(r, root=74):
    if isinstance(root, tuple):
        return win_chime(r, root[0], root[1])
    return win_chime(r, root)


def notif_ding(r, midi):
    f = mtof(midi)
    n = N(0.7)
    t = tax(n)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.26)
    y += 0.30 * np.sin(2 * np.pi * 4.0 * f * t) * np.exp(-t / 0.035)      # marimba 4th partial (tuned bar)
    y += 0.16 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / 0.09)     # glassy bell partial
    y += 0.10 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.15)
    y *= attack(n, 0.0008)
    y += click(n, r, 5200, 3, 0.002) * 0.05
    return reverb(pan(y, 0) + haas(y * 0.2, 0.9), IR_ROOM(), 0.2, tail=False)


@reg('notif_ding', 0.0, 'Phone notification ding: tuned marimba/glass bar, soft mallet tick. Hit 0.0. 0.7 s.', True)
def _(r, root=81):
    return notif_ding(r, root)


@reg('ui_click', 0.0, 'Crisp UI tap/click: tight broadband tick with 3.4 kHz / 6.8 kHz resonance and a tiny body. 0.08 s.')
def _(r):
    n = N(0.08)
    ex = white(n, r) * expdec(n, 0.00035)
    y = reson(ex, 3400, 2.5) * 2.2 + reson(ex, 6800, 3) * 0.9 + reson(ex, 1250, 4) * 0.7
    y += np.sin(2 * np.pi * 720 * tax(n)) * expdec(n, 0.005) * attack(n, 0.0003) * 0.18
    return pan(y, 0) + haas(hp(y, 3000) * 0.2, 0.5)


@reg('remote_click', 0.0, 'TV remote button: rubber-dome press (plastic click + muffled thup + low tock) at 0.0, '
     'lighter release click at 0.24 s, living-room air. 0.5 s.')
def _(r):
    n = N(0.5)
    y = np.zeros(n)

    def clk(amp, bright):
        m = N(0.06)
        ex = white(m, r) * expdec(m, 0.0005)
        c = sum(reson(ex, f * bright, q, a) for f, q, a in ((2200, 9, 1.0), (3800, 10, 0.7), (5600, 12, 0.4))) * 3
        c += reson(ex, 380, 5, 1.0) * 1.6 + lp(white(m, r), 1500) * expdec(m, 0.008) * 0.35
        return c * amp
    add_at(y, clk(1.0, 1.0), 0.0)
    add_at(y, clk(0.45, 1.18), 0.24)
    return reverb(pan(y, -0.05), IR_LIVING(), 0.15, tail=False)


@reg('tv_power_on', 0.0, 'TV power-on: relay clunk, CRT degauss "thoom" (50 Hz buzz swell with wobble), static '
     'crackle burst and a faint line-whine settling. Hit 0.0. 1.4 s.')
def _(r):
    dur = 1.4
    n = N(dur)
    t = tax(n)
    clunk = thump(dur, 150, 60, 0.05, 0.5, r) * 0.8 + click(n, r, 2600, 6, 0.003) * 0.3
    buzz = sat(np.sin(2 * np.pi * 50 * t) * 2.5, 2.5) * (1 + 0.35 * np.sin(2 * np.pi * 7 * t) * np.exp(-t / 0.3))
    buzz = bp(buzz, 45, 900) * env(n, [(0, 0), (0.015, 1), (0.25, 0.55), (0.8, 0.0), (dur, 0)])
    thoom = np.sin(phase_of(40 + 30 * np.exp(-t / 0.08))) * expdec(n, 0.35) * attack(n, 0.01)
    stat = hp(white(n, r), 2500) * slow_noise(n, r, 60, 0, 1) ** 3 * env(n, [(0, 0), (0.01, 1), (0.18, 0.2), (0.35, 0)])
    arc = hp(L_arc(0.35, r), 1500)
    whine = np.sin(2 * np.pi * (7800 + 300 * np.exp(-t / 0.2)) * t) * env(n, [(0, 0), (0.05, 1), (0.6, 0.3), (dur, 0)]) * 0.012
    y = clunk + buzz * 0.5 + thoom * 0.6 + stat * 0.18 + fit(arc, n) * 0.25 + whine
    return reverb(pan(y, 0) + haas(stat * 0.1, 1.0), IR_LIVING(), 0.15, tail=False)


def L_arc(dur, r):
    from sfx import electric_arc
    return electric_arc(dur, r, 60, 100) * np.linspace(1, 0, N(dur)) ** 2


@reg('camera_shutter', 0.0, 'DSLR shutter: mirror slap + first curtain (0.0), second curtain (0.055), mirror return '
     '(0.11) with tiny spring ring. 0.4 s.')
def _(r):
    n = N(0.4)
    y = np.zeros(n)

    def part(amp, fs, body):
        m = N(0.08)
        ex = white(m, r) * expdec(m, 0.0006)
        c = sum(reson(ex, f, 14, a) for f, a in zip(fs, (1.0, 0.7, 0.5, 0.35))) * 3
        c += reson(ex, body, 4, 1.0) * 1.2
        return c * amp
    add_at(y, part(1.0, (1800, 3100, 5200, 7600), 240), 0.0)
    add_at(y, part(0.7, (2300, 4100, 6200, 8400), 420), 0.055)
    add_at(y, part(0.4, (1500, 2700, 4600, 6900), 300), 0.11)
    ring = np.sin(2 * np.pi * 3650 * tax(N(0.15))) * np.exp(-tax(N(0.15)) / 0.03) * 0.04
    add_at(y, ring, 0.06)
    return reverb(pan(y, 0.1) + haas(y * 0.2, 0.7), IR_ROOM(), 0.12, tail=False)


@reg('paper_pop', 0.0, 'Soft card "pok" pop: rounded bubble pitch-drop + papery flap, tasteful and short. 0.3 s.')
def _(r):
    n = N(0.3)
    t = tax(n)
    f = 260 + 700 * np.exp(-t / 0.012)
    y = np.sin(phase_of(f)) * expdec(n, 0.03) * attack(n, 0.0008)
    y += bp(white(n, r), 1200, 4500) * expdec(n, 0.007) * 0.25
    return reverb(pan(y, 0), IR_ROOM(), 0.15, tail=False)


@reg('card_tap', 0.0, 'Paper card slapped onto a table: soft thock body + paper smack + small wood ring. 0.35 s.')
def _(r):
    n = N(0.35)
    t = tax(n)
    body = np.sin(phase_of(95 + 110 * np.exp(-t / 0.012))) * expdec(n, 0.035) * attack(n, 0.0006)
    ex = white(n, r) * expdec(n, 0.0009)
    wood = sum(reson(ex, f, q, a) for f, q, a in ((240, 6, 1.0), (610, 9, 0.6), (1300, 10, 0.3))) * 2.5
    smack = bp(white(n, r), 800, 4500) * expdec(n, 0.004) * 0.5
    y = body * 0.8 + wood * expdec(n, 0.05) + smack
    return reverb(pan(y, 0), IR_ROOM(), 0.2, tail=False)


@reg('paper_tear', 0.0, 'Short clean paper tear (0.22 s): accelerating fibre-crackle grains + tiny low "fft". Quiet use.')
def _(r):
    dur = 0.35
    n = N(dur)
    y = np.zeros(n)
    tm = 0.0
    while tm < 0.22:
        L_ = N(r.uniform(0.002, 0.006))
        g = white(L_, r) * np.hanning(L_)
        add_at(y, reson(g, r.uniform(1800, 5500), 2.5) * 3 * r.uniform(0.4, 1.0), tm)
        tm += r.uniform(0.003, 0.012) * (1 - 0.6 * tm / 0.22)
    y = bp(y, 900, 9000) * env(n, [(0, 0), (0.01, 0.6), (0.15, 1), (0.22, 0.4), (0.3, 0)])
    y += lp(white(n, r), 500) * expdec(n, 0.03) * 0.25
    return reverb(pan(y, 0.2) + haas(y * 0.2, 0.8), IR_ROOM(), 0.12, tail=False)


# =========================================================================== build
_CACHE = {}


def build(name, root=None, write=True, suffix=''):
    spec = REG[name]
    key = (name, root)
    if key not in _CACHE:
        r = rng_for('gotv6_' + name)
        x = spec['fn'](r, root) if (spec['pitched'] and root is not None) else spec['fn'](r)
        _CACHE[key] = finish(x, not name.startswith('riser'))
    x = _CACHE[key]
    if write:
        os.makedirs(OUT, exist_ok=True)
        sf.write(os.path.join(OUT, name + suffix + '.wav'), x.T.astype(np.float32), SR, subtype='PCM_24')
    return x


def main(argv):
    names = argv or list(REG)
    for nm in names:
        x = build(nm)
        pk = 20 * np.log10(np.max(np.abs(x)) + 1e-12)
        rms = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
        print('%-20s %5.2fs peak %5.1f rms %6.1f' % (nm, x.shape[-1] / SR, pk, rms), flush=True)
    hits = {k: v['hit'] for k, v in REG.items()}
    with open(os.path.join(OUT, 'hits.json'), 'w') as f:
        json.dump(hits, f, indent=1)


if __name__ == '__main__':
    main(sys.argv[1:])
