#!/usr/bin/env python3
"""Anime hero voice (Japanese, Kokoro jm_kumo) -> audio/anime_voice.wav + anime_voice.json"""
import sys, json, os
import numpy as np, soundfile as sf
from scipy.signal import resample_poly, fftconvolve, butter, sosfilt, lfilter
sys.path.insert(0, '/home/user/I/promo/audio/tools')
from sfx import make_ir
from kokoro_onnx import Kokoro
SR = 48000; DUR = 3.8; N = int(DUR * SR)
ROOT = '/home/user/I/gotv4/audio'
k = Kokoro('/opt/kokoro/kokoro-v1.0.onnx', '/opt/kokoro/voices-v1.0.bin')
db = lambda x: 10 ** (x / 20)
def sos(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def peq(x, f, q, g):
    A = 10 ** (g / 40); w0 = 2 * np.pi * f / SR; al = np.sin(w0) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w0), 1 - al * A]); a = np.array([1 + al / A, -2 * np.cos(w0), 1 - al / A])
    return lfilter(b / a[0], a / a[0], x)
def tts(txt, speed, semis, voice='jm_kumo'):
    s, sr = k.create(txt, voice=voice, speed=speed, lang='ja')
    r = 2 ** (semis / 12)                     # pitch+formant up together (young hero)
    y = resample_poly(s, int(round(2 * 100)), int(round(sr / 240 * 100 * r * 1.0)) if False else int(round(100 * sr * r / 24000)))  # 24k -> 48k / r
    return trim(y)
def trim(y, thr=0.02):
    e = np.abs(y); m = e.max(); idx = np.nonzero(e > m * thr)[0]
    return y[max(idx[0] - 200, 0): idx[-1] + 200]
def fit_line(txt, target, semis, lo=0.7, hi=2.2, voice='jm_kumo'):
    a, b = lo, hi; best = None
    for _ in range(9):
        sp = (a + b) / 2; y = tts(txt, sp, semis, voice); d = len(y) / SR
        best = (sp, y)
        if d > target: a = sp
        else: b = sp
    return best[1]
def comp(x, thr=-22, ratio=3.0):
    env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, 'same')) + 1e-9
    g = np.minimum(1, (db(thr) / env) ** (1 - 1 / ratio)); g = np.convolve(g, np.ones(240) / 240, 'same')
    return x * g
def sat(x, d): return np.tanh(x * d) / np.tanh(d)

SEMI = 3.0
place = {}
def put(buf, y, t, g=1.0):
    i = int(t * SR); e = min(N, i + len(y)); buf[i:e] += y[:e - i] * g
    return t, min(t + len(y) / SR, DUR)

dry = np.zeros(N); lines = []
spec = [("おおっ！", 0.05, 0.47, 'gasp'), ("すごい…！", 0.55, 0.78, 'awe'), ("ぜんぶ、ここにある！", 1.35, 0.95, 'shout'),
        ("うおおおおお！", 2.35, 0.92, 'scream'), ("いくぞーっ！", 3.32, 0.44, 'shout')]
for txt, t0, tg, kind in spec:
    if kind == 'scream':
        y = fit_line(txt, tg, SEMI + 1.0, lo=0.35, hi=1.5)
        y = y / np.abs(y).max()
        # layered shout: main + octave-up formant layer + slightly detuned + grit
        y2 = resample_poly(y, 100, 126)                       # ~ +4 semitones up, shorter
        y3 = resample_poly(y, 100, 79)                        # -4 st thick layer
        L = np.zeros(len(y) + 2000); L[:len(y)] += y * 0.9; L[300:300 + len(y2)] += y2 * 0.45; L[:len(y3)] += y3[:len(L)] * 0.35
        # crescendo + vibrato-ish gain wobble
        t = np.arange(len(L)) / SR
        L *= (0.55 + 0.45 * np.clip(t / 0.35, 0, 1)) * (1 + 0.12 * np.sin(2 * np.pi * 9 * t))
        y = sat(L, 3.0) * 0.8
    elif kind == 'gasp':
        y = fit_line(txt, tg, SEMI + 1.5, 0.8, 2.6); y = y / np.abs(y).max()
    elif kind == 'awe':
        y = fit_line(txt, tg, SEMI + 0.5, 0.6, 2.2); y = y / np.abs(y).max() * 0.8
    else:
        y = fit_line(txt, tg, SEMI + 1.0, 0.8, 2.6); y = y / np.abs(y).max()
        y = sat(y * 1.5, 2.0) * 0.9
    tt, te = put(dry, y, t0)
    lines.append({'text': txt, 'kind': kind, 'start': tt, 'end': te})
# fit-check: no line may run into the next
for a, b in zip(lines, lines[1:]):
    a['end'] = min(a['end'], b['start'] - 0.01)
# anime dub chain
x = sosfilt(sos('highpass', 120, 2), dry)
x = peq(x, 280, 1.0, -2.5); x = peq(x, 3300, 0.9, 4.0); x = peq(x, 6500, 0.8, 3.0)
x = comp(x, -24, 3.5)
x = sosfilt(sos('bandpass', [140, 9500], 2), x)          # slight 'tv' band
ir = make_ir(rt60=0.9, predelay=0.012, hf=0.5, lf=0.6, er=6, er_span=0.025, bright=8000, seed=11)
send = np.zeros(N); send[:] = x
wet = np.stack([fftconvolve(send, ir[0])[:N], fftconvolve(send, ir[1])[:N]])
# scream gets a longer plate tail
ir2 = make_ir(rt60=1.6, predelay=0.02, hf=0.45, lf=0.7, er=8, er_span=0.04, bright=7000, seed=12)
sc = lines[3]; ss = np.zeros(N); a, b = int(sc['start'] * SR), int((sc['end'] + 0.05) * SR); ss[a:b] = x[a:b]
sw = np.stack([fftconvolve(ss, ir2[0])[:N], fftconvolve(ss, ir2[1])[:N]])
out = np.stack([x, x]) + wet * db(-13) + sw * db(-9)
out = out / np.abs(out).max() * db(-3)
sf.write(f'{ROOT}/anime_voice.wav', out.T, SR, subtype='PCM_24')
# real times from the energy of the DRY voice
env = np.sqrt(np.convolve(dry ** 2, np.ones(480) / 480, 'same'))
res = []
for l in lines:
    i0, i1 = int(l['start'] * SR), int(l['end'] * SR)
    seg = env[i0:i1]; th = seg.max() * 0.06; idx = np.nonzero(seg > th)[0]
    res.append({'text': l['text'], 'start': round(l['start'] + idx[0] / SR, 3), 'end': round(l['start'] + idx[-1] / SR, 3), 'kind': l['kind']})
json.dump({'file': 'anime_voice.wav', 'duration': DUR, 'lines': res}, open(f'{ROOT}/anime_voice.json', 'w'), ensure_ascii=False, indent=1)
sf.write(f'{ROOT}/anime/voice_dry.wav', dry, SR)
print(json.dumps(res, ensure_ascii=False))
