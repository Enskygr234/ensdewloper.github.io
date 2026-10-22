(() => {
  "use strict";

  // ---------- Depolama ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* yer yoksa sessizce geç */ }
    }
  };
  let userRecipes = store.get("tarif.user", []);
  let favs = new Set(store.get("tarif.favs", []));
  const saveUser = () => store.set("tarif.user", userRecipes);
  const saveFavs = () => store.set("tarif.favs", [...favs]);

  // Dünya mutfağından açılan tarifler (favoriler ve son açılanlar internetsiz de görünsün diye saklanır)
  let apiRecipes = store.get("tarif.api", {});
  function saveApi() {
    const ids = Object.keys(apiRecipes);
    const silinecek = ids.filter(id => !favs.has(id)).slice(0, Math.max(0, ids.length - 40));
    silinecek.forEach(id => delete apiRecipes[id]);
    store.set("tarif.api", apiRecipes);
  }
  function putApi(r) { delete apiRecipes[r.id]; apiRecipes[r.id] = r; saveApi(); }

  const allRecipes = () => [...userRecipes, ...DEFAULT_RECIPES];
  const findRecipe = id => allRecipes().find(r => r.id === id) || apiRecipes[id];
  const isUserRecipe = id => userRecipes.some(r => r.id === id);

  // ---------- Yardımcılar ----------
  const $ = sel => document.querySelector(sel);
  const app = $("#app");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => s.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  // Malzemenin başındaki miktarı porsiyona göre ölçekler: "1.5 su bardağı un" → "<b>3</b> su bardağı un"
  function scaleIngredient(text, factor) {
    const m = text.match(/^(\d+(?:[.,]\d+)?)(\s+)(.*)$/);
    if (!m) return esc(text);
    const n = parseFloat(m[1].replace(",", ".")) * factor;
    return `<b>${formatAmount(n)}</b>${m[2]}${esc(m[3])}`;
  }
  function formatAmount(n) {
    const rounded = Math.round(n * 4) / 4; // çeyreğe yuvarla
    if (rounded === 0.5) return "yarım";
    if (rounded === 0.25) return "çeyrek";
    return rounded.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  }

  // ---------- Zamanlayıcılar ----------
  const timers = {}; // key → bitiş zamanı (ms)
  function timerKey(rid, i) { return rid + "#" + i; }
  function fmtTime(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach(at => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.3, ctx.currentTime + at);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.3);
        o.start(ctx.currentTime + at); o.stop(ctx.currentTime + at + 0.3);
      });
    } catch { /* ses yoksa geç */ }
    if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
  }
  setInterval(() => {
    const now = Date.now();
    for (const [key, end] of Object.entries(timers)) {
      const btn = document.querySelector(`[data-timer="${CSS.escape(key)}"]`);
      if (end <= now) {
        delete timers[key];
        beep();
        const [rid, i] = key.split("#");
        const r = findRecipe(rid);
        toast(`⏰ Süre doldu: ${r ? r.name : ""} – adım ${+i + 1}`);
        if (btn) { btn.classList.remove("running"); btn.querySelector("span").textContent = btn.dataset.label; }
      } else if (btn) {
        btn.querySelector("span").textContent = fmtTime(end - now);
      }
    }
  }, 500);

  // ---------- Ekranı açık tutma ----------
  let wakeLock = null;
  let keepAwake = store.get("tarif.awake", false);
  async function applyWakeLock(on) {
    try {
      if (on && "wakeLock" in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => { wakeLock = null; });
      } else if (!on && wakeLock) {
        await wakeLock.release(); wakeLock = null;
      }
    } catch { wakeLock = null; }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && keepAwake && location.hash.startsWith("#/r/")) applyWakeLock(true);
  });

  // ---------- Üst bar ----------
  function setHeader(title, { back = false, favId = null } = {}) {
    $("#title").textContent = title;
    $("#backBtn").hidden = !back;
    const fb = $("#favBtn");
    fb.hidden = !favId;
    if (favId) {
      fb.classList.toggle("on", favs.has(favId));
      fb.onclick = () => {
        favs.has(favId) ? favs.delete(favId) : favs.add(favId);
        saveFavs();
        fb.classList.toggle("on", favs.has(favId));
        toast(favs.has(favId) ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
      };
    }
  }
  $("#backBtn").onclick = () => (history.length > 1 ? history.back() : (location.hash = "#/"));

  function setTab(name) {
    document.querySelectorAll(".tabbar button").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  }
  document.querySelectorAll(".tabbar button").forEach(b => {
    b.onclick = () => { location.hash = { list: "#/", kesfet: "#/kesfet", dolap: "#/dolap", favs: "#/favs", add: "#/add" }[b.dataset.tab]; };
  });

  // ---------- Liste ----------
  let listState = { q: "", cat: "Tümü" };

  function cardHTML(r, rozet = "") {
    const thumb = r.img
      ? `<img src="${esc(r.img)}/preview" alt="" loading="lazy" onerror="this.onerror=null;this.src='${esc(r.img)}'">`
      : esc(r.emoji || "🍽️");
    return `<button class="card" data-id="${esc(r.id)}">
      <div class="thumb${r.img ? " photo" : ""}">${thumb}</div>
      <div class="card-body">
        <h3>${esc(r.name)}</h3>
        <div class="meta">${r.time ? `<span>⏱ ${r.time} dk</span>` : ""}${r.area ? `<span>🌍 ${esc(r.area)}</span>` : `<span>👥 ${r.servings} kişilik</span>`}<span>${esc(r.cat)}</span></div>
        ${rozet}
      </div>
      ${favs.has(r.id) ? '<span class="heart">♥</span>' : ""}
    </button>`;
  }
  // Dünya mutfağı arama sonucu kartı (henüz açılmamış, özet bilgi)
  function apiCardHTML(x, rozet = "") {
    const kayitli = apiRecipes[x.id];
    const ad = (kayitli && kayitli.tr && kayitli.name) || x.name || Dunya.hazirAd(x.nameEn) || x.nameEn;
    return cardHTML({ id: x.id, name: ad, img: x.img, area: x.area || (kayitli && kayitli.area) || "Dünya", cat: x.cat || (kayitli && kayitli.cat) || "", time: kayitli && kayitli.time }, rozet);
  }
  function adlariGuncelle(kutu, liste) {
    const cevrilecek = liste.filter(x => !Dunya.hazirAd(x.nameEn) && !(apiRecipes[x.id] && apiRecipes[x.id].tr)).slice(0, 30);
    if (!cevrilecek.length) return;
    Dunya.adlariCevir(cevrilecek).then(l => {
      for (const x of l) {
        const h = kutu.querySelector(`.card[data-id="${CSS.escape(x.id)}"] h3`);
        if (h && x.name) h.textContent = x.name;
      }
    });
  }
  function bindCards() {
    app.querySelectorAll(".card").forEach(c => { c.onclick = () => (location.hash = "#/r/" + encodeURIComponent(c.dataset.id)); });
  }

  function renderList() {
    setHeader("Tarifler"); setTab("list");
    const cats = ["Tümü", ...CATEGORIES.filter(c => allRecipes().some(r => r.cat === c))];
    app.innerHTML = `
      <div class="search">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input id="q" type="search" placeholder="Tarif ya da malzeme ara…" value="${esc(listState.q)}" autocomplete="off">
      </div>
      <div class="chips">${cats.map(c => `<button class="chip ${c === listState.cat ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      <div class="grid" id="grid"></div>`;
    const draw = () => {
      const q = norm(listState.q.trim());
      const list = allRecipes().filter(r =>
        (listState.cat === "Tümü" || r.cat === listState.cat) &&
        (!q || norm(r.name).includes(q) || r.ingredients.some(i => norm(i).includes(q))));
      $("#grid").innerHTML = list.length ? list.map(cardHTML).join("")
        : `<div class="empty"><span class="big">🔍</span>Bu aramaya uyan tarif yok.</div>`;
      bindCards();
    };
    $("#q").oninput = e => { listState.q = e.target.value; draw(); };
    app.querySelectorAll(".chip").forEach(ch => {
      ch.onclick = () => {
        listState.cat = ch.dataset.cat;
        app.querySelectorAll(".chip").forEach(x => x.classList.toggle("active", x === ch));
        draw();
      };
    });
    draw();
  }

  function renderFavs() {
    setHeader("Favoriler"); setTab("favs");
    const list = [...allRecipes(), ...Object.values(apiRecipes)].filter(r => favs.has(r.id));
    app.innerHTML = list.length
      ? `<div class="grid">${list.map(cardHTML).join("")}</div>`
      : `<div class="empty"><span class="big">♡</span>Henüz favorin yok.<br>Bir tarifi açıp sağ üstteki kalbe dokun.</div>`;
    bindCards();
  }

  // ---------- Tarif detayı ----------
  const checked = {}; // tarif id → { ing:Set, step:Set }
  const servingsState = {};

  const ceviriDurum = {}; // tarif id → "busy" | "fail"
  const orijinal = {};    // tarif id → İngilizce aslı gösterilsin mi

  function yukleniyor(mesaj) {
    return `<div class="empty"><span class="spinner" aria-hidden="true"></span>${esc(mesaj)}</div>`;
  }
  function hataHTML(mesaj) {
    return `<div class="empty"><span class="big">📡</span>${esc(mesaj)}<br><button class="btn secondary retry" id="retry">Tekrar dene</button></div>`;
  }

  function renderRecipe(id) {
    let r = findRecipe(id);
    if (!r && id.startsWith("m-")) {
      setHeader("Tarif", { back: true }); setTab(null);
      app.innerHTML = yukleniyor("Tarif getiriliyor…");
      Dunya.getir(id.slice(2)).then(rec => {
        if (!rec) { app.innerHTML = `<div class="empty"><span class="big">🤷</span>Bu tarif bulunamadı.</div>`; return; }
        putApi(rec);
        if (location.hash === "#/r/" + encodeURIComponent(id)) renderRecipe(id);
      }).catch(() => {
        app.innerHTML = hataHTML("Tarif yüklenemedi. İnternet bağlantını kontrol et.");
        $("#retry").onclick = () => renderRecipe(id);
      });
      return;
    }
    if (!r) { location.hash = "#/"; return; }
    if (r.api) apiCeviriBaslat(r);
    const ingil = r.api && orijinal[id];
    const malzemeler = ingil ? r.ingredientsEn : r.ingredients;
    const adimlar = ingil ? r.steps.map((s, i) => ({ ...s, t: r.stepsEn[i] })) : r.steps;
    const besin = Besin.hesapla(r.calc || r.ingredients, r.servings);
    setHeader(r.name, { back: true, favId: r.id }); setTab(null);
    const st = checked[id] || (checked[id] = { ing: new Set(), step: new Set() });
    const sv = servingsState[id] || r.servings;
    const factor = sv / r.servings;

    app.innerHTML = `
      <div class="hero${r.img ? " has-img" : ""}">
        ${r.img ? `<img class="hero-img" src="${esc(r.img)}" alt="${esc(r.name)}">` : `<div class="emoji">${esc(r.emoji || "🍽️")}</div>`}
        <h2>${esc(ingil ? r.nameEn : r.name)}</h2>
        <div class="meta">${r.time ? `<span>⏱ ${r.time} dk</span>` : ""}${r.area ? `<span>🌍 ${esc(r.area)} mutfağı</span>` : ""}<span>${esc(r.cat)}</span></div>
      </div>
      ${r.api ? ceviriBandi(r) : ""}

      ${besin.bulunan ? `<div class="nutri">
        <div class="kcal"><b>${besin.kcal}</b><span>kcal / porsiyon</span></div>
        <div class="macro"><b>${besin.p} g</b><span>Protein</span></div>
        <div class="macro"><b>${besin.k} g</b><span>Karbonhidrat</span></div>
        <div class="macro"><b>${besin.y} g</b><span>Yağ</span></div>
        <p>Yaklaşık değer · ${besin.toplam} malzemenin ${besin.bulunan} tanesi hesaba katıldı${r.api ? " · 4 porsiyon varsayıldı" : ""}</p>
      </div>` : ""}

      <div class="section-title">
        <h3>Malzemeler</h3>
        <div class="stepper">
          <button id="svMinus" aria-label="Azalt">−</button>
          <span>${sv} kişilik</span>
          <button id="svPlus" aria-label="Artır">+</button>
        </div>
      </div>
      <ul class="ingredients">
        ${malzemeler.map((ing, i) => `<li><label><input type="checkbox" data-ing="${i}" ${st.ing.has(i) ? "checked" : ""}><span>${scaleIngredient(ing, factor)}</span></label></li>`).join("")}
      </ul>

      <div class="section-title"><h3>Yapılışı</h3></div>
      <ol class="steps">
        ${adimlar.map((s, i) => {
          const key = timerKey(r.id, i);
          const label = s.dk ? `${s.dk} dk zamanlayıcı` : "";
          const running = timers[key];
          return `<li class="${st.step.has(i) ? "done" : ""}" data-step="${i}">
            <div>${esc(s.t)}</div>
            ${s.dk ? `<button class="timer-btn ${running ? "running" : ""}" data-timer="${esc(key)}" data-min="${s.dk}" data-label="${label}">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>
              <span>${running ? fmtTime(running - Date.now()) : label}</span></button>` : ""}
          </li>`;
        }).join("")}
      </ol>

      <label class="switch"><span>☀️ Pişirirken ekran açık kalsın</span><input type="checkbox" id="awake" ${keepAwake ? "checked" : ""}></label>

      ${r.youtube || r.source ? `<div class="links">
        ${r.youtube ? `<a class="btn secondary" href="${esc(r.youtube)}" target="_blank" rel="noopener">▶ Videosunu izle</a>` : ""}
        ${r.source ? `<a class="btn secondary" href="${esc(r.source)}" target="_blank" rel="noopener">Kaynak site</a>` : ""}
      </div>` : ""}

      <div class="row-actions">
        <button class="btn secondary" id="shareBtn">Paylaş</button>
        ${isUserRecipe(r.id) ? `<button class="btn secondary" id="editBtn">Düzenle</button><button class="btn danger" id="delBtn">Sil</button>` : ""}
      </div>`;

    $("#svMinus").onclick = () => { servingsState[id] = Math.max(1, sv - 1); renderRecipe(id); };
    $("#svPlus").onclick = () => { servingsState[id] = Math.min(50, sv + 1); renderRecipe(id); };

    app.querySelectorAll("[data-ing]").forEach(cb => {
      cb.onchange = () => { const i = +cb.dataset.ing; cb.checked ? st.ing.add(i) : st.ing.delete(i); };
    });
    app.querySelectorAll(".steps li").forEach(li => {
      li.onclick = e => {
        if (e.target.closest(".timer-btn")) return;
        const i = +li.dataset.step;
        st.step.has(i) ? st.step.delete(i) : st.step.add(i);
        li.classList.toggle("done");
      };
    });
    app.querySelectorAll(".timer-btn").forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.timer;
        if (timers[key]) {
          delete timers[key];
          btn.classList.remove("running");
          btn.querySelector("span").textContent = btn.dataset.label;
          toast("Zamanlayıcı durduruldu");
        } else {
          timers[key] = Date.now() + btn.dataset.min * 60000;
          btn.classList.add("running");
          btn.querySelector("span").textContent = fmtTime(btn.dataset.min * 60000);
          toast(`${btn.dataset.min} dakikalık zamanlayıcı başladı`);
        }
      };
    });

    $("#awake").onchange = e => {
      keepAwake = e.target.checked; store.set("tarif.awake", keepAwake);
      if (keepAwake && !("wakeLock" in navigator)) toast("Bu cihaz bu özelliği desteklemiyor");
      applyWakeLock(keepAwake);
    };
    if (keepAwake) applyWakeLock(true);

    $("#shareBtn").onclick = async () => {
      const text = `${r.name} (${sv} kişilik)\n\nMalzemeler:\n` +
        malzemeler.map(i => "• " + scaleIngredient(i, factor).replace(/<\/?b>/g, "")).join("\n") +
        `\n\nYapılışı:\n` + adimlar.map((s, i) => `${i + 1}. ${s.t}`).join("\n") +
        (r.source ? `\n\nKaynak: ${r.source}` : "");
      try {
        if (navigator.share) await navigator.share({ title: r.name, text });
        else { await navigator.clipboard.writeText(text); toast("Tarif panoya kopyalandı"); }
      } catch { /* kullanıcı vazgeçti */ }
    };
    const cb = $("#ceviriBtn");
    if (cb) cb.onclick = () => {
      if (ceviriDurum[id] === "fail") { delete ceviriDurum[id]; }
      else orijinal[id] = !orijinal[id];
      renderRecipe(id);
    };
    if (isUserRecipe(r.id)) {
      $("#editBtn").onclick = () => (location.hash = "#/edit/" + encodeURIComponent(r.id));
      $("#delBtn").onclick = () => {
        if (!confirm(`"${r.name}" silinsin mi?`)) return;
        userRecipes = userRecipes.filter(x => x.id !== r.id); saveUser();
        favs.delete(r.id); saveFavs();
        toast("Tarif silindi");
        location.hash = "#/";
      };
    }
  }

  function ceviriBandi(r) {
    const d = ceviriDurum[r.id];
    if (!r.tr && d === "busy") return `<div class="note"><span class="spinner small" aria-hidden="true"></span>Türkçeye çevriliyor…</div>`;
    if (!r.tr && d === "fail") return `<div class="note warn">Çeviri şu an yapılamadı, tarif İngilizce gösteriliyor.<button id="ceviriBtn">Tekrar dene</button></div>`;
    if (r.tr) return `<div class="note">🇹🇷 Otomatik çeviri<button id="ceviriBtn">${orijinal[r.id] ? "Türkçesini göster" : "Orijinalini göster"}</button></div>`;
    return "";
  }
  function apiCeviriBaslat(r) {
    if (r.tr || ceviriDurum[r.id]) return;
    ceviriDurum[r.id] = "busy";
    const hash = "#/r/" + encodeURIComponent(r.id);
    Dunya.tarifCevir(r).then(yeni => {
      delete ceviriDurum[r.id];
      putApi(yeni);
      if (location.hash === hash) renderRecipe(r.id);
    }).catch(() => {
      ceviriDurum[r.id] = "fail";
      if (location.hash === hash) renderRecipe(r.id);
    });
  }

  // ---------- Keşfet (dünya mutfağı) ----------
  const ONE_CIKAN_MUTFAK = ["Turkish", "Italian", "Japanese", "Chinese", "Indian", "Mexican", "French", "Greek", "Spanish", "Thai",
    "American", "British", "Moroccan", "Egyptian", "Tunisian", "Vietnamese", "Malaysian", "Jamaican", "Russian", "Polish", "Portuguese",
    "Croatian", "Dutch", "Irish", "Canadian", "Filipino", "Kenyan", "Ukrainian"];
  const KATEGORILER = ["Chicken", "Beef", "Lamb", "Seafood", "Pasta", "Vegetarian", "Vegan", "Dessert", "Breakfast", "Side", "Starter", "Miscellaneous"];
  let kesfet = { tip: "mutfak", deger: "Turkish", q: "" };
  let aramaZaman = null;

  function renderExplore() {
    setHeader("Dünya Mutfağı"); setTab("kesfet");
    app.innerHTML = `
      <form class="search" id="kform" role="search">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input id="kq" type="search" placeholder="Ara: tavuk, pasta, köri…" value="${esc(kesfet.q)}" autocomplete="off" enterkeyhint="search">
      </form>
      <button class="dice" id="rastgele"><span class="dice-face" aria-hidden="true">🎲</span><span><b>Bugün ne pişirsem?</b><small>Dünyadan rastgele bir tarif getir</small></span></button>
      <div class="label">Mutfaklar</div>
      <div class="chips" id="mutfaklar">${ONE_CIKAN_MUTFAK.map(a => `<button class="chip ${kesfet.tip === "mutfak" && kesfet.deger === a ? "active" : ""}" data-tip="mutfak" data-v="${a}">${esc(Dunya.mutfakTr(a))}</button>`).join("")}</div>
      <div class="label">Kategoriler</div>
      <div class="chips" id="kategoriler">${KATEGORILER.map(c => `<button class="chip ${kesfet.tip === "kategori" && kesfet.deger === c ? "active" : ""}" data-tip="kategori" data-v="${c}">${esc(Dunya.kategoriTr(c))}</button>`).join("")}</div>
      <div class="result-head" id="baslik"></div>
      <div class="grid" id="sonuc"></div>`;

    const yukle = () => {
      const kutu = $("#sonuc");
      if (!kutu) return;
      const baslik = kesfet.tip === "ara" ? `"${kesfet.q}" için sonuçlar`
        : kesfet.tip === "mutfak" ? `${Dunya.mutfakTr(kesfet.deger)} mutfağı` : Dunya.kategoriTr(kesfet.deger);
      $("#baslik").textContent = baslik;
      kutu.innerHTML = yukleniyor("Tarifler yükleniyor…");
      const istek = kesfet.tip === "ara" ? Dunya.ara(kesfet.q)
        : kesfet.tip === "mutfak" ? Dunya.mutfaga(kesfet.deger) : Dunya.kategoriye(kesfet.deger);
      const anahtar = JSON.stringify(kesfet);
      istek.then(liste => {
        if (anahtar !== JSON.stringify(kesfet) || !document.body.contains(kutu)) return;
        $("#baslik").textContent = `${baslik} · ${liste.length} tarif`;
        kutu.innerHTML = liste.length ? liste.map(x => apiCardHTML(x)).join("")
          : `<div class="empty"><span class="big">🔍</span>Sonuç yok. Başka bir kelime dene (İngilizce de olur).</div>`;
        bindCards();
        adlariGuncelle(kutu, liste);
      }).catch(() => {
        kutu.innerHTML = hataHTML("Tarifler yüklenemedi. İnternet bağlantını kontrol et.");
        $("#retry").onclick = yukle;
      });
    };

    const chipSec = btn => {
      app.querySelectorAll("#mutfaklar .chip, #kategoriler .chip").forEach(x => x.classList.toggle("active", x === btn));
    };
    app.querySelectorAll("#mutfaklar .chip, #kategoriler .chip").forEach(ch => {
      ch.onclick = () => {
        kesfet = { tip: ch.dataset.tip, deger: ch.dataset.v, q: "" };
        $("#kq").value = "";
        chipSec(ch); yukle();
      };
    });
    const aramaYap = () => {
      const q = $("#kq").value.trim();
      if (q.length < 2) return;
      kesfet = { tip: "ara", deger: "", q };
      chipSec(null); yukle();
    };
    $("#kform").onsubmit = e => { e.preventDefault(); clearTimeout(aramaZaman); aramaYap(); $("#kq").blur(); };
    $("#kq").oninput = () => { clearTimeout(aramaZaman); aramaZaman = setTimeout(aramaYap, 700); };

    $("#rastgele").onclick = async () => {
      const btn = $("#rastgele");
      btn.classList.add("rolling"); btn.disabled = true;
      try {
        const r = await Dunya.rastgele();
        putApi(r);
        location.hash = "#/r/" + encodeURIComponent(r.id);
      } catch {
        toast("Bağlantı yok, rastgele tarif getirilemedi");
      } finally { btn.classList.remove("rolling"); btn.disabled = false; }
    };

    // Seçili çipi görünür yap
    const aktif = app.querySelector(".chips .chip.active");
    if (aktif) aktif.scrollIntoView({ block: "nearest", inline: "center" });
    yukle();
  }

  // ---------- Dolabımda ne var ----------
  let dolap = store.get("tarif.dolap", []);
  const saveDolap = () => store.set("tarif.dolap", dolap);
  const ONERILER = ["tavuk", "kıyma", "yumurta", "domates", "patates", "soğan", "peynir", "pirinç", "makarna", "süt", "mantar", "biber", "patlıcan", "un", "yoğurt", "somon"];

  function renderDolap() {
    setHeader("Dolabımda ne var?"); setTab("dolap");
    const oneriler = ONERILER.filter(o => !dolap.some(d => Besin.norm(d) === Besin.norm(o)));
    app.innerHTML = `
      <p class="lead">Evde olan malzemeleri ekle, onlarla yapabileceğin tarifleri bulalım.</p>
      <form class="add-row" id="dform">
        <input id="dq" placeholder="Malzeme yaz, örn. ıspanak" autocomplete="off" enterkeyhint="done" maxlength="30">
        <button class="btn" type="submit">Ekle</button>
      </form>
      <div class="chips wrap" id="secili">${dolap.length
        ? dolap.map((d, i) => `<button class="chip active" data-i="${i}" aria-label="${esc(d)} çıkar">${esc(d)} <span aria-hidden="true">×</span></button>`).join("")
        : `<span class="hint">Henüz malzeme eklemedin.</span>`}</div>
      ${oneriler.length ? `<div class="label">Hızlı ekle</div>
      <div class="chips wrap" id="oneri">${oneriler.map(o => `<button class="chip" data-o="${esc(o)}">+ ${esc(o)}</button>`).join("")}</div>` : ""}
      <button class="btn find" id="bul" ${dolap.length ? "" : "disabled"}>${dolap.length ? `${dolap.length} malzemeyle tarif bul` : "Önce malzeme ekle"}</button>
      <div id="dsonuc"></div>`;

    const ekle = ad => {
      ad = ad.trim().toLocaleLowerCase("tr");
      if (!ad) return;
      if (dolap.some(d => Besin.norm(d) === Besin.norm(ad))) { toast("Bu malzeme zaten listede"); return; }
      if (dolap.length >= 8) { toast("En fazla 8 malzeme ekleyebilirsin"); return; }
      dolap.push(ad); saveDolap(); renderDolap(); $("#dq").focus();
    };
    $("#dform").onsubmit = e => { e.preventDefault(); ekle($("#dq").value); };
    app.querySelectorAll("#secili .chip").forEach(c => { c.onclick = () => { dolap.splice(+c.dataset.i, 1); saveDolap(); renderDolap(); }; });
    app.querySelectorAll("#oneri .chip").forEach(c => { c.onclick = () => ekle(c.dataset.o); });
    $("#bul").onclick = () => dolapAra();
  }

  function dolapAra() {
    const kutu = $("#dsonuc");
    const secili = dolap.slice();
    const rozet = n => `<span class="match ${n === secili.length ? "full" : ""}">✓ ${n}/${secili.length} malzeme</span>`;
    const yerel = allRecipes()
      .map(r => ({ r, e: Dunya.yerelEslesme(r, secili) }))
      .filter(x => x.e.length)
      .sort((a, b) => b.e.length - a.e.length);
    kutu.innerHTML = `
      <div class="result-head">Senin tariflerin</div>
      <div class="grid">${yerel.length ? yerel.map(x => cardHTML(x.r, rozet(x.e.length))).join("") : `<p class="hint">Kendi tariflerinde eşleşen yok.</p>`}</div>
      <div class="result-head" id="dbaslik">Dünya mutfağından</div>
      <div class="grid" id="dgrid">${yukleniyor("Dünya tariflerinde aranıyor…")}</div>`;
    bindCards();
    kutu.scrollIntoView({ behavior: "smooth", block: "start" });
    Dunya.dolaptan(secili).then(liste => {
      const grid = $("#dgrid");
      if (!grid) return;
      grid.innerHTML = liste.length ? liste.map(x => apiCardHTML(x, rozet(x.eslesen.length))).join("")
        : `<div class="empty">Dünya tariflerinde eşleşme bulunamadı.</div>`;
      bindCards();
      adlariGuncelle(grid, liste);
    }).catch(() => {
      $("#dgrid").innerHTML = hataHTML("Dünya tariflerine ulaşılamadı. İnternet bağlantını kontrol et.");
      $("#retry").onclick = dolapAra;
    });
  }

  // ---------- Tarif ekleme / düzenleme ----------
  const EMOJIS = ["🍽️", "🥣", "🍲", "🍳", "🥗", "🍝", "🍕", "🍔", "🌯", "🍗", "🥩", "🐟", "🍚", "🫘", "🥔", "🍆", "🥞", "🍰", "🍮", "🍪", "🧁", "🍩", "🥤", "☕"];

  function renderForm(editId) {
    const r = editId ? userRecipes.find(x => x.id === editId) : null;
    if (editId && !r) { location.hash = "#/"; return; }
    setHeader(r ? "Tarifi düzenle" : "Yeni tarif", { back: !!r }); setTab(r ? null : "add");
    let emoji = r ? r.emoji : "🍽️";

    app.innerHTML = `
      <form class="form" id="form" novalidate>
        <div class="field"><label for="f-name">Tarif adı</label>
          <input id="f-name" required maxlength="60" placeholder="Örn. Annemin köftesi" value="${r ? esc(r.name) : ""}"></div>
        <div class="field"><label>Simge</label>
          <div class="emoji-pick">${EMOJIS.map(e => `<button type="button" data-e="${e}" class="${e === emoji ? "active" : ""}">${e}</button>`).join("")}</div></div>
        <div class="field"><label for="f-cat">Kategori</label>
          <select id="f-cat">${CATEGORIES.map(c => `<option ${r && r.cat === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
        <div class="two">
          <div class="field"><label for="f-time">Süre (dk)</label><input id="f-time" type="number" inputmode="numeric" min="1" value="${r ? r.time : 30}"></div>
          <div class="field"><label for="f-sv">Kaç kişilik</label><input id="f-sv" type="number" inputmode="numeric" min="1" value="${r ? r.servings : 4}"></div>
        </div>
        <div class="field"><label for="f-ing">Malzemeler <small>(her satıra bir tane, başa miktar: "2 su bardağı un")</small></label>
          <textarea id="f-ing" placeholder="500 g kıyma&#10;1 adet soğan&#10;1 çay kaşığı tuz">${r ? esc(r.ingredients.join("\n")) : ""}</textarea></div>
        <div class="field"><label for="f-steps">Yapılışı <small>(her satıra bir adım; "10 dk" yazarsan zamanlayıcı çıkar)</small></label>
          <textarea id="f-steps" placeholder="Soğanı doğra.&#10;Kıymayı 10 dk kavur.">${r ? esc(r.steps.map(s => s.t).join("\n")) : ""}</textarea></div>
        <button class="btn" type="submit">${r ? "Kaydet" : "Tarifi ekle"}</button>
      </form>`;

    app.querySelectorAll(".emoji-pick button").forEach(b => {
      b.onclick = () => {
        emoji = b.dataset.e;
        app.querySelectorAll(".emoji-pick button").forEach(x => x.classList.toggle("active", x === b));
      };
    });

    $("#form").onsubmit = e => {
      e.preventDefault();
      const name = $("#f-name").value.trim();
      const lines = s => s.split("\n").map(x => x.trim()).filter(Boolean);
      const ingredients = lines($("#f-ing").value);
      const steps = lines($("#f-steps").value).map(t => {
        const m = t.match(/(\d+)\s*(dk|dakika)/i);
        return m ? { t, dk: +m[1] } : { t };
      });
      if (!name) { toast("Tarife bir ad ver"); $("#f-name").focus(); return; }
      if (!ingredients.length) { toast("En az bir malzeme yaz"); $("#f-ing").focus(); return; }
      if (!steps.length) { toast("En az bir adım yaz"); $("#f-steps").focus(); return; }

      const recipe = {
        id: r ? r.id : "u-" + Date.now().toString(36),
        name, emoji, cat: $("#f-cat").value,
        time: Math.max(1, parseInt($("#f-time").value, 10) || 30),
        servings: Math.max(1, parseInt($("#f-sv").value, 10) || 4),
        ingredients, steps
      };
      if (r) userRecipes = userRecipes.map(x => (x.id === r.id ? recipe : x));
      else userRecipes.unshift(recipe);
      saveUser();
      delete servingsState[recipe.id];
      toast(r ? "Tarif güncellendi" : "Tarif eklendi");
      location.replace("#/r/" + encodeURIComponent(recipe.id));
    };
  }

  // ---------- Yönlendirme ----------
  function route() {
    const h = location.hash || "#/";
    if (!h.startsWith("#/r/")) applyWakeLock(false);
    if (h.startsWith("#/r/")) renderRecipe(decodeURIComponent(h.slice(4)));
    else if (h.startsWith("#/edit/")) renderForm(decodeURIComponent(h.slice(7)));
    else if (h === "#/favs") renderFavs();
    else if (h === "#/kesfet") renderExplore();
    else if (h === "#/dolap") renderDolap();
    else if (h === "#/add") renderForm(null);
    else renderList();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();

  // Çevrimdışı çalışma (APK içinde gerekmez, sadece web'de)
  if ("serviceWorker" in navigator && location.protocol === "https:" && !window.Capacitor) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
