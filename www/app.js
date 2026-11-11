// Nutuk Salonu — uygulama görünümü (telefon / tablet / masaüstü). Yayın görünümü için yayin.js.
(function(){
  if(NA.qs.get('yayin') === '1') return;
  const { esc, kindChip, kindColor, kindIcon, dateLabel } = NA;
  const $ = (s) => document.querySelector(s);
  // Telefon uygulamasında OBS yayın sekmesi ve gündem (sunucu gerektirir) gizlenir.
  if(NA.NATIVE || NA.OFFLINE){ document.body.classList.add('native'); document.querySelectorAll('.tab-yayin,.yalniz-sunucu').forEach(el => el.remove()); }
  const Prefs = NA.plugin('Preferences'), ShareP = NA.plugin('Share'), Notif = NA.plugin('LocalNotifications');
  $('#crest').innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="43" cy="50" r="22" fill="#fff"/><circle cx="49" cy="50" r="17.6" fill="#c8102e"/><path d="M55 50L71.3 44.7L61.2 58.6L61.2 41.4L71.3 55.3Z" fill="#fff"/></svg>`;

  // ── kaydedilenler (yalnız bu cihazda) ──
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('na_saved') || '[]'); } catch(e){}
  const persist = () => { try { localStorage.setItem('na_saved', JSON.stringify(saved)); } catch(e){} if(Prefs) Prefs.set({ key:'na_saved', value:JSON.stringify(saved) }).catch(() => {}); };
  // iOS web depolamasını nadiren temizleyebilir: kalıcı kopya cihazın kendi ayar deposunda (Capacitor Preferences)
  if(Prefs) Prefs.get({ key:'na_saved' }).then(r => { if(r && r.value){ try { const v = JSON.parse(r.value); if(Array.isArray(v) && v.length){ saved = v; renderAll(); } } catch(e){} } }).catch(() => {});
  const isSaved = (id) => saved.includes(id);
  function toggleSave(id){
    saved = isSaved(id) ? saved.filter(x => x !== id) : [...saved, id];
    persist(); toast(isSaved(id) ? '⭐ Kaydedildi' : 'Kayıttan çıkarıldı'); renderAll();
  }
  function toast(t){ const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 1800); }

  // ── sekmeler ──
  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if(!b) return;
    if(b.dataset.tab === 'salon'){ salonAc(); return; } // salon tam ekran açılır, sekme değişmez
    document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + b.dataset.tab));
    scrollTo({ top:0 });
  });

  // ── Salon: VR'daki Nutuk Salonu'nun aynısı, uygulamanın içinde ve internetsiz (www/salon = docs/salon kopyası) ──
  function salonAc(){
    const k = $('#salonKatman'), f = $('#salonCerceve');
    if(!f.getAttribute('src')) f.src = 'salon/index.html?uygulama=1';
    k.hidden = false; document.documentElement.classList.add('salon-acik');
    clearTimeout(salonAc.t); if(!salonAc.hazir) salonAc.t = setTimeout(() => k.classList.add('yedek'), 8000);
    try { f.contentWindow && f.contentWindow.focus(); } catch(e){}
  }
  function salonKapat(){ $('#salonKatman').hidden = true; document.documentElement.classList.remove('salon-acik'); }
  $('#salonKapat').addEventListener('click', salonKapat);
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-salon]'); if(a){ e.preventDefault(); salonAc(); } });
  addEventListener('message', (e) => { if(e.origin !== location.origin) return; if(e.data === 'ns-kapat') salonKapat(); if(e.data === 'ns-tam'){ salonKapat(); const t = document.querySelector('#tabs button[data-tab="tam"]'); if(t) t.click(); } if(e.data === 'ns-hazir'){ salonAc.hazir = true; clearTimeout(salonAc.t); $('#salonKatman').classList.remove('yedek'); } });
  NA.salonAc = salonAc;

  function header(){
    const n = NA.ist(), c = NA.state.corpus, S = NA.siradakiGun();
    $('#clock').textContent = `${NA.two(n.getHours())}:${NA.two(n.getMinutes())}`;
    $('#subline').textContent = (window.DIL && DIL.kod === 'en')
      ? `The Gazi's Words · Year ${NA.cumhuriyetYili()} of the Republic${S ? ` · ${S.ad}: ${S.gun === 0 ? 'today' : 'in ' + S.gun + ' days'}` : ''}`
      : `Gazi'nin Sözleri · Cumhuriyet'in ${NA.cumhuriyetYili()}. yılı${S ? ` · ${S.ad}: ${S.gun === 0 ? 'bugün' : S.gun + ' gün'}` : ''}`;
    $('#demo').hidden = !(c && c.demo);
    $('#sess').textContent = c ? `📜 ${c.metinler.length} METİN` : NA.state.corpusError ? 'SUNUCUYA ULAŞILAMADI' : 'BAĞLANIYOR';
  }

  // ── metinler ──
  let kind = '', q = '';
  const norm = (s) => (s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  function matches(t){
    if(kind && t.tur !== kind && !(kind === 'ozgun' && NA.originals(t).length)) return false;
    if(!q) return true;
    return norm([t.baslik, t.ne, t.bilgi, t.yer, t.eser, ...(t.kisiler || []), ...(t.satirlar || []).map(NA.lineText)].join(' ')).includes(norm(q));
  }
  function first(t){ const o = NA.originals(t)[0]; return o ? `“${o}”` : NA.lineText(t.satirlar[0] || ''); }
  function card(t){
    return `<button class="tcard" data-t="${esc(t.id)}" style="--k:${kindColor(t.tur)}">
      <span class="tc-top">${kindChip(t.tur)}<small>${esc(dateLabel(t.tarih))} · ${esc(t.yer.split('·')[0].trim())}</small>${isSaved(t.id) ? '<b class="star">★</b>' : ''}</span>
      <b class="tc-t">${esc(t.baslik)}</b>
      <span class="tc-l"><i>${esc(t.simge || kindIcon(t.tur))}</i>${esc(first(t))}</span>
      <small class="tc-n">${esc(t.ne)}</small></button>`;
  }
  function renderDaily(){
    const t = NA.daily();
    if(!t){ $('#daily').innerHTML = ''; return; }
    $('#daily').innerHTML = `<button class="daily" data-t="${esc(t.id)}"><span class="d-k">✨ Günün metni</span><b>${esc(t.baslik)}</b>
      <span class="d-l">${esc(first(t))}</span><span class="d-m">${kindChip(t.tur)} <small>${esc(t.yer)} · ${esc(dateLabel(t.tarih))}</small></span><i class="d-cu">${esc(t.simge || '')}</i></button>`;
  }
  function renderKinds(){
    const T = NA.metinler(), K = [...new Set(T.map(t => t.tur))];
    $('#kinds').innerHTML = [['', 'Tümü'], ['ozgun', '“ Özgün sözler'], ...K.map(k => [k, `${kindIcon(k)} ${window.DIL ? DIL.t(k) : k}`])].map(([k, l]) => `<button class="${k === kind ? 'on' : ''}" data-k="${esc(k)}">${l}</button>`).join('');
  }
  $('#kinds').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if(!b) return; kind = b.dataset.k; renderKinds(); renderList(); });
  $('#q').addEventListener('input', (e) => { q = e.target.value.trim(); renderList(); });
  function renderList(){
    if(!NA.state.corpus){ $('#list').innerHTML = `<div class="empty">${NA.state.corpusError ? 'Sunucuya ulaşılamadı. Bilgisayarda <b>start.command</b> çalışıyor mu?' : 'Metinler yükleniyor…'}</div>`; return; }
    const L = NA.metinler().filter(matches).sort((a, b) => NA.decYear(a.tarih) - NA.decYear(b.tarih));
    $('#list').innerHTML = L.map(card).join('') || '<div class="empty">Bu aramaya uyan metin yok.</div>';
  }

  // ── okuyucu ──
  const readerLines = (S) => `<ol class="reader">${S.map(x => { const l = NA.line(x); return l.o ? `<li class="o">${esc(l.o)}${l.s ? `<span class="sd">≈ ${esc(l.s)}</span>` : ''}</li>` : `<li class="a">${esc(l.a)}</li>`; }).join('')}</ol>`;
  function openMetin(id){
    const t = NA.metin(id); if(!t) return;
    const w = t.live && t.live.wiki, v = t.live && t.live.vk, O = NA.originals(t).length;
    $('#sheetBody').innerHTML = `
      <div class="sh-head" style="--c:${kindColor(t.tur)}"><small>${kindIcon(t.tur)} ${esc(window.DIL ? DIL.t(t.tur) : t.tur)} · ${esc(t.eser)} · ${esc(dateLabel(t.tarih))}</small><h2>${esc(t.baslik)}</h2><em class="sh-oz">${esc(t.yer)} · ${esc(t.dinleyen || '')}</em><i class="sh-cu">${esc(NA.morse(t.baslik, 10))}</i></div>
      <div class="sh-body">
        <p class="sh-ne">${esc(t.ne)}</p>
        ${readerLines(t.satirlar)}
        <p class="note">${O ? '“ ile başlayan satırlar Atatürk\'ün özgün sözleridir; ≈ altındaki karşılıklar bugünün Türkçesiyle sadeleştirmedir. ' : ''}Düz satırlar olayları günümüz Türkçesiyle anlatır.${v && v.ok ? ` <span class="vk-ok">✓ Özgün satırlar Vikikaynak'taki Nutuk tam metniyle karşılaştırıldı</span>` : t.dogrulama === 'yaygin' ? ' Özgün satırlar yaygın baskılardaki metindir.' : ''}</p>
        <div class="know"><b>💡 Biliyor muydun?</b> ${esc(t.bilgi)}</div>
        <dl><dt>Tarih</dt><dd>${esc(dateLabel(t.tarih))}</dd><dt>Yer</dt><dd>${esc(t.yer)}</dd><dt>Dinleyen</dt><dd>${esc(t.dinleyen || '—')}</dd><dt>Eser</dt><dd>${esc(t.eser)}</dd><dt>Kişiler</dt><dd>${esc((t.kisiler || []).join(', '))}</dd><dt>Gazi o yıl</dt><dd>${NA.yas(t.tarih)} yaşında</dd></dl>
        ${w ? `<h4>📖 Wikipedia (${w.lang === 'tr' ? 'Türkçe' : 'İngilizce'})</h4><div class="wk">${w.thumb ? `<img src="${esc(w.thumb)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<p>${esc(w.extract)}</p></div>` : ''}
        <div class="sh-actions">
          <button data-save="${esc(t.id)}">${isSaved(t.id) ? '★ Kayıtlı' : '☆ Kaydet'}</button>
          ${v && v.title && /^Nutuk\//.test(v.title) ? `<button data-tamw="${esc(v.title)}">📖 Nutuk'ta oku</button>` : v && v.url ? `<a class="btn" href="${esc(v.url)}" target="_blank" rel="noopener">Tam metin · Vikikaynak ↗</a>` : ''}
          ${w && w.url ? `<a class="btn" href="${esc(w.url)}" target="_blank" rel="noopener">Wikipedia ↗</a>` : ''}
          <button data-share="${esc(t.id)}">📤 Paylaş</button>
        </div>
      </div>`;
    { const d = $('#sheet'); if(!d.open) d.showModal(); d.scrollTop = 0; }
  }
  function openKadro(id){
    const k = NA.kadro().find(x => x.id === id); if(!k) return;
    const w = k.live && k.live.wiki, T = NA.metinler().filter(m => (m.kisiler || []).some(p => p.includes(k.ad.split(' ')[0])));
    $('#sheetBody').innerHTML = `
      <div class="sh-head" style="--c:${k.renk}"><small>🎖️ ${esc(k.rol)}</small><h2>${esc(k.ad)}</h2><i class="sh-cu">${esc(k.simge)}</i></div>
      <div class="sh-body">
        <p class="sh-ne">${esc(k.katki)}</p>
        ${w ? `<div class="wk">${w.thumb ? `<img src="${esc(w.thumb)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<p>${esc(w.extract)}</p></div>${w.url ? `<p><a href="${esc(w.url)}" target="_blank" rel="noopener">Wikipedia'da oku ↗</a></p>` : ''}` : ''}
        <h4>📜 Geçtiği metinler (${T.length})</h4><div class="cards">${T.map(card).join('') || '<p class="hint">Arşivde henüz yok.</p>'}</div>
      </div>`;
    { const d = $('#sheet'); if(!d.open) d.showModal(); d.scrollTop = 0; }
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-t]'); if(t){ e.preventDefault(); openMetin(t.dataset.t); return; }
    const g = e.target.closest('[data-g]'); if(g){ openKadro(g.dataset.g); return; }
    const s = e.target.closest('[data-save]'); if(s){ toggleSave(s.dataset.save); openMetin(s.dataset.save); return; }
    const tw = e.target.closest('[data-tamw]'); if(tw && NA.tamAcW){ $('#sheet').close(); NA.tamAcW(tw.dataset.tamw); return; }
    const sh = e.target.closest('[data-share]');
    if(sh){
      const t = NA.metin(sh.dataset.share), O = NA.originals(t);
      const text = `${t.baslik} (${dateLabel(t.tarih)})\n\n${O.length ? O.slice(0, 2).map(o => `“${o}”`).join('\n') : t.satirlar.slice(0, 2).map(NA.lineText).join(' ')}\n\n· Nutuk Salonu`;
      if(ShareP) ShareP.share({ title:t.baslik, text, dialogTitle:'Paylaş' }).catch(() => {});
      else if(navigator.share) navigator.share({ title:t.baslik, text }).catch(() => {});
      else if(navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('📋 Panoya kopyalandı'), () => {});
    }
  });

  // ── kadro ──
  function renderKadro(){
    $('#kadro').innerHTML = NA.kadro().map(k => `<button class="god" data-g="${esc(k.id)}" style="--g:${k.renk}"><i>${esc(k.simge)}</i><b>${esc(k.ad)}</b><small>${esc(k.rol)}</small><span>${esc(k.katki)}</span></button>`).join('') || '<div class="empty">Yükleniyor…</div>';
  }

  // ── kronoloji + gündem ──
  function renderTimeline(){
    const K = NA.kronoloji();
    const near = (k) => NA.metinler().filter(m => m.tarih === k.tarih).slice(0, 2);
    $('#timeline').innerHTML = `<ol class="tl">${K.map(k => `<li class="${NA.parts(k.tarih).y > 1938 ? 'mod' : ''}"><em>${esc(dateLabel(k.tarih))}</em><b>${esc(k.b)}</b><span>${esc(k.m)}</span>${near(k).map(t => `<button class="tl-t" data-t="${esc(t.id)}">📜 ${esc(t.baslik)}</button>`).join('')}</li>`).join('')}</ol>`;
  }
  function renderNews(){
    if(!$('#news')) return;
    const N = NA.news();
    $('#news').innerHTML = N.slice(0, 20).map(n => `<article class="art"><div class="k"><span class="au">${esc(n.source)}</span> · ${esc(NA.ago(n.time))}</div><h3>${n.link ? `<a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.title)}</a>` : esc(n.title)}</h3>${n.summary ? `<p>${esc(n.summary)}</p>` : ''}</article>`).join('') || `<div class="empty">${NA.state.news ? 'Son günlerde Atatürk ve Cumhuriyet tarihiyle ilgili haber bulunamadı.' : 'Haberler yükleniyor…'}</div>`;
    const H = (NA.state.news && NA.state.news.health) || [];
    $('#health').innerHTML = H.map(h => `<div><span>${h.ok ? '🟢' : '🔴'} ${esc(h.name)}</span><span>${h.ok ? h.count + ' ilgili başlık' : esc(h.err || 'hata')}</span></div>`).join('');
  }
  function renderSaved(){
    const L = saved.map(NA.metin).filter(Boolean);
    $('#saved').innerHTML = L.map(card).join('');
    $('#saveHint').hidden = !!L.length;
  }

  // ── alt yazı ──
  let tkKey = '';
  function renderTicker(){
    const K = NA.kronoloji(), I = NA.ekler().biliyormu || [];
    const key = K.length + ':' + I.length; if(key === tkKey) return; tkKey = key;
    let ii = 0;
    const html = K.map((k, i) => `<span><em>${esc(dateLabel(k.tarih, true))}</em><b>${esc(k.b)}</b> ${esc(k.m)}</span>` + ((i + 1) % 3 === 0 && I.length ? `<span class="ilk">${esc(I[ii++ % I.length])}</span>` : '')).join('');
    const tr = $('#track'); tr.innerHTML = html + html;
    requestAnimationFrame(() => tr.style.setProperty('--D', Math.max(60, tr.scrollWidth / 2 / 60) + 's'));
  }

  // ── keşfet ──
  function renderBugun(){
    const TB = NA.tarihteBugun();
    $('#bugunBox').innerHTML = (TB.items.length ? TB.items.slice(0, 8).map(r => `<div class="${r.ozel ? 'ozel' : ''}"><b>${r.yil}</b><span>${esc(r.metin)}</span></div>`).join('')
      : `<div><b>${esc(TB.gun)}</b><span>Bugünün tarihinde arşivde kayıt yok. Yaklaşan yıl dönümleri aşağıda.</span></div>` + TB.yakin.map(k => `<div><b>${esc(dateLabel(k.tarih, true).replace(/ \d{4}$/, ''))}</b><span>${NA.parts(k.tarih).y} · ${esc(k.b)}: ${esc(k.m)}</span></div>`).join(''))
      + (TB.url ? `<p class="note">Kaynak: <a href="${esc(TB.url)}" target="_blank" rel="noopener">Vikipedi · ${esc(TB.gun)}</a></p>` : '');
  }
  function renderMyName(){
    const v = $('#myName').value.trim(), ad = v || 'Mustafa';
    $('#myTab').innerHTML = `<b class="osm" dir="rtl" lang="ota">${esc(NA.eskiHarf(ad))}</b><span>${esc(NA.morse(ad, 10))}</span><em>${esc(ad)}${v ? '' : ' · örnek'}</em>`;
  }
  $('#myName').addEventListener('input', renderMyName);
  let openEp = null;
  function renderSeries(){
    const D = NA.dizi(), cur = NA.diziBugun();
    if(openEp == null && cur) openEp = cur.bolum;
    $('#series').innerHTML = D.map(b => `<details class="ep ${cur && b.id === cur.id ? 'now' : ''}" ${b.bolum === openEp ? 'open' : ''} data-ep="${b.bolum}"><summary><b>${b.bolum}.</b> ${esc(b.baslik)}${cur && b.id === cur.id ? ' <i>bugün</i>' : ''}</summary>${readerLines(b.satirlar)}</details>`).join('') || '<div class="empty">Yükleniyor…</div>';
  }
  $('#series').addEventListener('toggle', (e) => { const d = e.target.closest('[data-ep]'); if(d && d.open) openEp = Number(d.dataset.ep); }, true);
  function renderEsle(){
    if(!$('#esleList')) return;
    $('#esleList').innerHTML = NA.esle().map(e => `<div class="tcard bo-c" style="--k:#0f766e"><small class="tc-n">📰 ${esc(e.haber.source)} · ${esc(NA.ago(e.haber.time))}</small><b class="tc-t">${esc(e.haber.title)}</b><span class="tc-l"><i>🇹🇷</i>“${esc(e.soz)}”</span><small class="tc-n">${esc(e.kaynak)} · ${e.yil || ''}</small></div>`).join('') || '<div class="empty">Bugünün başlıklarıyla eşleşme bekleniyor…</div>';
  }
  function renderMyths(){
    const H = { belgesiz:['❌ Belgesi yok', '#c0262d'], tartismali:['🟡 Tartışmalı', '#c98a12'], belgeli:['✅ Belgeli', '#1f8a4c'] };
    $('#mythList').innerHTML = NA.dogrumu().map(f => `<details class="myth" style="--h:${(H[f.hukum] || H.tartismali)[1]}"><summary><b>“${esc(f.soz)}”</b><span class="mh">${(H[f.hukum] || H.tartismali)[0]}</span></summary><p><b>📜 Belgeler:</b> ${esc(f.kanit)}</p><p><b>🎓 Not:</b> ${esc(f.tarihci)}</p><p class="mk">${esc(f.kisaca)}</p><small class="tc-n">Nerede görülür: ${esc(f.nerede)}</small></details>`).join('');
  }
  function renderTerms(){
    const E = NA.ekler();
    $('#terms').innerHTML = (E.terimler || []).map(t => `<div><s>${esc(t.eski)}</s><b>${esc(t.yeni)}</b><small class="tc-n">${esc(t.not)}</small></div>`).join('');
    $('#devs').innerHTML = (E.devrimler || []).map(d => `<div><span>${esc(d.simge)}</span><p style="margin:0"><b>${esc(d.ad)}</b><small>${esc(dateLabel(d.tarih))}</small></p></div>`).join('');
  }

  // ── günün sözü bildirimi (isteğe bağlı, yalnız telefonda) ──
  const SOZLER = () => NA.metinler().flatMap(m => (m.satirlar || []).filter(x => typeof x !== 'string' && x.o && x.o.length >= 28 && x.o.length < 140 && /[.!?]$/.test(x.o)).map(x => ({ o:x.o, m })));
  async function bildirimKur(ac){
    if(!Notif){ toast('Bildirimler yalnız telefon uygulamasında çalışır'); return false; }
    try {
      const pend = await Notif.getPending(); if(pend && pend.notifications && pend.notifications.length) await Notif.cancel({ notifications:pend.notifications.map(n => ({ id:n.id })) });
      if(!ac){ toast('🔕 Günün sözü bildirimi kapatıldı'); return true; }
      let p = await Notif.checkPermissions(); if(p.display !== 'granted') p = await Notif.requestPermissions();
      if(p.display !== 'granted'){ toast('Bildirim izni verilmedi (Ayarlar\'dan açabilirsin)'); return false; }
      const V = SOZLER(); if(!V.length) return false;
      const now = new Date(), list = [];
      for(let k = 1; k <= 30; k++){
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k, 9, 0, 0), v = V[(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % V.length];
        list.push({ id:1000 + k, title:'🇹🇷 Günün sözü', body:`“${v.o}” · ${v.m.eser.split('·')[0].trim()}, ${NA.dateLabel(v.m.tarih)}`, schedule:{ at:d, allowWhileIdle:true }, extra:{ metin:v.m.id } });
      }
      await Notif.schedule({ notifications:list });
      toast('🔔 Her sabah 09.00\'da günün sözü gelecek'); return true;
    } catch(e){ toast('Bildirim kurulamadı'); return false; }
  }
  if(Notif){ Notif.addListener && Notif.addListener('localNotificationActionPerformed', (a) => { const id = a && a.notification && a.notification.extra && a.notification.extra.metin; if(id) setTimeout(() => openMetin(id), 400); }); }
  async function renderBildirim(){
    const el = $('#bildirim'); if(!el) return;
    if(!Notif){ el.closest('.kf-bildirim') && (el.closest('.kf-bildirim').hidden = true); return; }
    let on = false; try { on = Prefs ? (await Prefs.get({ key:'na_bildirim' })).value === '1' : false; } catch(e){}
    el.checked = on;
  }
  { const el = $('#bildirim'); if(el) el.addEventListener('change', async () => { const ok = await bildirimKur(el.checked); if(!ok) el.checked = false; if(Prefs) Prefs.set({ key:'na_bildirim', value:el.checked ? '1' : '0' }).catch(() => {}); }); }
  // açılışta: bildirim açıksa 30 günlük takvimi tazele (uygulama her açıldığında sıradaki 30 gün yeniden kurulur)
  setTimeout(async () => { try { if(Notif && Prefs && (await Prefs.get({ key:'na_bildirim' })).value === '1' && NA.metinler().length) bildirimKur(true); } catch(e){} }, 4000);
  renderBildirim();

  function renderAll(){ header(); renderDaily(); renderKinds(); renderList(); renderKadro(); renderTimeline(); renderNews(); renderSaved(); renderTicker(); renderBugun(); renderMyName(); renderSeries(); renderEsle(); renderMyths(); renderTerms(); }
  NA.onUpdate(renderAll);
  setInterval(header, 20000);
})();
