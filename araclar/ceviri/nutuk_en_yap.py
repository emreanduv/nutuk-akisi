# Nutuk İngilizce tam metin dosyasını üretir: www/data/nutuk-tam-en.json
#   girdi: hizalanmış kısımlar (en-kisim.json), basliklar1/2.py, www/data/nutuk-tam.json
import json,re,sys,os
H=os.path.dirname(__file__)
sys.path.insert(0,H)
from basliklar1 import B,K
from basliklar2 import K2
K.update(K2)
tr=json.load(open(os.path.join(H,'../../www/data/nutuk-tam.json')))
en=json.load(open(sys.argv[1]))
DUP={'13-1':'12-32','14-26':'14-15','14-27':'14-3','17-4':'17-1'}
OCR=[(r'\b11st\b','list'),(r'\b10st\b','lost'),(r'\bFend Pasha','Ferid Pasha'),(r'V/hen','When'),(r'\bt\( Principles','"Principles'),(r'/\'','"'),(r'(\d) (st|nd|rd|th)\b',r'\1\2'),
     (r'\b(\d+)tto-',r'\1th'),(r'\b(\d+)ttl\b',r'\1th'),(r'\^ ',' '),(r'\b(\d+)\^',r'\1th'),(r'Pell[i6]\b','Pellé'),(r'\bIs had\b','It had'),(r'Constatinople','Constantinople'),
     (r'correpondence','correspondence'),(r'acknowleging','acknowledging'),(r'tfrose','those'),(r'v/el','wel'),(r'(\w)— ',r'\1 — ')]
def temiz(s):
    for a,b in OCR: s=re.sub(a,b,s)
    return s
out={'eser':'Nutuk — A Speech Delivered by Ghazi Mustapha Kemal, October 1927','yazar':'Ghazi Mustapha Kemal','yil':1927,
     'kaynak':'English edition, K. F. Koehler, Leipzig, 1929 (Internet Archive)','url':'https://archive.org/details/speechdeliveredg010347mbp',
     'lisans':'Public domain (published 1929)','bolumler':[]}
for b in tr['bolumler']:
    nb={'no':b['no'],'romen':b['romen'],'baslik':B[b['romen']],'kisimlar':[]}
    for k in b['kisimlar']:
        kid=k['id']
        if b['romen']=='XX':
            nk={'id':kid,'harf':k.get('harf'),'baslik':k['baslik'].replace('Vesika','Document'),'p':k['p'],'tr':True}
        else:
            src=DUP.get(kid,kid); ps=[temiz(x) for x in en.get(src,[])]
            nk={'id':kid,'harf':k.get('harf'),'baslik':K[kid],'p':ps,'w':k.get('w')}
            if not ps: nk['yok']=True
        nb['kisimlar'].append(nk)
    out['bolumler'].append(nb)
json.dump(out,open(os.path.join(H,'../../www/data/nutuk-tam-en.json'),'w'),ensure_ascii=False,separators=(',',':'))
print('ok',sum(len(k['p']) for b in out['bolumler'] for k in b['kisimlar'] if not k.get('tr')))
