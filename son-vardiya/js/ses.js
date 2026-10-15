// Bütün sesler Web Audio ile anında üretilir; hiç ses dosyası yok.
// Konumlu sesler (plak, müzik kutusu, ayak sesleri) kameraya göre 3D duyulur.
const NOTA = n => 440 * Math.pow(2, (n - 69) / 12);

export class Ses {
  constructor() { this.ctx = null; this.acik = true; this.dongular = new Set(); }

  baslat() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.ana = c.createGain(); this.ana.gain.value = this.acik ? .9 : 0;
    const komp = c.createDynamicsCompressor(); komp.threshold.value = -14; komp.ratio.value = 4;
    this.ana.connect(komp); komp.connect(c.destination);
    // yankı (AVM'nin büyük boşluğu)
    this.yanki = c.createConvolver();
    const uz = c.sampleRate * 2.6, ir = c.createBuffer(2, uz, c.sampleRate);
    for (let k = 0; k < 2; k++) { const d = ir.getChannelData(k); for (let i = 0; i < uz; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / uz, 3.2); }
    this.yanki.buffer = ir;
    this.yankiG = c.createGain(); this.yankiG.gain.value = .45; this.yanki.connect(this.yankiG); this.yankiG.connect(this.ana);
    // gürültü tamponu
    const n = c.sampleRate * 3; this.gurultu = c.createBuffer(1, n, c.sampleRate);
    const d = this.gurultu.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this._ortam();
  }
  ac(v) { this.acik = v; if (this.ana) this.ana.gain.setTargetAtTime(v ? .9 : 0, this.ctx.currentTime, .1); }
  get t() { return this.ctx ? this.ctx.currentTime : 0; }

  _cikis(yankili = .3) { // kuru + yankı karışımı
    const g = this.ctx.createGain(); g.connect(this.ana);
    if (yankili) { const s = this.ctx.createGain(); s.gain.value = yankili; g.connect(s); s.connect(this.yanki); }
    return g;
  }
  _gurultuKaynak(dongu = true) { const s = this.ctx.createBufferSource(); s.buffer = this.gurultu; s.loop = dongu; s.loopStart = Math.random(); return s; }
  _zarf(g, t, a, tut, b, tepe = 1) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(tepe, t + a); g.gain.setValueAtTime(tepe, t + a + tut); g.gain.exponentialRampToValueAtTime(.0001, t + a + tut + b); }
  _osc(tip, f, t, sure, hedef, tepe = .3, a = .005) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = tip; o.frequency.value = f;
    this._zarf(g, t, a, 0, sure, tepe); o.connect(g); g.connect(hedef); o.start(t); o.stop(t + sure + a + .05); return o;
  }

  // ------------------------------------------------------------ ortam: floresan uğultusu + gerilim
  _ortam() {
    const c = this.ctx, t = c.currentTime;
    const cik = this._cikis(.2);
    // 50 Hz şebeke uğultusu
    this.vizG = c.createGain(); this.vizG.gain.value = .0; this.vizG.connect(cik);
    for (const [f, a] of [[50, .5], [100, .35], [150, .12]]) { const o = c.createOscillator(); o.frequency.value = f; const g = c.createGain(); g.gain.value = a * .05; o.connect(g); g.connect(this.vizG); o.start(); }
    // uzak rüzgâr / bina nefesi
    const r = this._gurultuKaynak(); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
    this.ruzgarG = c.createGain(); this.ruzgarG.gain.value = .05; r.connect(lp); lp.connect(this.ruzgarG); this.ruzgarG.connect(cik); r.start();
    const lfo = c.createOscillator(); lfo.frequency.value = .07; const lg = c.createGain(); lg.gain.value = 120; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    // gerilim katmanı: birbirine sürtünen iki alçak ton
    this.gerG = c.createGain(); this.gerG.gain.value = 0; const glp = c.createBiquadFilter(); glp.type = 'lowpass'; glp.frequency.value = 420;
    for (const f of [55, 55.7, 82.4]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const g = c.createGain(); g.gain.value = .05; o.connect(g); g.connect(glp); o.start(); }
    glp.connect(this.gerG); this.gerG.connect(cik);
    // yağmur (giriş tarafında)
    const y = this._gurultuKaynak(); const yb = c.createBiquadFilter(); yb.type = 'highpass'; yb.frequency.value = 1800;
    this.yagmurG = c.createGain(); this.yagmurG.gain.value = 0; y.connect(yb); yb.connect(this.yagmurG); this.yagmurG.connect(this.ana); y.start();
  }
  elektrik(acik) { if (this.ctx) this.vizG.gain.setTargetAtTime(acik ? 1 : 0, this.t, .3); }
  gerilim(v) { if (this.ctx) this.gerG.gain.setTargetAtTime(v * .9, this.t, 1.2); }
  yagmur(v) { if (this.ctx) this.yagmurG.gain.setTargetAtTime(v * .05, this.t, .5); }

  dinleyici(kam) {
    if (!this.ctx) return;
    const L = this.ctx.listener, p = kam.position, t = this.t;
    const f = kam.getWorldDirection(this._v || (this._v = kam.position.clone()));
    if (L.positionX) {
      L.positionX.setTargetAtTime(p.x, t, .02); L.positionY.setTargetAtTime(p.y, t, .02); L.positionZ.setTargetAtTime(p.z, t, .02);
      L.forwardX.setTargetAtTime(f.x, t, .02); L.forwardY.setTargetAtTime(f.y, t, .02); L.forwardZ.setTargetAtTime(f.z, t, .02);
      L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else { L.setPosition(p.x, p.y, p.z); L.setOrientation(f.x, f.y, f.z, 0, 1, 0); }
  }
  _panner(p, ref = 2, rolloff = 1.4) {
    const pn = this.ctx.createPanner(); pn.panningModel = 'HRTF'; pn.distanceModel = 'inverse'; pn.refDistance = ref; pn.rolloffFactor = rolloff; pn.maxDistance = 80;
    if (pn.positionX) { pn.positionX.value = p.x; pn.positionY.value = p.y; pn.positionZ.value = p.z; } else pn.setPosition(p.x, p.y, p.z);
    return pn;
  }

  // ------------------------------------------------------------ kısa efektler
  adim(kosu, halı) {
    if (!this.ctx) return; const c = this.ctx, t = this.t;
    const s = this._gurultuKaynak(false), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = halı ? 260 : 900 + Math.random() * 400; f.Q.value = halı ? .7 : 1.4;
    const g = c.createGain(); this._zarf(g, t, .004, .02, halı ? .07 : .12, (kosu ? .5 : .32) * (halı ? .6 : 1));
    s.connect(f); f.connect(g); g.connect(this._cikis(halı ? .05 : .35)); s.start(t, Math.random() * 2, .3);
    this._osc('sine', 70 + Math.random() * 20, t, .08, this._cikis(.1), kosu ? .25 : .15);
  }
  tik() { if (!this.ctx) return; const t = this.t, o = this._cikis(.05); this._osc('square', 2400, t, .015, o, .12); this._osc('square', 1600, t + .03, .02, o, .08); }
  kart(iyi = true) {
    if (!this.ctx) return; const t = this.t, o = this._cikis(.3);
    if (iyi) { this._osc('square', 1320, t, .07, o, .1); this._osc('square', 1760, t + .09, .12, o, .1); }
    else { this._osc('square', 300, t, .2, o, .12); }
  }
  telsiz(acik = true) { // bip + cızırtı
    if (!this.ctx) return; const c = this.ctx, t = this.t, o = this._cikis(.05);
    this._osc('sine', acik ? 1200 : 900, t, .09, o, .14);
    const s = this._gurultuKaynak(false), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = .8;
    const g = c.createGain(); this._zarf(g, t + .05, .01, .18, .12, .22); s.connect(f); f.connect(g); g.connect(o); s.start(t + .05, Math.random(), .5);
  }
  konusma(sure, ses = 'nevzat') { // telsizdeki sesi taklit eden mırıltı (kelimesiz)
    if (!this.ctx) return; const c = this.ctx, t = this.t, o = this._cikis(.05);
    const s = this._gurultuKaynak(false), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = .6;
    const g = c.createGain(); g.gain.value = .0; s.connect(bp); bp.connect(g); g.connect(o); s.start(t, Math.random(), sure + .2);
    g.gain.setValueAtTime(.05, t); g.gain.setTargetAtTime(0, t + sure, .05);
    const os = c.createOscillator(); os.type = 'sawtooth'; const og = c.createGain(); og.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = ses === 'nevzat' ? 700 : 1300; lp.Q.value = 1.8;
    os.connect(lp); lp.connect(og); og.connect(o);
    const temel = ses === 'nevzat' ? 105 : 240;
    let k = t; while (k < t + sure) { const h = .08 + Math.random() * .14; os.frequency.setValueAtTime(temel * (.9 + Math.random() * .3), k); og.gain.setValueAtTime(.0, k); og.gain.linearRampToValueAtTime(.05, k + .02); og.gain.linearRampToValueAtTime(.0, k + h); k += h + Math.random() * .05; }
    os.start(t); os.stop(t + sure + .1);
  }
  anons() { // ding-dang-dong
    if (!this.ctx) return; const t = this.t, o = this._cikis(1.2);
    [[76, 0], [72, .5], [67, 1.0]].forEach(([n, d]) => { this._osc('sine', NOTA(n), t + d, 1.4, o, .18, .01); this._osc('sine', NOTA(n) * 2.01, t + d, .8, o, .05, .01); });
  }
  kepenk() {
    if (!this.ctx) return; const c = this.ctx, t = this.t, o = this._cikis(.8);
    for (let k = 0; k < 9; k++) { const s = this._gurultuKaynak(false), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600 + Math.random() * 500; f.Q.value = 3; const g = c.createGain(); this._zarf(g, t + k * .06, .002, .01, .09, .35); s.connect(f); f.connect(g); g.connect(o); s.start(t + k * .06, Math.random(), .2); }
    this._osc('sine', 55, t, .5, o, .5);
  }
  kapi() { if (!this.ctx) return; const t = this.t, o = this._cikis(1); this._osc('sine', 48, t, .7, o, .8); this._osc('triangle', 95, t, .25, o, .4); }
  sigorta(i = 0) { if (!this.ctx) return; const t = this.t, o = this._cikis(.4); this._osc('square', 180, t, .04, o, .3); this._osc('sine', 60 + i * 20, t, .3, o, .4); }
  elektrikGeldi() {
    if (!this.ctx) return; const c = this.ctx, t = this.t, o = this._cikis(.6);
    const os = c.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(30, t); os.frequency.exponentialRampToValueAtTime(100, t + 1.4);
    const g = c.createGain(); this._zarf(g, t, .1, .9, .6, .12); const lp = c.createBiquadFilter(); lp.frequency.value = 600; os.connect(lp); lp.connect(g); g.connect(o); os.start(t); os.stop(t + 2);
    for (let k = 0; k < 6; k++) this._osc('square', 2000 + k * 100, t + .4 + k * .12, .03, o, .05);
  }
  elektrikGitti() {
    if (!this.ctx) return; const c = this.ctx, t = this.t, o = this._cikis(.8);
    const os = c.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(100, t); os.frequency.exponentialRampToValueAtTime(25, t + 1.2);
    const g = c.createGain(); this._zarf(g, t, .01, .4, .8, .2); os.connect(g); g.connect(o); os.start(t); os.stop(t + 1.5);
    this._osc('sine', 40, t, 1.4, o, .6);
  }
  vizilti() { // titreyen lamba
    if (!this.ctx) return; const t = this.t, o = this._cikis(.2);
    for (let k = 0; k < 5; k++) this._osc('square', 100, t + k * .07 + Math.random() * .03, .03, o, .05);
  }
  korku(guc = 1) { // ani gerilim vurgusu
    if (!this.ctx) return; const c = this.ctx, t = this.t, o = this._cikis(1);
    for (const f of [61, 65, 92, 130.8, 185]) { const os = c.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(f, t); os.frequency.linearRampToValueAtTime(f * 1.03, t + 2.5); const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06 * guc, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + 3); const lp = c.createBiquadFilter(); lp.frequency.value = 1400; os.connect(lp); lp.connect(g); g.connect(o); os.start(t); os.stop(t + 3.1); }
    this._osc('sine', 38, t, 2, o, .8 * guc);
  }
  kalp(n = 4) { if (!this.ctx) return; const t = this.t, o = this._cikis(0); for (let k = 0; k < n; k++) { this._osc('sine', 55, t + k * .85, .14, o, .7); this._osc('sine', 48, t + k * .85 + .22, .16, o, .5); } }
  esya() { if (!this.ctx) return; const t = this.t, o = this._cikis(.8); [72, 76, 79, 84].forEach((n, i) => this._osc('triangle', NOTA(n), t + i * .09, .9, o, .08)); }
  sabah() { if (!this.ctx) return; const t = this.t, o = this._cikis(1.4); [[60, 0], [64, .3], [67, .6], [71, .9], [74, 1.4], [79, 2.0]].forEach(([n, d]) => { this._osc('sine', NOTA(n), t + d, 5, o, .08, .8); this._osc('triangle', NOTA(n - 12), t + d, 4, o, .04, .8); }); }
  sayfa() { if (!this.ctx) return; const c = this.ctx, t = this.t; const s = this._gurultuKaynak(false), f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500; const g = c.createGain(); this._zarf(g, t, .03, .05, .15, .12); s.connect(f); f.connect(g); g.connect(this._cikis(.1)); s.start(t, Math.random(), .4); }

  // ------------------------------------------------------------ konumlu döngüler
  uzakAdim(p, n = 8, aralik = .55, yon = null) {
    if (!this.ctx) return; const c = this.ctx;
    for (let k = 0; k < n; k++) {
      const t = this.t + k * aralik, q = yon ? { x: p.x + yon.x * k * .7, y: 0, z: p.z + yon.z * k * .7 } : p;
      const pn = this._panner(q, 3, 1.2); pn.connect(this._cikis(.9));
      const s = this._gurultuKaynak(false), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 1.2;
      const g = c.createGain(); this._zarf(g, t, .004, .02, .14, .9); s.connect(f); f.connect(g); g.connect(pn); s.start(t, Math.random() * 2, .3);
    }
  }
  konumlu(tur, p) {
    if (!this.ctx) return { dur() {} };
    const c = this.ctx, pn = this._panner(p, 2.5, 1.3), cik = this._cikis(.5); pn.connect(cik);
    const ana = c.createGain(); ana.gain.value = 0; ana.gain.setTargetAtTime(1, this.t, .3); ana.connect(pn);
    const dugumler = []; let durdu = false;
    const h = { dur: () => { if (durdu) return; durdu = true; ana.gain.setTargetAtTime(0, this.t, .08); setTimeout(() => { dugumler.forEach(d => { try { d.stop(); } catch (e) {} }); clearInterval(h._iv); pn.disconnect(); }, 600); this.dongular.delete(h); } };
    this.dongular.add(h);
    if (tur === 'projektor') {
      const s = this._gurultuKaynak(); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200; const g = c.createGain(); g.gain.value = .15;
      const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 24; const lg = c.createGain(); lg.gain.value = .12; lfo.connect(lg); lg.connect(g.gain);
      s.connect(bp); bp.connect(g); g.connect(ana); s.start(); lfo.start(); dugumler.push(s, lfo);
      const m = c.createOscillator(); m.frequency.value = 120; const mg = c.createGain(); mg.gain.value = .05; m.connect(mg); mg.connect(ana); m.start(); dugumler.push(m);
      return h;
    }
    // melodiler: zamanlayıcıyla sırayla çalınır
    const melodi = tur === 'muzik'
      ? { tip: 'triangle', notalar: [76, 79, 81, 79, 76, 74, 76, 0, 72, 74, 76, 79, 76, 74, 72, 0, 69, 72, 74, 76, 74, 72, 69, 0, 67, 69, 72, 71, 72, 0, 0, 0], adim: .34, uz: 1.2, ses: .14, yavasla: true }
      : { tip: 'sine', notalar: [64, 67, 71, 69, 67, 64, 62, 64, 60, 64, 67, 66, 64, 0, 0, 0, 65, 69, 72, 71, 69, 65, 64, 65, 62, 65, 69, 67, 64, 0, 0, 0], adim: .3, uz: .55, ses: .12, akor: true };
    if (tur === 'plak') { // cızırtı
      const s = this._gurultuKaynak(); const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000; const g = c.createGain(); g.gain.value = .04; s.connect(hp); hp.connect(g); g.connect(ana); s.start(); dugumler.push(s);
    }
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = tur === 'plak' ? 2400 : 5000; lp.connect(ana);
    let i = 0, hiz = 1;
    const cal = () => {
      if (durdu) return;
      const n = melodi.notalar[i % melodi.notalar.length], t = this.t + .02;
      if (n) {
        this._osc(melodi.tip, NOTA(n), t, melodi.uz / hiz, lp, melodi.ses, .006);
        if (melodi.tip === 'triangle') this._osc('sine', NOTA(n + 12), t, melodi.uz * .5, lp, melodi.ses * .4);
      }
      if (melodi.akor && i % 8 === 0) { const kok = [48, 45, 41, 43][(i / 8) % 4]; [0, 7, 16].forEach(a => this._osc('sine', NOTA(kok + a), t, 2.2, lp, .05, .05)); }
      i++;
      if (melodi.yavasla && i % 32 === 0) hiz = Math.max(.6, hiz - .08);
    };
    cal(); h._iv = setInterval(cal, melodi.adim * 1000);
    return h;
  }
  hepsiniSustur() { for (const h of [...this.dongular]) h.dur(); }
}
