#!/usr/bin/env python3
"""Kaynak tanılama + özgün satır doğrulaması.
   python3 araclar/tani.py

   1) Vikikaynak, Wikipedia ve gündem RSS'leri bu bilgisayardan açılıyor mu?
   2) data/metinler.json'daki her özgün satır ({"o": …}) Vikikaynak'taki tam metinde birebir geçiyor mu?
      Eşleşmeyen satırları listeler: ya yazımı düzelt (Nutuk'un hangi baskısı esas alındıysa ona göre)
      ya da satırı düz anlatıma çevir. Mağazaya çıkmadan önce bu listenin boşalması hedeflenir.
"""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import server as S

print("\n🇹🇷 Nutuk Akışı · kaynak tanılama\n")
M = S.metinler()
print(f"Metin arşivi : {len(M)} metin · {sum(len(S.originals(m)) for m in M)} özgün satır · {len(S.kadro())} kadro kartı")

print("\n— Vikikaynak: özgün satır doğrulaması —")
ok_l = tot_l = 0
eksik = []
for m in M:
    if not S.originals(m):
        continue
    t0 = time.time(); r = S.vk_one(m)
    ok_l += r.get("esles", 0); tot_l += r.get("toplam", 0)
    durum = "🟢" if r.get("ok") and r.get("esles") == r.get("toplam") else "🟡" if r.get("ok") else "🔴"
    print(f"  {durum} {m['id']:<18} {r.get('esles', 0)}/{r.get('toplam', 0)} satır  {time.time()-t0:4.1f} sn  {r.get('title') or r.get('err') or 'sayfa bulunamadı'}")
    for o, f in zip(S.originals(m), r.get("satir") or [False] * len(S.originals(m))):
        if not f:
            eksik.append((m["id"], o))
print(f"  → toplam {ok_l}/{tot_l} özgün satır Vikikaynak'la birebir eşleşti")
if eksik:
    print("\n  Eşleşmeyen satırlar (yazım farkı, farklı baskı ya da Vikikaynak'ta henüz yok):")
    for i, o in eksik:
        print(f"   · {i}: {o[:110]}")

print("\n— Vikikaynak: rastgele Nutuk sayfası —")
t0 = time.time(); S.refresh_sayfa()
c = S.STATE["sayfa"][0] if S.STATE["sayfa"] else None
print(f"  {'🟢 ' + c['title'] + ' · ' + c['para'][:80] + '…' if c else '🔴 sayfa alınamadı'}  ({time.time()-t0:.1f} sn)")

print("\n— Wikipedia —")
for m in M[:5]:
    r = S.wiki_one(m.get("wiki"))
    print(f"  {'🟢' if r.get('ok') else '🔴'} {m['baslik'][:44]:<46} {r.get('lang','')}  {'görsel var' if r.get('thumb') else ''}")
try:
    S.refresh_bugun(); B = S.STATE["bugun"]
    print(f"  🟢 Tarihte bugün ({B['sayfa']}): {len(B['items'])} ilgili satır" + "".join(f"\n     · {x['yil']} {x['metin'][:70]}" for x in B["items"][:4]))
except Exception as e:
    print(f"  🔴 Tarihte bugün: {type(e).__name__}")

print("\n— Gündem (RSS) —")
kw, bad = S.keyword_re(), S.bad_re()
for src in S.data("kaynaklar.json").get("kaynaklar", []):
    try:
        if not S.robots_ok(src["url"]):
            print(f"  ⚪ {src['ad']:<24} robots.txt izin vermiyor"); continue
        got = S.parse_feed(src, S.get(src["url"]), kw, bad)
        print(f"  🟢 {src['ad']:<24} {len(got)} ilgili başlık" + (f" · ör. {got[0]['title'][:60]}" if got else ""))
    except Exception as e:
        print(f"  🔴 {src['ad']:<24} {type(e).__name__}")

print("\n— Bugün ve Gazi —")
t0 = time.time(); S.refresh_esle()
print(f"  → {len(S.STATE['esle'])} eşleşme ({time.time()-t0:.1f} sn)" + "".join(f"\n     · {e['haber']['title'][:60]}  ↔  {e['kaynak']}" for e in S.STATE['esle'][:5]))

print("\n— YouTube sohbeti —")
Y = S.data("ayarlar.json").get("youtube", {})
print("  " + ("🟢 apiKey ve videoId yazılı · sunucu açılınca bağlanmayı dener" if Y.get("apiKey") and Y.get("videoId") else "⚪ kapalı (data/ayarlar.json) · panelden elle isim/oy girilebilir"))
print(f"\n— Ses dosyaları (www/ses) —\n  {', '.join(S.ses_list()) or 'yok · ör. www/ses/genclige-hitabe.mp3 koyabilirsin'}")
print()
