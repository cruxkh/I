import json, numpy as np, soundfile as sf
from dtw_align import *
x,sr=sf.read('../audio/vo_original_tts.wav'); x=resample_poly(x.astype(np.float32),SR,sr)
PH=['פותחים את המסך','והעולם של הבידור נפתח בפניכם','סרטים וסדרות מנטפליקס','תכנים מדיסני פלוס',"כל ערוצי הספורט כולל צ'רלטון",'סדרות טורקיות','סדרות הודיות','וכל השידורים החיים מישראל',
'הכול במקום אחד','הכול נגיש','והכול מתעדכן לאורך השבוע','משחקים בשידור חי','הסדרות שאתם מחכים להן','והתוכן שתמיד כיף לגלות','לא צריך לחפש','לא צריך לעבור בין שירותים','פשוט בוחרים מה לראות','ומתחילים לצפות']
words=[];ph=[]
for i,p in enumerate(PH):
    for w in p.split(): words.append(w); ph.append(i)
gap=np.zeros(int(0.02*SR),np.float32); pause=(np.random.RandomState(0).randn(int(0.22*SR))*0.002).astype(np.float32)
ref=[];bnd=[0]
for k,w in enumerate(words):
    r=trim(tts(w,150)); ref+= [r,gap]; bnd.append(bnd[-1]+len(r)+len(gap))
    if k+1<len(words) and ph[k+1]!=ph[k]: ref.append(pause); bnd[-1]+=len(pause)
ref=np.concatenate(ref); A=mfcc(ref); B=mfcc(x)
C=np.sqrt(((A[:,None,:]-B[None,:,:])**2).sum(-1)); path=dtw(C.astype(np.float64))
mp={}
for i,j in path: mp.setdefault(i,[]).append(j)
fmap=lambda i: np.mean(mp[min(max(i,0),len(A)-1)])
out=[]
for k,w in enumerate(words):
    a=fmap(int(bnd[k]/160)); b=fmap(min(int((bnd[k+1]-len(gap))/160),len(A)-1))
    out.append(dict(w=w,t0=round(float(a*0.01),3),t1=round(float((b+1)*0.01),3),ph=ph[k]))
json.dump(out,open('words_dtw.json','w'),ensure_ascii=False,indent=0)
for o in out: print(o['ph'],o['w'],o['t0'],o['t1'])
