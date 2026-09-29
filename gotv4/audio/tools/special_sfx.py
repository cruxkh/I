"""Anime-flavoured hand-made SFX (rules run BEFORE the generic keyword classifier of gotv_sfx.py).
   build(name, desc, outdir) -> hit time (s from file start to impact)."""
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gotv_sfx as G
from gotv_sfx import *

def _impact(r, big=1.0, magic=False, dur=2.2):
    y, h = G.f_boom(r, 70, 28, .85, .7, .9, metal=.45, mf=330, shim=.35 if magic else 0.0, wet=.3, dur=dur, grit=.35, low_rumble=.45)
    z, _ = G.f_glitch(r, .25)
    y = y * big; n = y.shape[1]
    y[:, :z.shape[1]] += fit(z, z.shape[1]) * 0.25
    return y, h
def _rumble(r, dur=1.6):
    n = N(dur); t = tax(n); b = lp(brown(n, r), 150) * 6
    b *= (0.65 + 0.35 * np.sin(2 * np.pi * 13 * t)) * env(n, [(0, 0), (dur * .6, 1), (dur, 0)])
    return mono_to_st(b) * .9, 0.0
def _shock(r):
    y = G.f_whoosh(r, .8, .12, 150, 7000, .9, -.3, .3, sub=.8, grit=.2, sharp=3.0)[0]
    return y, 0.12
def _blade(r):
    return G.f_whoosh(r, .38, .2, 700, 11000, .6, -.9, .9, grit=.6, sharp=4.5, shim=.15)
def _panel(r):
    y, h = G.f_boom(r, 90, 40, .35, .9, 1.0, metal=0, wet=.2, dur=1.3, low_rumble=.15, crackf=2500); return y, h
def _don(r):
    y, h = G.f_boom(r, 95, 45, .5, .7, .6, metal=.2, mf=210, wet=.18, dur=1.3, low_rumble=.15); return y, h
def _glint(r, cnt=14):
    return G.f_sparkle(r, 1.0, cnt, 3500, 11000, dens='decay', wet=.3, d=.15)
def _paaa(r):
    y, h = G.f_choir_swell(r, 1.8, 523, wet=.5, bright=1.3); return y, h
def _zap(r):
    a = G.f_tv_on(r)[0]; s = G.f_sparkle(r, .5, 8, 4000, 10000, wet=.1)[0]
    return cat(a, s), 0.0

RULES = [
    (('impact_frame', 'anime_impact_boom', 'magic_impact', 'impact_boom_sparkle'), lambda r, s: _impact(r, 1.0, 'magic' in s)),
    (('don_hit', 'katakana', 'taiko'), lambda r, s: _don(r)),
    (('manga_panel', 'panel_slam'), lambda r, s: _panel(r)),
    (('shockwave', 'halo_'), lambda r, s: _shock(r)),
    (('gogogo', 'rumble'), lambda r, s: _rumble(r)),
    (('blade_swish', 'slash', 'whip_slash', 'zubaa'), lambda r, s: _blade(r)),
    (('kira', 'glint', 'star_ping', 'twinkle'), lambda r, s: _glint(r)),
    (('paaa', 'glow_swell'), lambda r, s: _paaa(r)),
    (('power_on_zap',), lambda r, s: _zap(r)),
]
_orig = G.auto
def auto2(name, desc, r):
    s = (name + ' ' + desc).lower()
    for keys, fn in RULES:
        if any(k in s for k in keys):
            try: return fn(r, s)
            except Exception as e: print('special failed', name, e)
    return _orig(name, desc, r)
G.auto = auto2
def build(name, desc, outdir):
    return G.build(name, desc, outdir=outdir)[0]
