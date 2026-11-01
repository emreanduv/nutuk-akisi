#!/usr/bin/env python3
"""Nutuk Salonu (VR) için veri paketi: data/*.json → docs/salon/veri.json
   python3 tools/salon_veri.py
Kürsüde Nutuk Dizisi'nin 18 bölümü okunur; masadaki harita Kurtuluş Yolu duraklarını gösterir."""
import json, os, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda n: json.load(open(os.path.join(ROOT, "data", n), encoding="utf-8"))
M = D("metinler.json")["metinler"]
E = D("ekler.json")


def satir(x):
    if isinstance(x, str): return {"a": x}
    return {k: x[k] for k in ("o", "s") if x.get(k)}


dizi = sorted([m for m in M if m.get("bolum")], key=lambda m: m["bolum"])
metinler = [{"id": m["id"], "bolum": m["bolum"], "simge": m.get("simge", ""), "baslik": m["baslik"], "tarih": m["tarih"],
             "yer": m["yer"], "ne": m["ne"], "satirlar": [satir(x) for x in m["satirlar"]]} for m in dizi]

# Harita durakları → ilgili metin (aynı tarih ya da yer adı)
ELLE = {"İstanbul": "samsun", "İzmir": "buyuk-taarruz"}  # Bandırma'yla yola çıkış → Samsun bölümü; İzmir → Büyük Taarruz


def bul(h):
    if h["ad"] in ELLE: return ELLE[h["ad"]]
    for m in dizi:
        if m["tarih"] == h["tarih"]: return m["id"]
    for m in dizi:
        if h["ad"].lower() in m["yer"].lower() or h["ad"].lower() in m["baslik"].lower(): return m["id"]
    return None


harita = [{"ad": h["ad"], "lat": h["lat"], "lon": h["lon"], "tarih": h["tarih"], "not": h["not"], "metin": bul(h)} for h in E["harita"]]
out = {"metinler": metinler, "harita": harita, "sinir": E["sinir"], "kronoloji": E["kronoloji"], "biliyormu": E.get("biliyormu", [])}
hedef = os.path.join(ROOT, "docs", "salon")
os.makedirs(os.path.join(hedef, "fonts"), exist_ok=True)
json.dump(out, open(os.path.join(hedef, "veri.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
for f in os.listdir(os.path.join(ROOT, "www", "fonts")):
    if f.startswith(("dm-sans-latin", "barlow-condensed-latin")) or f == "OFL-LICENSE.txt":
        shutil.copy(os.path.join(ROOT, "www", "fonts", f), os.path.join(hedef, "fonts", f))
print(f"docs/salon/veri.json · {len(metinler)} bölüm · {sum(len(m['satirlar']) for m in metinler)} satır · {len(harita)} durak "
      f"({sum(1 for h in harita if h['metin'])} metne bağlı)")
