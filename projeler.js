/* Bütün projeler tek yerde. Yeni proje eklemek için bu listeye bir kayıt ekle;
   ana sayfa ve hakkımda sayfası sayıları ve kartları buradan üretir.

   tur:    "oyun" | "telefon" | "web" | "windows"  (birden fazla olabilir)
   grup:   kartın hangi bölümde duracağı
   medya:  { video: "dosya-adi" }  -> img/video/dosya-adi.mp4 ve .jpg
           { gorsel: "url", sigdir: true }  -> görsel (sigdir: kırpmadan sığdır)
           { ikon: "url", piksel: true }    -> ortada uygulama simgesi
           { emoji: "🛷" } ya da { kod: "satır1\nsatır2" }
           renk: kapak arka planı (CSS)
   linkler: tip "oyna" | "ac" | "apk" | "indir" | "kaynak" | "diger"            */

const GH = "https://github.com/Enskygr234/";
const PAGES = "https://enskygr234.github.io/";

window.PROJELER = [
  /* ---------------- Oyunlar ---------------- */
  {
    id: "korku-modu", ad: "Korku Modu", grup: "oyun", tur: ["oyun"], yeni: true,
    ozet: "Türk efsanelerinden Minecraft korku modu. Albastı yalnızca ona bakmadığında yaklaşır; Nazar Boncuğu taşıyorsan sana dokunamaz. Gece arkandan ayak sesleri, kulağında fısıltılar.",
    teknoloji: "Java, Fabric, Minecraft 1.21.1",
    etiketler: ["Minecraft", "Fabric"], ara: "mod albastı minecraft korku",
    medya: { ikon: "img/korku-modu.png", piksel: true, renk: "radial-gradient(circle at 50% 120%, #4a1010, #0b0d0b 62%)" },
    linkler: [
      { tip: "indir", ad: "Modu indir", href: GH + "korku-modu/releases/download/son-surum/korku-modu-1.21.1.jar" },
      { tip: "diger", ad: "Kurulum", href: GH + "korku-modu#kurulum" },
      { tip: "kaynak", href: GH + "korku-modu" }
    ]
  },
  {
    id: "son-vardiya", ad: "Son Vardiya", grup: "oyun", tur: ["oyun", "telefon", "web"], yeni: true,
    ozet: "Yıkılmasına beş gün kalan bir AVM'de gece bekçisisin. Telsizdeki eski bekçinin sırrını çöz. Birinci şahıs 3D hikâye oyunu: 5 gece, 5 hatıra, 3 son.",
    teknoloji: "JavaScript, three.js · telefonda yan çevirerek oynanır",
    etiketler: ["3D", "Android"],
    medya: { video: "sonvardiya" },
    linkler: [
      { tip: "oyna", href: "son-vardiya/" },
      { tip: "apk", href: GH + "Son-Vardiya/releases/download/son-surum/SonVardiya.apk" },
      { tip: "kaynak", href: GH + "Son-Vardiya" }
    ]
  },
  {
    id: "son-tren", ad: "Son Tren", grup: "oyun", tur: ["oyun", "telefon", "web"],
    ozet: "Bir gece treninde uyanıyorsun ve hiçbir şey hatırlamıyorsun. Her durakta binen yolculara yardım et, anılarını geri topla. 3D hikâye oyunu, 3 farklı son.",
    teknoloji: "JavaScript, three.js · telefonda yan çevirerek oynanır",
    etiketler: ["3D", "Android"],
    medya: { video: "sontren" },
    linkler: [
      { tip: "oyna", href: PAGES + "Son-Tren/" },
      { tip: "apk", href: GH + "Son-Tren/releases/download/son-surum/SonTren.apk" },
      { tip: "kaynak", href: GH + "Son-Tren" }
    ]
  },
  {
    id: "mahalle", ad: "Mahalle", grup: "oyun", tur: ["oyun", "telefon", "web", "windows"],
    ozet: "1996 yazı, Akasya Sokağı. Çocukların top oynadığı arsaya müteahhit tabelası dikiliyor. Seçimli hikâye oyunu, 5 farklı son.",
    teknoloji: "JavaScript · Android ve Windows",
    etiketler: ["Android", "Windows"],
    medya: { video: "mahalle" },
    linkler: [
      { tip: "oyna", href: PAGES + "mahalle/" },
      { tip: "apk", href: GH + "mahalle/releases/latest/download/Mahalle.apk" },
      { tip: "indir", ad: "Windows", href: GH + "mahalle/releases/latest/download/Mahalle-Windows.exe" },
      { tip: "kaynak", href: GH + "mahalle" }
    ]
  },
  {
    id: "ayaz-feneri", ad: "Ayaz Ata'nın Feneri", grup: "oyun", tur: ["oyun", "telefon", "web"],
    ozet: "Bir Nardugan masalı. Karakoncolos'un çaldığı üç yıldız parçasını topla, fener yeniden yansın. 3 bölüm, hikâye sahneleri ve Karakoncolos ile kapışma.",
    teknoloji: "JavaScript · telefonda yan çevirerek oynanır",
    etiketler: ["Platform", "Android"],
    medya: { video: "feneri" },
    linkler: [
      { tip: "oyna", href: "ayaz-feneri/" },
      { tip: "apk", href: GH + "ensdewloper.github.io/releases/download/ayaz-feneri/AyazFeneri.apk" },
      { tip: "kaynak", href: GH + "ensdewloper.github.io/tree/main/ayaz-feneri" }
    ]
  },
  {
    id: "kayip-fener", ad: "Kayıp Fener", grup: "oyun", tur: ["oyun", "windows"],
    ozet: "Martı Köyü'nün feneri söndü. Ada, dedesinin fenerini alıp ormandan mağaraya, sisli limana uzanan bir yolculuğa çıkıyor. Bütün grafik ve müzikler kodla üretiliyor.",
    teknoloji: "C#, WinForms",
    etiketler: ["Windows"],
    medya: { gorsel: "https://raw.githubusercontent.com/Enskygr234/kayip-fener/HEAD/docs/title.png", emoji: "🏮", renk: "linear-gradient(160deg, #0e2a47, #2e6b9f)" },
    linkler: [
      { tip: "indir", ad: "Windows için indir", href: GH + "kayip-fener/releases/latest/download/KayipFener.exe" },
      { tip: "kaynak", href: GH + "kayip-fener" }
    ]
  },
  {
    id: "son-kis", ad: "Son Kış", grup: "oyun", tur: ["oyun", "windows"],
    ozet: "Gün üç gündür doğmuyor. Nar, koru fenerini alıp zirveye çıkıyor; yolda Karakoncolos, Şahmeran, Tepegöz ve Ayaz Ata'yla karşılaşıyor. Onları ısıtabilir ya da yakabilirsin.",
    teknoloji: "C#, .NET 8",
    etiketler: ["Windows"],
    medya: { gorsel: "https://raw.githubusercontent.com/Enskygr234/son-kis/HEAD/docs/baslik.png", emoji: "❄️", renk: "linear-gradient(160deg, #0e2a47, #2e6b9f)" },
    linkler: [
      { tip: "indir", ad: "Windows için indir", href: GH + "son-kis/releases/latest" },
      { tip: "kaynak", href: GH + "son-kis" }
    ]
  },
  {
    id: "ayazle", ad: "Ayazle", grup: "oyun", tur: ["oyun", "telefon", "web"],
    ozet: "Türkçe kelime oyunu. 4, 5 ya da 6 harfli gizli kelimeyi 6 hakta bul; bulunca kar patlar, kelimenin anlamı ve örnek cümlesi çıkar. Her gün yeni kelime ve 2 dakikalık süreli mod.",
    teknoloji: "JavaScript",
    etiketler: ["Kelime", "Android"],
    medya: { video: "ayazle" },
    linkler: [
      { tip: "oyna", href: PAGES + "ayazle/" },
      { tip: "apk", href: GH + "ayazle/releases/download/son-surum/Ayazle.apk" },
      { tip: "kaynak", href: GH + "ayazle" }
    ]
  },
  {
    id: "buz-kirici", ad: "Buz Kırıcı", grup: "oyun", tur: ["oyun", "telefon", "web"],
    ozet: "Kartopunu kızağınla sektir, buz bloklarını kır. 8 bölüm, güçlendirmeler ve ses efektleri.",
    teknoloji: "JavaScript",
    etiketler: ["Android"],
    medya: { video: "buzkirici" },
    linkler: [
      { tip: "oyna", href: PAGES + "buz-kirici/" },
      { tip: "apk", href: GH + "buz-kirici/releases/download/son-surum/BuzKirici.apk" },
      { tip: "kaynak", href: GH + "buz-kirici" }
    ]
  },
  {
    id: "kar-birlestir", ad: "Kar Birleştir", grup: "oyun", tur: ["oyun", "telefon", "web"],
    ozet: "2048 tarzı kış bulmacası: kar tanesinden kardan adama, fenere… ve en sonunda Ayaz Ata.",
    teknoloji: "JavaScript",
    etiketler: ["Bulmaca", "Android"],
    medya: { video: "karbirlestir" },
    linkler: [
      { tip: "oyna", href: PAGES + "kar-birlestir/" },
      { tip: "apk", href: GH + "kar-birlestir/releases/download/son-surum/KarBirlestir.apk" },
      { tip: "kaynak", href: GH + "kar-birlestir" }
    ]
  },
  {
    id: "kizak", ad: "Kızak", grup: "oyun", tur: ["oyun", "telefon", "web"],
    ozet: "Bitmeyen yokuş aşağı kızak oyunu. Telefonda da oynanır.",
    teknoloji: "JavaScript",
    medya: { emoji: "🛷", renk: "linear-gradient(170deg, #1b3b6f, #6aa9d8 68%, #eef7ff 68%)" },
    linkler: [
      { tip: "oyna", href: PAGES + "kizak/" },
      { tip: "kaynak", href: GH + "kizak" }
    ]
  },
  {
    id: "tarayici-oyunlari", ad: "Tarayıcı oyunları", grup: "oyun", tur: ["oyun", "web"],
    ozet: "Yılan, Pong, Tic Tac Toe, Taş Kâğıt Makas ve Eşleştirme. Hepsi tek sayfada, telefonda da oynanır.",
    teknoloji: "HTML, JavaScript",
    etiketler: ["5 oyun"],
    medya: { emoji: "🎮", renk: "linear-gradient(160deg, #0b2a2a, #127a7a)" },
    linkler: [{ tip: "oyna", href: "oyunlar.html" }]
  },

  /* ---------------- Telefon ---------------- */
  {
    id: "oyuncu-merkez", ad: "Oyuncu Merkezi", grup: "telefon", tur: ["telefon", "web"], yeni: true,
    ozet: "Steam'deki indirimler, hedef fiyata inince bildirim gönderen istek listesi ve Minecraft sunucularının açık/kapalı durumu. Aynı uygulama hem sitede hem telefonda.",
    teknoloji: "React, Vite, Capacitor",
    etiketler: ["Android", "Web"], ara: "steam minecraft indirim",
    medya: { ikon: "img/oyuncu-merkez.svg", renk: "radial-gradient(circle at 30% 20%, #3b3f8f, #12142b 70%)" },
    linkler: [
      { tip: "ac", href: PAGES + "oyuncu-merkez/" },
      { tip: "apk", href: GH + "oyuncu-merkez/releases/download/son-surum/oyuncu-merkezi.apk" },
      { tip: "kaynak", href: GH + "oyuncu-merkez" }
    ]
  },
  {
    id: "indirim-avcisi", ad: "İndirim Avcısı", grup: "telefon", tur: ["telefon"], yeni: true,
    ozet: "Güvenilir mağazalardaki indirimleri 30 dakikada bir toplar; indirim oranına ve kategoriye göre süzersin. Robots.txt kurallarına uyar.",
    teknoloji: "Kotlin, Jetpack Compose, Python",
    etiketler: ["Android"], ara: "indirim alışveriş mağaza",
    medya: { ikon: "img/indirim-avcisi.svg", renk: "radial-gradient(circle at 70% 20%, #ff8a5c, #b0301a 55%, #3a120a)" },
    linkler: [
      { tip: "apk", href: GH + "indirim-avcisi/releases/download/son-surum/indirim-avcisi.apk" },
      { tip: "kaynak", href: GH + "indirim-avcisi" }
    ]
  },
  {
    id: "winter-gym", ad: "Winter Gym", grup: "telefon", tur: ["telefon", "web"],
    ozet: "Boyunu, kilonu ve hedefini gir; kaç set, kaç tekrar, kaç kilo yapacağını söylesin. Dinlenme sayacı, otomatik ağırlık artışı ve gelişim grafikleri.",
    teknoloji: "JavaScript · Android",
    etiketler: ["Android"], ara: "spor antrenman",
    medya: { video: "wintergym" },
    linkler: [
      { tip: "ac", href: PAGES + "Winter-gym/" },
      { tip: "apk", href: GH + "Winter-gym/releases/download/son-surum/WinterGym.apk" },
      { tip: "kaynak", href: GH + "Winter-gym" }
    ]
  },
  {
    id: "winterball", ad: "Winterball", grup: "telefon", tur: ["telefon", "web"],
    ozet: "Canlı skorlar, goller, kartlar, kadrolar, istatistikler ve 14 ligin puan durumu. Favori takımın gol atınca haber verir.",
    teknoloji: "JavaScript · Android",
    etiketler: ["Android", "Futbol"], ara: "futbol maç skor",
    medya: { video: "winterball" },
    linkler: [
      { tip: "ac", href: PAGES + "Winterball/" },
      { tip: "apk", href: GH + "Winterball/releases/download/son-surum/Winterball.apk" },
      { tip: "kaynak", href: GH + "Winterball" }
    ]
  },
  {
    id: "golhaber", ad: "GolHaber", grup: "telefon", tur: ["telefon"],
    ozet: "Canlı skorlar, gol ve maç sonu bildirimleri, takımına özel transfer haberleri. Hakem düdüğü ve tribün sesleriyle.",
    teknoloji: "Kotlin · Android",
    etiketler: ["Android", "Futbol"], ara: "futbol maç skor transfer",
    medya: { video: "golhaber" },
    linkler: [
      { tip: "apk", href: GH + "golhaber/releases/latest/download/GolHaber.apk" },
      { tip: "kaynak", href: GH + "golhaber" }
    ]
  },
  {
    id: "tarifler", ad: "Yemek Tarifleri", grup: "telefon", tur: ["telefon", "web"],
    ozet: "12 hazır Türk tarifi, kişi sayısına göre malzeme hesabı, adım zamanlayıcısı ve kendi tariflerin. İnternetsiz çalışır.",
    teknoloji: "JavaScript · Android",
    etiketler: ["Android"], ara: "yemek mutfak",
    medya: { video: "tarifler" },
    linkler: [
      { tip: "ac", href: "tarifler/" },
      { tip: "apk", href: GH + "ensdewloper.github.io/releases/latest" }
    ]
  },

  /* ---------------- Web ---------------- */
  {
    id: "wintercle", ad: "Wintercle", grup: "web", tur: ["web"],
    ozet: "Kar yağışı altında sakin bir odak zamanlayıcısı: pomodoro döngüsü, ilerleme halkası, kış rüzgârı sesi.",
    teknoloji: "JavaScript", ara: "pomodoro odak zamanlayıcı",
    medya: { emoji: "⏳", renk: "radial-gradient(circle at 50% 110%, #ffd27a 0 18%, #f2a35e 30%, #3a4f86 65%, #0b1a33)" },
    linkler: [{ tip: "ac", href: PAGES + "wintercle/" }, { tip: "kaynak", href: GH + "wintercle" }]
  },
  {
    id: "buz-sifre", ad: "Buz Şifre", grup: "web", tur: ["web"],
    ozet: "Türkçe kelimelerden akılda kalan, kırılması zor şifreler üretir. Her şey tarayıcında olur, hiçbir yere gönderilmez.",
    teknoloji: "JavaScript", ara: "şifre parola",
    medya: { emoji: "🔐", renk: "linear-gradient(160deg, #1a1030, #3b2a6b)" },
    linkler: [{ tip: "ac", href: PAGES + "buz-sifre/" }, { tip: "kaynak", href: GH + "buz-sifre" }]
  },
  {
    id: "piksel-ayaz", ad: "Piksel Ayaz", grup: "web", tur: ["web"],
    ozet: "Tarayıcıda piksel sanatı: kalem, kova, ayna modu, geri al ve PNG olarak indir.",
    teknoloji: "JavaScript", ara: "çizim resim",
    medya: { emoji: "🎨", renk: "linear-gradient(160deg, #0b2a2a, #127a7a)" },
    linkler: [{ tip: "ac", ad: "Çiz", href: PAGES + "piksel-ayaz/" }, { tip: "kaynak", href: GH + "piksel-ayaz" }]
  },
  {
    id: "kar-tanesi", ad: "Kar Tanesi", grup: "web", tur: ["web"],
    ozet: "Adını yaz, sana özel bir kar tanesi üretsin. Her isim farklı bir desen.",
    teknoloji: "JavaScript",
    medya: { gorsel: "https://raw.githubusercontent.com/Enskygr234/kar-tanesi/HEAD/docs/winterdeveloper.svg", sigdir: true, emoji: "✳️", renk: "linear-gradient(160deg, #0e2a47, #2e6b9f)" },
    linkler: [{ tip: "ac", href: PAGES + "kar-tanesi/" }, { tip: "kaynak", href: GH + "kar-tanesi" }]
  },
  {
    id: "nardugan", ad: "Nardugan", grup: "web", tur: ["web"],
    ozet: "Kış gündönümüne canlı geri sayım. Anı astronomik olarak hesaplar.",
    teknoloji: "JavaScript", ara: "gündönümü sayaç",
    medya: { emoji: "🌅", renk: "radial-gradient(circle at 50% 110%, #ffd27a 0 18%, #f2a35e 30%, #3a4f86 65%, #0b1a33)" },
    linkler: [{ tip: "ac", href: PAGES + "nardugan/" }, { tip: "kaynak", href: GH + "nardugan" }]
  },
  {
    id: "kar-js", ad: "kar.js", grup: "web", tur: ["web"],
    ozet: "Web sayfana tek satırla kar yağdıran küçük, bağımlılıksız bir JavaScript kütüphanesi.",
    teknoloji: "JavaScript", ara: "kütüphane",
    medya: { kod: "<script src=\"kar.js\">\n</script>\n❄ ❄  ❄ ❄", renk: "linear-gradient(160deg, #1d1d10, #4a4515)" },
    linkler: [{ tip: "ac", ad: "Demo", href: PAGES + "kar-js/" }, { tip: "kaynak", href: GH + "kar-js" }]
  },

  /* ---------------- Windows ---------------- */
  {
    id: "buz-arsiv", ad: "Buz Arşiv", grup: "windows", tur: ["windows"],
    ozet: "Ctrl + Shift + F ile dosyanı anında bul, \"nereye kaydettim?\" zaman çizelgesine bak, yanlışlıkla sildiğini tek tıkla geri getir.",
    teknoloji: "C#, WPF", ara: "dosya arama",
    medya: { gorsel: "https://raw.githubusercontent.com/Enskygr234/buz-arsiv/HEAD/docs/arama.png", sigdir: true, emoji: "🧊", renk: "linear-gradient(160deg, #0f3a66, #1a6fb3)" },
    linkler: [{ tip: "indir", href: GH + "buz-arsiv/releases/latest" }, { tip: "kaynak", href: GH + "buz-arsiv" }]
  },
  {
    id: "ayaz-launcher", ad: "Ayaz Launcher", grup: "windows", tur: ["windows"],
    ozet: "Ctrl + Space ile açılan, 5 yuvalı, buzlu cam görünümlü hızlı başlatıcı. En sevdiğin programlar tek tuş uzağında.",
    teknoloji: "C#, WPF", ara: "başlatıcı kısayol",
    medya: { gorsel: "https://raw.githubusercontent.com/Enskygr234/Ayaz-launcher/HEAD/docs/onizleme.png", emoji: "🚀", renk: "linear-gradient(160deg, #0f3a66, #1a6fb3)" },
    linkler: [{ tip: "indir", href: GH + "Ayaz-launcher/releases/latest" }, { tip: "kaynak", href: GH + "Ayaz-launcher" }]
  },
  {
    id: "masaustu-kar", ad: "Masaüstü Kar", grup: "windows", tur: ["windows"],
    ozet: "Windows masaüstüne kar yağdırır; tıklamaları engellemez, işini yapmaya devam edersin.",
    teknoloji: "C#",
    medya: { emoji: "🖥️", renk: "linear-gradient(160deg, #0f3a66, #1a6fb3)" },
    linkler: [{ tip: "indir", href: GH + "masaustu-kar/releases/latest" }, { tip: "kaynak", href: GH + "masaustu-kar" }]
  },
  {
    id: "klavye-ayazi", ad: "Klavye Ayazı", grup: "windows", tur: ["windows"],
    ozet: "Terminalde Türkçe klavye hız testi: kelime/dakika, doğruluk ve rekorlar.",
    teknoloji: "C#", etiketler: ["Terminal"], ara: "yazma hız",
    medya: { kod: "> klavye-ayazi\nkar yağıyor çok güzel\n58 kelime/dakika ★", renk: "linear-gradient(160deg, #0a0f18, #13263d)" },
    linkler: [{ tip: "indir", href: GH + "klavye-ayazi/releases/latest" }, { tip: "kaynak", href: GH + "klavye-ayazi" }]
  },
  {
    id: "ayaz", ad: "ayaz", grup: "windows", tur: ["windows"],
    ozet: "Terminalde hava durumu ve en önemli soru: \"Kar ne zaman?\"",
    teknoloji: "C#", etiketler: ["Terminal"], ara: "hava durumu",
    medya: { kod: "> ayaz\n❄ -3°C, kar yağışlı\nKar 2 gün sonra!", renk: "linear-gradient(160deg, #0a0f18, #13263d)" },
    linkler: [{ tip: "indir", href: GH + "ayaz/releases/latest" }, { tip: "kaynak", href: GH + "ayaz" }]
  },
  {
    id: "guvenlik-kilidi", ad: "Güvenlik Kilidi", grup: "windows", tur: ["windows"],
    ozet: "PIN korumalı tam ekran kilit: hareket alarmı, telefona bildirim, saat ve hava durumu.",
    teknoloji: "C#", ara: "kilit pin alarm",
    medya: { emoji: "🔒", renk: "linear-gradient(160deg, #1a1030, #3b2a6b)" },
    linkler: [{ tip: "kaynak", href: GH + "GuvenlikKilidi" }]
  }
];

window.GRUPLAR = [
  { id: "oyun", ad: "Oyunlar", aciklama: "Hikâyeli maceralar, bulmacalar ve tarayıcıda hemen açılan küçük oyunlar." },
  { id: "telefon", ad: "Telefon uygulamaları", aciklama: "Android için APK olarak indirilebilir uygulamalar." },
  { id: "web", ad: "Web", aciklama: "Tarayıcıda açılan araçlar ve kar yağan sayfalar." },
  { id: "windows", ad: "Windows araçları", aciklama: "Masaüstü ve terminal için küçük C# programları." }
];
