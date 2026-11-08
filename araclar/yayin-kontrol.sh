#!/bin/sh
# Nutuk Salonu — yayın öncesi kontrol (CLAUDE.md "Yayın güvenliği"). Her derleme iş akışının başında çalışır; bir madde tutmazsa derleme durur.
#   sh araclar/yayin-kontrol.sh <sürüm>      örn. sh araclar/yayin-kontrol.sh 1.1.0
set -e
cd "$(dirname "$0")/.."
SURUM="${1:?sürüm adı ver: sh araclar/yayin-kontrol.sh 1.1.0}"
hata=0; kotu(){ echo "✗ $1"; hata=1; }; iyi(){ echo "✓ $1"; }

# 1) yalnız main dalından
DAL="${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}"
[ "$DAL" = "main" ] && iyi "dal: main" || kotu "dal '$DAL' — mağazaya giden derleme yalnız main'den alınır"

# 2) imza ana ekranlarda
grep -q "Bir Mr. Anduv! yapımıdır." www/index.html && iyi "telefon ana ekranı: Bir Mr. Anduv! yapımıdır." || kotu "www/index.html'de 'Bir Mr. Anduv! yapımıdır.' yok"
grep -q "Bir Mr. Anduv! yapımıdır." docs/salon/index.html && iyi "salon giriş kartı: Bir Mr. Anduv! yapımıdır." || kotu "docs/salon/index.html'de 'Bir Mr. Anduv! yapımıdır.' yok"

# 3) test geri bildirim standardı (rehber, nasıl kullanılır, puan, paylaş, bize yaz, verilerimi sil)
for x in "Nasıl kullanılır" "Puan ver" "Arkadaşına öner" "Bize yaz" "Verilerimi sil"; do grep -q "$x" www/rehber.js && iyi "telefon: $x" || kotu "telefon: '$x' yok (www/rehber.js)"; done
grep -q "in-app-review" package.json && iyi "uygulama içi puan eklentisi" || kotu "@capacitor-community/in-app-review yok"
grep -q "@capacitor/share" package.json && iyi "paylaş eklentisi" || kotu "@capacitor/share yok"
for x in "Rehberi baştan göster" "Verilerimi sil"; do grep -q "$x" docs/salon/yardim.js && iyi "salon: $x" || kotu "salon: '$x' yok (docs/salon/yardim.js)"; done

# 4) tek isim: her yerde Nutuk Salonu
grep -q '"appName": "Nutuk Salonu"' capacitor.config.json && iyi "uygulama adı: Nutuk Salonu" || kotu "capacitor.config.json appName 'Nutuk Salonu' değil"
grep -q "Nutuk Salonu" android/app/src/main/res/values/strings.xml && iyi "Android adı" || kotu "Android app_name 'Nutuk Salonu' değil"
grep -q "Nutuk Salonu" ios/App/App/Info.plist && iyi "iOS adı" || kotu "iOS görünen ad 'Nutuk Salonu' değil"

# 5) Türkçe yazı (iOS): fontsource'ta "ı" (U+0131) latin dosyasındadır; latin @font-face aralığında U+0131 olmalı. ◀ ▶ ⏵ ⏸ işaretlerinin arkasında U+FE0E olmalı (yoksa iOS emoji resmi çizer).
if python3 araclar/turkce-yazi-kontrol.py www docs/salon docs/gizlilik.html >/dev/null 2>&1 || python3 araclar/turkce-yazi-kontrol.py www docs; then iyi "Türkçe yazı: ı aralığı ve işaretler iOS'ta doğru"; else kotu "Türkçe yazı / iOS işaret denetimi tutmadı (yukarıya bak)"; fi

# 5) sürüm geri gitmez
SON=$(tr -d ' \n' < store/SON-SURUM 2>/dev/null || echo 0.0.0)
EN=$(printf '%s\n%s\n' "$SON" "$SURUM" | sort -V | tail -1)
[ "$EN" = "$SURUM" ] && iyi "sürüm $SURUM ≥ son yayınlanan $SON" || kotu "sürüm $SURUM, son yayınlanandan ($SON) küçük"

[ $hata -eq 0 ] && echo "Yayın öncesi kontrol geçti." || { echo "Yayın öncesi kontrol TUTMADI — derleme durduruldu."; exit 1; }
