"use strict";
const P = (Array.isArray(window.P) ? window.P : []).filter(p => p && Array.isArray(p.dl) && (p.dl.length || p.web));
const CATS = [["all","Tümü"],["game","Oyunlar"],["app","Uygulamalar"],["tool","Windows araçları"],["web","Web"],["android","Android'e indir"],["windows","Windows'a indir"]];
const CAT_NAME = {game:"Oyun",app:"Uygulama",tool:"Araç",web:""};
const I = {
  dl:'<svg viewBox="0 0 24 24"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>',
  web:'<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>'
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl = u => { try { const x = new URL(u); return x.protocol === "https:" ? x.href : "#"; } catch (e) { return "#"; } };
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const size = mb => mb < 0.1 ? "<0,1 MB" : mb.toLocaleString("tr-TR",{maximumFractionDigits:1}) + " MB";
const platforms = p => { const s = new Set(p.dl.map(d => d.kind)); if (p.web) s.add("Web"); return [...s]; };

P.sort((a,b) => (a.id==="ensdewloper.github.io")-(b.id==="ensdewloper.github.io") || (b.dl.length>0)-(a.dl.length>0) || new Date(b.updated)-new Date(a.updated));

const count = f => P.filter(f).length;
const filters = {
  all: () => true, game: p => p.cat==="game", app: p => p.cat==="app", tool: p => p.cat==="tool", web: p => p.cat==="web",
  android: p => p.dl.some(d => d.kind==="Android"), windows: p => p.dl.some(d => d.kind==="Windows")
};
document.getElementById("stats").innerHTML = [
  [P.length,"proje"],[count(filters.game),"oyun"],[count(filters.android),"Android uygulaması"],[count(filters.windows),"Windows programı"]
].map(([n,t]) => `<div class="stat"><b>${n}</b><small>${t}</small></div>`).join("");

let cat = "all";
try { const s = localStorage.getItem("wd-cat"); if (s && has(filters, s)) cat = s; } catch(e) {}
const chips = document.getElementById("chips");
function drawChips(){
  chips.innerHTML = CATS.map(([k,t]) => `<button class="chip${k===cat?" on":""}" data-k="${k}">${t}<em>${count(filters[k])}</em></button>`).join("");
}
chips.addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  if (!has(filters, b.dataset.k)) return;
  cat = b.dataset.k; try { localStorage.setItem("wd-cat", cat); } catch(e) {}
  drawChips(); render();
});

function card(p){
  const dls = p.dl.map(d => `<a class="btn dl" href="${esc(safeUrl(d.url))}" rel="noopener noreferrer" download>${I.dl}${esc(d.name || d.kind)} <small>${size(d.mb)}</small></a>`).join("");
  const web = p.web ? `<a class="btn" href="${esc(safeUrl(p.web))}" target="_blank" rel="noopener noreferrer">${I.web}${p.dl.length ? "Web'de aç" : "Aç"}</a>` : "";
  const badges = [CAT_NAME[p.cat] ? `<span class="badge">${CAT_NAME[p.cat]}</span>` : "", ...platforms(p).map(k => `<span class="badge ${esc(k)}">${esc(k)}</span>`), p.lang ? `<span class="badge">${esc(p.lang)}</span>` : ""].join("");
  return `<article class="card">
    <div class="top"><div class="ic">${esc(p.icon)}</div><div><h3>${esc(p.title)}</h3><div class="meta">${badges}</div></div></div>
    <p class="desc">${esc(p.desc)}</p>
    <div class="acts">${dls}${web}</div>
  </article>`;
}

const grid = document.getElementById("grid"), q = document.getElementById("q");
const norm = s => s.toLocaleLowerCase("tr-TR");
function render(){
  const t = norm(q.value.trim());
  const list = P.filter(filters[cat]).filter(p => !t || norm(p.title + " " + p.desc + " " + (p.lang||"") + " " + platforms(p).join(" ")).includes(t));
  grid.innerHTML = list.length ? list.map(card).join("") : `<div class="empty">“${esc(q.value)}” için proje bulunamadı.</div>`;
}
q.addEventListener("input", render);
drawChips(); render();

/* kar yağışı */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.getElementById("snow"), x = c.getContext("2d");
  let W, H, F = [];
  const fit = () => { const d = Math.min(devicePixelRatio||1, 2); W = c.width = innerWidth*d; H = c.height = innerHeight*d; c.style.width = innerWidth+"px"; c.style.height = innerHeight+"px";
    const n = Math.round(Math.min(110, innerWidth/12)); F = Array.from({length:n}, () => ({x:Math.random()*W, y:Math.random()*H, r:(Math.random()*1.8+.6)*d, s:(Math.random()*.6+.3)*d, w:Math.random()*6.28, o:Math.random()*.5+.3})); };
  fit(); addEventListener("resize", fit);
  (function f(){
    x.clearRect(0,0,W,H);
    for (const p of F) { p.y += p.s; p.w += .01; p.x += Math.sin(p.w)*.4;
      if (p.y > H) { p.y = -5; p.x = Math.random()*W; }
      x.globalAlpha = p.o; x.fillStyle = "#fff"; x.beginPath(); x.arc(p.x,p.y,p.r,0,6.283); x.fill(); }
    requestAnimationFrame(f);
  })();
})();
