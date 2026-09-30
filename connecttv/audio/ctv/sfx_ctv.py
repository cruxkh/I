#!/usr/bin/env python3
"""
ConnectTV "LIQUID POP" SFX.  python3 sfx_ctv.py [names]  -> audio/ctv/sfx/*.wav + hits.json

Same numpy toolkit as v6/v7 (physically modelled layers, resonators, convolution reverb) plus a liquid / glossy-gel
vocabulary: droplet bubbles (Minnaert-style rising sine), glossy pops, water splashes, liquid wipe whooshes,
shockwaves, glass shatter, bolt crack, vortex suck, sitar+tabla sting, real-harp day notes (VSCO samples).
Everything registers in sfx_v6.REG, so sfx_v6.build(name, root) works for the new names (pitched ones take a MIDI root).

  bolt_crack      neon bolt cracks the black screen (hit 0.0): arc crack + glass fracture + sub thump + hall
  gloss_pop(_b,_c) glossy candy pop, rounded (no metal), 3 sizes
  liquid_whoosh_a/b/c  liquid wipe: rushing air + bubble cloud + water body (peak = hit)
  liquid_flood    world floods in (hit 0.85): rising water rush -> big splash + sub
  splash_slam / splash_small  logo/poster slam with a water crown (hit 0.0)
  shockwave       expanding ring: sub sweep + rising/falling noise ring
  glass_shatter   glass shatter (screen tear / magnifier), hit 0.0
  cross_out       red X: two bolt slashes + slam (hit 0.26)
  vortex_suck     spiral suck into the TV (hit 1.15 = the gulp)
  logo_slam       END-CARD slam (hit 0.55): reverse suck + bolt + boom + splash + shockwave + glitter + hall
  harp_sparkle    real harp glissando (pitched, hit 0.0)
  day_note        one day of the week: real harp + violin spiccato note (pitched)  |  week_finale: chord + gliss
  bolly_sting     tabla + sitar flourish (pitched, hit 0.0)
  rise_whoosh     forward pickup whoosh, peak at its end (hit 0.9)
  glitter         sparkle dust (2 s)
  zap             small neon bolt zap
"""
import os, sys, re, glob, json
import numpy as np
import soundfile as sf
from scipy.signal import lfilter

sys.path.insert(0, '/home/user/I/gotv5/audio/v6')
sys.path.insert(0, '/home/user/I/anim/audio/tools')
sys.path.insert(0, '/home/user/I/connecttv/audio/v7')
import sfx_v6 as S6  # noqa: E402
import sfx_v7  # noqa: E402,F401   (thx_swell, projector, tur_dum, tear_drop for the holds)
from sfx_v6 import (SR, N, tax, white, pink, brown, lp, hp, bp, reson, peq, env, expdec, attack, fade, phase_of,  # noqa: E402
                    sine, saw, sat, pan, haas, st, add_at, reverb, mtof, IR_ROOM, IR_HALL, stft_shape, bandsweep, lpsweep,
                    slow_noise, _boom, pan_dyn)
from sfx import make_ir, electric_arc  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sfx')
VS = '/home/user/I/connecttv/audio/v7/samples/vsco'
NEW = []


def reg(name, hit, desc, pitched=False):
    NEW.append(name)
    return S6.reg(name, hit, desc, pitched)


def IR_BIG():
    return make_ir(rt60=2.6, predelay=0.02, hf=0.5, lf=1.2, er=14, er_span=0.09, bright=9000, seed=101)


def IR_CINEMA():
    return make_ir(rt60=3.4, predelay=0.03, hf=0.4, lf=1.3, er=16, er_span=0.12, bright=6000, seed=91)


# ---------------------------------------------------------------- primitives
def bubble(f0, dur, rise=25.0, tau=0.012):
    """droplet / Minnaert bubble: a sine whose pitch climbs while it decays"""
    n = N(dur)
    t = tax(n)
    return np.sin(phase_of(f0 * (1 + rise * np.minimum(t, 0.08)))) * np.exp(-t / tau) * attack(n, 0.0004)


def bubble_cloud(dur, r, dens, f_range=(500, 2600), amp=0.25, tau_range=(0.008, 0.025), rise_range=(10, 40)):
    """dens: array over the buffer (length N(dur)) giving relative bubble density; returns stereo"""
    n = N(dur)
    y = np.zeros((2, n))
    p = np.maximum(dens, 0)
    if p.sum() <= 0:
        return y
    cnt = int(dens.sum() / SR * 1.0 * 1.0)
    cdf = np.cumsum(p) / p.sum()
    for u in r.uniform(0, 1, cnt):
        i = int(np.searchsorted(cdf, u))
        b = bubble(r.uniform(*f_range), 0.09, r.uniform(*rise_range), r.uniform(*tau_range)) * r.uniform(0.3, 1.0)
        add_at(y, pan(b, r.uniform(-0.85, 0.85)), i / SR, amp)
    return y


def splash_noise(r, dur=1.2, hi=9000, lo=600, decay=0.22, size=1.0):
    n = N(dur)
    t = tax(n)
    nz = white(n, r) * 0.6 + pink(n, r) * 0.6
    y = stft_shape(nz, lpsweep(lambda tt: lo + hi * np.exp(-tt / decay), 12.0), nper=2048)
    y = y * env(n, [(0, 0), (0.004, 1.0), (0.09, 0.75), (0.3 * size + 0.05, 0.28), (dur, 0.0)])
    y = pan_dyn(y, np.interp(t, [0, dur], [-0.3, 0.3])) + haas(y * 0.4, 1.4)
    dens = np.exp(-t / (0.35 * size)) * attack(n, 0.05) * 90 * size
    bub = bubble_cloud(dur, r, dens, (700, 3600), 0.35)
    return y * 0.9 + bub


def _finish_room(y, wet=0.16, ir=None):
    return reverb(y, ir if ir is not None else IR_ROOM(), wet, tail=False)


# ---------------------------------------------------------------- reveals: bolt, pops
@reg('bolt_crack', 0.0, 'Neon bolt cracks the black screen: broadband crack, arc crackle, glass fracture, sub thump, hall. '
     'Hit 0.0 s. 1.9 s.')
def _(r):
    dur = 1.9
    n = N(dur)
    t = tax(n)
    crack = hp(white(n, r), 2500) * expdec(n, 0.0025) * attack(n, 0.0002) * 2.6
    crack += bp(white(n, r), 700, 6000) * expdec(n, 0.012) * 1.3
    arc = electric_arc(0.45, r, density=90, hum=180)
    arc = np.concatenate([arc, np.zeros(n - len(arc))]) * env(n, [(0, 1), (0.06, 0.8), (0.3, 0.25), (0.45, 0)]) * 0.45
    sub = np.sin(phase_of(38 + 90 * np.exp(-t / 0.05))) * np.exp(-t / 0.22) * attack(n, 0.001) * 1.1
    # glass fracture: sparse resonant shards racing across the frame (L -> R)
    gl = np.zeros((2, n))
    tt = np.sort(0.004 + np.abs(r.exponential(0.09, 34)))
    for k, tm in enumerate(tt):
        L = N(0.06)
        ex = white(L, r) * np.exp(-np.arange(L) / N(0.0025))
        s = reson(ex, r.uniform(2500, 9500), r.uniform(80, 400)) * 3.0
        add_at(gl, pan(s * r.uniform(0.25, 0.8), -0.8 + 1.6 * tm / (tt[-1] + 1e-6) + r.uniform(-0.2, 0.2)), tm)
    thud = lp(white(n, r), 260) * expdec(n, 0.05) * 0.6
    y = st(sat(sub + thud, 1.6)) + pan(crack + arc, 0.0) + gl * 0.7
    y = reverb(y, IR_BIG(), 0.28, tail=False)
    return y


def gloss(r, f0=430, size=1.0, dur=0.42):
    n = N(dur)
    t = tax(n)
    f = f0 * (1 + 2.1 * (1 - np.exp(-t / 0.011)))
    body = np.sin(phase_of(f)) * np.exp(-t / (0.045 * size)) * attack(n, 0.0005)
    h2 = np.sin(phase_of(f * 2.005)) * np.exp(-t / 0.018) * 0.28
    thump = np.sin(phase_of(55 + 110 * np.exp(-t / 0.025))) * np.exp(-t / 0.035) * 0.55 * size
    click = hp(white(n, r), 3500) * expdec(n, 0.0012) * 0.22
    y = body + h2 + thump + click
    # two tiny gel droplets after the pop
    y = st(y)
    for dt_, ff, g, p in ((0.055, f0 * 3.4, 0.22, -0.4), (0.105, f0 * 4.6, 0.14, 0.45)):
        add_at(y, pan(bubble(ff, 0.12, 14, 0.03), p), dt_, g)
    return _finish_room(y, 0.14)


@reg('gloss_pop', 0.0, 'Glossy candy pop: rounded pitch-rise bubble + soft thump + gel droplets, no metal. 0.42 s.')
def _(r):
    return gloss(r, 430, 1.0)


@reg('gloss_pop_b', 0.0, 'Glossy pop, higher / smaller. 0.4 s.')
def _(r):
    return gloss(r, 620, 0.7)


@reg('gloss_pop_c', 0.0, 'Glossy pop, low / big (a fat gel blob). 0.5 s.')
def _(r):
    return gloss(r, 300, 1.5, 0.5)


@reg('zap', 0.0, 'Small neon bolt zap: arc crackle burst + bright crack, 0.4 s.')
def _(r):
    n = N(0.4)
    a = electric_arc(0.4, r, density=120, hum=240)
    a = a * env(n, [(0, 1), (0.05, 0.9), (0.2, 0.3), (0.4, 0)])
    c = hp(white(n, r), 3000) * expdec(n, 0.003) * 1.8
    return _finish_room(pan(a * 0.9 + c, 0.1), 0.15)


# ---------------------------------------------------------------- liquid whooshes / flood / splash
def liquid(r, dur, peak, f_lo, f_hi, p0, p1, bub=0.5, body=0.4):
    y = S6._swoosh(r, dur, peak, f_lo, f_hi, p0, p1, body=body)
    n = y.shape[1]
    t = tax(n)
    dens = np.exp(-0.5 * ((t - peak) / (0.28 * peak + 0.06)) ** 2) * 160 * bub
    y = y + bubble_cloud(dur, r, dens, (450, 2400), 0.30)
    y = y + haas(lp(white(n, r), 600) * env(n, [(0, 0), (peak, 0.35), (dur, 0)]) * 0.10)     # wet low body
    return y


@reg('liquid_whoosh_a', 0.28, 'Liquid wipe L->R: rushing air + water body + bubble cloud, peak 0.28 s. 0.95 s.')
def _(r):
    return liquid(r, 0.95, 0.28, 300, 5200, -0.75, 0.75)


@reg('liquid_whoosh_b', 0.25, 'Liquid wipe R->L, darker. Peak 0.25 s. 0.9 s.')
def _(r):
    return liquid(r, 0.9, 0.25, 220, 4200, 0.75, -0.75, bub=0.6)


@reg('liquid_whoosh_c', 0.22, 'Liquid wipe upward, bright. Peak 0.22 s. 0.8 s.')
def _(r):
    return liquid(r, 0.8, 0.22, 380, 6500, -0.2, 0.25, bub=0.4, body=0.25)


@reg('rise_whoosh', 0.9, 'Forward pickup whoosh: rising airy swell (tonal-free) that peaks and stops at 0.9 s (= the next downbeat). 1.0 s.')
def _(r):
    dur = 1.0
    n = N(dur)
    t = tax(n)
    nz = pink(n, r) * 0.6 + white(n, r) * 0.4
    y = stft_shape(nz, bandsweep(lambda tt: 350 * 14 ** np.clip(tt / 0.9, 0, 1) ** 1.4, 0.85), nper=2048)
    y = y * (np.clip(t / 0.9, 0, 1) ** 2.4) * (1 - 0.35 * (0.5 + 0.5 * np.sin(2 * np.pi * (4 + 16 * (t / dur) ** 2) * t)) * (t / dur))
    y[t > 0.9] *= np.exp(-(t[t > 0.9] - 0.9) / 0.03)
    return _finish_room(pan_dyn(y, np.interp(t, [0, dur], [-0.5, 0.5])), 0.1)


@reg('liquid_flood', 0.85, 'The candy world floods in: rising water rush + bubbles, big splash + sub at 0.85 s. 2.6 s.')
def _(r):
    dur = 2.6
    n = N(dur)
    t = tax(n)
    nz = pink(n, r) * 0.7 + white(n, r) * 0.3
    rush = stft_shape(nz, bandsweep(lambda tt: 250 * 12 ** np.clip(tt / 0.85, 0, 1) ** 1.3, 1.0), nper=2048)
    rush = rush * env(n, [(0, 0), (0.85, 1.0), (0.93, 0.4), (1.5, 0.0), (dur, 0)]) * 0.9
    dens_pre = np.clip(t / 0.85, 0, 1) ** 2 * (t < 0.85) * 220
    bub = bubble_cloud(dur, r, dens_pre, (500, 2800), 0.28)
    sp = splash_noise(r, 1.7, 9500, 700, 0.3, 1.6)
    y = np.zeros((2, n))
    y += pan_dyn(rush, np.interp(t, [0, 0.85, dur], [-0.5, 0, 0.3]))
    y += bub
    add_at(y, sp, 0.85, 1.1)
    sub = np.sin(phase_of(30 + 70 * np.exp(-np.maximum(t - 0.85, 0) / 0.12))) * np.exp(-np.maximum(t - 0.85, 0) / 0.6) * (t >= 0.85)
    y += st(sat(sub * 1.2, 1.5)) * 0.8
    return reverb(y, IR_BIG(), 0.25, tail=False)


@reg('splash_slam', 0.0, 'Medium logo/poster slam with a water crown: boom_med + splash + shockwave hush. 2.6 s.')
def _(r):
    b = _boom(r, 0.62)
    n = max(b.shape[1], N(2.6))
    y = np.zeros((2, n))
    y[:, :b.shape[1]] += b
    add_at(y, splash_noise(r, 1.4, 9000, 700, 0.22, 1.1), 0.0, 0.55)
    return y


@reg('splash_small', 0.0, 'Small pop-in splash: stamp thud + splash droplets. 1.4 s.')
def _(r):
    b = _boom(r, 0.22)
    n = max(b.shape[1], N(1.4))
    y = np.zeros((2, n))
    y[:, :b.shape[1]] += b * 0.8
    add_at(y, splash_noise(r, 1.0, 8000, 900, 0.15, 0.7), 0.0, 0.5)
    return y


@reg('shockwave', 0.0, 'Shockwave ring: sub sweep + expanding rising/falling noise ring (whum-shhh), hit 0.0. 1.5 s.')
def _(r):
    n = N(1.5)
    t = tax(n)
    sub = np.sin(phase_of(30 + 70 * np.exp(-t / 0.09))) * np.exp(-t / 0.45) * attack(n, 0.002)
    ring = stft_shape(pink(n, r), bandsweep(lambda tt: 180 * 40 ** np.clip(tt / 0.6, 0, 1), 0.75), nper=2048)
    ring = ring * env(n, [(0, 0), (0.02, 1), (0.22, 0.6), (0.7, 0.18), (1.5, 0)]) * 0.8
    y = st(sat(sub * 1.3, 1.4) * 0.9) + pan_dyn(ring, np.interp(t, [0, 1.5], [-0.3, 0.3])) + haas(ring * 0.5, 1.0)
    return _finish_room(y, 0.2, IR_BIG())


@reg('glass_shatter', 0.0, 'Glass shatter: bright burst, 100+ resonant shards raining down, low glassy thud, room. Hit 0.0. 2.4 s.')
def _(r):
    dur = 2.4
    n = N(dur)
    t = tax(n)
    y = np.zeros((2, n))
    burst = bp(white(n, r), 2200, 11000) * expdec(n, 0.03) * attack(n, 0.0003) * 1.4
    y += pan(burst, 0.0)
    for tm in np.sort(0.005 + r.exponential(0.42, 130)):
        if tm > dur - 0.2:
            continue
        L = N(0.09)
        ex = white(L, r) * np.exp(-np.arange(L) / N(0.002))
        s = reson(ex, r.uniform(2200, 10500), r.uniform(60, 500)) * 3.2
        add_at(y, pan(s * r.uniform(0.15, 0.7) * np.exp(-tm / 0.8), r.uniform(-0.9, 0.9)), tm)
    thud = (np.sin(phase_of(150 * np.exp(-t / 0.05) + 60)) * np.exp(-t / 0.09) * 0.8 + lp(white(n, r), 500) * expdec(n, 0.04) * 0.5)
    y += st(sat(thud, 1.4))
    return reverb(y, IR_ROOM(), 0.25, tail=False)


@reg('cross_out', 0.26, 'Red X cross-out: two bolt slashes (0.0, 0.13) + heavy slam at 0.26 (the X lands) + low falling nope. 1.9 s.')
def _(r):
    n = N(1.9)
    y = np.zeros((2, n))
    for tm, p0, p1, fl in ((0.0, -0.8, 0.8, 1500), (0.12, 0.8, -0.8, 1200)):
        z = S6.whoosh(0.28, r, 0.1, fl, 9500, 0.9, p0, p1, 2.0)
        arc = electric_arc(0.16, r, density=140, hum=300)
        arc = np.concatenate([arc, np.zeros(N(0.28) - len(arc))])[:N(0.28)] * env(N(0.28), [(0, 1), (0.16, 0)])
        add_at(y, z * 1.1 + pan(arc * 0.5, 0.0), tm)
    b = _boom(r, 0.5)
    add_at(y, b, 0.26, 1.0)
    t = tax(n)
    dn = np.sin(phase_of(np.where(t > 0.26, 150 * np.exp(-(t - 0.26) / 0.35) + 60, 0))) * np.exp(-np.maximum(t - 0.26, 0) / 0.35) * (t > 0.26)
    y += st(sat(dn * 0.4, 1.4))
    return y


@reg('vortex_suck', 1.15, 'Spiral vortex sucks everything into the TV: rising, rotating whoosh + bubble swirl, "gulp" pop + boom at 1.15 s. 2.8 s.')
def _(r):
    dur = 2.8
    n = N(dur)
    t = tax(n)
    u = np.clip(t / 1.15, 0, 1)
    nz = pink(n, r) * 0.7 + white(n, r) * 0.3
    sw = stft_shape(nz, bandsweep(lambda tt: 260 * 16 ** np.clip(tt / 1.15, 0, 1) ** 1.2, 0.8), nper=2048)
    sw = sw * env(n, [(0, 0), (0.5, 0.25), (1.1, 1.0), (1.16, 0.05), (dur, 0)]) * 0.9
    rot = np.sin(phase_of(1.5 + 12 * u ** 2)) * 0.9
    y = pan_dyn(sw, rot * (t < 1.16))
    # swirling glassy droplets (pitch rising)
    dens = np.clip(t / 1.15, 0, 1) ** 2 * (t < 1.15) * 240
    y += bubble_cloud(dur, r, dens, (600, 3200), 0.3)
    # tonal-free "suck" body: sine 90 -> 420 Hz, quiet
    body = np.sin(phase_of(90 * 4.7 ** u ** 1.6)) * env(n, [(0, 0), (1.1, 0.25), (1.16, 0), (dur, 0)])
    y += st(body) * 0.7
    g = gloss(r, 250, 1.6, 0.6)
    add_at(y, g * 1.1, 1.15)
    add_at(y, _boom(r, 0.35), 1.15, 0.6)
    return reverb(y, IR_BIG(), 0.2, tail=False)


@reg('glitter', 0.0, 'Glitter / sparkle dust: sparse airy micro-pops and shimmering noise (no pitched bells), 2.0 s.')
def _(r):
    n = N(2.0)
    y = np.zeros((2, n))
    for tm in np.sort(r.exponential(0.5, 90)):
        if tm > 1.7:
            continue
        L = N(0.05)
        ex = white(L, r) * np.exp(-np.arange(L) / N(0.0015))
        add_at(y, pan(reson(ex, r.uniform(4500, 11000), r.uniform(20, 60)) * 3 * r.uniform(0.2, 0.9) * np.exp(-tm / 1.0), r.uniform(-0.9, 0.9)), tm)
    sh = hp(white(n, r), 6500) * env(n, [(0, 0), (0.08, 0.5), (0.5, 0.15), (2.0, 0)]) * 0.12
    return reverb(y + haas(sh), IR_HALL(), 0.2, tail=False)


# ---------------------------------------------------------------- the end-card slam
@reg('logo_slam', 0.55, 'END CARD logo slam: reverse-air suck (0-0.55), bolt crack + big boom + splash + shockwave at 0.55, '
     'glitter, hall bloom. 4.6 s.')
def _(r):
    dur = 4.6
    n = N(dur)
    t = tax(n)
    hit = 0.55
    y = np.zeros((2, n))
    nz = pink(n, r) * 0.6 + white(n, r) * 0.4
    suck = stft_shape(nz, bandsweep(lambda tt: 500 * 18 ** np.clip(tt / hit, 0, 1) ** 1.2, 0.9), nper=2048)
    suck = suck * (np.clip(t / hit, 0, 1) ** 3.0) * (t < hit) * 1.0
    suck[t >= hit] = 0
    y += pan_dyn(suck, np.interp(t, [0, hit], [-0.4, 0.4]))
    big = _boom(r, 1.0)
    add_at(y, big, hit, 1.0)
    bolt = S6.build('bolt_crack', write=False)
    add_at(y, bolt, hit, 0.55)
    add_at(y, splash_noise(r, 1.8, 10000, 800, 0.3, 1.8), hit, 0.6)
    sw = S6.build('shockwave', write=False)
    add_at(y, sw, hit, 0.6)
    add_at(y, S6.build('glitter', write=False), hit + 0.05, 0.9)
    add_at(y, S6.build('glitter', suffix='', write=False), hit + 0.6, 0.5)
    return reverb(y, IR_CINEMA(), 0.14, tail=False)


# ---------------------------------------------------------------- real-sample harp sounds (VSCO-2-CE, CC0)
_SM = {}


def _samplers():
    if _SM:
        return _SM
    from sampler import Sampler

    def hp_(n):
        m = re.search(r'_([A-G]#?\d)_', n)
        return (m.group(1), 1, 1) if m else None

    def sp_(n):
        m = re.search(r'_([A-G]#?\d)_v(\d)_rr(\d)', n)
        return (m.group(1), int(m.group(2)), int(m.group(3))) if m else None

    def pp_(n):
        m = re.search(r'([A-G]#?\d)', n)
        return (m.group(1), 1, 1) if m else None
    _SM['harp'] = Sampler(sorted(glob.glob(os.path.join(VS, 'Strings/Harp/*.wav'))), hp_, release=0.9)
    _SM['vln'] = Sampler(sorted(glob.glob(os.path.join(VS, 'Strings/Violin Section/Spic/*.wav'))), sp_, offset=0, release=0.25)
    _SM['piano'] = Sampler(sorted(glob.glob(os.path.join(VS, 'Keys/Upright Nr1/*.wav'))), pp_, release=0.8)
    return _SM


def _room_small(x, seed=5):
    rng = np.random.default_rng(seed)
    L = int(0.9 * SR)
    e = np.exp(-np.arange(L) / (0.22 * SR))
    ir = np.stack([rng.standard_normal(L) * e, rng.standard_normal(L) * e], 1) * 0.012
    from scipy.signal import fftconvolve
    Nn = x.shape[0]
    wet = np.stack([fftconvolve(x[:, 0], ir[:, 0])[:Nn], fftconvolve(x[:, 1], ir[:, 1])[:Nn]], 1)
    return x + wet


@reg('harp_sparkle', 0.0, 'Real-harp glissando up the pentatonic scale from the root (8 notes, 40 ms apart) + soft glitter; hit 0.0. 2.2 s.', True)
def _(r, root=72):
    S = _samplers()
    notes = [root + d for d in (0, 2, 4, 7, 9, 12, 14, 16, 19, 21)]
    Nn = int(2.2 * SR)
    H = [(0.04 * i, 0.5, m, 72 - 2 * i, {}) for i, m in enumerate(notes)]
    x = S['harp'].render(H, Nn)
    x = _room_small(x)
    return x.T


@reg('day_note', 0.0, 'One day of the week = one note of a rising phrase in the score key: real harp (+ octave below) with violin '
     'spiccato on top, small warm room. 1.6 s.', True)
def _(r, root=72):
    S = _samplers()
    Nn = int(1.6 * SR)
    x = 0.85 * S['harp'].render([(0.0, 0.55, root, 78, {}), (0.004, 0.5, root - 12, 56, {})], Nn)
    x = x + 0.4 * S['vln'].render([(0.002, 0.12, root, 68, {})], Nn)
    return _room_small(x).T


@reg('week_finale', 0.0, 'Last day of the week: harp+violin note, upright-piano triad and a rising harp gliss sparkle. 2.4 s.', True)
def _(r, root=86):
    S = _samplers()
    Nn = int(2.4 * SR)
    x = 0.85 * S['harp'].render([(0.0, 0.55, root, 88, {}), (0.004, 0.5, root - 12, 64, {})], Nn)
    x += 0.4 * S['vln'].render([(0.002, 0.12, root, 76, {})], Nn)
    x += 0.5 * S['piano'].render([(0.0, 1.2, root, 78, {}), (0.0, 1.2, root - 12, 70, {}), (0.0, 1.2, root - 5, 64, {})], Nn)
    for i, m in enumerate([root + d for d in (2, 4, 7, 9, 12, 14, 16, 19)]):
        x += 0.8 * S['harp'].render([(0.12 + i * 0.035, 0.6, m, 62 - i * 2, {})], Nn)
    return _room_small(x).T


# ---------------------------------------------------------------- Bollywood sting: tabla + sitar
def _pluck(f, dur, r, decay=0.9995, bright=0.5, buzz=1.6):
    """Karplus-Strong string, then a sitar-like 'jawari' buzz (asymmetric saturation) and sympathetic 5th"""
    n = N(dur)
    P = max(2, int(round(SR / f)))
    ex = white(P + 1, r) * np.hanning(P + 1) ** 0.3
    ex = lp(ex, 2500 + 6000 * bright)
    buf = np.zeros(n)
    buf[:P + 1] = ex
    for i in range(P + 1, n):
        buf[i] = decay * 0.5 * (buf[i - P] + buf[i - P - 1])
    y = buf
    y = np.tanh(buzz * (y / (np.max(np.abs(y)) + 1e-9) + 0.15)) - np.tanh(buzz * 0.15)
    y = peq(y, 2400, 1.5, 5)
    return y * attack(n, 0.0008)


def _tabla_na(f, r, dur=0.5):
    n = N(dur)
    t = tax(n)
    y = np.sin(phase_of(f * (1 + 0.05 * np.exp(-t / 0.015)))) * np.exp(-t / 0.28) + 0.4 * np.sin(phase_of(f * 2.3)) * np.exp(-t / 0.12)
    y += 0.3 * np.sin(phase_of(f * 3.6)) * np.exp(-t / 0.06)
    y += hp(white(n, r), 2500) * expdec(n, 0.003) * 0.5 + bp(white(n, r), 800, 2500) * expdec(n, 0.008) * 0.5
    return y * attack(n, 0.0005)


def _tabla_ge(f, r, dur=0.6):
    n = N(dur)
    t = tax(n)
    fr = f * (0.85 + 0.35 * (1 - np.exp(-t / 0.06)))
    y = np.sin(phase_of(fr)) * np.exp(-t / 0.3) + 0.2 * np.sin(phase_of(fr * 2.1)) * np.exp(-t / 0.1)
    y += lp(white(n, r), 900) * expdec(n, 0.01) * 0.4
    return sat(y * 1.2, 1.3) * attack(n, 0.001)


@reg('bolly_sting', 0.0, 'Bollywood sting: tabla ge+na roll, sitar-like plucked flourish rising in the key + jhala shimmer, hall. Hit 0.0. 1.7 s.', True)
def _(r, root=62):
    dur = 1.7
    n = N(dur)
    y = np.zeros((2, n))
    f0 = mtof(root)
    for tm, kind, g in ((0.0, 'ge', 1.0), (0.0, 'na', 0.9), (0.125, 'na', 0.6), (0.25, 'na', 0.55), (0.31, 'na', 0.5), (0.37, 'ge', 0.7),
                        (0.37, 'na', 0.8), (0.56, 'na', 0.5)):
        s = _tabla_ge(f0 / 4, r) if kind == 'ge' else _tabla_na(f0, r)
        add_at(y, pan(s * g, -0.15 if kind == 'ge' else 0.15), tm, 0.7)
    fl = [0, 2, 4, 7, 9, 12, 14, 12]
    for i, d in enumerate(fl):
        tm = 0.03 + i * 0.075
        p = _pluck(mtof(root + 12 + d), 1.0 if i == len(fl) - 1 else 0.5, r, decay=0.9996 if i == len(fl) - 1 else 0.9985)
        add_at(y, pan(p, np.interp(i, [0, len(fl) - 1], [-0.4, 0.4])), tm, 0.55)
    # jhala shimmer on the last note: fast repeated plucks
    for k in range(10):
        p = _pluck(mtof(root + 12 + 14), 0.25, r, decay=0.997, bright=0.9)
        add_at(y, pan(p, 0.3), 0.66 + k * 0.045, 0.16 * (1 - k / 12))
    drone = (np.sin(phase_of(np.full(n, mtof(root - 12)))) + 0.5 * np.sin(phase_of(np.full(n, mtof(root - 5))))) * env(n, [(0, 0), (0.1, 0.16), (1.0, 0.1), (dur, 0)])
    y += st(drone) * 0.5
    y = sat(y * 1.3, 1.2)
    return reverb(y, IR_HALL(), 0.28, tail=False)


# ---------------------------------------------------------------- build
def build(name, root=None, write=True, suffix=''):
    return S6.build(name, root, write, suffix)


def main(argv):
    S6.OUT = OUT
    names = argv or NEW
    os.makedirs(OUT, exist_ok=True)
    for nm in names:
        x = S6.build(nm, 72 if S6.REG[nm]['pitched'] else None, write=True)
        pk = 20 * np.log10(np.max(np.abs(x)) + 1e-12)
        rms = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
        print('%-18s %5.2fs peak %5.1f rms %6.1f' % (nm, x.shape[-1] / SR, pk, rms), flush=True)
    json.dump({k: S6.REG[k]['hit'] for k in NEW}, open(os.path.join(OUT, 'hits.json'), 'w'), indent=1)


if __name__ == '__main__':
    main(sys.argv[1:])
