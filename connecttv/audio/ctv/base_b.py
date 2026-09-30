# ---- numpy synths -----------------------------------------------------------------------------
def mtof(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(out, y, t):
    a = int(round(t * SR))
    if a >= N:
        return
    if y.ndim == 1:
        y = np.stack([y, y], 1)
    if a < 0:
        y, a = y[-a:], 0
    e = min(N, a + len(y))
    out[a:e] += y[:e - a]


def lp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, 'low', fs=SR, output='sos'), x, axis=0)


def hpf(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x, axis=0)


class TaikoEngine:
    """big taiko/trailer drum: pitched membrane body + skin slap + stick; layered with a concert-bass-drum sample."""
    def __init__(self, f0=62, decay=0.5, bd_mix=0.8, sub=0.0):
        self.f0, self.decay, self.bd_mix, self.sub = f0, decay, bd_mix, sub

    def render(self, p, notes):
        out = np.zeros((N, 2))
        bd = perc1('BDrumNewhit_*', release=0.4, maxlen=3.0)
        for i, (t, d, n, v, kw) in enumerate(notes):
            rng = np.random.default_rng(900 + i)
            L = int((self.decay * 3 + 0.2) * SR)
            tt = np.arange(L) / SR
            f0 = self.f0 * 2 ** ((n - 60) / 12) * rng.uniform(0.98, 1.02)
            f = f0 * (1 + 0.8 * np.exp(-tt / 0.025))
            ph = 2 * np.pi * np.cumsum(f) / SR
            y = np.sin(ph) * np.exp(-tt / self.decay)
            y += 0.45 * np.sin(ph * 1.52 + 1) * np.exp(-tt / (self.decay * 0.4))
            y += 0.25 * np.sin(ph * 2.3 + 2) * np.exp(-tt / (self.decay * 0.2))
            nz = rng.standard_normal(L)
            y += 0.7 * lp(nz, 1400) * np.exp(-tt / 0.03)
            y += 0.18 * hpf(nz, 2500) * np.exp(-tt / 0.004)
            if self.sub:
                fs = 45 * (1 + 0.6 * np.exp(-tt / 0.06))
                y += self.sub * np.sin(2 * np.pi * np.cumsum(fs) / SR) * np.exp(-tt / (self.decay * 1.8))
            y = np.tanh(1.5 * y) / 1.1
            a = int(0.0015 * SR)
            y[:a] *= np.linspace(0, 1, a)
            vv = (v / 127) ** 1.5
            st = np.stack([y, y], 1) * vv
            if self.bd_mix:
                b = bd.voice(60 + (n - 60) * 0.5, v, 2.5, 0.3)
                st[:min(len(b), L)] += self.bd_mix * b[:L] * 3.0
            place(out, st, t)
        return out


class BoomEngine:
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            L = int(d * SR)
            tt = np.arange(L) / SR
            f0, f1 = kw.get('f0', 90), max(40, kw.get('f1', 40))
            f = f1 + (f0 - f1) * np.exp(-tt / 0.1)
            y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (d * 0.33))
            nz = np.random.default_rng(40 + i).standard_normal(L) * np.exp(-tt / 0.012)
            y = np.tanh(1.7 * (y + 0.3 * lp(nz, 2000)))
            y[:96] *= np.linspace(0, 1, 96)
            place(out, y * (v / 127), t)
        return out


def saw_add(f, dur_n, ph0=0.0, nh=None, nyq=20000):
    """band-limited saw by additive synthesis, f may be an array (per-sample)."""
    f = np.broadcast_to(f, (dur_n,)).astype(float)
    ph = 2 * np.pi * np.cumsum(f) / SR + ph0
    fmax = f.max()
    K = nh or max(1, int(nyq / fmax))
    y = np.zeros(dur_n)
    for k in range(1, K + 1):
        y += np.sin(k * ph) / k
    return y * 0.55


class BraaamEngine:
    """trailer braaam synth layer (detuned saws + square-ish, filter swell, drive) - layered with real brass."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            L = int((d + 0.4) * SR)
            tt = np.arange(L) / SR
            f = mtof(n)
            y = np.zeros(L)
            for j, det in enumerate((-9, -3, 4, 10)):
                y += saw_add(f * 2 ** (det / 1200), L, ph0=j, nyq=6000)
            y += 0.6 * saw_add(f * 2, L, nyq=6000)
            env = np.minimum(1, tt / 0.04) * np.exp(-np.maximum(tt - 0.05, 0) / (d * 0.55))
            env[int(d * SR):] *= np.exp(-(tt[int(d * SR):] - d) / 0.12)
            fc = 180 + 2200 * np.exp(-tt / 0.18) + 400 * np.exp(-tt / 0.8)
            # time-varying lowpass: block-wise
            yo = np.zeros(L)
            zi = None
            blk = 480
            for b0 in range(0, L, blk):
                sos = signal.butter(2, min(fc[b0], 18000), 'low', fs=SR, output='sos')
                if zi is None:
                    zi = np.zeros((sos.shape[0], 2))
                yo[b0:b0 + blk], zi = signal.sosfilt(sos, y[b0:b0 + blk], zi=zi)
            yo = np.tanh(2.2 * yo * env) * (v / 127)
            st = np.stack([yo, np.roll(yo, 180)], 1)
            place(out, st, t)
        return out


def ks_string(f, dur, vel, seed, t60=1.2, bright=0.6, pick=0.15, mute_after=8):
    rng = np.random.default_rng(seed)
    n = int((dur + 0.5) * SR)
    P = SR / f
    L = int(np.floor(P - 0.5))
    fr = P - 0.5 - L
    c0, c1, c2 = 0.5 * (1 - fr), 0.5, 0.5 * fr
    gper = 10 ** (-3 / (t60 * f))
    ex = rng.uniform(-1, 1, L)
    a = 0.15 + 0.8 * bright * (vel / 127)
    ex = signal.lfilter([a], [1, -(1 - a)], ex)
    dd = max(1, int(pick * P))
    ex = ex - np.concatenate([np.zeros(dd), ex[:-dd]])
    y = np.zeros(n + L + 3)
    off = 3
    y[off:off + L] = ex
    pos, end, doff = off + L, off + n, off + int(dur * SR)
    while pos < end:
        k = min(L, end - pos)
        gg = gper if pos < doff else gper ** mute_after
        y[pos:pos + k] += gg * (c0 * y[pos - L:pos - L + k] + c1 * y[pos - L - 1:pos - L - 1 + k]
                                + c2 * y[pos - L - 2:pos - L - 2 + k])
        pos += k
    return y[off:end] * (vel / 127)


class GuitarEngine:
    """distorted power-chord guitar: KS strings (root/5th/octave), palm-mute via note length, amp + cab, double-tracked."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for side, (sd, dl) in enumerate(((11, 0.0), (29, 0.013))):
            di = np.zeros(N)
            for i, (t, d, n, v, kw) in enumerate(notes):
                pm = kw.get('pm', False)
                for j, iv in enumerate((0, 7, 12)):
                    s_ = ks_string(mtof(n + iv), d, v, sd * 1000 + i * 7 + j, t60=0.5 if pm else 1.6,
                                   bright=0.5 if pm else 0.8, mute_after=12)
                    place_1d(di, s_ * (0.7 if pm else 1.0), t + dl + j * 0.003 + hum(2))
            x = hpf(di, 110)
            x = x + 1.5 * hpf(x, 900)                     # pre-emphasis
            x = np.tanh(14 * x) + 0.3 * np.tanh(40 * x)
            x = lp(lp(x, 5200), 6500)
            x = x + 0.6 * signal.sosfilt(peq_sos(1900, 3, 1.0), x)
            x = signal.sosfilt(peq_sos(350, -3, 1.0), x)
            x = hpf(x, 85, 3) * 0.35
            if side == 0:
                out[:, 0] += x
                out[:, 1] += 0.25 * x
            else:
                out[:, 1] += x
                out[:, 0] += 0.25 * x
        return out


def place_1d(buf, y, t):
    a = int(round(t * SR))
    if a >= len(buf) or a < 0:
        return
    e = min(len(buf), a + len(y))
    buf[a:e] += y[:e - a]


class LeadEngine:
    """bright supersaw lead with glide, vibrato and filter envelope (anime fanfare)."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        notes = sorted(notes, key=lambda x: x[0])
        for i, (t, d, n, v, kw) in enumerate(notes):
            L = int((d + 0.25) * SR)
            tt = np.arange(L) / SR
            prev = notes[i - 1][2] if i > 0 and t - (notes[i - 1][0] + notes[i - 1][1]) < 0.05 else n
            glide = prev + (n - prev) * (1 - np.exp(-tt / 0.025))
            vib = 0.12 * np.sin(2 * np.pi * 6 * tt) * np.clip((tt - 0.15) / 0.2, 0, 1)
            f = mtof(glide + vib)
            y = np.zeros((L, 2))
            for j, det in enumerate((-14, -8, -3, 0, 3, 8, 14)):
                s_ = saw_add(f * 2 ** (det / 1200), L, ph0=j * 1.3, nyq=16000)
                pan = (j - 3) / 3 * 0.8
                y[:, 0] += s_ * np.sqrt(0.5 * (1 - pan))
                y[:, 1] += s_ * np.sqrt(0.5 * (1 + pan))
            y /= 3.5
            env = np.minimum(1, tt / 0.01) * (0.8 + 0.2 * np.exp(-tt / 0.1))
            env[int(d * SR):] *= np.exp(-(tt[int(d * SR):] - d) / 0.06)
            y = lp(y, 7500) * env[:, None] * (v / 127)
            place(out, y, t)
        return out


class SubEngine:
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for t, d, n, v, kw in notes:
            L = int((d + 0.08) * SR)
            tt = np.arange(L) / SR
            f = mtof(n)
            y = np.sin(2 * np.pi * f * tt) + 0.25 * saw_add(f, L, nh=6)
            env = np.minimum(1, tt / 0.006) * np.exp(-tt / 1.5)
            env[int(d * SR):] *= np.exp(-(tt[int(d * SR):] - d) / 0.02)
            place(out, lp(y * env, 400) * (v / 127), t)
        return out


def darbuka_hit(kind, vel, seed):
    rng = np.random.default_rng(seed)
    v = (vel / 127) ** 1.4
    if kind == 'doum':
        n = int(0.55 * SR)
        t = np.arange(n) / SR
        f = 92 * (1 + 0.35 * np.exp(-t / 0.018)) * rng.uniform(0.98, 1.02)
        ph = 2 * np.pi * np.cumsum(f) / SR
        y = np.sin(ph) * np.exp(-t / 0.22) + 0.35 * np.sin(ph * 1.59 + 0.3) * np.exp(-t / 0.07)
        y += 0.2 * np.sin(ph * 2.14) * np.exp(-t / 0.04)
        y += 0.5 * lp(rng.standard_normal(n) * np.exp(-t / 0.006), 900)
        y += 0.25 * np.sin(2 * np.pi * 240 * t) * np.exp(-t / 0.05)
        return np.tanh(1.6 * y) / 1.2 * v
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    modes = [(680, 0.035, 0.5), (1420, 0.02, 0.45), (2550, 0.012, 0.4), (3900, 0.008, 0.3)] if kind == 'tek' else \
        [(610, 0.028, 0.5), (1300, 0.016, 0.4), (2300, 0.01, 0.3)]
    y = np.zeros(n)
    for fr, dec, a in modes:
        y += a * np.sin(2 * np.pi * fr * rng.uniform(0.985, 1.015) * t + rng.uniform(0, 6)) * np.exp(-t / dec)
    y += 0.9 * hpf(rng.standard_normal(n) * np.exp(-t / 0.004), 2500 if kind == 'tek' else 1800)
    return y * v * (1.0 if kind == 'tek' else 0.6) * 0.9


class DarbEngine:
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            k = kw.get('kind', 'doum')
            h = darbuka_hit(k, v, 700 + i)
            pan = -0.1 if k == 'doum' else 0.2
            place(out, np.stack([h * np.sqrt(1 - pan), h * np.sqrt(1 + pan)], 1), t)
        return out


class KanunEngine:
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            s_ = ks_string(mtof(n), d, v, 300 + i, t60=0.9, bright=0.9, pick=0.08)
            s_ = s_ + 0.5 * ks_string(mtof(n) * 1.0015, d, v, 800 + i, t60=0.9, bright=0.9, pick=0.1)
            place(out, np.stack([s_, np.roll(s_, 40)], 1) * 0.6, t)
        return hpf(out, 150)


class RiserEngine:
    """filtered-noise riser + rising tone, or a real suspended-cymbal crescendo aligned so its peak lands on t."""
    def render(self, p, notes):
        out = np.zeros((N, 2))
        for i, (t, d, n, v, kw) in enumerate(notes):
            kind = kw.get('kind', 'noise')
            if kind == 'cym':
                fn = {'s': 'susCymb1-cresc-Short_v1.wav', 'm': 'susCymb1-cresc-Median_v1.wav',
                      'l': 'susCymb1-cresc-Long_v1.wav'}[kw.get('len', 's')]
                x = load48(os.path.join(VS, 'Percussion', fn))
                env = np.abs(x).max(1)
                env = np.convolve(env, np.ones(2400) / 2400, mode='same')
                pk = int(np.argmax(env))
                a = max(0, pk - int(d * SR))
                y = x[a:pk + int(0.05 * SR)].copy()
                fi = min(len(y), int(0.3 * SR))
                y[:fi] *= np.linspace(0, 1, fi)[:, None]
                y[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))[:, None]
                y = y / (np.max(np.abs(y)) + 1e-9) * (v / 127)
                place(out, y, t - (len(y) - int(0.05 * SR)) / SR)
                continue
            L = int(d * SR)
            tt = np.arange(L) / SR
            x = np.random.default_rng(60 + i).standard_normal(L)
            ff, ts, Z = signal.stft(x, fs=SR, nperseg=1024)
            u = np.clip(ts / d, 0, 1)
            fc = kw.get('lo', 300) * (kw.get('hi', 9000) / kw.get('lo', 300)) ** (u ** 1.8)
            mask = np.exp(-0.5 * ((np.log2(np.maximum(ff, 1))[:, None] - np.log2(fc)[None, :]) / 0.6) ** 2)
            _, y = signal.istft(Z * mask, fs=SR, nperseg=1024)
            y = y[:L]
            fr = mtof(kw.get('n0', 45)) * 2 ** (kw.get('oct', 2.5) * (tt / d) ** 1.5)
            y = y / (np.std(y) + 1e-9) * 0.3 + 0.25 * lp(saw_add(fr, L, nyq=8000), 4000)
            y *= (tt / d) ** 2.2
            y[-240:] *= np.linspace(1, 0, 240)
            place(out, np.stack([y, np.roll(y, 300)], 1) * (v / 127) * 0.5, t)
        return out


# ---- EQ helpers ------------------------------------------------------------------------------
def peq_sos(f0, gdb, q):
    A = 10 ** (gdb / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]
    a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return signal.tf2sos(np.array(b) / a[0], np.array(a) / a[0])


def shelf_sos(f0, gdb, hi=True, S=0.8):
    A = 10 ** (gdb / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / 2 * np.sqrt((A + 1 / A) * (1 / S - 1) + 2)
    c = np.cos(w)
    sA = 2 * np.sqrt(A) * al
    if hi:
        b = [A * ((A + 1) + (A - 1) * c + sA), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sA)]
        a = [(A + 1) - (A - 1) * c + sA, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sA]
    else:
        b = [A * ((A + 1) - (A - 1) * c + sA), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sA)]
        a = [(A + 1) + (A - 1) * c + sA, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sA]
    return signal.tf2sos(np.array(b) / a[0], np.array(a) / a[0])


def hp_sos(f, o=2):
    return signal.butter(o, f, 'high', fs=SR, output='sos')


