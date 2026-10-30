#!/usr/bin/env python3
"""Nutuk Akışı — yerel veri servisi.

Fırsat, Borsa, Futbol ve Sümer Akışı ile aynı mantık: Python 3 dışında kurulum gerekmez.
  python3 server.py            → http://127.0.0.1:8769  (yayın: /?yayin=1)
  python3 server.py --demo     → internetsiz önizleme; ekranda "DEMO" yazar

Metinler   : data/metinler.json — yayının omurgası (Nutuk bölümleri, söylevler, Gençliğe Hitabe…).
             Özgün satırlar {"o": …, "s": …} biçiminde: Atatürk'ün sözü + bugünün Türkçesiyle karşılığı.
             Dosyayı VS Code'da değiştirip kaydetmek yeter; sunucu değişikliği kendisi görür.
Vikikaynak : tr.wikisource.org — Atatürk'ün eserleri kamu malıdır. Her metnin özgün satırları Vikikaynak'taki
             tam metinle karşılaştırılır (✓ "kaynakla eşleşti" rozeti) ve saatte bir rastgele bir Nutuk sayfası çekilir.
Wikipedia  : metin ve kadro sayfalarının özeti + görseli (günde bir) · "Tarihte bugün" (günün sayfası, günde bir).
Gündem     : data/kaynaklar.json (Atatürk/Cumhuriyet tarihi haberleri, 30 dk) · data/esler.json ("Bugün ve Gazi", 20 dk).
             Siyaset, ölüm, kaza ve şiddet içeren başlıklar asla eşleşmez: yayın tarafsız kalır.
Etkileşim  : /panel.html (isim, oylama, sahne) + isteğe bağlı YouTube canlı sohbeti (data/ayarlar.json).
API        : /api/corpus · /api/news · /api/canli · /api/refresh · POST /api/isim · /api/oylama · /api/oy · /api/komut
"""
import json, os, re, sys, time, threading, html, hashlib, gzip, unicodedata, random
import urllib.request, urllib.parse, urllib.robotparser, urllib.error
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(ROOT, "www")
DATA = os.path.join(ROOT, "data")
CACHE = os.path.join(DATA, "cache.json")
PORT = int(os.environ.get("NUTUK_PORT", "8769"))
DEMO = "--demo" in sys.argv or os.environ.get("NUTUK_DEMO") == "1"
IST = timezone(timedelta(hours=3))
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36 NutukAkisi/1.0"
WIKI_UA = "NutukAkisi/1.0 (yerel yayin uygulamasi; Python urllib)"
BOT = "NutukAkisi"
DAY = 86400
WS_API = "https://tr.wikisource.org/w/api.php"
WP_API = "https://tr.wikipedia.org/w/api.php"
AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]

LOCK = threading.Lock()
STATE = {"wiki": {}, "vk": {}, "news": [], "newsUpdated": None, "enrichUpdated": None, "health": [], "esle": [], "esleHealth": [],
         "sayfa": [], "bugun": None}
TAG = re.compile(r"<[^>]+>")


def log(*a):
    print(datetime.now(IST).strftime("%H:%M:%S"), *a, flush=True)


def tr_lower(s):
    return s.replace("I", "ı").replace("İ", "i").lower()


def plain(s):
    s = tr_lower(s or "").replace("ı", "i")
    s = unicodedata.normalize("NFKD", s)
    return re.sub(r"\s+", " ", "".join(c for c in s if not unicodedata.combining(c))).strip()


def letters(s):
    """Karşılaştırma için: yalnız harf ve rakam (şapka, noktalama, tırnak, boşluk farkları önemsiz)."""
    return re.sub(r"[^a-z0-9]", "", plain(s))


# ───────────────────────── veri dosyaları (kaydedince kendiliğinden yenilenir) ─────────────────────────
_files = {}


def data(name):
    path = os.path.join(DATA, name)
    try:
        mt = os.path.getmtime(path)
    except OSError:
        return {}
    hit = _files.get(name)
    if hit and hit[0] == mt:
        return hit[1]
    try:
        obj = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        log(f"⚠️  {name} okunamadı (JSON hatası?): {e}")
        return hit[1] if hit else {}
    if hit:
        log(f"↻ {name} yeniden yüklendi")
    _files[name] = (mt, obj)
    return obj


def metinler():
    return data("metinler.json").get("metinler", [])


def kadro():
    return data("kadro.json").get("kadro", [])


def originals(m):
    return [s["o"] for s in m.get("satirlar", []) if isinstance(s, dict) and s.get("o")]


# ───────────────────────── http yardımcıları ─────────────────────────
def get(url, timeout=15, ua=UA):
    req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": "*/*", "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8", "Accept-Encoding": "gzip"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
        return gzip.decompress(raw) if r.headers.get("Content-Encoding") == "gzip" else raw


def api(base, **params):
    params.setdefault("format", "json")
    params.setdefault("formatversion", "2")
    return json.loads(get(base + "?" + urllib.parse.urlencode(params), 20, WIKI_UA).decode("utf-8", "ignore"))


_robots = {}


def robots_ok(url):
    p = urllib.parse.urlparse(url)
    base = f"{p.scheme}://{p.netloc}"
    if base not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        try:
            rp.parse(get(base + "/robots.txt", 8).decode("utf-8", "ignore").splitlines())
        except Exception:
            rp = None  # robots.txt okunamazsa standart gereği izin var sayılır
        _robots[base] = rp
    rp = _robots[base]
    return True if rp is None else rp.can_fetch(BOT, url)


def clip(s, n):
    s = re.sub(r"\s+", " ", s or "").strip()
    if len(s) <= n:
        return s
    cut = s[:n]
    dot = max(cut.rfind(". "), cut.rfind("; "))
    return (cut[:dot + 1] if dot > n * 0.55 else cut.rsplit(" ", 1)[0] + "…").strip()


# ───────────────────────── Wikipedia özetleri ─────────────────────────
def wiki_one(spec):
    for lang in ("tr", "en"):
        title = (spec or {}).get(lang)
        if not title:
            continue
        url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title.replace(' ', '_'), safe='')}"
        try:
            j = json.loads(get(url, 12, WIKI_UA).decode("utf-8", "ignore"))
        except Exception:
            continue
        if j.get("type") == "disambiguation" or not j.get("extract"):
            continue
        thumb = (j.get("thumbnail") or {}).get("source") or ""
        return {"ok": True, "lang": lang, "title": j.get("title") or title, "extract": clip(j.get("extract"), 420),
                "thumb": thumb, "url": ((j.get("content_urls") or {}).get("desktop") or {}).get("page", ""), "t": time.time()}
    return {"ok": False, "t": time.time()}


# ───────────────────────── Vikikaynak (tr.wikisource.org) ─────────────────────────
def vk_url(title):
    return "https://tr.wikisource.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"))


def vk_search(q, n=5):
    j = api(WS_API, action="query", list="search", srsearch=q, srnamespace=0, srlimit=n)
    return [x["title"] for x in (j.get("query") or {}).get("search", [])]


def vk_paragraphs(title):
    j = api(WS_API, action="parse", page=title, prop="text", redirects=1, disablelimitreport=1)
    raw = (j.get("parse") or {}).get("text") or ""
    if isinstance(raw, dict):
        raw = raw.get("*", "")
    raw = re.sub(r"(?is)<(script|style|table)\b.*?</\1>", " ", raw)
    out = []
    for blk in re.split(r"(?i)</p>|<br\s*/?>\s*<br\s*/?>|</dd>|</li>", raw):
        t = re.sub(r"\s+", " ", html.unescape(TAG.sub(" ", blk))).strip()
        t = re.sub(r"\[\s*\d+\s*\]", "", t).strip()
        if t:
            out.append(t)
    return (j.get("parse") or {}).get("title") or title, out


def phrase(line, words=6):
    """Aramada kullanılacak ayırt edici parça: satırın ortasından birkaç kelime (noktalamasız)."""
    w = [x for x in re.split(r"[\s,;:!?.\"'“”‘’()]+", line) if x]
    if len(w) <= words:
        return " ".join(w)
    k = max(0, (len(w) - words) // 2)
    return " ".join(w[k:k + words])


def vk_one(m):
    """Bir metnin özgün satırlarını Vikikaynak'taki tam metinle karşılaştırır."""
    O = originals(m)
    out = {"ok": False, "t": time.time(), "esles": 0, "toplam": len(O), "satir": []}
    tries = [f'"{phrase(line)}"' for line in sorted(O, key=len, reverse=True)[:2]]
    if m.get("vk"):
        tries.append(m["vk"])
    seen = set()
    try:
        for q in tries:
            for title in vk_search(q, 3):
                if title in seen:
                    continue
                seen.add(title)
                real, paras = vk_paragraphs(title)
                body = letters(" ".join(paras))
                if not body:
                    continue
                flags = [bool(letters(o)) and letters(o) in body for o in O]
                if O and any(flags):
                    out.update(ok=True, title=real, url=vk_url(real), esles=sum(flags), satir=flags)
                    return out
                if not out.get("url") and q == m.get("vk"):
                    out.update(title=real, url=vk_url(real))  # eşleşme yoksa en azından okuma bağlantısı
                if len(seen) >= 5:
                    return out
    except Exception as e:
        out["err"] = type(e).__name__
    return out


def refresh_sayfa():
    """Saatte bir: Vikikaynak'tan rastgele bir Nutuk sayfası ve oradan okunabilir bir paragraf."""
    titles = []
    try:
        j = api(WS_API, action="query", list="prefixsearch", pssearch="Nutuk", pslimit=60, psnamespace=0)
        titles = [x["title"] for x in (j.get("query") or {}).get("prefixsearch", [])]
    except Exception:
        pass
    if len(titles) < 3:
        try:
            titles += vk_search('"Efendiler" Nutuk', 20)
        except Exception:
            pass
    random.shuffle(titles)
    for title in titles[:6]:
        try:
            real, paras = vk_paragraphs(title)
        except Exception:
            continue
        good = [p for p in paras if 220 <= len(p) <= 900 and not re.search(r"(?i)vikikaynak|lisans|kategori|düzenle|bu sayfa", p)]
        if not good:
            continue
        pref = [p for p in good if re.search(r"Efendiler|Arkadaşlar|Millet", p)] or good
        para = random.choice(pref)
        it = {"id": hashlib.sha1((real + para[:40]).encode()).hexdigest()[:10], "title": real, "url": vk_url(real), "para": para, "t": time.time()}
        with LOCK:
            STATE["sayfa"] = ([it] + [x for x in STATE["sayfa"] if x["id"] != it["id"]])[:10]
        log(f"Vikikaynak: rastgele sayfa · {real}")
        save_cache()
        return
    log("Vikikaynak: rastgele sayfa bulunamadı (bağlantı ya da sayfa yapısı)")


# ───────────────────────── Tarihte bugün (tr.wikipedia günün sayfası) ─────────────────────────
WIKILINK = re.compile(r"\[\[(?:[^\]|]*\|)?([^\]]+)\]\]")


def unwiki(s):
    s = re.sub(r"<ref[^>]*/>|<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    s = WIKILINK.sub(r"\1", s)
    s = re.sub(r"'{2,}", "", s)
    return re.sub(r"\s+", " ", html.unescape(TAG.sub("", s))).strip(" -–—:")


def parse_bugun(wt):
    sec, items = "", []
    for ln in wt.splitlines():
        h = re.match(r"^==\s*([^=].*?)\s*==\s*$", ln)
        if h:
            sec = plain(h.group(1))
            continue
        m = re.match(r"^\*\s*\[?\[?(\d{3,4})\]?\]?\s*[-–—:]\s*(.+)$", ln)
        if not m:
            continue
        y, txt = int(m.group(1)), unwiki(m.group(2))
        kind = "olay" if "olay" in sec else "dogum" if "dogum" in sec else "olum" if "olum" in sec else ""
        if not txt or not kind:
            continue
        named = re.search(r"(?i)atatürk|mustafa kemal", txt)
        if named or (1881 <= y <= 1953 and kind == "olay"):
            items.append({"yil": y, "metin": clip(txt, 200), "tur": kind, "ozel": bool(named)})
    return items


def refresh_bugun():
    now = datetime.now(IST)
    page = f"{now.day} {AYLAR[now.month - 1]}"
    j = api(WP_API, action="parse", page=page, prop="wikitext", redirects=1)
    wt = (j.get("parse") or {}).get("wikitext") or ""
    if isinstance(wt, dict):
        wt = wt.get("*", "")
    items = parse_bugun(wt)
    with LOCK:
        STATE["bugun"] = {"gun": now.strftime("%m-%d"), "sayfa": page, "url": "https://tr.wikipedia.org/wiki/" + urllib.parse.quote(page.replace(" ", "_")),
                          "items": items[:14], "t": time.time()}
    log(f"Tarihte bugün ({page}): {len(items)} ilgili satır")
    save_cache()


def refresh_enrich(force=False):
    now = time.time()
    with LOCK:
        wiki, vk = dict(STATE["wiki"]), dict(STATE["vk"])
    jobs = []
    for m in metinler():
        if m.get("wiki") and (force or now - wiki.get("m:" + m["id"], {}).get("t", 0) > DAY):
            jobs.append(("wiki", "m:" + m["id"], m["wiki"]))
        if (originals(m) or m.get("vk")) and (force or now - vk.get(m["id"], {}).get("t", 0) > DAY):
            jobs.append(("vk", m["id"], m))
    for k in kadro():
        if k.get("wiki") and (force or now - wiki.get("k:" + k["id"], {}).get("t", 0) > DAY):
            jobs.append(("wiki", "k:" + k["id"], k["wiki"]))
    if not jobs:
        return

    def one(job):
        kind, key, arg = job
        return kind, key, (wiki_one(arg) if kind == "wiki" else vk_one(arg))
    with ThreadPoolExecutor(max_workers=3) as ex:  # kaynakları yormamak için az iş parçacığı
        res = list(ex.map(one, jobs))
    with LOCK:
        for kind, key, val in res:
            STATE[kind][key] = val
        STATE["enrichUpdated"] = time.time()
    ok_w = sum(1 for k, _, v in res if k == "wiki" and v.get("ok"))
    vks = [v for k, _, v in res if k == "vk"]
    log(f"Wikipedia: {ok_w}/{sum(1 for k, *_ in res if k == 'wiki')} sayfa · Vikikaynak: {sum(1 for v in vks if v.get('ok'))}/{len(vks)} metin, "
        f"{sum(v.get('esles', 0) for v in vks)}/{sum(v.get('toplam', 0) for v in vks)} özgün satır eşleşti")
    save_cache()


# ───────────────────────── gündem haberleri ─────────────────────────
TR_MON = {"oca": 1, "şub": 2, "sub": 2, "mar": 3, "nis": 4, "may": 5, "haz": 6, "tem": 7, "ağu": 8, "agu": 8, "eyl": 9, "eki": 10, "kas": 11, "ara": 12}


def parse_when(when):
    when = (when or "").strip()
    if not when:
        return None
    try:
        return parsedate_to_datetime(when).timestamp()
    except Exception:
        pass
    try:
        return datetime.fromisoformat(when.replace("Z", "+00:00")).timestamp()
    except Exception:
        pass
    m = re.match(r"(\d{1,2})\s+(\w{3})\w*\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?", when)
    if m and tr_lower(m.group(2))[:3] in TR_MON:
        return datetime(int(m.group(3)), TR_MON[tr_lower(m.group(2))[:3]], int(m.group(1)), int(m.group(4) or 0), int(m.group(5) or 0), tzinfo=IST).timestamp()
    return None


def child(item, *names):
    for el in item:
        if el.tag.split("}")[-1].lower() in names and (el.text or "").strip():
            return el.text.strip()
    return ""


def feed_items(raw):
    try:
        root = ET.fromstring(raw)
        items = root.findall(".//item") or [e for e in root.iter() if e.tag.split("}")[-1] == "entry"]
        out = []
        for it in items:
            link = child(it, "link")
            if not link:
                for el in it:
                    if el.tag.split("}")[-1] == "link" and el.get("href"):
                        link = el.get("href")
            out.append({"title": child(it, "title"), "link": link, "desc": child(it, "description", "summary"),
                        "when": child(it, "pubdate", "published", "updated", "date")})
        return out
    except ET.ParseError:
        pass
    text = raw.decode("utf-8", "ignore")
    out = []
    for blk in re.findall(r"<item\b.*?</item>|<entry\b.*?</entry>", text, re.S):
        def tag(n):
            m = re.search(rf"<{n}\b[^>]*>(.*?)</{n}>", blk, re.S | re.I)
            v = m.group(1) if m else ""
            return re.sub(r"^<!\[CDATA\[|\]\]>$", "", v.strip()).strip()
        link = tag("link")
        if not link:
            m = re.search(r'<link[^>]+href="([^"]+)"', blk)
            link = m.group(1) if m else ""
        out.append({"title": tag("title"), "link": link, "desc": tag("description") or tag("summary"), "when": tag("pubDate") or tag("published") or tag("updated")})
    return out


def kw_regex(k):
    k = re.escape(plain(k))
    if len(k) <= 4:  # kısa kelimeler: yalnız kelimenin kendisi + Türkçe hal ekleri
        return rf"\b{k}(?:'?(?:de|da|den|dan|e|a|i|ı|in|ın|le|la|ler|lar|leri|ları|ne|na|ye|ya))?\b"
    return rf"\b{k}"


def bad_re():
    return re.compile("|".join(kw_regex(w) for w in data("esler.json").get("hassas", [])) or r"$^", re.I)


def keyword_re():
    keys = data("kaynaklar.json").get("anahtarlar", [])
    return re.compile(r"\b(" + "|".join(re.escape(plain(k)) for k in keys) + r")", re.I) if keys else re.compile(r"$^")


def parse_feed(src, raw, kw, bad=None):
    out = []
    for it in feed_items(raw)[:80]:
        title = html.unescape(TAG.sub("", html.unescape(it["title"]))).strip()
        if not title:
            continue
        desc = re.sub(r"\s+", " ", html.unescape(TAG.sub(" ", html.unescape(it["desc"] or "")))).strip()
        hit = kw.search(plain(f"{title} {desc[:400]}"))
        if not hit or (bad and bad.search(plain(title))):
            continue
        link = html.unescape(it["link"] or "").strip()
        ts = parse_when(it["when"]) or time.time()
        out.append({"id": hashlib.sha1((link or title).encode()).hexdigest()[:12], "title": title,
                    "summary": clip(desc, 300) if desc != title else "", "link": link, "source": src["ad"].split(" · ")[0],
                    "lang": src.get("dil", "tr"), "time": min(ts, time.time()), "key": hit.group(1)})
    return out


def refresh_news():
    srcs = data("kaynaklar.json").get("kaynaklar", [])
    kw, bad = keyword_re(), bad_re()
    items, health = [], []

    def one(src):
        if not robots_ok(src["url"]):
            return src, None, "robots.txt izin vermiyor"
        try:
            return src, parse_feed(src, get(src["url"]), kw, bad), None
        except Exception as e:
            return src, None, type(e).__name__
    with ThreadPoolExecutor(max_workers=6) as ex:
        for src, got, err in ex.map(one, srcs):
            health.append({"name": src["ad"], "ok": got is not None, "count": len(got or []), "err": err, "url": src["url"]})
            items.extend(got or [])
    now, seen, uniq = time.time(), set(), []
    for it in sorted(items, key=lambda x: -x["time"]):
        k = re.sub(r"\W+", "", plain(it["title"]))[:60]
        if k in seen or it["time"] < now - 30 * DAY:
            continue
        seen.add(k)
        uniq.append(it)
    with LOCK:
        if uniq or not STATE["news"]:
            STATE["news"] = uniq[:60]
        STATE["newsUpdated"] = time.time()
        STATE["health"] = health
    log(f"gündem: {len(uniq)} başlık, {sum(h['ok'] for h in health)}/{len(health)} kaynak")
    save_cache()


# ───────────────────────── Bugün ve Gazi (güncel başlık ↔ belgeli bir söz) ─────────────────────────
def refresh_esle():
    E = data("esler.json")
    rules = E.get("kurallar", [])
    if not rules:
        return
    bad = bad_re()
    comp = [(r, re.compile("|".join(kw_regex(k) for k in r["anahtarlar"]), re.I)) for r in rules]
    heads, health = [], []

    def one(src):
        if not robots_ok(src["url"]):
            return src, None, "robots.txt izin vermiyor"
        try:
            out = []
            for it in feed_items(get(src["url"]))[:60]:
                title = html.unescape(TAG.sub("", html.unescape(it["title"]))).strip()
                if title:
                    out.append({"title": title, "link": html.unescape(it["link"] or "").strip(), "source": src["ad"].split(" · ")[0],
                                "time": min(parse_when(it["when"]) or time.time(), time.time())})
            return src, out, None
        except Exception as e:
            return src, None, type(e).__name__
    with ThreadPoolExecutor(max_workers=6) as ex:
        for src, got, err in ex.map(one, E.get("kaynaklar", [])):
            health.append({"name": src["ad"], "ok": got is not None, "count": len(got or []), "err": err})
            heads.extend(got or [])
    now, pairs, used, seen = time.time(), [], set(), set()
    for h in sorted(heads, key=lambda x: -x["time"]):
        p = plain(h["title"])
        if h["time"] < now - 2 * DAY or p in seen or bad.search(p):
            continue
        seen.add(p)
        for i, (r, rx) in enumerate(comp):
            if i in used or not rx.search(p):
                continue
            used.add(i)
            pairs.append({"id": hashlib.sha1((h["link"] or h["title"]).encode()).hexdigest()[:12], "haber": h, "soz": r["soz"],
                          "kaynak": r.get("kaynak", ""), "yil": r.get("yil"), "metin": r.get("metin", ""), "kopru": r.get("kopru", "")})
            break
    with LOCK:
        if pairs or not STATE["esle"]:
            STATE["esle"] = pairs[:10]
        STATE["esleHealth"] = health
    log(f"Bugün ve Gazi: {len(heads)} başlık tarandı, {len(pairs)} eşleşme")


# ───────────────────────── canlı etkileşim: isimler, oylama, komutlar ─────────────────────────
LIVE = {"seq": 0, "isimler": [], "oylama": None, "komut": None, "voters": set(), "yt": {"durum": "kapalı"}}


def name_ok(raw):
    A = data("ayarlar.json").get("isim", {})
    s = re.sub(r"\s+", " ", (raw or "")).strip()
    s = s.split(" ")[0] if s else ""
    s = re.sub(r"[^A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]", "", s)[:int(A.get("enUzun", 16))]
    if len(s) < 2:
        return None
    p = plain(s)
    for w in A.get("yasakli", []):
        w = plain(w)
        if p == w or (len(w) >= 5 and w in p):  # kısa kelimeler yalnız tam eşleşme
            return None
    return s[0].replace("i", "İ").replace("ı", "I").upper() + tr_lower(s[1:])


def add_name(raw, src="panel"):
    s = name_ok(raw)
    if not s:
        return None
    with LOCK:
        LIVE["seq"] += 1
        it = {"id": LIVE["seq"], "ad": s, "kaynak": src, "t": time.time()}
        LIVE["isimler"] = (LIVE["isimler"] + [it])[-60:]
    log(f"✍️  isim: {s} ({src})")
    return it


def start_poll(options, secs):
    with LOCK:
        P = LIVE["oylama"]
        if P and P["bitis"] > time.time():
            return P
        LIVE["seq"] += 1
        LIVE["oylama"] = {"id": LIVE["seq"], "secenekler": options[:3], "oy": [0] * len(options[:3]),
                          "bitis": time.time() + max(30, min(600, secs)), "kazanan": None}
        LIVE["voters"] = set()
        return LIVE["oylama"]


def vote(i, who=None):
    with LOCK:
        P = LIVE["oylama"]
        if not P or P["bitis"] < time.time() or not (0 <= i < len(P["oy"])):
            return False
        if who:
            if who in LIVE["voters"]:
                return False
            LIVE["voters"].add(who)
        P["oy"][i] += 1
        return True


def live_payload():
    with LOCK:
        P = dict(LIVE["oylama"]) if LIVE["oylama"] else None
        if P:
            P["kalan"] = max(0, P["bitis"] - time.time())
            if P["kalan"] == 0 and P["oy"]:
                P["kazanan"] = max(range(len(P["oy"])), key=lambda k: (P["oy"][k], -k))
        return {"isimler": LIVE["isimler"][-30:], "oylama": P, "komut": LIVE["komut"], "yt": LIVE["yt"], "now": time.time()}


def youtube_loop():
    # API anahtarı ve video kimliği: data/ayarlar.yerel.json (git'e girmez) varsa oradan, yoksa data/ayarlar.json'dan
    Y = {**data("ayarlar.json").get("youtube", {}), **data("ayarlar.yerel.json").get("youtube", {})}
    key, vid = (Y.get("apiKey") or "").strip(), (Y.get("videoId") or "").strip()
    if not key or not vid:
        LIVE["yt"] = {"durum": "kapalı", "not": "data/ayarlar.json'a apiKey ve videoId yazılmadı"}
        return
    yt = "https://www.googleapis.com/youtube/v3"
    C = data("ayarlar.json").get("komutlar", {})
    cmd_name = [c.lower() for c in C.get("isim", ["!isim"])]
    cmd_vote = [c.lower() for c in C.get("oy", ["!oy"])]
    chat, token = None, None
    while True:
        wait = max(10, int(Y.get("yoklamaSaniye", 20)))
        try:
            if not chat:
                j = json.loads(get(f"{yt}/videos?part=liveStreamingDetails&id={urllib.parse.quote(vid)}&key={urllib.parse.quote(key)}").decode())
                chat = (((j.get("items") or [{}])[0]).get("liveStreamingDetails") or {}).get("activeLiveChatId")
                if not chat:
                    LIVE["yt"] = {"durum": "bekliyor", "not": "Yayın canlı değil ya da sohbet kapalı"}
                    time.sleep(60)
                    continue
                LIVE["yt"] = {"durum": "bağlı", "not": "Sohbet okunuyor"}
            q = f"{yt}/liveChat/messages?liveChatId={urllib.parse.quote(chat)}&part=snippet,authorDetails&maxResults=200&key={urllib.parse.quote(key)}"
            if token:
                q += f"&pageToken={urllib.parse.quote(token)}"
            j = json.loads(get(q).decode())
            first = token is None
            token = j.get("nextPageToken")
            wait = max(wait, int(j.get("pollingIntervalMillis", 0)) / 1000)
            if not first:  # bağlanmadan önceki eski mesajları atla
                for m in j.get("items", []):
                    txt = ((m.get("snippet") or {}).get("displayMessage") or "").strip()
                    who = (m.get("authorDetails") or {}).get("channelId")
                    low = tr_lower(txt)
                    for c in cmd_name:
                        if low.startswith(c + " "):
                            add_name(txt[len(c):], "youtube")
                    m2 = re.match(r"^!(?:oy\s*)?([1-3])\b", low) or next((re.match(rf"^{re.escape(c)}\s*([1-3])\b", low) for c in cmd_vote if low.startswith(c)), None)
                    if m2:
                        vote(int(m2.group(1)) - 1, who)
            LIVE["yt"]["son"] = time.time()
        except urllib.error.HTTPError as e:
            LIVE["yt"] = {"durum": "hata", "not": f"YouTube API {e.code}: anahtar/izin/kota sorunu olabilir (bkz. README)"}
            chat, token = None, None
            time.sleep(120)
            continue
        except Exception as e:
            LIVE["yt"] = {"durum": "hata", "not": type(e).__name__}
            time.sleep(60)
            continue
        time.sleep(wait)


def ses_list():
    d = os.path.join(WWW, "ses")
    try:
        return sorted(f for f in os.listdir(d) if f.lower().endswith((".mp3", ".m4a", ".ogg", ".wav")))
    except OSError:
        return []


# ───────────────────────── demo (internetsiz) ─────────────────────────
def demo_seed():
    now = time.time()
    STATE["news"] = [
        {"id": "demo1", "title": "DEMO · Anıtkabir'de Kurtuluş Savaşı belgelerinden oluşan yeni bir sergi açıldı", "summary": "Örnek başlık: bu haber gerçek değildir, ekran düzenini göstermek içindir.", "link": "", "source": "DEMO", "lang": "tr", "time": now - 3600, "key": "anıtkabir"},
        {"id": "demo2", "title": "DEMO · Nutuk'un 1927 baskısı müzede ziyarete açıldı", "summary": "Örnek başlık: gerçek haberler canlı modda gündem kaynaklarından gelir.", "link": "", "source": "DEMO", "lang": "tr", "time": now - 7200, "key": "nutuk"},
    ]
    STATE["newsUpdated"] = now
    STATE["health"] = [{"name": "DEMO", "ok": True, "count": 2, "err": None, "url": ""}]
    R = data("esler.json").get("kurallar", [])
    pick = lambda r: {k: r.get(k) for k in ("soz", "kaynak", "yil", "metin", "kopru")}
    STATE["esle"] = [
        {"id": "dm1", "haber": {"title": "DEMO · Yeni eğitim yılında milyonlarca öğrenci ders başı yaptı", "link": "", "source": "DEMO", "time": now - 1800}, **pick(R[0])},
        {"id": "dm2", "haber": {"title": "DEMO · Sanayi üretimi ve ihracat yılın zirvesinde", "link": "", "source": "DEMO", "time": now - 5400}, **pick(R[2])},
    ] if len(R) > 2 else []
    STATE["sayfa"] = [{"id": "demo", "title": "Nutuk (DEMO · yerel örnek)", "url": "", "t": now,
                       "para": "Canlı modda burada Vikikaynak'taki Nutuk tam metninden rastgele seçilmiş özgün bir paragraf görünür. "
                               "Örnek: Efendiler, bu vaziyet karşısında bir tek karar vardı. O da hakimiyet-i milliyeye müstenit, bilakaydüşart müstakil yeni bir Türk devleti tesis etmek!"}]
    for i, ad in enumerate(["Emre", "Ayşe", "Mehmet", "Zeynep"]):
        LIVE["seq"] += 1
        LIVE["isimler"].append({"id": LIVE["seq"], "ad": ad, "kaynak": "demo", "t": now - 600 + i * 60})


# ───────────────────────── önbellek ─────────────────────────
KEEP = ("wiki", "vk", "news", "newsUpdated", "enrichUpdated", "health", "esle", "sayfa", "bugun")


def save_cache():
    if DEMO:
        return
    with LOCK:
        snap = {k: STATE[k] for k in KEEP}
    try:
        tmp = CACHE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(snap, f, ensure_ascii=False)
        os.replace(tmp, CACHE)
    except Exception as e:
        log("önbellek yazılamadı:", e)


def load_cache():
    try:
        snap = json.load(open(CACHE, encoding="utf-8"))
        STATE.update({k: v for k, v in snap.items() if k in STATE})
        log("önbellek yüklendi (son başarılı veriler)")
    except Exception:
        pass


# ───────────────────────── döngü ─────────────────────────
WAKE = threading.Event()


def loop():
    last = {"n": 0, "e": 0, "b": 0, "s": 0, "g": ""}
    while True:
        now = time.time()
        if not DEMO:
            force = WAKE.is_set()
            steps = [("e", 3600, lambda: refresh_enrich(force), "zenginleştirme"), ("n", 1800, refresh_news, "gündem"),
                     ("b", 1200, refresh_esle, "Bugün ve Gazi"), ("s", 3600, refresh_sayfa, "Vikikaynak sayfa")]
            for k, every, fn, name in steps:
                if now - last[k] >= every or force:
                    last[k] = now
                    try:
                        fn()
                    except Exception as e:
                        log(f"{name}:", e)
            day = datetime.now(IST).strftime("%m-%d")
            if last["g"] != day or force:
                last["g"] = day
                try:
                    refresh_bugun()
                except Exception as e:
                    log("Tarihte bugün:", e)
        WAKE.clear()
        WAKE.wait(30)


def corpus_payload():
    with LOCK:
        wiki, vk = dict(STATE["wiki"]), dict(STATE["vk"])
        upd = STATE["enrichUpdated"]
        esle, sayfa, bugun = list(STATE["esle"]), list(STATE["sayfa"]), STATE["bugun"]
    ml = []
    for m in metinler():
        x = dict(m)
        w = wiki.get("m:" + m.get("id", ""))
        v = vk.get(m.get("id", ""))
        x["live"] = {"wiki": w if w and w.get("ok") else None, "vk": v if v and (v.get("ok") or v.get("url")) else None}
        ml.append(x)
    kl = []
    for k in kadro():
        x = dict(k)
        w = wiki.get("k:" + k["id"])
        x["live"] = {"wiki": w if w and w.get("ok") else None}
        kl.append(x)
    vks = [v for v in vk.values() if v.get("ok")]
    return {"demo": DEMO, "now": time.time(), "updated": upd, "metinler": ml, "kadro": kl, "ekler": data("ekler.json"),
            "dogrumu": data("dogrumu.json").get("sozler", []), "esle": esle, "sayfa": sayfa, "bugun": bugun, "ses": ses_list(),
            "source": "DEMO (yerel veri)" if DEMO else "Yerel metin arşivi + Vikikaynak + Wikipedia",
            "liveCount": {"vk": len(vks), "vkSatir": sum(v.get("esles", 0) for v in vks), "wiki": sum(1 for v in wiki.values() if v.get("ok"))}}


def news_payload():
    with LOCK:
        return {"demo": DEMO, "updated": STATE["newsUpdated"], "items": STATE["news"], "health": STATE["health"]}


# ───────────────────────── http ─────────────────────────
class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=WWW, **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        if self.path.startswith("/api/") or self.path.endswith((".js", ".css", ".html")) or self.path in ("/", "") or self.path.startswith("/?"):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path == "/api/corpus":
            return self.json(corpus_payload())
        if u.path == "/api/news":
            return self.json(news_payload())
        if u.path == "/api/refresh":
            WAKE.set()
            return self.json({"ok": True})
        if u.path == "/api/canli":
            return self.json(live_payload())
        return super().do_GET()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        try:
            n = min(int(self.headers.get("Content-Length") or 0), 4096)
            body = json.loads(self.rfile.read(n).decode("utf-8") or "{}") if n else {}
        except Exception:
            return self.json({"ok": False, "hata": "geçersiz istek"}, 400)
        if u.path == "/api/isim":
            it = add_name(str(body.get("ad", "")), "panel")
            return self.json({"ok": bool(it), "isim": it, "hata": None if it else "Ad uygun değil (2–16 harf, uygunsuz kelime yok)"})
        if u.path == "/api/isim/sil":
            with LOCK:
                LIVE["isimler"] = [x for x in LIVE["isimler"] if x["id"] != body.get("id")]
            return self.json({"ok": True})
        if u.path == "/api/oylama":
            opts = [str(x)[:80] for x in (body.get("secenekler") or [])][:3]
            if len(opts) < 2:
                return self.json({"ok": False, "hata": "en az iki seçenek"}, 400)
            return self.json({"ok": True, "oylama": start_poll(opts, int(body.get("sure") or 120))})
        if u.path == "/api/oy":
            return self.json({"ok": vote(int(body.get("secim", 0)) - 1)})
        if u.path == "/api/komut":
            with LOCK:
                LIVE["seq"] += 1
                LIVE["komut"] = {"id": LIVE["seq"], "ad": str(body.get("ad", ""))[:40]}
            return self.json({"ok": True})
        return self.json({"ok": False, "hata": "bilinmeyen adres"}, 404)


def main():
    n = len(metinler())
    if not n:
        print("\n⚠️  data/metinler.json okunamadı ya da boş.\n")
        sys.exit(1)
    if DEMO:
        demo_seed()
        log("DEMO modu: internet kullanılmaz, ekranda 'DEMO' yazar.")
    else:
        load_cache()
    threading.Thread(target=loop, daemon=True).start()
    if not DEMO:
        threading.Thread(target=youtube_loop, daemon=True).start()
    try:
        srv = ThreadingHTTPServer(("0.0.0.0", PORT), H)
    except OSError:
        print(f"\n⚠️  {PORT} portu dolu. Eski sunucuyu kapat:  kill $(lsof -t -i:{PORT})\n")
        sys.exit(1)
    print(f"\n🇹🇷 Nutuk Akışı hazır · {n} metin\n   Uygulama : http://127.0.0.1:{PORT}\n   Yayın    : http://127.0.0.1:{PORT}/?yayin=1  (OBS tarayıcı kaynağı 1920×1080)\n   Panel    : http://127.0.0.1:{PORT}/panel.html  (isim, oylama, sahne)\n")
    srv.serve_forever()


if __name__ == "__main__":
    main()
