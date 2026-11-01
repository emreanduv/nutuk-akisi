#!/usr/bin/env bash
# Nutuk Salonu (VR) Meta Quest paketini imzalar.
#   bash vr-imzala.sh
# İlk çalıştırmada Quest yükleme anahtarını oluşturur; şifreyi SEN belirlersin.
# Anahtar git'e girmez (imza-anahtari/ .gitignore'da). Mutlaka Google Drive'a yedekle: kaybolursa güncelleme çıkaramazsın.
set -e
cd "$(dirname "$0")"
REPO="emreanduv/nutuk-akisi"
KS="imza-anahtari/nutuk-salonu-quest.jks"
ALIAS="android"
mkdir -p imza-anahtari

# Java: sistemde varsa onu, yoksa daha önce indirilen ücretsiz Temurin JDK'yi kullan
if ! java -version >/dev/null 2>&1; then
  JDK_DIR="$HOME/.yasam-rehberi-jdk"
  [ -x "$JDK_DIR/bin/java" ] || { echo "Java bulunamadı. Önce 'bash imzala.sh' bir kez çalıştır (JDK'yi indirir)."; exit 1; }
  export JAVA_HOME="$JDK_DIR"; export PATH="$JDK_DIR/bin:$PATH"
fi

if [ ! -f "$KS" ]; then
  echo "▸ Quest için yeni yükleme anahtarı oluşturuluyor. Şifreyi kendin belirle ve bir yere not et."
  keytool -genkeypair -v -keystore "$KS" -alias "$ALIAS" -keyalg RSA -keysize 2048 \
    -validity 10000 -dname "CN=Mr. Anduv!, O=Mr. Anduv!, C=TR"
  echo "▸ ÖNEMLİ: $KS dosyasını şifresiyle birlikte Google Drive'a yedekle."
fi

echo "▸ GitHub'daki son imzasız Quest paketi indiriliyor…"
NAME=$(curl -fsSL "https://api.github.com/repos/$REPO/contents/?ref=quest" \
  | grep -o '"name": *"[^"]*-unsigned\.apk"' | sed 's/.*"\([^"]*\.apk\)"/\1/' | sort -V | tail -1)
[ -n "$NAME" ] || { echo "Paket bulunamadı (önce Actions › Nutuk Salonu VR iş akışını çalıştır)."; exit 1; }
curl -fsSL -o "imza-anahtari/$NAME" "https://raw.githubusercontent.com/$REPO/quest/$NAME"
curl -fsSL -o "imza-anahtari/apksigner.jar" "https://raw.githubusercontent.com/$REPO/quest/apksigner.jar"

OUT="imza-anahtari/${NAME%-unsigned.apk}-imzali.apk"
echo "▸ İmzalanıyor (v2/v3 imza): $OUT"
java -jar imza-anahtari/apksigner.jar sign --ks "$KS" --ks-key-alias "$ALIAS" --out "$OUT" "imza-anahtari/$NAME"
java -jar imza-anahtari/apksigner.jar verify "$OUT" && rm -f "imza-anahtari/$NAME" "$OUT.idsig"

# Parmak izi: emreanduv.github.io/.well-known/assetlinks.json'a eklenecek (Claude ekler)
keytool -list -v -keystore "$KS" -alias "$ALIAS" -storepass:env KS_SIFRE 2>/dev/null | grep -i "SHA256:" | head -1 > imza-anahtari/nutuk-salonu-parmakizi.txt || true
if [ ! -s imza-anahtari/nutuk-salonu-parmakizi.txt ]; then
  echo "▸ Parmak izi için şifreyi bir kez daha gir:"
  keytool -list -v -keystore "$KS" -alias "$ALIAS" | grep -i "SHA256:" | head -1 > imza-anahtari/nutuk-salonu-parmakizi.txt
fi

echo
echo "✓ Hazır: $(pwd)/$OUT"
echo "  Parmak izi: $(cat imza-anahtari/nutuk-salonu-parmakizi.txt)"
echo "  Bu dosyayı Meta Horizon mağazasına yükleyeceğiz."
