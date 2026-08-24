import AsyncStorage from '@react-native-async-storage/async-storage';
import { SURAH_DATA, getRandomSurahAyah } from '../utils/surahData';

const CACHE_KEY_AYAT = '@quranku_cached_ayats';
const CACHE_KEY_LAST_RANDOM = '@quranku_last_random_ayah';

// Built-in offline fallback ayahs for guaranteed offline functionality
const OFFLINE_FALLBACK_AYAHS = [
  {
    surah: 1,
    ayah: 1,
    surahName: 'Al-Fatihah',
    surah_name: 'Al-Fatihah',
    surahNameArab: 'الفاتحة',
    surah_name_ar: 'الفاتحة',
    arab: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ',
    latin: 'Bismillāhir-raḥmānir-raḥīm(i).',
    translation: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.',
    audio: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
  },
  {
    surah: 2,
    ayah: 255,
    surahName: 'Al-Baqarah',
    surah_name: 'Al-Baqarah',
    surahNameArab: 'البقرة',
    surah_name_ar: 'البقرة',
    arab: 'اللّٰهُ لَآ اِلٰهَ اِلَّا هُوَ الْحَيُّ الْقَيُّوْمُۚ لَا تَأْخُذُهٗ سِنَةٌ وَّلَا نَوْمٌۗ لَهٗ مَا فِى السَّمٰوٰتِ وَمَا فِى الْاَرْضِۗ مَنْ ذَا الَّذِيْ يَشْفَعُ عِنْدَهٗٓ اِلَّا بِاِذْنِهٖۗ يَعْلَمُ مَا بَيْنَ اَيْدِيْهِمْ وَمَا خَلْفَهُمْۚ وَلَا يُحِيْطُوْنَ بِشَيْءٍ مِّنْ عِلْمِهٖٓ اِلَّا بِمَا شَاۤءَۚ وَسِعَ كُرْسِيُّهُ السَّمٰوٰتِ وَالْاَرْضَۚ وَلَا يَـُٔوْدُهٗ حِفْظُهُمَاۚ وَهُوَ الْعَلِيُّ الْعَظِيْمُ',
    latin: 'Allāhu lā ilāha illā huwal-ḥayyul-qayyūm(u), lā ta\'khużuhū sinatuw wa lā naum(un), lahū mā fis-samāwāti wa mā fil-arḍ(i), man żal-lażī yasyfa‘u ‘indahū illā bi\'iżnih(ī), ya‘lamu mā baina aidīhim wa mā khalfahum, wa lā yuḥīṭūna bisyai\'im min ‘ilmihī illā bimā syā\'(a), wasi‘a kursiyyuhus-samāwāti wal-arḍ(a), wa lā ya\'ūduhū ḥifẓuhumā, wa huwal-‘aliyyul-‘aẓīm(u).',
    translation: 'Allah, tidak ada tuhan selain Dia. Yang Mahahidup, Yang terus-menerus mengurus (makhluk-Nya), tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan apa yang ada di bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang ada di hadapan mereka dan apa yang ada di belakang mereka, dan mereka tidak mengetahui sesuatu apa pun tentang ilmu-Nya melainkan apa yang Dia kehendaki. Kursi-Nya (ilmu dan kekuasaan-Nya) meliputi langit dan bumi. Dan Dia tidak merasa berat memelihara keduanya, dan Dia Mahatinggi, Mahabesar.',
    audio: 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3',
  },
  {
    surah: 112,
    ayah: 1,
    surahName: 'Al-Ikhlas',
    surah_name: 'Al-Ikhlas',
    surahNameArab: 'الإخلاص',
    surah_name_ar: 'الإخلاص',
    arab: 'قُلْ هُوَ اللّٰهُ اَحَدٌۚ',
    latin: 'Qul huwallāhu aḥad(un).',
    translation: 'Katakanlah (Muhammad), "Dialah Allah, Yang Maha Esa."',
    audio: 'https://everyayah.com/data/Alafasy_128kbps/112001.mp3',
  },
  {
    surah: 94,
    ayah: 5,
    surahName: 'Asy-Syarh',
    surah_name: 'Asy-Syarh',
    surahNameArab: 'الشرح',
    surah_name_ar: 'الشرح',
    arab: 'فَاِنَّ مَعَ الْعُسْرِ يُسْرًاۙ',
    latin: 'Fa inna ma\'al-‘usri yusrā(n).',
    translation: 'Maka sesungguhnya bersama kesulitan ada kemudahan,',
    audio: 'https://everyayah.com/data/Alafasy_128kbps/094005.mp3',
  },
  {
    surah: 94,
    ayah: 6,
    surahName: 'Asy-Syarh',
    surah_name: 'Asy-Syarh',
    surahNameArab: 'الشرح',
    surah_name_ar: 'الشرح',
    arab: 'اِنَّ مَعَ الْعُسْرِ يُسْرًاۗ',
    latin: 'Inna ma\'al-‘usri yusrā(n).',
    translation: 'sesungguhnya bersama kesulitan ada kemudahan.',
    audio: 'https://everyayah.com/data/Alafasy_128kbps/094006.mp3',
  }
];

export const getAyahAudioUrl = (surahNumber, ayahNumber) => {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
};

/**
 * Fetch a specific Ayah from API with multi-endpoint fallback & local cache
 */
export const fetchAyah = async (surahNumber, ayahNumber) => {
  const surahInfo = SURAH_DATA.find((s) => s.number === surahNumber) || SURAH_DATA[0];

  try {
    // Primary API endpoint: myQuran v3
    const url = `https://api.myquran.com/v3/quran/${surahNumber}/${ayahNumber}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      const data = json.data || json;

      const formatted = {
        surah: surahNumber,
        ayah: ayahNumber,
        surahName: surahInfo.name_latin,
        surah_name: surahInfo.name_latin,
        surahNameArab: surahInfo.name,
        surah_name_ar: surahInfo.name,
        surah_meaning: surahInfo.meaning,
        total_ayahs: surahInfo.number_of_ayahs,
        revelation: surahInfo.revelation,
        arab: data.arab || data.text_arab || data.ar || '',
        latin: data.latin || data.text_latin || data.tr || '',
        translation: data.text || data.translation || data.id || data.text_id || '',
        audio: data.audio || getAyahAudioUrl(surahNumber, ayahNumber),
      };

      // Save to cache
      await cacheAyat(formatted);
      return formatted;
    }
  } catch (error) {
    console.log('Primary Quran API error, attempting fallback:', error.message);
  }

  // Secondary fallback: Quran.com / alquran.cloud API
  try {
    const fallbackUrl = `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/editions/quran-uthmani,id.indonesian,ar.alafasy`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(fallbackUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length >= 2) {
        const arabData = json.data[0];
        const indoData = json.data[1];

        const formatted = {
          surah: surahNumber,
          ayah: ayahNumber,
          surahName: surahInfo.name_latin,
          surah_name: surahInfo.name_latin,
          surahNameArab: surahInfo.name,
          surah_name_ar: surahInfo.name,
          surah_meaning: surahInfo.meaning,
          total_ayahs: surahInfo.number_of_ayahs,
          revelation: surahInfo.revelation,
          arab: arabData.text || '',
          latin: '',
          translation: indoData.text || '',
          audio: getAyahAudioUrl(surahNumber, ayahNumber),
        };

        await cacheAyat(formatted);
        return formatted;
      }
    }
  } catch (err) {
    console.log('Secondary API error, checking local cache:', err.message);
  }

  // Offline fallback: Check local cache first
  const cached = await getCachedAyat(surahNumber, ayahNumber);
  if (cached) return cached;

  // Built-in offline fallback
  const builtin = OFFLINE_FALLBACK_AYAHS.find(
    (a) => a.surah === surahNumber && a.ayah === ayahNumber
  ) || OFFLINE_FALLBACK_AYAHS[Math.floor(Math.random() * OFFLINE_FALLBACK_AYAHS.length)];

  return builtin;
};

/**
 * Fetch Tafsir for a specific Surah & Ayah (Kemenag RI)
 */
export const fetchTafsir = async (surahNumber, ayahNumber) => {
  const surahInfo = SURAH_DATA.find((s) => s.number === surahNumber) || SURAH_DATA[0];
  const cacheKey = `@quranku_tafsir_${surahNumber}_${ayahNumber}`;
  
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  try {
    const url = `https://equran.id/api/v2/tafsir/${surahNumber}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      const surahData = json.data;
      const tafsirList = surahData.tafsir || [];
      const item = tafsirList.find((t) => t.ayat === ayahNumber);

      const result = {
        surah: surahNumber,
        ayah: ayahNumber,
        surahName: surahData.namaLatin || surahInfo.name_latin,
        surahNameAr: surahData.nama || surahInfo.name,
        surahDesc: surahData.deskripsi || '',
        source: 'Kementerian Agama RI (Kemenag)',
        text: item ? item.teks : 'Tafsir untuk ayat ini belum tersedia.',
      };

      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {}

      return result;
    }
  } catch (err) {
    console.log('Error fetching tafsir from equran.id, trying fallback:', err);
  }

  // Fallback to myQuran API
  try {
    const fallbackUrl = `https://api.myquran.com/v3/quran/tafsir/${surahNumber}/${ayahNumber}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(fallbackUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      const data = json.data || json;
      const result = {
        surah: surahNumber,
        ayah: ayahNumber,
        surahName: surahInfo.name_latin,
        surahNameAr: surahInfo.name,
        surahDesc: '',
        source: 'Kementerian Agama RI (Kemenag)',
        text: data.tafsir || data.text || 'Tafsir untuk ayat ini belum tersedia.',
      };
      return result;
    }
  } catch (e) {
    console.log('Fallback tafsir error:', e);
  }

  return {
    surah: surahNumber,
    ayah: ayahNumber,
    surahName: surahInfo.name_latin,
    surahNameAr: surahInfo.name,
    source: 'Kementerian Agama RI (Kemenag)',
    text: 'Tafsir belum tersedia saat offline. Silakan hubungkan internet untuk memuat tafsir lengkap.',
  };
};

/**
 * Fetch Random Ayah
 */
export const fetchRandomAyah = async () => {
  const { surah, ayah } = getRandomSurahAyah();
  const ayahData = await fetchAyah(surah, ayah);

  // Store as last random ayah
  try {
    await AsyncStorage.setItem(CACHE_KEY_LAST_RANDOM, JSON.stringify(ayahData));
  } catch (e) {
    // ignore
  }

  return ayahData;
};

/**
 * Get Last Random Ayah or fallback to Al-Fatihah
 */
export const getLastOrInitialAyah = async () => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_LAST_RANDOM);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return OFFLINE_FALLBACK_AYAHS[0];
};

/**
 * Local cache helpers
 */
const cacheAyat = async (ayahObj) => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_AYAT);
    const list = raw ? JSON.parse(raw) : [];
    const existingIndex = list.findIndex(
      (a) => a.surah === ayahObj.surah && a.ayah === ayahObj.ayah
    );
    if (existingIndex >= 0) {
      list[existingIndex] = ayahObj;
    } else {
      list.push(ayahObj);
      if (list.length > 100) list.shift(); // Keep max 100 in cache
    }
    await AsyncStorage.setItem(CACHE_KEY_AYAT, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
};

const getCachedAyat = async (surah, ayah) => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_AYAT);
    if (!raw) return null;
    const list = JSON.parse(raw);
    return list.find((a) => a.surah === surah && a.ayah === ayah) || null;
  } catch (e) {
    return null;
  }
};

export default {
  fetchAyah,
  fetchTafsir,
  fetchRandomAyah,
  getLastOrInitialAyah,
  OFFLINE_FALLBACK_AYAHS,
};
