# Nutuk Akışı — Yayın durumu (30 Ekim 2026)

- Bundle ID / paket: `com.anduv.nutukakisi` · Sürüm 1.0.0 · Uygulama adı: **Nutuk Akışı**
- Teknoloji: Capacitor 7 (iOS + Android), Yaşam Rehberi ile aynı hat. Uygulama **sunucusuz**: metinler `www/data/corpus.json` içinde (`npm run veri` → `data/*.json`'dan üretilir)
- Yerel özellikler (Apple 4.2'ye karşı): günün sözü bildirimi (LocalNotifications), kalıcı kayıt (Preferences), paylaş (Share), internetsiz okuma
- Canlı veri: yalnız "Tarihte bugün" → tr.wikipedia.org (ücretsiz, açık API). Haber ve OBS yayın sekmesi telefonda gizli
- Yazı tipleri uygulamanın içinde (`www/fonts/`, SIL OFL)

## Kaynak doğrulaması (30 Ekim 2026)
Nutuk'tan alınan bütün özgün satırlar tr.wikisource.org'daki tam metinle (749 sayfa) harf harf karşılaştırıldı.
Düzeltilenler: ilk cümle Rumi takvimle "1335 senesi Mayıs'ının on dokuzuncu günü…", saltanat sözünde "müzakere ile, münakaşa ile" sırası,
"Yarın Cumhuriyet ilân edeceğiz!", "…bilâkayd ü şart müstakil…", Amasya Genelgesi 2. madde, Hitabe'de "tevhid".
Kuvâ-yı Milliye ilkesi Nutuk'ta Erzurum Kongresi beyannamesinde geçtiği için o metne taşındı.
Vikikaynak'ta olmayan (karşılaştırılamayan) özgün satırlar: Onuncu Yıl Nutku, Samsun öğretmenler, İzmir İktisat, Sarayburnu,
Çanakkale emri, İnönü telgrafı, "Ordular! İlk hedefiniz Akdeniz'dir" → uygulamada "yaygın baskılardaki metin" diye işaretli.

## Yapılacaklar (sırayla)
1. [ ] GitHub deposu `emreanduv/nutuk-akisi` (public — Actions dakikaları ücretsiz) · ilk gönderim
2. [ ] Depo › Settings › Secrets › Actions → `ASC_KEY_P8` (Yaşam Rehberi'nde kullanılan App Store Connect anahtarının içeriği)
3. [ ] Depo › Settings › Pages → kaynak: `main` / `docs` → gizlilik: https://emreanduv.github.io/nutuk-akisi/gizlilik.html
4. [ ] App Store Connect → Uygulamalar › + → ad "Nutuk Akışı", bundle ID `com.anduv.nutukakisi`, SKU `nutukakisi` (son onay Emre)
5. [ ] Actions → "iOS (App Store Connect / TestFlight)" → TestFlight → testçiler
6. [ ] Play Console → Uygulama oluştur → Actions → "Android (Google Play paketi)" → `bash imzala.sh` → dahili test
7. [ ] Mağaza metinleri ve görselleri: `store/magaza-metinleri.md`, `store/gorseller/`
8. [ ] Play kapalı test: en az 12 kişi × 14 gün → üretim

## Güncelleme çıkarma
1. `data/metinler.json` vb. değişti → `npm run veri` (iş akışları da çalıştırır)
2. GitHub'a gönder → iOS ve Android iş akışlarını sürüm adını artırarak çalıştır
