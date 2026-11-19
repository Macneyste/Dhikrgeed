// Bundled adhkar. Every entry stays `draft` until a qualified person reviews the
// Arabic text, the transliteration, the Somali meaning and the count.
// Do not add text from memory: see CONTRIBUTING.md.

import type { Dhikr } from './types.ts';

const PENDING = 'Sugaya dib-u-eegis';

export const ADHKAR: readonly Dhikr[] = [
  {
    id: 'subhanallah',
    label: 'SubxaanAllaah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'SubxaanAllaah',
    meaning: 'Allaah waa ka nasahan yahay ceeb kasta.',
    source: PENDING,
    reviewStatus: 'draft',
  },
  {
    id: 'alhamdulillah',
    label: 'Alxamdulillaah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alxamdulillaah',
    meaning: 'Mahad oo dhan waxaa iska leh Allaah.',
    source: PENDING,
    reviewStatus: 'draft',
  },
  {
    id: 'allahu-akbar',
    label: 'Allaahu Akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allaahu Akbar',
    meaning: 'Allaah ayaa ka weyn wax walba.',
    source: PENDING,
    reviewStatus: 'draft',
  },
  {
    id: 'astaghfirullah',
    label: 'Astaghfirullaah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullaah',
    meaning: 'Allaah ayaan dambi dhaaf weydiisanayaa.',
    source: PENDING,
    reviewStatus: 'draft',
  },
  {
    id: 'antas-salam',
    label: 'Allaahumma antas-salaam',
    arabic:
      'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    transliteration:
      'Allaahumma antas-salaam wa minkas-salaam, tabaarakta yaa dhal-jalaali wal-ikraam',
    meaning:
      'Allaahow, adiga ayaa ah Nabadda, nabaddana adiga ayay kaa timaaddaa. Waad barakaysan tahay, Haybadda iyo Sharafta Lahow.',
    source: PENDING,
    reviewStatus: 'draft',
  },
  {
    id: 'tahlil-full',
    label: 'Laa ilaaha illallaah…',
    arabic:
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      'Laa ilaaha illallaahu waxdahu laa shariika lah, lahul-mulku wa lahul-xamdu wa huwa calaa kulli shay’in qadiir',
    meaning:
      'Ilaah xaq lagu caabudo ma jiro Allaah mooyee, keligiis, shariig ma leh. Isaga ayaa leh xukunka iyo mahadda, wax walbana wuu karaa.',
    source: PENDING,
    reviewStatus: 'draft',
  },
  {
    id: 'al-ikhlas',
    label: 'Suuratul-Ikhlaas',
    arabic:
      'قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
    transliteration:
      'Qul huwallaahu axad. Allaahus-samad. Lam yalid wa lam yuulad. Wa lam yakun lahu kufuwan axad.',
    meaning:
      'Dheh: Isagu waa Allaah, Kali ah. Allaah waa Kan loo baahan yahay. Ma dhalin, lamana dhalin. Mana jiro wax la mid ah.',
    source: PENDING,
    reviewStatus: 'draft',
  },
  {
    id: 'al-falaq',
    label: 'Suuratul-Falaq',
    arabic:
      'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    transliteration:
      'Qul acuudhu birabbil-falaq. Min sharri maa khalaq. Wa min sharri ghaasiqin idhaa waqab. Wa min sharrin-naffaathaati fil-cuqad. Wa min sharri xaasidin idhaa xasad.',
    meaning:
      'Dheh: Waxaan magan u galayaa Rabbiga waaberiga, sharka wixii uu abuuray, sharka habeenka marka uu madoobaado, sharka kuwa guntimaha ku tufa, iyo sharka xaasidka marka uu xasdo.',
    source: PENDING,
    reviewStatus: 'draft',
  },
  {
    id: 'an-nas',
    label: 'Suuratun-Naas',
    arabic:
      'قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
    transliteration:
      'Qul acuudhu birabbin-naas. Malikin-naas. Ilaahin-naas. Min sharril-waswaasil-khannaas. Alladhii yuwaswisu fii suduurin-naas. Minal-jinnati wan-naas.',
    meaning:
      'Dheh: Waxaan magan u galayaa Rabbiga dadka, Boqorka dadka, Ilaaha dadka, sharka waswaasiyaha dib u dhuunta, kan ku waswaasiya laabta dadka, oo jinni iyo dad ah.',
    source: PENDING,
    reviewStatus: 'draft',
  },
  {
    id: 'bismillah-la-yadurru',
    label: 'Bismillaahil-ladhii laa yadurru',
    arabic:
      'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration:
      'Bismillaahil-ladhii laa yadurru maca ismihi shay’un fil-ardi wa laa fis-samaa’i wa huwas-samiicul-caliim',
    meaning:
      'Magaca Allaah, Kan aanay magiciisa la jirin wax dhulka iyo samada ku jira oo waxyeeli kara, Isaguna waa Maqle, Ogaal ah.',
    source: PENDING,
    reviewStatus: 'draft',
  },
  {
    id: 'subhanallahi-wa-bihamdihi',
    label: 'SubxaanAllaahi wa bixamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'SubxaanAllaahi wa bixamdihi',
    meaning: 'Allaah waa ka nasahan yahay ceeb kasta, waxaana ku ammaanayaa mahaddiisa.',
    source: PENDING,
    reviewStatus: 'draft',
  },
];
