# Nutuk Akışı 🇹🇷

Fırsat, Borsa, Futbol ve Sümer Akışı'nın kardeşi: **Nutuk**, **Gençliğe Hitabe**, söylevler, telgraflar ve emirler için **FM2010 menajer modu** yayın ekranı ve telefon uyumlu uygulama.
Metinler "gelen kutusuna" mesaj olarak düşer. Her metin açıldığında önce **"GAZİ KÜRSÜDE"**, **"TELGRAF GELDİ!"** ya da **"EMİR!"** alarmı çıkar.
Sonra satırlar teker teker iner: telgraflar önce **Mors koduyla** belirir, söylevler **mikrofon dalgasıyla**, kürsünün ses göstergesi oynar.
Atatürk'ün **özgün sözü** büyük harflerle, hemen altında **bugünün Türkçesiyle** karşılığı görünür. Yanda **Söylev Kartı** (tarih, yer, dinleyen, eser, Gazi'nin o yılki yaşı, Vikikaynak doğrulaması) ve bayraklı meydan; altta 1881–1953 **kronoloji** alt yazısı kayar, araya "Biliyor muydun?" notları serpiştirilir.
Alt yazıda, ekrandaki metnin tarihine en yakın olay **altınla** vurgulanır.

## Başlatma

```sh
cd Nutuk
python3 server.py          # canlı kaynaklar → http://127.0.0.1:8769
python3 server.py --demo   # internetsiz önizleme (ekranda "DEMO" yazar)
```

Mac'te `start.command` dosyasına çift tıklamak da olur (sunucuyu açar, yayını tarayıcıda başlatır).
VS Code'da: `Nutuk` klasörünü aç → **Terminal → Run Task…** → "🇹🇷 Nutuk Akışı: başlat".
Port doluysa: `kill $(lsof -t -i:8769)`. Fırsat (8765), Borsa (8766), Futbol (8767) ve Sümer Akışı (8768) aynı anda çalışabilir, çakışmaz.

İlk çalıştırmada `python3 araclar/tani.py` ile kaynakları ve **özgün satırları** test et (aşağıda "Doğruluk").

## Canlı yayın (YouTube / OBS)

1. `python3 server.py`
2. OBS → Kaynak ekle → Tarayıcı → `http://127.0.0.1:8769/?yayin=1` · **1920 × 1080**
3. Müzik ayrı ses kaynağı; Mac uyumasın diye ayrı terminalde `caffeinate -dimsu`.

| Adres | Ne yapar |
|---|---|
| `?yayin=1` | Menajer modu yayını |
| `?yayin=1&sayfa=6` | Satır başına süre (1,5–9 sn, varsayılan 5: rahat okuma). Özgün + sade satırlara otomatik +1,6 sn eklenir. Törensel okuma için 6–7 |
| `?yayin=1&metin=sakarya` | Yayını o metinle başlat (kimlikler `data/metinler.json`'da) |
| `?yayin=1&sahne=harita` | Ara ekranı hemen göster: `dogrumu`, `harita`, `bugun`, `isim`, `kadro`, `oylama`, `vecize`, `sayfa`, `kronoloji`, `terimler`, `devrimler`, `gundem`, `abone` |
| `→` tuşu | Sonraki mesaja geç |
| `v` tuşu | Alarmı dene · `i` isim bildirimini dene |

**Yayın akışı:** Gelen kutusunun başında her gün **Nutuk Dizisi**'nin o günkü bölümü durur (18 bölüm, Samsun'dan Gençliğe Hitabe'ye; her gün bir sonraki).
Ardından Nutuk bölümleri **kronolojik sırayla** akar; araya söylev/telgraf/emir ve eser/belge havuzlarından metinler, gündem haberleri ve "Bugün ve Gazi" eşleşmeleri girer.
Her 4 mesajda bir 22–34 sn'lik ara ekran gelir:

| Ara ekran | İçerik |
|---|---|
| 🔍 **Doğru mu, Uydurma mı?** | Atatürk'e mal edilen sözler: belgeler ne diyor → tarihçinin notu → **damga**: ✅ BELGELİ / 🟡 TARTIŞMALI / ❌ BELGESİ YOK ("İstikbal göklerdedir", Johnny–Mehmet yazıtı, "Yurtta sulh…" dahil 8 söz) |
| 🗺️ **Kurtuluş Yolu** | Türkiye haritasında İstanbul → (Bandırma Vapuru, Karadeniz) → Samsun → Havza → Amasya → Erzurum → Sivas → Ankara → İnönü → Sakarya → Kocatepe → Dumlupınar → İzmir rotası çizilir |
| 📌 **Tarihte Bugün** | Türkçe Vikipedi'nin günün sayfasından 1881–1953 olayları + yerel kronoloji; o gün kayıt yoksa yaklaşan yıl dönümleri |
| ✍️ **Adını eski harflerle yaz** | İzleyici sohbete `!isim Ayşe` yazar → adı 1928 öncesi harflerle (harf harf, yaklaşık) ve Mors koduyla ekrana gelir |
| 🎖️ **Kadro** | Millî Mücadele kadrosu, FM kadro ekranı gibi: İsmet, Fevzi, Kâzım Karabekir, Halide Edib, Mehmet Akif, Kara Fatma, Seyit Onbaşı… |
| 🗳️ **Oylama** | "Sıradaki metni siz seçin: !1 / !2" · kazanan hemen yayına girer ("İZLEYİCİLER SEÇTİ") |
| 🗣️ **Gazi'nin Sözleri** | Özgün metinlerden 9 tam cümle, her saat farklı |
| 📖 **Nutuk'tan bir sayfa** | Vikikaynak'taki Nutuk tam metninden saatte bir **rastgele** bir paragraf, 1927'nin Türkçesiyle |
| ⏳ **Kronoloji** | 1881–1938, dönemlere göre esnetilmiş eksen (Millî Mücadele yılları geniş) |
| 📐 **Atatürk'ün Türkçesi** | Geometri (1937): zaviye → açı, müselles → üçgen, kutur → çap… |
| ⚖️ **Devrimler Panosu** | 1922–1935 arası 12 devrim, tarihleriyle |
| 📰 **Gündem** · 👍 **Abone ol** | Atatürk ve Cumhuriyet tarihi haberleri · kapanış |

Ekrandaki parçalar: FM takvimi (bugün + Cumhuriyet'in kaçıncı yılı; dönüşümlü olarak sıradaki millî güne kalan gün, Nutuk'tan bu yana geçen yıl, arşiv sayıları, tarihte bugün ya da **sıradaki 4 metin**) · Devam düğmesi · Mr. Anduv! rozeti · gelen kutusu · **Telgrafçı** maskotu ("Biliyor muydun?" balonu) · Söylev Kartı · kronoloji alt yazısı.

**Kontrol paneli:** `http://127.0.0.1:8769/panel.html` (telefondan da açılır: `http://<Mac'in IP'si>:8769/panel.html`). İsim gir, oylamaya +1 ver, yeni oylama başlat, herhangi bir ara ekranı hemen göster, "Sonraki mesaj".

**YouTube sohbeti (isteğe bağlı):** Sümer Akışı'ndaki gibi. Google Cloud Console → "YouTube Data API v3" → API anahtarı; `data/ayarlar.json`'da `apiKey` ve `videoId` alanlarını doldur, sunucuyu yeniden başlat.
Bağlantıyı burada canlı deneyemedim; bağlanmazsa panelde "hata" görünür, isimleri ve oyları panelden girersin. API anahtarını kimseyle paylaşma.

## Uygulama görünümü (telefon)

`http://127.0.0.1:8769` → sekmeler: **Metinler** (günün metni, arama, tür filtresi, "“ Özgün sözler" filtresi, okuyucu) · **Keşfet** (tarihte bugün, Nutuk dizisinin 18 bölümü, adını eski harflerle yaz, Doğru mu Uydurma mı, Bugün ve Gazi, Atatürk'ün Türkçesi, Devrimler) · **Kadro** · **Kronoloji** (+ gündem, kaynak durumu) · **Kaydettiklerim** (☆; yalnız o cihazda).
Okuyucu: özgün satırlar ve altında bugünün Türkçesi, "Biliyor muydun?", künye, Wikipedia özeti ve görseli, **Tam metin · Vikikaynak ↗**, Paylaş.

## Veri

| Ne | Nereden | Sıklık |
|---|---|---|
| Metinler (27): Nutuk'un 18 bölümü, Çanakkale, İzmir İktisat, Samsun öğretmenler, Sarayburnu, Onuncu Yıl, Medeni Bilgiler, Geometri, Vasiyetname, 10 Kasım | `data/metinler.json` | Kaydettiğin an |
| Kronoloji (57 olay), Biliyor muydun? (18), Kurtuluş Yolu, terimler, devrimler, millî günler | `data/ekler.json` | Kaydettiğin an |
| Kadro (12) · Doğru mu Uydurma mı (8) | `data/kadro.json` · `data/dogrumu.json` | Kaydettiğin an |
| Özgün satır doğrulaması + tam metin bağlantısı + rastgele Nutuk sayfası | **Vikikaynak** (tr.wikisource.org) | Günde 1 · sayfa saatte 1 |
| Özet + görsel · Tarihte bugün | **Wikipedia** (önce Türkçe) | Günde 1 |
| Gündem haberleri | `data/kaynaklar.json`: AA, TRT Haber, Habertürk, Sözcü, CNN Türk, Sabah. Yalnız Atatürk/Cumhuriyet tarihi kelimeleri geçen başlıklar | 30 dk |
| Bugün ve Gazi | `data/esler.json`: günün başlığı ↔ belgeli bir söz (eğitim, bilim, ekonomi, tarım, dil, barış, gençlik…) | 20 dk |

- **Satır biçimi:** `"düz metin"` = günümüz Türkçesiyle anlatım · `{"o": "özgün söz", "s": "bugünün Türkçesiyle"}` = Atatürk'ün kendi sözü. Ekranda özgün satır tırnakla ve kalın, karşılığı altında yeşil italikle durur.
- **Yeni metin eklemek:** `data/metinler.json`'da bir metni kopyala, alanları doldur, kaydet. Sunucuyu yeniden başlatmaya gerek yok. Nutuk dizisine girsin istiyorsan `bolum` numarası ver.
- **Tarafsızlık:** Gündem ve "Bugün ve Gazi" eşleştirmesinde parti, seçim, milletvekili, yargı, protesto gibi **günlük siyaset** kelimeleri ve ölüm/kaza/şiddet başlıkları asla kullanılmaz (`data/esler.json` → `hassas`). Yayın tarih ve metin odaklı kalır.
- Son başarılı canlı veriler `data/cache.json`'a yazılır; sunucu yeniden başlarsa ekran boş açılmaz.

API: `/api/corpus` · `/api/news` · `/api/canli` · `/api/refresh` · POST `/api/isim` · `/api/isim/sil` · `/api/oylama` · `/api/oy` · `/api/komut`

## 📱 Mağaza uygulaması (App Store + Google Play)

Telefon uygulaması bu klasörden, Yaşam Rehberi ile aynı hatla çıkar: Capacitor 7 + GitHub Actions (iOS → TestFlight, Android → imzasız .aab, `imzala.sh` ile Mac'te imza).

| | |
|---|---|
| Paket kimliği | `com.anduv.nutukakisi` · ad **Nutuk Akışı** |
| Çalışma şekli | **Sunucusuz.** Metinler `www/data/corpus.json` içinde (`npm run veri`). Telefonda OBS yayın sekmesi ve gündem gizli |
| Canlı | Yalnız "Tarihte bugün" (Türkçe Vikipedi, açık API) |
| Yerel özellikler | 🔔 Her sabah günün sözü (yerel bildirim, isteğe bağlı) · ⭐ kalıcı kayıt · 📤 paylaş · internetsiz okuma |
| Gizlilik sayfası | `docs/gizlilik.html` → https://emreanduv.github.io/nutuk-akisi/gizlilik.html |
| Mağaza metinleri / görseller | `store/magaza-metinleri.md` · `store/gorseller/` (iPhone 1206×2622, iPad 2064×2752, Play 1080×1920, simge 512, öne çıkan 1024×500) |
| Durum ve sıradaki adımlar | `YAYIN-DURUMU.md` |

Yerelde denemek: `npm run serve` → `http://127.0.0.1:8790/?cevrimdisi=1` (telefondaki gibi, sunucusuz).
YouTube API anahtarı artık `data/ayarlar.yerel.json`'a yazılır (depo herkese açık; bu dosya git'e girmez).

## Doğruluk (dürüst not)

- **Özgün satırları ezberden değil, kaynakla teyit et.** Satırlar Nutuk'un ve söylevlerin yaygın baskılarına göre yazıldı; ama Nutuk'un farklı baskılarında (1927 Arap harfli, sonraki Latin harfli ve sadeleştirilmiş baskılar) imla ve kelime farkları vardır.
  `python3 araclar/tani.py` her özgün satırı Vikikaynak'taki tam metinle karşılaştırır ve **eşleşmeyenleri listeler**. Yayında eşleşen metinlerde **✓ Vikikaynak** rozeti çıkar. Mağaza öncesi hedef: liste boş.
  Esas alınacak baskı için en sağlam kaynaklar: Türk Tarih Kurumu ve Atatürk Araştırma Merkezi (ATAM) Nutuk baskıları, *Atatürk'ün Söylev ve Demeçleri* ve *Atatürk'ün Bütün Eserleri*.
- **Vikikaynak'ı bu ortamdan deneyemedim** (buradan siteye erişim kapalıydı). Arama ve ayrıştırma esnek yazıldı: önce satırın içinden bir parça tırnak içinde aranır, bulunan sayfanın tam metniyle harf harf karşılaştırılır (şapka, noktalama, büyük-küçük harf farkı önemsiz).
  Sorun çıkarsa `server.py` içindeki `vk_one` ve `vk_paragraphs` tek düzeltme noktası.
- Düz satırlar ve "Biliyor muydun?" notları genel kabul gören bilgilere göre yazıldı. Tarihler Nutuk'taki ve yaygın kronolojilerdeki tarihlerdir.
- "Doğru mu, Uydurma mı?" hükümleri yayımlanmış araştırmalara dayanır; yeni söz eklerken mutlaka bir kaynağa dayan. Hükmü kesin olmayanlar "TARTIŞMALI" olarak işaretli.
- **Eski harflerle isim** harf harf ve yaklaşıktır; Osmanlıca imlada bazı ünlüler yazılmaz, bazı adların (Mehmet → محمد, Ayşe → عائشه) geleneksel yazılışı farklıdır. Ekranda bu not yazılı.
- Wikipedia görselleri kendi lisanslarıyla gelir; ekranda "📷 Wikipedia" yazar. Ekranda Atatürk portresi kullanılmıyor; bayrak ve kürsü çizimleri bu proje için yapıldı.

## Dosyalar

```
server.py              veri servisi (yalnız Python 3, ek kurulum yok)
data/metinler.json     27 metin: özgün satırlar + bugünün Türkçesi + anlatım + künye
data/ekler.json        kronoloji, Biliyor muydun?, Kurtuluş Yolu, sınır çizgisi, Geometri terimleri, devrimler, millî günler
data/kadro.json        Millî Mücadele kadrosu (12)
data/dogrumu.json      Doğru mu, Uydurma mı? (8 söz)
data/kaynaklar.json    gündem RSS kaynakları + anahtar kelimeler
data/esler.json        Bugün ve Gazi: eşleşme kuralları, hassas kelimeler, gündem RSS'leri
data/ayarlar.json      YouTube sohbeti, komutlar, isim süzgeci
www/index.html         uygulama + yayın tek sayfa
www/common.js          ortak veri katmanı (tarih, Mors, eski harfler, tarihte bugün, millî günler)
www/app.js|app.css     telefon/masaüstü uygulama görünümü
www/yayin.js|.css      FM2010 yayın görünümü (?yayin=1)
www/panel.html         yayın kontrol paneli
www/ses/               sesli okuma dosyaları (BENIOKU.txt)
www/config.js          mobil uygulama için sunucu adresi
araclar/tani.py        kaynak tanılama + özgün satır doğrulaması
.vscode/tasks.json     VS Code'dan tek tıkla başlat / demo / yayını aç / paneli aç / doğrula
MAGAZA-YOL-HARITASI.md App Store / Google Play'e giden yol
```

## 🥽 Nutuk Salonu (VR)
1927'deki Meclis salonu: kürsüde Nutuk'un özgün satırları ve bugünün Türkçesi, masada Kurtuluş Yolu.
- Adres: https://emreanduv.github.io/nutuk-akisi/salon/ (Quest / Vision Pro / Android XR tarayıcısında "VR'a gir"; bilgisayar ve telefonda da gezilir)
- Veri: `python3 tools/salon_veri.py` → `docs/salon/veri.json` (Nutuk Dizisi'nin 18 bölümü + harita)
- three.js 0.160 sayfanın içinde (`docs/salon/vendor/`, MIT); dış bağımlılık yok, yalnız kumanda modelleri WebXR profil deposundan gelir.
