# Nutuk Salonu — İngilizce arayüz sözlüğü: sozluk_arayuz.py → www/dil-en.js  (içerik ayrı: corpus-en.json, nutuk-tam-en.json)
import json,re,os
H=os.path.dirname(os.path.abspath(__file__)); g={}
exec(open(os.path.join(H,'sozluk_arayuz.py')).read(),g)
D=dict(g['D'])
exec(open(os.path.join(H,'sozluk_salon.py')).read(),g); D.update(g['D2'])
sp=lambda x: re.split(r'(?<=[.!?…])\s+',x)
for k,v in list(D.items()):
    a,b=sp(k),sp(v)
    if len(a)>1 and len(a)==len(b):
        if any(len(re.sub(r'\{\d\}|[^A-Za-zÇĞİÖŞÜçğıöşü]','',x))<4 for x in a): continue
        for x,y in zip(a,b): D.setdefault(x,y)
js='/* Nutuk Salonu — İngilizce arayüz sözlüğü (Mr. Anduv! dil paketi: dil.js). Üretim: araclar/ceviri/yap.py. Metinler: data/corpus-en.json, Nutuk tam metni: data/nutuk-tam-en.json (1929 İngilizce baskısı). */\n'
js+='window.DIL_EN = '+json.dumps(D,ensure_ascii=False,indent=0)+';\n'
for hedef in ('www','docs/salon'): open(os.path.join(H,'..','..',hedef,'dil-en.js'),'w').write(js)
print(len(D))
