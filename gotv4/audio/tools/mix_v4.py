#!/usr/bin/env python3
"""GOTV v4 ANIME LEGEND EDITION final mix -> audio/master.wav (48k stereo 24-bit, exact timeline length).
   python3 audio/tools/mix_v4.py [--legacy] [--out path]
   --legacy : also load audio/cues/v*.json (v-clock cues of the old version) as placeholder SFX for testing.
Clocks: T = output time. v = VO clock of the old film (music.wav lives on v). vo_v4.wav is on T-7 (starts at the end of the god intro).
"""
import os, sys, json, glob, argparse, importlib.util
import numpy as np
import soundfile as sf
from scipy.signal import sosfilt, resample_poly, fftconvolve
from scipy.ndimage import uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
ROOT = os.path.normpath(os.path.join(HERE, '..'))          # /home/user/I/gotv4/audio
PROJ = os.path.dirname(ROOT)
import mix_v2 as M2                                          # reuse the exact VO chain / filters / limiter
from mix_v2 import (hp, lp, peq, hshelf, compress, smooth_ar, up, ctl_level_db, limiter, lufs, true_peak_db, load, fitn, sos, db, CR)
SR = 48000
TL = json.load(open(os.path.join(PROJ, 'timeline.json')))
HOLDS = TL['holds']; TOTAL = float(TL['total']); NS = int(round(TOTAL * SR))
INTRO_END = 7.0
V_SIL0, V_SIL1 = 25.50, 25.61
TARGET_LUFS = -14.0; TP_CEIL = -1.2
MUSIC_GAIN = -12.0; DUCK_DB = -7.0; SFX_GAIN = -6.0; SFX_DUCK = -7.5; MAX_LOUD_OVERLAP = 3
INTERLUDE_WAVS = [('anime_interlude.wav', 33.736), ('crowd_interlude.wav', 22.75)]
GOD_GAIN_DB = -3.0; INTER_GAIN_DB = -1.0
MAXLEN = {'impact_boom': 6.0, 'crowd_roar': 2.4, 'goal_horn': 1.2, 'stadium_crowd_swell': 2.6, 'button_ripple_chime': 2.0, 'goal_crowd_roar': 3.2}
maxlen = lambda nm: MAXLEN.get(nm, 3.6)

# ------------------------------------------------------------------ clocks
def v2T(v):
    return v + sum(h['dur'] for h in HOLDS if h['v'] < v - 1e-6)
def hold_T0(h): return h['v'] + sum(g['dur'] for g in HOLDS if g['v'] < h['v'] - 1e-6)
for h in HOLDS: h['_T0'] = hold_T0(h); h['_T1'] = h['_T0'] + h['dur']
IMPACT_T = v2T(V_SIL1); SIL0 = v2T(V_SIL0); SIL1 = v2T(V_SIL1)     # exact silence (T equivalents)
for h in HOLDS: assert abs(h['_T0'] - h['T0']) < 1e-3, (h, h['_T0'])
INTERLUDES = [(h['_T0'], h['_T1']) for h in HOLDS if h['kind'] == 'interlude' and h['v'] > 0]

# ------------------------------------------------------------------ small synth
def _ps():
    sp = importlib.util.spec_from_file_location('psfx', '/home/user/I/promo/audio/tools/sfx.py'); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
PS = None
def plate_ir(rt60=1.5, seed=42):
    global PS
    if PS is None: PS = _ps()
    return PS.make_ir(rt60=rt60, predelay=0.018, hf=0.5, lf=0.6, er=6, er_span=0.03, bright=7500, seed=seed)
def add(dst, src, T, g=1.0):
    i = int(round(T * SR)); s0 = max(0, -i); i0 = max(0, i); e = min(src.shape[-1], dst.shape[-1] - i0 + s0)
    if e > s0: dst[:, i0:i0 + e - s0] += src[:, s0:e] * g
def riser(dur, r, f0=800, f1=9000, level=1.0):
    n = int(dur * SR); w = r.standard_normal(n); t = np.linspace(0, 1, n)
    out = np.zeros(n); edges = np.geomspace(f0 / 1.4, f1 * 1.4, 18); fc = f0 * (f1 / f0) ** t
    for a, b in zip(edges[:-1], edges[1:]):
        c = np.sqrt(a * b); g = np.exp(-(np.log(c / fc) ** 2) / (2 * .5 ** 2))
        out += sosfilt(sos('bandpass', [a, min(b, 22000)], 2), w) * g
    out *= t ** 1.6; out[-int(.004 * SR):] *= np.linspace(1, 0, int(.004 * SR))
    return np.vstack([out, np.roll(out, 200)]) * level
def accent(r, level=1.0):
    n = int(.6 * SR); t = np.arange(n) / SR
    k = np.sin(2 * np.pi * np.cumsum(np.linspace(150, 48, n)) / SR) * np.exp(-t / .12)
    c = sosfilt(sos('highpass', 1800, 2), r.standard_normal(n)) * np.exp(-t / .07) * .5
    y = (k * 1.1 + c) * level; y[:60] *= np.linspace(0, 1, 60)
    return np.vstack([y, y])
def shimmer(dur, r):
    n = int(dur * SR); t = np.arange(n) / SR
    w = sosfilt(sos('bandpass', [3500, 10000], 2), r.standard_normal(n))
    trem = 0.55 + 0.45 * np.sin(2 * np.pi * 5.5 * t) * np.sin(2 * np.pi * 0.9 * t + 1)
    f = np.zeros(n)
    for fr, a in ((1568, .5), (2093, .35), (2637, .25)):
        f += a * np.sin(2 * np.pi * fr * t + 2 * np.pi * .8 * np.sin(2 * np.pi * .3 * t)) * (0.5 + 0.5 * np.sin(2 * np.pi * (.7 + fr / 4000) * t))
    y = (w * trem * .5 + f * .35) * np.minimum(1, np.minimum(t / .08, (dur - t) / .1))
    return np.vstack([y, np.roll(y, 350)])

# ------------------------------------------------------------------ VO
def build_vo():
    vo7 = load(os.path.join(ROOT, 'vo_v4.wav')); vo = np.zeros((2, NS)); vo[:, int(INTRO_END * SR): int(INTRO_END * SR) + vo7.shape[1]] = vo7[:, :NS - int(INTRO_END * SR)]
    dry = hp(vo, 80, 2); dry = peq(dry, 250, 1.0, -1.5)
    dry, _ = compress(dry, -24, 2.5, 8, 90, 0.0)
    dry = peq(dry, 3200, 0.9, 2.5); dry = hshelf(dry, 7500, 1.5)
    ir = plate_ir(); send = hp(lp(dry, 6500), 300)
    wet = np.vstack([fftconvolve(send[0], ir[0]), fftconvolve(send[1], ir[1])])[:, :NS] * db(-19)
    return dry, wet

# ------------------------------------------------------------------ music on the master clock
def build_music_raw():
    m = load(os.path.join(PROJ, 'audio', 'music', 'music.wav'))
    out = np.zeros((2, NS)); r = np.random.default_rng(4)
    cuts = sorted({0.0, m.shape[1] / SR} | {h['v'] for h in HOLDS if h['v'] > 0})
    segs = []
    for a, b in zip(cuts[:-1], cuts[1:]):
        Ta = a + sum(h['dur'] for h in HOLDS if h['v'] <= a + 1e-6); seg = m[:, int(round(a * SR)): int(round(b * SR))].copy(); n = seg.shape[1]
        f = min(int(.003 * SR), n // 4); seg[:, :f] *= np.linspace(0, 1, f); seg[:, -f:] *= np.linspace(1, 0, f)
        add(out, seg, Ta); segs.append((a, b, Ta))
    ir = plate_ir(rt60=1.9, seed=9); fx = np.zeros((2, NS)); log = []
    for h in HOLDS:
        T0, T1 = h['_T0'], h['_T1']
        if h['v'] <= 0: continue                                 # god intro: music silent (own choir bed inside god_intro.wav)
        i0 = int(T0 * SR)
        if h['kind'] == 'hold':
            # 1) quick lowpass sweep over the last 0.22 s (ladder of filtered versions cross-faded)
            L = int(.22 * SR); seg = out[:, i0 - L:i0].copy(); cf = [14000, 6000, 3000, 1500, 700, 350]
            vers = [lp(seg, f, 2) for f in cf]; pos = np.linspace(0, 1, L) ** 0.8 * (len(cf) - 1)
            res = np.zeros_like(seg)
            for k, vv in enumerate(vers): res += vv * np.clip(1 - abs(pos - k), 0, 1)
            out[:, i0 - L:i0] = res
            # 2) reverb-tail freeze of the last beat (only the tail after T0)
            tl = lp(seg, 3500, 2)
            full = np.vstack([fftconvolve(tl[0], ir[0]), fftconvolve(tl[1], ir[1])])
            tail = full[:, L: L + int((h['dur'] + .1) * SR)]
            env = np.ones(tail.shape[1]); k = int(.25 * SR); env[-k:] = np.linspace(1, 0, k) ** 2
            # hold the tail with slow attack from the last sample so it 'freezes': time-stretch feel via slow decay
            dec = np.exp(-np.arange(tail.shape[1]) / SR / max(h['dur'] * 0.9, .5))
            add(fx, tail * env[None, :] * dec[None, :], T0, db(-13))
            # 3) riser + accent 0.25 s before the hold ends, music resumes on the beat at T1
            rs = riser(min(.30, h['dur'] * .8), r, 800, 9000, .55); add(fx, rs, T1 - rs.shape[1] / SR)
            add(fx, accent(r, .55), T1)
            add(fx, shimmer(max(h['dur'] - .1, .1), r), T0 + .05, db(-27 if h['dur'] < 1.1 else -25))    # hold tension/shimmer
            log.append((round(T0, 3), round(T1, 3), 'stop-time'))
        else:                                                    # interlude: music ducks out completely, resumes with a hit
            L = int(.10 * SR); out[:, i0 - L:i0] *= (np.linspace(1, 0, L) ** 2)[None, :]
            add(fx, accent(r, .9), T1)
            add(fx, riser(.30, r, 600, 8000, .5), T1 - .30)
            log.append((round(T0, 3), round(T1, 3), 'interlude-out'))
    return out, fx, log

def duck_curve(vo_dry):
    L = ctl_level_db(vo_dry, 30); act = (L > -50).astype(float)
    k = int(0.14 * CR); act = (np.convolve(act, np.ones(k), 'same') > 0).astype(float)
    d = smooth_ar(act, 35, 380); t = np.arange(len(d)) / CR
    def win(a, b, depth, ramp=0.15):
        return np.clip(np.minimum((t - (a - ramp)) / ramp, ((b + ramp) - t) / ramp), 0, 1) * depth
    ex = np.maximum.reduce([win(SIL0, IMPACT_T + 0.22, 1.0, .08), win(v2T(36.2), TOTAL, .70, .12)])
    return d * (1 - ex), act

# ------------------------------------------------------------------ SFX
def resolve_wav(nm):
    for d in (os.path.join(ROOT, 'sfx'), '/home/user/I/promo/audio/sfx', '/home/user/I/gotv/audio/sfx', '/home/user/I/anim/audio/sfx'):
        p = os.path.join(d, nm + '.wav')
        if os.path.exists(p): return p
    return None
def load_hits():
    hits = {}
    for d in ('/home/user/I/anim/audio/sfx', '/home/user/I/gotv/audio/sfx', '/home/user/I/promo/audio/sfx', os.path.join(ROOT, 'sfx')):
        if os.path.exists(d + '/hits.json'): hits.update(json.load(open(d + '/hits.json')))
    return hits
def load_cues(legacy=False):
    files = sorted(glob.glob(os.path.join(ROOT, 'cues4', '*.json'))) + [os.path.join(ROOT, 'cues', n) for n in ('host.json', 'fx.json')]
    if legacy: files += sorted(glob.glob(os.path.join(ROOT, 'cues', 'v*.json')))
    cues = []
    for f in files:
        if not os.path.exists(f): continue
        sc = os.path.basename(f)[:-5]
        try: data = json.load(open(f))
        except Exception as e: print('bad json', f, e); continue
        if isinstance(data, dict): data = data.get('cues', [])
        for c in data:
            c = dict(c); c['scene'] = sc; c.setdefault('gain_db', -10); c.setdefault('pan', 0.0)
            c['T_abs'] = float(c['t']) if c.get('T') else v2T(float(c['t']))
            cues.append(c)
    # wavs of interludes already hold their full design: drop overlapping cues (unless keep:true)
    out = []
    for c in cues:
        if any(a - 0.02 <= c['T_abs'] < b for a, b in INTERLUDES) and not c.get('keep') and c['scene'] not in ('host',):
            c['skip'] = 'inside interlude wav'
        out.append(c)
    if not any('impact' in c['sound'] and abs(c['T_abs'] - IMPACT_T) < 0.05 and not c.get('skip') for c in out):
        out.append({'t': IMPACT_T, 'T': True, 'T_abs': IMPACT_T, 'sound': 'impact_boom', 'desc': 'mixer-injected giant impact', 'gain_db': -3, 'pan': 0, 'scene': 'mixer'})
    out.sort(key=lambda c: c['T_abs']); return out

def ensure_sounds(cues):
    need = {}
    for c in cues:
        if c['gain_db'] <= -90 or c.get('skip'): continue
        if resolve_wav(c['sound']) is None: need.setdefault(c['sound'], c.get('desc', ''))
    if not need: return
    import special_sfx
    hp_ = os.path.join(ROOT, 'sfx', 'hits.json'); hits = json.load(open(hp_)) if os.path.exists(hp_) else {}
    for nm, desc in need.items():
        try: h = special_sfx.build(nm, desc, os.path.join(ROOT, 'sfx')); hits[nm] = round(float(h), 4); print('built', nm, h)
        except Exception as e: print('FAILED building', nm, e)
    json.dump(hits, open(hp_, 'w'), indent=1, sort_keys=True)

def build_sfx(cues, vo_dry):
    hits = load_hits(); cache = {}; items = []
    for c in cues:
        nm = c['sound']
        if c.get('skip'): continue
        if c['gain_db'] <= -90: c['skip'] = 'mute cue'; continue
        p = resolve_wav(nm)
        if p is None: c['skip'] = 'missing wav'; continue
        if nm not in cache:
            x, sr = sf.read(p, always_2d=True); assert sr == SR, p; x = x.T
            cache[nm] = np.vstack([x, x]) if x.shape[0] == 1 else x
        x = cache[nm]; h = hits.get(nm, 0.0); x = x[:, :int((h + maxlen(nm)) * SR)]
        a = int(max(h - .02, 0) * SR); seg = x[:, a:a + int(.6 * SR)]
        c['loud'] = c['gain_db'] + 10 * np.log10(np.mean(seg ** 2) + 1e-12)
        c['t'] = c['T_abs']; c['start'] = c['T_abs'] - h; c['len'] = x.shape[1] / SR; c['h'] = h; items.append(c)
    for c in items:
        x = cache[c['sound']]; e = np.sqrt(uniform_filter1d(np.mean(x ** 2, axis=0), 480)); idx = np.nonzero(e > e.max() * db(-25))[0]
        c['span'] = float(np.clip(idx[-1] / SR - c['h'], 0.08, 1.5)) if len(idx) else 0.1; c['red'] = 0.0
    for c in items:
        worst = 0
        for tt in np.arange(c['t'] - .03, c['t'] + c['span'], 0.04):
            louder = sum(1 for o in items if o is not c and o['loud'] > -30.0 and o['t'] - .03 <= tt <= o['t'] + o['span'] and (o['loud'] > c['loud'] or (o['loud'] == c['loud'] and id(o) < id(c))))
            worst = max(worst, louder)
        if worst >= MAX_LOUD_OVERLAP: c['red'] = max(-10.0, -2.5 * (worst - MAX_LOUD_OVERLAP + 1))
    vob = sosfilt(sos('bandpass', [300, 4000], 4), vo_dry[0])
    def hero(c): return ('impact' in c['sound'] or 'boom' in c['sound']) and abs(c['T_abs'] - IMPACT_T) < 0.06
    for c in items:
        c['vo_red'] = 0.0; c['boost'] = 5.0 if hero(c) and c['scene'] == 'mixer' else (2.0 if hero(c) else 0.0)
        if hero(c): continue
        i = int(c['t'] * SR); w = int(min(c['span'], 1.0) * SR) + 480
        v = np.sqrt(np.mean(vob[i:i + w] ** 2)) if i < NS else 0
        if v < 10 ** (-52 / 20): continue
        xb = sosfilt(sos('bandpass', [300, 4000], 4), cache[c['sound']][0]); a = int(max(c['h'] - .01, 0) * SR)
        sx = np.sqrt(np.mean(xb[a:a + w] ** 2)) * db(c['gain_db'] + c['red'] + SFX_GAIN + SFX_DUCK)
        over = 20 * np.log10(sx / v + 1e-9) + 6.0
        if over > 0: c['vo_red'] = -min(10.0, over)
    bus = np.zeros((2, NS))
    for c in items:
        x = cache[c['sound']][:, :int((c['h'] + maxlen(c['sound'])) * SR)]; L = x.shape[1]
        fo = min(int(.4 * SR), L // 3); x = x.copy(); x[:, L - fo:] *= np.cos(np.linspace(0, np.pi / 2, fo)) ** 2
        p = float(np.clip(c['pan'], -1, 1)); a = (p + 1) * np.pi / 4; g = np.array([np.cos(a), np.sin(a)]) * np.sqrt(2)
        if np.abs(x[0] - x[1]).max() > 1e-4 * np.abs(x).max(): g = np.array([min(1, 1 - p), min(1, 1 + p)])
        add(bus, x * g[:, None], c['start'], db(c['gain_db'] + c['red'] + c['vo_red'] + SFX_GAIN + c['boost']))
    return bus, items

# ------------------------------------------------------------------ master
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--legacy', action='store_true'); ap.add_argument('--out', default=os.path.join(ROOT, 'master.wav')); args = ap.parse_args()
    t = np.arange(NS) / SR
    vo_dry, vo_wet = build_vo(); duck, act = duck_curve(vo_dry)
    mraw, mfx, mlog = build_music_raw()
    lo = lp(mraw, 220, 2); rest = mraw - lo
    music = (lo * db(up(duck, NS) * DUCK_DB * .45) + rest * db(up(duck, NS) * DUCK_DB)) * db(MUSIC_GAIN) + mfx * db(MUSIC_GAIN + 8)
    cues = load_cues(args.legacy); ensure_sounds(cues)
    sfx, items = build_sfx(cues, vo_dry)
    sfx = sfx * db(up(duck, NS) * SFX_DUCK)
    # god intro (dominant, untouched) + interludes (own full design)
    god = load(os.path.join(ROOT, 'god', 'god_intro.wav')); bed = np.zeros((2, NS)); add(bed, god, 0.0, db(GOD_GAIN_DB))
    inter = np.zeros((2, NS))
    for fn, T0 in INTERLUDE_WAVS:
        p = os.path.join(ROOT, fn)
        if os.path.exists(p): add(inter, load(p), T0, db(INTER_GAIN_DB))
    # drop at T=7.0: sub boom + hit (film start), only after the god intro tail
    drop = np.zeros((2, NS)); r = np.random.default_rng(7)
    pth = resolve_wav('impact_boom'); hh = load_hits().get('impact_boom', 0.0)
    if pth:
        x = load(pth)[:, :int((hh + 2.2) * SR)]; x[:, -int(.5 * SR):] *= np.linspace(1, 0, int(.5 * SR)); add(drop, x, INTRO_END - hh, db(-9))
    add(drop, accent(r, .9), INTRO_END)
    # digital silence mask
    def mask():
        m = np.ones(NS); m[(t >= SIL0) & (t < SIL1)] = 0
        pre = (t >= SIL0 - 0.006) & (t < SIL0); m[pre] = np.linspace(1, 0, pre.sum())
        post = (t >= SIL1) & (t < SIL1 + 0.0005); m[post] = np.linspace(0.3, 1, post.sum()); return m
    M = mask()
    mix = (vo_dry + vo_wet) + music + sfx + bed + inter + drop
    mix *= M[None, :]
    mix, gr = compress(mix, -20, 1.8, 30, 220, 0.0, knee=6, win=30); mix = hp(mix, 30, 2)
    gain = 0.0
    for it in range(8):
        y = limiter(mix * db(gain)) * M[None, :]; cur = lufs(y)
        if abs(cur - TARGET_LUFS) < 0.08: break
        gain += TARGET_LUFS - cur
    fin = np.ones(NS); f0 = TOTAL - 0.30; sel = t >= f0; fin[sel] = np.cos(np.linspace(0, np.pi / 2, sel.sum())) ** 2; fin[-1] = 0.0
    y = fitn(y * fin[None, :] * M[None, :], NS)
    sf.write(args.out, y.T, SR, subtype='PCM_24')
    print(f'gain {gain:+.2f} dB, glue GR max {gr.max():.1f} dB, cues used {sum(1 for c in items)}/{len(cues)}, T impact {IMPACT_T:.3f}, silence {SIL0:.3f}-{SIL1:.3f}')
    np.savez_compressed(os.path.join(ROOT, '_mix_stems_v4.npz'), vo=(vo_dry + vo_wet).astype(np.float32), music=music.astype(np.float32), sfx=sfx.astype(np.float32),
                        inter=(inter + bed).astype(np.float32), act=act, duck=duck)
    json.dump({'music_holds': mlog, 'cues': [{k: v for k, v in c.items() if k in ('scene', 'sound', 'T_abs', 'gain_db', 'red', 'vo_red', 'boost', 'skip', 'loud')} for c in cues]},
              open(os.path.join(ROOT, '_mix_cues_v4.json'), 'w'), indent=0, default=float)
    return y

if __name__ == '__main__':
    main()
