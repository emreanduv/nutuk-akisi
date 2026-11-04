// Rehber ve "Nasıl kullanılır" (test önerileri paketi — Malazgirt Akıncıları 1.6 / Champion Battle Manager 4.4 ile aynı yaklaşım).
// - Bir şeyle ilk kez karşılaşınca kısa ipucu kartı: "Anladım" ya da "Rehberi kapat". Hangi ipucunun görüldüğü yalnız bu cihazda tutulur.
// - Her an açılabilen "Nasıl kullanılır": bütün ipuçları, henüz görülmeyenler altın çerçeveli, "Rehberi baştan göster", "Verilerimi sil".
// - VR gözlükte panolar sahnenin içinde açılır (kumandada A/B/X/Y tuşu ya da bel hizasındaki ? düğmesi);
//   bilgisayarda ve telefonda sayfanın üstünde (bant üstündeki ? düğmesi).
// Hiçbir veri toplanmaz, hiçbir yere gönderilmez. Bir Mr. Anduv! yapımıdır.
export function yardimKur(o){
  const { THREE, scene, camera, renderer, tiklanir } = o;
  const R = Object.assign({ bant:'#132545', bant2:'#162b52', vurgu:'#e0b04a', kagit:'#fbf7ef', kagit2:'#f1eadc', murekkep:'#1c2a44', soluk:'#5a6476', dugme:'#c8102e', dugmeYazi:'#fff', kose:22 }, o.renk || {});
  const YAZI = "'DM Sans', system-ui, sans-serif";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const ANAHTAR = o.anahtar + '.rehber';
  const IP = o.ipuclari, IPK = Object.fromEntries(IP.map(x => [x.id, x]));
  const bos = () => ({ gor:{}, kapali:false });
  const oku = () => { try { const v = JSON.parse(localStorage.getItem(ANAHTAR) || 'null'); return v && typeof v === 'object' ? Object.assign(bos(), v) : null; } catch(e){ return null; } };
  const yaz = () => { try { localStorage.setItem(ANAHTAR, JSON.stringify(D)); } catch(e){} };
  let D = oku();
  if(!D){ D = bos(); try { if(o.eski && o.eski()){ (o.temelIpuclari || []).forEach(k => { D.gor[k] = 1; }); yaz(); } } catch(e){} } // eski kullanıcıya temel ipuçları yeniden gösterilmez
  const vrMi = () => renderer.xr.isPresenting;
  const PWA = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || 'getDigitalGoodsService' in window || document.referrer.startsWith('android-app://');
  const platform = () => PWA && navigator.xr ? 'quest' : /OculusBrowser|Quest/i.test(navigator.userAgent) ? 'quest-tarayici' : 'web';

  let aktif = null;            // { tur:'ipucu', id } | { tur:'yardim', s }
  let silOnay = false, bekleyen = [], zaman = 0, basladi = false;

  // ── sayfa üstü (bilgisayar / telefon) ──
  const st = document.createElement('style');
  st.textContent = `
  .yh-btn{flex:none;border:0;border-radius:${Math.min(R.kose, 10)}px;width:40px;padding:9px 0;font:900 15px ${YAZI};color:${R.murekkep};background:linear-gradient(#f7f2e8,#ddd3c1);box-shadow:0 2px 0 #0005;cursor:pointer}
  .yh-kart{position:fixed;left:12px;bottom:calc(78px + env(safe-area-inset-bottom,0px));z-index:8;width:min(420px,calc(100% - 24px));border-radius:${Math.min(R.kose, 16)}px;padding:12px 14px;color:${R.murekkep};background:${R.kagit};box-shadow:inset 5px 0 0 ${R.vurgu},0 10px 30px #0009}
  .yh-kart small{display:block;font:900 11.5px ${YAZI};letter-spacing:.8px;color:${R.soluk}}
  .yh-kart b{display:block;font:900 17px/1.2 ${YAZI};margin:3px 0 4px}
  .yh-kart p{margin:0 0 10px;font-size:14.5px;line-height:1.45}
  .yh-d{display:flex;gap:8px;flex-wrap:wrap}
  .yh-d button,.yh-sayfa .yh-d a{border:0;border-radius:${Math.min(R.kose, 10)}px;padding:9px 13px;font:800 14px ${YAZI};cursor:pointer;background:${R.kagit2};color:${R.murekkep};box-shadow:0 0 0 1px #0002;text-decoration:none}
  .yh-d .ana{background:${R.dugme};color:${R.dugmeYazi};box-shadow:0 2px 0 #0004}
  .yh-d .sil{color:#9b1c1c}.yh-d .sil.onay{background:#b42318;color:#fff}
  .yh-perde{position:fixed;inset:0;z-index:40;display:grid;place-items:center;padding:16px;background:#000a;overflow:auto}
  .yh-sayfa{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:${Math.min(R.kose, 18)}px;color:${R.murekkep};background:${R.kagit};box-shadow:0 20px 50px #000c}
  .yh-ust{position:sticky;top:0;display:flex;align-items:center;gap:10px;padding:12px 16px;color:#fff;background:repeating-linear-gradient(90deg,${R.bant} 0 60px,${R.bant2} 60px 120px);border-bottom:4px solid ${R.vurgu}}
  .yh-ust h2{margin:0;flex:1;font:900 19px ${YAZI}}.yh-ust span{font-size:12px;opacity:.85}
  .yh-ust button{border:0;border-radius:8px;padding:6px 11px;font:900 16px ${YAZI};background:#ffffff22;color:#fff;cursor:pointer}
  .yh-ic{padding:12px 16px 16px}.yh-ic>p{margin:0 0 10px;font-size:15px;line-height:1.5}
  .yh-sat{border-radius:10px;padding:9px 12px;margin:0 0 8px;background:${R.kagit2};box-shadow:0 0 0 1px #0001}
  .yh-sat.yeni{box-shadow:0 0 0 2px ${R.vurgu};background:#fff8e6}.yh-sat.yeni b::after{content:' · YENİ';font-size:11px;letter-spacing:.6px;color:#8a5a00}
  .yh-sat b{display:block;font:900 15px ${YAZI}}.yh-sat p{margin:3px 0 0;font-size:14px;line-height:1.45}
  .yh-h{margin:14px 0 8px;font:900 12px ${YAZI};letter-spacing:1px;color:${R.soluk};text-transform:uppercase}
  .yh-not{font-size:12.5px;color:${R.soluk};margin:10px 0 0;line-height:1.45}
  .yh-imza{text-align:center;font-weight:800;font-size:13px;margin:12px 0 0;color:${R.soluk}}
  .yh-giris{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:10px 0 0}
  .yh-giris button{width:auto!important;margin:0!important;padding:8px 12px!important;font:800 13.5px ${YAZI}!important;border-radius:10px!important;background:#ffffff99!important;color:${R.murekkep}!important;box-shadow:0 0 0 1px #0002!important}`;
  document.head.appendChild(st);

  const acBtn = document.createElement('button');
  acBtn.className = 'yh-btn'; acBtn.textContent = '?'; acBtn.title = 'Nasıl kullanılır'; acBtn.setAttribute('aria-label', 'Nasıl kullanılır');
  acBtn.onclick = () => yardimAc();
  const vrB = o.dugmeOnu ? $(o.dugmeOnu) : null; if(vrB && vrB.parentNode) vrB.parentNode.insertBefore(acBtn, vrB);
  if(o.girisKart){ const k = $(o.girisKart); if(k){ const d = document.createElement('div'); d.className = 'yh-giris';
    d.innerHTML = '<button type="button" data-yh="ac">❓ Nasıl kullanılır</button><button type="button" data-yh="silsayfa">🗑 Verilerimi sil</button>';
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-yh]'); if(!b) return; e.stopPropagation(); yardimAc(); }); const m = k.querySelector('.made'); k.insertBefore(d, m || null); } }

  let kartEl = null, perdeEl = null;
  function domKapat(){ if(kartEl){ kartEl.remove(); kartEl = null; } if(perdeEl){ perdeEl.remove(); perdeEl = null; } }
  function domIpucu(x){
    domKapat();
    kartEl = document.createElement('div'); kartEl.className = 'yh-kart'; kartEl.setAttribute('role', 'status');
    kartEl.innerHTML = `<small>İPUCU · ${esc(o.ad.toLocaleUpperCase('tr'))}</small><b>${esc(x.b)}</b><p>${esc(x.m)}</p><div class="yh-d"><button class="ana" data-yh="tamam">Anladım</button><button data-yh="kapat">Rehberi kapat</button></div>`;
    kartEl.addEventListener('click', (e) => { const b = e.target.closest('[data-yh]'); if(b) eylem(b.dataset.yh); });
    document.body.appendChild(kartEl);
  }
  function domYardim(){
    domKapat();
    perdeEl = document.createElement('div'); perdeEl.className = 'yh-perde';
    const satir = (x) => `<div class="yh-sat${D.gor[x.id] ? '' : ' yeni'}"><b>${esc(x.b)}</b><p>${esc(x.m)}</p></div>`;
    perdeEl.innerHTML = `<div class="yh-sayfa" role="dialog" aria-label="Nasıl kullanılır">
      <div class="yh-ust"><h2>❓ Nasıl kullanılır</h2><span>Altın çerçeveliler henüz görmediğin ipuçları</span><button data-yh="kapatYardim" aria-label="Kapat">✕</button></div>
      <div class="yh-ic">${o.temel.m.map(p => `<p>${p}</p>`).join('')}
        <div class="yh-h">Bütün ipuçları</div>${IP.map(satir).join('')}
        <div class="yh-d" style="margin-top:12px"><button class="ana" data-yh="bastan">↺ Rehberi baştan göster</button><button data-yh="paylas">📣 Arkadaşına öner</button><button data-yh="yaz">✉️ Bize yaz</button><button class="sil" data-yh="sil">🗑 Verilerimi sil</button></div>
        <p class="yh-not" id="yhSilNot">Verilerimi sil: ${esc(o.silMetni)} Bu cihazdan silinir; geri alınamaz. Bizde senin hakkında hiçbir kayıt yok. <a href="${esc(o.gizlilik || 'gizlilik.html')}" target="_blank" rel="noopener">Gizlilik politikası</a> · <a href="mailto:emreanduvart@gmail.com">emreanduvart@gmail.com</a></p>
        <p class="yh-imza">Bir Mr. Anduv! yapımıdır. · Sürüm ${esc(o.surum)}</p></div></div>`;
    perdeEl.addEventListener('click', (e) => { if(e.target === perdeEl) return eylem('kapatYardim'); const b = e.target.closest('[data-yh]'); if(b) eylem(b.dataset.yh, b); });
    document.body.appendChild(perdeEl);
  }

  // ── sahne içi (VR) ──
  const CW = 1024, CH = 768, PW = 1.2, PH = PW * CH / CW;
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const g = cv.getContext('2d');
  const doku = new THREE.CanvasTexture(cv); doku.colorSpace = THREE.SRGBColorSpace;
  const pano = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map:doku, transparent:true, toneMapped:false, depthTest:false, depthWrite:false }));
  pano.name = 'yardimPano'; pano.renderOrder = 30; pano.visible = false; scene.add(pano);
  const [dc, dx] = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; return [c, c.getContext('2d')]; })();
  dx.fillStyle = R.kagit; dx.beginPath(); dx.arc(64, 64, 58, 0, Math.PI * 2); dx.fill(); dx.lineWidth = 8; dx.strokeStyle = R.vurgu; dx.stroke();
  dx.fillStyle = R.murekkep; dx.font = `900 80px ${YAZI}`; dx.textAlign = 'center'; dx.textBaseline = 'middle'; dx.fillText('?', 64, 70);
  const dDoku = new THREE.CanvasTexture(dc); dDoku.colorSpace = THREE.SRGBColorSpace;
  const dugme = new THREE.Mesh(new THREE.PlaneGeometry(.13, .13), new THREE.MeshBasicMaterial({ map:dDoku, transparent:true, toneMapped:false, depthTest:false }));
  dugme.name = 'yardimDugme'; dugme.renderOrder = 29; dugme.visible = false; scene.add(dugme);
  let bolgeler = [];
  const ekle = (m) => { if(!tiklanir.includes(m)) tiklanir.unshift(m); };
  const cikar = (m) => { const i = tiklanir.indexOf(m); if(i >= 0) tiklanir.splice(i, 1); };

  function yuvarlak(x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function sar(metin, gen){ const k = String(metin).split(/\s+/), s = []; let c = ''; for(const w of k){ const t = c ? c + ' ' + w : w; if(g.measureText(t).width > gen && c){ s.push(c); c = w; } else c = t; } if(c) s.push(c); return s; }
  function metin(m, x, y, gen, boy, satirMax, renk, kalin = 500){ g.font = `${kalin} ${boy}px ${YAZI}`; g.fillStyle = renk; const L = sar(m, gen).slice(0, satirMax); L.forEach((l, i) => g.fillText(l, x, y + i * boy * 1.3)); return y + L.length * boy * 1.3; }
  function dug(x, y, w, h, yazi, act, ana){
    yuvarlak(x, y, w, h, Math.min(R.kose, 16)); g.fillStyle = ana === 'sil' ? '#b42318' : ana ? R.dugme : R.kagit2; g.fill();
    if(!ana){ g.lineWidth = 3; g.strokeStyle = '#00000022'; g.stroke(); }
    g.fillStyle = ana ? R.dugmeYazi : R.murekkep; g.font = `800 30px ${YAZI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(yazi, x + w / 2, y + h / 2 + 2); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    bolgeler.push({ x, y, w, h, act });
  }
  function zemin(baslik, sag){
    g.clearRect(0, 0, CW, CH); bolgeler = [];
    yuvarlak(6, 6, CW - 12, CH - 12, R.kose * 1.6); g.fillStyle = R.kagit; g.fill();
    g.save(); yuvarlak(6, 6, CW - 12, CH - 12, R.kose * 1.6); g.clip();
    for(let i = 0; i < CW; i += 80){ g.fillStyle = i / 80 % 2 ? R.bant2 : R.bant; g.fillRect(i, 6, 80, 92); }
    g.fillStyle = R.vurgu; g.fillRect(0, 98, CW, 8); g.restore();
    g.fillStyle = '#fff'; g.font = `900 40px ${YAZI}`; g.fillText(baslik, 40, 66);
    if(sag){ g.textAlign = 'right'; g.font = `700 26px ${YAZI}`; g.fillStyle = '#ffffffcc'; g.fillText(sag, CW - 40, 64); g.textAlign = 'left'; }
    g.lineWidth = 4; g.strokeStyle = R.vurgu; yuvarlak(6, 6, CW - 12, CH - 12, R.kose * 1.6); g.stroke();
  }
  const SAYFA = 3;
  const sayfaSay = () => 1 + Math.ceil(IP.length / SAYFA);
  function vrCiz(){
    if(!aktif) return;
    if(aktif.tur === 'ipucu'){
      const x = IPK[aktif.id]; zemin('İpucu', o.ad);
      g.fillStyle = R.murekkep; let y = metin(x.b, 50, 180, CW - 100, 50, 2, R.murekkep, 900);
      metin(x.v || x.m, 50, y + 30, CW - 100, 36, 7, R.murekkep);
      dug(50, CH - 150, 330, 90, 'Anladım', 'tamam', true); dug(400, CH - 150, 330, 90, 'Rehberi kapat', 'kapat');
      g.fillStyle = R.soluk; g.font = `700 24px ${YAZI}`; g.fillText('A / X tuşu ya da ? : nasıl kullanılır', 50, CH - 30);
    } else {
      const s = aktif.s, n = sayfaSay(); zemin('❓ Nasıl kullanılır', `${s + 1}/${n}`);
      if(s === 0){
        let y = 160; for(const p of o.temel.v){ y = metin(p, 50, y, CW - 100, 32, 4, R.murekkep) + 14; }
        g.fillStyle = R.soluk; metin(`Verilerimi sil: ${o.silMetni} Hiçbir veri toplanmaz. Gizlilik: emreanduv.github.io · emreanduvart@gmail.com`, 50, Math.min(y + 6, CH - 260), CW - 100, 24, 3, R.soluk, 600);
      } else {
        let y = 128;
        for(const x of IP.slice((s - 1) * SAYFA, s * SAYFA)){
          const yeni = !D.gor[x.id], h = 160;
          yuvarlak(40, y, CW - 80, h, 14); g.fillStyle = yeni ? '#fff8e6' : R.kagit2; g.fill(); if(yeni){ g.lineWidth = 6; g.strokeStyle = R.vurgu; g.stroke(); }
          metin(x.b + (yeni ? '  · YENİ' : ''), 62, y + 42, CW - 130, 30, 1, R.murekkep, 900);
          metin(x.v || x.m, 62, y + 82, CW - 130, 24, 3, R.murekkep);
          y += h + 10;
        }
      }
      const by = CH - 112, bh = 80;
      dug(40, by, 90, bh, '◀', 'geri'); dug(140, by, 90, bh, '▶', 'ileri', true);
      dug(240, by, 250, bh, '↺ Baştan göster', 'bastan');
      dug(500, by, 290, bh, silOnay ? 'Emin misin? Sil' : '🗑 Verilerimi sil', 'sil', silOnay ? 'sil' : false);
      dug(800, by, 184, bh, '✕ Kapat', 'kapatYardim');
    }
    doku.needsUpdate = true;
  }
  function onuneKoy(m, uzak, asagi){
    const kafa = new THREE.Vector3(), yon = new THREE.Vector3(); camera.getWorldPosition(kafa); camera.getWorldDirection(yon); yon.y = 0;
    if(yon.lengthSq() < 1e-4) yon.set(0, 0, -1); yon.normalize();
    m.position.copy(kafa).addScaledVector(yon, uzak); m.position.y = kafa.y - asagi; m.lookAt(kafa.x, m.position.y, kafa.z);
  }
  function goster(){
    if(!aktif){ domKapat(); pano.visible = false; cikar(pano); return; }
    if(vrMi()){ domKapat(); vrCiz(); if(!pano.visible) onuneKoy(pano, 1.3, .12); pano.visible = true; ekle(pano); }
    else { pano.visible = false; cikar(pano); if(aktif.tur === 'ipucu') domIpucu(IPK[aktif.id]); else domYardim(); }
  }

  // ── rehber mantığı ──
  function ipucu(id){
    if(!IPK[id] || D.kapali || D.gor[id]) return false;
    if(aktif){ if(!bekleyen.includes(id) && !(aktif.tur === 'ipucu' && aktif.id === id)) bekleyen.push(id); return false; }
    aktif = { tur:'ipucu', id }; silOnay = false; goster(); return true;
  }
  function siradaki(){
    while(bekleyen.length){ const id = bekleyen.shift(); if(ipucu(id)) return; }
    const s = (o.sira || []).find(k => !D.gor[k]); if(s && !D.kapali) zaman = performance.now() + (o.aralik || 20000);
  }
  function basla(){ basladi = true; const s = (o.sira || []).find(k => !D.gor[k]); if(s) ipucu(s); }
  function yardimAc(){ aktif = { tur:'yardim', s:0 }; silOnay = false; pano.visible = false; goster(); }
  function kapat(){ aktif = null; silOnay = false; goster(); }
  async function eylem(act){
    if(act !== 'sil') silOnay = false;
    if(act === 'tamam'){ D.gor[aktif.id] = 1; yaz(); aktif = null; goster(); siradaki(); }
    else if(act === 'kapat'){ if(aktif && aktif.tur === 'ipucu') D.gor[aktif.id] = 1; D.kapali = true; yaz(); bekleyen = []; kapat(); }
    else if(act === 'kapatYardim'){ kapat(); siradaki(); }
    else if(act === 'bastan'){ D = bos(); yaz(); bekleyen = []; kapat(); basla(); }
    else if(act === 'geri' || act === 'ileri'){ const n = sayfaSay(); aktif.s = (aktif.s + (act === 'ileri' ? 1 : n - 1)) % n; vrCiz(); }
    else if(act === 'sil'){
      if(!silOnay){ silOnay = true; if(vrMi()) vrCiz(); else { const b = perdeEl && perdeEl.querySelector('[data-yh="sil"]'); if(b){ b.textContent = 'Emin misin? Evet, sil'; b.classList.add('onay'); } } return; }
      verileriSil();
    }
    else if(act === 'paylas') paylas();
    else if(act === 'yaz') bizeYaz();
  }
  function verileriSil(){
    // yalnız bu uygulamanın bu cihazdaki kayıtları; aynı sitedeki öbür uygulamalara dokunulmaz
    try { for(const k of Object.keys(localStorage)) if(o.onek.test(k)) localStorage.removeItem(k); } catch(e){}
    D = bos(); aktif = null; goster();
    setTimeout(() => location.reload(), 60);
  }
  async function paylas(){
    const url = o.url || location.href.split(/[?#]/)[0], text = o.paylasMetni;
    try { if(navigator.share){ await navigator.share({ title:o.ad, text, url }); return; } } catch(e){ if(/abort|cancel/i.test((e && (e.name || e.message)) || '')) return; }
    try { await navigator.clipboard.writeText(text + ' ' + url); alert('Bağlantı kopyalandı, istediğin yere yapıştır.'); } catch(e){ prompt('Bağlantı:', url); }
  }
  function bizeYaz(){
    const konu = `${o.ad} – Görüş ve öneri (${o.surum}, ${platform()})`;
    const govde = `Merhaba, ${o.ad} ile ilgili görüşüm:\n\n\n— ${o.surum} · ${platform()}${o.ilerleme ? ' · ' + o.ilerleme() : ''}`;
    location.href = 'mailto:emreanduvart@gmail.com?subject=' + encodeURIComponent(konu) + '&body=' + encodeURIComponent(govde);
  }

  // ── her kare: bel düğmesi, kumanda tuşları, VR'a giriş/çıkış ──
  let sonVR = false; const basili = {};
  function dongu(){
    const vr = vrMi();
    if(vr !== sonVR){
      sonVR = vr; dugme.visible = vr; if(vr) ekle(dugme); else cikar(dugme);
      pano.visible = false; if(aktif) goster();
      if(vr && !basladi) basla();
    }
    if(vr){
      const kafa = new THREE.Vector3(), yon = new THREE.Vector3(); camera.getWorldPosition(kafa); camera.getWorldDirection(yon); yon.y = 0;
      if(yon.lengthSq() > 1e-4){ yon.normalize(); const hedef = kafa.clone().addScaledVector(yon, .55).add(new THREE.Vector3(-yon.z, 0, yon.x).multiplyScalar(-.22)); hedef.y = kafa.y - .5;
        dugme.position.lerp(hedef, dugme.userData.k ? .06 : 1); dugme.userData.k = 1; dugme.lookAt(kafa); }
      const s = renderer.xr.getSession();
      if(s) for(const src of s.inputSources){ const b = src.gamepad && src.gamepad.buttons; if(!b) continue;
        const on = !!((b[4] && b[4].pressed) || (b[5] && b[5].pressed)), k = src.handedness || 'x';
        if(on && !basili[k]){ if(aktif && aktif.tur === 'yardim') kapat(); else yardimAc(); }
        basili[k] = on; }
    }
    if(zaman && performance.now() > zaman){ zaman = 0; if(!aktif){ const s = (o.sira || []).find(k => !D.gor[k]); if(s) ipucu(s); } }
  }
  // sahnede bir şey seçildiğinde önce buraya sorulur; true dönerse uygulama başka bir şey yapmaz
  function etkile(nesne, nokta){
    if(nesne === dugme){ if(aktif && aktif.tur === 'yardim') kapat(); else yardimAc(); return true; }
    if(nesne === pano && nokta){
      const l = pano.worldToLocal(nokta.clone()), u = (l.x / PW + .5) * CW, v = (.5 - l.y / PH) * CH;
      const b = bolgeler.find(r => u >= r.x && u <= r.x + r.w && v >= r.y && v <= r.y + r.h); if(b) eylem(b.act); return true;
    }
    if(aktif && aktif.tur === 'yardim' && vrMi()){ kapat(); return true; } // pano açıkken başka yere dokunmak panoyu kapatır
    return false;
  }
  addEventListener('keydown', (e) => { if(e.key === 'Escape' && aktif && aktif.tur === 'yardim') kapat(); if((e.key === '?' || e.key === 'h') && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) yardimAc(); });
  return { dongu, etkile, ipucu, basla, yardimAc, kapat, acikMi:() => !!aktif, durum:() => D };
}
