/* ENS Developer · ortak betik
   Kuzey ışıkları, imlece tepki veren kar, kaydırınca belirme, eğilen kartlar,
   tıklayınca kar patlaması, sayan sayılar, kaydırma çubuğu. */
(function () {
  const kok = document.documentElement;
  kok.classList.add("js");
  const sakin = false; // site sahibi animasyonların her cihazda görünmesini istiyor
  const dokunmatik = matchMedia("(hover: none)").matches;

  /* ---------- Kaydırınca belirme ---------- */
  let io = null;
  function belirt(kapsam) {
    const ogeler = (kapsam || document).querySelectorAll("[data-belir]:not(.gorundu)");
    if (sakin || !("IntersectionObserver" in window)) { ogeler.forEach(o => o.classList.add("gorundu")); return; }
    if (!io) io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("gorundu"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    ogeler.forEach(o => io.observe(o));
  }

  /* ---------- Sayan sayılar ---------- */
  function say(e, hedef, sure) {
    if (sakin || isNaN(hedef)) { e.textContent = hedef; return; }
    const bas = performance.now(); sure = sure || 1600;
    (function kare(t) {
      const p = Math.min(1, (t - bas) / sure), y = 1 - Math.pow(1 - p, 4);
      e.textContent = Math.round(hedef * y);
      if (p < 1) requestAnimationFrame(kare);
    })(bas);
  }
  function sayaclariKur(kapsam) {
    const ogeler = (kapsam || document).querySelectorAll("[data-hedef]");
    if (!("IntersectionObserver" in window)) { ogeler.forEach(e => say(e, +e.dataset.hedef)); return; }
    const sio = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { say(en.target, +en.target.dataset.hedef); sio.unobserve(en.target); }
    }), { threshold: .4 });
    ogeler.forEach(e => sio.observe(e));
  }

  window.ENS = { belirt, say, sayaclariKur, sakin };

  document.addEventListener("DOMContentLoaded", () => {
    // Gökyüzü katmanı ve kaydırma çubuğu
    if (!document.querySelector(".gok")) {
      const g = document.createElement("div"); g.className = "gok"; g.setAttribute("aria-hidden", "true");
      g.innerHTML = "<i></i><i></i><i></i>"; document.body.prepend(g);
    }
    const bar = document.createElement("div"); bar.className = "ilerleme"; bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    const ust = document.querySelector(".ust");
    const kaydir = () => {
      if (ust) ust.classList.toggle("kaydi", scrollY > 8);
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    };
    addEventListener("scroll", kaydir, { passive: true }); kaydir();

    document.querySelectorAll("[data-yil]").forEach(e => e.textContent = new Date().getFullYear());
    belirt(); sayaclariKur(); karYagdir();

    // Eğilen kartlar + imleç ışığı
    if (!dokunmatik && !sakin) {
      let aktif = null;
      document.addEventListener("pointermove", e => {
        const k = e.target.closest && e.target.closest("[data-egim]");
        if (aktif && aktif !== k) { aktif.style.transform = ""; aktif = null; }
        if (!k) return;
        aktif = k;
        const r = k.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        const guc = +(k.dataset.egim || 7);
        k.style.setProperty("--mx", px * 100 + "%"); k.style.setProperty("--my", py * 100 + "%");
        k.style.transform = `perspective(900px) rotateX(${(.5 - py) * guc}deg) rotateY(${(px - .5) * guc}deg) translateY(-4px)`;
      }, { passive: true });
      document.addEventListener("pointerleave", () => { if (aktif) aktif.style.transform = ""; });
    }

    // Tıklayınca kar patlaması
    if (!sakin) document.addEventListener("pointerdown", e => {
      if (e.target.closest("input, textarea, canvas, video, dialog")) return;
      const n = 9;
      for (let i = 0; i < n; i++) {
        const s = document.createElement("span"); s.className = "kar-patla"; s.textContent = "❄";
        const a = (i / n) * Math.PI * 2 + Math.random() * .5, d = 40 + Math.random() * 50;
        s.style.left = e.clientX - 7 + "px"; s.style.top = e.clientY - 9 + "px";
        s.style.fontSize = 9 + Math.random() * 10 + "px";
        s.style.setProperty("--dx", Math.cos(a) * d + "px"); s.style.setProperty("--dy", Math.sin(a) * d + 20 + "px");
        s.style.setProperty("--dr", (Math.random() * 360 - 180) + "deg");
        document.body.appendChild(s); setTimeout(() => s.remove(), 950);
      }
      if (karHavaFiskirt) karHavaFiskirt(e.clientX, e.clientY);
    });
  });

  /* ---------- İmlece tepki veren, katmanlı kar ---------- */
  let karHavaFiskirt = null;
  function karYagdir() {
    if (sakin) return;
    let c = document.getElementById("kar");
    if (!c) { c = document.createElement("canvas"); c.id = "kar"; c.setAttribute("aria-hidden", "true"); document.body.prepend(c); }
    const x = c.getContext("2d");
    let w, h, taneler = [], fare = { x: -999, y: -999 }, ruzgar = 0, sonScroll = scrollY;

    function boyut() {
      const d = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      c.width = w * d; c.height = h * d; x.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.round(Math.min(170, w * h / 7500));
      taneler = Array.from({ length: n }, () => yeniTane(true));
    }
    function yeniTane(rastgeleY) {
      const z = Math.random(); // derinlik: 0 uzak, 1 yakın
      return { x: Math.random() * w, y: rastgeleY ? Math.random() * h : -10, z, r: .6 + z * 2.6, f: Math.random() * 6, vx: 0, vy: 0 };
    }
    addEventListener("resize", boyut); boyut();
    addEventListener("pointermove", e => { fare.x = e.clientX; fare.y = e.clientY; }, { passive: true });
    addEventListener("scroll", () => { ruzgar += (scrollY - sonScroll) * .02; sonScroll = scrollY; }, { passive: true });
    karHavaFiskirt = (fx, fy) => {
      for (const k of taneler) {
        const dx = k.x - fx, dy = k.y - fy, m = Math.hypot(dx, dy);
        if (m < 160 && m > 0) { const g = (1 - m / 160) * 260; k.vx += dx / m * g; k.vy += dy / m * g; }
      }
    };

    let son = performance.now(), calisiyor = true;
    document.addEventListener("visibilitychange", () => {
      calisiyor = !document.hidden;
      if (calisiyor) { son = performance.now(); requestAnimationFrame(ciz); }
    });
    function ciz(t) {
      if (!calisiyor) return;
      const dt = Math.min(.05, (t - son) / 1000); son = t;
      ruzgar *= .94;
      x.clearRect(0, 0, w, h);
      for (const k of taneler) {
        // imleçten kaçış
        const dx = k.x - fare.x, dy = k.y - fare.y, m = dx * dx + dy * dy;
        if (m < 9000) { const g = (1 - m / 9000) * 600 * dt; const l = Math.sqrt(m) || 1; k.vx += dx / l * g * 6; k.vy += dy / l * g * 3; }
        k.vx *= .92; k.vy *= .92;
        k.f += dt * (.6 + k.z);
        k.y += ((14 + k.r * 16) * (.5 + k.z * .7) - ruzgar * 30 * k.z) * dt + k.vy * dt;
        k.x += (Math.sin(k.f) * (8 + k.z * 10) + k.vx) * dt;
        if (k.y > h + 8) Object.assign(k, yeniTane(false));
        if (k.y < -20) k.y = h + 5;
        if (k.x < -10) k.x = w + 10; else if (k.x > w + 10) k.x = -10;
        x.fillStyle = `rgba(255,255,255,${.25 + k.z * .6})`;
        x.beginPath(); x.arc(k.x, k.y, k.r, 0, 6.283); x.fill();
      }
      requestAnimationFrame(ciz);
    }
    requestAnimationFrame(ciz);
  }
})();
