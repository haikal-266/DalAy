import AsyncStorage from '@react-native-async-storage/async-storage';
import { SURAH_DATA, getRandomSurahAyah } from '../utils/surahData.js';
import { getOfflineSurah } from '../data/quran/offlineQuran.js';

const CACHE_KEY_AYAT = '@dalay_cached_ayats';
const CACHE_KEY_LAST_RANDOM = '@dalay_last_random_ayah';

// Offline fallback dataset for high reliability
export const OFFLINE_FALLBACK_AYAHS = [
  {
    surah: 1,
    ayah: 1,
    surahName: 'Al-Fatihah',
    surah_name: 'Al-Fatihah',
    surahNameArab: 'الفاتحة',
    surah_name_ar: 'الفاتحة',
    arab: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ',
    latin: 'Bismillāhir-raḥmānir-raḥīm(i).',
    translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    translation_id: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.',
    audio: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
  },
  {
    surah: 2,
    ayah: 255,
    surahName: 'Al-Baqarah',
    surah_name: 'Al-Baqarah',
    surahNameArab: 'البقرة',
    surah_name_ar: 'البقرة',
    arab: 'اللّٰهُ لَآ اِلٰهَ اِلَّا هُوَ الْحَيُّ الْقَيُّوْمُۚ لَا تَأْخُذُهٗ سِنَةٌ وَّلَا نَوْمٌۗ لَهٗ مَا فِى السَّمٰوٰتِ وَمَا فِى الْاَرْضِۗ',
    latin: 'Allāhu lā ilāha illā huwal-ḥayyul-qayyūm(u)...',
    translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence.',
    translation_id: 'Allah, tidak ada tuhan selain Dia. Yang Mahahidup, Yang terus-menerus mengurus (makhluk-Nya)...',
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
    translation: 'Say, "He is Allah, [who is] One,"',
    translation_id: 'Katakanlah (Muhammad), "Dialah Allah, Yang Maha Esa."',
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
    translation: 'For indeed, with hardship [will be] ease.',
    translation_id: 'Maka sesungguhnya bersama kesulitan ada kemudahan,',
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
    translation: 'Indeed, with hardship [will be] ease.',
    translation_id: 'sesungguhnya bersama kesulitan ada kemudahan.',
    audio: 'https://everyayah.com/data/Alafasy_128kbps/094006.mp3',
  }
];

export const getAyahAudioUrl = (surahNumber, ayahNumber) => {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
};

/**
 * Clean HTML markup into clean readable plaintext
 */
const cleanHtmlText = (html) => {
  if (!html) return '';
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Fetch a specific Ayah from API with multi-endpoint fallback & local cache
 */
export const fetchAyah = async (surahNumber, ayahNumber, lang = 'en') => {
  const surahInfo = SURAH_DATA.find((s) => s.number === Number(surahNumber)) || SURAH_DATA[0];
  const isIndo = lang === 'id';
  const sNum = Number(surahNumber);
  const aNum = Number(ayahNumber);

  // 1. Instant Offline Local Dataset Check (Complete 114 Surahs, 6,236 Ayahs)
  try {
    const offlineSurah = getOfflineSurah(sNum);
    if (offlineSurah && Array.isArray(offlineSurah.verses)) {
      const v = offlineSurah.verses.find((item) => item.number === aNum);
      if (v) {
        const formatted = {
          surah: sNum,
          ayah: aNum,
          surahName: offlineSurah.name || surahInfo.name_latin,
          surah_name: offlineSurah.name || surahInfo.name_latin,
          surahNameArab: offlineSurah.nameArab || surahInfo.name,
          surah_name_ar: offlineSurah.nameArab || surahInfo.name,
          surah_meaning: offlineSurah.translation || surahInfo.meaning,
          total_ayahs: offlineSurah.numberOfVerses || surahInfo.number_of_ayahs,
          revelation: offlineSurah.revelation || surahInfo.revelation,
          arab: v.textArab || '',
          latin: v.textLatin || '',
          translation: isIndo
            ? (v.translationId || v.translationEn)
            : (v.translationEn || v.translationId),
          translation_id: v.translationId || '',
          translation_en: v.translationEn || '',
          tafsir_wajiz: v.tafsirWajiz || '',
          audio: getAyahAudioUrl(sNum, aNum),
          _lang: lang,
          _isOffline: true,
        };

        // Cache for last random/history
        cacheAyat(formatted, lang);
        return formatted;
      }
    }
  } catch (offlineErr) {
    console.log('Offline surah read note:', offlineErr.message);
  }

  // Primary API for Indonesian: myQuran v3
  if (isIndo) {
    try {
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
          translation: (typeof data.translation === 'string' && data.translation) ||
                       (typeof data.text === 'string' && data.text) ||
                       (typeof data.text_id === 'string' && data.text_id) ||
                       (typeof data.terjemahan === 'string' && data.terjemahan) ||
                       (typeof data.id === 'string' ? data.id : ''),
          audio: data.audio || getAyahAudioUrl(surahNumber, ayahNumber),
          _lang: 'id',
        };

        await cacheAyat(formatted, lang);
        return formatted;
      }
    } catch (error) {
      console.log('myQuran API error, attempting alquran.cloud fallback:', error.message);
    }
  }

  // Global Primary API (English Sahih International / Indonesian fallback)
  try {
    const edition = isIndo ? 'id.indonesian' : 'en.sahih';
    const fallbackUrl = `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/editions/quran-uthmani,${edition},ar.alafasy`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(fallbackUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length >= 2) {
        const arabData = json.data[0];
        const transData = json.data[1];

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
          translation: transData.text || '',
          audio: getAyahAudioUrl(surahNumber, ayahNumber),
          _lang: lang,
        };

        await cacheAyat(formatted, lang);
        return formatted;
      }
    }
  } catch (err) {
    console.log('AlQuran Cloud API error, checking local cache:', err.message);
  }

  // Offline fallback: Check local cache first
  const cached = await getCachedAyat(surahNumber, ayahNumber, lang);
  if (cached) return { ...cached, _lang: lang };

  // Built-in offline fallback
  const builtin = OFFLINE_FALLBACK_AYAHS.find(
    (a) => a.surah === surahNumber && a.ayah === ayahNumber
  ) || OFFLINE_FALLBACK_AYAHS[Math.floor(Math.random() * OFFLINE_FALLBACK_AYAHS.length)];

  return {
    ...builtin,
    translation: isIndo ? (builtin.translation_id || builtin.translation) : builtin.translation,
    _lang: lang,
  };
};

/**
 * Fetch Tafsir for a specific Surah & Ayah in English or Indonesian
 */
export const fetchTafsir = async (surahNumber, ayahNumber, lang = 'en') => {
  const surahInfo = SURAH_DATA.find((s) => s.number === Number(surahNumber)) || SURAH_DATA[0];
  const isIndo = lang === 'id';
  const sNum = Number(surahNumber);
  const aNum = Number(ayahNumber);
  const cacheKey = `@dalay_tafsir_${lang}_${sNum}_${aNum}`;

  // 1. Instant Offline Tafsir Ringkas / Wajiz (Kemenag RI) Check
  try {
    const offlineSurah = getOfflineSurah(sNum);
    if (offlineSurah && Array.isArray(offlineSurah.verses)) {
      const v = offlineSurah.verses.find((item) => item.number === aNum);
      if (v && v.tafsirWajiz) {
        if (isIndo) {
          const result = {
            surah: sNum,
            ayah: aNum,
            surahName: offlineSurah.name || surahInfo.name_latin,
            surahNameAr: offlineSurah.nameArab || surahInfo.name,
            surahDesc: offlineSurah.translation || surahInfo.meaning,
            source: 'Tafsir Ringkas / Wajiz (Kemenag RI)',
            text: v.tafsirWajiz,
            _isOffline: true,
          };

          AsyncStorage.setItem(cacheKey, JSON.stringify(result)).catch(() => {});
          return result;
        }
      }
    }
  } catch (e) {}

  // 2. Check local cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  // 3. English Tafsir (Quran.com API: Ibn Kathir / Ma'arif al-Qur'an)
  if (!isIndo) {
    // Attempt 1: Tafsir Ibn Kathir (English - ID 169)
    try {
      const url = `https://api.quran.com/api/v4/tafsirs/169/by_ayah/${surahNumber}:${ayahNumber}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.tafsir && json.tafsir.text) {
          const result = {
            surah: surahNumber,
            ayah: ayahNumber,
            surahName: surahInfo.name_latin,
            surahNameAr: surahInfo.name,
            surahDesc: surahInfo.meaning,
            source: 'Tafsir Ibn Kathir (Abridged - English)',
            text: cleanHtmlText(json.tafsir.text),
          };

          try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {}

          return result;
        }
      }
    } catch (err) {
      console.log('Error fetching English Tafsir Ibn Kathir:', err.message);
    }

    // Attempt 2: Ma'arif al-Qur'an (English - ID 168)
    try {
      const url2 = `https://api.quran.com/api/v4/tafsirs/168/by_ayah/${surahNumber}:${ayahNumber}`;
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 6000);

      const res2 = await fetch(url2, { signal: controller2.signal });
      clearTimeout(timeoutId2);

      if (res2.ok) {
        const json2 = await res2.json();
        if (json2.tafsir && json2.tafsir.text) {
          const result = {
            surah: surahNumber,
            ayah: ayahNumber,
            surahName: surahInfo.name_latin,
            surahNameAr: surahInfo.name,
            surahDesc: surahInfo.meaning,
            source: "Ma'arif al-Qur'an (English Commentary)",
            text: cleanHtmlText(json2.tafsir.text),
          };

          try {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {}

          return result;
        }
      }
    } catch (err2) {
      console.log('Error fetching English Tafsir Maarif:', err2.message);
    }
  }

  // 3. Indonesian Tafsir (equran.id / myQuran v3)
  if (isIndo) {
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
      console.log('Error fetching tafsir from equran.id, trying fallback:', err.message);
    }

    // Fallback to myQuran API
    try {
      const url2 = `https://api.myquran.com/v3/quran/tafsir/${surahNumber}/${ayahNumber}`;
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 5000);

      const res2 = await fetch(url2, { signal: controller2.signal });
      clearTimeout(timeoutId2);

      if (res2.ok) {
        const json2 = await res2.json();
        const data2 = json2.data || json2;
        return {
          surah: surahNumber,
          ayah: ayahNumber,
          surahName: surahInfo.name_latin,
          surahNameAr: surahInfo.name,
          surahDesc: '',
          source: 'Kementerian Agama RI (Kemenag)',
          text: data2.tafsir || data2.text || 'Tafsir untuk ayat ini belum tersedia.',
        };
      }
    } catch (e) {
      console.log('Fallback tafsir error:', e.message);
    }
  }

  // Final Fallback: If offline or network unavailable, provide offline Tafsir Wajiz Kemenag!
  try {
    const offlineSurah = getOfflineSurah(sNum);
    if (offlineSurah && Array.isArray(offlineSurah.verses)) {
      const v = offlineSurah.verses.find((item) => item.number === aNum);
      if (v && v.tafsirWajiz) {
        return {
          surah: sNum,
          ayah: aNum,
          surahName: offlineSurah.name || surahInfo.name_latin,
          surahNameAr: offlineSurah.nameArab || surahInfo.name,
          surahDesc: offlineSurah.translation || surahInfo.meaning,
          source: 'Tafsir Ringkas / Wajiz (Kemenag RI)',
          text: v.tafsirWajiz,
          _isOffline: true,
        };
      }
    }
  } catch (e) {}

  return {
    surah: sNum,
    ayah: aNum,
    surahName: surahInfo.name_latin,
    surahNameAr: surahInfo.name,
    source: isIndo ? 'Tafsir Ringkas / Wajiz (Kemenag RI)' : 'Tafsir Ibn Kathir',
    text: isIndo
      ? 'Tafsir untuk ayat ini sedang dimuat.'
      : 'Tafsir commentary is currently loading.',
  };
};

/**
 * Fetch a random Ayah
 */
export const fetchRandomAyah = async (lang = 'id') => {
  const { surah, ayah } = getRandomSurahAyah();
  const ayahData = await fetchAyah(surah, ayah, lang);
  const taggedData = { ...ayahData, _lang: lang };
  try {
    await AsyncStorage.setItem(CACHE_KEY_LAST_RANDOM, JSON.stringify(taggedData));
  } catch (e) {}
  return taggedData;
};

/**
 * Get last viewed ayah or initial fallback
 */
export const getLastOrInitialAyah = async (lang = 'id') => {
  try {
    const saved = await AsyncStorage.getItem(CACHE_KEY_LAST_RANDOM);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed._lang === lang && parsed.translation) {
        return parsed;
      }
      if (parsed && parsed.surah && parsed.ayah) {
        return await fetchAyah(parsed.surah, parsed.ayah, lang);
      }
    }
  } catch (e) {}
  return fetchAyah(1, 1, lang);
};

const cacheAyat = async (ayah, lang = 'en') => {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_KEY_AYAT}_${lang}`);
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((a) => a.surah === ayah.surah && a.ayah === ayah.ayah);
    if (idx >= 0) {
      list[idx] = ayah;
    } else {
      list.push(ayah);
      if (list.length > 100) list.shift();
    }
    await AsyncStorage.setItem(`${CACHE_KEY_AYAT}_${lang}`, JSON.stringify(list));
  } catch (e) {}
};

const getCachedAyat = async (surahNumber, ayahNumber, lang = 'en') => {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_KEY_AYAT}_${lang}`);
    if (!raw) return null;
    const list = JSON.parse(raw);
    return list.find((a) => a.surah === surahNumber && a.ayah === ayahNumber) || null;
  } catch (e) {
    return null;
  }
};

/**
 * Get all verses of a Surah from offline dataset
 */
export const getSurahVerses = (surahNumber, lang = 'id') => {
  const offlineSurah = getOfflineSurah(surahNumber);
  if (!offlineSurah) return null;
  const isIndo = lang === 'id';
  return {
    ...offlineSurah,
    verses: (offlineSurah.verses || []).map((v) => ({
      ...v,
      translation: isIndo ? v.translationId : v.translationEn,
    })),
  };
};

export { getOfflineSurah };

export default {
  fetchAyah,
  fetchTafsir,
  fetchRandomAyah,
  getLastOrInitialAyah,
  getSurahVerses,
  getOfflineSurah,
  OFFLINE_FALLBACK_AYAHS,
};
