import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Share,
  Platform,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { NeoButton } from '../neo/NeoButton';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useQuran } from '../../stores/quranStore';
import { SURAH_DATA } from '../../utils/surahData';
import { splitIntoReadableParagraphs, getOptimalLineHeight } from '../../utils/textFormatter';

export const AyatCard = ({
  ayah,
  loading = false,
  isPlayingAudio = false,
  audioLoading = false,
  isFavorite = false,
  onRandomPress,
  onTogglePlayAudio,
  onToggleFavorite,
  onOpenSurahPicker,
  onOpenTafsir,
}) => {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600 || width >= 768;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { translationFontSize, increaseFontSize, decreaseFontSize } = useQuran();

  // Dynamic Arabic font scaling synchronized with translationFontSize
  const fontDelta = (translationFontSize || 15) - 15;
  const dynamicArabicFontSize = Math.max(18, Math.min(36, Math.round(24 + fontDelta * 1.5)));
  const dynamicArabicLineHeight = Math.round(dynamicArabicFontSize * 2);

  const surahMeta = SURAH_DATA.find((s) => s.number === ayah?.surah) || {};
  const surahName =
    ayah?.surahName ||
    ayah?.surah_name ||
    surahMeta.name_latin ||
    (ayah?.surah ? `Surah ke-${ayah.surah}` : t('quran.surahDefault', 'Al-Quran'));
  const surahArabName =
    ayah?.surahNameArab || ayah?.surah_name_ar || surahMeta.name || '';
  const ayahNum = ayah?.ayah || 1;

  const handleShare = async () => {
    if (!ayah) return;

    const shareMessage = `*${surahName} (${ayah.surah}:${ayahNum})*\n\n${ayah.arab}\n\n"${ayah.translation}"\n\n_${t('quran.sharedFrom', 'Dibagikan dari aplikasi DalAy (Daily Ayah)')}_`;

    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({
          title: `QS. ${surahName} : ${ayahNum}`,
          text: shareMessage,
        });
      } else {
        await Share.share({
          message: shareMessage,
          title: `QS. ${surahName} : ${ayahNum}`,
        });
      }
    } catch (error) {
      // ignore cancel share
    }
  };

  if (loading || !ayah) {
    return (
      <NeoCard variant="white" padding={24} style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('quran.loadingAyah', 'Memuat Ayat Suci Al-Quran...')}
          </Text>
        </View>
      </NeoCard>
    );
  }

  const translationParagraphs = splitIntoReadableParagraphs(ayah.translation || '');

  return (
    <NeoCard
      variant="white"
      padding={18}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top Header Row with Surah Meta and Arabic Name */}
      <Pressable
        onPress={onOpenSurahPicker}
        style={({ pressed }) => [
          styles.cardHeader,
          pressed && styles.cardHeaderPressed,
        ]}
        accessibilityLabel={t('quran.pickSurahAyah', 'Pilih Surah dan Ayat')}
      >
        <View style={styles.surahLeftSection}>
          <View
            style={[
              styles.surahNumberCircle,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Text
              style={[
                styles.surahNumberText,
                { color: colors.primaryDark },
              ]}
            >
              {ayah.surah || 1}
            </Text>
          </View>
          <View style={styles.surahTextDetails}>
            <View style={styles.surahTitleRow}>
              <Text
                style={[styles.surahNameTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                QS. {surahName}
              </Text>
              <Ionicons name="chevron-down" size={13} color={colors.primary} />
            </View>
            <Text
              style={[styles.surahMetaText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              Ayat {ayah.ayah || 1} • {surahMeta.meaning || 'Arti Surah'} •{' '}
              {surahMeta.type === 'mekah' ? 'Makkiyah' : 'Madaniyah'}
            </Text>
          </View>
        </View>

        <Text
          allowFontScaling={false}
          style={[styles.surahArabName, { color: colors.primary }]}
          numberOfLines={1}
        >
          {surahArabName}
        </Text>
      </Pressable>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Arabic Text Display (Dynamic Font, Fixed Scaling) */}
      <View style={styles.arabicContainer}>
        {/* Mobile Font Size Stepper Directly Above Arabic Text */}
        {!isTablet && (
          <View style={styles.arabicTopBar}>
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
                accessibilityLabel="Kecilkan Font"
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
                accessibilityLabel="Besarkan Font"
              >
                <Text style={[styles.fontSizeBtnText, { color: colors.text }]}>A+</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text
          allowFontScaling={false}
          style={[
            styles.arabicText,
            {
              color: colors.text,
              fontSize: dynamicArabicFontSize,
              lineHeight: dynamicArabicLineHeight,
            },
          ]}
        >
          {ayah.arab}
        </Text>
      </View>

      {/* Translation & Tafsir Button */}
      <View
        style={[
          styles.translationContainer,
          {
            backgroundColor: colors.surfaceLight,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.translationHeader}>
          <View style={styles.translationHeaderLeft}>
            <Ionicons name="book-outline" size={13} color={colors.primaryDark} />
            <Text style={[styles.translationLabel, { color: colors.primaryDark }]}>
              {t('quran.translationLabel', 'Terjemahan :')}
            </Text>
          </View>

          <Pressable
            onPress={onOpenTafsir}
            style={({ pressed }) => [
              styles.tafsirBadgeBtn,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
              pressed && styles.tafsirBadgeBtnPressed,
            ]}
          >
            <Ionicons name="book" size={12} color={colors.primary} />
            <Text style={[styles.tafsirBadgeText, { color: colors.primary }]}>
              {t('quran.tafsirBtn', 'Tafsir')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.paragraphsContainer}>
          {translationParagraphs.map((para, pIndex) => (
            <Text
              key={`para-${ayah?.surah || 1}-${ayah?.ayah || 1}-${para.slice(0, 16)}`}
              style={[
                styles.translationParagraph,
                {
                  color: colors.text,
                  fontSize: translationFontSize,
                  lineHeight: getOptimalLineHeight(translationFontSize),
                  marginBottom: pIndex === translationParagraphs.length - 1 ? 0 : 12,
                },
              ]}
            >
              {pIndex === 0 ? `"${para}` : para}
              {pIndex === translationParagraphs.length - 1 ? '"' : ''}
            </Text>
          ))}
        </View>
      </View>

      {/* Modern Sleek Action Toolbar (1 Row) */}
      <View style={styles.toolbar}>
        <View style={styles.audioBtnWrapper}>
          <NeoButton
            title={isPlayingAudio ? t('quran.pauseAudio', 'Jeda') : t('quran.playAudio', 'Putar Audio')}
            iconName={isPlayingAudio ? 'pause' : 'volume-high'}
            variant={isPlayingAudio ? 'income' : 'primary'}
            size="sm"
            loading={audioLoading}
            onPress={onTogglePlayAudio}
            style={styles.audioBtn}
          />
        </View>

        {/* Right: Quick Icon Actions */}
        <View style={styles.iconActionsRow}>
          {/* Tafsir Pop-up Icon Button */}
          <Pressable
            onPress={onOpenTafsir}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.surfaceLight,
                borderColor: colors.border,
              },
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityLabel={t('quran.tafsirBtn', 'Tafsir Ayat')}
          >
            <Ionicons name="newspaper-outline" size={17} color={colors.primary} />
          </Pressable>

          {/* Add to Favorites Button */}
          <Pressable
            onPress={onToggleFavorite}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: isFavorite ? '#FFE4E6' : colors.surfaceLight,
                borderColor: isFavorite ? '#FDA4AF' : colors.border,
              },
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityLabel={
              isFavorite
                ? t('quran.unfavoriteAyah', 'Hapus Favorit')
                : t('quran.favoriteAyah', 'Favoritkan Ayat')
            }
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? '#E11D48' : colors.text}
            />
          </Pressable>

          {/* Share Button */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.surfaceLight,
                borderColor: colors.border,
              },
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityLabel={t('quran.shareAyah', 'Bagikan Ayat')}
          >
            <Ionicons
              name="share-social-outline"
              size={18}
              color={colors.text}
            />
          </Pressable>

          {/* Random Ayah Button */}
          <Pressable
            onPress={onRandomPress}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.surfaceLight,
                borderColor: colors.border,
              },
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityLabel={t('quran.randomAyah', 'Ayat Acak')}
          >
            <Ionicons name="shuffle" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </NeoCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    width: '100%',
    minWidth: 0,
  },
  loadingContainer: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    width: '100%',
    minWidth: 0,
    gap: 10,
  },
  cardHeaderPressed: {
    opacity: 0.7,
  },
  surahLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerRightControls: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
  },
  surahNumberCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  surahNumberText: {
    fontSize: 14,
    fontWeight: '900',
    includeFontPadding: false,
  },
  surahTextDetails: {
    flex: 1,
    minWidth: 0,
  },
  surahTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  surahNameTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    includeFontPadding: false,
    flexShrink: 1,
  },
  surahMetaText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
    includeFontPadding: false,
  },
  surahArabName: {
    fontFamily: TYPOGRAPHY.fontFamilyArabic,
    fontSize: 22,
    fontWeight: '700',
    flexShrink: 0,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingRight: 2,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  arabicContainer: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  arabicTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  arabicText: {
    fontFamily: TYPOGRAPHY.fontFamilyArabic,
    fontSize: 24,
    lineHeight: 48,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '500',
  },
  translationContainer: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  translationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  translationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  translationLabel: {
    fontSize: 11,
    fontWeight: '800',
    includeFontPadding: false,
  },
  translationHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  fontSizePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 1,
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
  tafsirBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  tafsirBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    includeFontPadding: false,
  },
  paragraphsContainer: {
    paddingTop: 2,
  },
  translationParagraph: {
    fontStyle: 'italic',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    gap: 8,
  },
  audioBtnWrapper: {
    flex: 1,
  },
  audioBtn: {
    paddingVertical: 8,
  },
  iconActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnFavActive: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FDA4AF',
  },
  iconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
});

export default AyatCard;
