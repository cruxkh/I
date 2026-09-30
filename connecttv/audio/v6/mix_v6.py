#!/usr/bin/env python3
"""
GOTV v6 final mix -> master_v6.wav (40.000 s, 48 kHz stereo, 24-bit, -14 LUFS integrated, <= -1 dBTP)

    python3 mix_v6.py            # uses score.wav if present, otherwise mixes VO + SFX only (test)

Buses
  VO     vo_original_tts.wav (44.1k mono) -> 48k (polyphase, Kaiser beta 14), 70 Hz 2nd-order high-pass, centred.
  MUSIC  score.wav, ducked 8 dB under speech: word-timed envelope, 150 ms look-ahead attack, 400 ms release.
  SFX    cue sheet below (v6/sfx + the PACKET FROM HOME library), placed at t = sync - hit.
         A VO-protect rider (K-weighted, 200 ms, look-ahead) keeps the SFX bus >= 5 dB under the voice wherever a
         word is sounding; hits placed in speech gaps are untouched.
  Digital silence 25.320 -> 25.640 on every bus; the biggest hit starts on sample 25.640.
Master: static gain -> true-peak look-ahead limiter (5 ms look-ahead, 4x oversampled peak detection,
        150 ms release) -> gain iterated to -14.0 LUFS.  No compressors / loudness normalisers.
"""
import os
import re
import sys
import json
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import resample_poly, butter, sosfilt, sosfiltfilt, lfilter
from scipy.ndimage import minimum_filter1d, uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sfx_v6 as S  # noqa: E402

SR = 48000
DUR = 40.0
NS = int(DUR * SR)
LIBDIR = '/home/user/I/anim/audio/sfx'
SIL0, SIL1 = 25.32, 25.64
OUT = os.path.join(HERE, 'master_v6.wav')
SCORE = os.path.join(HERE, 'score.wav')
TARGET_LUFS = -14.0
CEIL_DBTP = -1.25


def db(x):
    return 10 ** (x / 20)


def words():
    s = open('/home/user/I/gotv5/words.js').read()
    return json.loads(s[s.index('['):s.rindex(']') + 1])


# ------------------------------------------------------------------ key detection (pitched SFX follow the score)
PC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def chroma(x, t0, t1):
    a, b = max(0, int(t0 * SR)), min(len(x), int(t1 * SR))
    seg = x[a:b]
    if len(seg) < 4096:
        return np.zeros(12)
    seg = seg * np.hanning(len(seg))
    X = np.abs(np.fft.rfft(seg))
    f = np.fft.rfftfreq(len(seg), 1 / SR)
    m = (f > 55) & (f < 2000)
    pcs = (np.round(12 * np.log2(f[m] / 440.0)) + 9) % 12
    c = np.bincount(pcs.astype(int), weights=X[m] ** 2, minlength=12)
    return c / (c.sum() + 1e-12)


def best_triad(c, allowed=None):
    best = None
    for r in range(12):
        for q, iv in (('maj', (0, 4, 7)), ('min', (0, 3, 7))):
            if allowed is not None and (r, q) not in allowed:
                continue
            s = sum(c[(r + i) % 12] for i in iv) - 0.5 * sum(c[(r + i) % 12] for i in range(12) if i not in iv) / 9
            if best is None or s > best[0]:
                best = (s, r, q)
    return best[1], best[2]


def near(pc, center):
    """midi note with pitch class pc nearest to center"""
    base = center - ((center - pc) % 12)
    return base if center - base <= 6 else base + 12


# ------------------------------------------------------------------ sound loading
_HITS_LIB = json.load(open(os.path.join(LIBDIR, 'hits.json')))
_HITS_V6 = {k: v['hit'] for k, v in S.REG.items()}
_CACHE = {}


def sound(name, root=None):
    key = (name, root)
    if key in _CACHE:
        return _CACHE[key]
    if name.startswith('lib:'):
        nm = name[4:]
        x, sr = sf.read(os.path.join(LIBDIR, nm + '.wav'), always_2d=True)
        x, hit = x.T, _HITS_LIB[nm]
    else:
        x, hit = S.build(name, root, write=False), _HITS_V6[name]
    _CACHE[key] = (x, hit)
    return x, hit


def vary(x, ratio):
    """varispeed (pitch+time) by ratio, linear-interp resample (tiny ratios only)"""
    if ratio == 1.0:
        return x
    n = int(x.shape[1] / ratio)
    pos = np.arange(n) * ratio
    return np.vstack([np.interp(pos, np.arange(x.shape[1]), c) for c in x])


def place(bus, x, t, gain_db=0.0, pan=0.0, seg=None, fin=0.0, fout=0.0):
    x = np.atleast_2d(x).astype(float)
    if seg:
        x = x[:, int(seg[0] * SR):int(seg[1] * SR)]
    if fin or fout:
        x = x.copy()
        if fin:
            k = int(fin * SR)
            x[:, :k] *= np.sin(np.linspace(0, np.pi / 2, k)) ** 2
        if fout:
            k = int(fout * SR)
            x[:, -k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    if x.shape[0] == 1:
        a = (np.clip(pan, -1, 1) + 1) * np.pi / 4
        x = np.vstack([x[0] * np.cos(a), x[0] * np.sin(a)]) * np.sqrt(2)
    elif pan:
        x = x * np.array([[min(1, 1 - pan)], [min(1, 1 + pan)]])
    i = int(round(t * SR))
    if i < 0:
        x, i = x[:, -i:], 0
    L = min(x.shape[1], bus.shape[1] - i)
    if L > 0:
        bus[:, i:i + L] += db(gain_db) * x[:, :L]


# ------------------------------------------------------------------ CUE SHEET
# (sync time, sound, gain dB, pan, extra)  -- sync = the visual event; the file's hit offset is subtracted.
def cue_sheet(key):
    R = key['root']            # {'brass': midi, 'riser': midi, 'chime': (midi, quality), 'ding': [midis]}
    C = []

    def c(t, nm, g=0.0, p=0.0, **kw):
        C.append(dict(t=t, nm=nm, g=g, p=p, **kw))
    # ---- S0 hook
    c(1.95, 'wipe_whoosh_c', -9, 0.0, var=0.8)                 # TV falls onto the desk
    c(1.98, 'boom_med', -1)                                      # IMPACT: TV slam ("במקום")
    c(2.46, 'stamp_thud', -3, 0.1)                               # IMPACT: "אחד" title slam
    c(3.48, 'riser_short', -7, root=R['riser'])                  # riser -> 0.10 s gap -> reveal
    c(3.58, 'boom_med_b', 0)                                     # IMPACT: GOTV logo
    c(3.58, 'brass_stab', -1, root=R['brass'][0])                # REVEAL brass: GOTV logo
    c(4.28, 'win_chime', -3, root=R['chime'][0])                 # WIN: check mark
    # ---- S1 live + OTT
    c(4.93, 'wipe_whoosh_c', -3, -0.1)                           # sheet slides up
    c(5.00, 'card_tap', -9, 0.0, var=0.85)                       # TV drops in
    c(5.05, 'paper_pop', -12, -0.4)                              # LIVE tag
    c(5.28, 'flick', -13, -0.5)                                  # channel cards fly in
    c(5.62, 'flick', -14, 0.5, var=1.08)
    c(6.00, 'flick', -14, 0.0, var=0.94)
    c(6.70, 'wipe_whoosh_a', -2)                                 # red wipe (speech gap)
    c(7.02, 'boom_med', -1)                                      # IMPACT: Netflix stamp
    c(7.02, 'brass_stab', -1, root=R['brass'][1])                # REVEAL brass: Netflix
    c(8.10, 'flick', -14, 0.0, var=0.9)                          # Netflix slides up
    c(8.24, 'flick', -12, 0.5)                                   # Disney flies in
    c(8.32, 'stamp_thud_b', -7, 0.1)                             # Disney slap
    c(8.36, 'lib:confetti_popper', -13, 0.0)                     # + confetti
    c(8.52, 'flick', -13, 0.0, var=1.1)                          # Apple TV flips up
    # ---- S2 sports
    c(8.95, 'wipe_whoosh_c', -3)                                 # pitch wipe (speech gap)
    for i, t0 in enumerate((9.02, 9.26, 9.47, 9.68, 9.9)):       # five sport cards, soft taps
        c(t0 + 0.1, 'card_tap', -15 + (2 if i == 4 else 0), [-0.3, 0.3, -0.2, 0.2, 0.0][i], var=[1.0, 1.06, 0.95, 1.1, 0.9][i])
    c(10.40, 'boom_med', -2)                                     # IMPACT: Sport 5 hero burst
    c(10.40, 'lib:stadium_goal_eruption', -12, 0.0, seg=(0.0, 1.6), fout=0.7)   # short cheer
    c(10.50, 'lib:whip_pan', -11)                                # cards blown away
    c(11.11, 'boom_med_b', -1)                                   # IMPACT: Charlton slam
    # ---- S3 series
    c(11.95, 'wipe_whoosh_b', -2)                                # torn wipe (speech gap)
    c(12.39, 'stamp_thud', -4, -0.2)                             # IMPACT: Turkish poster
    c(13.095, 'stamp_thud_b', -4, 0.2)                           # IMPACT: Korean poster
    c(13.99, 'flick', -9, 0.0)                                   # anime poster flip
    c(14.84, 'wipe_whoosh_a', -8)                                # avalanche
    c(15.15, 'wipe_whoosh_b', -10)                               # second wave
    rr = np.random.default_rng(7)
    for k in range(14):                                          # soft landings of the avalanche posters
        c(14.98 + k * 0.022 + rr.uniform(0, 0.012) + (0.3 if k >= 8 else 0), 'card_tap', -22 + rr.uniform(-2, 1),
          rr.uniform(-0.7, 0.7), var=rr.uniform(0.9, 1.2))
    # ---- S4 library
    c(15.72, 'wipe_whoosh_c', -3)                                # sheet rises (speech gap)
    for k in range(7):                                           # calendar: day page -> UI click, NEW stamp -> ding
        tk = 16.72 + 0.24 * k
        c(tk, 'ui_click', -11, [-0.3, 0.3][k % 2])
        c(tk + 0.10, 'notif_ding', -15 + k * 0.4, [-0.2, 0.2][k % 2], root=R['ding'][k])
    c(18.70, 'lib:whip_pan', -9)                                 # calendar flies off (speech gap)
    c(19.54, 'lib:tv_unfreeze_pop', -9)                          # gift box pops open
    c(19.77, 'boom_med', -2)                                     # IMPACT: giant NEW stamp
    c(19.80, 'lib:wa_receive', -9)                               # NOTIFY: "ba-ding"
    c(20.05, 'camera_shutter', -6, 0.15)                         # the eye: camera shutter
    # ---- S5 live / fast / smooth / held breath
    c(20.64, 'wipe_whoosh_b', -3)                                # wipe (speech gap)
    c(22.15, 'wipe_whoosh_c', -9)                                # wipe
    c(22.75, 'lib:zip_streak', -11)                              # speed jump
    c(23.12, 'wipe_whoosh_a', -9)                                # wipe
    c(23.92, 'curtain_swoosh', -5)                               # curtains close
    c(23.97, 'stamp_thud', -4)                                   # curtains meet (speech gap)
    c(25.32, 'riser_long', -2, root=R['riser'])                  # TRANSITION riser -> silence -> drop
    c(25.64, 'boom_big', 0, m_all=2.0, m_hi=5.0)                           # THE BIG ONE (sub/kick may sit level with "אין";
                                                                 #  its speech band stays >= 8 dB under the voice)
    c(25.82, 'boom_med_b', -3)                                   # IMPACT: stamp 2
    c(26.52, 'boom_med', -2)                                     # IMPACT: period dot + flash
    # ---- S6 freeze / goal
    c(27.22, 'wipe_whoosh_c', -12)                               # wipe
    c(27.19, 'glitch_freeze', -4)                                # GLITCH + tape stop (wheel freezes 27.41)
    c(27.50, 'record_scratch_v6', -2)                            # SCRATCH: TV crossed out
    c(27.80, 'paper_tear', -16, 0.1)                             # TV torn in half (quiet)
    c(28.12, 'lib:whip_pan', -9)                                 # wipe to the match
    c(28.10, 'lib:tv_crowd_live', -12, seg=(5.95, 7.10), fin=0.15, fout=0.05)   # match crowd rising
    c(28.85, 'lib:ball_kick', -7, 0.2)                           # the strike
    c(29.25, 'boom_med_b', -4)                                   # IMPACT: goal
    c(29.25, 'lib:ball_net_swish', -7, 0.3)
    c(29.25, 'lib:stadium_goal_eruption', -2, seg=(0.0, 2.9), fout=1.1)       # CROWD ROAR + goal eruption
    c(29.60, 'paper_pop', -10)                                   # press blob
    c(30.05, 'wipe_whoosh_a', -5)                                # wipe (speech gap)
    # ---- S7 press
    c(30.34, 'remote_click', -3)                                 # UI: remote button
    c(31.12, 'tv_power_on', -4)                                  # TV power-on
    c(31.12, 'lib:confetti_popper', -14, 0.0)
    c(31.20, 'paper_pop', -11)                                   # play icon
    c(32.18, 'wipe_whoosh_b', -9)                                # wipe
    for i, t0 in enumerate((32.2, 32.42, 32.64)):
        c(t0, 'card_tap', -13, [-0.4, 0.4, 0.0][i], var=[1.0, 1.08, 0.94][i])
    c(33.44, 'lib:ball_kick', -8)                                # football lands (shake)
    c(33.44, 'stamp_thud_b', -10)
    c(33.55, 'paper_pop', -13, -0.4)
    c(33.95, 'paper_pop', -13, -0.3, var=1.1)
    c(34.04, 'lib:ball_kick', -16, 0.0)                          # ball bounces
    c(34.30, 'paper_pop', -13, 0.4, var=0.92)
    c(34.64, 'lib:ball_kick', -18, 0.0)
    c(35.20, 'wipe_whoosh_a', -9)                                # wipe
    c(35.21, 'stamp_thud_b', -6)                                 # thumbs sticker slams
    c(35.21, 'lib:confetti_popper', -14)
    c(35.63, 'win_chime', -3, root=R['chime'][1])                # WIN: check badge
    c(36.00, 'paper_pop', -13, 0.0, var=0.9)                     # wheel appears
    c(36.39, 'record_scratch_v6b', -2)                           # SCRATCH: buffering wheel crossed out
    # ---- S8 end card
    c(37.08, 'boom_med', -8)                                      # IMPACT: end logo slam
    c(37.08, 'brass_stab', -5, root=R['brass'][2])                # REVEAL brass: end card logo
    c(37.08, 'lib:confetti_popper', -10)
    c(37.45, 'paper_pop', -9)                                    # tagline
    c(37.65, 'card_tap', -9, 0.0, var=0.9)                       # smart TV
    c(37.95, 'ui_click', -6)                                     # install icon
    c(38.90, 'win_chime', -10, root=R['chime'][2])               # install check
    c(38.90, 'lib:confetti_popper', -15)
    return C


# ------------------------------------------------------------------ DSP helpers
def kw(x):
    """K-weighting (BS.1770 pre-filter + RLB high-pass), per channel"""
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    x = np.atleast_2d(x)
    return np.vstack([lfilter(b2, a2, lfilter(b1, a1, ch)) for ch in x])


def loud_curve(x, win):
    """short-term K-weighted power in dB (sum of channels), window `win` s, per sample"""
    p = np.sum(kw(x) ** 2, axis=0)
    p = uniform_filter1d(p, int(win * SR), mode='constant')
    return 10 * np.log10(p + 1e-12) - 0.691


def smooth_gain(g_db, look=0.03, rel=0.25, step=48):
    """gain-reduction smoother: block-min at control rate, look-ahead min + boxcar attack, exponential release"""
    n = len(g_db)
    m = n // step
    g = g_db[:m * step].reshape(m, step).min(1)
    lk = max(1, int(look * SR / step))
    g = minimum_filter1d(g, lk + 1, origin=-(lk // 2))
    a = np.exp(-1 / (rel * SR / step))
    out = np.empty_like(g)
    prev = 0.0
    for i, v in enumerate(g):
        prev = v if v < prev else a * prev + (1 - a) * v
        out[i] = prev
    out = uniform_filter1d(out, lk + 1, origin=lk // 2)
    return np.interp(np.arange(n), np.arange(m) * step + step / 2, out)


def true_peak(x):
    return max(np.max(np.abs(resample_poly(ch, 4, 1))) for ch in np.atleast_2d(x))


def limiter(x, ceil_db, look=0.005, rel=0.15):
    """true-peak look-ahead brickwall limiter: 4x oversampled peak detector, gain = look-ahead minimum,
    instant attack spread over the look-ahead by a boxcar, exponential release. No make-up, no knee games."""
    ceil = db(ceil_db)
    up = np.max(np.abs(np.vstack([resample_poly(ch, 4, 1) for ch in x])), axis=0)
    pk = np.max(up[:4 * x.shape[1]].reshape(-1, 4), axis=1)
    pk = np.maximum(pk, np.max(np.abs(x), axis=0))
    req = np.minimum(1.0, ceil / (pk + 1e-12))
    L = int(look * SR)
    h = minimum_filter1d(req, L + 1, origin=-(L // 2))          # min over [n, n+L]
    idx = np.nonzero(h < 1.0)[0]
    g = np.ones_like(h)
    if len(idx):
        a = np.exp(-1 / (rel * SR))
        prev = 1.0
        # exponential release, instant attack (loop only over the active region + tail)
        start = idx[0]
        for i in range(start, len(h)):
            v = h[i]
            prev = v if v < prev else a * prev + (1 - a) * v
            g[i] = prev
            if prev > 0.99999 and i > idx[-1]:
                break
    g = uniform_filter1d(g, L + 1, origin=L // 2)            # average over [n-L, n] -> reaches the min at the peak
    g = np.minimum(g, 1.0)
    return x * g, g


# ------------------------------------------------------------------ main
def main():
    have_score = os.path.exists(SCORE)
    W = words()
    # ---- VO
    vo, sr = sf.read(os.path.join(HERE, 'vo_original_tts.wav'))
    vo = resample_poly(vo, 160, 147, window=('kaiser', 14.0))
    vo = sosfilt(butter(2, 70, 'highpass', fs=SR, output='sos'), vo)
    VO = np.zeros((2, NS))
    L = min(NS, len(vo))
    VO[0, :L] = vo[:L]
    VO[1, :L] = vo[:L]
    # ---- MUSIC + key analysis
    MU = np.zeros((2, NS))
    root = dict(brass=[50, 50, 50], riser=62, chime=[(74, 'maj')] * 3, ding=[81, 83, 85, 88, 90, 93, 95])
    keyinfo = 'default D major (no score)'
    if have_score:
        m, msr = sf.read(SCORE, always_2d=True)
        m = m.T
        if msr != SR:
            from math import gcd
            gg = gcd(SR, msr)
            m = np.vstack([resample_poly(ch, SR // gg, msr // gg, window=('kaiser', 14.0)) for ch in m])
        if m.shape[0] == 1:
            m = np.vstack([m[0], m[0]])
        MU[:, :min(NS, m.shape[1])] = m[:, :NS]
        mono = MU.mean(0)
        gk, gq = best_triad(chroma(mono, 0, DUR))
        dia = [((gk + d) % 12, qq) for d, qq in (((0, 'maj'), (2, 'min'), (4, 'min'), (5, 'maj'), (7, 'maj'), (9, 'min'))
                                               if gq == 'maj' else ((0, 'min'), (3, 'maj'), (5, 'min'), (7, 'min'), (8, 'maj'), (10, 'maj')))]
        loc = lambda t: best_triad(chroma(mono, t - 0.05, t + 0.9), dia)     # diatonic chords of the score's key only
        b = [near(loc(t)[0], 50) for t in (3.58, 7.02, 37.08)]
        ch = [(near(loc(t)[0], 74), loc(t)[1]) for t in (4.28, 35.63, 38.9)]
        scale = [0, 2, 4, 7, 9] if gq == 'maj' else [0, 3, 5, 7, 10]
        d0 = near(gk, 77)
        ding = [d0 + 12 * (k // 5) + scale[k % 5] for k in range(7)]
        root = dict(brass=b, riser=near(gk, 62), chime=ch, ding=ding)
        keyinfo = 'score key %s %s; brass roots %s; chimes %s' % (PC[gk], gq, [PC[x % 12] for x in b],
                                                                   [(PC[x % 12], q) for x, q in ch])
    # ---- SFX bus
    # ---- speech activity (word timing), bridged over short gaps
    t = np.arange(NS) / SR
    segs = []
    for w in W:
        a, b = w['t0'], w['t1']
        if segs and a - segs[-1][1] < 0.30:
            segs[-1][1] = max(segs[-1][1], b)
        else:
            segs.append([a, b])
    speech = np.zeros(NS, bool)
    for a, b in segs:
        speech[int(a * SR):int(b * SR)] = True
    vo_l4 = loud_curve(VO, 0.4)
    inword = np.zeros(NS, bool)                  # raw word intervals (no gap bridging)
    for w in W:
        inword[int(w['t0'] * SR):int(w['t1'] * SR)] = True
    # a word is "sounding" where it is inside a word interval and the VO momentary (400 ms) is within 9 dB of that
    # phrase's integrated VO loudness (syllable cores, not the decays into silence)
    meter0 = pyln.Meter(SR)
    thr = np.full(NS, 0.0)
    phr = {}
    for w in W:
        phr.setdefault(w['ph'], []).append(w)
    for ws in phr.values():
        a_, b_ = int(ws[0]['t0'] * SR), int(ws[-1]['t1'] * SR)
        p_ = max(0, int((0.45 * SR - (b_ - a_)) / 2))
        thr[a_:b_] = meter0.integrated_loudness(VO[:, a_ - p_:b_ + p_].T) - 9.0
    sounding = inword & (vo_l4 > thr)
    # per-word VO reference: the word's momentary (400 ms) maximum; SFX over a word are judged against it
    REF = np.full(NS, 99.0)
    for w in W:
        a_, b_ = int(w['t0'] * SR), max(int(w['t1'] * SR), int(w['t0'] * SR) + 1)
        REF[a_:b_] = np.minimum(REF[a_:b_], vo_l4[a_:b_].max())

    # ---- SFX bus with per-cue VO protection (sequential, in time order).
    #   Every cue gets a static gain chosen so that, wherever a word is sounding, the SFX bus (all cues so far + this
    #   one; K-weighted, 200 ms) stays >= M_HI dB under the voice in the speech band (> 200 Hz, the part that could
    #   mask words) and >= M_ALL dB under it full-band (sub/kick included).  If the cue's hit lands in a speech gap,
    #   only its tail (from 50 ms before the next word) is tucked under, with a 60 ms raised-cosine ramp, so the
    #   transient keeps its full punch.  If the bus is already over the line before this cue, the cue may not
    #   raise it by more than 0.5 dB.  Nothing here is time-varying compression: one or two static gains per cue.
    SFX_BUS_DB = 0.0
    M_HI, M_ALL = 7.0, 5.0
    WIN = 0.4
    sos_lo = butter(4, 200, 'lowpass', fs=SR, output='sos')
    LO = np.zeros((2, NS))
    HI = np.zeros((2, NS))
    cues = cue_sheet(dict(root=root))
    order = sorted(range(len(cues)), key=lambda k: cues[k]['t'])
    pad = int(0.25 * SR)
    ramp_n = int(0.06 * SR)
    for k in order:
        q = cues[k]
        x, hit = sound(q['nm'], q.get('root'))
        if q.get('var'):
            x = vary(x, q['var'])
            hit = hit / q['var']
        seg = q.get('seg')
        t_start = q['t'] - hit + (seg[0] if seg else 0)
        L_ = (int((seg[1] - seg[0]) * SR) if seg else x.shape[1])
        i0_ = max(0, int(t_start * SR) - pad)
        i2_ = min(NS, int(t_start * SR) + L_ + pad)
        loc = np.zeros((2, i2_ - i0_))
        place(loc, x, t_start - i0_ / SR, q['g'] + SFX_BUS_DB, q['p'], seg=seg, fin=q.get('fin', 0),
              fout=q.get('fout', 0))
        lo_ = sosfilt(sos_lo, loc)
        hi_ = loc - lo_
        V = REF[i0_:i2_]
        m = inword[i0_:i2_]
        onset = min(max(0, int(q['t'] * SR) - i0_), i2_ - i0_ - 1)
        Ehi, Elo = HI[:, i0_:i2_], LO[:, i0_:i2_]
        Et = Ehi + Elo
        hib = lambda z: z - sosfilt(sos_lo, z)            # speech-band view of the actual summed signal
        base_hi = loud_curve(hib(Et), WIN)
        base_all = loud_curve(Et, WIN)

        def solve(test):
            if test(0.0):
                return 0.0
            lo_g, hi_g = -36.0, 0.0
            for _ in range(8):
                mid = 0.5 * (lo_g + hi_g)
                lo_g, hi_g = (mid, hi_g) if test(mid) else (lo_g, mid)
            return lo_g

        lim_h = np.maximum(V - q.get('m_hi', M_HI), base_hi + 0.25)
        lim_a = np.maximum(V - q.get('m_all', M_ALL), base_all + 0.25)
        lim_a_tail = np.maximum(V - M_ALL, base_all + 0.25)          # a hit-only exception never extends to its tail

        def ok(l, lim, mm):
            return np.all(l[mm] <= lim[mm] + 0.05)
        # two segments per cue: the hit (from the file start to 120 ms after the sync point) and the tail (after a
        # 60 ms ramp).  1) one gain for the whole cue, judged from the file start to 300 ms after the sync;
        # 2) an extra gain for the tail only, judged on every sounding word it overlaps.
        nL = i2_ - i0_
        tw = np.zeros(nL)
        c0 = onset + int(0.12 * SR)
        if c0 < nL:
            r_ = min(ramp_n, nL - c0)
            tw[c0:c0 + r_] = np.sin(np.linspace(0, np.pi / 2, r_)) ** 2
            tw[c0 + r_:] = 1.0
        hw = 1.0 - tw
        m_near = m.copy()                                   # samples the hit itself is judged on
        m_near[:max(0, min(onset - int(0.1 * SR), int(t_start * SR) - i0_))] = False
        m_near[min(nL, onset + int(0.3 * SR)):] = False
        Hh = Ah = Eh = Ea = 0.0
        both = lambda z, lim_all: ok(loud_curve(hib(z), WIN), lim_h, mm_) and ok(loud_curve(z, WIN), lim_all, mm_)
        mm_ = m_near
        if m_near.any():                                    # 1) whole-cue gain, judged around the hit
            Ah = solve(lambda G: both(Et + loc * db(G), lim_a))
        if m.any():                                         # 2) extra tuck of the tail only (never raises it)
            mm_ = m
            lim_at = np.where(tw > 0.5, lim_a_tail, lim_a)
            Ea = solve(lambda G: both(Et + loc * db(Ah) * (hw + tw * db(G)), lim_at))
        wa = db(Ah) * (hw + tw * db(Ea))
        wh = wa
        head = hw
        q['prot'] = (Hh + Ah, Hh + Ah + Eh + Ea, True)
        LO[:, i0_:i2_] += lo_ * wa
        HI[:, i0_:i2_] += hi_ * wh
        if os.environ.get('DEBUG_T'):
            td = int(float(os.environ['DEBUG_T']) * SR) - i0_
            if 0 <= td < nL:
                print('DBG %-22s t=%.2f hi-alone %.1f  bus-hi(hib) %.1f  lim_h %.1f REF %.1f  gains %s' % (
                    q['nm'], q['t'], loud_curve(hi_ * wh, WIN)[td], loud_curve(hib(HI[:, i0_:i2_] + LO[:, i0_:i2_]), WIN)[td], lim_h[td], V[td],
                    q['prot']))
    SFX = sosfilt(butter(2, 22, 'highpass', fs=SR, output='sos'), LO + HI)
    exempt = np.zeros(NS, bool)
    for q in cues:
        if 'm_all' in q:
            exempt[int(q['t'] * SR):int((q['t'] + 0.6) * SR)] = True

    # ---- music ducking (8 dB under speech, 150 ms look-ahead attack, 400 ms release)
    duck = np.zeros(NS)
    for a, b in segs:
        d = np.interp(t, [a - 0.15, a, b, b + 0.40], [0, 1, 1, 0], left=0, right=0)
        duck = np.maximum(duck, d)
    duck = 0.5 - 0.5 * np.cos(np.pi * duck)            # raised-cosine ramps
    MUSIC_DB = -6.0
    MU = MU * db(MUSIC_DB - 8.0 * duck)

    # ---- silence window
    mask = np.ones(NS)
    i0, i1 = int(round(SIL0 * SR)), int(round(SIL1 * SR))
    k = int(0.012 * SR)
    mask[i0 - k:i0] = np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    mask[i0:i1] = 0.0
    for B in (VO, MU, SFX):
        B *= mask
    # end fade
    fo = int(0.35 * SR)
    for B in (VO, MU, SFX):
        B[:, -fo:] *= np.cos(np.linspace(0, np.pi / 2, fo)) ** 2

    # ---- master: static gain -> TP limiter, iterate gain to target
    meter = pyln.Meter(SR)
    mix = VO + MU + SFX
    g = 0.0
    for it in range(8):
        y, gl = limiter(mix * db(g), CEIL_DBTP)
        y *= mask
        Lm = meter.integrated_loudness(y.T)
        if abs(Lm - TARGET_LUFS) < 0.02:
            break
        g += TARGET_LUFS - Lm
    tp = 20 * np.log10(true_peak(y) + 1e-12)
    # 24-bit quantisation check
    sf.write(OUT, y.T.astype(np.float64), SR, subtype='PCM_24')
    chk, _ = sf.read(OUT, always_2d=True)
    chk = chk.T

    # ---------------------------------------------------------------- verification
    print('=' * 78)
    print('score.wav:', 'YES' if have_score else 'NO (test mix, VO + SFX only)', '|', keyinfo)
    print('master: %s  %d samples = %.3f s, %d ch, %d Hz, PCM_24' % (OUT, chk.shape[1], chk.shape[1] / SR, chk.shape[0], SR))
    print('integrated %.2f LUFS | true peak %.2f dBTP | sample peak %.2f dBFS | clipped samples %d'
          % (meter.integrated_loudness(chk.T), 20 * np.log10(true_peak(chk)), 20 * np.log10(np.max(np.abs(chk))),
             int(np.sum(np.abs(chk) >= 0.99999))))
    gr = -20 * np.log10(gl)
    print('master gain %+.2f dB | limiter GR max %.2f dB, >1 dB for %.2f s, >3 dB for %.3f s'
          % (g, gr.max(), np.sum(gr > 1) / SR, np.sum(gr > 3) / SR))
    sil = chk[:, i0:i1]
    print('silence %.3f-%.3f: max |x| = %.3g (%s) | first non-zero sample after: %.5f s'
          % (SIL0, SIL1, np.max(np.abs(sil)), 'DIGITAL ZERO' if np.max(np.abs(sil)) == 0 else 'NOT ZERO',
             (i1 + np.argmax(np.any(chk[:, i1:] != 0, axis=0))) / SR))
    print('SFX bus peak %.1f dBFS pre-master; cues %d; hit tucked under the voice: %d; tail tucked: %d'
          % (20 * np.log10(np.max(np.abs(SFX)) + 1e-12), len(cues), sum(q['prot'][0] < -0.5 for q in cues),
             sum(q['prot'][1] < -0.5 for q in cues)))
    print('per-cue VO protection, dB (hit / tail, speech-band+whole):  ' + '  '.join(
        '%.2f %s %.0f/%.0f' % (q['t'], q['nm'].replace('lib:', '')[:12], q['prot'][0], q['prot'][1])
        for q in cues if min(q['prot'][:2]) < -0.5))
    # per-phrase VO vs bed
    gm = db(g)
    VOf, BED = VO * gm * mask, (MU + SFX) * gm * mask
    vl, bl = loud_curve(VOf, 0.4), loud_curve(BED, 0.4)
    sl, ml = loud_curve(SFX * gm * mask, 0.4), loud_curve(MU * gm * mask, 0.4)
    bh = BED - sosfilt(sos_lo, BED)
    blh = loud_curve(bh, 0.4)
    ph = {}
    for w in W:
        ph.setdefault(w['ph'], []).append(w)
    print('phrase window        | VO LUFS | integrated over phrase (LU): VO-bed  VO-SFX  VO-music '
          '| worst word (VO word-max minus layer max over the word, momentary 400 ms): bed  SFX  SFX>200Hz  music')
    S_ = SFX * gm * mask
    sh_ = loud_curve(S_ - sosfilt(sos_lo, S_), 0.4)
    W_all = []
    lowwords = []
    for k_, ws in ph.items():
        a, b = ws[0]['t0'], ws[-1]['t1']
        ia, ib = int(a * SR), int(b * SR)
        pad = max(0, int((0.45 - (b - a)) * SR / 2))
        I = lambda X: meter.integrated_loudness(X[:, ia - pad:ib + pad].T)
        v, bb, ss, mm = I(VOf), I(BED), I(S_), I(MU * gm * mask)
        mins = [99.0] * 4
        for w in ws:
            wa_, wb_ = int(w['t0'] * SR), max(int(w['t1'] * SR), int(w['t0'] * SR) + 1)
            vm = vl[wa_:wb_].max()
            for j, X in enumerate((bl, sl, sh_, ml)):
                mins[j] = min(mins[j], vm - X[wa_:wb_].max())
            if vm - sh_[wa_:wb_].max() < 4.0 or vm - sl[wa_:wb_].max() < 4.0:
                lowwords.append('%s@%.2f(SFX %.1f, >200Hz %.1f at %.2f)' % (w['w'], w['t0'], vm - sl[wa_:wb_].max(),
                                vm - sh_[wa_:wb_].max(), (wa_ + np.argmax(sh_[wa_:wb_])) / SR))
        W_all.append(mins)
        print('%3d %6.2f-%6.2f | %6.1f  |                           %6.1f  %6.1f  %6.1f   '
              '|                                                            %5.1f %5.1f  %5.1f     %5.1f   %s'
              % (k_, a, b, v, v - bb, v - ss, v - mm, *mins, ' '.join(x['w'] for x in ws)[:24]))
    W_all = np.array(W_all)
    print('words under 4 dB:', ', '.join(lowwords) or 'none')
    print('worst word over the whole ad: VO-bed %.1f | VO-SFX %.1f | VO-SFX speech band %.1f | VO-music %.1f dB'
          % tuple(W_all.min(0)))
    np.save(os.path.join(HERE, '.stems_check.npy'), np.vstack([VOf.mean(0), (SFX * gm * mask).mean(0), (MU * gm * mask).mean(0)]).astype(np.float32))
    spectro(chk, cues)
    return cues


def spectro(y, cues):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from scipy.signal import spectrogram
    m = y.mean(0)
    f, tt, Sx = spectrogram(m, SR, nperseg=2048, noverlap=1536)
    fig, ax = plt.subplots(2, 1, figsize=(26, 9), gridspec_kw=dict(height_ratios=[3, 1]), sharex=True)
    ax[0].pcolormesh(tt, f, 10 * np.log10(Sx + 1e-14), vmin=-130, vmax=-40, shading='auto', cmap='magma')
    ax[0].set_yscale('symlog', linthresh=200)
    ax[0].set_ylim(20, 20000)
    for q in cues:
        if q['nm'] in ('boom_big', 'boom_med', 'boom_med_b', 'brass_stab', 'win_chime', 'record_scratch_v6',
                       'record_scratch_v6b', 'glitch_freeze', 'remote_click', 'tv_power_on', 'lib:stadium_goal_eruption'):
            ax[0].axvline(q['t'], color='c', lw=0.6, alpha=0.7)
            ax[0].text(q['t'], 16000, q['nm'].replace('lib:', '')[:10], color='c', fontsize=7, rotation=90, va='top')
    e = 20 * np.log10(np.sqrt(uniform_filter1d(m ** 2, 480)) + 1e-9)
    ax[1].plot(np.arange(len(m)) / SR, e, lw=0.5)
    ax[1].set_ylim(-90, 0)
    ax[1].axvspan(SIL0, SIL1, color='r', alpha=0.2)
    ax[1].set_xlim(0, DUR)
    ax[1].set_xticks(np.arange(0, 40.5, 1))
    plt.tight_layout()
    plt.savefig(os.path.join(HERE, 'master_v6_spectrogram.png'), dpi=70)


if __name__ == '__main__':
    main()
