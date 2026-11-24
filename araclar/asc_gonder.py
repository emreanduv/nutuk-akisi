# Nutuk Salonu — App Store sürümünü incelemeye gönderir (CI). Yalnız Emre açıkça "gönder" dediğinde çalıştırılır.
# İçerik hakları beyanı Emre'nin onayıyla: kamu malı Nutuk metinleri + Vikipedi "Tarihte bugün" → üçüncü taraf içeriği var, haklar uygun.
import jwt, time, json, os, urllib.request, urllib.error
KID = os.environ['ASC_KEY_ID']; ISS = os.environ['ASC_ISSUER_ID']; BUNDLE = os.environ.get('BUNDLE', 'com.anduv.nutukakisi'); SURUM = os.environ['SURUM']
KEY = open(os.path.expanduser(f'~/private_keys/AuthKey_{KID}.p8')).read()
log = []; out = {'adimlar': []}
def ok(s): out['adimlar'].append(s); print(s)
def tok(): return jwt.encode({'iss': ISS, 'exp': int(time.time()) + 900, 'aud': 'appstoreconnect-v1'}, KEY, algorithm='ES256', headers={'kid': KID})
def api(m, p, b=None):
    r = urllib.request.Request('https://api.appstoreconnect.apple.com/' + p, method=m, data=json.dumps(b).encode() if b is not None else None,
                               headers={'Authorization': 'Bearer ' + tok(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(r) as f: t = f.read(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e: log.append(f'{m} {p.split("?")[0]} -> {e.code} {e.read().decode()[:1500]}'); return None
def bitir(kod=0):
    out['hatalar'] = log; json.dump(out, open('durum.json', 'w'), ensure_ascii=False, indent=1); print(json.dumps(out, ensure_ascii=False)); raise SystemExit(kod)

APP = api('GET', f'v1/apps?filter[bundleId]={BUNDLE}')['data'][0]; AID = APP['id']
if APP['attributes'].get('contentRightsDeclaration') != 'USES_THIRD_PARTY_CONTENT':
    if api('PATCH', f'v1/apps/{AID}', {'data': {'type': 'apps', 'id': AID, 'attributes': {'contentRightsDeclaration': 'USES_THIRD_PARTY_CONTENT'}}}) is not None: ok('içerik hakları: üçüncü taraf içeriği var, haklar uygun')
# Çin anakarası: Apple yeni uygulamalardan AIGC beyanı ve güvenlik değerlendirmesi raporu istiyor (yoksa gönderim kilitli).
# Nutuk Salonu Çin anakarasında dağıtılmaz; istenirse ileride bu belgelerle geri açılır.
av = api('GET', f'v1/apps/{AID}/appAvailabilityV2')
if av and av.get('data'):
    ta = api('GET', f"v2/appAvailabilities/{av['data']['id']}/territoryAvailabilities?limit=200&include=territory") or {}
    cin = [t for t in ta.get('data', []) if ((t.get('relationships') or {}).get('territory') or {}).get('data', {}).get('id') == 'CHN']
    out['bolge_sayisi'] = len(ta.get('data', []))
    if not cin: log.append('CHN bölgesi listede bulunamadı')
    for t in cin:
        if t['attributes'].get('available'):
            if api('PATCH', f"v1/territoryAvailabilities/{t['id']}", {'data': {'type': 'territoryAvailabilities', 'id': t['id'], 'attributes': {'available': False}}}) is not None: ok('Çin anakarası dağıtımdan çıkarıldı (AIGC + güvenlik belgesi şartı)')
        else: ok('Çin anakarası zaten kapalı')
v = next((x for x in api('GET', f'v1/apps/{AID}/appStoreVersions?filter[platform]=IOS&limit=10')['data'] if x['attributes']['versionString'] == SURUM), None)
if not v: log.append(f'{SURUM} sürümü yok'); bitir(1)
out['durum_once'] = v['attributes']['appStoreState']
if v['attributes']['appStoreState'] in ('WAITING_FOR_REVIEW', 'IN_REVIEW'): ok('zaten incelemede'); bitir()
b = api('GET', f"v1/appStoreVersions/{v['id']}/build"); out['derleme'] = b and b.get('data') and b['data']['attributes']['version']
if not out['derleme']: log.append('sürüme bağlı derleme yok'); bitir(1)
# açık (gönderilmemiş) bir inceleme gönderimi varsa onu kullan
subs = (api('GET', f'v1/reviewSubmissions?filter[app]={AID}&filter[platform]=IOS&limit=10') or {}).get('data', [])
s = next((x for x in subs if x['attributes']['state'] in ('READY_FOR_REVIEW',)), None)
if not s:
    r = api('POST', 'v1/reviewSubmissions', {'data': {'type': 'reviewSubmissions', 'attributes': {'platform': 'IOS'}, 'relationships': {'app': {'data': {'type': 'apps', 'id': AID}}}}})
    if not r: bitir(1)
    s = r['data']; ok('inceleme gönderimi açıldı')
SID = s['id']
items = (api('GET', f'v1/reviewSubmissions/{SID}/items') or {}).get('data', [])
if not items:
    r = api('POST', 'v1/reviewSubmissionItems', {'data': {'type': 'reviewSubmissionItems', 'relationships': {'reviewSubmission': {'data': {'type': 'reviewSubmissions', 'id': SID}}, 'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': v['id']}}}}})
    if not r: bitir(1)
    ok(f'{SURUM} gönderime eklendi')
r = api('PATCH', f'v1/reviewSubmissions/{SID}', {'data': {'type': 'reviewSubmissions', 'id': SID, 'attributes': {'submitted': True}}})
if r is None: bitir(1)
ok('incelemeye gönderildi: ' + r['data']['attributes']['state'])
time.sleep(5)
out['durum_sonra'] = api('GET', f"v1/appStoreVersions/{v['id']}")['data']['attributes']['appStoreState']
bitir()
