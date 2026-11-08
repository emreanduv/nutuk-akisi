#!/bin/sh
# Nutuk Salonu: 3B salonu (docs/salon, VR'daki salonun aynısı) telefon uygulamasının içine kopyalar → www/salon.
# Tam metin uygulamada zaten www/data/nutuk-tam.json olarak var; salon onu ../data/ altından okur, kopyası alınmaz.
set -e
cd "$(dirname "$0")/.."
rm -rf www/salon
cp -R docs/salon www/salon
rm -f www/salon/tam.json
echo "salon kopyalandı: www/salon"
