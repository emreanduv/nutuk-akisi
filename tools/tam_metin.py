#!/usr/bin/env python3
"""Nutuk'un tam metnini Vikikaynak'tan (tr.wikisource.org) indirip uygulamaya gömülecek düz metne çevirir.
   python3 tools/tam_metin.py            → www/data/nutuk-tam.json
Metin 1927 baskısının Latin harfli tam metnidir; Atatürk'ün eserleri kamu malıdır (ölüm 1938, 5846 s. Kanun md. 27).
Sıralama Vikikaynak'taki içindekiler sayfalarından alınır; içindekilerde olmayan alt sayfalar "sonraki" bağlantısıyla yerine konur.
GitHub Actions'ta "Nutuk tam metin" iş akışıyla çalışır (kod ortamı Vikikaynak'a erişebilir)."""
import html, json, os, re, sys, time, urllib.parse, urllib.request
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://tr.wikisource.org/w/api.php"
UA = "NutukAkisi/1.0 (https://github.com/emreanduv/nutuk-akisi; Mr. Anduv!)"
BILINMEYEN = Counter()


def api(**q):
    q.update(format="json", formatversion="2")
    url = API + "?" + urllib.parse.urlencode(q)
    for d in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as r:
                return json.load(r)
        except Exception as e:  # ağ hatasında birkaç kez dene
            print("  tekrar:", e, file=sys.stderr); time.sleep(2 + d * 3)
    raise SystemExit("Vikikaynak'a ulaşılamadı")


def icerik(basliklar):
    out = {}
    for i in range(0, len(basliklar), 50):
        r = api(action="query", prop="revisions", rvprop="content", rvslots="main", redirects=1, titles="|".join(basliklar[i:i + 50]))
        norm = {n["from"]: n["to"] for n in r["query"].get("normalized", [])}
        redir = {n["from"]: n["to"] for n in r["query"].get("redirects", [])}
        sayfa = {p["title"]: p["revisions"][0]["slots"]["main"]["content"] for p in r["query"]["pages"] if "revisions" in p}
        for b in basliklar[i:i + 50]:
            t = norm.get(b, b); t = redir.get(t, t)
            if t in sayfa: out[b] = sayfa[t]
        time.sleep(0.3)
    return out


def tum_sayfalar():
    s, c = [], {}
    while True:
        r = api(action="query", list="allpages", apprefix="Nutuk/", apnamespace=0, aplimit=500, **c)
        s += [p["title"] for p in r["query"]["allpages"]]
        if "continue" not in r: return s
        c = {"apcontinue": r["continue"]["apcontinue"]}


ALT = re.compile(r"\[\[\s*((?:Nutuk/\d+\. bölüm)?)/([^|\]]+)\|([^\]]+)\]\]")


def alt_baglantilar(wt, kendi=""):
    """İçindekiler tablosundaki [[/alt sayfa|başlık]] (ya da [[Nutuk/N. bölüm/alt sayfa|…]]) bağlantıları ve önündeki harf (A., B., …)."""
    out = []
    for satir in wt.split("\n"):
        if re.match(r"^\s*\|\s*(önceki|sonraki|başlık|bölüm)\s*=", satir): continue
        for m in ALT.finditer(satir):
            if m.group(1) and m.group(1) != kendi: continue
            harf = re.search(r"\|\s*([A-ZÇĞİÖŞÜ]{1,3}|[IVXLC]+)\.\s*\|\|", satir)
            out.append((m.group(2).strip(), sade_satir(m.group(3)), harf.group(1) if harf else ""))
    return out


def sonraki(wt):
    m = re.search(r"\|\s*sonraki\s*=\s*\[\[([^|\]]+)", wt)
    return m.group(1).strip() if m else None


# ---- wikitext → düz metin -------------------------------------------------
BICIM = {"c", "center", "ortala", "merkez", "larger", "x-larger", "xx-larger", "smaller", "small", "sc", "kısa-büyük harfler",
         "küçük büyük harfler", "sağ", "right", "sola", "left", "u", "underline", "bold", "b", "i", "italic", "nowrap", "lang",
         "big", "büyük", "font", "color", "renk", "abbr", "sic", "highlight", "gap", "tooltip", "uc", "lc", "ls", "letter-spacing",
         "x-smaller", "fine", "resize", "span", "block center", "blockcenter", "center block", "text-align"}
SIL = {"eser", "eser başlığı", "eser başlık", "eser bilgisi", "dhr", "rule", "nop", "clear", "ts", "anchor", "çapa", "sayfa",
       "pd-old", "kamu malı", "pd-tr", "telif", "pd", "smaller block", "gizli", "hr", "brl", "-", "ayrım", "kategori"}


def sablonlar(s):
    """İç içe {{şablon}}ları içten dışa çöz."""
    for _ in range(12):
        yeni = re.sub(r"\{\{([^{}]*)\}\}", _sablon, s)
        if yeni == s: break
        s = yeni
    return s


def _sablon(m):
    parca = [p.strip() for p in m.group(1).split("|")]
    ad = parca[0].lower().replace("_", " ").strip()
    konum = [p for p in parca[1:] if not re.match(r"^[\w\- ]+\s*=", p)]
    if ad in SIL or ad.startswith("eser") or ad.startswith("dhr") or ad.startswith("pd"): return ""
    if ad in BICIM or ad.startswith("x-") or ad.startswith("float") or ad.startswith("center") or ad.startswith("block"):
        return konum[-1] if konum else ""
    if ad in ("br", "nl") or ad.startswith("col-"): return "\n\n"
    if ad in ("alıntı", "quote", "blockquote", "söz", "osmanlıca", "dipnot metni"):
        return "\n\n" + (konum[0] if konum else "") + "\n\n"
    if ad in ("'", "kesme"): return "'"
    if ad in ("tire", "dash", "em dash", "--"): return "—"
    if ad in ("...", "elips", "noktalar"): return "…"
    BILINMEYEN[ad] += 1
    return konum[-1] if konum else ""


def tablo(s):
    """{| … |} tablolarını satır satır metne çevir (hücreler ' · ' ile)."""
    def cevir(m):
        satirlar, hucre = [], []
        for ln in m.group(0).split("\n")[1:-1]:
            ln = ln.strip()
            if ln.startswith("|-") or ln.startswith("|+"):
                if hucre: satirlar.append(hucre); hucre = []
                continue
            if ln.startswith("!") or ln.startswith("|"):
                for c in re.split(r"\|\||!!", ln[1:]):
                    c = c.split("|", 1)[1] if re.match(r"^\s*[\w-]+\s*=\s*\"", c) and "|" in c else c
                    c = c.strip()
                    if c: hucre.append(c)
            elif hucre:
                hucre[-1] += "\n" + ln
        if hucre: satirlar.append(hucre)
        return "\n\n" + "\n\n".join(" · ".join(h) for h in satirlar if h) + "\n\n"
    for _ in range(4):
        yeni = re.sub(r"\{\|(?:(?!\{\|)[\s\S])*?\|\}", cevir, s)
        if yeni == s: break
        s = yeni
    return s


def sade_satir(s):
    s = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]", r"\1", s)
    s = re.sub(r"'''?", "", s)
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s).replace(" ", " ").replace("﻿", "").strip()


def duz(wt):
    notlar = []
    s = re.sub(r"<!--[\s\S]*?-->", "", wt)
    s = re.sub(r"\[\[\s*(Kategori|Category|Dosya|File|Resim|Image)\s*:[^\]]*\]\]", "", s, flags=re.I)
    def ref(m):
        notlar.append(m.group(1)); return f" [{len(notlar)}]"
    s = re.sub(r"<ref[^>/]*>([\s\S]*?)</ref>", ref, s)
    s = re.sub(r"<ref[^>]*/>", "", s)
    s = re.sub(r"\[\[(?:[^|\]\[]*\|)?([^\]\[]+)\]\]", r"\1", s)  # bağlantılar şablonlardan önce: içlerindeki | şablonu bölmesin
    s = re.sub(r"<references\s*/?>|\{\{\s*(reflist|kaynakça|notlar)[^}]*\}\}", "", s, flags=re.I)
    s = sablonlar(s)
    s = tablo(s)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</?(poem|div|p|span|center|big|small|sup|sub|font|u|s|blockquote|section|noinclude|includeonly|onlyinclude)[^>]*>", "\n" if False else "", s, flags=re.I)
    s = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]+)\]\]", r"\1", s)
    s = re.sub(r"\[https?://\S+\s+([^\]]+)\]", r"\1", s)
    s = re.sub(r"\[https?://\S+\]", "", s)
    s = re.sub(r"'''''|'''|''", "", s)
    s = re.sub(r"__[A-ZÇĞİÖŞÜ]+__", "", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s).replace(" ", " ").replace("﻿", "").replace("​", "")
    paragraflar = []
    for blok in re.split(r"\n\s*\n", s):
        satir = [l.strip() for l in blok.split("\n") if l.strip()]
        if not satir: continue
        # Liste ya da girinti satırları ayrı paragraf; diğerleri vikideki gibi birleşir
        cur = []
        for l in satir:
            if re.match(r"^[:*#;]+", l):
                if cur: paragraflar.append(" ".join(cur)); cur = []
                paragraflar.append(re.sub(r"^[:*#;]+\s*", "", l))
            elif re.match(r"^=+.*=+$", l):
                if cur: paragraflar.append(" ".join(cur)); cur = []
                paragraflar.append("## " + l.strip("= ").strip())
            else:
                cur.append(l)
        if cur: paragraflar.append(" ".join(cur))
    paragraflar = [re.sub(r"\s{2,}", " ", p).strip() for p in paragraflar]
    paragraflar = [p for p in paragraflar if p and p not in ("·",) and not re.fullmatch(r"[\s·|—-]+", p)]
    notlar = [sade_satir(sablonlar(n)) for n in notlar]
    return paragraflar, notlar


HAM = os.path.join(ROOT, "tools", "nutuk-ham.json.gz")
_ham = {}


def icerik_ham(basliklar):
    eksik = [b for b in basliklar if b not in _ham]
    if eksik and not os.environ.get("YEREL"): _ham.update(icerik(eksik))
    return {b: _ham[b] for b in basliklar if b in _ham}


class _HtmlMetin(__import__("html.parser").parser.HTMLParser):
    BLOK = {"p", "div", "br", "tr", "li", "h1", "h2", "h3", "h4", "h5", "table", "dd", "dt", "blockquote", "center"}
    def __init__(self):
        super().__init__(); self.par, self.cur, self.gizli, self.notlar, self.notta = [], [], 0, [], 0
    def _kes(self):
        t = re.sub(r"\s+", " ", "".join(self.cur)).strip()
        if t: (self.notlar if self.notta else self.par).append(t)
        self.cur = []
    def handle_starttag(self, tag, a):
        a = dict(a); cls = a.get("class") or ""
        if tag in ("style", "script") or "ws-noexport" in cls or "pagenum" in cls or "mw-editsection" in cls or a.get("id") == "toc": self.gizli += 1; return
        if tag == "ol" and "references" in cls: self._kes(); self.notta += 1
        if tag in self.BLOK: self._kes()
        if tag in ("td", "th") and self.cur: self.cur.append(" · ")
    def handle_endtag(self, tag):
        if tag in ("style", "script") and self.gizli: self.gizli -= 1; return
        if tag in self.BLOK: self._kes()
        if tag == "ol" and self.notta: self._kes(); self.notta -= 1
    def handle_startendtag(self, tag, a): self.handle_starttag(tag, a)
    def handle_data(self, d):
        if not self.gizli: self.cur.append(d)


def html_duz(h):
    h = re.sub(r'<span[^>]*class="[^"]*(pagenum|ws-pagenum)[^"]*"[^>]*>.*?</span>', "", h, flags=re.S)
    h = re.sub(r'<sup[^>]*class="reference"[^>]*>.*?</sup>', "", h, flags=re.S)
    p = _HtmlMetin(); p.feed(h); p._kes()
    P = [re.sub(r"\[\s*\d+\s*\]$", "", x).strip() for x in p.par]
    P = [x for x in P if x and not re.fullmatch(r"[\s·|—-]+|\[?\d+\]?", x)]
    return P, p.notlar


def html_al(basliklar):
    out = {}
    for b in basliklar:
        r = api(action="parse", page=b, prop="text", disablelimitreport=1, disableeditsection=1)
        out["html:" + b] = r.get("parse", {}).get("text", "")
        time.sleep(0.2)
    return out


def main():
    import gzip
    if os.path.exists(HAM):
        _ham.update(json.load(gzip.open(HAM, "rt", encoding="utf-8")))
    print("▸ İçindekiler…")
    hepsi = _ham.get("__liste__") or tum_sayfalar()
    _ham["__liste__"] = hepsi
    kok = icerik_ham(["Nutuk"])["Nutuk"]
    bolum_bag = [(t, b, h) for t, b, h in alt_baglantilar(kok) if re.match(r"^\d+\. bölüm$", t)]
    bolum_basliklari = ["Nutuk/" + t for t, _, _ in bolum_bag]
    bolum_wt = icerik_ham(bolum_basliklari)
    plan, kullanilan = [], set(["Nutuk"] + bolum_basliklari)
    for (t, baslik, romen), tam in zip(bolum_bag, bolum_basliklari):
        wt = bolum_wt.get(tam, "")
        kisim = [(tam + "/" + a, b, h) for a, b, h in alt_baglantilar(wt, tam)] or [(tam, baslik, "")]
        on = sade_satir(sablonlar(re.sub(r"\{\|[\s\S]*?\|\}", "", wt)))
        plan.append({"no": int(t.split(".")[0]), "romen": romen, "baslik": baslik, "sayfa": tam, "kisimlar": kisim, "on": on})
        kullanilan.update(k[0] for k in kisim)
    yetim = [t for t in hepsi if t not in kullanilan]
    print(f"  {len(plan)} bölüm · {sum(len(b['kisimlar']) for b in plan)} kısım içindekilerde · {len(yetim)} içindekilerde yok")

    tum = [k[0] for b in plan for k in b["kisimlar"] if k[0] not in bolum_wt] + yetim
    wt0 = dict(bolum_wt)
    print(f"▸ {len(tum)} sayfa indiriliyor…")
    wt = {**icerik_ham(tum), **wt0}
    gerek = [t for t, v in wt.items() if "<pages" in v and "html:" + t not in _ham]
    if gerek and not os.environ.get("YEREL"):
        print(f"▸ {len(gerek)} sayfa PDF dökümünden (işlenmiş hâli) alınıyor…"); _ham.update(html_al(gerek))
    gzip.open(HAM, "wt", encoding="utf-8").write(json.dumps(_ham, ensure_ascii=False))

    # İçindekilerde olmayan sayfaları "sonraki" zincirine göre yerine koy
    for b in plan:
        sira = [k for k in b["kisimlar"]]
        i = 0
        while i < len(sira):
            nx = sonraki(wt.get(sira[i][0], ""))
            if nx and nx in yetim and nx.startswith(b["sayfa"] + "/"):
                sira.insert(i + 1, (nx, nx.rsplit("/", 1)[1], "")); yetim.remove(nx)
            i += 1
        b["kisimlar"] = sira
    for t in list(yetim):  # hâlâ yeri bulunamayan: kendi bölümünün sonuna
        for b in plan:
            if t.startswith(b["sayfa"] + "/"):
                b["kisimlar"].append((t, t.rsplit("/", 1)[1], "")); yetim.remove(t); break

    cikti, karakter, eksik = [], 0, []
    for b in plan:
        ks = []
        for sayfa, baslik, harf in b["kisimlar"]:
            if sayfa not in wt: eksik.append(sayfa); continue
            p, n = html_duz(_ham["html:" + sayfa]) if "<pages" in wt[sayfa] and _ham.get("html:" + sayfa) else duz(wt[sayfa])
            if not p: continue
            parca = sayfa.split("/")
            if len(parca) > 3: baslik = f"{parca[2]} ({parca[3]})"  # Vesika 97/b → Vesika 97 (b)
            karakter += sum(map(len, p))
            ks.append({"id": f"{b['no']}-{len(ks) + 1}", "harf": harf, "baslik": baslik, "w": sayfa[len("Nutuk/"):], "p": p, **({"notlar": n} if n else {})})
        if all(re.match(r"^Vesika \d+", k["baslik"]) for k in ks):  # vesikalar numara sırasıyla
            ks.sort(key=lambda k: (int(re.search(r"\d+", k["baslik"]).group()), k["baslik"]))
            for i, k in enumerate(ks): k["id"] = f"{b['no']}-{i + 1}"
        cikti.append({"no": b["no"], "romen": b["romen"], "baslik": b["baslik"], "kisimlar": ks})
    cikti.sort(key=lambda b: b["no"])

    veri = {"eser": "Nutuk", "yazar": "Gazi Mustafa Kemal", "yil": 1927,
            "kaynak": "Vikikaynak — tr.wikisource.org/wiki/Nutuk", "url": "https://tr.wikisource.org/wiki/Nutuk",
            "lisans": "Kamu malı (Atatürk 1938'de öldü; 5846 sayılı Kanun md. 27)",
            "indirildi": time.strftime("%Y-%m-%d"), "bolumler": cikti}
    os.makedirs(os.path.join(ROOT, "www", "data"), exist_ok=True)
    yol = os.path.join(ROOT, "www", "data", "nutuk-tam.json")
    json.dump(veri, open(yol, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    ozet = {"bolum": len(cikti), "kisim": sum(len(b["kisimlar"]) for b in cikti), "paragraf": sum(len(k["p"]) for b in cikti for k in b["kisimlar"]),
            "karakter": karakter, "bayt": os.path.getsize(yol), "eksik": eksik, "yerlesmeyen": yetim, "bilinmeyen_sablon": BILINMEYEN.most_common(40)}
    json.dump(ozet, open(os.path.join(ROOT, "tools", "tam_metin_ozet.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("✓", json.dumps(ozet, ensure_ascii=False)[:1500])


if __name__ == "__main__":
    main()
