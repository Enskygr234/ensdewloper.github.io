// Hazır tarifler. Malzemelerin başındaki sayı, porsiyon değişince otomatik ölçeklenir.
// Adımlardaki "dk" değeri, o adım için zamanlayıcı butonu çıkarır.
const DEFAULT_RECIPES = [
  {
    id: "mercimek-corbasi", name: "Mercimek Çorbası", emoji: "🥣", cat: "Çorba", time: 40, servings: 4,
    ingredients: ["1 su bardağı kırmızı mercimek", "1 adet soğan", "1 adet havuç", "1 adet patates", "2 yemek kaşığı tereyağı", "1 yemek kaşığı un", "6 su bardağı sıcak su", "1 çay kaşığı tuz", "1 çay kaşığı kimyon", "1 tatlı kaşığı pul biber"],
    steps: [
      { t: "Soğanı, havucu ve patatesi küçük doğra. Mercimeği yıka." },
      { t: "Tereyağının yarısını tencerede erit, soğanı pembeleşene kadar kavur.", dk: 3 },
      { t: "Unu ekle, kokusu çıkana kadar karıştır. Havuç, patates ve mercimeği ekle." },
      { t: "Sıcak suyu ekle, kapağını kapat, mercimekler dağılana kadar pişir.", dk: 25 },
      { t: "Blenderdan geçir, tuz ve kimyonu ekle, 5 dakika daha kaynat.", dk: 5 },
      { t: "Kalan tereyağını eritip pul biberi kızdır, çorbanın üzerine gezdir. Limonla servis et." }
    ]
  },
  {
    id: "menemen", name: "Menemen", emoji: "🍳", cat: "Kahvaltı", time: 20, servings: 2,
    ingredients: ["3 adet yumurta", "3 adet domates", "2 adet sivri biber", "1 adet soğan (isteğe bağlı)", "2 yemek kaşığı zeytinyağı", "1 çay kaşığı tuz", "1 çay kaşığı pul biber"],
    steps: [
      { t: "Biberleri ince doğra, domatesleri rendele ya da küp küp doğra." },
      { t: "Zeytinyağını tavada ısıt, (soğanı ve) biberleri yumuşayana kadar kavur.", dk: 4 },
      { t: "Domatesi ekle, suyunu çekene kadar pişir.", dk: 6 },
      { t: "Yumurtaları kır, tuz ve pul biberi ekle, hafifçe karıştırarak kıvam alana kadar pişir.", dk: 2 },
      { t: "Sıcak sıcak ekmekle servis et." }
    ]
  },
  {
    id: "kuru-fasulye", name: "Kuru Fasulye", emoji: "🫘", cat: "Ana Yemek", time: 90, servings: 4,
    ingredients: ["2 su bardağı kuru fasulye", "1 adet soğan", "2 yemek kaşığı salça", "3 yemek kaşığı sıvı yağ", "200 g kuşbaşı et (isteğe bağlı)", "5 su bardağı sıcak su", "1 tatlı kaşığı tuz", "1 çay kaşığı pul biber"],
    steps: [
      { t: "Fasulyeleri bir gece önceden suda beklet, ertesi gün süzüp yıka." },
      { t: "Fasulyeleri bol suda 10 dakika haşla ve süz.", dk: 10 },
      { t: "Yağda soğanı (ve eti) kavur, salçayı ekleyip 1-2 dakika kavur.", dk: 5 },
      { t: "Fasulyeleri ve sıcak suyu ekle. Kısık ateşte yumuşayana kadar pişir.", dk: 60 },
      { t: "Tuz ve pul biberi ekle, 10 dakika daha pişir. Pilavla servis et.", dk: 10 }
    ]
  },
  {
    id: "karniyarik", name: "Karnıyarık", emoji: "🍆", cat: "Ana Yemek", time: 60, servings: 4,
    ingredients: ["4 adet patlıcan", "250 g kıyma", "1 adet soğan", "2 adet domates", "2 adet sivri biber", "2 diş sarımsak", "1 yemek kaşığı salça", "1 su bardağı sıcak su", "Kızartmak için sıvı yağ", "1 çay kaşığı tuz", "1 çay kaşığı karabiber"],
    steps: [
      { t: "Patlıcanları alacalı soy, tuzlu suda 20 dakika beklet, kurula.", dk: 20 },
      { t: "Patlıcanları kızgın yağda her tarafı yumuşayana kadar kızart, kağıt havluya al." },
      { t: "Soğanı kavur, kıymayı ekleyip suyunu çekene kadar pişir. Sarımsak, biber, 1 domates, tuz ve karabiberi ekle.", dk: 8 },
      { t: "Patlıcanları fırın kabına diz, ortalarını yarıp iç harcı doldur, üstüne domates ve biber dilimi koy." },
      { t: "Salçayı sıcak suyla açıp kaba dök. 180°C fırında pişir.", dk: 25 }
    ]
  },
  {
    id: "tavuk-sote", name: "Tavuk Sote", emoji: "🍗", cat: "Ana Yemek", time: 30, servings: 3,
    ingredients: ["500 g tavuk göğsü", "1 adet soğan", "2 adet sivri biber", "1 adet kırmızı biber", "2 adet domates", "1 yemek kaşığı salça", "2 yemek kaşığı sıvı yağ", "1 çay kaşığı tuz", "1 çay kaşığı kekik"],
    steps: [
      { t: "Tavuğu kuşbaşı doğra, sebzeleri doğra." },
      { t: "Tavukları yüksek ateşte suyunu salıp çekene kadar sotele.", dk: 8 },
      { t: "Soğan ve biberleri ekle, yumuşayana kadar pişir.", dk: 5 },
      { t: "Salça ve domatesi ekle, kısık ateşte pişir. Tuz ve kekiği ekleyip ocaktan al.", dk: 10 }
    ]
  },
  {
    id: "pirinc-pilavi", name: "Pirinç Pilavı", emoji: "🍚", cat: "Ana Yemek", time: 30, servings: 4,
    ingredients: ["2 su bardağı pirinç", "3 su bardağı sıcak su", "2 yemek kaşığı tereyağı", "1 yemek kaşığı sıvı yağ", "1 çay kaşığı tuz", "2 yemek kaşığı arpa şehriye (isteğe bağlı)"],
    steps: [
      { t: "Pirinci ılık tuzlu suda 20 dakika beklet, nişastası gidene kadar yıka.", dk: 20 },
      { t: "Yağları erit, (şehriyeyi kızart,) pirinci ekleyip şeffaflaşana kadar kavur.", dk: 4 },
      { t: "Sıcak su ve tuzu ekle, kaynayınca kısık ateşte suyunu çekene kadar pişir.", dk: 15 },
      { t: "Ocaktan al, kapağın altına kağıt havlu koyup demlendir.", dk: 10 }
    ]
  },
  {
    id: "coban-salatasi", name: "Çoban Salatası", emoji: "🥗", cat: "Salata", time: 10, servings: 4,
    ingredients: ["3 adet domates", "2 adet salatalık", "2 adet sivri biber", "1 adet soğan", "Yarım demet maydanoz", "3 yemek kaşığı zeytinyağı", "1 adet limon", "1 çay kaşığı tuz"],
    steps: [
      { t: "Domates, salatalık ve biberi küçük küp doğra." },
      { t: "Soğanı ince doğra, tuzla ovup yıka. Maydanozu kıy." },
      { t: "Hepsini karıştır, zeytinyağı, limon suyu ve tuzla tatlandır." }
    ]
  },
  {
    id: "kisir", name: "Kısır", emoji: "🌿", cat: "Salata", time: 30, servings: 6,
    ingredients: ["2 su bardağı ince bulgur", "1.5 su bardağı sıcak su", "1 yemek kaşığı domates salçası", "1 yemek kaşığı biber salçası", "4 adet taze soğan", "1 demet maydanoz", "Yarım demet nane", "4 yemek kaşığı zeytinyağı", "2 yemek kaşığı nar ekşisi", "1 adet limon", "1 tatlı kaşığı tuz", "1 tatlı kaşığı pul biber"],
    steps: [
      { t: "Bulgurun üzerine sıcak suyu dök, kapağını kapatıp demlendir.", dk: 15 },
      { t: "Salçaları ve zeytinyağını ekleyip iyice yoğur." },
      { t: "Yeşillikleri ince kıyıp ekle." },
      { t: "Nar ekşisi, limon, tuz ve pul biberle tatlandır. Marul yaprağıyla servis et." }
    ]
  },
  {
    id: "sutlac", name: "Fırın Sütlaç", emoji: "🍮", cat: "Tatlı", time: 60, servings: 6,
    ingredients: ["1 litre süt", "0.5 su bardağı pirinç", "1 su bardağı su", "1 su bardağı şeker", "2 yemek kaşığı pirinç unu", "1 paket vanilin", "Üzeri için tarçın"],
    steps: [
      { t: "Pirinci suyla, suyunu çekene kadar haşla.", dk: 12 },
      { t: "Sütü ekle, kaynayınca kısık ateşte pişir.", dk: 15 },
      { t: "Pirinç ununu biraz sütle aç, şekerle birlikte ekle, koyulaşana kadar karıştır.", dk: 5 },
      { t: "Vanilini ekle, kaselere paylaştır. Fırın tepsisine su doldurup kaseleri diz." },
      { t: "Fırının üst ızgarasında üstleri kızarana kadar pişir.", dk: 15 },
      { t: "Soğut, buzdolabında beklet, tarçınla servis et." }
    ]
  },
  {
    id: "revani", name: "Revani", emoji: "🍰", cat: "Tatlı", time: 60, servings: 8,
    ingredients: ["3 adet yumurta", "1 su bardağı şeker", "1 su bardağı yoğurt", "0.5 su bardağı sıvı yağ", "1 su bardağı irmik", "1 su bardağı un", "1 paket kabartma tozu", "1 adet limon kabuğu rendesi", "Şerbet için: 3 su bardağı şeker", "Şerbet için: 3.5 su bardağı su"],
    steps: [
      { t: "Şerbet için şeker ve suyu kaynat, 10 dakika pişirip soğumaya bırak.", dk: 10 },
      { t: "Yumurta ve şekeri köpürene kadar çırp. Yoğurt ve yağı ekle." },
      { t: "İrmik, un, kabartma tozu ve limon kabuğunu ekleyip karıştır." },
      { t: "Yağlanmış tepsiye dök, 180°C fırında pişir.", dk: 30 },
      { t: "Sıcak revaniyi dilimle, soğuk şerbeti dök. Şerbetini çekene kadar beklet.", dk: 30 }
    ]
  },
  {
    id: "pankek", name: "Pankek", emoji: "🥞", cat: "Kahvaltı", time: 20, servings: 3,
    ingredients: ["2 adet yumurta", "1 su bardağı süt", "1.5 su bardağı un", "2 yemek kaşığı şeker", "2 yemek kaşığı sıvı yağ", "1 paket kabartma tozu", "1 tutam tuz"],
    steps: [
      { t: "Yumurta, süt, şeker ve yağı çırp." },
      { t: "Un, kabartma tozu ve tuzu ekleyip pürüzsüz olana kadar karıştır." },
      { t: "Yapışmaz tavayı ısıt, bir kepçe hamur dök. Üstü delik delik olunca çevir.", dk: 2 },
      { t: "Bal, reçel ya da meyveyle servis et." }
    ]
  },
  {
    id: "ezogelin", name: "Ezogelin Çorbası", emoji: "🍲", cat: "Çorba", time: 45, servings: 5,
    ingredients: ["1 su bardağı kırmızı mercimek", "2 yemek kaşığı pirinç", "2 yemek kaşığı ince bulgur", "1 adet soğan", "1 yemek kaşığı salça", "2 yemek kaşığı tereyağı", "7 su bardağı sıcak su", "1 tatlı kaşığı nane", "1 tatlı kaşığı pul biber", "1 tatlı kaşığı tuz"],
    steps: [
      { t: "Mercimek, pirinç ve bulguru yıka." },
      { t: "Tereyağında soğanı kavur, salçayı ekleyip kavur.", dk: 4 },
      { t: "Bakliyatı ve sıcak suyu ekle, kısık ateşte pişir.", dk: 30 },
      { t: "Nane, pul biber ve tuzu ekle, 5 dakika daha pişir.", dk: 5 }
    ]
  }
];

const CATEGORIES = ["Çorba", "Ana Yemek", "Kahvaltı", "Salata", "Tatlı", "Diğer"];
