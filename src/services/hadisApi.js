// Service for Hadith integration using MyQuran Hadith API

export const PERAWI_LIST = [
  { name: 'Semua Perawi', slug: 'all', total: 37702 },
  { name: 'Bukhari', slug: 'bukhari', total: 6638 },
  { name: 'Muslim', slug: 'muslim', total: 4930 },
  { name: 'Tirmidzi', slug: 'tirmidzi', total: 3625 },
  { name: 'Abu Dawud', slug: 'abu-dawud', total: 4419 },
  { name: 'Nasai', slug: 'nasai', total: 5364 },
  { name: 'Ibnu Majah', slug: 'ibnu-majah', total: 4285 },
  { name: 'Ahmad', slug: 'ahmad', total: 4305 },
  { name: 'Malik', slug: 'malik', total: 1587 },
  { name: 'Darimi', slug: 'darimi', total: 2949 },
];

export const OFFLINE_FALLBACK_HADITHS = [
  {
    perawi: 'Bukhari',
    slug: 'bukhari',
    number: 1,
    arab: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    id: 'Sesungguhnya setiap amalan tergantung pada niatnya, dan setiap orang akan mendapatkan apa yang ia niatkan.',
    tema: 'Niat & Keikhlasan',
  },
  {
    perawi: 'Bukhari',
    slug: 'bukhari',
    number: 13,
    arab: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    id: 'Tidak beriman salah seorang di antara kalian sampai ia mencintai untuk saudaranya apa yang ia cintai untuk dirinya sendiri.',
    tema: 'Persaudaraan & Kasih Sayang',
  },
  {
    perawi: 'Tirmidzi',
    slug: 'tirmidzi',
    number: 1956,
    arab: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
    id: 'Senyummu di hadapan saudaramu adalah sedekah bagimu.',
    tema: 'Akhlak & Sedekah',
  },
  {
    perawi: 'Muslim',
    slug: 'muslim',
    number: 2699,
    arab: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
    id: 'Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga.',
    tema: 'Menuntut Ilmu',
  },
  {
    perawi: 'Bukhari',
    slug: 'bukhari',
    number: 6018,
    arab: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    id: 'Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata yang baik atau diam.',
    tema: 'Menjaga Lisan',
  },
  {
    perawi: 'Muslim',
    slug: 'muslim',
    number: 223,
    arab: 'الطُّهُورُ شَطْرُ الْإِيمَانِ وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ',
    id: 'Kesucian itu adalah sebagian dari iman, dan ucapan Alhamdulillah memenuhi timbangan amal kebaikan.',
    tema: 'Kebersihan & Dzikir',
  },
];

/**
 * Fetch a random Hadith from selected perawi or across all perawi
 * @param {string} perawiSlug 'all' | 'bukhari' | 'muslim' | ...
 * @returns {Promise<{success: boolean, data: object, isOfflineFallback?: boolean}>}
 */
export const fetchRandomHadith = async (perawiSlug = 'all') => {
  try {
    let chosenPerawi = perawiSlug;
    if (chosenPerawi === 'all') {
      const validPerawis = PERAWI_LIST.filter((p) => p.slug !== 'all');
      const randomIdx = Math.floor(Math.random() * validPerawis.length);
      chosenPerawi = validPerawis[randomIdx].slug;
    }

    const perawiInfo = PERAWI_LIST.find((p) => p.slug === chosenPerawi) || PERAWI_LIST[1];
    
    // Pick a random number within range (capped at 500 for high quality & quick response)
    const maxNum = Math.min(perawiInfo.total || 1000, 300);
    const randomNum = Math.floor(Math.random() * maxNum) + 1;

    const url = `https://api.myquran.com/v2/hadis/${chosenPerawi}/${randomNum}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const json = await response.json();

    if (json.status && json.data) {
      return {
        success: true,
        data: {
          perawi: perawiInfo.name,
          slug: perawiInfo.slug,
          number: json.data.number || randomNum,
          arab: json.data.arab,
          id: json.data.id,
          total: perawiInfo.total,
        },
      };
    }

    throw new Error('Format respon API tidak valid');
  } catch (error) {
    console.log('Error fetching online hadith, using fallback:', error.message);
    const fallbackIdx = Math.floor(Math.random() * OFFLINE_FALLBACK_HADITHS.length);
    const fallbackItem = OFFLINE_FALLBACK_HADITHS[fallbackIdx];
    return {
      success: true,
      isOfflineFallback: true,
      data: fallbackItem,
    };
  }
};
