/**
 * DalAy - Quran & Spiritual Type Definitions
 */

export interface SurahMeta {
  number: number;
  name: string;
  nameArabic: string;
  transliteration: string;
  translationId: string;
  translationEn: string;
  totalAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  surah: number;
  ayah: number;
  arabic: string;
  latin?: string;
  translation: string;
  audio?: string;
  tafsir?: string;
  surahName?: string;
  surahNameArabic?: string;
  totalAyahs?: number;
  _lang?: string;
}

export interface QuranSavedItem {
  id: string;
  type: 'favorite' | 'history';
  surah: number;
  ayah: number;
  surah_name?: string;
  arabic?: string;
  translation?: string;
  saved_at: string;
  extra_data?: string;
}

export interface ReadingProgress {
  lastSurah: number;
  lastAyah: number;
  lastReadDate: string;
  completedAyahsCount?: number;
}
