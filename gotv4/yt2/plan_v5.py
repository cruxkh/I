import numpy as np, soundfile as sf, json, os
FPS=23.976
x,sr=sf.read('audio.wav'); hop=int(sr/FPS); n=len(x)//hop
e=np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2)) for i in range(n)]); d=20*np.log10(e+1e-6)
ha=np.clip(d,-60,-8); hz=(ha-ha.mean())/(ha.std()+1e-9)
th=np.load('th.npy'); th=th[:n]
# allowed frames: talking-head medium runs (skip the first close-up run), with 4-frame margins
runs=[(11.14,18.06),(18.31,20.69),(23.02,25.48),(32.41,34.87),(38.12,50.97)]
ok=np.zeros(n,bool)
for a,b in runs: ok[int(a*FPS)+4:int(b*FPS)-4]=True
ok&=th
vo=np.load('/tmp/asr/ref/vo25.npy'); vd=20*np.log10(vo+1e-6); vz=(np.clip(vd,-60,-8)-np.clip(vd,-60,-8).mean())/np.clip(vd,-60,-8).std()
hp=json.load(open('../yt/hostplan.json'))
plan={}; used=np.zeros(n)
for name,it in sorted(hp.items(),key=lambda kv:-(kv[1]['t1']-kv[1]['t0'])):
    t0,t1=it['t0'],it['t1']; m=int(round((t1-t0)*FPS)); v=vz[int(t0*25):int(t0*25)+int(round((t1-t0)*25))]
    vv=np.interp(np.linspace(0,len(v)-1,m),np.arange(len(v)),v) if len(v)>1 else np.zeros(m)
    best=None
    for r in (0.92,1.0,1.08):
        span=int(np.ceil(m*r))+2
        for s in range(0,n-span):
            idx=(s+np.arange(m)*r).round().astype(int)
            if not ok[idx].all(): continue
            c=float((hz[idx]*vv).mean())-0.05*used[idx].mean()*5
            if best is None or c>best[0]: best=(c,s,r,idx)
    c,s,r,idx=best; used[idx]+=1
    q=dict(it); q.update(src=int(s),rate=r,score=round(c,3)); plan[name]=q; print(name,t0,t1,'src',s,'rate',r,'corr',round(c,2))
json.dump(plan,open('hostplan2.json','w'),indent=1)
need=set()
for p in plan.values():
    m=int(round((p['t1']-p['t0'])*FPS))
    for i in range(m+3): need.add(min(n-1,int(round(p['src']+i*p['rate']))))
json.dump(sorted(need),open('need_frames.json','w')); print(len(need),'frames needed of',n)
