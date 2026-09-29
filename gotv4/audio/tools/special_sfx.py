"""Hand-made / classified synthesis for cue names that exist in no library. build(name, desc, outdir) -> hit time."""
import os, sys, zlib
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gotv_sfx as G
def build(name, desc, outdir):
    return G.build(name, desc, outdir=outdir)[0]
