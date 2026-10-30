#!/usr/bin/env bash
# Android paketini imzalar (Google Play'e yüklenecek .aab)
#   bash imzala.sh
# İlk çalıştırmada Nutuk Akışı'nın yükleme anahtarını oluşturur; şifreyi SEN belirlersin.
# Anahtar git'e girmez (imza-anahtari/ .gitignore'da). Mutlaka Google Drive'a yedekle.
set -e
cd "$(dirname "$0")"
REPO="emreanduv/nutuk-akisi"
KS="imza-anahtari/nutuk-akisi-upload.jks"
ALIAS="nutukakisi"
mkdir -p imza-anahtari

# Java: sistemde varsa onu, yoksa Yaşam Rehberi için indirilen ücretsiz Temurin JDK'yi, o da yoksa yenisini indir.
if ! /usr/libexec/java_home >/dev/null 2>&1 && ! java -version >/dev/null 2>&1; then
  JDK_DIR="$HOME/.yasam-rehberi-jdk"
  if [ ! -x "$JDK_DIR/bin/keytool" ]; then
    case "$(uname -m)" in arm64|aarch64) ARCH=aarch64;; *) ARCH=x64;; esac
    echo "▸ Java bulunamadı; Temurin JDK 21 indiriliyor (~200 MB, bir kez)…"
    TMP="$(mktemp -d)"
    curl -fL --progress-bar -o "$TMP/jdk.tar.gz" \
      "https://api.adoptium.net/v3/binary/latest/21/ga/mac/$ARCH/jdk/hotspot/normal/eclipse"
    tar -xzf "$TMP/jdk.tar.gz" -C "$TMP"
    HOME_DIR="$(dirname "$(dirname "$(find "$TMP" -type f -path '*/bin/keytool' | head -1)")")"
    rm -rf "$JDK_DIR" && mv "$HOME_DIR" "$JDK_DIR" && rm -rf "$TMP"
  fi
  export JAVA_HOME="$JDK_DIR"
  export PATH="$JDK_DIR/bin:$PATH"
fi
keytool -help >/dev/null 2>&1 || { echo "Java hazırlanamadı."; exit 1; }

if [ ! -f "$KS" ]; then
  echo "▸ Yeni yükleme anahtarı oluşturuluyor. Şifreyi kendin belirle ve bir yere not et."
  keytool -genkeypair -v -keystore "$KS" -alias "$ALIAS" -keyalg RSA -keysize 2048 \
    -validity 10000 -dname "CN=Mr. Anduv!, O=Mr. Anduv!, C=TR"
  echo "▸ ÖNEMLİ: $KS dosyasını şifresiyle birlikte Google Drive'a yedekle. Kaybolursa güncelleme çıkaramazsın."
fi

echo "▸ GitHub'daki son imzasız paket bulunuyor…"
NAME=$(curl -fsSL "https://api.github.com/repos/$REPO/contents/android?ref=builds" \
  | grep -o '"name": *"[^"]*\.aab"' | sed 's/.*"\([^"]*\.aab\)"/\1/' | sort -V | tail -1)
[ -n "$NAME" ] || { echo "GitHub'da paket bulunamadı (önce Actions › Android iş akışını çalıştır)."; exit 1; }
curl -fsSL -o "imza-anahtari/$NAME" "https://raw.githubusercontent.com/$REPO/builds/android/$NAME"

OUT="imza-anahtari/${NAME%-unsigned.aab}-imzali.aab"
cp "imza-anahtari/$NAME" "$OUT"
echo "▸ İmzalanıyor: $OUT"
jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$KS" "$OUT" "$ALIAS"
rm -f "imza-anahtari/$NAME"

echo
echo "✓ Hazır: $(pwd)/$OUT"
echo "  Bu dosyayı Play Console'a yükleyeceğiz."
keytool -list -keystore "$KS" -alias "$ALIAS" 2>/dev/null | grep -i "SHA-256\|SHA256" || true
