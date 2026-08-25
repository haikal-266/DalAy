import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { PERAWI_LIST, fetchRandomHadith } from '../../services/hadisApi';

export const RandomHadithCard = ({ onToast }) => {
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();
  const [selectedPerawi, setSelectedPerawi] = useState('all');
  const [hadith, setHadith] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadHadith = useCallback(async (slug = selectedPerawi) => {
    setLoading(true);
    try {
      const res = await fetchRandomHadith(slug);
      if (res && res.data) {
        setHadith(res.data);
      }
    } catch (e) {
      console.log('Error in loadHadith:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedPerawi]);

  useEffect(() => {
    loadHadith('all');
  }, []);

  const handleSelectPerawi = (slug) => {
    setSelectedPerawi(slug);
    loadHadith(slug);
  };

  const handleShareHadith = async () => {
    if (!hadith) return;
    try {
      const shareText = `*Hadits Pilihan Hari Ini*\n\n"${hadith.id}"\n\n(HR. ${hadith.perawi} No. ${hadith.number})\n\nDibagikan dari aplikasi DalAy`;
      await Share.share({
        message: shareText,
        title: `Hadits HR. ${hadith.perawi}`,
      });
    } catch (e) {
      console.log('Error sharing hadith:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={15} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {isIndonesian ? 'HADITS PILIHAN & INSPIRASI' : 'DAILY HADITH & INSPIRATION'}
          </Text>
        </View>

        <Pressable
          onPress={() => loadHadith(selectedPerawi)}
          disabled={loading}
          style={({ pressed }) => [
            styles.refreshBtn,
            { backgroundColor: colors.surfaceLight, borderColor: colors.border },
            pressed && styles.btnPressed,
          ]}
          accessibilityLabel={isIndonesian ? 'Acak Hadits' : 'Shuffle Hadith'}
        >
          <Ionicons
            name="shuffle"
            size={14}
            color={colors.primary}
            style={loading ? styles.spinning : null}
          />
          <Text style={[styles.refreshBtnText, { color: colors.primary }]}>
            {isIndonesian ? 'Acak' : 'Random'}
          </Text>
        </Pressable>
      </View>

      {/* Perawi Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {PERAWI_LIST.map((p) => {
          const isSelected = selectedPerawi === p.slug;
          return (
            <Pressable
              key={p.slug}
              onPress={() => handleSelectPerawi(p.slug)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                pressed && styles.btnPressed,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#FFFFFF' : colors.text },
                ]}
              >
                {p.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Main Hadith Display Card */}
      <NeoCard variant="white" padding={16} style={styles.hadithCard}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {isIndonesian ? 'Memuat hadits pilihan...' : 'Fetching hadith...'}
            </Text>
          </View>
        ) : hadith ? (
          <View style={styles.contentContainer}>
            {/* Perawi & Number Badge */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.perawiBadge,
                  {
                    backgroundColor: colors.primaryLight,
                    borderColor: colors.primarySurface,
                  },
                ]}
              >
                <Ionicons name="book-outline" size={13} color={colors.primaryDark} />
                <Text style={[styles.perawiBadgeText, { color: colors.primaryDark }]}>
                  {`HR. ${hadith.perawi} No. ${hadith.number}`}
                </Text>
              </View>

              {hadith.tema && (
                <View
                  style={[
                    styles.themeBadge,
                    { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.themeBadgeText, { color: colors.textSecondary }]}>
                    {hadith.tema}
                  </Text>
                </View>
              )}
            </View>

            {/* Arabic Text (if available) */}
            {Boolean(hadith.arab) && (
              <Text style={[styles.arabicText, { color: colors.text }]}>
                {hadith.arab}
              </Text>
            )}

            {/* Indonesian Translation Text */}
            <View style={styles.translationWrapper}>
              <Text style={[styles.quoteMark, { color: colors.primaryLight }]}>“</Text>
              <Text style={[styles.translationText, { color: colors.textSecondary }]}>
                {hadith.id}
              </Text>
            </View>

            {/* Footer Action Buttons */}
            <View style={[styles.actionRow, { borderTopColor: colors.borderLight }]}>
              <Pressable
                onPress={() => loadHadith(selectedPerawi)}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                  pressed && styles.btnPressed,
                ]}
              >
                <Ionicons name="refresh-outline" size={15} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  {isIndonesian ? 'Hadits Lain' : 'Next Hadith'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShareHadith}
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                  pressed && styles.btnPressed,
                ]}
              >
                <Ionicons name="share-social-outline" size={15} color={colors.text} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>
                  {isIndonesian ? 'Bagikan' : 'Share'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </NeoCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipsScroll: {
    paddingBottom: 8,
    gap: 6,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hadithCard: {
    marginTop: 2,
    minHeight: 260,
    justifyContent: 'center',
  },
  loadingContainer: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '500',
  },
  contentContainer: {
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  perawiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  perawiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  themeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  arabicText: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'right',
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.arabic || 'System',
    marginTop: 2,
  },
  translationWrapper: {
    position: 'relative',
    paddingLeft: 4,
  },
  quoteMark: {
    position: 'absolute',
    left: -4,
    top: -14,
    fontSize: 34,
    fontWeight: '900',
    opacity: 0.35,
  },
  translationText: {
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: 22,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});

export default RandomHadithCard;
