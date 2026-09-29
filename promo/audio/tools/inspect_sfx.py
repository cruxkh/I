#!/usr/bin/env python3
"""Render waveform + spectrogram sheets of SFX files for visual QA.
usage: python3 audio/tools/inspect_sfx.py OUT.png name1 name2 ...   (names = stems in audio/sfx)"""
import os
import sys
import numpy as np
import soundfile as sf
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
SFX = os.path.normpath(os.path.join(HERE, '..', 'sfx'))


def main(out, names):
    k = len(names)
    fig, axes = plt.subplots(k, 2, figsize=(16, 2.1 * k), squeeze=False,
                             gridspec_kw=dict(width_ratios=[1, 2]))
    for i, nm in enumerate(names):
        x, sr = sf.read(os.path.join(SFX, nm + '.wav'))
        m = x.mean(axis=1) if x.ndim == 2 else x
        t = np.arange(len(m)) / sr
        ax = axes[i][0]
        if x.ndim == 2:
            ax.plot(t, x[:, 0], lw=0.3, color='#2b6cb0')
            ax.plot(t, -np.abs(x[:, 1]), lw=0.3, color='#c05621')
        else:
            ax.plot(t, m, lw=0.3, color='#2b6cb0')
        ax.set_ylim(-1, 1)
        ax.set_title(nm, fontsize=8, loc='left')
        ax.tick_params(labelsize=6)
        ax = axes[i][1]
        ax.specgram(m + 1e-9, NFFT=2048, Fs=sr, noverlap=1536, cmap='magma', vmin=-130, vmax=-20)
        ax.set_yscale('symlog', linthresh=200)
        ax.set_ylim(20, 20000)
        ax.tick_params(labelsize=6)
    plt.tight_layout()
    plt.savefig(out, dpi=70)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
