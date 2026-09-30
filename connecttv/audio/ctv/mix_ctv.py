#!/usr/bin/env python3
"""
ConnectTV final mix -> audio/master_ctv.wav (48 kHz stereo, 24-bit, T timeline 34.1 s, -14 LUFS integrated, <= -1.25 dBTP).

    python3 mix_ctv.py           # uses score_ctv.wav if present, otherwise a VO + SFX test mix

Buses (same engine as v7/mix_v7.py, retargeted to the ConnectTV timeline):
  VOICE  narrator (ORIGINAL TTS: 70 Hz high-pass + Kaiser polyphase resample only, split at the holds, voices/narrator_48k.wav)
         + the cinema-trailer re-take of "צ'רלטון" (+ hall + echoes) + the genre voices (Turkish crying girl, Hindi).  Never EQ'd here.
  MUSIC  score_ctv.wav (T timeline).  Ducked 8 dB under speech (150 ms look-ahead attack, 400 ms release), +6 dB inside the holds
         and held there until 0.35 s before the next spoken word, 6 dB under the genre voices.  A static music gain is calibrated so the
         worst word keeps VO - music >= MUSIC_WORST_DB, and a look-ahead SFX rider keeps VO - (music + SFX) >= BED_MARGIN_DB at every word.  Exact digital silence only where the score itself has its suspense gap.
  SFX    cue sheet below (v-clock cues converted with T = v + sum of hold durations with hold.v < v).  Every cue gets one or two static
         gains chosen so that, wherever a word or genre voice is sounding, the SFX bus stays >= 7 dB (speech band) / 5 dB (full band) under it.
Master: static gain -> true-peak look-ahead limiter (5 ms, 4x oversampled detection, 150 ms release) -> gain iterated to -14.0 LUFS.
No compressor or loudness normaliser anywhere on the VO.
"""
import os, re, sys, json
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import resample_poly, butter, sosfilt, lfilter
from scipy.ndimage import minimum_filter1d, uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, '/home/user/I/gotv5/audio/v6')
import voices_ctv as V  # noqa: E402
import sfx_ctv  # noqa: E402,F401
import sfx_v6 as S  # noqa: E402

SR = 48000
HOLDS, VDUR, DUR = V.HOLDS, V.VDUR, V.TOTAL
HK = V.HK
NS = int(round(DUR * SR))
LIBDIR = '/home/user/I/anim/audio/sfx'
SCORE = os.path.join(HERE, 'score_ctv.wav')
SCORE_ND = os.path.join(HERE, 'score_ctv_nodays.wav')     # the composer's stem-split: score without its 7 day notes (SFX plays them)
OUT = os.path.join(ROOT, 'master_ctv.wav')
OUT2 = os.path.join(HERE, 'master_ctv.wav')
VOICES = os.path.join(HERE, 'voices')
CINEMA_GAIN = 10 ** (-3.0 / 20)      # the trailer re-take sits 3 dB lower so it stays 3-5 dB above the bed
TARGET_LUFS = -14.0
CEIL_DBTP = -1.25
MUSIC_MEDIAN_DB = 10.0      # static music gain: median over phrases of the worst-word VO - music ratio
MUSIC_WORST_DB = 7.5        # music rider: VO word-max minus music at every sounding word
BED_MARGIN_DB = 5.4         # SFX rider: VO word-max minus (music + SFX) at every sounding word (spec: >= 5 dB)


def db(x):
    return 10 ** (x / 20)


T = V.T


def words():
    s = open(os.path.join(os.path.dirname(ROOT), 'words.js')).read()
    W = json.loads(s[s.index('['):s.rindex(']') + 1])
    for w in W:
        w['t0'], w['t1'] = T(w['t0'], True), T(w['t1'])
    return W


# genre voice lines (T): protected like words; the cinema re-take of the word + its echoes are one line
def genre_lines():
    c, t_, i_ = HK['cin'], HK['tur'], HK['ind']
    return [('cinema Charlton', c['T0'] + 0.03, c['T0'] + c['d'] - 0.10),
            ('Neden?!', t_['T0'] + 0.03, t_['T0'] + t_['d'] - 0.03),
            ('vaah', i_['T0'] + 0.03, i_['T0'] + 0.03 + 0.90)]


# ------------------------------------------------------------------ sound loading
_HITS_LIB = json.load(open(os.path.join(LIBDIR, 'hits.json')))
_HITS = {k: v['hit'] for k, v in S.REG.items()}
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
        x, hit = S.build(name, root, write=False), _HITS[name]
    if x.shape[0] == 1:
        x = np.vstack([x[0], x[0]])
    _CACHE[key] = (x, hit)
    return x, hit


def vary(x, ratio):
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
# score key (score_ctv.py): E minor / E Hijaz / E major in the holds, G major in the chorus.  The day phrase is the score's own:
# G A B C D E F# (F# = leading tone that resolves to G at the goal), one octave up here so the harp pops read over the speech band.
KEY = dict(harp_root=79, week=[79, 81, 83, 84, 86, 88, 90], bolly=64, tur=40, cin=40)


def cue_sheet():
    C = []

    def c(v, nm, g=0.0, p=0.0, after=False, **kw):
        """v = scene CUE time on the VOICE clock (after=True: the event happens after a hold that starts at v)."""
        C.append(dict(t=T(v, after), nm=nm, g=g, p=p, v=v, **kw))

    def ct(t, nm, g=0.0, p=0.0, **kw):
        C.append(dict(t=t, nm=nm, g=g, p=p, v=None, **kw))
    hr = KEY['harp_root']
    # ---- S0 open (0 - 3.4)
    c(0.12, 'zap', -19, 0.0)                                                        # power-on line
    c(0.74, 'bolt_crack', -1, 0.0, m_all=5.5, m_hi=7.5)                             # BOLT cracks the screen on "המסך"
    c(1.26, 'glass_shatter', -4, 0.0)                                               # glass explodes toward camera
    c(1.26, 'liquid_whoosh_c', -8, 0.0)                                             # liquid iris floods in
    c(1.30, 'splash_small', -8, 0.0)
    c(1.70, 'glitter', -15, 0.0)                                                    # sparkle
    c(1.85, 'gloss_pop_b', -12, -0.3)                                               # icons pop
    c(2.33, 'liquid_flood', -3, 0.0)                                                # MEGA SPLASH on "נפתח"
    c(2.33, 'shockwave', -7, 0.0)
    # ---- S1 streamers
    c(3.25 + 0.14, 'liquid_whoosh_a', -5, 0.0)                                      # liquid wipe covers s0 (peak mid-wipe)
    c(3.41, 'splash_small', -8, 0.0)                                                # clapper slam
    c(3.41, 'lib:popcorn_burst', -15, 0.0)
    for k, tt in enumerate((3.92, 4.00, 4.08)):                                     # episode cards fan
        c(tt, 'gloss_pop_b', -14, (-0.4, 0.0, 0.4)[k], var=(1.0, 1.1, 1.22)[k])
    c(4.34, 'splash_slam', -1, 0.0, m_all=5.5, m_hi=7.5)                            # NETFLIX slam
    c(4.34, 'shockwave', -6, 0.0)
    c(4.36, 'zap', -13, 0.3)
    c(5.35 + 0.05, 'liquid_whoosh_b', -10, 0.0)                                     # flip to blue
    c(5.45, 'glitter', -18, 0.0)
    c(5.99, 'splash_slam', -2, 0.0, m_all=5.5, m_hi=7.5)                            # DISNEY+ logo burst
    c(5.99, 'harp_sparkle', -9, 0.0, root=hr)
    c(5.99, 'shockwave', -8, 0.0)
    c(6.43, 'gloss_pop_c', -8, 0.0)                                                 # plus pop
    c(6.43, 'splash_small', -10, 0.0)
    # ---- S2 sports
    c(6.55 + 0.10, 'liquid_whoosh_b', -6, 0.0)                                      # wipe into the sports scene (speech gap)
    c(6.78, 'zap', -13, -0.3)                                                       # lights on
    c(6.78, 'glitter', -17, 0.0)
    for k, tt in enumerate((6.95, 7.08, 7.21, 7.34)):                               # sport 1-4 pops
        c(tt, 'gloss_pop_b', -14, (-0.6, 0.6, -0.4, 0.4)[k], var=(1.0, 1.08, 0.94, 1.14)[k])
    c(7.47, 'splash_slam', -3, 0.0)                                                 # sport 5 hero slam
    c(7.58, 'splash_small', -7, 0.0)                                                # ball / trophy burst
    c(7.58, 'shockwave', -9, 0.0)
    for k, tt in enumerate((8.03, 8.09, 8.15, 8.20, 8.24, 8.27, 8.29, 8.31)):       # drum-roll build-up (accelerating)
        c(tt, 'snare_hit', -17 + 0.8 * k, (-0.15, 0.15)[k % 2], var=1.0 + 0.02 * k)
    c(8.32, 'bolt_crack', -3, 0.0, m_all=5.5, m_hi=7.5)                             # CHARLTON slam
    c(8.32, 'shockwave', -3, 0.0)
    c(8.32, 'boom_med', -3, 0.0, m_all=5.5, m_hi=7.5)
    # ---- cin hold: the narrator becomes a cinema-trailer voice
    h = HK['cin']
    ct(h['T0'] - 0.02, 'thx_swell', -9, 0.0, root=KEY['cin'], m_all=4.5, m_hi=6.5)  # boom + THX swell, peaks at the hold end (score: braaam, gong, timpani roll)
    ct(h['T0'], 'projector', -14, 0.3, seg=(0.0, h['d']), fout=0.25)
    ct(h['T0'] + h['d'], 'rise_whoosh', -9, 0.0)                                    # forward pickup into the next scene
    # ---- S3 series
    c(8.85 + 0.12, 'liquid_whoosh_a', -5, 0.0, after=True)                          # candy wave floods over the sports scene
    c(8.88, 'splash_small', -13, 0.0, after=True)                                   # frame swing in
    c(9.27, 'splash_slam', -3, 0.0)                                                 # TURKISH poster splash
    c(9.27, 'curtain_swoosh', -12, 0.0)                                             # + curtain rip
    # ---- tur hold: crying girl "Neden?!"
    h = HK['tur']
    # (no tur_dum / bolly_sting: the score plays its own dum-dum-DUM at 0 / 0.25 / 0.50 and a tabla + sitar groove; SFX would flam)
    ct(h['T0'] + 0.62, 'tear_drop', -15, -0.3)
    ct(h['T0'] + h['d'], 'rise_whoosh', -9, 0.0)
    c(10.00 + 0.10, 'liquid_whoosh_b', -6, 0.0, after=True)                         # poster whip away (wipe sweeps left)
    c(10.39, 'splash_slam', -4, 0.0)                                                # BOLLYWOOD burst
    c(10.39, 'glitter', -12, 0.0)
    # ---- ind hold: Bollywood sting + "वाह!"
    h = HK['ind']
    ct(h['T0'] + 0.05, 'glitter', -13, 0.0)                                         # petals / sparkle dust over the composer's groove
    ct(h['T0'] + h['d'] - 0.13 + 0.15, 'liquid_whoosh_a', -6, 0.0)                  # wipe band (starts 0.13 s before the release)
    ct(h['T0'] + h['d'], 'rise_whoosh', -10, 0.0)
    # ---- S4 live
    c(11.05, 'bolt_crack', -4, 0.0, after=True, m_all=5.5, m_hi=7.5)                # LIVE slam on "וכל"
    c(11.05, 'splash_small', -6, 0.0, after=True)
    for k, tt in enumerate((11.15, 11.30, 11.45, 11.60)):                           # channel tile pops
        c(tt, 'gloss_pop_b', -13, (-0.5, 0.5, -0.3, 0.3)[k], var=(0.96, 1.0, 1.06, 1.14)[k], after=True)
    c(11.78, 'heart_lub', -8, 0.0, after=True)                                      # heartbeat lub-dub
    c(12.03, 'heart_lub', -11, 0.0, var=1.12, after=True)
    c(12.16, 'rise_whoosh', -12, 0.0, after=True)                                   # Israel riser hit
    c(12.16, 'splash_slam', -4, 0.0, after=True)
    c(12.16, 'glitter', -14, 0.0, after=True)
    c(12.72, 'glitter', -17, 0.0, after=True)
    # ---- S5 all in one
    c(12.85 + 0.12, 'liquid_whoosh_c', -6, 0.0, after=True)                         # wipe covers s4
    c(13.08, 'splash_slam', -3, 0.0, after=True)                                    # everything pops out
    c(13.82, 'vortex_suck_s', -2, 0.0, m_all=5.5, m_hi=7.5, after=True)             # swirl -> vortex impact on "אחד" (gulp at 13.82)
    c(13.82, 'splash_slam', -2, 0.0, after=True, m_all=5.5, m_hi=7.5)
    c(13.82, 'shockwave', -5, 0.0, after=True)
    c(14.43, 'gloss_pop_c', -13, 0.3, after=True)                                   # thumb enters
    c(14.87, 'remote_click', -4, 0.0, after=True)                                   # TAP
    c(14.87, 'shockwave', -12, 0.0, after=True)
    c(14.87, 'glitter', -15, 0.0, after=True)
    c(15.36 + 0.06, 'liquid_whoosh_b', -12, 0.0, after=True)                        # calendar bubbles pop in
    wk = KEY['week']
    for k, tt in enumerate((15.86, 16.01, 16.16, 16.31, 16.45, 16.60)):             # the week plays a rising harp phrase
        c(tt, 'day_note', -7 + 0.35 * k, -0.35 + 0.14 * k, root=wk[k], after=True, m_all=5.5, m_hi=7.5)
    c(16.75, 'week_finale', -5, 0.0, root=wk[6], after=True, m_all=5.5, m_hi=7.5)   # Saturday: chord + gliss
    # ---- S6 discover
    c(17.10 + 0.15, 'liquid_whoosh_a', -6, 0.0, after=True)                         # wave in (speech gap)
    c(17.40, 'splash_small', -8, 0.0, after=True)                                   # ball landing
    c(17.40, 'lib:ball_kick', -11, 0.2, after=True)
    c(17.15, 'lib:stadium_crowd_bed', -19, 0.0, after=True, seg=(4.6, 5.9), fin=0.45, fout=0.05)   # crowd builds to the goal
    c(17.80, 'splash_small', -8, 0.0, after=True)                                   # LIVE badge slam
    c(17.80, 'zap', -14, 0.0, after=True)
    c(18.34, 'lib:stadium_goal_eruption', -2, 0.0, after=True, seg=(0.0, 3.4), fout=1.0, m_all=5.5, m_hi=7.5)   # GOAL: crowd eruption
    c(18.34, 'splash_slam', -3, 0.0, after=True, m_all=5.5, m_hi=7.5)
    c(18.34, 'shockwave', -5, 0.0, after=True)
    for k, tt in enumerate((18.78, 19.21, 19.52)):                                  # countdown 3-2-1
        c(tt, 'gloss_pop_c', -10, 0.0, var=(0.88, 1.0, 1.14)[k], after=True)
    c(18.78, 'curtain_swoosh', -11, 0.0, after=True)                                # curtain slam
    c(19.21, 'lib:popcorn_burst', -14, 0.0, after=True)                             # popcorn bucket pop
    c(20.09, 'curtain_swoosh', -7, 0.0, after=True)                                 # curtains fly open
    c(20.09, 'harp_sparkle', -12, 0.0, root=hr, after=True)
    c(20.42, 'splash_slam', -3, 0.0, after=True)                                    # chest slam
    c(20.92, 'gloss_pop_b', -10, 0.0, after=True)                                   # bow pop
    c(21.29, 'gloss_pop_c', -8, 0.0, after=True)                                    # box pops open (glossy pop, no paper confetti)
    c(21.29, 'harp_sparkle', -6, 0.0, root=hr, after=True)
    c(21.29, 'splash_slam', -4, 0.0, after=True)
    c(21.35, 'glitter', -12, 0.0, after=True)
    # ---- S7 no search
    c(22.05 + 0.15, 'liquid_whoosh_b', -4, 0.0, after=True)                         # hot wipe in
    c(22.36, 'splash_slam', -2, 0.0, after=True, m_all=5.5, m_hi=7.5)               # NO slam 1
    c(22.36, 'shockwave', -6, 0.0, after=True)
    c(22.66, 'gloss_pop_b', -11, -0.3, after=True)                                  # magnifier pops
    c(22.72, 'gloss_pop_b', -13, 0.3, var=1.15, after=True)
    c(22.70, 'glitter', -17, 0.0, after=True)
    c(23.18 + 0.02, 'cross_out', -1, 0.0, after=True, m_all=5.5, m_hi=7.5)          # RED X lands on the magnifier
    c(23.30, 'glass_shatter', -3, 0.0, after=True)                                  # lens shatters
    c(23.55, 'splash_slam', -4, 0.0, after=True)                                    # NO slam 2
    c(23.69, 'gloss_pop_c', -11, -0.4, after=True)                                  # phone + TV appear
    c(23.76, 'gloss_pop_c', -12, 0.4, var=1.2, after=True)
    for k, tt in enumerate((23.92, 24.06, 24.16, 24.24)):                           # tiles ping-pong
        c(tt, 'gloss_pop_b', -16, (-0.5, 0.5, -0.5, 0.5)[k], var=(0.9, 1.0, 1.1, 1.2)[k], after=True)
    c(24.43 + 0.05, 'cross_out', -3, 0.0, after=True)                               # two bolts cross out everything
    c(24.56 + 0.12, 'liquid_whoosh_a', -5, 0.0, after=True)                         # tiles swept away
    c(24.80, 'gloss_pop_c', -9, 0.0, after=True)                                    # calm TV resolves
    # ---- S8 pick + end card
    c(24.95 + 0.15, 'liquid_whoosh_b', -5, 0.0, after=True)                         # wipe covers s7 (speech gap)
    c(25.08 + 0.10, 'liquid_whoosh_c', -13, 0.0, after=True)                        # candy tiles glide in
    c(25.43, 'gloss_pop_b', -14, -0.3, after=True)                                  # tiles bounce / finger hover
    c(25.60, 'gloss_pop_b', -15, 0.3, var=1.1, after=True)
    c(26.05, 'remote_click', -4, 0.0, after=True)                                   # TAP impact on the football tile
    c(26.05, 'splash_small', -8, 0.0, after=True)
    c(26.05, 'shockwave', -12, 0.0, after=True)
    c(26.30, 'splash_slam', -3, 0.0, after=True)                                    # tile bursts fullscreen
    c(26.30 + 0.10, 'liquid_whoosh_a', -9, 0.0, after=True)
    c(26.94, 'splash_slam', -3, 0.0, after=True)                                    # playback burst
    c(26.94, 'harp_sparkle', -9, 0.0, root=hr, after=True)
    c(27.20, 'lib:stadium_goal_eruption', -6, 0.0, after=True, seg=(0.0, 2.3), fout=1.0)   # goal burst on the screen
    c(27.20, 'splash_small', -7, 0.0, after=True)
    c(27.60, 'logo_suck', -6, 0.0, after=True, var=1.6)                                    # iris suck into the logo (under the last word)
    c(27.60, 'logo_slam', 0.0, 0.0, after=True)                                     # LOGO SLAM: the final music hit lands on it
    c(28.10, 'gloss_pop', -9, 0.0, after=True)                                      # tagline pop
    c(28.10, 'glitter', -14, 0.0, after=True)
    return C


# ------------------------------------------------------------------ DSP helpers
def kw(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    x = np.atleast_2d(x)
    return np.vstack([lfilter(b2, a2, lfilter(b1, a1, ch)) for ch in x])


def loud_curve(x, win):
    p = np.sum(kw(x) ** 2, axis=0)
    p = uniform_filter1d(p, int(win * SR), mode='constant')
    return 10 * np.log10(p + 1e-12) - 0.691


def smooth_gain(g_db, look=0.03, rel=0.25, step=48):
    """gain-reduction smoother (v7): block-min at control rate, look-ahead min + boxcar attack, exponential release"""
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
    ceil = db(ceil_db)
    up = np.max(np.abs(np.vstack([resample_poly(ch, 4, 1) for ch in x])), axis=0)
    pk = np.max(up[:4 * x.shape[1]].reshape(-1, 4), axis=1)
    pk = np.maximum(pk, np.max(np.abs(x), axis=0))
    req = np.minimum(1.0, ceil / (pk + 1e-12))
    L = int(look * SR)
    h = minimum_filter1d(req, L + 1, origin=-(L // 2))
    idx = np.nonzero(h < 1.0)[0]
    g = np.ones_like(h)
    if len(idx):
        a = np.exp(-1 / (rel * SR))
        prev = 1.0
        for i in range(idx[0], len(h)):
            v = h[i]
            prev = v if v < prev else a * prev + (1 - a) * v
            g[i] = prev
            if prev > 0.99999 and i > idx[-1]:
                break
    g = uniform_filter1d(g, L + 1, origin=L // 2)
    g = np.minimum(g, 1.0)
    return x * g, g


def score_gaps(path, min_len=0.10):
    """(t0, t1) runs of exact digital zero (both channels) in the score = its suspense gaps"""
    x, sr = sf.read(path, always_2d=True)
    z = np.all(x == 0, axis=1)
    d = np.diff(np.r_[0, z.astype(int), 0])
    a, b = np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]
    return [(i / sr, j / sr) for i, j in zip(a, b) if (j - i) / sr >= min_len]



NOTES_HEAD = """# ConnectTV mix notes (audio/ctv)

**Verified by MEASUREMENT ONLY.  Nobody listened to this mix or to the foreign-language voices.**
Everything below (LUFS, true peak, clip count, VO-to-bed ratio per word, click check, spectrogram, Whisper ASR) is a number or a picture, not an ear.

## Build
    python3 voices_ctv.py     # voices/  narrator_48k.wav, cinema_fx.wav, genre_voices.wav, voices.json
    python3 sfx_ctv.py        # sfx/     new SFX (+ hits.json); v6/v7 sounds are reused through sfx_v6.build
    python3 mix_ctv.py        # ../master_ctv.wav (+ copy here), master_ctv_spectrogram.png, mix_report.txt/json, this file
Timeline: T = v + sum(hold.d for holds with hold.v < v) (timeline.js: cin 8.85 +1.4, tur 9.98 +1.0, ind 11.03 +1.1; total 34.1 s).

## Voices
- Narrator = the ORIGINAL TTS (audio/vo_original_tts.wav), Kaiser polyphase 44.1k -> 48k (160/147, beta 14) + 2nd-order 70 Hz high-pass, nothing else
  (no EQ, no loudnorm, no compressor); split at the hold points on zero crossings with 5 ms fades; hold silences inserted.
  The mix contains it unchanged (checked against an independent resample + high-pass pipeline).
- `cin` hold: the narrator's word "צ'רלטון" (v 8.32-8.85) is re-spoken from the same audio as a deep trailer voice (WORLD pitch -5.5 st, formant warp 0.94,
  chest EQ, saturation, 3.6 s hall) starting at hold + 0.03 s (T 8.88), two darker echoes at +0.60 and +1.02 s, a small hall send under the original word.
  Whisper-he hears "...טון" for the processed word (the original word: "צ'לטון").  Level -3 dB vs. the first draft so it sits 3-5 dB over the bed.
- `tur` hold (client request): a young crying GIRL saying "Neden?!".  Kokoro has no Turkish, so it is the Italian voice if_sara driven by Turkish IPA
  (nɛdˈɛn), then WORLD: f0 x1.55 (about 420 Hz), formants x1.13 (child), 8.5 Hz pitch tremble that grows, a voice crack, breathier aperiodicity,
  amplitude breaks + sharp in-breaths at the syllable joints, then a hiccup in-breath and two broken "ha" sobs (also Kokoro + WORLD, sliding down),
  all inside the 1.0 s hold (T 11.41-12.38).  Whisper-tr reads the line as "Neden?" / "Ne den?" (the unprocessed base: "Ne dene?").
- `ind` hold: a real Kokoro Hindi voice (hm_omega, lang hi) "वाह!", raised pitch with a rising contour and a 1.4x WORLD stretch (0.9 s), at hold + 0.03 s.
  Whisper-hi returns only "ाहे" (its byte-level decoder drops the consonant 'व' in every Devanagari test, including the longer "वाह, क्या बात है!",
  which came back as "ाह क्या ात"), so the Hindi line is NOT confirmed by ASR beyond its vowel/'ह' structure.  The longer phrase did not fit 1.1 s.
- Whisper model: sherpa-onnx whisper-small int8 (GitHub release asr-models); Kokoro v1.0 from the kokoro-onnx GitHub release.

## Score handling
- Uses `score_ctv_nodays.wav` (the composer's stem split without its 7 day notes) and plays the day phrase from SFX (real VSCO harp + violin spiccato,
  the composer's own notes G A B C D E F#, one octave up, on the scene CUEs 15.86 ... 16.75; F# = leading tone with a piano fifth + harp gliss).
  `USE_SCORE_DAYS=1 python3 mix_ctv.py` uses the full score instead.
- The score already plays its own dum-dum-DUM (tur), tabla + sitar groove (ind), braaam/gong/timpani roll (cin), so no SFX tur_dum / bolly_sting is cued
  (they would flam); the hold SFX are the THX swell + projector (cin), a tear drop (tur), glitter (ind) and forward pickup whooshes into each hold end.
- The score has no exact digital zero (its 'suck-in' gaps before T 17.32 and T 31.10 keep the risers), so the master has none either; mix_ctv.py would mask
  any zero run >= 50 ms it finds in the score on every bus.
- Music: -8 dB under speech (150 ms look-ahead attack, 400 ms release), +6 dB in the holds and held until 0.35 s before the next word, -6 dB under the genre
  voices; a static gain so the median phrase-worst VO-music is 10 dB, then a look-ahead rider keeps VO - music >= 7.5 dB (4.5 dB under genre voices).
- SFX: every cue gets static gains from a VO-protection solver (>= 6.5 dB under words full band, >= 8 dB in the speech band, big hits 5.5 / 7.5), then a
  smooth look-ahead rider on the SFX bus keeps VO - (music + SFX) >= 5.4 dB at every word (4.0 dB under genre voices).  Master: static gain -> true-peak
  look-ahead limiter (4x oversampling, 5 ms) -> -14 LUFS.  No compressor or EQ on the VO anywhere.

## SFX list (all synthesised with the numpy toolkit, seeded, or real VSCO samples)
bolt_crack, gloss_pop x3, zap, liquid_whoosh a/b/c, rise_whoosh, liquid_flood, splash_slam / splash_small, shockwave, glass_shatter, cross_out (two bolt slashes + slam),
vortex_suck(_s), snare_hit (build-up roll), heart_lub, glitter, logo_suck + logo_slam, harp_sparkle, day_note x6 + week_finale, plus v6/v7 sounds for
remote_click, curtain_swoosh, thx_swell, projector, tear_drop, boom_med, and the anim library (stadium_goal_eruption, stadium_crowd_bed, popcorn_burst, ball_kick).
No marker / paper / hiss sounds, no metallic UI dings, nothing on the caption chips.  Cue list: `cue_sheet()` in mix_ctv.py (scene `// CUE` comments, v-clock).
Not done / limits: cue names in the scenes are matched by hand (re-run after a scene change); the cross-out, glass and liquid sounds are physically plausible
designs that nobody has listened to; the trailer voice may sound saturated; heavy sub layers from the SFX and the score add up (limiter GR is in the report).

## Measured report (mix_report.txt)
"""


# ------------------------------------------------------------------ main
def main():
    global SCORE
    if os.path.exists(SCORE_ND) and not os.environ.get('USE_SCORE_DAYS'):
        SCORE = SCORE_ND
    have_score = os.path.exists(SCORE)
    W = words()
    GEN = genre_lines()
    # ---- voice bus
    nar, sr = sf.read(os.path.join(VOICES, 'narrator_48k.wav'))
    assert sr == SR
    FXV = sf.read(os.path.join(VOICES, 'cinema_fx.wav'), always_2d=True)[0].T[:, :NS] * CINEMA_GAIN
    GV = sf.read(os.path.join(VOICES, 'genre_voices.wav'), always_2d=True)[0].T[:, :NS]
    NAR = np.zeros((2, NS))
    L = min(NS, len(nar))
    NAR[0, :L] = nar[:L]
    NAR[1, :L] = nar[:L]
    VOICEX = FXV + GV                                   # non-narrator voices
    VO = NAR + VOICEX
    # ---- music
    MU = np.zeros((2, NS))
    gaps = []
    if have_score:
        m, msr = sf.read(SCORE, always_2d=True)
        gaps = score_gaps(SCORE, 0.05)
        m = m.T
        if msr != SR:
            from math import gcd
            gg = gcd(SR, msr)
            m = np.vstack([resample_poly(ch, SR // gg, msr // gg, window=('kaiser', 14.0)) for ch in m])
        if m.shape[0] == 1:
            m = np.vstack([m[0], m[0]])
        MU[:, :min(NS, m.shape[1])] = m[:, :NS]
    # ---- speech activity
    t = np.arange(NS) / SR
    segs = []
    for w in W:
        a, b = w['t0'], w['t1']
        if segs and a - segs[-1][1] < 0.30:
            segs[-1][1] = max(segs[-1][1], b)
        else:
            segs.append([a, b])
    inword = np.zeros(NS, bool)
    TRIM = 0.06     # a word is judged up to 60 ms before its end (the 400 ms momentary window would otherwise see the next hit)
    for w in W:
        w['e1'] = max(w['t0'] + 0.05, w['t1'] - TRIM)
        inword[int(w['t0'] * SR):int(w['e1'] * SR)] = True
    vo_l4 = loud_curve(NAR, 0.4)
    meter0 = pyln.Meter(SR)
    REF = np.full(NS, 99.0)
    for w in W:
        a_, b_ = int(w['t0'] * SR), max(int(w['e1'] * SR), int(w['t0'] * SR) + 1)
        REF[a_:b_] = np.minimum(REF[a_:b_], vo_l4[a_:b_].max())
    gv_l4 = loud_curve(VOICEX, 0.4)
    genre_m = np.zeros(NS, bool)
    for _, a, b in GEN:                                 # genre voices are protected like words
        a_, b_ = int(a * SR), int(b * SR)
        inword[a_:b_] = True
        genre_m[a_:b_] = True
        REF[a_:b_] = np.minimum(REF[a_:b_], gv_l4[a_:b_].max())

    # ---- SFX bus with per-cue VO protection (see v7: static gains, hit judged around the onset, tail judged on every word)
    M_HI, M_ALL = 8.0, 6.5
    WIN = 0.4
    sos_lo = butter(4, 200, 'lowpass', fs=SR, output='sos')
    LO = np.zeros((2, NS))
    HI = np.zeros((2, NS))
    cues = cue_sheet()
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
        place(loc, x, t_start - i0_ / SR, q['g'], q['p'], seg=seg, fin=q.get('fin', 0), fout=q.get('fout', 0))
        lo_ = sosfilt(sos_lo, loc)
        hi_ = loc - lo_
        Vr = REF[i0_:i2_]
        m = inword[i0_:i2_]
        onset = min(max(0, int(q['t'] * SR) - i0_), i2_ - i0_ - 1)
        Ehi, Elo = HI[:, i0_:i2_], LO[:, i0_:i2_]
        Et = Ehi + Elo
        hib = lambda z: z - sosfilt(sos_lo, z)
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

        lim_h = np.maximum(Vr - q.get('m_hi', M_HI), base_hi + 0.25)
        lim_a = np.maximum(Vr - q.get('m_all', M_ALL), base_all + 0.25)
        lim_a_tail = np.maximum(Vr - M_ALL, base_all + 0.25)

        def ok(l, lim, mm):
            return np.all(l[mm] <= lim[mm] + 0.05)
        nL = i2_ - i0_
        tw = np.zeros(nL)
        c0 = onset + int(0.12 * SR)
        if c0 < nL:
            r_ = min(ramp_n, nL - c0)
            tw[c0:c0 + r_] = np.sin(np.linspace(0, np.pi / 2, r_)) ** 2
            tw[c0 + r_:] = 1.0
        hw = 1.0 - tw
        m_near = m.copy()
        m_near[:max(0, min(onset - int(0.1 * SR), int(t_start * SR) - i0_))] = False
        m_near[min(nL, onset + int(0.3 * SR)):] = False
        Ah = Ea = 0.0
        mm_ = m_near
        both = lambda z, lim_all: ok(loud_curve(hib(z), WIN), lim_h, mm_) and ok(loud_curve(z, WIN), lim_all, mm_)
        if q.get('nofloor'):
            Ah = 0.0
        elif m_near.any():
            Ah = solve(lambda G: both(Et + loc * db(G), lim_a))
        if m.any() and not q.get('nofloor'):
            mm_ = m
            lim_at = np.where(tw > 0.5, lim_a_tail, lim_a)
            Ea = solve(lambda G: both(Et + loc * db(Ah) * (hw + tw * db(G)), lim_at))
        wa = db(Ah) * (hw + tw * db(Ea))
        q['prot'] = (Ah, Ah + Ea)
        LO[:, i0_:i2_] += lo_ * wa
        HI[:, i0_:i2_] += hi_ * wa
    SFX = sosfilt(butter(2, 22, 'highpass', fs=SR, output='sos'), LO + HI)

    # ---- music envelope: -8 dB under speech, +6 dB in holds (held until 0.35 s before the next word), -6 dB under genre voices
    duck = np.zeros(NS)
    for a, b in segs:
        d = np.interp(t, [a - 0.15, a, b, b + 0.40], [0, 1, 1, 0], left=0, right=0)
        duck = np.maximum(duck, d)
    duck = 0.5 - 0.5 * np.cos(np.pi * duck)
    hold = np.zeros(NS)
    starts = sorted(a for a, b in segs)
    for h in HOLDS:
        he = h['T0'] + h['d']
        nxt = min([a for a in starts if a >= he - 0.05] + [he + 0.6])
        hold = np.maximum(hold, np.interp(t, [h['T0'] + 0.03, h['T0'] + 0.15, nxt - 0.35, nxt - 0.08], [0, 1, 1, 0], left=0, right=0))
    gd = np.zeros(NS)
    for _, a, b in GEN:
        gd = np.maximum(gd, np.interp(t, [a - 0.15, a, b, b + 0.4], [0, 1, 1, 0], left=0, right=0))
    gd = 0.5 - 0.5 * np.cos(np.pi * gd)
    GD_DB = float(os.environ.get('GD_DB', 6.0))
    env_db = -8.0 * duck * (1 - hold) + 6.0 * hold - GD_DB * gd
    MUd = MU * db(env_db)
    # 1) static music gain: the median (over phrases) of the worst-word VO - music ratio is MUSIC_MEDIAN_DB with the duck applied
    mus_gain_db = 0.0
    MU_cal = None
    m_rider_min = m_rider_frac = 0.0
    if have_score:
        ml0 = loud_curve(MUd, 0.4)
        ph_ = {}
        for w in W:
            wa_, wb_ = int(w['t0'] * SR), max(int(w['e1'] * SR), int(w['t0'] * SR) + 1)
            ph_[w['ph']] = min(ph_.get(w['ph'], 99), vo_l4[wa_:wb_].max() - ml0[wa_:wb_].max())
        print('VO-music at 0 dB music gain, worst word per phrase:', ' '.join('%d:%.1f' % kv for kv in sorted(ph_.items())))
        med = float(np.median(list(ph_.values())))
        mus_gain_db = float(os.environ.get('MUSIC_DB', med - MUSIC_MEDIAN_DB))
        MUd = MUd * db(mus_gain_db)
        MU_cal = (med, mus_gain_db)
    # 2) MUSIC rider: wherever a word is sounding VO - music >= 7.5 dB (genre voices: 4.5 dB): smooth look-ahead gain,
    #    150 ms attack, 400 ms release (the spec's duck, deepened only where the score is louder than the static gain allows)
    marg_mu = np.where(genre_m, 4.5, MUSIC_WORST_DB)
    marg_bed = np.where(genre_m, 4.0, BED_MARGIN_DB)

    def kpow(x):
        return uniform_filter1d(np.sum(kw(x) ** 2, axis=0), int(0.4 * SR), mode='constant')
    if have_score:
        lim_m = np.where(inword, 10 ** ((REF - marg_mu + 0.691) / 10), np.inf)
        gm_db = np.zeros(NS)
        for it in range(4):
            pm = kpow(MUd * db(gm_db)) + 1e-18
            tgt = np.minimum(0.0, gm_db + 10 * np.log10(np.clip(lim_m / pm, 1e-3, 1.0)))
            gm_db = smooth_gain(tgt, look=0.15, rel=0.40)
        MUd = MUd * db(gm_db)
        m_rider_min, m_rider_frac = float(gm_db.min()), float(np.mean(gm_db < -1.0))
    # 3) SFX rider: wherever a word / genre voice is sounding, (music + SFX) stays >= BED_MARGIN_DB under it: a smooth
    #    look-ahead gain on the SFX bus only (fixes the drift of many coincident cues).  VO is untouched.
    p_mu = kpow(MUd)
    p_lim = np.where(inword, 10 ** ((REF - marg_bed + 0.691) / 10), np.inf)
    g_db = np.zeros(NS)
    for it in range(4):
        p_sf = kpow(SFX * db(g_db)) + 1e-18
        scale = np.clip((p_lim - p_mu) / p_sf, 10 ** (-3.0), 1.0)      # <= -30 dB floor
        adj = 10 * np.log10(scale)
        tgt = np.minimum(0.0, g_db + adj)
        g_db = smooth_gain(tgt, look=0.03, rel=0.20)
    SFX = SFX * db(g_db)
    rider_min = float(g_db.min())
    rider_frac = float(np.mean(g_db < -1.0))

    # ---- silence window(s): exactly where the score has its suspense gap
    mask = np.ones(NS)
    k = int(0.012 * SR)
    for g0, g1 in gaps:
        i0, i1 = int(round(g0 * SR)), int(round(g1 * SR))
        mask[i0 - k:i0] = np.cos(np.linspace(0, np.pi / 2, k)) ** 2
        mask[i0:i1] = 0.0
    fo = int(0.40 * SR)
    fi = int(0.03 * SR)
    for B in (VO, MUd, SFX):
        B *= mask
        B[:, -fo:] *= np.cos(np.linspace(0, np.pi / 2, fo)) ** 2
        B[:, :fi] *= np.sin(np.linspace(0, np.pi / 2, fi)) ** 2
    # ---- master: static gain -> TP limiter, iterate gain to target
    meter = pyln.Meter(SR)
    mix = VO + MUd + SFX
    g = 0.0
    for it in range(8):
        y, gl = limiter(mix * db(g), CEIL_DBTP)
        y *= mask
        Lm = meter.integrated_loudness(y.T)
        if abs(Lm - TARGET_LUFS) < 0.02:
            break
        g += TARGET_LUFS - Lm
    tp = 20 * np.log10(true_peak(y) + 1e-12)
    sf.write(OUT, y.T.astype(np.float64), SR, subtype='PCM_24')
    sf.write(OUT2, y.T.astype(np.float64), SR, subtype='PCM_24')
    chk, _ = sf.read(OUT, always_2d=True)
    chk = chk.T

    # ---------------------------------------------------------------- verification
    rep = {}
    lines = []

    def pr(s):
        print(s)
        lines.append(s)
    pr('=' * 78)
    pr('score_ctv.wav: %s | gaps (exact digital zero) in the score: %s' % ('YES' if have_score else 'NO (test mix, VO + SFX only)',
       ', '.join('%.3f-%.3f' % x for x in gaps) or 'none'))
    if MU_cal:
        pr('music static gain %+.2f dB re the score file (median phrase-worst VO-music %.1f dB before, target %.1f); music rider min %.1f dB (active >1 dB %.1f %% of film); SFX rider min %.1f dB (active %.1f %%)' % (MU_cal[1], MU_cal[0], MUSIC_MEDIAN_DB, m_rider_min, 100 * m_rider_frac, rider_min, 100 * rider_frac))
    pr('master: %s  %d samples = %.3f s, %d ch, %d Hz, PCM_24' % (OUT, chk.shape[1], chk.shape[1] / SR, chk.shape[0], SR))
    integ = meter.integrated_loudness(chk.T)
    tpk = 20 * np.log10(true_peak(chk))
    clip = int(np.sum(np.abs(chk) >= 0.99999))
    pr('integrated %.2f LUFS | true peak %.2f dBTP | sample peak %.2f dBFS | clipped samples %d'
       % (integ, tpk, 20 * np.log10(np.max(np.abs(chk))), clip))
    gr = -20 * np.log10(gl)
    pr('master gain %+.2f dB | limiter GR max %.2f dB at %.2f s, >1 dB for %.2f s, >3 dB for %.3f s'
       % (g, gr.max(), np.argmax(gr) / SR, np.sum(gr > 1) / SR, np.sum(gr > 3) / SR))
    sil_info = []
    for g0, g1 in gaps:
        sil = chk[:, int(round(g0 * SR)):int(round(g1 * SR))]
        sil_info.append((g0, g1, float(np.max(np.abs(sil)))))
        pr('silence %.3f-%.3f: max |x| = %.3g (%s)' % (g0, g1, sil_info[-1][2], 'DIGITAL ZERO' if sil_info[-1][2] == 0 else 'NOT ZERO'))
    nzero = np.sum(np.all(chk == 0, axis=0)) / SR
    pr('total exact-zero time in master: %.3f s (score gaps total %.3f s)' % (nzero, sum(b - a for a, b in gaps)))
    for q in cues:
        if q['nm'] in ('logo_slam', 'logo_suck', 'splash_slam') and q['v'] in (27.6, 4.34):
            pr('  cue %s @%.2f protection gain hit/tail: %.1f / %.1f dB' % (q['nm'], q['t'], q['prot'][0], q['prot'][1]))
    pr('cues %d; hit tucked under the voice: %d; tail tucked: %d' % (len(cues), sum(q['prot'][0] < -0.5 for q in cues), sum(q['prot'][1] < -0.5 for q in cues)))
    gm = db(g)
    VOf, BED = VO * gm * mask, (MUd + SFX) * gm * mask
    NARf = NAR * mask * gm
    vl, bl = loud_curve(NARf, 0.4), loud_curve(BED, 0.4)
    sl, ml = loud_curve(SFX * gm * mask, 0.4), loud_curve(MUd * gm * mask, 0.4)
    S_ = SFX * gm * mask
    sh_ = loud_curve(S_ - sosfilt(sos_lo, S_), 0.4)
    ph = {}
    for w in W:
        ph.setdefault(w['ph'], []).append(w)
    pr('phrase window | VO LUFS | integrated over phrase (LU): VO-bed VO-SFX VO-music | worst word (momentary 400 ms): bed SFX SFX>200Hz music')
    W_all, lowwords, worst_words = [], [], []
    for k_, ws in ph.items():
        a, b = ws[0]['t0'], ws[-1]['t1']
        ia, ib = int(a * SR), int(b * SR)
        pad_ = max(0, int((0.45 - (b - a)) * SR / 2))
        I = lambda X: meter.integrated_loudness(X[:, ia - pad_:ib + pad_].T)
        v, bb, ss, mm = I(NARf), I(BED), I(S_), I(MUd * gm * mask)
        mins = [99.0] * 4
        for w in ws:
            wa_, wb_ = int(w['t0'] * SR), max(int(w['e1'] * SR), int(w['t0'] * SR) + 1)
            vm = vl[wa_:wb_].max()
            for j, X in enumerate((bl, sl, sh_, ml)):
                mins[j] = min(mins[j], vm - X[wa_:wb_].max())
            worst_words.append((vm - bl[wa_:wb_].max(), w['w'], w['t0']))
            if vm - bl[wa_:wb_].max() < 5.0:
                lowwords.append('%s@%.2f(bed %.1f: music %.1f, SFX %.1f)' % (w['w'], w['t0'], vm - bl[wa_:wb_].max(),
                                vm - ml[wa_:wb_].max(), vm - sl[wa_:wb_].max()))
        W_all.append(mins)
        pr('%3d %6.2f-%6.2f | %6.1f | %6.1f %6.1f %6.1f | %5.1f %5.1f %5.1f %5.1f  %s'
           % (k_, a, b, v, v - bb, v - ss, v - mm, *mins, ' '.join(x['w'] for x in ws)[:24]))
    W_all = np.array(W_all)
    gvl = loud_curve(VOICEX * gm * mask, 0.4)
    gen_rep = []
    for nm_, a_, b_ in GEN:
        ia_, ib_ = int(a_ * SR), int(b_ * SR)
        vb = gvl[ia_:ib_].max() - bl[ia_:ib_].max()
        gen_rep.append((nm_, vb))
        pr('genre voice %-16s %.2f-%.2f: voice max M %.1f LUFS, music max %.1f, SFX max %.1f, voice-bed %.1f dB'
           % (nm_, a_, b_, gvl[ia_:ib_].max(), ml[ia_:ib_].max(), sl[ia_:ib_].max(), vb))
    for h in HOLDS:
        ia_, ib_ = int(h['T0'] * SR), int((h['T0'] + h['d']) * SR)
        pr('hold %-4s %.2f-%.2f: mix %.1f LUFS (music %.1f, SFX %.1f)' % (h['k'], h['T0'], h['T0'] + h['d'],
           meter.integrated_loudness(chk[:, ia_:ib_].T), meter.integrated_loudness((MUd * gm * mask)[:, ia_:ib_].T),
           meter.integrated_loudness((SFX * gm * mask)[:, ia_:ib_].T)))
    worst_words.sort()
    pr('words under 5 dB VO-bed: ' + (', '.join(lowwords) or 'none'))
    pr('5 worst words (VO-bed): ' + ', '.join('%s@%.2f %.1f' % (w, t0, d) for d, w, t0 in worst_words[:5]))
    pr('worst word over the whole ad: VO-bed %.1f | VO-SFX %.1f | VO-SFX speech band %.1f | VO-music %.1f dB' % tuple(W_all.min(0)))
    # band balance per third of the film
    bands = [(20, 60), (60, 250), (250, 2000), (2000, 6000), (6000, 16000)]
    X = np.abs(np.fft.rfft(chk.mean(0))) ** 2
    ff = np.fft.rfftfreq(chk.shape[1], 1 / SR)
    tot = X.sum()
    pr('spectral balance (share of energy dB re total): ' + ', '.join('%d-%d Hz %.1f' % (lo, hi, 10 * np.log10(X[(ff >= lo) & (ff < hi)].sum() / tot)) for lo, hi in bands))
    # click detector on the master: 2nd-difference spikes vs a 20 ms running median of the 2nd difference (outside the first 50 ms)
    from scipy.ndimage import median_filter
    d2 = np.abs(np.diff(chk.mean(0), 2))
    loc_ = median_filter(d2[::8], size=60)
    ratio = d2[::8] / (loc_ + 1e-7)
    nspike = int(np.sum((ratio > 60) & (d2[::8] > 0.02)))
    pr('click check: %d spikes (2nd difference > 60x local median and > 0.02 FS)' % nspike)
    # VO integrity: narrator stem = original TTS through Kaiser polyphase 160/147 + 2nd-order 70 Hz high-pass only
    x0, sr0 = sf.read(os.path.join(ROOT, 'vo_original_tts.wav'))
    ref = sosfilt(butter(2, 70, 'highpass', fs=SR, output='sos'), resample_poly(x0, 160, 147, window=('kaiser', 14.0)))
    i_a, i_b = int(0.2 * SR), int(8.6 * SR)
    pr('VO integrity: narrator stem vs independent (resample + 70 Hz HP) pipeline over T 0.2-8.6: max |diff| = %.2g (float32 storage)' % np.max(np.abs(nar[i_a:i_b] - ref[i_a:i_b])))
    # VO integrity: the narrator stem inside the mix vs the pure pipeline (resample + 70 Hz HP only): bit-exact unless a cue/bed adds to it
    rep = dict(lufs=integ, tp=tpk, clip=clip, worst=W_all.min(0).tolist(), gaps=gaps, mus_gain=MU_cal, genre=gen_rep,
               low_words=lowwords, gr_max=float(gr.max()), n_cues=len(cues), score=have_score)
    json.dump(rep, open(os.path.join(HERE, 'mix_report.json'), 'w'), indent=1, default=float)
    open(os.path.join(HERE, 'mix_report.txt'), 'w').write('\n'.join(lines))
    open(os.path.join(HERE, 'MIX_NOTES.md'), 'w').write(NOTES_HEAD + '\n```\n' + '\n'.join(lines) + '\n```\n\nSpectrogram: master_ctv_spectrogram.png (cyan lines = big hits, white bands = holds); voices_spectrogram.png = the three genre moments.\n')
    spectro(chk, cues, gaps)
    return cues


def spectro(y, cues, gaps):
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
        if q['nm'] in ('splash_slam', 'logo_slam', 'bolt_crack', 'cross_out', 'glass_shatter', 'week_finale', 'lib:stadium_goal_eruption',
                       'thx_swell', 'tur_dum', 'bolly_sting', 'vortex_suck_s', 'boom_med'):
            ax[0].axvline(q['t'], color='c', lw=0.6, alpha=0.7)
            ax[0].text(q['t'], 16000, q['nm'].replace('lib:', '')[:10], color='c', fontsize=7, rotation=90, va='top')
    for h in HOLDS:
        ax[0].axvspan(h['T0'], h['T0'] + h['d'], color='w', alpha=0.10)
    e = 20 * np.log10(np.sqrt(uniform_filter1d(m ** 2, 480)) + 1e-9)
    ax[1].plot(np.arange(len(m)) / SR, e, lw=0.5)
    ax[1].set_ylim(-90, 0)
    for g0, g1 in gaps:
        ax[1].axvspan(g0, g1, color='r', alpha=0.2)
    ax[1].set_xlim(0, DUR)
    ax[1].set_xticks(np.arange(0, DUR + 0.5, 1))
    plt.tight_layout()
    plt.savefig(os.path.join(HERE, 'master_ctv_spectrogram.png'), dpi=70)


if __name__ == '__main__':
    main()
