/* ENS Developer · ortak betik: tema, kar yağışı, üst çubuk, yıl */
(function () {
  const kok = document.documentElement;

  // Tema: kayıtlı seçim > sistem tercihi
  let kayitli = null;
  try { kayitli = localStorage.getItem("ensTema"); } catch (e) {}
  if (kayitli === "acik" || kayitli === "koyu") kok.dataset.tema = kayitli;

  const koyuMu = () => kok.dataset.tema ? kok.dataset.tema === "koyu" : matchMedia("(prefers-color-scheme: dark)").matches;

  function dugmeyiGuncelle() {
    document.querySelectorAll(".tema-dugme").forEach(b => {
      const k = koyuMu();
      b.textContent = k ? "☀" : "☾";
      b.setAttribute("aria-label", k ? "Açık temaya geç" : "Koyu temaya geç");
      b.title = b.getAttribute("aria-label");
    });
    const renk = getComputedStyle(kok).getPropertyValue("--zemin").trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && renk) meta.content = renk;
  }

  document.addEventListener("DOMContentLoaded", () => {
    dugmeyiGuncelle();
    document.querySelectorAll(".tema-dugme").forEach(b => b.addEventListener("click", () => {
      kok.dataset.tema = koyuMu() ? "acik" : "koyu";
      try { localStorage.setItem("ensTema", kok.dataset.tema); } catch (e) {}
      dugmeyiGuncelle();
      document.dispatchEvent(new CustomEvent("temadegisti"));
    }));

    const ust = document.querySelector(".ust");
    if (ust) {
      const bak = () => ust.classList.toggle("kaydi", scrollY > 8);
      addEventListener("scroll", bak, { passive: true }); bak();
    }
    document.querySelectorAll("[data-yil]").forEach(e => e.textContent = new Date().getFullYear());
    karYagdir();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", dugmeyiGuncelle);

  // Hafif kar yağışı
  function karYagdir() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = document.getElementById("kar");
    if (!c) return;
    const x = c.getContext("2d");
    let w, h, taneler = [], renk = "255,255,255";
    const renkAl = () => { renk = getComputedStyle(kok).getPropertyValue("--kar-rengi").trim() || "255,255,255"; };
    document.addEventListener("temadegisti", renkAl);
    matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", renkAl);
    renkAl();

    function boyut() {
      const d = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      c.width = w * d; c.height = h * d;
      x.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.round(Math.min(110, w * h / 12000));
      taneler = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: .7 + Math.random() * 2, s: .35 + Math.random() * .8, f: Math.random() * 6
      }));
    }
    addEventListener("resize", boyut); boyut();

    let son = performance.now(), calisiyor = true;
    document.addEventListener("visibilitychange", () => {
      calisiyor = !document.hidden;
      if (calisiyor) { son = performance.now(); requestAnimationFrame(ciz); }
    });
    function ciz(t) {
      if (!calisiyor) return;
      const dt = Math.min(.05, (t - son) / 1000); son = t;
      x.clearRect(0, 0, w, h);
      for (const k of taneler) {
        k.y += (18 + k.r * 16) * k.s * dt * 1.5;
        k.f += dt;
        k.x += Math.sin(k.f) * 10 * dt;
        if (k.y > h + 5) { k.y = -5; k.x = Math.random() * w; }
        x.fillStyle = `rgba(${renk},${.35 + k.r / 5})`;
        x.beginPath(); x.arc(k.x, k.y, k.r, 0, 6.283); x.fill();
      }
      requestAnimationFrame(ciz);
    }
    requestAnimationFrame(ciz);
  }
})();
