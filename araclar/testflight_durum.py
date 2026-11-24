# Nutuk Salonu — TestFlight durumu ve iç test dağıtımı (CI).
# İç test grubunu bulur (yoksa açar), testçi listesini kontrol eder, istenen derlemeyi gruba ekler. Dış test / mağaza incelemesine dokunmaz.
import jwt, time, json, os, urllib.request, urllib.error
KID = os.environ['ASC_KEY_ID']; ISS = os.environ['ASC_ISSUER_ID']; BUNDLE = os.environ.get('BUNDLE', 'com.anduv.nutukakisi')
SURUM = os.environ.get('SURUM', ''); BNO = os.environ.get('BUILD_NO', '').strip()
TESTCILER = [x.strip() for x in os.environ.get('TESTCILER', '').split(',') if x.strip()]
KEY = open(os.path.expanduser(f'~/private_keys/AuthKey_{KID}.p8')).read()
log = []; out = {'adimlar': []}
def ok(s): out['adimlar'].append(s); print(s)
def tok(): return jwt.encode({'iss': ISS, 'exp': int(time.time()) + 900, 'aud': 'appstoreconnect-v1'}, KEY, algorithm='ES256', headers={'kid': KID})
def api(m, p, b=None):
    r = urllib.request.Request('https://api.appstoreconnect.apple.com/' + p, method=m, data=json.dumps(b).encode() if b is not None else None,
                               headers={'Authorization': 'Bearer ' + tok(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(r) as f: t = f.read(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e: log.append(f'{m} {p.split("?")[0]} -> {e.code} {e.read().decode()[:600]}'); return None
AID = api('GET', f'v1/apps?filter[bundleId]={BUNDLE}')['data'][0]['id']
# derlemeler
q = f'v1/builds?filter[app]={AID}&sort=-uploadedDate&limit=8&include=preReleaseVersion,buildBetaDetail&fields[builds]=version,processingState,uploadedDate,expired'
bl = api('GET', q) or {'data': [], 'included': []}
pre = {x['id']: x['attributes']['version'] for x in bl.get('included', []) if x['type'] == 'preReleaseVersions'}
det = {x['id']: x['attributes'] for x in bl.get('included', []) if x['type'] == 'buildBetaDetails'}
out['derlemeler'] = []
for b in bl['data']:
    pv = pre.get(((b['relationships'].get('preReleaseVersion') or {}).get('data') or {}).get('id'), '?')
    d = det.get(((b['relationships'].get('buildBetaDetail') or {}).get('data') or {}).get('id'), {})
    out['derlemeler'].append([pv, b['attributes']['version'], b['attributes']['processingState'], b['attributes'].get('expired'), d.get('internalBuildState'), d.get('externalBuildState')])
hedef = next((b for b in bl['data'] if (not BNO or b['attributes']['version'] == BNO) and (not SURUM or pre.get(((b['relationships'].get('preReleaseVersion') or {}).get('data') or {}).get('id')) == SURUM)), None)
# gruplar
gr = (api('GET', f'v1/apps/{AID}/betaGroups?limit=20&fields[betaGroups]=name,isInternalGroup,hasAccessToAllBuilds') or {}).get('data', [])
out['gruplar'] = []
for g in gr:
    ts = (api('GET', f"v1/betaGroups/{g['id']}/betaTesters?limit=50&fields[betaTesters]=email,state") or {}).get('data', [])
    out['gruplar'].append({'ad': g['attributes']['name'], 'ic': g['attributes']['isInternalGroup'], 'tum_derlemeler': g['attributes'].get('hasAccessToAllBuilds'),
                           'testciler': [[t['attributes'].get('email'), t['attributes'].get('state')] for t in ts]})
ic = next((g for g in gr if g['attributes']['isInternalGroup']), None)
if not ic:
    r = api('POST', 'v1/betaGroups', {'data': {'type': 'betaGroups', 'attributes': {'name': 'Mr. Anduv! Testçiler', 'isInternalGroup': True, 'hasAccessToAllBuilds': True}, 'relationships': {'app': {'data': {'type': 'apps', 'id': AID}}}}})
    if r: ic = r['data']; ok('iç test grubu açıldı (bütün derlemeler)')
if ic and not ic['attributes'].get('hasAccessToAllBuilds'):
    if api('PATCH', f"v1/betaGroups/{ic['id']}", {'data': {'type': 'betaGroups', 'id': ic['id'], 'attributes': {'hasAccessToAllBuilds': True}}}) is not None: ok('iç grup: bundan sonra her derleme kendiliğinden gelir')
if ic and hedef:
    if api('POST', f"v1/betaGroups/{ic['id']}/relationships/builds", {'data': [{'type': 'builds', 'id': hedef['id']}]}) is not None: ok(f"derleme {hedef['attributes']['version']} iç gruba eklendi")
if ic and TESTCILER:
    var = {t[0] for g in out['gruplar'] if g['ic'] for t in g['testciler']}
    for e in TESTCILER:
        if e in var: continue
        # iç testçi: hesapta kullanıcı olmalı; betaTesters ile gruba eklenir
        r = api('POST', 'v1/betaTesters', {'data': {'type': 'betaTesters', 'attributes': {'email': e}, 'relationships': {'betaGroups': {'data': [{'type': 'betaGroups', 'id': ic['id']}]}}}})
        if r is not None: ok(f'iç testçi eklendi: {e}')
out['hatalar'] = log
json.dump(out, open('durum.json', 'w'), ensure_ascii=False, indent=1); print(json.dumps(out, ensure_ascii=False))
