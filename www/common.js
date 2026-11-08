// Nutuk Salonu — ortak veri katmanı (uygulama + yayın görünümü).
// API_BASE: yerelde boş kalır. Telefon uygulamasında barındırılan sunucunun adresi yazılır (bkz. MAGAZA-YOL-HARITASI.md).
window.NA = (function(){
  const qs = new URLSearchParams(location.search);
  function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  const API_BASE = (qs.get('api') || lsGet('na_api') || window.NUTUK_API_BASE || '').replace(/\/$/, '');
  // Telefon uygulaması (App Store / Google Play): sunucu yok, bütün metinler uygulamanın içinde (www/data/corpus.json).
  const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const OFFLINE = NATIVE || qs.get('cevrimdisi') === '1';
  const plugin = (n) => (NATIVE && window.Capacitor.Plugins && window.Capacitor.Plugins[n]) || null;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const DAYS = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
  const DAYS_LONG = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const MONTHS_LONG = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const two = (n) => String(n).padStart(2, '0');
  function ist(t){ const d = t != null ? new Date(t * 1000) : new Date(); return new Date(d.getTime() + (d.getTimezoneOffset() + 180) * 60000); }
  const hm = (t) => { const d = ist(t); return `${two(d.getHours())}:${two(d.getMinutes())}`; };
  function ago(t){
    const s = Date.now() / 1000 - t;
    if(s < 3600) return `${Math.max(1, Math.round(s / 60))} dk önce`;
    if(s < 86400) return `${Math.round(s / 3600)} saat önce`;
    return `${Math.round(s / 86400)} gün önce`;
  }
  const num = (n) => Number(n).toLocaleString('tr-TR');

  // ───────── tarihler: "1919-05-19" · "1919-05" · "1919" ─────────
  function parts(t){ const m = String(t || '').match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/); return m ? { y:+m[1], m:m[2] ? +m[2] : 0, d:m[3] ? +m[3] : 0 } : { y:0, m:0, d:0 }; }
  function dateLabel(t, short){ const p = parts(t); if(!p.m) return String(p.y); const M = short ? MONTHS : MONTHS_LONG; return p.d ? `${p.d} ${M[p.m - 1]} ${p.y}` : `${M[p.m - 1]} ${p.y}`; }
  function decYear(t){ const p = parts(t); return p.y + (p.m ? (p.m - 1) / 12 + (p.d ? (p.d - 1) / 365 : 0) : .5); }
  const mmdd = (t) => { const p = parts(t); return p.m && p.d ? `${two(p.m)}-${two(p.d)}` : ''; };
  const yas = (t) => parts(t).y - 1881;   // Atatürk'ün o yılki yaşı (doğum günü kesin bilinmediği için yıl farkı)
  const yilOnce = (t) => ist().getFullYear() - parts(t).y;

  // Tür → renk + simge (FM2010 mesaj türü rozetleri gibi)
  const KIND = {
    'Nutuk':['#c8102e','🎙️'], 'Hitabe':['#7a1020','🔥'], 'Söylev':['#1f4fa0','📣'], 'Genelge':['#8a5a2b','📜'], 'Telgraf':['#2c6b8f','📡'],
    'Kongre':['#3f7a3a','🏛️'], 'Emir':['#4b2d5c','⚔️'], 'Eser':['#0f766e','📗'], 'Belge':['#5d6b72','✍️'], 'Anma':['#2b2b2b','🕯️'],
    'Gündem':['#c2410c','📰'], 'Bugün ve Gazi':['#0f766e','🗞️'], 'Dizi':['#9b1c1c','📺']
  };
  const kindColor = (k) => (KIND[k] || ['#555'])[0];
  const kindIcon = (k) => (KIND[k] || ['', '📜'])[1];
  const kindChip = (k, cls = 'kind') => `<i class="${cls}" style="--k:${kindColor(k)}">${kindIcon(k)} ${esc(k)}</i>`;
  // Satırın sesi: telgraf/emir/genelge → Mors · söylev → mikrofon dalgası · diğer → daktilo
  const voiceOf = (tur) => ['Telgraf', 'Emir', 'Genelge'].includes(tur) ? 'mors' : ['Nutuk', 'Söylev', 'Hitabe'].includes(tur) ? 'mikrofon' : 'daktilo';

  // ───────── satırlar: düz metin = anlatım · {o, s} = özgün söz + bugünün Türkçesi ─────────
  const line = (x) => typeof x === 'string' ? { o:'', s:'', a:x } : { o:x.o || '', s:x.s && x.s !== x.o ? x.s : '', a:'' };
  const lineText = (x) => { const l = line(x); return l.o || l.a; };
  const originals = (m) => (m.satirlar || []).filter(x => typeof x !== 'string' && x.o).map(x => x.o);

  // ───────── Mors (telgraf) ─────────
  const MORSE = { a:'.-', b:'-...', c:'-.-.', ç:'-.-..', d:'-..', e:'.', f:'..-.', g:'--.', ğ:'--.-.', h:'....', ı:'..', i:'..', j:'.---', k:'-.-', l:'.-..', m:'--', n:'-.', o:'---', ö:'---.', p:'.--.', q:'--.-', r:'.-.', s:'...', ş:'.--..', t:'-', u:'..-', ü:'..--', v:'...-', w:'.--', x:'-..-', y:'-.--', z:'--..', â:'.-', î:'..', û:'..-',
    '0':'-----', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.' };
  function morse(text, maxLetters = 14){
    const out = []; let n = 0;
    for(const w of String(text).toLocaleLowerCase('tr').split(/\s+/)){
      const codes = [...w].map(c => MORSE[c]).filter(Boolean);
      if(!codes.length) continue;
      out.push(codes.slice(0, maxLetters - n).join(' ')); n += codes.length;
      if(n >= maxLetters) break;
    }
    return out.join('  /  ').replace(/\./g, '·').replace(/-/g, '−');
  }
  const wave = (n) => Array.from({ length:n }, () => '▁▂▃▄▅▆▇'[Math.floor(Math.random() * 7)]).join('');

  // ───────── Adını eski harflerle yaz (1928 öncesi yazı; harf harf, yaklaşık) ─────────
  const ESKI = { b:'ب', c:'ج', ç:'چ', d:'د', f:'ف', g:'گ', ğ:'غ', h:'ه', j:'ژ', l:'ل', m:'م', n:'ن', p:'پ', r:'ر', s:'س', ş:'ش', t:'ت', v:'و', y:'ی', z:'ز' };
  function eskiHarf(name){
    const w = (name || '').toLocaleLowerCase('tr').replace(/[^a-zçğıöşüâîû]/g, '');
    const back = /[aıouâû]/.test(w) && !/[eiöü]/.test(w);   // kalın ünlülü kelime: k → ق, aksi hâlde ك
    let out = '';
    [...w].forEach((ch, i) => {
      const first = i === 0, last = i === w.length - 1;
      if(ch === 'a' || ch === 'â') out += first ? 'آ' : 'ا';
      else if(ch === 'e') out += first ? 'ا' : last ? 'ه' : '';
      else if('ıi'.includes(ch) || ch === 'î') out += first ? 'ای' : 'ی';
      else if('ouöüû'.includes(ch)) out += first ? 'او' : 'و';
      else if(ch === 'k') out += back ? 'ق' : 'ك';
      else out += ESKI[ch] || '';
    });
    return out;
  }

  // ───────── veri ─────────
  const state = { corpus:null, news:null, canli:null, listeners:[] };
  async function getJSON(path){
    const r = await fetch(API_BASE + path, { cache:'no-store' });
    if(!r.ok) throw new Error(r.status);
    return r.json();
  }
  function emit(){ state.listeners.forEach(f => { try { f(state); } catch(e){ console.error(e); } }); }
  async function localCorpus(){ const r = await fetch('data/corpus.json', { cache:'no-store' }); if(!r.ok) throw new Error(r.status); return r.json(); }
  async function loadCorpus(){
    const prevBugun = state.corpus && state.corpus.cevrimdisi ? state.corpus.bugun : null;
    try { state.corpus = OFFLINE ? await localCorpus() : await getJSON('/api/corpus'); state.corpusError = false; }
    catch(e){ try { state.corpus = await localCorpus(); state.corpusError = false; } catch(e2){ state.corpusError = true; } }
    if(state.corpus && state.corpus.cevrimdisi){ state.corpus.bugun = prevBugun; loadBugun(); }
    emit();
  }
  async function loadNews(){
    if(OFFLINE){ state.news = { items:[], health:[] }; state.newsError = false; emit(); return; }
    try { state.news = await getJSON('/api/news'); state.newsError = false; } catch(e){ state.news = { items:[], health:[] }; state.newsError = true; } emit();
  }
  // Tarihte bugün (uygulamada): Türkçe Vikipedi'nin günün sayfası doğrudan okunur; internet yoksa yerel kronoloji kullanılır.
  function unwiki(x){ return x.replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, '').replace(/\{\{[^{}]*\}\}/g, '').replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1').replace(/'{2,}/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().replace(/^[-–—:\s]+|[-–—:\s]+$/g, ''); }
  let bugunKey = '';
  async function loadBugun(){
    const n = ist(), key = `${two(n.getMonth() + 1)}-${two(n.getDate())}`;
    if(bugunKey === key && state.corpus && state.corpus.bugun) return;
    bugunKey = key;
    const page = `${n.getDate()} ${MONTHS_LONG[n.getMonth()]}`;
    try {
      const u = 'https://tr.wikipedia.org/w/api.php?' + new URLSearchParams({ action:'parse', page, prop:'wikitext', redirects:'1', format:'json', formatversion:'2', origin:'*' });
      const j = await (await fetch(u)).json(), wt = (j.parse && j.parse.wikitext) || '';
      let sec = ''; const items = [];
      for(const ln of wt.split('\n')){
        const h = ln.match(/^==\s*([^=].*?)\s*==\s*$/); if(h){ sec = h[1].toLocaleLowerCase('tr'); continue; }
        const m = ln.match(/^\*\s*\[?\[?(\d{3,4})\]?\]?\s*[-–—:]\s*(.+)$/); if(!m) continue;
        const y = +m[1], txt = unwiki(m[2]), tur = sec.includes('olay') ? 'olay' : sec.includes('doğum') ? 'dogum' : sec.includes('ölüm') ? 'olum' : '';
        if(!txt || !tur) continue;
        const named = /atatürk|mustafa kemal/i.test(txt);
        if(named || (y >= 1881 && y <= 1953 && tur === 'olay')) items.push({ yil:y, metin:txt.length > 200 ? txt.slice(0, 197) + '…' : txt, tur, ozel:named });
      }
      if(state.corpus) state.corpus.bugun = { gun:key, sayfa:page, url:'https://tr.wikipedia.org/wiki/' + encodeURIComponent(page.replace(/ /g, '_')), items:items.slice(0, 14) };
      emit();
    } catch(e){ bugunKey = ''; }
  }
  async function loadCanli(){ try { state.canli = await getJSON('/api/canli'); state.canliError = false; } catch(e){ state.canliError = true; } emit(); }
  async function post(path, body){
    try { const r = await fetch(API_BASE + path, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body || {}) }); return await r.json(); }
    catch(e){ return { ok:false, hata:'sunucuya ulaşılamadı' }; }
  }
  function start(opts = {}){
    loadCorpus(); loadNews(); setInterval(loadCorpus, 60000); setInterval(loadNews, 300000);
    if(opts.canli || qs.get('yayin') === '1'){ loadCanli(); setInterval(loadCanli, 3000); }
  }
  const onUpdate = (f) => state.listeners.push(f);

  const C = () => state.corpus;
  const metinler = () => (C() && C().metinler) || [];
  const metin = (id) => metinler().find(m => m.id === id);
  const kadro = () => (C() && C().kadro) || [];
  const ekler = () => (C() && C().ekler) || {};
  const news = () => (state.news && state.news.items) || [];
  const esle = () => (C() && C().esle) || [];
  const sayfa = () => (C() && C().sayfa) || [];
  const dogrumu = () => (C() && C().dogrumu) || [];
  const ses = (f) => !!(C() && (C().ses || []).includes(f));
  const kronoloji = () => [...(ekler().kronoloji || [])].sort((a, b) => decYear(a.tarih) - decYear(b.tarih));

  // Günün metni: tarihe göre sabit
  function daily(){ const T = metinler(); if(!T.length) return null; const d = ist(); const k = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(); return T[k % T.length]; }
  // Nutuk dizisi: her gün bir bölüm (bolum alanı olan metinler, sırayla)
  const dizi = () => metinler().filter(m => m.bolum).sort((a, b) => a.bolum - b.bolum);
  function diziBugun(){ const D = dizi(); if(!D.length) return null; const d0 = Date.parse('2026-10-08T00:00:00+03:00') / 1000; const k = Math.floor((Date.now() / 1000 - d0) / 86400); return D[((k % D.length) + D.length) % D.length]; }
  // Tarihte bugün: sunucunun Wikipedia listesi + yerel kronolojide aynı gün
  function tarihteBugun(){
    const n = ist(), key = `${two(n.getMonth() + 1)}-${two(n.getDate())}`;
    const yerel = kronoloji().filter(k => mmdd(k.tarih) === key).map(k => ({ yil:parts(k.tarih).y, metin:`${k.b}: ${k.m}`, tur:'olay', ozel:true, yerel:true }));
    const B = C() && C().bugun;
    const wiki = B && B.gun === key ? (B.items || []) : [];
    const seen = new Set(yerel.map(x => x.yil));
    const all = [...yerel, ...wiki.filter(x => !(x.ozel && seen.has(x.yil)))].sort((a, b) => (b.ozel - a.ozel) || (a.yil - b.yil));
    let yakin = [];
    if(!yerel.length){ const doy = (t) => { const p = parts(t); return p.m && p.d ? (p.m - 1) * 31 + p.d : -1; }; const today = n.getMonth() * 31 + n.getDate();
      yakin = kronoloji().filter(k => doy(k.tarih) >= today).sort((a, b) => doy(a.tarih) - doy(b.tarih)).slice(0, 3); }
    return { key, gun:`${n.getDate()} ${MONTHS_LONG[n.getMonth()]}`, items:all, yakin, url:B && B.gun === key ? B.url : '' };
  }
  // Sıradaki millî gün ve Cumhuriyet'in kaçıncı yılında olduğumuz
  function siradakiGun(){
    const n = ist(), G = ekler().milligunler || [], today = new Date(n.getFullYear(), n.getMonth(), n.getDate()); let best = null;
    for(const g of G){ let d = new Date(n.getFullYear(), g.ay - 1, g.gun); if(d < today) d = new Date(n.getFullYear() + 1, g.ay - 1, g.gun);
      const gun = Math.round((d - today) / 86400000); if(!best || gun < best.gun) best = { ...g, gun }; }
    return best;
  }
  function cumhuriyetYili(){ const n = ist(), y = n.getFullYear(), done = (n.getMonth() > 9 || (n.getMonth() === 9 && n.getDate() >= 29)) ? y - 1923 : y - 1924; return done + 1; }

  return { API_BASE, NATIVE, OFFLINE, plugin, qs, esc, two, ist, hm, ago, num, DAYS, DAYS_LONG, MONTHS, MONTHS_LONG, parts, dateLabel, decYear, mmdd, yas, yilOnce,
           KIND, kindColor, kindIcon, kindChip, voiceOf, line, lineText, originals, morse, wave, eskiHarf,
           state, start, onUpdate, loadCorpus, loadNews, loadCanli, post, metinler, metin, kadro, ekler, news, esle, sayfa, dogrumu, ses, kronoloji,
           daily, dizi, diziBugun, tarihteBugun, siradakiGun, cumhuriyetYili };
})();
