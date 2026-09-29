#!/usr/bin/env python3
"""
GOTV v7 voices.   python3 voices_v7.py

Writes into v7/voices/:
  vo_held_44k.wav     ORIGINAL TTS split at every hold v (nearest zero crossing, 5 ms fades) + d s of silence (44.1 kHz)
  narrator_48k.wav    the same at 48 kHz (Kaiser polyphase), with the word "וצ'רלטון" (T 11.11-11.78) replaced by the
                      CINEMA voice (WORLD vocoder: F0 -5.5 st, spectral envelope kept and warped only 6 % down,
                      chest boost, soft saturation) -- mono, dry
  cinema_fx.wav       stereo: cinema-hall convolution reverb of that word (+ a small reverb ramp on the words before
                      it from T 10.90) and the 'צ'רלטון... צ'רלטון...' echoes fading into the dark hall (to T 13.19)
  genre_voices.wav    stereo: Turkish sob + "Neden?!" (tur), Korean "사랑해요!" (kor), anime "すごい…！" (ani)
  voices.json         placement report
TTS: Kokoro-82M (onnx, /opt/kokoro) driven with IPA phonemes -- tur: voice if_sara, kor: voice jf_alpha;
checked by Whisper-small ASR (sherpa-onnx) in tr / ko.  Anime line: gotv4/audio/anime_voice.wav 0.593-1.34 s.
The sob: Kokoro if_sara breath syllables re-performed with WORLD (sob pitch catches, tremble, breathiness).
"""
import os
import sys
import json
import numpy as np
import soundfile as sf
import pyworld as pw
from scipy.signal import resample_poly, butter, sosfilt, fftconvolve

sys.path.insert(0, '/home/user/I/anim/audio/tools')
from sfx import make_ir, peq, lp, hp, bp, white, sat, expdec, N  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'voices')
SR = 48000
TL = json.load(open('/home/user/I/gotv5/audio/v6/timeline_v7.json'))
HOLDS = TL['holds']
TOTAL = TL['total']
NS = int(round(TOTAL * SR))


def T(v):
    return v + sum(h['d'] for h in HOLDS if h['v'] < v)


def fade_io(x, n):
    x = x.copy()
    if len(x) >= 2 * n:
        x[:n] *= np.linspace(0, 1, n)
        x[-n:] *= np.linspace(1, 0, n)
    return x


# ------------------------------------------------------------------ 1. VO held
def vo_held():
    x, sr = sf.read('/home/user/I/gotv5/audio/v6/vo_original_tts.wav')
    cuts = []
    for h in HOLDS:
        c = int(round(h['v'] * sr))
        w = int(0.004 * sr)
        seg = x[c - w:c + w]
        zc = np.nonzero(np.signbit(seg[:-1]) != np.signbit(seg[1:]))[0]
        c = c - w + (zc[np.argmin(np.abs(zc - w))] + 1 if len(zc) else w)
        cuts.append((c, h['d']))
    pieces, prev = [], 0
    f = int(0.005 * sr)
    for c, d in cuts:
        pieces.append(fade_io(x[prev:c], f))
        pieces.append(np.zeros(int(round(d * sr))))
        prev = c
    pieces.append(fade_io(x[prev:], f))
    y = np.concatenate(pieces)
    y = np.concatenate([y, np.zeros(max(0, int(TOTAL * sr) - len(y)))])[:int(round(TOTAL * sr))]
    return y, sr, [c / sr for c, _ in cuts]


# ------------------------------------------------------------------ WORLD helpers
def world(x, sr, f0_fn=None, warp=1.0, ap_fn=None, frame=5.0):
    x = np.ascontiguousarray(x, dtype=np.float64)
    f0, t = pw.harvest(x, sr, f0_floor=60, f0_ceil=600, frame_period=frame)
    sp = pw.cheaptrick(x, f0, t, sr)
    ap = pw.d4c(x, f0, t, sr)
    if f0_fn is not None:
        f0 = f0_fn(f0, t)
    if warp != 1.0:          # formant warp: new_env(f) = env(f / warp)
        nb = sp.shape[1]
        src = np.clip(np.arange(nb) / warp, 0, nb - 1)
        sp = np.vstack([np.interp(src, np.arange(nb), r) for r in sp])
        ap = np.vstack([np.interp(src, np.arange(nb), r) for r in ap])
    if ap_fn is not None:
        ap = ap_fn(ap, t)
    return pw.synthesize(f0, np.ascontiguousarray(sp), np.ascontiguousarray(ap), sr, frame)


def hall_ir(rt=3.4, dark=5500, seed=71):
    return make_ir(rt60=rt, predelay=0.035, hf=0.4, lf=1.3, er=16, er_span=0.12, bright=dark, seed=seed)


def conv(x, ir):
    return np.vstack([fftconvolve(x, ir[0]), fftconvolve(x, ir[1])])


# ------------------------------------------------------------------ Kokoro TTS
_K = None


def kokoro(ph, voice, speed=0.95):
    global _K
    if _K is None:
        from kokoro_onnx import Kokoro
        _K = Kokoro('/opt/kokoro/kokoro-v1.0.onnx', '/opt/kokoro/voices-v1.0.bin')
    y, sr = _K.create(ph, voice=voice, speed=speed, is_phonemes=True)
    y = resample_poly(y.astype(np.float64), 2, 1)      # 24k -> 48k
    return y


def trim(y, thr_db=-45):
    e = np.sqrt(np.convolve(y ** 2, np.ones(240) / 240, 'same'))
    idx = np.nonzero(e > np.max(e) * 10 ** (thr_db / 20))[0]
    return y[max(0, idx[0] - 240):idx[-1] + 480]


def asr_check(y, lang):
    try:
        import sherpa_onnx
        d = '/tmp/asr/sherpa-onnx-whisper-small/'
        r = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=d + 'small-encoder.int8.onnx', decoder=d + 'small-decoder.int8.onnx',
                                                        tokens=d + 'small-tokens.txt', language=lang, task='transcribe', num_threads=4)
        s = r.create_stream()
        s.accept_waveform(SR, np.concatenate([np.zeros(SR // 4), y, np.zeros(SR // 2)]).astype(np.float32))
        r.decode_stream(s)
        return s.result.text
    except Exception as e:  # ASR is only a check
        return 'n/a (%s)' % e


def sob(rng):
    """three sob syllables + a catching in-breath, performed with WORLD on a Kokoro breath voice"""
    base = trim(kokoro('hˈʌ hˈʌ hˈʌːː', 'if_sara', speed=0.8))

    def f0f(f0, t):
        out = f0.copy()
        v = f0 > 0
        tt = t / t[-1]
        catch = 1 + 0.18 * np.abs(np.sin(np.pi * 3 * tt)) ** 6          # pitch catches at the syllable onsets
        trem = 2 ** (1.3 * np.sin(2 * np.pi * 7.5 * t) * np.clip(tt * 1.5, 0, 1) / 12)
        out[v] = 330 * catch[v] * trem[v] * (1 - 0.18 * tt[v])           # high, strained, falling
        return out
    y = world(base, SR, f0f, 1.0, lambda ap, t: np.clip(ap + 0.25, 0, 1))
    # catching in-breath "hhih" (sob inhale) after the syllables
    n = N(0.28)
    inh = bp(white(n, rng), 1800, 5200) * np.hanning(n) ** 0.7
    inh = peq(inh, 2600, 4, 6)
    return y, inh * 0.3 * np.max(np.abs(y)) / (np.max(np.abs(inh)) + 1e-9)


def neden():
    y = trim(kokoro('nɛdˈɛn?!', 'if_sara', speed=0.95))
    # a touch higher and trembling (dramatic), contour otherwise as spoken
    return world(y, SR, lambda f0, t: f0 * 1.08 * 2 ** (0.35 * np.sin(2 * np.pi * 6.5 * t) / 12), 1.0)


def saranghae():
    y = trim(kokoro('sˌaɾˈaŋhɛjo!', 'jf_alpha', speed=0.92))

    def f0f(f0, t):
        out = f0.copy()
        v = f0 > 0
        tt = t / t[-1]
        out[v] = f0[v] * (1.0 + 0.12 * np.clip((tt[v] - 0.6) / 0.4, 0, 1))  # sweet lift on "-요"
        return out
    return world(y, SR, f0f, 1.0)


def sugoi():
    x, sr = sf.read('/home/user/I/gotv4/audio/anime_voice.wav', always_2d=True)
    y = x.mean(1)[int(0.593 * sr):int(1.34 * sr)]
    return fade_io(y, int(0.004 * sr))


# ------------------------------------------------------------------ main
def main():
    os.makedirs(OUT, exist_ok=True)
    rng = np.random.default_rng(777)
    vo44, sr44, cuts = vo_held()
    sf.write(os.path.join(OUT, 'vo_held_44k.wav'), vo44, sr44, subtype='PCM_24')
    nar = resample_poly(vo44, 160, 147, window=('kaiser', 14.0))[:NS]
    nar = np.concatenate([nar, np.zeros(NS - len(nar))])
    FX = np.zeros((2, NS + SR * 6))

    # ---- 2. cinema voice on "וצ'רלטון" (v 11.11-11.78 = T 11.11-11.78)
    a, b = int(11.095 * SR), int(11.80 * SR)
    word = nar[a:b].copy()
    deep = world(word, SR, lambda f0, t: f0 * 2 ** (-5.5 / 12), warp=0.94)[:len(word)]
    deep = np.concatenate([deep, np.zeros(len(word) - len(deep))])
    deep = peq(deep, 110, 0.8, 6.0)          # chest
    deep = peq(deep, 250, 1.0, 2.5)
    deep = peq(deep, 3200, 1.2, 2.0)         # keep it intelligible
    deep = sat(deep / (np.max(np.abs(deep)) + 1e-9) * 1.4, 1.5) * np.max(np.abs(word)) * 0.85
    xf = int(0.012 * SR)
    ramp = np.ones(len(word))
    ramp[:xf] = np.linspace(0, 1, xf)
    ramp[-xf:] = np.linspace(1, 0, xf)
    nar[a:b] = nar[a:b] * (1 - ramp) + deep * ramp
    # hall: the word goes big; the words just before get a small reverb send ramp from T 10.90
    hall = hall_ir(3.6, 5200, 71)
    send = np.zeros(NS)
    r0, r1 = int(10.90 * SR), int(11.11 * SR)
    send[r0:r1] = np.linspace(0, 0.18, r1 - r0)
    send[r1:b] = 0.4
    wet = conv(nar[:b + SR] * send[:b + SR], hall)
    FX[:, :wet.shape[1]] += wet
    # echoes 'צ'רלטון... צ'רלטון...' (skip the "ו" prefix), darker and further each time
    core = deep[int(0.07 * SR):]
    for k, (t_e, g) in enumerate(((11.93, 0.42), (12.52, 0.22))):
        e = lp(core, 2400 - 900 * k, 2) * g
        ew = conv(e, hall_ir(4.2, 3200 - 800 * k, 72 + k))
        ew = ew[:, :int((13.19 - t_e) * SR)]
        ew[:, -int(0.35 * SR):] *= np.linspace(1, 0, int(0.35 * SR))
        i = int(t_e * SR)
        FX[:, i:i + ew.shape[1]] += ew * (1.0 + 0.3 * k)
        dry = np.concatenate([e, np.zeros(max(0, ew.shape[1] - len(e)))])[:ew.shape[1]]
        FX[0, i:i + ew.shape[1]] += dry * (0.6 if k == 0 else 0.25)
        FX[1, i + int(0.011 * SR):i + ew.shape[1]] += dry[:ew.shape[1] - int(0.011 * SR)] * (0.25 if k == 0 else 0.6)
    # the hall tail may not run past the end of the hold (voice returns to normal at 13.19)
    e0 = int(13.19 * SR)
    FX[:, e0 - int(0.3 * SR):e0] *= np.linspace(1, 0, int(0.3 * SR))
    FX[:, e0:] = 0
    FX = FX[:, :NS]

    # ---- 3. genre voices
    GV = np.zeros((2, NS))
    place = []

    def put(y, t, g_db, pan=0.0, room=None, name=''):
        y = y / (np.max(np.abs(y)) + 1e-9) * 10 ** (g_db / 20)
        st_ = np.vstack([y * np.cos((pan + 1) * np.pi / 4), y * np.sin((pan + 1) * np.pi / 4)]) * np.sqrt(2)
        if room is not None:
            w = conv(y, room) * 0.18
            st_ = np.hstack([st_, np.zeros((2, w.shape[1] - st_.shape[1]))]) + w
        i = int(t * SR)
        L = min(st_.shape[1], NS - i)
        GV[:, i:i + L] += st_[:, :L]
        place.append(dict(name=name, t=t, dur=round(st_.shape[1] / SR, 3)))
    room = make_ir(rt60=0.9, predelay=0.01, hf=0.5, er=10, er_span=0.04, bright=9000, seed=81)
    ne = neden()
    sb, inh = sob(rng)
    sb = sb[:int(0.46 * SR)] * np.r_[np.ones(int(0.46 * SR) - 2400), np.linspace(1, 0, 2400)][:len(sb[:int(0.46 * SR)])]
    put(sb, 15.05, -8, -0.1, room, 'sob syllables (tur, Kokoro if_sara re-performed with WORLD)')
    put(ne, 14.52, -3.5, 0.0, room, 'Neden?! (tur, Kokoro if_sara IPA)')
    put(inh, 15.9, -14, 0.1, None, 'sob in-breath (designed)')
    ko = saranghae()
    put(ko, 16.99, -3.5, 0.0, room, '사랑해요! (kor, Kokoro jf_alpha)')
    put(sugoi(), 19.18, -1.5, 0.0, None, 'すごい…！ (ani, gotv4 anime_voice.wav)')
    # the tur sob pieces must end inside the hold
    tend = int(16.065 * SR)
    GV[:, tend - int(0.15 * SR):tend] *= np.linspace(1, 0, int(0.15 * SR))
    GV[:, tend:int(16.9 * SR)] = 0

    sf.write(os.path.join(OUT, 'narrator_48k.wav'), nar.astype(np.float32), SR, subtype='FLOAT')
    sf.write(os.path.join(OUT, 'cinema_fx.wav'), FX.T.astype(np.float32), SR, subtype='FLOAT')
    sf.write(os.path.join(OUT, 'genre_voices.wav'), GV.T.astype(np.float32), SR, subtype='FLOAT')
    rep = dict(cuts_v=cuts, placements=place,
               asr=dict(neden=asr_check(ne, 'tr'), saranghae=asr_check(ko, 'ko'), sugoi=asr_check(sugoi(), 'ja'),
                        cinema_word=asr_check(nar[a - SR // 2:b].astype(np.float64), 'he')))
    json.dump(rep, open(os.path.join(OUT, 'voices.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(rep, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
