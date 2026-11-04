// Nutuk Akışı — Tam Metin: Nutuk'un (1927) tamamı, Vikikaynak'tan; internetsiz okunur, aranır, kaldığın yer hatırlanır.
(function(){
  if(NA.qs.get('yayin') === '1') return;
  const $ = (s) => document.querySelector(s), esc = NA.esc;
  const pane = $('#p-tam'); if(!pane) return;
  const Prefs = NA.plugin('Preferences');
  const KEY = 'na_tam';
  let T = null, yukleniyor = null, aktif = null, araQ = '', normCache = null;
  let st = { son:null, okunan:[], boyut:18 };
  try { st = Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch(e){}
  if(Prefs) Prefs.get({ key:KEY }).then(r => { if(r && r.value){ try { st = Object.assign(st, JSON.parse(r.value)); if(T && !aktif) liste(); } catch(e){} } }).catch(() => {});
  const kaydet = () => { const v = JSON.stringify(st); try { localStorage.setItem(KEY, v); } catch(e){} if(Prefs) Prefs.set({ key:KEY, value:v }).catch(() => {}); };
  const norm = (s) => (s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[’‘`]/g, "'");

  function yukle(){
    if(T) return Promise.resolve(T);
    if(!yukleniyor) yukleniyor = fetch('data/nutuk-tam.json').then(r => r.json()).then(d => {
      T = d; T.sira = [];
      T.bolumler.forEach(b => b.kisimlar.forEach(k => { k.b = b; k.i = T.sira.length; T.sira.push(k); }));
      T.harita = Object.fromEntries(T.sira.map(k => [k.id, k]));
      T.vesika = Object.fromEntries(T.sira.filter(k => /^Vesika \d+$/.test(k.baslik)).map(k => [k.baslik.slice(7), k.id]));
      return T;
    });
    return yukleniyor;
  }
  const okundu = (id) => st.okunan.includes(id);
  const bolumOkunan = (b) => b.kisimlar.filter(k => okundu(k.id)).length;
  const yuzde = () => T ? Math.round(100 * st.okunan.filter(id => T.harita[id]).length / T.sira.length) : 0;

  // ── içindekiler ──
  function liste(){
    aktif = null;
    const son = st.son && T.harita[st.son.id];
    pane.innerHTML = `
      <button class="daily tm-kapak" ${son ? `data-tam="${esc(son.id)}" data-devam="1"` : `data-tam="${esc(T.sira[0].id)}"`}>
        <span class="d-k">📖 NUTUK · ${T.yil} · ${esc(T.yazar)}</span>
        <b>${son ? 'Kaldığın yerden devam et' : 'Baştan okumaya başla'}</b>
        <span class="d-l">${son ? `${esc(son.b.romen)}. bölüm · ${esc(son.baslik)}` : '“1335 senesi Mayıs\'ının on dokuzuncu günü Samsun\'a çıktım.”'}</span>
        <span class="d-m"><span class="tm-bar"><i style="width:${yuzde()}%"></i></span> <small>%${yuzde()} okundu · ${T.bolumler.length} bölüm · ${T.sira.length} kısım</small></span>
      </button>
      <div class="search"><input id="tmQ" type="search" placeholder="Nutuk'un tamamında ara: Sakarya, misak, hâkimiyet…" autocomplete="off" value="${esc(araQ)}"></div>
      <div id="tmSonuc"></div>
      <div class="tm-bolumler" id="tmBolum">${T.bolumler.map(b => {
        const n = bolumOkunan(b), L = b.kisimlar.length;
        return `<details class="tm-b${n === L && L ? ' bitti' : ''}"><summary><em>${esc(b.romen)}</em><b>${esc(b.baslik)}</b><small>${n ? `${n}/` : ''}${L} kısım</small></summary>
          <div class="tm-k">${b.kisimlar.map(k => `<button data-tam="${esc(k.id)}" class="${okundu(k.id) ? 'ok' : ''}"><i>${esc(k.harf || '·')}</i><span>${esc(k.baslik)}</span>${okundu(k.id) ? '<b>✓</b>' : ''}</button>`).join('')}</div></details>`;
      }).join('')}</div>
      <p class="note">Metin: Nutuk'un 1927 baskısının Latin harfli tam metni, <a href="${esc(T.url)}" target="_blank" rel="noopener">Vikikaynak</a>'tan (${esc(T.indirildi)}). ${esc(T.lisans)}. Telefonda internetsiz okunur.</p>`;
    const q = $('#tmQ');
    q.addEventListener('input', () => { araQ = q.value; clearTimeout(liste.t); liste.t = setTimeout(ara, 220); });
    if(araQ) ara();
  }

  // ── arama ──
  function ara(){
    const kutu = $('#tmSonuc'); if(!kutu) return;
    const q = norm(araQ.trim());
    if(q.length < 3){ kutu.innerHTML = ''; $('#tmBolum').hidden = false; return; }
    if(!normCache) normCache = T.sira.map(k => k.p.map(norm));
    const S = []; let toplam = 0;
    T.sira.forEach((k, i) => normCache[i].forEach((p, j) => {
      let at = p.indexOf(q);
      while(at >= 0){ toplam++; if(S.length < 80) S.push({ k, j, at }); at = p.indexOf(q, at + q.length); if(S.length >= 80 && toplam > 2000) break; }
    }));
    $('#tmBolum').hidden = true;
    kutu.innerHTML = `<p class="hint">${toplam ? `${toplam.toLocaleString('tr')} yerde geçiyor${toplam > S.length ? ` · ilk ${S.length} sonuç` : ''}` : 'Bu kelime Nutuk\'ta geçmiyor.'}</p>
      <div class="tm-sonuc">${S.map(r => { const p = r.k.p[r.j], a = Math.max(0, r.at - 60), z = Math.min(p.length, r.at + q.length + 80);
        return `<button data-tam="${esc(r.k.id)}" data-p="${r.j}"><small>${esc(r.k.b.romen)}. bölüm · ${esc(r.k.baslik)}</small><span>${a ? '…' : ''}${esc(p.slice(a, r.at))}<mark>${esc(p.slice(r.at, r.at + q.length))}</mark>${esc(p.slice(r.at + q.length, z))}${z < p.length ? '…' : ''}</span></button>`; }).join('')}</div>`;
  }

  // ── okuyucu ──
  function oku(id, para, devam){
    const k = T.harita[id]; if(!k) return;
    aktif = k;
    const onc = T.sira[k.i - 1], snr = T.sira[k.i + 1], q = norm(araQ.trim());
    const vs = (h) => h.replace(/(Vesika(?:lar)?\s*:?\s*)((?:\d+(?:\s*(?:,|ve|-)\s*)?)+)/g, (m, a, nums) => a + nums.replace(/\d+/g, n => T.vesika[n] ? `<button class="vs" data-tam="${T.vesika[n]}">${n}</button>` : n));
    const isaretle = (p, j) => { const h = esc(p); if(para == null || j !== para || q.length < 3) return vs(h); const n = norm(p), at = n.indexOf(q); return at < 0 ? vs(h) : esc(p.slice(0, at)) + '<mark>' + esc(p.slice(at, at + q.length)) + '</mark>' + esc(p.slice(at + q.length)); };
    pane.innerHTML = `
      <div class="tm-bar-ust"><button data-tam-geri>← İçindekiler</button><span>${esc(k.b.romen)}. bölüm · ${k.i + 1}/${T.sira.length}</span><button data-boyut="-1" aria-label="Yazıyı küçült">A−</button><button data-boyut="1" aria-label="Yazıyı büyüt">A+</button></div>
      <article class="tm-oku" style="font-size:${st.boyut}px">
        <small class="tm-bb">${esc(k.b.romen)}. BÖLÜM · ${esc(k.b.baslik)}</small>
        <h2>${k.harf ? `<em>${esc(k.harf)}.</em> ` : ''}${esc(k.baslik)}</h2>
        ${k.p.map((p, j) => p.startsWith('## ') ? `<h4 data-j="${j}">${esc(p.slice(3))}</h4>` : `<p data-j="${j}"${j === para ? ' class="hedef"' : ''}>${isaretle(p, j)}</p>`).join('')}
        ${k.notlar ? `<ol class="tm-not">${k.notlar.map(n => `<li>${esc(n)}</li>`).join('')}</ol>` : ''}
      </article>
      <div class="tm-alt">
        ${onc ? `<button data-tam="${esc(onc.id)}"><small>← Önceki</small><span>${esc(onc.baslik)}</span></button>` : '<span></span>'}
        ${snr ? `<button data-tam="${esc(snr.id)}" class="snr"><small>Sonraki →</small><span>${esc(snr.baslik)}</span></button>` : '<span class="tm-son">🇹🇷 Nutuk burada biter.</span>'}
      </div>
      <p class="note">Kaynak: <a href="${esc(T.url)}" target="_blank" rel="noopener">Vikikaynak · Nutuk</a>${k.w ? ` · <a href="https://tr.wikisource.org/wiki/${encodeURIComponent(('Nutuk/' + k.w).replace(/ /g, '_'))}" target="_blank" rel="noopener">bu kısım ↗</a>` : ''}</p>`;
    if(!okundu(k.id)){ st.okunan.push(k.id); if(bolumOkunan(k.b) === k.b.kisimlar.length && window.NR) NR.bolumBitti(k.b); } // bölüm bitti: kutlama + paylaş (rehber.js)
    st.son = { id:k.id }; kaydet();
    requestAnimationFrame(() => {
      const h = para != null && pane.querySelector(`[data-j="${para}"]`);
      if(h) h.scrollIntoView({ block:'center' });
      else if(devam && st.sonY) scrollTo({ top:st.sonY });
      else scrollTo({ top:0 });
    });
  }
  // okurken konumu hatırla
  let yZam;
  addEventListener('scroll', () => { if(!aktif || !pane.classList.contains('on')) return; clearTimeout(yZam); yZam = setTimeout(() => { st.sonY = Math.round(scrollY); kaydet(); }, 400); }, { passive:true });

  pane.addEventListener('click', (e) => {
    const g = e.target.closest('[data-tam-geri]'); if(g){ liste(); scrollTo({ top:0 }); return; }
    const b = e.target.closest('[data-boyut]');
    if(b){ st.boyut = Math.max(14, Math.min(28, st.boyut + Number(b.dataset.boyut) * 2)); kaydet(); const a = pane.querySelector('.tm-oku'); if(a) a.style.fontSize = st.boyut + 'px'; return; }
    const t = e.target.closest('[data-tam]');
    if(t){ const devam = !!t.dataset.devam; if(!devam) st.sonY = 0; oku(t.dataset.tam, t.dataset.p != null ? Number(t.dataset.p) : null, devam); }
  });

  const bandH = () => { const b = document.querySelector('.band'); if(b) document.documentElement.style.setProperty('--band-h', b.offsetHeight + 'px'); };
  addEventListener('resize', bandH);
  function ac(){
    bandH();
    if(T){ if(!aktif) liste(); return; }
    pane.innerHTML = '<div class="empty">📖 Nutuk yükleniyor…</div>';
    yukle().then(liste).catch(() => { pane.innerHTML = '<div class="empty">Tam metin açılamadı.</div>'; });
  }
  document.getElementById('tabs').addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if(b && b.dataset.tab === 'tam') ac(); });
  NA.tamAcW = (w) => { document.querySelector('#tabs [data-tab="tam"]').click(); yukle().then(() => { const k = T.sira.find(x => 'Nutuk/' + x.w === w); if(k) oku(k.id); }); };
  NA.tamAc = (id) => { document.querySelector('#tabs [data-tab="tam"]').click(); yukle().then(() => oku(id)); };
})();
