// Küçük yardımcılar: çok sayıda kutu ve silindiri tek bir ağa (mesh) toplamak, renk, rastgele sayı.
import * as THREE from '../lib/three.module.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3();

// Parçaları köşe renkleriyle tek geometride birleştirir: yüzlerce kutu = tek çizim çağrısı
export class Toplayici {
  constructor() { this.pos = []; this.nor = []; this.col = []; }
  _ekle(geo, x, y, z, renk, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
    _m.compose(_p, _q, _s);
    g.applyMatrix4(_m);
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    const c = new THREE.Color(renk);
    for (let i = 0; i < p.length; i++) { this.pos.push(p[i]); this.nor.push(n[i]); }
    for (let i = 0; i < p.length / 3; i++) this.col.push(c.r, c.g, c.b);
    return this;
  }
  kutu(w, h, d, x, y, z, renk, ry = 0, rx = 0, rz = 0) { return this._ekle(new THREE.BoxGeometry(w, h, d), x, y, z, renk, rx, ry, rz); }
  silindir(rUst, rAlt, h, x, y, z, renk, seg = 10, rx = 0, ry = 0, rz = 0) { return this._ekle(new THREE.CylinderGeometry(rUst, rAlt, h, seg), x, y, z, renk, rx, ry, rz); }
  kure(r, x, y, z, renk, seg = 8, sx = 1, sy = 1, sz = 1) { return this._ekle(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), x, y, z, renk, 0, 0, 0, sx, sy, sz); }
  koni(r, h, x, y, z, renk, seg = 7, ry = 0) { return this._ekle(new THREE.ConeGeometry(r, h, seg), x, y, z, renk, 0, ry, 0); }
  geometri() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }
  mesh(mat) { return new THREE.Mesh(this.geometri(), mat || new THREE.MeshLambertMaterial({ vertexColors: true })); }
}

export function tohumlu(s) {
  let a = s | 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export const yumusak = t => t * t * (3 - 2 * t);
export const karis = (a, b, t) => a + (b - a) * t;

// Canvas ile yazı dokusu (tabela, bilet vb.)
export function yaziDokusu(cizici, w = 512, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  cizici(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
