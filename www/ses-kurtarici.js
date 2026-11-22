/*
 * ses-kurtarici.js — Mr. Anduv! oyun ve uygulamaları için ortak ses koruyucu (v3, 22 Kasım 2026)
 *
 * Sorun: Başka uygulamaya/bildirime/kilit ekranına geçip dönünce telefon, sayfanın
 * ses motorunu (AudioContext) "suspended" ya da iOS'ta "interrupted" bırakıyor;
 * iOS bazen motoru "running" gösterip sessiz de bırakabiliyor (zombi motor).
 * v2 yalnız JS'tendi; yerel taraf (iOS AVAudioSession, Android WebView) uyanmadığı
 * için ses yine gidiyordu. v3 yerel kabuktan gelen window.sesKurtar() çağrısını da alır.
 *
 * Bu dosya:
 *  - Sayfadaki her AudioContext'i (Phaser, Howler, oyunun kendi motoru) kayda alır.
 *  - Arka plana gidince sesi düzgünce durdurur; dönünce, odakta ve ilk dokunuşta
 *    birkaç kez (0 / 150 / 600 / 1500 ms) açar, sessiz dürtme sesiyle oturumu uyandırır.
 *  - Motor yine açılmazsa oyunun bildirdiği "yeniden kur" fonksiyonunu çağırır.
 *  - Duran <audio>/<video> müziklerini sürdürür.
 *  - iOS AppDelegate / Android MainActivity dönüşte window.sesKurtar() çağırır.
 *
 * Kullanım: index.html <head> içinde, BÜTÜN betiklerden ÖNCE:
 *   <script src="ses-kurtarici.js"></script>
 * İsteğe bağlı: SesKurtarici.yenidenKur(() => { AC = null; });
 * Kaynak: emreanduv/kervan-yolu www/ses-kurtarici.js (bütün repolarda aynı dosya).
 */
(function () {
  'use strict';
  var W = window;
  if (W.SesKurtarici) return;
  var contexts = [], pausedMedia = [], rebuildFns = [];
  var broken = false, kick = null;

  // 1) Oluşturulan her AudioContext'i kaydet
  ['AudioContext', 'webkitAudioContext'].forEach(function (name) {
    var Orig = W[name];
    if (!Orig || Orig.__sesKurtarici) return;
    var Wrapped = function (opts) {
      var ctx = opts ? new Orig(opts) : new Orig();
      contexts.push(ctx);
      return ctx;
    };
    Wrapped.prototype = Orig.prototype;
    try { Object.setPrototypeOf(Wrapped, Orig); } catch (e) {}
    Wrapped.__sesKurtarici = true;
    W[name] = Wrapped;
  });

  // iOS 17+: oyun sesi, diğer seslerle karışabilir
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}

  // 2) Sessiz dürtme sesi (iOS'ta askıda kalan oturumu yeniden başlatır)
  function makeKick() {
    try {
      var n = 800, sr = 8000, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
      var w = function (o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
      w(36, 'data'); v.setUint32(40, n * 2, true);
      kick = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })));
      kick.setAttribute('playsinline', '');
      kick.preload = 'auto';
    } catch (e) { kick = null; }
  }

  function alive() { return contexts.filter(function (c) { return c.state !== 'closed'; }); }
  function allContexts() {
    var list = alive();
    try { if (W.Howler && Howler.ctx && list.indexOf(Howler.ctx) < 0) list.push(Howler.ctx); } catch (e) {}
    return list;
  }

  // Açtıktan yarım saniye sonra motor gerçekten çalışıyor mu? (saat ilerliyor mu)
  function checkLater() {
    var snaps = allContexts().map(function (c) { return [c, c.currentTime]; });
    setTimeout(function () {
      if (document.hidden) return;
      snaps.forEach(function (s) {
        if (s[0].state === 'closed') return;
        if (s[0].state !== 'running' || s[0].currentTime - s[1] < 0.1) broken = true;
      });
    }, 500);
  }

  function wake() {
    if (document.hidden) return;
    if (broken && rebuildFns.length) {
      broken = false;
      alive().forEach(function (c) { try { c.close(); } catch (e) {} });
      rebuildFns.forEach(function (fn) { try { fn(); } catch (e) {} });
    }
    if (!kick) makeKick();
    if (kick) { try { kick.currentTime = 0; var p = kick.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
    allContexts().forEach(function (c) {
      if (c.state !== 'running') { try { c.resume().catch(function () { broken = true; }); } catch (e) {} }
      try { // boş bir ses parçası çalarak motoru dürt
        var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
        s.buffer = b; s.connect(c.destination); s.start(0);
      } catch (e) {}
    });
    var pm = pausedMedia; pausedMedia = [];
    pm.forEach(function (m) { try { var p = m.play(); if (p && p.catch) p.catch(function () { pausedMedia.push(m); }); } catch (e) {} });
    checkLater();
  }
  // Dönüşte telefon ilk denemeyi reddedebilir: birkaç kez dene
  function later() { wake(); setTimeout(wake, 150); setTimeout(wake, 600); setTimeout(wake, 1500); }

  function sleep() {
    allContexts().forEach(function (c) { if (c.state === 'running') { try { c.suspend().catch(function () {}); } catch (e) {} } });
    try {
      document.querySelectorAll('audio,video').forEach(function (m) {
        if (!m.paused && m !== kick) { m.pause(); pausedMedia.push(m); }
      });
    } catch (e) {}
  }

  // 3) Her dokunuşta: ses kapalı ya da bozuksa aç (tarayıcı yalnız dokunuşla izin verir)
  ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, function () {
      var needs = broken || pausedMedia.length ||
        allContexts().some(function (c) { return c.state !== 'running'; });
      if (needs) wake();
    }, { capture: true, passive: true });
  });

  // 4) Arka plana gidiş / dönüş
  document.addEventListener('visibilitychange', function () { document.hidden ? sleep() : later(); });
  W.addEventListener('pagehide', sleep);
  W.addEventListener('pageshow', later);
  W.addEventListener('focus', later);

  // 5) Capacitor yerel olayları
  document.addEventListener('pause', sleep, false);
  document.addEventListener('resume', later, false);
  function hookCapacitor() {
    try {
      var App = W.Capacitor && W.Capacitor.Plugins && W.Capacitor.Plugins.App;
      if (App && App.addListener) { App.addListener('appStateChange', function (s) { s.isActive ? later() : sleep(); }); return true; }
    } catch (e) {}
    return false;
  }
  if (!hookCapacitor()) W.addEventListener('load', hookCapacitor);

  W.SesKurtarici = {
    yenidenKur: function (fn) { if (typeof fn === 'function') rebuildFns.push(fn); },
    uyandir: later,
    durum: function () { return allContexts().map(function (c) { return c.state; }); }
  };
  // iOS AppDelegate ve Android MainActivity dönüşte bunu çağırır
  W.sesKurtar = later;
  W.sesKurtarDurum = W.SesKurtarici.durum;
})();
