#!/usr/bin/env python3
"""Procedural SFX for the 37 s Hebrew streaming promo.
   python3 audio/tools/promo_sfx.py            # build every sound found in audio/cues/*.json
   python3 audio/tools/promo_sfx.py name ...   # only some
GOTV v2 copy: builds only names missing from promo/audio/sfx into gotv/audio/sfx. Writes audio/sfx/<name>.wav (48 kHz float32 stereo) and audio/sfx/hits.json (seconds from file start to impact).
Unknown names (new cues) fall back to a keyword classifier so nothing is ever missing.
"""
import os, sys, json, glob, shutil, zlib
import numpy as np
import soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, '/home/user/I/promo/audio/tools')
from sfx import *          # helpers from the packet-from-home library (SR, whoosh, bell, thump, reverb, ...)
from sfx import _sos, _air_horn, _whistle
ROOT = '/home/user/I/gotv/audio'
PROMO_SFX = '/home/user/I/promo/audio/sfx'
OUTD = os.path.join(ROOT, 'sfx')
CUES = os.path.join(ROOT, 'cues')
ANIM = '/home/user/I/anim/audio/sfx'
PENTA = [1, 9/8, 5/4, 3/2, 5/3, 2]

def rr(name):
    return np.random.default_rng((zlib.crc32(name.encode()) ^ 7717) & 0xFFFFFFFF)

def mk(n): return np.zeros((2, n))
def ms(x): return st(x)
def widen(x, m=0.5):
    x = st(x); return x + 0 if False else np.vstack([x[0], x[1]]) 
def verb(x, ir, wet=0.25, dry=1.0): return reverb(x, ir, wet=wet, dry=dry)
def tone_env(n, a, d): return attack(n, a) * expdec(n, d)
def note(f, dur, d=0.15, a=0.002, harm=(1,), wave='sine'):
    n = N(dur); y = np.zeros(n)
    for i, h in enumerate(harm, 1):
        y += sine(f * i, n) * h
    return y * tone_env(n, a, d)
def sparkle_bell(f, dur, r, d=0.25):
    n = N(dur); t = tax(n)
    y = np.sin(2*np.pi*f*t) + 0.45*np.sin(2*np.pi*f*2.76*t)*np.exp(-t/(d*.5)) + 0.25*np.sin(2*np.pi*f*5.4*t)*np.exp(-t/(d*.3))
    return y * attack(n, .0008) * np.exp(-t/d)
def cat(*xs):
    n = max(x.shape[-1] for x in xs); o = mk(n)
    for x in xs: o += fit(st(x), n)
    return o
def at(dst, src, t, g=1.0):
    return add_at(dst, st(src), t, g)

# --------------------------------------------------------------------- families
def f_whoosh(r, dur=0.6, peak=0.3, f_lo=300, f_hi=5000, bw=0.9, pf=-0.6, pt=0.6, tone=0.0, shim=0.0,
             sub=0.0, grit=0.0, rev=False, wet=0.0, sharp=3.0):
    y = whoosh(dur, r, peak, f_lo, f_hi, bw, pf, pt, sharp, tone)
    n = y.shape[1]
    if sub:
        b = lp(brown(n, r), 220) * env(n, [(0, 0), (peak, 1), (dur, 0)]) * 0.5
        y = y + sub * mono_to_st(b) * 3
    if grit:
        g = sat(bp(white(n, r), 800, 5000) * env(n, [(0, 0), (peak, 1), (dur, 0)]) * 2, 3)
        y = y + grit * 0.4 * pan(g, (pf + pt) / 2)
    if shim:
        s = np.zeros((2, n))
        for k in range(int(6 + 14 * dur)):
            tt = r.uniform(peak * 0.4, dur * 0.95)
            at(s, pan(sparkle_bell(r.uniform(3000, 9000), 0.3, r, 0.08), r.uniform(-.8, .8)), tt, r.uniform(.1, .3))
        y = y + shim * s
    if rev:
        y = y[:, ::-1]; hit = dur - 0.04
    else:
        hit = peak
    if wet: y = verb(y, make_ir(1.0, 0.01, seed=3), wet)
    return y, hit

def f_boom(r, sub0=75, sub1=32, tau=0.7, body=0.5, crack=0.5, metal=0.0, mf=340, shim=0.0, wet=0.3,
           dur=2.0, ir=None, choir=0.0, low_rumble=0.3, grit=0.0, crackf=3500):
    n = N(dur)
    y = np.zeros(n)
    y += thump(dur, sub0, sub1, tau, 0.0) * 1.0
    y += 0.35 * sine(sub0 * 2.0 * (1 + 1.0 * np.exp(-tax(n) / 0.05))) * expdec(n, tau * 0.35) * attack(n, .002)
    bd = lp(white(n, r), 1600) * expdec(n, 0.18) * attack(n, .001)
    y += body * bd * 2.2
    cr = hp(white(n, r), crackf) * expdec(n, 0.012) * attack(n, .0003)
    y += crack * cr * 1.5
    if grit: y += grit * sat(bp(white(n, r), 200, 2500) * expdec(n, .35) * 3, 4) * .5
    if low_rumble: y += low_rumble * lp(brown(n, r), 120) * expdec(n, tau * 1.3) * 4
    if metal:
        t = tax(n)
        for ratio, a, d in ((1, 1, 1.4), (2.32, .7, 1.0), (3.76, .55, .8), (5.4, .4, .6), (7.1, .25, .4)):
            y += metal * 0.25 * a * np.sin(2*np.pi*mf*ratio*t + r.uniform(0, 6)) * np.exp(-t / d) * attack(n, .002)
    x = pan(y, 0.0)
    if shim:
        s = np.zeros((2, n))
        for k in range(14):
            at(s, pan(sparkle_bell(r.uniform(2500, 9500), 0.9, r, 0.35), r.uniform(-.9, .9)), 0.02 + r.uniform(0, 0.5), r.uniform(.1, .4))
        x = x + shim * s
    if choir:
        cn = pink(n, r); ch = formant(cn, 'a', 1.1) + formant(cn, 'o', 1.0)
        ch = ch * env(n, [(0, 0), (0.25, 1), (dur * .7, .6), (dur, 0)])
        x = x + choir * 0.5 * pan(ch, 0)
        x = x + choir * 0.3 * pan(hp(ch, 800) * 2, 0.2)
    if wet:
        x = verb(x, ir or IR_hall(), wet)
    return x, 0.003

def f_pop(r, f0=450, f1=1100, dur=0.14, click=0.3, blip=0.0, blipf=2400, pan_=0.0, tau=0.05, body=1.0, d2=None):
    n = N(dur); t = tax(n)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.018))
    y = np.sin(phase_of(f)) * expdec(n, tau) * attack(n, .0008) * body
    y += click * hp(white(n, r), 1800) * expdec(n, .004) * attack(n, .0002) * 1.4
    if blip:
        bn = note(blipf, dur * .8, .05)
        y += blip * fit(np.concatenate([np.zeros(N(.025)), bn]), n)
    return pan(y, pan_), 0.0

def f_blips(r, notes=(1200, 1800), step=0.07, ndur=0.12, wave='sine', d=0.06, lvl=1.0, wet=0.0, lpf=9000):
    n = N(step * len(notes) + ndur + 0.05); y = np.zeros(n)
    for i, f in enumerate(notes):
        m = N(ndur); ph = phase_of(f, m)
        w = np.sin(ph) if wave == 'sine' else (np.sign(np.sin(ph)) * .5 + np.sin(ph) * .5 if wave == 'square' else 2 * ((ph / (2*np.pi)) % 1) - 1)
        w = w * expdec(m, d) * attack(m, .001)
        y[N(step * i):N(step * i) + m] += w[:n - N(step * i)][:m]
    y = lp(y, lpf)
    x = pan(y * lvl, 0)
    if wet: x = verb(x, make_ir(.6, .005, seed=5), wet)
    return x, 0.0

def f_sparkle(r, dur=1.2, count=24, lo=2500, hi=9000, rise=False, dens='decay', gain=1.0, wet=0.25, hit=0.0, spread=0.9, d=0.22, scale=True):
    n = N(dur + 0.6); x = np.zeros((2, n))
    for k in range(count):
        u = r.uniform()
        tt = (-np.log(1 - u * .95) / 3.0 / 1.0 * dur * .42) if dens == 'decay' else u * dur * .95
        tt = min(tt, dur * .95)
        base = lo * (hi / lo) ** (tt / dur if rise else r.uniform())
        if scale: base = lo * 2 ** (round(np.log2(base / lo) * 5) / 5)
        b = sparkle_bell(base, .5, r, d * r.uniform(.5, 1.2))
        at(x, pan(b, r.uniform(-spread, spread)), tt, r.uniform(.25, 1) * gain * (1 - .5 * tt / dur))
    if wet: x = verb(x, IR_hall(), wet)
    return x, hit

def f_arp(r, notes, step=0.06, d=0.3, lvl=1.0, wet=0.3, pan_lr=(-0.5, 0.5), harm=(1, .3), sp=False):
    n = N(step * len(notes) + d * 4); x = np.zeros((2, n))
    for i, f in enumerate(notes):
        b = sparkle_bell(f, d * 3, r, d) if not sp else note(f, d * 3, d, harm=harm)
        at(x, pan(b, np.interp(i, [0, max(1, len(notes) - 1)], pan_lr)), step * i, lvl * (0.75 + .25 * i / len(notes)))
    if wet: x = verb(x, IR_hall(), wet)
    return x, 0.0

def f_flip(r, pitch=1.0, n_=1, gap=0.07, dur=0.35, pan_=0, snap=1.0, flutter=0.6):
    n = N(dur + gap * n_); x = np.zeros((2, n))
    for k in range(n_):
        m = N(dur)
        w = white(m, r)
        whap = bp(w, 1800 * pitch, 7000 * pitch, 2) * expdec(m, .018) * attack(m, .0004) * 2.5
        thud = sine(180 * pitch * (1 + np.exp(-tax(m) / .015)), m) * expdec(m, .03) * .5
        fl = bp(white(m, r), 900, 4500) * expdec(m, .09) * slow_noise(m, r, 40, .2, 1) * flutter * .6
        y = (whap * snap + thud + fl) * .8
        at(x, pan(y, pan_ + .15 * (k % 2 * 2 - 1) * (n_ > 1)), gap * k, 1.0 - .3 * k / max(1, n_))
    return x, 0.0

def f_thud(r, f=110, tau=0.12, n_=1, gap=0.1, spark=0.0, dur=0.4, wood=0.5):
    n = N(dur + gap * n_); x = np.zeros((2, n))
    for k in range(n_):
        m = N(dur)
        y = np.sin(phase_of(f * (1 + .6 * np.exp(-tax(m) / .02)))) * expdec(m, tau) * attack(m, .001)
        y += wood * reson(white(m, r) * expdec(m, .006), f * 5, 8) * 2
        y += .15 * lp(white(m, r), 1200) * expdec(m, .02)
        at(x, pan(y, .1 * k), gap * k, 1 - .2 * k)
        if spark: at(x, pan(sparkle_bell(r.uniform(3500, 6000), .5, r, .18), r.uniform(-.5, .5)), gap * k + .01, spark * .5)
    return x, 0.0

def f_riser(r, dur=1.0, f_lo=200, f_hi=6000, tone=0.0, wet=0.2, sub=0.0, shim=0.0, pan_w=0.3, end_pop=0.0):
    n = N(dur); t = tax(n)
    nz = pink(n, r) * .5 + white(n, r) * .5
    fc = lambda tt: f_lo * (f_hi / f_lo) ** np.clip(tt / dur, 0, 1) ** 1.6
    y = stft_shape(nz, bandsweep(fc, 0.8)) * (t / dur) ** 2.2
    if tone:
        f = f_lo * (f_hi / f_lo) ** ((t / dur) ** 1.4) * .5
        y += tone * .3 * (sine(f, n) + .3 * sine(2 * f, n)) * (t / dur) ** 2
    if sub: y += sub * lp(brown(n, r), 180) * (t / dur) ** 1.5 * 3
    x = pan_dyn(y, np.sin(t * 9) * pan_w)
    if shim:
        s = np.zeros((2, n + N(.5)))
        for k in range(int(dur * 30)):
            tt = dur * r.uniform(.2, 1) ** .7
            at(s, pan(sparkle_bell(r.uniform(3000, 10000), .25, r, .06), r.uniform(-1, 1)), tt, .12 * (tt / dur))
        x = fit(x, s.shape[1]) + shim * s
    if end_pop:
        x = fit(x, n + N(.3)); x[:, N(dur):] += 0
    if wet: x = verb(x, IR_hall(), wet)
    return x, dur

def f_crowd(r, dur=3.0, count=30, mode='swell', horn=False, wet=0.3, rate=4.5, bright=1.0, hit=None, spread=1.0):
    n = N(dur)
    if mode == 'swell': e = env(n, [(0, .05), (dur * .7, 1), (dur, .8)])
    elif mode == 'roar': e = env(n, [(0, 0), (.1, 1), (dur * .5, .8), (dur, 0)])
    else: e = np.ones(n) * .6
    ex = np.clip(e, 0, 1)
    v = crowd_voices(dur, r, count, rate=rate, excite=ex, spread=spread)
    ro = roar_layer(n, r, e * .7, bright=bright)
    y = v * e * 1.0 + pan(ro, 0) * .4 + pan(hp(ro, 1500), .3) * .25
    if horn:
        h = _air_horn(min(dur, .9), r); y = y + at(np.zeros((2, n)), pan(h, 0), 0.05, .35)
    y = verb(y, IR_stadium(), wet)
    return y, hit if hit is not None else dur * .35

def f_ticks(r, dur=1.0, rate=8, f=2400, accel=0.0, wood=False, lvl=1.0):
    n = N(dur); x = np.zeros((2, n)); t = 0.0; k = 0
    while t < dur - .02:
        m = N(.03)
        c = click(m, r, f * (1 + .05 * (k % 2)), 8, .006) * .6
        if wood: c += .5 * sine(f * .4, m) * expdec(m, .004)
        at(x, pan(c, .05 * (k % 3 - 1)), t, lvl)
        t += 1.0 / (rate * (1 + accel * t / dur)); k += 1
    return verb(x, make_ir(.4, .003, seed=8), .12), 0.0

def f_punch(r, low=95, wet=0.15, crowd=0.0, cage=0.0, dur=0.7, heavy=1.0):
    n = N(dur)
    y = thump(dur, low, 42, .11, 0) * 1.2 * heavy
    y += .8 * lp(white(n, r), 900) * expdec(n, .05) * attack(n, .0006) * 2.0
    y += .5 * bp(white(n, r), 1200, 5000) * expdec(n, .012) * attack(n, .0003) * 2
    x = pan(y, 0)
    if cage:
        cg = np.zeros(n)
        t = tax(n)
        for f_ in (620, 1350, 2100, 3300): cg += np.sin(2*np.pi*f_*(1+r.uniform(-.02, .02))*t) * np.exp(-t / .25) * .05
        cg += bp(white(n, r), 3000, 9000) * expdec(n, .1) * slow_noise(n, r, 60, .2, 1) * .3
        x = x + cage * pan(cg, .1)
    if crowd:
        cv = crowd_voices(dur, r, 10, excite=env(n, [(0, 0), (.1, 1), (dur, 0)])) * env(n, [(0, 0), (.08, 1), (dur * .9, 0)])
        x = x + crowd * .5 * cv
    return verb(x, IR_room(), wet), 0.002

def f_glass(r, dur=1.6, bright=1.0, wet=.25, rise=True):
    n = N(dur); x = np.zeros((2, n)); t = tax(n)
    imp = hp(white(n, r), 2500) * expdec(n, .006) * attack(n, .0002) * 2 + thump(dur, 200, 80, .04) * .6 * expdec(n, .05)
    x += pan(imp, 0)
    for k in range(70):
        tt = -np.log(1 - r.uniform() * .96) * .28 + .003
        f = r.uniform(2500, 11000) if bright else r.uniform(1500, 6000)
        a = sparkle_bell(f, .35, r, r.uniform(.03, .12))
        at(x, pan(a, r.uniform(-1, 1)), tt, r.uniform(.15, .6) * (1 - tt / 1.2))
        # shard tinkle
        if k % 3 == 0:
            at(x, pan(click(N(.02), r, r.uniform(4000, 9000), 10, .004), r.uniform(-1, 1)), tt + .002, .5)
    return verb(x, IR_room(), wet), 0.0

def f_tape_stop(r, dur=1.0, wet=.12, rate=5.0, tick=False):
    n = N(dur); t = tax(n)
    src = np.zeros(n)
    for f, a in ((220, 1), (330, .6), (440, .5), (660, .3), (880, .2)): src += a * saw(np.full(n, f))
    src = lp(src, 2500)
    # pitch fall by resample
    speed = np.exp(-t * rate)
    pos = np.cumsum(speed); y = resample_curve(src, pos % (n - 1) if False else np.minimum(pos, n - 1)) * np.exp(-t * 2.2)
    nz = lp(pink(n, r), 3000) * np.exp(-t * 6) * .5
    y = (y + nz) * attack(n, .002)
    x = pan(y, 0)
    if tick:
        at(x, pan(click(N(.03), r, 6500, 10, .004) * .8 + sparkle_bell(5200, .03, r, .05) * .3, .2), dur - .04, 1)
    return verb(x, IR_room(), wet), 0.0

def f_power(r, kind='down', dur=1.0, f0=1800, f1=60):
    n = N(dur); t = tax(n)
    if kind == 'down':
        f = f1 + (f0 - f1) * np.exp(-t / (dur * .28)); y = np.sin(phase_of(f)) + .4 * saw(f * .5) + .3 * sine(f * 2)
        y = y * np.exp(-t / (dur * .5)) * attack(n, .003) + .3 * lp(white(n, r), 800) * expdec(n, .25)
        y = lp(y, 4000)
        hit = 0.0
    else:
        f = f1 + (f0 - f1) * (1 - np.exp(-t / (dur * .2))); y = np.sin(phase_of(f)) + .35 * saw(f)
        y = y * attack(n, .004) * np.exp(-t / dur)
        hit = 0.0
    return verb(pan(y * .7, 0), IR_room(), .15), hit

def f_seagull(r, count=2):
    n = N(1.6); x = np.zeros((2, n))
    for k in range(count):
        m = N(.42); t = tax(m)
        f0 = r.uniform(1900, 2400)
        f = f0 * (1.0 + .35 * np.sin(np.pi * np.clip(t / .42, 0, 1) * .9) - .25 * t / .42 + .03 * np.sin(2*np.pi*38*t))
        src = sat(sine(f, m) + .6 * sine(2 * f, m) + .35 * sine(3 * f, m), 1.8)
        y = (reson(src, 2200, 3) + .6 * reson(src, 4300, 4)) * env(m, [(0, 0), (.04, 1), (.28, .8), (.42, 0)])
        y += .1 * bp(white(m, r), 2500, 6000) * env(m, [(0, 0), (.04, 1), (.42, 0)])
        at(x, pan(y, -.3 + .2 * k), .55 * k, 1 - .2 * k)
    return verb(lp(x, 7000), IR_stadium(), .55), 0.0

def f_horn_car(r, dur=1.4, pass_at=.6, f0=95, pan_from=-.9, pan_to=.9):
    n = N(dur); t = tax(n)
    dop = 1.22 - .44 / (1 + np.exp(-(t - pass_at) * 9))
    f = f0 * dop * (1 + .05 * np.sin(2 * np.pi * 3 * t))
    y = sum(saw(f * h) / h for h in (1, 2, 3, 4)) + .3 * white(n, r)
    y = lp(y, 2200) * .5
    a = np.exp(-((t - pass_at) / .38) ** 2) * (1 - .2 * np.abs(t - pass_at))
    tyre = bp(white(n, r), 2500, 6500) * np.exp(-((t - pass_at - .1) / .12) ** 2) * .5
    pc = np.interp(t, [0, dur], [pan_from, pan_to])
    return pan_dyn((y * a * 1.4 + tyre), pc), pass_at

def f_engine(r): return f_horn_car(r, 1.4, .6)

def f_steps(r, dur=1.0, rate=7.0):
    n = N(dur); x = np.zeros((2, n)); t = 0.0; k = 0
    while t < dur - .05:
        m = N(.08)
        s = lp(white(m, r), 1800) * expdec(m, .018) * attack(m, .0008) * 1.5 + sine(140, m) * expdec(m, .03) * .4
        s += .4 * hp(white(m, r), 4000) * expdec(m, .006)
        at(x, pan(s, -.2 + .4 * (k % 2)), t, 1.0 - .2 * (k % 2)); t += 1 / rate; k += 1
    w = f_whoosh(r, dur, dur * .5, 400, 2500, 1.2, -.3, .3)[0] * .3
    x = x + fit(w, n)
    return verb(x, IR_room(), .15), 0.0

def f_cloth(r, dur=0.9):
    n = N(dur); t = tax(n)
    e = env(n, [(0, 0), (.06, 1), (dur * .5, .5), (dur, 0)])
    y = bp(white(n, r), 500, 4500) * e * slow_noise(n, r, 22, .1, 1) * 2
    y += lp(white(n, r), 300) * expdec(n, .1) * attack(n, .002) * .6
    pc = np.interp(t, [0, dur], [-.7, .1])
    return pan_dyn(y, pc), .06

def f_curtain(r, dur=1.1):
    y, h = f_whoosh(r, dur, .45, 200, 2600, 1.4, .6, -.6, sub=.4)
    n = y.shape[1]
    fab = bp(white(n, r), 300, 3000) * slow_noise(n, r, 12, .3, 1) * env(n, [(0, 0), (.4, 1), (dur, 0)]) * .7
    return y + pan(fab, 0), h

def f_choir_swell(r, dur=2.0, f=440, chord=(1, 1.25, 1.5, 2), wet=.5, bright=1.0, shimmer=True, peak=None):
    n = N(dur); t = tax(n); y = np.zeros((2, n))
    e = env(n, [(0, 0), (peak or dur * .75, 1), (dur, 0)]) ** 1.5
    for i, c in enumerate(chord):
        for det in (-.004, 0, .005):
            s = saw(np.full(n, f * c * (1 + det)) * (1 + .003 * np.sin(2*np.pi*5.5*t + i)))
            y += pan(lp(s, 1500 + 3000 * bright) * .12 * e, (i - 1.5) * .35)
    ch = formant(pink(n, r), 'a', 1.2) * .2 * e
    y += pan(ch, 0)
    if shimmer:
        for k in range(16): at(y, pan(sparkle_bell(r.uniform(3000, 8000), .8, r, .3), r.uniform(-1, 1)), (peak or dur * .75) * r.uniform(.6, 1.1), .18)
    return verb(y, IR_huge(), wet), peak or dur * .75

def f_stinger_notes(r, notes=(660, 990), step=.12, dur=.7, wave='saw', wet=.25):
    n = N(dur + step * len(notes)); x = np.zeros((2, n))
    for i, f in enumerate(notes):
        m = N(dur)
        w = 0.5 * saw(np.full(m, f)) + .5 * square(np.full(m, f * 1.005), duty=.4)
        w = lp(w, 4500) * env(m, [(0, 0), (.006, 1), (.1, .55), (dur, 0)])
        w += .4 * sine(f * 2, m) * expdec(m, .1)
        at(x, pan(w * .5, -.1 + .2 * i), step * i, 1.0)
    return verb(x, IR_hall(), wet), 0.0

def f_orch(r, dur=1.6, f=196, tim=1.0, rise=False, wet=.5, size=1.0):
    """soap-opera sting: brass chord + timpani + string stab"""
    n = N(dur); t = tax(n); x = np.zeros((2, n))
    tf = 90 * (1 + .5 * np.exp(-t / .03))
    tp = np.sin(phase_of(tf)) * expdec(n, .35 * size) * attack(n, .001) + .3 * lp(white(n, r), 700) * expdec(n, .06)
    x += pan(tp * tim, 0)
    for i, c in enumerate((1, 1.189, 1.498, 2, 2.378)):
        fr = f * c
        s = saw(np.full(n, fr) * (1 + .004 * np.sin(2*np.pi*5.5*t + i)))
        s = (lp(s, 900) * (1 - np.clip(t / .12, 0, 1)) + lp(s, 3800) * np.clip(t / .12, 0, 1)) * env(n, [(0, 0), (.012, 1), (.25, .7), (dur * .6, .35), (dur, 0)])
        x += pan(s * .13, -.6 + .3 * i)
        s2 = saw(np.full(n, fr * 2 * 1.003)); s2 = lp(s2, 5000) * env(n, [(0, 0), (.03, .8), (.2, .3), (dur, 0)]) * (1 if rise else .6)
        x += pan(s2 * .06, .6 - .3 * i)
    return verb(x, IR_hall(), wet), 0.0

def f_sigh(r, dur=1.0):
    n = N(dur); t = tax(n)
    f0 = 240 * (1 - .28 * t / dur)
    src = glottal(f0, n, r, breath=.4, tilt=1400) if 'glottal' in globals() else saw(f0)
    y = formant(src, 'a', 1.05) * .5 + formant(src, 'o', 1) * .3
    br = bp(white(n, r), 800, 3500) * .25
    e = env(n, [(0, 0), (.18, 1), (dur * .6, .5), (dur, 0)])
    return verb(pan((y + br) * e, -.1), IR_room(), .1), 0.2

def f_voice(r, dur=1.0, vowel='o', f0=200, count=3, rise=True, laugh=False, wet=.2):
    n = N(dur)
    if laugh:
        e = np.zeros(n); k = 0; t0 = .05
        while t0 < dur - .12:
            m = N(.09); e[N(t0):N(t0) + m] += np.hanning(m)[:n - N(t0)][:m] * (1 - .35 * k / 8)
            t0 += .14; k += 1
        ex = e
    else:
        ex = env(n, [(0, 0), (dur * .45, 1), (dur, 0)])
    y = crowd_voices(dur, r, count, f0_range=(f0 * .6, f0 * .8), rate=3.0, vowels=vowel if isinstance(vowel, str) else 'ao',
                     excite=ex, spread=.6, dist_lp=(4500, 7000), breath=.05) * ex * 1.5
    return verb(y, IR_room(), wet), dur * .3

def f_spot(r, dur=1.0):
    n = N(dur); t = tax(n)
    th = thump(dur, 70, 45, .2, .2, r)
    hum = sine(np.full(n, 100), n) * .25 * env(n, [(0, 0), (.05, 1), (dur, .4)]) + sine(np.full(n, 200), n) * .1 * expdec(n, .6)
    zap = hp(white(n, r), 4000) * expdec(n, .015) * .5
    return verb(pan(th * .9 + hum + zap, 0), IR_hall(), .35), 0.0

def f_tv_on(r, dur=1.4):
    n = N(dur); t = tax(n)
    zap = sine(5000 * np.exp(-t / .06) + 800, n) * expdec(n, .12) * .6 + hp(white(n, r), 3000) * expdec(n, .08) * .5
    hum = (sine(np.full(n, 15734), n) * .05 + sine(np.full(n, 120), n) * .2) * env(n, [(0, 0), (.05, 1), (dur, 0)])
    th = thump(dur, 80, 40, .18, .1, r) * .8 * np.roll(np.ones(n), 0)
    y = zap + hum + np.concatenate([np.zeros(N(.06)), th])[:n]
    return verb(pan(y, 0), IR_room(), .2), 0.0

def f_swirl(r, dur=2.0, base=(200, 1800), ui=True):
    n = N(dur); t = tax(n)
    nz = pink(n, r); fc = lambda tt: base[0] * (base[1] / base[0]) ** (.5 + .5 * np.sin(tt * 9))
    y = stft_shape(nz, bandsweep(fc, .8)) * env(n, [(0, 0), (.25, 1), (dur - .4, .8), (dur, 0)])
    x = pan_dyn(y, np.sin(t * 7))
    if ui:
        for k in range(int(dur * 8)):
            tt = r.uniform(.1, dur - .2)
            at(x, pan(sparkle_bell(r.uniform(1200, 4500), .2, r, .05), np.sin(tt * 7 + 1)), tt, .35)
    return x, 0.0

def f_keys(r, count=8, dur=0.9, lvl=1.0):
    n = N(dur); x = np.zeros((2, n))
    for k in range(count):
        m = N(.05)
        c = click(m, r, r.uniform(1800, 3200), 6, .007) * .8 + sine(r.uniform(180, 260), m) * expdec(m, .012) * .4
        at(x, pan(c, r.uniform(-.2, .2)), k * dur / (count + 1) + r.uniform(0, .05), lvl * r.uniform(.6, 1))
    return verb(x, IR_room(), .1), 0.0

def f_click(r, f=2600, thunk=.5, tail=False):
    n = N(.15)
    c = click(n, r, f, 8, .01) * .9 + thunk * sine(np.full(n, 150) * (1 + .5 * np.exp(-tax(n) / .01)), n) * expdec(n, .022)
    c += .35 * hp(white(n, r), 5000) * expdec(n, .002)
    return verb(pan(c, 0), IR_room(), .08), 0.0

def f_buzz(r, f=180, dur=.35):
    n = N(dur); t = tax(n)
    y = square(np.full(n, f), duty=.5) * .4 + saw(np.full(n, f * 1.01)) * .3
    y = lp(y, 2400) * env(n, [(0, 0), (.005, 1), (dur * .85, 1), (dur, 0)]) * (.85 + .15 * np.sin(2 * np.pi * 45 * t))
    return verb(pan(y, 0), IR_room(), .08), 0.0

def f_bloop(r, dur=.6):
    n = N(dur); t = tax(n); x = np.zeros(n)
    for i, (t0, f) in enumerate(((0, 300), (.2, 450), (.4, 350))):
        m = N(.16); tt = tax(m)
        b = np.sin(phase_of(f * (1 + 1.4 * tt / .16) * np.ones(m))) * expdec(m, .05) * attack(m, .003)
        x[N(t0):N(t0) + m] += b[:n - N(t0)][:m]
    return verb(pan(x, 0), IR_room(), .1), 0.0

def f_jingle(r):
    y = f_stinger_notes(r, (784, 988, 1175, 988, 1319), .07, .18, wet=.05)[0]
    y = hp(y, 500); y = bp(y, 500, 4200) * 1.5
    return y, 0.0

def f_pluck(r, f=880, dur=1.0):
    n = N(dur); t = tax(n)
    y = (sine(np.full(n, f), n) + .5 * sine(np.full(n, f * 2), n) * np.exp(-t / .05) + .2 * sine(np.full(n, f * 3), n) * np.exp(-t / .03)) * expdec(n, .12) * attack(n, .001)
    y += .2 * click(n, r, f * 3, 5, .004)
    return verb(pan(y * .8, 0), IR_hall(), .35), 0.0

def f_clunk(r, dur=.8):
    n = N(dur); x = np.zeros((2, n))
    for t0, g in ((0, 1), (.13, .5), (.22, .28), (.29, .12)):
        m = N(.15)
        y = (sine(np.full(m, 220 * (1 + .3 * np.exp(-tax(m) / .01))), m) * expdec(m, .04) + reson(white(m, r) * expdec(m, .004), 1400, 6) * 3) * g
        at(x, pan(y, -.2), t0, 1)
    return verb(x, IR_room(), .12), 0.0

def f_squish(r, dur=.7):
    n = N(dur); t = tax(n)
    thud = thump(.3, 100, 45, .09, .4, r); x = np.zeros((2, n)); at(x, pan(thud, 0), 0, 1)
    f = 500 + 900 * np.sin(np.pi * np.clip((t - .08) / .3, 0, 1)); sq = sine(f, n) * env(n, [(0, 0), (.08, 0), (.1, .6), (.38, 0), (dur, 0)])
    at(x, pan(sq * .4, .2), 0, 1)
    at(x, pan(sparkle_bell(1760, .6, r, .3), .3), .32, .5)
    return verb(x, IR_room(), .1), 0.0

def f_grow(r, dur=1.4, f0=90, wet=.3):
    n = N(dur); t = tax(n)
    y = sine(f0 * (1 + t / dur), n) * env(n, [(0, 0), (dur * .8, 1), (dur, 0)]) + .5 * lp(brown(n, r), 300) * env(n, [(0, 0), (dur * .8, 1), (dur, 0)]) * 3
    return verb(pan(y * .8, 0), IR_hall(), wet), dur * .8

def f_lag(r, dur=.8):
    n = N(dur); x = np.zeros((2, n))
    k = 0; t = 0
    while t < dur - .05:
        m = N(.03); c = square(np.full(m, float(r.choice([440, 660, 330]))), duty=.5) * expdec(m, .01) * .5 + click(m, r, 3500, 5, .004) * .5
        at(x, pan(bitcrush(c, 5, 2), .1), t, 1); t += r.choice([.1, .16, .09, .21]); k += 1
    return x, 0.0

def f_glitch(r, dur=.8):
    n = N(dur); x = np.zeros((2, n)); t = tax(n)
    bc = bitcrush(hp(white(n, r), 800) * expdec(n, .12) * attack(n, .0008), 4, 6) * 1.0
    x += pan(bc, 0)
    sw = f_whoosh(r, dur, .15, 600, 9000, .7, -.8, .8)[0] * .6
    x = x + fit(sw, n)
    for k in range(20): at(x, pan(click(N(.02), r, r.uniform(2500, 9000), 8, .003), r.uniform(-1, 1)), r.uniform(0, .5) ** 1.5 * .8, .35)
    return x, 0.0

def f_shooting_star(r, dur=1.4):
    notes = [1046.5 * 2 ** (i / 12) for i in (0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24)]
    x, _ = f_arp(r, notes, .06, .28, wet=.4, pan_lr=(-.6, .8))
    w = f_whoosh(r, .9, .35, 2500, 9000, .6, -.6, .8)[0] * .4
    return cat(x, w), 0.0

def f_tile_swirl(r):
    notes = [660 * 2 ** (i / 12) for i in (0, 4, 7, 12, 16, 19, 24, 28, 31)]
    x, _ = f_arp(r, notes, .075, .22, wet=.4, pan_lr=(.6, -.4))
    return x, 0.0

def f_ticker(r, up=True):
    y, h = f_whoosh(r, .35, .25, 700, 6000, .8, -.2, .2, shim=.3)
    c = f_click(r, 3200)[0]
    x = cat(y, np.concatenate([np.zeros((2, N(.26))), c], axis=1)) if up else y
    return x, .26

def f_ding(r, f=1568, dur=1.2, wet=.3):
    n = N(dur)
    b = bell(f, dur, r, decay=.5)
    return verb(pan(b * .7, 0), IR_hall(), wet), 0.0

def f_shine(r, dur=.8):
    y, h = f_whoosh(r, dur, .4, 3000, 12000, .6, -.7, .7, shim=.6)
    return y * .7, h

def f_drumroll(r, dur=1.6, rise=True):
    n = N(dur); x = np.zeros((2, n)); t = 0.0; k = 0
    while t < dur:
        m = N(.1); g = (.3 + .7 * t / dur) if rise else .8
        s = (lp(white(n=m, r=r), 2500) * expdec(m, .025) * attack(m, .0005) * 1.6 + sine(np.full(m, 180), m) * expdec(m, .03) * .5)
        at(x, pan(s * g, -.15 + .3 * (k % 2)), t, 1); t += .05 / (1 + t / dur * .5); k += 1
    return verb(x, IR_hall(), .25), dur

def f_race(r): return f_horn_car(r, 1.3, .55, 110)

def f_ball_zip(r, dur=.5, pf=-.6, pt=.6): return f_whoosh(r, dur, dur * .45, 900, 7000, .5, pf, pt, tone=.4)

def f_rim(r, dur=1.2):
    n = N(dur); t = tax(n); x = np.zeros((2, n))
    thud = thump(.4, 130, 60, .1, .5, r)
    at(x, pan(thud, -.2), 0, .9)
    for f, d in ((880, .35), (1320, .22), (2100, .15), (3330, .1)):
        at(x, pan(np.sin(2*np.pi*f*(1+r.uniform(-.01,.01))*tax(N(.6))) * expdec(N(.6), d) * .3, -.1), 0, 1)
    for k in range(4): at(x, pan(click(N(.02), r, r.uniform(1500, 3000), 8, .004), 0), .1 + k * .06, .5 / (k + 1))
    sw = bp(white(N(.35), r), 3000, 9000) * env(N(.35), [(0, 0), (.02, 1), (.35, 0)]) * .35
    at(x, pan(sw, -.1), .32, 1)
    return verb(x, IR_room(), .2), 0.0

def f_kick(r, wet=.1, snap=1.0):
    n = N(.7)
    y = thump(.7, 140, 60, .06, .0, r) * .9 + lp(white(n, r), 1600) * expdec(n, .02) * attack(n, .0004) * 1.6
    y += snap * .6 * hp(white(n, r), 3000) * expdec(n, .005)
    y += .2 * bp(white(n, r), 1200, 6000) * env(n, [(0, 0), (.08, 1), (.35, 0)])
    return verb(pan(y, 0), IR_stadium(), wet), 0.003

def f_serve(r):
    n = N(.8)
    pop = reson(white(n, r) * expdec(n, .006) * attack(n, .0003), 1500, 4) * 5 + sine(np.full(n, 320) * (1 + .4 * np.exp(-tax(n) / .01)), n) * expdec(n, .03)
    x = pan(pop, 0)
    z = f_whoosh(r, .5, .15, 1500, 8000, .6, 0, .7)[0] * .5
    at(x, z, .01, 1)
    return verb(x, IR_stadium(), .1), 0.0

# ------------------------------------------------------- reuse of existing recordings
def _load_anim(fn, dur=None, gain=1.0):
    def f(r):
        x, sr = sf.read(os.path.join(ANIM, fn + '.wav'), always_2d=True); x = x.T
        assert sr == SR
        if dur: x = x[:, :N(dur)]
        return x * gain, HITS_ANIM.get(fn, 0.0)
    return f
HITS_ANIM = json.load(open(os.path.join(ANIM, 'hits.json')))

def f_goal_stinger(r):
    b, _ = f_boom(r, 60, 28, 1.2, .5, .7, metal=.3, mf=260, shim=.7, wet=.4, dur=2.6)
    er = _load_anim('stadium_goal_eruption', 5.0)(r)[0]
    x = cat(b * 1.2, np.concatenate([np.zeros((2, N(.15))), fade(er, .05, 1.5)], axis=1) * .8)
    hn = _air_horn(1.1, r); at(x, pan(hn, 0), .4, .25)
    return x, 0.003


def f_buzz_rise(r, dur=.9):
    n = N(dur); t = tax(n); f = 90 + 260 * (t / dur) ** 2
    y = (saw(f) * .5 + square(f * 1.01, duty=.3) * .3)
    y = lp(y, 1500 + 3000 * (t / dur).mean()) * (t / dur) ** 1.5 * (.7 + .3 * np.sin(2*np.pi*(40 + 40 * t / dur) * t))
    y += .3 * hp(white(n, r), 3500) * (t / dur) ** 3 * slow_noise(n, r, 50, .2, 1)
    return verb(pan(y * .6, 0), IR_room(), .1), dur
def f_ice(r, dur=.5):
    n = N(dur); x = np.zeros((2, n))
    for k in range(60):
        tt = (r.uniform() ** 1.6) * dur * .9
        at(x, pan(click(N(.03), r, r.uniform(3000, 11000), 12, .004) * r.uniform(.3, 1), r.uniform(-1, 1)), tt, 1)
    x += pan(hp(white(n, r), 6000) * expdec(n, .08) * .15 * slow_noise(n, r, 80, .3, 1), 0)
    return verb(x, IR_room(), .2), 0.0
def f_grunt_dive(r, dur=.8):
    y, h = f_whoosh(r, dur, .35, 300, 3500, 1.1, -.2, .8, sub=.3)
    n = y.shape[1]; g = formant(glottal(120, N(.18), r, breath=.3), 'o') * expdec(N(.18), .07) * .5
    at(y, pan(g, .3), .15, 1); return y, h
def f_kick_slowmo(r):
    k = f_kick(r, .15)[0]; th = thump(.9, 62, 32, .35, 0) * .7
    return cat(k, pan(th, 0)), 0.003
def f_air_horn(r, dur=.9):
    h = _air_horn(dur, r); return verb(pan(h, .3), IR_stadium(), .25), .02
def f_silent(r): return np.zeros((2, N(.11))), 0.0
def f_crowd_bed(r, dur=2.8):
    y, h = f_crowd(r, dur, 34, 'steady', wet=.4, rate=2.6, hit=0.0)
    y = lp(y, 2600) ; return y, 0.0
def f_confetti_bang(r):
    a = _load_anim('confetti_popper', 2.2)(r)[0]
    return a, HITS_ANIM.get('confetti_popper', 0.0)
def f_goal_hit(r):
    b = f_boom(r, 90, 45, .5, .4, .8, shim=1.0, wet=.35, dur=1.6, low_rumble=0)[0]
    ri = f_riser(r, .9, 500, 9000, tone=.5, shim=.6, wet=.2)[0]
    x = cat(b, np.concatenate([np.zeros((2, N(.05))), ri[:, :N(.9)]], axis=1) * .5); return x, .003
def f_crowd_eruption(r):
    er = _load_anim('stadium_goal_eruption', 3.2)(r)[0]
    ex = f_crowd(r, 3.0, 44, 'roar', wet=.35)[0]
    return cat(fade(er, .02, 1.0), ex * .7), .05

# ------------------------------------------------------- name table
W = f_whoosh
SPEC = {}
def S(names, fn, **kw):
    for nm in names.split():
        SPEC[nm] = (fn, kw)

# whooshes / transitions
S('whoosh_fast_push_in', W, dur=1.0, peak=.55, f_lo=250, f_hi=6500, pf=-.2, pt=.2, sub=.5, sharp=2.2)
S('whip_in_right', W, dur=.5, peak=.32, f_lo=400, f_hi=7000, pf=.9, pt=-.5, shim=.4, grit=.3)
S('whip_in_left', W, dur=.5, peak=.32, f_lo=400, f_hi=6500, pf=-.9, pt=.5, shim=.3)
S('whip_out whip_out_left', W, dur=.5, peak=.22, f_lo=500, f_hi=8000, pf=.4, pt=-.9, grit=.4)
S('whip_pan_1', W, dur=.55, peak=.3, f_lo=350, f_hi=6500, pf=.6, pt=-.9, grit=.5, sub=.2)
S('cut_whip_goal', W, dur=.5, peak=.25, f_lo=400, f_hi=6000, pf=-.5, pt=.5, sub=.4)
S('wipe_whoosh_blue', W, dur=.75, peak=.4, f_lo=500, f_hi=8000, pf=-.9, pt=.9, shim=.7, tone=.3)
S('wipe_whoosh_orange', W, dur=.7, peak=.35, f_lo=200, f_hi=4500, pf=-.9, pt=.9, grit=1.0, sub=.4)
S('ball_race_whoosh', f_ball_zip, dur=.6, pf=-.9, pt=.9)
S('ball_zip', f_ball_zip, dur=.5, pf=-.4, pt=.6)
S('ball_shot_whistle', f_ball_zip, dur=.45, pf=.1, pt=.7)
S('zoom_in_whoosh', W, dur=.7, peak=.55, f_lo=250, f_hi=6000, pf=-.1, pt=.1, tone=.8, sharp=2.5, sub=.3)
S('zoom_through', W, dur=.6, peak=.4, f_lo=300, f_hi=9000, pf=-.2, pt=.2, tone=1.0, shim=.4)
S('pullback_whoosh', f_riser, dur=1.0, f_lo=250, f_hi=5000, sub=.6, wet=.3, shim=.3)
S('push_through_rush', f_riser, dur=.9, f_lo=300, f_hi=8000, tone=.8, shim=.6, wet=.2)
S('push_in_riser', f_riser, dur=.9, f_lo=350, f_hi=8000, tone=1.0, shim=.4, wet=.3)
S('camera_glide_whoosh', W, dur=1.6, peak=1.0, f_lo=250, f_hi=4500, bw=1.2, pf=-.4, pt=.4, tone=.6, sub=.3, sharp=1.8, wet=.15)
S('wall_expand_whoosh', W, dur=.6, peak=.3, f_lo=350, f_hi=7000, shim=.5, pf=-.5, pt=.5, sub=.3)
S('suction_snap_whoosh', W, dur=1.0, peak=.85, f_lo=200, f_hi=7000, rev=False, shim=.5, tone=1.0, sub=.5, sharp=4)
S('tiles_burst_out', W, dur=.8, peak=.2, f_lo=800, f_hi=9000, shim=1.0, pf=-.5, pt=.7)
S('tiles_suck_in', W, dur=.8, peak=.6, f_lo=600, f_hi=8000, rev=True, shim=.4, sub=.4)
S('iris_burst iris_burst_whoosh', W, dur=.9, peak=.4, f_lo=500, f_hi=9000, tone=.7, shim=.9, wet=.25)
S('train_pass', W, dur=1.3, peak=.65, f_lo=200, f_hi=3000, bw=1.4, pf=-.9, pt=.9, sub=.6, sharp=1.6, wet=.05)
S('tile_flip_whoosh', W, dur=.7, peak=.35, f_lo=800, f_hi=6000, grit=1.0, shim=.3)
S('curtain_swish', f_curtain)
S('flag_unfurl', f_cloth)
S('shooting_star', f_shooting_star)
S('white_out_swell', f_choir_swell, dur=1.0, f=523, wet=.6, peak=.85)
S('silk_pad_swell', f_choir_swell, dur=2.0, f=392, chord=(1, 1.5, 2, 2.5), wet=.6, peak=1.0)
S('poster_expand', f_choir_swell, dur=1.3, f=330, wet=.5, peak=1.0)
S('power_on_riser', f_riser, dur=.75, f_lo=300, f_hi=6000, tone=1.0, shim=.5, wet=.1)
S('thumb_slide_in', f_cloth, dur=.5)
# impacts
S('flash_boom', f_boom, sub0=65, sub1=30, tau=1.0, body=.4, crack=.3, shim=1.0, wet=.4, dur=2.2, choir=.2)
S('netflix_slam', f_boom, sub0=60, sub1=28, tau=.9, body=.7, crack=.7, metal=1.0, mf=310, wet=.3, dur=2.4, grit=.3)
S('logo_slam', f_boom, sub0=65, sub1=30, tau=.7, body=.6, crack=.6, metal=.8, mf=420, shim=.5, wet=.3, dur=2.0)
S('headline_slam', f_boom, sub0=110, sub1=60, tau=.2, body=.5, crack=.6, metal=.3, mf=880, shim=.3, wet=.15, dur=.9, low_rumble=0)
S('anime_impact_don', f_boom, sub0=55, sub1=27, tau=.9, body=.9, crack=1.0, metal=.7, mf=380, wet=.25, dur=2.0, grit=.6)
S('charlton_slam', f_boom, sub0=50, sub1=26, tau=.9, body=.9, crack=.8, metal=1.2, mf=220, wet=.2, dur=2.2, grit=1.0)
S('charlton_lockup_hit', f_boom, sub0=55, sub1=25, tau=1.3, body=.8, crack=1.0, metal=1.2, mf=250, shim=.5, wet=.35, dur=2.8, grit=.6)
S('gold_burst_impact', f_boom, sub0=60, sub1=28, tau=1.1, body=.5, crack=.4, shim=1.0, choir=.9, wet=.5, dur=2.8, ir=None)
S('end_line_pop_sparkle', f_boom, sub0=80, sub1=38, tau=.6, body=.4, crack=.5, shim=1.2, wet=.4, dur=2.2, choir=.3)
S('frames_slam', f_thud, f=85, tau=.14, n_=3, gap=.11, wood=1.0, dur=.5)
S('beat_hit_zoom', f_boom, sub0=75, sub1=40, tau=.3, body=.3, crack=.2, wet=.15, dur=.9, low_rumble=.2)
S('goal_flash_stinger', f_goal_stinger)
S('dunk_rim_hit', f_rim)
S('boxing_punch_hit', f_punch, low=90, crowd=1.0, wet=.15)
S('mma_punch_hit', f_punch, low=80, cage=1.0, heavy=1.2)
S('cage_impact_prep', f_punch, low=130, cage=1.4, heavy=.3, dur=.7)
S('kick_impact striker_kick', f_kick)
S('tennis_serve_hit', f_serve)
S('logo_shine', f_shine, dur=.8)
S('glint_sweep', f_shine, dur=.9)
S('library_lights_shimmer', f_sparkle, dur=1.6, count=40, lo=1500, hi=8000, rise=True, dens='lin', wet=.4)
# glass etc
S('glass_shatter', f_glass)
S('glitch_wipe', f_glitch)
S('lag_flicker', f_lag)
S('tape_stop_freeze', f_tape_stop)
S('power_down', f_power, kind='down', dur=1.2, f0=2000, f1=55)
S('silence_gap_suck', f_whoosh, dur=.35, peak=.3, f_lo=300, f_hi=5000, rev=True, sub=.5)
S('power_charge', f_riser, dur=.4, f_lo=300, f_hi=3500, tone=1.2, wet=.05)
S('spotlight_thunk', f_spot)
S('tv_power_on', f_tv_on)
S('tv_static_flick', f_glitch, dur=.3)
# pops / blips
S('anchor_pop_in', f_pop, f0=300, f1=750, dur=.2, blip=.2, tau=.07)
S('anchor_wave_blip', f_blips, notes=(1568, 2093), step=.05, ndur=.1, d=.05, lvl=.6)
S('live_badge_pop', f_pop, f0=500, f1=1300, dur=.16, click=.4, blip=.5, blipf=2600, tau=.045)
S('live_badge_pops', f_arp, notes=[900 * 2 ** (i / 12) for i in (0, 2, 4, 5, 7, 9, 11, 12)], step=.09, d=.05, sp=True, harm=(1, .2), wet=.15, lvl=.8)
S('hero_badge_pop', f_pop, f0=350, f1=950, dur=.2, blip=.3, blipf=3000, tau=.07)
S('word_pop', f_pop, f0=400, f1=900, dur=.14, click=.15, tau=.045)
S('heart_pop', f_pop, f0=600, f1=1400, dur=.2, blip=.6, blipf=2200, tau=.06, pan_=.3)
S('heart_pop_beat', f_pop, f0=700, f1=1600, dur=.2, blip=.7, blipf=2500, tau=.06, pan_=.3)
S('heart_pop_beat2', f_pop, f0=800, f1=1700, dur=.16, blip=.6, blipf=2800, tau=.05, pan_=.3)
S('title_pop_ribbon', f_pop, f0=280, f1=700, dur=.22, blip=.4, blipf=2000, tau=.08)
S('cursor_appear', f_blips, notes=(1400, 2000), step=.045, ndur=.08, d=.04, lvl=.6)
S('cursor_click', f_click, f=2800, thunk=.3)
S('remote_ok_click', f_click, f=1800, thunk=1.0)
S('hard_cut_pop', f_whoosh, dur=.4, peak=.15, f_lo=1200, f_hi=9000, shim=1.0, pf=-.3, pt=.3)
S('tv_pop_in', f_pop, f0=200, f1=600, dur=.3, blip=.5, blipf=1568, tau=.12, body=1.2)
S('hero_pop_out', f_whoosh, dur=.6, peak=.2, f_lo=500, f_hi=8000, shim=.8, tone=.6)
S('today_marker_out', f_pop, f0=900, f1=350, dur=.1, click=.1, tau=.03)
S('cut_flash_tick', f_blips, notes=(2200, 3300), step=.03, ndur=.05, d=.02, lvl=.5)
S('eye_shine_ting', f_arp, notes=[2637, 3520, 4186], step=.04, d=.25, wet=.35)
S('tear_glint', f_arp, notes=[3136, 4186], step=.05, d=.35, wet=.4)
S('anime_flash', f_riser, dur=.18, f_lo=2000, f_hi=9000, wet=0.0)
S('label_slam', f_thud, f=150, tau=.05, wood=1.4, dur=.25, spark=.0)
S('ticker_slide', f_ticker)
S('ticker_settle', f_blips, notes=(1568, 2349), step=.05, ndur=.1, d=.05, lvl=.6)
S('scoreboard_slide', f_ticker, up=True)
S('news_stinger', f_stinger_notes, notes=(659, 988), step=.13, dur=.5)
S('news_match_blips', f_blips, notes=(2000, 2000, 1500), step=.09, ndur=.08, d=.03, lvl=.6, wave='square')
S('phone_ad_jingle_snip', f_jingle)
S('button_ripple_chime', f_arp, notes=[1046, 1319, 1568, 2093, 2637, 3136], step=.05, d=.5, wet=.5)
S('comic_freeze_sting', f_pluck, f=988, dur=1.0)
S('spinner_ghost_appear', f_bloop, dur=.6)
S('laptop_spinner_bloop', f_bloop, dur=.6)
S('tablet_error_buzz', f_buzz, f=170, dur=.32)
S('remote_button_mash', f_keys, count=10, dur=.8)
S('remote_drop_clunk', f_clunk)
S('thumbs_up_slam_squish', f_squish)
# sparkle / chimes
S('sparkle_shower', f_sparkle, dur=1.4, count=50, wet=.35)
S('sparkle_trail', f_sparkle, dur=1.2, count=26, lo=2500, hi=8000, rise=True, dens='lin', wet=.3)
S('twinkle_cluster', f_sparkle, dur=.8, count=12, lo=3000, hi=8000, dens='lin', gain=.7, wet=.4)
S('tile_swirl_shimmer', f_tile_swirl)
S('final_sparkle_tail', f_sparkle, dur=1.8, count=40, lo=2500, hi=9000, dens='decay', wet=.5, gain=.8)
S('disney_pop', f_arp, notes=[1047, 1319, 1568, 2093, 2637], step=.05, d=.6, wet=.5)
S('tile_wall_pops', f_sparkle, dur=.7, count=26, lo=500, hi=1800, dens='lin', wet=.1, d=.06, scale=False, gain=1.0)
S('tiles_pop_burst', f_sparkle, dur=.6, count=22, lo=700, hi=2200, rise=True, dens='lin', wet=.1, d=.05, gain=1.0)
# paper / wood
S('calendar_flip', f_flip, pitch=1.0)
S('poster_flip_1 poster_flip_2 poster_flip_3 poster_flip_4', f_flip, pitch=1.15, snap=1.2)
S('card_flip_cascade', f_flip, pitch=1.1, n_=10, gap=.07, dur=.25)
S('poster_thud', f_thud, f=105, tau=.1, spark=.6)
S('poster_thud_double', f_thud, f=110, tau=.1, n_=2, gap=.09, spark=.6)
S('poster_hops', f_thud, f=95, tau=.12, n_=4, gap=.11, wood=.3)
# misc
S('confetti_burst confetti_pop', _load_anim('confetti_popper', 2.2))
S('popcorn_burst_l popcorn_burst_r', _load_anim('popcorn_burst'))
S('net_hit', _load_anim('ball_net_swish'))
S('stadium_crowd_roar', f_crowd, dur=1.4, count=34, mode='roar', wet=.3, hit=.1)
S('goal_crowd_roar', f_crowd, dur=3.0, count=40, mode='roar', horn=True, wet=.4, hit=.1)
S('stadium_crowd_swell', f_crowd, dur=1.6, count=30, mode='swell', wet=.35, hit=1.0)
S('family_wow', f_voice, dur=1.1, vowel='o', f0=220, count=3)
S('cheer_laugh_family', f_voice, dur=1.4, vowel='ae', f0=230, count=4, laugh=True)
S('maya_sigh', f_sigh)
S('seagull_call', f_seagull)
S('soap_sting', f_orch, dur=1.8, f=196, tim=1.0, wet=.5)
S('soap_sting_2', f_orch, dur=1.0, f=185, tim=.8, wet=.4, size=.6)
S('soap_sting_3', f_orch, dur=1.4, f=175, tim=.6, rise=True, wet=.5)
S('spinner_tick_loop', f_ticks, dur=1.5, rate=3, f=2000, lvl=.6)
S('stopwatch_tick_fast', f_ticks, dur=1.6, rate=8, f=3500, accel=1.0, wood=False)
S('sprint_footsteps', f_steps)
S('race_car_pass', f_race)
S('app_tornado_swirl_start', f_swirl, dur=1.9)
S('orbit_swirl', f_swirl, dur=1.6, base=(500, 3500), ui=False)

S('stage_ambience_swell', f_choir_swell, dur=1.7, f=110, chord=(1, 1.5, 2), peak=1.5, wet=.5, bright=.2)
S('drumroll_start', f_drumroll, dur=1.3)
S('tv_bezel_buzz', f_buzz_rise, dur=.9)
S('buffer_blip', f_blips, notes=(900,), ndur=.1, d=.04, lvl=.5)
S('glitch_burst', f_glitch, dur=.18)
S('freeze_stall', f_tape_stop, dur=.2, rate=9.0, tick=True, wet=.05)
S('silence_cut', f_silent)
S('impact_boom', f_boom, sub0=52, sub1=22, tau=2.0, body=1.0, crack=1.0, metal=.7, mf=170, shim=.6, wet=.5, dur=4.0, grit=.6, choir=.15, low_rumble=.6, ir=None)
S('shockwave_whoosh', W, dur=.5, peak=.12, f_lo=200, f_hi=8000, bw=1.2, pf=-.4, pt=.4, sub=.7, grit=.3)
S('shockwave_ring', W, dur=.45, peak=.1, f_lo=250, f_hi=7000, bw=1.0, pf=-.3, pt=.3, sub=.5)
S('ice_crack_lines', f_ice)
S('dot_slam', f_boom, sub0=85, sub1=42, tau=.5, body=.7, crack=.3, wet=.2, dur=1.6, low_rumble=.1, metal=.2, mf=500)
S('anticipation_suck', W, dur=.6, peak=.4, f_lo=300, f_hi=5000, rev=True, sub=.3, shim=.2)
S('whip_zoom', W, dur=.5, peak=.32, f_lo=300, f_hi=9000, tone=1.0, pf=-.2, pt=.2, sub=.3)
S('settle_thud', f_thud, f=70, tau=.25, wood=.2, dur=.7)
S('crowd_tense_bed', f_crowd_bed)
S('boot_kick', f_kick_slowmo)
S('ball_whoosh_trail', W, dur=1.1, peak=.4, f_lo=250, f_hi=3200, bw=1.0, pf=-.3, pt=.9, tone=.3)
S('spinner_smash', f_pop, f0=1400, f1=2400, dur=.16, click=.8, blip=.5, blipf=4200, tau=.03, pan_=.1)
S('keeper_dive', f_grunt_dive)
S('net_swish', _load_anim('ball_net_swish'))
S('goal_flash_hit', f_goal_hit)
S('crowd_roar goal_crowd_roar_2', f_crowd_eruption)
S('confetti_cannon', f_confetti_bang)
S('goal_horn', f_air_horn)
S('goal_slide_slap', W, dur=.9, peak=.3, f_lo=200, f_hi=3500, grit=1.0, sub=.3, pf=-.5, pt=.5)
S('zoom_out_whoosh', W, dur=.9, peak=.4, f_lo=250, f_hi=5000, tone=.5, pf=-.1, pt=.1, sub=.3)
S('whip_right', W, dur=.5, peak=.28, f_lo=350, f_hi=7500, pf=-.9, pt=.9, grit=.4, shim=.2)

# ------------------------------------------------------- GOTV v2 additions
def f_logo_hit(r, dur=3.2):
    """warm full logo hit: sub + body + bell chord + rising shine + sparkle tail"""
    b, _ = f_boom(r, 62, 33, 1.3, .55, .45, metal=.5, mf=392, shim=.6, wet=.4, dur=dur, choir=.5, low_rumble=.25)
    x = b.copy()
    for i, f in enumerate((784, 1175, 1568, 2349, 3136)):       # G5 D6 G6 D7 G7 shimmer chord
        at(x, pan(sparkle_bell(f, 2.0, r, .9 - .1 * i), (i - 2) * .3), .01 + .025 * i, .16)
    sh, _ = f_whoosh(r, 1.1, .35, 2500, 12000, .6, -.8, .8, shim=.9)
    at(x, sh, 0.0, .5)
    sp, _ = f_sparkle(r, 2.0, 60, 3000, 11000, dens='decay', wet=.5, gain=.7)
    at(x, sp, .15, .6)
    return x, 0.003

def f_vortex(r, dur=1.4, peak=.9):
    """spiralling vortex: two counter-panned band sweeps + rising spiral tone + low suction, doppler swirl"""
    n = N(dur); t = tax(n)
    nz = pink(n, r); fc = lambda tt: 250 * (7000 / 250) ** np.clip(tt / peak, 0, 1) ** 1.4 * (1 + .25 * np.sin(tt * 26))
    y = stft_shape(nz, bandsweep(fc, .8))
    e = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) / .1))
    x = pan_dyn(y * e, np.sin(t * (10 + 25 * t / dur)) * .9)
    y2 = stft_shape(pink(n, r), bandsweep(lambda tt: 500 * (5000 / 500) ** np.clip(tt / peak, 0, 1) * (1 + .3 * np.cos(tt * 31)), 1.0)) * e
    x = x + pan_dyn(y2 * .5, -np.sin(t * (10 + 25 * t / dur)) * .9)
    tone = sine(300 * 2 ** (3 * np.clip(t / peak, 0, 1)) * (1 + .01 * np.sin(t * 40)), n) * e * .25
    x = x + pan(tone, 0) + pan(lp(brown(n, r), 200) * e * 2.0, 0)
    return verb(x, IR_hall(), .18), peak

def f_giant_slam(r, dur=3.4):
    b, _ = f_boom(r, 50, 24, 1.8, 1.0, 1.0, metal=.7, mf=175, shim=.35, wet=.45, dur=dur, grit=.7, low_rumble=.6)
    n = b.shape[1]
    deb = np.zeros((2, n))
    for k in range(45):
        tt = .04 + r.uniform() ** 1.7 * 1.6
        at(deb, pan(click(N(.03), r, r.uniform(800, 5000), 6, .006) * r.uniform(.2, 1), r.uniform(-1, 1)), tt, 1.0)
    rs = f_whoosh(r, .5, .06, 200, 9000, 1.3, -.5, .5, sub=.8)[0]
    return cat(b, deb * .35, rs * .5), 0.003

def f_ice_shards(r, dur=2.0):
    g, _ = f_glass(r, dur, 1.0, .3)
    n = g.shape[1]; x = g.copy()
    at(x, pan(thump(.5, 120, 45, .16, .3, r), 0), 0, .55)                     # low crack body
    for k in range(30):
        f = r.uniform(4000, 12000)
        at(x, pan(sparkle_bell(f, .5, r, .12), r.uniform(-1, 1)), .05 + r.uniform() ** 1.6 * 1.4, r.uniform(.1, .35))
    return x, 0.0

def f_endcard_swell(r, dur=2.7, peak=2.6):
    x, h = f_choir_swell(r, dur=dur, f=293.66, chord=(1, 1.26, 1.5, 2, 2.52), wet=.55, peak=peak)
    rs, _ = f_riser(r, peak, 400, 9000, tone=.8, sub=.5, shim=.7, wet=.15)
    return cat(x, rs * .5), peak

def f_shine_up(r, dur=1.0):
    y, h = f_whoosh(r, dur, .6, 1500, 12000, .6, -.6, .6, shim=1.0)
    ar, _ = f_arp(r, [1568 * 2 ** (i / 12) for i in (0, 4, 7, 12, 16, 19)], .05, .5, wet=.4)
    return cat(y * .7, ar * .6), .5

def f_heartbeat(r):
    n = N(.5); x = np.zeros(n)
    y = np.sin(phase_of(52 + 40 * np.exp(-tax(n) / .03))) * expdec(n, .09) * attack(n, .004) * 1.0 + .35 * lp(white(n, r), 300) * expdec(n, .05)
    return verb(pan(y, 0), IR_room(), .1), 0.0
def f_neon_on(r, dur=.9):
    n = N(dur); t = tax(n)
    gate = np.zeros(n)
    for a, b in ((0, .04), (.09, .13), (.2, .23), (.3, .9)): gate[N(a):N(b)] = 1
    hum = (sine(np.full(n, 100), n) * .5 + sine(np.full(n, 200), n) * .3 + sat(sine(np.full(n, 300), n), 3) * .2) * gate
    ign = bp(white(n, r), 2000, 9000) * (expdec(n, .006) + expdec(n, .006, .09) + expdec(n, .006, .2)) * 1.2
    y = hum * .5 * env(n, [(0, 1), (.3, 1), (dur, .5)]) + ign
    return verb(pan(y, .2), IR_room(), .15), 0.0
def f_rain(r, dur=3.0):
    n = N(dur); y = hp(pink(n, r), 800) * .5 + bp(white(n, r), 3000, 9000) * .5
    drops = np.zeros(n)
    for k in range(int(dur * 60)):
        i = r.integers(0, n - 300); L = 200; drops[i:i + L] += white(L, r) * np.exp(-np.arange(L) / 30) * r.uniform(.2, 1)
    y = y * slow_noise(n, r, 1.5, .7, 1) + hp(drops, 2500) * .6
    x = pan(y, 0) + pan(np.roll(y, 137), 0) * 0; x = np.vstack([y, np.roll(y, 211)])
    return fade(x, .4, .5), 0.0
def f_petals(r): 
    x, _ = f_sparkle(r, 1.6, 44, 3500, 10000, rise=True, dens='lin', wet=.5, gain=.7)
    y, _ = f_whoosh(r, .9, .25, 2000, 9000, .8, -.6, .6, shim=.6); return cat(x, y * .4), 0.0
def f_aura(r):
    x, h = f_riser(r, 1.2, 150, 4500, tone=1.2, sub=.7, shim=.3, wet=.05)
    g = sat(bp(white(x.shape[1], r), 500, 5000) * slow_noise(x.shape[1], r, 40, .2, 1) * (tax(x.shape[1]) / 1.2) ** 2 * 2, 3) * .2
    return x + pan(g, 0), h
def f_tiles_rush(r):
    y, h = f_vortex(r, 1.0, .85)
    th = f_thud(r, 90, .2, 4, .06, .0, .5, .3)[0] * .4
    return cat(y, np.concatenate([np.zeros((2, N(.5))), th], axis=1)), .85
S('heartbeat_thump', f_heartbeat)
S('neon_buzz_on', f_neon_on)
S('rain_bed', f_rain)
S('sakura_shimmer', f_petals)
S('aura_charge_rise', f_aura)
S('tiles_rush', f_tiles_rush)
S('wipe_whoosh_pink', f_whoosh, dur=.7, peak=.35, f_lo=500, f_hi=9000, pf=-.9, pt=.9, shim=.8, tone=.4)
S('chime_sparkle', f_arp, notes=[1319, 1568, 1976, 2349, 2637], step=.06, d=.5, wet=.5)

# ------------------------------------------------------- keyword fallback for unseen names (s4 etc.)
def auto(name, desc, r):
    s = (name + ' ' + desc).lower()
    def has(*k): return any(x in s for x in k)
    if has('logo_hit', 'logo_slam', 'logo_reveal', 'logo_lock', 'logo hit', 'endcard_hit', 'end_card_hit'): return f_logo_hit(r)
    if has('shine', 'logo') and not has('slam'): return f_shine_up(r)
    if has('vortex', 'portal', 'tunnel', 'spiral', 'swirl'): return f_vortex(r)
    if has('giant', '3d', 'impact_slam', 'mega'): return f_giant_slam(r)
    if has('shard', 'ice', 'shatter', 'glass') and not has('glass_shatter'): return f_ice_shards(r)
    if has('endcard', 'end_card', 'outro', 'card_swell'): return f_endcard_swell(r)
    if has('drumroll', 'drum roll', 'roll'): return f_drumroll(r, 1.6)
    if has('crowd', 'cheer', 'roar', 'audience'): return f_crowd(r, 2.5, 34, 'roar', wet=.35, hit=.1)
    if has('shatter', 'glass', 'ice', 'crack'): return f_glass(r)
    if has('freeze', 'stuck', 'stall', 'buffer'): return f_tape_stop(r)
    if has('boom', 'impact', 'slam', 'hit', 'stinger', 'sting', 'drop'): return f_boom(r, 65, 30, .9, .6, .6, metal=.5, mf=330, shim=.4, wet=.3, dur=2.2)
    if has('riser', 'build', 'swell', 'charge', 'rise'): return f_riser(r, 1.2, 250, 6000, tone=.8, sub=.4, shim=.4)
    if has('whoosh', 'swipe', 'whip', 'rush', 'zoom', 'sweep', 'swish', 'zip'): return f_whoosh(r, .6, .3, 400, 7000, .9, -.6, .6, shim=.3)
    if has('click', 'tap', 'press', 'button', 'key'): return f_click(r, 2400, .7)
    if has('tick', 'clock'): return f_ticks(r, 1.0, 6)
    if has('sparkle', 'twinkle', 'shimmer', 'glitter', 'chime', 'ding', 'magic', 'star'): return f_sparkle(r, 1.2, 28, wet=.35)
    if has('flip', 'page', 'card', 'paper'): return f_flip(r)
    if has('thud', 'thunk', 'clunk', 'bump', 'land'): return f_thud(r)
    if has('pop', 'blip', 'bloop', 'ui'): return f_pop(r, 450, 1100, .15, .3, .3)
    if has('power', 'tv'): return f_tv_on(r)
    return f_pop(r, 500, 1000, .2, .3, .3)

# ------------------------------------------------------- build
def build(name, desc='', outdir=OUTD):
    r = rr(name)
    if name in SPEC:
        fn, kw = SPEC[name]
        y, hit = fn(r, **kw)
    else:
        y, hit = auto(name, desc, r)
    y = st(np.nan_to_num(y))
    y = y - y.mean(axis=1, keepdims=True)
    pk = np.abs(y).max(); idx = np.nonzero(np.abs(y).max(axis=0) > pk * db(-52))[0]
    if len(idx): y = y[:, :min(y.shape[1], idx[-1] + N(.05))]
    y = fade(y, 0.0, min(.25, .12 * y.shape[1] / SR))
    y = hp(y, 25, 1)
    y = norm_peak(y, -1.0)
    os.makedirs(outdir, exist_ok=True)
    sf.write(os.path.join(outdir, name + '.wav'), y.T.astype(np.float32), SR, subtype='FLOAT')
    return float(hit), y.shape[1] / SR

def cue_names():
    d = {}
    for f in sorted(glob.glob(os.path.join(CUES, '*.json'))):
        for c in json.load(open(f)):
            if os.path.exists(os.path.join(PROMO_SFX, c['sound'] + '.wav')) or c['gain_db'] <= -90: continue
            d.setdefault(c['sound'], c.get('desc', ''))
    return d

def main():
    names = cue_names()
    only = sys.argv[1:]
    hp_path = os.path.join(OUTD, 'hits.json')
    hits = json.load(open(hp_path)) if os.path.exists(hp_path) else {}
    for nm, desc in names.items():
        if only and nm not in only: continue
        if not only and nm in hits and os.path.exists(os.path.join(OUTD, nm + '.wav')) and os.environ.get('SFX_FORCE') != '1' and False: continue
        try:
            h, d = build(nm, desc)
        except Exception as e:
            import traceback; traceback.print_exc(); print('FAILED', nm, e); continue
        hits[nm] = round(h, 4)
        tag = '' if nm in SPEC else '  [auto]'
        print(f'{nm:28s} {d:5.2f}s hit {h:.3f}{tag}')
    json.dump(hits, open(hp_path, 'w'), indent=1, sort_keys=True)

if __name__ == '__main__':
    main()
