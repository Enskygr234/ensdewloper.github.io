"use strict";
/* Duyuru kartı: duyurular.json dosyasındaki aktif duyuruları sayfanın altında gösterir.
   Duyurular admin panelinden (/admin/) düzenlenir. Kapatılan duyuru o cihazda bir daha çıkmaz. */
(function () {
  var kaynak = document.currentScript && document.currentScript.src;
  if (!kaynak || !window.fetch) return;
  var url = new URL("duyurular.json", kaynak).href;
  var KAPALI = "duyuru-kapali";

  function bugun() {
    try { return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function kapatilanlar() {
    try { return JSON.parse(localStorage.getItem(KAPALI) || "[]"); } catch (e) { return []; }
  }
  function kapat(id) {
    try { var l = kapatilanlar().filter(function (x) { return x !== id; }); l.push(id); localStorage.setItem(KAPALI, JSON.stringify(l.slice(-50))); } catch (e) {}
  }
  function guvenliLink(u) {
    try { var x = new URL(u, location.href); return x.protocol === "https:" || x.origin === location.origin ? x.href : null; } catch (e) { return null; }
  }

  function goster(liste) {
    var kutu = document.createElement("div");
    kutu.className = "duyuru-yigin";
    kutu.setAttribute("role", "region");
    kutu.setAttribute("aria-label", "Duyurular");
    liste.forEach(function (d) {
      var kart = document.createElement("div");
      kart.className = "duyuru-kart duyuru-" + (["bilgi", "onemli", "kutlama"].indexOf(d.tur) >= 0 ? d.tur : "bilgi");
      var ikon = document.createElement("span");
      ikon.className = "duyuru-ikon"; ikon.setAttribute("aria-hidden", "true");
      ikon.textContent = d.tur === "onemli" ? "!" : d.tur === "kutlama" ? "★" : "i";
      var govde = document.createElement("div");
      govde.className = "duyuru-govde";
      var p = document.createElement("p");
      p.textContent = d.metin;
      govde.appendChild(p);
      var href = d.link ? guvenliLink(d.link) : null;
      if (href) {
        var a = document.createElement("a");
        a.href = href; a.textContent = d.linkAdi || "Ayrıntılar";
        if (new URL(href).origin !== location.origin) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        govde.appendChild(a);
      }
      var b = document.createElement("button");
      b.type = "button"; b.className = "duyuru-kapat"; b.setAttribute("aria-label", "Duyuruyu kapat");
      b.textContent = "×";
      b.addEventListener("click", function () { kapat(d.id); kart.remove(); if (!kutu.children.length) kutu.remove(); });
      kart.appendChild(ikon); kart.appendChild(govde); kart.appendChild(b);
      kutu.appendChild(kart);
    });
    document.body.appendChild(kutu);
  }

  fetch(url, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (veri) {
    if (!veri || !Array.isArray(veri.duyurular)) return;
    var g = bugun(), kapali = kapatilanlar();
    var aktif = veri.duyurular.filter(function (d) {
      return d && d.aktif !== false && typeof d.metin === "string" && d.metin.trim() &&
        (!d.baslangic || d.baslangic <= g) && (!d.bitis || d.bitis >= g) && kapali.indexOf(d.id) < 0;
    }).slice(0, 3);
    if (!aktif.length) return;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { goster(aktif); });
    else goster(aktif);
  }).catch(function () {});
})();
