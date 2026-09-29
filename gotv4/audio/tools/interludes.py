#!/usr/bin/env python3
"""anime_interlude.wav (3.8 s) + crowd_interlude.wav (2.4 s), 48k stereo, -3 dBFS peak."""
import sys, os, json
import numpy as np, soundfile as sf
sys.path.insert(0, '/home/user/I/anim/audio/tools')
import importlib.util
spec = importlib.util.spec_from_file_location('asfx', '/home/user/I/anim/audio/tools/sfx.py'); A = importlib.util.module_from_spec(spec); spec.loader.exec_module(A)
SR = 48000; ROOT = '/home/user/I/gotv4/audio'
db = lambda x: 10 ** (x / 20)
DIRS = [ROOT + '/sfx', '/home/user/I/promo/audio/sfx', '/home/user/I/anim/audio/sfx']
HITS = {}
for d in DIRS[::-1]:
    if os.path.exists(d + '/hits.json'): HITS.update(json.load(open(d + '/hits.json')))
def S(name):
    for d in DIRS:
        p = f'{d}/{name}.wav'
        if os.path.exists(p):
            x, sr = sf.read(p, always_2d=True); assert sr == SR
            x = x.T
            if x.shape[0] == 1: x = np.vstack([x, x])
            return x, HITS.get(name, 0.0)
    raise FileNotFoundError(name)
def put(buf, name, t_hit, gain_db=0, maxlen=None, fadeout=0.08, hit=None, src_off=0.0, pan=0.0):
    x, h = S(name)
    if hit is not None: h = hit
    x = x[:, int(src_off * SR):]; h = max(h - src_off, 0)
    if maxlen: x = x[:, :int(maxlen * SR)]
    fo = int(min(fadeout, x.shape[1] / SR / 2) * SR); x = x.copy()
    x[:, -fo:] *= np.linspace(1, 0, fo) ** 2
    i = int(round((t_hit - h) * SR)); s0 = max(0, -i); i0 = max(0, i); e = min(x.shape[1], buf.shape[1] - i0 + s0)
    if e > s0: buf[:, i0:i0 + e - s0] += x[:, s0:e] * db(gain_db) * np.array([[1 - max(pan, 0)], [1 + min(pan, 0)]])
def bell(f, dur=0.35, d=0.12):
    n = int(dur * SR); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / (d * .5)) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / (d * .3))) * np.exp(-t / d)
    y[:40] *= np.linspace(0, 1, 40); return y
def fin(y, peak=-3.0):
    y = np.tanh(y / 1.2) if np.abs(y).max() > 1.2 else y      # gentle soft-clip guard
    return y / np.abs(y).max() * db(peak)
def sweep(n, f0, f1, r, bw=0.9):
    # noise whoosh with a rising band-pass (log sweep)
    t = np.linspace(0, 1, n); fc = f0 * (f1 / f0) ** t
    w = A.white(n, r); out = np.zeros(n)
    edges = np.geomspace(f0 / 1.3, f1 * 1.3, 24)
    for a, b in zip(edges[:-1], edges[1:]):
        c = np.sqrt(a * b); g = np.exp(-(np.log(c / fc) ** 2) / (2 * (bw * .6) ** 2))
        out += A.bp(w, a, b) * g
    return out

# ============================================================ ANIME INTERLUDE
def anime():
    n = int(3.8 * SR); r = np.random.default_rng(77); buf = np.zeros((2, n))
    # -- impacts at 0.0 and 2.3
    put(buf, 'anime_impact_don', 0.0, -4, maxlen=1.6, fadeout=0.5)
    put(buf, 'punch_impact', 0.0, -8, maxlen=0.6)
    put(buf, 'impact_hit', 2.3, -3, maxlen=1.5, fadeout=0.5)
    put(buf, 'wall_pulse_boom', 2.3, -9, maxlen=1.5, fadeout=0.5)
    # -- pull-back reveal whoosh 1.15-2.3 and rising aura 1.1 -> 2.3, aura hum/rise to 3.3
    put(buf, 'zoom_out_whoosh', 1.55, -9, maxlen=0.9)
    put(buf, 'aura_charge_rise', 2.3, -6, maxlen=3.5, fadeout=0.6, hit=1.2)      # rise from 1.1, hit at 2.3, aura tail
    t = np.arange(n) / SR
    # aura: rising detuned saw stack 2.3 -> 3.3 with lowpass opening + sub
    m = (t >= 2.3) & (t < 3.45); u = np.clip((t - 2.3) / 1.0, 0, 1)
    f = 110 * 2 ** (u * 1.6); ph = np.cumsum(f) / SR; aur = np.zeros(n)
    for dt in (1.0, 1.007, 0.994, 2.01):
        aur += 2 * ((ph * dt) % 1) - 1
    aur = A.lp(aur, 2500) * 0.22 * (0.4 + 0.6 * u) * m * np.clip((3.45 - t) / 0.2, 0, 1)
    sh = sweep(n, 500, 9000, r) * 0.25 * m * (0.3 + 0.7 * u) * np.clip((3.45 - t) / 0.15, 0, 1)
    buf += np.vstack([aur + sh, aur + np.roll(sh, 300)]) * db(-8)
    # -- speed-line rumble ゴゴゴ 2.3-3.3 (low noise)
    rum = A.lp(A.brown(n, r), 160) * 3 * m * (0.5 + 0.5 * u) * np.clip((3.4 - t) / .2, 0, 1)
    buf += np.vstack([rum, rum]) * db(-12)
    # -- sakura shimmer + sparkle ticks
    put(buf, 'sakura_shimmer', 0.35, -13, maxlen=3.0, fadeout=0.5, hit=0.0)
    put(buf, 'chime_sparkle', 0.40, -11, maxlen=1.4, fadeout=0.4, hit=0.0)
    put(buf, 'sakura_swish', 1.2, -14, maxlen=1.4, fadeout=0.4, hit=0.0)
    put(buf, 'foil_shimmer', 1.25, -12, maxlen=0.9)
    pent = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4]
    tk = [0.42, 0.50, 0.58, 0.69, 0.79, 0.90, 1.02, 1.10, 1.48, 1.62, 1.75, 1.93, 2.06, 2.14, 3.02, 3.16, 3.29]
    for i, ts in enumerate(tk):
        y = bell(1568 * pent[(i * 3) % len(pent)], 0.4, 0.10)[None, :] * db(-19 - (i % 3)); p = np.sin(i * 2.3) * 0.7
        j = int(ts * SR); L = y.shape[1]; e = min(n, j + L)
        buf[0, j:e] += y[0, :e - j] * (1 - max(p, 0)); buf[1, j:e] += y[0, :e - j] * (1 + min(p, 0))
    # -- fist pump at 3.32 and final flash whoosh -> flash at 3.68-3.8
    put(buf, 'punch_impact', 3.32, -9, maxlen=0.5)
    put(buf, 'light_burst_whoosh', 3.74, -7, maxlen=0.7, hit=0.4, fadeout=0.02)
    fl = np.zeros(n); k0 = int(3.68 * SR); L = n - k0
    fl[k0:] = A.hp(A.white(L, r), 1500) * np.linspace(0, 1, L) ** 2 * 0.5
    buf += np.vstack([fl, fl]) * db(-10)
    # -- voice (owns the mid band): duck the beds slightly under it
    v, _ = sf.read(f'{ROOT}/anime_voice.wav', always_2d=True); v = v.T
    e = np.sqrt(np.convolve(np.mean(v ** 2, 0), np.ones(1440) / 1440, 'same')); act = np.clip(e / 0.03, 0, 1)
    act = np.convolve(act, np.ones(2400) / 2400, 'same')
    beds = buf * (1 - 0.35 * act)[None, :]
    mix = beds * db(-1) + v * 1.15
    sf.write(f'{ROOT}/anime_interlude.wav', fin(mix).T, SR, subtype='PCM_24')

# ============================================================ CROWD INTERLUDE
def chant(n, r, starts, count=26):
    """HO-YY ho-yy: two syllables 'o' then 'e/i' glide, male-heavy, shouty; Hebrew 'הוֹיי'"""
    out = np.zeros((2, n))
    for k in range(count):
        rr = np.random.default_rng(r.integers(1 << 31)); female = rr.uniform() < 0.25
        f0 = rr.uniform(120, 200) * (1.6 if female else 1); sh = 1.15 if female else 1.0
        amp = np.zeros(n); wo = np.zeros(n); wi = np.zeros(n); wa = np.zeros(n); pitch = np.full(n, f0)
        for c in starts:
            for so, sl, v, pm in ((0.0, 0.17, 'o', 1.0), (0.17, 0.20, 'e', 1.10), (0.36, 0.14, 'i', 1.05)):
                s0 = c + so + rr.normal(0, 0.02); i0 = max(0, A.N(s0)); i1 = min(n, A.N(s0 + sl + rr.normal(0, 0.015)))
                if i1 - i0 < 10: continue
                amp[i0:i1] = np.hanning(i1 - i0) ** 0.3 * (1.0 if v != 'i' else 0.7)
                {'o': wo, 'e': wa, 'i': wi}[v][i0:i1] = 1; pitch[i0:i1] = f0 * pm
        pitch = A.smooth(pitch, 0.02)
        src = A.glottal(pitch, n, rr, breath=0.25, jitter=0.02)
        y = (A.formant(src, 'o', sh) * A.smooth(wo, 0.012) + A.formant(src, 'e', sh) * A.smooth(wa, 0.012) + A.formant(src, 'i', sh) * A.smooth(wi, 0.012)) * amp
        out += A.pan(A.lp(y, rr.uniform(3500, 6500)), rr.uniform(-1, 1)) * rr.uniform(0.5, 1)
    return out / np.sqrt(count)
def crowd():
    n = int(2.4 * SR); r = np.random.default_rng(2024); buf = np.zeros((2, n)); t = np.arange(n) / SR
    # bed roar builds, drums groove
    bed, _ = S('stadium_crowd_bed'); bd = bed[:, int(3.0 * SR): int(3.0 * SR) + n]
    buf += bd * (0.25 + 0.75 * np.clip(t / 1.2, 0, 1) ** 1.5)[None, :] * db(-6) * (t < 1.2)[None, :]
    dr, _ = S('stadium_drums'); dd = dr[:, int(2.5 * SR): int(2.5 * SR) + n]
    buf += dd * db(-3) * np.clip(t / .12, 0, 1)[None, :] * (1 - 0.35 * (t > 1.2))[None, :]
    # synth drum groove: bass drum on beat (0.3 s = 200 bpm stand tempo), snare/tom fills, escalating
    kick = lambda: A.lp(A.sine(np.linspace(110, 45, int(.22 * SR)), int(.22 * SR)) * np.exp(-np.arange(int(.22 * SR)) / (.07 * SR)) * 1.2 if False else np.sin(2 * np.pi * np.cumsum(np.linspace(120, 45, int(.22 * SR))) / SR) * np.exp(-np.arange(int(.22 * SR)) / (.06 * SR)), 300)
    kk = kick()
    for i, ts in enumerate(np.arange(0.0, 2.4, 0.3)):
        j = int(ts * SR); e = min(n, j + len(kk)); g = db(-4 if i % 2 == 0 else -8) * (1 if ts < 1.2 else .8)
        buf[0, j:e] += kk[:e - j] * g; buf[1, j:e] += kk[:e - j] * g
    # stomp-stomp-clap pattern with real hand-clap crowd from library helper
    claps = A._claps(2.4, r, [0.15, 0.45, 0.75, 1.05], count=30)
    buf += claps * db(-7)
    for ts in (0.0, 0.3, 0.6, 0.9):   # stomps: thuddy noise bursts
        L = int(.12 * SR); s = A.lp(A.white(L, r), 500) * np.exp(-np.arange(L) / (.03 * SR)) * 1.5
        j = int(ts * SR); buf[:, j:j + L] += s[None, :] * db(-8)
    # Hebrew-style chant
    ch = chant(n, r, [0.05, 0.62]) * (t < 1.25)[None, :] * np.clip(t / .05, 0, 1)[None, :]
    ch2 = chant(n, r, [1.30, 1.75], count=32) * np.clip((t - 1.2) / .05, 0, 1)[None, :] * db(-3)
    buf += ch * db(2) + ch2 * db(-2)
    # goal eruption at 1.2
    er, _ = S('stadium_goal_eruption'); buf += np.pad(er, ((0, 0), (int(1.2 * SR), 0)))[:, :n] * db(-1) * (t >= 1.15)[None, :] * np.clip((t - 1.15) / .04, 0, 1)[None, :]
    put(buf, 'goal_crowd_roar', 1.25, -6, maxlen=1.3, hit=0.1, fadeout=0.15)
    put(buf, 'impact_hit', 1.2, -8, maxlen=1.0, fadeout=0.3)
    put(buf, 'cheer_whoop', 1.5, -12, maxlen=0.9)
    # flares fizz: crackly hissing noise from 0.7, pans
    hs = A.bp(A.white(n, r), 3500, 11000) * (0.4 + 0.6 * (r.random(n // 96).repeat(96)[:n] ** 6)) * np.clip((t - .7) / .5, 0, 1) * np.clip((2.3 - t) / .1, 0, 1)
    buf += np.vstack([hs, np.roll(hs, 500)]) * db(-24)
    # final whoosh 2.05-2.4
    put(buf, 'wipe_whoosh_pink', 2.32, -7, maxlen=0.75, hit=0.35, fadeout=0.02)
    put(buf, 'whip_out_right', 2.3, -12, maxlen=0.5, fadeout=0.02)
    buf[:, -int(.01 * SR):] *= np.linspace(1, 0, int(.01 * SR))
    sf.write(f'{ROOT}/crowd_interlude.wav', fin(buf).T, SR, subtype='PCM_24')

if __name__ == '__main__':
    anime(); crowd()
    for f in ('anime_interlude', 'crowd_interlude'):
        x, sr = sf.read(f'{ROOT}/{f}.wav'); print(f, x.shape, sr, round(20 * np.log10(np.abs(x).max()), 2),
             [round(float(np.sqrt((x[int(i * sr):int((i + .2) * sr)] ** 2).mean())), 3) for i in np.arange(0, len(x) / sr, 0.2)])
