#!/usr/bin/env python3
"""Verification of audio/master.wav without listening: per-second table, LUFS, true peak, clipping, silence window,
VO-band vs music-band balance, band spectrum per scene, notes file."""
import os, sys, json
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
import pyloudnorm as pyln
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.normpath(os.path.join(HERE, '..'))
SR = 48000
m, sr = sf.read(os.path.join(ROOT, 'master.wav'), always_2d=True); x = m.T; n = x.shape[1]
S = np.load(os.path.join(ROOT, '_mix_stems.npz')); cues = json.load(open(os.path.join(ROOT, '_mix_cues.json')))
d = lambda v: 20 * np.log10(v + 1e-10)
bp = lambda y, lo, hi: sosfilt(butter(4, [lo, hi], 'bandpass', fs=SR, output='sos'), y, axis=-1)
out = []
def P(s=''): print(s); out.append(s)
P(f'master.wav: {n/SR:.4f} s, {x.shape[0]} ch, {sr} Hz, {sf.info(os.path.join(ROOT,"master.wav")).subtype}')
L = pyln.Meter(SR).integrated_loudness(x.T)
tp = d(np.abs(resample_poly(x, 4, 1, axis=-1)).max())
P(f'integrated LUFS {L:.2f}   true peak {tp:.2f} dBTP   sample peak {d(np.abs(x).max()):.2f} dBFS   samples>=0.999: {(np.abs(x)>=0.999).sum()}')
i0, i1 = int(25.50 * SR), int(25.61 * SR)
P(f'silence window 25.50-25.61 max abs = {np.abs(x[:, i0:i1]).max():.2e}  (10 ms before 25.50: {d(np.abs(x[:, i0-480:i0]).max()):.1f} dB;  first 5 ms after 25.61: {d(np.abs(x[:, i1:i1+240]).max()):.1f} dB)')
P(f'last sample {x[:, -1]}, last 50 ms peak {d(np.abs(x[:, -2400:]).max()):.1f} dB')
mom = pyln.Meter(SR)
P('\n sec |  RMS dB  peak dB | momentary LUFS |  VO dB  music dB  sfx dB | 300-4k: VO  music  sfx  (VO-others)')
for s in range(37):
    a, b = s * SR, (s + 1) * SR
    seg = x[:, a:b]
    rms = d(np.sqrt((seg ** 2).mean())); pk = d(np.abs(seg).max())
    try: ml = mom.integrated_loudness(x[:, max(0, b - int(.4 * SR)):b].T) if b - a >= int(.4 * SR) else float('nan')
    except Exception: ml = float('nan')
    r = lambda k: d(np.sqrt((S[k][:, a:b] ** 2).mean()))
    br = lambda k: d(np.sqrt((bp(S[k][0, a:b], 300, 4000) ** 2).mean()))
    vb, mb, sb = br('vo'), br('music'), br('sfx')
    oth = 10 * np.log10(10 ** (mb / 10) + 10 ** (sb / 10))
    P(f'{s:3d}  | {rms:6.1f} {pk:7.1f} | {ml:7.1f}        | {r("vo"):6.1f} {r("music"):7.1f} {r("sfx"):7.1f} | {vb:6.1f} {mb:6.1f} {sb:6.1f}  {vb-oth:+5.1f}')
act = S['act'] > .5; t = np.arange(len(act)) / 1000
sp = act & (t < 36.9)
vo_b = np.array([np.sqrt((bp(S['vo'][0], 300, 4000)[int(a*SR):int(a*SR)+4800] ** 2).mean()) for a in t[sp][::100]])
P('\nVO intelligibility band (300-4000 Hz), narration active frames: mean VO-to-(music+sfx) ratio')
vb = bp(S['vo'][0], 300, 4000); ob = bp((S['music'] + S['sfx'])[0], 300, 4000)
idx = np.nonzero(S['act'] > .5)[0]
mask = np.zeros(len(vb), bool)
for i in idx: mask[i * 48:(i + 1) * 48] = True
mask = mask[:len(vb)]
P(f'  VO {d(np.sqrt((vb[mask]**2).mean())):.1f} dB vs music+sfx {d(np.sqrt((ob[mask]**2).mean())):.1f} dB  => {d(np.sqrt((vb[mask]**2).mean())) - d(np.sqrt((ob[mask]**2).mean())):.1f} dB')
# worst 1 s windows
worst = []
for s in np.arange(0, 36, 0.5):
    a, b = int(s * SR), int((s + 1) * SR)
    if mask[a:b].mean() < .5: continue
    v = d(np.sqrt((vb[a:b] ** 2).mean())); o = d(np.sqrt((ob[a:b] ** 2).mean())); worst.append((v - o, s))
worst.sort(); P('  least VO-margin windows (dB, start s): ' + ', '.join(f'{w:+.1f}@{s:.1f}' for w, s in worst[:6]))
P('\nband energy per scene (dB rel total, stereo sum): sub<100 | low 100-400 | mid 400-2k | pres 2-6k | air >6k')
sc = [('s1', 0, 5), ('s2a', 5, 9.05), ('s2b', 9.05, 13.1), ('s2c', 13.1, 15.81), ('s3a', 15.81, 20.64), ('s3b', 20.64, 23.9), ('s4', 23.9, 30.12), ('s5', 30.12, 36.9)]
edges = [(20, 100), (100, 400), (400, 2000), (2000, 6000), (6000, 20000)]
for nm, a, b in sc:
    seg = x[0, int(a * SR):int(b * SR)]; tot = np.sqrt((seg ** 2).mean())
    P(f'  {nm:4s} ' + ' '.join(f'{d(np.sqrt((bp(seg, lo, hi)**2).mean())):6.1f}' for lo, hi in edges) + f'   total {d(tot):.1f}')
# cue counts / notes
by = {}
for c in cues: by.setdefault(c['scene'], []).append(c)
P('\ncue counts per scene (placed / listed; limited = attenuated by overlap and/or VO-aware limiter):')
placed_tot = 0
for k in sorted(by):
    cs = by[k]; pl = [c for c in cs if 'skip' not in c]; red = [c for c in pl if c.get('red', 0) < 0 or c.get('vo_red', 0) < 0]
    placed_tot += len(pl)
    P(f'  {k:4s} listed {len(cs):3d} placed {len(pl):3d} limited {len(red):2d}' + ('' if not red else '  -> ' + ', '.join(f"{c['sound']}@{c['t']:.2f}({c['red']+c.get('vo_red',0):+.1f}dB)" for c in red[:8])))
sk = [c for c in cues if 'skip' in c]
P(f'  total placed {placed_tot}; skipped: ' + (', '.join(f"{c['sound']}@{c['t']}({c['skip']})" for c in sk) or 'none'))
P(f"  distinct sounds: {len(set(c['sound'] for c in cues))}")
P(f'\nmusic source: ' + ('music.wav' if os.path.exists(os.path.join(ROOT, 'music', 'music.wav')) else 'MISSING'))
open(os.path.join(ROOT, 'preview_mix_notes.txt'), 'w').write('\n'.join(out) + '\n')
try:
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(2, 1, figsize=(14, 7), sharex=True)
    ax[0].specgram(x[0], NFFT=2048, Fs=SR, noverlap=1536, cmap='magma', vmin=-120); ax[0].set_ylim(0, 12000)
    tt = np.arange(0, n, 480) / SR; ax[1].plot(tt, d(np.abs(x[0, ::480]) + 1e-9)); ax[1].set_ylim(-60, 0)
    plt.savefig(os.path.join(ROOT, 'master_spectrogram.png'), dpi=70); P('spectrogram: audio/master_spectrogram.png')
except Exception as e: P('no matplotlib plot: ' + str(e))
