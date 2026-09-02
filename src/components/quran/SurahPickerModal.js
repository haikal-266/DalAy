import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoInput } from '../neo/NeoInput';
import { NeoButton } from '../neo/NeoButton';
import { NeoCard } from '../neo/NeoCard';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { SURAH_DATA } from '../../utils/surahData';

const POPULAR_SURAH_NUMBERS = new Set([1, 2, 18, 36, 55, 56, 67]);
const AYAH_BATCH_SIZE = 50;

export const SurahPickerModal = ({
  visible,
  onClose,
  onSelectAyah,
  currentSurah = 1,
  currentAyah = 1,
}) => {
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'popular' | 'mekah' | 'madinah'
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [jumpAyahInput, setJumpAyahInput] = useState('');
  const [jumpError, setJumpError] = useState('');
  const [containerWidth, setContainerWidth] = useState(0);

  const numColumns = useMemo(() => {
    if (containerWidth >= 620) return 8;
    if (containerWidth >= 460) return 6;
    return 5;
  }, [containerWidth]);

  const gridGap = 8;
  const tileWidth = useMemo(() => {
    if (containerWidth <= 0) return 0;
    return Math.floor((containerWidth - (numColumns - 1) * gridGap) / numColumns);
  }, [containerWidth, numColumns]);

  // Filtered Surahs list
  const filteredSurahs = useMemo(() => {
    let list = SURAH_DATA;

    if (activeCategory === 'popular') {
      list = list.filter((s) => POPULAR_SURAH_NUMBERS.has(s.number));
    } else if (activeCategory === 'mekah') {
      list = list.filter((s) => s.type === 'mekah');
    } else if (activeCategory === 'madinah') {
      list = list.filter((s) => s.type === 'madinah');
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.name_latin.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.number.toString() === q
    );
  }, [search, activeCategory]);

  // Ayah ranges for the selected surah (e.g. 1-50, 51-100, 101-150...)
  const ayahRanges = useMemo(() => {
    if (!selectedSurah) return [];
    const total = selectedSurah.number_of_ayahs || 1;
    if (total <= 35) {
      return [];
    }

    const ranges = [];
    let start = 1;
    while (start <= total) {
      const end = Math.min(start + AYAH_BATCH_SIZE - 1, total);
      ranges.push({
        start,
        end,
        label: `${start} - ${end}`,
      });
      start = end + 1;
    }
    return ranges;
  }, [selectedSurah]);

  // Current list of ayah numbers to display based on range
  const visibleAyahs = useMemo(() => {
    if (!selectedSurah) return [];
    const total = selectedSurah.number_of_ayahs || 1;
    if (ayahRanges.length === 0) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const currentRange = ayahRanges[selectedRangeIndex] || ayahRanges[0];
    const length = currentRange.end - currentRange.start + 1;
    return Array.from({ length }, (_, i) => currentRange.start + i);
  }, [selectedSurah, ayahRanges, selectedRangeIndex]);

  const handleSelectSurah = (surah) => {
    setSelectedSurah(surah);
    setJumpAyahInput('');
    setJumpError('');

    // If opening the current surah, automatically focus on the range containing currentAyah
    if (surah.number === currentSurah && currentAyah > 0 && surah.number_of_ayahs > 35) {
      const targetRangeIdx = Math.floor((currentAyah - 1) / AYAH_BATCH_SIZE);
      setSelectedRangeIndex(Math.max(0, targetRangeIdx));
    } else {
      setSelectedRangeIndex(0);
    }
  };

  const handleSelectVerse = (ayahNumber) => {
    if (selectedSurah) {
      onSelectAyah(selectedSurah.number, ayahNumber);
      setSelectedSurah(null);
      setSearch('');
      onClose();
    }
  };

  const handleJumpToAyah = () => {
    if (!selectedSurah) return;
    const num = Number.parseInt(jumpAyahInput.trim(), 10);
    if (Number.isNaN(num) || num < 1 || num > selectedSurah.number_of_ayahs) {
      setJumpError(
        isIndonesian
          ? `Masukkan nomor 1 s/d ${selectedSurah.number_of_ayahs}`
          : `Enter number 1 to ${selectedSurah.number_of_ayahs}`
      );
      return;
    }
    handleSelectVerse(num);
  };

  const handleModalClose = () => {
    setSelectedSurah(null);
    setSearch('');
    setJumpAyahInput('');
    setJumpError('');
    onClose();
  };

  const modalTitle = selectedSurah
    ? `QS. ${selectedSurah.name_latin} (${selectedSurah.name})`
    : (isIndonesian ? 'Pilih Surah & Ayat' : 'Select Surah & Ayah');

  const modalSubtitle = selectedSurah
    ? `${selectedSurah.meaning} • ${selectedSurah.number_of_ayahs} Ayat • ${selectedSurah.type === 'mekah' ? 'Makkiyah' : 'Madaniyah'}`
    : (isIndonesian ? 'Daftar lengkap 114 Surah Al-Quran' : 'Complete 114 Quran Surahs');

  return (
    <NeoModal
      visible={visible}
      onClose={handleModalClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      footer={
        selectedSurah ? (
          <NeoButton
            title={isIndonesian ? 'Kembali ke Daftar Surah' : 'Back to Surah List'}
            iconName="arrow-back"
            variant="secondary"
            onPress={() => {
              setSelectedSurah(null);
              setJumpAyahInput('');
              setJumpError('');
            }}
            fullWidth
          />
        ) : null
      }
    >
      {!selectedSurah ? (
        /* STAGE 1: Modern Surah Explorer */
        <View style={styles.container}>
          {/* Search Bar */}
          <NeoInput
            placeholder={
              isIndonesian
                ? 'Cari nama surah, arti, atau nomor...'
                : 'Search surah name, meaning, or number...'
            }
            value={search}
            onChangeText={setSearch}
            leftIconName="search-outline"
            style={styles.searchInput}
          />

          {/* Quick Category Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {[
              { id: 'all', label: isIndonesian ? 'Semua (114)' : 'All (114)', icon: 'grid-outline' },
              { id: 'popular', label: isIndonesian ? 'Populer (7)' : 'Popular (7)', icon: 'star-outline' },
              { id: 'mekah', label: 'Makkiyah', icon: 'location-outline' },
              { id: 'madinah', label: 'Madaniyah', icon: 'business-outline' },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={13}
                    color={isActive ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: isActive ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Surah List Cards */}
          <View style={styles.listContainer}>
            {filteredSurahs.map((surah) => {
              const isCurrent = surah.number === currentSurah;
              return (
                <NeoCard
                  key={surah.number}
                  variant="white"
                  padding={12}
                  onPress={() => handleSelectSurah(surah)}
                  style={[
                    styles.surahCard,
                    isCurrent && { borderColor: colors.primary, borderWidth: 1.5 },
                  ]}
                >
                  <View style={styles.surahRow}>
                    <View
                      style={[
                        styles.surahNumberBox,
                        {
                          backgroundColor: isCurrent ? colors.primary : colors.primaryLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.surahNumberText,
                          { color: isCurrent ? '#FFFFFF' : colors.primaryDark },
                        ]}
                      >
                        {surah.number}
                      </Text>
                    </View>

                    <View style={styles.surahMeta}>
                      <View style={styles.surahTitleRow}>
                        <Text style={[styles.surahNameLatin, { color: colors.text }]}>
                          {surah.name_latin}
                        </Text>
                        {isCurrent && (
                          <View
                            style={[
                              styles.currentTag,
                              { backgroundColor: colors.primaryLight },
                            ]}
                          >
                            <Text
                              style={[
                                styles.currentTagText,
                                { color: colors.primaryDark },
                              ]}
                            >
                              Aktif
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={[styles.surahMeaning, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {surah.meaning} • {surah.number_of_ayahs} Ayat •{' '}
                        {surah.type === 'mekah' ? 'Makkiyah' : 'Madaniyah'}
                      </Text>
                    </View>

                    <Text
                      allowFontScaling={false}
                      style={[styles.surahNameArab, { color: colors.primary }]}
                    >
                      {surah.name}
                    </Text>
                  </View>
                </NeoCard>
              );
            })}
          </View>
        </View>
      ) : (
        /* STAGE 2: Clean & Modern Ayah Picker */
        <View style={styles.verseContainer}>
          {/* Quick Jump Input Section */}
          <View style={styles.jumpSection}>
            <View style={styles.jumpInputRow}>
              <View
                style={[
                  styles.jumpInputBox,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: jumpError ? colors.expense : colors.border,
                  },
                ]}
              >
                <Ionicons name="flash-outline" size={15} color={colors.primary} />
                <TextInput
                  placeholder={
                    isIndonesian
                      ? `Lompat ke ayat (1 - ${selectedSurah.number_of_ayahs})...`
                      : `Jump to ayah (1 - ${selectedSurah.number_of_ayahs})...`
                  }
                  placeholderTextColor={colors.textMuted}
                  value={jumpAyahInput}
                  onChangeText={(val) => {
                    setJumpAyahInput(val.replace(/\D/g, ''));
                    setJumpError('');
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                  onSubmitEditing={handleJumpToAyah}
                  style={[styles.jumpInputField, { color: colors.text }]}
                />
              </View>
              <Pressable
                onPress={handleJumpToAyah}
                style={({ pressed }) => [
                  styles.jumpGoBtn,
                  { backgroundColor: colors.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.jumpGoBtnText}>
                  {isIndonesian ? 'Buka' : 'Go'}
                </Text>
              </Pressable>
            </View>
            {Boolean(jumpError) && (
              <Text style={[styles.jumpErrorText, { color: colors.expense }]}>
                {jumpError}
              </Text>
            )}
          </View>

          {/* Range Navigator Pills (if surah has > 35 ayahs) */}
          {ayahRanges.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rangeTabsScroll}
            >
              {ayahRanges.map((range, idx) => {
                const isSelected = selectedRangeIndex === idx;
                return (
                  <Pressable
                    key={range.label}
                    onPress={() => setSelectedRangeIndex(idx)}
                    style={({ pressed }) => [
                      styles.rangeTab,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceLight,
                        borderColor: isSelected ? colors.primaryDark : colors.borderLight,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rangeTabText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {range.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Clean Full-Width Grid of Modern Ayah Tiles */}
          <View
            style={styles.verseGridWrapper}
            onLayout={(e) => {
              const w = Math.floor(e.nativeEvent.layout.width);
              if (w > 0 && Math.abs(w - containerWidth) > 1) {
                setContainerWidth(w);
              }
            }}
          >
            <View
              style={[
                styles.verseGrid,
                {
                  gap: gridGap,
                  justifyContent: 'flex-start',
                },
              ]}
            >
              {visibleAyahs.map((ayahNum) => {
                const isCurrent =
                  selectedSurah.number === currentSurah && ayahNum === currentAyah;

                return (
                  <Pressable
                    key={ayahNum}
                    onPress={() => handleSelectVerse(ayahNum)}
                    style={({ pressed }) => [
                      styles.verseTile,
                      tileWidth > 0 && {
                        width: tileWidth,
                        height: tileWidth > 54 ? 48 : tileWidth,
                      },
                      {
                        backgroundColor: isCurrent
                          ? colors.primary
                          : colors.surfaceLight,
                        borderColor: isCurrent ? colors.primaryDark : colors.borderLight,
                      },
                      pressed && styles.verseTilePressed,
                    ]}
                    accessibilityLabel={`Pilih Ayat ${ayahNum}`}
                  >
                    <Text
                      style={[
                        styles.verseTileNum,
                        { color: isCurrent ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {ayahNum}
                    </Text>
                    {isCurrent && (
                      <View style={styles.activeAyahDot} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
  },
  searchInput: {
    marginBottom: 8,
  },
  categoryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  listContainer: {
    paddingTop: 4,
  },
  surahCard: {
    marginVertical: 4,
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surahNumberBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  surahNumberText: {
    fontWeight: '900',
    fontSize: 13,
    includeFontPadding: false,
  },
  surahMeta: {
    flex: 1,
    minWidth: 0,
  },
  surahTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  surahNameLatin: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    includeFontPadding: false,
  },
  currentTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  currentTagText: {
    fontSize: 9,
    fontWeight: '800',
    includeFontPadding: false,
  },
  surahMeaning: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
    includeFontPadding: false,
  },
  surahNameArab: {
    fontFamily: TYPOGRAPHY.fontFamilyArabic,
    fontSize: 18,
    fontWeight: 'bold',
  },
  verseContainer: {
    paddingVertical: 2,
  },
  jumpSection: {
    marginBottom: 8,
  },
  jumpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jumpInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  jumpInputField: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 0,
    includeFontPadding: false,
  },
  jumpGoBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpGoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    includeFontPadding: false,
  },
  jumpErrorText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
    marginLeft: 4,
    includeFontPadding: false,
  },
  rangeTabsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
    paddingTop: 2,
  },
  rangeTab: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  rangeTabText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  verseGridWrapper: {
    paddingTop: 4,
    paddingBottom: 8,
    width: '100%',
  },
  verseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  verseTile: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 44,
    height: 44,
  },
  verseTilePressed: {
    opacity: 0.65,
    transform: [{ scale: 0.92 }],
  },
  verseTileNum: {
    fontSize: 14,
    fontWeight: '800',
    includeFontPadding: false,
  },
  activeAyahDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});

export default SurahPickerModal;
