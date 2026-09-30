

# ---- GM soundfont via the fluidsynth CLI (choir aahs / voice oohs / celesta) -----------------------
class GMEngine:
    """renders notes + CC11 expression + pitch bends through GeneralUser GS with the fluidsynth command line."""
    def __init__(self, prog, bank=0, bendrange=2):
        self.prog, self.bank, self.br = prog, bank, bendrange

    def render(self, p, notes):
        import mido
        import tempfile
        mid = mido.MidiFile(ticks_per_beat=960)
        tr = mido.MidiTrack()
        mid.tracks.append(tr)
        tempo = 500000                       # 120 BPM -> 1 s = 2 beats = 1920 ticks
        tr.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))
        tick = lambda t: int(round(t * 1920))
        ev = []
        ev.append((0, 0, mido.Message('control_change', control=101, value=0)))
        ev.append((0, 0, mido.Message('control_change', control=100, value=0)))
        ev.append((0, 0, mido.Message('control_change', control=6, value=self.br)))
        ev.append((0, 0, mido.Message('control_change', control=7, value=127)))
        ev.append((0, 0, mido.Message('control_change', control=11, value=127)))
        ev.append((0, 0, mido.Message('program_change', program=self.prog)))
        for t, d, n, v, kw in notes:
            ev.append((tick(t), 2, mido.Message('note_on', note=int(round(n)), velocity=int(v))))
            ev.append((tick(t + d), 1, mido.Message('note_off', note=int(round(n)), velocity=0)))
        for t, kind, a, b in p.ctl:
            if kind == 'cc':
                ev.append((tick(t), 1, mido.Message('control_change', control=a, value=b)))
            else:
                pb = int(np.clip(8192 + a / self.br * 8192, 0, 16383)) - 8192
                ev.append((tick(t), 1, mido.Message('pitchwheel', pitch=int(np.clip(pb, -8192, 8191)))))
        endt = max([t + d for t, d, *_ in notes] + [1.0]) + 3.0
        ev.append((tick(endt), 9, mido.MetaMessage('end_of_track')))
        ev.sort(key=lambda e: (e[0], e[1]))
        last = 0
        for tk, _, msg in ev:
            msg.time = tk - last
            last = tk
            tr.append(msg)
        with tempfile.TemporaryDirectory() as td:
            mp, wp = os.path.join(td, 'a.mid'), os.path.join(td, 'a.wav')
            mid.save(mp)
            subprocess.check_call(['fluidsynth', '-ni', '-q', '-r', str(SR), '-g', '0.8',
                                   '-o', 'synth.reverb.active=0', '-o', 'synth.chorus.active=0',
                                   '-F', wp, SF2, mp], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            x, sr = sf.read(wp, always_2d=True, dtype='float64')
        out = np.zeros((N, 2))
        k = min(N, len(x))
        out[:k] = x[:k, :2]
        return out


def resamp_var(x, ratio):
    """variable-rate resampling of a stereo array; ratio is per output sample (playback speed)."""
    pos = np.cumsum(ratio) - ratio[0]
    m_ = pos < len(x) - 2
    pos = pos[m_]
    i0 = pos.astype(int)
    fr = (pos - i0)[:, None]
    return x[i0] * (1 - fr) + x[i0 + 1] * fr


class WindEngine:
    """sample-based flute/oboe with portamento, scoops, vibrato and a looped sustain (for bansuri / ney / duduk-like lines).
    kw: from=semitone offset to glide from, gl=glide time, vib=depth semitones, vr=vibrato rate, vd=vibrato delay."""
    def __init__(self, sampler_fn, gain=1.0):
        self.fn, self.gain = sampler_fn, gain

    def render(self, p, notes):
        smp = self.fn()
        out = np.zeros((N, 2))
        for t, d, n, v, kw in notes:
            k, x, li, nl = smp.pick(n, v)
            base = 2 ** ((n - k) / 12)
            L = int((d + 0.25) * SR)
            tt = np.arange(L) / SR
            sm = kw.get('from', 0.0) * np.exp(-tt / max(kw.get('gl', 0.06), 1e-3))
            vib = kw.get('vib', 0.18) * np.sin(2 * np.pi * kw.get('vr', 5.6) * tt) * np.clip((tt - kw.get('vd', 0.2)) / 0.25, 0, 1)
            bend = kw.get('bend')
            bd = 0.0
            if bend:                                   # (semitones, start_frac): slide at the end of the note (sob / fall)
                bd = bend[0] * np.clip((tt / d - bend[1]) / max(1e-3, 1 - bend[1]), 0, 1) ** 1.5
            ratio = base * 2 ** ((sm + vib + bd) / 12)
            need = int(L * ratio.max() * 1.05) + 16
            xs = x
            if len(xs) < need:                          # loop the sustain part with an equal-power crossfade
                a0 = int(0.35 * len(xs)); a1 = int(0.85 * len(xs)); xf = int(0.08 * SR)
                seg = xs[a0:a1]
                buf = [xs[:a1]]
                tot = a1
                while tot < need:
                    prev = buf[-1]
                    nxt = seg.copy()
                    w = np.linspace(0, 1, xf)[:, None]
                    prev = prev.copy()
                    prev[-xf:] = prev[-xf:] * np.cos(w * np.pi / 2) + nxt[:xf] * np.sin(w * np.pi / 2)
                    buf[-1] = prev
                    buf.append(nxt[xf:])
                    tot += len(nxt) - xf
                xs = np.concatenate(buf)
            y = resamp_var(xs[:need], ratio)[:L]
            L = len(y)
            env = np.ones(L)
            a = int(kw.get('att', 0.03) * SR)
            env[:a] *= np.linspace(0, 1, a)
            n_on = int(d * SR)
            if n_on < L:
                r = L - n_on
                env[n_on:] *= np.linspace(1, 0, r) ** 1.5
            g = (v / 127) ** 1.2 * smp.keynorm[k] * self.gain
            place(out, y * env[:, None] * g, t)
        return out


class SitarEngine:
    """plucked sitar-like string: KS with a jawari-style buzz (asymmetric soft clip = grazing bridge), bright 2-5 kHz body,
    sympathetic-string resonances (tuned to the tonic/fifth) and meend slides.  kw: from (semitones, start offset), gl (glide s)."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            f = mtof(n)
            s_ = ks_string(f, d, v, 1200 + i, t60=kw.get('t60', 1.1), bright=1.0, pick=0.04, mute_after=kw.get('mute', 3))
            L = len(s_)
            tt = np.arange(L) / SR
            fr = kw.get('from', 0.0)
            if fr:
                ratio = 2 ** ((fr * np.exp(-tt / kw.get('gl', 0.08))) / 12)
                s_ = resamp_var(np.stack([s_, s_], 1), ratio)[:, 0]
            z = np.tanh(5.0 * s_ + 1.2 * s_ ** 2) * 0.55                    # jawari buzz
            z = z + 0.14 * hpf(np.tanh(9.0 * s_), 2200) * np.exp(-tt[:len(z)] / 0.25)   # bright buzzing top
            z = z + 0.5 * signal.sosfilt(peq_sos(f * 2.0, 8, 6.0), z)
            z = signal.sosfilt(peq_sos(2600, 3, 0.9), z)
            for sf_ in (mtof(64) * 1.0, mtof(71), mtof(76)):               # sympathetic strings E4 B4 E5
                z = z + 0.18 * signal.sosfilt(peq_sos(sf_, 20, 40.0), z)
            z = hpf(lp(z, 7500), 140)
            place(out, np.stack([z, np.roll(z, 55)], 1) * 0.5, t)
        return out


class HarmoniumEngine:
    """harmonium: three detuned reed voices (musette), reedy odd-rich wave, bellows tremolo, nasal EQ; kw: trem (Hz)"""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            L = int((d + 0.15) * SR)
            tt = np.arange(L) / SR
            f = mtof(n)
            y = np.zeros(L)
            for det in (-7, 0, 6):
                fr = f * 2 ** (det / 1200)
                ph = 2 * np.pi * fr * tt
                K = int(min(3800 / fr, 28))
                for k in range(1, K + 1):
                    y += np.sin(k * ph + 0.7 * k * det / 1200) / k ** 0.85
            y *= 1 + kw.get('td', 0.06) * np.sin(2 * np.pi * kw.get('trem', 5.0) * tt)
            env = np.minimum(1, tt / 0.03)
            n_on = int(d * SR)
            env[n_on:] *= np.exp(-(tt[n_on:] - d) / 0.05)
            y = lp(y, 3200) * env
            y = signal.sosfilt(peq_sos(1100, 5, 1.0), y)
            y = y / (np.max(np.abs(y)) + 1e-9) * (v / 127) * 0.35
            place(out, np.stack([y, np.roll(y, 70)], 1), t)
        return out


class VoxEngine:
    """formant-synthesised female 'aa' (F1 850, F2 1220, F3 2810 Hz) with vibrato, portamento and gamak trills (ornamental vocalise, no words).
    kw: from, gl, vib, trill=(semitones, rate Hz), vd (vibrato delay)"""
    FORM = [(850, 100, 1.0), (1220, 120, 0.6), (2810, 200, 0.28), (3600, 260, 0.12)]

    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            rng = np.random.default_rng(6000 + i)
            L = int((d + 0.2) * SR)
            tt = np.arange(L) / SR
            semi = kw.get('from', 0.0) * np.exp(-tt / kw.get('gl', 0.05))
            vib = kw.get('vib', 0.28) * np.sin(2 * np.pi * 5.9 * tt) * np.clip((tt - kw.get('vd', 0.12)) / 0.2, 0, 1)
            tr = kw.get('trill')
            if tr:
                semi = semi + tr[0] * 0.5 * (1 - np.cos(2 * np.pi * tr[1] * tt)) * np.clip((tt - 0.06) / 0.06, 0, 1)
            fcur = mtof(n + semi + vib)
            ph = 2 * np.pi * np.cumsum(fcur) / SR
            f0b = mtof(n)
            K = int(min(5200 / f0b, 40))
            y = np.zeros(L)
            for k in range(1, K + 1):
                fk = k * f0b
                a = sum(g * np.exp(-0.5 * ((fk - fc) / bw) ** 2) for fc, bw, g in self.FORM) + 0.03
                y += a / k * np.sin(k * ph)
            y += 0.05 * hpf(lp(rng.standard_normal(L), 5000), 2000) * np.minimum(1, tt / 0.05)
            env = np.minimum(1, tt / 0.03)
            n_on = int(d * SR)
            env[n_on:] *= np.exp(-(tt[n_on:] - d) / 0.06)
            env *= 1 - 0.18 * (0.5 - 0.5 * np.cos(2 * np.pi * 5.9 * tt)) * np.clip((tt - 0.15) / 0.2, 0, 1)
            y = y * env
            y = y / (np.max(np.abs(y)) + 1e-9) * (v / 127) * 0.5
            place(out, np.stack([y, np.roll(y, 45)], 1), t)
        return out


class TablaEngine:
    """synthetic tabla/dhol-ish hits: kinds: ge (bayan bass with pitch rise), na (dayan ring), tin, dha (both), tak, dhol (deep + skin)."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            rng = np.random.default_rng(3000 + i)
            k = kw.get('kind', 'ge')
            vv = (v / 127) ** 1.3
            L = int(0.7 * SR)
            tt = np.arange(L) / SR
            y = np.zeros(L)
            if k in ('ge', 'dha', 'dhol'):
                f0 = (82.4 if k != 'dhol' else 61.7) * 2 ** ((n - 60) / 12)
                f = f0 * (1 + 0.45 * np.exp(-tt / 0.03) - 0.25 * np.exp(-tt / 0.012) * 0)
                f = f0 * (0.8 + 0.2 * (1 - np.exp(-tt / 0.06))) * (1 + 0.5 * np.exp(-tt / 0.02))
                ph = 2 * np.pi * np.cumsum(f) / SR
                y += np.sin(ph) * np.exp(-tt / (0.18 if k != 'dhol' else 0.26))
                y += 0.3 * np.sin(1.5 * ph + 0.4) * np.exp(-tt / 0.05)
                y += 0.55 * lp(rng.standard_normal(L), 1100) * np.exp(-tt / 0.012)
            if k in ('na', 'tin', 'dha'):
                fd = 415.3 * 2 ** ((n - 60) / 12) if k != 'tin' else 659.3 * 2 ** ((n - 60) / 12)
                for j, (r_, a_, dc) in enumerate(((1, 1.0, 0.16), (2.0, 0.55, 0.1), (3.0, 0.4, 0.07), (4.1, 0.25, 0.04))):
                    y += 0.55 * a_ * np.sin(2 * np.pi * fd * r_ * tt + j) * np.exp(-tt / (dc if k != 'na' else dc * 0.6))
                y += 0.5 * hpf(rng.standard_normal(L) * np.exp(-tt / 0.004), 2000)
            if k == 'tak':
                y += 0.9 * hpf(rng.standard_normal(L) * np.exp(-tt / 0.006), 1800)
                y += 0.4 * np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt / 0.01)
            if k == 'dhol':
                y += 0.7 * hpf(lp(rng.standard_normal(L), 4500), 800) * np.exp(-tt / 0.02)
            y = np.tanh(1.5 * y) / 1.2 * vv
            y[:24] *= np.linspace(0, 1, 24)
            pan = kw.get('pan', 0.0)
            place(out, np.stack([y * np.sqrt(1 - pan), y * np.sqrt(1 + pan)], 1), t)
        return out


class ZapEngine:
    """the bolt: electric crack (pitch-dived sine + noise burst + comb buzz) - a synthesised sting for the screen crack."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            rng = np.random.default_rng(4000 + i)
            L = int(d * SR)
            tt = np.arange(L) / SR
            f = 90 + 5200 * np.exp(-tt / 0.03)
            y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16)
            nz = rng.standard_normal(L)
            y += 0.9 * hpf(nz, 2500) * np.exp(-tt / 0.05)
            # crackle: sparse random clicks decaying
            cl = (rng.random(L) < 0.004 * np.exp(-tt / 0.12)) * rng.standard_normal(L) * 3
            y += hpf(cl, 1500)
            y = np.tanh(2.5 * y) * np.exp(-tt / (d * 0.5))
            y[:48] *= np.linspace(0, 1, 48)
            place(out, np.stack([y, np.roll(y, 120)], 1) * (v / 127) * 0.6, t)
        return out


class ShimmerEngine:
    """sparkle: rapid random high sine 'glints' (magic dust) within a note window; kw: lo, hi midi range, dens per s."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            rng = np.random.default_rng(5000 + i)
            dens = kw.get('dens', 60)
            scale = kw.get('scale', [0, 2, 4, 7, 9])
            root = kw.get('root', 7)
            k = int(d * dens)
            for j in range(k):
                u = rng.random()
                tj = t + u * d
                o = rng.integers(kw.get('o0', 6), kw.get('o1', 8))
                nn = 12 * o + root + scale[rng.integers(0, len(scale))]
                fr = mtof(nn)
                Lg = int(0.25 * SR)
                tg = np.arange(Lg) / SR
                g = np.sin(2 * np.pi * fr * tg) * np.exp(-tg / 0.06) + 0.3 * np.sin(2 * np.pi * fr * 2.76 * tg) * np.exp(-tg / 0.03)
                g[:20] *= np.linspace(0, 1, 20)
                amp = (v / 127) * (0.25 + 0.75 * (1 - abs(u - kw.get('peak', 0.5)))) * 0.25
                pan = rng.uniform(-0.8, 0.8)
                place(out, np.stack([g * np.sqrt(0.5 * (1 - pan)), g * np.sqrt(0.5 * (1 + pan))], 1) * amp, tj)
        return out


def bass_synth_note(f, L, drive=2.0):
    tt = np.arange(L) / SR
    y = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)
    return np.tanh(drive * y)
