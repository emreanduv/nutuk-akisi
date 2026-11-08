#!/usr/bin/env python3
# Türkçe yazı ve iOS işaret denetimi (Emre'nin kuralı: hiçbir oyunda/uygulamada görülmesin). Yayın öncesi kontrolden çağrılır; sorun varsa 1 döner.
# 1) fontsource yazı dosyalarında Türkçe "ı" (U+0131) LATIN dosyasındadır. Kendi @font-face'imizde latin aralığı U+0131'i içermezse
#    iPhone/iPad'de "ı" boş görünür (Mayıs → "May s"). Chrome/Quest fark ettirmez.
# 2) ◀ ▶ ⏵ ⏸ ⏭ ⏮ işaretlerinin arkasında metin biçimi seçicisi U+FE0E olmalı; yoksa iOS bunları mavi emoji kutusu olarak çizer.
#    Kullanım: python3 araclar/turkce-yazi-kontrol.py [klasör ...]   (varsayılan: www docs)
import re, sys, os
koklar = sys.argv[1:] or [k for k in ('www', 'docs') if os.path.isdir(k)]
ATLA = ('node_modules', 'vendor', '/ios/', '/android/', '.min.', '/libs/')
R = re.compile('[◀▶⏵⏸⏭⏮](?![︎️])')
bozuk = []
for kok in koklar:
    for d, _, fs in os.walk(kok):
        for f in fs:
            p = os.path.join(d, f)
            if not f.endswith(('.html', '.css', '.js')) or any(a in p for a in ATLA): continue
            try: s = open(p, encoding='utf-8').read()
            except Exception: continue
            for b in re.findall(r'@font-face\{[^}]*\}', s):
                if re.search(r'-latin-\d{3}-', b) and 'unicode-range' in b and 'U+0131' not in b:
                    bozuk.append(f'{p}: latin yazı dosyasının aralığında U+0131 (ı) yok — iOS\'ta ı boş görünür'); break
            n = len(R.findall(s))
            if n: bozuk.append(f'{p}: {n} işaret (◀ ▶ ⏵ ⏸) U+FE0E olmadan — iOS emoji çizer')
if bozuk: print('\n'.join('✗ ' + b for b in bozuk)); sys.exit(1)
print('✓ Türkçe yazı ve iOS işaretleri doğru')
