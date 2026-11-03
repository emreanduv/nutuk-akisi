// Nutuk Salonu — 1927 Meclis salonu, WebXR (Quest, Vision Pro, Android XR) + masaüstü/telefon. Bir Mr. Anduv! yapımıdır.
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

const $ = (s) => document.querySelector(s);
const AY = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const tarihYaz = (t) => { const [y, m, d] = String(t).split('-').map(Number); return d ? `${d} ${AY[m - 1]} ${y}` : m ? `${AY[m - 1]} ${y}` : String(y); };
const RENK = { ink:'#1c2a44', deep:'#101c33', red:'#c8102e', gold:'#e0b04a', paper:'#fbf7ef', paper2:'#f1eadc', teal:'#0f766e', navy:'#132545', navy2:'#162b52', muted:'#6b7280' };

// ── salon ölçüleri (metre): kürsü -z yönünde ──
const W = 14, D = 22, H = 7.2, ZON = -D / 2, ZARKA = D / 2;
const PODYUM_Z = ZON + 2.6, MASA_Z = -5.3, MASA_Y = 0.92;

let V = null; // veri
const durum = { mi:0, si:-1, oto:false, sonraki:0, secili:-1 };

// ── yardımcılar: tuval dokuları ──
function tuval(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function sar(ctx, metin, genislik){
  const kel = String(metin).split(/\s+/), sat = []; let cur = '';
  for(const k of kel){ const t = cur ? cur + ' ' + k : k; if(ctx.measureText(t).width > genislik && cur){ sat.push(cur); cur = k; } else cur = t; }
  if(cur) sat.push(cur); return sat;
}
function yuvarlak(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function doku(c, tekrar){ const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if(tekrar){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...tekrar); } return t; }

function tahta(w = 512, h = 512, ton = [92, 56, 30]){
  const [c, x] = tuval(w, h);
  for(let i = 0; i < 8; i++){
    const y = i * h / 8, k = 0.85 + Math.random() * 0.3;
    x.fillStyle = `rgb(${ton[0] * k | 0},${ton[1] * k | 0},${ton[2] * k | 0})`; x.fillRect(0, y, w, h / 8);
    x.strokeStyle = '#0000004d'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke();
    for(let j = 0; j < 14; j++){ x.strokeStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.06})`; x.lineWidth = 1; x.beginPath(); const yy = y + Math.random() * h / 8; x.moveTo(0, yy); x.bezierCurveTo(w * .3, yy + 4, w * .6, yy - 4, w, yy + 2); x.stroke(); }
    const ek = Math.random() * w; x.fillStyle = '#00000040'; x.fillRect(ek, y, 2, h / 8);
  }
  return c;
}
function duvarDokusu(){
  const [c, x] = tuval(512, 1024), lb = 1024 * (1.35 / H);
  x.fillStyle = '#efe4cc'; x.fillRect(0, 0, 512, 1024);
  for(let i = 0; i < 2600; i++){ x.fillStyle = `rgba(120,90,50,${Math.random() * 0.05})`; x.fillRect(Math.random() * 512, Math.random() * 1024, 2, 2); }
  x.fillStyle = '#e2d3b2'; x.fillRect(0, 0, 512, 54); x.fillStyle = '#c9b48a'; x.fillRect(0, 54, 512, 8);           // korniş
  const t = tahta(512, 256, [86, 50, 26]); x.drawImage(t, 0, 1024 - lb, 512, lb);                                       // ahşap lambri
  x.fillStyle = '#3b210f'; x.fillRect(0, 1024 - lb - 10, 512, 12);
  x.strokeStyle = '#00000055'; x.lineWidth = 4; for(let i = 0; i < 2; i++){ x.strokeRect(24 + i * 256, 1024 - lb + 22, 208, lb - 44); }
  return c;
}
function bayrak(dikey){
  // Türk bayrağı oranları (G = yükseklik): ay dış daire merkezi 0.53125G r 0.25G, iç daire 0.59375G r 0.2G, yıldız merkezi 0.8542G r 0.125G
  const G = 512, L = 768, [c, x] = tuval(dikey ? G : L, dikey ? L : G);
  x.save(); if(dikey){ x.translate(G, 0); x.rotate(Math.PI / 2); }
  x.fillStyle = '#e30a17'; x.fillRect(0, 0, L, G);
  x.fillStyle = '#fff'; x.beginPath(); x.arc(0.53125 * G, G / 2, 0.25 * G, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#e30a17'; x.beginPath(); x.arc(0.59375 * G, G / 2, 0.2 * G, 0, Math.PI * 2); x.fill();
  const cx = 0.8542 * G, cy = G / 2, R = 0.125 * G; x.fillStyle = '#fff'; x.beginPath();
  for(let i = 0; i < 10; i++){ const r = i % 2 ? R * 0.382 : R, a = Math.PI + i * Math.PI / 5; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  x.closePath(); x.fill(); x.restore();
  return c;
}

// ── kürsü perdesi (FM2010 kartı) ──
const [perdeC, perdeX] = tuval(2048, 1152); let perdeT;
function perdeCiz(){
  const x = perdeX, Wc = 2048, Hc = 1152, M = V.metinler[durum.mi], S = M.satirlar, s = durum.si >= 0 ? S[durum.si] : null;
  x.clearRect(0, 0, Wc, Hc);
  yuvarlak(x, 8, 8, Wc - 16, Hc - 16, 44); x.fillStyle = RENK.paper; x.fill();
  x.save(); yuvarlak(x, 8, 8, Wc - 16, Hc - 16, 44); x.clip();
  for(let i = 0; i < Wc; i += 120){ x.fillStyle = i / 120 % 2 ? RENK.navy2 : RENK.navy; x.fillRect(i, 8, 120, 150); }
  const g = x.createRadialGradient(360, -60, 10, 360, -60, 700); g.addColorStop(0, '#4a6fb8cc'); g.addColorStop(1, '#4a6fb800'); x.fillStyle = g; x.fillRect(0, 8, Wc, 150);
  x.fillStyle = RENK.red; x.fillRect(0, 158, Wc, 10); x.fillRect(8, 168, 16, Hc);
  x.restore();
  x.fillStyle = '#f2c870'; x.font = "900 54px 'DM Sans'"; x.fillText(`NUTUK · ${M.bolum}. BÖLÜM`, 70, 100);
  x.fillStyle = '#d3def3'; x.font = "700 40px 'DM Sans'"; x.textAlign = 'right'; x.fillText(`${tarihYaz(M.tarih)} · ${M.yer.split('·')[0].trim()}`, Wc - 70, 100); x.textAlign = 'left';
  const L = 90, GEN = Wc - 2 * L - 40;
  if(!s){ // başlık kartı
    x.fillStyle = RENK.deep; x.font = "900 96px 'DM Sans'"; let y = 330;
    for(const l of sar(x, `${M.simge} ${M.baslik}`, GEN).slice(0, 3)){ x.fillText(l, L, y); y += 112; }
    x.fillStyle = '#3c4a5e'; x.font = "500 54px 'DM Sans'"; y += 20;
    for(const l of sar(x, M.ne, GEN).slice(0, 4)){ x.fillText(l, L, y); y += 70; }
    x.fillStyle = RENK.teal; x.font = "800 44px 'DM Sans'"; x.fillText(`${S.length} satır · başlamak için ▶`, L, Hc - 150);
  } else if(s.o){ // özgün söz + bugünün Türkçesi
    x.fillStyle = '#5a6476'; x.font = "800 40px 'DM Sans'"; x.fillText(M.baslik, L, 240);
    x.fillStyle = RENK.red; x.font = "900 180px Georgia,serif"; x.fillText('“', L - 20, 420);
    let boy = 100, O; do { x.font = `900 ${boy}px 'DM Sans'`; O = sar(x, s.o, GEN - 70); boy -= 6; } while(O.length * boy * 1.18 > 470 && boy > 44);
    boy += 6; x.fillStyle = '#1a1a2e'; let y = 300 + boy; for(const l of O){ x.fillText(l, L + 70, y); y += boy * 1.18; }
    if(s.s){ x.font = `italic 600 ${Math.max(38, boy * 0.62) | 0}px 'DM Sans'`; x.fillStyle = RENK.teal; y += 24; const SS = sar(x, '≈ ' + s.s, GEN - 70); for(const l of SS.slice(0, 4)){ x.fillText(l, L + 70, y); y += Math.max(38, boy * 0.62) * 1.25; } }
  } else { // anlatım
    x.fillStyle = '#5a6476'; x.font = "800 40px 'DM Sans'"; x.fillText(M.baslik + ' · anlatım', L, 240);
    let boy = 86, A; do { x.font = `600 ${boy}px 'DM Sans'`; A = sar(x, s.a, GEN); boy -= 4; } while(A.length * boy * 1.3 > 620 && boy > 40);
    boy += 4; x.fillStyle = '#3c4a5e'; let y = 330 + boy * 0.4; for(const l of A){ x.fillText(l, L, y); y += boy * 1.3; }
  }
  // alt şerit: ilerleme
  const toplam = V.metinler.reduce((a, m) => a + m.satirlar.length + 1, 0), once = V.metinler.slice(0, durum.mi).reduce((a, m) => a + m.satirlar.length + 1, 0) + durum.si + 1;
  x.fillStyle = '#0000001a'; yuvarlak(x, L, Hc - 92, 900, 22, 11); x.fill();
  const gr = x.createLinearGradient(L, 0, L + 900, 0); gr.addColorStop(0, RENK.red); gr.addColorStop(1, RENK.gold); x.fillStyle = gr; yuvarlak(x, L, Hc - 92, Math.max(22, 900 * once / toplam), 22, 11); x.fill();
  x.fillStyle = RENK.muted; x.font = "800 36px 'DM Sans'"; x.fillText(durum.si < 0 ? 'başlık' : `satır ${durum.si + 1}/${S.length}`, L + 930, Hc - 72);
  x.textAlign = 'right'; x.fillText('▶ tetik · ◀ kavrama', Wc - 70, Hc - 72); x.textAlign = 'left';
  perdeT.needsUpdate = true;
  $('#bolum').value = String(durum.mi);
  $('#alt').textContent = `${M.bolum}. bölüm · ${M.baslik}`;
}
function git(adim){
  if(!V) return; // veri henüz gelmediyse (VR erken açıldıysa) tetik boşa düşsün, hata atmasın
  const M = V.metinler[durum.mi];
  durum.si += adim;
  if(durum.si >= M.satirlar.length){ if(durum.mi < V.metinler.length - 1){ durum.mi++; durum.si = -1; } else durum.si = M.satirlar.length - 1; }
  if(durum.si < -1){ if(durum.mi > 0){ durum.mi--; durum.si = V.metinler[durum.mi].satirlar.length - 1; } else durum.si = -1; }
  durum.sonraki = performance.now() + sure(); perdeCiz(); vurguDurak();
}
function bolumAc(i){ durum.mi = i; durum.si = -1; durum.sonraki = performance.now() + sure(); perdeCiz(); vurguDurak(); }
function sure(){ const M = V.metinler[durum.mi], s = durum.si >= 0 ? M.satirlar[durum.si] : null; const n = s ? (s.o || '').length + (s.s || '').length + (s.a || '').length : 120; return Math.max(6000, n * 70); }

// ── duvar panoları (FM2010) ──
function panoCiz(c, x, baslik, simge, satirlar){
  const Wc = c.width, Hc = c.height; x.clearRect(0, 0, Wc, Hc);
  yuvarlak(x, 6, 6, Wc - 12, Hc - 12, 28); x.fillStyle = '#0f1b31'; x.fill(); x.strokeStyle = '#e0b04a'; x.lineWidth = 6; x.stroke();
  x.fillStyle = RENK.red; x.fillRect(6, 92, Wc - 12, 8);
  x.fillStyle = '#f2c870'; x.font = "900 54px 'DM Sans'"; x.fillText(`${simge} ${baslik}`, 40, 70);
  let y = 160;
  for(const [a, b] of satirlar){
    if(y > Hc - 40) break;
    x.fillStyle = '#e0b04a'; x.font = "800 40px 'Barlow Condensed', 'DM Sans'"; x.fillText(a, 40, y);
    x.fillStyle = '#e8eefb'; x.font = "500 34px 'DM Sans'"; const L = sar(x, b, Wc - 260).slice(0, 2);
    L.forEach((l, i) => x.fillText(l, 210, y + i * 42)); y += Math.max(1, L.length) * 42 + 26;
  }
}

// ── sahne ──
const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor');
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#1a140c'); scene.fog = new THREE.Fog('#2a2014', 14, 34);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 80);
const rig = new THREE.Group(); rig.add(camera); scene.add(rig);
const BAS = new THREE.Vector3(0, 0, -1.4); rig.position.copy(BAS); camera.position.set(0, 1.25, 0);
const tiklanir = []; // ışınla seçilebilen nesneler

function kur(){
  // ışık
  scene.add(new THREE.HemisphereLight('#fff1d6', '#3a2412', 0.75));
  const gunes = new THREE.DirectionalLight('#ffe2b0', 1.4); gunes.position.set(8, 9, 2); scene.add(gunes);
  const avize = [new THREE.PointLight('#ffcf8a', 14, 14, 1.6), new THREE.PointLight('#ffcf8a', 12, 14, 1.6)];
  avize[0].position.set(0, 5.6, -5); avize[1].position.set(0, 5.6, 4); avize.forEach(l => scene.add(l));
  const spot = new THREE.SpotLight('#fff3dc', 40, 16, 0.42, 0.6, 1.4); spot.position.set(0, 6.8, -3.5); spot.target.position.set(0, 1, PODYUM_Z + 0.9); scene.add(spot, spot.target);

  // zemin, duvarlar, tavan
  const zeminMat = new THREE.MeshStandardMaterial({ map:doku(tahta(), [5, 8]), roughness:.7 });
  const zemin = new THREE.Mesh(new THREE.PlaneGeometry(W, D), zeminMat); zemin.rotation.x = -Math.PI / 2; zemin.name = 'zemin'; scene.add(zemin); tiklanir.push(zemin);
  const duvarT = doku(duvarDokusu()); const dmat = (r) => { const t = duvarT.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(r, 1); t.needsUpdate = true; return new THREE.MeshStandardMaterial({ map:t, roughness:.95 }); };
  const yan = (x, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(D, H), dmat(D / 3.5)); m.position.set(x, H / 2, 0); m.rotation.y = ry; scene.add(m); };
  yan(-W / 2, Math.PI / 2); yan(W / 2, -Math.PI / 2);
  const on = new THREE.Mesh(new THREE.PlaneGeometry(W, H), dmat(W / 3.5)); on.position.set(0, H / 2, ZON); scene.add(on);
  const arka = new THREE.Mesh(new THREE.PlaneGeometry(W, H), dmat(W / 3.5)); arka.position.set(0, H / 2, ZARKA); arka.rotation.y = Math.PI; scene.add(arka);
  const tavan = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color:'#d9c9a6', roughness:1 })); tavan.position.y = H; tavan.rotation.x = Math.PI / 2; scene.add(tavan);
  const kiris = new THREE.MeshStandardMaterial({ color:'#5a3a1e', roughness:.8 });
  for(let z = ZON + 1.5; z < ZARKA; z += 3){ const k = new THREE.Mesh(new THREE.BoxGeometry(W, 0.32, 0.26), kiris); k.position.set(0, H - 0.16, z); scene.add(k); }

  // pencereler + ışık huzmeleri
  const camMat = new THREE.MeshBasicMaterial({ color:'#fff4d8' }), kasa = new THREE.MeshStandardMaterial({ color:'#4a2d16' });
  const pSekil = new THREE.Shape(); pSekil.moveTo(-0.7, 0); pSekil.lineTo(0.7, 0); pSekil.lineTo(0.7, 2.4); pSekil.absarc(0, 2.4, 0.7, 0, Math.PI, false); pSekil.lineTo(-0.7, 0);
  const pGeo = new THREE.ShapeGeometry(pSekil, 16);
  const [hc, hx] = tuval(64, 256); const hg = hx.createLinearGradient(0, 0, 0, 256); hg.addColorStop(0, 'rgba(255,236,190,.55)'); hg.addColorStop(1, 'rgba(255,236,190,0)'); hx.fillStyle = hg; hx.fillRect(0, 0, 64, 256);
  const huzmeMat = new THREE.MeshBasicMaterial({ map:doku(hc), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, opacity:.22 });
  for(const sx of [-1, 1]) for(let i = 0; i < 6; i++){
    if(i === 2) continue; // bu aralıkta duvar panoları var
    const z = ZON + 3 + i * 3.2, p = new THREE.Mesh(pGeo, camMat); p.position.set(sx * (W / 2 - 0.02), 2.2, z); p.rotation.y = -sx * Math.PI / 2; scene.add(p);
    const dikme = new THREE.Mesh(new THREE.BoxGeometry(0.05, 3.1, 0.06), kasa); dikme.position.set(sx * (W / 2 - 0.05), 3.75, z); scene.add(dikme);
    const yatay = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 1.4), kasa); yatay.position.set(sx * (W / 2 - 0.05), 3.4, z); scene.add(yatay);
    if(sx > 0){ const h = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 7), huzmeMat); h.position.set(W / 2 - 2.6, 2.4, z - 0.4); h.rotation.set(0, Math.PI / 2, -0.62); scene.add(h); }
  }

  // avizeler
  const pirinc = new THREE.MeshStandardMaterial({ color:'#c9a24a', metalness:.8, roughness:.35 }), ampul = new THREE.MeshBasicMaterial({ color:'#ffe0a0' });
  for(const z of [-5, 4]){
    const g = new THREE.Group(); g.position.set(0, 5.6, z);
    const zincir = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, H - 5.6), pirinc); zincir.position.y = (H - 5.6) / 2; g.add(zincir);
    const halka = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 8, 32), pirinc); halka.rotation.x = Math.PI / 2; g.add(halka);
    for(let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2, b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), ampul); b.position.set(Math.cos(a) * 0.7, 0.1, Math.sin(a) * 0.7); g.add(b); }
    scene.add(g);
  }

  // podyum, riyaset kürsüsü, hatip kürsüsü
  const ahsap = new THREE.MeshStandardMaterial({ map:doku(tahta(512, 512, [78, 44, 22]), [2, 1]), roughness:.6 });
  const pod = new THREE.Mesh(new THREE.BoxGeometry(10, 0.6, 3.4), ahsap); pod.position.set(0, 0.3, ZON + 1.7); scene.add(pod);
  const ust = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 0.9), ahsap); ust.position.set(0, 0.6 + 0.55 + 0.35, ZON + 0.9); scene.add(ust);
  const ustP = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 1.4), ahsap); ustP.position.set(0, 0.6 + 0.175, ZON + 0.9); scene.add(ustP);
  const hatip = new THREE.Group(); hatip.position.set(0, 0.6, PODYUM_Z + 0.4);
  const govde = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.15, 0.6), ahsap); govde.position.y = 0.575; hatip.add(govde);
  const kapak = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.72), ahsap); kapak.position.set(0, 1.18, 0.02); kapak.rotation.x = 0.18; hatip.add(kapak);
  const [kc, kx] = tuval(512, 512); kx.drawImage(tahta(512, 512, [70, 40, 20]), 0, 0); kx.strokeStyle = '#e0b04a'; kx.lineWidth = 10; kx.strokeRect(60, 60, 392, 392);
  kx.drawImage(bayrak(false), 136, 190, 240, 160);
  const on1 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshStandardMaterial({ map:doku(kc) })); on1.position.set(0, 0.58, 0.301); hatip.add(on1);
  scene.add(hatip);
  // boş kürsünün üstünde ince bir ışık konisi
  const koni = new THREE.Mesh(new THREE.ConeGeometry(1.1, 5.6, 32, 1, true), new THREE.MeshBasicMaterial({ color:'#fff1cc', transparent:true, opacity:.035, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide }));
  koni.position.set(0, 0.6 + 2.8, PODYUM_Z + 0.4); scene.add(koni);

  // bayraklar ve pano (ön duvar)
  const bmat = new THREE.MeshStandardMaterial({ map:doku(bayrak(true)), roughness:.85, side:THREE.DoubleSide });
  for(const sx of [-1, 1]){ const b = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.25, 8, 8), bmat); b.position.set(sx * 5.4, 4.2, ZON + 0.05);
    const pos = b.geometry.attributes.position; for(let i = 0; i < pos.count; i++){ pos.setZ(i, Math.sin(pos.getY(i) * 3 + pos.getX(i)) * 0.04); } pos.needsUpdate = true; b.geometry.computeVertexNormals(); scene.add(b);
    const direk = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8), pirinc); direk.rotation.z = Math.PI / 2; direk.position.set(sx * 5.4, 5.35, ZON + 0.08); scene.add(direk); }
  const [lc, lx] = tuval(2048, 160); lx.fillStyle = '#7a0a1c'; lx.fillRect(0, 0, 2048, 160); lx.strokeStyle = '#e0b04a'; lx.lineWidth = 8; lx.strokeRect(10, 10, 2028, 140);
  lx.fillStyle = '#f2c870'; lx.font = "900 78px 'DM Sans'"; lx.textAlign = 'center'; lx.fillText('HÂKİMİYET BİLÂKAYDÜŞART MİLLETİNDİR', 1024, 108);
  const levha = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 0.56), new THREE.MeshStandardMaterial({ map:doku(lc), roughness:.6 })); levha.position.set(0, 6.45, ZON + 0.04); scene.add(levha);

  // kürsü perdesi
  perdeT = doku(perdeC);
  const perde = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.6), new THREE.MeshBasicMaterial({ map:perdeT, transparent:true, toneMapped:false }));
  perde.position.set(0, 4.1, ZON + 0.6); perde.name = 'perde'; scene.add(perde); tiklanir.push(perde);
  // perdenin altında üç düğme
  const dug = (simge, ad, x) => { const [c, cx] = tuval(256, 256); yuvarlak(cx, 8, 8, 240, 240, 40); cx.fillStyle = '#f1eadc'; cx.fill(); cx.strokeStyle = '#c8102e'; cx.lineWidth = 10; cx.stroke(); cx.fillStyle = RENK.ink; cx.font = "900 120px 'DM Sans'"; cx.textAlign = 'center'; cx.fillText(simge, 128, 168);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map:doku(c), transparent:true, toneMapped:false })); m.position.set(x, 2.02, ZON + 0.62); m.name = ad; scene.add(m); tiklanir.push(m); return m; };
  dug('◀', 'geri', -0.6); dug('▶', 'ileri', 0.6); otoDug = dug('⏵', 'oto', 0);

  // sıralar (instanced)
  const sMat = new THREE.MeshStandardMaterial({ map:doku(tahta(256, 256, [96, 58, 30]), [3, 1]), roughness:.65 });
  const satirlar = []; for(let z = -3.4; z <= 8.6; z += 1.35) for(const sx of [-1, 1]) satirlar.push([sx * 3.6, z]);
  const parca = [[new THREE.BoxGeometry(4.9, 0.06, 0.5), 0.8, -0.05], [new THREE.BoxGeometry(4.9, 0.74, 0.05), 0.4, -0.28], [new THREE.BoxGeometry(4.9, 0.06, 0.4), 0.46, 0.42], [new THREE.BoxGeometry(4.9, 0.5, 0.05), 0.7, 0.63]];
  const mt = new THREE.Matrix4();
  for(const [geo, y, dz] of parca){ const im = new THREE.InstancedMesh(geo, sMat, satirlar.length); satirlar.forEach(([x, z], i) => { mt.makeTranslation(x, y, z + dz); im.setMatrixAt(i, mt); }); scene.add(im); }

  // duvar panoları
  const [kc1, kx1] = tuval(1024, 1024); const kronoT = doku(kc1);
  const krono = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map:kronoT, toneMapped:false })); krono.position.set(-W / 2 + 0.03, 3.0, ZON + 3 + 2 * 3.2); krono.rotation.y = Math.PI / 2; scene.add(krono);
  const [bc1, bx1] = tuval(1024, 1024); const bilT = doku(bc1);
  const bil = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map:bilT, toneMapped:false })); bil.position.set(W / 2 - 0.03, 3.0, ZON + 3 + 2 * 3.2); bil.rotation.y = -Math.PI / 2; scene.add(bil);
  let kb = 0; const panolar = () => {
    const K = V.kronoloji, n = 6, s = K.slice(kb % K.length, kb % K.length + n); while(s.length < n) s.push(K[s.length - n + K.length]);
    panoCiz(kc1, kx1, 'KRONOLOJİ', '⏳', s.map(k => [String(k.tarih).slice(0, 4), `${k.b}: ${k.m}`])); kronoT.needsUpdate = true;
    const B = V.biliyormu; panoCiz(bc1, bx1, 'BİLİYOR MUYDUN?', '💡', [0, 1, 2].map(i => ['•', B[(kb + i) % B.length]])); bilT.needsUpdate = true; kb += 1;
  };
  panolar(); setInterval(panolar, 7000);
  // giriş levhası
  const [mc, mx] = tuval(1024, 256); yuvarlak(mx, 6, 6, 1012, 244, 30); mx.fillStyle = '#0f1b31'; mx.fill(); mx.strokeStyle = '#e0b04a'; mx.lineWidth = 6; mx.stroke();
  mx.fillStyle = '#f2c870'; mx.font = "900 64px 'DM Sans'"; mx.textAlign = 'center'; mx.fillText('Nutuk Salonu', 512, 110); mx.fillStyle = '#d3def3'; mx.font = "700 44px 'DM Sans'"; mx.fillText('Bir Mr. Anduv! yapımıdır.', 512, 190);
  const giris = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map:doku(mc), toneMapped:false })); giris.position.set(0, 3.4, ZARKA - 0.04); giris.rotation.y = Math.PI; scene.add(giris);

  haritaMasasi();
  tozlar();
}

// ── Kurtuluş Yolu masası: FM2010 taktik tahtası üstünde Anadolu ──
let otoDug, iz, isaretci, tozP; const iğneler = [];
const K = 0.165, LON0 = 35.2, LAT0 = 39.0, CL = Math.cos(39 * Math.PI / 180);
const harX = (lon) => (lon - LON0) * K * CL * 1.25, harZ = (lat) => -(lat - LAT0) * K;
function haritaMasasi(){
  const g = new THREE.Group(); g.position.set(0, 0, MASA_Z); scene.add(g);
  const ayak = new THREE.MeshStandardMaterial({ color:'#3b210f', roughness:.7 });
  const etek = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.16, 1.6), ayak); etek.position.y = MASA_Y - 0.14; g.add(etek);
  for(const [lx, lz] of [[-1.6, -0.7], [1.6, -0.7], [-1.6, 0.7], [1.6, 0.7]]){ const a = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, MASA_Y - 0.06, 10), ayak); a.position.set(lx, (MASA_Y - 0.06) / 2, lz); g.add(a); }
  const [tc, tx] = tuval(1024, 512);
  tx.fillStyle = '#16345e'; tx.fillRect(0, 0, 1024, 512);
  for(let i = 0; i < 1024; i += 64){ tx.fillStyle = i / 64 % 2 ? '#183a68' : '#16345e'; tx.fillRect(i, 0, 64, 512); }
  tx.strokeStyle = '#ffffff30'; tx.lineWidth = 3; tx.strokeRect(24, 24, 976, 464); tx.beginPath(); tx.moveTo(512, 24); tx.lineTo(512, 488); tx.stroke(); tx.beginPath(); tx.arc(512, 256, 70, 0, Math.PI * 2); tx.stroke();
  tx.fillStyle = '#e0b04a'; tx.font = "900 30px 'DM Sans'"; tx.fillText('KURTULUŞ YOLU · 1919–1922', 44, 470);
  tx.fillStyle = '#d3def3'; tx.font = "700 24px 'DM Sans'"; tx.textAlign = 'right'; tx.fillText('Bir Mr. Anduv! yapımıdır.', 980, 470);
  const ust = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.06, 1.8), [ayak, ayak, new THREE.MeshStandardMaterial({ map:doku(tc), roughness:.8 }), ayak, ayak, ayak]); ust.position.y = MASA_Y - 0.03; g.add(ust);
  const kara = new THREE.MeshStandardMaterial({ color:'#efe2bf', roughness:.9 }), kenar = new THREE.MeshStandardMaterial({ color:'#c8102e', roughness:.6 });
  for(const ad of Object.keys(V.sinir)){
    const P = V.sinir[ad], sh = new THREE.Shape(P.map(([lon, lat]) => new THREE.Vector2(harX(lon), -harZ(lat))));
    const geo = new THREE.ExtrudeGeometry(sh, { depth:0.035, bevelEnabled:false }); geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, [kara, kenar]); m.position.y = MASA_Y; g.add(m);
  }
  const yuk = MASA_Y + 0.05;
  const noktalar = V.harita.map(h => new THREE.Vector3(harX(h.lon), yuk, harZ(h.lat)));
  iz = new THREE.CatmullRomCurve3(noktalar, false, 'centripetal');
  g.add(new THREE.Mesh(new THREE.TubeGeometry(iz, 200, 0.008, 6, false), new THREE.MeshBasicMaterial({ color:'#c8102e' })));
  const altin = new THREE.MeshStandardMaterial({ color:'#e0b04a', metalness:.6, roughness:.35, emissive:'#3a2a00' });
  V.harita.forEach((h, i) => {
    const p = noktalar[i], ig = new THREE.Group(); ig.position.copy(p);
    const sap = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.12), altin); sap.position.y = 0.06; ig.add(sap);
    const bas = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), altin.clone()); bas.position.y = 0.13; bas.name = 'igne'; bas.userData.i = i; ig.add(bas); tiklanir.push(bas);
    const vur = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false })); vur.position.y = 0.13; vur.name = 'igne'; vur.userData.i = i; ig.add(vur); tiklanir.push(vur); // kolay nişan
    const [ec, ex] = tuval(512, 128); yuvarlak(ex, 4, 4, 504, 120, 24); ex.fillStyle = '#0f1b31e6'; ex.fill(); ex.fillStyle = '#f2c870'; ex.font = "900 50px 'DM Sans'"; ex.fillText(h.ad, 24, 58); ex.fillStyle = '#d3def3'; ex.font = "700 32px 'DM Sans'"; ex.fillText(tarihYaz(h.tarih), 24, 104);
    const et = new THREE.Sprite(new THREE.SpriteMaterial({ map:doku(ec), depthTest:true, toneMapped:false })); et.scale.set(0.3, 0.075, 1); et.position.y = 0.23; ig.add(et);
    g.add(ig); iğneler.push({ h, bas, et });
  });
  isaretci = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), new THREE.MeshBasicMaterial({ color:'#fff1a8' })); g.add(isaretci);
}
function vurguDurak(){
  const id = V.metinler[durum.mi].id;
  iğneler.forEach(({ h, bas }, i) => { const on = h.metin === id; bas.material.emissive.set(on ? '#c8102e' : '#3a2a00'); bas.scale.setScalar(on ? 1.6 : 1); });
}
function tozlar(){
  const n = 400, pos = new Float32Array(n * 3); for(let i = 0; i < n; i++){ pos[i * 3] = (Math.random() - .5) * W; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = (Math.random() - .5) * D; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const [pc, px] = tuval(32, 32); const pg = px.createRadialGradient(16, 16, 0, 16, 16, 16); pg.addColorStop(0, 'rgba(255,255,255,1)'); pg.addColorStop(1, 'rgba(255,255,255,0)'); px.fillStyle = pg; px.fillRect(0, 0, 32, 32);
  tozP = new THREE.Points(geo, new THREE.PointsMaterial({ map:doku(pc), color:'#ffe9b8', size:0.018, transparent:true, opacity:.5, depthWrite:false, blending:THREE.AdditiveBlending })); scene.add(tozP);
}

// ── seçim: fare / dokunma / VR kumandası ──
const ray = new THREE.Raycaster(), fare = new THREE.Vector2();
function etkile(nesne, nokta, kaynak){
  if(!nesne) { if(kaynak === 'vr') git(1); return; }
  if(nesne.name === 'igne'){ const h = V.harita[nesne.userData.i]; const i = V.metinler.findIndex(m => m.id === h.metin); if(i >= 0) bolumAc(i); return; }
  if(nesne.name === 'ileri' || nesne.name === 'perde') return git(1);
  if(nesne.name === 'geri') return git(-1);
  if(nesne.name === 'oto') return otoAyarla(!durum.oto);
  if(nesne.name === 'zemin' && (kaynak === 'vr' || kaynak === 'cift')) yuru(nokta);
}
function yuru(n){
  const x = THREE.MathUtils.clamp(n.x, -W / 2 + 0.6, W / 2 - 0.6), z = THREE.MathUtils.clamp(n.z, PODYUM_Z + 1.2, ZARKA - 0.6);
  const kafa = new THREE.Vector3(); camera.getWorldPosition(kafa);
  rig.position.x += x - kafa.x; rig.position.z += z - kafa.z;
}
function otoAyarla(v){ durum.oto = v; durum.sonraki = performance.now() + sure(); $('#oto').classList.toggle('on', v); $('#oto').textContent = v ? '⏸ Oto' : '⏵ Oto'; }

// masaüstü/telefon: sürükleyerek bak, çift tıkla yürü
let suruk = null, yaw = 0, pitch = 0.16; const eul = new THREE.Euler(0, 0, 0, 'YXZ');
const el = renderer.domElement;
el.addEventListener('pointerdown', (e) => { suruk = { x:e.clientX, y:e.clientY, t:performance.now(), m:0 }; el.setPointerCapture(e.pointerId); });
el.addEventListener('pointermove', (e) => { if(!suruk || renderer.xr.isPresenting) return; const dx = e.clientX - suruk.x, dy = e.clientY - suruk.y; suruk.m += Math.abs(dx) + Math.abs(dy); suruk.x = e.clientX; suruk.y = e.clientY;
  yaw += dx * 0.004; pitch = THREE.MathUtils.clamp(pitch + dy * 0.004, -1.2, 1.2); });
el.addEventListener('pointerup', (e) => { if(suruk && suruk.m < 8 && performance.now() - suruk.t < 400) secFare(e, 'tik'); suruk = null; });
el.addEventListener('dblclick', (e) => secFare(e, 'cift'));
let sonDokun = 0; el.addEventListener('touchend', (e) => { const t = performance.now(); if(t - sonDokun < 320 && e.changedTouches[0]) secFare(e.changedTouches[0], 'cift'); sonDokun = t; });
el.addEventListener('wheel', (e) => { camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.02, 35, 85); camera.updateProjectionMatrix(); }, { passive:true });
function secFare(e, tur){
  fare.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(fare, camera);
  const h = ray.intersectObjects(tiklanir, false)[0];
  if(tur === 'cift'){ if(h && h.object.name === 'zemin') yuru(h.point); return; }
  if(h) etkile(h.object, h.point, 'tik');
}
addEventListener('keydown', (e) => { if(e.key === 'ArrowRight' || e.key === ' '){ e.preventDefault(); git(1); } if(e.key === 'ArrowLeft') git(-1);
  const hiz = 0.25, ileri = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)), sag = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const k = e.key.toLowerCase(); if(k === 'w') yuru(rig.position.clone().addScaledVector(ileri, hiz)); if(k === 's') yuru(rig.position.clone().addScaledVector(ileri, -hiz)); if(k === 'a') yuru(rig.position.clone().addScaledVector(sag, -hiz)); if(k === 'd') yuru(rig.position.clone().addScaledVector(sag, hiz)); });

// VR kumandaları: ışın, tetik, kavrama, çubukla dönüş
const kumandalar = [], modelF = new XRControllerModelFactory(), tmp = new THREE.Matrix4();
const isinGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
for(let i = 0; i < 2; i++){
  const k = renderer.xr.getController(i);
  const isin = new THREE.Line(isinGeo, new THREE.LineBasicMaterial({ color:'#f2c870', transparent:true, opacity:.8 })); isin.scale.z = 6; k.add(isin);
  k.addEventListener('select', () => { const h = kumandaIsin(k); etkile(h && h.object, h && h.point, 'vr'); });
  k.addEventListener('squeeze', () => git(-1));
  rig.add(k); kumandalar.push({ k, isin });
  const tut = renderer.xr.getControllerGrip(i); tut.add(modelF.createControllerModel(tut)); rig.add(tut);
}
function kumandaIsin(k){ tmp.identity().extractRotation(k.matrixWorld); ray.ray.origin.setFromMatrixPosition(k.matrixWorld); ray.ray.direction.set(0, 0, -1).applyMatrix4(tmp); return ray.intersectObjects(tiklanir, false)[0]; }
let donusKilit = false;
function cubuk(){
  const s = renderer.xr.getSession(); if(!s) return;
  for(const src of s.inputSources){ const ax = src.gamepad && src.gamepad.axes; if(!ax || ax.length < 4) continue;
    const x = ax[2]; if(Math.abs(x) > 0.7 && !donusKilit){ donusKilit = true; const kafa = new THREE.Vector3(); camera.getWorldPosition(kafa); const a = -Math.sign(x) * Math.PI / 6;
      rig.position.sub(kafa).applyAxisAngle(new THREE.Vector3(0, 1, 0), a).add(kafa); rig.rotation.y += a; } else if(Math.abs(x) < 0.3) donusKilit = false; }
}

// ── döngü ──
const saat = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = saat.getElapsedTime(), dt = saat.getDelta();
  if(!renderer.xr.isPresenting){ eul.set(pitch, yaw, 0); camera.quaternion.setFromEuler(eul); }
  else { cubuk(); for(const { k, isin } of kumandalar){ const h = kumandaIsin(k); isin.scale.z = h ? h.distance : 6; isin.material.color.set(h && h.object.name !== 'zemin' ? '#ffffff' : '#f2c870'); } }
  if(iz && isaretci){ isaretci.position.copy(iz.getPointAt((t * 0.04) % 1)); isaretci.position.y += 0.01; }
  iğneler.forEach(({ bas }, i) => { if(bas.scale.x > 1.2) bas.position.y = 0.13 + Math.sin(t * 4 + i) * 0.01; });
  if(tozP){ tozP.rotation.y = t * 0.01; tozP.position.y = Math.sin(t * 0.2) * 0.1; }
  if(durum.oto && V && performance.now() > durum.sonraki) git(1);
  renderer.render(scene, camera);
});
function boyut(){ camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 88 : 70; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
addEventListener('resize', boyut); boyut();

// mağaza görselleri için kamera kancası (?cekim=1)
if(new URLSearchParams(location.search).has('cekim')) window.__salon = { bak:(y, p) => { yaw = y; pitch = p; }, git:(x, z) => { rig.position.set(x, 0, z); }, bolumAc:(i) => bolumAc(i), ileri:(n) => { for(let k = 0; k < n; k++) git(1); }, fov:(f) => { camera.fov = f; camera.updateProjectionMatrix(); } };

// ── VR düğmesi ──
async function vrHazirla(){
  const b = $('#vr');
  if(!navigator.xr){ b.textContent = '🥽 VR yok'; b.title = 'Bu tarayıcı WebXR desteklemiyor. VR gözlüğün tarayıcısıyla aç.'; return; }
  let ok = false; try { ok = await navigator.xr.isSessionSupported('immersive-vr'); } catch(e){}
  if(!ok){ b.textContent = '🥽 VR yok'; b.title = 'VR gözlük bulunamadı. Gözlüğün tarayıcısında bu sayfayı aç.'; return; }
  b.disabled = false; b.textContent = renderer.xr.isPresenting ? '🚪 Çık' : '🥽 VR\'a gir';
  b.onclick = () => { const s = renderer.xr.getSession(); if(s) s.end(); else vrBaslat(); };
}

// Tek VR giriş kapısı: düğme, giriş kartı, mağaza uygulamasının otomatik açılışı hep buradan geçer.
// 'layers' ve 'bounded-floor' istenmez: Quest tarayıcısında bazı sürümlerde ilk karede donmaya yol açabiliyor.
let vrIstek = null;
function vrBaslat(){
  if(!navigator.xr || renderer.xr.isPresenting) return Promise.resolve(false);
  if(vrIstek) return vrIstek;
  vrIstek = navigator.xr.requestSession('immersive-vr', { optionalFeatures:['local-floor', 'hand-tracking'] })
    .then(async s => {
      renderer.xr.setFoveation(1); await renderer.xr.setSession(s);
      camera.position.set(0, 0, 0); const b = $('#vr'); if(b) b.textContent = '🚪 Çık';
      const g = $('#giris'); if(g) g.style.display = 'none';
      s.addEventListener('end', () => {
        camera.position.set(0, 1.25, 0); const b2 = $('#vr'); if(b2) b2.textContent = '🥽 VR\'a gir';
        if(PWA) kapiGoster(); // mağaza uygulamasında VR'dan çıkınca boş sayfada kalınmasın
      });
      return true;
    })
    .catch(e => { console.warn('VR açılamadı', e); if(PWA) kapiGoster(); return false; })
    .finally(() => { vrIstek = null; });
  return vrIstek;
}
const PWA = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || 'getDigitalGoodsService' in window || document.referrer.startsWith('android-app://');
// VR'a giremezsek ekranda tek, büyük bir "Salona gir" düğmesi kalsın (tetik/dokunuş = kullanıcı etkileşimi)
function kapiGoster(){
  const g = $('#giris'); if(!g) return;
  g.style.display = ''; const d = $('#basla');
  d.innerHTML = '🥽 Salona gir'; d.disabled = false; d.onclick = () => vrBaslat();
}
if(navigator.xr && navigator.xr.addEventListener) navigator.xr.addEventListener('sessiongranted', () => vrBaslat());

// ── başlat ──
(async () => {
  // Mağaza uygulaması (immersive PWA): VR oturumunu hiç beklemeden, veri yüklenmeden önce iste.
  // Simgeye dokunmak kullanıcı etkileşimi sayılır; beklersek bu hak düşüp gözlük yükleme ekranında asılı kalabiliyor.
  if(PWA && navigator.xr) vrBaslat();
  try {
    const yaziBekle = Promise.all([document.fonts.load("900 50px 'DM Sans'"), document.fonts.load("500 30px 'DM Sans'"), document.fonts.load("700 30px 'DM Sans'"), document.fonts.load("800 30px 'Barlow Condensed'")]).catch(() => {});
    await Promise.race([yaziBekle, new Promise(r => setTimeout(r, 2500))]);
    V = await (await fetch('veri.json')).json();
    $('#bolum').innerHTML = V.metinler.map((m, i) => `<option value="${i}">${m.bolum}. ${m.baslik}</option>`).join('');
    $('#bolum').onchange = (e) => bolumAc(Number(e.target.value));
    $('#ileri').onclick = () => git(1); $('#geri').onclick = () => git(-1); $('#oto').onclick = () => otoAyarla(!durum.oto);
    kur(); perdeCiz(); vurguDurak(); vrHazirla();
    if(PWA && navigator.xr){
      // mağaza uygulaması: kart yalnızca VR'a girilemezse görünür, düğmesi doğrudan VR'a sokar
      if(renderer.xr.isPresenting) $('#giris').style.display = 'none'; else if(!vrIstek) kapiGoster();
    } else {
      $('#basla').innerHTML = 'Salona gir'; $('#basla').onclick = () => { $('#giris').remove(); setTimeout(() => $('#ipucu') && $('#ipucu').remove(), 9000); };
    }
  } catch(e){
    console.error(e);
    if(PWA && navigator.xr) kapiGoster(); // veri yüklenemese de uygulama donmuş görünmesin
    else { const y = $('#yuk'); if(y) y.innerHTML = '<span class="hata">Salon açılamadı. Sayfayı yenile.</span>'; }
  }
})();

// çevrimdışı önbellek (PWA: Quest'te ana ekrana eklenebilir, internetsiz açılır)
if('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
