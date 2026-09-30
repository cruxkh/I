

def tur():
    """hold 11.38 - 12.38: Turkish drama pastiche (D Hijaz): dum-dum-DUM, string tremolo, oboe (duduk) lament, kanun, sob; roll -> pickup 12.39"""
    t0, t1 = T_TUR0, T_TUR1
    timp.n(t0, 1.0, X('E2'), 127)
    stab(t0, 'D', 124, 0.3)
    vc_su.n(t0, 0.3, [X('E2'), X('E3')], 124)
    cb_su.n(t0, 0.3, X('E2'), 124)
    darb.n(t0, 0.3, 60, 127, kind='doum')
    ocym.n(t0, 1.5, 60, 104)
    sub.n(t0, 0.5, X('E1'), 110)
    riser.n(t0 - 0.30, 0.31, 60, 70, kind='noise', lo=600, hi=12000, n0=52, oct=3)
    # dum - dum - DUM
    timp.n(t0 + 0.25, 0.6, X('E2'), 100)
    darb.n(t0 + 0.25, 0.3, 60, 104, kind='doum')
    timp.n(t0 + 0.50, 1.0, X('B1'), 127)
    darb.n(t0 + 0.50, 0.3, 60, 127, kind='doum')
    stab(t0 + 0.50, 'D', 120, 0.25)
    ocym.n(t0 + 0.50, 1.2, 60, 92)
    # tremolo strings on the E-major triad with F (Hijaz colour), swelling
    vln_tr.n(t0 + 0.08, t1 - t0 - 0.30, [X('B4'), X('E5'), X('G#5')], 104)
    vc_tr.n(t0 + 0.08, t1 - t0 - 0.30, [X('E3'), X('B3')], 104)
    vln_tr.ex(t0, t0 + 0.5, -14, -3, post=False)
    vln_tr.ex(t0 + 0.5, t1 - 0.28, -3, 0, pre=False)
    vc_tr.ex(t0, t1 - 0.28, -10, 0)
    # oboe (duduk-like) lament: Hijaz descending with scoops, and a sob (fall) on the last note
    ln = [(0.05, X('B4'), 0.30, 96, dict(**{'from': -1.0, 'gl': 0.05})), (0.38, X('A4'), 0.12, 90, {}), (0.52, X('G#4'), 0.14, 92, {}),
          (0.68, X('F4'), 0.16, 92, {}), (0.86, X('E4'), 0.34, 96, dict(bend=(-2.2, 0.35), vib=0.35, vd=0.05))]
    for dt, n_, d, v, kw in ln:
        oboe.n(t0 + dt, d, n_, v, **kw)
    vln_solo.n(t0 + 0.05, 0.9, X('B5'), 80, **{'from': 1.5, 'gl': 0.12, 'vib': 0.3, 'vd': 0.1, 'bend': (-2.5, 0.5)})
    # darbuka figure + kanun tremolo run answering the oboe
    for dt, k, v in [(0.10, 'tek', 88), (0.16, 'tek', 66), (0.38, 'tek', 90), (0.62, 'doum', 108), (0.68, 'tek', 82),
                     (0.74, 'tek', 92)]:
        darb.n(t0 + dt, 0.2, 60, v, kind=k)
    run = [X('E6'), X('D6'), X('C6'), X('B5'), X('A5'), X('G#5'), X('F5'), X('E5')]
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
    hij = [X('E4'), X('F4'), X('G#4'), X('A4'), X('B4'), X('C5'), X('D#5'), X('E5')]
    for k, nt in enumerate(hij):
        tk = tl - 0.02 - 0.26 * ((7 - k) / 7) ** 1.2
        vln_sp.n(tk, 0.06, [nt, m(nt) + 12], 84 + 5 * k)
        vla_sp.n(tk, 0.06, nt, 80 + 4 * k)
    timp.n(tl - 0.25, 0.3, X('B1'), 96)
    riser.n(tl, 0.45, 60, 88, kind='cym', len='s')



def ind():
    """hold 13.43 - 14.53: BOLLYWOOD / filmi pastiche (original), the star of the hold.  Bounce = 3+3+3 sixteenths (bhangra/filmi feel, ~122 BPM),
    downbeat accent, bright sitar riff with jawari buzz + meend slides (Bhairav-flavoured: E F G# A B C), harmonium drone, dhol + tabla groove,
    shehnai (double-reed) long line with ornaments, ornamental female 'aa-aa' vocalise with a gamak trill, bansuri answer, playful staccato
    filmi violins; then a tirakita / violin-run pickup that lands on the theme at 14.54."""
    t0, tl = T_IND0, T_LAND3
    s = (tl - t0) / 9                                     # 0.1233 s
    ts = lambda k: t0 + k * s
    # ---- downbeat accent
    dhol_h.n(ts(0), 0.5, 60, 127)
    dhol_s.n(ts(0), 0.2, 60, 112)
    tabla.n(ts(0), 0.3, 60, 120, kind='dha')
    sitar.n(ts(0), 0.5, [X('E4'), X('B4'), X('E5')], 118)
    harmon.n(ts(0), 1.06, [X('E3'), X('B3'), X('E4'), X('G#4')], 96)
    vln_si.n(ts(0), 0.12, [X('E5'), X('G#5'), X('B5'), X('E6')], 110)
    vlnpz.n(ts(0), 0.12, [X('E5'), X('B5')], 96)
    sub.n(ts(0), 0.45, X('E1'), 108)
    crash.n(ts(0), 1.0, 60, 96)
    tamb.n(ts(0), 0.2, 60, 100)
    # ---- dhol / tabla groove (3+3+3 bounce): dhol bass on 0,3,6; sticks on the off-slots; tabla fills the subdivisions
    for k, v in ((3, 108), (6, 112)):
        dhol_h.n(ts(k), 0.4, 60, v)
    for k, v in ((2, 84), (4, 96), (5, 102), (7, 92), (8, 100)):
        dhol_s.n(ts(k), 0.2, 60, v)
    for k, kind, v in ((1, 'na', 74), (2, 'tin', 92), (3, 'ge', 104), (4, 'na', 90), (5, 'tin', 98), (6, 'dha', 110), (7, 'na', 84)):
        tabla.n(ts(k), 0.2, 60, v, kind=kind, pan=0.15 if kind in ('na', 'tin') else -0.1)
    for i in range(9):
        tamb.n(ts(i) + 0.5 * s, 0.1, 60, 58 + 16 * (i % 2))
    # ---- harmonium drone continues under everything (E + B), bellows tremolo
    harmon.n(ts(0), 1.06, [X('E2'), X('B2')], 70)
    # ---- sitar riff (slots 0-5): E F G# A B with meend slides (augmented 2nd F->G#), then rhythmic chikari plucks
    sit = [(1.0, X('F5'), 0.5, 96, dict(**{'from': -1.0, 'gl': 0.02})), (1.5, X('G#5'), 1.0, 102, dict(**{'from': -3.0, 'gl': 0.05})),
           (2.5, X('A5'), 0.5, 98, dict(**{'from': -1.0, 'gl': 0.03})), (3.0, X('B5'), 1.5, 110, dict(**{'from': -3.0, 'gl': 0.09})),
           (4.5, X('A5'), 0.5, 94, dict(**{'from': 2.0, 'gl': 0.04})), (5.0, X('G#5'), 0.5, 92, {}), (5.5, X('E5'), 0.5, 96, dict(**{'from': -2.0, 'gl': 0.05})),
           (6.5, X('E5'), 0.5, 90, {}), (7.5, X('B4'), 0.5, 92, dict(**{'from': -2.0, 'gl': 0.04}))]
    for k, n_, d, v, kw in sit:
        sitar.n(ts(k), d * s * 1.8, n_, v, **kw)
    # ---- ornamental female vocalise 'aa-aa' + gamak trill (B5 <-> C6)
    for k, n_, d, v, kw in [(2.0, X('E5'), 0.8, 88, dict(**{'from': -2.0, 'gl': 0.05, 'vib': 0.15})), (3.0, X('G#5'), 0.85, 92, {}),
                            (3.9, X('B5'), 2.3, 100, dict(trill=(1.0, 7.0), vd=0.05))]:
        vox.n(ts(k), d * s, n_, v, **kw)
    vox.n(ts(6.4), 0.8 * s, X('G#5'), 84)
    # ---- shehnai (double reed, detuned pair) long line with ornaments
    she = [(3.0, X('B4'), 2.0, 100, dict(**{'from': -1.5, 'gl': 0.06, 'vib': 0.4, 'vr': 6.0, 'vd': 0.08})), (5.1, X('C5'), 0.5, 92, {}), (5.6, X('B4'), 0.5, 94, {}),
           (6.2, X('A4'), 1.0, 94, dict(vib=0.3)), (7.3, X('G#4'), 0.8, 92, {}), (8.1, X('E4'), 0.85, 98, dict(vib=0.45, vd=0.05))]
    for k, n_, d, v, kw in she:
        for dt, dv, det in ((0.0, 0, 0.0), (0.006, -8, 0.14)):
            shehnai.n(ts(k) + dt, d * s, m(n_) + det, v + dv, **kw)
    # ---- bansuri answer (descending, with a b2 touch), overlapping the tail
    for k, n_, d, v, kw in [(5.5, X('B5'), 0.5, 92, dict(**{'from': -2.0, 'gl': 0.05, 'vib': 0.3})), (6.0, X('A5'), 0.5, 90, {}), (6.5, X('G#5'), 0.5, 90, {}),
                            (7.0, X('F5'), 0.5, 92, {}), (7.5, X('E5'), 1.4, 96, dict(vib=0.3, vd=0.05))]:
        flute_ex.n(ts(k), d * s, n_, v, **kw)
    # ---- playful staccato filmi violins (unison, octave) and a bouncy pizzicato
    for k, n_ in ((1.0, X('E5')), (1.5, X('G#5')), (2.0, X('B5')), (4.0, X('B5')), (4.5, X('A5')), (5.0, X('G#5'))):
        vln_si.n(ts(k), 0.1, [n_, m(n_) + 12], 92)
    for k, n_ in ((1.5, X('E5')), (2.5, X('G#5')), (4.5, X('B5')), (5.5, X('E6'))):
        vlnpz.n(ts(k) + 0.02, 0.1, n_, 84)
    vla_si.n(ts(2.0), 0.1, X('E4'), 84)
    vln_solo.n(ts(0.05), 0.8 * s, X('E6'), 70, **{'from': -5.0, 'gl': 0.1, 'vib': 0.2})       # filmi swoop up into the riff
    # ---- pickup: tirakita fill + dhol sticks roll + accelerating E major violin run, landing on the theme (14.54)
    for i in range(8):
        tabla.n(tl - 0.24 + i * 0.03, 0.06, 60, 80 + 5 * i, kind='tak' if i % 2 else 'na', pan=0.1)
        dhol_s.n(tl - 0.24 + i * 0.03, 0.06, 60, 70 + 6 * i)
    scl = [X('G#4'), X('A4'), X('B4'), X('C#5'), X('D#5'), X('E5'), X('F#5'), X('G#5'), X('A5'), X('B5')]
    for k, nt in enumerate(scl):
        tk = tl - 0.03 - 0.36 * ((9 - k) / 9) ** 1.25
        vln_si.n(tk, 0.06, [nt, m(nt) + 12], 80 + 4 * k)
        vla_si.n(tk, 0.06, nt, 74 + 4 * k)
    riser.n(tl, 0.45, 60, 88, kind='cym', len='s')


