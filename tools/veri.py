#!/usr/bin/env python3
"""Mağaza uygulaması için veri paketi: data/*.json → www/data/corpus.json
   python3 tools/veri.py      (npm run veri)
Telefon uygulaması sunucusuz çalışır: metinler, kronoloji, kadro ve "Doğru mu, Uydurma mı?" uygulamanın içinde gelir.
Yayın sunucusu (server.py) aynı data/ klasörünü okumaya devam eder; ikisi hep aynı içeriği gösterir."""
import json, os, urllib.parse
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda n: json.load(open(os.path.join(ROOT, "data", n), encoding="utf-8"))
M = D("metinler.json")["metinler"]
for m in M:
    O = [s for s in m["satirlar"] if isinstance(s, dict) and s.get("o")]
    url = "https://tr.wikisource.org/wiki/" + urllib.parse.quote(m["vk"].replace(" ", "_")) if m.get("vk") else ""
    ok = m.get("dogrulama") == "vikikaynak"
    m["live"] = {"wiki": None, "vk": ({"ok": ok, "url": url, "title": m.get("vk"), "esles": len(O) if ok else 0, "toplam": len(O)} if url else None)}
out = {"demo": False, "cevrimdisi": True, "metinler": M, "kadro": [dict(k, live={"wiki": None}) for k in D("kadro.json")["kadro"]],
       "ekler": D("ekler.json"), "dogrumu": D("dogrumu.json")["sozler"], "esle": [], "sayfa": [], "bugun": None, "ses": [],
       "source": "Uygulama içi arşiv", "liveCount": {"vk": sum(1 for m in M if m.get("dogrulama") == "vikikaynak"), "wiki": 0}}
os.makedirs(os.path.join(ROOT, "www", "data"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "www", "data", "corpus.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"www/data/corpus.json · {len(M)} metin · {sum(len([s for s in m['satirlar'] if isinstance(s, dict)]) for m in M)} özgün satır")
