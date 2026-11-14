
## Test geri bildirim standardı (Mr. Anduv!, bütün oyun ve uygulamalar)

Emre'nin kuralı: Google Play kapalı testinde ücretli test ekibinin (Testers Community) ve diğer test kullanıcılarının verdiği her geri bildirim **bu repodaki oyuna/uygulamaya da, bundan sonra yapılacak her yeni oyun/uygulamaya da** uygulanır. Yeni bir geri bildirim gelince bu listeye eklenir ve bütün repolara yayılır.

Kaynak rapor: Malazgirt Akıncıları, Kasım 2026 (çökme yok; aşağıdaki öneriler). Örnek uygulama: emreanduv/malazgirt-akincilari, `www/js/oyun.js` içindeki "AKINCI REHBERİ, PUAN, PAYLAŞ, GÖRÜŞ (1.6)" bölümü, `www/index.html` (#coach, #scrHelp, #rateBox, #toast), `store/surum-1.6.md`.

Her oyun/uygulamada olması gerekenler:
1. **Adım adım rehber (onboarding):** Yeni bir öğe/ekran/mekanik ilk kez karşılaşıldığında kısa bir ipucu kartı (oyunlarda bir an ağır çekim). İlk "nasıl oynanır" ipucu oyuncu gerçekten yapana kadar kalsın. Görülen ipuçları cihazda saklanır; güncellemeyle gelen eski kullanıcıya bildiği temel ipuçları gösterilmez.
2. **Yardım / "Nasıl Oynanır" ekranı:** Ana menüden, moladan ve Ayarlar'dan açılır; bütün ipuçları; "Rehberi baştan göster" düğmesi.
3. **Uygulama içi puan:** `@capacitor-community/in-app-review` (Google Play In-App Review, iOS SKStoreReview). Anlamlı bir başarıdan sonra kibarca sor ("Puan ver / Önerim var / Sonra"), en çok 2 kez, başarısızlıktan sonra asla; Ayarlar'da her zaman "★ Puan ver". Steam/Quest/web'de gizli.
4. **Paylaş:** `@capacitor/share`; ana menüde "Arkadaşına öner", başarı ekranında "…paylaş" (mağaza bağlantısıyla), yoksa navigator.share, yoksa panoya kopyala.
5. **Görüş bildir:** Ayarlar → "Bize yaz": sürüm, platform ve ilerleme bilgisiyle hazır e-posta (emreanduvart@gmail.com).
6. **Verilerimi sil:** Ayarlar'da iki dokunuşla onaylanan silme; gizlilik politikasında e-postayla silme talebi (30 gün) ve hangi verinin neden işlendiği (Meta DUC şartı).
7. **ASO:** Kısa açıklama ve uzun açıklamanın ilk 2-3 satırı aranan kelimeleri taşır (oyunun türü + konusu + öne çıkan özellik); yenilikler metni her sürümde güncellenir; App Store notlarında emoji yok.
8. **Mağaza başvurusu cevapları:** Kalıp metin değil, gerçek süreç ve testten sonra yapılan değişiklikler yazılır (örnek: malazgirt-akincilari `store/surum-1.6.md`).

Yayın sırası: incelemedeki/testteki mağazada gönderilen sürüme onay gelene kadar dokunulmaz; onay gelince güncel sürüm yüklenir. Yayında olan mağazaya güncel sürüm hemen gönderilir. Derlemeler her zaman bütün değişiklikleri içeren daldan (main) alınır.

### Yayın güvenliği (oyunlar artık mağazada; geri giden sürüm kabul edilemez)
- Mağazaya/TestFlight'a/Play'e/Steam'e/Quest'e giden her derleme **yalnız `main` dalından** alınır. Başka dalda yapılan iş önce `main`'e birleştirilir, sonra derlenir.
- Her derleme iş akışının başında bir **yayın öncesi kontrol** betiği çalışır (örnek: emreanduv/malazgirt-akincilari `araclar/yayin-kontrol.sh`): dal `main` mi, yukarıdaki standart özelliklerin hepsi kodda var mı, "Bir Mr. Anduv! yapımıdır." ana ekranda mı, sürüm numarası son yayınlanandan (`store/SON-SURUM`) küçük mü. Biri tutmazsa derleme durur. Bu repoda yoksa ilk işte eklenir.
- Derlemeden önce depoyu güncelle (`git fetch`), başka bir oturumun son değişikliklerini ezme; birleştirmeden önce farkı kontrol et.
- Mağaza incelemesine göndermeden önce derleme TestFlight / kapalı testte cihazda açılıp yeni özellikler gözle doğrulanır.
- Yayınlanan her sürümden sonra `store/SON-SURUM` güncellenir.

## Tek isim, tek gelişim (Emre'nin kuralı, bütün oyun ve uygulamalar)
- Bir oyun/uygulamanın adı **her mağazada aynıdır**: App Store, Google Play, Meta Horizon (VR), Steam, saat uygulamaları. Mağazaya göre ek ("VR", "Mobile" vb.) konmaz.
  Bu repo: ürünün adı her yerde **Nutuk Salonu** (telefon uygulamasının eski adı "Nutuk Akışı" bırakılır; paket/bundle kimlikleri değişmez).
- Teknik olarak mümkün olan her geliştirme, güncelleme ve iyileştirme **o ürünün bütün mağazalardaki sürümlerine** yapılır (telefon ↔ VR ↔ masaüstü). Bir platforma özgü olanlar (ör. VR kumanda titreşimi) karşılığı neyse onunla taşınır (telefonda dokunuş titreşimi).
- Aynı kural bütün repolar için geçerlidir; yeni bir repoda çalışırken bu bölüm oranın CLAUDE.md'sine de eklenir.

## Türkçe yazı ve iOS işaretleri (Emre'nin kuralı: hiçbir oyunda/uygulamada görülmesin)
- Yazı dosyaları (fontsource woff2) kendi @font-face'imizle tanımlanıyorsa **Türkçe "ı" (U+0131) latin dosyasındadır, latin-ext'te değil.** Latin aralığı fontsource'un resmî aralığıyla yazılır (U+0000-00FF,U+0131,U+0152-0153,…); "U+0000-00FF,U+2000-206F" gibi kısa aralık yazılırsa iPhone/iPad'de "ı" boş görünür (Mayıs → "May s"). Chrome/Quest fark ettirmez, iOS ettirir.
- Tuvale (canvas) yazmadan önce yazı dosyaları Türkçe harflerle yüklenir: `document.fonts.load(font, 'ıİşŞğĞçÇöÖüÜ')`; geç gelirse yeniden çizilir.
- ◀ ▶ ⏵ ⏸ ⏭ ⏮ gibi işaretlerin hemen arkasına metin biçimi seçicisi **U+FE0E** konur; yoksa iOS bunları mavi emoji kutusu olarak çizer.
- `araclar/yayin-kontrol.sh` ikisini de denetler; tutmazsa derleme durur. Aynı denetim bütün repolara eklenir.

### Pazarlama Defteri (Emre'nin kuralı, 14 Kasım 2026)
Reklam, satış ve pazarlama üretmek kadar önemlidir. Panolar, mağaza sayfaları (ASO, görseller, tanıtım videosu, İngilizce sayfa), "Diğer oyunlarımız" çapraz tanıtımı, sosyal medya paketleri ve haftalık ölçüm tek yerde takip edilir: emreanduv/emreanduv-tamga-yolu `evren/PAZARLAMA.md` (Gelişim Defteri'nin kardeşi; telefondan takip sayfasının bağlantısı defterde). Bu üründe işe başlarken bu ürünün sütunundaki `⏳` pazarlama işlerine bak; yeni bir pazarlama işi ya da dersi olunca deftere satır ekle, uygulayınca `✓` yap, bilmediğini `?` bırak. Mağazaya, sosyal medyaya ya da bir hesaba giden son adım Emre'nindir.

### Reklam panoları (Mr. Anduv! marka tutarlılığı)
Herhangi bir oyunda/uygulamada reklam ya da reklam panosu (stadyum panosu, tabela, kayan şerit) varsa **yalnız Mr. Anduv! ortak pano seti** kullanılır. Kaynak: emreanduv/kaptan-mecit `km3/veri/takimlar.json` → `"panolar"` (Champion Battle Manager ile aynı). Aynı metinler, aynı zemin/yazı renkleri; dönen panolarda 7 saniyede bir değişim (`(i*5 + tur*3) % n`). Başka marka, kurum ya da uydurma marka yok. Listeye yeni oyun/hesap eklenince önce kaynak listeye eklenir, sonra bütün repolarda güncellenir.

### Mr. Anduv! evreni ve kaynak kuralları (Emre'nin kuralı, 11 Kasım 2026)
Bütün oyun ve uygulamalar tek bir evrende yaşar: **Türk / Türk-İslam kaynağı → oyun, çizim, çizgi film → yeniden kaynağa dönen içerik.** Merkezde para değil karakter ve hikâye durur; her ürün ötekinin kapısıdır.
- **Tek kaynak:** emreanduv/emreanduv-tamga-yolu `evren/EVREN.md` (zaman çizgisi, ortak karakterler, kaynaklar, saygı kuralları). Hayvan/yaratık listesi aynı repoda `src/veri.js` → `YARATIK` (ad, renk, Bitig yazısı; çizimler `src/cizimler*.js`). Yeni karakter, yaratık ya da hikâye önce evren kitabına yazılır, sonra oyuna girer.
- **Ortak karakterler** (Dede Korkut, Temür ve Bozbörü, Tulpar, Keloğlan, Tepegöz, Yelbegen, Karakoncolos, Albastı…) her oyunda aynı ad, görünüş ve kişilikle yer alır. Yeni içerikte "bu karakter başka hangi oyunda yaşayabilir?" diye bakılır.
- **Kaynak:** Yazılı kaynağı olan destan, yazıt, eser, halk inancı, gerçek tarih ve yerli hayvan/yer. Uydurma "eski Türk inancı" yok; tarihî bilgi doğrulanır.
- **Saygı:** Peygamberimiz, ehl-i beyt ve sahabe tasvir edilmez (yüz, beden, ses taklidi yok). Kutsal varlık, mekân ve eşya (Burak, Kâbe, Kur'an, mescit) dövüşmez, yakalanmaz, satılmaz, hasar görmez; gerekirse adı anılmadan ışık ya da his olarak yer alır (örnek: Tamga Yolu 1923. basamak gecesindeki ışık). Ayet/hadis uydurulmaz, değiştirilmez. Tanrı ve kutsal sayılan varlıklar beden olarak çizilmez. Efsane efsane, tarih tarih olarak sunulur; tarihî kişiler karikatürleştirilmez; karşı taraf aşağılanmaz. Dış efsaneler yalnız konuk/rakip olarak, saygıyla.
- **Tema yazıyla söylenmez, hissettirilir.** İmza her yerde: 1923 ve "Bir Mr. Anduv! yapımıdır.".
- **Şiar:** Türk tarihi, Türk kültürü, Türk-İslam sentezi (iç belge; oyunda yazmaz).
- **Kendiliğinden yönet:** Claude bu mantığı Emre sormadan uygular. Evren kitabındaki "Seçim mantığı" altı kapısına (destan hayvanları, bugünün yerli simgeleri ör. Malaklı, yaşayan efsaneler ör. Van Gölü Canavarı, halk inançları, endemik doğa, ışıkla anılan kutsal) bakarak her oyunda ve her büyük sürümde yeni öneriler getirir, uyanları ekler, evren kitabının "Fikir defteri"ni günceller. Dinî hassasiyeti olan ya da tartışmalı öneri önce Emre'ye sorulur.
