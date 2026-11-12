/* Mr. Anduv! dil paketi (Türkçe / English) — bütün oyunlarda aynı dosya.
   Kaynak: emreanduv/legend-heads www/dil.js. Sözlük ayrı dosyada: window.DIL_EN = { 'Türkçe metin': 'English text', ... }
   - İlk açılışta dil sorulur (Türkçe öne seçili), seçim cihazda saklanır. Bu soru atlanmaz.
   - İngilizcede sayfadaki yazılar (DOM) ve tuvale (canvas) yazılan metinler sözlükle çevrilir.
   - Sözlükte {0} {1} gibi yer tutucular kalıp olur: 'Maç {0}' → 'Match {0}'. Yakalanan parçalar da çevrilir.
   - Ayarlar'dan DIL.degistir() ile değiştirilir (sayfa yeniden yüklenir). */
(function () {
  var ANAHTAR = 'mranduv.dil';
  var kod = null;
  try { kod = localStorage.getItem(ANAHTAR); } catch (e) {}
  var SOZ = {}, KALIP = [], eksik = new Set(), DEGER = {};
  var TR_HARF = /[ğüşıöçĞÜŞİÖÇ]/;

  function hazirla() {
    var src = window.DIL_EN || {};
    Object.keys(src).forEach(function (k) { DEGER[src[k]] = 1;
      if (/\{\d\}/.test(k)) {
        var parca = k.split(/(\{\d\})/), sira = [], rx = '^';
        parca.forEach(function (p) {
          var m = p.match(/^\{(\d)\}$/);
          if (m) { sira.push(+m[1]); rx += '([\\s\\S]+?)'; } else rx += p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });
        KALIP.push({ rx: new RegExp(rx + '$'), sira: sira, hedef: src[k] });
      } else SOZ[k] = src[k];
    });
    // Özel kalıp önce: sabit yazısı uzun olan kalıp, kısa ve genel olandan önce denenir
    KALIP.forEach(function (K) { K.uz = K.rx.source.replace(/\(\[\\s\\S\]\+\?\)/g, '').length; });
    KALIP.sort(function (a, b) { return b.uz - a.uz; });
  }

  // Çevrilmeden kalan parça: harf içeriyor ve sözlükte (Türkçe ya da İngilizce değer olarak) yok
  function cevrilmedi(p) { var k = p.trim(); return /[A-Za-zÇĞİÖŞÜçğıöşü]{2}/.test(k) && !DEGER[k] && !Object.prototype.hasOwnProperty.call(SOZ, k); }
  var derin = 0;
  function t(s) {
    if (kod !== 'en' || typeof s !== 'string' || !s) return s;
    if (derin > 12) return s;   // güvenlik: kalıplar iç içe sonsuza dönmesin
    derin++;
    try { return t0(s); } finally { derin--; }
  }
  function t0(s) {
    var bas = s.match(/^\s*/)[0], son = s.match(/\s*$/)[0], ic = s.trim();
    if (!ic) return s;
    if (Object.prototype.hasOwnProperty.call(SOZ, ic)) return bas + SOZ[ic] + son;
    for (var i = 0; i < KALIP.length; i++) {
      var m = ic.match(KALIP[i].rx);
      if (m) {
        var out = KALIP[i].hedef, K = KALIP[i], olmadi = false;
        K.sira.forEach(function (n, j) { var p = t(m[j + 1]); if (p === m[j + 1] && cevrilmedi(p)) olmadi = true; out = out.split('{' + n + '}').join(p); });
        if (!olmadi) return bas + out + son;   // yakalanan parça çevrilemediyse bu kalıp yanlış eşleşmiştir; sıradakine bak
      }
    }
    // Parçalardan kurulan cümleler: cümle cümle çevir (hepsi bulunursa); sondaki noktayı ayırıp dene
    var nokta = ic.match(/^([\s\S]+?)([.!:]+)$/);
    if (nokta) { var y2 = t(nokta[1]); if (y2 !== nokta[1]) return bas + y2 + nokta[2] + son; }
    if (!t.ic) {
      var parca = ic.split(/((?<=[.!?…"])\s+)/);   // ayraçlar (boşluk, satır sonu) korunur
      if (parca.length > 1) {
        t.ic = true;
        try {
          var tamam = true, cik = parca.map(function (x, i) { if (i % 2) return x; var y = t(x); if (y === x && cevrilmedi(x)) tamam = false; return y; });
          if (tamam) return bas + cik.join('') + son;
        } finally { t.ic = false; }
      }
    }
    if (TR_HARF.test(ic) || (window.DIL_TOPLA && /[A-Za-z]{2}/.test(ic) && !DEGER[ic])) eksik.add(ic);
    return s;
  }

  // ---- tuval (canvas) ----
  function tuvalYamala() {
    var P = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
    if (!P || P.__dil) return; P.__dil = true;
    ['fillText', 'strokeText', 'measureText'].forEach(function (ad) {
      var asil = P[ad];
      P[ad] = function (yazi) { var a = Array.prototype.slice.call(arguments); a[0] = t(String(yazi)); return asil.apply(this, a); };
    });
  }

  // ---- sayfa (DOM) ----
  var ATTR = ['title', 'aria-label', 'placeholder', 'alt'];
  function dugum(n) {
    if (n.nodeType === 3) { var y = t(n.nodeValue); if (y !== n.nodeValue) n.nodeValue = y; return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    ATTR.forEach(function (a) { var v = n.getAttribute && n.getAttribute(a); if (v) { var y = t(v); if (y !== v) n.setAttribute(a, y); } });
    for (var c = n.firstChild; c; c = c.nextSibling) dugum(c);
  }
  function sayfaCevir() {
    dugum(document.body);
    if (document.title) document.title = t(document.title);
    new MutationObserver(function (l) {
      l.forEach(function (m) {
        if (m.type === 'characterData') dugum(m.target);
        else if (m.type === 'attributes') dugum(m.target);
        else m.addedNodes.forEach(dugum);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
  }

  // ---- ilk açılışta dil sorusu ----
  function sor(bitti) {
    var ov = document.createElement('div');
    ov.id = 'dilSoru';
    ov.setAttribute('style', 'position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;background:rgba(10,8,20,.94);font-family:inherit;color:#fff3dc;');
    ov.innerHTML = '<div style="text-align:center;padding:24px;max-width:420px;width:86%">' +
      '<div style="font-size:15px;opacity:.75;letter-spacing:.12em;margin-bottom:14px">DİL · LANGUAGE</div>' +
      '<button data-k="tr" style="display:block;width:100%;margin:10px 0;padding:16px;font:inherit;font-size:22px;font-weight:800;border-radius:14px;border:3px solid #ffc93c;background:#ffc93c;color:#1a1020">Türkçe</button>' +
      '<button data-k="en" style="display:block;width:100%;margin:10px 0;padding:16px;font:inherit;font-size:22px;font-weight:800;border-radius:14px;border:3px solid #fff3dc;background:transparent;color:#fff3dc">English</button>' +
      '<div style="font-size:12px;opacity:.6;margin-top:16px">Bir Mr. Anduv! yapımıdır.</div></div>';
    var b = ov.querySelectorAll('button'), odak = 0;
    function boya() { b.forEach(function (x, i) { x.style.outline = i === odak ? '3px solid #3fd2ff' : 'none'; x.style.outlineOffset = '3px'; }); }
    function sec(k) {
      try { localStorage.setItem(ANAHTAR, k); } catch (e) {}
      document.removeEventListener('keydown', tus, true);
      clearInterval(kol);
      ov.remove(); bitti(k);
    }
    function tus(e) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].indexOf(e.key) >= 0) { odak = 1 - odak; boya(); e.preventDefault(); e.stopPropagation(); }
      else if (e.key === 'Enter' || e.key === ' ') { sec(b[odak].dataset.k); e.preventDefault(); e.stopPropagation(); }
    }
    var onceki = {};
    var kol = setInterval(function () {
      var g = navigator.getGamepads ? navigator.getGamepads() : [];
      for (var i = 0; i < g.length; i++) {
        var p = g[i]; if (!p) continue;
        var yuk = p.buttons[12] && p.buttons[12].pressed, as = p.buttons[13] && p.buttons[13].pressed, a = p.buttons[0] && p.buttons[0].pressed;
        if ((yuk || as) && !onceki.y) { odak = 1 - odak; boya(); }
        if (a && !onceki.a) sec(b[odak].dataset.k);
        onceki = { y: yuk || as, a: a };
      }
    }, 120);
    b.forEach(function (x, i) { x.addEventListener('click', function (e) { e.stopPropagation(); sec(x.dataset.k); }); });
    document.addEventListener('keydown', tus, true);
    boya();
    document.body.appendChild(ov);
  }

  function uygula() {
    document.documentElement.lang = kod === 'en' ? 'en' : 'tr';
    if (kod === 'en') sayfaCevir();
  }

  hazirla();
  if (kod === 'en') tuvalYamala();
  function basla() {
    // İlk seçimde English: sayfa yeniden açılır ki oyunun açılışta kurduğu bütün yazılar (tuval, oyun motoru) baştan İngilizce kurulsun
    if (!kod) sor(function (k) { if (k === 'en') { location.reload(); return; } kod = k; uygula(); });
    else uygula();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla); else basla();

  window.DIL = {
    get kod() { return kod || 'tr'; },
    t: t,
    // HTML metni: etiketler korunur, aradaki yazı parçaları ayrı ayrı çevrilir (ör. daktilo gibi akan yazıdan önce)
    html: function (h) { if (kod !== 'en' || typeof h !== 'string') return h; return h.split(/(<[^>]*>)/).map(function (p) { return p.charAt(0) === '<' ? p : t(p); }).join(''); },
    eksik: function () { return Array.from(eksik); },
    ad: function () { return kod === 'en' ? 'English' : 'Türkçe'; },
    degistir: function () {
      var yeni = kod === 'en' ? 'tr' : 'en';
      try { localStorage.setItem(ANAHTAR, yeni); } catch (e) {}
      location.reload();
    },
  };
})();
