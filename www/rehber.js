// Nutuk Salonu — Rehber ve Ayarlar (test önerileri paketi; Malazgirt Akıncıları 1.6 / Champion Battle Manager 4.4 ile aynı yaklaşım):
// - bir sekme ilk kez açılınca kısa ipucu kartı ("Anladım" ya da "Rehberi kapat"), hangi ipucunun görüldüğü yalnız bu cihazda,
// - her an açılabilen "Nasıl kullanılır": bütün ipuçları, görülmeyenler altın çerçeveli, "Rehberi baştan göster",
// - uygulama içinden puan ver (yalnız telefonda, olumlu bir anda en çok 2 kez), arkadaşına öner, "Bize yaz" (hazır e-posta), "Verilerimi sil".
// Hiçbir veri toplanmaz: puan ve paylaşım telefonun/mağazanın kendi ekranlarıyla yapılır. Bir Mr. Anduv! yapımıdır.
(function(){
  if(NA.qs.get('yayin') === '1') return;
  const SURUM = '1.1.0';
  const $ = (s) => document.querySelector(s), esc = NA.esc;
  const Prefs = NA.plugin('Preferences'), ShareP = NA.plugin('Share'), Notif = NA.plugin('LocalNotifications');
  const platform = () => { try { const p = window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform(); if(p && p !== 'web') return p; } catch(e){} return 'web'; };
  const mobil = () => ['ios', 'android'].includes(platform());
  const MAGAZA = () => platform() === 'ios' ? 'https://apps.apple.com/tr/search?term=Nutuk%20Ak%C4%B1%C5%9F%C4%B1' : 'https://play.google.com/store/apps/details?id=com.anduv.nutukakisi';
  const oku = (k, v) => { try { const x = JSON.parse(localStorage.getItem(k)); return x == null ? v : x; } catch(e){ return v; } };
  const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
  const ANAHTAR = 'nr.rehber', PUAN = 'nr.puan', SAYAC = 'nr.okunan';

  const IPUCU = {
    metin:['📜 Metinler', 'Günün metni en üstte. Ara kutusuna bir yer, kişi ya da kelime yaz; çiplerle türe göre süz. Bir karta dokununca okuyucu açılır.'],
    okuyucu:['📖 Okuyucu', '“ ile başlayan satırlar Atatürk\'ün özgün sözleri, ≈ altındakiler bugünün Türkçesi. ☆ Kaydet ile listene ekle, 📤 Paylaş ile sözü gönder; Nutuk\'tan gelen metinlerde "Nutuk\'ta oku" tam metindeki yerini açar.'],
    salon:['🏛️ Salon', '1927\'deki Meclis salonu, VR gözlükteki Nutuk Salonu\'nun aynısı. Kürsüde Nutuk satır satır akar: ▶ ◀ ile ilerle ya da ⏵ Oto. Sürükleyerek bak, zemine çift dokunup yürü; masadaki iğneler ve altın noktalar hikâye açar. Salon kaldığın satırı hatırlar.'],
    tam:['📖 Tam Metin', 'Nutuk\'un tamamı, 20 bölüm, internetsiz. Kaldığın yeri hatırlar; okuduğun kısımlar ✓ alır. A− A+ yazıyı küçültüp büyütür, arama kutusu bütün metinde arar.'],
    kesfet:['✨ Keşfet', 'Her sabah günün sözü bildirimi (isteğe bağlı), Tarihte bugün, 18 günlük Nutuk Dizisi, Doğru mu Uydurma mı, adını eski harflerle yazma ve Nutuk Salonu.'],
    kadro:['🎖️ Kadro', 'Millî Mücadele\'nin isimleri. Birine dokun: ne yaptığı ve geçtiği metinler.'],
    kron:['⏳ Kronoloji', '1881\'den 1953\'e olaylar sırayla. Yanında 📜 olan satır o günün metnini açar. En altta kaynaklar ve gizlilik.'],
    kayit:['⭐ Kaydettiklerim', 'Kaydettiğin metinler burada toplanır; yalnız bu cihazda tutulur.'],
    ayar:['⚙️ Ayarlar', 'Nasıl kullanılır, puan verme, arkadaşına önerme, bize yazma ve Verilerimi sil burada.'],
  };
  const SIRA = ['metin', 'okuyucu', 'salon', 'tam', 'kesfet', 'kadro', 'kron', 'kayit', 'ayar'];

  // ── rehber durumu ──
  const durum = () => { const d = oku(ANAHTAR, null); return d && typeof d === 'object' ? Object.assign({ gor:{}, kapali:false }, d) : null; };
  let D = durum();
  if(!D){ // eski kullanıcı: temel ipucu yeniden gösterilmez
    D = { gor:{}, kapali:false };
    try { if(localStorage.getItem('na_saved') != null || localStorage.getItem('na_tam') != null){ D.gor.metin = 1; yaz(ANAHTAR, D); } } catch(e){}
  }
  let kartEl = null, bekleyen = [];
  function kartKapat(){ if(kartEl){ kartEl.remove(); kartEl = null; } }
  function ipucu(ekran){
    const x = IPUCU[ekran]; if(!x || D.kapali || D.gor[ekran]) return;
    if(kartEl){ if(!bekleyen.includes(ekran) && kartEl.dataset.ekran !== ekran) bekleyen.push(ekran); return; }
    kartEl = document.createElement('div'); kartEl.className = 'rh-kart'; kartEl.dataset.ekran = ekran; kartEl.setAttribute('role', 'status');
    kartEl.innerHTML = `<small>İPUCU · NUTUK SALONU</small><b>${esc(x[0])}</b><p>${esc(x[1])}</p><div class="rh-d"><button class="ana" data-rh="tamam">Anladım</button><button data-rh="rhkapat">Rehberi kapat</button></div>`;
    document.body.appendChild(kartEl);
  }
  function sonraki(){ while(bekleyen.length){ const e = bekleyen.shift(); if(!D.gor[e]){ ipucu(e); return; } } }

  // ── Nasıl kullanılır (alt sayfa) ──
  function nasil(){
    const liste = SIRA.map(k => `<div class="rh-sat${D.gor[k] ? '' : ' yeni'}"><b>${esc(IPUCU[k][0])}</b><p>${esc(IPUCU[k][1])}</p></div>`).join('');
    $('#sheetBody').innerHTML = `
      <div class="sh-head" style="--c:#1f4fa0"><small>❓ REHBER</small><h2>Nasıl kullanılır</h2><em class="sh-oz">Altın çerçeveliler henüz görmediğin ipuçları</em></div>
      <div class="sh-body">
        <p class="sh-ne"><b>Nutuk Salonu</b>, Nutuk'u, Gençliğe Hitabe'yi, söylevleri ve telgrafları özgün hâliyle ve her satırın altında bugünün Türkçesiyle okutur. Hepsi telefonda, internetsiz çalışır.</p>
        <p><b>Başlamak için:</b> 📜 Metinler'de günün metnine dokun ya da ara. Nutuk'u baştan okumak için 📖 Tam Metin. Her gün bir bölüm için ✨ Keşfet'teki Nutuk Dizisi.</p>
        <div class="rh-liste">${liste}</div>
        <div class="sh-actions"><button data-rh="bastan">↺ Rehberi baştan göster</button><button data-rh="oner">📣 Arkadaşına öner</button><button data-rh="yaz">✉️ Bize yaz</button></div>
        <p class="made">Bir Mr. Anduv! yapımıdır.</p>
      </div>`;
    const d = $('#sheet'); if(!d.open) d.showModal(); d.scrollTop = 0;
  }

  // ── paylaş, bize yaz, puan ──
  async function paylas(metin){
    metin = metin || 'Nutuk Salonu: Nutuk\'un tamamı, Gençliğe Hitabe ve söylevler özgün hâliyle, her satırın altında bugünün Türkçesiyle. İnternetsiz, reklamsız.';
    const url = MAGAZA();
    try {
      if(ShareP){ await ShareP.share({ title:'Nutuk Salonu', text:metin, url, dialogTitle:'Arkadaşına öner' }); return; }
      if(navigator.share){ await navigator.share({ title:'Nutuk Salonu', text:metin, url }); return; }
    } catch(e){ if(/cancel|abort/i.test((e && (e.message || e.name)) || '')) return; }
    try { await navigator.clipboard.writeText(metin + ' ' + url); toast('📋 Bağlantı kopyalandı, istediğin yere yapıştır'); } catch(e){ toast(url); }
  }
  function ilerleme(){ const t = oku('na_tam', {}), s = oku('na_saved', []); return `kayıtlı ${Array.isArray(s) ? s.length : 0} metin · Tam Metin ${Array.isArray(t.okunan) ? t.okunan.length : 0} kısım · ${oku(SAYAC, []).length} metin açıldı`; }
  function bizeYaz(){
    const konu = `Nutuk Salonu – Görüş ve öneri (${SURUM}, ${platform()})`;
    const govde = `Merhaba, Nutuk Salonu ile ilgili görüşüm:\n\n\n— ${SURUM} · ${platform()} · ${ilerleme()}`;
    location.href = 'mailto:emreanduvart@gmail.com?subject=' + encodeURIComponent(konu) + '&body=' + encodeURIComponent(govde);
  }
  const puanD = () => Object.assign({ n:0, tamam:false }, oku(PUAN, {}));
  const puanSorulsunMu = () => { if(!mobil()) return false; const p = puanD(); return !p.tamam && p.n < 2; };
  async function puanVer(){
    const p = puanD(); p.tamam = true; yaz(PUAN, p);
    const R = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.InAppReview;
    try { if(R && R.requestReview){ await R.requestReview(); return; } } catch(e){}
    try { window.open(MAGAZA(), '_blank'); } catch(e){ location.href = MAGAZA(); }
  }
  // olumlu an: Tam Metin'de bir bölüm bitti ya da 8. farklı metin okundu — kutlama kartı, mobilde nazik puan sorusu (en çok 2 kez)
  let basariEl = null;
  function basari(baslik, paylasMetni){
    if(basariEl) basariEl.remove();
    const puan = puanSorulsunMu();
    if(puan){ const p = puanD(); p.n++; yaz(PUAN, p); }
    basariEl = document.createElement('div'); basariEl.className = 'rh-kart rh-basari'; basariEl.setAttribute('role', 'status');
    basariEl.innerHTML = `<small>🇹🇷 TEBRİKLER</small><b>${esc(baslik)}</b>${puan ? '<p>Nutuk Salonu işine yarıyor mu? Bir puan, başkalarının da bulmasına yardım eder.</p>' : ''}
      <div class="rh-d">${puan ? '<button class="ana" data-rh="puan">★ Puan ver</button><button data-rh="yaz">Önerim var</button>' : ''}<button${puan ? '' : ' class="ana"'} data-rh="bpaylas">📣 Paylaş</button><button data-rh="sonra">${puan ? 'Sonra' : 'Kapat'}</button></div>`;
    basariEl._metin = paylasMetni;
    document.body.appendChild(basariEl);
  }
  function metinAcildi(id){
    ipucu('okuyucu');
    const L = oku(SAYAC, []); if(L.includes(id)) return;
    L.push(id); yaz(SAYAC, L.slice(-400));
    if(L.length === 8) setTimeout(() => basari('8 metin okudun!', 'Nutuk Salonu\'nda 8 metin okudum: Nutuk, Hitabe ve söylevler özgün hâliyle, altında bugünün Türkçesiyle.'), 900);
  }
  function bolumBitti(b){ setTimeout(() => basari(`Nutuk'un ${b.romen}. bölümünü bitirdin!`, `Nutuk'un ${b.romen}. bölümünü (${b.baslik}) baştan sona okudum. · Nutuk Salonu`), 600); }

  // ── verilerimi sil: kaydedilenler, okuma yeri, bildirim, rehber; bu cihazdan ──
  async function verileriSil(){
    try { for(const k of Object.keys(localStorage)) if(/^(na_|nr\.|ns\.)/.test(k)) localStorage.removeItem(k); } catch(e){}
    try { sessionStorage.clear(); } catch(e){}
    if(Prefs){ for(const key of ['na_saved', 'na_tam', 'na_bildirim']) { try { await Prefs.remove({ key }); } catch(e){} } }
    if(Notif){ try { const p = await Notif.getPending(); if(p && p.notifications && p.notifications.length) await Notif.cancel({ notifications:p.notifications.map(n => ({ id:n.id })) }); } catch(e){} }
    location.reload();
  }

  function toast(t){ const el = $('#toast'); if(!el) return; el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2200); }

  // ── Ayarlar sekmesi ──
  function ayarlar(){
    const el = $('#ayarIc'); if(!el) return;
    el.innerHTML = `
      <div class="ay-grup"><h4>Rehber</h4>
        <button class="ay-sat" data-rh="nasil"><i>❓</i><span><b>Nasıl kullanılır</b><small>Bütün ipuçları, görmediklerin vurgulu</small></span></button>
        <button class="ay-sat" data-rh="bastan"><i>↺</i><span><b>Rehberi baştan göster</b><small>İpucu kartları sekmeleri ilk açışındaki gibi yeniden çıkar</small></span></button></div>
      <div class="ay-grup"><h4>Paylaş ve puanla</h4>
        ${mobil() ? '<button class="ay-sat" data-rh="puan"><i>★</i><span><b>Puan ver</b><small>Mağazanın kendi puan ekranı açılır</small></span></button>' : ''}
        <button class="ay-sat" data-rh="oner"><i>📣</i><span><b>Arkadaşına öner</b><small>Telefonun paylaşım menüsüyle</small></span></button></div>
      <div class="ay-grup"><h4>Görüş ve öneri</h4>
        <button class="ay-sat" data-rh="yaz"><i>✉️</i><span><b>Bize yaz</b><small>emreanduvart@gmail.com · sürüm ve cihaz bilgisi hazır gelir</small></span></button></div>
      <div class="ay-grup"><h4>Verilerin</h4>
        <button class="ay-sat sil" data-rh="sil"><i>🗑</i><span><b>Verilerimi sil</b><small>Kaydettiklerin, Tam Metin'de ve Salon'da kaldığın yer, günün sözü bildirimi ve rehber bu cihazdan silinir. Bizde senin hakkında hiçbir kayıt yok.</small></span></button>
        <p class="note">Uygulama hiçbir kişisel veri toplamaz. <a href="https://emreanduv.github.io/nutuk-akisi/gizlilik.html" target="_blank" rel="noopener">Gizlilik politikası</a></p></div>
      <p class="made">Bir Mr. Anduv! yapımıdır. · Sürüm ${SURUM}</p>`;
  }

  // ── olaylar ──
  let silOnay = false;
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-t]'); if(t) setTimeout(() => metinAcildi(t.dataset.t), 350);
    const b = e.target.closest('[data-rh]'); if(!b) return;
    const a = b.dataset.rh;
    if(a !== 'sil' && silOnay){ silOnay = false; ayarlar(); }
    if(a === 'tamam'){ const k = kartEl && kartEl.dataset.ekran; if(k){ D.gor[k] = 1; yaz(ANAHTAR, D); } kartKapat(); setTimeout(sonraki, 400); }
    else if(a === 'rhkapat'){ const k = kartEl && kartEl.dataset.ekran; if(k) D.gor[k] = 1; D.kapali = true; yaz(ANAHTAR, D); bekleyen = []; kartKapat(); }
    else if(a === 'nasil') nasil();
    else if(a === 'bastan'){ D = { gor:{}, kapali:false }; yaz(ANAHTAR, D); bekleyen = []; kartKapat(); const d = $('#sheet'); if(d.open) d.close(); toast('↺ Rehber baştan başladı'); const on = document.querySelector('#tabs button.on'); setTimeout(() => ipucu(on ? on.dataset.tab : 'metin'), 300); }
    else if(a === 'oner') paylas();
    else if(a === 'yaz') bizeYaz();
    else if(a === 'puan'){ if(basariEl){ basariEl.remove(); basariEl = null; } puanVer(); }
    else if(a === 'bpaylas'){ const m = basariEl && basariEl._metin; if(basariEl){ basariEl.remove(); basariEl = null; } paylas(m); }
    else if(a === 'sonra'){ if(basariEl){ basariEl.remove(); basariEl = null; } }
    else if(a === 'sil'){
      if(!silOnay){ silOnay = true; const s = b.querySelector('b'); if(s) s.textContent = 'Emin misin? Bir daha dokun, silinsin'; b.classList.add('onay'); return; }
      verileriSil();
    }
  });
  document.getElementById('tabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if(!b) return; if(b.dataset.tab === 'ayar') ayarlar(); setTimeout(() => ipucu(b.dataset.tab), 500); });
  ayarlar();
  setTimeout(() => ipucu('metin'), 1500);
  window.NR = { ipucu, nasil, paylas, bizeYaz, puanVer, verileriSil, bolumBitti, metinAcildi, SURUM };
})();
