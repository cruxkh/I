import json, numpy as np, soundfile as sf
from dtw_align import *
x0,sr0=sf.read('../audio/vo_original_tts.wav'); x0=x0.astype(np.float32)
x=resample_poly(x0,SR,sr0)
h=int(.01*sr0); n=len(x0)//h
d=20*np.log10(np.array([np.sqrt(np.mean(x0[i*h:(i+1)*h]**2)) for i in range(n)])+1e-7)
# (approx start, approx end, text) - windows sit inside the silences between phrases
SEG=[(0.0,1.24,'פותחים את המסך'),(1.24,3.25,'והעולם של הבידור נפתח בפניכם'),(3.25,5.34,'סרטים וסדרות מנטפליקס'),(5.34,6.7,'תכנים מדיסני פלוס'),
(6.7,8.88,"כל ערוצי הספורט כולל צ'רלטון"),(8.88,10.0,'סדרות טורקיות'),(10.0,11.05,'סדרות הודיות'),(11.05,12.9,'וכל השידורים החיים מישראל'),
(12.9,14.28,'הכול במקום אחד'),(14.28,15.36,'הכול נגיש'),(15.36,17.2,'והכול מתעדכן לאורך השבוע'),(17.2,18.7,'משחקים בשידור חי'),
(18.7,20.42,'הסדרות שאתם מחכים להן'),(20.42,22.1,'והתוכן שתמיד כיף לגלות'),(22.1,23.55,'לא צריך לחפש'),(23.55,24.95,'לא צריך לעבור בין שירותים'),
(24.95,26.3,'פשוט בוחרים מה לראות'),(26.3,27.52,'ומתחילים לצפות')]
def edge(a,b):
    ia,ib=int(a/.01),min(n,int(b/.01)); idx=[i for i in range(ia,ib) if d[i]>-42]
    return idx[0]*.01, (idx[-1]+1)*.01
res=[]
for pi,(a,b,t) in enumerate(SEG):
    s,e=edge(a,b); ws=t.split()
    for wd,ws0,we0 in align_segment(x,s,e,ws): res.append(dict(w=wd,t0=round(float(ws0),3),t1=round(float(we0),3),ph=pi))
    print(pi,round(s,2),round(e,2),[(r['w'],r['t0'],r['t1']) for r in res if r['ph']==pi])
json.dump(res,open('words_dtw.json','w'),ensure_ascii=False,indent=0)
