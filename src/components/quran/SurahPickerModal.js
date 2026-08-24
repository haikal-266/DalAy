import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoInput } from '../neo/NeoInput';
import { NeoButton } from '../neo/NeoButton';
import { NeoCard } from '../neo/NeoCard';
import { useTheme } from '../../stores/themeStore';
import { SURAH_DATA } from '../../utils/surahData';

export const SurahPickerModal = ({ visible, onClose, onSelectAyah }) => {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState(null);

  const filteredSurahs = useMemo(() => {
    if (!search.trim()) return SURAH_DATA;
    const q = search.toLowerCase();
    return SURAH_DATA.filter(
      (s) =>
        s.name_latin.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.number.toString() === q
    );
  }, [search]);

  const handleSelectSurah = (surah) => {
    setSelectedSurah(surah);
  };

  const handleSelectVerse = (ayahNumber) => {
    if (selectedSurah) {
      onSelectAyah(selectedSurah.number, ayahNumber);
      setSelectedSurah(null);
      onClose();
    }
  };

  return (
    <NeoModal
      visible={visible}
      onClose={() => {
        setSelectedSurah(null);
        onClose();
      }}
      title={selectedSurah ? `QS. ${selectedSurah.name_latin}` : 'Pilih Surah & Ayat'}
      subtitle={
        selectedSurah
          ? `Pilih ayat 1 s/d ${selectedSurah.number_of_ayahs}`
          : 'Daftar lengkap 114 Surah Al-Quran'
      }
      footer={
        selectedSurah ? (
          <NeoButton
            title="Kembali ke Daftar Surah"
            iconName="arrow-back"
            variant="secondary"
            onPress={() => setSelectedSurah(null)}
            fullWidth
          />
        ) : null
      }
    >
      {!selectedSurah ? (
        <View style={styles.container}>
          <NeoInput
            placeholder="Ketik nama surah atau nomor..."
            value={search}
            onChangeText={setSearch}
            leftIconName="search-outline"
            style={styles.searchInput}
          />

          <View style={styles.listContainer}>
            {filteredSurahs.map((surah) => (
              <NeoCard
                key={surah.number}
                variant="white"
                padding={12}
                onPress={() => handleSelectSurah(surah)}
                style={styles.surahCard}
              >
                <View style={styles.surahRow}>
                  <View
                    style={[
                      styles.surahNumberBox,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.surahNumberText,
                        { color: colors.primaryDark },
                      ]}
                    >
                      {surah.number}
                    </Text>
                  </View>

                  <View style={styles.surahMeta}>
                    <Text style={[styles.surahNameLatin, { color: colors.text }]}>
                      {surah.name_latin}
                    </Text>
                    <Text style={[styles.surahMeaning, { color: colors.textSecondary }]}>
                      {surah.meaning} • {surah.number_of_ayahs} Ayat
                    </Text>
                  </View>

                  <Text style={[styles.surahNameArab, { color: colors.primary }]}>
                    {surah.name}
                  </Text>
                </View>
              </NeoCard>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.verseGridContainer}>
          <View style={styles.verseHintRow}>
            <Ionicons name="book-outline" size={16} color={colors.primary} />
            <Text style={[styles.verseHint, { color: colors.textSecondary }]}>
              Pilih nomor ayat untuk mulai membaca:
            </Text>
          </View>
          <View style={styles.verseGrid}>
            {Array.from({ length: selectedSurah.number_of_ayahs }, (_, i) => i + 1).map(
              (ayahNum) => (
                <Pressable
                  key={ayahNum}
                  onPress={() => handleSelectVerse(ayahNum)}
                  style={({ pressed }) => [
                    styles.verseBox,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.border,
                    },
                    pressed && styles.verseBoxPressed,
                  ]}
                >
                  <Text style={[styles.verseNumText, { color: colors.text }]}>
                    {ayahNum}
                  </Text>
                </Pressable>
              )
            )}
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
  listContainer: {
    paddingTop: 2,
  },
  surahCard: {
    marginVertical: 4,
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surahNumberBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  surahNumberText: {
    fontWeight: '900',
    fontSize: 13,
  },
  surahMeta: {
    flex: 1,
  },
  surahNameLatin: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  surahMeaning: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
  },
  surahNameArab: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  verseGridContainer: {
    paddingVertical: 6,
  },
  verseHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  verseHint: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
  },
  verseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  verseBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseBoxPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  verseNumText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default SurahPickerModal;
