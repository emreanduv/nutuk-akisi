# App Store + Google Play yol haritası

Kod buna göre kuruldu: arayüz `www/` klasöründe tek başına durur (Capacitor'ın beklediği yapı), veri tek bir API adresinden gelir (`www/config.js`).
Sümer Akışı ile aynı yol, ama Nutuk Akışı'nın iki büyük avantajı var:

1. **Atatürk'ün eserleri kamu malıdır.** Atatürk 1938'de öldü; Türk mevzuatındaki ölümden sonra 70 yıllık koruma süresi çoktan doldu. Nutuk'un ve söylevlerin özgün metni serbestçe kullanılabilir.
2. **İçeriğin omurgası uygulamanın kendi dosyalarında** (metinler, kronoloji, kadro). Lisanslı canlı veri gerekmez; uygulama internetsiz de çalışabilir.

## 0. Mağazadan önce çözülmesi gereken 4 iş

1. **Metin doğruluğu (en önemlisi).** Hedef kitle Nutuk'u çok iyi bilen insanlar; tek bir yanlış harf yorumlara düşer.
   - `python3 araclar/tani.py` → eşleşmeyen özgün satır listesi boşalana kadar düzelt.
   - Esas alınacak baskıyı seç (TTK ya da ATAM baskısı önerilir) ve uygulamanın "Hakkında" ekranında belirt.
   - Mümkünse bir tarihçiye ya da Atatürk İlkeleri ve İnkılap Tarihi öğretim üyesine bir kez okut. Mağaza açıklamasında da güven verir.
2. **Sadeleştirmeler ve anlatımlar bizim.** `"s"` alanlarındaki karşılıklar ve düz anlatım satırları bu proje için yazıldı, ürünün kendi içeriğidir. Başka bir yayınevinin "günümüz Türkçesiyle Nutuk" metnini kopyalama: o sadeleştirmeler yayınevinin telifindedir.
3. **Hukuki çerçeve.** Türkiye'de 5816 sayılı Kanun Atatürk'ün hatırasını korur. Bu uygulama saygılı bir eğitim ürünü ve sorun yaratacak içerik barındırmıyor; yine de: izleyici sohbetinden gelen isimler süzülüyor (panelden ✕ ile kaldırılıyor), yorum alanı açılacaksa moderasyon şart. Karikatür, mizah ya da maskot olarak Atatürk tasviri kullanma (maskotumuz bir telgrafçı).
4. **Görseller ve ses.** Wikipedia görsellerinin çoğu CC lisanslıdır ve atıf ister; uygulamada atıf satırı var. Atatürk'ün fotoğraf ve ses kayıtlarının kullanım haklarını tek tek kontrol et; en temizi uygulamanın kendi çizimleriyle ve senin seslendirmenle ilerlemek.

## 1. Sunucu: iki seçenek

- **A. Sunucusuz (önerilen ilk sürüm):** `data/*.json` dosyalarını `www/data/` içine kopyalayıp `common.js`'te `/api/corpus` yerine bu dosyaları okut. Uygulama tamamen çevrimdışı çalışır.
  Vikikaynak doğrulaması zaten derleme öncesi yapılacağı için çevrimdışı sürümde gerekmez; gündem ve "tarihte bugün (Wikipedia)" bu sürümde olmaz ya da doğrudan uygulamadan çekilir.
- **B. Sunuculu:** `server.py`'yi Render, Railway, Fly.io ya da küçük bir VPS'e koy, sonra:
  ```js
  // www/config.js
  window.NUTUK_API_BASE = 'https://nutuk-akisi.ornek.com';
  ```

## 2. Capacitor ile paketle (Mac + Xcode + Android Studio)

```sh
cd Nutuk
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Nutuk Akışı" com.anduv.nutukakisi --web-dir=www
npx cap add ios && npx cap add android
npx cap sync
npx cap open ios        # Xcode → Archive → App Store Connect
npx cap open android    # Android Studio → Build → Generate Signed Bundle (.aab)
```

## 3. Apple'ın "sadece web sitesi" reddine (Kural 4.2) karşı yerel özellikler

- 🔔 **Günün sözü / Tarihte bugün bildirimi**: her sabah "🇹🇷 Bugün 1919'da Sivas Kongresi toplandı". `@capacitor/local-notifications` ile sunucusuz; mantık `NA.daily()` ve `NA.tarihteBugun()` içinde hazır.
- 📺 **Nutuk Dizisi**: 18 günlük okuma planı, "bugünkü bölümü okudum" işareti ve seri sayacı (`@capacitor/preferences`).
- 🔊 **Sesli Nutuk**: radyo ve tiyatro sesinle bölüm bölüm seslendirme. Bu uygulamayı rakiplerinden ayıracak en güçlü kart olur; "premium" paket olarak da düşünülebilir. Altyapı hazır: `www/ses/<metin-kimliği>.mp3`.
- 📱 **Ana ekran widget'ı**: günün özgün sözü + bugünün Türkçesi.
- 📤 **Paylaş**: söz kartını dikey görsel olarak paylaşma (`@capacitor/share`). 10 Kasım, 29 Ekim, 19 Mayıs gibi günlerde viral potansiyeli yüksek.
- 🗓️ **Millî gün geri sayımı** (var) → takvim widget'ı.

## 4. Hesaplar ve mağaza sayfası

| | Apple | Google |
|---|---|---|
| Geliştirici hesabı | Apple Developer Program (yıllık ücretli) | Google Play Console (tek seferlik ücret) |
| Kategori | Eğitim (ikinci: Kitaplar) | Eğitim / Kitaplar ve Kaynaklar |
| Gerekenler | Gizlilik politikası adresi, ekran görüntüleri (6,7" ve 5,5"), yaş sınırı, veri toplama beyanı | Gizlilik politikası, veri güvenliği formu, 512 px ikon, öne çıkan görsel |
| Yayın zamanı | **29 Ekim** ya da **19 Mayıs** öncesi | aynı |

Güncel ücret ve kuralları başvuru anında developer.apple.com ve play.google.com/console'dan teyit et.

## Önerilen sıra

1. Yayını bir iki hafta çalıştır; izleyicinin hangi metinlerde kaldığına, yorumlarda neyi sorduğuna bak. Yeni metinleri `data/metinler.json`'a ekle (Erzurum'daki istifa telgrafının özgün metni, Sivas'taki konuşmalar, 1 Mart açılış nutukları…).
2. `araclar/tani.py` listesi boşalana kadar özgün satırları düzelt + uzman okuması.
3. Sunucusuz ilk sürüm → günün sözü bildirimi + Nutuk dizisi işaretleri → Capacitor paketi → TestFlight / dahili test → mağaza.
4. Fırsat, Borsa, Futbol, Sümer ve Nutuk Akışı aynı iskelette. İleride tek uygulamada sekmeler ("Akış" ailesi) olarak da paketlenebilir.
