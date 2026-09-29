import numpy as np, json, os
mm=np.load('/tmp/asr/ref/mouth.npy'); vo=np.load('/tmp/asr/ref/vo25.npy')
z=lambda a:(np.asarray(a,float)-np.mean(a))/(np.std(a)+1e-9)
sm=np.convolve(mm,np.ones(3)/3,'same'); mz=z(np.clip(sm,0,np.percentile(sm,97)))
vz=z(np.clip(20*np.log10(vo+1e-6),-60,-8)); N=len(mz)
# id, t0, t1, mode, cx, cy, z0, z1, rot0, rot1, flip, entry dir, dist
F='full'; C='cameo'
items=[
 ('h1',0.00,0.65,F,540,700,2.05,1.75,0,0,0,None,0),('h2',0.65,1.32,F,760,700,1.35,1.5,6,7,0,None,0),('h3',1.32,2.00,F,320,700,1.55,1.7,-6,-7,1,None,0),('h4',2.00,3.05,F,540,660,2.3,1.9,-3,-3,0,None,0),
 ('h5a',18.81,19.7,F,720,700,1.4,1.5,5,4,0,None,0),('h5b',19.7,20.64,F,360,700,1.6,1.7,-4,-4,1,None,0),
 ('h6',23.9,25.5,F,540,690,1.2,1.85,0,0,0,None,0),
 ('h7a',30.12,30.9,F,540,700,1.4,1.5,0,-2,0,None,0),('h7b',30.9,31.6,F,700,700,1.5,1.6,4,5,0,None,0),('h7c',31.6,32.04,F,540,660,2.0,2.2,0,0,0,None,0),
 ('h8a',32.04,32.8,F,340,700,1.6,1.7,-3,-4,1,None,0),('h8b',32.8,33.42,F,740,700,1.6,1.7,4,4,0,None,0),
 ('h9a',33.42,34.2,F,540,760,1.3,1.4,0,0,0,None,0),('h9b',34.2,35.19,F,360,700,1.5,1.6,-3,-3,1,None,0),
 ('h10a',35.19,35.9,F,540,660,1.9,2.0,0,0,0,None,0),('h10b',35.9,37.18,F,540,700,1.5,1.8,0,0,0,None,0),
 ('c1',5.60,6.50,C,150,1020,.95,1.0,16,14,0,'l',520),('c2',7.05,7.95,C,940,900,.95,1.0,-16,-14,1,'r',520),('c3',8.35,9.02,C,900,330,.8,.85,22,20,1,'t',420),
 ('c4',9.95,10.75,C,140,1150,.9,.95,12,10,0,'l',520),('c5',11.0,11.9,C,950,1050,.95,1.0,-12,-10,1,'r',520),('c6',13.3,13.95,C,860,900,1.05,1.1,-8,-6,1,'r',560),
 ('c7',16.5,17.4,C,180,420,.8,.85,-18,-16,0,'t',420),('c8',21.0,21.8,C,150,1000,.9,.95,14,12,0,'l',520),('c9',22.55,23.3,C,950,950,.9,.95,-14,-12,1,'r',520),
 ('c10',28.35,29.0,C,900,1050,.85,.9,-10,-8,1,'r',520),('c11',29.35,30.1,C,190,520,.85,.9,12,10,0,'l',520),
]
plan={}; used=np.zeros(N)
for it in sorted(items,key=lambda i:-(i[2]-i[1])):
    name,t0,t1=it[0],it[1],it[2]; n=int(round((t1-t0)*25)); v=vz[int(t0*25):int(t0*25)+n]; v=np.pad(v,(0,max(0,n-len(v))))
    best=None
    for r in (0.92,1.0,1.08):
        span=int(np.ceil(n*r))+2
        for s in range(0,N-span):
            idx=np.clip((s+np.arange(n)*r).round().astype(int),0,N-1); c=float((mz[idx]*v).mean())-0.02*used[idx].sum()/n*5
            if best is None or c>best[0]: best=(c,s,r,idx)
    c,s,r,idx=best; used[idx]+=1
    plan[name]=dict(t0=t0,t1=t1,mode=it[3],cx=it[4],cy=it[5],z0=it[6],z1=it[7],rot0=it[8],rot1=it[9],flip=it[10],dir=it[11],dist=it[12],src=int(s),rate=r,score=round(c,3))
    print(name,t0,t1,it[3],'src',s,'rate',r,'corr',round(c,2))
json.dump(plan,open('hostplan.json','w'),indent=1)
need=set()
for p in plan.values():
    n=int(round((p['t1']-p['t0'])*25))
    for i in range(n+2): need.add(min(N-1,int(round(p['src']+i*p['rate']))))
existing=set(int(f[1:5]) for f in os.listdir('mask_rgba')) if os.path.isdir('mask_rgba') else set()
miss=sorted(need-existing); json.dump(miss,open('need_frames_v3.json','w')); print(len(need),'needed',len(miss),'new')
