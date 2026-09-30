# ----------------------------------------------------------------------------------------------
# Instruments
# ----------------------------------------------------------------------------------------------
E = SmpEngine
vln_sp = part('vln_sp', 'strings', E(lambda: vs('Strings/Violin Section/Spic', release=0.12)), pan=-0.35, width=1.2, hall=0.3)
vla_sp = part('vla_sp', 'strings', E(lambda: vs('Strings/Viola Section/spic', release=0.12)), pan=0.1, hall=0.28)
vc_sp = part('vc_sp', 'strings', E(lambda: vs('Strings/Cello Section/spic', release=0.12)), pan=0.3, hall=0.25)
cb_sp = part('cb_sp', 'strings', E(lambda: vs('Strings/Solo Contrabass/Spic', release=0.15)), pan=0.35, hall=0.22)
vln_su = part('vln_su', 'strings', E(lambda: vs('Strings/Violin Section/susVib', release=0.45)), pan=-0.3, width=1.3, hall=0.4)
vla_su = part('vla_su', 'strings', E(lambda: vs('Strings/Viola Section/susvib', release=0.45)), pan=0.1, hall=0.38)
vc_su = part('vc_su', 'strings', E(lambda: vs('Strings/Cello Section/susvib', release=0.45)), pan=0.28, hall=0.35)
cb_su = part('cb_su', 'strings', E(lambda: vs('Strings/Solo Contrabass/SusVib', release=0.4)), pan=0.35, hall=0.3)
vln_tr = part('vln_tr', 'strings', E(lambda: vs('Strings/Violin Section/Trem', release=0.35)), pan=-0.25, width=1.3, hall=0.4)
vc_tr = part('vc_tr', 'strings', E(lambda: vs('Strings/Cello Section/trem', release=0.35)), pan=0.28, hall=0.35)
harp = part('harp', 'choir', E(lambda: vs('Strings/Harp', offset=0, release=0.8, parse=lambda nm: (
    re.search(r'_([A-G]#?\d)_', nm).group(1), 1, 1))), pan=-0.3, width=1.2, hall=0.45)
hn_su = part('hn_su', 'brass', E(lambda: vs('Brass/F Horn/sus', release=0.3)), pan=-0.28, width=1.2, hall=0.42)
hn_st = part('hn_st', 'brass', E(lambda: vs('Brass/F Horn/stac', release=0.15)), pan=-0.28, width=1.2, hall=0.42)
tp_su = part('tp_su', 'brass', E(lambda: vs('Brass/Trumpet/sus', release=0.25)), pan=0.25, hall=0.35)
tp_st = part('tp_st', 'brass', E(lambda: vs('Brass/Trumpet/stac', release=0.12)), pan=0.25, hall=0.35)
tb_su = part('tb_su', 'brass', E(lambda: vs('Brass/Tenor Trombone/sus', release=0.3)), pan=0.12, hall=0.33)
tb_st = part('tb_st', 'brass', E(lambda: vs('Brass/Tenor Trombone/stac', release=0.15)), pan=0.12, hall=0.33)
tu_su = part('tu_su', 'brass', E(lambda: vs('Brass/Tuba/sus', release=0.3, filt='_rr1_')), pan=0.05, hall=0.28)
tu_st = part('tu_st', 'brass', E(lambda: vs('Brass/Tuba/stac', release=0.15)), pan=0.05, hall=0.28)
timp = part('timp', 'perc', E(tim), hall=0.33, room=0.1)
bd = part('bd', 'perc', E(lambda: perc1('BDrumNewhit_*', release=0.5, maxlen=4.0)), hall=0.35)
osn = part('osn', 'perc', E(lambda: perc1('Snare2-HitSN_*', release=0.2, maxlen=1.5)), pan=-0.1, hall=0.3, room=0.15)
oroll = part('oroll', 'perc', E(lambda: perc1('Snare2-rollSN_v5*', release=0.08, maxlen=9.0)), pan=-0.1, hall=0.3)
ocym = part('ocym', 'perc', E(lambda: perc1('cymbal-crash1_*', release=1.5, maxlen=6.0)), width=1.4, hall=0.35)
gong = part('gong', 'perc', E(lambda: perc1('gongHit_*', release=2.0, maxlen=8.0)), width=1.3, hall=0.3)
tamb = part('tamb', 'perc', E(lambda: perc1('Tamb1-Hit_*', release=0.1, maxlen=1.0)), pan=0.35, hall=0.2)
piano = part('piano', 'choir', E(lambda: Sampler(sorted(glob.glob(os.path.join(VS, 'Keys/Upright Nr1/UR1_*.wav'))), dyn_parse,
                                                   offset=0, release=0.6, maxlen=6.0, velcurve=1.4)), width=0.9, hall=0.45)
kick = part('kick', 'drums', E(lambda: vd_piece('kick', 'kick_snoff', {'kickmic': 1.0, 'mid': 0.45, 'room': 0.3}), oneshot=1.2), room=0.08)
snare = part('snare', 'drums', E(lambda: vd_piece('snare', 'snare_rimshot', {'mid': 1.0, 'room': 0.5, 'kickmic': 0.15}), oneshot=1.2), room=0.2, hall=0.12)
snc = part('snc', 'drums', E(lambda: vd_piece('snare', 'snare_center', {'mid': 1.0, 'room': 0.45}), oneshot=1.2), room=0.2, hall=0.1)
hh = part('hh', 'drums', E(lambda: vd_piece('hh', 'hh_closed', {'mid': 1.0, 'room': 0.25}), oneshot=0.3), pan=0.25, room=0.1)
hho = part('hho', 'drums', E(lambda: vd_piece('hh', 'hh_open', {'mid': 1.0, 'room': 0.25}), oneshot=0.5), pan=0.25, room=0.1)
crash = part('crash', 'drums', E(lambda: vd_piece('crash', 'crash_crash', {'mid': 1.0, 'room': 0.4})), pan=-0.2, width=1.3, hall=0.15)
tomh = part('tomh', 'drums', E(lambda: vd_piece('htom', 'htom_center', {'mid': 1.0, 'room': 0.4, 'kickmic': 0.2}), oneshot=1.2), pan=0.15, room=0.2, hall=0.1)
toml = part('toml', 'drums', E(lambda: vd_piece('ltom', 'ltom_center', {'mid': 1.0, 'room': 0.4, 'kickmic': 0.3}), oneshot=1.2), pan=-0.15, room=0.2, hall=0.1)
taiko = part('taiko', 'perc', TaikoEngine(62, 0.45, 0.6), width=1.3, room=0.15, hall=0.3)
trailer = part('trailer', 'perc', TaikoEngine(48, 0.9, 1.0, sub=0.6), width=1.2, hall=0.45)
boom = part('boom', 'fx', BoomEngine(), hall=0.2)
braaam = part('braaam', 'fx', BraaamEngine(), width=1.2, hall=0.35)
riser = part('riser', 'fx', RiserEngine(), width=1.4, hall=0.3)
gtr = part('gtr', 'synth', GuitarEngine(), room=0.1, hall=0.08)
lead = part('lead', 'synth', LeadEngine(), hall=0.3)
sub = part('sub', 'synth', SubEngine(), hall=0.0)
darb = part('darb', 'perc', DarbEngine(), room=0.2, hall=0.2)
kanun = part('kanun', 'choir', KanunEngine(), pan=0.3, hall=0.35)

choir = part('choir', 'choir', GMEngine(52), width=1.4, hall=0.5)
oohs = part('oohs', 'choir', GMEngine(53), width=1.4, hall=0.5)
celesta = part('celesta', 'choir', GMEngine(8), pan=0.3, width=1.2, hall=0.45)


def xs(sub, offset=12, release=0.25, maxlen=None, gain=1.0, velcurve=1.6, filt=None, parse=std_parse):
    key = ('xs', sub, offset, release, maxlen, filt)
    if key not in _CACHE:
        files = sorted(glob.glob(os.path.join(XS, sub, '*.wav')))
        if filt:
            files = [f for f in files if re.search(filt, os.path.basename(f))]
        _CACHE[key] = Sampler(files, parse, offset=offset, release=release, maxlen=maxlen, gain=gain, velcurve=velcurve)
    return _CACHE[key]


def pf_parse(name):
    """LLVln_Pizz_A4_f_RR1 / LLVln_ArcoVib_A4_p : p -> layer 1, f -> layer 2"""
    toks = name.rsplit('.', 1)[0].split('_')
    note = next((t for t in toks if re.match(r'^[A-G]#?-?\d$', t)), None)
    if note is None:
        return None
    lay = 2 if 'f' in toks else 1
    return note, lay, 1


def glk_parse(name):
    mm = re.search(r'_([A-G]#?\d)\.wav', name)
    return (mm.group(1), 1, 1) if mm else None


def dyn_any(name):
    """ethnic drum names ..._hit_f_2.wav / _pp_ / _ff_ ; key fixed (60)"""
    mm = re.search(r'_(ppp|pp|p|mp|mf|f|ff|fff)_(\d)', name)
    if not mm:
        return None
    return 60, {'ppp': 1, 'pp': 2, 'p': 3, 'mp': 4, 'mf': 5, 'f': 6, 'ff': 7, 'fff': 8}[mm.group(1)], int(mm.group(2))


ETH = 'VSCO 1 Percussion/drums/other/ethnic'
# winds (bansuri / ney / duduk colours), solo violin, pizzicati, glockenspiel
flute_sv = part('flute_sv', 'choir', WindEngine(lambda: xs('Woodwinds/Flute/susvib', 12, release=0.2)), pan=-0.2, width=1.1, hall=0.45)
flute_ex = part('flute_ex', 'choir', WindEngine(lambda: xs('Woodwinds/Flute/expvib', 12, release=0.2)), pan=-0.2, width=1.1, hall=0.45)
flute_nv = part('flute_nv', 'choir', WindEngine(lambda: xs('Woodwinds/Flute/susNV', 12, release=0.2)), pan=-0.15, width=1.1, hall=0.45)
oboe = part('oboe', 'choir', WindEngine(lambda: xs('Woodwinds/Oboe/Vib', 12, release=0.2)), pan=0.15, width=1.0, hall=0.45)
vln_solo = part('vln_solo', 'strings', WindEngine(lambda: xs('Strings/Solo Violin/Arco Vib', 0, release=0.3, parse=pf_parse)), pan=-0.1, hall=0.45)
vlnpz = part('vlnpz', 'strings', E(lambda: xs('Strings/Violin Section/Pizz', 12, release=0.25)), pan=-0.3, width=1.2, hall=0.3)
vlapz = part('vlapz', 'strings', E(lambda: xs('Strings/Viola Section/pizz', 12, release=0.25)), pan=0.1, hall=0.28)
vcpz = part('vcpz', 'strings', E(lambda: xs('Strings/Cello Section/pizzT', 12, release=0.25)), pan=0.3, hall=0.25)
cbpz = part('cbpz', 'strings', E(lambda: xs('Strings/Solo Contrabass/Pizz', 12, release=0.25)), pan=0.35, hall=0.22)
vsol_sp = part('vsol_sp', 'strings', E(lambda: xs('Strings/Solo Violin/spic', 12, release=0.1)), pan=-0.15, hall=0.3)
vsol_tr = part('vsol_tr', 'strings', E(lambda: xs('Strings/Solo Violin/Trem', 12, release=0.3)), pan=-0.15, hall=0.4)
glock = part('glock', 'choir', E(lambda: xs('Percussion/Glock', 12, release=0.6, parse=glk_parse)), pan=0.3, hall=0.4)
dhol_h = part('dhol_h', 'perc', E(lambda: xs(ETH + '/giant/hand', 0, release=0.3, parse=dyn_any, maxlen=2.0)), pan=-0.1, hall=0.2, room=0.2)
dhol_s = part('dhol_s', 'perc', E(lambda: xs(ETH + '/giant/sticks', 0, release=0.2, parse=dyn_any, maxlen=1.5)), pan=0.1, hall=0.2, room=0.2)
conga_o = part('conga_o', 'perc', E(lambda: xs(ETH + '/congo/open', 0, release=0.2, parse=dyn_any, maxlen=1.2, filt='ethnicHighOpen|ethnicLowOpen')), pan=0.2, hall=0.2, room=0.2)
# 'days' stem: the 7 day-pop notes (harp + violin pizzicato) - separate so the mixer can keep or drop them
harp_d = part('harp_d', 'days', E(lambda: vs('Strings/Harp', offset=0, release=0.9, parse=lambda nm: (
    re.search(r'_([A-G]#?\d)_', nm).group(1), 1, 1))), pan=-0.2, width=1.2, hall=0.45)
pz_d = part('pz_d', 'days', E(lambda: xs('Strings/Violin Section/Pizz', 12, release=0.25)), pan=-0.1, hall=0.3)
pno_d = part('pno_d', 'days', E(lambda: Sampler(sorted(glob.glob(os.path.join(VS, 'Keys/Upright Nr1/UR1_*.wav'))), dyn_parse,
                                                offset=0, release=0.8, maxlen=6.0, velcurve=1.4)), width=0.9, hall=0.45)
sitar = part('sitar', 'choir', SitarEngine(), pan=0.2, hall=0.28)
vln_si = part('vln_si', 'strings', E(lambda: vs('Strings/Violin Section/Spic', release=0.12)), pan=-0.3, width=1.2, hall=0.3)
vla_si = part('vla_si', 'strings', E(lambda: vs('Strings/Viola Section/spic', release=0.12)), pan=0.1, hall=0.28)
harmon = part('harmon', 'choir', HarmoniumEngine(), pan=-0.1, hall=0.3)
vox = part('vox', 'choir', VoxEngine(), pan=0.0, width=1.1, hall=0.42)
shehnai = part('shehnai', 'choir', WindEngine(lambda: xs('Woodwinds/Oboe/Vib', 12, release=0.2)), pan=0.12, width=1.0, hall=0.35,
               eq=[peq_sos(1300, 5, 1.1), peq_sos(2600, 4, 1.4), shelf_sos(5000, 2.0)])
tabla = part('tabla', 'perc', TablaEngine(), room=0.2, hall=0.15)
zap = part('zap', 'fx', ZapEngine(), hall=0.25)
shim = part('shim', 'fx', ShimmerEngine(), width=1.4, hall=0.4)

cb_dr = part('cb_dr', 'strings', E(lambda: vs('Strings/Solo Contrabass/SusVib', release=0.4)), pan=0.35, hall=0.3)
vc_dr = part('vc_dr', 'strings', E(lambda: vs('Strings/Cello Section/susvib', release=0.45)), pan=0.28, hall=0.35)

# balance trims (dB); calibrated by the per-part level report (see report())
TRIM = dict(taiko=-14, trailer=-16, sub=-21, kick=-4, snare=4, hh=9, hho=6, crash=2, tomh=4, toml=4, snc=2,
            vc_sp=7, vla_sp=7, vln_sp=9, cb_sp=12, vln_su=15, vla_su=3, vc_su=6, cb_su=7, vln_tr=3, vc_tr=3,
            hn_su=15, hn_st=12, tp_su=4, tp_st=10, tb_su=9, tb_st=9, tu_su=10, tu_st=13, choir=1, oohs=1,
            timp=10, ocym=5, gong=3, riser=-3, boom=-17, braaam=-4, harp=14, celesta=10, glock=14, piano=2,
            kanun=2, darb=-4, tamb=10, oroll=3, bd=2,
            flute_sv=8, flute_ex=12, flute_nv=8, oboe=8, vln_solo=8, cb_dr=7, vc_dr=6, vlnpz=8, vlapz=8, vcpz=8, cbpz=8, vsol_sp=8, vsol_tr=8,
            dhol_h=3.4, dhol_s=2, conga_o=4, harp_d=19, pz_d=11, pno_d=2, vln_si=2, vla_si=4, sitar=-10, harmon=-9, vox=-5, shehnai=7, tabla=-12, zap=0, shim=0)
for _k, _db in TRIM.items():
    PARTS[_k].gain *= 10 ** (_db / 20)
