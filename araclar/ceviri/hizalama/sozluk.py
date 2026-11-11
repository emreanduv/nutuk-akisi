import json,re,math
from collections import Counter
d=json.load(open('tr-tekil.json'))
en=json.load(open('en-para2.json')); H=json.load(open('hiza.json')); pairs=H['pairs']
tp=[x for b in d['bolumler'][:19] for k in b['kisimlar'] for x in k['p']]
STOP_E=set('the of and to in a that was is it for on with as by be had have not which this at from were i we our you he his they their would been an or are but all my me so these there what will has its no who them if one any also us than more only into such should those your may then did could out other upon do'.split())
def tw(x):
    x=x.replace('İ','i').replace('I','ı').lower()
    return {w[:5] for w in re.findall(r"[a-zçğıöşüâîû]{3,}",x)} - {'efend','bu','ve','bir','için','olara','olan','ile','diye','gibi','kadar','daha','olduğ','olmak','etmek','ettiğ','idi','değil','şu','ben','biz','bizi','her','hiç','hatt','fakat','lakin','lâkin','çünkü','zira','ancak','yani'}
def ew(x): return {w[:5] for w in re.findall(r"[a-z]{3,}",x.lower()) if w not in STOP_E}
ct=Counter();ce=Counter();cte=Counter();n=0
for (pi,pj),(i,j) in pairs:
    if i>pi and j>pj and (i-pi)+(j-pj)<=3:
        T=set().union(*[tw(tp[x]) for x in range(pi,i)]);E=set().union(*[ew(en[x]) for x in range(pj,j)]);n+=1
        ct.update(T);ce.update(E)
        for t in T:
            for e in E: cte[(t,e)]+=1
lex={}
for (t,e),c in cte.items():
    if c>=4:
        dice=2*c/(ct[t]+ce[e])
        if dice>=0.3: lex.setdefault(t,{})[e]=dice
print(n,len(lex),sum(len(v) for v in lex.values()))
for t in ['erzur','ankar','ordu','meclis','hükûm','telgr','padiş','hilâf','sulh','muâhe','taarr','düşma','millî','vatan']:
    print(t, sorted(lex.get(t,{}).items(),key=lambda x:-x[1])[:4])
json.dump(lex,open('lex.json','w'),ensure_ascii=False)
