#!/usr/bin/env python3
"""
ConnectTV voices.   python3 voices_ctv.py     -> audio/ctv/voices/

  narrator_48k.wav   ORIGINAL TTS (audio/vo_original_tts.wav): Kaiser polyphase 44.1k -> 48k (160/147, beta 14) and a
                     2nd-order 70 Hz high-pass, NOTHING else; split at the hold points (nearest zero crossing, 5 ms fades)
                     with the hold silences inserted.  mono, T timeline (34.1 s).
  cinema_fx.wav      stereo: the narrator word "צ'רלטון" (v 8.32-8.85) re-spoken as the CINEMA-TRAILER voice inside the `cin`
                     hold, starting hold+0.03 s (WORLD pitch -5.5 st, formant warp 0.94, chest EQ, saturation, 3.6 s hall
                     reverb) + two darker echoes "צ'רלטון... צ'רלטון..." + a small hall send under the original word.
  genre_voices.wav   stereo: `tur` "Neden?!" (Kokoro if_sara driven by Turkish IPA, WORLD emotional lift/tremble) and
                     `ind` "वाह!" (Kokoro hm_omega Hindi, WORLD energetic lift), each at hold+0.03 s.
  voices.json        placements, ASR checks (sherpa-onnx Whisper-small, tr / hi).
Kokoro model files come from the kokoro-onnx GitHub release (model-files-v1.0) -> /tmp/kk/.
"""
import os, re, json, sys
import numpy as np
import soundfile as sf
import pyworld as pw
from scipy.signal import resample_poly, butter, sosfilt, fftconvolve

sys.path.insert(0, '/home/user/I/anim/audio/tools')
from sfx import make_ir, peq, lp, hp, bp, white, sat, expdec, N  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'voices')
SR = 48000
KOKORO = ('/tmp/kk/kokoro.onnx', '/tmp/kk/voices.bin')
ASRDIR = '/tmp/asr/sherpa-onnx-whisper-small/'


def read_timeline():
    s = open(os.path.join(os.path.dirname(ROOT), 'timeline.js')).read()
    hs = [dict(v=float(a), d=float(b), k=k) for a, b, k in re.findall(r"\{\s*v:\s*([\d.]+),\s*d:\s*([\d.]+),\s*k:\s*'(\w+)'", s)]
    vd = float(re.search(r'VDUR\s*=\s*([\d.]+)', s).group(1))
    acc = 0.0
    for h in hs:
        h['T0'] = h['v'] + acc
        acc += h['d']
    return hs, vd, vd + acc


HOLDS, VDUR, TOTAL = read_timeline()
HK = {h['k']: h for h in HOLDS}
NS = int(round(TOTAL * SR))
GENRE_DELAY = 0.03


def T(v, start=False):
    return v + sum(h['d'] for h in HOLDS if (h['v'] <= v + 1e-9 if start else h['v'] < v))


def fade_io(x, n):
    x = x.copy()
    if len(x) >= 2 * n:
        x[:n] *= np.linspace(0, 1, n)
        x[-n:] *= np.linspace(1, 0, n)
    return x


# ------------------------------------------------------------------ 1. narrator (original VO, held)
def narrator():
    x, sr = sf.read(os.path.join(ROOT, 'vo_original_tts.wav'))
    assert sr == 44100
    y = resample_poly(x, 160, 147, window=('kaiser', 14.0))
    y = sosfilt(butter(2, 70, 'highpass', fs=SR, output='sos'), y)
    cuts = []
    for h in HOLDS:
        c = int(round(h['v'] * SR))
        w = int(0.004 * SR)
        seg = y[c - w:c + w]
        zc = np.nonzero(np.signbit(seg[:-1]) != np.signbit(seg[1:]))[0]
        c = c - w + (zc[np.argmin(np.abs(zc - w))] + 1 if len(zc) else w)
        cuts.append((c, h['d']))
    pieces, prev, f = [], 0, int(0.005 * SR)
    for c, d in cuts:
        pieces.append(fade_io(y[prev:c], f))
        pieces.append(np.zeros(int(round(d * SR))))
        prev = c
    pieces.append(fade_io(y[prev:], f))
    out = np.concatenate(pieces)
    out = np.concatenate([out, np.zeros(max(0, NS - len(out)))])[:NS]
    return out, [c / SR for c, _ in cuts], y


# ------------------------------------------------------------------ WORLD helpers
def world(x, sr, f0_fn=None, warp=1.0, ap_fn=None, stretch=1.0, frame=5.0):
    x = np.ascontiguousarray(x, dtype=np.float64)
    f0, t = pw.harvest(x, sr, f0_floor=60, f0_ceil=600, frame_period=frame)
    sp = pw.cheaptrick(x, f0, t, sr)
    ap = pw.d4c(x, f0, t, sr)
    if stretch != 1.0:
        n0 = len(f0)
        n1 = int(round(n0 * stretch))
        pos = np.linspace(0, n0 - 1, n1)
        i0 = np.floor(pos).astype(int)
        i1 = np.minimum(i0 + 1, n0 - 1)
        fr = (pos - i0)[:, None]
        sp = np.exp(np.log(sp[i0] + 1e-16) * (1 - fr) + np.log(sp[i1] + 1e-16) * fr)
        ap = ap[i0] * (1 - fr) + ap[i1] * fr
        f0 = f0[np.round(pos).astype(int)]
        t = np.arange(n1) * frame / 1000.0
    if f0_fn is not None:
        f0 = f0_fn(f0, t)
    if warp != 1.0:
        nb = sp.shape[1]
        src = np.clip(np.arange(nb) / warp, 0, nb - 1)
        sp = np.vstack([np.interp(src, np.arange(nb), r) for r in sp])
        ap = np.vstack([np.interp(src, np.arange(nb), r) for r in ap])
    if ap_fn is not None:
        ap = ap_fn(ap, t)
    return pw.synthesize(f0, np.ascontiguousarray(sp), np.ascontiguousarray(ap), sr, frame)


def hall_ir(rt=3.6, dark=5500, seed=71):
    return make_ir(rt60=rt, predelay=0.035, hf=0.4, lf=1.3, er=16, er_span=0.12, bright=dark, seed=seed)


def conv(x, ir):
    return np.vstack([fftconvolve(x, ir[0]), fftconvolve(x, ir[1])])


def add(dst, src, t):
    i = int(round(t * SR))
    src = np.atleast_2d(src)
    if src.shape[0] == 1 and dst.ndim == 2:
        src = np.vstack([src[0], src[0]])
    L = min(src.shape[-1], dst.shape[-1] - i)
    if L > 0:
        dst[..., i:i + L] += src[..., :L]


# ------------------------------------------------------------------ Kokoro + ASR
_K = None


def kokoro(text, voice, speed=1.0, lang='en-us', phonemes=False):
    global _K
    if _K is None:
        from kokoro_onnx import Kokoro
        _K = Kokoro(*KOKORO)
    y, sr = _K.create(text, voice=voice, speed=speed, lang=lang, is_phonemes=phonemes)
    return resample_poly(y.astype(np.float64), 2, 1)


def trim(y, thr_db=-45):
    e = np.sqrt(np.convolve(y ** 2, np.ones(240) / 240, 'same'))
    idx = np.nonzero(e > np.max(e) * 10 ** (thr_db / 20))[0]
    return y[max(0, idx[0] - 120):idx[-1] + 480]


_R = {}


def asr_check(y, lang, sr=SR):
    try:
        import sherpa_onnx
        if lang not in _R:
            _R[lang] = sherpa_onnx.OfflineRecognizer.from_whisper(
                encoder=ASRDIR + 'small-encoder.int8.onnx', decoder=ASRDIR + 'small-decoder.int8.onnx',
                tokens=ASRDIR + 'small-tokens.txt', language=lang, task='transcribe', num_threads=4)
        y16 = resample_poly(y, 1, sr // 16000)
        s = _R[lang].create_stream()
        s.accept_waveform(16000, np.concatenate([np.zeros(4000), y16, np.zeros(8000)]).astype(np.float32))
        _R[lang].decode_stream(s)
        return s.result.text
    except Exception as e:  # ASR is only a check
        return 'n/a (%s)' % e


def breath(dur, r, f_lo=1300, f_hi=5200, up=True, level=1.0):
    """a sharp sobbing in-breath ('hih'): band-passed noise, pitch-swept, quick attack, softer decay"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = white(n, r)
    y = bp(nz, f_lo, f_hi) * 0.6 + peq(bp(nz, 2000, 3600), 2700, 3, 6) * 0.5
    a = np.minimum(t / (dur * 0.35), 1.0) ** 1.5 * np.exp(-np.maximum(t - dur * 0.45, 0) / (dur * 0.3))
    return y * a * level


def neden():
    """Turkish 'Neden?!' as a young GIRL crying (fits the 1.0 s `tur` hold, ends by hold+0.97 s).
    Kokoro has no Turkish: Italian if_sara + Turkish IPA (n e d e n) -- verified 'Neden?' by Whisper-tr -- then WORLD:
    f0 x1.55, formants x1.13 (child), pitch trembling ~8 Hz with a broken catch, breathy aperiodicity, amplitude
    breaks at the syllable joints with sharp in-breaths, and a short hiccuping sob tail ('hh-ha, hh-hha')."""
    r = np.random.default_rng(1234)
    y = trim(kokoro('nɛdˈɛn?!', 'if_sara', speed=1.12, lang='it', phonemes=True))

    def f0f(f0, t):
        tt = t / max(t[-1], 1e-6)
        lift = 1 + 0.20 * np.clip((tt - 0.5) / 0.5, 0, 1) ** 1.4              # pleading rise on "-den?!"
        trem = 2 ** ((0.25 + 0.75 * tt) * np.sin(2 * np.pi * 8.5 * t) / 12)      # sob-vibrato, growing
        jit = 2 ** (0.35 * np.convolve(r.standard_normal(len(t)), np.ones(3) / 3, 'same') / 12)
        catch = 1 + 0.07 * np.exp(-((tt - 0.62) / 0.03) ** 2)                    # voice break upward (a crack)
        return f0 * 1.55 * lift * trem * jit * catch
    w = world(y, SR, f0f, 1.13, lambda ap, t: np.clip(ap + 0.22 + 0.15 * (t / t[-1]), 0, 1), stretch=1.0)
    w = w / (np.max(np.abs(w)) + 1e-9)
    n = len(w)
    t = np.arange(n) / SR
    # amplitude breaks at the syllable joints (glottal catches) + sob tremble
    gate = np.ones(n)
    for c, wd in ((0.30 * n / SR, 0.045), (0.55 * n / SR, 0.035)):
        gate *= 1 - 0.85 * np.exp(-0.5 * ((t - c) / (wd / 2.5)) ** 2)
    gate *= 1 - 0.28 * (0.5 + 0.5 * np.sin(2 * np.pi * 9.0 * t)) * np.clip(t / (n / SR) * 1.6, 0, 1)
    w = w * gate
    out = np.zeros(int(1.0 * SR))
    add_1d(out, w, 0.0)
    L1 = len(w) / SR
    # in-breaths at the joints
    add_1d(out, breath(0.06, r, level=0.10), 0.30 * L1 - 0.03)
    add_1d(out, breath(0.05, r, level=0.10), 0.55 * L1 - 0.02)
    # sob tail: a hiccup in-breath then two short broken 'ha' sobs sliding down, fading out inside the hold
    tail0 = L1 + 0.02
    add_1d(out, breath(0.085, r, 1500, 5600, level=0.22), tail0)
    sob = trim(kokoro('hˈʌ hˈʌ', 'if_sara', speed=1.3, lang='en-us', phonemes=True))

    def sf0(f0, t):
        tt = t / max(t[-1], 1e-6)
        return np.where(f0 > 0, 470 * (1 - 0.22 * tt) * 2 ** (0.5 * np.sin(2 * np.pi * 9 * t) / 12), 0)
    sob = world(sob, SR, sf0, 1.12, lambda ap, t: np.clip(ap + 0.3, 0, 1))
    sob = sob / (np.max(np.abs(sob)) + 1e-9) * 0.42
    room_t = int((1.0 - 0.03) * SR)
    sob = sob[:max(0, room_t - int((tail0 + 0.10) * SR))]
    add_1d(out, sob, tail0 + 0.10)
    return out


def add_1d(dst, src, t):
    i = int(round(t * SR))
    if i < 0:
        src, i = src[-i:], 0
    L = min(len(src), len(dst) - i)
    if L > 0:
        dst[i:i + L] += src[:L]


def vaah():
    """Hindi 'वाह!' -- Kokoro hm_omega (Hindi), energetic: raised pitch, rising contour, slightly stretched"""
    y = trim(kokoro('वाह!', 'hm_omega', speed=1.0, lang='hi'))
    def f0f(f0, t):
        tt = t / max(t[-1], 1e-6)
        return f0 * 1.12 * (1 + 0.22 * np.clip(tt, 0, 1) ** 1.3)
    return world(y, SR, f0f, 1.0, None, stretch=1.15)


# ------------------------------------------------------------------ main
def main():
    os.makedirs(OUT, exist_ok=True)
    nar, cuts, _ = narrator()
    FX = np.zeros((2, NS + SR * 6))
    hc = HK['cin']
    h0 = hc['T0']
    he = h0 + hc['d']

    # ---- cinema voice: the narrator word re-spoken inside the hold
    a, b = int(round((T(8.32, True) - 0.02) * SR)), int(round((T(8.85) + 0.01) * SR))
    word = nar[a:b].copy()
    deep = world(word, SR, lambda f0, t: f0 * 2 ** (-5.5 / 12), warp=0.94, stretch=1.12)
    deep = peq(deep, 110, 0.8, 6.0)
    deep = peq(deep, 250, 1.0, 2.5)
    deep = peq(deep, 3200, 1.2, 2.0)
    deep = sat(deep / (np.max(np.abs(deep)) + 1e-9) * 1.4, 1.5) * np.max(np.abs(word)) * 0.85
    deep = fade_io(deep, int(0.006 * SR))
    t_word = h0 + GENRE_DELAY
    hall = hall_ir(3.6, 5200, 71)
    # dry (mono -> both)
    add(FX, deep, t_word)
    # hall of the word
    wet = conv(deep, hall) * 0.5
    add(FX, wet, t_word)
    # small hall send that blooms under the ORIGINAL word (T 8.32-8.85) to prepare the hold
    a2, b2 = int(round(T(8.15, True) * SR)), int(round(T(8.85) * SR))
    send = np.zeros(len(nar))
    r0 = int(round(T(8.32, True) * SR))
    send[a2:r0] = np.linspace(0, 0.10, r0 - a2)
    send[r0:b2] = 0.14
    add(FX, conv(nar[:b2] * send[:b2], hall) * 1.0, 0.0)
    # echoes "צ'רלטון... צ'רלטון...": darker + further each time (lower, lp, own hall)
    core = deep[int(0.04 * SR):]
    e_t = [(t_word + 0.60, 0.46), (t_word + 1.02, 0.24)]
    for k, (t_e, g) in enumerate(e_t):
        e = lp(core, 2500 - 900 * k, 2) * g
        ew = conv(e, hall_ir(4.0, 3300 - 800 * k, 72 + k)) * (1.2 + 0.3 * k)
        add(FX, ew, t_e)
        dry = np.concatenate([e, np.zeros(max(0, 1)) ])
        add(FX, np.vstack([dry * (0.6 if k == 0 else 0.25), np.concatenate([np.zeros(int(0.011 * SR)), dry])[:len(dry)] * (0.25 if k == 0 else 0.6)]), t_e)
    # the hall tail may run a little past the hold end (under the next word), gently faded
    i1, i2 = int(round((he - 0.20) * SR)), int(round((he + 0.55) * SR))
    FX[:, i1:i2] *= np.linspace(1, 0, i2 - i1) ** 1.5
    FX[:, i2:] = 0
    # echo 2 dry part must not be cut abruptly at the hold end: covered by the ramp above
    FX = FX[:, :NS]

    # ---- genre voices
    GV = np.zeros((2, NS))
    place = []
    room = make_ir(rt60=0.9, predelay=0.01, hf=0.5, er=10, er_span=0.04, bright=9000, seed=81)

    def put(y, t, g_db, pan=0.0, room=None, rev=0.18, name='', end=None):
        y = y / (np.max(np.abs(y)) + 1e-9) * 10 ** (g_db / 20)
        y = fade_io(y, int(0.004 * SR))
        st_ = np.vstack([y * np.cos((pan + 1) * np.pi / 4), y * np.sin((pan + 1) * np.pi / 4)]) * np.sqrt(2)
        if room is not None:
            w = conv(y, room) * rev
            st_ = np.hstack([st_, np.zeros((2, w.shape[1] - st_.shape[1]))]) + w
        if end is not None:      # everything must have died by the end of the hold (the narrator resumes)
            n_end = int(round((end - t) * SR))
            n_f = int(0.14 * SR)
            st_ = st_[:, :n_end].copy()
            st_[:, -n_f:] *= np.linspace(1, 0, n_f)
        add(GV, st_, t)
        place.append(dict(name=name, T=round(t, 3), dur=round(len(y) / SR, 3), until=round(t + st_.shape[1] / SR, 3)))
    ht, hi = HK['tur'], HK['ind']
    ne = neden()
    put(ne, ht['T0'] + GENRE_DELAY, -2.5, 0.0, room, 0.22, 'Neden?! + sob tail (tur: crying girl, Kokoro if_sara + Turkish IPA + WORLD child/tremble/breaks)', end=ht['T0'] + ht['d'])
    va = vaah()
    put(va, hi['T0'] + GENRE_DELAY, -2.0, 0.0, room, 0.20, 'वाह! (ind, Kokoro hm_omega Hindi + WORLD)', end=hi['T0'] + hi['d'])

    sf.write(os.path.join(OUT, 'narrator_48k.wav'), nar.astype(np.float32), SR, subtype='FLOAT')
    sf.write(os.path.join(OUT, 'cinema_fx.wav'), FX.T.astype(np.float32), SR, subtype='FLOAT')
    sf.write(os.path.join(OUT, 'genre_voices.wav'), GV.T.astype(np.float32), SR, subtype='FLOAT')
    rep = dict(holds=HOLDS, total=TOTAL, cuts_v=cuts, cinema=dict(word_T=[a / SR, b / SR], deep_dur=len(deep) / SR, t=t_word,
               echoes=e_t), placements=place,
               asr=dict(neden_tr=asr_check(ne, 'tr'), neden_it=asr_check(ne, 'it'), vaah_hi=asr_check(va, 'hi'),
                        cinema_word_he=asr_check(deep, 'he'), original_word_he=asr_check(nar[a - SR // 4:b + SR // 8], 'he')))
    json.dump(rep, open(os.path.join(OUT, 'voices.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(rep, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
