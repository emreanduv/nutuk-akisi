// Nutuk Salonu — Tam Metin okuyucusu (telefon uygulamasındaki Tam Metin sekmesinin salondaki karşılığı).
// Nutuk'un (1927) Vikikaynak'taki tam metni: 20 bölüm, vesikalar dahil. Bölüm → kısım → sayfa; sanal klavyeyle arama; kaldığın yer hatırlanır.
// VR'da sağ el ışınla dokunur, sol el tetiği sonraki sayfa, kavrama önceki; bilgisayarda fare ve klavye, telefonda dokunuş. Bir Mr. Anduv! yapımıdır.
export function tamKur(o){
  const { THREE, scene, camera, renderer, tiklanir, doku, tuval, yuvarlak, sar, RENK } = o;
  const Wc = 1600, Hc = 1200, PW = 1.8, PH = 1.35, SATIR = 15, KAYIT = 'ns.tam';
  const [c, x] = tuval(Wc, Hc); const tx = doku(c);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map:tx, transparent:true, toneMapped:false, depthTest:false }));
  mesh.renderOrder = 12; mesh.visible = false; mesh.name = 'tam'; scene.add(mesh);
  let veri = null, yukleniyor = null, hata = '', bolgeler = [];
  const T = Object.assign({ g:'liste', b:0, ks:0, k:0, s:0, q:'', sonuc:[], ss:0, kaldi:null }, (() => { try { const k = JSON.parse(localStorage.getItem(KAYIT) || 'null'); return k ? { kaldi:k } : {}; } catch(e){ return {}; } })());
  const kaydet = () => { try { localStorage.setItem(KAYIT, JSON.stringify({ b:T.b, k:T.k, s:T.s })); T.kaldi = { b:T.b, k:T.k, s:T.s }; } catch(e){} };
  const kisaltilmis = (t, gen) => { if(x.measureText(t).width <= gen) return t; while(t.length > 1 && x.measureText(t + '…').width > gen) t = t.slice(0, -1); return t + '…'; };
  const kucuk = (s) => s.toLocaleLowerCase('tr');

  function yukle(){
    if(veri || yukleniyor) return yukleniyor;
    yukleniyor = fetch(o.url).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { veri = d; ciz(); }).catch(e => { hata = 'Tam metin yüklenemedi. İnternet bağlantını kontrol et.'; yukleniyor = null; ciz(); });
    return yukleniyor;
  }

  // ── çizim yardımcıları ──
  function dugme(bx, by, bw, bh, yazi, fn, tur){
    yuvarlak(x, bx, by, bw, bh, 18); x.fillStyle = tur === 'ana' ? RENK.red : tur === 'koyu' ? RENK.navy : '#efe6d4'; x.fill();
    x.strokeStyle = tur === 'ana' ? '#7a0a1c' : '#c8bc9a'; x.lineWidth = 3; x.stroke();
    x.fillStyle = tur === 'ana' || tur === 'koyu' ? '#fff' : RENK.ink; x.font = "800 38px 'DM Sans'"; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(yazi, bx + bw / 2, by + bh / 2 + 2); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    if(fn) bolgeler.push({ x:bx, y:by, w:bw, h:bh, fn });
  }
  function satir(by, sol, yazi, fn, isaret){
    yuvarlak(x, 60, by, Wc - 120, 76, 14); x.fillStyle = isaret ? '#fff4d6' : '#ffffff'; x.fill(); x.strokeStyle = isaret ? RENK.gold : '#e2d8c6'; x.lineWidth = isaret ? 4 : 2; x.stroke();
    x.fillStyle = RENK.red; x.font = "900 36px 'Barlow Condensed', 'DM Sans'"; x.fillText(sol, 84, by + 50);
    x.fillStyle = RENK.ink; x.font = "600 34px 'DM Sans'"; x.fillText(kisaltilmis(yazi, Wc - 340), 210, by + 50);
    bolgeler.push({ x:60, y:by, w:Wc - 120, h:76, fn });
  }
  function cerceve(baslik, alt){
    x.clearRect(0, 0, Wc, Hc); yuvarlak(x, 6, 6, Wc - 12, Hc - 12, 30); x.fillStyle = RENK.paper; x.fill();
    x.save(); yuvarlak(x, 6, 6, Wc - 12, Hc - 12, 30); x.clip();
    for(let i = 0; i < Wc; i += 100){ x.fillStyle = i / 100 % 2 ? RENK.navy2 : RENK.navy; x.fillRect(i, 0, 100, 120); }
    x.fillStyle = RENK.red; x.fillRect(0, 120, Wc, 8); x.restore();
    x.strokeStyle = '#c8bc9a'; x.lineWidth = 4; yuvarlak(x, 6, 6, Wc - 12, Hc - 12, 30); x.stroke();
    x.fillStyle = '#f2c870'; x.font = "900 48px 'DM Sans'"; x.fillText('📖 ' + baslik, 44, 80);
    if(alt){ x.fillStyle = '#d3def3'; x.font = "700 30px 'DM Sans'"; x.fillText(kisaltilmis(alt, 760), 44, 112 - 2); }
    dugme(Wc - 140, 22, 110, 76, '✕', kapat, 'koyu');
    if(T.g !== 'ara') dugme(Wc - 330, 22, 175, 76, '🔍 Ara', () => { T.g = 'ara'; ciz(); }, 'koyu');
    x.fillStyle = '#7d7461'; x.font = "700 26px 'DM Sans'"; x.textAlign = 'right'; x.fillText('Vikikaynak · kamu malı · Bir Mr. Anduv! yapımıdır.', Wc - 44, Hc - 28); x.textAlign = 'left';
  }
  function sayfaAlt(sira, toplam, geri, ileri){
    dugme(60, Hc - 130, 180, 80, '◀︎', geri); dugme(260, Hc - 130, 180, 80, '▶︎', ileri, 'ana');
    x.fillStyle = RENK.muted; x.font = "800 32px 'DM Sans'"; x.fillText(`${sira} / ${toplam}`, 470, Hc - 78);
  }

  // ── görünümler ──
  function sayfalar(b, k){ // kısmın metnini satırlara böl, sayfala
    const K = veri.bolumler[b].kisimlar[k]; x.font = "500 38px 'DM Sans'";
    const sat = []; (K.p || []).forEach((p, pi) => { sar(x, p, Wc - 150).forEach(l => sat.push({ l, pi })); sat.push({ l:'', pi }); });
    const S = []; for(let i = 0; i < sat.length; i += SATIR) S.push(sat.slice(i, i + SATIR)); return S.length ? S : [[{ l:'(Bu kısımda metin yok.)', pi:0 }]];
  }
  function ciz(){
    bolgeler = [];
    if(!veri){ cerceve('NUTUK · TAM METİN', ''); x.fillStyle = hata ? RENK.red : RENK.ink; x.font = "700 44px 'DM Sans'"; x.fillText(hata || 'Tam metin yükleniyor…', 80, 300); if(hata) dugme(80, 360, 360, 90, 'Yeniden dene', () => { hata = ''; yukle(); ciz(); }, 'ana'); tx.needsUpdate = true; return; }
    const B = veri.bolumler;
    if(T.g === 'liste'){
      cerceve('NUTUK · TAM METİN', `${B.length} bölüm · vesikalar dahil · 1927`);
      let y = 150;
      if(T.kaldi && B[T.kaldi.b] && B[T.kaldi.b].kisimlar[T.kaldi.k]){ const K = B[T.kaldi.b].kisimlar[T.kaldi.k]; dugme(60, y, Wc - 120, 70, `▶︎ Kaldığın yerden: ${B[T.kaldi.b].romen}. bölüm · ${kisaltilmis(K.baslik, 900)}`, () => { Object.assign(T, { g:'oku', b:T.kaldi.b, k:T.kaldi.k, s:T.kaldi.s || 0 }); ciz(); }, 'ana'); y += 86; }
      const yar = Math.ceil(B.length / 2), gen = (Wc - 140) / 2, boy = Math.min(80, (Hc - 170 - y) / yar);
      B.forEach((b, i) => { const sx = 60 + (i < yar ? 0 : gen + 20), sy = y + (i % yar) * boy;
        yuvarlak(x, sx, sy, gen, boy - 8, 12); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = '#e2d8c6'; x.lineWidth = 2; x.stroke();
        x.fillStyle = RENK.red; x.font = "900 34px 'Barlow Condensed', 'DM Sans'"; x.fillText(b.romen, sx + 18, sy + boy / 2 + 6);
        x.fillStyle = RENK.ink; x.font = "600 29px 'DM Sans'"; x.fillText(kisaltilmis(b.baslik, gen - 110), sx + 92, sy + boy / 2 + 6);
        bolgeler.push({ x:sx, y:sy, w:gen, h:boy - 8, fn:() => { Object.assign(T, { g:'kisim', b:i, ks:0 }); ciz(); } }); });
    } else if(T.g === 'kisim'){
      const b = B[T.b], K = b.kisimlar, n = 10, top = Math.max(1, Math.ceil(K.length / n));
      cerceve(`${b.romen}. BÖLÜM`, b.baslik); dugme(60, 145, 200, 66, '‹ Bölümler', () => { T.g = 'liste'; ciz(); });
      x.fillStyle = RENK.muted; x.font = "700 30px 'DM Sans'"; x.fillText(`${K.length} kısım`, 290, 188);
      K.slice(T.ks * n, T.ks * n + n).forEach((k, i) => { const ki = T.ks * n + i; satir(230 + i * 84, k.harf || String(ki + 1), k.baslik, () => { Object.assign(T, { g:'oku', k:ki, s:0 }); ciz(); }, T.kaldi && T.kaldi.b === T.b && T.kaldi.k === ki); });
      sayfaAlt(T.ks + 1, top, () => { T.ks = Math.max(0, T.ks - 1); ciz(); }, () => { T.ks = Math.min(top - 1, T.ks + 1); ciz(); });
    } else if(T.g === 'oku'){
      const b = B[T.b], K = b.kisimlar[T.k], S = sayfalar(T.b, T.k); T.s = Math.min(T.s, S.length - 1);
      cerceve(`${b.romen}. BÖLÜM · ${K.harf || ''}`, K.baslik); dugme(60, 140, 190, 62, '‹ Kısımlar', () => { T.g = 'kisim'; T.ks = Math.floor(T.k / 10); ciz(); });
      x.fillStyle = RENK.deep; x.font = "800 36px 'DM Sans'"; x.fillText(kisaltilmis(K.baslik, Wc - 330), 280, 184);
      x.fillStyle = '#1a1a2e'; x.font = "500 38px 'DM Sans'"; let y = 262;
      const vurgu = T.q && T.vurgu != null ? T.vurgu : -1;
      for(const s of S[T.s]){ if(s.pi === vurgu && s.l){ x.fillStyle = '#fff1b8'; x.fillRect(70, y - 38, Wc - 140, 50); x.fillStyle = '#1a1a2e'; } x.fillText(s.l, 76, y); y += 54; }
      sayfaAlt(T.s + 1, S.length, () => cevir(-1), () => cevir(1));
      x.fillStyle = RENK.muted; x.font = "700 28px 'DM Sans'"; x.fillText(`kısım ${T.k + 1}/${b.kisimlar.length}`, 640, Hc - 78);
      kaydet();
    } else if(T.g === 'ara'){
      cerceve('ARA · NUTUK\'UN TAMAMINDA', 'harflere dokun; en az 3 harf');
      dugme(60, 140, 200, 62, '‹ Bölümler', () => { T.g = 'liste'; ciz(); });
      yuvarlak(x, 280, 138, Wc - 340, 66, 14); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = RENK.gold; x.lineWidth = 3; x.stroke();
      x.fillStyle = RENK.ink; x.font = "800 40px 'DM Sans'"; x.fillText((T.q || '') + '▏', 300, 186);
      const H = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split(''); const kw = 104, kh = 70;
      H.forEach((h, i) => { const r = Math.floor(i / 14), cc = i % 14; dugme(60 + cc * (kw + 4), 222 + r * (kh + 6), kw, kh, h, () => yaz(h)); });
      dugme(60 + 1 * (kw + 4), 222 + 2 * (kh + 6), kw * 3, kh, 'boşluk', () => yaz(' '));
      dugme(60 + 4 * (kw + 4), 222 + 2 * (kh + 6), kw * 2, kh, '⌫ sil', () => { T.q = T.q.slice(0, -1); ara(); });
      dugme(60 + 6 * (kw + 4), 222 + 2 * (kh + 6), kw * 2, kh, 'temizle', () => { T.q = ''; ara(); });
      const R = T.sonuc, n = 6, top = Math.max(1, Math.ceil(R.length / n)), y0 = 470;
      x.fillStyle = RENK.muted; x.font = "700 30px 'DM Sans'"; x.fillText(T.q.trim().length < 3 ? 'Örnek: SAKARYA, AMASYA, MİSAKIMİLLÎ' : R.length ? `${R.length >= 200 ? '200+' : R.length} sonuç` : 'Sonuç yok', 60, y0 - 10);
      R.slice(T.ss * n, T.ss * n + n).forEach((r, i) => { const b = B[r.b], K = b.kisimlar[r.k];
        satir(y0 + i * 84, b.romen + '.' + (K.harf || ''), `${K.baslik} — ${r.parca}`, () => { const S = sayfalar(r.b, r.k); const si = Math.max(0, S.findIndex(p => p.some(s => s.pi === r.pi))); Object.assign(T, { g:'oku', b:r.b, k:r.k, s:si, vurgu:r.pi }); ciz(); }); });
      if(R.length > n) sayfaAlt(T.ss + 1, top, () => { T.ss = Math.max(0, T.ss - 1); ciz(); }, () => { T.ss = Math.min(top - 1, T.ss + 1); ciz(); });
    }
    tx.needsUpdate = true;
  }
  function yaz(h){ if(T.q.length < 28){ T.q += h; ara(); } }
  function ara(){
    T.sonuc = []; T.ss = 0; const q = kucuk(T.q.trim());
    if(q.length >= 3) outer: for(let b = 0; b < veri.bolumler.length; b++){ const K = veri.bolumler[b].kisimlar;
      for(let k = 0; k < K.length; k++){ const P = K[k].p || [];
        for(let pi = 0; pi < P.length; pi++){ const t = kucuk(P[pi]), j = t.indexOf(q); if(j < 0) continue;
          const bas = Math.max(0, j - 30); T.sonuc.push({ b, k, pi, parca:(bas ? '…' : '') + P[pi].slice(bas, j + q.length + 50) }); if(T.sonuc.length >= 200) break outer; } } }
    ciz();
  }
  function cevir(d){
    const B = veri.bolumler, S = sayfalar(T.b, T.k); T.vurgu = null;
    if(d > 0){ if(T.s < S.length - 1) T.s++; else if(T.k < B[T.b].kisimlar.length - 1){ T.k++; T.s = 0; } else if(T.b < B.length - 1){ T.b++; T.k = 0; T.s = 0; } }
    else { if(T.s > 0) T.s--; else if(T.k > 0){ T.k--; T.s = sayfalar(T.b, T.k).length - 1; } else if(T.b > 0){ T.b--; T.k = B[T.b].kisimlar.length - 1; T.s = sayfalar(T.b, T.k).length - 1; } }
    ciz(); if(o.cevrildi) o.cevrildi();
  }

  // ── aç / kapat / dokunma ──
  function yerlestir(){
    if(!renderer.xr.isPresenting && o.bakisGuncelle) o.bakisGuncelle();
    const kafa = new THREE.Vector3(), yon = new THREE.Vector3(); camera.getWorldPosition(kafa); camera.getWorldDirection(yon); yon.y = 0; yon.normalize();
    const vr = renderer.xr.isPresenting; let uz = 1.5;
    if(!vr){ const vf = camera.fov * Math.PI / 360, hf = Math.atan(Math.tan(vf) * camera.aspect); uz = Math.max(1.2, (PW / 2) / Math.tan(hf) * 1.06, (PH / 2) / Math.tan(vf) * 1.12); }
    mesh.position.copy(kafa).addScaledVector(yon, uz); mesh.position.y = kafa.y; mesh.lookAt(kafa.x, mesh.position.y, kafa.z);
  }
  function ac(){ yukle(); ciz(); yerlestir(); mesh.visible = true; if(!tiklanir.includes(mesh)) tiklanir.push(mesh); }
  function kapat(){ mesh.visible = false; const i = tiklanir.indexOf(mesh); if(i >= 0) tiklanir.splice(i, 1); if(o.kapandi) o.kapandi(); }
  function dokun(nokta){
    const l = mesh.worldToLocal(nokta.clone()), px = (l.x / PW + .5) * Wc, py = (.5 - l.y / PH) * Hc;
    for(let i = bolgeler.length - 1; i >= 0; i--){ const r = bolgeler[i]; if(px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h){ r.fn(); if(o.tikla) o.tikla(); return true; } }
    return true; // panoya dokunmak arkasındaki şeyi tetiklemesin
  }
  function tus(e){ // bilgisayar klavyesi
    if(e.key === 'Escape'){ kapat(); return true; }
    if(T.g === 'oku' && (e.key === 'ArrowRight' || e.key === ' ')){ e.preventDefault(); cevir(1); return true; }
    if(T.g === 'oku' && e.key === 'ArrowLeft'){ cevir(-1); return true; }
    if(T.g === 'ara' && veri){ if(e.key === 'Backspace'){ T.q = T.q.slice(0, -1); ara(); return true; } if(e.key.length === 1 && /[\p{L} ]/u.test(e.key)){ yaz(e.key.toLocaleUpperCase('tr')); return true; } }
    return true; // açıkken salonun yürüme tuşları çalışmasın
  }
  const dokunPx = (px, py) => dokun(mesh.localToWorld(new THREE.Vector3((px / Wc - .5) * PW, (.5 - py / Hc) * PH, 0))); // test/çekim için
  return { ac, kapat, dokun, dokunPx, tus, cevir, acik:() => mesh.visible, okuyorMu:() => mesh.visible && T.g === 'oku', mesh };
}
