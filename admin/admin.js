"use strict";
/* Site yönetimi: duyurular.json dosyasını GitHub API üzerinden düzenler.
   Anahtar (token) koda yazılmaz; yalnızca kullanıcının tarayıcısında saklanır. */

if (window.top !== window.self) { document.documentElement.innerHTML = ""; throw new Error("Çerçeve içinde açılamaz"); }

const SAHIP = "enskygr234";
const DOSYA = "duyurular.json";
const SITELER = [
  { id: "winter", ad: "Winterdeveloper", repo: "Enskygr234/enskygr234.github.io", url: "https://enskygr234.github.io/" },
  { id: "ens", ad: "ENS Developer", repo: "Enskygr234/ensdewloper.github.io", url: "https://enskygr234.github.io/ensdewloper.github.io/" }
];
const ANAHTAR = "yonetim-token";

const $ = id => document.getElementById(id);
let token = null, site = null, kayitli = [], liste = [], sha = null, duzenlenen = null;

/* ---------- yardımcılar ---------- */
const bugun = () => { try { return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }); } catch (e) { return new Date().toISOString().slice(0, 10); } };
const kodla = s => { const b = new TextEncoder().encode(s); let t = ""; for (let i = 0; i < b.length; i += 0x8000) t += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(t); };
const coz = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, "")), c => c.charCodeAt(0)));
const yeniId = () => "d-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const trTarih = s => s ? new Date(s + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "";
const ayni = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function el(tag, ozellik, ...cocuk) {
  const e = document.createElement(tag);
  for (const k in ozellik || {}) { if (k === "class") e.className = ozellik[k]; else if (k.startsWith("on")) e.addEventListener(k.slice(2), ozellik[k]); else e.setAttribute(k, ozellik[k]); }
  cocuk.flat().forEach(c => c != null && e.append(c));
  return e;
}
function durum(metin, tur) { const d = $("durum"); d.textContent = metin || ""; d.className = "durum" + (tur ? " " + tur : ""); }
function sakla(t, kalici) {
  try { sessionStorage.removeItem(ANAHTAR); localStorage.removeItem(ANAHTAR); } catch (e) {}
  if (!t) return;
  try { (kalici ? localStorage : sessionStorage).setItem(ANAHTAR, t); } catch (e) {}
}
function oku() { try { return sessionStorage.getItem(ANAHTAR) || localStorage.getItem(ANAHTAR); } catch (e) { return null; } }

async function api(yol, secenek = {}) {
  const r = await fetch("https://api.github.com" + yol, {
    ...secenek, cache: "no-store",
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + token, ...(secenek.body ? { "Content-Type": "application/json" } : {}) }
  });
  if (r.status === 401) { cikisYap("Anahtarın süresi dolmuş ya da silinmiş. Yeni bir anahtarla giriş yap."); throw new Error("401"); }
  return r;
}

/* ---------- giriş ---------- */
async function girisYap(t, kalici) {
  token = t.trim();
  const r = await fetch("https://api.github.com/user", { cache: "no-store", headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + token } });
  if (r.status === 401) throw new Error("Anahtar geçersiz. Kopyalarken eksik kalmış olabilir, yeniden yapıştır.");
  if (!r.ok) throw new Error("GitHub'a ulaşılamadı (" + r.status + "). Biraz sonra tekrar dene.");
  const u = await r.json();
  if (String(u.login).toLowerCase() !== SAHIP) throw new Error("Bu anahtar " + u.login + " hesabına ait. Bu panele yalnızca site sahibi girebilir.");
  sakla(token, kalici);
  $("kimFoto").src = u.avatar_url; $("kimAd").textContent = u.login; $("kim").hidden = false;
  $("girisEkrani").hidden = true; $("panel").hidden = false;
  const varsayilan = location.pathname.startsWith("/ensdewloper.github.io") ? "ens" : "winter";
  sekmeleriCiz(varsayilan); await siteSec(varsayilan);
}
function cikisYap(mesaj) {
  sakla(null); token = null;
  $("kim").hidden = true; $("panel").hidden = true; $("girisEkrani").hidden = false;
  $("token").value = "";
  const h = $("girisHata"); h.textContent = mesaj || ""; h.hidden = !mesaj;
}
$("girisForm").addEventListener("submit", async e => {
  e.preventDefault();
  const t = $("token").value.trim(), h = $("girisHata"), b = $("girisDugme");
  if (!t) { h.textContent = "Önce anahtarı yapıştır."; h.hidden = false; return; }
  h.hidden = true; b.disabled = true; b.textContent = "Kontrol ediliyor…";
  try { await girisYap(t, $("hatirla").checked); }
  catch (err) { token = null; h.textContent = err.message; h.hidden = false; }
  finally { b.disabled = false; b.textContent = "Giriş yap"; }
});
$("token").addEventListener("input", () => { $("girisHata").hidden = true; });
$("cikis").addEventListener("click", () => {
  if (!ayni(liste, kayitli) && !onayIste("cikis")) return;
  cikisYap();
});

/* İki kez basınca onaylanan düğmeler (sayfa içi onay; tarayıcı pencereleri kullanılmaz) */
const bekleyen = {};
function onayIste(anahtar, dugme) {
  if (bekleyen[anahtar]) { clearTimeout(bekleyen[anahtar].z); delete bekleyen[anahtar]; return true; }
  const eski = dugme ? dugme.textContent : null;
  if (dugme) dugme.textContent = "Emin misin? Tekrar bas";
  else durum("Yayınlanmamış değişiklikler kaybolacak. Emin isen tekrar bas.", "kotu");
  bekleyen[anahtar] = { z: setTimeout(() => { delete bekleyen[anahtar]; if (dugme) dugme.textContent = eski; }, 3500) };
  return false;
}

/* ---------- site ---------- */
function sekmeleriCiz(secili) {
  $("sekmeler").replaceChildren(...SITELER.map(s => el("button", {
    class: "sekme", role: "tab", type: "button", "aria-selected": String(s.id === secili),
    onclick: async () => {
      if (site && site.id === s.id) return;
      if (!ayni(liste, kayitli) && !onayIste("sekme-" + s.id)) return;
      sekmeleriCiz(s.id); await siteSec(s.id);
    }
  }, s.ad)));
}
async function siteSec(id) {
  site = SITELER.find(s => s.id === id);
  $("siteAd").textContent = site.ad + " · duyurular";
  $("siteLink").href = site.url; $("siteLink").textContent = site.url.replace("https://", "");
  formuKapat(); liste = []; kayitli = []; ciz();
  durum("Yükleniyor…");
  await Promise.all([duyurulariYukle(), gecmisiYukle()]);
}
async function duyurulariYukle() {
  try {
    const r = await api(`/repos/${site.repo}/contents/${DOSYA}`);
    if (r.status === 404) { sha = null; kayitli = []; }
    else if (r.status === 403) throw new Error("Anahtarın bu depoyu okumaya izni yok. Anahtarda iki depoyu da seçtiğinden emin ol.");
    else if (!r.ok) throw new Error("Duyurular alınamadı (" + r.status + ").");
    else {
      const j = await r.json(); sha = j.sha;
      let v; try { v = JSON.parse(coz(j.content)); } catch (e) { throw new Error("duyurular.json bozuk görünüyor, GitHub'dan kontrol et."); }
      kayitli = Array.isArray(v.duyurular) ? v.duyurular : [];
    }
    liste = JSON.parse(JSON.stringify(kayitli));
    durum(kayitli.length ? "" : "Bu sitede henüz duyuru yok.");
    ciz();
  } catch (e) { if (e.message !== "401") durum(e.message, "kotu"); }
}
async function gecmisiYukle() {
  const ul = $("gecmis"); ul.replaceChildren();
  try {
    const r = await api(`/repos/${site.repo}/commits?per_page=6`);
    if (!r.ok) return;
    const c = await r.json();
    ul.replaceChildren(...c.map(k => {
      const t = new Date(k.commit.author.date);
      return el("li", null,
        el("a", { href: k.html_url, target: "_blank", rel: "noopener noreferrer" }, k.commit.message.split("\n")[0]),
        el("time", { datetime: t.toISOString() }, t.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })));
    }));
  } catch (e) {}
}

/* ---------- liste ---------- */
function hal(d) {
  const g = bugun();
  if (d.aktif === false) return ["kapali", "Kapalı"];
  if (d.bitis && d.bitis < g) return ["bitti", "Süresi doldu"];
  if (d.baslangic && d.baslangic > g) return ["plan", "Planlandı"];
  return ["yayinda", "Yayında"];
}
function ciz() {
  const ul = $("liste");
  if (!liste.length) { ul.replaceChildren(el("li", { class: "bos" }, "Duyuru yok. \"+ Yeni duyuru\" ile ilkini ekle.")); }
  else ul.replaceChildren(...liste.map((d, i) => {
    const [k, yazi] = hal(d);
    const aralik = d.baslangic || d.bitis ? `${trTarih(d.baslangic) || "Hemen"} → ${trTarih(d.bitis) || "süresiz"}` : "Süresiz";
    const sil = el("button", { class: "dugme hafif kucuk tehlike", type: "button" }, "Sil");
    sil.addEventListener("click", () => { if (onayIste("sil-" + d.id, sil)) { liste.splice(i, 1); ciz(); } });
    return el("li", { class: "oge " + (d.tur || "bilgi") },
      el("div", { class: "ust-bilgi" }, el("span", { class: "rozet " + k }, yazi), el("span", { class: "tarih" }, aralik)),
      el("p", null, d.metin),
      d.link ? el("a", { class: "oge-link", href: d.link, target: "_blank", rel: "noopener noreferrer" }, (d.linkAdi || "Ayrıntılar") + " ↗") : null,
      el("div", { class: "dugmeler" },
        el("button", { class: "dugme kucuk", type: "button", onclick: () => formuAc(d) }, "Düzenle"),
        el("button", { class: "dugme hafif kucuk", type: "button", onclick: () => { d.aktif = d.aktif === false; ciz(); } }, d.aktif === false ? "Aç" : "Kapat"),
        i > 0 ? el("button", { class: "dugme hafif kucuk", type: "button", "aria-label": "Yukarı taşı", onclick: () => { liste.splice(i - 1, 0, liste.splice(i, 1)[0]); ciz(); } }, "↑") : null,
        sil));
  }));
  $("yayin").hidden = ayni(liste, kayitli);
}

/* ---------- form ---------- */
function formuAc(d) {
  duzenlenen = d || null;
  $("duzenleBaslik").textContent = d ? "Duyuruyu düzenle" : "Yeni duyuru";
  $("duzenle").querySelector("[type=submit]").textContent = d ? "Değişikliği uygula" : "Listeye ekle";
  $("fMetin").value = d ? d.metin : "";
  $("fTur").value = d ? d.tur || "bilgi" : "bilgi";
  $("fLink").value = d ? d.link || "" : "";
  $("fLinkAdi").value = d ? d.linkAdi || "" : "";
  $("fBas").value = d ? d.baslangic || "" : bugun();
  $("fBit").value = d ? d.bitis || "" : "";
  $("fAktif").checked = d ? d.aktif !== false : true;
  $("formHata").hidden = true; sayac();
  $("duzenle").hidden = false; $("fMetin").focus();
}
function formuKapat() { $("duzenle").hidden = true; duzenlenen = null; }
function sayac() { $("fSayac").textContent = $("fMetin").value.length + " / 280"; }
$("fMetin").addEventListener("input", () => { sayac(); $("formHata").hidden = true; });
["fLink", "fBas", "fBit"].forEach(id => $(id).addEventListener("input", () => { $("formHata").hidden = true; }));
$("yeniDugme").addEventListener("click", () => formuAc(null));
$("vazgec").addEventListener("click", formuKapat);
$("duzenle").addEventListener("submit", e => {
  e.preventDefault();
  const h = $("formHata"), hata = m => { h.textContent = m; h.hidden = false; };
  const metin = $("fMetin").value.trim(), link = $("fLink").value.trim(), bas = $("fBas").value, bit = $("fBit").value;
  if (!metin) return hata("Duyuru metnini yaz.");
  if (link) { try { if (new URL(link).protocol !== "https:") throw 0; } catch (x) { return hata("Bağlantı https:// ile başlamalı."); } }
  if (bas && bit && bit < bas) return hata("Bitiş tarihi başlangıçtan önce olamaz.");
  const d = { id: duzenlenen ? duzenlenen.id : yeniId(), metin, tur: $("fTur").value, aktif: $("fAktif").checked };
  if (link) { d.link = link; const la = $("fLinkAdi").value.trim(); if (la) d.linkAdi = la; }
  if (bas) d.baslangic = bas;
  if (bit) d.bitis = bit;
  if (duzenlenen) liste[liste.indexOf(duzenlenen)] = d; else liste.unshift(d);
  formuKapat(); ciz();
  durum("Listeye eklendi. Siteye göndermek için \"Kaydet ve yayınla\"ya bas.");
});

/* ---------- yayınla ---------- */
$("geriAl").addEventListener("click", () => { liste = JSON.parse(JSON.stringify(kayitli)); formuKapat(); ciz(); durum(""); });
$("yayinla").addEventListener("click", async () => {
  const b = $("yayinla"); b.disabled = true; b.textContent = "Yayınlanıyor…";
  try {
    const icerik = JSON.stringify({ guncellendi: new Date().toISOString(), duyurular: liste }, null, 2) + "\n";
    const govde = { message: "Duyurular güncellendi (yönetim paneli)", content: kodla(icerik), branch: "main" };
    if (sha) govde.sha = sha;
    const r = await api(`/repos/${site.repo}/contents/${DOSYA}`, { method: "PUT", body: JSON.stringify(govde) });
    if (r.status === 409 || r.status === 422) throw new Error("Dosya bu arada başka yerden değişmiş. Sayfayı yenileyip değişikliğini tekrar yap.");
    if (r.status === 403 || r.status === 404) throw new Error("Anahtarın bu depoya yazma izni yok. Anahtarda Contents: Read and write olmalı.");
    if (!r.ok) throw new Error("Yayınlanamadı (" + r.status + "). Biraz sonra tekrar dene.");
    const j = await r.json(); sha = j.content.sha;
    kayitli = JSON.parse(JSON.stringify(liste)); ciz();
    durum("Yayınlandı. Sitede 1–2 dakika içinde görünür.", "iyi");
    gecmisiYukle();
  } catch (e) { if (e.message !== "401") durum(e.message, "kotu"); }
  finally { b.disabled = false; b.textContent = "Kaydet ve yayınla"; }
});
addEventListener("beforeunload", e => { if (token && !ayni(liste, kayitli)) { e.preventDefault(); e.returnValue = ""; } });

/* ---------- açılış ---------- */
(async () => {
  const t = oku();
  if (!t) return;
  $("girisDugme").disabled = true;
  try { await girisYap(t, (() => { try { return !!localStorage.getItem(ANAHTAR); } catch (e) { return false; } })()); }
  catch (e) { cikisYap(e.message); }
  finally { $("girisDugme").disabled = false; }
})();
