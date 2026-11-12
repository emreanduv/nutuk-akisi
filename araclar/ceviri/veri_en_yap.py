# docs/salon/veri.json → docs/salon/veri-en.json (Salon/VR). Çeviriler corpus ile ortak (icerik_en*.py) + salona özgü (salon_en.py).
import json,os,sys
H=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,H)
from icerik_en1 import E1; from icerik_en2 import E2; from icerik_en3 import E3
c=json.load(open(os.path.join(H,'../../www/data/corpus.json')))
SKIP={'id','simge','tarih','renk','tur','vk','live','wiki','dogrulama','hukum','bolum','lat','lon','metin','sinir'}
S=[]
def topla(x,key=None):
    if key in SKIP: return
    if isinstance(x,dict): [topla(v,k) for k,v in x.items()]
    elif isinstance(x,list): [topla(v,key) for v in x]
    elif isinstance(x,str) and key!='o' and any(ch.isalpha() for ch in x) and x not in S: S.append(x)
for k in ['metinler','kadro','ekler','dogrumu']: topla(c[k],k)
M={s:e for s,e in zip(S,E1+E2+E3) if e}
try:
    from salon_en import SM; M.update(SM)
except ImportError: pass
v=json.load(open(os.path.join(H,'../../docs/salon/veri.json')))
eksik=[]
def cevir(x,key=None):
    if key in SKIP or key=='o': return x
    if isinstance(x,dict): return {k:cevir(val,k) for k,val in x.items()}
    if isinstance(x,list): return [cevir(val,key) for val in x]
    if isinstance(x,str) and any(ch.isalpha() for ch in x):
        if x not in M and x not in eksik: eksik.append(x)
        return M.get(x,x)
    return x
ve=cevir(v)
json.dump(ve,open(os.path.join(H,'../../docs/salon/veri-en.json'),'w'),ensure_ascii=False,separators=(',',':'))
print('eksik',len(eksik)); [print(i,'|',s) for i,s in enumerate(eksik)]
