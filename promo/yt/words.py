import numpy as np, wave, json, re
w=wave.open('../audio/vo.wav'); sr=w.getframerate(); ch=w.getnchannels()
x=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32).reshape(-1,ch).mean(1)/32768
hop=int(.01*sr); n=len(x)//hop
e=np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2)) for i in range(n)]); d=20*np.log10(e+1e-6)
ds=np.convolve(d,np.ones(5)/5,'same')
P=[(0.00,1.96,'מחפשים את כל התוכן שאתם אוהבים'),(2.00,2.86,'במקום אחד'),(3.05,4.96,'אם כן, הגעתם למקום הנכון'),
(5.00,6.63,'כל השידורים החיים בישראל'),(6.70,7.95,'תכנים מנטפליקס'),(8.00,9.00,'תכנים מדיסני פלוס'),(9.05,10.20,'כל ערוצי הספורט'),
(10.25,12.00,'כולל ספורט 5'),(12.05,13.08,"וצ'רלטון"),(13.10,13.99,'סדרות תורכיות'),(14.00,14.60,'קוריאניות'),(14.60,15.42,'אנימה ועוד המון תוכן'),
(15.81,18.55,'והכי חשוב, הספרייה מתעדכנת לאורך כל השבוע'),(18.81,20.40,'ככה שתמיד יש משהו חדש לראות'),
(20.64,23.50,'יש לכם גם שידורים חיים, עם חוויית צפייה מהירה וחלקה'),(23.90,25.50,'והדבר שאנחנו הכי גאים בו?'),
(25.61,26.47,'אין תקיעות'),(26.55,27.18,'נקודה'),(27.20,27.88,'בלי להיתקע'),(28.00,30.00,'בדיוק ברגע החשוב'),
(30.12,31.09,'פשוט לוחצים'),(31.10,32.04,'וצופים'),(32.04,33.42,'כל התוכן שאתם אוהבים'),(33.42,35.19,'השידורים החיים שאתם צריכים'),
(35.19,36.17,'וחוויית הצפייה'),(36.20,36.88,'בלי תקיעות')]
out=[]
for pi,(a,b,txt) in enumerate(P):
    ws=txt.split(); wt=[len(re.sub(r'[^א-תa-z0-9]','',q))+1.5 for q in ws]; cum=np.cumsum([0]+wt)/sum(wt)
    bounds=[a+c*(b-a) for c in cum]
    for k in range(1,len(ws)):   # snap internal boundaries to energy minima
        c=int(bounds[k]*100); lo,hi=max(0,c-12),min(n-1,c+12); bounds[k]=(lo+int(np.argmin(ds[lo:hi+1])))/100
    for k,q in enumerate(ws): out.append(dict(w=q,t0=round(bounds[k],3),t1=round(bounds[k+1],3),ph=pi))
json.dump(out,open('words.json','w'),ensure_ascii=False,indent=0)
print(len(out),'words'); print([ (o['w'],o['t0']) for o in out[:14]])
