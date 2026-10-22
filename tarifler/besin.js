// Malzeme sözlüğü, ölçü çevirisi ve yaklaşık besin değeri hesabı.
// Değerler 100 g içindir (USDA ve TÜRKOMP ortalamalarına yakın, yaklaşık).
const Besin = (() => {
  "use strict";

  // Türkçe karakterleri sadeleştirip küçük harfe çevirir: "Soğan" → "sogan"
  const norm = s => String(s).toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

  // ---------- İngilizce → Türkçe malzeme adları (TheMealDB) ----------
  const SOZLUK = {
    "chicken": "tavuk", "chicken breast": "tavuk göğsü", "chicken breasts": "tavuk göğsü", "chicken thighs": "tavuk but",
    "chicken legs": "tavuk baget", "chicken wings": "tavuk kanat", "whole chicken": "bütün tavuk",
    "beef": "dana eti", "minced beef": "dana kıyma", "ground beef": "dana kıyma", "beef brisket": "dana döş", "steak": "biftek",
    "lamb": "kuzu eti", "lamb mince": "kuzu kıyma", "minced lamb": "kuzu kıyma", "pork": "domuz eti", "bacon": "domuz pastırması",
    "sausages": "sosis", "sausage": "sosis", "turkey": "hindi", "duck": "ördek",
    "salmon": "somon", "tuna": "ton balığı", "cod": "morina", "prawns": "karides", "king prawns": "jumbo karides", "shrimp": "karides",
    "white fish": "beyaz balık", "fish": "balık", "mussels": "midye", "squid": "kalamar", "anchovy": "hamsi",
    "egg": "yumurta", "eggs": "yumurta", "egg yolks": "yumurta sarısı", "egg yolk": "yumurta sarısı", "egg white": "yumurta akı", "egg whites": "yumurta akı",
    "milk": "süt", "butter": "tereyağı", "unsalted butter": "tuzsuz tereyağı", "cheese": "peynir", "cheddar cheese": "çedar peyniri",
    "parmesan": "parmesan peyniri", "parmesan cheese": "parmesan peyniri", "mozzarella": "mozzarella", "feta": "beyaz peynir",
    "cream": "krema", "double cream": "krema", "heavy cream": "krema", "single cream": "sıvı krema", "sour cream": "ekşi krema",
    "creme fraiche": "ekşi krema", "cream cheese": "krem peynir", "yogurt": "yoğurt", "greek yogurt": "süzme yoğurt", "natural yoghurt": "yoğurt", "yoghurt": "yoğurt",
    "flour": "un", "plain flour": "un", "self-raising flour": "kabartma tozlu un", "bread flour": "ekmek unu",
    "sugar": "şeker", "caster sugar": "toz şeker", "granulated sugar": "toz şeker", "brown sugar": "esmer şeker", "icing sugar": "pudra şekeri", "powdered sugar": "pudra şekeri",
    "honey": "bal", "maple syrup": "akçaağaç şurubu", "salt": "tuz", "sea salt": "deniz tuzu", "pepper": "karabiber", "black pepper": "karabiber",
    "olive oil": "zeytinyağı", "extra virgin olive oil": "sızma zeytinyağı", "vegetable oil": "sıvı yağ", "sunflower oil": "ayçiçek yağı", "oil": "sıvı yağ", "sesame oil": "susam yağı",
    "garlic": "sarımsak", "garlic clove": "sarımsak", "garlic cloves": "sarımsak", "minced garlic": "ezilmiş sarımsak",
    "onion": "soğan", "onions": "soğan", "red onion": "kırmızı soğan", "red onions": "kırmızı soğan", "spring onions": "taze soğan", "shallots": "arpacık soğan",
    "tomato": "domates", "tomatoes": "domates", "cherry tomatoes": "çeri domates", "chopped tomatoes": "doğranmış domates", "tomato puree": "domates püresi",
    "tomato paste": "domates salçası", "passata": "domates sosu", "tomato sauce": "domates sosu",
    "potato": "patates", "potatoes": "patates", "sweet potato": "tatlı patates", "carrot": "havuç", "carrots": "havuç", "celery": "kereviz sapı",
    "peas": "bezelye", "sweetcorn": "mısır", "corn": "mısır", "mushrooms": "mantar", "mushroom": "mantar", "spinach": "ıspanak", "broccoli": "brokoli",
    "cabbage": "lahana", "cauliflower": "karnabahar", "zucchini": "kabak", "courgettes": "kabak", "courgette": "kabak", "aubergine": "patlıcan", "eggplant": "patlıcan",
    "red pepper": "kırmızı biber", "green pepper": "yeşil biber", "yellow pepper": "sarı biber", "bell pepper": "dolmalık biber", "chilli": "acı biber",
    "red chilli": "kırmızı acı biber", "green chilli": "yeşil acı biber", "chilli powder": "toz acı biber", "cucumber": "salatalık", "lettuce": "marul", "avocado": "avokado",
    "ginger": "zencefil", "ground ginger": "toz zencefil", "lemon": "limon", "lime": "misket limonu", "lemon juice": "limon suyu", "lemon zest": "limon kabuğu rendesi",
    "parsley": "maydanoz", "coriander": "kişniş", "cilantro": "kişniş", "basil": "fesleğen", "thyme": "kekik", "rosemary": "biberiye", "oregano": "kekik", "mint": "nane",
    "dill": "dereotu", "bay leaf": "defne yaprağı", "bay leaves": "defne yaprağı", "cumin": "kimyon", "ground cumin": "kimyon", "paprika": "toz kırmızı biber",
    "cinnamon": "tarçın", "turmeric": "zerdeçal", "nutmeg": "muskat", "cloves": "karanfil", "cardamom": "kakule", "garam masala": "garam masala", "curry powder": "köri",
    "vanilla extract": "vanilya özütü", "vanilla": "vanilya", "baking powder": "kabartma tozu", "bicarbonate of soda": "karbonat", "baking soda": "karbonat", "yeast": "maya",
    "rice": "pirinç", "basmati rice": "basmati pirinci", "brown rice": "esmer pirinç", "long grain rice": "uzun taneli pirinç", "risotto rice": "risotto pirinci",
    "pasta": "makarna", "spaghetti": "spagetti", "penne": "kalem makarna", "penne rigate": "kalem makarna", "noodles": "erişte", "egg noodles": "yumurtalı erişte", "lasagne sheets": "lazanya yaprağı",
    "bread": "ekmek", "breadcrumbs": "galeta unu", "tortillas": "tortilla", "water": "su", "stock": "et suyu", "chicken stock": "tavuk suyu", "beef stock": "et suyu",
    "vegetable stock": "sebze suyu", "soy sauce": "soya sosu", "vinegar": "sirke", "white wine vinegar": "beyaz şarap sirkesi", "red wine vinegar": "kırmızı şarap sirkesi",
    "white wine": "beyaz şarap", "red wine": "kırmızı şarap", "cocoa": "kakao", "cocoa powder": "kakao", "dark chocolate": "bitter çikolata", "chocolate": "çikolata",
    "walnuts": "ceviz", "almonds": "badem", "hazelnuts": "fındık", "peanuts": "yer fıstığı", "pistachios": "antep fıstığı", "pine nuts": "çam fıstığı",
    "peanut butter": "fıstık ezmesi", "coconut milk": "hindistan cevizi sütü", "desiccated coconut": "hindistan cevizi rendesi", "chickpeas": "nohut", "lentils": "mercimek",
    "red lentils": "kırmızı mercimek", "kidney beans": "barbunya", "black beans": "siyah fasulye", "cornstarch": "mısır nişastası", "cornflour": "mısır nişastası",
    "mayonnaise": "mayonez", "mustard": "hardal", "dijon mustard": "dijon hardalı", "ketchup": "ketçap", "worcestershire sauce": "worcestershire sosu",
    "apple": "elma", "apples": "elma", "banana": "muz", "bananas": "muz", "raisins": "kuru üzüm", "oats": "yulaf", "olives": "zeytin", "black olives": "siyah zeytin",
    "capers": "kapari", "sesame seeds": "susam", "stir-fry vegetables": "karışık sebze", "mixed vegetables": "karışık sebze", "strawberries": "çilek", "orange": "portakal",
    "jam": "reçel", "gelatine": "jelatin", "puff pastry": "milföy hamuru", "filo pastry": "yufka", "bulgur wheat": "bulgur", "couscous": "kuskus"
  };
  const SOZLUK_N = {};
  for (const [en, tr] of Object.entries(SOZLUK)) SOZLUK_N[norm(en)] = tr;
  const SOZLUK_ANAHTAR = Object.keys(SOZLUK_N).sort((a, b) => b.length - a.length);

  // İngilizce malzeme adının Türkçesi (bilinmiyorsa null)
  function malzemeTr(en) {
    const virgul = en.indexOf(",");
    if (virgul > 0) {
      const ana = malzemeTr(en.slice(0, virgul));
      return ana ? ana + " (" + kelimeleriCevir(en.slice(virgul + 1)) + ")" : null;
    }
    const n = norm(en).trim();
    if (SOZLUK_N[n]) return SOZLUK_N[n];
    if (SOZLUK_N[n.replace(/e?s$/, "")]) return SOZLUK_N[n.replace(/e?s$/, "")];
    return null;
  }

  // ---------- "Dolabımda ne var" için Türkçe → TheMealDB malzeme adları ----------
  const DOLAP = {
    "tavuk": ["chicken", "chicken_breast", "chicken_thighs"], "tavuk gogsu": ["chicken_breast", "chicken_breasts"], "tavuk but": ["chicken_thighs"],
    "kiyma": ["minced_beef", "beef_mince", "lamb_mince"], "et": ["beef", "lamb"], "dana eti": ["beef"], "kuzu": ["lamb"], "kuzu eti": ["lamb"],
    "balik": ["salmon", "white_fish", "cod"], "somon": ["salmon"], "ton baligi": ["tuna"], "karides": ["prawns", "king_prawns"],
    "yumurta": ["eggs", "egg"], "sut": ["milk"], "tereyagi": ["butter"], "peynir": ["cheese", "cheddar_cheese", "feta"], "beyaz peynir": ["feta"],
    "kasar": ["cheddar_cheese", "mozzarella"], "krema": ["double_cream", "heavy_cream"], "yogurt": ["greek_yogurt", "natural_yoghurt"],
    "un": ["plain_flour", "flour"], "seker": ["sugar", "caster_sugar"], "bal": ["honey"], "pirinc": ["rice", "basmati_rice"], "bulgur": ["bulgur_wheat"],
    "makarna": ["pasta", "spaghetti", "penne_rigate"], "eriste": ["noodles", "egg_noodles"], "ekmek": ["bread"],
    "domates": ["tomatoes", "tomato", "chopped_tomatoes"], "sogan": ["onion", "onions", "red_onions"], "sarimsak": ["garlic", "garlic_clove"],
    "patates": ["potatoes", "potato"], "havuc": ["carrots", "carrot"], "biber": ["red_pepper", "green_pepper"], "patlican": ["aubergine", "eggplant"],
    "kabak": ["courgettes", "zucchini"], "ispanak": ["spinach"], "mantar": ["mushrooms"], "bezelye": ["peas"], "misir": ["sweetcorn"],
    "brokoli": ["broccoli"], "lahana": ["cabbage"], "limon": ["lemon"], "nohut": ["chickpeas"], "mercimek": ["lentils", "red_lentils"],
    "fasulye": ["kidney_beans", "black_beans"], "elma": ["apples"], "muz": ["bananas"], "cikolata": ["dark_chocolate", "chocolate"],
    "ceviz": ["walnuts"], "badem": ["almonds"], "zeytinyagi": ["olive_oil"], "salatalik": ["cucumber"], "avokado": ["avocado"], "zencefil": ["ginger"]
  };
  function dolapEn(trKelime) {
    const n = norm(trKelime).trim();
    if (DOLAP[n]) return DOLAP[n];
    const yalin = n.replace(/(lar|ler)$/, "");
    if (DOLAP[yalin]) return DOLAP[yalin];
    // Sözlükten ters arama
    for (const [en, tr] of Object.entries(SOZLUK_N)) if (norm(tr) === n) return [en.replace(/ /g, "_")];
    return null;
  }

  // ---------- Ölçüler ----------
  const KESIR = { "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4", "⅛": "1/8" };

  // "1 1/2 cups" → { n: 1.5, rest: "cups" }
  function sayiAyir(s) {
    s = s.replace(/[½⅓⅔¼¾⅛]/g, c => " " + KESIR[c]).trim().replace(/^(\d+)\s+(\d+\/\d+)/, "$1+$2");
    const yazi = s.match(/^(yarim|yarım|ceyrek|çeyrek|half|a)\s+/i);
    if (yazi && !/^a\s/i.test(yazi[0]) || yazi && /^a\s+(pinch|dash|handful|bunch)/i.test(s)) {
      const k = yazi[1].toLowerCase();
      return { n: k === "a" ? 1 : (k.startsWith("ce") || k.startsWith("çe") ? 0.25 : 0.5), rest: s.slice(yazi[0].length).trim() };
    }
    const m = s.match(/^(\d+\/\d+|\d+(?:[.,]\d+)?(?:\+\d+\/\d+)?)(?:\s*-\s*\d+(?:[.,]\d+)?)?/);
    if (!m) return { n: null, rest: s };
    let n = 0;
    for (const parca of m[1].split("+")) {
      if (parca.includes("/")) { const [a, b] = parca.split("/"); n += +a / +b; }
      else n += parseFloat(parca.replace(",", "."));
    }
    return { n: Math.round(n * 100) / 100, rest: s.slice(m[0].length).trim() };
  }

  // İngilizce ölçü kelimeleri → [hesap birimi, Türkçe gösterim, çarpan]
  const OLCU_EN = [
    [/^(pounds?|lbs?)\b\.?/i, "g", "g", 454], [/^(ounces?|oz)\b\.?/i, "g", "g", 28],
    [/^(kilograms?|kg)\b/i, "kg", "kg", 1], [/^(grams?|gr|g)\b/i, "g", "g", 1],
    [/^(millilit(?:re|er)s?|ml)\b/i, "ml", "ml", 1], [/^(lit(?:re|er)s?|l)\b/i, "l", "litre", 1],
    [/^cups?\b/i, "cup", "su bardağı", 1], [/^(tablespoons?|tbsp|tbs|tblsp)\b\.?/i, "tbsp", "yemek kaşığı", 1],
    [/^(teaspoons?|tsp)\b\.?/i, "tsp", "çay kaşığı", 1], [/^cloves?\b/i, "clove", "diş", 1],
    [/^(pinch(es)?|dash)\b/i, "pinch", "tutam", 1], [/^(cans?|tins?)\b/i, "can", "kutu", 1],
    [/^slices?\b/i, "slice", "dilim", 1], [/^handfuls?\b/i, "handful", "avuç", 1], [/^bunch(es)?\b/i, "bunch", "demet", 1],
    [/^sprigs?\b/i, "sprig", "dal", 1], [/^sticks?\b/i, "stick", "çubuk", 1],
    [/^large\b/i, "large", "büyük", 1], [/^medium\b/i, "medium", "orta boy", 1], [/^small\b/i, "small", "küçük", 1]
  ];
  const KELIME_EN = {
    "chopped": "doğranmış", "finely chopped": "ince doğranmış", "sliced": "dilimlenmiş", "diced": "küp doğranmış", "minced": "kıyılmış",
    "grated": "rendelenmiş", "crushed": "ezilmiş", "fresh": "taze", "dried": "kuru", "ground": "öğütülmüş", "to taste": "damak tadına göre",
    "to serve": "servis için", "for frying": "kızartmak için", "to garnish": "süslemek için", "juice of": "suyu:", "zest of": "kabuk rendesi:",
    "peeled": "soyulmuş", "softened": "yumuşatılmış", "melted": "eritilmiş", "beaten": "çırpılmış", "cooked": "pişmiş", "boiled": "haşlanmış",
    "frozen": "dondurulmuş", "whole": "bütün", "halved": "ikiye bölünmüş", "cubed": "küp doğranmış", "drained": "süzülmüş", "rinsed": "yıkanmış",
    "optional": "isteğe bağlı", "garnish": "süs için", "packet": "paket", "bag": "poşet", "jar": "kavanoz", "leaves": "yaprak", "pieces": "parça",
    "thinly": "ince", "roughly": "iri", "and": "ve", "or": "veya", "of": "", "a": "", "the": ""
  };
  function kelimeleriCevir(s) {
    let out = " " + s.toLowerCase() + " ";
    for (const [en, tr] of Object.entries(KELIME_EN).sort((a, b) => b[0].length - a[0].length)) {
      out = out.replace(new RegExp(`(^|[^a-z])${en}(?=[^a-z]|$)`, "g"), (m, p) => p + tr);
    }
    return out.replace(/\s+/g, " ").trim();
  }

  // TheMealDB ölçüsünü çözer: "3/4 cup" + "soy sauce" →
  // { goster: "0.75 su bardağı soya sosu", hesap: "0.75 cup soy sauce", adTr, cevrilecekAd }
  function olcuCevir(olcu, adEn) {
    olcu = (olcu || "").trim();
    const suyu = olcu.match(/^juice of\s*(.*)$/i);
    if (suyu) {
      const ad = malzemeTr(adEn) || adEn;
      return { goster: `${suyu[1] || 1} ${ad} suyu`.trim(), hesap: adEn + " juice", adTr: malzemeTr(adEn), adEn };
    }
    let { n, rest } = sayiAyir(olcu);
    let birim = "", birimTr = "";
    // "Pinch" gibi sayısız ölçüler 1 kabul edilir
    if (n == null && /^(pinch|dash|handful|bunch|sprig|clove|can|tin|slice)/i.test(rest)) n = 1;
    // "1 (12 oz.)" gibi parantez içi ağırlık varsa onu kullan
    const p = rest.match(/\(([^)]*)\)/);
    if (p) {
      const ic = sayiAyir(p[1]);
      const ob = OLCU_EN.find(([re]) => re.test(ic.rest));
      if (n != null && ic.n != null && ob && (ob[1] === "g")) { n = Math.round(n * ic.n * ob[3]); birim = "g"; birimTr = "g"; }
      rest = rest.replace(p[0], "").trim();
    }
    if (!birim) {
      for (const [re, b, tr, carpan] of OLCU_EN) {
        const m = rest.match(re);
        if (m) {
          birim = b; birimTr = tr; rest = rest.slice(m[0].length).trim();
          if (carpan !== 1 && n != null) n = Math.round(n * carpan);
          if (b === "kg" && n != null && n < 1) { n = Math.round(n * 1000); birim = "g"; birimTr = "g"; }
          break;
        }
      }
    }
    const adTr = malzemeTr(adEn);
    const ad = adTr || adEn;
    const ek = rest ? kelimeleriCevir(rest) : "";
    const sayi = n != null ? String(n) : "";
    const goster = n != null
      ? [sayi, birimTr, ad].filter(Boolean).join(" ") + (ek ? ` (${ek})` : "")
      : ad.charAt(0).toLocaleUpperCase("tr") + ad.slice(1) + (ek || olcu ? ` – ${ek || olcu}` : "");
    const hesap = n != null ? [sayi, birim, adEn].filter(Boolean).join(" ") : adEn;
    return { goster, hesap, adTr, adEn };
  }

  // ---------- Besin tablosu ----------
  // [anahtarlar, kcal, protein, karbonhidrat, yağ, adet ağırlığı (g), yoğunluk (g/ml)]
  const T = [
    [["su", "water", "buz", "ice"], 0, 0, 0, 0, 0, 1],
    [["tuz", "salt", "karabiber", "pepper", "kimyon", "cumin", "pul biber", "chilli flakes", "nane", "kekik", "oregano", "thyme", "paprika", "tarcin", "cinnamon",
      "zerdecal", "turmeric", "muskat", "nutmeg", "karanfil", "kakule", "cardamom", "defne", "bay leaf", "bay leaves", "vanilya", "vanilla", "kabartma tozu", "baking powder",
      "karbonat", "bicarbonate", "baking soda", "maya", "yeast", "sumak", "isot", "kirmizi toz biber", "garam masala", "curry powder", "kori", "chilli powder",
      "biberiye", "rosemary", "fesleğen", "feslegen", "basil", "kisnis", "coriander", "cilantro", "dereotu", "dill", "mint", "allspice", "yenibahar"], 0, 0, 0, 0, 1, 0.5],
    [["kirmizi mercimek", "mercimek", "lentils", "red lentils"], 358, 24, 63, 2, 0, 0.85],
    [["kuru fasulye", "barbunya", "kidney beans", "black beans"], 333, 21, 60, 1, 0, 0.8],
    [["nohut", "chickpeas"], 364, 19, 61, 6, 0, 0.8],
    [["pirinc", "rice"], 360, 7, 79, 0.6, 0, 0.85],
    [["bulgur"], 342, 12, 76, 1.3, 0, 0.75],
    [["irmik", "semolina"], 360, 13, 73, 1, 0, 0.7],
    [["nisasta", "cornstarch", "cornflour"], 381, 0.3, 91, 0.1, 0, 0.6],
    [["galeta unu", "breadcrumbs"], 395, 13, 72, 5, 0, 0.45],
    [["un", "flour"], 364, 10, 76, 1, 0, 0.55],
    [["pudra sekeri", "icing sugar", "powdered sugar"], 389, 0, 100, 0, 0, 0.5],
    [["seker", "sugar"], 387, 0, 100, 0, 0, 0.85],
    [["bal", "honey"], 304, 0.3, 82, 0, 0, 1.4],
    [["tereyagi", "butter"], 717, 1, 0.1, 81, 0, 0.95],
    [["zeytinyagi", "sivi yag", "aycicek yagi", "olive oil", "vegetable oil", "sunflower oil", "sesame oil", "oil", "yag"], 884, 0, 0, 100, 0, 0.92],
    [["sut", "milk"], 61, 3.2, 4.8, 3.3, 0, 1.03],
    [["suzme yogurt", "greek yogurt"], 97, 9, 4, 5, 0, 1.05],
    [["yogurt", "yoghurt"], 61, 3.5, 4.7, 3.3, 0, 1.05],
    [["krema", "cream", "creme fraiche", "sour cream"], 340, 2, 3, 36, 0, 1],
    [["krem peynir", "cream cheese"], 342, 6, 4, 34, 0, 1],
    [["beyaz peynir", "feta"], 264, 14, 4, 21, 0, 0.5],
    [["parmesan"], 431, 38, 4, 29, 0, 0.4],
    [["kasar", "cheddar", "mozzarella", "peynir", "cheese"], 350, 25, 2, 27, 0, 0.45],
    [["yumurta sarisi", "egg yolk", "egg yolks"], 322, 16, 3.6, 27, 17, 1],
    [["yumurta aki", "egg white", "egg whites"], 52, 11, 0.7, 0.2, 33, 1],
    [["yumurta", "egg", "eggs"], 143, 12.6, 0.7, 9.5, 50, 1],
    [["tavuk gogsu", "chicken breast", "chicken breasts"], 165, 31, 0, 3.6, 170, 1],
    [["tavuk", "chicken"], 190, 27, 0, 8, 150, 1],
    [["hindi", "turkey"], 189, 29, 0, 7, 150, 1],
    [["kiyma", "mince", "minced beef", "ground beef", "lamb mince"], 250, 17, 0, 20, 0, 1],
    [["kusbasi", "dana", "beef", "steak", "brisket"], 217, 26, 0, 12, 0, 1],
    [["kuzu", "lamb"], 294, 25, 0, 21, 0, 1],
    [["pork", "domuz"], 242, 27, 0, 14, 0, 1],
    [["bacon", "pastirma"], 541, 37, 1.4, 42, 15, 1],
    [["sucuk", "sosis", "sausage", "sausages"], 300, 12, 2, 27, 50, 1],
    [["somon", "salmon"], 208, 20, 0, 13, 150, 1],
    [["ton baligi", "tuna"], 132, 28, 0, 1, 0, 1],
    [["karides", "prawns", "shrimp"], 99, 24, 0.2, 0.3, 12, 1],
    [["balik", "fish", "cod", "white fish"], 105, 23, 0, 1, 150, 1],
    [["sogan", "onion", "onions", "shallots"], 40, 1.1, 9.3, 0.1, 110, 0.6],
    [["sarimsak", "garlic"], 149, 6.4, 33, 0.5, 4, 0.6],
    [["salca", "tomato paste", "tomato puree"], 82, 4.3, 19, 0.5, 0, 1.1],
    [["domates", "tomato", "tomatoes", "passata", "tomato sauce"], 18, 0.9, 3.9, 0.2, 120, 1],
    [["tatli patates", "sweet potato"], 86, 1.6, 20, 0.1, 150, 0.6],
    [["patates", "potato", "potatoes"], 77, 2, 17, 0.1, 170, 0.6],
    [["havuc", "carrot", "carrots"], 41, 0.9, 10, 0.2, 60, 0.6],
    [["patlican", "aubergine", "eggplant"], 25, 1, 6, 0.2, 250, 0.4],
    [["kabak", "courgette", "courgettes", "zucchini"], 17, 1.2, 3.1, 0.3, 200, 0.5],
    [["karisik sebze", "stir-fry vegetables", "mixed vegetables", "vegetables"], 40, 2, 8, 0.3, 0, 0.5],
    [["biber", "red pepper", "green pepper", "yellow pepper", "bell pepper", "peppers", "chilli"], 20, 0.9, 4.6, 0.2, 30, 0.5],
    [["ispanak", "spinach"], 23, 2.9, 3.6, 0.4, 0, 0.2],
    [["mantar", "mushroom", "mushrooms"], 22, 3.1, 3.3, 0.3, 15, 0.4],
    [["bezelye", "peas"], 81, 5.4, 14, 0.4, 0, 0.6],
    [["misir", "sweetcorn", "corn"], 86, 3.3, 19, 1.4, 0, 0.7],
    [["brokoli", "broccoli", "karnabahar", "cauliflower", "lahana", "cabbage"], 30, 2.5, 6, 0.3, 400, 0.4],
    [["salatalik", "cucumber"], 15, 0.7, 3.6, 0.1, 200, 0.6],
    [["marul", "lettuce", "roka"], 15, 1.4, 2.9, 0.2, 300, 0.2],
    [["kereviz", "celery"], 16, 0.7, 3, 0.2, 40, 0.5],
    [["maydanoz", "parsley"], 36, 3, 6, 0.8, 50, 0.2],
    [["limon suyu", "lemon juice"], 22, 0.4, 7, 0.2, 0, 1],
    [["limon", "lemon", "lime"], 29, 1.1, 9, 0.3, 85, 1],
    [["zencefil", "ginger"], 80, 1.8, 18, 0.8, 10, 0.5],
    [["avokado", "avocado"], 160, 2, 9, 15, 150, 1],
    [["zeytin", "olives"], 115, 0.8, 6, 11, 4, 0.6],
    [["makarna", "pasta", "spaghetti", "penne", "noodles", "eriste", "lasagne"], 371, 13, 75, 1.5, 0, 0.45],
    [["ekmek", "bread", "tortilla", "tortillas"], 265, 9, 49, 3.2, 30, 0.3],
    [["yufka", "filo", "puff pastry", "milfoy"], 330, 7, 45, 14, 0, 0.5],
    [["yulaf", "oats"], 389, 17, 66, 7, 0, 0.4],
    [["kakao", "cocoa"], 228, 20, 58, 14, 0, 0.4],
    [["cikolata", "chocolate"], 546, 5, 61, 31, 0, 0.6],
    [["ceviz", "walnuts", "findik", "hazelnuts", "badem", "almonds", "fistik", "peanuts", "pistachios", "pine nuts"], 620, 16, 15, 56, 0, 0.55],
    [["hindistan cevizi sutu", "coconut milk"], 230, 2.3, 6, 24, 0, 1],
    [["hindistan cevizi", "coconut"], 660, 7, 24, 64, 0, 0.35],
    [["kuru uzum", "raisins"], 299, 3, 79, 0.5, 0, 0.6],
    [["elma", "apple", "apples"], 52, 0.3, 14, 0.2, 180, 0.6],
    [["muz", "banana", "bananas"], 89, 1.1, 23, 0.3, 120, 0.6],
    [["cilek", "strawberries"], 32, 0.7, 7.7, 0.3, 15, 0.6],
    [["portakal", "orange"], 47, 0.9, 12, 0.1, 150, 1],
    [["recel", "jam"], 250, 0.4, 65, 0.1, 0, 1.3],
    [["soya sosu", "soy sauce"], 53, 8, 5, 0.6, 0, 1.1],
    [["sirke", "vinegar"], 18, 0, 0, 0, 0, 1],
    [["sarap", "wine"], 83, 0.1, 2.6, 0, 0, 1],
    [["mayonez", "mayonnaise"], 680, 1, 0.6, 75, 0, 0.95],
    [["hardal", "mustard", "ketcap", "ketchup", "worcestershire"], 100, 2, 20, 2, 0, 1.1],
    [["et suyu", "tavuk suyu", "sebze suyu", "stock"], 5, 0.5, 0.5, 0.2, 0, 1],
    [["susam", "sesame seeds"], 573, 18, 23, 50, 0, 0.6],
    [["fistik ezmesi", "peanut butter"], 588, 25, 20, 50, 0, 1.05],
    [["jelatin", "gelatine"], 335, 86, 0, 0, 0, 0.6]
  ];
  const TABLO = [];
  for (const [anahtarlar, kcal, p, k, y, adet, yog] of T) {
    for (const a of anahtarlar) TABLO.push({ a: norm(a), kcal, p, k, y, adet, yog });
  }
  TABLO.sort((x, y) => y.a.length - x.a.length);
  const kacis = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const t of TABLO) t.re = new RegExp(`(^|[^a-z])${kacis(t.a)}[a-z]{0,3}([^a-z]|$)`);

  // Birim → [tür, miktar]
  const BIRIM = [
    ["su bardagi", "ml", 200], ["cay bardagi", "ml", 100], ["kahve fincani", "ml", 70],
    ["yemek kasigi", "ml", 15], ["tatli kasigi", "ml", 10], ["cay kasigi", "ml", 5],
    ["cups", "ml", 240], ["cup", "ml", 240], ["tbsp", "ml", 15], ["tsp", "ml", 5],
    ["kilogram", "g", 1000], ["kg", "g", 1000], ["gram", "g", 1], ["gr", "g", 1], ["g", "g", 1],
    ["litre", "ml", 1000], ["lt", "ml", 1000], ["l", "ml", 1000], ["ml", "ml", 1],
    ["pinch", "g", 0.4], ["tutam", "g", 0.4], ["clove", "adet", 1], ["dis", "adet", 1],
    ["can", "g", 400], ["kutu", "g", 400], ["slice", "g", 30], ["dilim", "g", 30],
    ["handful", "g", 30], ["avuc", "g", 30], ["bunch", "g", 50], ["demet", "g", 50], ["sprig", "g", 2], ["dal", "g", 2],
    ["stick", "g", 113], ["large", "adet", 1.3], ["buyuk", "adet", 1.3], ["medium", "adet", 1], ["orta boy", "adet", 1],
    ["small", "adet", 0.7], ["kucuk", "adet", 0.7], ["adet", "adet", 1], ["tane", "adet", 1], ["bas", "adet", 8]
  ];

  // Tek bir malzeme satırını gram ve besin değerine çevirir
  function satirHesapla(satir) {
    const s = norm(satir).replace(/\(.*?\)/g, " ").trim();
    const { n, rest } = sayiAyir(s);
    let tur = "adet", miktar = 1, ad = rest;
    for (const [b, t, m] of BIRIM) {
      const re = new RegExp(`^${b}([^a-z]|$)`);
      if (re.test(rest)) { tur = t; miktar = m; ad = rest.slice(b.length); break; }
    }
    // Ölçü kelimesi ("su bardağı") ayrıldıktan sonra malzeme adı aranır
    const yiyecek = TABLO.find(t => t.re.test(ad));
    if (!yiyecek) return null;
    if (yiyecek.kcal === 0) return { kcal: 0, p: 0, k: 0, y: 0 };
    if (n == null) return null;
    let gram;
    if (tur === "ml") gram = n * miktar * yiyecek.yog;
    else if (tur === "g") gram = n * miktar;
    else {
      // "1 diş sarımsak" ya da "2 adet soğan" gibi tane ile ölçülenler
      if (!yiyecek.adet) return null;
      gram = n * miktar * yiyecek.adet;
    }
    const f = gram / 100;
    return { kcal: yiyecek.kcal * f, p: yiyecek.p * f, k: yiyecek.k * f, y: yiyecek.y * f };
  }

  // Tarifin porsiyon başına yaklaşık besin değeri
  function hesapla(satirlar, porsiyon) {
    const top = { kcal: 0, p: 0, k: 0, y: 0, bulunan: 0, toplam: satirlar.length };
    for (const s of satirlar) {
      const r = satirHesapla(s);
      if (!r) continue;
      top.bulunan++;
      top.kcal += r.kcal; top.p += r.p; top.k += r.k; top.y += r.y;
    }
    const b = Math.max(1, porsiyon || 1);
    return {
      kcal: Math.round(top.kcal / b), p: Math.round(top.p / b), k: Math.round(top.k / b), y: Math.round(top.y / b),
      bulunan: top.bulunan, toplam: top.toplam
    };
  }

  return { norm, malzemeTr, dolapEn, olcuCevir, sayiAyir, hesapla, satirHesapla };
})();
