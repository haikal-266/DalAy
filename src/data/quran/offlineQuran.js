/**
 * Offline Quran Data Module for DalAy
 * Provides instant offline access to all 114 Surahs, 6,236 Ayahs,
 * translations (ID & EN), and Tafsir Ringkas (Wajiz) Kemenag RI.
 *
 * Uses lazy loaders so only the currently viewed surah is loaded into RAM.
 */

const SURAH_LOADERS = {
  1: () => require('./surahs/surah_1.json'),
  2: () => require('./surahs/surah_2.json'),
  3: () => require('./surahs/surah_3.json'),
  4: () => require('./surahs/surah_4.json'),
  5: () => require('./surahs/surah_5.json'),
  6: () => require('./surahs/surah_6.json'),
  7: () => require('./surahs/surah_7.json'),
  8: () => require('./surahs/surah_8.json'),
  9: () => require('./surahs/surah_9.json'),
  10: () => require('./surahs/surah_10.json'),
  11: () => require('./surahs/surah_11.json'),
  12: () => require('./surahs/surah_12.json'),
  13: () => require('./surahs/surah_13.json'),
  14: () => require('./surahs/surah_14.json'),
  15: () => require('./surahs/surah_15.json'),
  16: () => require('./surahs/surah_16.json'),
  17: () => require('./surahs/surah_17.json'),
  18: () => require('./surahs/surah_18.json'),
  19: () => require('./surahs/surah_19.json'),
  20: () => require('./surahs/surah_20.json'),
  21: () => require('./surahs/surah_21.json'),
  22: () => require('./surahs/surah_22.json'),
  23: () => require('./surahs/surah_23.json'),
  24: () => require('./surahs/surah_24.json'),
  25: () => require('./surahs/surah_25.json'),
  26: () => require('./surahs/surah_26.json'),
  27: () => require('./surahs/surah_27.json'),
  28: () => require('./surahs/surah_28.json'),
  29: () => require('./surahs/surah_29.json'),
  30: () => require('./surahs/surah_30.json'),
  31: () => require('./surahs/surah_31.json'),
  32: () => require('./surahs/surah_32.json'),
  33: () => require('./surahs/surah_33.json'),
  34: () => require('./surahs/surah_34.json'),
  35: () => require('./surahs/surah_35.json'),
  36: () => require('./surahs/surah_36.json'),
  37: () => require('./surahs/surah_37.json'),
  38: () => require('./surahs/surah_38.json'),
  39: () => require('./surahs/surah_39.json'),
  40: () => require('./surahs/surah_40.json'),
  41: () => require('./surahs/surah_41.json'),
  42: () => require('./surahs/surah_42.json'),
  43: () => require('./surahs/surah_43.json'),
  44: () => require('./surahs/surah_44.json'),
  45: () => require('./surahs/surah_45.json'),
  46: () => require('./surahs/surah_46.json'),
  47: () => require('./surahs/surah_47.json'),
  48: () => require('./surahs/surah_48.json'),
  49: () => require('./surahs/surah_49.json'),
  50: () => require('./surahs/surah_50.json'),
  51: () => require('./surahs/surah_51.json'),
  52: () => require('./surahs/surah_52.json'),
  53: () => require('./surahs/surah_53.json'),
  54: () => require('./surahs/surah_54.json'),
  55: () => require('./surahs/surah_55.json'),
  56: () => require('./surahs/surah_56.json'),
  57: () => require('./surahs/surah_57.json'),
  58: () => require('./surahs/surah_58.json'),
  59: () => require('./surahs/surah_59.json'),
  60: () => require('./surahs/surah_60.json'),
  61: () => require('./surahs/surah_61.json'),
  62: () => require('./surahs/surah_62.json'),
  63: () => require('./surahs/surah_63.json'),
  64: () => require('./surahs/surah_64.json'),
  65: () => require('./surahs/surah_65.json'),
  66: () => require('./surahs/surah_66.json'),
  67: () => require('./surahs/surah_67.json'),
  68: () => require('./surahs/surah_68.json'),
  69: () => require('./surahs/surah_69.json'),
  70: () => require('./surahs/surah_70.json'),
  71: () => require('./surahs/surah_71.json'),
  72: () => require('./surahs/surah_72.json'),
  73: () => require('./surahs/surah_73.json'),
  74: () => require('./surahs/surah_74.json'),
  75: () => require('./surahs/surah_75.json'),
  76: () => require('./surahs/surah_76.json'),
  77: () => require('./surahs/surah_77.json'),
  78: () => require('./surahs/surah_78.json'),
  79: () => require('./surahs/surah_79.json'),
  80: () => require('./surahs/surah_80.json'),
  81: () => require('./surahs/surah_81.json'),
  82: () => require('./surahs/surah_82.json'),
  83: () => require('./surahs/surah_83.json'),
  84: () => require('./surahs/surah_84.json'),
  85: () => require('./surahs/surah_85.json'),
  86: () => require('./surahs/surah_86.json'),
  87: () => require('./surahs/surah_87.json'),
  88: () => require('./surahs/surah_88.json'),
  89: () => require('./surahs/surah_89.json'),
  90: () => require('./surahs/surah_90.json'),
  91: () => require('./surahs/surah_91.json'),
  92: () => require('./surahs/surah_92.json'),
  93: () => require('./surahs/surah_93.json'),
  94: () => require('./surahs/surah_94.json'),
  95: () => require('./surahs/surah_95.json'),
  96: () => require('./surahs/surah_96.json'),
  97: () => require('./surahs/surah_97.json'),
  98: () => require('./surahs/surah_98.json'),
  99: () => require('./surahs/surah_99.json'),
  100: () => require('./surahs/surah_100.json'),
  101: () => require('./surahs/surah_101.json'),
  102: () => require('./surahs/surah_102.json'),
  103: () => require('./surahs/surah_103.json'),
  104: () => require('./surahs/surah_104.json'),
  105: () => require('./surahs/surah_105.json'),
  106: () => require('./surahs/surah_106.json'),
  107: () => require('./surahs/surah_107.json'),
  108: () => require('./surahs/surah_108.json'),
  109: () => require('./surahs/surah_109.json'),
  110: () => require('./surahs/surah_110.json'),
  111: () => require('./surahs/surah_111.json'),
  112: () => require('./surahs/surah_112.json'),
  113: () => require('./surahs/surah_113.json'),
  114: () => require('./surahs/surah_114.json'),
};

/**
 * Get offline surah data by number (1 - 114)
 * @param {number|string} surahNumber
 * @returns {object|null} Surah data with verses, translation, and tafsirWajiz
 */
export const getOfflineSurah = (surahNumber) => {
  const num = Number.parseInt(surahNumber, 10);
  if (num >= 1 && num <= 114 && typeof SURAH_LOADERS[num] === 'function') {
    try {
      return SURAH_LOADERS[num]();
    } catch (e) {
      console.log('Error loading offline surah ' + num, e);
      return null;
    }
  }
  return null;
};

/**
 * Check if offline data is available for a surah
 */
export const hasOfflineSurah = (surahNumber) => {
  const num = Number.parseInt(surahNumber, 10);
  return num >= 1 && num <= 114;
};

export default {
  getOfflineSurah,
  hasOfflineSurah,
};
