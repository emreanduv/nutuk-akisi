# www/data/corpus.json → www/data/corpus-en.json (özgün sözler "o" Türkçe kalır; karşılıklar ve anlatım İngilizce)
import json,os,sys
H=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,H)
from icerik_en1 import E1; from icerik_en2 import E2; from icerik_en3 import E3
E=E1+E2+E3
c=json.load(open(os.path.join(H,'../../www/data/corpus.json')))
SKIP={'id','simge','tarih','renk','tur','vk','live','wiki','dogrulama','hukum','bolum'}
S=[]
def topla(x,key=None):
    if key in SKIP: return
    if isinstance(x,dict): [topla(v,k) for k,v in x.items()]
    elif isinstance(x,list): [topla(v,key) for v in x]
    elif isinstance(x,str) and key!='o' and any(ch.isalpha() for ch in x) and x not in S: S.append(x)
for k in ['metinler','kadro','ekler','dogrumu']: topla(c[k],k)
assert len(S)==len(E), (len(S),len(E))
M={s:e for s,e in zip(S,E) if e}
def cevir(x,key=None):
    if key in SKIP or key=='o': return x
    if isinstance(x,dict): return {k:cevir(v,k) for k,v in x.items()}
    if isinstance(x,list): return [cevir(v,key) for v in x]
    if isinstance(x,str): return M.get(x,x)
    return x
for k in ['metinler','kadro','ekler','dogrumu']: c[k]=cevir(c[k],k)
json.dump(c,open(os.path.join(H,'../../www/data/corpus-en.json'),'w'),ensure_ascii=False,separators=(',',':'))
print('ok',len(M))
