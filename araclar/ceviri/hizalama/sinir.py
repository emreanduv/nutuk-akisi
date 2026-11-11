import json,re,math
exec(open('sozluk.py').read().split('ct=Counter()')[0])   # tw, ew, d, en
lex=json.load(open('lex.json'))
H=json.load(open('hiza.json')); en_own=H['en_own']
src=open('hizala.py').read()
exec(src[src.index('import unicodedata'):src.index('tnm=[')])   # MAP, fold, tnames, enames
exec(src[src.index('TRM='):src.index('tdt=[')])  # tdates, edates
def ssplit(p): return [s for s in re.split(r'(?<=[.!?…:])["”’\']?\s+(?=["“‘\'(]?[A-ZÇĞİÖŞÜ0-9])',p) if s.strip()]
ks=[k for b in d['bolumler'][:19] for k in b['kisimlar']]
ES=[];EP=[]
for pi,p in enumerate(en):
    for s in ssplit(p):
        if s.startswith('*') : continue
        ES.append(s);EP.append(pi)
ES=[x for x in ES]
EW=[ew(s) for s in ES]; EN_=[enames(s) for s in ES]; ED=[edates(s) for s in ES]
def sim(tsents,ei):
    T=set().union(*[tw(s) for s in tsents]) if tsents else set()
    E=set().union(*[EW[i] for i in ei]) if ei else set()
    if not T or not E: return 0
    sc=sum(max((lex[t].get(e,0) for e in E),default=0) for t in T if t in lex)
    sc/=math.sqrt(len(T)*len(E))**0.5*3
    tn=set().union(*[tnames(s) for s in tsents]); en_=set().union(*[EN_[i] for i in ei])
    td=set().union(*[tdates(s) for s in tsents]); ed=set().union(*[ED[i] for i in ei])
    return sc+0.8*len(tn&en_)+1.5*len(td&ed)
# predicted sentence index for each kisim start
firstpar={}
for i,o in enumerate(en_own):
    firstpar.setdefault(o,i)
pred=[];last=0
for k in ks:
    pi=firstpar.get(k['id'])
    if pi is None: pred.append(None);continue
    import bisect; si=bisect.bisect_left(EP,pi); pred.append(min(si,len(ES)-1))
# interpolate missing
for i in range(len(pred)):
    if pred[i] is None:
        a=pred[i-1]; j=i
        while pred[j] is None: j+=1
        pred[i]=a+(pred[j]-a)//2 if False else None
pp=[p for p in pred]
for i in range(len(pp)):
    if pp[i] is None: pp[i]=pp[i-1]
W=12
FIX=json.load(open('duzelt-id.json'))
cands=[]
for kk,k in enumerate(ks):
    if kk==0: cands.append([(0,0.0)]);continue
    prev=[s for p in ks[kk-1]['p'] for s in ssplit(p)]; cur=[s for p in k['p'] for s in ssplit(p)]
    pl=prev[-4:]; cf=cur[:4]
    cs=[]
    for c in range(max(1,pp[kk]-W),min(len(ES)-1,pp[kk]+W)+1):
        a=list(range(max(0,c-4),c)); b=list(range(c,min(len(ES),c+4)))
        s=sim(pl,a)+sim(cf,b)-0.5*sim(cf,a)-0.5*sim(pl,b)-0.04*abs(c-pp[kk])
        cs.append((c,s))
    if k['id'] in FIX:
        hit=[i for i in range(len(ES)) if ES[i].startswith(FIX[k['id']])]
        if hit: cs=[(hit[0],100.0)]
        else: print('FIX bulunamadi',k['id'])
    cands.append(cs)
# viterbi monotone (strictly increasing)
best=[{c:(s,None) for c,s in cands[0]}]
for kk in range(1,len(cands)):
    cur={}
    prevs=sorted(best[-1].items())
    for c,s in cands[kk]:
        opts=[(v[0],pc) for pc,v in prevs if pc<c]+[(v[0]-2.5,pc) for pc,v in prevs if pc==c]
        if not opts: opts=[(min(v[0] for _,v in prevs)-50,min(pc for pc,_ in prevs))]
        bv,bp=max(opts)
        cur[c]=(bv+s,bp)
    best.append(cur)
c=max(best[-1],key=lambda x:best[-1][x][0]); cuts=[c]
for kk in range(len(best)-1,0,-1):
    c=best[kk][c][1]; cuts.append(c)
cuts=cuts[::-1]
BOS={'15-11','15-12','15-13','15-14','15-15','15-16','15-17','15-18'}
ids=[k['id'] for k in ks]
for i in range(len(ks)-2,-1,-1):
    if ids[i] in BOS: cuts[i]=cuts[i+1]
for i in range(1,len(cuts)): cuts[i]=max(cuts[i],cuts[i-1])
out={}
for kk,k in enumerate(ks):
    a=cuts[kk]; b=cuts[kk+1] if kk+1<len(ks) else len(ES)
    # rebuild paragraphs
    paras=[];lastp=None
    for i in range(a,b):
        if EP[i]!=lastp: paras.append(ES[i]); lastp=EP[i]
        else: paras[-1]+=' '+ES[i]
    out[k['id']]=paras
json.dump(out,open('en-kisim.json','w'),ensure_ascii=False)
print(sum(1 for v in out.values() if not v),'bos', sum(abs(a-b) for a,b in zip(cuts,pp))/len(cuts))
# confidence: chosen score vs best other candidate >=2 sentences away
conf=[]
for kk in range(1,len(ks)):
    cs=dict(cands[kk]); c=cuts[kk]
    if c not in cs: conf.append((kk,-9));continue
    others=[s for x,s in cs.items() if abs(x-c)>=2]
    conf.append((kk,cs[c]-max(others) if others else 9))
json.dump({'cuts':cuts,'conf':conf,'ES':ES,'EP':EP},open('sinir-durum.json','w'),ensure_ascii=False)
import collections
print(sorted(collections.Counter(round(m) if m<3 else 3 for _,m in conf).items()))
