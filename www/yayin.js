// Nutuk Akışı — "Menajer modu" yayın görünümü (FM2010).
// Nutuk'un bölümleri, söylevler, telgraflar ve emirler menajerlik oyununun gelen kutusuna düşen mesajlar gibi akar.
// Her metin açıldığında satırlar önce Mors kodu (telgraf), mikrofon dalgası (söylev) ya da daktilo imleci olarak belirir,
// sonra özgün söz ve altında bugünün Türkçesiyle karşılığı görünür. Yanında Söylev Kartı, altta kronoloji alt yazısı kayar.
// Her 4 mesajda bir ara ekran: Doğru mu Uydurma mı · Kurtuluş Yolu · Tarihte Bugün · Adını eski harflerle · Kadro · Oylama ·
// Vecizeler · Nutuk'tan bir sayfa (Vikikaynak) · Kronoloji · Atatürk'ün Türkçesi · Devrimler · Gündem · Abone ol.
// ?yayin=1 · ?yayin=1&sayfa=4.5 (satır başına saniye) · ?yayin=1&metin=sakarya · ?yayin=1&sahne=harita
(function(){
  const qs = NA.qs;
  if(qs.get('yayin') !== '1') return;
  document.body.classList.add('yayin');
  const LINE = Math.min(9, Math.max(1.5, Number(qs.get('sayfa')) || 5));   // satır başına saniye (sakin okuma)
  const HOLD = 10;                                                           // son satırdan sonra bekleme
  const IX_SECS = 22;
  const { esc, kindChip, kindColor, kindIcon, dateLabel, num } = NA;

  const CREST = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#c8102e" stroke="#fff" stroke-width="3"/><circle cx="43" cy="50" r="22" fill="#fff"/><circle cx="49" cy="50" r="17.6" fill="#c8102e"/><path d="M55 50L71.3 44.7L61.2 58.6L61.2 41.4L71.3 55.3Z" fill="#fff"/></svg>`;
  const OPERATOR = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M22 92c2-18 13-27 28-27s26 9 28 27z" fill="#1f4fa0" stroke="#0c1830" stroke-width="3.5"/><circle cx="50" cy="44" r="22" fill="#f1c9a0" stroke="#0c1830" stroke-width="3.5"/><path d="M28 36q22-22 44 0" fill="none" stroke="#0c1830" stroke-width="6" stroke-linecap="round"/><rect x="19" y="36" width="11" height="18" rx="4" fill="#c8102e" stroke="#0c1830" stroke-width="3"/><rect x="70" y="36" width="11" height="18" rx="4" fill="#c8102e" stroke="#0c1830" stroke-width="3"/><path d="M27 52q-2 12 12 14" fill="none" stroke="#0c1830" stroke-width="3" stroke-linecap="round"/><circle cx="41" cy="66" r="3.5" fill="#0c1830"/><circle cx="42" cy="44" r="3" fill="#0c1830"/><circle cx="58" cy="44" r="3" fill="#0c1830"/><path d="M42 54q8 6 16 0" fill="none" stroke="#0c1830" stroke-width="3" stroke-linecap="round"/></svg>`;

  // ───────────── iskelet ─────────────
  const root = document.createElement('div');
  root.id = 'mgr';
  root.innerHTML = `
    <div class="m-cal" id="mCal"></div>
    <div class="m-nav">
      <span class="m-btn m-back">◀ Geri</span><span class="m-btn m-dim">İleri ▶</span>
      <span class="m-btn m-ico">🏠</span><span class="m-btn">Nutuk ▾</span><span class="m-btn">Söylevler ▾</span><span class="m-btn">Telgraflar ▾</span><span class="m-btn">Devrimler ▾</span><span class="m-btn">Eserler ▾</span><span class="m-btn m-ico">?</span>
      <span class="m-search">🔍 <i id="mSearch"></i></span>
      <span class="m-btn m-fa">NA ▾</span>
    </div>
    <div class="m-continue" id="mContinue"><b>➜</b><span>Devam</span><i id="mContFill"></i></div>
    <div class="m-band">
      <div class="m-crest">${CREST}</div>
      <div class="m-title"><h1>Nutuk <em>Akışı</em></h1><span id="mSub">Gazi'nin Sözleri · Canlı Yayın</span></div>
      <div class="m-demo" id="mDemo" hidden>DEMO · YEREL VERİ</div>
      <div class="m-right">
        <span class="m-music" aria-hidden="true"><em class="mb-note">♫</em><i></i><i></i><i></i><i></i><i></i><span class="m-sig">Mr. Anduv!</span></span>
        <span class="m-live"><i></i>CANLI</span>
        <time id="mClock">--:--</time>
      </div>
      <div class="m-tabs" id="mTabs"><span data-t="genel">🏠 Genel Bakış</span><span data-t="mesaj" class="on">📜 Nutuk ve Söylevler</span><span data-t="kadro">🎖️ Kadro</span><span data-t="kron">⏳ Kronoloji</span><span data-t="harita">🗺️ Kurtuluş Yolu</span><span data-t="devrim">⚖️ Devrimler</span><span data-t="gundem">📰 Gündem</span></div>
    </div>
    <div class="m-sub" id="mSubTabs"><span data-k="">Gelen Kutusu</span>${['Nutuk','Hitabe','Söylev','Telgraf','Emir','Genelge','Kongre','Eser','Bugün ve Gazi','Dizi','Gündem'].map(k => `<span data-k="${k}">${kindIcon(k)} ${k === 'Bugün ve Gazi' ? 'Bugün↔Gazi' : k}</span>`).join('')}<span class="m-note" id="mNote"></span></div>
    <div class="m-main" id="mMain">
      <div class="m-inbox-head"><h2 id="mInboxTitle">Gelen Kutusu</h2><span class="m-poll" id="mPoll" hidden></span><span class="m-btn">Filtre ▾</span></div>
      <div class="m-table">
        <div class="m-th"><span></span><span>Metin</span><span>Tür</span><span>Yer</span><span>Tarih</span></div>
        <div class="m-rows" id="mRows"></div>
      </div>
      <div class="m-msg" id="mMsg"></div>
      <div class="m-ix" id="mIx" hidden></div>
    </div>
    <div class="m-goal" id="mRev" hidden></div>
    <div class="m-name" id="mName" hidden></div>
    <div class="m-ticker"><div class="m-tk-label"><i></i>🇹🇷 KRONOLOJİ</div><div class="m-tk-win"><div class="m-tk-track" id="mTrack"></div></div><div class="m-tk-count" id="mCount"></div></div>`;
  document.body.appendChild(root);
  const $m = (s) => root.querySelector(s);

  function fit(){
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    root.style.transform = `translate(${(innerWidth - 1920 * k) / 2}px, ${(innerHeight - 1080 * k) / 2}px) scale(${k})`;
  }
  addEventListener('resize', fit); fit();

  // ───────────── akış sırası ─────────────
  // Üç havuz dönüşümlü: (Nutuk bölümleri, kronolojik) · (söylev, hitabe, telgraf, emir) · (eser, belge, kongre, anma…).
  // Nutuk bölümleri sırasını korur (hikâye akar); diğer havuzlar her gün farklı karışır. Her 6 mesajda bir gündem haberi.
  let list = [], idx = 0, step = 0, seen = new Set(), lastKey = '';
  function shuffle(a, s){ const r = (() => { let h = s; return () => ((h = (h * 1103515245 + 12345) >>> 0) % 10000) / 10000; })(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function rebuild(){
    const T = NA.metinler(), N = NA.news().slice(0, 6);
    if(!T.length) return;
    const lc = (NA.state.corpus && NA.state.corpus.liveCount) || {};
    const ES = NA.esle().slice(0, 8), DZ = NA.diziBugun();
    const key = T.map(t => t.id + t.satirlar.length).join() + '|' + N.map(n => n.id).join() + '|' + lc.vk + '/' + lc.wiki + '|' + ES.map(e => e.id).join() + '|' + (DZ ? DZ.id : '');
    if(key === lastKey) return;
    lastKey = key;
    const d = NA.ist(), daySeed = d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate();
    const nutuk = T.filter(t => t.bolum).sort((a, b) => a.bolum - b.bolum);
    const start = DZ ? nutuk.findIndex(t => t.id === DZ.id) : 0;
    const pools = [
      [...nutuk.slice(start + 1), ...nutuk.slice(0, start)],      // bugünün bölümü "dizi" olarak başta; gerisi sırayla
      shuffle(T.filter(t => !t.bolum && ['Söylev', 'Hitabe', 'Telgraf', 'Emir'].includes(t.tur)), daySeed + 7),
      shuffle(T.filter(t => !t.bolum && !['Söylev', 'Hitabe', 'Telgraf', 'Emir'].includes(t.tur)), daySeed + 14),
    ];
    const out = [], ptr = [0, 0, 0], total = pools.reduce((s, p) => s + p.length, 0);
    for(let guard = 0; out.length < total && guard < 500; guard++){
      for(const pi of [0, 1, 0, 2]){ const v = pools[pi][ptr[pi]++]; if(v) out.push(v); }
    }
    const items = out.map(t => ({ type:'metin', id:t.id, t }));
    N.forEach((nw, i) => { const at = Math.min(items.length, (i + 1) * 6 - 1); items.splice(at, 0, { type:'news', id:'n:' + nw.id, n:nw }); });
    ES.forEach((e, i) => { const at = Math.min(items.length, 2 + i * 5); items.splice(at, 0, { type:'esle', id:'e:' + e.id, e, t:e.metin ? NA.metin(e.metin) : null }); });
    if(DZ) items.unshift({ type:'dizi', id:'d:' + DZ.id, t:DZ });
    const prev = list[idx] && list[idx].id;
    list = items;
    const want = !prev && qs.get('metin') ? list.findIndex(x => x.t && x.t.id === qs.get('metin')) : -1;
    const at = prev ? list.findIndex(x => x.id === prev) : want;
    idx = at >= 0 ? at : 0;
  }
  const kindOf = (x) => x.type === 'news' ? 'Gündem' : x.type === 'esle' ? 'Bugün ve Gazi' : x.type === 'dizi' ? 'Dizi' : x.t.tur;
  const titleOf = (x) => x.type === 'news' ? x.n.title : x.type === 'esle' ? x.e.haber.title : x.type === 'dizi' ? `Nutuk Dizisi · Bölüm ${x.t.bolum}: ${x.t.baslik}` : x.t.baslik;

  // ───────────── takvim şeridi ─────────────
  let calPage = 0;
  setInterval(() => { calPage++; renderCal(); }, 8000);
  function renderCal(){
    const n = NA.ist(), clock = `${NA.two(n.getHours())}:${NA.two(n.getMinutes())}`;
    const cells = [`<div class="m-day today"><span>📅</span><b>${n.getDate()} ${NA.MONTHS[n.getMonth()]} ${NA.DAYS[n.getDay()]}</b><span class="m-sess calm" title="Cumhuriyet'in kaçıncı yılı">🇹🇷 ${NA.cumhuriyetYili()}. yıl</span><time>${clock}</time></div>`];
    if(calPage % 2 === 1 && list.length > 1){
      for(let k = 1; k <= 4; k++){
        const x = list[(idx + k) % list.length]; if(!x) break;
        const title = titleOf(x).replace(/^Nutuk Dizisi · /, '');
        cells.push(`<div class="m-day m-mk"><small>Sırada · ${k}</small><span><em style="color:${kindColor(kindOf(x))}">${kindIcon(kindOf(x))}</em><b class="m-mk-t">${esc(title.split(':')[0])}</b></span></div>`);
      }
    } else {
      const S = NA.siradakiGun(), T = NA.metinler(), O = T.reduce((s, m) => s + NA.originals(m).length, 0), TB = NA.tarihteBugun();
      cells.push(`<div class="m-day m-mk"><small>Sıradaki millî gün</small><span><b>🎉 ${S ? esc(S.ad) : '—'}</b><em>${S ? (S.gun === 0 ? 'BUGÜN' : S.gun + ' gün') : ''}</em></span></div>`);
      cells.push(`<div class="m-day m-mk"><small>Nutuk'tan bu yana</small><span><b>🎙️ ${NA.ist().getFullYear() - 1927} yıl</b></span></div>`);
      cells.push(`<div class="m-day m-mk"><small>Metin arşivi</small><span><b>📜 ${T.length} metin</b><em>${O} söz</em></span></div>`);
      cells.push(`<div class="m-day m-mk"><small>Tarihte bugün</small><span><b>📌 ${TB.items.length ? esc(String(TB.items[0].yil)) + ' · ' + esc(TB.items[0].metin.split(':')[0]) : TB.yakin[0] ? esc(dateLabel(TB.yakin[0].tarih, true).replace(/ \d{4}$/, '')) + ' · ' + esc(TB.yakin[0].b) : '—'}</b></span></div>`);
    }
    $m('#mCal').innerHTML = cells.join('') + `<div class="m-day m-arrows">${[0, 1].map(i => i === calPage % 2 ? '●' : '○').join(' ')}</div>`;
    $m('#mClock').textContent = clock;
    $m('#mSub').textContent = `Gazi'nin Sözleri · ${n.getDate()} ${NA.MONTHS_LONG[n.getMonth()]} ${NA.DAYS_LONG[n.getDay()]}`;
  }

  function renderNote(){
    const c = NA.state.corpus, el = $m('#mNote');
    $m('#mDemo').hidden = !(c && c.demo);
    if(!c){ el.className = 'm-note stale'; el.textContent = NA.state.corpusError ? 'Sunucuya ulaşılamıyor…' : 'Metinler yükleniyor…'; return; }
    el.className = 'm-note';
    const lc = c.liveCount || {};
    el.innerHTML = c.demo ? 'DEMO · yalnız yerel arşiv' : `Arşiv: ${c.metinler.length} metin · Vikikaynak ✓ ${lc.vkSatir || 0} satır · Wikipedia ${lc.wiki || 0} sayfa`;
  }

  // ───────────── gelen kutusu ─────────────
  function renderInbox(){
    const unread = list.filter(d => !seen.has(d.id)).length, nT = list.filter(x => x.type === 'metin' || x.type === 'dizi').length;
    const nE = list.filter(x => x.type === 'esle').length, nN = list.filter(x => x.type === 'news').length;
    $m('#mInboxTitle').innerHTML = list.length ? `Gelen Kutusu: <b>${nT}</b> metin${nE ? `, <b>${nE}</b> bugün↔Gazi` : ''}${nN ? `, <b>${nN}</b> haber` : ''} · <b class="m-unread">${unread}</b> okunmamış` : 'Gelen Kutusu';
    if(!list.length){ $m('#mRows').innerHTML = ''; return; }
    const start = Math.max(0, Math.min(idx - 1, list.length - 4));
    $m('#mRows').innerHTML = list.slice(start, start + 4).map((x, i) => {
      const cur = start + i === idx, unr = !seen.has(x.id) && !cur;
      const place = x.type === 'news' ? x.n.source : x.type === 'esle' ? `${x.e.haber.source} ↔ ${x.e.kaynak}` : x.t.yer;
      const when = x.type === 'news' ? NA.ago(x.n.time) : x.type === 'esle' ? `Bugün ↔ ${x.e.yil || ''}` : dateLabel(x.t.tarih);
      return `<div class="m-row ${cur ? 'cur' : ''} ${unr ? 'unread' : ''}"><span class="m-env">${unr ? '✉️' : '📨'}${x.type !== 'metin' || x.secim ? '<i class="m-dot"></i>' : ''}</span><span class="m-h">${esc(titleOf(x))}</span><span>${kindChip(kindOf(x), 'm-kind')}</span><span>${esc(place)}</span><span>${esc(when)}</span></div>`;
    }).join('');
    const k = list[idx] ? kindOf(list[idx]) : '';
    root.querySelectorAll('#mSubTabs [data-k]').forEach(el => el.classList.toggle('on', el.dataset.k === k || (['Belge', 'Anma'].includes(k) && el.dataset.k === 'Eser')));
  }

  // ───────────── Söylev Kartı ─────────────
  const CARD_NAME = { Telgraf:'📡 Telgraf Kartı', Emir:'⚔️ Emir Kartı', Genelge:'📜 Belge Kartı', Belge:'📜 Belge Kartı', Eser:'📗 Eser Kartı', Kongre:'🏛️ Kongre Kartı', Anma:'🕯️ Anma Kartı' };
  function kursu(t){
    const w = t.live && t.live.wiki;
    const heads = Array.from({ length:21 }, (_, i) => `<circle cx="${10 + i * 21}" cy="${102 + (i % 3) * 5}" r="${9 + (i % 2)}"/>`).join('');
    const flags = [40, 140, 286, 392].map((x, i) => `<g class="fl" style="--i:${i}" transform="translate(${x} ${68 + (i % 2) * 6})"><path d="M0 0v34" stroke="#3b2410" stroke-width="2"/><path class="fl-c" d="M0 0h26v16H0z" fill="#c8102e"/><circle cx="10" cy="8" r="4" fill="#fff"/><circle cx="11.6" cy="8" r="3.2" fill="#c8102e"/></g>`).join('');
    return `<div class="m-card-art"><div class="m-kursu"><svg viewBox="0 0 440 128" preserveAspectRatio="xMidYMid slice">
        <rect x="156" y="14" width="128" height="42" rx="6" fill="#efe3c9" stroke="#3b2410" stroke-width="3"/><path d="M156 56h128v8H156z" fill="#3b2410"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${166 + i * 18} 56v-28" stroke="#3b2410" stroke-width="3"/>`).join('')}
        <path d="M200 14h40v12h-40z" fill="#c8102e"/><circle cx="214" cy="20" r="4" fill="#fff"/><circle cx="215.6" cy="20" r="3.2" fill="#c8102e"/>
        ${flags}<g fill="#1c2a44" opacity=".92">${heads}</g></svg><b class="m-kursu-ico">${esc(t.simge || kindIcon(t.tur))}</b></div>
      ${w && w.thumb ? `<figure class="m-photo"><img src="${esc(w.thumb)}" alt="" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"><figcaption>📷 Wikipedia</figcaption></figure>` : ''}</div>`;
  }
  function srcRow(t){
    const v = t.live && t.live.vk, O = NA.originals(t).length;
    if(v && v.ok && O) return ['Kaynak', `✓ Vikikaynak <small>${v.esles}/${v.toplam} satır</small>`];
    if(O) return ['Özgün söz', `${O} satır <small>(doğrulanıyor)</small>`];
    return ['Anlatım', 'Günümüz Türkçesiyle'];
  }
  function metinCard(t){
    const rows = [
      ['Tür', `${kindIcon(t.tur)} ${esc(t.tur)}`],
      ['Yer', esc(t.yer)],
      ['Dinleyen', esc(t.dinleyen || '—')],
      ['Eser', esc(t.eser || '—')],
      ['Gazi o yıl', `${NA.yas(t.tarih)} yaşında`],
      srcRow(t),
    ];
    return `<aside class="m-card">
      <div class="m-card-name">${CARD_NAME[t.tur] || '🎙️ Söylev Kartı'} <small>${esc((t.kisiler || []).slice(0, 2).join(' · '))}</small></div>
      ${kursu(t)}
      <div class="m-card-price"><strong>${esc(dateLabel(t.tarih))}</strong><span class="m-chip" style="--c:${kindColor(t.tur)}">${NA.yilOnce(t.tarih)} yıl önce</span></div>
      <dl>${rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
    </aside>`;
  }
  function diziCard(t){
    const D = NA.dizi(), i = D.findIndex(x => x.id === t.id), nx = D[(i + 1) % D.length];
    return `<aside class="m-card"><div class="m-card-name">📺 Nutuk Dizisi <small>her gün bir bölüm</small></div>
      <div class="sr">${D.map(x => `<span class="${x.id === t.id ? 'on' : x.bolum < t.bolum ? 'done' : ''}">${x.bolum}</span>`).join('')}</div>
      <div class="m-card-price"><strong>Bölüm ${t.bolum} / ${D.length}</strong><span class="m-chip" style="--c:#9b1c1c">${esc(dateLabel(t.tarih, true))}</span></div>
      <dl><dt>Eser</dt><dd>Nutuk</dd><dt>Okunduğu</dt><dd>15–20 Ekim 1927</dd><dt>Süre</dt><dd>~36,5 saat · 6 gün</dd><dt>Yer</dt><dd>${esc(t.yer)}</dd><dt>Yarın</dt><dd>${esc(nx ? nx.baslik.split(':')[0] : '')}</dd></dl></aside>`;
  }
  function newsCard(){
    const N = NA.news().slice(0, 6);
    return `<aside class="m-card"><div class="m-card-name">📰 Gündem</div><div class="m-mini">${N.map(n => `<div class="mm"><span class="st">${esc(NA.ago(n.time))}</span><span class="t">${esc(n.title)}</span></div>`).join('') || '<p class="mm-empty">Haber bekleniyor…</p>'}</div></aside>`;
  }

  // ───────────── mesaj paneli: satırların "inişi" ─────────────
  let lineTimers = [], msgTimer = null;
  function clearLines(){ lineTimers.forEach(clearTimeout); lineTimers = []; }
  const lineSecs = (s) => { const l = NA.line(s); return LINE + (l.s ? 1.6 : 0) + Math.max(0, (NA.lineText(s).length - 110) / 40); };
  function msgSecs(x){
    if(x.type === 'news') return 18;
    if(x.type === 'esle') return 8 + 2 * LINE + HOLD;
    return 1.6 + x.t.satirlar.reduce((s, l) => s + lineSecs(l), 0) + HOLD;
  }
  const voiceLabel = { mors:'📡 TELGRAF HATTI', mikrofon:'🎙️ KÜRSÜDE', daktilo:'⌨️ DAKTİLODA' };
  function renderMsg(delay = 0){
    clearLines();
    const x = list[idx];
    if(!x){
      $m('#mMsg').innerHTML = `<div class="m-empty">Metin arşivi açılıyor…<div class="m-coach"><div class="m-coach-face">${OPERATOR}</div><div class="m-bubble">${NA.state.corpusError ? 'Sunucuya ulaşılamadı: <b>start.command</b> çalışıyor mu?' : 'Telgrafçı hatları bağlıyor…'}</div></div></div>`;
      return;
    }
    seen.add(x.id);
    if(x.type === 'esle'){
      const e = x.e, h = e.haber, yil = e.yil || 1927, fark = NA.ist().getFullYear() - yil;
      typeSearch('bugün ↔ ' + yil);
      markNow(yil + .5);
      $m('#mMsg').innerHTML = `<article class="m-article">
        <div class="m-kick">${kindChip('Bugün ve Gazi', 'm-kind')}<span class="m-author">${esc(h.source)}</span><span>· ${esc(NA.ago(h.time))}</span><span>↔ ${esc(e.kaynak)}, ${yil}</span></div>
        <h2>${esc(e.kopru || 'Bugün ve Gazi')}</h2>
        <div class="bo">
          <div class="bo-l"><small>📰 BUGÜN · ${esc(h.source)}</small><b>${esc(h.title)}</b></div>
          <div class="bo-mid"><span>${fark}<br>yıl</span></div>
          <div class="bo-r"><small>🇹🇷 GAZİ · ${yil} · ${esc(e.kaynak)}</small><b>“${esc(e.soz)}”</b></div>
        </div>
        <div class="m-coach"><div class="m-coach-face">${OPERATOR}</div><div class="m-bubble"><b>Telgrafçı:</b> Haberin başlığı bugünden, söz ${fark} yıl öncesinden. Aynı konu, aynı ülke.</div></div>
        <div class="m-src">Haber: <b>${esc(h.source)}</b> · başlık ve bağlantı yayıncısına aittir · Söz: belgeli kaynağıyla</div>
      </article>${x.t ? metinCard(x.t) : newsCard()}`;
      return;
    }
    if(x.type === 'news'){
      const n = x.n, fresh = Date.now() / 1000 - n.time < 2 * 86400;
      typeSearch(n.key || 'atatürk');
      $m('#mMsg').innerHTML = `<article class="m-article">
        <div class="m-kick">${kindChip('Gündem', 'm-kind')}${fresh ? '<i class="m-new">🆕 GÜNDEMDE</i>' : ''}<span class="m-author">${esc(n.source)}</span><span>· ${esc(NA.ago(n.time))}</span></div>
        <h2 class="m-h2-2">${esc(n.title)}</h2>
        ${n.summary ? `<p>${esc(n.summary)}</p>` : ''}
        <div class="m-coach"><div class="m-coach-face">${OPERATOR}</div><div class="m-bubble">Hattan yeni bir haber geldi! Cumhuriyet'in tarihi bugün de <b>gündemde</b>.</div></div>
        <div class="m-src">Kaynak: <b>${esc(n.source)}</b>${n.link ? ' · Haberin tamamı kaynağın sitesinde' : ''}</div>
      </article>${newsCard()}`;
      return;
    }
    const t = x.t, v = t.live && t.live.vk, voice = NA.voiceOf(t.tur), O = NA.originals(t).length;
    const dz = x.type === 'dizi';
    typeSearch((t.kisiler && t.kisiler[0] && !dz ? t.kisiler[0] + ' · ' : '') + dateLabel(t.tarih, true));
    markNow(NA.decYear(t.tarih));
    const kick = dz ? `${kindChip('Dizi', 'm-kind')}<span class="m-author">Nutuk</span><span>· Bölüm ${t.bolum} / ${NA.dizi().length}</span><span>· Bugünün bölümü</span>`
                    : `${x.secim ? '<i class="m-new">🗳️ İZLEYİCİLERİN SEÇİMİ</i>' : ''}${kindChip(t.tur, 'm-kind')}<span class="m-author">${esc(t.yer)}</span><span>· ${esc(dateLabel(t.tarih))}</span><span>· ${esc(t.dinleyen || '')}</span>`;
    $m('#mMsg').innerHTML = `<article class="m-article">
        <div class="m-kick">${kick}${v && v.ok ? '<i class="m-ok">✓ Vikikaynak</i>' : ''}${NA.ses(sesName(x)) ? '<span>· 🔊 Sesli</span>' : ''}</div>
        <h2>${esc(t.baslik)}</h2>
        <div class="m-lines v-${voice}" id="mLines"><div class="m-voice"><b>${voiceLabel[voice]}</b><span>${esc(t.yer.split('·')[0].trim())} · ${esc(dateLabel(t.tarih))}</span><i class="m-vu"><u></u><u></u><u></u><u></u><u></u><u></u><u></u></i></div><div class="m-lines-in" id="mLinesIn"></div><div class="m-ray"></div></div>
        <div class="m-coach"><div class="m-coach-face">${OPERATOR}</div><div class="m-bubble"><b>Biliyor muydun?</b> ${esc(t.bilgi || t.ne)}</div></div>
        <div class="m-src">${O ? `<b>${esc(t.eser)}</b> · özgün söz <span class="m-o-key">Atatürk</span> ve altında <span class="m-s-key">bugünün Türkçesiyle</span>${O < t.satirlar.length ? ' · düz satırlar günümüz Türkçesiyle anlatım' : ''}` : `<b>${esc(t.eser)}</b> · günümüz Türkçesiyle anlatım · ${esc(t.ne)}`}${v && v.ok ? ` · ✓ ${v.esles}/${v.toplam} özgün satır Vikikaynak'taki tam metinle eşleşti` : ''}</div>
      </article>${dz ? diziCard(t) : metinCard(t)}`;
    runLines(t.satirlar, delay, voice);
  }
  function runLines(lines, delay, voice){
    const box = $m('#mLinesIn');
    let at = delay + 1.2;
    lines.forEach((ln, i) => { const when = at; lineTimers.push(setTimeout(() => revealLine(box, ln, i, voice), when * 1000)); at += lineSecs(ln); });
    lineTimers.push(setTimeout(() => { const s = $m('.m-src'); if(s) s.classList.add('done'); const l = $m('#mLines'); if(l) l.classList.add('end'); }, at * 1000));
  }
  const sesName = (x) => x.t ? `${x.t.id}.mp3` : '';
  function revealLine(box, raw, i, voice){
    if(!box.isConnected) return;
    box.querySelectorAll('.ln.now').forEach(el => el.classList.remove('now'));
    const l = NA.line(raw), text = l.o || l.a;
    const pre = voice === 'mors' ? NA.morse(text, 16) : voice === 'mikrofon' ? NA.wave(26) : '▌';
    const el = document.createElement('div');
    el.className = `ln now ${l.o ? 'is-o' : 'is-a'}`;
    el.innerHTML = `<span class="no">${l.o ? '“' : i + 1}</span><span class="body"><span class="cu">${esc(pre)}</span><span class="tx">${esc(text)}</span>${l.s ? `<span class="sd">≈ ${esc(l.s)}</span>` : ''}</span>`;
    box.appendChild(el);
    const wrap = box.parentNode, ray = wrap.querySelector('.m-ray');
    wrap.classList.remove('talk'); void wrap.offsetWidth; wrap.classList.add('talk');
    ray.classList.remove('go'); void ray.offsetWidth; ray.classList.add('go');
    const card = $m('.m-kursu'); if(card){ card.classList.remove('cheer'); void card.offsetWidth; card.classList.add('cheer'); }
    requestAnimationFrame(() => { wrap.scrollTo({ top:wrap.scrollHeight, behavior:'smooth' }); });
  }
  let typeT = null;
  function typeSearch(txt){
    clearInterval(typeT); const el = $m('#mSearch'); let i = 0; el.textContent = '';
    typeT = setInterval(() => { el.textContent = txt.slice(0, ++i); if(i >= txt.length) clearInterval(typeT); }, 80);
  }

  // ───────────── alarm: "TELGRAF GELDİ" · "GAZİ KÜRSÜDE" (Futbol'daki GOL alarmının karşılığı) ─────────────
  const ALARM = { Telgraf:'📡 TELGRAF GELDİ!', Emir:'⚔️ EMİR!', Genelge:'📜 GENELGE!', Kongre:'🏛️ KONGRE TOPLANDI', Nutuk:'🎙️ GAZİ KÜRSÜDE', Söylev:'🎙️ GAZİ KÜRSÜDE', Hitabe:'🔥 EY TÜRK GENÇLİĞİ!', Eser:'📗 YENİ ESER', Belge:'✍️ BELGE', Anma:'🕯️ SAYGIYLA' };
  function revelation(x){
    if(!x) return 0;
    const el = $m('#mRev');
    if(x.type === 'news'){
      if(Date.now() / 1000 - x.n.time > 2 * 86400) return 0;
      el.innerHTML = `<div class="gl rev dig"><div class="rev-cu">📰 ${esc(NA.morse('gundem', 8))}</div><div class="gl-word">GÜNDEMDE!</div>
        <div class="gl-body">${kindChip('Gündem', 'gl-kind')}<b class="gl-t">${esc(x.n.title)}</b></div><div class="gl-who">${esc(x.n.source)} · ${esc(NA.ago(x.n.time))}</div></div>`;
    } else if(x.type === 'dizi'){
      el.innerHTML = `<div class="gl rev"><div class="rev-cu">${esc(NA.morse('nutuk', 6))}</div><div class="gl-word">NUTUK · BÖLÜM ${x.t.bolum}</div>
        <div class="gl-body">${kindChip('Dizi', 'gl-kind')}<b class="gl-t">${esc(x.t.baslik)}</b></div><div class="gl-who">📺 Bugünün bölümü · 📍 ${esc(x.t.yer)} · ${esc(dateLabel(x.t.tarih))}</div></div>`;
    } else if(x.type === 'metin'){
      const t = x.t, anma = t.tur === 'Anma';
      el.innerHTML = `<div class="gl rev ${anma ? 'calm' : ''}"><div class="rev-cu">${esc(NA.voiceOf(t.tur) === 'mors' ? NA.morse(t.baslik, 10) : NA.wave(30))}</div><div class="gl-word">${x.secim ? '🗳️ İZLEYİCİLER SEÇTİ' : ALARM[t.tur] || '🎙️ GAZİ KÜRSÜDE'}</div>
      <div class="gl-body">${kindChip(t.tur, 'gl-kind')}<b class="gl-t">${esc(t.baslik)}</b></div>
      <div class="gl-who">📍 ${esc(t.yer)} · ${esc(dateLabel(t.tarih))} · ${esc(t.eser)}</div></div>`;
    } else return 0;
    el.hidden = false;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
    setTimeout(() => { el.hidden = true; }, 3600);
    return 2.6;
  }

  // ───────────── kronoloji alt yazısı ─────────────
  let trackKey = '';
  function renderTicker(){
    const K = NA.kronoloji(), I = NA.ekler().biliyormu || [];
    const cur = list[idx];
    $m('#mCount').innerHTML = cur && cur.t && cur.type !== 'esle' ? `<i class="dot"></i>${esc(dateLabel(cur.t.tarih))}` : `📜 ${NA.metinler().length} METİN`;
    if(!K.length){ $m('#mTrack').innerHTML = `<span class="m-tk-item">${NA.state.corpus ? 'Kronoloji bulunamadı' : 'Kronoloji yükleniyor…'}</span>`; trackKey = ''; return; }
    const key = K.map(k => k.tarih).join() + I.length;
    if(key === trackKey) return;
    trackKey = key;
    let ii = 0;
    const html = K.map((k, i) => `<span class="m-tk-item" data-y="${NA.decYear(k.tarih).toFixed(3)}"><em>${esc(dateLabel(k.tarih, true))}</em><b>${esc(k.b)}</b><span>${esc(k.m)}</span></span>` + ((i + 1) % 3 === 0 && I.length ? `<span class="m-tk-ilk">${esc(I[ii++ % I.length])}</span>` : '')).join('');
    const tr = $m('#mTrack');
    tr.innerHTML = html + html;
    requestAnimationFrame(() => tr.style.setProperty('--D', Math.max(60, tr.scrollWidth / 2 / 105) + 's'));
  }
  function markNow(y){
    let best = null, d = 1e9;
    root.querySelectorAll('#mTrack [data-y]').forEach(el => { const v = Math.abs(Number(el.dataset.y) - y); if(v < d){ d = v; best = el.dataset.y; } });
    root.querySelectorAll('#mTrack [data-y]').forEach(el => el.classList.toggle('is-now', el.dataset.y === best));
  }

  // ───────────── ara ekranlar ─────────────
  const SCENES = ['dogrumu', 'harita', 'bugun', 'isim', 'kadro', 'oylama', 'vecize', 'sayfa', 'dogrumu', 'kronoloji', 'isim', 'terimler', 'devrimler', 'oylama', 'gundem', 'bugun', 'abone'];
  const SCENE_SECS = { dogrumu:34, harita:30, isim:22, oylama:26, sayfa:32, bugun:26 };
  let sceneIdx = 0, ixTimer = null, dgIdx = 0, curScene = '';
  const HUKUM = { belgesiz:['❌', 'BELGESİ YOK', '#c0262d'], tartismali:['🟡', 'TARTIŞMALI', '#c98a12'], belgeli:['✅', 'BELGELİ', '#1f8a4c'] };
  function pollOptions(){
    const used = new Set(list.slice(Math.max(0, idx - 3), idx + 3).map(x => x.id));
    const C = list.filter(x => x.type === 'metin' && !used.has(x.id) && ['Nutuk', 'Söylev', 'Hitabe', 'Emir', 'Telgraf'].includes(x.t.tur));
    const d = NA.ist(); const o = (d.getHours() * 7 + d.getMinutes()) % Math.max(1, C.length);
    return [C[o], C[(o + 3) % C.length]].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(x => x.id);
  }
  function pollHTML(P){
    if(!P) return '';
    const tot = P.oy.reduce((a, b) => a + b, 0) || 0;
    return P.secenekler.map((id, i) => { const t = NA.metin(id); const pc = tot ? Math.round(P.oy[i] / tot * 100) : 0; return `<div class="pl-o ${P.kazanan === i ? 'win' : ''}" style="--i:${i}"><b class="pl-k">!${i + 1}</b><span class="pl-t">${t ? kindIcon(t.tur) + ' ' + esc(t.baslik) : esc(id)}</span><span class="pl-b"><i style="width:${pc}%"></i></span><em>${P.oy[i]} oy · %${pc}</em></div>`; }).join('');
  }
  function proc(title, sub, body, tab){
    setTab(tab);
    return `<div class="m-proc" style="--T:${IX_SECS}s"><div class="m-proc-bar">İşleniyor… <i><b></b></i><span>${esc(sub)}</span></div>
      <div class="m-proc-box"><h3>${title}<small>Nutuk Akışı · Atatürk'ün eserleri</small></h3><div class="m-proc-body">${body}</div></div></div>`;
  }
  // Kronoloji ekseni: dönemlere göre esnetilmiş (Millî Mücadele yılları geniş)
  const KX = [[1881, 0], [1915, 14], [1919, 24], [1923, 62], [1938, 100]];
  function kx(y){ for(let i = 1; i < KX.length; i++){ const [y0, x0] = KX[i - 1], [y1, x1] = KX[i]; if(y <= y1) return x0 + (Math.max(y, y0) - y0) / (y1 - y0) * (x1 - x0); } return 100; }
  function scene(name){
    const E = NA.ekler();
    curScene = name;
    if(name === 'dogrumu'){
      const F = NA.dogrumu(); if(!F.length) return scene('harita');
      const f = F[dgIdx++ % F.length], H = HUKUM[f.hukum] || HUKUM.tartismali, T = SCENE_SECS.dogrumu;
      return proc('🔍 Doğru mu, Uydurma mı? · Atatürk\'e mal edilen sözler', 'Belgeler taranıyor', `<div class="ef">
        <div class="ef-q"><small>SÖZ · ${esc(f.nerede)}</small><b>“${esc(f.soz)}”</b></div>
        <div class="ef-c" style="--i:0"><h4>📜 Belgeler ne diyor?</h4><p>${esc(f.kanit)}</p></div>
        <div class="ef-c" style="--i:1"><h4>🎓 Tarihçinin notu</h4><p>${esc(f.tarihci)}</p></div>
        <div class="ef-v" style="--d:${(T * .58).toFixed(1)}s;--h:${H[2]}"><span class="ef-cd">Hüküm geliyor…</span><div class="ef-stamp">${H[0]} ${H[1]}</div><em>${esc(f.kisaca)}</em></div></div>`, 'genel');
    }
    if(name === 'harita'){
      const S = E.harita || [], SN = E.sinir || {};
      if(!S.length) return scene('kronoloji');
      const B = { la0:35.7, la1:42.3, lo0:25.6, lo1:45.0 }, W = 1060, Hh = 470;
      const P = (la, lo) => [((lo - B.lo0) / (B.lo1 - B.lo0) * W).toFixed(1), ((B.la1 - la) / (B.la1 - B.la0) * Hh).toFixed(1)];
      const poly = (pts) => 'M' + pts.map(([lo, la]) => P(la, lo).join(' ')).join(' L') + ' Z';
      const route = 'M' + S.slice(1).map(c => P(c.lat, c.lon).join(' ')).join(' L');   // Samsun'dan sonrası kara yolu
      const sea = `M${P(S[0].lat, S[0].lon).join(' ')} Q${P(42.95, 32.6).join(' ')} ${P(S[1].lat, S[1].lon).join(' ')}`;   // İstanbul → Samsun: Bandırma Vapuru, Karadeniz
      const svg = `<svg class="mp" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="xMidYMid meet">
        <defs><pattern id="steppe" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.1" fill="#d9c49a"/></pattern></defs>
        <rect width="${W}" height="${Hh}" fill="#9fc0e2"/>
        ${['trakya', 'anadolu'].filter(k => SN[k]).map(k => `<path d="${poly(SN[k])}" class="mp-land"/><path d="${poly(SN[k])}" fill="url(#steppe)"/>`).join('')}
        <text class="mp-sl" x="${P(42.0, 34.5)[0]}" y="${P(42.0, 34.5)[1]}">Karadeniz</text><text class="mp-sl" x="${P(36.0, 31)[0]}" y="${P(36.0, 31)[1]}">Akdeniz</text><text class="mp-sl" x="${P(38.6, 25.9)[0]}" y="${P(38.6, 25.9)[1]}">Ege</text>
        <path d="${sea}" class="mp-sea"/><path d="${route}" class="mp-route"/>
        ${S.map((c, i) => { const [x, y] = P(c.lat, c.lon); return `<g class="mp-c" style="--i:${i}"><circle cx="${x}" cy="${y}" r="9"/><text x="${x}" y="${y}" dx="${c.yon === 'sol' ? -13 : 13}" dy="7" text-anchor="${c.yon === 'sol' ? 'end' : 'start'}">${esc(c.ad)}</text></g>`; }).join('')}
      </svg>`;
      return proc('🗺️ Kurtuluş Yolu · Samsun\'dan Akdeniz\'e', 'Rota çiziliyor', `<div class="mp-wrap">${svg}</div><div class="mp-list">${S.map((c, i) => `<div class="mp-r" style="--i:${i}"><b>${esc(c.ad)}</b><span>${esc(dateLabel(c.tarih))}</span><small>${esc(c.not)}</small></div>`).join('')}</div>`, 'harita');
    }
    if(name === 'bugun'){
      const TB = NA.tarihteBugun(), n = NA.ist();
      const rows = TB.items.slice(0, 7), yakin = TB.yakin;
      return proc(`📌 Tarihte Bugün · ${esc(TB.gun)}`, 'Arşiv takvimi açılıyor', `<div class="tb">
        <div class="tb-leaf"><small>${NA.DAYS_LONG[n.getDay()]}</small><b>${n.getDate()}</b><span>${NA.MONTHS_LONG[n.getMonth()]}</span><em>${n.getFullYear()}</em></div>
        <div class="tb-list">${rows.length ? rows.map((r, i) => `<div class="tb-r ${r.ozel ? 'ozel' : ''}" style="--i:${i}"><b>${r.yil}</b><span>${esc(r.metin)}</span><small>${r.yerel ? 'Nutuk Akışı arşivi' : r.tur === 'dogum' ? 'Doğum' : r.tur === 'olum' ? 'Ölüm' : 'Wikipedia'}</small></div>`).join('')
          : `<div class="tb-r" style="--i:0"><b>—</b><span>Bugünün tarihinde arşivde kayıtlı bir olay yok. Yaklaşan yıl dönümleri:</span></div>`}
          ${!rows.length || rows.length < 3 ? yakin.map((k, i) => `<div class="tb-r yakin" style="--i:${i + 1}"><b>${esc(dateLabel(k.tarih, true))}</b><span>${esc(k.b)}: ${esc(k.m)}</span><small>yaklaşıyor</small></div>`).join('') : ''}
        </div></div><small class="tb-src">Kaynak: Türkçe Vikipedi'nin "${esc(TB.gun)}" sayfası (1881–1953 olayları) + yerel kronoloji</small>`, 'kron');
    }
    if(name === 'isim'){
      const L = ((NA.state.canli && NA.state.canli.isimler) || []).slice(-8).reverse();
      const demo = !L.length, N = demo ? ['Emre', 'Ayşe', 'Mehmet', 'Zeynep'].map(ad => ({ ad, demo:true })) : L;
      return proc('✍️ Adını eski harflerle yaz · 1928\'den önceki yazıyla', 'Hattat yazıyor', `<div class="nm">
        <div class="nm-how"><b>Sohbete yaz:</b><span class="nm-cmd">!isim Adın</span><em>Adın 1 Kasım 1928'den önce kullanılan harflerle yazılsın${demo ? ' · aşağıdakiler örnek' : ''}</em></div>
        <div class="nm-g">${N.map((n, i) => `<div class="nm-t ${i === 0 && !demo ? 'big' : ''}" style="--i:${i}"><b class="osm" dir="rtl" lang="ota">${esc(NA.eskiHarf(n.ad))}</b><em>${esc(n.ad)}${n.demo ? ' · örnek' : ''}</em><span>${esc(NA.morse(n.ad, 8))}</span></div>`).join('')}</div>
        <small class="nm-not">Harf harf, yaklaşık yazım: Osmanlıca imlada bazı ünlüler yazılmaz, bazı adların geleneksel yazılışı farklıdır. Altındaki satır adın Mors kodu.</small></div>`, 'genel');
    }
    if(name === 'oylama'){
      const cur = NA.state.canli && NA.state.canli.oylama;
      const opts = pollOptions();
      if(!(cur && cur.kalan > 0) && opts.length < 2) return scene('vecize');
      if(!(cur && cur.kalan > 0)) NA.post('/api/oylama', { secenekler:opts, sure:150 }).then(() => NA.loadCanli());
      const P = cur && cur.kalan > 0 ? cur : { secenekler:opts, oy:opts.map(() => 0), kazanan:null };
      return proc('🗳️ Sıradaki metni siz seçin!', 'Oylar sayılıyor', `<div class="pl">
        <div class="pl-how"><b>Sohbete yaz:</b> ${P.secenekler.map((_, i) => `<span class="nm-cmd">!${i + 1}</span>`).join(' ya da ')} <em>· Oylama birkaç dakika sürer, kazanan metin hemen ardından yayına girer</em></div>
        <div class="pl-os" id="mPollBig">${pollHTML(P)}</div></div>`, 'genel');
    }
    if(name === 'sayfa'){
      const c = NA.sayfa()[0]; if(!c) return scene('vecize');
      const sents = c.para.split(/(?<=[.!?…])\s+/).filter(Boolean).slice(0, 9);
      return proc('📖 Nutuk\'tan bir sayfa · Vikikaynak\'tan rastgele', 'Sayfa çevriliyor', `<div class="sy">
        <div class="sy-page"><small>${esc(c.title)}</small>${sents.map((s, i) => `<span style="--i:${i}">${esc(s)} </span>`).join('')}</div>
        <div class="sy-side"><b>📜</b><h4>Özgün metin</h4><p>Bu paragraf, Atatürk'ün eserlerinin tam metnini yayımlayan <b>Vikikaynak</b>'tan saatte bir rastgele seçilir. Kelimeler 1927'nin Türkçesidir.</p><small>${c.url ? 'tr.wikisource.org · ' + esc(c.title) : 'DEMO'}</small></div></div>`, 'genel');
    }
    if(name === 'kadro'){
      const K = NA.kadro().slice(0, 12);
      if(!K.length) return scene('kronoloji');
      const count = (k) => NA.metinler().filter(m => (m.kisiler || []).some(p => p.includes(k.ad.split(' ')[0]))).length;
      return proc('🎖️ Millî Mücadele Kadrosu · Silah ve kalem arkadaşları', 'Kadro açıklanıyor', `<div class="pn">${K.map((k, i) => `<div class="pn-c" style="--i:${i};--g:${k.renk}"><b class="pn-s">${esc(k.simge)}</b><h4>${esc(k.ad)}</h4><p>${esc(k.katki)}</p><div class="pn-f"><span>🎖 ${esc(k.rol)}</span></div>${count(k) ? `<em class="pn-n">${count(k)} metinde</em>` : ''}</div>`).join('')}</div>`, 'kadro');
    }
    if(name === 'kronoloji'){
      const K = NA.kronoloji().filter(k => NA.parts(k.tarih).y <= 1938);
      if(!K.length) return scene('vecize');
      const ERAS = [[1881, 1915, 'Çocukluk, okul, subaylık', '#5d6b72'], [1915, 1919, 'Çanakkale ve cepheler', '#4b2d5c'], [1919, 1923, 'Millî Mücadele', '#c8102e'], [1923, 1938, 'Cumhuriyet ve devrimler', '#1f4fa0']];
      const rows = [-Infinity, -Infinity, -Infinity, -Infinity], W = 1760, LW = 250, marks = [];
      for(const k of K){
        const x = kx(NA.decYear(k.tarih)) / 100 * W, L = Math.max(0, Math.min(x - 14, W - LW - 6));
        const r = [0, 2, 1, 3].find(j => rows[j] < L - 8);
        if(r == null) continue;
        rows[r] = L + LW; marks.push({ k, x, r });
      }
      return proc('⏳ Kronoloji · Selanik\'ten Dolmabahçe\'ye (1881–1938)', 'Yıllar diziliyor', `<div class="kr">
        <div class="kr-axis">${ERAS.map(([a, b, n, c], i) => `<span class="kr-era" style="--i:${i};left:${kx(a)}%;width:${kx(b) - kx(a)}%;--c:${c}">${esc(n)}</span>`).join('')}
          ${[1881, 1905, 1915, 1919, 1920, 1921, 1922, 1923, 1928, 1934, 1938].map(y => `<i class="kr-tick" style="left:${kx(y)}%"><b>${y}</b></i>`).join('')}</div>
        ${marks.map(({ k, x, r }, i) => { const L = Math.max(0, Math.min(x - 14, W - LW - 6)); return `<div class="kr-m r${r}" style="--i:${i};left:${L}px;--dx:${x - L}px"><em>${esc(dateLabel(k.tarih, true))}</em><b>${esc(k.b)}</b><span>${esc(k.m)}</span></div>`; }).join('')}
        <div class="kr-mod"><b>🕯️ Sonrası</b>${NA.kronoloji().filter(k => NA.parts(k.tarih).y > 1938).map((k, i) => `<span style="--i:${i}"><em>${esc(dateLabel(k.tarih, true))}</em> ${esc(k.b)}: ${esc(k.m)}</span>`).join('')}</div></div>`, 'kron');
    }
    if(name === 'vecize'){
      const V = NA.metinler().flatMap(m => (m.satirlar || []).filter(s => typeof s !== 'string' && s.o && s.o.length >= 28 && s.o.length < 125 && /[.!?]$/.test(s.o) && !/^[a-zçğıöşü]/.test(s.o)).map(s => ({ o:s.o, m })));
      if(!V.length) return scene('terimler');
      const d = NA.ist(), off = (d.getDate() * 5 + d.getHours()) % V.length;
      const pick = []; for(let i = 0; i < V.length && pick.length < 9; i++){ const v = V[(off + i * 7) % V.length]; if(!pick.includes(v)) pick.push(v); }
      return proc('🗣️ Gazi\'nin Sözleri · Özgün metinlerden', 'Kürsüden', `<div class="as">${pick.map((v, i) => `<blockquote style="--i:${i}">${esc(v.o)}<small>${esc(v.m.eser.split('·')[0].trim())} · ${esc(dateLabel(v.m.tarih, true))}</small></blockquote>`).join('')}</div>`, 'genel');
    }
    if(name === 'terimler'){
      const I = E.terimler || [];
      if(!I.length) return scene('devrimler');
      return proc('📐 Atatürk\'ün Türkçesi · Geometri (1937)', 'Tebeşirler hazır', `<div class="is">${I.slice(0, 10).map((s, i) => `<div class="is-c" style="--i:${i}"><s>${esc(s.eski)}</s><b>${esc(s.yeni)}</b><p>${esc(s.not)}</p></div>`).join('')}</div>`, 'genel');
    }
    if(name === 'devrimler'){
      const D = E.devrimler || [];
      if(!D.length) return scene('gundem');
      return proc('⚖️ Devrimler Panosu · 1922–1935', 'Kanunlar sıralanıyor', `<div class="il">${D.map((s, i) => `<div class="il-r" style="--i:${i}"><span>${esc(s.simge)}</span><b>${esc(s.ad)}</b><em>${esc(dateLabel(s.tarih))}</em></div>`).join('')}</div>`, 'devrim');
    }
    if(name === 'gundem'){
      const N = NA.news().slice(0, 7);
      if(!N.length) return scene('abone');
      return proc('📰 Gündem · Atatürk ve Cumhuriyet tarihi haberleri', 'Ajanslar taranıyor', `<div class="nw">${N.map((n, i) => `<div class="nw-r" style="--i:${i}"><span class="nw-s">${esc(n.source)}</span><b>${esc(n.title)}</b><small>${esc(NA.ago(n.time))}</small></div>`).join('')}</div>`, 'gundem');
    }
    return proc('👍 Beğen · Abone ol · Yorum yaz', 'Yayın sürüyor', `<div class="ab"><div><h4>Nutuk Akışı'na abone ol!</h4>
      <div class="ab-row"><span style="--c:#c8102e;--i:0">👍 Beğen</span><span style="--c:#1f4fa0;--i:1">🔔 Abone ol</span><span style="--c:#0f766e;--i:2">💬 Nutuk'un en güçlü cümlesi sence hangisi?</span></div>
      <p>Nutuk, söylevler, telgraflar ve Gençliğe Hitabe: Gazi'nin sözleri, özgün hâliyle ve bugünün Türkçesiyle, her gün canlı.</p>
      <p class="ab-legal">Atatürk'ün eserleri kamu malıdır. Özgün metin: Vikikaynak · Atatürk'ün Bütün Eserleri · Nutuk (1927).</p></div></div>`, 'genel');
  }
  function setTab(t){ root.querySelectorAll('#mTabs span').forEach(el => el.classList.toggle('on', el.dataset.t === t)); }
  function showScene(name){ clearLines(); stopAudio(); const ix = $m('#mIx'); ix.innerHTML = scene(name); ix.hidden = false; root.classList.add('ix-on'); return SCENE_SECS[curScene] || IX_SECS; }
  function hideScene(){ $m('#mIx').hidden = true; root.classList.remove('ix-on'); setTab('mesaj'); }

  // ───────────── akış ─────────────
  function fill(secs){
    const f = $m('#mContFill');
    f.style.animation = 'none'; void f.offsetWidth;
    f.style.animation = `mFill ${secs}s linear forwards`;
    $m('#mContinue').classList.remove('m-go'); void f.offsetWidth; $m('#mContinue').classList.add('m-go');
  }
  // Sesli okuma: www/ses/<metin-kimliği>.mp3 varsa çalar; süre sesin uzunluğuna göre uzar.
  let audio = null;
  function stopAudio(){ if(audio){ try { audio.pause(); } catch(e){} audio = null; } }
  function play(fromScene){
    stopAudio();
    const x = list[idx];
    const d = fromScene || (x && x.type === 'news') ? revelation(x) : 0;
    renderInbox(); renderMsg(d); renderTicker(); renderCal();
    const secs = x ? msgSecs(x) + d : 10;
    fill(secs); clearTimeout(ixTimer); ixTimer = setTimeout(next, secs * 1000);
    const f = x && sesName(x);
    if(f && NA.ses(f)){
      audio = new Audio('ses/' + encodeURIComponent(f));
      const a = audio, t0 = Date.now();
      a.addEventListener('loadedmetadata', () => {
        const need = d + 1.2 + a.duration + 3, left = need - (Date.now() - t0) / 1000;
        if(a === audio && need > secs){ clearTimeout(ixTimer); ixTimer = setTimeout(next, left * 1000); fill(left); }
      });
      setTimeout(() => { if(a === audio) a.play().catch(() => {}); }, (d + 1.2) * 1000);
    }
  }
  function next(){
    step++;
    const wasScene = root.classList.contains('ix-on');
    if(step % 5 === 0){
      const secs = showScene(SCENES[sceneIdx++ % SCENES.length]);
      fill(secs); clearTimeout(ixTimer); ixTimer = setTimeout(next, secs * 1000);
      return;
    }
    hideScene();
    if(list.length) idx = (idx + 1) % list.length;
    play(wasScene);
  }

  // ───────────── canlı etkileşim (panel + YouTube sohbeti) ─────────────
  let lastName = null, lastCmd = null, pollDone = null;
  const toastQ = []; let toastOn = false;
  function nameToast(){
    const n = toastQ.shift(), el = $m('#mName');
    if(!n){ toastOn = false; el.hidden = true; return; }
    toastOn = true;
    el.innerHTML = `<div class="nt"><small>✍️ Hattat yazdı · eski harflerle</small><b class="osm" dir="rtl" lang="ota">${esc(NA.eskiHarf(n.ad))}</b><em>${esc(n.ad)}</em><span>${esc(NA.morse(n.ad, 8))}</span></div>`;
    el.hidden = false; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
    setTimeout(nameToast, 8000);
  }
  function onCanli(L){
    if(!L) return;
    const names = L.isimler || [];
    const maxId = names.reduce((m, n) => Math.max(m, n.id), 0);
    if(lastName === null) lastName = maxId;
    names.filter(n => n.id > lastName).forEach(n => toastQ.push(n));
    lastName = Math.max(lastName, maxId);
    if(toastQ.length && !toastOn) nameToast();
    const K = L.komut;
    if(lastCmd === null) lastCmd = K ? K.id : 0;
    if(K && K.id > lastCmd){
      lastCmd = K.id;
      if(K.ad === 'sonraki'){ clearTimeout(ixTimer); next(); }
      else if(K.ad === 'alarm' && list[idx]) revelation(list[idx]);
      else if(K.ad.startsWith('sahne:')){ const secs = showScene(K.ad.slice(6)); fill(secs); clearTimeout(ixTimer); ixTimer = setTimeout(next, secs * 1000); }
    }
    const P = L.oylama, w = $m('#mPoll');
    const big = $m('#mPollBig'); if(big && P) big.innerHTML = pollHTML(P);
    if(P && P.kalan > 0){
      w.hidden = false;
      w.innerHTML = `<b>🗳️</b>${P.secenekler.map((id, i) => { const t = NA.metin(id); return `<span>!${i + 1} ${esc(t ? t.baslik.split(':')[0].slice(0, 22) : id)} <em>${P.oy[i]}</em></span>`; }).join('')}<i>${Math.floor(P.kalan / 60)}:${NA.two(Math.floor(P.kalan % 60))}</i>`;
    } else w.hidden = true;
    if(P && P.kazanan != null && P.kalan === 0 && pollDone !== P.id){
      pollDone = P.id;
      const id = P.secenekler[P.kazanan], at = list.findIndex(x => x.type === 'metin' && x.id === id);
      if(at >= 0 && P.oy.some(v => v > 0)){
        const [it] = list.splice(at, 1); if(at <= idx) idx = Math.max(0, idx - 1);
        it.secim = true; list.splice(idx + 1, 0, it);
      }
    }
  }

  let started = false;
  NA.onUpdate(() => {
    onCanli(NA.state.canli);
    rebuild(); renderNote(); renderTicker();
    if(!started && (NA.state.corpus || NA.state.corpusError) && (NA.state.news || NA.state.newsError)){
      started = true;
      renderCal(); renderTicker();
      const forced = qs.get('sahne');
      if(forced){ renderInbox(); renderMsg(); showScene(forced); fill(IX_SECS); return; }
      play(true);
    } else if(started && !root.classList.contains('ix-on')){
      renderInbox();
      if(!$m('.m-article')) play(false);
    }
  });
  setInterval(renderCal, 20000);
  addEventListener('keydown', (e) => {
    if(e.key === 'ArrowRight'){ clearTimeout(ixTimer); next(); }
    if(e.key === 'v' && list[idx]) revelation(list[idx]);
    if(e.key === 'i'){ toastQ.push({ ad:'Emre' }); if(!toastOn) nameToast(); }
  });
})();
