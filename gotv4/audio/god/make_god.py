import numpy as np, soundfile as sf, subprocess, tempfile
from scipy.signal import fftconvolve, butter, sosfilt, resample_poly
SR=48000; INTRO=7.0
x,sr=sf.read('god_raw2.wav'); x=resample_poly(x,SR,sr); x=x/np.max(np.abs(x)); n=len(x)
def sos(k,f,o=2): return butter(o,f,k,fs=SR,output='sos')
def fit(a,n): a=np.asarray(a); return a[:n] if len(a)>=n else np.pad(a,(0,n-len(a)))
def shift(sig,st):
    r=2**(st/12); return resample_poly(sig,1000,int(round(1000*r)))
def tempo_fix(y,n):
    tmp=tempfile.mkdtemp(); sf.write(tmp+'/a.wav',y,SR); ratio=len(y)/n
    ff='/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
    subprocess.run([ff,'-y','-loglevel','error','-i',tmp+'/a.wav','-filter:a',f'atempo={ratio:.5f}',tmp+'/b.wav'],check=True)
    z,_=sf.read(tmp+'/b.wav'); return fit(z,n)
main=tempo_fix(shift(x,-3.0),n); sub=tempo_fix(shift(x,-12),n); up=tempo_fix(shift(x,+7),n); up2=tempo_fix(shift(x,+12),n)
sub=sosfilt(sos('low',500),sub); up=sosfilt(sos('high',700),up); up2=sosfilt(sos('high',1200),up2)
def mod_delay(sig,base_ms,depth_ms,rate,ph=0):
    t=np.arange(len(sig))/SR; d=(base_ms+depth_ms*np.sin(2*np.pi*rate*t+ph))/1000*SR; return np.interp(np.arange(len(sig))-d,np.arange(len(sig)),sig)
cho=(mod_delay(main,18,6,.27)+mod_delay(main,27,8,.19,1.7)+mod_delay(main,39,9,.13,3.1))/3
voice=main*0.85+cho*0.45+sub*0.55+up*0.17+up2*0.06
voice=sosfilt(sos('high',60),voice); voice=voice+0.35*sosfilt(sos('low',180),voice)
voice=voice+0.45*sosfilt(butter(2,[2200,4200],'band',fs=SR,output='sos'),voice)
env=np.sqrt(np.convolve(voice**2,np.ones(int(.02*SR))/int(.02*SR),'same')+1e-9); voice=voice*np.minimum(1,(0.22/env)**0.55); voice/=np.max(np.abs(voice))
N=int(INTRO*SR); dry=np.zeros(N); s0=int(.75*SR); m=min(len(voice),N-s0); dry[s0:s0+m]=voice[:m]; print('speech ends at',(s0+len(voice))/SR)
rng=np.random.default_rng(3); L=int(5.5*SR); t=np.arange(L)/SR
def ir(seed):
    r=np.random.default_rng(seed); q=r.standard_normal(L)*np.exp(-6.9*t/5.2); q=sosfilt(sos('low',3800),q); q=sosfilt(sos('high',120),q); q[:int(.12*SR)]=0
    q*=np.minimum(1,t/0.25)**0.5; return q/np.sqrt((q**2).sum())*3.2
wet=np.stack([fftconvolve(dry,ir(1))[:N],fftconvolve(dry,ir(2))[:N]],1)
taps=np.zeros(N)
for d,gn in ((0.29,.38),(0.61,.22),(0.97,.12)):
    i=int(d*SR); taps[i:]+=dry[:N-i]*gn
taps=sosfilt(sos('low',2600),taps)
st=np.stack([dry*1.0+taps*0.38,dry*1.0+np.roll(taps,int(.011*SR))*0.38],1)+wet*0.2
tt=np.arange(N)/SR
y=np.zeros(N)
for f,a in ((73.4,.5),(146.8,.6),(220.,.42),(293.7,.4),(369.99,.32),(440.,.22),(587.3,.16)):
    for det in (-.004,0,.005): y+=a*np.sin(2*np.pi*f*(1+det)*tt+rng.uniform(0,6.28)+0.6*np.sin(2*np.pi*.23*tt))
yy=sosfilt(butter(2,[650,950],'band',fs=SR,output='sos'),y)*1.3+sosfilt(butter(2,[1100,1400],'band',fs=SR,output='sos'),y)*.8+0.5*sosfilt(sos('low',400),y)
bed=yy*np.clip(tt/2.6,0,1)**1.6*np.clip((INTRO-.15-tt)/.5,0,1); bed/=np.max(np.abs(bed)); bed=np.stack([bed,np.roll(bed,int(.017*SR))],1)*0.16
rum=sosfilt(sos('low',70),rng.standard_normal(N)); rum=rum*np.clip(tt/1.4,0,1)**2*np.clip((INTRO-tt)/.3,0,1); rum=rum/np.max(np.abs(rum))*0.32
spk=np.zeros(N)
for tt0 in (0.72,1.55,2.5,3.35,4.3,5.1,5.75):
    i=int(tt0*SR); k=np.arange(int(.9*SR))/SR
    for f in (2093,2637,3136,4186):
        seg=np.sin(2*np.pi*f*k)*np.exp(-5*k)*0.05; e=min(len(seg),N-i); spk[i:i+e]+=seg[:e]
spk=np.stack([spk,np.roll(spk,int(.023*SR))],1)
tr=np.clip((tt-(INTRO-1.0))/1.0,0,1); ris=sosfilt(sos('high',900),rng.standard_normal(N))*tr**3*0.5; ris=np.stack([ris,np.roll(ris,300)],1)
de=np.sqrt(np.convolve(dry**2,np.ones(int(.12*SR))/int(.12*SR),'same')); de=np.clip(de/ (de.max()*0.5),0,1); duck=1-0.72*de
mix=st+(bed+rum[:,None]*np.ones((1,2)))*duck[:,None]+spk*0.8+ris; mix=mix/np.max(np.abs(mix))*0.92
sf.write('god_intro.wav',mix,SR,subtype='PCM_24'); sf.write('v_nowet.wav',np.stack([dry+taps*0.38]*2,1),SR); sf.write('v_wet.wav',st,SR); sf.write('v_wet_bed.wav',st+(bed+rum[:,None]*np.ones((1,2)))*duck[:,None],SR); sf.write('god_dry_check.wav',np.stack([dry,dry],1)/np.max(np.abs(dry)),SR); print('written',mix.shape[0]/SR)
# word starts (approx) for the visual designer
lines=open('god_fast.pho').read().strip().split('\n'); acc=0; marks=[]
for l in lines:
    p=l.split('\t'); d=int(p[1].split(' ')[0])
    if p[0]=='_': marks.append(round(0.75+acc/1000,2))
    acc+=d
print('pauses after words at T:',marks)
