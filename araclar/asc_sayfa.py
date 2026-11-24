# Nutuk Salonu — App Store sayfasını hazırlar (CI). İncelemeye GÖNDERMEZ: "Add for Review / Submit" Emre'nin.
# Ne yapar: düzenlenebilir iOS sürümünün numarasını SURUM yapar, derlemeyi bağlar (BUILD_NO ya da o sürümün en yeni derlemesi),
# uygulama adını her dilde "Nutuk Salonu" yapar (eski adı Nutuk Akışı), alt başlık/gizlilik, açıklama/anahtar kelime/tanıtım/destek
# (TR + EN), ekran görüntüleri (iPhone 6.9" + iPad 13", store/appstore/ekran), inceleme notu ve telif satırını yazar.
# İçerik hakları beyanı gibi yasal beyanlara dokunmaz, yalnız durumunu raporlar. Sonuç: durum.json
import jwt, time, json, os, glob, hashlib, urllib.request, urllib.error
KID = os.environ['ASC_KEY_ID']; ISS = os.environ['ASC_ISSUER_ID']; BUNDLE = os.environ.get('BUNDLE', 'com.anduv.nutukakisi')
SURUM = os.environ['SURUM']; BNO = os.environ.get('BUILD_NO', '').strip(); EKRAN = os.environ.get('EKRAN', '1') == '1'
KEY = open(os.path.expanduser(f'~/private_keys/AuthKey_{KID}.p8')).read()
M = json.load(open('store/appstore/metin.json', encoding='utf-8'))
log = []; out = {'adimlar': []}
def ok(s): out['adimlar'].append(s); print(s)
def tok(): return jwt.encode({'iss': ISS, 'exp': int(time.time()) + 900, 'aud': 'appstoreconnect-v1'}, KEY, algorithm='ES256', headers={'kid': KID})
def api(m, p, b=None):
    r = urllib.request.Request('https://api.appstoreconnect.apple.com/' + p, method=m, data=json.dumps(b).encode() if b is not None else None,
                               headers={'Authorization': 'Bearer ' + tok(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(r) as f: t = f.read(); return json.loads(t) if t else {}
    except urllib.error.HTTPError as e: log.append(f'{m} {p.split("?")[0]} -> {e.code} {e.read().decode()[:700]}'); return None
def dil(loc): return M['tr'] if loc.startswith('tr') else M['en']
def yaz():
    out['hatalar'] = log; json.dump(out, open('durum.json', 'w'), ensure_ascii=False, indent=1); print(json.dumps(out, ensure_ascii=False)[:4000])

APP = api('GET', f'v1/apps?filter[bundleId]={BUNDLE}')['data'][0]; AID = APP['id']; out['uygulama'] = APP['attributes']['name']
vs = api('GET', f'v1/apps/{AID}/appStoreVersions?filter[platform]=IOS&limit=10')['data']
out['surumler'] = [[x['attributes']['versionString'], x['attributes']['appStoreState']] for x in vs]
DUZ = ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY')
v = next((x for x in vs if x['attributes']['appStoreState'] in DUZ), None)
if not v:
    if any(x['attributes']['appStoreState'] in ('WAITING_FOR_REVIEW', 'IN_REVIEW') for x in vs):
        log.append('bir sürüm incelemede; dokunulmadı'); yaz(); raise SystemExit(0)
    r = api('POST', 'v1/appStoreVersions', {'data': {'type': 'appStoreVersions', 'attributes': {'platform': 'IOS', 'versionString': SURUM}, 'relationships': {'app': {'data': {'type': 'apps', 'id': AID}}}}})
    v = r['data'] if r else None
    if not v: yaz(); raise SystemExit(1)
VID = v['id']
if v['attributes']['versionString'] != SURUM:
    if api('PATCH', f'v1/appStoreVersions/{VID}', {'data': {'type': 'appStoreVersions', 'id': VID, 'attributes': {'versionString': SURUM}}}) is not None: ok(f"sürüm {v['attributes']['versionString']} → {SURUM}")
api('PATCH', f'v1/appStoreVersions/{VID}', {'data': {'type': 'appStoreVersions', 'id': VID, 'attributes': {'copyright': M['telif']}}})

# derleme bağla
q = f'v1/builds?filter[app]={AID}&filter[preReleaseVersion.version]={SURUM}&sort=-uploadedDate&limit=20&fields[builds]=version,processingState,uploadedDate'
bl = (api('GET', q) or {}).get('data', [])
out['derlemeler'] = [[b['attributes']['version'], b['attributes']['processingState']] for b in bl]
b = next((x for x in bl if (not BNO or x['attributes']['version'] == BNO) and x['attributes']['processingState'] == 'VALID'), None)
if b:
    if api('PATCH', f'v1/appStoreVersions/{VID}/relationships/build', {'data': {'type': 'builds', 'id': b['id']}}) is not None: ok(f"derleme bağlandı: {SURUM} ({b['attributes']['version']})")
    api('PATCH', f"v1/builds/{b['id']}", {'data': {'type': 'builds', 'id': b['id'], 'attributes': {'usesNonExemptEncryption': False}}})
else: log.append(f'{SURUM} için işlenmiş derleme yok (BUILD_NO={BNO or "en yeni"})')

# uygulama bilgisi: ad (Nutuk Salonu), alt başlık, gizlilik — TR + EN
infos = api('GET', f'v1/apps/{AID}/appInfos')['data']
info = next((i for i in infos if i['attributes'].get('appStoreState') not in ('READY_FOR_SALE',) and i['attributes'].get('state') not in ('READY_FOR_DISTRIBUTION',)), infos[0])
ils = api('GET', f'v1/appInfos/{info["id"]}/appInfoLocalizations')['data']
if not any(l['attributes']['locale'].startswith('en') for l in ils):
    r = api('POST', 'v1/appInfoLocalizations', {'data': {'type': 'appInfoLocalizations', 'attributes': {'locale': 'en-US', 'name': M['en']['name'], 'subtitle': M['en']['subtitle'], 'privacyPolicyUrl': M['gizlilik']}, 'relationships': {'appInfo': {'data': {'type': 'appInfos', 'id': info['id']}}}}})
    if r: ils.append(r['data']); ok('İngilizce sayfa (uygulama bilgisi) açıldı')
for l in ils:
    d = dil(l['attributes']['locale'])
    if api('PATCH', f'v1/appInfoLocalizations/{l["id"]}', {'data': {'type': 'appInfoLocalizations', 'id': l['id'], 'attributes': {'name': d['name'], 'subtitle': d['subtitle'], 'privacyPolicyUrl': M['gizlilik']}}}) is not None:
        ok(f"ad/alt başlık {l['attributes']['locale']}: {d['name']} · {d['subtitle']}")
# kategori, yaş, içerik hakları (yalnız rapor)
out['icerik_haklari'] = APP['attributes'].get('contentRightsDeclaration')
pc = api('GET', f'v1/appInfos/{info["id"]}/primaryCategory'); out['kategori'] = pc and pc.get('data') and pc['data']['id']

# sürüm metinleri
locs = api('GET', f'v1/appStoreVersions/{VID}/appStoreVersionLocalizations')['data']
if not any(l['attributes']['locale'].startswith('en') for l in locs):
    r = api('POST', 'v1/appStoreVersionLocalizations', {'data': {'type': 'appStoreVersionLocalizations', 'attributes': {'locale': 'en-US', 'description': M['en']['description'], 'keywords': M['en']['keywords']}, 'relationships': {'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': VID}}}}})
    if r: locs.append(r['data']); ok('İngilizce sayfa (sürüm) açıldı')
for l in locs:
    d = dil(l['attributes']['locale'])
    a = {'description': d['description'], 'keywords': d['keywords'], 'promotionalText': d['promotionalText'], 'supportUrl': M['destek']}
    if api('PATCH', f'v1/appStoreVersionLocalizations/{l["id"]}', {'data': {'type': 'appStoreVersionLocalizations', 'id': l['id'], 'attributes': a}}) is not None: ok('metin ' + l['attributes']['locale'])

# ekran görüntüleri
def yukle(SID, files):
    n = 0
    for f in files:
        bb = open(f, 'rb').read()
        r = api('POST', 'v1/appScreenshots', {'data': {'type': 'appScreenshots', 'attributes': {'fileName': os.path.basename(f), 'fileSize': len(bb)}, 'relationships': {'appScreenshotSet': {'data': {'type': 'appScreenshotSets', 'id': SID}}}}})
        if not r: continue
        sid = r['data']['id']
        for op in r['data']['attributes']['uploadOperations']:
            qq = urllib.request.Request(op['url'], method=op['method'], data=bb[op['offset']:op['offset'] + op['length']], headers={h['name']: h['value'] for h in op['requestHeaders']})
            urllib.request.urlopen(qq).read()
        if api('PATCH', f'v1/appScreenshots/{sid}', {'data': {'type': 'appScreenshots', 'id': sid, 'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(bb).hexdigest()}}}) is not None: n += 1
    return n
if EKRAN:
    HEDEF = {'APP_IPHONE_67': 'iphone', 'APP_IPAD_PRO_3GEN_129': 'ipad'}
    for l in locs:
        lc = 'tr' if l['attributes']['locale'].startswith('tr') else 'en'
        sets = api('GET', f'v1/appStoreVersionLocalizations/{l["id"]}/appScreenshotSets?limit=50')['data']
        for s in sets:   # eski "Nutuk Akışı" görselleri temizlenir; küçük boyutlar 6.9"/13" görsellerinden ölçeklenir
            for sc in api('GET', f'v1/appScreenshotSets/{s["id"]}/appScreenshots?limit=50')['data']: api('DELETE', f'v1/appScreenshots/{sc["id"]}')
            if s['attributes']['screenshotDisplayType'] not in HEDEF: api('DELETE', f'v1/appScreenshotSets/{s["id"]}')
        var = {s['attributes']['screenshotDisplayType']: s['id'] for s in sets}
        for disp, on in HEDEF.items():
            SID = var.get(disp)
            if not SID:
                r = api('POST', 'v1/appScreenshotSets', {'data': {'type': 'appScreenshotSets', 'attributes': {'screenshotDisplayType': disp}, 'relationships': {'appStoreVersionLocalization': {'data': {'type': 'appStoreVersionLocalizations', 'id': l['id']}}}}})
                if not r: continue
                SID = r['data']['id']
            ok(f"{l['attributes']['locale']} {on}: {yukle(SID, sorted(glob.glob(f'store/appstore/ekran/{on}-{lc}-*.png')))} görsel")
    time.sleep(25); dur = {}
    for l in locs:
        for s in api('GET', f'v1/appStoreVersionLocalizations/{l["id"]}/appScreenshotSets?limit=50')['data']:
            for sc in api('GET', f'v1/appScreenshotSets/{s["id"]}/appScreenshots?limit=50')['data']:
                st = (sc['attributes'].get('assetDeliveryState') or {}).get('state'); dur[st] = dur.get(st, 0) + 1
    out['gorsel_durum'] = dur

# inceleme notu
rd = api('GET', f'v1/appStoreVersions/{VID}/appStoreReviewDetail')
at = {'notes': M['inceleme_notu'], 'demoAccountRequired': False}
if rd and rd.get('data'): r = api('PATCH', f"v1/appStoreReviewDetails/{rd['data']['id']}", {'data': {'type': 'appStoreReviewDetails', 'id': rd['data']['id'], 'attributes': at}})
else: r = api('POST', 'v1/appStoreReviewDetails', {'data': {'type': 'appStoreReviewDetails', 'attributes': at, 'relationships': {'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': VID}}}}})
if r is not None:
    ok('inceleme notu')
    ra = r['data']['attributes']; out['inceleme_iletisim'] = {k: bool(ra.get(k)) for k in ('contactFirstName', 'contactLastName', 'contactPhone', 'contactEmail')}
out['surum'] = [SURUM, (api('GET', f'v1/appStoreVersions/{VID}') or {}).get('data', {}).get('attributes', {}).get('appStoreState')]
yaz()
