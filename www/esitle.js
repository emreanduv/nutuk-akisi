/* Mr. Anduv! eşitleme (G84): oyun/uygulama kaydı cihazlar arasında kaldığı yerden devam eder.
   iPhone, iPad, Mac: Apple'ın iCloud anahtar-değer deposu (NSUbiquitousKeyValueStore; yerel eklenti "Esitle",
   ios/App/App/SceneDelegate.swift, kurulum araclar/esitle_kur.py). Sunucu yok, üyelik yok; veri kullanıcının
   kendi iCloud hesabında durur. Android: telefon değişince Google'ın kendi yedeği (android:allowBackup) geri yükler.
   Kullanım (oyun betiklerinden ÖNCE):
     <script src="esitle.js"></script>                       → bütün kayıtlar eşitlenir (cihaza özgü olanlar hariç)
     <script>window.ESITLE_ANAHTARLAR = ['kayit-v1'];</script> → yalnız bu anahtarlar (isteğe bağlı)
     window.ESITLE_HARIC = /kumanda|.../                     → eşitlenmeyecek anahtarlar (isteğe bağlı)
   Kural: en son değişen kazanır (ilk eşitlemede çakışan iki kayıttan daha uzun olanı). Her anahtarın yanında "anahtar·t" (zaman) ve "anahtar·h" (son eşitlenen değerin özeti)
   tutulur; özet tutmazsa değer kancanın dışında (iframe, motor) değişmiştir ve yerel daha yeni sayılır. */
(function () {
  'use strict';
  var C = window.Capacitor, yerli = !!(C && C.isNativePlatform && C.isNativePlatform());
  var P = yerli ? ((C.Plugins && C.Plugins.Esitle) || (C.isPluginAvailable && C.isPluginAvailable('Esitle') && C.registerPlugin ? C.registerPlugin('Esitle') : null)) : null;
  var LISTE = window.ESITLE_ANAHTARLAR ? window.ESITLE_ANAHTARLAR.slice() : null;
  // Cihaza özgü olanlar eşitlenmez: kumanda ölçüsü, VR görünüşü, ekran/ses aygıt ayarları, eşitlemenin kendi işaretleri
  var HARIC = window.ESITLE_HARIC || /kumanda|gbW|gorunum|vr[_-]|ekran|olcu|·\w+$|^esitle|^_|capacitor|^CapacitorStorage/i;
  var E = window.ESITLE = { durum: P ? 'bekliyor' : 'yok', son: 0, bekleyen: false };
  if (!P) return;

  var LS = window.localStorage, setI = Storage.prototype.setItem, remI = Storage.prototype.removeItem, getI = Storage.prototype.getItem;
  var izli = function (k) { return typeof k === 'string' && (LISTE ? LISTE.indexOf(k) >= 0 : !HARIC.test(k)); };
  var tk = function (k) { return k + '·t'; }, hk = function (k) { return k + '·h'; };
  var yerelT = function (k) { return +(getI.call(LS, tk(k)) || 0); };
  var ozet = function (v) { if (v == null) return 'yok'; var h = 5381; for (var i = 0; i < v.length; i++) h = ((h << 5) + h + v.charCodeAt(i)) | 0; return v.length + ':' + h; };
  var zamanlayici = 0, kirli = {}, hazir = false, erken = {};

  function gonder() {
    zamanlayici = 0; var d = {}, n = 0;
    for (var k in kirli) { var v = getI.call(LS, k); d[k] = JSON.stringify({ t: yerelT(k), v: v }); setI.call(LS, hk(k), ozet(v)); n++; }
    kirli = {}; if (!n) return;
    P.yaz({ degerler: d }).then(function () { E.son = Date.now(); E.durum = 'esit'; }).catch(function () { E.durum = 'hata'; });
  }
  // İlk karşılaştırma bitmeden oyunun yaptığı yazışlar damgalanmaz: buluttaki daha yeni kayıt ezilmesin
  function isaretle(k) { if (!hazir) { erken[k] = 1; return; } setI.call(LS, tk(k), String(Date.now())); kirli[k] = 1; if (!zamanlayici) zamanlayici = setTimeout(gonder, 1500); }

  // Oyunun kendi yazışları: yerel yazılır, zaman damgası güncellenir, 1,5 sn sonra buluta gider
  Storage.prototype.setItem = function (k, v) { setI.call(this, k, v); if (this === LS && izli(k)) isaretle(k); };
  // Silme ("Verilerimi sil") hemen buluta da gider: kayıt bütün cihazlardan silinir
  Storage.prototype.removeItem = function (k) { remI.call(this, k); if (this === LS && izli(k)) { isaretle(k); if (hazir) { clearTimeout(zamanlayici); gonder(); } } };
  var clr = Storage.prototype.clear;
  Storage.prototype.clear = function () { var ks = []; if (this === LS) for (var i = 0; i < LS.length; i++) if (izli(LS.key(i))) ks.push(LS.key(i)); clr.call(this); ks.forEach(isaretle); if (hazir && ks.length) { clearTimeout(zamanlayici); gonder(); } };

  // Buluttakiyle karşılaştır: yenisi buluttaysa yerele yaz (true döner), yerel yeniyse buluta gönder
  function karsilastir() {
    return P.oku({ anahtarlar: LISTE || [] }).then(function (r) {
      var b = (r && r.degerler) || {}, degisti = false, ks = {};
      E.icloud = !!(r && r.icloud);
      Object.keys(b).forEach(function (k) { if (izli(k)) ks[k] = 1; });
      for (var i = 0; i < LS.length; i++) { var lk = LS.key(i); if (izli(lk)) ks[lk] = 1; }
      Object.keys(ks).forEach(function (k) {
        var bulut = null; try { bulut = b[k] ? JSON.parse(b[k]) : null; } catch (e) {}
        var yv = getI.call(LS, k), yt = yerelT(k), sh = getI.call(LS, hk(k));
        if (yv != null && sh !== ozet(yv) && !(bulut && bulut.v === yv)) {
          // Bu cihazda hiç eşitlenmemiş kayıt buluttakiyle çakışıyor (güncellemeden önce iki cihazda da oynanmış):
          // hangisi daha çok ilerlemişse (daha uzun kayıt) o kalır; öteki "anahtar·eski" olarak bu cihazda saklanır
          var yerelKazanir = sh || !bulut || bulut.v == null || yv.length >= bulut.v.length;
          if (!sh && bulut && bulut.v != null) setI.call(LS, k + '·eski', yerelKazanir ? bulut.v : yv);
          // Kancanın dışında değişmiş (özet tutmuyor; iframe, oyun motoru): yerel daha yeni sayılır
          if (yerelKazanir) { yt = Math.max(Date.now(), (bulut ? bulut.t : 0) + 1); setI.call(LS, tk(k), String(yt)); }
          else yt = 0;
        }
        if (bulut && bulut.t > yt) {
          if (bulut.v !== yv) { if (bulut.v == null) remI.call(LS, k); else setI.call(LS, k, bulut.v); degisti = true; }
          setI.call(LS, tk(k), String(bulut.t)); setI.call(LS, hk(k), ozet(bulut.v));
        } else if (!bulut ? yv != null : yt > bulut.t) {
          if (!yt) setI.call(LS, tk(k), String(Date.now()));
          kirli[k] = 1;
        }
      });
      if (!hazir) { hazir = true; if (!degisti) for (var k2 in erken) isaretle(k2); erken = {}; }
      gonder(); E.durum = 'esit'; E.son = Date.now();
      return degisti;
    }).catch(function () { E.durum = 'hata'; if (!hazir) { hazir = true; for (var k3 in erken) isaretle(k3); erken = {}; } return false; });
  }
  // Başka cihazdaki ilerleme geldiyse oyun en baştan o kayıtla açılır (tek sefer; döngü olmaz)
  function yenile(degisti) {
    if (!degisti) return;
    var b = 'esitle-yenilendi', s = window.sessionStorage;
    try { if (s.getItem(b) && Date.now() - +s.getItem(b) < 5000) return; s.setItem(b, String(Date.now())); } catch (e) {}
    location.reload();
  }

  karsilastir().then(yenile);
  // Oyun sırasında gelen değişiklik oyunu bölmez: uygulamaya dönüldüğünde uygulanır
  P.addListener('degisti', function () { E.bekleyen = true; });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { if (zamanlayici) { clearTimeout(zamanlayici); gonder(); } return; }
    karsilastir().then(function (d) { E.bekleyen = false; yenile(d); });
  });
  window.addEventListener('pagehide', function () { if (zamanlayici) { clearTimeout(zamanlayici); gonder(); } });
})();
