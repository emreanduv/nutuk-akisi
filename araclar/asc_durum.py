# Bütün uygulamaların App Store sürüm durumu ve son TestFlight derlemesi (yalnız okur)
import jwt,time,json,os,urllib.request
KID=os.environ['ASC_KEY_ID'];ISS=os.environ['ASC_ISSUER_ID'];KEY=open(os.path.expanduser(f'~/private_keys/AuthKey_{KID}.p8')).read()
def get(p):
    t=jwt.encode({'iss':ISS,'exp':int(time.time())+900,'aud':'appstoreconnect-v1'},KEY,algorithm='ES256',headers={'kid':KID})
    with urllib.request.urlopen(urllib.request.Request('https://api.appstoreconnect.apple.com/'+p,headers={'Authorization':'Bearer '+t})) as f: return json.load(f)
for a in get('v1/apps?limit=50')['data']:
    vs=get(f"v1/apps/{a['id']}/appStoreVersions?limit=3")['data']
    b=get(f"v1/builds?filter[app]={a['id']}&sort=-uploadedDate&limit=1&include=preReleaseVersion")
    bv=b['data'][0]['attributes']['version'] if b['data'] else '-'
    pv=b['included'][0]['attributes']['version'] if b.get('included') else '-'
    print(f"{a['attributes']['bundleId']:32} {a['attributes']['name'][:28]:28} | "+' ; '.join(f"{v['attributes']['versionString']} {v['attributes']['appStoreState']}" for v in vs)+f" | son derleme {pv} ({bv})")
