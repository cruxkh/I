
# ----------------------------------------------------------------------------------------------
# NEW COMPOSITION (v2 "premiere night"): D major (verses, holds) -> half-step lift to Eb major on the vortex drop; ~120 BPM feel-good
# pop-orchestral: four-on-the-floor kick, rimshot/tambourine claps, syncopated piano + pizzicato + staccato strings, flute / glock / pizzicato /
# bright trumpet lead.  Hook "premiere motif": A A B D | F#~  (D major)  ->  Bb Bb C Eb | G~  (Eb major).  All real sampled instruments.
# ----------------------------------------------------------------------------------------------
CHORD.update({'Dm': (2, 'm'), 'Bm': (11, 'm'), 'F#m': (6, 'm'), 'Gm': (7, 'm'), 'Cm': (0, 'm'), 'Bb': (10, 'M'), 'Eb': (3, 'M'),
              'Ab': (8, 'M'), 'Fm': (5, 'm'), 'Db': (1, 'M'), 'Ebm': (3, 'm'), 'Bbm': (10, 'm')})

HOOK_D = [(-2, .5, 'A4'), (-1.5, .5, 'A4'), (-1, .5, 'B4'), (-.5, .5, 'D5'), (0, 1.5, 'F#5'), (1.5, .5, 'E5'), (2, 1, 'D5'), (3, .5, 'E5'),
          (3.5, .5, 'D5'), (4, 1, 'F#5'), (5, .5, 'E5'), (5.5, .5, 'D5'), (6, 1, 'C#5'), (7, .5, 'E5'), (7.5, .5, 'A5')]
LIVE_D = [(0, 1.5, 'F#5'), (1.5, .5, 'E5'), (2, 1, 'D5'), (3, .5, 'E5'), (3.5, .5, 'F#5')]
CH_EB = [(0, .5, 'Bb4'), (.5, .5, 'Bb4'), (1, .5, 'C5'), (1.5, .5, 'Eb5'), (2, 1.5, 'G5'), (3.5, .5, 'F5')]
DAYS_EB = ['Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'D5']            # rising major scale, ends on the leading tone D (goal resolves on Eb)


def lead(g, line, vel, mode='verse', sh=0, beats=(-99, 99)):
    """the tune.  verse: flute + pizzicato + glock (light, under the voice).  chorus: bright trumpet + horn (octave below) + flute + violins.
    Every note gets its own humanised timing / velocity."""
    for b, d, n0 in line:
        if not (beats[0] <= b < beats[1]):
            continue
        t = g(b) + hum(5)
        dur = max(0.07, (g(b + d) - g(b)) * (0.95 if d >= 1 else 0.82))
        v = vel + rv(-4, 4) + (4 if d >= 1 else 0)
        nn = m(n0) + sh
        if mode == 'verse':
            flute_sv.n(t, dur, nn, v)
            vlnpz.n(t + 0.004, 0.1, nn, v - 16)
            glock.n(t + 0.003, 0.5, nn + 12, v - 26)
        elif mode == 'chorus':
            (tp_su if d >= .75 else tp_st).n(t, dur, nn, v + 6)
            (hn_su if d >= .75 else hn_st).n(t - (0.04 if d >= .75 else 0), dur, nn - 12, v)
            flute_sv.n(t, dur, nn + 12, v - 14)
            if d >= .75:
                vln_su.n(t - 0.05, dur + 0.05, nn + 12, v - 6)
            else:
                vln_sp.n(t, dur, nn + 12, v - 10)
            glock.n(t + 0.003, 0.5, nn + 12, v - 22)
        else:                              # 'tutti'
            (tp_su if d >= .75 else tp_st).n(t, dur, nn, v + 8)
            (hn_su if d >= .75 else hn_st).n(t - (0.04 if d >= .75 else 0), dur, nn - 12, v + 2)
            (vln_su if d >= .75 else vln_sp).n(t - (0.05 if d >= .75 else 0), dur, nn + 12, v)
            flute_sv.n(t, dur, nn + 12, v - 10)
            glock.n(t + 0.003, 0.6, nn + 12, v - 18)


def groove(g, b0, nb, ch, lvl=1.0, mode='verse', mute=None, ph=0):
    """one stretch of the feel-good pop-orchestral groove (8th-note resolution, beats from the tempo grid g):
    four-on-the-floor kick, rimshot + tambourine backbeat, open off-beat hat, pizzicato bass on the off-beats, syncopated (3-3-2) piano + staccato strings."""
    r, pcs = ct(ch)
    lo = near(r, m('E1'))
    n8 = int(round(nb * 2))
    for i in range(n8):
        beat = b0 + i / 2
        t = g(beat)
        on = (i % 2 == 0)
        p8 = (i + ph) % 8
        hi = 1.0 if mode != 'verse' else 0.85
        if mute and mute[0] <= t <= mute[1]:
            if not on:
                hh.n(t + hum(3), 0.05, 60, 46 + rv(-4, 4))
            continue
        if on:
            kick.n(t + hum(2.5), 0.3, 60, (114 if p8 == 0 else 104) * lvl * hi + rv(-4, 3))
        if p8 in (2, 6):
            snare.n(t + hum(3), 0.3, 60, 92 * lvl * hi + rv(-5, 4))
            tamb.n(t + 0.004 + hum(2), 0.15, 60, 76 * lvl + rv(-5, 5))
            snc.n(t + 0.002, 0.1, 60, 46 * lvl)
        if on:
            hh.n(t + hum(3), 0.06, 60, (56 if mode == 'verse' else 66) * lvl + rv(-6, 6))
        elif p8 == 7:
            hho.n(t + hum(3), 0.3, 60, 82 * lvl * hi)
        else:
            hh.n(t + hum(3), 0.06, 60, 80 * lvl * hi + rv(-6, 6))
        if not on:                                       # bass pumps between the kicks
            cbpz.n(t + hum(4), 0.24, lo + (12 if p8 in (3,) else 0), 92 * lvl + rv(-5, 5))
            if mode != 'verse':
                sub.n(t, 0.2, lo, 62 * lvl)
        elif p8 == 0:
            cbpz.n(t + hum(4), 0.4, lo, 100 * lvl + rv(-4, 4))
        if p8 in (0, 3, 6):                              # syncopated piano stabs
            piano.n(t + hum(6), 0.32, [near(pcs[0], m('C4')), near(pcs[1], m('C4')), near(pcs[2], m('C4'))], (88 if p8 == 0 else 78) * lvl * (1.0 if mode != 'verse' else 0.92) + rv(-6, 6))
            if mode != 'verse':
                hn_st.n(t + hum(5), 0.2, [near(pcs[0], m('C4')), near(pcs[1], m('C4'))], 84 * lvl + rv(-5, 5))
                tp_st.n(t + hum(5), 0.2, near(pcs[1], m('G4')), 80 * lvl + rv(-5, 5))
        if not on:
            vln_sp.n(t + hum(6), 0.11, [near(pcs[1], m('B4')), near(pcs[2], m('B4'))], (64 if mode == 'verse' else 78) * lvl + rv(-6, 6))
            vla_sp.n(t + hum(6), 0.11, near(pcs[2], m('G3')), 62 * lvl + rv(-6, 6))
        vc_sp.n(t + hum(5), 0.12, near(r, m('C3')), (58 if on else 72) * lvl + rv(-6, 6))


def bed(t0, t1, ch, lvl=76, horn=False, hi=True):
    """real string sustains (+ optional horn) under a chord"""
    r, pcs = ct(ch)
    d = t1 - t0
    if hi:
        vln_su.n(t0 + hum(8), d, [near(pcs[1], m('B4')), near(pcs[0], m('E5'))], lvl)
    vla_su.n(t0 + hum(8), d, [near(pcs[2], m('G3')), near(pcs[0], m('E4'))], lvl)
    vc_su.n(t0 + hum(6), d, near(r, m('C3')), lvl + 4)
    cb_su.n(t0 + hum(6), d, near(r, m('C2')), lvl)
    if horn:
        hn_su.n(t0 + hum(8), d, [near(pcs[1], m('E3')), near(pcs[2], m('E3'))], lvl + 4)


def X(n):
    """transposed note (-2 semitones): the E-based Turkish/Bollywood holds are re-keyed to D"""
    return m(n) - 2


# ---- cue table (v -> T); words.js was retimed, scene // CUE comments followed -------------------------------
V = TofV
T_BOLT, T_SHARD, T_PING1, T_PING2, T_OPEN = 0.74, 1.26, 1.76, 1.90, 2.36
T_HOOK, T_FAN, T_NFX, T_FLIP, T_DIS, T_PLUS, T_LIGHTS = 3.41, 3.95, 4.36, 5.35, 6.06, 6.54, 6.78
T_SPOP = [7.02, 7.13, 7.24, 7.35]
T_HERO, T_BALL, T_SLAM = 7.47, 7.58, 8.36
DRUM = [8.045, 8.10, 8.16, 8.22, 8.27, 8.31, 8.33, 8.35]
T_TURSPL, T_INDSPL = V(9.215), V(10.345)
T_ALLB, T_ORBIT, T_VORTEX = V(13.08), V(13.435), V(13.815)
T_LUB, T_DUB, T_ISR = V(11.78), V(12.03), V(12.16)
T_THUMB, T_NAGISH, T_CAL = V(14.43), V(14.89), V(15.36)
DAY_T = [V(x) for x in (15.98, 16.126, 16.271, 16.417, 16.563, 16.709, 16.855)]
T_DAY0, T_DAYN = DAY_T[0], DAY_T[-1]
T_GOAL, T_BNC, T_GOALB2 = V(17.40), V(17.845), V(18.295)
T_WAIT, T_C2, T_C1, T_OPENC, T_CHEST, T_BOW, T_FUN = V(18.78), V(19.21), V(19.58), V(20.09), V(20.42), V(20.97), V(21.29)
REV = [V(x) for x in (21.58, 21.65, 21.75, 21.85, 21.95, 22.08)]
T_NO1, T_XSLAM, T_NO2, T_DEV, T_XOUT, T_RELIEF = V(22.36), V(23.29), V(23.55), V(23.67), V(24.41), V(24.80)
T_PICK, T_BNCE, T_TAP, T_BURST, T_PLAY = V(25.08), V(25.365), V(26.055), V(26.30), V(26.99)
T_GOALB, T_SUCK, T_LOGO, T_TAG = V(27.20), V(27.42), V(27.60), V(28.10)
T_CIN0, T_CIN1 = HOLD_T['cin']
T_LAND1 = 10.26
T_TUR0, T_TUR1 = HOLD_T['tur']
T_LAND2 = 12.39
T_IND0, T_IND1 = HOLD_T['ind']
T_LAND3 = 14.54
T_FADE0 = 33.05


def sparkle(t, root_pc, notes=10, dur=0.5, scale=(0, 2, 4, 7, 9), base='E5', vel=80, dens=70):
    """harp glissando + glockenspiel + celesta (magic accent); all sampled"""
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
        harp.n(t + k * dur / notes + hum(4), 0.8, nn, vel + 2 * k + rv(-3, 3))
    for k, nn in enumerate(seq[-4:]):
        glock.n(t + dur * 0.6 + k * 0.05, 0.6, nn + 12, vel - 6 + k * 3)
        celesta.n(t + dur * 0.6 + k * 0.05 + 0.01, 0.6, nn + 12, vel - 20 + 3 * k)


# ----------------------------------------------------------------------------------------------
# Sections
# ----------------------------------------------------------------------------------------------
def intro():
    """0 - 3.41: suspense drone + riser -> bolt crack 0.74 -> the world floods open (D major arpeggios) -> 2.36 burst (D major) -> A pedal -> hook pickup"""
    g = Grid(T_BOLT, 0.53)
    cb_dr.n(0.0, 1.6, 'D1', 80)
    vc_dr.n(0.0, 1.6, ['D2', 'A2'], 74)
    vc_dr.ex(0.0, 0.7, -22, -2, 1.3, pre=False, post=False)
    cb_dr.ex(0.0, 0.7, -22, -2, 1.3, pre=False, post=False)
    tb_su.n(0.25, 0.5, ['D2', 'A2'], 70)
    tb_su.ex(0.25, T_BOLT, -20, -4, 1.4, pre=False, post=False)
    vln_tr.n(0.05, 0.75, ['A5', 'D6'], 70)
    vln_tr.ex(0.03, T_BOLT, -24, -4, 1.4, pre=False, post=False)
    riser.n(0.05, T_BOLT - 0.05, 60, 80, kind='noise', lo=200, hi=8000, n0=38)
    riser.n(T_BOLT, T_BOLT - 0.02, 60, 90, kind='cym', len='s')
    for i, tt in enumerate((0.05, 0.36)):
        timp.n(tt + hum(4), 0.4, 'D2', 44 + 10 * i)
    # 0.74 the bolt cracks the screen
    zap.n(T_BOLT, 0.5, 60, 118)
    timp.n(T_BOLT, 1.2, 'D2', 127)
    bd.n(T_BOLT, 2.0, 60, 124)
    trailer.n(T_BOLT, 1.5, tr_n('Dm'), 116)
    boom.n(T_BOLT, 1.6, 60, 110, **bm('Dm'))
    sub.n(T_BOLT, 1.4, 'D1', 96)
    stab(T_BOLT, 'Dm', 120, 0.35)
    tb_su.n(T_BOLT, 0.5, ['D2', 'A2', 'D3'], 110)
    ocym.n(T_BOLT, 2.5, 60, 100)
    for k, nn in enumerate(['D6', 'F6', 'A6', 'D7']):
        glock.n(T_BOLT + 0.02 + k * 0.035, 0.6, nn, 80)
    # 0.74 - 2.36 flood: harp + pizzicato + glock arpeggios rise, strings swell, timpani + snare roll
    arp = [['D4', 'F#4', 'A4', 'D5', 'F#5', 'A5'], ['G4', 'B4', 'D5', 'G5', 'B5', 'D6'], ['A4', 'C#5', 'E5', 'A5', 'C#6', 'E6']]
    for bt in range(3):
        for k in range(6):
            tt = g(bt + 0.15 + k * 0.14)
            if tt < T_OPEN - 0.03:
                harp.n(tt + hum(4), 0.5, arp[bt][k], 68 + 6 * bt + 2 * k + rv(-3, 3))
                if k % 2 == 1:
                    vlnpz.n(tt + 0.01 + hum(4), 0.1, arp[bt][k], 60 + 6 * bt)
    for k, nn in enumerate(['A5', 'D6', 'F#6', 'A6', 'D7']):
        glock.n(g(1.0) + k * 0.11, 0.5, nn, 62 + 3 * k)
    vln_su.n(T_BOLT + 0.3, T_OPEN - T_BOLT - 0.3, [m('D5'), m('A5')], 80)
    vln_su.ex(T_BOLT + 0.3, T_OPEN, -22, -2, 1.4)
    vla_su.n(T_BOLT + 0.3, T_OPEN - T_BOLT - 0.3, [m('F#4'), m('D5')], 78)
    vla_su.ex(T_BOLT + 0.3, T_OPEN, -22, -2, 1.4)
    cb_su.n(T_BOLT + 0.3, T_OPEN - T_BOLT - 0.3, 'D2', 90)
    cb_su.ex(T_BOLT + 0.3, T_OPEN, -22, -2, 1.4)
    tb_st.n(T_SHARD, 0.15, ['D2', 'A2'], 92)
    taiko.n(T_SHARD, 0.5, tk_n('Dm'), 96)
    sparkle(T_SHARD, 2, notes=8, dur=0.35, scale=(0, 2, 4, 6, 7, 9, 11), base='D5', vel=74)
    tt = T_OPEN - 0.55
    while tt < T_OPEN - 0.01:
        u = (tt - (T_OPEN - 0.55)) / 0.55
        timp.n(tt + hum(3), 0.1, 'D2', int(46 + 76 * u ** 1.2))
        tt += 0.06
    tt = T_OPEN - 0.42
    while tt < T_OPEN - 0.01:
        u = (tt - (T_OPEN - 0.42)) / 0.42
        snc.n(tt, 0.05, 60, int(36 + 80 * u ** 1.4))
        tt += 0.045
    riser.n(T_OPEN, 0.85, 60, 100, kind='cym', len='s')
    riser.n(T_BOLT + 0.5, T_OPEN - T_BOLT - 0.5, 60, 84, kind='noise', lo=300, hi=10000, n0=52, oct=2.2)
    # 2.36 the world opens: D major, radiant
    tutti(T_OPEN, 'D', 1.15, dur=0.9)
    gong.n(T_OPEN + 0.005, 3.0, 60, 96)
    sparkle(T_OPEN + 0.02, 2, notes=14, dur=0.55, scale=(0, 2, 4, 6, 7, 9, 11), base='D5', vel=88)
    for k, nn in enumerate(['D6', 'A5', 'F#5', 'A5', 'D6', 'F#6']):
        harp.n(T_OPEN + 0.25 + k * 0.13 + hum(4), 0.5, nn, 66 + 2 * k)
    bed(T_OPEN + 0.05, T_HOOK - 0.02, 'D', lvl=78)
    # A pedal (V) into the hook pickup: pizzicato ticks + soft snare crescendo
    for k in range(6):
        tt = T_OPEN + 0.55 + k * 0.14
        vlnpz.n(tt + hum(4), 0.1, ['A5', 'E6'], 70 + 4 * k)
        vcpz.n(tt + hum(4), 0.1, 'A2', 80 + 3 * k)
    riser.n(T_OPEN + 0.4, T_HOOK - T_OPEN - 0.4, 60, 70, kind='noise', lo=400, hi=9000, n0=45)
    for i in range(5):
        snc.n(T_HOOK - 0.24 + i * 0.05, 0.06, 60, 60 + 12 * i)


def sectionA():
    """3.41 - 8.36: the tune.  Pickup A A B D on the flute/pizzicato/glock, F#5 on the Netflix slam (4.36), Disney sparkle 6.06, sports build, Charlton slam 8.36.
    Tempo: 127 BPM pickup, then 120 BPM (b = 0.5 s) so the slam is beat 8 exactly."""
    g = PW([(-2, T_HOOK), (0, T_NFX), (8, T_SLAM)])
    for b0, nb, ch, lv in [(0, 2, 'D', 0.8), (2, 2, 'G', 0.85), (4, 2, 'Bm', 0.95), (6, 2, 'A', 1.0)]:
        groove(g, b0, nb, ch, lv, 'verse')
        bed(g(b0), g(b0 + nb) - 0.02, ch, lvl=72)
    # pickup beats (-2..0): only bass pizz + soft strings so the tune is heard
    for k in range(2):
        cbpz.n(g(-2 + k) + hum(4), 0.3, 'A1', 80)
    vc_sp.n(g(-1), 0.12, 'A2', 66)
    lead(g, HOOK_D, 88, 'verse', beats=(-2, 4))
    lead(g, HOOK_D, 98, 'verse', beats=(4, 8))
    # sports build 6.78 -> 8.36: toms, snare drum-roll on the scene's hits, timpani, trumpet crescendo on A
    for i in range(4):
        (tomh if i % 2 == 0 else toml).n(g(6.5 + i / 2) + hum(3), 0.3, 60, 84 + 8 * i)
    for tt, v in zip(DRUM, [66, 74, 82, 90, 98, 106, 114, 122]):
        snare.n(tt, 0.1, 60, v)
    oroll.n(T_SLAM - 0.75, 0.77, 60, 96)
    oroll.ex(T_SLAM - 0.75, T_SLAM, -20, 0, 1.3, pre=False, post=False)
    for i in range(6):
        taiko.n(g(6.0 + i * 0.33) + hum(3), 0.3, tk_n('A') + (0 if i % 2 == 0 else 7), 92 + 5 * i)
    tp_su.n(g(6), T_SLAM - g(6) - 0.02, ['A4', 'E5'], 96)
    tp_su.ex(g(6), T_SLAM, -14, 0, 1.3, pre=False, post=False)
    hn_su.n(g(6), T_SLAM - g(6) - 0.02, ['A3', 'C#4', 'E4'], 92)
    riser.n(T_LIGHTS, T_SLAM - T_LIGHTS, 60, 76, kind='noise', lo=400, hi=11000, n0=45, oct=2.6)
    # scene accents
    snare.n(T_HOOK, 0.2, 60, 100)                                  # clapper slam 3.41
    taiko.n(T_HOOK, 0.4, tk_n('D'), 100)
    for k, nt in enumerate(['A5', 'D6', 'F#6']):                   # episode fan 3.95
        glock.n(T_FAN + k * 0.06, 0.4, nt, 72)
        harp.n(T_FAN + k * 0.06, 0.5, nt, 62)
    riser.n(T_FLIP - 0.25, 0.25, 60, 60, kind='noise', lo=600, hi=9000, n0=59, oct=2)
    # NETFLIX 4.36: tutti stab on D, hook peak F#5
    stab(T_NFX, 'D', 116, 0.25)
    taiko.n(T_NFX, 0.5, tk_n('D'), 122)
    crash.n(T_NFX, 1.6, 60, 108)
    kick.n(T_NFX, 0.3, 60, 120)
    tutti(T_NFX, 'D', 0.8, dur=0.3, crash_on=False, choir_on=False)
    tp_su.n(T_NFX, 0.7, 'F#5', 100)
    # DISNEY+ 6.06 magical sparkle (D lydian, pickup into bar 2 at 6.36)
    sparkle(T_DIS - 0.02, 2, notes=16, dur=0.5, scale=(0, 2, 4, 6, 7, 9, 11), base='F#5', vel=84)
    hn_su.n(T_DIS, 0.6, ['F#4', 'A4'], 84)
    vln_su.n(T_DIS, 0.7, ['A5', 'D6'], 74)
    glock.n(T_PLUS, 0.5, ['A6', 'D7'], 76)                          # plus-pop 6.54
    harp.n(T_PLUS, 0.6, ['A5', 'D6'], 70)
    # hero slam 7.47 (on A)
    stab(T_HERO, 'A', 108, 0.2)
    timp.n(T_HERO, 0.8, 'A1', 112)
    taiko.n(T_HERO, 0.5, tk_n('A'), 112)
    crash.n(T_HERO, 1.2, 60, 96)
    # CHARLTON slam 8.36: D power chord, trailer drum, gong; a low stab a moment later
    t = T_SLAM
    tutti(t, 'D', 1.2, dur=0.5)
    trailer.n(t, 1.6, tr_n('D'), 127)
    gong.n(t, 3.0, 60, 110)
    braaam.n(t, 0.45, 'D1', 96)
    tp_su.n(t, 0.5, ['D5', 'A5'], 118)
    stab(t + 0.245, 'Dm', 104, 0.2)
    timp.n(t + 0.245, 0.6, 'D2', 108)
    for i in range(3):
        snc.n(t + 0.36 + i * 0.045, 0.05, 60, 60 + 14 * i)


def cin():
    """hold 8.85 - 10.25: cinema-trailer braaam (D minor), low brass, choir swell, timpani roll; the run + snare roll land on a bright D MAJOR tutti at 10.26"""
    t0, t1, tl = T_CIN0, T_CIN1, T_LAND1
    for pp, ns, v in [(tb_su, ['D2', 'A2', 'D3'], 127), (tu_su, ['D1', 'D2'], 127), (hn_su, ['D3', 'A3', 'D4'], 124)]:
        pp.n(t0, 1.0, ns, v)
    braaam.n(t0, 1.0, 'D1', 116)
    braaam.n(t0, 1.0, 'A1', 88)
    trailer.n(t0, 2.0, tr_n('Dm'), 127)
    boom.n(t0, 2.0, 60, 120, **bm('Dm'))
    gong.n(t0 + 0.01, 3.0, 60, 118)
    bd.n(t0, 2.0, 60, 124)
    ocym.n(t0, 2.0, 60, 110)
    sub.n(t0, 1.2, 'D1', 108)
    t2 = t0 + 0.7
    for pp, ns, v in [(tb_su, ['Eb2', 'Bb2', 'Eb3'], 118), (tu_su, ['Eb1', 'Eb2'], 118)]:
        pp.n(t2, 0.45, ns, v)
    braaam.n(t2, 0.5, 'Eb1', 100)
    trailer.n(t2, 1.0, tr_n('Eb'), 116)
    tt = t0 + 0.12
    while tt < tl - 0.01:
        u = (tt - t0) / (tl - t0)
        timp.n(tt + hum(3), 0.12, 'D2', int(40 + 84 * u ** 1.3))
        tt += 0.052
    choir.cc(t0, 11, 30)
    choir.n(t0 + 0.2, tl - t0 - 0.2, ['D3', 'A3', 'D4', 'F4', 'A4'], 96)
    choir.expr(t0 + 0.2, tl - 0.03, 30, 120, 1.6)
    vc_tr.n(t0 + 0.1, tl - t0 - 0.1, ['D3', 'A3'], 100)
    vc_tr.ex(t0, tl - 0.03, -12, 0, 1.5)
    cb_su.n(t0 + 0.1, tl - t0 - 0.1, 'D2', 100)
    vln_tr.n(t0 + 0.5, tl - t0 - 0.5, ['D5', 'F5', 'A5'], 90)
    vln_tr.ex(t0 + 0.5, tl - 0.03, -18, -2, 1.4)
    scale = ['D3', 'E3', 'F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'F5']
    ts = [tl - 0.02 - 0.62 * ((15 - k) / 15) ** 1.35 for k in range(16)]
    for k, (tk, nt) in enumerate(zip(ts, scale)):
        v = int(72 + 3.4 * k)
        vln_sp.n(tk + hum(3), 0.09, [nt, m(nt) + 12], v)
        vla_sp.n(tk + hum(3), 0.09, nt, v - 6)
        vc_sp.n(tk + hum(3), 0.09, m(nt) - 12 if k % 2 == 0 else nt, v - 4)
    tt = tl - 0.55
    while tt < tl - 0.01:
        u = (tt - (tl - 0.55)) / 0.55
        snc.n(tt, 0.05, 60, int(38 + 84 * u ** 1.4))
        tt += 0.038
    riser.n(tl, 0.9, 60, 100, kind='cym', len='s')
    riser.n(tl - 0.7, 0.7, 60, 90, kind='noise', lo=250, hi=11000, n0=45, oct=3)
    trailer.n(tl - 0.7, 1.0, tr_n('Dm'), 110)
    tutti(tl, 'D', 1.1, dur=0.5)
    lead(Grid(tl, 0.448), [(0, 1.4, 'F#5'), (1.5, .35, 'E5'), (1.9, .5, 'D5')], 104, 'tutti')


def series1():
    """10.26 - 11.38 'סדרות טורקיות': the groove keeps going (D major); the last slots cock the hammer; F natural stab on the Turkish splash 10.615"""
    t0 = T_LAND1
    g = Grid(t0, (T_TUR0 - t0) / 2.5)
    groove(g, 0, 2, 'D', 1.05, 'chorus')
    bed(t0, T_TUR0 - 0.03, 'D', lvl=76, horn=True)
    for i in range(4):
        snare.n(T_TUR0 - 0.05 - (3 - i) * 0.05 + hum(2), 0.08, 60, 90 + 9 * i)
    timp.n(T_TUR0 - 0.03, 0.3, 'A1', 100)
    tb_st.n(T_TURSPL, 0.2, ['Eb2', 'Bb2'], 104)
    timp.n(T_TURSPL, 0.8, 'Eb2', 104)
    crash.n(T_TURSPL, 1.0, 60, 84)
    lead(g, [(0.0, .5, 'A4'), (.5, .5, 'A4'), (1, .5, 'B4'), (1.5, .5, 'D5'), (2, .5, 'F#5')], 96, 'chorus')

