# Precise word alignment: DP over candidate energy minima (word gaps) with a duration prior from letter counts.
import numpy as np, wave, json, re
w=wave.open('../audio/vo.wav'); sr=w.getframerate(); ch=w.getnchannels()
x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32).reshape(-1,ch).mean(1)/32768
hop=int(.005*sr); n=len(x)//hop
e=np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2)) for i in range(n)]); d=20*np.log10(e+1e-6)
k=int(.02/.005); ds=np.convolve(d,np.ones(k)/k,'same')
P=[(0.00,1.96,'מחפשים את כל התוכן שאתם אוהבים'),(2.00,2.86,'במקום אחד'),(3.05,4.96,'אם כן, הגעתם למקום הנכון'),
(5.00,6.63,'כל השידורים החיים בישראל'),(6.70,7.95,'תכנים מנטפליקס'),(8.00,9.00,'תכנים מדיסני פלוס'),(9.05,10.20,'כל ערוצי הספורט'),
(10.25,12.00,'כולל ספורט 5'),(12.05,13.08,"וצ'רלטון"),(13.10,13.99,'סדרות טורקיות'),(14.00,14.60,'קוריאניות'),(14.60,15.42,'אנימה ועוד המון תוכן'),
(15.81,18.55,'והכי חשוב, הספרייה מתעדכנת לאורך כל השבוע'),(18.81,20.40,'ככה שתמיד יש משהו חדש לראות'),
(20.64,23.50,'יש לכם גם שידורים חיים, עם חוויית צפייה מהירה וחלקה'),(23.90,25.50,'והדבר שאנחנו הכי גאים בו?'),
(25.61,26.47,'אין תקיעות'),(26.55,27.18,'נקודה'),(27.20,27.88,'בלי להיתקע'),(28.00,30.00,'בדיוק ברגע החשוב'),
(30.12,31.09,'פשוט לוחצים'),(31.10,32.04,'וצופים'),(32.04,33.42,'כל התוכן שאתם אוהבים'),(33.42,35.19,'השידורים החיים שאתם צריכים'),
(35.19,36.17,'וחוויית הצפייה'),(36.20,36.88,'בלי תקיעות')]
# refine phrase edges: first/last frame above -45 dB near the given edges
def edge(t,side):
    i=int(t/.005)
    lo,hi=(i-10,i+16) if side==0 else (i-16,i+10)
    idx=[j for j in range(max(0,lo),min(n-1,hi)) if d[j]>-40]
    if not idx: return t
    return (idx[0] if side==0 else idx[-1])/200.0
def weight(wd):
    L=len(re.sub(r'[^א-ת0-9a-z]','',wd)); sy=max(1,round(L*.55)); return L*.55+sy*1.0+1.2
out=[]
for pi,(a0,b0,txt) in enumerate(P):
    a=edge(a0,0) if pi not in () else a0; b=edge(b0,1)
    ws=txt.split(); m=len(ws)
    if m==1: out.append(dict(w=ws[0],t0=round(a,3),t1=round(b,3),ph=pi)); continue
    wt=np.array([weight(q) for q in ws]); cum=np.cumsum(wt)/wt.sum(); exp=[a+c*(b-a) for c in cum[:-1]]
    L=b-a; lo=int(a/.005)+6; hi=int(b/.005)-6
    # candidates: local minima of ds inside phrase
    cand=[]; 
    for j in range(lo+2,hi-2):
        if ds[j]<=ds[j-3:j+4].min():
            nb=max(ds[max(lo,j-30):j].max() if j>lo else ds[j], ds[j+1:min(hi,j+31)].max() if j<hi-1 else ds[j])
            depth=nb-ds[j]
            if depth>5.0: cand.append((j*.005,depth))
    if len(cand)<m-1: cand+=[(t,0.0) for t in exp]
    cand.sort(); T=np.array([c[0] for c in cand]); Dp=np.array([c[1] for c in cand])
    beta=3500.0; INF=1e18
    # DP: choose m-1 increasing candidates minimizing cost
    C=len(cand); dp=np.full((m,C),INF); bp=np.zeros((m,C),int)
    for kx in range(1,m):   # boundary index kx (1..m-1) uses exp[kx-1]
        for j in range(C):
            cost=beta*((T[j]-exp[kx-1])/L)**2 - Dp[j]*0.7
            if kx==1: dp[kx,j]=cost
            else:
                prev=dp[kx-1,:j]; 
                if len(prev)==0: continue
                # min gap 0.12s between boundaries
                ok=T[:j]<T[j]-0.12; 
                if not ok.any(): continue
                pv=np.where(ok,prev,INF); q=int(np.argmin(pv)); dp[kx,j]=pv[q]+cost; bp[kx,j]=q
    j=int(np.argmin(dp[m-1])); bs=[j]
    for kx in range(m-1,1,-1): j=bp[kx,j]; bs.append(j)
    bs=[T[q] for q in reversed(bs)]
    bounds=[a]+bs+[b]
    for i,q in enumerate(ws): out.append(dict(w=q,t0=round(float(bounds[i]),3),t1=round(float(bounds[i+1]),3),ph=pi))
json.dump(out,open('words_v2.json','w'),ensure_ascii=False,indent=0)
old=json.load(open('words.json'))
print('mean |shift| vs old:',np.mean([abs(a['t0']-b['t0']) for a,b in zip(out,old)]))
for o in out[:26]: print(o['w'],o['t0'],o['t1'])
# diagnostic plot
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
fig,axs=plt.subplots(4,1,figsize=(24,14))
tt=np.arange(n)*.005
for ai,(a,b) in enumerate([(0,10),(10,19),(19,28),(28,37)]):
    ax=axs[ai]; m_=(tt>=a)&(tt<b); ax.plot(tt[m_],d[m_],lw=.6); ax.set_ylim(-80,0)
    for o in out:
        if a<=o['t0']<b: ax.axvline(o['t0'],color='r',lw=.8); ax.text(o['t0'],-8,o['w'][::-1],fontsize=9,rotation=90,va='top')
plt.savefig('../previews/align_check.png',dpi=60)
