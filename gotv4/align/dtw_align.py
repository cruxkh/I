import numpy as np, wave, subprocess, io, json, re
from scipy.fft import dct
from scipy.signal import resample_poly, get_window
from numba import njit
SR=16000
def read_wav_bytes(b):
    w=wave.open(io.BytesIO(b)); ch=w.getnchannels(); sr=w.getframerate()
    x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32).reshape(-1,ch).mean(1)/32768
    if sr!=SR: x=resample_poly(x,SR,sr)
    return x
def tts(text,speed=170):
    b=subprocess.run(['espeak-ng','-v','he','-s',str(speed),'-p','50','--stdout',text],capture_output=True).stdout
    return read_wav_bytes(b)
def trim(x,thr=0.01):
    idx=np.where(np.abs(x)>thr)[0]
    return x[idx[0]:idx[-1]+1] if len(idx) else x
def mel_fb(nfft=512,n=26,lo=80,hi=7600):
    mel=lambda f:2595*np.log10(1+f/700); inv=lambda m:700*(10**(m/2595)-1)
    pts=inv(np.linspace(mel(lo),mel(hi),n+2)); bins=np.floor((nfft+1)*pts/SR).astype(int); fb=np.zeros((n,nfft//2+1))
    for i in range(n):
        a,b,c=bins[i],bins[i+1],bins[i+2]
        for k in range(a,b): fb[i,k]=(k-a)/max(1,b-a)
        for k in range(b,c): fb[i,k]=(c-k)/max(1,c-b)
    return fb
FB=mel_fb()
def mfcc(x,hop=160,win=400):
    x=np.append(x[0],x[1:]-0.97*x[:-1]); n=1+(len(x)-win)//hop; w=get_window('hann',win)
    fr=np.stack([x[i*hop:i*hop+win]*w for i in range(n)]); sp=np.abs(np.fft.rfft(fr,512))**2
    m=np.log(sp@FB.T+1e-8); c=dct(m,type=2,axis=1,norm='ortho')[:,1:14]
    e=np.log(np.sum(sp,1)+1e-8)[:,None]
    f=np.hstack([c,e*0.3]); f=(f-f.mean(0))/(f.std(0)+1e-6)
    return f
@njit(cache=True)
def dtw(C):
    n,m=C.shape; D=np.full((n+1,m+1),1e18); D[0,0]=0.0; P=np.zeros((n+1,m+1),np.int8)
    for i in range(1,n+1):
        for j in range(1,m+1):
            a=D[i-1,j-1]; b=D[i-1,j]+0.3; c=D[i,j-1]+0.3
            if a<=b and a<=c: D[i,j]=a+C[i-1,j-1]; P[i,j]=0
            elif b<=c: D[i,j]=b+C[i-1,j-1]; P[i,j]=1
            else: D[i,j]=c+C[i-1,j-1]; P[i,j]=2
    i,j=n,m; path=[]
    while i>0 and j>0:
        path.append((i-1,j-1)); p=P[i,j]
        if p==0: i-=1; j-=1
        elif p==1: i-=1
        else: j-=1
    return path[::-1]
def align_segment(x,t0,t1,words):
    seg=x[int(t0*SR):int(t1*SR)]
    refs=[trim(tts(w)) for w in words]; gap=np.zeros(int(0.02*SR),np.float32)
    ref=[];bnd=[0]
    for r in refs: ref.append(r); ref.append(gap); bnd.append(bnd[-1]+len(r)+len(gap))
    ref=np.concatenate(ref); A=mfcc(ref); B=mfcc(seg)
    C=np.sqrt(((A[:,None,:]-B[None,:,:])**2).sum(-1)); path=dtw(C.astype(np.float64))
    # map ref frame -> target frame (mean)
    mp={}
    for i,j in path: mp.setdefault(i,[]).append(j)
    fmap=lambda i: np.mean(mp[min(max(i,0),len(A)-1)])
    out=[]
    for k,w in enumerate(words):
        a=fmap(int(bnd[k]/160)); b=fmap(min(int((bnd[k+1]-len(gap))/160),len(A)-1))
        out.append((w,t0+a*0.01,t0+(b+1)*0.01))
    return out
