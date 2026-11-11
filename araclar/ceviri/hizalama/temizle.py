import re,json,statistics
from wordfreq import zipf_frequency as z
pages=open('en.txt').read().split('\f')
lines=[]
for p in pages:
    for l in p.split('\n'):
        s=l.strip()
        if re.fullmatch(r'[\divxlcIVXLC\.\* ]{1,6}',s) and s not in('I.',): s=''
        lines.append(s)
    lines.append('')  # page break marker? keep as soft
# locate speech
start=next(i for i,l in enumerate(lines) if l.startswith('I landed at Samso'))
end=max(i for i,l in enumerate(lines) if 'Turkish Youth' in l)
# extend end to close of that paragraph block
j=end
while j<len(lines) and not ('Republic' in lines[j] and lines[j].endswith('.') and j>end+5): j+=1
L=lines[start:j+40]
med=statistics.median([len(l) for l in L if len(l)>30])
corpus={}
for w in re.findall(r"[A-Za-z]+"," ".join(L)): corpus[w.lower()]=corpus.get(w.lower(),0)+1
def birles(a,b):
    ab=(a+b).lower(); za,zb,zab=z(a.lower(),'en'),z(b.lower(),'en'),z(ab,'en')
    if corpus.get(ab,0)>0 and zab>=1.5: return True
    return zab>=2.0 and zab>min(za,zb)
paras=[];cur=''
pagebreak_pending=False
for l in L:
    if not l:
        continue  # blank lines in pdftotext are unreliable (page/column), use length rule
    if cur:
        m1=re.search(r"([A-Za-z]+)-?$",cur); m2=re.match(r"([A-Za-z]+)",l)
        if cur.endswith('-') and m2: cur=cur[:-1]+l
        elif m1 and m2 and birles(m1.group(1),m2.group(1)): cur=cur+l
        else: cur=cur+' '+l
    else: cur=l
    if len(l)<0.82*med and re.search(r"[.:!?\"”'’)]$",l):
        paras.append(cur);cur=''
if cur: paras.append(cur)
def ocr(s):
    def fix(m):
        t=m.group(1)
        if re.search(r'\d',t) or re.fullmatch(r'[iIlgoOS]{1,3}',t):
            t=t.translate(str.maketrans('iIlgoOS','1119005'))
        return t+m.group(2)
    s=re.sub(r"\b([0-9iIlgoOS]{1,4})(st|nd|rd|th)\b",fix,s)
    s=re.sub(r"\b1([0-9iIl]{3})\b",lambda m:'1'+m.group(1).translate(str.maketrans('iIl','111')),s)
    s=s.replace(' ;',';').replace(' :',':').replace(' !','!').replace(' ?','?').replace('„','"')
    return re.sub(r'\s+',' ',s).strip()
paras=[ocr(p) for p in paras if len(p)>1]
json.dump(paras,open('en-para.json','w'),ensure_ascii=False,indent=0)
print(len(paras),sum(map(len,paras)),med); print(paras[0][:300]); print(paras[-1][-300:])
