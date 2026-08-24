import React, { useState, useEffect } from 'react';
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
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { useTheme } from '../../stores/themeStore';
import { fetchTafsir } from '../../services/quranApi';
import { SURAH_DATA } from '../../utils/surahData';

export const TafsirModal = ({ visible, onClose, ayah }) => {
  const { colors } = useTheme();
  const [tafsirData, setTafsirData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && ayah) {
      loadTafsir();
    }
  }, [visible, ayah?.surah, ayah?.ayah]);

  const loadTafsir = async () => {
    if (!ayah) return;
    setLoading(true);
    try {
      const data = await fetchTafsir(ayah.surah, ayah.ayah);
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
    (ayah?.surah ? `Surah ke-${ayah.surah}` : 'Al-Quran');
  const ayahNum = ayah?.ayah || 1;

  const handleShareTafsir = async () => {
    if (!ayah || !tafsirData) return;

    const message = `📖 *Tafsir QS. ${surahName} (${ayah.surah}:${ayahNum})*\n\n"${ayah.translation}"\n\n*Tafsir (Kemenag RI):*\n${tafsirData.text}\n\n_Dibagikan dari aplikasi DalAy (Daily Ayah)_`;

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
      title={`Tafsir QS. ${surahName}`}
      subtitle={`Ayat ke-${ayahNum} • Kemenag RI`}
      maxHeight="88%"
    >
      {/* Ayah Brief Card */}
      <View
        style={[
          styles.verseBox,
          {
            backgroundColor: colors.surfaceLight,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.arabicVerse, { color: colors.text }]}>{ayah.arab}</Text>
        <Text style={[styles.translationText, { color: colors.textSecondary }]}>
          "{ayah.translation}"
        </Text>
      </View>

      {/* Tafsir Content */}
      <View style={styles.tafsirContainer}>
        <View style={styles.tafsirHeader}>
          <View style={styles.tafsirHeaderLeft}>
            <Ionicons name="book" size={16} color={colors.primary} />
            <Text style={[styles.tafsirSourceTitle, { color: colors.primaryDark }]}>
              Tafsir Lengkap (Kemenag RI)
            </Text>
          </View>
          <Pressable
            onPress={handleShareTafsir}
            style={({ pressed }) => [
              styles.shareIconBtn,
              { borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="share-social-outline" size={15} color={colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Memuat penjelasan tafsir...
            </Text>
          </View>
        ) : (
          <View style={styles.textBox}>
            <Text style={[styles.tafsirText, { color: colors.text }]}>
              {tafsirData?.text || 'Tafsir belum tersedia.'}
            </Text>
          </View>
        )}
      </View>

      {/* Footer Close Button */}
      <View style={styles.footerAction}>
        <NeoButton
          title="Tutup Tafsir"
          variant="primary"
          size="md"
          onPress={onClose}
          style={styles.closeFullBtn}
        />
      </View>
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  verseBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  arabicVerse: {
    fontSize: 20,
    lineHeight: 38,
    textAlign: 'right',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'serif',
    marginBottom: 8,
  },
  translationText: {
    fontSize: 12,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  tafsirContainer: {
    marginBottom: 10,
  },
  tafsirHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tafsirHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tafsirSourceTitle: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  shareIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
  loadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 10,
    fontWeight: '600',
  },
  textBox: {
    paddingVertical: 4,
  },
  tafsirText: {
    fontSize: TYPOGRAPHY.size.sm,
    lineHeight: 25,
    fontWeight: '400',
  },
  footerAction: {
    marginTop: 12,
    paddingTop: 8,
  },
  closeFullBtn: {
    width: '100%',
    marginVertical: 0,
  },
});

export default TafsirModal;
