#!/usr/bin/env python3
"""SFX preview mixer: places audio/cues/*.json (base.json by default) + dialogue (audio/timeline.json)
into a timeline-length (81 s in v2) stereo 48 kHz wav at audio/sfx_preview.wav, prints peak/RMS per second and saves QA plots.

usage: python3 audio/tools/preview_mix.py [--cues a.json,b.json] [--dlg-gain -4] [--png DIR] [--no-dlg]

Mixing notes (for the director's final mix):
 * dialogue files are peak -1 dBFS; here they go in at --dlg-gain (default -4 dB), centre, dry.
 * mono SFX get equal-power pan; stereo SFX get a balance pan (the louder side stays at unity).
 * cues are one-shots at full length: every bed has its fades baked in and is cut to fit its scene.
 * no limiter here on purpose -- peaks are reported so levels can be judged honestly.
"""
import os, sys, json, argparse
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
SR, DUR = 48000, None


def place(mix, x, t, gain_db, p):
    g = 10 ** (gain_db / 20)
    if x.ndim == 1:
        a = (np.clip(p, -1, 1) + 1) * np.pi / 4
        x = np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)  # 0 dB per side at centre
    else:
        x = x * np.array([min(1, 1 - p), min(1, 1 + p)])
    i = int(round(t * SR))
    L = min(len(x), len(mix) - i)
    if L > 0:
        mix[i:i + L] += g * x[:L]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cues', default=os.path.join(ROOT, 'cues', 'base.json'))
    ap.add_argument('--dlg-gain', type=float, default=-4.0)
    ap.add_argument('--no-dlg', action='store_true')
    ap.add_argument('--png', default=None)
    ap.add_argument('--out', default=os.path.join(ROOT, 'sfx_preview.wav'))
    a = ap.parse_args()
    tl = json.load(open(os.path.join(ROOT, 'timeline.json')))
    DUR = float(tl.get('duration', 60.0))
    n = int(DUR * SR)
    mix = np.zeros((n, 2))
    sfxbus = np.zeros((n, 2))
    cache = {}
    for cf in a.cues.split(','):
        for c in json.load(open(cf)):
            nm = c['sfx']
            if nm not in cache:
                cache[nm], sr = sf.read(os.path.join(ROOT, 'sfx', nm + '.wav'))
                assert sr == SR
            place(sfxbus, cache[nm], c['t'], c.get('gain_db', 0), c.get('pan', 0))
    mix += sfxbus
    dlg = np.zeros((n, 2))
    if not a.no_dlg:
        for l in tl['lines']:
            x, _ = sf.read(os.path.join(ROOT, 'dialogue', l['id'] + '.wav'))
            place(dlg, x, l['t'], a.dlg_gain, 0.0)
    mix += dlg
    # engine fade to black over the last 0.8 s
    k = int(0.8 * SR)
    mix[-k:] *= np.linspace(1, 0, k)[:, None]
    sf.write(a.out, mix.astype(np.float32), SR, subtype='PCM_24')
    f = lambda v: 20 * np.log10(v + 1e-9)
    print(' sec | mix pk  rms | sfx rms | dlg rms')
    for s in range(int(DUR)):
        seg = mix[s * SR:(s + 1) * SR]
        print('%4d | %6.1f %6.1f | %6.1f | %6.1f' % (s, f(np.abs(seg).max()), f(np.sqrt((seg ** 2).mean())),
              f(np.sqrt((sfxbus[s * SR:(s + 1) * SR] ** 2).mean())), f(np.sqrt((dlg[s * SR:(s + 1) * SR] ** 2).mean()))))
    print('overall peak %.2f dBFS, clipped samples: %d' % (f(np.abs(mix).max()), int((np.abs(mix) > 1).sum())))
    if a.png:
        import matplotlib; matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        os.makedirs(a.png, exist_ok=True)
        t = np.arange(n) / SR
        fig, ax = plt.subplots(3, 1, figsize=(22, 10), sharex=True)
        ax[0].plot(t[::20], sfxbus[::20, 0], lw=0.3, color='#c05621', label='sfx')
        ax[0].plot(t[::20], dlg[::20, 0], lw=0.3, color='#2b6cb0', alpha=0.7, label='dialogue')
        ax[0].legend(loc='upper right'); ax[0].set_ylim(-1, 1)
        w = int(0.05 * SR)
        m = mix.mean(1)
        rs = lambda v: np.sqrt(np.convolve(v ** 2, np.ones(w) / w, 'same'))[::w]
        ax[1].plot(t[::w], f(rs(sfxbus.mean(1))), color='#c05621', label='sfx rms')
        ax[1].plot(t[::w], f(rs(dlg.mean(1))), color='#2b6cb0', label='dlg rms')
        ax[1].set_ylim(-60, 0); ax[1].legend(loc='upper right'); ax[1].grid(alpha=0.3)
        ax[2].specgram(m + 1e-9, NFFT=2048, Fs=SR, noverlap=1024, cmap='magma', vmin=-130, vmax=-20)
        ax[2].set_ylim(20, 16000)
        for s in [0.5, 4.6, 5.0, 6.2, 15.3, 18.0, 27.7, 29.2, 41.5, 42.7, 43.4, 48.9, 53.4, 54.4, 57.8, 58.9, 59.3,
                  60.5, 69.0, 70.0, 70.8, 71.4, 72.8, 77.4, 77.8]:
            for x in ax:
                x.axvline(s, color='g', lw=0.6, alpha=0.6)
        ax[2].set_xticks(range(0, int(DUR) + 1, 2))
        plt.tight_layout(); plt.savefig(os.path.join(a.png, 'mix_overview.png'), dpi=60)


if __name__ == '__main__':
    main()
