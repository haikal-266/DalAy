import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Share,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { fetchTafsir } from '../../services/quranApi';
import { SURAH_DATA } from '../../utils/surahData';

export const TafsirModal = ({ visible, onClose, ayah }) => {
  const { colors } = useTheme();
  const { currentLanguage, isIndonesian, t } = useLanguage();
  const [tafsirData, setTafsirData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && ayah) {
      loadTafsir();
    }
  }, [visible, ayah?.surah, ayah?.ayah, currentLanguage]);

  const loadTafsir = async () => {
    if (!ayah) return;
    setLoading(true);
    try {
      const data = await fetchTafsir(ayah.surah, ayah.ayah, currentLanguage);
      setTafsirData(data);
    } catch (e) {
      console.log('Error in TafsirModal:', e);
    } finally {
      setLoading(false);
    }
  };

  const surahMeta = SURAH_DATA.find((s) => s.number === ayah?.surah) || {};
  const surahName =
    ayah?.surahName ||
    ayah?.surah_name ||
    surahMeta.name_latin ||
    tafsirData?.surahName ||
    (ayah?.surah ? `Surah ke-${ayah.surah}` : t('quran.surahDefault', 'Al-Quran'));
  const ayahNum = ayah?.ayah || 1;
  const tafsirSourceShort = isIndonesian ? 'Kemenag RI' : 'Ibn Kathir';

  const handleShareTafsir = async () => {
    if (!ayah || !tafsirData) return;

    const message = `📖 *Tafsir QS. ${surahName} (${ayah.surah}:${ayahNum})*\n\n"${ayah.translation}"\n\n*Tafsir (${tafsirData.source}):*\n${tafsirData.text}\n\n_${t('quran.sharedFrom', 'Dibagikan dari aplikasi DalAy (Daily Ayah)')}_`;

    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({
          title: `Tafsir QS. ${surahName} : ${ayahNum}`,
          text: message,
        });
      } else {
        await Share.share({
          message,
          title: `Tafsir QS. ${surahName} : ${ayahNum}`,
        });
      }
    } catch (e) {}
  };

  if (!ayah) return null;

  return (
    <NeoModal
      visible={visible}
      onClose={onClose}
      title={`${t('modal.tafsirTitle', 'Tafsir QS.')} ${surahName}`}
      subtitle={`${t('quran.ayahSingular', 'Ayat')} ${ayahNum} • ${tafsirSourceShort}`}
      footer={
        <View style={styles.footerRow}>
          <NeoButton
            title={t('quran.shareAyah', 'Bagikan')}
            iconName="share-social-outline"
            variant="secondary"
            onPress={handleShareTafsir}
            style={styles.shareBtn}
          />
          <NeoButton
            title={t('modal.close', 'Tutup')}
            variant="primary"
            onPress={onClose}
            style={styles.closeBtn}
          />
        </View>
      }
    >
      {/* Ayah Snippet Banner */}
      <View
        style={[
          styles.snippetBox,
          {
            backgroundColor: colors.surfaceLight,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.snippetHeader}>
          <View style={styles.snippetTitleRow}>
            <Ionicons name="book" size={13} color={colors.primary} />
            <Text style={[styles.snippetLabel, { color: colors.primaryDark }]}>
              QS. {surahName} : {ayahNum}
            </Text>
          </View>
          <Text style={[styles.snippetArabName, { color: colors.primary }]}>
            {ayah.surahNameArab || surahMeta.name || ''}
          </Text>
        </View>

        {ayah.arab && (
          <Text style={[styles.snippetArabText, { color: colors.text }]}>
            {ayah.arab}
          </Text>
        )}

        <Text style={[styles.snippetTranslation, { color: colors.textSecondary }]}>
          "{ayah.translation}"
        </Text>
      </View>

      {/* Tafsir Commentary Section Header */}
      <View style={styles.tafsirHeaderRow}>
        <View style={styles.tafsirTitleLeft}>
          <Ionicons name="newspaper-outline" size={15} color={colors.primary} />
          <Text
            style={[styles.tafsirSectionTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {isIndonesian ? 'Penjelasan Tafsir' : 'Tafsir Commentary'}
          </Text>
        </View>

        <View
          style={[
            styles.sourceBadge,
            {
              backgroundColor: colors.primaryLight,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.sourceText, { color: colors.primaryDark }]}>
            {tafsirSourceShort}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('modal.tafsirLoading', 'Memuat penjelasan tafsir...')}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.contentContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.tafsirBody,
              { color: colors.text },
            ]}
          >
            {tafsirData?.text}
          </Text>
        </View>
      )}
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  snippetBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  snippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  snippetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  snippetLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  snippetArabName: {
    fontSize: 14,
    fontWeight: '700',
  },
  snippetArabText: {
    fontSize: 18,
    lineHeight: 34,
    textAlign: 'right',
    fontWeight: '600',
    marginVertical: 4,
  },
  snippetTranslation: {
    fontSize: 12,
    lineHeight: 19,
    fontStyle: 'italic',
    marginTop: 4,
  },
  tafsirHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  tafsirTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  tafsirSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sourceBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    flexShrink: 0,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '800',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  tafsirBody: {
    fontSize: 13.5,
    lineHeight: 23,
    letterSpacing: 0.1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  shareBtn: {
    flex: 1,
  },
  closeBtn: {
    flex: 1,
  },
});

export default TafsirModal;
