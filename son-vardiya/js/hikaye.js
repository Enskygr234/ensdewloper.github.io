// Son Vardiya'nın bütün hikâyesi. Her gece, oyun motorunun (O) küçük yardımcılarıyla yazılmış bir akış.
// O.hedef(metin, nokta)   -> ekrandaki görev + pusula
// O.etkiles(nokta, etiket)-> oyuncu oraya gidip dokununca biter
// O.telsiz([...])         -> yürürken akan telsiz konuşması
// O.konus([...], secimler)-> durdurup konuşturur, seçilen şıkkın sırasını döndürür

export const HATIRALAR = {
  plak:   { ad: 'Plak', ikon: '💿', tur: 'HATIRA · 1/5', baslik: 'Elle yazılmış plak',
    metin: 'Plağın ortasındaki etikete tükenmez kalemle yazılmış: “Defne’ye, yedinci yaşına. Kırtasiyeden değil plakçıdan aldım ki her dinlediğinde dans et. — N.A., 12 Mart 1996”' },
  bere:   { ad: 'Kırmızı bere', ikon: '🧶', tur: 'HATIRA · 2/5', baslik: 'Çocuk beresi',
    metin: 'Küçük, kırmızı, örgü bir bere. Kenarları kararmış, hafif is kokuyor. İçindeki kumaş etikete annesinin el yazısıyla “D.Y.” yazılmış.' },
  bilet:  { ad: 'Sinema bileti', ikon: '🎟️', tur: 'HATIRA · 3/5', baslik: 'Masal Ormanı · Koltuk 7',
    metin: 'YILDIZ SİNEMASI · 14 Nisan 1996 · 19.00 seansı · Sıra D, koltuk 7. Arkasında yamuk harflerle: “Annem kuyumcuda. Ben filmi izliyorum. Nevzat amca bakıyor.”' },
  resim:  { ad: 'Çocuk resmi', ikon: '🖍️', tur: 'HATIRA · 4/5', baslik: 'Nevzat Amca ve Ben',
    metin: 'Mum boyayla çizilmiş: kasketli, lacivert giyimli uzun bir adam, elinde sarı bir fener. Yanında kırmızı bereli küçük bir kız. Köşede: “DEFNE 7 YAŞ”. Oyuncakçı Tuna Bey resmi otuz yıl duvarından indirmemiş.' },
  defter: { ad: 'Nöbet defteri', ikon: '📓', tur: 'HATIRA · 5/5', baslik: 'Nöbet defteri, 1996',
    metin: '“14 Nisan 1996, 19.40. Sinemanın makine dairesinde duman. Salon boşaltıldı. Kuyumcunun önünde bir anne kızını arıyor: kırmızı bere, yedi yaşında, adı Defne. Salonda kimse kalmadı dediler ama ben bir daha bakmaya…” Sayfanın gerisi yanık.' },
};

const N = 'NEVZAT', A = 'ANONS';

// ------------------------------------------------------------------ 1. GECE
async function gece1(O) {
  await O.gece(1, 'DEVİR', '23:00');
  O.anlati('Yıldız Çarşısı’ndaki ilk gecen. Binanın yıkılmasına beş gün var.');
  O.hedef('Masadaki notu oku', 'not');
  await O.etkiles('not', 'Notu oku');
  await O.incele('NOT', 'Hoş geldin evlat',
    'Fenerle telsiz dolabın üstünde, şarjda. Telsizi açık tut, ben ararım. Tur defteri masada; sabah imzalarsın. Kartını kontrol noktalarına okut: ana giriş, atrium, yemek katı. Sinemaya girme, orası 96’dan beri kapalı. — Nevzat');
  O.hedef('Fenerle telsizi al', 'ekipman');
  await O.etkiles('ekipman', 'Fener ve telsizi al');
  O.fenerVer();
  O.ipucu(O.dokunmatik ? 'Feneri 🔦 düğmesiyle aç ya da kapat.' : 'Feneri F ile aç ya da kapat. Yürümek için WASD, koşmak için Shift.');
  await O.bekle(2.5);
  await O.telsiz([[N, 'Alo, alo. Yeni bekçi, duyuyor musun? Ben Nevzat.'], [N, 'Otuz yıl bu çarşının gecesini ben tuttum. Son beş geceyi seninle tutacağız.']]);
  const s = await O.konus([], ['Duyuyorum Nevzat Abi.', 'Sen neredesin?', 'Beş gece… pek heyecanlı değilim.']);
  if (s === 0) { O.durum.samimiyet++; await O.telsiz([[N, 'Aferin. Sesin de tanıdık geliyor bir yerden. Neyse.']]); }
  if (s === 1) await O.telsiz([[N, 'Otoparkın kulübesindeyim. Dizim tutmuyor, tura çıkamıyorum. Gözüm kulağım sensin.']]);
  if (s === 2) await O.telsiz([[N, 'Heh. Ben de ilk gece öyleydim. Sonra otuz yıl geçti.']]);
  O.telsiz([[N, 'Önce ana kapıdaki okuyucu. Koridor boyunca batıya yürü, sonuna kadar.']]);

  O.hedef('Ana girişteki kontrol noktasına kartını okut', 'k_giris');
  await O.etkiles('k_giris', 'Kartını okut'); O.okut('k_giris'); O.saat('23:40');
  await O.telsiz([[N, 'Kapı zincirli mi? İyi. Kimse girmesin, kimse çıkmasın. Sabaha kadar burası bizim.']]);

  O.hedef('Atriumdaki kontrol noktasına kartını okut', 'k_atrium');
  await O.etkiles('k_atrium', 'Kartını okut'); O.okut('k_atrium'); O.saat('00:25');
  await O.telsiz([[N, 'Havuzun suyu 2009’da kesildi. Çocuklar bozuk para atardı. Bazen hâlâ şıngırtısını duyarım.']]);
  await O.bekle(1.5);
  O.sesBaslat('plak', 'pikap');
  await O.bekle(2.5);
  await O.telsiz([[N, '…Bu ne? Müzik mi? Plakçıdan geliyor galiba.'], [N, 'O dükkân aylardır boş. Git bir bak, kapat şunu.']]);

  O.hedef('Plak Dünyası’ndaki pikabı kapat', 'pikap');
  await O.etkiles('pikap', 'Pikabı kapat'); O.sesDurdur('plak'); O.saat('01:10');
  await O.hatira('plak');
  await O.telsiz([[N, 'Sustu mu? …İyi. Buranın elektriği bazen kendi kafasına göre çalışır. Takma.']]);
  const s2 = await O.konus([], ['Plakta senin adın yazıyor Nevzat Abi.', 'Defne kim?', 'Bir şey demeyeyim.']);
  if (s2 === 0) await O.telsiz([[N, 'Benim adım mı? N.A. çok kişi olur evlat. Nuri Altın mesela, saatçi.']]);
  if (s2 === 1) await O.telsiz([[N, '…Bilmem. Çok çocuk geçti bu çarşıdan.']]);
  if (s2 === 2) await O.telsiz([[N, 'Doğru. Gece bekçisi her şeyi söylemez.']]);

  O.hedef('Yemek katındaki kontrol noktasına kartını okut', 'k_yemek');
  await O.etkiles('k_yemek', 'Kartını okut'); O.okut('k_yemek'); O.saat('02:30');
  await O.telsiz([[N, 'Simitçinin önünde bir dur. Kokusu geliyor mu? …Gelmez tabii. Kapanalı iki ay oldu.'], [N, 'Tur tamam. Ofise dön, defteri imzala.']]);

  O.hedef('Ofise dön, vardiya defterini imzala', 'defter');
  const iz = O.bolge('korDogu').then(async () => { O.sesler.uzakAdim(O.arkamda(9), 6, .6); await O.bekle(2.5); O.anlati('Arkanda bir ayak sesi mi vardı?'); });
  await O.etkiles('defter', 'Defteri imzala');
  await O.geceBitir('06:00');
}

// ------------------------------------------------------------------ 2. GECE
async function gece2(O) {
  await O.gece(2, 'KARANLIK', '23:00');
  O.manken('dagin');
  await O.bekle(1.5);
  await O.telsiz([[N, 'İyi akşamlar evlat. Elektrik şirketi bu gece sayaçları sökecekmiş. Işıklar gidebilir.'], [N, 'Teknik oda doğu koridorunda, fotoğrafçının yanında. Aklında olsun.']]);
  O.hedef('Doğu koridorundaki kontrol noktasına kartını okut', 'k_dogu');
  await O.etkiles('k_dogu', 'Kartını okut'); O.okut('k_dogu'); O.saat('23:35');
  await O.bekle(1);
  O.elektrik(false); O.sesler.korku(.6);
  await O.bekle(1.5);
  await O.telsiz([[N, 'Gitti mi? Gitti. Korkma, fenerin var.'], [N, 'Teknik odaya gir, sigortaları kaldır. Soldan sağa: bir, iki, üç.']]);
  O.hedef('Teknik odadaki sigortaları kaldır (0/3)', 'sigorta');
  for (let i = 0; i < 3; i++) {
    await O.etkiles('sigorta', `${i + 1}. sigortayı kaldır`);
    O.sigorta(i);
    O.hedef(`Teknik odadaki sigortaları kaldır (${i + 1}/3)`, i < 2 ? 'sigorta' : null);
    if (i === 1) { O.titret(1.2); await O.bekle(.6); }
  }
  await O.bekle(.8);
  O.elektrik(true); O.saat('00:50');
  await O.bekle(2);
  O.manken('kapiya');
  O.sesler.anons(); await O.bekle(2.2);
  await O.telsiz([[A, 'Sayın ziyaretçilerimiz… kırmızı bereli, yedi yaşındaki küçük kızımız Defne annesini danışmada bekliyor…'], [A, '…annesini danışmada bekliyor… danışmada… bekliyor…']], 'anons');
  await O.telsiz([[N, '…Anonsu kim açtı? O kayıt… o kayıt çok eski.']]);
  const s = await O.konus([], ['Defne kim, Nevzat Abi?', 'Danışmaya bakıyorum.', 'Bu bir şaka mı?']);
  if (s === 0) await O.telsiz([[N, 'Kayıp çocuk anonsları hep böyledir. Biri aranır, sonra bulunur. Bulunur.']]);
  if (s === 1) { O.durum.samimiyet++; await O.telsiz([[N, 'İyi. Danışma atriumda, havuzun yanında.']]); }
  if (s === 2) await O.telsiz([[N, 'Bu çarşıda kimse şaka yapmaz evlat. Artık yapmaz.']]);

  O.hedef('Atriumdaki danışmayı kontrol et', 'danisma');
  await O.etkiles('danisma', 'Danışmaya bak'); O.saat('01:30');
  await O.incele('DANIŞMA', 'Anons cihazı', 'Tezgâhın altında eski bir kasetli anons cihazı. İçinde kaset yok. Fişi takılı değil. Düğmesi yine de ÇAL’da duruyor.');
  await O.telsiz([[N, 'Kamera 3’te bir şey kıpırdadı. Kuzey Giyim. Bir bak ama acele etme.']]);

  O.hedef('Kuzey Giyim’i kontrol et', 'giyim');
  const bere = O.etkiles('bere', 'Çocuk mankenin beresine bak', { istege: true }).then(() => O.hatira('bere'));
  await O.bolge('giyim');
  O.sesler.korku(1); O.titret(.8);
  O.anlati('Mankenlerin hepsi kapıya dönmüş. Az önce böyle değillerdi, değil mi?');
  await O.bekle(3.5);
  await O.telsiz([[N, 'Ne gördün? …Mankenler mi? Temizlikçiler oynatmıştır. Sabahları hep yerleri değişir.'], [N, 'Tur tamam sayılır. Gel, defteri imzala.']]);
  O.durum.ipucuBere || (O.ipucu('Küçük mankenin başında kırmızı bir bere var.'), O.durum.ipucuBere = 1);
  O.hedef('Ofise dön, vardiya defterini imzala', 'defter');
  O.bolge('korBati').then(() => { O.manken('koridor'); });
  O.bolge('atrium').then(() => { O.titret(2.5); });
  await O.etkiles('defter', 'Defteri imzala');
  O.etkilesKapat('bere');
  await O.geceBitir('06:00');
}

// ------------------------------------------------------------------ 3. GECE
async function gece3(O) {
  await O.gece(3, 'GÖSTERİM', '23:00');
  O.manken('kapiya');
  O.kamera4(true);
  await O.bekle(1.2);
  await O.telsiz([[N, 'Evlat… masadaki ekranlara bak. Kamera 4. Sinema.'], [N, 'Perdede ışık var. Projektör dönüyor.']]);
  const s = await O.konus([], ['Sinemaya girme demiştin.', 'Gidip kapatırım.', 'O sinemada ne oldu?']);
  if (s === 0) await O.telsiz([[N, 'Dedim. Ama biri kapatmazsa sabaha kadar döner. Ben gidemem.']]);
  if (s === 1) { O.durum.samimiyet++; await O.telsiz([[N, 'Dikkatli ol. Koltuklar arası dardır.']]); }
  if (s === 2) await O.telsiz([[N, '…Bir yangın çıktı. Çok eskiden. Kimse ölmedi dediler. Hadi yürü.']]);

  O.hedef('Sinema koridorundaki kontrol noktasına kartını okut', 'k_sinema');
  await O.etkiles('k_sinema', 'Kartını okut'); O.okut('k_sinema'); O.saat('23:50');
  O.film(true); O.sesBaslat('projektor', 'projektor');
  O.hedef('Projektörü kapat', 'projektor');
  await O.bolge('sinema'); O.sesler.gerilim(.5);
  O.anlati('Perdede bir orman. Sonra duman.');
  await O.etkiles('projektor', 'Projektörü kapat');
  O.film(false); O.sesDurdur('projektor'); O.saat('00:40');
  await O.bekle(1.2);
  O.koltukIsigi(true);
  O.anlati('Karanlıkta, D sırasında bir koltuğun üstüne ince bir ışık düşüyor.');
  O.hedef('Işık düşen koltuğa bak', 'koltuk7');
  await O.etkiles('koltuk7', 'Koltuğa bak');
  O.koltukIsigi(false);
  await O.hatira('bilet');
  O.sesler.kapi(); O.titret(1.5); O.sesler.gerilim(1);
  await O.bekle(.6);
  O.sesler.uzakAdim({ x: 0, y: 0, z: -20 }, 10, .28, { x: 0, z: 1 });
  O.telsiz([[N, 'Çık oradan.'], [N, 'ÇIK. Hemen çık!']], 'bozuk');
  O.hedef('Sinemadan çık, atriuma koş', 'atriumGiris');
  await O.bolge('atrium');
  O.sesler.gerilim(0); O.saat('01:20');
  await O.bekle(1);
  await O.telsiz([[N, '…Kusura bakma evlat. Bağırdım. Sinema bana iyi gelmez.']]);
  O.sesBaslat('muzik', 'muzikKutusu');
  await O.bekle(2);
  await O.telsiz([[N, 'Oyuncakçının müzik kutusu bu. Tuna Bey onu hiç satmadı, vitrinde dururdu.'], [N, 'Kapağını kapat, kendi susar.']]);
  O.hedef('Oyuncakçı Tuna’daki müzik kutusunu kapat', 'muzikKutusu');
  const resim = O.etkiles('resim', 'Duvardaki resme bak', { istege: true }).then(() => O.hatira('resim'));
  await O.etkiles('muzikKutusu', 'Müzik kutusunu kapat');
  O.sesDurdur('muzik'); O.saat('02:10');
  O.durum.hatiralar.includes('resim') || O.anlati('Dükkânın yan duvarında çerçevesiz bir çocuk resmi asılı.');
  await O.bekle(2);
  O.hedef('Ofise dön, vardiya defterini imzala', 'defter');
  await O.etkiles('defter', 'Defteri imzala');
  O.etkilesKapat('resim');
  O.kamera4(false);
  await O.geceBitir('06:00');
}

// ------------------------------------------------------------------ 4. GECE
async function gece4(O) {
  await O.gece(4, 'KAYIT', '23:00');
  O.manken('kapiya');
  await O.bekle(1);
  O.sesler.telsiz(); await O.bekle(.8);
  O.anlati('Telsizden yalnızca cızırtı geliyor. Nevzat Abi hep ilk o arardı.');
  await O.bekle(3);
  O.hedef('Masadaki vardiya defterine bak', 'defter');
  await O.etkiles('defter', 'Deftere bak');
  await O.incele('VARDİYA DEFTERİ', 'Son üç gece',
    '“1. gece — Tur tamam. Yeni bekçi iyi. Sesi tanıdık.” “2. gece — Işıklar gitti, geldi. Anons çaldı.” “3. gece — Projektör kapatıldı. Koltuk 7.” Bu satırları sen yazmadın. Kalem aynı ama el yazısı değil. Altta, bastırarak yazılmış: “ARŞİV.”');
  O.hedef('Arşivdeki eski defteri bul', 'eskiDefter');
  await O.etkiles('eskiDefter', 'Eski defteri aç');
  await O.hatira('defter'); O.saat('23:50');
  O.hedef('Duvardaki gazete kupürünü oku', 'gazete');
  await O.etkiles('gazete', 'Gazeteyi oku');
  await O.incele('GECE HABER · 15 NİSAN 1996', 'Çarşıda yangın',
    'Yıldız Çarşısı’ndaki sinemada dün akşam çıkan yangında bekçi Nevzat Aksoy (52), salonda mahsur kalan yedi yaşındaki bir kız çocuğunu dumanların arasından çıkardı. Çocuk kurtuldu. Aksoy, kaldırıldığı hastanede aynı gece hayatını kaybetti.');
  O.sesler.korku(.5);
  await O.bekle(2);
  O.sesler.telsiz();
  await O.telsiz([[N, 'Buldun demek.']]);
  await O.konus([[N, 'Otopark kulübesi falan yok evlat. Otuz yıldır bu koridorlardayım.'], [N, 'O gece turumu bitiremedim. Her gece baştan başlıyorum.']]);
  const s = await O.konus([], ['Sen… öldün mü?', 'Defne’yi kurtarmışsın.', 'Neden ben?']);
  if (s === 0) await O.konus([[N, 'Gazete öyle yazıyor. Ben burada olduğumu biliyorum, o kadar.']]);
  if (s === 1) {
    const t = await O.konus([[N, 'Kurtardım mı? Dumandan sonrasını hatırlamıyorum.'], [N, 'Çıktı mı? Söyle bana. Çıktı mı?']], ['Çıktı. Gazete öyle yazıyor.', 'Bilmiyorum.']);
    if (t === 0) { O.durum.samimiyet += 2; await O.konus([[N, '…Çıktı. Otuz yıldır bunu bekliyordum galiba.']]); }
    else await O.konus([[N, 'Ben de bilmiyorum. Belki yarın öğreniriz.']]);
  }
  if (s === 2) { O.durum.samimiyet++; await O.konus([[N, 'Çünkü sen geldin. Bunca yıl kimse gelmedi. Sesin… sesin tanıdık.']]); }
  await O.konus([[N, 'Yarın son gece. Yıkımdan önce son turu birlikte atalım.'], [N, 'Bu gece kepenkleri kilitle, sonra git dinlen.']]);
  O.saat('01:30');
  O.hedef('Batı koridorunda kepenk kilidine kart okut', 'k_bati');
  O.bolge('korBati').then(() => { O.manken('koridor'); O.sesler.uzakAdim(O.arkamda(10), 5, .7); });
  await O.etkiles('k_bati', 'Kartını okut'); O.okut('k_bati'); O.sesler.kepenk(); O.saat('02:40');
  O.hedef('Doğu koridorunda kepenk kilidine kart okut', 'k_dogu');
  await O.etkiles('k_dogu', 'Kartını okut'); O.okut('k_dogu'); O.sesler.kepenk(); O.saat('03:30');
  O.hedef('Ofise dön, vardiya defterini imzala', 'defter');
  await O.etkiles('defter', 'Defteri imzala');
  await O.geceBitir('06:00');
}

// ------------------------------------------------------------------ 5. GECE
async function gece5(O) {
  await O.gece(5, 'SON VARDİYA', '23:00');
  O.duman(.4); O.sesler.gerilim(.2);
  O.hedef('Masada sana bırakılmış kartı al', 'not');
  await O.etkiles('not', 'Kartı al');
  await O.incele('PERSONEL KARTI', 'Defne Yıldırım',
    'YILDIZ ÇARŞISI — GEÇİCİ PERSONEL. Görev: gece bekçisi. Başlangıç: 15 Ekim 2026. Bu işi neden aldığını kimseye söylemedin. Belki kendine bile. Yıkılmadan önce bir kez daha görmek istedin, o kadar.');
  O.durum.kartOkundu = 1;
  await O.bekle(1);
  O.nevzat('goster');
  O.sesler.telsiz();
  await O.telsiz([[N, 'Hazır mısın? Bu sefer ben de yürüyeceğim.']]);
  O.hedef('Nevzat’ı takip et', 'nevzat');
  await O.nevzatYuru([[31, 0], [20, 0], [8, 0]]);
  await O.telsiz([[N, 'Kuyumcunun önünde bir kadın ağlıyordu. “Kızım sinemada” dedi. Kırmızı bereli.']]);
  await O.nevzatYuru([[3.8, -3.2]]);
  await O.telsiz([[N, 'Havuzdaki bozuk paraları ben toplardım. Sabah çocuklara geri dağıtırdım. Sana da vermiştim bir kere.']]);
  O.duman(.7); O.saat('03:10');
  await O.nevzatYuru([[0, -9], [0, -20], [0, -27.5], [-1, -30.2], [-6.5, -30.2]]);
  O.sesler.gerilim(.6); O.koltukIsigi(true);
  await O.bolge('sinema');
  await O.yaklas('nevzat', 4);
  O.hedef(null);
  await O.konus([[N, 'Burada buldum onu. Yedi numarada. İki eliyle kulaklarını kapatmıştı.'], [N, 'Kucaklayıp koştum. Kapıya kadar. Sonrası yok.'], [N, '…Sen. Sesin. İlk geceden beri biliyordum galiba.']]);
  const n = O.durum.hatiralar.length;
  const secenekler = n >= 4
    ? ['Benim Nevzat Amca. Ben Defne. Çıktım, senin sayende çıktım.', 'Gitme. Burada kalalım, turu birlikte atalım.', 'Sabah oldu Nevzat Abi. Vardiya bitti.']
    : ['Bilmiyorum… hatırlamıyorum. Seni tanıyor muyum?', 'Gitme. Burada kalalım, turu birlikte atalım.', 'Sabah oldu Nevzat Abi. Vardiya bitti.'];
  const s = await O.konus([], secenekler);
  O.koltukIsigi(false);

  if (s === 0 && n >= 4) {
    await O.konus([[N, 'Defne… Kırmızı bereli Defne.'], [N, 'Çıktın demek. Çıktın.'], [N, 'O zaman bu turu sen bitir. Ana kapıyı aç, sabahı içeri al.']]);
    O.nevzat('sol'); O.sabah(); O.duman(0); O.sesler.gerilim(0); O.sesler.sabah(); O.saat('05:58');
    O.hedef('Ana kapının zincirini çöz', 'anaKapi');
    await O.etkiles('anaKapi', 'Zinciri çöz');
    return O.son('devir');
  }
  if (s === 1) {
    await O.konus([[N, 'Kalırsın ha…'], [N, 'Kalırsın.']]);
    O.elektrik(false); O.sesler.korku(1); O.duman(1);
    O.nevzat('yanina');
    O.hedef('Turu birlikte at', 'k_sinema');
    await O.etkiles('k_sinema', 'Kartını okut');
    return O.son('kal');
  }
  await O.konus([[N, s === 0 ? 'Belki. Belki de hiç tanımadın. Önemli değil.' : 'Doğru. Sabah oldu.'], [N, 'Vardiya bitti.']]);
  O.nevzat('sol'); O.duman(0); O.sesler.gerilim(0); O.saat('05:50');
  O.hedef('Ofise dön, defteri son kez imzala', 'defter');
  await O.etkiles('defter', 'Defteri imzala');
  return O.son('kapanis');
}

export const GECELER = [gece1, gece2, gece3, gece4, gece5];

export const SONLAR = {
  devir: { baslik: 'DEVİR TESLİM', satirlar: [
    'Zinciri çözdün. Kapı, otuz yılın ağırlığıyla açıldı.',
    'Dışarıda yağmur dinmişti. Sokak lambaları sönüyor, gökyüzü griden maviye dönüyordu.',
    'Telsizden son bir cızırtı geldi: “Vardiya devredildi. Sağ ol, kızım.”',
    '20 Ekim sabahı Yıldız Çarşısı yıkıldı. Molozu kaldıran işçiler bir el feneri buldu.',
    'Pilleri çoktan bitmişti. Ama yanıyordu.' ] },
  kapanis: { baslik: 'KAPANIŞ', satirlar: [
    'Defteri imzaladın. Senin imzanın altında, mürekkebi hiç kurumamış gibi duran bir imza daha vardı.',
    'Sabah altıda vardiyayı teslim edecek kimse gelmedi. Kapıyı kilitleyip çıktın.',
    'Bina dört gün sonra yıkıldı. O gece neyi hatırlamadığını hiç bilemedin.',
    'Bazı geceler, gece yarısına doğru, bir telsiz cızırtısı duyar gibi oluyorsun.' ] },
  kal: { baslik: 'SON VARDİYA', satirlar: [
    'Turu birlikte attınız. Sonra bir tur daha. Sonra bir tur daha.',
    '20 Ekim sabahı iş makineleri geldi. Bekçi kulübesindeki eski telsiz kendi kendine açıldı:',
    '“Batı koridoru temiz. Atrium temiz. Sinema temiz.”',
    'İki ayrı sesle.' ] },
};
