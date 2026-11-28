# App Store Connect'te gizlilik ve destek bağlantılarını günceller (bütün diller; düzenlenebilen her kayıtta).
# Girdi: BUNDLE, GIZLILIK (boş olabilir), DESTEK (boş olabilir)
import jwt,time,json,os,urllib.request,urllib.error
KID=os.environ['ASC_KEY_ID'];ISS=os.environ['ASC_ISSUER_ID'];KEY=open(os.path.expanduser(f'~/private_keys/AuthKey_{KID}.p8')).read()
def tok(): return jwt.encode({'iss':ISS,'exp':int(time.time())+900,'aud':'appstoreconnect-v1'},KEY,algorithm='ES256',headers={'kid':KID})
def api(m,p,b=None):
    r=urllib.request.Request('https://api.appstoreconnect.apple.com/'+p,method=m,data=json.dumps(b).encode() if b else None,headers={'Authorization':'Bearer '+tok(),'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(r) as f: t=f.read(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e: print('  !',m,p.split('?')[0],e.code,e.read().decode()[:300]); return None
B,G,D=os.environ['BUNDLE'],os.environ.get('GIZLILIK',''),os.environ.get('DESTEK','')
AID=api('GET',f'v1/apps?filter[bundleId]={B}')['data'][0]['id']
if G:
    for ai in api('GET',f'v1/apps/{AID}/appInfos')['data']:
        st=ai['attributes'].get('state') or ai['attributes'].get('appStoreState')
        for l in api('GET',f"v1/appInfos/{ai['id']}/appInfoLocalizations")['data']:
            ok=api('PATCH',f"v1/appInfoLocalizations/{l['id']}",{'data':{'type':'appInfoLocalizations','id':l['id'],'attributes':{'privacyPolicyUrl':G}}})
            print('gizlilik',st,l['attributes']['locale'],'✓' if ok else '✗ (bu durumda düzenlenemiyor)')
if D:
    for v in api('GET',f'v1/apps/{AID}/appStoreVersions?limit=5')['data']:
        st=v['attributes']['appStoreState']
        for l in api('GET',f"v1/appStoreVersions/{v['id']}/appStoreVersionLocalizations")['data']:
            if l['attributes'].get('supportUrl')==D: continue
            ok=api('PATCH',f"v1/appStoreVersionLocalizations/{l['id']}",{'data':{'type':'appStoreVersionLocalizations','id':l['id'],'attributes':{'supportUrl':D}}})
            print('destek',v['attributes']['versionString'],st,l['attributes']['locale'],'✓' if ok else '✗ (bu durumda düzenlenemiyor)')
