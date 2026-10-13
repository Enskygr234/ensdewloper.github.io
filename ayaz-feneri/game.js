/* Ayaz Ata'nın Feneri — bir Nardugan masalı
   Telefonda yan tutularak oynanan 2D platform oyunu. */
(() => {
  "use strict";

  // ================== EKRAN ==================
  const cvs = document.getElementById("c");
  const ctx = cvs.getContext("2d");
  const TILE = 32, ROWS = 12, VH = ROWS * TILE;
  let VW = 640, scale = 1, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = Math.round(innerWidth * dpr);
    cvs.height = Math.round(innerHeight * dpr);
    cvs.style.width = innerWidth + "px";
    cvs.style.height = innerHeight + "px";
    scale = cvs.height / VH;
    VW = Math.ceil(cvs.width / scale);
  }
  addEventListener("resize", resize);
  resize();
  const portrait = () => innerHeight > innerWidth * 1.05;

  // ================== GİRİŞ ==================
  const keys = {};
  const pointers = new Map();
  let showTouch = matchMedia("(pointer: coarse)").matches;

  addEventListener("keydown", e => {
    if (!keys[e.code]) onKey(e.code);
    keys[e.code] = true;
    audioInit();
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  });
  addEventListener("keyup", e => { keys[e.code] = false; });
  addEventListener("blur", () => { for (const k in keys) keys[k] = false; pointers.clear(); if (state === "play") state = "pause"; });
  document.addEventListener("visibilitychange", () => { if (document.hidden && state === "play") state = "pause"; });

  function toLogical(e) {
    const r = cvs.getBoundingClientRect();
    return { x: (e.clientX - r.left) * dpr / scale, y: (e.clientY - r.top) * dpr / scale };
  }
  cvs.addEventListener("pointerdown", e => {
    audioInit();
    if (e.pointerType === "touch") showTouch = true;
    const p = toLogical(e);
    pointers.set(e.pointerId, p);
    try { cvs.setPointerCapture(e.pointerId); } catch { /* yok */ }
    onTap(p.x, p.y);
    e.preventDefault();
  });
  cvs.addEventListener("pointermove", e => { if (pointers.has(e.pointerId)) pointers.set(e.pointerId, toLogical(e)); });
  const release = e => pointers.delete(e.pointerId);
  cvs.addEventListener("pointerup", release);
  cvs.addEventListener("pointercancel", release);
  cvs.addEventListener("contextmenu", e => e.preventDefault());

  function touchButtons() {
    return {
      left: { x: 58, y: VH - 44, r: 32 },
      right: { x: 140, y: VH - 44, r: 32 },
      jump: { x: VW - 64, y: VH - 50, r: 38 }
    };
  }
  function readInput() {
    const t = { left: false, right: false, jump: false };
    if (showTouch) {
      const b = touchButtons();
      for (const p of pointers.values()) {
        for (const k in b) if (Math.hypot(p.x - b[k].x, p.y - b[k].y) < b[k].r + 16) t[k] = true;
      }
    }
    return {
      left: keys.ArrowLeft || keys.KeyA || t.left,
      right: keys.ArrowRight || keys.KeyD || t.right,
      jump: keys.ArrowUp || keys.Space || keys.KeyW || keys.KeyZ || t.jump
    };
  }

  // ================== SES ==================
  let actx = null;
  function audioInit() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      else if (actx.state === "suspended") actx.resume();
    } catch { actx = null; }
  }
  function tone(freq, dur, type = "square", vol = 0.06, slide = 0) {
    if (!actx) return;
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t + dur);
  }
  const sfx = {
    jump: () => tone(380, 0.14, "square", 0.04, 320),
    coin: () => { tone(988, 0.08, "square", 0.04); setTimeout(() => tone(1318, 0.12, "square", 0.04), 70); },
    hurt: () => tone(220, 0.3, "sawtooth", 0.06, -160),
    stomp: () => tone(170, 0.12, "square", 0.07, -90),
    star: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.28, "triangle", 0.08), i * 110)),
    check: () => { tone(660, 0.15, "triangle", 0.07); setTimeout(() => tone(880, 0.2, "triangle", 0.07), 120); },
    boss: () => tone(90, 0.5, "sawtooth", 0.09, -40),
    crack: () => tone(1500, 0.1, "triangle", 0.04, -1000),
    talk: () => tone(500 + Math.random() * 120, 0.03, "square", 0.015)
  };

  // ================== HİKÂYE ==================
  const INTRO = [
    ["", "Yılın en uzun gecesi, Nardugan gecesiydi. Köyün üstünde Ayaz Ata'nın büyük feneri asılıydı; o yanınca gece biter, gün yeniden doğardı."],
    ["", "Ama o gece dağlardan Karakoncolos indi. Fenerin üç yıldız parçasını kapıp karanlığa saçtı."],
    ["Ayaz Ata", "Bora, evlat! Fener yanmazsa bu gece hiç bitmez. Üç yıldız parçasını bulup bana getirir misin?"],
    ["Bora", "Getiririm Ayaz Ata! Atkımı sıkı bağladım, kar benden korksun."],
    ["Ayaz Ata", "Kar toplarına dikkat et; üstlerine zıplarsan dağılırlar. Yoldaki fenerleri yakarsan düştüğünde oradan devam edersin."]
  ];
  const DONE = [
    [
      ["Ayaz Ata", "İşte birinci parça! Daha şimdiden içimi ısıttı."],
      ["Ayaz Ata", "İkincisi Buz Ormanı'na düşmüş. Oranın zemini kaygandır, tepeden buz sarkıtları düşer. Yukarı bakmayı unutma."]
    ],
    [
      ["Bora", "İkinci parça da tamam! Ama parmaklarım buz kesti..."],
      ["Ayaz Ata", "Son parça Karakoncolos'un mağarasında. Korkma Bora; o koca gövdenin en zayıf yeri tepesidir."]
    ],
    [
      ["Ayaz Ata", "Üç parça bir arada! Aferin sana Bora."],
      ["", "Ayaz Ata parçaları fenere yerleştirdi. Fener öyle parlak yandı ki bütün vadi aydınlandı."],
      ["", "En uzun gece bitti, gün yeniden doğdu. O yıl köy, Nardugan'ı Bora'nın adıyla kutladı."]
    ]
  ];
  const PREBOSS = [
    ["Karakoncolos", "Hı hı hııı! Kim girdi benim mağarama? Bu parlak taş benim! Gece hiç bitmeyecek!"],
    ["Bora", "Gece bitecek, gün doğacak! Ver o parçayı!"]
  ];
  const BOSSDEAD = [
    ["Karakoncolos", "Ahh, başım! Tamam tamam, al şu parlak taşı... Zaten gözlerimi kamaştırıyordu."]
  ];

  // ================== BÖLÜMLER ==================
  // Haritayı komutlarla kurarız: ground(x1,x2,yükseklik), plat(x1,x2,satır), put(x,satır,harf)...
  // # zemin  = buz (kaygan)  - tahta (alttan geçilir)  ^ diken
  // P başlangıç  o kar tanesi  e kartopu  i buz sarkıtı  c fener (kayıt)  S yıldız parçası  B Karakoncolos
  function makeLevel(w, fn) {
    const g = [];
    for (let y = 0; y < ROWS; y++) g.push(new Array(w).fill("."));
    const L = {
      ground(x1, x2, h, ch = "#") { for (let x = x1; x <= x2; x++) for (let y = ROWS - h; y < ROWS; y++) g[y][x] = ch; },
      ceil(x1, x2, h) { for (let x = x1; x <= x2; x++) for (let y = 0; y < h; y++) g[y][x] = "#"; },
      row(x1, x2, y, ch) { for (let x = x1; x <= x2; x++) g[y][x] = ch; },
      put(x, y, ch) { g[y][x] = ch; }
    };
    fn(L);
    return g;
  }

  const THEMES = {
    koy: { sky: ["#0b1a33", "#3a5f8f"], far: "#253f63", near: "#1a2f4c", earth: "#5b4636", earthDark: "#4a382b", cap: "#f2f8ff", moon: true, snow: 1, lights: true },
    orman: { sky: ["#0a1d2b", "#2e6b7f"], far: "#1d4655", near: "#143440", earth: "#3e5168", earthDark: "#34445a", cap: "#eef8ff", moon: true, snow: 1.3, trees: true },
    magara: { sky: ["#0d0b14", "#231c2e"], far: "#1c1726", near: "#16121e", earth: "#3a3245", earthDark: "#2e2838", cap: "#9fb3c8", moon: false, snow: 0.25, cave: true }
  };

  const LEVELS = [
    {
      name: "1. Bölüm · Köy Yolu", theme: "koy",
      build: () => makeLevel(100, L => {
        L.ground(0, 14, 2); L.put(2, 9, "P"); L.row(6, 9, 8, "o");
        L.ground(17, 30, 2); L.put(22, 9, "e"); L.row(25, 28, 8, "-"); L.row(25, 28, 7, "o");
        L.ground(33, 45, 3); L.put(35, 8, "c"); L.put(41, 8, "e"); L.row(38, 40, 6, "o");
        L.ground(48, 52, 2); L.row(49, 51, 8, "o");
        L.ground(54, 60, 3); L.row(56, 58, 6, "o");
        L.ground(63, 80, 2); L.put(65, 9, "c"); L.put(69, 9, "e"); L.put(77, 9, "e"); L.row(71, 74, 8, "-"); L.row(71, 74, 7, "o");
        L.ground(83, 99, 2); L.row(87, 88, 9, "^"); L.row(90, 92, 8, "o"); L.put(96, 9, "S");
      })
    },
    {
      name: "2. Bölüm · Buz Ormanı", theme: "orman",
      build: () => makeLevel(120, L => {
        L.ground(0, 12, 2); L.put(2, 9, "P"); L.row(5, 8, 8, "o");
        L.ground(13, 28, 2, "="); L.ceil(18, 26, 2); L.put(20, 2, "i"); L.put(24, 2, "i"); L.put(27, 9, "e"); L.row(15, 17, 8, "o");
        L.ground(31, 40, 3); L.put(33, 8, "c"); L.row(36, 39, 7, "-"); L.row(36, 39, 6, "o");
        L.ground(43, 47, 2); L.row(44, 46, 8, "o");
        L.ground(50, 54, 2, "="); L.put(52, 9, "e");
        L.ground(57, 70, 3); L.put(59, 8, "c"); L.ceil(60, 68, 2); L.put(61, 2, "i"); L.put(64, 2, "i"); L.put(67, 2, "i"); L.row(62, 66, 7, "o");
        L.ground(73, 90, 2); L.row(76, 77, 9, "^"); L.row(80, 84, 8, "-"); L.row(80, 84, 7, "o"); L.put(82, 9, "e"); L.put(87, 9, "e");
        L.ground(93, 105, 2, "="); L.ceil(96, 103, 2); L.put(98, 2, "i"); L.put(101, 2, "i");
        L.ground(108, 119, 2); L.row(111, 113, 8, "o"); L.put(115, 9, "S");
      })
    },
    {
      name: "3. Bölüm · Karakoncolos'un Mağarası", theme: "magara", arena: 82,
      build: () => makeLevel(110, L => {
        L.ceil(0, 109, 1);
        L.ground(0, 10, 2); L.put(2, 9, "P");
        L.ground(13, 22, 2); L.put(18, 9, "e"); L.row(15, 16, 8, "o");
        L.ground(25, 30, 3); L.row(26, 29, 6, "o");
        L.ground(33, 38, 4); L.put(35, 7, "c");
        L.ground(41, 55, 2); L.row(44, 45, 9, "^"); L.row(50, 51, 9, "^"); L.row(43, 47, 8, "-"); L.row(43, 47, 7, "o");
        L.put(48, 9, "e"); L.put(53, 9, "e"); L.put(42, 1, "i"); L.put(49, 1, "i");
        L.ground(58, 62, 2); L.put(60, 1, "i");
        L.ground(65, 69, 3); L.row(66, 68, 7, "o");
        L.ground(72, 109, 2); L.put(74, 9, "c");
        for (let y = 0; y < ROWS; y++) L.put(109, y, "#");
        L.put(100, 9, "B");
      })
    }
  ];

  // ================== DURUM ==================
  let state = "title"; // title, story, play, pause, over, end
  let time = 0;
  let lvlIndex = 0, lvl = null, player = null, ents = [], parts = [], boss = null, arenaStart = 0;
  let cam = 0, shake = 0, titleCard = 0;
  let hearts = 3, flakes = 0, flakesAtStart = 0, flakesTotal = 0;
  let respawn = { x: 0, y: 0 };
  let story = null;
  let menuButtons = [];

  const save = {
    get() { try { return JSON.parse(localStorage.getItem("ayaz.kayit")) || { level: 0 }; } catch { return { level: 0 }; } },
    set(v) { try { localStorage.setItem("ayaz.kayit", JSON.stringify(v)); } catch { /* yer yok */ } }
  };

  // ================== HARİTA YARDIMCILARI ==================
  const isSolidChar = c => c === "#" || c === "=";
  function tileAt(tx, ty) {
    if (ty < 0 || ty >= ROWS || tx < 0 || tx >= lvl.w) return ".";
    return lvl.g[ty][tx];
  }
  function solidAt(tx, ty) {
    if (tx < 0 || tx >= lvl.w) return true;
    if (ty < 0 || ty >= ROWS) return false;
    return isSolidChar(lvl.g[ty][tx]);
  }
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function moveBody(b, dt) {
    b.onGround = false; b.groundTile = null; b.hitWall = 0;
    b.x += b.vx * dt;
    let top = Math.floor(b.y / TILE), bot = Math.floor((b.y + b.h - 0.01) / TILE);
    if (b.vx > 0) {
      const tx = Math.floor((b.x + b.w - 0.01) / TILE);
      for (let ty = top; ty <= bot; ty++) if (solidAt(tx, ty)) { b.x = tx * TILE - b.w; b.vx = 0; b.hitWall = 1; break; }
    } else if (b.vx < 0) {
      const tx = Math.floor(b.x / TILE);
      for (let ty = top; ty <= bot; ty++) if (solidAt(tx, ty)) { b.x = (tx + 1) * TILE; b.vx = 0; b.hitWall = -1; break; }
    }
    const prevBottom = b.y + b.h;
    b.y += b.vy * dt;
    const l = Math.floor(b.x / TILE), r = Math.floor((b.x + b.w - 0.01) / TILE);
    if (b.vy > 0) {
      const ty = Math.floor((b.y + b.h - 0.01) / TILE);
      for (let tx = l; tx <= r; tx++) {
        const c = tileAt(tx, ty);
        if (solidAt(tx, ty) || (c === "-" && prevBottom <= ty * TILE + 1)) {
          b.y = ty * TILE - b.h; b.vy = 0; b.onGround = true; b.groundTile = c; break;
        }
      }
    } else if (b.vy < 0) {
      const ty = Math.floor(b.y / TILE);
      for (let tx = l; tx <= r; tx++) if (solidAt(tx, ty)) { b.y = (ty + 1) * TILE; b.vy = 0; break; }
    }
  }

  // ================== BÖLÜM YÜKLEME ==================
  function spawn(c, tx, ty) {
    const bx = tx * TILE, by = ty * TILE;
    if (c === "P") {
      player = { x: bx + 6, y: by + TILE - 28, w: 20, h: 28, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, buffer: 0, jumpHeld: true, jumping: false, inv: 0, walk: 0 };
      respawn = { x: player.x, y: player.y };
    } else if (c === "o") ents.push({ t: "o", x: bx + 8, y: by + 8, w: 16, h: 16, ph: Math.random() * 6 });
    else if (c === "e") ents.push({ t: "e", x: bx + 4, y: by + TILE - 22, w: 24, h: 22, vx: -45, vy: 0, dead: 0 });
    else if (c === "i") ents.push({ t: "i", x: bx + 10, y: by, w: 12, h: 26, vy: 0, st: "hang", sh: 0 });
    else if (c === "c") ents.push({ t: "c", x: bx + 10, y: by - 8, w: 12, h: 40, lit: false });
    else if (c === "S") ents.push({ t: "S", x: bx + 4, y: by + 4, w: 24, h: 24, ph: 0 });
    else if (c === "B") boss = { x: bx - 10, y: by + TILE - 60, w: 52, h: 60, vx: 0, vy: 0, hp: 3, st: "idle", jt: 1.6, inv: 0, face: -1, wasAir: false };
  }

  function loadLevel(i) {
    lvlIndex = i;
    const def = LEVELS[i];
    const g = def.build();
    lvl = { g, w: g[0].length, theme: THEMES[def.theme], name: def.name };
    ents = []; parts = []; boss = null; arenaStart = def.arena || 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < lvl.w; x++) {
      const c = g[y][x];
      if ("PoeicSB".includes(c)) { g[y][x] = "."; spawn(c, x, y); }
    }
    hearts = 3;
    flakesAtStart = flakes;
    flakesTotal = ents.filter(e => e.t === "o").length;
    cam = clampCam(player.x - VW / 2);
    titleCard = 2.6;
    state = "play";
  }
  function clampCam(x) {
    const max = lvl.w * TILE - VW;
    return max <= 0 ? max / 2 : Math.max(0, Math.min(max, x));
  }

  function newGame() {
    flakes = 0; lvl = null;
    startStory(INTRO, () => loadLevel(0));
  }
  function continueGame() { flakes = 0; loadLevel(save.get().level || 0); }
  function retry() { flakes = flakesAtStart; loadLevel(lvlIndex); }
  function toMenu() { state = "title"; lvl = null; story = null; }

  // ================== HİKÂYE AKIŞI ==================
  function startStory(lines, done) { story = { lines, i: 0, shown: 0, done, lastTick: 0 }; state = "story"; }
  function advanceStory() {
    if (!story) return;
    const line = story.lines[story.i][1];
    if (story.shown < line.length) { story.shown = line.length; return; }
    story.i++; story.shown = 0;
    if (story.i >= story.lines.length) {
      const d = story.done;
      story = null;
      state = lvl ? "play" : "title";
      if (player) player.jumpHeld = true; // hikâyeyi geçen tuş zıplatmasın
      if (d) d();
    }
  }

  // ================== OYUN MANTIĞI ==================
  function hurt() {
    const p = player;
    if (p.inv > 0) return;
    hearts--; p.inv = 1.4; shake = 0.3; sfx.hurt();
    p.vx = -p.face * 170; p.vy = Math.min(p.vy, -300);
    burst(p.x + p.w / 2, p.y + p.h / 2, "#ff6b6b", 10);
    if (hearts <= 0) state = "over";
  }
  function fall() {
    hearts--; sfx.hurt(); shake = 0.3;
    if (hearts <= 0) { state = "over"; return; }
    Object.assign(player, { x: respawn.x, y: respawn.y, vx: 0, vy: 0, inv: 1.5 });
    cam = clampCam(player.x - VW / 2);
  }

  function updatePlayer(dt, inp) {
    const p = player;
    const ice = p.onGround && p.groundTile === "=";
    const accel = p.onGround ? (ice ? 420 : 1700) : 1100;
    const fric = p.onGround ? (ice ? 160 : 1900) : 350;
    const max = 175;
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir) { p.vx += dir * accel * dt; p.face = dir; }
    else if (p.vx) { const s = Math.sign(p.vx); p.vx -= s * fric * dt; if (Math.sign(p.vx) !== s) p.vx = 0; }
    p.vx = Math.max(-max, Math.min(max, p.vx));

    if (inp.jump && !p.jumpHeld) p.buffer = 0.13;
    p.jumpHeld = inp.jump;
    p.buffer -= dt;
    p.coyote = p.onGround ? 0.1 : p.coyote - dt;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -570; p.buffer = 0; p.coyote = 0; p.jumping = true; sfx.jump();
    }
    if (p.jumping && !inp.jump && p.vy < -230) { p.vy = -230; p.jumping = false; }
    if (p.vy >= 0) p.jumping = false;
    p.vy = Math.min(p.vy + 1800 * dt, 900);
    const wasGround = p.onGround;
    moveBody(p, dt);
    if (p.onGround && !wasGround && p.vy === 0) burst(p.x + p.w / 2, p.y + p.h, "#ffffff", 3, 0.4);
    p.walk += Math.abs(p.vx) * dt;
  }

  function updateEnt(e, dt) {
    const p = player;
    if (e.t === "o") {
      e.ph += dt * 3;
      if (overlap(p, e)) { e.gone = true; flakes++; sfx.coin(); burst(e.x + 8, e.y + 8, "#dff3ff", 8); }
    } else if (e.t === "e") {
      if (e.dead) { e.dead -= dt; if (e.dead <= 0) e.gone = true; return; }
      e.vy = Math.min(e.vy + 1800 * dt, 900);
      const v = e.vx;
      moveBody(e, dt);
      if (e.hitWall) e.vx = -e.hitWall * 45;
      else {
        e.vx = v;
        if (e.onGround) {
          const fx = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
          const tx = Math.floor(fx / TILE), ty = Math.floor((e.y + e.h + 2) / TILE);
          if (!(solidAt(tx, ty) || tileAt(tx, ty) === "-")) e.vx = -e.vx;
        }
      }
      if (e.y > VH + 60) e.gone = true;
      if (overlap(p, e)) {
        if (p.vy > 0 && p.y + p.h - e.y < 14) {
          e.dead = 0.35; p.vy = -430; p.jumping = false; sfx.stomp();
          burst(e.x + 12, e.y + 11, "#ffffff", 14);
        } else hurt();
      }
    } else if (e.t === "i") {
      if (e.st === "hang") {
        if (Math.abs((p.x + p.w / 2) - (e.x + e.w / 2)) < 60 && p.y > e.y) { e.st = "shake"; e.sh = 0.45; sfx.crack(); }
      } else if (e.st === "shake") {
        e.sh -= dt; if (e.sh <= 0) e.st = "fall";
      } else if (e.st === "fall") {
        e.vy = Math.min(e.vy + 1500 * dt, 800);
        e.y += e.vy * dt;
        const tx = Math.floor((e.x + e.w / 2) / TILE), ty = Math.floor((e.y + e.h) / TILE);
        if (solidAt(tx, ty) || e.y > VH) { e.gone = true; burst(e.x + 6, e.y + e.h, "#cfeaf8", 12); sfx.crack(); }
        if (overlap(p, e)) { hurt(); e.gone = true; burst(e.x + 6, e.y + e.h, "#cfeaf8", 10); }
      }
    } else if (e.t === "c") {
      if (!e.lit && p.x > e.x - 12) {
        e.lit = true; respawn = { x: e.x - 4, y: e.y + 40 - 28 };
        sfx.check(); burst(e.x + 6, e.y + 6, "#ffd36b", 16);
      }
    } else if (e.t === "S") {
      e.ph += dt;
      if (overlap(p, e)) { e.gone = true; levelComplete(); }
    }
  }

  function closeArena() {
    for (let y = 1; y < ROWS - 2; y++) lvl.g[y][arenaStart - 1] = "#";
    respawn = { x: arenaStart * TILE + 10, y: (ROWS - 2) * TILE - 28 };
    shake = 0.4; sfx.boss();
  }

  function updateBoss(dt) {
    const b = boss, p = player;
    if (b.st === "idle") {
      b.vy = Math.min(b.vy + 1800 * dt, 900); moveBody(b, dt);
      if (p.x > arenaStart * TILE + 8) {
        b.st = "wait"; closeArena();
        startStory(PREBOSS, () => { b.st = "active"; });
      }
      return;
    }
    if (b.st === "wait") return;
    if (b.st === "dead") { b.dt -= dt; return; }

    if (b.inv > 0) b.inv -= dt;
    const speed = 70 + (3 - b.hp) * 40;
    const dir = Math.sign((p.x + p.w / 2) - (b.x + b.w / 2)) || 1;
    b.face = dir;
    if (b.onGround) b.vx += (dir * speed - b.vx) * Math.min(1, dt * 3);
    b.jt -= dt;
    if (b.jt <= 0 && b.onGround) { b.vy = -540; b.jt = 2.4 - (3 - b.hp) * 0.5; }
    b.vy = Math.min(b.vy + 1800 * dt, 900);
    moveBody(b, dt);
    if (b.onGround && b.wasAir) { shake = 0.25; sfx.stomp(); burst(b.x + b.w / 2, b.y + b.h, "#9fb3c8", 10); }
    b.wasAir = !b.onGround;

    if (overlap(p, b)) {
      if (p.vy > 0 && p.y + p.h - b.y < 24) {
        if (b.inv <= 0) {
          b.hp--; b.inv = 1; shake = 0.35; sfx.boss();
          burst(b.x + b.w / 2, b.y + 10, "#ffffff", 18);
          if (b.hp <= 0) {
            b.st = "dead"; b.dt = 1;
            startStory(BOSSDEAD, () => {
              const sx = ((arenaStart + 108) / 2) * TILE, sy = (ROWS - 2) * TILE - 34;
              ents.push({ t: "S", x: sx, y: sy, w: 24, h: 24, ph: 0 });
              burst(sx + 12, sy + 12, "#ffd36b", 24);
              boss = null;
            });
          }
        }
        p.vy = -560; p.jumping = false;
      } else if (b.inv <= 0) hurt();
    }
  }

  function levelComplete() {
    sfx.star();
    burst(player.x + 10, player.y, "#ffd36b", 30);
    const next = lvlIndex + 1;
    const s = save.get();
    if (next < LEVELS.length && next > (s.level || 0)) save.set({ level: next });
    if (next >= LEVELS.length) save.set({ level: 0, bitti: true });
    startStory(DONE[lvlIndex], () => {
      if (next < LEVELS.length) loadLevel(next);
      else { state = "end"; lvl = null; }
    });
  }

  function updatePlay(dt) {
    if (titleCard > 0) titleCard -= dt;
    const p = player;
    updatePlayer(dt, readInput());
    if (p.inv > 0) p.inv -= dt;
    // Dikenler
    const l = Math.floor((p.x + 3) / TILE), r = Math.floor((p.x + p.w - 4) / TILE), ty = Math.floor((p.y + p.h - 2) / TILE);
    for (let tx = l; tx <= r; tx++) {
      if (tileAt(tx, ty) === "^" && p.y + p.h > ty * TILE + 14) { hurt(); p.vy = -440; break; }
    }
    if (state !== "play") return;
    if (p.y > VH + 60) { fall(); return; }
    for (const e of ents) { updateEnt(e, dt); if (state !== "play") break; }
    ents = ents.filter(e => !e.gone);
    if (boss && state === "play") updateBoss(dt);
    const target = clampCam(p.x + p.w / 2 - VW / 2 + p.face * 40);
    cam += (target - cam) * Math.min(1, dt * 5);
  }

  // ================== PARÇACIKLAR & KAR ==================
  function burst(x, y, color, n, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (60 + Math.random() * 160) * power;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60 * power, life: 0.5 + Math.random() * 0.4, color, size: 2 + Math.random() * 2 });
    }
  }
  function updateParts(dt) {
    for (const q of parts) { q.life -= dt; q.vy += 600 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    parts = parts.filter(q => q.life > 0);
  }
  const snow = Array.from({ length: 80 }, () => ({ x: Math.random() * 1600, y: Math.random() * VH, s: 0.4 + Math.random() * 1.2, ph: Math.random() * 6 }));
  function updateSnow(dt, k) {
    for (const f of snow) {
      f.y += (18 + f.s * 26) * dt * k;
      f.ph += dt;
      if (f.y > VH + 4) { f.y = -4; f.x = Math.random() * 1600; }
    }
  }

  // ================== ANA DÖNGÜ ==================
  function update(dt) {
    time += dt;
    if (portrait() && showTouch) return;
    if (state === "play") updatePlay(dt);
    else if (state === "story" && story) {
      const len = story.lines[story.i][1].length;
      if (story.shown < len) {
        story.shown = Math.min(len, story.shown + dt * 48);
        if (time - story.lastTick > 0.07) { sfx.talk(); story.lastTick = time; }
      }
    }
    if (shake > 0) shake -= dt;
    updateParts(dt);
    updateSnow(dt, lvl ? lvl.theme.snow : 1);
  }

  function onTap(x, y) {
    if (portrait() && showTouch) return;
    if (state === "story") { advanceStory(); return; }
    if (state === "play") { if (x > VW - 60 && y < 60) state = "pause"; return; }
    for (const b of menuButtons) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.fn(); return; }
    }
  }
  function onKey(code) {
    const ok = code === "Enter" || code === "Space" || code === "KeyX";
    if (state === "story" && ok) advanceStory();
    else if (state === "play" && (code === "Escape" || code === "KeyP")) state = "pause";
    else if (state === "pause" && (code === "Escape" || code === "KeyP")) state = "play";
    else if ((state === "title" || state === "pause" || state === "over" || state === "end") && ok && menuButtons[0]) menuButtons[0].fn();
  }

  let last = performance.now(), acc = 0;
  const STEP = 1 / 60;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }

  // ================== ÇİZİM ==================
  const FONT = "-apple-system, 'Segoe UI', Roboto, sans-serif";
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0b1626";
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    menuButtons = [];
    if (portrait() && showTouch) { drawRotate(); return; }

    if (lvl) drawWorld(); else drawMenuBg(state === "end");
    if (lvl && state !== "title") drawHUD();
    if (state === "play" && showTouch) drawTouch();
    if (state === "title") drawTitle();
    else if (state === "story") drawStory();
    else if (state === "pause") drawPause();
    else if (state === "over") drawOver();
    else if (state === "end") drawEnd();
  }

  function sky(th) {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  }
  function mountains(color, camX, f, base, amp, seed) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, VH);
    for (let x = 0; x <= VW + 16; x += 16) {
      const wx = x + camX * f;
      const y = base - (Math.sin(wx * 0.006 + seed) * amp + Math.sin(wx * 0.017 + seed * 3) * amp * 0.45 + Math.sin(wx * 0.043 + seed) * amp * 0.15);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW, VH); ctx.fill();
  }
  function trees(camX, f, base, color) {
    const gap = 70, off = (camX * f) % gap;
    const i0 = Math.floor(camX * f / gap);
    for (let i = -1; i < VW / gap + 2; i++) {
      const n = i0 + i, hsh = Math.abs(Math.sin(n * 91.7) * 1000) % 1;
      const x = i * gap - off + hsh * 30, h = 70 + hsh * 60, y = base;
      ctx.fillStyle = color;
      for (let k = 0; k < 3; k++) {
        const w = 34 - k * 8, ty = y - k * h / 3.2;
        ctx.beginPath(); ctx.moveTo(x - w, ty); ctx.lineTo(x, ty - h / 2.2); ctx.lineTo(x + w, ty); ctx.fill();
        ctx.fillStyle = "rgba(240,248,255,.55)";
        ctx.beginPath(); ctx.moveTo(x - w * 0.45, ty - h / 3.6); ctx.lineTo(x, ty - h / 2.2); ctx.lineTo(x + w * 0.45, ty - h / 3.6); ctx.fill();
        ctx.fillStyle = color;
      }
      ctx.fillRect(x - 4, y, 8, 16);
    }
  }
  function village(camX, f, base) {
    const gap = 150, off = (camX * f) % gap, i0 = Math.floor(camX * f / gap);
    for (let i = -1; i < VW / gap + 2; i++) {
      const n = i0 + i, hsh = Math.abs(Math.sin(n * 53.1) * 1000) % 1;
      if (hsh < 0.35) continue;
      const x = i * gap - off + hsh * 40, w = 46 + hsh * 20, h = 30;
      ctx.fillStyle = "#1a2a40"; ctx.fillRect(x, base - h, w, h);
      ctx.beginPath(); ctx.moveTo(x - 6, base - h); ctx.lineTo(x + w / 2, base - h - 24); ctx.lineTo(x + w + 6, base - h); ctx.fill();
      ctx.fillStyle = "#e9f3ff"; ctx.beginPath(); ctx.moveTo(x - 6, base - h); ctx.lineTo(x + w / 2, base - h - 24); ctx.lineTo(x + w + 6, base - h); ctx.lineTo(x + w / 2, base - h - 16); ctx.fill();
      const flick = 0.75 + Math.sin(time * 3 + n) * 0.1;
      ctx.fillStyle = `rgba(255,200,90,${flick})`; ctx.fillRect(x + w / 2 - 6, base - h + 9, 12, 10);
    }
  }
  function moon(x, y) {
    const g = ctx.createRadialGradient(x, y, 10, x, y, 70);
    g.addColorStop(0, "rgba(220,235,255,.35)"); g.addColorStop(1, "rgba(220,235,255,0)");
    ctx.fillStyle = g; ctx.fillRect(x - 70, y - 70, 140, 140);
    ctx.fillStyle = "#eef5ff"; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.fill();
  }
  function drawSnow(k, camX) {
    if (k <= 0) return;
    const n = Math.round(snow.length * Math.min(1, k));
    for (let i = 0; i < n; i++) {
      const f = snow[i];
      const x = (((f.x - camX * 0.5 * f.s + Math.sin(f.ph) * 12) % VW) + VW) % VW;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + f.s * 0.35})`;
      ctx.beginPath(); ctx.arc(x, f.y, f.s * 1.6, 0, 7); ctx.fill();
    }
  }

  function drawWorld() {
    const th = lvl.theme;
    sky(th);
    if (th.moon) moon(VW * 0.8, 64);
    if (th.cave) {
      mountains(th.far, cam, 0.2, VH * 0.55, 60, 2);
      mountains(th.near, cam, 0.4, VH * 0.75, 45, 5);
    } else {
      mountains(th.far, cam, 0.15, VH * 0.6, 50, 1);
      mountains(th.near, cam, 0.3, VH * 0.76, 38, 4);
      if (th.trees) trees(cam, 0.5, VH * 0.86, "#0f2a33");
      if (th.lights) village(cam, 0.45, VH * 0.84);
    }
    const sx = shake > 0 ? (Math.random() - 0.5) * 8 : 0, sy = shake > 0 ? (Math.random() - 0.5) * 8 : 0;
    ctx.save();
    ctx.translate(-Math.round(cam) + sx, sy);
    drawTiles(th);
    for (const e of ents) drawEnt(e);
    if (boss) drawBoss(boss);
    drawBora(player.x, player.y, player.face, player.onGround ? player.walk : 0, !player.onGround, player.inv > 0 && Math.floor(time * 12) % 2 === 0);
    for (const q of parts) {
      ctx.globalAlpha = Math.min(1, q.life * 2); ctx.fillStyle = q.color;
      ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (th.cave) {
      const g = ctx.createRadialGradient(player.x - cam + 10, player.y + 14, 60, player.x - cam + 10, player.y + 14, 340);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.55)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    }
    drawSnow(th.snow, cam);
  }

  function drawTiles(th) {
    const x0 = Math.max(0, Math.floor(cam / TILE) - 1), x1 = Math.min(lvl.w - 1, Math.floor((cam + VW) / TILE) + 1);
    for (let y = 0; y < ROWS; y++) for (let x = x0; x <= x1; x++) {
      const c = lvl.g[y][x], px = x * TILE, py = y * TILE;
      if (c === "#") {
        const above = y === 0 || isSolidChar(lvl.g[y - 1][x]);
        ctx.fillStyle = th.earth; ctx.fillRect(px, py, TILE, TILE);
        const h = ((x * 73856093) ^ (y * 19349663)) & 7;
        ctx.fillStyle = th.earthDark;
        if (h < 3) ctx.fillRect(px + 6 + h * 5, py + 12 + h * 3, 6, 4);
        if (h > 4) ctx.fillRect(px + 18, py + 22, 5, 4);
        if (!above) {
          ctx.fillStyle = th.cap;
          ctx.fillRect(px, py, TILE, 7);
          ctx.beginPath(); ctx.arc(px + 8, py + 7, 4, 0, Math.PI); ctx.arc(px + 22, py + 7, 5, 0, Math.PI); ctx.fill();
        }
        const below = y < ROWS - 1 && isSolidChar(lvl.g[y + 1][x]);
        if (!below && y < 3) { // tavandan sarkan kar/taş
          ctx.fillStyle = th.earthDark;
          ctx.beginPath(); ctx.moveTo(px + 4, py + TILE); ctx.lineTo(px + 10, py + TILE + 8); ctx.lineTo(px + 16, py + TILE); ctx.fill();
        }
      } else if (c === "=") {
        ctx.fillStyle = "#8fcbea"; ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = "#c9ecff"; ctx.fillRect(px, py, TILE, 5);
        ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillRect(px + 5, py + 10, 10, 2); ctx.fillRect(px + 16, py + 20, 8, 2);
        ctx.strokeStyle = "rgba(60,120,160,.35)"; ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      } else if (c === "-") {
        ctx.fillStyle = "#8a5a35"; ctx.fillRect(px, py, TILE, 8);
        ctx.fillStyle = "#6e4628"; ctx.fillRect(px, py + 6, TILE, 2);
        ctx.fillStyle = "#f2f8ff"; ctx.fillRect(px, py - 2, TILE, 3);
      } else if (c === "^") {
        ctx.fillStyle = "#cfeaf8"; ctx.strokeStyle = "#7fb3d1";
        for (let k = 0; k < 3; k++) {
          ctx.beginPath(); ctx.moveTo(px + k * 11, py + TILE); ctx.lineTo(px + k * 11 + 5, py + 12); ctx.lineTo(px + k * 11 + 10, py + TILE); ctx.fill(); ctx.stroke();
        }
      }
    }
  }

  function drawBora(x, y, face, walk, air, hidden) {
    if (hidden) return;
    x = Math.round(x); y = Math.round(y);
    ctx.save();
    if (face < 0) { ctx.translate(x * 2 + 20, 0); ctx.scale(-1, 1); }
    const step = air ? 2 : Math.sin(walk * 0.12) * 3;
    ctx.fillStyle = "#2b2b3a"; // bacaklar
    ctx.fillRect(x + 4, y + 22, 5, 6 + (air ? -1 : Math.max(0, step)));
    ctx.fillRect(x + 11, y + 22, 5, 6 + (air ? 1 : Math.max(0, -step)));
    ctx.fillStyle = "#2f6fb3"; ctx.fillRect(x + 2, y + 12, 16, 11); // mont
    ctx.fillStyle = "#245a93"; ctx.fillRect(x + 2, y + 19, 16, 2);
    ctx.fillStyle = "#e53b3b"; ctx.fillRect(x + 3, y + 11, 14, 3); // atkı
    ctx.fillRect(x + 1, y + 12, 3, 7 + (air ? 0 : Math.abs(step)));
    ctx.fillStyle = "#f2c9a0"; ctx.fillRect(x + 5, y + 3, 11, 9); // yüz
    ctx.fillStyle = "#1b1b24"; ctx.fillRect(x + 12, y + 6, 2, 2); // göz
    ctx.fillStyle = "#f19c9c"; ctx.fillRect(x + 13, y + 9, 2, 1);
    ctx.fillStyle = "#e53b3b"; ctx.fillRect(x + 3, y, 14, 5); // bere
    ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 3, y + 4, 14, 2);
    ctx.beginPath(); ctx.arc(x + 4, y + 1, 3, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.t === "o") {
      const cx = e.x + 8, cy = e.y + 8 + Math.sin(e.ph) * 2;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(e.ph * 0.4);
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.shadowColor = "#9fdcff"; ctx.shadowBlur = 8;
      for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke(); }
      ctx.restore();
    } else if (e.t === "e") {
      const cx = e.x + 12, by = e.y + 22;
      if (e.dead) {
        ctx.fillStyle = "#eef6ff"; ctx.beginPath(); ctx.ellipse(cx, by - 3, 15, 4, 0, 0, 7); ctx.fill();
        return;
      }
      const bob = Math.sin(time * 10 + e.x) * 1;
      ctx.fillStyle = "#f4f9ff"; ctx.beginPath(); ctx.arc(cx, by - 11 + bob, 12, 0, 7); ctx.fill();
      ctx.fillStyle = "#c7dcef"; ctx.beginPath(); ctx.arc(cx, by - 11 + bob, 12, 0.2, Math.PI - 0.2); ctx.fill();
      const d = e.vx > 0 ? 3 : -3;
      ctx.fillStyle = "#1b1b24";
      ctx.fillRect(cx - 5 + d, by - 15 + bob, 3, 4); ctx.fillRect(cx + 2 + d, by - 15 + bob, 3, 4);
      ctx.strokeStyle = "#1b1b24"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx - 7 + d, by - 19 + bob); ctx.lineTo(cx - 2 + d, by - 17 + bob); ctx.moveTo(cx + 7 + d, by - 19 + bob); ctx.lineTo(cx + 2 + d, by - 17 + bob); ctx.stroke();
    } else if (e.t === "i") {
      const sx = e.st === "shake" ? Math.sin(time * 60) * 1.5 : 0;
      ctx.fillStyle = "#cfeaf8"; ctx.strokeStyle = "#7fb3d1";
      ctx.beginPath(); ctx.moveTo(e.x + sx, e.y); ctx.lineTo(e.x + 12 + sx, e.y); ctx.lineTo(e.x + 6 + sx, e.y + 26); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(e.x + 3 + sx, e.y + 2, 2, 10);
    } else if (e.t === "c") {
      ctx.fillStyle = "#4a3a2e"; ctx.fillRect(e.x + 5, e.y + 10, 3, 30);
      ctx.fillStyle = "#2b2b3a"; ctx.fillRect(e.x - 1, e.y, 14, 14);
      if (e.lit) {
        const flick = 0.85 + Math.sin(time * 9) * 0.1;
        const g = ctx.createRadialGradient(e.x + 6, e.y + 7, 2, e.x + 6, e.y + 7, 50);
        g.addColorStop(0, `rgba(255,210,110,${0.55 * flick})`); g.addColorStop(1, "rgba(255,210,110,0)");
        ctx.fillStyle = g; ctx.fillRect(e.x - 50, e.y - 45, 112, 104);
        ctx.fillStyle = "#ffd36b";
      } else ctx.fillStyle = "#3d4a5c";
      ctx.fillRect(e.x + 2, e.y + 3, 8, 8);
      ctx.fillStyle = "#f2f8ff"; ctx.fillRect(e.x - 2, e.y - 3, 16, 3);
    } else if (e.t === "S") {
      const cx = e.x + 12, cy = e.y + 12 + Math.sin(e.ph * 2.5) * 4;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 46);
      g.addColorStop(0, "rgba(255,220,120,.7)"); g.addColorStop(1, "rgba(255,220,120,0)");
      ctx.fillStyle = g; ctx.fillRect(cx - 46, cy - 46, 92, 92);
      star(cx, cy, 13, 6, e.ph, "#ffd84d", "#fff6c9");
    }
  }
  function star(cx, cy, R, r, rot, fill, stroke) {
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = rot + k * Math.PI / 5 - Math.PI / 2, rad = k % 2 ? r : R;
      ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
  }

  function drawBoss(b) {
    if (b.st === "dead" && Math.floor(time * 10) % 2) return;
    const x = Math.round(b.x), y = Math.round(b.y), w = b.w, h = b.h;
    const flash = b.inv > 0 && Math.floor(time * 14) % 2 === 0;
    ctx.save();
    if (b.face > 0) { ctx.translate(x * 2 + w, 0); ctx.scale(-1, 1); }
    const fur = flash ? "#ffffff" : "#2a2018", furL = flash ? "#ffffff" : "#3d2f24";
    ctx.fillStyle = "#e9e2d0"; // boynuzlar
    ctx.beginPath(); ctx.moveTo(x + 10, y + 12); ctx.lineTo(x + 2, y - 10); ctx.lineTo(x + 18, y + 6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 42, y + 12); ctx.lineTo(x + 50, y - 10); ctx.lineTo(x + 34, y + 6); ctx.fill();
    ctx.fillStyle = fur;
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2 + 4, w / 2, h / 2 - 2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = furL; // tüyler
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(x + 4 + k * 7, y + h - 6); ctx.lineTo(x + 7 + k * 7, y + h + 2); ctx.lineTo(x + 10 + k * 7, y + h - 6); ctx.fill(); }
    ctx.fillStyle = fur; ctx.fillRect(x + 8, y + h - 8, 10, 8); ctx.fillRect(x + 34, y + h - 8, 10, 8);
    const glow = flash ? "#ffffff" : "#ff3b3b";
    ctx.fillStyle = glow; ctx.shadowColor = "#ff3b3b"; ctx.shadowBlur = 10;
    ctx.fillRect(x + 12, y + 20, 7, 5); ctx.fillRect(x + 28, y + 20, 7, 5);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f4efe2";
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 13 + k * 6, y + 34); ctx.lineTo(x + 16 + k * 6, y + 40); ctx.lineTo(x + 19 + k * 6, y + 34); ctx.fill(); }
    ctx.restore();
  }

  function heart(x, y, s, full) {
    ctx.fillStyle = full ? "#ff5a6e" : "rgba(255,255,255,.18)";
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.fill();
  }

  function drawHUD() {
    for (let i = 0; i < 3; i++) heart(24 + i * 26, 14, 20, i < hearts);
    ctx.save(); ctx.translate(24, 52);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = "#ffffff"; ctx.font = `bold 15px ${FONT}`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(`${flakes - flakesAtStart} / ${flakesTotal}`, 38, 53);
    if (boss && boss.st === "active") {
      ctx.fillStyle = "rgba(0,0,0,.5)"; rr(VW / 2 - 90, 14, 180, 26, 13); ctx.fill();
      ctx.fillStyle = "#ff9a9a"; ctx.font = `bold 13px ${FONT}`; ctx.textAlign = "center";
      ctx.fillText("Karakoncolos", VW / 2 - 28, 27);
      for (let i = 0; i < 3; i++) heart(VW / 2 + 38 + i * 18, 19, 14, i < boss.hp);
    }
    if (state === "play") { // durdur tuşu
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.arc(VW - 30, 30, 18, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.fillRect(VW - 36, 22, 4, 16); ctx.fillRect(VW - 28, 22, 4, 16);
    }
    if (titleCard > 0) {
      const a = Math.min(1, titleCard, (2.6 - titleCard) * 3);
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = "rgba(0,0,0,.45)"; rr(VW / 2 - 200, VH * 0.28 - 26, 400, 52, 14); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = `bold 22px ${FONT}`; ctx.textAlign = "center";
      ctx.fillText(lvl.name, VW / 2, VH * 0.28);
      ctx.globalAlpha = 1;
    }
  }

  function drawTouch() {
    const b = touchButtons(), inp = readInput();
    const btn = (q, on, draw) => {
      ctx.fillStyle = on ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.08)";
      ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); draw(q.x, q.y); ctx.fill();
    };
    btn(b.left, inp.left, (x, y) => { ctx.moveTo(x - 12, y); ctx.lineTo(x + 8, y - 13); ctx.lineTo(x + 8, y + 13); });
    btn(b.right, inp.right, (x, y) => { ctx.moveTo(x + 12, y); ctx.lineTo(x - 8, y - 13); ctx.lineTo(x - 8, y + 13); });
    btn(b.jump, inp.jump, (x, y) => { ctx.moveTo(x, y - 15); ctx.lineTo(x - 15, y + 9); ctx.lineTo(x + 15, y + 9); });
  }

  function drawMenuBg(sunrise) {
    const camX = time * 25;
    if (sunrise) {
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, "#2a4a7a"); g.addColorStop(0.55, "#f2a35e"); g.addColorStop(1, "#ffd9a0");
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
      const sg = ctx.createRadialGradient(VW / 2, VH * 0.72, 10, VW / 2, VH * 0.72, 160);
      sg.addColorStop(0, "rgba(255,240,180,.95)"); sg.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = sg; ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#fff3c4"; ctx.beginPath(); ctx.arc(VW / 2, VH * 0.74, 34, 0, 7); ctx.fill();
      mountains("#5a5f86", camX, 0.15, VH * 0.72, 45, 1);
      mountains("#3c4268", camX, 0.3, VH * 0.86, 30, 4);
    } else {
      sky(THEMES.koy); moon(VW * 0.8, 64);
      mountains(THEMES.koy.far, camX, 0.15, VH * 0.62, 50, 1);
      mountains(THEMES.koy.near, camX, 0.3, VH * 0.8, 36, 4);
      village(camX, 0.45, VH * 0.9);
    }
    ctx.fillStyle = "#eef6ff"; ctx.fillRect(0, VH - 26, VW, 26);
    drawSnow(1, camX);
  }

  function lantern(x, y, lit, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (lit) {
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 90);
      g.addColorStop(0, "rgba(255,215,120,.8)"); g.addColorStop(1, "rgba(255,215,120,0)");
      ctx.fillStyle = g; ctx.fillRect(-90, -90, 180, 180);
    }
    ctx.fillStyle = "#2b2b3a"; rr(-16, -22, 32, 40, 6); ctx.fill();
    ctx.fillStyle = lit ? "#ffd84d" : "#3d4a5c"; rr(-11, -16, 22, 28, 4); ctx.fill();
    ctx.fillStyle = "#2b2b3a"; ctx.fillRect(-2, -16, 4, 28); ctx.fillRect(-11, -3, 22, 3);
    ctx.fillRect(-6, -30, 12, 8);
    ctx.strokeStyle = "#2b2b3a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -32, 6, Math.PI, 0); ctx.stroke();
    ctx.restore();
  }

  function button(x, y, w, h, label, fn, primary) {
    rr(x, y, w, h, h / 2);
    ctx.fillStyle = primary ? "#f2a33a" : "rgba(255,255,255,.14)"; ctx.fill();
    if (!primary) { ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.fillStyle = primary ? "#2a1a08" : "#ffffff"; ctx.font = `bold 16px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    menuButtons.push({ x, y, w, h, fn });
  }
  function titleText(text, y, size, color = "#ffffff") {
    ctx.font = `800 ${size}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillText(text, VW / 2 + 2, y + 3);
    ctx.fillStyle = color; ctx.fillText(text, VW / 2, y);
  }

  function drawTitle() {
    lantern(VW / 2, VH * 0.17, true, 1);
    titleText("Ayaz Ata'nın Feneri", VH * 0.36, Math.min(42, VW / 14));
    ctx.font = `italic 16px ${FONT}`; ctx.fillStyle = "#cfe3f5"; ctx.fillText("Bir Nardugan masalı", VW / 2, VH * 0.36 + 34);
    const s = save.get(), bw = 220, bx = VW / 2 - bw / 2;
    if (s.level > 0) {
      button(bx, VH * 0.56, bw, 46, `Devam et (${s.level + 1}. Bölüm)`, continueGame, true);
      button(bx, VH * 0.56 + 58, bw, 42, "Yeni oyun", newGame, false);
    } else button(bx, VH * 0.6, bw, 48, "Başla", newGame, true);
    drawBora(VW * 0.18, VH - 26 - 28, 1, time * 60, false, false);
    ctx.font = `12px ${FONT}`; ctx.fillStyle = "rgba(20,40,60,.8)"; ctx.textAlign = "center";
    ctx.fillText(showTouch ? "Ekrandaki tuşlarla oyna" : "← → ile yürü · Boşluk ile zıpla · P ile durdur", VW / 2, VH - 12);
  }

  function portraitOf(name, x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "#1c2c44"; rr(0, 0, 64, 64, 12); ctx.fill();
    if (name === "Ayaz Ata") {
      ctx.fillStyle = "#f2c9a0"; ctx.fillRect(18, 18, 28, 22);
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(32, 44, 18, 16, 0, 0, 7); ctx.fill();
      ctx.fillRect(20, 30, 24, 6);
      ctx.fillStyle = "#1b1b24"; ctx.fillRect(24, 24, 3, 3); ctx.fillRect(37, 24, 3, 3);
      ctx.fillStyle = "#f19c9c"; ctx.fillRect(21, 29, 4, 2); ctx.fillRect(39, 29, 4, 2);
      ctx.fillStyle = "#2f6fb3"; ctx.beginPath(); ctx.moveTo(14, 20); ctx.lineTo(32, 2); ctx.lineTo(50, 20); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.fillRect(14, 17, 36, 5); ctx.beginPath(); ctx.arc(32, 4, 4, 0, 7); ctx.fill();
    } else if (name === "Bora") {
      ctx.fillStyle = "#2f6fb3"; ctx.fillRect(14, 48, 36, 16);
      ctx.fillStyle = "#e53b3b"; ctx.fillRect(14, 44, 36, 6);
      ctx.fillStyle = "#f2c9a0"; ctx.fillRect(18, 18, 28, 28);
      ctx.fillStyle = "#1b1b24"; ctx.fillRect(24, 28, 4, 4); ctx.fillRect(37, 28, 4, 4);
      ctx.fillRect(28, 38, 8, 2);
      ctx.fillStyle = "#f19c9c"; ctx.fillRect(20, 34, 4, 2); ctx.fillRect(41, 34, 4, 2);
      ctx.fillStyle = "#e53b3b"; ctx.fillRect(15, 8, 34, 12);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(15, 18, 34, 4); ctx.beginPath(); ctx.arc(17, 9, 6, 0, 7); ctx.fill();
    } else if (name === "Karakoncolos") {
      ctx.fillStyle = "#e9e2d0";
      ctx.beginPath(); ctx.moveTo(14, 18); ctx.lineTo(6, 2); ctx.lineTo(22, 14); ctx.fill();
      ctx.beginPath(); ctx.moveTo(50, 18); ctx.lineTo(58, 2); ctx.lineTo(42, 14); ctx.fill();
      ctx.fillStyle = "#2a2018"; ctx.beginPath(); ctx.ellipse(32, 38, 24, 22, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#ff3b3b"; ctx.shadowColor = "#ff3b3b"; ctx.shadowBlur = 8;
      ctx.fillRect(20, 30, 8, 6); ctx.fillRect(36, 30, 8, 6); ctx.shadowBlur = 0;
      ctx.fillStyle = "#f4efe2";
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(21 + k * 6, 46); ctx.lineTo(24 + k * 6, 53); ctx.lineTo(27 + k * 6, 46); ctx.fill(); }
    }
    ctx.restore();
  }

  function wrap(text, maxW) {
    const words = text.split(" "), lines = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function drawStory() {
    if (!story) return;
    const [who, text] = story.lines[story.i];
    ctx.fillStyle = "rgba(5,10,20,.45)"; ctx.fillRect(0, 0, VW, VH);
    const bx = 16, bh = 124, by = VH - bh - 14, bw = VW - 32;
    rr(bx, by, bw, bh, 16); ctx.fillStyle = "rgba(12,22,38,.94)"; ctx.fill();
    ctx.strokeStyle = "rgba(160,200,240,.35)"; ctx.lineWidth = 1.5; ctx.stroke();
    let tx = bx + 20;
    if (who) { portraitOf(who, bx + 16, by + 16); tx = bx + 96; }
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    let ty = by + 16;
    if (who) {
      ctx.fillStyle = who === "Karakoncolos" ? "#ff8a8a" : who === "Bora" ? "#ffb070" : "#9fdcff";
      ctx.font = `bold 15px ${FONT}`; ctx.fillText(who, tx, ty); ty += 22;
      ctx.font = `16px ${FONT}`;
    } else { ctx.font = `italic 16px ${FONT}`; ty += 6; }
    ctx.fillStyle = "#eef5ff";
    const lines = wrap(text, bx + bw - tx - 20);
    let left = Math.floor(story.shown);
    for (const ln of lines) {
      if (left <= 0) break;
      ctx.fillText(ln.slice(0, left), tx, ty);
      left -= ln.length + 1; ty += 22;
    }
    if (story.shown >= text.length && Math.floor(time * 2) % 2 === 0) {
      ctx.fillStyle = "#9fdcff"; ctx.beginPath();
      ctx.moveTo(bx + bw - 30, by + bh - 22); ctx.lineTo(bx + bw - 18, by + bh - 22); ctx.lineTo(bx + bw - 24, by + bh - 14); ctx.fill();
    }
    ctx.font = `11px ${FONT}`; ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.textAlign = "right";
    ctx.fillText(showTouch ? "devam için dokun" : "devam: Boşluk", bx + bw - 40, by + bh - 22);
  }

  function dim() { ctx.fillStyle = "rgba(5,10,20,.6)"; ctx.fillRect(0, 0, VW, VH); }
  function drawPause() {
    dim();
    titleText("Durakladı", VH * 0.3, 32);
    const bw = 200, bx = VW / 2 - bw / 2;
    button(bx, VH * 0.45, bw, 46, "Devam et", () => { state = "play"; }, true);
    button(bx, VH * 0.45 + 58, bw, 42, "Bölümü baştan oyna", retry, false);
    button(bx, VH * 0.45 + 112, bw, 42, "Ana menü", toMenu, false);
  }
  function drawOver() {
    dim();
    titleText("Kalpler bitti", VH * 0.32, 32, "#ff9a9a");
    ctx.font = `15px ${FONT}`; ctx.fillStyle = "#cfe3f5"; ctx.fillText("Ayaz Ata seni bekliyor, pes etme!", VW / 2, VH * 0.32 + 34);
    const bw = 200, bx = VW / 2 - bw / 2;
    button(bx, VH * 0.52, bw, 46, "Tekrar dene", retry, true);
    button(bx, VH * 0.52 + 58, bw, 42, "Ana menü", toMenu, false);
  }
  function drawEnd() {
    lantern(VW / 2, VH * 0.2, true, 1.3);
    titleText("SON", VH * 0.42, 44, "#2a1a08");
    ctx.font = `16px ${FONT}`; ctx.fillStyle = "#3a2410"; ctx.textAlign = "center";
    ctx.fillText(`Bora feneri yaktı, gün doğdu. Toplanan kar tanesi: ${flakes}`, VW / 2, VH * 0.42 + 36);
    const bw = 200;
    button(VW / 2 - bw / 2, VH * 0.6, bw, 46, "Ana menü", toMenu, true);
  }
  function drawRotate() {
    ctx.fillStyle = "#0b1626"; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.translate(VW / 2, VH * 0.4); ctx.rotate(Math.sin(time * 2) * 0.6 - 0.6);
    ctx.strokeStyle = "#cfe3f5"; ctx.lineWidth = 4; rr(-22, -38, 44, 76, 8); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#eef5ff"; ctx.font = `bold 18px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Telefonu yan çevir", VW / 2, VH * 0.68);
  }

  // Test ve hata ayıklama için küçük bir kapı
  window.__oyun = { get state() { return state; }, get player() { return player; }, get boss() { return boss; }, loadLevel, advanceStory, get lvl() { return lvl; }, set hearts(v) { hearts = v; } };

  requestAnimationFrame(frame);
})();
