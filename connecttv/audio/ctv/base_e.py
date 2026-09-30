

# ----------------------------------------------------------------------------------------------
# Time map (output clock T = voice clock v + holds), grids, cue table
# ----------------------------------------------------------------------------------------------
HOLDS = [('cin', 8.85, 1.4), ('tur', 9.98, 1.0), ('ind', 11.03, 1.1)]      # (k, v, d)  as timeline.js


def TofV(v):
    return v + sum(d for _, hv, d in HOLDS if hv < v)


HOLD_T = {'cin': (8.85, 10.25), 'tur': (11.38, 12.38), 'ind': (13.43, 14.53)}


class Grid:
    """uniform grid: t = t0 + beat * b"""
    def __init__(self, t0, b):
        self.t0, self.b = t0, b

    def __call__(self, beat):
        return self.t0 + beat * self.b


class PW:
    """piece-wise tempo map: anchors [(beat, T), ...]; linear inside, last/first slope outside."""
    def __init__(self, anchors):
        self.bt = np.array([a[0] for a in anchors], float)
        self.tt = np.array([a[1] for a in anchors], float)
        self.b = (self.tt[1] - self.tt[0]) / (self.bt[1] - self.bt[0])

    def __call__(self, beat):
        if beat <= self.bt[0]:
            return self.tt[0] + (beat - self.bt[0]) * (self.tt[1] - self.tt[0]) / (self.bt[1] - self.bt[0])
        if beat >= self.bt[-1]:
            return self.tt[-1] + (beat - self.bt[-1]) * (self.tt[-1] - self.tt[-2]) / (self.bt[-1] - self.bt[-2])
        return float(np.interp(beat, self.bt, self.tt))


# cue table (voice clock v -> T).  Adapted to the scene files' // CUE comments (see SCORE_NOTES.md)
T_BOLT = 0.74                      # v0.74  bolt crack on "המסך"
T_SHARD = 1.26                     # v1.26  shard burst
T_OPEN = 2.33                      # v2.33  "נפתח" big hit
T_HOOK = 3.40                      # theme statement
T_NFX = TofV(4.34)                 # netflix slam
T_DIS = TofV(5.99)                 # disney sparkle
T_SLAM = TofV(8.32)                # Charlton slam
T_CIN0, T_CIN1 = HOLD_T['cin']     # 8.85 .. 10.25 (braaam -> pickup landing)
T_LAND1 = 10.26                    # cin landing tutti (voice resumes 10.28)
T_TUR0, T_TUR1 = HOLD_T['tur']
T_LAND2 = 12.39                    # tur landing (voice resumes 12.40)
T_IND0, T_IND1 = HOLD_T['ind']
T_LAND3 = 14.54                    # ind landing (voice resumes 14.55)
T_VORTEX = TofV(13.82)             # 17.32 "אחד"
T_NAGISH = TofV(14.87)             # 18.37 tap
T_DAY0, T_DAYN = TofV(15.86), TofV(16.75)      # 7 evenly spaced day pops 19.36 .. 20.25
T_GOAL = TofV(17.40)               # 20.90
T_WAIT = TofV(18.78)               # 22.28 anticipation
T_FUN = TofV(21.30)                # 24.80 discover burst (v21.3 "כיף")
T_NO1, T_NO2 = TofV(22.36), TofV(23.55)        # 25.86, 27.05
T_XSLAM = TofV(23.18)              # 26.68 X on the magnifier
T_XOUT = TofV(24.43)               # 27.93 bolts cross out
T_RELIEF = TofV(24.80)             # 28.30 calm-tv-resolve
T_PICK = TofV(25.08)               # 28.58
T_TAP = TofV(26.05)                # 29.55 tap impact
T_BURST = TofV(26.30)              # 29.80 tile burst fullscreen
T_PLAY = TofV(26.94)               # 30.44 playback burst
T_GOALB = TofV(27.20)              # 30.70 goal burst
T_SUCK = TofV(27.42)               # 30.92 iris suck
T_LOGO = TofV(27.60)               # 31.10 LOGO SLAM (final cadence / tutti)
T_TAG = TofV(28.10)                # 31.60 tagline pop
T_FADE0 = 33.05
DAY_T = [T_DAY0 + i * (T_DAYN - T_DAY0) / 6 for i in range(7)]

_words = __import__('json').loads(open(os.path.join(HERE, '..', '..', 'words.js')).read().split('=', 1)[1].strip().rstrip(';'))


def _speech_segments():
    segs = []
    for w in _words:
        a, b = TofV(w['t0']), TofV(w['t1'])
        if segs and a - segs[-1][1] < 0.25:
            segs[-1][1] = b
        else:
            segs.append([a, b])
    return [tuple(x) for x in segs]


LINES = _speech_segments()


def hum(ms=3.0):
    return float(RNG.uniform(-ms, ms)) / 1000


def rv(a, b):
    return int(RNG.integers(a, b + 1))


# ----------------------------------------------------------------------------------------------
# Harmony helpers (key: E minor -> G major)
# ----------------------------------------------------------------------------------------------
QUAL = {'m': [0, 3, 7], 'M': [0, 4, 7]}
CHORD = {'Em': (4, 'm'), 'E': (4, 'M'), 'C': (0, 'M'), 'G': (7, 'M'), 'D': (2, 'M'), 'Am': (9, 'm'), 'A': (9, 'M'),
         'B': (11, 'M'), 'Bm': (11, 'm'), 'F#': (6, 'M'), 'F': (5, 'M')}


def ct(ch):
    r, q = CHORD[ch]
    return r, [(r + i) % 12 for i in QUAL[q]]


def near(pc, lo):
    x = int(lo)
    while x % 12 != pc % 12:
        x += 1
    return x


def brass_line(g, line, vel, parts=('hn', 'tp'), hn_oct=-12, tp_oct=0, beats=(-99, 99), legato=1.0, oct_up=0):
    """hook on horns (octave below) + trumpets; long notes on sustain samples, short on staccato."""
    for b, d, n_ in line:
        if not (beats[0] <= b < beats[1]):
            continue
        t = g(b) + hum(3)
        dur = (g(b + d) - g(b)) * (legato if d >= .75 else 0.9)
        v = vel + (6 if d >= 1 else 0) + rv(-3, 3)
        for pn, octv in (('hn', hn_oct), ('tp', tp_oct)):
            if pn not in parts:
                continue
            nn = m(n_) + octv + oct_up
            if d >= .75:
                PARTS[pn + '_su'].n(t, dur, nn, v)
            else:
                PARTS[pn + '_st'].n(t, dur, nn, v - 4)


def strings_line(g, line, vel, octv=12, beats=(-99, 99)):
    for b, d, n_ in line:
        if not (beats[0] <= b < beats[1]):
            continue
        t = g(b) + hum(3)
        dur = (g(b + d) - g(b)) * (1.0 if d >= .75 else 0.9)
        (vln_su if d >= .75 else vln_sp).n(t, dur, m(n_) + octv, vel + rv(-3, 3))


ACC = {0, 3, 6, 8, 11, 14}


def ost16(t0, s, n, ch, lvl=1.0, layers=('vc', 'cb', 'vla', 'vln'), ph=0, vln_lo='D5', cresc=None):
    """driving 16th spiccato ostinato (3-3-2 accents): cellos + basses on the root, violas + violins on a rocking arpeggio."""
    r, pcs = ct(ch)
    for i in range(n):
        u = i / max(1, n - 1)
        L = lvl * (1.0 if cresc is None else cresc[0] + (cresc[1] - cresc[0]) * u)
        t = t0 + i * s + hum(2.5)
        p16 = (i + ph) % 16
        a = p16 in ACC
        v = (108 if a else 74) * L
        if 'vc' in layers:
            root = near(r, m('C3'))
            nn = root + (12 if p16 in (7, 15) else (7 if p16 == 10 else 0))
            vc_sp.n(t, s * 0.9, nn, v + rv(-4, 4))
        if 'cb' in layers and a:
            cb_sp.n(t, s * 0.95, near(r, m('C2')), v + 2 + rv(-3, 3))
        if 'vla' in layers:
            seq = [pcs[2], pcs[0], pcs[1], pcs[0]]
            vla_sp.n(t, s * 0.85, near(seq[i % 4], m('G3')), v - 8 + rv(-4, 4))
        if 'vln' in layers:
            seq = [pcs[0], pcs[1], pcs[2], pcs[1]]
            vln_sp.n(t, s * 0.85, near(seq[i % 4], m(vln_lo)), v - 12 + rv(-4, 4))


def pads(t0, t1, ch, lvl=80, strings=True, choir_on=False, low=True, hi=True):
    r, pcs = ct(ch)
    d = t1 - t0
    if strings:
        if hi:
            vln_su.n(t0, d, [near(pcs[1], m('B4')), near(pcs[0], m('E5'))], lvl)
        vla_su.n(t0, d, [near(pcs[2], m('G3')), near(pcs[0], m('E4'))], lvl)
        if low:
            vc_su.n(t0, d, near(r, m('C3')), lvl)
            cb_su.n(t0, d, near(r, m('C2')), lvl - 4)
    if choir_on:
        choir.n(t0, d, [near(pcs[0], m('E4')), near(pcs[1], m('G4')), near(pcs[2], m('B4'))], lvl)


def kit16(t0, s, n, style, lvl=1.0, ph=0):
    for i in range(n):
        t = t0 + i * s + hum(2.0)
        p = (i + ph) % 16
        if style == 'half':          # half-time: kick 1 & 'and' of 2, snare on 3
            if p in (0, 6, 10):
                kick.n(t, 0.3, 60, (118 if p == 0 else 100) * lvl + rv(-3, 3))
            if p == 8:
                snare.n(t, 0.3, 60, 118 * lvl + rv(-3, 3))
            if p % 2 == 0:
                hh.n(t, 0.1, 60, (96 if p % 4 == 0 else 70) * lvl + rv(-5, 5))
        elif style == 'drive':       # straight 2 & 4 with 16th hats
            if p in (0, 6, 8, 10, 14):
                kick.n(t, 0.3, 60, (120 if p in (0, 8) else 96) * lvl + rv(-3, 3))
            if p in (4, 12):
                snare.n(t, 0.3, 60, 122 * lvl + rv(-2, 2))
            if p in (7, 15) and RNG.random() < 0.6:
                snc.n(t, 0.1, 60, 36 + rv(-4, 4))
            if p == 14:
                hho.n(t, s * 1.6, 60, 90 * lvl)
            else:
                hh.n(t, 0.08, 60, [100, 52, 76, 58][p % 4] * lvl + rv(-5, 5))
        elif style == 'four':        # four on the floor + off-beat open hat (pop drop)
            if p % 4 == 0:
                kick.n(t, 0.3, 60, 118 * lvl + rv(-3, 3))
            if p in (4, 12):
                snare.n(t, 0.3, 60, 116 * lvl + rv(-2, 2))
            if p % 4 == 2:
                hho.n(t, s * 1.6, 60, 84 * lvl)
            elif p % 2 == 1:
                hh.n(t, 0.06, 60, 56 * lvl + rv(-4, 4))
        elif style == 'lite':        # light pulse under speech
            if p in (0, 8):
                kick.n(t, 0.3, 60, 104 * lvl)
            if p % 4 == 0:
                hh.n(t, 0.08, 60, 70 * lvl + rv(-5, 5))
        elif style == 'build':
            if p % 4 == 0:
                kick.n(t, 0.3, 60, 112 * lvl)
            if p in (4, 12):
                snare.n(t, 0.3, 60, 116 * lvl)
            hh.n(t, 0.08, 60, [90, 50, 70, 50][p % 4] * lvl + rv(-5, 5))


def taiko8(t0, b, beats, style='A', lvl=1.0):
    pats = {'A': [(0, 124), (1.75, 96), (2, 112), (3.5, 100)],
            'C': [(0, 124), (0.75, 90), (1.5, 104), (2, 118), (2.75, 90), (3, 100), (3.5, 110)],
            '8': [(i / 2, 118 if i % 2 == 0 else 96) for i in range(8)]}[style]
    for bar in range(int(np.ceil(beats / 4))):
        for off, v in pats:
            bt = bar * 4 + off
            if bt < beats - 1e-6:
                taiko.n(t0 + bt * b + hum(3), 0.5, 60 if off % 1 == 0 else 64, v * lvl + rv(-4, 4))


def stab(t, ch, vel=110, dur=0.18):
    """low-brass + tuba stab"""
    r, pcs = ct(ch)
    tb_st.n(t, dur, [near(r, m('E2')), near(pcs[2], m('B2')), near(r, m('E3'))], vel)
    tu_st.n(t, dur, near(r, m('E1')), vel)


def tutti(t, ch, big=1.0, dur=0.45, crash_on=True, choir_on=True, top=None, lead=0.08):
    """full-orchestra hit. Slow-attack sustains (horns, violins, violas, choir) start `lead` s early so their body peaks on the hit."""
    r, pcs = ct(ch)
    v = int(min(127, 124 * big))
    tl = t - lead
    dl = dur + lead
    hn_su.n(tl, dl, [near(r, m('E3')), near(pcs[1], m('E3')), near(pcs[2], m('E3'))], v)
    tp_su.n(t - 0.02, dur + 0.02, [near(pcs[1], m('G4')), near(r, m('C5'))], v)
    tb_su.n(t - 0.02, dur + 0.02, [near(r, m('E2')), near(pcs[2], m('B2')), near(r, m('E3'))], v)
    tu_su.n(t - 0.02, dur + 0.02, near(r, m('E1')), v)
    vln_su.n(tl, dl, [near(r, m('E5')), near(pcs[1], m('G5'))], v)
    vla_su.n(tl, dl, near(pcs[2], m('G3')), v)
    vc_su.n(t - 0.04, dur + 0.04, near(r, m('C3')), v)
    cb_su.n(t - 0.03, dur + 0.03, near(r, m('C2')), v)
    timp.n(t, 1.0, near(r, m('D2')), v)
    trailer.n(t, 1.5, 58, v)
    bd.n(t, 2.0, 60, v)
    boom.n(t, 1.6, 60, int(100 * big), f0=85, f1=30)
    sub.n(t, dur + 0.6, near(r, m('E1')), int(100 * big))
    if choir_on:
        choir.n(tl - 0.03, dl + 0.03, [near(pcs[0], m('E4')), near(pcs[1], m('G4')), near(pcs[2], m('B4'))], int(min(127, 110 * big)))
    if crash_on:
        ocym.n(t, 3.0, 60, v)
        crash.n(t + 0.004, 2.0, 60, v)


def sparkle(t, root_pc, notes=10, dur=0.5, scale=(0, 2, 4, 7, 9), base='E5', vel=80, dens=70):
    """harp glissando + glockenspiel + celesta + glint dust (magic accent)"""
    b0 = m(base)
    seq = []
    o = 0
    i = 0
    while len(seq) < notes:
        seq.append(b0 - 12 + root_pc - (b0 % 12) + 12 * o + scale[i % len(scale)] + (0 if (root_pc - (b0 % 12) + scale[i % len(scale)]) >= 0 else 12))
        i += 1
        if i % len(scale) == 0:
            o += 1
    for k, nn in enumerate(seq):
        harp.n(t + k * dur / notes, 0.8, nn, vel + 2 * k)
    for k, nn in enumerate(seq[-4:]):
        glock.n(t + dur * 0.6 + k * 0.05, 0.6, nn + 12, vel - 6 + k * 3)
        celesta.n(t + dur * 0.6 + k * 0.05 + 0.01, 0.6, nn + 12, vel - 14 + 3 * k)
    shim.n(t, dur + 0.5, 60, int(vel * 0.9), dens=dens, root=root_pc, scale=list(scale), o0=6, o1=8, peak=0.3)


# ----------------------------------------------------------------------------------------------
# The hook (E minor) and the chorus hook (G major).  Beats are quarter notes from the grid origin.
#   brand motif "Con-nect-T-V" = B E F# G (minor)  /  D G A B (major)
# ----------------------------------------------------------------------------------------------
HOOK_MIN = [(0, 1, 'B4'), (1, .5, 'E5'), (1.5, .5, 'F#5'), (2, 1.5, 'G5'), (3.5, .5, 'F#5'),
            (4, 1, 'E5'), (5, .5, 'D5'), (5.5, .5, 'E5'), (6, 1, 'F#5'), (7, 1, 'A5')]
CHO_A = [(0, 1, 'D5'), (1, .5, 'G5'), (1.5, .5, 'A5'), (2, 1.5, 'B5'), (3.5, .5, 'A5')]
CHO_B = [(0, 1.5, 'D6'), (1.5, .5, 'B5'), (2, 1, 'G5'), (3, 1, 'A5')]


# ----------------------------------------------------------------------------------------------
# Sections
# ----------------------------------------------------------------------------------------------
def intro():
    """0 - 3.40: dark drone + riser -> bolt crack 0.74 -> world floods open -> 'נפתח' 2.33 (C major, radiant) -> B pedal -> hook 3.40"""
    g = Grid(T_BOLT, 0.53)                       # 3 beats to 2.33, 5 beats to 3.40 (113 BPM, accelerating into the hook)
    # ---- 0 - 0.74 suspense: low E drone swell, sub, riser
    cb_dr.n(0.0, 1.6, 'E1', 80)
    vc_dr.n(0.0, 1.6, ['E2', 'B2'], 74)
    vc_dr.ex(0.0, 0.7, -22, -2, 1.3, pre=False, post=False)
    cb_dr.ex(0.0, 0.7, -22, -2, 1.3, pre=False, post=False)
    sub.n(0.0, 1.0, 'E1', 70)
    tb_su.n(0.25, 0.5, ['E2', 'B2'], 70)
    tb_su.ex(0.25, T_BOLT, -20, -4, 1.4, pre=False, post=False)
    riser.n(0.05, T_BOLT - 0.05, 60, 80, kind='noise', lo=200, hi=8000, n0=40)
    riser.n(T_BOLT, T_BOLT - 0.02, 60, 90, kind='cym', len='s')
    for i, tt in enumerate((0.05, 0.36)):          # heartbeat
        timp.n(tt, 0.4, 'E1', 44 + 10 * i)
    # ---- 0.74 : the bolt cracks the screen
    zap.n(T_BOLT, 0.5, 60, 122)
    timp.n(T_BOLT, 1.2, 'E2', 127)
    bd.n(T_BOLT, 2.0, 60, 124)
    trailer.n(T_BOLT, 1.5, 55, 120)
    boom.n(T_BOLT, 1.6, 60, 118, f0=90, f1=30)
    sub.n(T_BOLT, 1.6, 'E1', 110)
    stab(T_BOLT, 'Em', 122, 0.35)
    tb_su.n(T_BOLT, 0.5, ['E2', 'B2', 'E3'], 110)
    ocym.n(T_BOLT, 2.5, 60, 100)
    shim.n(T_BOLT, 0.7, 60, 100, dens=110, root=4, scale=[0, 3, 7, 10, 2], o0=7, o1=9, peak=0.1)
    # ---- 0.74 - 2.33 the world floods open: rising arpeggios, spiccato build, timpani/snare roll
    arp = [['E4', 'G4', 'B4', 'E5', 'G5', 'B5'], ['A4', 'C5', 'E5', 'A5', 'C6', 'E6'], ['B4', 'D#5', 'F#5', 'B5', 'D#6', 'F#6']]
    for bt in range(3):
        for k in range(6):
            tt = g(bt + 0.15 + k * 0.14)
            if tt < T_OPEN - 0.03:
                harp.n(tt, 0.5, arp[bt][k], 68 + 6 * bt + 2 * k)
    s16 = 0.53 / 4
    for i in range(int((T_OPEN - (T_BOLT + 0.53)) / s16) - 1):
        tt = T_BOLT + 0.53 + i * s16
        u = i / 10.0
        seq = ['E', 'G', 'B', 'E']
        vln_sp.n(tt, s16 * 0.85, m(['E5', 'G5', 'B5', 'E6'][i % 4]) if i < 4 else m(['A5', 'C6', 'E6', 'A6'][i % 4]) if i < 8 else m(['B5', 'D#6', 'F#6', 'B6'][i % 4]), 58 + 6 * i)
        vla_sp.n(tt, s16 * 0.85, m(['E4', 'B3', 'G4', 'B3'][i % 4]) if i < 4 else m(['A3', 'E4', 'C4', 'E4'][i % 4]) if i < 8 else m(['B3', 'F#4', 'D#4', 'F#4'][i % 4]), 54 + 6 * i)
        vc_sp.n(tt, s16 * 0.85, 'E3' if i < 4 else 'A3' if i < 8 else 'B3', 60 + 6 * i)
    vln_su.n(T_BOLT + 0.3, T_OPEN - T_BOLT - 0.3, [m('E5'), m('B5')], 80)
    vln_su.ex(T_BOLT + 0.3, T_OPEN, -22, -2, 1.4)
    vla_su.n(T_BOLT + 0.3, T_OPEN - T_BOLT - 0.3, [m('G4'), m('E5')], 78)
    vla_su.ex(T_BOLT + 0.3, T_OPEN, -22, -2, 1.4)
    cb_su.n(T_BOLT + 0.3, T_OPEN - T_BOLT - 0.3, 'E2', 90)
    cb_su.ex(T_BOLT + 0.3, T_OPEN, -22, -2, 1.4)
    # shard burst 1.26
    tp = T_SHARD
    taiko.n(tp, 0.5, 60, 100)
    tb_st.n(tp, 0.15, ['E2', 'B2'], 96)
    sparkle(tp, 4, notes=8, dur=0.35, scale=(0, 3, 7, 10, 12), base='E5', vel=76, dens=60)
    # timpani roll + snare roll into 2.33
    tt = T_OPEN - 0.55
    while tt < T_OPEN - 0.01:
        u = (tt - (T_OPEN - 0.55)) / 0.55
        timp.n(tt + hum(3), 0.1, 'E2', int(46 + 76 * u ** 1.2))
        tt += 0.06
    tt = T_OPEN - 0.42
    while tt < T_OPEN - 0.01:
        u = (tt - (T_OPEN - 0.42)) / 0.42
        snc.n(tt, 0.05, 60, int(36 + 80 * u ** 1.4))
        tt += 0.045
    riser.n(T_OPEN, 0.85, 60, 100, kind='cym', len='s')
    riser.n(T_BOLT + 0.5, T_OPEN - T_BOLT - 0.5, 60, 84, kind='noise', lo=300, hi=10000, n0=52, oct=2.2)
    # ---- 2.33 the world opens: C major (VI) radiant tutti, choir, harp+celesta sweep
    tutti(T_OPEN, 'C', 1.15, dur=0.9)
    braaam.n(T_OPEN, 0.7, 'C2', 90)
    gong.n(T_OPEN + 0.005, 3.0, 60, 96)
    oohs.n(T_OPEN, 1.0, ['C5', 'E5', 'G5'], 100)
    sparkle(T_OPEN + 0.02, 0, notes=14, dur=0.55, scale=(0, 2, 4, 7, 9), base='C5', vel=86, dens=90)
    hn_su.n(T_OPEN + 0.02, 0.9, ['G3', 'E4'], 104)
    # ---- 2.33 - 3.40 ring, then B pedal (V) pickup into the hook
    pads(T_OPEN + 0.05, T_HOOK - 0.02, 'C', lvl=80, choir_on=False)
    for k, nn in enumerate(['C6', 'G5', 'E5', 'G5', 'C6', 'E6']):
        harp.n(T_OPEN + 0.25 + k * 0.13, 0.5, nn, 66 + 2 * k)
    t_b = g(4)
    tb_su.n(t_b, T_HOOK - t_b - 0.02, ['B2', 'F#3'], 92)
    tb_su.ex(t_b, T_HOOK, -12, -1, 1.2, pre=False, post=False)
    for k in range(4):                            # staccato pickup 'da da da DA' on B, leading tone D#
        tt = T_HOOK - 0.53 * 0.9 + k * 0.53 * 0.22
        vc_sp.n(tt, 0.1, 'B3', 84 + 5 * k)
        hn_st.n(tt, 0.1, 'B3' if k < 3 else 'B4', 90 + 5 * k)
    riser.n(T_OPEN + 0.4, T_HOOK - T_OPEN - 0.4, 60, 70, kind='noise', lo=400, hi=9000, n0=47)
    for i in range(5):
        snc.n(T_HOOK - 0.24 + i * 0.05, 0.06, 60, 60 + 12 * i)


def sectionA():
    """3.40 - 8.32: E minor hook statement; netflix accent, disney sparkle, sports build -> Charlton slam 8.32"""
    g = Grid(T_HOOK, (T_SLAM - T_HOOK) / 10.5)
    s = g.b / 4
    segs = [(0, 4, 'Em'), (4, 2, 'C'), (6, 2, 'D'), (8, 2.5, 'B')]
    for b0, d, ch in segs:
        n16 = int(round(d * 4))
        lay = ('vc', 'cb', 'vla') if b0 < 4 else ('vc', 'cb', 'vla', 'vln')
        ost16(g(b0), s, n16, ch, lvl=0.8 if b0 < 4 else (0.9 if b0 < 8 else 1.0), layers=lay, ph=int(b0 * 4),
              cresc=(1.0, 1.25) if b0 == 8 else None)
        pads(g(b0), g(b0 + d) - 0.02, ch, lvl=64, strings=True, low=False)
        r, _ = ct(ch)
        sub.n(g(b0), g.b * d - 0.05, near(r, m('E1')), 84)
    kit16(g(0), s, 16, 'half', 0.9)
    kit16(g(4), s, 16, 'drive', 0.95, ph=0)
    taiko8(g(0), g.b, 8, 'A', 0.9)
    # bar 3 build: toms + snare accel to the slam (matches the scene's drum-roll hits 8.03 ... 8.31)
    for i in range(4):
        (tomh if i % 2 == 0 else toml).n(g(8 + i / 4), 0.3, 60, 88 + 8 * i)
    for tt, v in zip([8.03, 8.09, 8.15, 8.20, 8.24, 8.27, 8.29, 8.31], [70, 78, 86, 94, 102, 110, 118, 124]):
        snare.n(tt, 0.1, 60, v)
    oroll.n(T_SLAM - 0.7, 0.72, 60, 100)
    oroll.ex(T_SLAM - 0.7, T_SLAM, -20, 0, 1.3, pre=False, post=False)
    for i in range(6):
        taiko.n(g(8 + i * 0.4), 0.3, 60 if i % 2 == 0 else 64, 100 + 4 * i)
    # hook (horns, then + trumpets), violins double from bar 2
    brass_line(g, HOOK_MIN, 90, beats=(0, 4), parts=('hn',))
    brass_line(g, HOOK_MIN, 96, beats=(4, 8), parts=('hn', 'tp'))
    brass_line(g, [(0, 1, 'B4'), (1, .5, 'E5'), (1.5, .5, 'F#5'), (2, 1.5, 'G5'), (3.5, .5, 'F#5')], 88, beats=(0, 4), parts=('tp',))
    strings_line(g, HOOK_MIN, 84, octv=12, beats=(4, 8))
    # sustained trumpet + horn B (dominant) crescendo through the build
    tp_su.n(g(8), T_SLAM - g(8) - 0.02, ['B4', 'F#5'], 100)
    tp_su.ex(g(8), T_SLAM, -14, 0, 1.3, pre=False, post=False)
    hn_su.n(g(8), T_SLAM - g(8) - 0.02, ['B3', 'D#4', 'F#4'], 96)
    tb_su.n(g(8), T_SLAM - g(8) - 0.02, ['B1', 'B2'], 96)
    # NETFLIX accent (beat 2) : tutti stab on Em
    t = T_NFX
    stab(t, 'Em', 116, 0.25)
    taiko.n(t, 0.5, 60, 122)
    crash.n(t, 1.6, 60, 108)
    kick.n(t, 0.3, 60, 120)
    boom.n(t, 1.0, 60, 90, f0=80, f1=32)
    tutti(t, 'Em', 0.85, dur=0.3, crash_on=False, choir_on=False)
    # DISNEY+ magical sparkle (C lydian) : harp glissando, glock, celesta, glint dust
    sparkle(T_DIS - 0.02, 0, notes=16, dur=0.55, scale=(0, 2, 4, 6, 7, 9, 11), base='E5', vel=84, dens=100)
    hn_su.n(T_DIS, 0.7, ['E4', 'G4'], 86)
    vln_su.n(T_DIS, 0.8, ['G5', 'E6'], 74)
    # sports lift: horn-stab 'da-da' on the D, then the slam
    for k, tt in enumerate([g(7), g(7.5)]):
        stab(tt, 'D', 100 + 6 * k, 0.15)
    # CHARLTON slam 8.32 : power chord E (open fifth) + trailer drum + gong; then a low stab on the way into the braaam
    t = T_SLAM
    tutti(t, 'Em', 1.2, dur=0.55)
    trailer.n(t, 1.6, 52, 127)
    gong.n(t, 3.0, 60, 110)
    braaam.n(t, 0.5, 'E1', 100)
    riser.n(t + 0.0, 0.05, 60, 60, kind='cym', len='s')
    stab(t + 0.265, 'Em', 104, 0.2)
    timp.n(t + 0.265, 0.6, 'E2', 110)
    for i in range(3):
        snc.n(t + 0.40 + i * 0.045, 0.05, 60, 60 + 14 * i)


def cin():
    """hold 8.85 - 10.25: cinema-trailer braaam, low brass, choir swell, timpani roll; accelerating run + snare roll land on 10.26"""
    t0, t1, tl = T_CIN0, T_CIN1, T_LAND1
    for pp, ns, v in [(tb_su, ['E2', 'B2', 'E3'], 127), (tu_su, ['E1', 'E2'], 127), (hn_su, ['E3', 'B3', 'E4'], 124)]:
        pp.n(t0, 1.0, ns, v)
    braaam.n(t0, 1.0, 'E1', 118)
    braaam.n(t0, 1.0, 'B1', 90)
    trailer.n(t0, 2.0, 52, 127)
    boom.n(t0, 2.0, 60, 120, f0=95, f1=28)
    gong.n(t0 + 0.01, 3.0, 60, 118)
    bd.n(t0, 2.0, 60, 124)
    ocym.n(t0, 2.0, 60, 110)
    sub.n(t0, 1.2, 'E1', 118)
    # second braaam a semitone up (dread, F natural = the Phrygian colour) halfway
    t2 = t0 + 0.7
    for pp, ns, v in [(tb_su, ['F2', 'C3', 'F3'], 118), (tu_su, ['F1', 'F2'], 118)]:
        pp.n(t2, 0.45, ns, v)
    braaam.n(t2, 0.5, 'F1', 104)
    trailer.n(t2, 1.0, 53, 118)
    # timpani roll crescendo on E
    tt = t0 + 0.12
    while tt < tl - 0.01:
        u = (tt - t0) / (tl - t0)
        timp.n(tt + hum(3), 0.12, 'E2', int(40 + 84 * u ** 1.3))
        tt += 0.052
    # choir + low strings swell (dark E minor)
    choir.cc(t0, 11, 30)
    choir.n(t0 + 0.2, tl - t0 - 0.2, ['E3', 'B3', 'E4', 'G4', 'B4'], 110)
    choir.expr(t0 + 0.2, tl - 0.03, 30, 127, 1.6)
    oohs.cc(t0, 11, 20)
    oohs.n(t0 + 0.3, tl - t0 - 0.3, ['E5', 'G5'], 90)
    oohs.expr(t0 + 0.3, tl - 0.03, 20, 118, 1.8)
    vc_tr.n(t0 + 0.1, tl - t0 - 0.1, ['E3', 'B3'], 100)
    vc_tr.ex(t0, tl - 0.03, -12, 0, 1.5)
    cb_su.n(t0 + 0.1, tl - t0 - 0.1, 'E2', 100)
    vln_tr.n(t0 + 0.5, tl - t0 - 0.5, ['E5', 'G5', 'B5'], 90)
    vln_tr.ex(t0 + 0.5, tl - 0.03, -18, -2, 1.4)
    # forward pickup: accelerating spiccato run up E minor (16ths -> 32nds) + snare roll, landing on the tutti
    scale = ['E3', 'F#3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'G5']
    ts = [tl - 0.02 - 0.62 * ((15 - k) / 15) ** 1.35 for k in range(16)]
    for k, (tk, nt) in enumerate(zip(ts, scale)):
        v = int(72 + 3.4 * k)
        vln_sp.n(tk, 0.09, [nt, m(nt) + 12], v)
        vla_sp.n(tk, 0.09, nt, v - 6)
        vc_sp.n(tk, 0.09, m(nt) - 12 if k % 2 == 0 else nt, v - 4)
    tt = tl - 0.55
    while tt < tl - 0.01:
        u = (tt - (tl - 0.55)) / 0.55
        snc.n(tt, 0.05, 60, int(38 + 84 * u ** 1.4))
        tt += 0.038
    riser.n(tl, 0.9, 60, 100, kind='cym', len='s')
    riser.n(tl - 0.7, 0.7, 60, 90, kind='noise', lo=250, hi=11000, n0=47, oct=3)
    trailer.n(tl - 0.7, 1.0, 52, 110)
    # landing: full tutti Em + crash + brand cell on the horns
    tutti(tl, 'Em', 1.1, dur=0.45)
    brass_line(Grid(tl, 0.452), [(0, .5, 'B4'), (.5, .5, 'E5'), (1, .5, 'F#5'), (1.5, 1, 'G5')], 104, parts=('hn', 'tp'))


def series1():
    """10.26 - 11.38 'סדרות טורקיות': theme keeps driving; the last 16ths cock the hammer for the Turkish hit"""
    t0 = T_LAND1
    s = (T_TUR0 - t0) / 10
    ost16(t0, s, 10, 'Em', 1.0, ph=0)
    kit16(t0, s, 10, 'drive', 1.0)
    taiko8(t0, s * 4, 2.5, 'C', 1.0)
    sub.n(t0, T_TUR0 - t0 - 0.03, 'E1', 96)
    for i in range(4):
        snare.n(T_TUR0 - 0.05 - (3 - i) * s / 2, 0.08, 60, 90 + 9 * i)
    timp.n(T_TUR0 - 0.03, 0.3, 'B1', 100)
    # (the horn cell was placed by cin())


def tur():
    """hold 11.38 - 12.38: Turkish drama pastiche (E Hijaz): dum-dum-DUM, string tremolo, oboe (duduk) lament, kanun, sob; roll -> pickup 12.39"""
    t0, t1 = T_TUR0, T_TUR1
    timp.n(t0, 1.0, 'E2', 127)
    stab(t0, 'E', 124, 0.3)
    vc_su.n(t0, 0.3, ['E2', 'E3'], 124)
    cb_su.n(t0, 0.3, 'E2', 124)
    darb.n(t0, 0.3, 60, 127, kind='doum')
    ocym.n(t0, 1.5, 60, 104)
    sub.n(t0, 0.5, 'E1', 110)
    riser.n(t0 - 0.30, 0.31, 60, 70, kind='noise', lo=600, hi=12000, n0=52, oct=3)
    # dum - dum - DUM
    timp.n(t0 + 0.25, 0.6, 'E2', 100)
    darb.n(t0 + 0.25, 0.3, 60, 104, kind='doum')
    timp.n(t0 + 0.50, 1.0, 'B1', 127)
    darb.n(t0 + 0.50, 0.3, 60, 127, kind='doum')
    stab(t0 + 0.50, 'E', 120, 0.25)
    ocym.n(t0 + 0.50, 1.2, 60, 92)
    # tremolo strings on the E-major triad with F (Hijaz colour), swelling
    vln_tr.n(t0 + 0.08, t1 - t0 - 0.30, ['B4', 'E5', 'G#5'], 104)
    vc_tr.n(t0 + 0.08, t1 - t0 - 0.30, ['E3', 'B3'], 104)
    vln_tr.ex(t0, t0 + 0.5, -14, -3, post=False)
    vln_tr.ex(t0 + 0.5, t1 - 0.28, -3, 0, pre=False)
    vc_tr.ex(t0, t1 - 0.28, -10, 0)
    # oboe (duduk-like) lament: Hijaz descending with scoops, and a sob (fall) on the last note
    ln = [(0.05, 'B4', 0.30, 96, dict(**{'from': -1.0, 'gl': 0.05})), (0.38, 'A4', 0.12, 90, {}), (0.52, 'G#4', 0.14, 92, {}),
          (0.68, 'F4', 0.16, 92, {}), (0.86, 'E4', 0.34, 96, dict(bend=(-2.2, 0.35), vib=0.35, vd=0.05))]
    for dt, n_, d, v, kw in ln:
        oboe.n(t0 + dt, d, n_, v, **kw)
    vln_solo.n(t0 + 0.05, 0.9, 'B5', 80, **{'from': 1.5, 'gl': 0.12, 'vib': 0.3, 'vd': 0.1, 'bend': (-2.5, 0.5)})
    # darbuka figure + kanun tremolo run answering the oboe
    for dt, k, v in [(0.10, 'tek', 88), (0.16, 'tek', 66), (0.38, 'tek', 90), (0.62, 'doum', 108), (0.68, 'tek', 82),
                     (0.74, 'tek', 92)]:
        darb.n(t0 + dt, 0.2, 60, v, kind=k)
    run = ['E6', 'D6', 'C6', 'B5', 'A5', 'G#5', 'F5', 'E5']
    for i, n_ in enumerate(run):
        for k in range(2):
            kanun.n(t0 + 0.56 + i * 0.045 + k * 0.022, 0.05, n_, 96 - 3 * i)
    # pickup: darbuka + snare roll and a Hijaz string run landing on T_LAND2
    tl = T_LAND2
    for i in range(10):
        darb.n(tl - 0.22 + i * 0.022, 0.06, 60, 80 + 4 * i, kind='tek')
    tt = tl - 0.30
    while tt < tl - 0.01:
        u = (tt - (tl - 0.30)) / 0.30
        snc.n(tt, 0.04, 60, int(46 + 80 * u ** 1.3))
        tt += 0.03
    hij = ['E4', 'F4', 'G#4', 'A4', 'B4', 'C5', 'D#5', 'E5']
    for k, nt in enumerate(hij):
        tk = tl - 0.02 - 0.26 * ((7 - k) / 7) ** 1.2
        vln_sp.n(tk, 0.06, [nt, m(nt) + 12], 84 + 5 * k)
        vla_sp.n(tk, 0.06, nt, 80 + 4 * k)
    timp.n(tl - 0.25, 0.3, 'B1', 96)
    riser.n(tl, 0.45, 60, 88, kind='cym', len='s')


def series2():
    """12.39 - 13.43 'סדרות הודיות': landing hit, 3-3-3 riff on the E pedal, B (V) tension into the Bollywood hit"""
    t0 = T_LAND2
    s = (T_IND0 - t0) / 9
    tutti(t0, 'Em', 0.95, dur=0.3, crash_on=True, choir_on=False)
    ost16(t0, s, 9, 'Em', 1.0, ph=0)
    for grp in range(3):
        tt = t0 + grp * 3 * s
        kick.n(tt, 0.2, 60, 118 - 4 * grp)
        snare.n(tt + s * 1.5, 0.2, 60, 100 + 6 * grp)
        hho.n(tt + s * 2, s, 60, 80)
        for pp, nt in ((hn_st, 'E4'), (tp_st, 'B4')):
            pp.n(tt, s * 0.9, m(nt) if grp < 2 else m(nt) + (0 if nt == 'B4' else 3), 100 + 5 * grp)
    taiko.n(t0, 0.3, 60, 118)
    taiko.n(t0 + 3 * s, 0.3, 64, 100)
    taiko.n(t0 + 6 * s, 0.3, 60, 110)
    timp.n(t0 + 6 * s, 0.4, 'B1', 100)
    sub.n(t0, 9 * s - 0.03, 'E1', 96)
    for i in range(3):
        snc.n(T_IND0 - 0.09 + i * 0.03, 0.04, 60, 70 + 14 * i)


def ind():
    """hold 13.43 - 14.53: Bollywood pastiche (E major): dhol + tabla groove, sitar plucks, bansuri line, brass hits; fill -> landing 14.54"""
    t0 = T_IND0
    s = 1.1 / 8
    # dhol / tabla groove (16th grid of 0.1375 s)
    pat = {0: ('dha', 118), 1: ('tak', 66), 2: ('ge', 96), 3: ('na', 98), 4: ('dha', 112), 5: ('tin', 88), 6: ('ge', 100), 7: ('na', 92)}
    for i, (k, v) in pat.items():
        tabla.n(t0 + i * s, 0.2, 60, v, kind=k, pan=0.15 if k in ('na', 'tin', 'tak') else -0.1)
    tabla.n(t0 + 6.5 * s, 0.2, 60, 84, kind='na', pan=0.15)
    tabla.n(t0 + 7.5 * s, 0.2, 60, 90, kind='tak', pan=0.15)
    for i, v in ((0, 118), (4, 108)):
        dhol_h.n(t0 + i * s, 0.4, 60, v)
    for i, v in ((2, 92), (3, 84), (6, 100), (7, 92)):
        dhol_s.n(t0 + i * s, 0.2, 60, v)
    for i in range(8):
        tamb.n(t0 + i * s + 0.5 * s, 0.1, 60, 60 + 8 * (i % 2))
    kick.n(t0, 0.3, 60, 112)
    # opening hit: brass E major stab + crash (zoom start)
    for pp, ns in [(tp_st, ['G#4', 'B4', 'E5']), (hn_st, ['E4', 'G#4', 'B4']), (tb_st, ['E2', 'B2', 'E3'])]:
        pp.n(t0, 0.22, ns, 116)
    crash.n(t0, 1.2, 60, 100)
    sub.n(t0, 0.5, 'E1', 100)
    # sitar plucks: fast ascending line with meend, then a held phrase
    sit = [(0.02, 'E4', 0.1, 100, {}), (0.14, 'F#4', 0.1, 92, {}), (0.26, 'G#4', 0.1, 96, {}), (0.39, 'A4', 0.12, 94, dict(**{'from': -1.5, 'gl': 0.06})),
           (0.52, 'B4', 0.3, 104, dict(**{'from': -2.0, 'gl': 0.09}))]
    for dt, n_, d, v, kw in sit:
        sitar.n(t0 + dt, d, n_, v, **kw)
    # bansuri (bamboo flute) answer with an ornamented descent
    ban = [(0.50, 'B5', 0.16, 96, dict(**{'from': -2.0, 'gl': 0.07})), (0.68, 'A5', 0.1, 90, {}), (0.78, 'G#5', 0.1, 92, {}),
           (0.88, 'F#5', 0.12, 92, {}), (1.0, 'E5', 0.34, 98, dict(vib=0.3, vd=0.06))]
    for dt, n_, d, v, kw in ban:
        flute_ex.n(t0 + dt, d, n_, v, **kw)
    # brass hits ta-ta-TA on the E major chord
    for dt, v in ((0.62, 96), (0.76, 104), (0.90, 116)):
        for pp, ns in [(tp_st, ['B4', 'E5']), (hn_st, ['E4', 'G#4'])]:
            pp.n(t0 + dt, 0.1, ns, v)
    vlnpz.n(t0 + 0.62, 0.1, ['E5', 'B5'], 84)
    # drone
    vla_su.n(t0, 1.1, 'E3', 60)
    vc_su.n(t0, 1.1, ['E2', 'B2'], 66)
    # fill + string run landing on the theme return
    tl = T_LAND3
    for i in range(8):
        tabla.n(tl - 0.24 + i * 0.03, 0.06, 60, 80 + 5 * i, kind='tak' if i % 2 else 'na', pan=0.1)
        dhol_s.n(tl - 0.24 + i * 0.03, 0.06, 60, 70 + 6 * i)
    tt = tl - 0.30
    while tt < tl - 0.01:
        u = (tt - (tl - 0.30)) / 0.30
        snc.n(tt, 0.04, 60, int(44 + 80 * u ** 1.3))
        tt += 0.03
    scl = ['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5', 'D#5', 'E5', 'F#5', 'G#5']
    for k, nt in enumerate(scl):
        tk = tl - 0.03 - 0.34 * ((9 - k) / 9) ** 1.25
        vln_sp.n(tk, 0.06, [nt, m(nt) + 12], 80 + 4 * k)
        vla_sp.n(tk, 0.06, nt, 74 + 4 * k)
    riser.n(tl, 0.45, 60, 88, kind='cym', len='s')


def live():
    """14.54 - 17.32: theme returns (E minor hook, driving), live wall; voice pause 16.16-16.58 = rising build; suck-in gap; vortex 17.32"""
    t0 = T_LAND3
    g = Grid(t0, (T_VORTEX - t0) / 6)
    s = g.b / 4
    tutti(t0, 'Em', 1.05, dur=0.35, crash_on=True)
    for b0, d, ch in [(0, 4, 'Em'), (4, 1, 'C'), (5, 1, 'D')]:
        n16 = int(round(d * 4))
        ost16(g(b0), s, n16, ch, lvl=1.0 if b0 < 4 else 1.08, ph=int(b0 * 4), cresc=(1.0, 1.3) if b0 == 5 else None)
        pads(g(b0), g(b0 + d) - 0.02, ch, lvl=70, low=False)
        r, _ = ct(ch)
        sub.n(g(b0), g.b * d - 0.05, near(r, m('E1')), 92)
    kit16(g(0), s, 16, 'drive', 1.0)
    kit16(g(4), s, 8, 'build', 1.0)
    taiko8(g(0), g.b, 4, 'C', 1.0)
    brass_line(g, HOOK_MIN, 100, beats=(0, 4), parts=('hn', 'tp'))
    strings_line(g, HOOK_MIN, 92, octv=12, beats=(0, 4))
    # pause build (16.16 - 17.32): rising strings scale, timpani, snare, riser, cymbal swell
    scl = ['E5', 'F#5', 'G5', 'A5', 'B5', 'C6', 'D6', 'E6']
    for k in range(8):
        nt = scl[k]
        vln_su.n(g(4) + k * s, s * 1.05, nt, 88 + 4 * k)
        vla_sp.n(g(4) + k * s, s * 0.9, m(nt) - 12, 80 + 4 * k)
    tt = g(4)
    while tt < T_VORTEX - 0.12:
        u = (tt - g(4)) / (T_VORTEX - 0.12 - g(4))
        timp.n(tt, 0.1, 'D2', int(56 + 66 * u))
        tt += 0.075 - 0.03 * u
    riser.n(g(3.5), T_VORTEX - g(3.5) - 0.02, 60, 96, kind='noise', lo=300, hi=12000, n0=47, oct=3)
    riser.n(T_VORTEX, T_VORTEX - g(4) - 0.05, 60, 100, kind='cym', len='m')
    tb_su.n(g(4), T_VORTEX - g(4) - 0.1, ['D2', 'A2', 'F#3'], 100)
    tb_su.ex(g(4), T_VORTEX - 0.1, -14, 0, 1.4, pre=False, post=False)


def chorus():
    """17.32 - 20.90: G major radiant drop.  'אחד' vortex hit = G; brand hook D G A B peaks on the 'נגיש' tap (18.37);
    7 rising day notes 19.36-20.25 over a sparse pad; scale run ends on F# (leading tone) -> goal 20.90 resolves on G."""
    g = PW([(0, T_VORTEX), (2, T_NAGISH), (4, T_DAY0)])
    tutti(T_VORTEX, 'G', 1.25, dur=0.6)
    gong.n(T_VORTEX, 3.0, 60, 100)
    braaam.n(T_VORTEX, 0.6, 'G1', 84)
    # 4 beats of driving G / Em
    for b0, d, ch in [(0, 2, 'G'), (2, 2, 'Em')]:
        s = (g(b0 + d) - g(b0)) / (d * 4)
        ost16(g(b0), s, int(d * 4), ch, lvl=1.05, ph=int(b0 * 4))
        kit16(g(b0), s, int(d * 4), 'four', 1.0, ph=int(b0 * 4))
        pads(g(b0) + 0.01, g(b0 + d) - 0.02, ch, lvl=88, choir_on=True)
        r, _ = ct(ch)
        sub.n(g(b0), g(b0 + d) - g(b0) - 0.04, near(r, m('E1')), 100)
    taiko8(g(0), (g(4) - g(0)) / 4, 4, 'C', 1.0)
    crash.n(T_VORTEX, 2.0, 60, 118)
    # brand hook, brass + trumpets + violins
    brass_line(g, CHO_A, 112, parts=('hn', 'tp'), hn_oct=-12)
    strings_line(g, CHO_A, 100, octv=12)
    flute_sv.n(g(2), g(3.5) - g(2), 'B6', 60)
    # NAGISH accent: tutti stab + harp sweep
    stab(T_NAGISH, 'Em', 116, 0.22)
    timp.n(T_NAGISH, 0.6, 'E2', 118)
    crash.n(T_NAGISH, 1.4, 60, 104)
    sparkle(T_NAGISH, 7, notes=8, dur=0.3, scale=(0, 2, 4, 7, 9), base='B4', vel=78, dens=50)
    # pops region (T_DAY0 -> goal): sparse pad, sub, quiet triplet-pulse; NO ostinato (leave room for the day-pops)
    tp0 = T_DAY0 - 0.01
    for (a, b, ch) in [(tp0, DAY_T[3] - 0.02, 'G'), (DAY_T[3] - 0.01, DAY_T[6] - 0.02, 'C'), (DAY_T[6] - 0.01, T_GOAL - 0.02, 'D')]:
        r, pcs = ct(ch)
        vln_su.n(a, b - a, [near(pcs[1], m('B4')), near(pcs[2], m('D5'))], 74)
        vla_su.n(a, b - a, [near(pcs[0], m('G3')), near(pcs[1], m('B3'))], 72)
        vc_su.n(a, b - a, near(r, m('C3')), 78)
        cb_su.n(a, b - a, near(r, m('C2')), 76)
        choir.n(a, b - a, [near(pcs[0], m('E4')), near(pcs[1], m('G4')), near(pcs[2], m('B4'))], 66)
        sub.n(a, b - a, near(r, m('E1')), 84)
    # quiet ticking pulse underneath (soft kick heartbeat), rising snare + cymbal into the goal
    for i in range(4):
        kick.n(DAY_T[0] + i * 0.445, 0.2, 60, 76 + 6 * i)
    tt = DAY_T[6] + 0.10
    while tt < T_GOAL - 0.01:
        u = (tt - (DAY_T[6] + 0.10)) / (T_GOAL - DAY_T[6] - 0.11)
        snc.n(tt, 0.04, 60, int(40 + 80 * u ** 1.4))
        tt += 0.04
    riser.n(DAY_T[3], T_GOAL - DAY_T[3] - 0.02, 60, 76, kind='noise', lo=400, hi=10000, n0=55, oct=2.4)
    riser.n(T_GOAL, T_GOAL - DAY_T[5], 60, 90, kind='cym', len='s')
    # the 7 day notes (separate 'days' stem): G A B C D E F#  (harp + violin pizzicato, F# = leading tone pending the goal)
    days = ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5']
    for k, (tt, nt) in enumerate(zip(DAY_T, days)):
        harp_d.n(tt, 0.55, nt, 74 + 5 * k)
        harp_d.n(tt + 0.004, 0.5, m(nt) - 12, 52 + 4 * k)
        pz_d.n(tt + 0.002, 0.12, nt, 62 + 5 * k)
    pno_d.n(DAY_T[6], 1.0, ['F#4', 'C#5'], 70)
    for i, nn in enumerate(['A5', 'B5', 'D6', 'E6', 'F#6']):
        harp_d.n(DAY_T[6] + 0.05 + i * 0.03, 0.6, nn, 62 - i * 3)
    # ---- GOAL 20.90 : G major tutti, the resolution of the F# leading tone; hook phrase 2
    gg = Grid(T_GOAL, (T_WAIT - T_GOAL) / 3)
    tutti(T_GOAL, 'G', 1.3, dur=0.8)
    gong.n(T_GOAL, 3.0, 60, 108)
    trailer.n(T_GOAL, 1.5, 55, 124)
    for b0, d, ch in [(0, 1.5, 'G'), (1.5, 1.5, 'D')]:
        s = gg.b / 4
        ost16(gg(b0), s, int(d * 4), ch, lvl=1.08, ph=0 if b0 == 0 else 6)
        kit16(gg(b0), s, int(d * 4), 'four', 1.05, ph=0 if b0 == 0 else 6)
        pads(gg(b0) + 0.01, gg(b0 + d) - 0.02, ch, lvl=92, choir_on=True)
        r, _ = ct(ch)
        sub.n(gg(b0), gg.b * d - 0.04, near(r, m('E1')), 100)
    taiko8(gg(0), gg.b, 3, 'C', 1.0)
    brass_line(gg, CHO_B, 114, parts=('hn', 'tp'), hn_oct=-12)
    strings_line(gg, CHO_B, 102, octv=12)
    crash.n(T_GOAL, 2.0, 60, 118)


def wait():
    """22.28 - 24.80: anticipation (Em / Am), ticking, tremolo swell, timpani; flute tease of the brand motif; riser into the discover burst"""
    g = Grid(T_WAIT, (T_FUN - T_WAIT) / 5)
    s = g.b / 4
    ch_plan = [(0, 2, 'Em'), (2, 1, 'Am'), (3, 1, 'Em'), (4, 1, 'B')]
    for b0, d, ch in ch_plan:
        r, pcs = ct(ch)
        a, b = g(b0) + 0.01, g(b0 + d) - 0.02
        vla_su.n(a, b - a, [near(pcs[2], m('G3')), near(pcs[0], m('E4'))], 66 + 3 * b0)
        vc_su.n(a, b - a, near(r, m('C3')), 72)
        cb_su.n(a, b - a, near(r, m('C2')), 70)
        sub.n(a, b - a, near(r, m('E1')), 78)
        if b0 >= 2:
            vln_tr.n(a, b - a, [near(pcs[1], m('B4')), near(pcs[0], m('E5'))], 76)
        choir.n(a, b - a, [near(pcs[0], m('E4')), near(pcs[1], m('G4')), near(pcs[2], m('B4'))], 56 + 5 * b0)
    vln_tr.ex(g(2), T_FUN, -14, -1, 1.4, pre=False, post=False)
    # clock ticks / countdown: high solo-violin staccato + closed hat, 8ths, crescendo
    i = 0
    tt = T_WAIT + 0.02
    while tt < T_FUN - 0.05:
        u = (tt - T_WAIT) / (T_FUN - T_WAIT)
        vsol_sp.n(tt, 0.08, 'E6' if i % 2 == 0 else 'B5', int(62 + 24 * u) if i % 2 == 0 else int(52 + 20 * u))
        hh.n(tt, 0.05, 60, int(52 + 34 * u))
        i += 1
        tt = T_WAIT + 0.02 + i * g.b / 2
    # heartbeat timpani on the beats, growing
    for k in range(5):
        timp.n(g(k), 0.5, 'E2' if k < 4 else 'B1', int(56 + 9 * k))
        if k >= 2:
            kick.n(g(k), 0.3, 60, int(70 + 10 * k))
    # flute tease of the brand motif (B E F# G) 'the series you are waiting for'
    for dt, n_, d, v in [(0.0, 'B5', 0.45, 74), (0.5, 'E6', 0.45, 76), (1.0, 'F#6', 0.45, 78), (1.5, 'G6', 1.0, 82)]:
        flute_sv.n(T_WAIT + 0.35 + dt, d, n_, v)
    # build to the burst
    tt = T_FUN - 0.5
    while tt < T_FUN - 0.01:
        u = (tt - (T_FUN - 0.5)) / 0.5
        snc.n(tt, 0.05, 60, int(40 + 80 * u ** 1.3))
        tt += 0.04
    riser.n(g(2), T_FUN - g(2) - 0.02, 60, 88, kind='noise', lo=300, hi=12000, n0=52, oct=3)
    riser.n(T_FUN, T_FUN - g(3), 60, 96, kind='cym', len='m')
    oroll.n(T_FUN - 0.9, 0.9, 60, 90)
    oroll.ex(T_FUN - 0.9, T_FUN, -22, -2, 1.3, pre=False, post=False)


def fun():
    """24.80 - 25.86: discover burst: C major (VI) sparkle, bouncy pizzicato, glock cascade, triangle-ish shimmer; drums light"""
    g = Grid(T_FUN, (T_NO1 - T_FUN) / 2)
    tutti(T_FUN, 'C', 1.0, dur=0.5, crash_on=True)
    braaam.n(T_FUN, 0.4, 'C2', 70)
    sparkle(T_FUN, 0, notes=20, dur=0.6, scale=(0, 2, 4, 7, 9), base='C5', vel=90, dens=120)
    # bouncy pizzicato chords (8ths) + glock/celesta cascade
    for k, (ch, dt) in enumerate([('C', 0.5), ('C', 0.75), ('G', 1.0), ('G', 1.25), ('G', 1.5), ('G', 1.75)]):
        r, pcs = ct(ch)
        tt = g(dt)
        vlnpz.n(tt, 0.1, [near(pcs[0], m('E5')), near(pcs[1], m('E5'))], 84)
        vlapz.n(tt, 0.1, near(pcs[2], m('G3')), 80)
        vcpz.n(tt, 0.1, near(r, m('C3')), 90)
    casc = ['G6', 'E6', 'D6', 'C6', 'G5', 'E6', 'C7']
    for k, nt in enumerate(casc):
        glock.n(g(0.5) + k * g.b * 0.25, 0.4, nt, 76)
        celesta.n(g(0.5) + k * g.b * 0.25 + 0.005, 0.4, nt, 60)
    kick.n(T_FUN, 0.3, 60, 116)
    for k in (1.0, 1.5):
        kick.n(g(k), 0.3, 60, 100)
        snare.n(g(k + 0.5) if k < 1.5 else g(1.75), 0.2, 60, 96)
    tamb.n(g(0.5), 0.2, 60, 90)
    tamb.n(g(1.0), 0.2, 60, 84)
    hn_su.n(T_FUN + 0.05, 0.95, ['C4', 'E4', 'G4'], 96)
    tp_su.n(T_FUN + 0.05, 0.95, ['G5', 'C6'], 92)
    vln_su.n(T_FUN + 0.05, 1.0, ['E5', 'G5', 'C6'], 90)
    choir.n(T_FUN, 1.0, ['C4', 'E4', 'G4', 'C5'], 96)
    pads(T_FUN + 0.5, T_NO1 - 0.02, 'G', lvl=84, choir_on=False)


def nos():
    """25.86 - 28.30: two NO slams (E minor, low, dry) with tension between; dizzy pizzicato/spiccato pulse; X cross-out; wave sweep"""
    # NO 1 (25.86)
    for t, big in ((T_NO1, 1.0), (T_NO2, 1.1)):
        stab(t, 'Em', 124, 0.35)
        tb_su.n(t, 0.5, ['E2', 'B2', 'E3'], 118 * big if big < 1.05 else 124)
        timp.n(t, 1.2, 'E2', 127)
        bd.n(t, 2.0, 60, 124)
        trailer.n(t, 1.6, 52, 124)
        boom.n(t, 1.6, 60, 118, f0=88, f1=29)
        sub.n(t, 1.4, 'E1', 118)
        crash.n(t, 1.6, 60, 108)
        cb_su.n(t, 0.6, 'E2', 110)
        vc_su.n(t, 0.6, ['E2', 'B2'], 104)
    braaam.n(T_NO1, 0.45, 'E1', 96)
    braaam.n(T_NO2, 0.5, 'F1', 100)              # second NO a semitone up (F natural): the door slams harder
    tutti(T_NO2, 'Em', 0.75, dur=0.3, crash_on=False, choir_on=False)
    # tension pulse between the NOs and after: 16th cello/bass on E (quiet), string tremolo swell
    g1 = Grid(T_NO1 + 0.25, (T_NO2 - T_NO1 - 0.25) / 5)
    s = g1.b / 4
    ost16(T_NO1 + 0.3, s, 18, 'Em', 0.62, layers=('vc', 'cb', 'vla'), ph=0, cresc=(0.6, 0.95))
    vln_tr.n(T_NO1 + 0.3, T_NO2 - T_NO1 - 0.4, ['E5', 'B5'], 70)
    vln_tr.ex(T_NO1 + 0.3, T_NO2 - 0.1, -22, -8, 1.0, pre=False, post=False)
    # X slam on the magnifier (26.68): short low stab; shatter 26.80
    stab(T_XSLAM, 'Em', 106, 0.15)
    timp.n(T_XSLAM, 0.5, 'B1', 108)
    crash.n(T_XSLAM + 0.12, 1.0, 60, 84)
    sparkle(T_XSLAM + 0.12, 4, notes=8, dur=0.3, scale=(0, 3, 6, 7, 10), base='E6', vel=68, dens=70)
    # after NO 2: dizzy pulse (tiles ping-pong 27.19 - 27.93): staccato ostinato accelerating, Em
    t0 = T_NO2 + 0.14
    n16 = 0
    tt = t0
    step = 0.128
    while tt < T_XOUT - 0.02:
        u = (tt - t0) / (T_XOUT - t0)
        p16 = n16 % 16
        a = p16 in ACC
        v = int((100 if a else 70) * (0.75 + 0.35 * u))
        vc_sp.n(tt, step * 0.85, 'E3' if p16 not in (7, 15) else 'E4', v)
        if a:
            cb_sp.n(tt, step * 0.9, 'E2', v)
        vsol_sp.n(tt, 0.06, ['E5', 'G5', 'B5', 'G5'][n16 % 4], int(56 + 30 * u))
        if p16 % 4 == 0:
            kick.n(tt, 0.2, 60, int(84 + 24 * u))
        if p16 % 2 == 0:
            hh.n(tt, 0.05, 60, int(60 + 30 * u))
        n16 += 1
        step = 0.128 - 0.024 * u
        tt += step
    # 27.93 bolts cross out: accent hit
    stab(T_XOUT, 'Em', 120, 0.25)
    timp.n(T_XOUT, 0.8, 'E2', 122)
    trailer.n(T_XOUT, 1.2, 52, 116)
    crash.n(T_XOUT, 1.8, 60, 112)
    zap.n(T_XOUT, 0.4, 60, 96)
    # wave sweep 27.93 -> relief 28.30 : reverse cymbal and rising dust
    riser.n(T_RELIEF, T_RELIEF - T_XOUT - 0.05, 60, 92, kind='cym', len='s')
    riser.n(T_XOUT + 0.05, T_RELIEF - T_XOUT - 0.07, 60, 70, kind='noise', lo=400, hi=11000, n0=55, oct=2.4)


def relief():
    """28.30 - 28.58 relief (G major, warm); 28.58 - 31.10 finale build in G: pick, tap (29.55), burst (29.80), playback (30.44),
    goal burst (30.70), iris-suck (30.92) -> LOGO SLAM 31.10: brand motif D G A B, final cadence V -> I, tutti."""
    # ---- relief: soft resolution to G (harp arpeggio, warm strings, horn), pause under the voice gap
    r = T_RELIEF
    for pp, ns, v in [(vln_su, ['D5', 'G5', 'B5'], 74), (vla_su, ['G3', 'D4', 'B4'], 72), (vc_su, ['G2', 'D3'], 76), (cb_su, ['G1'], 72),
                      (hn_su, ['D4', 'G4'], 70)]:
        pp.n(r, T_PICK + 0.1 - r, ns, v)
        pp.ex(r, T_PICK + 0.1, -12, -4, 0.9, pre=False, post=False)
    choir.n(r, T_PICK + 0.1 - r, ['G4', 'B4', 'D5', 'G5'], 78)
    for k, nn in enumerate(['G4', 'D5', 'B4', 'G5', 'D6', 'B5']):
        harp.n(r + 0.02 + k * 0.06, 0.8, nn, 66 + 2 * k)
    sub.n(r, 0.5, 'G1', 84)
    # ---- finale build (chords: G | D | Em | C | D ...): 16ths enter soft and grow
    g = PW([(0, T_PICK), (2, T_TAP), (2 + (T_PLAY - T_TAP) / 0.46, T_PLAY), (2 + (T_LOGO - T_TAP) / 0.46, T_LOGO)])
    s0 = 0.485 / 4
    tm_ = 0.5 * (T_PICK + T_TAP)
    plan = [(T_PICK, tm_, 'G', 0.6, (0.5, 0.75)), (tm_, T_TAP, 'Em', 0.8, (0.75, 0.95)), (T_TAP, T_PLAY, 'C', 1.02, None),
            (T_PLAY, T_LOGO - 0.10, 'D', 1.12, (1.0, 1.3))]
    for a, b, ch, lvl, cr in plan:
        n = max(1, int(round((b - a) / s0)))
        s = (b - a) / n
        ost16(a, s, n, ch, lvl=lvl, ph=0, cresc=cr, layers=('vc', 'cb', 'vla', 'vln') if a >= T_TAP else ('vc', 'vla', 'vln'))
        pads(a, b - 0.02, ch, lvl=64 + int(30 * lvl), low=False, choir_on=a >= T_TAP)
        rr, _ = ct(ch)
        sub.n(a, b - a - 0.04, near(rr, m('E1')), 84 + int(16 * lvl))
        kit16(a, s, n, 'lite' if a < T_TAP else 'four', 0.9 if a < T_TAP else 1.05)
    taiko8(T_TAP, 0.46, 5.5, 'C', 1.0)
    # pick: light harp/pizz arpeggio motif (G A B D) as tiles glide in
    for k, nn in enumerate(['D5', 'G5', 'A5', 'B5']):
        vlnpz.n(T_PICK + k * 0.23, 0.1, nn, 70 + 4 * k)
        harp.n(T_PICK + k * 0.23, 0.6, nn, 64 + 4 * k)
    flute_sv.n(T_PICK, 0.9, 'D6', 60)
    # TAP 29.55: accent (C chord stab + timpani + harp) ; BURST 29.80: cymbal + D chord hit ; PLAYBACK 30.44: hit ; GOAL BURST 30.70 crowd-lift
    for t, ch, big in ((T_TAP, 'C', 0.8), (T_BURST, 'C', 0.95), (T_PLAY, 'D', 1.0)):
        stab(t, ch, 108 + int(10 * big), 0.2)
        timp.n(t, 0.8, near(ct(ch)[0], m('D2')), 100 + int(20 * big))
        crash.n(t, 1.6, 60, 96 + int(14 * big))
        taiko.n(t, 0.5, 60, 118)
        tutti(t, ch, big * 0.85, dur=0.28, crash_on=False, choir_on=False)
    sparkle(T_TAP, 0, notes=8, dur=0.25, scale=(0, 2, 4, 7, 9), base='E5', vel=78, dens=40)
    sparkle(T_BURST, 0, notes=10, dur=0.3, scale=(0, 2, 4, 7, 9), base='E5', vel=84, dens=60)
    riser.n(T_PLAY, T_LOGO - T_PLAY - 0.02, 60, 100, kind='noise', lo=300, hi=12000, n0=50, oct=3)
    riser.n(T_LOGO, T_LOGO - T_PLAY, 60, 100, kind='cym', len='m')
    # goal-burst run 30.70 -> 30.92 (D major scale run) and the brand motif before the slam: D5 G5 A5 -> B5 on the slam
    dm = ['A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'G5', 'A5', 'B5', 'C#6', 'D6']
    for k, nt in enumerate(dm):
        tk = T_GOALB + k * (T_SUCK - T_GOALB) / len(dm)
        vln_sp.n(tk, 0.06, [nt, m(nt) - 12], 84 + 4 * k)
        vla_sp.n(tk, 0.06, m(nt) - 12, 78 + 3 * k)
    tt = T_GOALB
    i = 0
    while tt < T_LOGO - 0.10:
        u = (tt - T_GOALB) / (T_LOGO - 0.10 - T_GOALB)
        snc.n(tt, 0.04, 60, int(50 + 76 * u))
        i += 1
        tt = T_GOALB + i * 0.045 * (1 - 0.4 * u)
    timp_t = T_PLAY
    while timp_t < T_LOGO - 0.12:
        timp.n(timp_t, 0.1, 'D2', int(70 + 50 * (timp_t - T_PLAY) / (T_LOGO - T_PLAY)))
        timp_t += 0.06
    for dt, n_, v in [(-0.66, 'D5', 100), (-0.42, 'G5', 104), (-0.20, 'A5', 108)]:
        tt = T_LOGO + dt
        for pp in (tp_st, hn_st):
            pp.n(tt, 0.16, m(n_) - (12 if pp is hn_st else 0), v)
        vln_sp.n(tt, 0.16, m(n_) + 12, v - 8)
    # ---- 31.10 LOGO SLAM: tutti G major (final cadence D -> G), motif top B5, gong, trailer, braaam, choir, glock/celesta sparkle
    t = T_LOGO
    tutti(t, 'G', 1.35, dur=2.4)
    gong.n(t, 4.0, 60, 124)
    trailer.n(t + 0.002, 2.4, 50, 127)
    braaam.n(t, 1.4, 'G1', 118)
    tp_su.n(t, 2.4, ['B5', 'D6'], 120)
    hn_su.n(t, 2.4, ['B4', 'D5', 'G4'], 116)
    vln_su.n(t, 2.6, ['B5', 'D6', 'G6'], 112)
    sparkle(t + 0.01, 7, notes=16, dur=0.6, scale=(0, 2, 4, 7, 9), base='D6', vel=92, dens=110)
    crash.n(t, 2.5, 60, 127)
    # ---- resolved tail (31.10 -> 34.1): G major ring, harp arpeggios, echo of the brand motif, natural fade in the last second
    for pp, ns, v in [(vln_su, ['B4', 'D5', 'G5'], 92), (vla_su, ['D4', 'G4'], 90), (vc_su, ['G2', 'D3'], 92), (cb_su, ['G1'], 90),
                      (hn_su, ['G3', 'D4', 'B4'], 90)]:
        pp.n(t + 2.4, 34.1 - t - 2.4, ns, v)
        pp.ex(t + 2.4, 34.1, 0, -24, 0.8, pre=False, post=False)
    choir.n(t + 0.1, 34.1 - t - 0.1, ['G3', 'D4', 'G4', 'B4', 'D5'], 104)
    choir.expr(t + 0.2, 34.0, 118, 60, 0.9)
    for k, nn in enumerate(['G3', 'D4', 'G4', 'B4', 'D5', 'G5', 'B5', 'D6']):
        harp.n(t + 0.35 + k * 0.11, 1.4, nn, 74 - k)
    for k, nn in enumerate(['D5', 'G5', 'A5', 'B5', 'G5']):                    # brand motif echo (flute + harp + celesta), soft
        tt = t + 1.45 + [0, 0.32, 0.55, 0.78, 1.05][k]
        flute_sv.n(tt, 0.5 if k < 4 else 1.4, nn, 66)
        celesta.n(tt, 0.5, m(nn) + 12, 56)
        harp.n(tt, 0.7, nn, 62)
    sparkle(T_TAG, 7, notes=8, dur=0.4, scale=(0, 2, 4, 7, 9), base='D6', vel=70, dens=50)   # tagline pop 31.60
    piano.n(t + 0.02, 3.0, ['G2', 'D3', 'G3', 'B3'], 80)


def compose():
    intro()
    sectionA()
    cin()
    series1()
    tur()
    series2()
    ind()
    live()
    chorus()
    wait()
    fun()
    nos()
    relief()
