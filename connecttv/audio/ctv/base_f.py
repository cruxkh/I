

# ----------------------------------------------------------------------------------------------
# Render + mix
# ----------------------------------------------------------------------------------------------
def pan_st(x, pan, width):
    mid = 0.5 * (x[:, 0] + x[:, 1])
    side = 0.5 * (x[:, 0] - x[:, 1]) * width
    return np.stack([(mid + side) * np.sqrt(1 - pan), (mid - side) * np.sqrt(1 + pan)], 1)


def make_ir(t60, length, seed, predelay=0.015, lpf=6500, er=10, damp_hi=0.45):
    rng = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    lo = signal.butter(2, 2500, 'low', fs=SR, output='sos')
    for c in range(2):
        nz = rng.standard_normal(n)
        l_ = signal.sosfilt(lo, nz)
        ir[:, c] = l_ * np.exp(-6.9 * t / t60) + 0.6 * (nz - l_) * np.exp(-6.9 * t / (t60 * damp_hi))
        pd = int(predelay * SR)
        ir[:pd, c] = 0
        for _ in range(er):
            d = int(rng.uniform(predelay + 0.004, predelay + 0.07) * SR)
            ir[d, c] += rng.uniform(0.25, 0.7) * (1 if rng.random() > 0.5 else -1)
    pd = int(predelay * SR)
    fade = int(0.03 * SR)
    ir[:pd + fade] *= np.linspace(0, 1, pd + fade)[:, None] ** 0.5
    ir = signal.sosfilt(signal.butter(2, lpf, 'low', fs=SR, output='sos'), ir, axis=0)
    ir = signal.sosfilt(signal.butter(2, 200, 'high', fs=SR, output='sos'), ir, axis=0)
    return ir / np.sqrt((ir ** 2).sum(0).mean())


def conv(x, ir):
    return np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], 1)


STEMS = ['drums', 'perc', 'strings', 'brass', 'choir', 'synth', 'fx', 'days']
STEM_EQ = {
    'drums': [hp_sos(35, 4), peq_sos(380, -2.5, 1.0), peq_sos(60, 1.5, 1.0), peq_sos(4500, 1.5, 0.8)],
    'perc': [hp_sos(38, 4), peq_sos(220, -2.5, 0.9)],
    'strings': [hp_sos(38, 4), peq_sos(220, -2.0, 0.9), peq_sos(650, -1.5, 1.0), shelf_sos(6000, 3.0)],
    'brass': [hp_sos(60, 2), peq_sos(220, -2.0, 1.0), peq_sos(600, -2.0, 1.0), peq_sos(1500, 1.5, 1.0), shelf_sos(6000, 2.0)],
    'choir': [hp_sos(120, 2), peq_sos(300, -2.0, 1.0)],
    'synth': [hp_sos(32, 4), peq_sos(250, -2.0, 1.0)],
    'fx': [hp_sos(40, 4), peq_sos(60, -2.0, 1.0)],
    'days': [hp_sos(120, 2)],
}


def auto_curve(p):
    if not p.auto:
        return None
    pts = sorted(p.auto)
    ts = np.array([x[0] for x in pts])
    ds = np.array([x[1] for x in pts])
    return 10 ** (np.interp(np.arange(N) / SR, ts, ds, left=ds[0], right=ds[-1]) / 20)


def render_all():
    compose()
    ir_room = make_ir(0.8, 1.2, 11, predelay=0.006, lpf=8000, er=14, damp_hi=0.5)
    ir_hall = make_ir(2.4, 3.6, 3, predelay=0.025, lpf=6500, er=8, damp_hi=0.4)
    segs = {}
    lvl = {}
    WIN = (('intro', (0.0, 3.4)), ('A', (3.4, 8.3)), ('holds', (8.85, 14.5)), ('live', (14.6, 20.9)), ('end', (28.6, 34.0)))
    for name, p in PARTS.items():
        if not p.notes:
            continue
        notes = [tuple(x) for x in p.notes]
        y = p.engine.render(p, notes)
        c = auto_curve(p)
        if c is not None:
            y = y * c[:, None]
        for s_ in p.eq:
            y = signal.sosfilt(s_, y, axis=0)
        y = pan_st(y, p.pan, p.width) * p.gain
        d = segs.setdefault(p.stem, [np.zeros((N, 2)), np.zeros((N, 2)), np.zeros((N, 2))])
        d[0] += y
        d[1] += y * p.room
        d[2] += y * p.hall
        for wn, (w0, w1) in WIN:
            lvl.setdefault(name, {})[wn] = float(np.mean(y[int(w0 * SR):int(w1 * SR)] ** 2))
        print('rendered %-8s %4d notes' % (name, len(p.notes)), file=sys.stderr)
    stems = {s: np.zeros((N, 2)) for s in STEMS}
    for stem, (dry, rs, hs) in segs.items():
        stems[stem] += dry + 0.5 * conv(rs, ir_room) + 0.45 * conv(hs, ir_hall)
    return stems, lvl


def env_pts(points):
    return np.interp(np.arange(N) / SR, [p[0] for p in points], [p[1] for p in points])


GAPS = [(T_VORTEX - 0.085, T_VORTEX - 0.004), (T_LOGO - 0.085, T_LOGO - 0.004), (T_NO1 - 0.07, T_NO1 - 0.004)]      # 'suck-in' micro gaps before the two big drops


def mixdown(stems):
    for s in STEMS:
        y = stems[s]
        for s_ in STEM_EQ[s]:
            y = signal.sosfilt(s_, y, axis=0)
        stems[s] = y
    # micro gaps (everything but the risers) so the drop hits from silence
    gm = np.ones(N)
    for a, b in GAPS:
        f = int(0.004 * SR)
        ia, ib = int(a * SR), int(b * SR)
        gm[ia:ib] = 0
        gm[ia - f:ia] = np.linspace(1, 0, f)
    for s in STEMS:
        if s != 'fx':
            stems[s] *= gm[:, None]
    # voice-range carve (-3 dB, 250-3000 Hz) only while the VO speaks (never in the holds): duck-friendly mids
    spk = np.zeros(N)
    for a, b in LINES:
        spk[max(0, int((a - 0.04) * SR)):int((b + 0.06) * SR)] = 1
    k = int(0.05 * SR)
    spk = np.convolve(spk, np.ones(k) / k, mode='same')
    band = signal.butter(2, [250, 3000], 'band', fs=SR, output='sos')
    depth = 1 - 10 ** (-3.0 / 20)
    for s in STEMS:
        stems[s] = stems[s] - depth * spk[:, None] * signal.sosfiltfilt(band, stems[s], axis=0)
    # master tone + width (linear, per stem)
    for s in STEMS:
        y = signal.sosfilt(shelf_sos(9000, 2.5), stems[s], axis=0)
        y = signal.sosfilt(peq_sos(3300, -1.0, 1.2), y, axis=0)
        mid = 0.5 * (y[:, 0] + y[:, 1])
        side = 0.5 * (y[:, 0] - y[:, 1])
        slo = signal.sosfiltfilt(signal.butter(2, 140, 'low', fs=SR, output='sos'), side)
        side = (side - slo) * 1.15
        stems[s] = np.stack([mid + side, mid - side], 1)
    # section dynamics (dB): intro a little lower, holds forward, drop/final peak
    dyn = [(0, -1.0), (T_OPEN - 0.05, -1.0), (T_OPEN, 0.5), (T_HOOK, -0.5), (T_SLAM - 0.05, -0.5), (T_SLAM, 1.5), (T_CIN0 + 0.4, 1.5),
           (T_LAND1 - 0.05, 1.5), (T_LAND1, 0.0), (T_TUR0 - 0.05, 0.0), (T_TUR0, 2.0), (T_TUR1 - 0.05, 2.0), (T_LAND2, -0.5),
           (T_IND0 - 0.05, -0.5), (T_IND0, 2.0), (T_IND1 - 0.05, 2.0), (T_LAND3, -0.5), (T_VORTEX - 0.1, -0.5), (T_VORTEX, 0.8),
           (T_GOAL - 0.3, 0.8), (T_GOAL, 1.2), (T_WAIT, -1.0), (T_WAIT + 1.2, -0.5), (T_FUN - 0.05, 0.0), (T_FUN, 0.5), (T_NO1 - 0.1, 0.5), (T_NO1, 1.0),
           (T_RELIEF - 0.05, 0.0), (T_RELIEF, -1.5), (T_PICK + 0.4, -1.5), (T_PLAY, 0.0), (T_LOGO - 0.01, 0.5), (T_LOGO, 2.0), (DUR, 2.0)]
    dc = 10 ** (env_pts(dyn) / 20)
    fade = np.ones(N)
    a, e = int(T_FADE0 * SR), N
    fade[a:e] = np.cos(np.linspace(0, np.pi / 2, e - a)) ** 1.5
    for s in STEMS:
        stems[s] *= (dc * fade)[:, None]
    mix = sum(stems[s] for s in STEMS)
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    g0 = 10 ** ((-16.0 - meter.integrated_loudness(mix)) / 20)
    mix *= g0
    for s in STEMS:
        stems[s] *= g0
    # glue compressor (2:1, soft knee, 15/180 ms, 10 ms RMS on a HP'd sidechain)
    sc = signal.sosfilt(hp_sos(120), mix.mean(1))
    blk = 48
    nb = N // blk
    pw = np.convolve((sc[:nb * blk] ** 2).reshape(nb, blk).mean(1), np.ones(10) / 10, mode='same')
    lv = 10 * np.log10(pw + 1e-12)
    thr, ratio, knee = -23.0, 2.5, 6.0
    over = lv - thr
    gr = np.where(over <= -knee / 2, 0.0, np.where(over >= knee / 2, (1 - 1 / ratio) * over,
                                                   (1 - 1 / ratio) * (over + knee / 2) ** 2 / (2 * knee)))
    at, rl = np.exp(-blk / (0.015 * SR)), np.exp(-blk / (0.18 * SR))
    sm = np.empty(nb)
    pv = 0.0
    for i in range(nb):
        v = gr[i]
        pv = at * pv + (1 - at) * v if v > pv else rl * pv + (1 - rl) * v
        sm[i] = pv
    gcomp = 10 ** (-np.interp(np.arange(N), np.arange(nb) * blk + blk / 2, sm) / 20)
    mix *= gcomp[:, None]
    g1 = 10 ** ((-14.0 - meter.integrated_loudness(mix)) / 20)
    mix *= g1
    # soft peak shaper (gain applied to mix AND stems so they still sum): tames the tutti-hit crest factor
    pk = np.max(np.abs(mix), 1)
    knee0 = 0.45
    shp = np.where(pk <= knee0, pk, knee0 + (1 - knee0) * np.tanh((pk - knee0) / (1 - knee0)))
    gsh = shp / np.maximum(pk, 1e-9)
    mix *= gsh[:, None]
    g3 = 10 ** ((-14.0 - meter.integrated_loudness(mix)) / 20)
    mix *= g3
    g1 = g1 * g3
    # lookahead limiter
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    ceil = 10 ** (-1.6 / 20)
    need = np.minimum(1.0, ceil / np.maximum(np.max(np.abs(mix), 1), 1e-9))
    la = int(0.003 * SR)
    need = minimum_filter1d(need, 2 * la + 1)
    rel = np.exp(-1 / (0.06 * SR))
    lim = np.empty(N)
    pv = 1.0
    for i in range(N):
        v = need[i]
        pv = v if v < pv else pv * rel + v * (1 - rel)
        lim[i] = pv
    lim = uniform_filter1d(lim, la, mode='nearest')
    mix *= lim[:, None]
    gt = gcomp * g1 * gsh * lim
    for s in STEMS:
        stems[s] *= gt[:, None]
    tpk = np.max(np.abs(signal.resample_poly(mix, 4, 1, axis=0)))
    g2 = 10 ** (-1.3 / 20) / tpk                       # true-peak ceiling -1.3 dBTP
    mix *= g2
    for s in STEMS:
        stems[s] *= g2
    print('glue comp max %.1f dB | limiter max %.1f dB' % (sm.max(), -20 * np.log10(lim.min())), file=sys.stderr)
    return mix, stems


def onsets(x, t0, t1, hop=0.002):
    """spectral-flux-like onset times inside [t0, t1]: returns list of (t, strength) for the strongest peaks"""
    y = x.mean(1) if x.ndim > 1 else x
    y = signal.sosfilt(hp_sos(60), y)
    h = int(hop * SR)
    seg = y[int(t0 * SR):int(t1 * SR)]
    n = len(seg) // h
    e = np.sqrt((seg[:n * h] ** 2).reshape(n, h).mean(1)) + 1e-9
    de = np.maximum(0, np.diff(20 * np.log10(e)))
    return de, hop


def cue_check(x, cues):
    """for every cue time: strongest energy rise within +-60 ms -> offset in ms (positive = music late)."""
    rows = []
    for name, tc in cues:
        de, hop = onsets(x, tc - 0.08, tc + 0.08)
        if len(de) == 0:
            continue
        k = int(np.argmax(de))
        off = (k * hop - 0.08) * 1000
        rows.append((name, tc, off, float(de[k])))
    return rows


def report(mix, stems, lvl, path):
    import pyloudnorm as pyln
    x, _ = sf.read(path)
    info = sf.info(path)
    print('\n== %s %d Hz %d ch %s %.4f s' % (os.path.basename(path), info.samplerate, info.channels, info.subtype, info.frames / SR),
          file=sys.stderr)
    tp = 20 * np.log10(np.max(np.abs(signal.resample_poly(x, 4, 1, axis=0))))
    print('peak %.2f dBFS  true-peak %.2f dBTP  %.1f LUFS' % (20 * np.log10(np.max(np.abs(x))), tp,
                                                              pyln.Meter(SR).integrated_loudness(x)), file=sys.stderr)
    print('clip count (>=0.999): %d' % int(np.sum(np.abs(x) >= 0.999)), file=sys.stderr)
    bands = [(20, 35), (35, 60), (60, 120), (120, 250), (250, 500), (500, 1000), (1000, 2000), (2000, 4000),
             (4000, 8000), (8000, 16000)]
    secs = [('intro', 0, 3.4), ('A', 3.4, 8.3), ('cin', T_CIN0, T_CIN1), ('s1', 10.3, 11.3), ('tur', T_TUR0, T_TUR1), ('ind', T_IND0, T_IND1),
            ('live', 14.6, 17.3), ('chorus', 17.35, 20.9), ('wait', 22.3, 24.8), ('no', 25.9, 28.2), ('finale', 28.6, 31.1),
            ('tail', 31.2, 34.1)]
    print('section  rms dBFS | band dB rel section total: ' + ' '.join('%d-%d' % bb for bb in bands), file=sys.stderr)
    for nm, t0, t1 in secs:
        seg = x[int(t0 * SR):int(t1 * SR)]
        f, P = signal.welch(seg.mean(1), SR, nperseg=4096)
        tot = P.sum()
        print('  %-7s %6.1f | ' % (nm, 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)) +
              ' '.join('%5.1f' % (10 * np.log10(P[(f >= lo) & (f < hi)].sum() / tot + 1e-12)) for lo, hi in bands) +
              '  corr %.2f' % np.corrcoef(seg[:, 0], seg[:, 1])[0, 1], file=sys.stderr)
    c0, c1 = int(17.4 * SR), int(20.9 * SR)
    ref = np.sqrt(np.mean(mix[c0:c1] ** 2))
    print('stems in chorus (dB rel mix): ' + ', '.join('%s %.1f' % (s, 20 * np.log10(np.sqrt(np.mean(stems[s][c0:c1] ** 2)) / ref + 1e-12))
                                                      for s in STEMS), file=sys.stderr)
    if lvl:
        for wn in ('intro', 'A', 'holds', 'live', 'end'):
            print('parts %s: ' % wn + ', '.join('%s %.0f' % (k, 10 * np.log10(v.get(wn, 0) + 1e-14)) for k, v in lvl.items()), file=sys.stderr)
    # speech-band (250-3000 Hz) energy under the VO vs elsewhere
    band = signal.sosfiltfilt(signal.butter(2, [250, 3000], 'band', fs=SR, output='sos'), x.mean(1))
    spk = np.zeros(N)
    for a, b in LINES:
        spk[int(a * SR):int(b * SR)] = 1
    print('mid-band (250-3k) level: under VO %.1f dBFS rms, outside VO %.1f dBFS rms' % (
        20 * np.log10(np.sqrt(np.mean(band[spk > 0] ** 2))), 20 * np.log10(np.sqrt(np.mean(band[spk == 0] ** 2)))), file=sys.stderr)
    cues = [('bolt', T_BOLT), ('open', T_OPEN), ('netflix', T_NFX), ('disney', T_DIS), ('charlton', T_SLAM), ('cin-land', T_LAND1),
            ('tur-hit', T_TUR0), ('tur-land', T_LAND2), ('ind-hit', T_IND0), ('ind-land', T_LAND3), ('vortex', T_VORTEX),
            ('nagish', T_NAGISH), ('goal', T_GOAL), ('fun', T_FUN), ('no1', T_NO1), ('no2', T_NO2), ('xout', T_XOUT), ('tap', T_TAP),
            ('burst', T_BURST), ('playback', T_PLAY), ('LOGO', T_LOGO)]
    print('cue alignment: nearest programmed impact onset (timp/bd/taiko/trailer/crash/cymbal/low-brass stab/kick) to each cue:', file=sys.stderr)
    hits = sorted(set(round(n[0], 4) for k in ('timp', 'bd', 'taiko', 'trailer', 'crash', 'ocym', 'tb_st', 'kick', 'snare', 'tutti') if k in PARTS
                      for n in PARTS[k].notes))
    hits = np.array(hits)
    for nm, tc in cues:
        j = int(np.argmin(np.abs(hits - tc)))
        print('   %-9s cue T=%.3f   nearest impact %.3f  offset %+5.1f ms' % (nm, tc, hits[j], (hits[j] - tc) * 1000), file=sys.stderr)
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(2, 1, figsize=(20, 8), gridspec_kw=dict(height_ratios=[3, 1]))
    ff, tt, S = signal.spectrogram(x.mean(1), SR, nperseg=4096, noverlap=3072)
    ax[0].pcolormesh(tt, ff, 10 * np.log10(S + 1e-14), shading='auto', vmin=-130, vmax=-40, cmap='magma')
    ax[0].set_yscale('symlog', linthresh=200)
    ax[0].set_ylim(20, 20000)
    for _, tv in cues:
        ax[0].axvline(tv, color='c', lw=0.6, alpha=0.7)
    ax[0].set_title('ConnectTV score - spectrogram (cyan = cue times)')
    h = int(0.02 * SR)
    e = np.sqrt(np.mean(x[:len(x) // h * h].mean(1).reshape(-1, h) ** 2, 1))
    ax[1].plot(np.arange(len(e)) * 0.02, 20 * np.log10(e + 1e-9))
    for a_, b_ in LINES:
        ax[1].axvspan(a_, b_, color='orange', alpha=0.15)
    for a_, b_ in HOLD_T.values():
        ax[1].axvspan(a_, b_, color='green', alpha=0.15)
    ax[1].set_ylim(-80, 0)
    for a_ in ax:
        a_.set_xlim(0, DUR)
    ax[1].set_ylabel('RMS dBFS; orange=VO green=holds')
    plt.tight_layout()
    plt.savefig(os.path.join(HERE, 'score_ctv_spectrogram.png'), dpi=85)


def main():
    stems, lvl = render_all()
    mix, stems = mixdown(stems)
    out = os.path.join(HERE, 'score_ctv.wav')
    os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
    sf.write(out, mix, SR, subtype='PCM_24')
    for s in STEMS:
        sf.write(os.path.join(HERE, 'stems', f'{s}.wav'), stems[s], SR, subtype='PCM_24')
    nod = mix - stems['days']
    sf.write(os.path.join(HERE, 'score_ctv_nodays.wav'), nod, SR, subtype='PCM_24')
    report(mix, stems, lvl, out)


if __name__ == '__main__':
    main()
