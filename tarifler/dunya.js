// Dünya mutfağı: TheMealDB'den tarif çekme, Türkçeye çevirme ve "Dolabımda ne var" araması.
const Dunya = (() => {
  "use strict";

  const API = "https://www.themealdb.com/api/json/v1/1/";
  const { norm, malzemeTr, dolapEn, olcuCevir } = Besin;

  const store = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* yer yoksa geç */ } }
  };

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }
  const api = async yol => (await getJSON(API + yol)).meals || [];

  // ---------- Kategori ve mutfak adları ----------
  const KATEGORI = {
    Beef: "Dana Eti", Chicken: "Tavuk", Dessert: "Tatlı", Lamb: "Kuzu", Miscellaneous: "Çeşitli", Pasta: "Makarna",
    Pork: "Domuz Eti", Seafood: "Deniz Ürünleri", Side: "Yan Yemek", Starter: "Başlangıç", Vegan: "Vegan",
    Vegetarian: "Vejetaryen", Breakfast: "Kahvaltı", Goat: "Keçi Eti"
  };
  const MUTFAK = {
    Turkish: "Türk", Italian: "İtalyan", Japanese: "Japon", Chinese: "Çin", Indian: "Hint", Mexican: "Meksika", French: "Fransız",
    Greek: "Yunan", Spanish: "İspanyol", Thai: "Tayland", American: "Amerikan", British: "İngiliz", Moroccan: "Fas", Egyptian: "Mısır",
    Tunisian: "Tunus", Vietnamese: "Vietnam", Malaysian: "Malezya", Filipino: "Filipin", Jamaican: "Jamaika", Russian: "Rus",
    Polish: "Polonya", Portuguese: "Portekiz", Croatian: "Hırvat", Dutch: "Hollanda", Irish: "İrlanda", Kenyan: "Kenya",
    Canadian: "Kanada", Ukrainian: "Ukrayna", Algerian: "Cezayir", Argentinian: "Arjantin", Australian: "Avustralya",
    Norwegian: "Norveç", "Saudi Arabian": "Suudi Arabistan", Slovakian: "Slovak", Syrian: "Suriye", Uruguayan: "Uruguay",
    Venezulan: "Venezuela", Unknown: "Diğer"
  };
  const kategoriTr = c => KATEGORI[c] || c || "Dünya";
  const mutfakTr = a => MUTFAK[a] || a || "";
  const KATEGORI_EMOJI = {
    Beef: "🥩", Chicken: "🍗", Dessert: "🍰", Lamb: "🍖", Pasta: "🍝", Seafood: "🐟", Side: "🥔", Starter: "🥗",
    Vegan: "🥦", Vegetarian: "🥕", Breakfast: "🍳", Goat: "🍖", Pork: "🥓", Miscellaneous: "🍽️"
  };

  // ---------- Çeviri ----------
  // Önce MyMemory (resmi, ücretsiz), kota dolarsa Google'ın ücretsiz uç noktası denenir.
  const ceviriOnbellek = store.get("tarif.ceviri", {});
  let onbellekKayit = null;
  function onbellekYaz() {
    clearTimeout(onbellekKayit);
    onbellekKayit = setTimeout(() => {
      const anahtarlar = Object.keys(ceviriOnbellek);
      if (anahtarlar.length > 3000) anahtarlar.slice(0, anahtarlar.length - 3000).forEach(k => delete ceviriOnbellek[k]);
      store.set("tarif.ceviri", ceviriOnbellek);
    }, 300);
  }
  const bugun = () => new Date().toISOString().slice(0, 10);

  async function myMemory(metin, kaynak, hedef) {
    if (store.get("tarif.mmKota", "") === bugun()) throw new Error("kota");
    const d = await getJSON(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(metin)}&langpair=${kaynak}|${hedef}`);
    const t = d && d.responseData && d.responseData.translatedText;
    if (d.responseStatus == 429 || !t || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(t)) {
      if (d.responseStatus == 429 || /MYMEMORY WARNING/i.test(t || "")) store.set("tarif.mmKota", bugun());
      throw new Error("mymemory");
    }
    return t;
  }
  async function google(metin, kaynak, hedef) {
    const d = await getJSON(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${kaynak}&tl=${hedef}&dt=t&q=${encodeURIComponent(metin)}`);
    return d[0].map(x => x[0]).join("");
  }
  async function tekCevir(metin, kaynak, hedef) {
    try { return await myMemory(metin, kaynak, hedef); }
    catch { return await google(metin, kaynak, hedef); }
  }

  // Uzun metni cümle sınırından ≤ 450 karakterlik parçalara böler
  function parcala(metin, sinir = 450) {
    if (metin.length <= sinir) return [metin];
    const cumleler = metin.match(/[^.!?]+[.!?]*\s*/g) || [metin];
    const out = []; let cur = "";
    for (const c of cumleler) {
      if ((cur + c).length > sinir && cur) { out.push(cur.trim()); cur = ""; }
      if (c.length > sinir) { for (let i = 0; i < c.length; i += sinir) out.push(c.slice(i, i + sinir)); }
      else cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  // Metin listesini çevirir; önbellekte olanlar için istek atılmaz
  async function cevir(metinler, kaynak = "en", hedef = "tr") {
    const sonuc = new Array(metinler.length);
    const eksik = [];
    metinler.forEach((m, i) => {
      const k = kaynak + hedef + "|" + m;
      if (!m || !m.trim()) sonuc[i] = m;
      else if (ceviriOnbellek[k]) sonuc[i] = ceviriOnbellek[k];
      else eksik.push(i);
    });
    // Parçaları satır satır birleştirip az istekle çevir
    const parcalar = [];
    for (const i of eksik) parcala(metinler[i]).forEach(p => parcalar.push({ i, p, t: null }));
    let grup = [];
    const gruplar = [];
    for (const pr of parcalar) {
      const uzunluk = grup.reduce((a, g) => a + g.p.length + 1, 0);
      if (grup.length && uzunluk + pr.p.length > 450) { gruplar.push(grup); grup = []; }
      grup.push(pr);
    }
    if (grup.length) gruplar.push(grup);
    await Promise.all(gruplar.map(async g => {
      const cikti = await tekCevir(g.map(x => x.p).join("\n"), kaynak, hedef);
      const satirlar = cikti.split(/\n/).map(s => s.trim()).filter(Boolean);
      if (satirlar.length === g.length) g.forEach((x, j) => (x.t = satirlar[j]));
      else for (const x of g) x.t = await tekCevir(x.p, kaynak, hedef);
    }));
    for (const i of eksik) {
      const t = parcalar.filter(x => x.i === i).map(x => x.t).join(" ");
      sonuc[i] = t;
      ceviriOnbellek[kaynak + hedef + "|" + metinler[i]] = t;
    }
    onbellekYaz();
    return sonuc;
  }

  // ---------- Tarif dönüştürme ----------
  // "15 minutes", "1 hour" → dakika
  function dakikaBul(metin) {
    const s = metin.match(/(\d+)\s*(minutes?|mins?)\b/i);
    if (s) return +s[1];
    const h = metin.match(/(\d+(?:\.\d+)?|an|one)\s*hours?\b/i);
    if (h) return Math.round((/^\d/.test(h[1]) ? +h[1] : 1) * 60);
    return null;
  }

  function adimlaraBol(talimat) {
    let adimlar = String(talimat || "").split(/\r?\n+/)
      .map(s => s.replace(/^\s*(step\s*\d+[:.)-]?|\d+[.)]\s)\s*/i, "").trim())
      .filter(s => s && !/^(step\s*)?\d+\.?$/i.test(s));
    if (adimlar.length <= 2 && adimlar.join(" ").length > 300) {
      const cumleler = adimlar.join(" ").match(/[^.!?]+[.!?]+["')]?\s*/g) || adimlar;
      adimlar = []; let cur = "";
      for (const c of cumleler) {
        cur += c;
        if (cur.length > 160) { adimlar.push(cur.trim()); cur = ""; }
      }
      if (cur.trim()) adimlar.push(cur.trim());
    }
    return adimlar;
  }

  // TheMealDB kaydını uygulamanın tarif biçimine çevirir (henüz çevrilmemiş hali)
  function tarifYap(m) {
    const malzemeler = [];
    for (let i = 1; i <= 20; i++) {
      const ad = (m["strIngredient" + i] || "").trim();
      if (!ad) continue;
      malzemeler.push(olcuCevir(m["strMeasure" + i], ad));
    }
    const adimlarEn = adimlaraBol(m.strInstructions);
    const steps = adimlarEn.map(t => { const dk = dakikaBul(t); return dk ? { t, dk } : { t }; });
    const sure = steps.reduce((a, s) => a + (s.dk || 0), 0);
    return {
      id: "m-" + m.idMeal, mealId: m.idMeal, api: true, tr: false,
      name: m.strMeal, nameEn: m.strMeal,
      emoji: KATEGORI_EMOJI[m.strCategory] || "🌍",
      img: m.strMealThumb || "",
      cat: kategoriTr(m.strCategory), area: mutfakTr(m.strArea),
      time: sure || null, servings: 4,
      ingredients: malzemeler.map(x => x.goster),
      ingredientsEn: malzemeler.map(x => x.hesap),
      calc: malzemeler.map(x => x.hesap),
      cevrilecek: malzemeler.map((x, i) => (x.adTr ? null : i)).filter(i => i !== null),
      malzemeEn: malzemeler.map(x => x.adEn),
      steps, stepsEn: adimlarEn,
      youtube: m.strYoutube || "", source: m.strSource || ""
    };
  }

  // Tarifin adını, bilinmeyen malzeme adlarını ve adımlarını Türkçeye çevirir
  async function tarifCevir(r) {
    const malzemeMetin = r.cevrilecek.map(i => r.malzemeEn[i]);
    const hepsi = [r.nameEn, ...malzemeMetin, ...r.stepsEn];
    const c = await cevir(hepsi);
    const yeni = { ...r, tr: true, name: c[0] };
    yeni.ingredients = r.ingredients.slice();
    r.cevrilecek.forEach((idx, j) => {
      const tr = c[1 + j];
      const kalip = new RegExp(r.malzemeEn[idx].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (tr) yeni.ingredients[idx] = r.ingredients[idx].replace(kalip, tr.toLocaleLowerCase("tr"));
    });
    const adimTr = c.slice(1 + malzemeMetin.length);
    yeni.steps = r.steps.map((s, i) => ({ ...s, t: adimTr[i] || s.t }));
    return yeni;
  }

  // ---------- Arama ----------
  const hafiza = {};
  async function onbellekli(yol) {
    if (!hafiza[yol]) hafiza[yol] = api(yol).catch(e => { delete hafiza[yol]; throw e; });
    return hafiza[yol];
  }
  const ozet = m => ({ id: "m-" + m.idMeal, mealId: m.idMeal, nameEn: m.strMeal, img: m.strMealThumb,
    cat: m.strCategory ? kategoriTr(m.strCategory) : "", area: m.strArea ? mutfakTr(m.strArea) : "" });

  const mutfaga = a => onbellekli("filter.php?a=" + encodeURIComponent(a)).then(l => l.map(m => ({ ...ozet(m), area: mutfakTr(a) })));
  const kategoriye = c => onbellekli("filter.php?c=" + encodeURIComponent(c)).then(l => l.map(m => ({ ...ozet(m), cat: kategoriTr(c) })));
  const mutfakListesi = () => onbellekli("list.php?a=list").then(l => l.map(x => x.strArea));
  const kategoriListesi = () => onbellekli("list.php?c=list").then(l => l.map(x => x.strCategory));
  const getir = async id => { const l = await api("lookup.php?i=" + encodeURIComponent(id)); return l[0] ? tarifYap(l[0]) : null; };
  const rastgele = async () => { const l = await api("random.php"); return tarifYap(l[0]); };

  // Türkçe ya da İngilizce aramaya göre tarif bulur
  async function ara(sorgu) {
    sorgu = sorgu.trim();
    if (!sorgu) return [];
    let en = sorgu;
    const malzeme = dolapEn(sorgu);
    if (/[çğıöşüÇĞİÖŞÜ]/.test(sorgu) || malzeme) {
      try { en = malzeme ? malzeme[0].replace(/_/g, " ") : (await cevir([sorgu], "tr", "en"))[0]; } catch { /* çeviri olmazsa aynen ara */ }
    }
    const istekler = [onbellekli("search.php?s=" + encodeURIComponent(en))];
    if (en !== sorgu) istekler.push(onbellekli("search.php?s=" + encodeURIComponent(sorgu)));
    if (malzeme) malzeme.forEach(x => istekler.push(onbellekli("filter.php?i=" + encodeURIComponent(x))));
    const listeler = await Promise.all(istekler.map(p => p.catch(() => [])));
    const gorulen = new Set(), out = [];
    for (const l of listeler) for (const m of l) if (!gorulen.has(m.idMeal)) { gorulen.add(m.idMeal); out.push(ozet(m)); }
    return out;
  }

  // Liste kartlarındaki İngilizce adları toplu çevirir
  async function adlariCevir(liste) {
    try {
      const c = await cevir(liste.map(x => x.nameEn));
      liste.forEach((x, i) => (x.name = c[i] || x.nameEn));
    } catch { liste.forEach(x => (x.name = x.nameEn)); }
    return liste;
  }
  // Önbellekte çevirisi olanları anında doldurur (istek atmadan)
  function hazirAd(nameEn) { return ceviriOnbellek["entr|" + nameEn] || null; }

  // ---------- Dolabımda ne var ----------
  // Her malzeme için TheMealDB'de ayrı arama yapar, tarifleri eşleşen malzeme sayısına göre sıralar
  async function dolaptan(malzemeler) {
    const puan = new Map();
    await Promise.all(malzemeler.map(async tr => {
      let karsilik = dolapEn(tr);
      if (!karsilik) {
        try { karsilik = [(await cevir([tr], "tr", "en"))[0].toLowerCase().replace(/\s+/g, "_")]; }
        catch { karsilik = []; }
      }
      const listeler = await Promise.all(karsilik.map(k => onbellekli("filter.php?i=" + encodeURIComponent(k)).catch(() => [])));
      const bulunan = new Set();
      for (const l of listeler) for (const m of l) {
        if (bulunan.has(m.idMeal)) continue;
        bulunan.add(m.idMeal);
        const p = puan.get(m.idMeal) || { ...ozet(m), eslesen: [] };
        p.eslesen.push(tr);
        puan.set(m.idMeal, p);
      }
    }));
    return [...puan.values()].sort((a, b) => b.eslesen.length - a.eslesen.length).slice(0, 40);
  }

  // Yerel (Türkçe) tariflerde malzeme eşleştirme
  function yerelEslesme(tarif, malzemeler) {
    const satirlar = tarif.ingredients.map(norm);
    return malzemeler.filter(m => {
      const n = norm(m).replace(/(lar|ler)$/, "");
      return satirlar.some(s => s.includes(n));
    });
  }

  return {
    mutfaga, kategoriye, mutfakListesi, kategoriListesi, getir, rastgele, ara, adlariCevir, hazirAd,
    tarifCevir, dolaptan, yerelEslesme, kategoriTr, mutfakTr, MUTFAK, KATEGORI
  };
})();
