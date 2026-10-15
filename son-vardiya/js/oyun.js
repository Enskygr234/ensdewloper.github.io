// Son Vardiya — oyun motoru: sahne, birinci şahıs kontroller, fener, telsiz, görevler ve gecelerin akışı.
import * as THREE from '../lib/three.module.js';
import { Harita, manken, nevzatModeli } from './harita.js';
import { Ses } from './ses.js';
import { GECELER, HATIRALAR, SONLAR } from './hikaye.js';

const $ = s => document.querySelector(s);
const P = new URLSearchParams(location.search);
const DEMO = P.has('demo');
const CIZME = P.has('cizme');
const dokunmatik = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
if (dokunmatik) document.body.classList.add('dokunmatik');
class Iptal extends Error {}

// ------------------------------------------------------------------ kayıt
const KAYIT = 'sonVardiya.kayit', SONLAR_K = 'sonVardiya.sonlar', AYAR = 'sonVardiya.ayar';
const oku = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch (e) { return v; } };
const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const ayar = Object.assign({ ses: true, hassas: 1 }, oku(AYAR, {}));

// ------------------------------------------------------------------ sahne
const canvas = $('#sahne');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !dokunmatik, powerPreference: 'high-performance', preserveDrawingBuffer: DEMO });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dokunmatik ? 1.3 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
const sahne = new THREE.Scene();
const SIS_RENK = new THREE.Color(0x05070a);
sahne.background = SIS_RENK.clone();
sahne.fog = new THREE.FogExp2(SIS_RENK.clone(), .05);
const kamera = new THREE.PerspectiveCamera(72, 1, .05, 140);
kamera.rotation.order = 'YXZ';
sahne.add(kamera);

try { await Promise.all([document.fonts.load('900 64px "Big Shoulders"'), document.fonts.load('700 30px "Big Shoulders"'), document.fonts.load('italic 30px Literata')]); } catch (e) {}
const harita = new Harita(sahne);
// güvenlik kamerası dokusunu geniş tut (4 ekran yan yana)
harita.kameraDoku.c.width = 1024; harita.kameraDoku.c.height = 192;

// ışıklar
const hemi = new THREE.HemisphereLight(0x8fa3c8, 0x2a2018, .3); sahne.add(hemi);
const fener = new THREE.SpotLight(0xfff0d4, 0, 32, .46, .55, 1.5);
fener.position.set(.16, -.14, .05); kamera.add(fener); kamera.add(fener.target); fener.target.position.set(.05, -.25, -5);
const ofisIsik = new THREE.PointLight(0xffd9a0, 7, 13, 1.6); ofisIsik.position.set(36.5, 2.7, -2.4); sahne.add(ofisIsik);
const ayIsik = new THREE.PointLight(0x7f9fd8, 12, 34, 1.15); ayIsik.position.set(0, 8.2, 0); sahne.add(ayIsik);
const acilIsik = new THREE.PointLight(0xff2a1a, 0, 22, 1.4); acilIsik.position.set(26, 3.3, 1.5); sahne.add(acilIsik);
const perdeIsik = new THREE.PointLight(0xb8d0ff, 0, 34, 1.1); perdeIsik.position.set(0, 4.5, -37); sahne.add(perdeIsik);
const koltukIsik = new THREE.SpotLight(0xfff2d0, 0, 9, .2, .5, 1); sahne.add(koltukIsik, koltukIsik.target);
koltukIsik.position.copy(harita.koltuk7).add(new THREE.Vector3(0, 5, .6)); koltukIsik.target.position.copy(harita.koltuk7);

// figürler
const mankenler = [];
const MANKEN_YER = [[-23, -5.6], [-23, -8.2], [-16.9, -5.6], [-16.9, -7.6]];
for (const [x, z] of MANKEN_YER) { const m = manken(false); m.position.set(x, 0, z); sahne.add(m); mankenler.push({ m, x, z }); }
const cocukManken = manken(true, 0xdcd5c8); cocukManken.position.set(-17.4, 0, -10.1); sahne.add(cocukManken);
const bere = new THREE.Group();
{ const bm = new THREE.MeshStandardMaterial({ color: 0xc8232c, roughness: .9 });
  const b1 = new THREE.Mesh(new THREE.SphereGeometry(.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), bm); b1.scale.set(1.15, .75, 1.15);
  const b2 = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), bm); b2.position.y = .08; bere.add(b1, b2); bere.position.set(0, 1.47, 0); cocukManken.add(bere); }
const nevzat = nevzatModeli(); nevzat.visible = false; sahne.add(nevzat);
nevzat.traverse(c => { if (c.material) { c.material.transparent = true; c.material.depthWrite = false; c.userData.op = c.material.opacity; } });
// bilet parıltısı (koltuk 7)
const bilet = new THREE.Mesh(new THREE.PlaneGeometry(.16, .07), new THREE.MeshBasicMaterial({ color: 0xffe9b0 }));
bilet.rotation.x = -Math.PI / 2 + .2; bilet.position.copy(harita.koltuk7).add(new THREE.Vector3(0, -.08, 0)); bilet.visible = false; sahne.add(bilet);
// duman parçacıkları
const DUMAN_N = 380;
const dumanGeo = new THREE.BufferGeometry(); const dp = new Float32Array(DUMAN_N * 3);
for (let i = 0; i < DUMAN_N; i++) { dp[i * 3] = (Math.random() - .5) * 16; dp[i * 3 + 1] = Math.random() * 4; dp[i * 3 + 2] = (Math.random() - .5) * 16; }
dumanGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
const dumanMalz = new THREE.PointsMaterial({ color: 0xbfb2a0, size: .06, transparent: true, opacity: 0, depthWrite: false });
const duman = new THREE.Points(dumanGeo, dumanMalz); duman.frustumCulled = false; sahne.add(duman);

const ses = new Ses(); ses.acik = ayar.ses;

// ------------------------------------------------------------------ durum
let mod = 'baslik';          // baslik | oyun | diyalog | incele | menu | son | ara
let zaman = 0;               // oyunun kendi saati (demo kaydında kare kare ilerler)
let zamanlayicilar = [];
const sonra = (sn, fn) => zamanlayicilar.push({ t: zaman + sn, fn });
const oyuncu = { x: 35.2, z: 0, y: 1.62, yaw: Math.PI / 2, pitch: 0, adimMesafe: 0, bob: 0, hiz: 0 };
let durum = { gece: 1, hatiralar: [], samimiyet: 0 };
let kosu = null;
const etkilesimler = new Map();
let bolgeler = [], yaklasanlar = [];
let hedefNokta = null, odak = null;
let fenerVar = false, fenerAcik = false, pil = 100, pilAlindi = false;
let elektrikAcik = true, titreSure = 0, dumanHedef = 0, dumanV = 0, sabahT = -1;
let filmAcik = false, filmT = 0, kam4 = false, sonKameraCiz = 0, mankenMod = 'normal';
const sesler = {};          // konumlu döngüler
const nevzatD = { opak: 0, hedef: 0, yol: [], res: null, mod: 'gizli', adimT: 0 };

// ------------------------------------------------------------------ yardımcılar
function noktaPos(id) {
  if (id === 'nevzat') return new THREE.Vector3(nevzat.position.x, 1.4, nevzat.position.z);
  return harita.noktalar[id];
}
function kosuOlustur() {
  const k = { iptal: false, bekleyen: new Set() };
  k.soz = kur => {
    if (k.iptal) { const p = Promise.reject(new Iptal()); p.catch(() => {}); return p; }
    const p = new Promise((res, rej) => { const g = { rej }; k.bekleyen.add(g); kur(v => { if (!k.bekleyen.has(g)) return; k.bekleyen.delete(g); res(v); }); });
    p.catch(() => {}); return p;
  };
  k.bitir = () => { k.iptal = true; for (const g of k.bekleyen) g.rej(new Iptal()); k.bekleyen.clear(); };
  return k;
}

// ------------------------------------------------------------------ arayüz parçaları
const ui = {
  hud: $('#hud'), saat: $('#saat'), geceAd: $('#geceAd'), pil: $('#pil'), hedef: $('#hedef'), pusula: $('#pusula'),
  nisan: $('#nisangah'), telsiz: $('#telsiz'), anlati: $('#anlati'), ipucu: $('#ipucu'), envanter: $('#envanter'),
  joy: $('#joy'), dd: $('#dokunDugmeler'), fenerBtn: $('#fenerBtn'), etkBtn: $('#etkBtn'),
  diyalog: $('#diyalog'), kart: $('#kart'), incele: $('#incele'), geceSonu: $('#geceSonu'), son: $('#son'), perde: $('#perde'),
  baslik: $('#baslik'), menu: $('#menu'),
};
const perdeAc = () => ui.perde.classList.add('acik');
const perdeKapa = () => ui.perde.classList.remove('acik');

function saatYaz(s) { ui.saat.textContent = s; }
let anlatiNo = 0;
function anlatiGoster(m, sure) {
  const no = ++anlatiNo; ui.anlati.textContent = m; ui.anlati.hidden = false; ui.anlati.style.animation = 'none'; void ui.anlati.offsetWidth; ui.anlati.style.animation = '';
  sonra(sure || Math.min(9, 2.8 + m.length * .05), () => { if (no === anlatiNo) ui.anlati.hidden = true; });
}
let ipucuNo = 0;
function ipucuGoster(m) { const no = ++ipucuNo; ui.ipucu.textContent = m; ui.ipucu.hidden = false; sonra(7, () => { if (no === ipucuNo) ui.ipucu.hidden = true; }); }
function hedefAyarla(metin, nokta) {
  ui.hedef.querySelector('span').textContent = metin || '';
  ui.hedef.classList.remove('yeni'); void ui.hedef.offsetWidth; if (metin) ui.hedef.classList.add('yeni');
  hedefNokta = nokta || null;
}
function envanterCiz(yeni) {
  ui.envanter.innerHTML = '';
  for (const id of durum.hatiralar) { const h = HATIRALAR[id]; const d = document.createElement('div'); d.className = 'esya' + (id === yeni ? ' yeni' : ''); d.textContent = h.ikon; d.title = h.ad; ui.envanter.append(d); }
}

// telsiz alt yazısı (yürümeyi durdurmaz)
let telsizKuyruk = [], telsizSu = null;
function telsizEkle(satirlar, stil, res) {
  satirlar.forEach((s, i) => telsizKuyruk.push({ kim: s[0], metin: s[1], stil: stil || (s[0] === 'ANONS' ? 'anons' : ''), res: i === satirlar.length - 1 ? res : null, ilk: i === 0 }));
  if (!satirlar.length) res();
  if (!telsizSu) telsizSonraki();
}
function telsizSonraki() {
  const s = telsizKuyruk.shift();
  if (!s) { telsizSu = null; ui.telsiz.hidden = true; return; }
  telsizSu = s;
  ui.telsiz.className = s.stil; ui.telsiz.hidden = false;
  ui.telsiz.querySelector('.kim').textContent = s.kim;
  ui.telsiz.querySelector('small').textContent = s.stil === 'anons' ? 'HOPARLÖR' : 'KANAL 3';
  ui.telsiz.querySelector('p').textContent = s.metin;
  const sure = Math.max(2.6, Math.min(8, 1.4 + s.metin.length * .058));
  if (s.stil !== 'anons') { if (s.ilk) ses.telsiz(); ses.konusma(Math.min(sure - .6, s.metin.length * .045), 'nevzat'); }
  else ses.konusma(sure - .8, 'cocuk');
  sonra(sure, () => { if (telsizSu !== s) return; if (s.res) s.res(); telsizSonraki(); });
}

// engelleyici konuşma (seçimli)
let diyalogD = null;
function diyalogBaslat(satirlar, secimler, res) {
  diyalogD = { satirlar: satirlar.slice(), secimler: secimler || null, res, i: -1 };
  mod = 'diyalog'; ui.diyalog.hidden = false;
  if (document.pointerLockElement) document.exitPointerLock();
  diyalogIlerle();
}
function diyalogIlerle() {
  const d = diyalogD; if (!d) return;
  if (d.yaziyor) { d.yaziyor = false; ui.diyalog.querySelector('.metin').textContent = d.tam; ui.diyalog.classList.add('bitti'); return; }
  d.i++;
  const kim = ui.diyalog.querySelector('.kim'), metin = ui.diyalog.querySelector('.metin'), sec = ui.diyalog.querySelector('.secimler');
  sec.innerHTML = ''; ui.diyalog.classList.remove('bitti');
  if (d.i < d.satirlar.length) {
    const [k, m] = d.satirlar[d.i];
    kim.textContent = k; d.tam = m; metin.textContent = ''; d.yaziyor = true;
    if (d.i === 0) ses.telsiz(); ses.konusma(Math.min(5, m.length * .045), 'nevzat');
    let n = 0; const yazi = () => { if (!d.yaziyor || diyalogD !== d) return; n += 2; metin.textContent = m.slice(0, n); if (n >= m.length) { d.yaziyor = false; ui.diyalog.classList.add('bitti'); } else sonra(.016, yazi); };
    yazi();
    return;
  }
  if (d.secimler && !d.secildi) {
    kim.textContent = ''; metin.textContent = '';
    d.secimler.forEach((s, i) => { const b = document.createElement('button'); b.innerHTML = `<b>${i + 1}</b>`; b.append(s); b.onclick = e => { e.stopPropagation(); diyalogSec(i); }; sec.append(b); });
    return;
  }
  diyalogKapat(-1);
}
function diyalogSec(i) {
  const d = diyalogD; if (!d || !d.secimler || d.i < d.satirlar.length || i >= d.secimler.length) return;
  d.secildi = true; ses.telsiz(false); diyalogKapat(i);
}
function diyalogKapat(v) {
  const d = diyalogD; diyalogD = null; ui.diyalog.hidden = true; mod = 'oyun';
  kilitIste();
  d.res(v);
}

// inceleme kâğıdı
let inceleRes = null;
function inceleGoster(tur, baslik, metin, res, hatira) {
  ui.incele.querySelector('.tur').textContent = tur;
  ui.incele.querySelector('h3').textContent = baslik;
  ui.incele.querySelector('p').textContent = metin;
  ui.incele.classList.toggle('hatira', !!hatira);
  ui.incele.hidden = false; mod = 'incele'; inceleRes = res; ses.sayfa();
  if (document.pointerLockElement) document.exitPointerLock();
}
function inceleKapat() { if (!inceleRes) return; const r = inceleRes; inceleRes = null; ui.incele.hidden = true; mod = 'oyun'; kilitIste(); r(); }
ui.incele.querySelector('.dugme').onclick = e => { e.stopPropagation(); inceleKapat(); };

function kartGoster(n, ad, saat, res) {
  ui.kart.querySelector('.no').textContent = `${n}. GECE`;
  ui.kart.querySelector('h2').textContent = ad;
  ui.kart.querySelector('.saat').textContent = saat;
  ui.geceAd.textContent = `GECE ${n}`; saatYaz(saat);
  ui.kart.classList.remove('cik'); ui.kart.hidden = false;
  perdeAc();
  sonra(3.2, () => ui.kart.classList.add('cik'));
  sonra(4.2, () => { ui.kart.hidden = true; res(); });
}

let geceSonuRes = null;
function geceBitirGoster(saat, res) {
  saatYaz(saat); hedefAyarla('', null);
  if (document.pointerLockElement) document.exitPointerLock();
  mod = 'ara'; perdeKapa(); ses.hepsiniSustur(); ses.gerilim(0);
  sonra(1.3, () => {
    ui.geceSonu.querySelector('h2').textContent = `${durum.gece}. GECE`;
    const h = durum.hatiralar;
    ui.geceSonu.querySelector('.hatiralar').textContent = h.length ? `Hatıralar: ${h.map(i => HATIRALAR[i].ikon).join(' ')}  ·  ${h.length}/5` : 'Henüz bir hatıra bulmadın.';
    ui.geceSonu.querySelector('.dugme').textContent = durum.gece < 5 ? `${durum.gece + 1}. geceye geç` : 'Devam';
    ui.geceSonu.hidden = false; geceSonuRes = res;
  });
}
ui.geceSonu.querySelector('.dugme').onclick = () => { if (!geceSonuRes) return; const r = geceSonuRes; geceSonuRes = null; ui.geceSonu.hidden = true; r(); };

function hatiraVer(id, res) {
  if (durum.hatiralar.includes(id)) return res();
  durum.hatiralar.push(id); envanterCiz(id); ses.esya();
  if (id === 'bere') bere.visible = false;
  if (id === 'bilet') bilet.visible = false;
  const h = HATIRALAR[id];
  inceleGoster(h.tur, h.baslik, h.metin, res, true);
}

function sonGoster(tur, res) {
  mod = 'son'; if (document.pointerLockElement) document.exitPointerLock();
  const s = SONLAR[tur];
  const bulunan = new Set(oku(SONLAR_K, [])); bulunan.add(tur); yaz(SONLAR_K, [...bulunan]);
  try { localStorage.removeItem(KAYIT); } catch (e) {}
  perdeKapa();
  setTimeout(() => {
    ses.hepsiniSustur(); if (tur === 'devir') ses.sabah(); else ses.korku(.4);
    ui.hud.hidden = true;
    ui.son.className = 'katman ' + (tur === 'devir' ? 'devir' : '');
    const sat = ui.son.querySelector('.satirlar'); sat.innerHTML = ''; ui.son.querySelector('.kunye').hidden = true; ui.son.hidden = false;
    let i = 0; let atla = false;
    const ileri = () => {
      if (i < s.satirlar.length) { const p = document.createElement('p'); p.textContent = s.satirlar[i++]; sat.append(p); tm = setTimeout(ileri, atla ? 200 : 3600); return; }
      sat.innerHTML = '';
      const k = ui.son.querySelector('.kunye'); k.hidden = false;
      k.querySelector('h2').textContent = s.baslik;
      k.querySelector('.istat').textContent = `Bulunan hatıra: ${durum.hatiralar.length}/5`;
      const ad = { devir: 'Devir Teslim', kapanis: 'Kapanış', kal: 'Son Vardiya' };
      k.querySelector('.sonlar').textContent = `Açılan sonlar ${bulunan.size}/3: ${[...bulunan].map(b => ad[b]).join(', ')}` + (bulunan.size < 3 ? '. Farklı seçimler başka sonlara götürür.' : '. Hepsini gördün.');
      ui.son.onclick = null; res();
    };
    let tm = setTimeout(ileri, 900);
    ui.son.onclick = () => { if (atla) return; atla = true; clearTimeout(tm); ileri(); };
  }, 1600);
}
ui.son.querySelector('[data-is="yeniden"]').onclick = e => { e.stopPropagation(); ui.son.hidden = true; yeniOyun(); };
ui.son.querySelector('[data-is="ana"]').onclick = e => { e.stopPropagation(); ui.son.hidden = true; anaMenu(); };

// ------------------------------------------------------------------ dünya olayları
function elektrik(acik) {
  elektrikAcik = acik; ses.elektrik(acik);
  if (!acik) ses.elektrikGitti(); else ses.elektrikGeldi();
}
function titret(sn) { titreSure = Math.max(titreSure, sn); ses.vizilti(); }
function okut(id) { const led = harita.okuyucular[id]; if (led) led.material.color.set(0x34d058); ses.kart(true); }
function sigorta(i) { const k = harita.sigortalar[i]; k.rotation.x = -.5; k.userData.lamba.material.color.set(0x34d058); ses.sigorta(i); }
function fenerVer() { fenerVar = true; fenerAcik = true; harita.fenerModel.visible = false; ses.tik(); ui.pil.hidden = false; ui.fenerBtn.hidden = !dokunmatik; pilEtkilesimi(); }
function pilEtkilesimi() {
  if (pilAlindi) return;
  etkilesimler.set('pil', { etiket: 'Yedek pil al', res: () => { pilAlindi = true; pil = Math.min(100, pil + 70); ses.tik(); anlatiGoster('Fenere yeni pil taktın.'); } });
}
function fenerDegis() { if (!fenerVar || mod !== 'oyun') return; fenerAcik = !fenerAcik; ses.tik(); }
function sesBaslat(tur, nokta) { sesDurdur(tur); sesler[tur] = ses.konumlu(tur, harita.noktalar[nokta]); }
function sesDurdur(tur) { if (sesler[tur]) { sesler[tur].dur(); delete sesler[tur]; } }
function arkamda(d) { return { x: oyuncu.x + Math.sin(oyuncu.yaw) * d, y: 0, z: oyuncu.z + Math.cos(oyuncu.yaw) * d }; }
function kameraGoruyor(x, z) { const fx = -Math.sin(oyuncu.yaw), fz = -Math.cos(oyuncu.yaw); const dx = x - oyuncu.x, dz = z - oyuncu.z, d = Math.hypot(dx, dz) || 1; return (dx * fx + dz * fz) / d > .35; }

function mankenModu(m) {
  mankenMod = m;
  const r = (i) => Math.sin(i * 12.9898 + durum.gece * 3.1) * Math.PI;
  mankenler.forEach((o, i) => { o.m.position.set(o.x, 0, o.z); o.m.rotation.y = r(i); });
  cocukManken.rotation.y = .4;
  if (m === 'kapiya' || m === 'koridor') {
    mankenler.forEach(o => { o.m.rotation.y = Math.atan2(-20 - o.x, -3.6 - o.z); });
    cocukManken.rotation.y = Math.atan2(-20 + 17.4, -3.6 + 10.1);
  }
  if (m === 'koridor') {
    const o = mankenler[1];
    let p = arkamda(7.5);
    if (!harita.gecerli(p.x, p.z, .4) || kameraGoruyor(p.x, p.z)) p = arkamda(11);
    if (!harita.gecerli(p.x, p.z, .4)) p = { x: Math.max(-30, Math.min(-10, oyuncu.x + 8)), z: 0 };
    o.m.position.set(p.x, 0, p.z); o.m.rotation.y = Math.atan2(oyuncu.x - p.x, oyuncu.z - p.z);
    sonra(1.2, () => ses.korku(.35));
  }
}

function nevzatMod(m) {
  nevzatD.mod = m;
  if (m === 'goster') { nevzat.visible = true; nevzat.position.set(33.2, 0, 0); nevzat.rotation.y = -Math.PI / 2; nevzatD.hedef = 1; nevzatD.opak = 0; }
  if (m === 'sol') { nevzatD.hedef = 0; nevzatD.yol = []; }
  if (m === 'yanina') { nevzat.visible = true; nevzatD.hedef = .8; nevzatD.yol = []; }
}
function nevzatYol(yol, res) { nevzatD.yol = yol.map(([x, z]) => ({ x, z })); nevzatD.res = res; }

function koltukIsigi(acik) { koltukIsik.intensity = acik ? 30 : 0; bilet.visible = acik && !durum.hatiralar.includes('bilet'); }
function dumanAyarla(v) { dumanHedef = v; }
function sabah() { sabahT = 0; elektrikAcik = true; }

// ------------------------------------------------------------------ O: hikâyenin kullandığı arayüz
function apiOlustur(k) {
  return {
    get durum() { return durum; }, sesler: ses, dokunmatik,
    gece: (n, ad, s) => k.soz(res => kartGoster(n, ad, s, res)),
    anlati: m => anlatiGoster(m), ipucu: m => ipucuGoster(m),
    hedef: (m, n) => hedefAyarla(m, n),
    etkiles: (id, etiket, opt = {}) => k.soz(res => etkilesimler.set(id, { etiket, res, istege: opt.istege })),
    etkilesKapat: id => etkilesimler.delete(id),
    incele: (tur, b, m) => k.soz(res => inceleGoster(tur, b, m, res)),
    telsiz: (s, stil) => k.soz(res => telsizEkle(s, stil, res)),
    konus: (s, sec) => k.soz(res => diyalogBaslat(s, sec, res)),
    bekle: sn => k.soz(res => sonra(sn, res)),
    bolge: oda => k.soz(res => bolgeler.push({ oda, res })),
    yaklas: (id, d) => k.soz(res => yaklasanlar.push({ id, d, res })),
    okut, saat: saatYaz, sesBaslat, sesDurdur, arkamda, fenerVer, elektrik, sigorta, titret,
    hatira: id => k.soz(res => hatiraVer(id, res)),
    geceBitir: s => k.soz(res => geceBitirGoster(s, res)),
    manken: m => mankenModu(m),
    kamera4: v => { kam4 = v; }, film: v => { filmAcik = v; filmT = 0; },
    koltukIsigi, duman: dumanAyarla, sabah,
    nevzat: m => nevzatMod(m), nevzatYuru: yol => k.soz(res => nevzatYol(yol, res)),
    son: tur => k.soz(res => sonGoster(tur, res)),
  };
}

// ------------------------------------------------------------------ gecenin hazırlanması
function geceHazirla(n) {
  zamanlayicilar = []; etkilesimler.clear(); bolgeler = []; yaklasanlar = [];
  telsizKuyruk = []; telsizSu = null; ui.telsiz.hidden = true; ui.anlati.hidden = true; ui.ipucu.hidden = true;
  diyalogD = null; ui.diyalog.hidden = true; inceleRes = null; ui.incele.hidden = true; ui.geceSonu.hidden = true; ui.kart.hidden = true;
  ses.hepsiniSustur(); for (const k in sesler) delete sesler[k]; ses.gerilim(0);
  durum.gece = n;
  Object.assign(oyuncu, { x: 35.2, z: 0, y: 1.62, yaw: Math.PI / 2, pitch: -.05 });
  fenerVar = n >= 2; fenerAcik = false; pil = 100; pilAlindi = false;
  ui.pil.hidden = !fenerVar; ui.fenerBtn.hidden = !(dokunmatik && fenerVar);
  harita.fenerModel.visible = n === 1;
  if (fenerVar) pilEtkilesimi();
  elektrikAcik = true; ses.elektrik(true); titreSure = 0; dumanHedef = 0; dumanV = 0; sabahT = -1;
  filmAcik = false; kam4 = false; koltukIsigi(false);
  nevzat.visible = false; nevzatD.opak = 0; nevzatD.hedef = 0; nevzatD.yol = []; nevzatD.res = null; nevzatD.mod = 'gizli';
  for (const id in harita.okuyucular) harita.okuyucular[id].material.color.set(0xff3b30);
  harita.sigortalar.forEach(k => { const asagi = n === 2; k.rotation.x = asagi ? .5 : -.5; k.userData.lamba.material.color.set(asagi ? 0x441111 : 0x34d058); });
  bere.visible = !durum.hatiralar.includes('bere');
  mankenModu('normal');
  harita.catiCam.material.color.set(0x31435f);
  hedefAyarla('', null); envanterCiz(); saatYaz('23:00');
  ui.geceAd.textContent = `GECE ${n}`;
}

function kaydet(n) { yaz(KAYIT, { gece: n, hatiralar: durum.hatiralar.slice(), samimiyet: durum.samimiyet }); }

async function oyna(baslangic) {
  kosu?.bitir(); kosu = kosuOlustur(); const k = kosu; const O = apiOlustur(k);
  ui.baslik.hidden = true; ui.hud.hidden = false; mod = 'oyun';
  ui.joy.hidden = !dokunmatik; ui.dd.hidden = !dokunmatik;
  kilitIste();
  try {
    for (let n = baslangic; n <= 5; n++) {
      perdeKapa();
      await O.bekle(.5);
      geceHazirla(n); kaydet(n); mod = 'oyun';
      await GECELER[n - 1](O);
    }
  } catch (e) { if (!(e instanceof Iptal)) console.error(e); }
}
function yeniOyun() { durum = { gece: 1, hatiralar: [], samimiyet: 0 }; try { localStorage.removeItem(KAYIT); } catch (e) {} ses.baslat(); oyna(1); }
function devamEt() { const k = oku(KAYIT, null); if (!k) return yeniOyun(); durum = { gece: k.gece, hatiralar: k.hatiralar || [], samimiyet: k.samimiyet || 0 }; ses.baslat(); oyna(k.gece); }
function anaMenu() {
  kosu?.bitir(); kosu = null; mod = 'baslik'; ui.menu.hidden = true; ui.hud.hidden = true; ui.son.hidden = true;
  geceHazirla(1); fenerAcik = true; fenerVar = true; harita.fenerModel.visible = true;
  ses.hepsiniSustur(); baslikGuncelle(); ui.baslik.hidden = false; perdeAc();
  if (document.pointerLockElement) document.exitPointerLock();
}
function baslikGuncelle() {
  const k = oku(KAYIT, null), b = $('#devamBtn');
  b.hidden = !k; if (k) b.textContent = `Devam et · ${k.gece}. gece`;
  $('#basBtn').textContent = k ? 'Baştan başla' : 'Vardiyaya başla';
  $('#sesBtn').textContent = `Ses: ${ayar.ses ? 'açık' : 'kapalı'}`;
  $('#kontrolBilgi').textContent = dokunmatik
    ? 'Sol başparmakla yürü, ekranın sağında kaydırarak etrafına bak. ✋ ile etkileşim, 🔦 ile fener. Kulaklıkla oyna.'
    : 'WASD yürü · fare bak · Shift koş · E etkileşim · F fener · Esc duraklat. Kulaklıkla oyna.';
}

// ------------------------------------------------------------------ giriş: klavye, fare, dokunma
const tus = new Set();
let joyV = { x: 0, y: 0, id: null, ox: 0, oy: 0 }, bakis = { id: null, x: 0, y: 0 };
const HASSAS = [.6, 1, 1.5], HASSAS_AD = ['düşük', 'orta', 'yüksek'];
let hassasI = HASSAS.indexOf(ayar.hassas); if (hassasI < 0) hassasI = 1;

function kilitIste() { if (!dokunmatik && !DEMO && mod === 'oyun' && document.pointerLockElement !== canvas) { try { const p = canvas.requestPointerLock(); p?.catch?.(() => {}); } catch (e) {} } }
canvas.addEventListener('click', () => { if (mod === 'oyun') kilitIste(); });
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && mod === 'oyun' && !dokunmatik) menuAc();
});
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas || mod !== 'oyun') return;
  oyuncu.yaw -= e.movementX * .0022 * HASSAS[hassasI];
  oyuncu.pitch = Math.max(-1.35, Math.min(1.35, oyuncu.pitch - e.movementY * .0022 * HASSAS[hassasI]));
});
addEventListener('keydown', e => {
  if (e.repeat && !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) return;
  tus.add(e.code);
  if (mod === 'oyun') {
    if (e.code === 'KeyE' || e.code === 'Enter') etkiles();
    if (e.code === 'KeyF') fenerDegis();
  } else if (mod === 'diyalog') {
    if (['Space', 'Enter', 'KeyE'].includes(e.code)) { e.preventDefault(); diyalogIlerle(); }
    const n = parseInt(e.key, 10); if (n >= 1 && n <= 3) diyalogSec(n - 1);
  } else if (mod === 'incele') {
    if (['Space', 'Enter', 'KeyE', 'Escape'].includes(e.code)) { e.preventDefault(); inceleKapat(); }
  } else if (mod === 'menu' && e.code === 'Escape') menuKapat();
});
addEventListener('keyup', e => tus.delete(e.code));
addEventListener('blur', () => tus.clear());
addEventListener('pointerdown', e => { if (mod !== 'diyalog' || e.target.closest('button')) return; diyalogIlerle(); });

// dokunmatik: sol tarafta joystick, kalan yerde bakış
ui.joy.addEventListener('pointerdown', e => {
  if (mod !== 'oyun' || joyV.id !== null) return;
  joyV.id = e.pointerId; joyV.ox = e.clientX; joyV.oy = e.clientY; ui.joy.classList.add('aktif');
  const r = ui.joy.getBoundingClientRect();
  ui.joy.querySelector('.taban').style.left = (e.clientX - r.left) + 'px'; ui.joy.querySelector('.taban').style.top = (e.clientY - r.top) + 'px';
  joyTopKoy(0, 0); e.preventDefault();
});
function joyTopKoy(dx, dy) {
  const t = ui.joy.querySelector('.taban'), top = ui.joy.querySelector('.top');
  top.style.left = `calc(${t.style.left || '110px'} + ${dx}px)`; top.style.top = `calc(${t.style.top || 'calc(100% - 110px)'} + ${dy}px)`;
}
canvas.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' || mod !== 'oyun' || bakis.id !== null) return;
  bakis.id = e.pointerId; bakis.x = e.clientX; bakis.y = e.clientY;
});
addEventListener('pointermove', e => {
  if (e.pointerId === joyV.id) {
    let dx = e.clientX - joyV.ox, dy = e.clientY - joyV.oy; const d = Math.hypot(dx, dy), m = 56;
    if (d > m) { dx *= m / d; dy *= m / d; }
    joyV.x = dx / m; joyV.y = dy / m; joyTopKoy(dx, dy);
  } else if (e.pointerId === bakis.id && mod === 'oyun') {
    const k = .0058 * HASSAS[hassasI];
    oyuncu.yaw -= (e.clientX - bakis.x) * k; oyuncu.pitch = Math.max(-1.3, Math.min(1.3, oyuncu.pitch - (e.clientY - bakis.y) * k));
    bakis.x = e.clientX; bakis.y = e.clientY;
  }
});
const birak = e => {
  if (e.pointerId === joyV.id) { joyV = { x: 0, y: 0, id: null, ox: 0, oy: 0 }; ui.joy.classList.remove('aktif'); const t = ui.joy.querySelector('.taban'); t.style.left = ''; t.style.top = ''; joyTopKoy(0, 0); ui.joy.querySelector('.top').style.left = ''; ui.joy.querySelector('.top').style.top = ''; }
  if (e.pointerId === bakis.id) bakis.id = null;
};
addEventListener('pointerup', birak); addEventListener('pointercancel', birak);
ui.etkBtn.addEventListener('click', e => { e.stopPropagation(); etkiles(); });
ui.fenerBtn.addEventListener('click', e => { e.stopPropagation(); fenerDegis(); });

// menü
function menuAc() { if (mod !== 'oyun') return; mod = 'menu'; ui.menu.hidden = false; menuYazi(); tus.clear(); }
function menuKapat() { ui.menu.hidden = true; mod = 'oyun'; kilitIste(); }
function menuYazi() {
  ui.menu.querySelector('[data-is="ses"]').textContent = `Ses: ${ayar.ses ? 'açık' : 'kapalı'}`;
  ui.menu.querySelector('[data-is="hassas"]').textContent = `Bakış hızı: ${HASSAS_AD[hassasI]}`;
}
$('#menuBtn').addEventListener('click', e => { e.stopPropagation(); menuAc(); });
ui.menu.addEventListener('click', e => {
  const is = e.target.closest('[data-is]')?.dataset.is; if (!is) return;
  if (is === 'devam') menuKapat();
  if (is === 'ses') { ayar.ses = !ayar.ses; ses.ac(ayar.ses); yaz(AYAR, ayar); menuYazi(); }
  if (is === 'hassas') { hassasI = (hassasI + 1) % 3; ayar.hassas = HASSAS[hassasI]; yaz(AYAR, ayar); menuYazi(); }
  if (is === 'ana') anaMenu();
});
$('#basBtn').addEventListener('click', yeniOyun);
$('#devamBtn').addEventListener('click', devamEt);
$('#sesBtn').addEventListener('click', () => { ayar.ses = !ayar.ses; ses.ac(ayar.ses); yaz(AYAR, ayar); baslikGuncelle(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mod === 'oyun') menuAc(); if (ses.ctx) document.hidden ? ses.ctx.suspend() : ses.ctx.resume(); });

function etkiles() {
  if (mod !== 'oyun' || !odak) return;
  const id = odak, e = etkilesimler.get(id); if (!e) return;
  etkilesimler.delete(id); odak = null; e.res();
}

// ------------------------------------------------------------------ çizimler: perde filmi ve güvenlik kameraları
function filmCiz(t) {
  const { g, t: tex } = harita.perde, W = 512, H = 256;
  const dongu = t % 26;
  let parlak = .8;
  if (dongu < 4) {
    g.fillStyle = '#8c8578'; g.fillRect(0, 0, W, H);
    const n = 3 - Math.floor(dongu / 1.3), a = (dongu % 1.3) / 1.3 * Math.PI * 2;
    g.strokeStyle = '#2b2722'; g.lineWidth = 4; g.beginPath(); g.arc(W / 2, H / 2, 90, 0, 7); g.stroke(); g.beginPath(); g.arc(W / 2, H / 2, 70, 0, 7); g.stroke();
    g.fillStyle = 'rgba(40,36,30,.5)'; g.beginPath(); g.moveTo(W / 2, H / 2); g.arc(W / 2, H / 2, 120, -Math.PI / 2, -Math.PI / 2 + a); g.fill();
    g.fillStyle = '#1e1b17'; g.font = '900 120px "Big Shoulders", Impact'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(Math.max(1, n), W / 2, H / 2 + 6);
    g.fillRect(0, H / 2 - 1, W, 2); g.fillRect(W / 2 - 1, 0, 2, H);
    parlak = 1;
  } else if (dongu < 15) {
    const k = dongu - 4;
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0e2a4a'); gr.addColorStop(1, '#1f5a46'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff4c8'; g.beginPath(); g.arc(380 - k * 4, 60, 22, 0, 7); g.fill();
    for (let i = 0; i < 14; i++) { const x = ((i * 53 - k * 18) % (W + 80) + W + 80) % (W + 80) - 40, h = 90 + (i * 37) % 70; g.fillStyle = i % 2 ? '#0b2a1c' : '#0f3a26'; g.beginPath(); g.moveTo(x, H); g.lineTo(x + 30, H - h); g.lineTo(x + 60, H); g.fill(); }
    g.globalAlpha = Math.max(0, Math.min(1, (k - .5) / 1.5)) * Math.max(0, Math.min(1, (6 - k) / 1.5));
    g.fillStyle = '#ffd84d'; g.font = '900 54px "Big Shoulders", Impact'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MASAL ORMANI', W / 2, H / 2 - 10);
    g.globalAlpha = 1; parlak = .7;
  } else {
    const k = dongu - 15;
    g.fillStyle = '#2a2420'; g.fillRect(0, 0, W, H);
    const gr = g.createRadialGradient(W / 2, H + 40, 10, W / 2, H + 40, 300); gr.addColorStop(0, `rgba(255,${120 + Math.sin(t * 9) * 30},40,.85)`); gr.addColorStop(1, 'rgba(60,30,20,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(150,140,130,${.15 + .1 * Math.sin(t + i)})`; g.beginPath(); g.ellipse((i * 70 + t * 20) % (W + 100) - 50, 60 + Math.sin(i + t * .7) * 30, 80, 30, 0, 0, 7); g.fill(); }
    for (let i = 0; i < 10; i++) { g.fillStyle = '#120d0b'; g.fillRect(i * 52, H - 50, 40, 50); g.fillRect(i * 52, H - 70, 40, 14); }
    if (k > 3) { // fenerli adam çocuğu taşıyor
      const x = W - (k - 3) * 55;
      g.fillStyle = '#060504';
      g.fillRect(x - 12, H - 150, 24, 70); g.beginPath(); g.arc(x, H - 162, 13, 0, 7); g.fill(); g.fillRect(x - 15, H - 178, 30, 7);
      g.fillRect(x - 12, H - 80, 9, 60); g.fillRect(x + 3, H - 80, 9, 60);
      g.beginPath(); g.ellipse(x - 20, H - 128, 16, 11, .4, 0, 7); g.fill(); g.beginPath(); g.arc(x - 32, H - 138, 8, 0, 7); g.fill();
      g.fillStyle = '#c8232c'; g.beginPath(); g.ellipse(x - 32, H - 144, 9, 4, 0, 0, 7); g.fill();
      const fg = g.createRadialGradient(x - 40, H - 110, 2, x - 70, H - 100, 90); fg.addColorStop(0, 'rgba(255,240,200,.9)'); fg.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = fg; g.beginPath(); g.moveTo(x - 30, H - 112); g.lineTo(x - 180, H - 160); g.lineTo(x - 180, H - 40); g.fill();
    }
    parlak = .55;
  }
  // çizik ve titreme
  g.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 3; i++) if (Math.random() < .5) g.fillRect(Math.random() * W, 0, 1, H);
  g.fillStyle = `rgba(0,0,0,${Math.random() * .15})`; g.fillRect(0, 0, W, H);
  tex.needsUpdate = true;
  return parlak;
}
function kameraCiz() {
  const { g, t } = harita.kameraDoku, W = 256, H = 192;
  const etiket = ['KAM 1 · GİRİŞ', 'KAM 2 · ATRİUM', 'KAM 3 · GİYİM', 'KAM 4 · SİNEMA'];
  for (let k = 0; k < 4; k++) {
    const x0 = k * W;
    g.fillStyle = elektrikAcik ? '#1d2620' : '#0d110f'; g.fillRect(x0, 0, W, H);
    g.strokeStyle = 'rgba(160,200,170,.35)'; g.lineWidth = 2;
    const vx = x0 + W / 2 + (k - 1.5) * 18, vy = H * .42;
    for (const [a, b] of [[0, 0], [W, 0], [0, H], [W, H]]) { g.beginPath(); g.moveTo(x0 + a, b); g.lineTo(vx, vy); g.stroke(); }
    g.strokeRect(vx - 26, vy - 18, 52, 36);
    if (k === 2) { g.fillStyle = mankenMod === 'normal' ? 'rgba(220,220,210,.5)' : 'rgba(240,240,230,.85)'; for (let i = 0; i < 4; i++) { const mx = x0 + 60 + i * 42; g.fillRect(mx, 90, 10, 50); g.beginPath(); g.arc(mx + 5, 84, 7, 0, 7); g.fill(); } }
    if (k === 3 && (kam4 || filmAcik)) { g.fillStyle = `rgba(230,240,255,${.6 + Math.random() * .4})`; g.fillRect(vx - 24, vy - 16, 48, 32); const rg = g.createRadialGradient(vx, vy, 4, vx, vy, 90); rg.addColorStop(0, 'rgba(200,220,255,.35)'); rg.addColorStop(1, 'rgba(200,220,255,0)'); g.fillStyle = rg; g.fillRect(x0, 0, W, H); }
    if (k === 0 && nevzat.visible) { g.fillStyle = 'rgba(180,210,255,.6)'; g.fillRect(x0 + 120, 80, 14, 60); }
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(200,230,210,${Math.random() * .12})`; g.fillRect(x0, Math.random() * H, W, 1 + Math.random() * 2); }
    g.fillStyle = 'rgba(220,255,230,.9)'; g.font = '700 15px "Big Shoulders", monospace'; g.textAlign = 'left'; g.fillText(etiket[k], x0 + 8, 18);
    g.textAlign = 'right'; g.fillText(`${14 + durum.gece}.10.2026 ${ui.saat.textContent}`, x0 + W - 8, H - 8);
    if (Math.floor(zaman * 2) % 2) { g.fillStyle = '#ff4d4d'; g.beginPath(); g.arc(x0 + W - 14, 14, 4, 0, 7); g.fill(); }
  }
  t.needsUpdate = true;
}

// ------------------------------------------------------------------ ana döngü
const _v = new THREE.Vector3(), _r = new THREE.Vector3();
const HALI = new Set(['sinema', 'kuzeyKor', 'ofis', 'arsiv', 'plak', 'teknik']);
let lambaParlak = 1; let fenerYumusak = 1;

// zayıf cihazlarda çözünürlüğü kendiliğinden düşür
let kareOrt = 1 / 60, kareSay = 0, pikselOran = renderer.getPixelRatio();
function kaliteAyarla(dt) {
  if (DEMO || mod !== 'oyun') return;
  kareOrt += (dt - kareOrt) * .05; kareSay++;
  if (kareSay > 180 && kareOrt > 1 / 38 && pikselOran > .7) {
    pikselOran = Math.max(.7, pikselOran - .25); renderer.setPixelRatio(pikselOran); boyut(); kareSay = 0;
  }
}

function adim(dt) {
  zaman += dt; kaliteAyarla(dt);
  // zamanlayıcılar
  if (zamanlayicilar.length) {
    const simdi = zamanlayicilar.filter(z => z.t <= zaman); zamanlayicilar = zamanlayicilar.filter(z => z.t > zaman);
    simdi.sort((a, b) => a.t - b.t).forEach(z => z.fn());
  }

  // hareket
  if (mod === 'oyun') {
    let ileri = 0, yan = 0, kos = tus.has('ShiftLeft') || tus.has('ShiftRight');
    if (tus.has('KeyW') || tus.has('ArrowUp')) ileri += 1;
    if (tus.has('KeyS') || tus.has('ArrowDown')) ileri -= 1;
    if (tus.has('KeyD')) yan += 1;
    if (tus.has('KeyA')) yan -= 1;
    if (tus.has('ArrowLeft')) oyuncu.yaw += dt * 2.2;
    if (tus.has('ArrowRight')) oyuncu.yaw -= dt * 2.2;
    if (joyV.id !== null) { ileri = -joyV.y; yan = joyV.x; kos = Math.hypot(joyV.x, joyV.y) > .92; }
    const b = Math.hypot(ileri, yan); if (b > 1) { ileri /= b; yan /= b; }
    const hiz = (kos ? 4.4 : 2.5) * Math.min(1, b);
    oyuncu.hiz += (hiz - oyuncu.hiz) * Math.min(1, dt * 10);
    if (b > .05) {
      const fx = -Math.sin(oyuncu.yaw), fz = -Math.cos(oyuncu.yaw), rx = Math.cos(oyuncu.yaw), rz = -Math.sin(oyuncu.yaw);
      const mx = (fx * ileri + rx * yan) / b, mz = (fz * ileri + rz * yan) / b;
      const dx = mx * oyuncu.hiz * dt, dz = mz * oyuncu.hiz * dt;
      const eskiX = oyuncu.x, eskiZ = oyuncu.z;
      if (harita.gecerli(oyuncu.x + dx, oyuncu.z)) oyuncu.x += dx;
      if (harita.gecerli(oyuncu.x, oyuncu.z + dz)) oyuncu.z += dz;
      const yol = Math.hypot(oyuncu.x - eskiX, oyuncu.z - eskiZ);
      oyuncu.adimMesafe += yol; oyuncu.bob += yol * 2.6;
      if (oyuncu.adimMesafe > (kos ? .95 : .75)) { oyuncu.adimMesafe = 0; const o = harita.oda(oyuncu.x, oyuncu.z); ses.adim(kos, o && HALI.has(o.id)); }
    } else oyuncu.hiz *= .8;
  }
  const zy = harita.zeminY(oyuncu.x, oyuncu.z) + 1.62;
  oyuncu.y += (zy - oyuncu.y) * Math.min(1, dt * 8);

  // kamera
  if (mod === 'baslik' && !DEMO_ELLE) {
    const t = zaman * .05;
    oyuncu.x = -20 + Math.sin(t) * 9; oyuncu.z = Math.sin(t * 1.7) * .8; oyuncu.yaw = Math.PI / 2 + .25 + Math.sin(t * 1.3) * .35; oyuncu.pitch = .04 + Math.sin(t * 2.1) * .05; oyuncu.y = 1.62;
    fenerAcik = true; fenerVar = true;
  }
  kamera.position.set(oyuncu.x, oyuncu.y + Math.sin(oyuncu.bob) * .035 * Math.min(1, oyuncu.hiz / 2), oyuncu.z);
  kamera.rotation.set(oyuncu.pitch, oyuncu.yaw, Math.sin(oyuncu.bob * .5) * .004 * oyuncu.hiz);

  // fener ve pil
  let fenerGuc = 0;
  if (fenerVar && fenerAcik) {
    if (mod === 'oyun') pil = Math.max(0, pil - dt * (elektrikAcik ? .11 : .2));
    fenerGuc = pil > 15 ? 1 : pil > 0 ? (Math.random() < .08 ? .2 : .75) : (Math.random() < .3 ? .25 : .12);
  }
  if (titreSure > 0) { titreSure -= dt; if (Math.random() < .25) fenerGuc *= Math.random(); }
  // göz uyumu: fener yakındaki yüzeyi beyaza boğmasın
  let onMesafe = 9;
  if (fenerGuc > 0) {
    const fx = -Math.sin(oyuncu.yaw), fz = -Math.cos(oyuncu.yaw), cp = Math.cos(oyuncu.pitch);
    for (let d = .3; d < 9; d += .3) if (!harita.gecerli(oyuncu.x + fx * d * cp, oyuncu.z + fz * d * cp, .05)) { onMesafe = d; break; }
    if (oyuncu.pitch < -.05) onMesafe = Math.min(onMesafe, 1.62 / Math.sin(-oyuncu.pitch));
  }
  fenerYumusak += (Math.min(1, Math.max(.07, Math.pow(onMesafe / 5, 1.6))) - fenerYumusak) * Math.min(1, dt * 6);
  fener.intensity = fenerGuc * 60 * fenerYumusak;
  ui.pil.style.setProperty('--p', pil + '%'); ui.pil.classList.toggle('dusuk', pil < 20);
  ui.fenerBtn.classList.toggle('kapali', !fenerAcik);

  // ortam ışığı: elektrik, titreme, sabah
  let lamba = elektrikAcik ? 1 : 0;
  if (titreSure > 0) lamba *= Math.random() < .5 ? .1 : 1;
  lambaParlak += (lamba - lambaParlak) * Math.min(1, dt * (titreSure > 0 ? 30 : 4));
  const sab = sabahT >= 0 ? Math.min(1, (sabahT += dt / 9)) : 0;
  hemi.intensity = .07 + lambaParlak * .3 + sab * .25;
  harita.lambaMalz.color.setScalar(.05 + lambaParlak * .4 + sab * .3);
  for (const t of harita.tabelalar) t.material.color.setScalar(.12 + lambaParlak * .5 + sab * .3);
  acilIsik.intensity = (1 - lambaParlak) * 26 * (sab ? 0 : 1) * (.8 + Math.sin(zaman * 3) * .2);
  ayIsik.intensity = 12 + sab * 18; ayIsik.color.setRGB(.5 + sab * .5, .62 + sab * .2, .85 - sab * .2);
  if (sab) harita.catiCam.material.color.setRGB(.19 + sab * .75, .26 + sab * .45, .37 + sab * .15);
  ofisIsik.intensity = 7 * (.4 + lambaParlak * .6);

  // duman / sis
  dumanV += (dumanHedef - dumanV) * Math.min(1, dt * .6);
  const sisR = _v.set(.02, .027, .04).lerp(_r.set(.09, .07, .055), dumanV);
  if (sab) sisR.lerp(_r.set(.3, .25, .27), sab);
  sahne.fog.color.setRGB(sisR.x, sisR.y, sisR.z); sahne.background.copy(sahne.fog.color);
  sahne.fog.density = (.05 + dumanV * .06) * (1 - sab * .6);
  dumanMalz.opacity = dumanV * .55; duman.position.set(oyuncu.x, 0, oyuncu.z);
  if (dumanV > .01) { const a = dumanGeo.attributes.position.array; for (let i = 0; i < DUMAN_N; i++) { a[i * 3 + 1] += dt * .12; if (a[i * 3 + 1] > 4) a[i * 3 + 1] = 0; a[i * 3] += Math.sin(zaman + i) * dt * .05; } dumanGeo.attributes.position.needsUpdate = true; }

  // sinema
  if (filmAcik) { filmT += dt; const p = filmCiz(filmT); harita.perdeMalz.color.setScalar(.9); perdeIsik.intensity = p * 40 * (.85 + Math.random() * .15); }
  else { harita.perdeMalz.color.setScalar(.1); perdeIsik.intensity = 0; }
  if (zaman - sonKameraCiz > .12) { sonKameraCiz = zaman; kameraCiz(); }
  if (bilet.visible) bilet.material.color.setScalar(.7 + Math.sin(zaman * 4) * .3);

  // Nevzat
  nevzatD.opak += (nevzatD.hedef - nevzatD.opak) * Math.min(1, dt * 1.2);
  if (nevzat.visible) {
    nevzat.traverse(c => { if (c.material) c.material.opacity = c.userData.op * nevzatD.opak; });
    if (nevzatD.opak < .01 && nevzatD.hedef === 0) nevzat.visible = false;
    nevzat.position.y = Math.sin(zaman * 1.4) * .03;
    const uzak = Math.hypot(oyuncu.x - nevzat.position.x, oyuncu.z - nevzat.position.z);
    if (nevzatD.yol.length) {
      const w = nevzatD.yol[0], dx = w.x - nevzat.position.x, dz = w.z - nevzat.position.z, d = Math.hypot(dx, dz);
      const bekle = uzak > 7.5;
      if (!bekle) { const s = Math.min(d, 1.55 * dt); nevzat.position.x += dx / (d || 1) * s; nevzat.position.z += dz / (d || 1) * s; nevzatD.adimT += dt; if (nevzatD.adimT > .62) { nevzatD.adimT = 0; ses.uzakAdim({ x: nevzat.position.x, y: 0, z: nevzat.position.z }, 1); } }
      const hedefYon = bekle ? Math.atan2(oyuncu.x - nevzat.position.x, oyuncu.z - nevzat.position.z) : Math.atan2(dx, dz);
      let fark = hedefYon - nevzat.rotation.y; fark = Math.atan2(Math.sin(fark), Math.cos(fark)); nevzat.rotation.y += fark * Math.min(1, dt * 4);
      if (d < .12) nevzatD.yol.shift();
    } else if (nevzatD.res && uzak < 6.5) { const r = nevzatD.res; nevzatD.res = null; r(); }
    else if (nevzatD.mod === 'yanina') {
      const rx = Math.cos(oyuncu.yaw), rz = -Math.sin(oyuncu.yaw);
      nevzat.position.x += (oyuncu.x + rx * 1.1 + Math.sin(oyuncu.yaw) * .3 - nevzat.position.x) * Math.min(1, dt * 3);
      nevzat.position.z += (oyuncu.z + rz * 1.1 + Math.cos(oyuncu.yaw) * .3 - nevzat.position.z) * Math.min(1, dt * 3);
      nevzat.rotation.y = oyuncu.yaw + Math.PI;
    } else if (!nevzatD.yol.length && nevzatD.mod === 'goster') {
      let fark = Math.atan2(oyuncu.x - nevzat.position.x, oyuncu.z - nevzat.position.z) - nevzat.rotation.y; fark = Math.atan2(Math.sin(fark), Math.cos(fark)); nevzat.rotation.y += fark * Math.min(1, dt * 2);
    }
  }

  // bölge ve yakınlık beklentileri
  const oda = harita.oda(oyuncu.x, oyuncu.z);
  if (mod === 'oyun' && bolgeler.length && oda) { const b = bolgeler.filter(x => x.oda === oda.id); if (b.length) { bolgeler = bolgeler.filter(x => x.oda !== oda.id); b.forEach(x => x.res()); } }
  if (mod === 'oyun' && yaklasanlar.length) { yaklasanlar = yaklasanlar.filter(y => { const p = noktaPos(y.id); if (Math.hypot(p.x - oyuncu.x, p.z - oyuncu.z) < y.d) { y.res(); return false; } return true; }); }

  // etkileşim odağı
  odak = null;
  if (mod === 'oyun') {
    kamera.getWorldDirection(_v);
    let enIyi = 0;
    for (const [id, e] of etkilesimler) {
      const p = noktaPos(id); if (!p) continue;
      const dh = Math.hypot(p.x - oyuncu.x, p.z - oyuncu.z);
      if (dh > 2.4 || Math.abs(p.y - kamera.position.y) > 2.2) continue;
      _r.copy(p).sub(kamera.position).normalize();
      const nokta = _r.dot(_v);
      if (nokta < .55 && dh > 1.1) continue;
      const puan = nokta - dh * .1;
      if (puan > enIyi || !odak) { enIyi = puan; odak = id; }
    }
  }
  const etk = odak ? etkilesimler.get(odak) : null;
  ui.nisan.classList.toggle('var', !!etk);
  if (etk) { const s = ui.nisan.querySelector('span'); const h = dokunmatik ? etk.etiket : `<kbd>E</kbd>${etk.etiket}`; if (s.innerHTML !== h) s.innerHTML = h; }
  ui.etkBtn.hidden = !(etk && dokunmatik);
  if (etk) { const s = ui.etkBtn.querySelector('span'); if (s.textContent !== etk.etiket) s.textContent = etk.etiket; }

  // pusula
  const hp = hedefNokta && mod !== 'baslik' ? noktaPos(hedefNokta) : null;
  ui.pusula.hidden = !hp;
  if (hp) {
    kamera.updateMatrixWorld();
    _v.copy(hp).applyMatrix4(kamera.matrixWorldInverse);
    const aci = Math.atan2(_v.x, -_v.z);
    ui.pusula.querySelector('svg').style.transform = `rotate(${aci}rad)`;
    ui.pusula.querySelector('span').textContent = Math.round(Math.hypot(hp.x - oyuncu.x, hp.z - oyuncu.z)) + ' m';
  }

  // ses
  ses.dinleyici(kamera);
  ses.yagmur(Math.max(0, Math.min(1, 1 - (oyuncu.x + 40) / 20)));

  if (!CIZME) renderer.render(sahne, kamera);
}

function boyut() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); kamera.aspect = w / h; kamera.fov = w / h < 1.2 ? 80 : 72; kamera.updateProjectionMatrix();
}
addEventListener('resize', boyut); boyut();

let DEMO_ELLE = false;
let onceki = performance.now();
function dongu(t) { requestAnimationFrame(dongu); const dt = Math.min(.05, (t - onceki) / 1000); onceki = t; adim(dt); }

// ------------------------------------------------------------------ başlangıç
anaMenu();
ui.joy.hidden = true;
if (!DEMO) requestAnimationFrame(dongu); else adim(.016);
setTimeout(perdeAc, 50);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

// test ve tanıtım videosu için küçük kapılar
window.__sv = {
  get durum() { return durum; }, oyuncu, harita, get mod() { return mod; }, get odak() { return odak; }, get hedef() { return hedefNokta; },
  etkilesimler, zamanAl: () => zaman,
  kare: (dt = 1 / 30) => adim(dt),
  git: (x, z, yaw, pitch = 0) => { oyuncu.x = x; oyuncu.z = z; if (yaw !== undefined) oyuncu.yaw = yaw; oyuncu.pitch = pitch; },
  elle: v => { DEMO_ELLE = v; },
  etkiles: id => { const e = etkilesimler.get(id || odak); if (!e) return false; etkilesimler.delete(id || odak); e.res(); return true; },
  noktaPos, yeniOyun, devamEt, anaMenu,
  ilerle: () => { if (mod === 'diyalog') diyalogIlerle(); else if (mod === 'incele') inceleKapat(); else if (!ui.geceSonu.hidden) ui.geceSonu.querySelector('.dugme').click(); },
  sec: i => diyalogSec(i),
  diyalog: () => diyalogD && { i: diyalogD.i, n: diyalogD.satirlar.length, secimler: diyalogD.secimler },
  goster: { temizle: () => { telsizKuyruk = []; telsizSu = null; ui.telsiz.hidden = true; ui.anlati.hidden = true; if (diyalogD) { diyalogD = null; ui.diyalog.hidden = true; mod = 'oyun'; } }, gece: n => { ui.geceAd.textContent = `GECE ${n}`; }, incele: (tur, b, m, h) => inceleGoster(tur, b, m, () => {}, h), inceleKapat: () => { if (inceleRes) inceleKapat(); }, diyalog: (s, sec) => diyalogBaslat(s, sec, () => {}), telsiz: (s, stil) => telsizEkle(s, stil, () => {}), anlati: m => anlatiGoster(m, 30), hedef: hedefAyarla, saat: saatYaz, hatira: id => { durum.hatiralar.includes(id) || durum.hatiralar.push(id); envanterCiz(id); } },
  ui, fener: v => { fenerVar = true; fenerAcik = v; }, set pil(v) { pil = v; },
  olay: { elektrik, titret, film: v => { filmAcik = v; filmT = 0; }, kamera4: v => { kam4 = v; }, duman: v => { dumanHedef = dumanV = v; }, sabah, koltukIsigi, manken: mankenModu, nevzat: nevzatMod, nevzatYol: yol => nevzatYol(yol, () => {}), nevzatPos: (x, z, ry) => { nevzat.position.set(x, 0, z); nevzat.rotation.y = ry; nevzatD.opak = nevzatD.hedef = 1; nevzat.visible = true; } },
};
