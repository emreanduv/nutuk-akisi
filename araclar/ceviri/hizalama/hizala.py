import json,math,re
d=json.load(open('tr-tekil.json'))
en=[x for x in json.load(open('en-para.json')) if not x.startswith('*)')]
json.dump(en,open('en-para2.json','w'),ensure_ascii=False)
tp=[];own=[]
for b in d['bolumler'][:19]:
    for k in b['kisimlar']:
        for x in k['p']: tp.append(x); own.append(k['id'])
c=sum(map(len,en))/sum(map(len,tp)); s2=6.8
def nums(t,pat): return set(re.findall(pat,t))
tv=[nums(x,r'[Vv]esika\s*:?\s*(\d+)') for x in tp]
ev=[nums(x,r'Document\s*(\d+)') for x in en]
import unicodedata
MAP={'erzerum':'erzurum','angora':'ankara','konia':'konya','smyrna':'izmir','constantinople':'istanbul','samsoon':'samsun','kiasim':'kazim','fuad':'fuat','hussein':'huseyin','ismet':'ismet','kemal':'kemal','brussa':'bursa','adalia':'antalya','trebizond':'trabzon','eskishehr':'eskisehir','afiun':'afyon','afion':'afyon','karahissar':'karahisar','djelaleddin':'celaleddin','djemal':'cemal','djevad':'cevat','wahideddin':'vahdettin','vahideddin':'vahdettin','mustapha':'mustafa','mohamed':'mehmet','tewfik':'tevfik','sami':'sami','refet':'refet','rauf':'rauf','fevzi':'fevzi','bekir':'bekir','ali':'ali','nureddin':'nurettin','djevdet':'cevdet','ihsan':'ihsan','edhem':'ethem','ethem':'ethem','abdul':'abdul','mejid':'mecid','medjid':'mecid','lausanne':'lozan','sevres':'sevr','sakaria':'sakarya','inonu':'inonu','mudania':'mudanya','marash':'maras','urfa':'urfa','aintab':'antep','adana':'adana','sivas':'sivas','amasia':'amasya','kastamuni':'kastamonu','kaissaria':'kayseri','cesarea':'kayseri','diarbekr':'diyarbakir','malatia':'malatya','kharput':'harput','van':'van','thrace':'trakya','balikesri':'balikesir'}
def fold(w):
    w=w.replace('ı','i').replace('İ','i').lower()
    return ''.join(ch for ch in unicodedata.normalize('NFD',w) if unicodedata.category(ch)!='Mn')
TRK={v for v in MAP.values()}
def tnames(x): return {fold(w) for w in re.findall(r"[A-ZÇĞİÖŞÜÂ][a-zçğıöşüâîû]+",x)} & TRK
def enames(x): return {MAP[w.lower()] for w in re.findall(r"[A-Z][a-z]+",x) if w.lower() in MAP}
tnm=[tnames(x) for x in tp]; enm=[enames(x) for x in en]
from collections import Counter
DF=Counter(n for s in tnm for n in s)
idf={n:math.log(len(tp)/(1+DF[n])) for n in DF}
TRM={'kânunusani':1,'kanunusani':1,'şubat':2,'mart':3,'nisan':4,'mayıs':5,'haziran':6,'temmuz':7,'ağustos':8,'eylül':9,'teşrinievvel':10,'teşrinisani':11,'kânunuevvel':12,'kanunuevvel':12}
ENM={m:i+1 for i,m in enumerate(['january','february','march','april','may','june','july','august','september','october','november','december'])}
def tdates(x): return {(int(d),TRM[m.lower()]) for d,m in re.findall(r"\b(\d{1,2})\s+([A-ZÇĞİÖŞÜa-zçğıöşüâ]+)",x) if m.lower() in TRM and 0<int(d)<32}
def edates(x): return {(int(d),ENM[m.lower()]) for d,m in re.findall(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Z][a-z]+)",x) if m.lower() in ENM and 0<int(d)<32}
tdt=[tdates(x) for x in tp]; edt=[edates(x) for x in en]
tn=[set(re.findall(r'\b(1[89]\d\d|\d{2,4})\b',x)) for x in tp]
en_n=[set(re.findall(r'\b(1[89]\d\d|\d{2,4})\b',x)) for x in en]
def lc(l1,l2):
    if l1==0 and l2==0: return 0
    m=(l1+l2/c)/2 or 1
    dd=(l1*c-l2)/math.sqrt(s2*m)
    pr=2*(1-0.5*(1+math.erf(abs(dd)/math.sqrt(2))))
    return -math.log(max(pr,1e-12))
pen={(1,1):0,(1,0):4.5,(0,1):4.5,(2,1):2.3,(1,2):2.3,(2,2):4.0,(1,3):4.5,(3,1):4.5}
N,M=len(tp),len(en); B=250
INF=1e18
cost={(0,0):0.0};back={}
for i in range(N+1):
    jc=int(i*M/N)
    for j in range(max(0,jc-B),min(M,jc+B)+1):
        if i==0 and j==0: continue
        best=INF;bk=None
        for (a,b),p in pen.items():
            pi,pj=i-a,j-b
            if pi<0 or pj<0 or (pi,pj) not in cost: continue
            l1=sum(len(tp[x]) for x in range(pi,i)); l2=sum(len(en[x]) for x in range(pj,j))
            v=cost[(pi,pj)]+p+lc(l1,l2)
            if a and b:
                T=set().union(*tv[pi:i]); E=set().union(*ev[pj:j])
                if T and E: v-= 10*len(T&E) - 4*len(T^E)
                TN=set().union(*tnm[pi:i]); EN=set().union(*enm[pj:j])
                v-= 0.6*sum(idf.get(n,0) for n in TN&EN)
                TD=set().union(*tdt[pi:i]); ED=set().union(*edt[pj:j])
                v-= 3*len(TD&ED)
            if v<best: best=v;bk=(pi,pj)
        if bk: cost[(i,j)]=best;back[(i,j)]=bk
pairs=[];ij=(N,M)
while ij!=(0,0):
    p=back[ij]; pairs.append((p,ij)); ij=p
pairs.reverse()
# assign en paragraphs to kisim of the first turkish para in the bead (or previous)
en_own=[None]*M; last=own[0]
for (pi,pj),(i,j) in pairs:
    k=own[pi] if i>pi else last
    for x in range(pj,j): en_own[x]=k
    if i>pi: last=own[i-1]
json.dump({'en_own':en_own,'pairs':pairs},open('hiza.json','w'))
from collections import Counter
print(Counter((i-pi,j-pj) for (pi,pj),(i,j) in pairs).most_common())
