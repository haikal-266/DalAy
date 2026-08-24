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
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { NeoButton } from '../neo/NeoButton';
import { NeoTag } from '../neo/NeoTag';
import { useTheme } from '../../stores/themeStore';
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

  const surahMeta = SURAH_DATA.find((s) => s.number === ayah?.surah) || {};
  const surahName =
    ayah?.surahName ||
    ayah?.surah_name ||
    surahMeta.name_latin ||
    (ayah?.surah ? `Surah ke-${ayah.surah}` : 'Al-Quran');
  const surahArabName =
    ayah?.surahNameArab || ayah?.surah_name_ar || surahMeta.name || '';
  const ayahNum = ayah?.ayah || 1;

  const handleShare = async () => {
    if (!ayah) return;

    const shareMessage = `📖 *${surahName} (${ayah.surah}:${ayahNum})*\n\n${ayah.arab}\n\n"${ayah.translation}"\n\n_Dibagikan dari aplikasi DalAy (Daily Ayah)_`;

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
            Memuat Ayat Suci Al-Quran...
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
                label={`Ayat ${ayahNum}`}
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

      {/* Indonesian Translation with Tafsir Trigger Button */}
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
              Terjemahan :
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
              Tafsir Ayat
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
            title={isPlayingAudio ? 'Jeda Audio' : 'Putar Audio'}
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
            accessibilityLabel="Lihat Tafsir Ayat"
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
            accessibilityLabel="Acak Ayat"
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
            accessibilityLabel={isFavorite ? 'Hapus dari Tersimpan' : 'Simpan Ayat'}
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
            accessibilityLabel="Bagikan Ayat"
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
    marginVertical: 8,
    borderWidth: 1,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  surahBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  surahNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumberText: {
    fontSize: 13,
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
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
    fontWeight: '600',
  },
  surahArabName: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'serif',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  arabicContainer: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'flex-end',
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 46,
    textAlign: 'right',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'serif',
    letterSpacing: 0.5,
  },
  translationContainer: {
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 12,
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
    gap: 5,
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
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: 22,
    fontWeight: '500',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  audioBtnWrapper: {
    flex: 1,
  },
  audioBtn: {
    marginVertical: 0,
    width: '100%',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconBtnFavActive: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FDA4AF',
  },
  iconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});

export default AyatCard;
