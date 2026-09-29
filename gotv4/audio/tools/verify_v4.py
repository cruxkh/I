#!/usr/bin/env python3
import sys, os, json, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mix_v4 as M
from mix_v2 import true_peak_db, lufs
p = sys.argv[1] if len(sys.argv) > 1 else os.path.join(M.ROOT, 'master.wav')
x, sr = sf.read(p, always_2d=True); info = sf.info(p)
print(f'{p}: {info.subtype} {sr} Hz {x.shape[1]} ch  len {len(x)/sr:.4f}s  expected {M.TOTAL}s ({M.NS} smp, got {len(x)})')
y = x.T; print(f'LUFS {lufs(y):.2f}  TP {true_peak_db(y):.2f} dBTP  sample peak {20*np.log10(np.abs(y).max()):.2f} dBFS  clipped samples {(np.abs(y)>=0.99999).sum()}')
i0, i1 = int(M.SIL0 * sr), int(M.SIL1 * sr); print(f'silence window T {M.SIL0:.3f}-{M.SIL1:.3f}: max abs {np.abs(x[i0+2:i1-2]).max():.2e}  exact zeros {(x[i0+2:i1-2]==0).all()}')
print('impact peak 50.51-51.0:', round(20*np.log10(np.abs(x[i1:int(51.0*sr)]).max()), 2), 'dBFS; ST-loudness of 50.51-52.0:', round(lufs(y[:, i1:int(52*sr)]), 1), 'LUFS')
print('\nper-second: t  RMS_dBFS  peak_dBFS   (marks: H=hold I=interlude)')
def mark(t):
    for h in M.HOLDS:
        if h['_T0'] <= t < h['_T1']: return 'I' if h['kind'] == 'interlude' else 'H'
    return ' '
rows = []
for s in range(int(np.ceil(M.TOTAL))):
    a, b = int(s * sr), min(len(x), int((s + 1) * sr)); seg = x[a:b]
    if not len(seg): break
    r = 20*np.log10(np.sqrt((seg**2).mean()) + 1e-9); pk = 20*np.log10(np.abs(seg).max() + 1e-9); rows.append((s, r, pk))
    print(f'{s:3d}{mark(s+.5)} {r:6.1f} {pk:6.1f} ' + '#' * int(max(0, r + 40)))
print('\nhold behaviour (music stems, RMS dB in windows before / during / last 0.3 s / after):')
st = np.load(os.path.join(M.ROOT, '_mix_stems_v4.npz')); mus = st['music']; inter = st['inter']
def rms(a, T0, T1):
    seg = a[:, int(T0*sr):int(T1*sr)]; return 20*np.log10(np.sqrt((seg**2).mean()) + 1e-9)
for h in M.HOLDS:
    if h['v'] <= 0: continue
    T0, T1 = h['_T0'], h['_T1']
    print(f"  {h['kind']:9s} T {T0:6.2f}-{T1:6.2f}  music: before(-.3) {rms(mus,T0-.3,T0):6.1f}  early hold {rms(mus,T0+.05,T0+min(.3,h['dur']/2)):6.1f}  last .3 {rms(mus,T1-.3,T1):6.1f}  after(+.3) {rms(mus,T1,T1+.3):6.1f}   master before/during/after {rms(x.T,T0-.3,T0):5.1f}/{rms(x.T,T0,T1):5.1f}/{rms(x.T,T1,T1+.3):5.1f}")
# god intro, interludes
print(f"\ngod intro 0-7 master RMS {rms(x.T,0,7):.1f}, music stem there {rms(mus,0,7):.1f}; VO first 3 s after intro {rms(x.T,7,10):.1f}")
for a, b in M.INTERLUDES: print(f'interlude T {a:.2f}-{b:.2f}: master {rms(x.T,a,b):.1f} LUFS-ish RMS dB, music stem {rms(mus,a+.15,b):.1f}')
