import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Share,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { NeoButton } from '../neo/NeoButton';
import { NeoTag } from '../neo/NeoTag';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { SURAH_DATA } from '../../utils/surahData';

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
  const { colors } = useTheme();
  const { t } = useLanguage();

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
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.surahBadge}>
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
              {ayah.surah}
            </Text>
          </View>
          <View>
            <View style={styles.surahNameRow}>
              <Text style={[styles.surahNameTitle, { color: colors.text }]}>
                QS. {surahName}
              </Text>
              <NeoTag
                label={`${t('quran.ayahSingular', 'Ayat')} ${ayahNum}`}
                color={colors.primary}
                bgColor={colors.primaryLight}
                textColor={colors.primaryDark}
                size="sm"
              />
            </View>
            <Text style={[styles.surahMetaText, { color: colors.textMuted }]}>
              {surahMeta.translation || 'Arti Surah'} •{' '}
              {surahMeta.type === 'meccan' ? 'Makkiyah' : 'Madaniyah'}
            </Text>
          </View>
        </View>

        <Text style={[styles.surahArabName, { color: colors.primary }]}>
          {surahArabName}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Arabic Text Display */}
      <View style={styles.arabicContainer}>
        <Text style={[styles.arabicText, { color: colors.text }]}>
          {ayah.arab}
        </Text>
      </View>

      {/* Translation with Tafsir Trigger Button */}
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

          {/* Tafsir Trigger Badge Button */}
          <Pressable
            onPress={onOpenTafsir}
            style={({ pressed }) => [
              styles.tafsirBadgeBtn,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityLabel="Buka Tafsir Ayat"
          >
            <Ionicons name="newspaper-outline" size={12} color={colors.primaryDark} />
            <Text style={[styles.tafsirBadgeText, { color: colors.primaryDark }]}>
              {t('quran.tafsirBtn', 'Tafsir Ayat')}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.translationText, { color: colors.text }]}>
          "{ayah.translation}"
        </Text>
      </View>

      {/* Modern Sleek Action Toolbar (1 Row) */}
      <View style={styles.toolbar}>
        {/* Left: Play/Pause Audio Button */}
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
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityLabel={t('quran.tafsirBtn', 'Tafsir')}
          >
            <Ionicons name="newspaper-outline" size={17} color={colors.primaryDark} />
          </Pressable>

          {/* Shuffle / Random Ayat */}
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
            accessibilityLabel={t('quran.randomAyah', 'Acak')}
          >
            <Ionicons name="shuffle" size={17} color={colors.text} />
          </Pressable>

          {/* Bookmark / Favorite */}
          <Pressable
            onPress={onToggleFavorite}
            style={({ pressed }) => [
              styles.iconBtn,
              isFavorite
                ? styles.iconBtnFavActive
                : {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.border,
                  },
              pressed && styles.iconBtnPressed,
            ]}
            accessibilityLabel={isFavorite ? t('quran.savedAyah', 'Tersimpan') : t('quran.saveAyah', 'Simpan')}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={17}
              color={isFavorite ? '#E11D48' : colors.text}
            />
          </Pressable>

          {/* Share */}
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
            accessibilityLabel={t('quran.shareAyah', 'Bagikan')}
          >
            <Ionicons name="share-social-outline" size={17} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </NeoCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 12,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  surahBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  surahNumberCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumberText: {
    fontSize: 14,
    fontWeight: '900',
  },
  surahNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  surahNameTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
  },
  surahMetaText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  surahArabName: {
    fontSize: 20,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  arabicContainer: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 46,
    textAlign: 'right',
    fontWeight: '600',
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
    marginBottom: 6,
  },
  translationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  translationLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  tafsirBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  tafsirBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  translationText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '500',
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
