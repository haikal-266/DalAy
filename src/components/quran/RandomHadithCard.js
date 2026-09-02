import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Share,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useQuran } from '../../stores/quranStore';
import { useSwipeNavigation } from '../../stores/swipeNavigationStore';
import { PERAWI_LIST, fetchRandomHadith } from '../../services/hadisApi';
import { splitIntoReadableParagraphs, getOptimalLineHeight } from '../../utils/textFormatter';

export const RandomHadithCard = ({ onToast }) => {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600 || width >= 768;
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();
  const { setSwipeEnabled } = useSwipeNavigation();
  const { translationFontSize, increaseFontSize, decreaseFontSize } = useQuran();

  // Dynamic Arabic font scaling synchronized with translationFontSize
  const fontDelta = (translationFontSize || 15) - 15;
  const dynamicHadithArabicFontSize = Math.max(16, Math.min(30, Math.round(20 + fontDelta * 1.2)));
  const dynamicHadithArabicLineHeight = Math.round(dynamicHadithArabicFontSize * 1.9);
  const [selectedPerawi, setSelectedPerawi] = useState('all');
  const [hadith, setHadith] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadHadith = useCallback(async (slug = selectedPerawi) => {
    setLoading(true);
    try {
      const res = await fetchRandomHadith(slug);
      if (res?.data) {
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
      const text = `HR. ${hadith.perawi} No. ${hadith.number}\n\n${hadith.arab ? hadith.arab + '\n\n' : ''}"${hadith.id}"\n\nDibagikan melalui Aplikasi DalAy`;
      await Share.share({ message: text });
    } catch (e) {
      console.log('Error sharing hadith:', e);
    }
  };

  const hadithParagraphs = React.useMemo(() => {
    if (!hadith || !hadith.id) return [];
    return splitIntoReadableParagraphs(typeof hadith.id === 'string' ? hadith.id : String(hadith.id));
  }, [hadith?.id]);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={15} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {isIndonesian ? 'HADITS PILIHAN' : 'SELECTED HADITH'}
          </Text>
        </View>

        <Pressable
          onPress={() => loadHadith(selectedPerawi)}
          style={({ pressed }) => [
            styles.refreshBtn,
            {
              backgroundColor: colors.surfaceLight,
              borderColor: colors.border,
            },
            pressed && styles.btnPressed,
          ]}
        >
          <Ionicons name="shuffle" size={13} color={colors.primary} />
          <Text style={[styles.refreshBtnText, { color: colors.primary }]}>
            {isIndonesian ? 'Acak' : 'Random'}
          </Text>
        </Pressable>
      </View>

      {/* Perawi Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onTouchStart={() => setSwipeEnabled(false)}
        onTouchEnd={() => setSwipeEnabled(true)}
        onTouchCancel={() => setSwipeEnabled(true)}
        onScrollBeginDrag={() => setSwipeEnabled(false)}
        onMomentumScrollEnd={() => setSwipeEnabled(true)}
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
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {isIndonesian ? 'Memuat hadits pilihan...' : 'Fetching hadith...'}
            </Text>
          </View>
        )}

        {!loading && Boolean(hadith) && (
          <View style={styles.contentContainer}>
            {/* Perawi & Number Badge + Font Size Stepper */}
            <View style={styles.badgeRow}>
              <View style={styles.badgeLeftGroup}>
                <View
                  style={[
                    styles.perawiBadge,
                    {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary,
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

              {/* Font Size Adjuster Pill (Mobile Only - Centralized on Tablet Header) */}
              {!isTablet && (
                <View
                  style={[
                    styles.fontSizePill,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Pressable
                    onPress={decreaseFontSize}
                    style={({ pressed }) => [
                      styles.fontSizeBtn,
                      pressed && styles.fontSizeBtnPressed,
                    ]}
                    hitSlop={4}
                    accessibilityLabel="Kecilkan Ukuran Font Hadits"
                  >
                    <Text style={[styles.fontSizeBtnText, { color: colors.text }]}>A-</Text>
                  </Pressable>
                  <View style={[styles.fontSizeDivider, { backgroundColor: colors.borderLight }]} />
                  <Text style={[styles.fontSizeValueText, { color: colors.primary }]}>
                    {translationFontSize}
                  </Text>
                  <View style={[styles.fontSizeDivider, { backgroundColor: colors.borderLight }]} />
                  <Pressable
                    onPress={increaseFontSize}
                    style={({ pressed }) => [
                      styles.fontSizeBtn,
                      pressed && styles.fontSizeBtnPressed,
                    ]}
                    hitSlop={4}
                    accessibilityLabel="Besarkan Ukuran Font Hadits"
                  >
                    <Text style={[styles.fontSizeBtnText, { color: colors.text }]}>A+</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Arabic Text (Dynamic Font, Anti-System Scaling) */}
            {Boolean(hadith.arab) && (
              <Text
                allowFontScaling={false}
                style={[
                  styles.arabicText,
                  {
                    color: colors.text,
                    fontSize: dynamicHadithArabicFontSize,
                    lineHeight: dynamicHadithArabicLineHeight,
                  },
                ]}
              >
                {hadith.arab}
              </Text>
            )}

            {/* Indonesian Translation Text with Clear Paragraphs */}
            <View style={styles.translationWrapper}>
              <Text style={[styles.quoteMark, { color: colors.primaryLight }]}>“</Text>
              <View style={styles.hadithParagraphsContainer}>
                {hadithParagraphs.map((para, idx) => (
                  <Text
                    key={`hadith-para-${hadith?.number || 'rand'}-${idx}`}
                    style={[
                      styles.translationText,
                      {
                        color: colors.text,
                        fontSize: translationFontSize,
                        lineHeight: getOptimalLineHeight(translationFontSize),
                        marginBottom: idx === hadithParagraphs.length - 1 ? 0 : 12,
                      },
                    ]}
                  >
                    {String(para)}
                  </Text>
                ))}
              </View>
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
        )}
      </NeoCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
    minWidth: 0,
    flex: 1,
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
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    gap: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
    flexShrink: 0,
  },
  hadithCard: {
    marginTop: 2,
    minHeight: 260,
    justifyContent: 'center',
    width: '100%',
    minWidth: 0,
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
    gap: 8,
  },
  badgeLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
    minWidth: 0,
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
    includeFontPadding: false,
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
    includeFontPadding: false,
  },
  fontSizePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 1,
    flexShrink: 0,
  },
  fontSizeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeBtnPressed: {
    opacity: 0.5,
    transform: [{ scale: 0.9 }],
  },
  fontSizeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    includeFontPadding: false,
  },
  fontSizeDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 1,
  },
  fontSizeValueText: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 4,
    includeFontPadding: false,
  },
  arabicText: {
    fontFamily: TYPOGRAPHY.fontFamilyArabic,
    fontSize: 20,
    lineHeight: 40,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 8,
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
  hadithParagraphsContainer: {
    paddingTop: 2,
  },
  translationText: {
    fontStyle: 'italic',
    fontWeight: '400',
    letterSpacing: 0.2,
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
