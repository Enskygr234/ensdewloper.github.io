// Yıldız Çarşısı: bütün AVM koddan kuruluyor. Yürünebilir alanlar dikdörtgen; duvarlar bu alanların
// boş kalan kenarlarından kendiliğinden çıkarılıyor. Çarpışma da aynı dikdörtgenlerle yapılıyor.
import * as THREE from '../lib/three.module.js';
import { Toplayici, yaziDokusu, tohumlu } from './yardimci.js';

// x doğu, z güney. Yükseklik h tavan.
export const ODALAR = [
  { id: 'giris',   ad: 'Ana giriş',      x1: -40, z1: -6,  x2: -32, z2: 6,  h: 5.0, ust: 0xcfc6b4, alt: 0x5b5146 },
  { id: 'korBati', ad: 'Batı koridoru',  x1: -32, z1: -4,  x2: -8,  z2: 4,  h: 4.2, ust: 0xd8cfbd, alt: 0x6a5d4e },
  { id: 'atrium',  ad: 'Atrium',         x1: -8,  z1: -10, x2: 8,   z2: 10, h: 9.0, ust: 0xd2c8b3, alt: 0x655848 },
  { id: 'korDogu', ad: 'Doğu koridoru',  x1: 8,   z1: -4,  x2: 32,  z2: 4,  h: 4.2, ust: 0xd8cfbd, alt: 0x6a5d4e },
  { id: 'ofis',    ad: 'Güvenlik ofisi', x1: 32,  z1: -5,  x2: 41,  z2: 5,  h: 3.2, ust: 0x9fa7a3, alt: 0x3f4846 },
  { id: 'arsiv',   ad: 'Arşiv',          x1: 41,  z1: -2,  x2: 45,  z2: 2,  h: 3.0, ust: 0x8e877a, alt: 0x40392f },
  { id: 'kuzeyKor',ad: 'Sinema koridoru',x1: -3,  z1: -26, x2: 3,   z2: -10,h: 4.0, ust: 0x7d2f35, alt: 0x3a1a1d },
  { id: 'sinema',  ad: 'Yıldız Sineması',x1: -11, z1: -42, x2: 11,  z2: -26,h: 9.0, ust: 0x4a1d22, alt: 0x2a1013 },
  { id: 'guneyKor',ad: 'Yemek koridoru', x1: -3,  z1: 10,  x2: 3,   z2: 18, h: 4.0, ust: 0xd8cfbd, alt: 0x6a5d4e },
  { id: 'yemek',   ad: 'Yemek katı',     x1: -13, z1: 18,  x2: 13,  z2: 32, h: 6.0, ust: 0xe0d6bf, alt: 0x7a5a3c },
  { id: 'plak',    ad: 'Plak Dünyası',   x1: 16,  z1: -11, x2: 24,  z2: -4, h: 3.6, ust: 0x2f3b55, alt: 0x1d2335 },
  { id: 'giyim',   ad: 'Kuzey Giyim',    x1: -24, z1: -11, x2: -16, z2: -4, h: 3.6, ust: 0xe6e1d6, alt: 0x8d8478 },
  { id: 'oyuncak', ad: 'Oyuncakçı Tuna', x1: -16, z1: 4,   x2: -8.4,  z2: 11, h: 3.6, ust: 0xf0d48a, alt: 0x8a5a2b },
  { id: 'kirtasiye',ad:'Kırtasiye Kalem',x1: 8.4,   z1: 4,   x2: 16,  z2: 11, h: 3.6, ust: 0xcfe0d6, alt: 0x4d6b5d },
  { id: 'teknik',  ad: 'Teknik oda',     x1: 24,  z1: 4,   x2: 32,  z2: 11, h: 3.4, ust: 0x77807a, alt: 0x3a403c },
];

const KAPALI_DUKKANLAR = [
  { x1: -32, x2: -24, z: -4, ad: 'SAATÇİ NURİ', renk: '#e8c27a' },
  { x1: -16, x2: -8, z: -4, ad: 'LALE KUAFÖR', renk: '#ff8fb4' },
  { x1: 8, x2: 16, z: -4, ad: 'BİLGİSAYAR DÜNYASI', renk: '#7fd3ff' },
  { x1: 24, x2: 32, z: -4, ad: 'ALTIN KUYUMCU', renk: '#ffd257' },
  { x1: -32, x2: -24, z: 4, ad: 'OPTİK GÖRÜŞ', renk: '#9fe6c4' },
  { x1: -24, x2: -16, z: 4, ad: 'AYAKKABI PAZARI', renk: '#ff9f6e' },
  { x1: 16, x2: 24, z: 4, ad: 'FOTOĞRAFÇI IŞIK', renk: '#c7b4ff' },
];

const ACIK_DUKKANLAR = [
  { id: 'plak', x1: 16, x2: 24, z: -4, ad: 'PLAK DÜNYASI', renk: '#ff6ec7' },
  { id: 'giyim', x1: -24, x2: -16, z: -4, ad: 'KUZEY GİYİM', renk: '#9cc9ff' },
  { id: 'oyuncak', x1: -16, x2: -8.4, z: 4, ad: 'OYUNCAKÇI TUNA', renk: '#ffd84d' },
  { id: 'kirtasiye', x1: 8.4, x2: 16, z: 4, ad: 'KIRTASİYE KALEM', renk: '#7dffb0' },
];

export class Harita {
  constructor(sahne) {
    this.sahne = sahne;
    this.engeller = [];      // {x1,z1,x2,z2}
    this.noktalar = {};      // etkileşim noktaları: id -> Vector3
    this.lambalar = [];      // tavan lambaları (malzeme rengiyle açılıp kapanır)
    this.tabelalar = [];
    this.guncelle = [];      // her karede çağrılacaklar
    this.rnd = tohumlu(1996);
    this.grup = new THREE.Group(); sahne.add(this.grup);

    this.T = new Toplayici();          // mat duvarlar, mobilyalar
    this.L = new Toplayici();          // lamba panelleri (ışık veren)
    this.malz = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .86, metalness: 0 });

    this._zemin();
    this._duvarlar();
    this._tavanlar();
    this._giris();
    this._atrium();
    this._dukkanlar();
    this._plak(); this._giyim(); this._oyuncak(); this._kirtasiye(); this._teknik();
    this._ofis();
    this._sinema();
    this._yemek();
    this._kontrolNoktalari();

    const m = this.T.mesh(this.malz); m.receiveShadow = true; this.grup.add(m);
    this.lambaMalz = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0x333333 });
    this.grup.add(this.L.mesh(this.lambaMalz));
  }

  // ---------------------------------------------------------------- çarpışma
  oda(x, z) { return ODALAR.find(o => x >= o.x1 && x <= o.x2 && z >= o.z1 && z <= o.z2); }
  zeminY(x, z) {
    if (x > -11 && x < 11 && z > -37.45 && z < -27.95) return Math.min(4, Math.floor((z + 37.45) / 1.9)) * .12;
    return 0;
  }
  gecerli(x, z, r = .32) {
    for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r]]) if (!this.oda(x + dx, z + dz)) return false;
    for (const e of this.engeller) if (x + r > e.x1 && x - r < e.x2 && z + r > e.z1 && z - r < e.z2) return false;
    return true;
  }
  engel(x1, z1, x2, z2) { this.engeller.push({ x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2) }); }
  kutuEngel(w, h, d, x, y, z, renk) { this.T.kutu(w, h, d, x, y, z, renk); this.engel(x - w / 2, z - d / 2, x + w / 2, z + d / 2); }

  // ---------------------------------------------------------------- zemin
  _zemin() {
    const doku = yaziDokusu((g, w, h) => {
      const n = 4, s = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const a = (i + j) % 2 ? '#bfb29a' : '#d9cfbb';
        g.fillStyle = a; g.fillRect(i * s, j * s, s, s);
        for (let k = 0; k < 140; k++) { g.fillStyle = `rgba(${(i + j) % 2 ? '90,75,55' : '120,105,85'},${Math.random() * .12})`; g.fillRect(i * s + Math.random() * s, j * s + Math.random() * s, 2, 2); }
      }
      g.strokeStyle = 'rgba(60,50,40,.55)'; g.lineWidth = 3;
      for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
    }, 512, 512);
    doku.wrapS = doku.wrapT = THREE.RepeatWrapping; doku.repeat.set(90 / 4.8, 76 / 4.8);
    const zemin = new THREE.Mesh(new THREE.PlaneGeometry(90, 76), new THREE.MeshStandardMaterial({ map: doku, roughness: .32, metalness: .05 }));
    zemin.rotation.x = -Math.PI / 2; zemin.position.set(2.5, 0, -5); zemin.receiveShadow = true;
    this.grup.add(zemin);

    const halı = (o, renk, desen) => {
      const d = yaziDokusu((g, w, h) => {
        g.fillStyle = renk; g.fillRect(0, 0, w, h);
        for (let k = 0; k < 2200; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .18})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
        if (desen) { g.strokeStyle = desen; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(64 + (i % 4) * 128, 64 + Math.floor(i / 4) * 128 * 2, 30, 0, 7); g.stroke(); } }
      }, 512, 512);
      d.wrapS = d.wrapT = THREE.RepeatWrapping; d.repeat.set((o.x2 - o.x1) / 4, (o.z2 - o.z1) / 4);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(o.x2 - o.x1, o.z2 - o.z1), new THREE.MeshStandardMaterial({ map: d, roughness: .95 }));
      p.rotation.x = -Math.PI / 2; p.position.set((o.x1 + o.x2) / 2, .006, (o.z1 + o.z2) / 2); this.grup.add(p);
    };
    const bul = id => ODALAR.find(o => o.id === id);
    halı(bul('sinema'), '#5a1820', 'rgba(230,180,90,.25)');
    halı(bul('kuzeyKor'), '#5a1820', 'rgba(230,180,90,.25)');
    halı(bul('ofis'), '#4a5254');
    halı(bul('arsiv'), '#4a4740');
    halı(bul('teknik'), '#55595a');
    halı(bul('plak'), '#2b2f45', 'rgba(255,110,199,.18)');
  }

  // ---------------------------------------------------------------- duvarlar (kendiliğinden)
  _duvarlar() {
    const step = .5, T = this.T;
    const icinde = (x, z) => ODALAR.find(o => x > o.x1 && x < o.x2 && z > o.z1 && z < o.z2);
    for (const o of ODALAR) {
      const kenarlar = [
        { yon: 'z', sabit: o.z1, a: o.x1, b: o.x2, dis: -1 }, { yon: 'z', sabit: o.z2, a: o.x1, b: o.x2, dis: 1 },
        { yon: 'x', sabit: o.x1, a: o.z1, b: o.z2, dis: -1 }, { yon: 'x', sabit: o.x2, a: o.z1, b: o.z2, dis: 1 },
      ];
      for (const k of kenarlar) {
        const parcalar = []; let cur = null;
        for (let s = k.a; s < k.b - 1e-6; s += step) {
          const m = s + step / 2;
          const [px, pz] = k.yon === 'z' ? [m, k.sabit + k.dis * .05] : [k.sabit + k.dis * .05, m];
          const d = icinde(px, pz);
          let tip = null;
          if (!d) tip = { y1: 0, y2: o.h }; else if (d.h < o.h) tip = { y1: d.h, y2: o.h };
          if (tip && cur && cur.y1 === tip.y1 && cur.y2 === tip.y2 && Math.abs(cur.b - s) < 1e-6) cur.b = s + step;
          else { if (cur) parcalar.push(cur); cur = tip ? { ...tip, a: s, b: s + step } : null; }
        }
        if (cur) parcalar.push(cur);
        for (const p of parcalar) {
          const L = p.b - p.a, orta = (p.a + p.b) / 2, kal = .3, cap = k.sabit + k.dis * kal / 2;
          const kutu = (y1, y2, renk) => {
            if (k.yon === 'z') T.kutu(L, y2 - y1, kal, orta, (y1 + y2) / 2, cap, renk);
            else T.kutu(kal, y2 - y1, L, cap, (y1 + y2) / 2, orta, renk);
          };
          if (p.y1 === 0) { kutu(0, 1.05, o.alt); kutu(1.05, 1.15, 0x2d2620); kutu(1.15, p.y2, o.ust); }
          else { kutu(p.y1, p.y1 + .25, 0x3a332b); kutu(p.y1 + .25, p.y2, o.ust); }
        }
      }
    }
  }

  _tavanlar() {
    for (const o of ODALAR) {
      if (o.id === 'atrium') continue;
      const w = o.x2 - o.x1, d = o.z2 - o.z1, cx = (o.x1 + o.x2) / 2, cz = (o.z1 + o.z2) / 2;
      this.T.kutu(w, .1, d, cx, o.h + .05, cz, o.id === 'sinema' ? 0x1a0c0e : 0x4b4740);
      // floresan paneller
      const uzun = w >= d;
      const n = Math.max(1, Math.floor((uzun ? w : d) / 4.5));
      if (['sinema', 'arsiv'].includes(o.id)) continue;
      for (let i = 0; i < n; i++) {
        const t = (i + .5) / n;
        const x = uzun ? o.x1 + t * w : cx, z = uzun ? cz : o.z1 + t * d;
        this.L.kutu(uzun ? 1.8 : .22, .05, uzun ? .22 : 1.8, x, o.h - .04, z, 0xf4f6ff);
        if (o.id === 'yemek') this.L.kutu(1.8, .05, .22, x, o.h - .04, z + 5, 0xf4f6ff), this.L.kutu(1.8, .05, .22, x, o.h - .04, z - 5, 0xf4f6ff);
      }
    }
  }

  tabela(metin, renk, w, h, x, y, z, ry = 0, zemin = '#141018') {
    const doku = yaziDokusu((g, W, H) => {
      g.fillStyle = zemin; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 6; g.strokeRect(6, 6, W - 12, H - 12);
      let fs = H * .6; g.font = `900 ${fs}px "Big Shoulders", Impact, sans-serif`;
      while (g.measureText(metin).width > W * .88 && fs > 10) { fs -= 4; g.font = `900 ${fs}px "Big Shoulders", Impact, sans-serif`; }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = renk; g.shadowBlur = H * .18; g.fillStyle = renk;
      g.fillText(metin, W / 2, H / 2 + fs * .04); g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(metin, W / 2, H / 2 + fs * .04);
    }, 1024, Math.round(1024 * h / w));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: doku, color: 0x777777 }));
    m.position.set(x, y, z); m.rotation.y = ry; this.grup.add(m); this.tabelalar.push(m);
    return m;
  }

  duz(doku, w, h, x, y, z, ry = 0, rx = 0, temel = false) {
    const mat = temel ? new THREE.MeshBasicMaterial({ map: doku }) : new THREE.MeshStandardMaterial({ map: doku, roughness: .9 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); this.grup.add(m); return m;
  }

  // ---------------------------------------------------------------- giriş: cam kapılar, dışarıda yağmurlu gece
  _giris() {
    const T = this.T;
    const disari = yaziDokusu((g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05070d'); gr.addColorStop(.62, '#0d1526'); gr.addColorStop(.64, '#161a20'); gr.addColorStop(1, '#0a0b0d');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (const [x, s] of [[.18, 1], [.55, .7], [.86, .9]]) {
        const lx = x * w, ly = h * .3;
        const rg = g.createRadialGradient(lx, ly, 2, lx, ly, 90 * s); rg.addColorStop(0, 'rgba(255,190,110,.95)'); rg.addColorStop(1, 'rgba(255,150,60,0)');
        g.fillStyle = rg; g.fillRect(lx - 100, ly - 100, 200, 200);
        g.fillStyle = '#1b1d22'; g.fillRect(lx - 2, ly, 4, h * .34);
        const yg = g.createRadialGradient(lx, h * .66, 2, lx, h * .66, 120 * s); yg.addColorStop(0, 'rgba(255,170,90,.35)'); yg.addColorStop(1, 'rgba(255,170,90,0)');
        g.fillStyle = yg; g.fillRect(lx - 130, h * .6, 260, 80);
      }
      g.strokeStyle = 'rgba(170,190,220,.18)'; g.lineWidth = 1;
      for (let i = 0; i < 260; i++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 14); g.stroke(); }
    }, 1024, 512);
    this.duz(disari, 14, 7, -41.2, 3, 0, Math.PI / 2, 0, true);
    // kapı çerçeveleri ve cam
    const cam = new THREE.MeshStandardMaterial({ color: 0x9fb8d0, transparent: true, opacity: .16, roughness: .05, metalness: .3, depthWrite: false });
    const camP = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 4.2), cam); camP.position.set(-39.8, 2.1, 0); camP.rotation.y = Math.PI / 2; this.grup.add(camP);
    // duvar zaten x=-40'ta; camın göründüğü yeri açmak için duvarın önüne bir "boşluk" kaplıyoruz: duvarın iç yüzünü koyu cam görüntüsüyle örtüyoruz
    this.duz(disari, 9.4, 4.2, -39.83, 2.1, 0, Math.PI / 2, 0, true);
    for (const z of [-4.7, -2.35, 0, 2.35, 4.7]) T.kutu(.16, 4.3, .14, -39.78, 2.15, z, 0x23272c);
    T.kutu(.2, .18, 9.6, -39.78, 4.25, 0, 0x23272c); T.kutu(.2, .12, 9.6, -39.78, .06, 0, 0x23272c);
    // kapı kolları ve zincir
    T.kutu(.08, .9, .06, -39.68, 1.1, -.25, 0xb9b9b9); T.kutu(.08, .9, .06, -39.68, 1.1, .25, 0xb9b9b9);
    for (let i = 0; i < 7; i++) T.kutu(.06, .06, .14, -39.62, .9 + Math.sin(i) * .05, -.45 + i * .15, 0x8a8a8a);
    T.kutu(.12, .2, .16, -39.6, .82, 0, 0xc9a43a);
    this.noktalar.anaKapi = new THREE.Vector3(-39.4, 1.2, 0);
    // giriş paspası ve banko
    T.kutu(4, .02, 6, -37.5, .012, 0, 0x2b2b30);
    this.tabela('YILDIZ ÇARŞISI', '#ffd36b', 7, 1.3, -32.2, 4.2, 0, Math.PI / 2, '#0d0b10');
    // kapanış afişi
    const afis = yaziDokusu((g, w, h) => {
      g.fillStyle = '#efe6d2'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#b3262e'; g.fillRect(0, 0, w, h * .22);
      g.fillStyle = '#fff'; g.font = '900 64px "Big Shoulders", Impact'; g.textAlign = 'center'; g.fillText('KAPANIYORUZ', w / 2, 78);
      g.fillStyle = '#2a1d14'; g.font = '700 40px "Big Shoulders", Impact'; g.fillText('1989 – 2026', w / 2, 170);
      g.font = 'italic 30px Literata, Georgia'; g.fillText('37 yıl boyunca bizi tercih', w / 2, 240); g.fillText('ettiğiniz için teşekkürler.', w / 2, 280);
      g.font = '700 26px "Big Shoulders", Impact'; g.fillStyle = '#b3262e'; g.fillText('BİNA 20 EKİM\'DE YIKILACAKTIR', w / 2, 360);
    }, 512, 400);
    this.duz(afis, 1.6, 1.25, -39.75, 2.2, -5.4, Math.PI / 2);
  }

  // ---------------------------------------------------------------- atrium
  _atrium() {
    const T = this.T;
    // üst kat balkonu (yürünmez, sadece görüntü)
    const kat = 4.4, en = 1.6;
    T.kutu(16, .3, en, 0, kat, -10 + en / 2, 0x8f8576); T.kutu(16, .3, en, 0, kat, 10 - en / 2, 0x8f8576);
    T.kutu(en, .3, 16 - 2 * en, -8 + en / 2, kat, 0, 0x8f8576); T.kutu(en, .3, 16 - 2 * en, 8 - en / 2, kat, 0, 0x8f8576);
    const kor = (x1, z1, x2, z2) => { // korkuluk
      const w = Math.abs(x2 - x1) || .06, d = Math.abs(z2 - z1) || .06;
      T.kutu(w, .06, d, (x1 + x2) / 2, kat + 1.1, (z1 + z2) / 2, 0xb8b2a6);
      const n = Math.floor(Math.max(w, d) / 1.2);
      for (let i = 0; i <= n; i++) T.kutu(.05, 1, .05, x1 + (x2 - x1) * i / n, kat + .6, z1 + (z2 - z1) * i / n, 0x9e978a);
    };
    const i = 8 - en;
    kor(-i, -i, i, -i); kor(-i, i, i, i); kor(-i, -i, -i, i); kor(i, -i, i, i);
    // balkon arkasındaki karanlık dükkân camları
    for (const [x, z, ry] of [[-4, -9.84, 0], [4, -9.84, 0], [-4, 9.84, Math.PI], [4, 9.84, Math.PI]]) {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.6), new THREE.MeshStandardMaterial({ color: 0x0b0f16, roughness: .1, metalness: .5 }));
      g.position.set(x, kat + 1.5, z); g.rotation.y = ry; this.grup.add(g);
    }
    // tavan: çatı penceresi
    T.kutu(16, .2, 20, 0, 9.1, 0, 0x2c2a27);
    const ay = new THREE.Mesh(new THREE.PlaneGeometry(9, 12), new THREE.MeshBasicMaterial({ color: 0x31435f }));
    ay.rotation.x = Math.PI / 2; ay.position.set(0, 8.98, 0); this.grup.add(ay); this.catiCam = ay;
    for (let k = -4; k <= 4; k += 1.5) T.kutu(.12, .14, 12, k, 8.92, 0, 0x1b1a19);
    for (let k = -6; k <= 6; k += 2) T.kutu(9, .14, .12, 0, 8.92, k, 0x1b1a19);
    // kuru havuz
    T.silindir(2.3, 2.4, .55, 0, .27, 0, 0x8b8273, 24);
    T.silindir(2.0, 2.0, .05, 0, .53, 0, 0x3b4148, 24);
    T.silindir(.35, .45, 1.6, 0, .9, 0, 0x8b8273, 12);
    T.silindir(.9, .3, .25, 0, 1.75, 0, 0x8b8273, 14);
    for (let k = 0; k < 9; k++) { const a = k * 2.1; T.kutu(.25, .04, .18, Math.cos(a) * 1.3, .56, Math.sin(a) * 1.3, [0x8a6d3b, 0xb0a28a, 0x6a6a6a][k % 3], a); }
    this.engel(-2.4, -2.4, 2.4, 2.4);
    // banklar ve saksılar
    for (const [x, z, ry] of [[-5.5, -2.6, 0], [-5.5, 2.6, 0], [5.5, -2.6, 0], [5.5, 2.6, 0]]) {
      T.kutu(2.2, .08, .55, x, .48, z, 0x6b4a2e); T.kutu(2.2, .5, .06, x, .75, z + (z > 0 ? .26 : -.26), 0x6b4a2e);
      T.kutu(.08, .45, .5, x - 1, .22, z, 0x333333); T.kutu(.08, .45, .5, x + 1, .22, z, 0x333333);
      this.engel(x - 1.1, z - .3, x + 1.1, z + .3);
    }
    for (const [x, z] of [[-6.8, -8.8], [6.8, -8.8], [-6.8, 8.8], [6.8, 8.8]]) {
      T.kutu(1, .8, 1, x, .4, z, 0x7b6f5f); T.kutu(.9, .05, .9, x, .8, z, 0x3a2a1c);
      for (let k = 0; k < 5; k++) T.koni(.12, 1.1 + k * .1, x + Math.sin(k * 2) * .2, 1.3, z + Math.cos(k * 2) * .2, 0x5b5038, 5, k);
      this.engel(x - .5, z - .5, x + .5, z + .5);
    }
    // yürüyen merdiven (güneybatı köşesinden üst kata)
    const mx1 = -7.4, mx2 = -1.6, mz = 8.2;
    const n = 14;
    for (let k = 0; k < n; k++) {
      const t = k / (n - 1), x = mx1 + (mx2 - mx1) * t, y = .1 + t * (kat - .1);
      T.kutu((mx2 - mx1) / n + .02, .18, 1.3, x, y, mz, 0x5d5d60);
    }
    const egim = Math.atan2(kat, mx2 - mx1), boy = Math.hypot(kat, mx2 - mx1);
    for (const dz of [-.75, .75]) {
      T.kutu(boy, .9, .1, (mx1 + mx2) / 2, kat / 2 + .55, mz + dz, 0x2d2f33, 0, 0, egim);
      T.kutu(boy, .08, .14, (mx1 + mx2) / 2, kat / 2 + 1.05, mz + dz, 0x111111, 0, 0, egim);
    }
    this.engel(mx1 - .2, mz - .85, mx2, mz + .85);
    // şerit
    for (let k = 0; k < 3; k++) T.kutu(.04, .1, 1.5, mx1 + .1 + k * .02, .7 + k * .3, mz, k % 2 ? 0x111111 : 0xf2c230);
    // danışma
    T.kutu(2.6, 1.05, 1.1, -5, .52, -7, 0xd7cbb3); T.kutu(2.8, .06, 1.3, -5, 1.07, -7, 0x5a3f2a); this.engel(-6.3, -7.6, -3.7, -6.4);
    this.tabela('DANIŞMA', '#ffffff', 2.4, .5, -5, 1.6, -6.38, 0, '#1d3f73');
    this.noktalar.danisma = new THREE.Vector3(-5, 1.2, -6.4);
    T.kutu(.1, .35, .1, -4.3, 1.25, -7.1, 0x222222); T.kutu(.14, .1, .14, -4.3, 1.44, -7.1, 0x333333); // mikrofon
    // asılı pankart
    const pank = yaziDokusu((g, w, h) => {
      g.fillStyle = '#b3262e'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffe9c2'; g.font = '900 120px "Big Shoulders", Impact'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('HER ŞEYDE %70 İNDİRİM · SON GÜNLER', w / 2, h / 2);
    }, 2048, 256);
    const p = this.duz(pank, 12, 1.5, 0, 7.2, -9.7);
    p.material.side = THREE.DoubleSide;
  }

  // ---------------------------------------------------------------- dükkân cepheleri
  _dukkanlar() {
    const T = this.T;
    const kepenk = yaziDokusu((g, w, h) => {
      g.fillStyle = '#7f8287'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) { g.fillStyle = '#9a9ea4'; g.fillRect(0, y, w, 7); g.fillStyle = '#5d6065'; g.fillRect(0, y + 13, w, 3); }
      for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(60,40,20,${Math.random() * .25})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
    }, 512, 256);
    for (const d of KAPALI_DUKKANLAR) {
      const cx = (d.x1 + d.x2) / 2, yon = d.z < 0 ? 1 : -1, z = d.z + yon * .02;
      const k = this.duz(kepenk, 7.2, 3.0, cx, 1.5, z, d.z < 0 ? 0 : Math.PI);
      this.tabela(d.ad, d.renk, 7.2, .8, cx, 3.55, d.z + yon * .03, d.z < 0 ? 0 : Math.PI);
      T.kutu(.7, .25, .12, cx + 2.6, .2, d.z + yon * .1, 0x5b4d2c); // kilit
      if (this.rnd() < .6) { // kiralık kâğıdı
        const kg = yaziDokusu((g, w, h) => { g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, w, h); g.fillStyle = '#c0262c'; g.font = '900 54px "Big Shoulders", Impact'; g.textAlign = 'center'; g.fillText('KAPANDI', w / 2, 70); g.fillStyle = '#222'; g.font = 'italic 22px Literata, Georgia'; g.fillText('İlginiz için teşekkürler', w / 2, 120); }, 256, 160);
        this.duz(kg, .8, .5, cx - 1.5 + this.rnd(), 1.5, d.z + yon * .04, d.z < 0 ? 0 : Math.PI);
      }
    }
    // dükkânlar arası kolonlar
    for (const x of [-32, -24, -16, -8, 8, 16, 24, 32]) for (const z of [-4, 4]) {
      if ((x === -8 || x === 8)) continue;
      T.kutu(.6, 4.2, .4, x, 2.1, z + (z < 0 ? .2 : -.2), 0xb7ad99);
      this.engel(x - .3, z < 0 ? z : z - .4, x + .3, z < 0 ? z + .4 : z);
    }
    // açık dükkânlar: cam cephe, kapı boşluğu ortada
    const cam = new THREE.MeshStandardMaterial({ color: 0xa8c0d8, transparent: true, opacity: .14, roughness: .05, metalness: .2, depthWrite: false, side: THREE.DoubleSide });
    for (const d of ACIK_DUKKANLAR) {
      const yon = d.z < 0 ? 1 : -1;
      for (const [a, b] of [[d.x1 + .3, d.x1 + 2.6], [d.x2 - 2.6, d.x2 - .3]]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 3), cam); m.position.set((a + b) / 2, 1.5, d.z); this.grup.add(m);
        T.kutu(b - a, .1, .1, (a + b) / 2, .05, d.z, 0x2a2a2a); T.kutu(b - a, .1, .1, (a + b) / 2, 3.0, d.z, 0x2a2a2a);
        this.engel(a, d.z - .08, b, d.z + .08);
      }
      // yarı açık kepenk (üstte toplanmış)
      T.kutu(7.4, .5, .3, (d.x1 + d.x2) / 2, 3.35, d.z + yon * .15, 0x808389);
      this.tabela(d.ad, d.renk, 7.2, .8, (d.x1 + d.x2) / 2, 3.85, d.z + yon * .32, d.z < 0 ? 0 : Math.PI);
    }
    // teknik oda: dolu duvar, dar kapı
    const z = 4;
    T.kutu(3.0, 3.4, .2, 25.5 + .2, 1.7, z + .1, 0x77807a); T.kutu(4.6, 3.4, .2, 29.7, 1.7, z + .1, 0x77807a);
    T.kutu(1.4, .8, .2, 27.7, 3.0, z + .1, 0x77807a);
    this.engel(24, z, 27.0, z + .2); this.engel(28.4, z, 32, z + .2);
    const kapiTab = yaziDokusu((g, w, h) => { g.fillStyle = '#f2d230'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = '900 40px "Big Shoulders", Impact'; g.textAlign = 'center'; g.fillText('⚡ TEKNİK ODA', w / 2, 52); g.font = '700 22px "Big Shoulders", Impact'; g.fillText('YETKİLİ PERSONEL HARİÇ GİRİLMEZ', w / 2, 88); }, 400, 110);
    this.duz(kapiTab, 1.6, .44, 29.4, 2.2, 3.98, Math.PI);
    // acil çıkış tabelaları
    for (const [x, y, z, ry] of [[-36, 3.2, -5.98, 0], [36, 2.8, 4.98, Math.PI], [0, 3.6, 31.98, Math.PI], [-10.98, 4, -30, Math.PI / 2]]) {
      const t = yaziDokusu((g, w, h) => { g.fillStyle = '#0f8a3c'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '900 52px "Big Shoulders", Impact'; g.textAlign = 'center'; g.fillText('🏃 ACİL ÇIKIŞ', w / 2, 66); }, 400, 100);
      const m = this.duz(t, 1.2, .3, x, y, z, ry, 0, true); m.material.color.set(0x9adbb0);
    }
  }

  // ---------------------------------------------------------------- dükkân içleri
  _raf(x1, x2, z, yon, renkler, h = 2.2) {
    const T = this.T, w = x2 - x1, cx = (x1 + x2) / 2;
    T.kutu(w, h, .5, cx, h / 2, z, 0x3a2c22);
    for (let r = 0; r < 4; r++) {
      const y = .35 + r * h / 4.2;
      T.kutu(w - .1, .04, .52, cx, y, z + yon * .02, 0x5b4636);
      let x = x1 + .1;
      while (x < x2 - .2) { const gen = .08 + this.rnd() * .18, boy = .2 + this.rnd() * .25; T.kutu(gen, boy, .35, x + gen / 2, y + boy / 2 + .02, z + yon * .05, renkler[Math.floor(this.rnd() * renkler.length)]); x += gen + .02; }
    }
    this.engel(x1, z - .3, x2, z + .3);
  }

  _plak() {
    const T = this.T;
    this._raf(16.4, 23.6, -10.65, 1, [0xff6ec7, 0x2d2d2d, 0xffd257, 0x5ab0ff, 0xf3f3f3, 0x8a2be2, 0x1f1f1f], 2.4);
    for (const x of [18, 22]) { // plak kutuları
      T.kutu(1.6, .8, .9, x, .4, -7.4, 0x4b3526); this.engel(x - .8, -7.85, x + .8, -6.95);
      for (let k = 0; k < 10; k++) T.kutu(.02 + .0, .32, .32, x - .7 + k * .15, .95, -7.4, [0x111, 0xd23c5a, 0x333, 0xf2c230, 0x2a6fd1][k % 5], 0, -.25);
    }
    // tezgâh ve pikap
    T.kutu(2.6, 1, .8, 20, .5, -9.4, 0x2b2230); this.engel(18.7, -9.8, 21.3, -9.0);
    T.kutu(.6, .12, .5, 20, 1.06, -9.4, 0x1a1a1a); T.silindir(.21, .21, .02, 20, 1.13, -9.4, 0x101010, 18);
    T.kutu(.3, .02, .03, 20.18, 1.15, -9.3, 0xb5b5b5, .7);
    T.kutu(.5, .55, .35, 21.1, 1.28, -9.6, 0x6b4a2e); T.silindir(.15, .15, .02, 21.1, 1.3, -9.42, 0x111111, 14, Math.PI / 2);
    this.noktalar.pikap = new THREE.Vector3(20, 1.15, -9.4);
    const pos = yaziDokusu((g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ff6ec7'); gr.addColorStop(1, '#3b1c78'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.beginPath(); g.arc(w / 2, h * .45, 90, 0, 7); g.fill(); g.fillStyle = '#ffd257'; g.beginPath(); g.arc(w / 2, h * .45, 26, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 46px "Big Shoulders", Impact'; g.textAlign = 'center'; g.fillText('YAZ KONSERİ \'96', w / 2, h - 40); }, 300, 400);
    this.duz(pos, .9, 1.2, 16.03, 2.0, -7.5, Math.PI / 2);
  }

  _giyim() {
    const T = this.T;
    for (const z of [-6.5, -9]) { // askılıklar
      T.kutu(3.4, .05, .05, -20, 1.6, z, 0xaaaaaa); T.kutu(.05, 1.6, .05, -21.7, .8, z, 0xaaaaaa); T.kutu(.05, 1.6, .05, -18.3, .8, z, 0xaaaaaa);
      for (let k = 0; k < 12; k++) T.kutu(.26, .8 + this.rnd() * .2, .06, -21.5 + k * .28, 1.1, z, [0x3b5998, 0xc0392b, 0x1c1c1c, 0xe8e2d0, 0x6b8e23][Math.floor(this.rnd() * 5)]);
      this.engel(-21.8, z - .25, -18.2, z + .25);
    }
    T.kutu(.1, 2.4, 1.6, -23.85, 1.3, -6, 0x9fb7c9); // ayna gibi
    this.noktalar.bere = new THREE.Vector3(-17.4, 1.2, -9.6);
    this.noktalar.giyim = new THREE.Vector3(-20, 1.2, -5);
  }

  _oyuncak() {
    const T = this.T;
    this._raf(-15.6, -8.4, 10.65, -1, [0xff4d4d, 0xffd84d, 0x4da6ff, 0x5ed16a, 0xff9f43, 0xb06ce8], 2.2);
    // tezgâh ve müzik kutusu
    T.kutu(2.4, 1, .8, -12, .5, 8.6, 0xb8742e); this.engel(-13.2, 8.2, -10.8, 9.0);
    T.kutu(.36, .22, .26, -11.6, 1.11, 8.6, 0x8b2f4c); T.kutu(.36, .04, .26, -11.6, 1.32, 8.42, 0x8b2f4c, 0, -1.0);
    T.silindir(.03, .05, .18, -11.6, 1.32, 8.62, 0xf2d0a0, 8);
    this.noktalar.muzikKutusu = new THREE.Vector3(-11.6, 1.1, 8.6);
    // sallanan at, ayıcıklar, küpler
    T.kutu(1.1, .45, .32, -14.3, .7, 6.2, 0xd8a15d); T.kutu(.3, .55, .24, -13.8, 1.05, 6.2, 0xd8a15d); T.kutu(1.6, .08, .4, -14.3, .25, 6.2, 0x8a5a2b, 0, 0, .1);
    this.engel(-15.1, 5.9, -13.5, 6.5);
    for (const [x, z, c] of [[-9.2, 6, 0xa66a3a], [-9.2, 7.2, 0xe8d3b0]]) { T.kure(.32, x, .32, z, c, 10); T.kure(.22, x, .78, z, c, 10); T.kure(.08, x - .15, .96, z, c, 6); T.kure(.08, x + .15, .96, z, c, 6); }
    this.engel(-9.6, 5.6, -8.8, 7.6);
    // duvarda çocuk resmi
    const resim = yaziDokusu((g, w, h) => {
      g.fillStyle = '#fbf7ec'; g.fillRect(0, 0, w, h);
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.fillStyle = '#ffd84d'; g.beginPath(); g.arc(w - 70, 70, 38, 0, 7); g.fill();
      g.strokeStyle = '#ffd84d'; g.lineWidth = 6; for (let k = 0; k < 8; k++) { const a = k * .8; g.beginPath(); g.moveTo(w - 70 + Math.cos(a) * 48, 70 + Math.sin(a) * 48); g.lineTo(w - 70 + Math.cos(a) * 66, 70 + Math.sin(a) * 66); g.stroke(); }
      g.fillStyle = '#5ed16a'; g.fillRect(0, h - 60, w, 60);
      // adam (bekçi)
      g.strokeStyle = '#1d2a5a'; g.lineWidth = 9;
      g.beginPath(); g.arc(170, 150, 32, 0, 7); g.stroke();
      g.fillStyle = '#1d2a5a'; g.fillRect(132, 110, 76, 16); g.fillRect(150, 96, 40, 18);
      g.beginPath(); g.moveTo(170, 182); g.lineTo(170, 300); g.moveTo(170, 300); g.lineTo(140, 380); g.moveTo(170, 300); g.lineTo(200, 380); g.moveTo(170, 220); g.lineTo(120, 270); g.moveTo(170, 220); g.lineTo(240, 270); g.stroke();
      g.fillStyle = '#ffd84d'; g.beginPath(); g.moveTo(112, 268); g.lineTo(80, 250); g.lineTo(80, 300); g.closePath(); g.fill(); // fener
      // kız
      g.strokeStyle = '#d83a3a'; g.lineWidth = 8;
      g.beginPath(); g.arc(300, 230, 24, 0, 7); g.stroke();
      g.fillStyle = '#d83a3a'; g.beginPath(); g.ellipse(300, 206, 30, 12, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(300, 254); g.lineTo(276, 330); g.lineTo(324, 330); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(290, 330); g.lineTo(285, 380); g.moveTo(310, 330); g.lineTo(315, 380); g.moveTo(285, 270); g.lineTo(240, 270); g.stroke();
      g.fillStyle = '#d83a3a'; g.font = '700 30px "Comic Sans MS", "Big Shoulders", sans-serif'; g.textAlign = 'center';
      g.fillText('NEVZAT AMCA VE BEN', w / 2, 46);
      g.fillStyle = '#1d2a5a'; g.font = '700 24px "Comic Sans MS", "Big Shoulders", sans-serif'; g.fillText('DEFNE  7 YAŞ', w - 110, h - 22);
    }, 512, 420);
    this.resim = this.duz(resim, 1.2, .98, -15.97, 1.7, 8.2, Math.PI / 2);
    this.noktalar.resim = new THREE.Vector3(-15.6, 1.6, 8.2);
  }

  _kirtasiye() {
    const T = this.T;
    this._raf(8.4, 15.6, 10.65, -1, [0xffffff, 0x2a6fd1, 0xd23c5a, 0xf2c230, 0x5ed16a], 2.0);
    T.kutu(2.2, 1, .8, 12, .5, 8.4, 0x4d6b5d); this.engel(10.9, 8.0, 13.1, 8.8);
    for (let k = 0; k < 6; k++) { T.kutu(.1, .2, .1, 11.4 + k * .14, 1.1, 8.3, 0x222222); T.kutu(.1, .05, .1, 11.4 + k * .14, 1.22, 8.3, 0xd4a017); }
    this.noktalar.pil = new THREE.Vector3(11.8, 1.1, 8.3);
  }

  _teknik() {
    const T = this.T;
    // borular
    for (const y of [2.8, 3.05]) T.silindir(.08, .08, 8, 28, y, 10.6, 0x6d7a72, 8, 0, 0, Math.PI / 2);
    T.silindir(.12, .12, 3.4, 24.5, 1.7, 10.5, 0x8a5a2b, 8);
    // sigorta panosu
    T.kutu(2.4, 1.6, .25, 28, 1.6, 10.8, 0x4a5a52); T.kutu(2.2, 1.4, .05, 28, 1.6, 10.66, 0x2b332f);
    this.sigortalar = [];
    for (let k = 0; k < 3; k++) {
      const kol = new THREE.Mesh(new THREE.BoxGeometry(.18, .38, .14), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: .5 }));
      kol.position.set(27.3 + k * .7, 1.45, 10.58); kol.rotation.x = .5; this.grup.add(kol); this.sigortalar.push(kol);
      const l = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x441111 }));
      l.position.set(27.3 + k * .7, 1.95, 10.62); this.grup.add(l); kol.userData.lamba = l;
    }
    this.noktalar.sigorta = new THREE.Vector3(28, 1.4, 10.3);
    T.kutu(1.2, 2, .8, 31.2, 1, 9.8, 0x5d655f); this.engel(30.6, 9.4, 31.8, 10.2); // jeneratör dolabı
    T.kutu(1.4, 1.2, 1.2, 25, .6, 9.8, 0x6b6f6a); this.engel(24.3, 9.2, 25.7, 10.4);
    this.noktalar.teknikKapi = new THREE.Vector3(27.7, 1.2, 3.4);
  }

  // ---------------------------------------------------------------- güvenlik ofisi + arşiv
  _ofis() {
    const T = this.T;
    // ofis giriş daraltma (kapı 2 m)
    T.kutu(.25, 3.2, 3.0, 32.1, 1.6, -3.5, 0x9fa7a3); T.kutu(.25, 3.2, 3.0, 32.1, 1.6, 3.5, 0x9fa7a3);
    this.engel(31.95, -5, 32.25, -2); this.engel(31.95, 2, 32.25, 5);
    this.tabela('GÜVENLİK', '#7fd3ff', 2, .45, 31.95, 3.0, 0, -Math.PI / 2, '#0e1620');
    // kamera masası
    T.kutu(5, .08, 1.1, 36.5, .85, -4.35, 0x6b5a48); T.kutu(5, .8, .1, 36.5, .42, -4.85, 0x4a3e32);
    T.kutu(.1, .8, 1, 34.05, .42, -4.35, 0x4a3e32); T.kutu(.1, .8, 1, 38.95, .42, -4.35, 0x4a3e32);
    this.engel(34, -5, 39, -3.8);
    // monitörler
    this.kameraDoku = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { c, g: c.getContext('2d'), t }; })();
    for (let k = 0; k < 4; k++) {
      const x = 35 + k * 1.05;
      T.kutu(.9, .7, .45, x, 1.25, -4.6, 0x2a2a2a);
      const ekran = new THREE.Mesh(new THREE.PlaneGeometry(.78, .56), new THREE.MeshBasicMaterial({ map: this.kameraDoku.t, color: 0x9fd8b0 }));
      ekran.geometry.attributes.uv.array.set([k * .25, 1, k * .25 + .25, 1, k * .25, 0, k * .25 + .25, 0]);
      ekran.position.set(x, 1.25, -4.37); this.grup.add(ekran); (this.ekranlar ||= []).push(ekran);
    }
    // vardiya defteri, telsiz, fener, not
    T.kutu(.42, .04, .3, 36.4, .91, -4.1, 0x2e4a7a); T.kutu(.4, .01, .28, 36.4, .935, -4.1, 0xeee8d8);
    this.noktalar.defter = new THREE.Vector3(36.4, .95, -4.1);
    T.kutu(.25, .02, .18, 37.6, .9, -4.0, 0xf6f2c6); this.noktalar.not = new THREE.Vector3(37.6, .95, -4.0);
    // dolaplar ve şarj istasyonu
    for (let k = 0; k < 4; k++) { T.kutu(.6, 2, .5, 33 + k * .62, 1, 4.7, 0x5f6f78); T.kutu(.03, .2, .02, 33.2 + k * .62, 1.1, 4.44, 0xcccccc); }
    this.engel(32.6, 4.4, 35.2, 5);
    T.kutu(1.2, .9, .5, 37.5, .45, 4.7, 0x4a3e32); T.kutu(1.2, .05, .52, 37.5, .92, 4.7, 0x6b5a48); this.engel(36.8, 4.4, 38.2, 5);
    this.fenerModel = new THREE.Group();
    const fm = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: .4 });
    const f1 = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .28, 10), fm); f1.rotation.z = Math.PI / 2; this.fenerModel.add(f1);
    const f2 = new THREE.Mesh(new THREE.CylinderGeometry(.07, .05, .08, 12), fm); f2.rotation.z = Math.PI / 2; f2.position.x = .17; this.fenerModel.add(f2);
    const tz = new THREE.Mesh(new THREE.BoxGeometry(.08, .22, .05), new THREE.MeshStandardMaterial({ color: 0x262a2e })); tz.position.set(-.3, .08, 0); this.fenerModel.add(tz);
    this.fenerModel.position.set(37.5, 1.0, 4.65); this.grup.add(this.fenerModel);
    this.noktalar.ekipman = new THREE.Vector3(37.5, 1.0, 4.5);
    // sandalye
    T.kutu(.5, .08, .5, 36.5, .5, -3.3, 0x222222); T.kutu(.5, .55, .07, 36.5, .82, -3.05, 0x222222); T.kutu(.06, .45, .06, 36.5, .25, -3.3, 0x555555);
    // pano + harita
    const plan = yaziDokusu((g, w, h) => {
      g.fillStyle = '#e9e2cf'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1d3f73'; g.lineWidth = 4; g.fillStyle = '#c9d6e8';
      const sx = w / 96, sz = h / 80, ox = 45, oz = 44;
      for (const o of ODALAR) { g.fillRect((o.x1 + ox) * sx, (o.z1 + oz) * sz, (o.x2 - o.x1) * sx, (o.z2 - o.z1) * sz); g.strokeRect((o.x1 + ox) * sx, (o.z1 + oz) * sz, (o.x2 - o.x1) * sx, (o.z2 - o.z1) * sz); }
      g.fillStyle = '#1d3f73'; g.font = '700 22px "Big Shoulders", Impact'; g.textAlign = 'center'; g.fillText('YILDIZ ÇARŞISI · ZEMİN KAT', w / 2, 26);
    }, 512, 420);
    this.duz(plan, 1.5, 1.23, 40.85, 1.7, -2.6, -Math.PI / 2);
    // arşiv
    for (const z of [-1.7, 1.7]) {
      T.kutu(3.6, 2.4, .4, 43, 1.2, z, 0x6b5a48);
      for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) T.kutu(.2, .32, .3, 41.4 + k * .24, .35 + r * .58, z + (z < 0 ? .1 : -.1), [0x2e4a7a, 0x8b2f2f, 0xc9b78f, 0x3e6b48][(k + r) % 4]);
      this.engel(41, z - .25, 45, z + .25);
    }
    T.kutu(.5, .05, .35, 44.3, 1.0, -1.42, 0x5a2e1e); this.noktalar.eskiDefter = new THREE.Vector3(44.3, 1.0, -1.3);
    const gazete = yaziDokusu((g, w, h) => {
      g.fillStyle = '#e8dfc8'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1a1a1a'; g.font = '900 34px Georgia, serif'; g.textAlign = 'center'; g.fillText('GECE HABER', w / 2, 40);
      g.fillRect(16, 50, w - 32, 3);
      g.font = '900 30px Georgia, serif'; g.fillText('ÇARŞIDA YANGIN', w / 2, 92);
      g.font = 'italic 20px Georgia, serif'; g.fillText('Bekçi, mahsur kalan çocuğu kurtardı', w / 2, 122);
      g.fillStyle = '#777'; g.fillRect(24, 140, 150, 110);
      g.fillStyle = '#333'; for (let i = 0; i < 9; i++) g.fillRect(190, 145 + i * 12, w - 214, 5);
      for (let i = 0; i < 7; i++) g.fillRect(24, 265 + i * 12, w - 48, 5);
      g.fillStyle = '#1a1a1a'; g.font = '700 14px Georgia'; g.fillText('15 Nisan 1996', w / 2, h - 12);
    }, 400, 360);
    this.duz(gazete, .7, .63, 44.83, 1.7, .9, -Math.PI / 2);
    this.noktalar.gazete = new THREE.Vector3(44.3, 1.6, .9);
  }

  // ---------------------------------------------------------------- sinema
  _sinema() {
    const T = this.T;
    // perde
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    this.perde = { c, g: c.getContext('2d'), t };
    this.perde.g.fillStyle = '#0c0c0c'; this.perde.g.fillRect(0, 0, 512, 256);
    this.perdeMalz = new THREE.MeshBasicMaterial({ map: t, color: 0x222222 });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(16, 7.2), this.perdeMalz); p.position.set(0, 4.6, -41.8); this.grup.add(p);
    T.kutu(17.4, 8.4, .2, 0, 4.6, -41.95, 0x111111);
    for (const x of [-9.4, 9.4]) T.kutu(1.4, 8.6, .3, x, 4.3, -41.6, 0x7a1d26);
    T.kutu(18, .9, 3, 0, .45, -40.4, 0x3a1418); this.engel(-9, -42, 9, -38.9); // sahne
    // koltuk sıraları (koltuk 7 işaretli)
    this.koltuk7 = null;
    for (let r = 0; r < 5; r++) {
      const z = -36.8 + r * 1.9, y0 = r * .12;
      T.kutu(22, y0 + .01, 1.9, 0, y0 / 2, z + .3, 0x3a1418);
      for (const sag of [-1, 1]) {
        for (let k = 0; k < 9; k++) {
          const x = sag * (1.9 + k * .9);
          T.kutu(.8, .45, .7, x, y0 + .25, z, 0x8b1f2b); T.kutu(.8, .7, .14, x, y0 + .8, z + .32, 0x9e2532);
          T.kutu(.06, .28, .66, x - .43, y0 + .55, z, 0x2a1214);
          if (sag === -1 && k === 6 && r === 3) this.koltuk7 = new THREE.Vector3(x, y0 + .6, z);
        }
        this.engel(sag < 0 ? -10.4 : 1.45, z - .38, sag < 0 ? -1.45 : 10.4, z + .42);
      }
    }
    this.noktalar.koltuk7 = this.koltuk7.clone();
    // projeksiyon kabini (arka sağ köşe, yükseltilmiş)
    T.kutu(4, 2.6, 2.4, 8.8, 1.3, -27.3, 0x2e1316); this.engel(6.8, -28.5, 11, -26);
    T.kutu(4, .2, 2.6, 8.8, 2.7, -27.3, 0x1a0a0c);
    T.kutu(.9, .6, .7, 8.4, 3.1, -27.6, 0x202020); T.silindir(.18, .18, .4, 8.4, 3.15, -28.1, 0x111111, 12, Math.PI / 2);
    for (const x of [8.1, 8.7]) T.silindir(.32, .32, .06, x, 3.65, -27.6, 0x3a3a3a, 16, Math.PI / 2);
    this.noktalar.projektor = new THREE.Vector3(8.4, 2.4, -28.4);
    T.kutu(.8, 1.0, .1, 6.6, 1.2, -27.0, 0x4a2a20); // merdiven kapısı görüntüsü
    this.tabela('YILDIZ SİNEMASI', '#ff5a5a', 6, 1.0, 0, 3.4, -10.03, 0, '#160a0c');
    const afis = yaziDokusu((g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1b3a5a'); gr.addColorStop(1, '#0a1220'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffe9a8'; for (let k = 0; k < 60; k++) g.fillRect(Math.random() * w, Math.random() * h * .6, 2, 2);
      g.fillStyle = '#2b5a3a'; g.beginPath(); g.moveTo(0, h * .75); for (let x = 0; x <= w; x += 20) g.lineTo(x, h * .62 + Math.sin(x * .05) * 30); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      g.fillStyle = '#ffd84d'; g.font = '900 52px "Big Shoulders", Impact'; g.textAlign = 'center'; g.fillText('MASAL ORMANI', w / 2, 70);
      g.fillStyle = '#fff'; g.font = '700 22px "Big Shoulders", Impact'; g.fillText('NİSAN 1996 · YALNIZCA SİNEMALARDA', w / 2, h - 24);
    }, 360, 520);
    this.duz(afis, 1.1, 1.6, -2.97, 1.8, -18, Math.PI / 2);
    this.duz(afis, 1.1, 1.6, 2.97, 1.8, -14, -Math.PI / 2);
    this.noktalar.sinemaKapi = new THREE.Vector3(0, 1.2, -25);
    this.noktalar.atriumGiris = new THREE.Vector3(0, 1.2, -7);
  }

  // ---------------------------------------------------------------- yemek katı
  _yemek() {
    const T = this.T;
    const tez = [['SİMİT SARAYI', '#ffb347', -8.5], ['DÖNERCİ', '#ff5a3c', 0], ['TATLICI MELEK', '#ff8fd0', 8.5]];
    for (const [ad, renk, x] of tez) {
      T.kutu(6.5, 1.1, 1, x, .55, 30.6, 0x9a8a72); T.kutu(6.6, .07, 1.1, x, 1.12, 30.6, 0x6b4a2e);
      this.engel(x - 3.25, 30.1, x + 3.25, 32);
      T.kutu(6.5, 2.3, .4, x, 2.6, 31.75, 0x2b2420);
      this.tabela(ad, renk, 5.6, 1, x, 4.5, 31.55, Math.PI);
    }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
      const x = -8 + j * 5.4, z = 21.5 + i * 2.8;
      if (Math.abs(x) < 2 && i === 0) continue;
      T.silindir(.65, .65, .05, x, .76, z, 0xe8e2d0, 16); T.silindir(.06, .06, .75, x, .38, z, 0x555555, 8);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + (i + j) * .3; const sx = x + Math.cos(a) * .95, sz = z + Math.sin(a) * .95; T.kutu(.42, .05, .42, sx, .46, sz, 0xd23c2e); T.kutu(.05, .44, .05, sx, .22, sz, 0x555555); if ((i + j + k) % 5 === 0) T.kutu(.42, .45, .05, sx + Math.cos(a) * .2, .7, sz + Math.sin(a) * .2, 0xd23c2e, a); }
      this.engel(x - .7, z - .7, x + .7, z + .7);
    }
    // üst üste konmuş sandalyeler
    for (let k = 0; k < 6; k++) T.kutu(.44, .05, .44, -11.5, .46 + k * .1, 19.2, 0xd23c2e);
    this.engel(-11.8, 18.9, -11.2, 19.5);
    // pencereler (dışarısı)
    const pen = yaziDokusu((g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1020'); gr.addColorStop(1, '#141c2c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,190,110,.8)'; for (let k = 0; k < 30; k++) g.fillRect(Math.random() * w, h * .55 + Math.random() * h * .4, 4, 4); g.fillStyle = '#e9eef8'; g.beginPath(); g.arc(w * .8, h * .22, 18, 0, 7); g.fill(); }, 512, 256);
    for (const z of [21, 26]) { this.duz(pen, 3.6, 2.4, -12.83, 3.4, z, Math.PI / 2, 0, true); this.duz(pen, 3.6, 2.4, 12.83, 3.4, z, -Math.PI / 2, 0, true); }
  }

  _kontrolNoktalari() {
    // kart okuyucular duvarda: küçük kutu + yeşil/kırmızı led
    this.okuyucular = {};
    const ekle = (id, x, z, ry) => {
      const g = new THREE.Group();
      const kut = new THREE.Mesh(new THREE.BoxGeometry(.22, .3, .06), new THREE.MeshStandardMaterial({ color: 0x23272c, roughness: .4 }));
      const led = new THREE.Mesh(new THREE.BoxGeometry(.1, .03, .02), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
      led.position.set(0, .1, .035); g.add(kut, led);
      g.position.set(x, 1.35, z); g.rotation.y = ry; this.grup.add(g);
      this.okuyucular[id] = led;
      this.noktalar[id] = new THREE.Vector3(x + Math.sin(ry) * .4, 1.3, z + Math.cos(ry) * .4);
    };
    ekle('k_giris', -39.84, 4.6, Math.PI / 2);
    ekle('k_atrium', 7.84, -7, -Math.PI / 2);
    ekle('k_yemek', 12.84, 24, -Math.PI / 2);
    ekle('k_sinema', 2.84, -22, -Math.PI / 2);
    ekle('k_dogu', 30.0, -3.84, 0);
    ekle('k_bati', -31.0, 3.84, Math.PI);
  }
}

// ---------------------------------------------------------------- figürler
export function manken(cocuk = false, renk = 0xe9e4da) {
  const g = new THREE.Group(), s = cocuk ? .62 : 1;
  const m = new THREE.MeshStandardMaterial({ color: renk, roughness: .45 });
  const add = (geo, x, y, z, rx = 0, rz = 0) => { const k = new THREE.Mesh(geo, m); k.position.set(x * s, y * s, z * s); k.rotation.set(rx, 0, rz); k.castShadow = true; g.add(k); return k; };
  add(new THREE.CylinderGeometry(.04, .04, .9, 6), 0, .45, 0);
  add(new THREE.CylinderGeometry(.22, .22, .03, 14), 0, .015, 0);
  add(new THREE.CylinderGeometry(.13, .16, .9, 10), -.1, 1.05, 0, 0, .03);
  add(new THREE.CylinderGeometry(.13, .16, .9, 10), .1, 1.05, 0, 0, -.03);
  add(new THREE.CylinderGeometry(.21, .17, .62, 12), 0, 1.75, 0);
  add(new THREE.CylinderGeometry(.06, .07, .14, 8), 0, 2.12, 0);
  const bas = add(new THREE.SphereGeometry(.13, 14, 10), 0, 2.3, 0); bas.scale.y = 1.25;
  add(new THREE.CylinderGeometry(.05, .045, .7, 8), -.27, 1.68, 0, 0, .18);
  add(new THREE.CylinderGeometry(.05, .045, .7, 8), .27, 1.68, 0, 0, -.18);
  g.scale.setScalar(.82);
  return g;
}

export function nevzatModeli() {
  const g = new THREE.Group();
  const lac = new THREE.MeshStandardMaterial({ color: 0x1d2a4a, emissive: 0x4a72a8, emissiveIntensity: .9, transparent: true, opacity: .58, depthWrite: false, roughness: .7 });
  const ten = new THREE.MeshStandardMaterial({ color: 0xc9a07a, emissive: 0x8a6a52, emissiveIntensity: .9, transparent: true, opacity: .55, depthWrite: false });
  const p = (geo, mat, x, y, z) => { const k = new THREE.Mesh(geo, mat); k.position.set(x, y, z); g.add(k); return k; };
  p(new THREE.CylinderGeometry(.12, .1, .85, 8), lac, -.11, .43, 0); p(new THREE.CylinderGeometry(.12, .1, .85, 8), lac, .11, .43, 0);
  p(new THREE.CylinderGeometry(.26, .22, .7, 10), lac, 0, 1.2, 0);
  p(new THREE.SphereGeometry(.14, 12, 10), ten, 0, 1.72, 0);
  p(new THREE.CylinderGeometry(.17, .17, .08, 12), lac, 0, 1.86, 0); p(new THREE.BoxGeometry(.2, .03, .14), lac, 0, 1.83, .14);
  const kol = p(new THREE.CylinderGeometry(.06, .05, .62, 8), lac, .3, 1.22, .12); kol.rotation.x = -1.1;
  p(new THREE.CylinderGeometry(.06, .05, .62, 8), lac, -.3, 1.15, 0);
  // fener huzmesi (sahte)
  const huzme = new THREE.Mesh(new THREE.ConeGeometry(.7, 5, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c4, transparent: true, opacity: .035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  huzme.rotation.x = Math.PI / 2; huzme.position.set(.32, 1.3, 2.9); g.add(huzme);
  const ucu = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff1c4 })); ucu.position.set(.32, 1.32, .45); g.add(ucu);
  g.userData.malz = [lac, ten];
  return g;
}
