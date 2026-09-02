import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { NeoCard } from '../neo/NeoCard';
import { NeoSegmented } from '../neo/NeoSegmented';
import { useTheme } from '../../stores/themeStore';
import { formatDateIndo } from '../../utils/formatters';
import { SURAH_DATA } from '../../utils/surahData';

export const AyatHistoryModal = ({
  visible,
  onClose,
  favorites = [],
  history = [],
  onSelectAyah,
  onClearHistory,
}) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' | 'history'

  const currentList = activeTab === 'favorites' ? favorites : history;

  const handleSelect = (item) => {
    onSelectAyah(item.surah, item.ayah);
    onClose();
  };

  return (
    <NeoModal
      visible={visible}
      onClose={onClose}
      title={activeTab === 'favorites' ? 'Ayat Tersimpan' : 'Riwayat Bacaan'}
      subtitle={`${currentList.length} ayat terdaftar`}
      footer={
        activeTab === 'history' && history.length > 0 ? (
          <NeoButton
            title="Bersihkan Riwayat"
            iconName="trash-outline"
            variant="outline"
            size="sm"
            onPress={onClearHistory}
            fullWidth
          />
        ) : null
      }
    >
      <NeoSegmented
        options={[
          {
            label: `Favorit (${favorites.length})`,
            value: 'favorites',
            iconName: 'heart',
            activeColor: colors.expense,
          },
          {
            label: `Riwayat (${history.length})`,
            value: 'history',
            iconName: 'time-outline',
            activeColor: colors.primary,
          },
        ]}
        selectedValue={activeTab}
        onSelect={setActiveTab}
        style={styles.segmented}
      />

      {currentList.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: colors.surfaceLight },
            ]}
          >
            <Ionicons
              name={activeTab === 'favorites' ? 'heart-outline' : 'book-outline'}
              size={32}
              color={colors.textSubtle}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {activeTab === 'favorites'
              ? 'Belum Ada Ayat Favorit'
              : 'Belum Ada Riwayat'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {activeTab === 'favorites'
              ? 'Ketuk tombol "Simpan" pada kartu ayat untuk menandai ayat favorit Anda.'
              : 'Ayat yang Anda baca atau buka akan otomatis tercatat di sini.'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {currentList.map((item, idx) => {
            const sMeta = SURAH_DATA.find((s) => s.number === item.surah) || {};
            const sName = item.surahName || item.surah_name || sMeta.name_latin || `Surah ${item.surah}`;

            return (
              <NeoCard
                key={`${item.surah}_${item.ayah}_${idx}`}
                variant="white"
                padding={12}
                onPress={() => handleSelect(item)}
                style={styles.itemCard}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemSurahRow}>
                    <Ionicons
                      name="book"
                      size={15}
                      color={colors.primary}
                      style={styles.itemIcon}
                    />
                    <Text style={[styles.itemSurahName, { color: colors.text }]}>
                      QS. {sName} : {item.ayah}
                    </Text>
                  </View>
                  <Text style={[styles.itemDate, { color: colors.textMuted }]}>
                    {formatDateIndo(item.timestamp || item.savedAt || item.date)}
                  </Text>
                </View>

                <Text
                  allowFontScaling={false}
                  style={[styles.itemArab, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.arab}
                </Text>

                <Text style={[styles.itemTranslation, { color: colors.textSecondary }]} numberOfLines={2}>
                  "{item.translation}"
                </Text>
              </NeoCard>
            );
          })}
        </View>
      )}
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  segmented: {
    marginBottom: 10,
  },
  emptyState: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  list: {
    gap: 4,
    paddingTop: 2,
  },
  itemCard: {
    marginVertical: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemSurahRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 6,
  },
  itemSurahName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  itemDate: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemArab: {
    fontFamily: TYPOGRAPHY.fontFamilyArabic,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 4,
    fontWeight: '600',
  },
  itemTranslation: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default AyatHistoryModal;
