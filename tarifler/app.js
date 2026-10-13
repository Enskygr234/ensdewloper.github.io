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

  const allRecipes = () => [...userRecipes, ...DEFAULT_RECIPES];
  const findRecipe = id => allRecipes().find(r => r.id === id);
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
    b.onclick = () => { location.hash = { list: "#/", favs: "#/favs", add: "#/add" }[b.dataset.tab]; };
  });

  // ---------- Liste ----------
  let listState = { q: "", cat: "Tümü" };

  function cardHTML(r) {
    return `<button class="card" data-id="${esc(r.id)}">
      <div class="thumb">${esc(r.emoji || "🍽️")}</div>
      <div class="card-body">
        <h3>${esc(r.name)}</h3>
        <div class="meta"><span>⏱ ${r.time} dk</span><span>👥 ${r.servings} kişilik</span><span>${esc(r.cat)}</span></div>
      </div>
      ${favs.has(r.id) ? '<span class="heart">♥</span>' : ""}
    </button>`;
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
    const list = allRecipes().filter(r => favs.has(r.id));
    app.innerHTML = list.length
      ? `<div class="grid">${list.map(cardHTML).join("")}</div>`
      : `<div class="empty"><span class="big">♡</span>Henüz favorin yok.<br>Bir tarifi açıp sağ üstteki kalbe dokun.</div>`;
    bindCards();
  }

  // ---------- Tarif detayı ----------
  const checked = {}; // tarif id → { ing:Set, step:Set }
  const servingsState = {};

  function renderRecipe(id) {
    const r = findRecipe(id);
    if (!r) { location.hash = "#/"; return; }
    setHeader(r.name, { back: true, favId: r.id }); setTab(null);
    const st = checked[id] || (checked[id] = { ing: new Set(), step: new Set() });
    const sv = servingsState[id] || r.servings;
    const factor = sv / r.servings;

    app.innerHTML = `
      <div class="hero">
        <div class="emoji">${esc(r.emoji || "🍽️")}</div>
        <h2>${esc(r.name)}</h2>
        <div class="meta"><span>⏱ ${r.time} dk</span><span>${esc(r.cat)}</span></div>
      </div>

      <div class="section-title">
        <h3>Malzemeler</h3>
        <div class="stepper">
          <button id="svMinus" aria-label="Azalt">−</button>
          <span>${sv} kişilik</span>
          <button id="svPlus" aria-label="Artır">+</button>
        </div>
      </div>
      <ul class="ingredients">
        ${r.ingredients.map((ing, i) => `<li><label><input type="checkbox" data-ing="${i}" ${st.ing.has(i) ? "checked" : ""}><span>${scaleIngredient(ing, factor)}</span></label></li>`).join("")}
      </ul>

      <div class="section-title"><h3>Yapılışı</h3></div>
      <ol class="steps">
        ${r.steps.map((s, i) => {
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
        r.ingredients.map(i => "• " + scaleIngredient(i, factor).replace(/<\/?b>/g, "")).join("\n") +
        `\n\nYapılışı:\n` + r.steps.map((s, i) => `${i + 1}. ${s.t}`).join("\n");
      try {
        if (navigator.share) await navigator.share({ title: r.name, text });
        else { await navigator.clipboard.writeText(text); toast("Tarif panoya kopyalandı"); }
      } catch { /* kullanıcı vazgeçti */ }
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
