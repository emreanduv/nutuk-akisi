# Yayındaki bir uygulamaya güncelleme gönderir (Emre'nin "gönder" demesiyle): yeni App Store sürümü açar
# (Apple önceki sürümün açıklama/anahtar kelime/görsellerini kendisi taşır), "Yenilikler" metnini TR/EN yazar,
# TestFlight'taki derlemeyi bağlar ve incelemeye gönderir. İncelemede/onay bekleyen bir sürüm varsa ona dokunmaz.
# Girdi (ortam): ISLER = JSON liste [{"bundle","surum","derleme","tr","en"}]
import jwt, time, json, os, urllib.request, urllib.error
KID=os.environ['ASC_KEY_ID']; ISS=os.environ['ASC_ISSUER_ID']
KEY=open(os.path.expanduser(f'~/private_keys/AuthKey_{KID}.p8')).read()
def tok(): return jwt.encode({'iss':ISS,'exp':int(time.time())+900,'aud':'appstoreconnect-v1'},KEY,algorithm='ES256',headers={'kid':KID})
def api(m,p,b=None,log=None):
    r=urllib.request.Request('https://api.appstoreconnect.apple.com/'+p,method=m,data=json.dumps(b).encode() if b is not None else None,headers={'Authorization':'Bearer '+tok(),'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(r) as f: t=f.read(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e:
        if log is not None: log.append(f'{m} {p.split("?")[0]} -> {e.code} {e.read().decode()[:600]}')
        return None
BEKLEYEN=('WAITING_FOR_REVIEW','IN_REVIEW','PENDING_DEVELOPER_RELEASE','PENDING_APPLE_RELEASE','PROCESSING_FOR_APP_STORE','READY_FOR_REVIEW')
DUZENLENIR=('PREPARE_FOR_SUBMISSION','DEVELOPER_REJECTED','REJECTED','METADATA_REJECTED','INVALID_BINARY')
sonuc=[]
for i in json.loads(os.environ['ISLER']):
    log=[]; o={'bundle':i['bundle'],'surum':i['surum'],'adimlar':[],'hatalar':log}; sonuc.append(o)
    ok=lambda s: o['adimlar'].append(s)
    app=api('GET',f"v1/apps?filter[bundleId]={i['bundle']}",log=log)['data'][0]; AID=app['id']
    vs=api('GET',f'v1/apps/{AID}/appStoreVersions?filter[platform]=IOS&limit=10',log=log)['data']
    o['onceki']=[[x['attributes']['versionString'],x['attributes']['appStoreState']] for x in vs]
    if any(x['attributes']['appStoreState'] in BEKLEYEN for x in vs): ok('incelemede/onay bekleyen sürüm var, dokunulmadı'); continue
    v=next((x for x in vs if x['attributes']['appStoreState'] in DUZENLENIR),None)
    if v: api('PATCH',f"v1/appStoreVersions/{v['id']}",{'data':{'type':'appStoreVersions','id':v['id'],'attributes':{'versionString':i['surum']}}},log)
    else:
        r=api('POST','v1/appStoreVersions',{'data':{'type':'appStoreVersions','attributes':{'platform':'IOS','versionString':i['surum'],'releaseType':'AFTER_APPROVAL'},'relationships':{'app':{'data':{'type':'apps','id':AID}}}}},log)
        v=r and r['data']
    if not v: ok('sürüm açılamadı'); continue
    VID=v['id']; ok(f"sürüm {i['surum']} hazır")
    b=None
    for _ in range(40):
        r=api('GET',f"v1/builds?filter[app]={AID}&filter[version]={i['derleme']}&filter[preReleaseVersion.version]={i['surum']}&limit=1",log=log)
        if r and r['data'] and r['data'][0]['attributes']['processingState']=='VALID': b=r['data'][0]; break
        time.sleep(30)
    if not b: ok(f"derleme {i['derleme']} bulunamadı"); continue
    api('PATCH',f"v1/builds/{b['id']}",{'data':{'type':'builds','id':b['id'],'attributes':{'usesNonExemptEncryption':False}}})
    if api('PATCH',f'v1/appStoreVersions/{VID}/relationships/build',{'data':{'type':'builds','id':b['id']}},log) is not None: ok(f"derleme {i['derleme']} bağlandı")
    for l in api('GET',f'v1/appStoreVersions/{VID}/appStoreVersionLocalizations',log=log)['data']:
        metin=i['tr'] if l['attributes']['locale'].startswith('tr') else i['en']
        if api('PATCH',f"v1/appStoreVersionLocalizations/{l['id']}",{'data':{'type':'appStoreVersionLocalizations','id':l['id'],'attributes':{'whatsNew':metin}}},log) is not None: ok('yenilikler '+l['attributes']['locale'])
    subs=api('GET',f'v1/reviewSubmissions?filter[app]={AID}&filter[platform]=IOS&limit=20',log=log)['data']
    s=next((x for x in subs if x['attributes']['state']=='READY_FOR_REVIEW'),None)
    if not s:
        r=api('POST','v1/reviewSubmissions',{'data':{'type':'reviewSubmissions','attributes':{'platform':'IOS'},'relationships':{'app':{'data':{'type':'apps','id':AID}}}}},log); s=r and r['data']
    if not s: ok('başvuru açılamadı'); continue
    if not api('GET',f"v1/reviewSubmissions/{s['id']}/items",log=log)['data']:
        api('POST','v1/reviewSubmissionItems',{'data':{'type':'reviewSubmissionItems','relationships':{'reviewSubmission':{'data':{'type':'reviewSubmissions','id':s['id']}},'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}},log)
    r=api('PATCH',f"v1/reviewSubmissions/{s['id']}",{'data':{'type':'reviewSubmissions','id':s['id'],'attributes':{'submitted':True}}},log)
    ok('GÖNDERİLDİ: '+r['data']['attributes']['state'] if r else 'gönderilemedi')
print(json.dumps(sonuc,ensure_ascii=False,indent=1)); json.dump(sonuc,open('durum.json','w'),ensure_ascii=False,indent=1)
