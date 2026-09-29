import numpy as np, json
mm=np.load('/tmp/asr/ref/mouth.npy'); vo=np.load('/tmp/asr/ref/vo25.npy')
sm=np.convolve(mm,np.ones(3)/3,'same'); thr=np.percentile(sm,45)
ma=(sm>thr).astype(float)
va=(20*np.log10(vo+1e-6)>-42).astype(float)
# output shots: name, t0, t1
shots=[('m1',0.0,2.0),('m2',2.0,3.05),('m3',3.05,4.0),('m4',4.0,5.05),('m5',18.81,20.7),('m6',23.9,25.5),
       ('m7',30.12,32.04),('m8',32.04,33.42),('m9',33.42,35.19),('m10',35.19,37.0)]
N=len(ma); used=np.zeros(N); plan={}
for name,a,b in sorted(shots,key=lambda s:-(s[2]-s[1])):
    n=int(round((b-a)*25)); v=va[int(a*25):int(a*25)+n]; v=np.pad(v,(0,n-len(v)))
    best=None
    for s in range(0,N-n):
        c=(ma[s:s+n]*v).sum()+(1-ma[s:s+n]).dot(1-v)   # agreement count
        c-= 0.6*used[s:s+n].sum()
        if best is None or c>best[0]: best=(c,s)
    s=best[1]; used[s:s+n]=1; plan[name]=dict(t0=a,t1=b,src=s,agree=round(best[0]/n,2))
    print(name,a,b,'src',s,'agree',plan[name]['agree'])
json.dump(plan,open('plan_shots.json','w'),indent=1)
need=sorted({s['src']+i for s in plan.values() for i in range(int((s['t1']-s['t0'])*25)+3)})
need=[i for i in need if i<N]; json.dump(need,open('need_frames.json','w')); print(len(need),'source frames needed')
