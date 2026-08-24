import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TYPOGRAPHY } from '../theme/typography';
import { useQuran } from '../stores/quranStore';
import { useTheme } from '../stores/themeStore';
import { AyatCard } from '../components/quran/AyatCard';
import { ReminderModal } from '../components/quran/ReminderModal';
import { SurahPickerModal } from '../components/quran/SurahPickerModal';
import { AyatHistoryModal } from '../components/quran/AyatHistoryModal';
import { TafsirModal } from '../components/quran/TafsirModal';
import { NeoButton } from '../components/neo/NeoButton';
import { NeoCard } from '../components/neo/NeoCard';
import { SURAH_DATA } from '../utils/surahData';

const POPULAR_SURAHS = [1, 18, 36, 55, 56, 67, 112];

export const QuranScreen = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { colors } = useTheme();

  const {
    currentAyah,
    favorites,
    history,
    loading,
    isPlayingAudio,
    audioLoading,
    getNewRandomAyah,
    selectSpecificAyah,
    toggleFavorite,
    isFavorite,
    clearHistory,
    togglePlayAudio,
  } = useQuran();

  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [surahPickerVisible, setSurahPickerVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [tafsirModalVisible, setTafsirModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await getNewRandomAyah();
    setRefreshing(false);
  };

  const handleSelectPopularSurah = (surahNum) => {
    selectSpecificAyah(surahNum, 1);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Enhanced Header Bar */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoRow}>
              <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="book" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.headerLogo, { color: colors.text }]}>DalAy</Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Daily Ayah & Inspirasi Harian
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <NeoButton
              title="Pengingat"
              iconName="notifications-outline"
              variant="accent"
              size="sm"
              onPress={() => setReminderModalVisible(true)}
              style={styles.topBtn}
            />
            <NeoButton
              title={`(${favorites.length})`}
              iconName="heart"
              variant="light"
              size="sm"
              onPress={() => setHistoryModalVisible(true)}
              style={styles.topBtn}
            />
          </View>
        </View>

        {/* Main Content Layout (Adaptive for Tablet) */}
        <View style={[styles.mainLayout, isTablet && styles.mainLayoutTablet]}>
          {/* Left Column: Featured Ayat Card */}
          <View style={[styles.columnLeft, isTablet && styles.columnTablet]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  AYAT INSPIRASI HARI INI
                </Text>
              </View>
              <NeoButton
                title="Pilih Surah (114)"
                iconName="list"
                variant="light"
                size="sm"
                onPress={() => setSurahPickerVisible(true)}
                style={styles.surahPickerBtn}
              />
            </View>

            <AyatCard
              ayah={currentAyah}
              loading={loading}
              isPlayingAudio={isPlayingAudio}
              audioLoading={audioLoading}
              isFavorite={isFavorite(currentAyah)}
              onRandomPress={getNewRandomAyah}
              onTogglePlayAudio={togglePlayAudio}
              onToggleFavorite={() => toggleFavorite(currentAyah)}
              onOpenSurahPicker={() => setSurahPickerVisible(true)}
              onOpenTafsir={() => setTafsirModalVisible(true)}
            />
          </View>

          {/* Right Column: Quick Surah Shortcuts & Info */}
          <View style={[styles.columnRight, isTablet && styles.columnTablet]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flash-outline" size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                AKSES CEPAT SURAH UTAMA
              </Text>
            </View>

            <View style={styles.popularSurahList}>
              {POPULAR_SURAHS.map((surahNum) => {
                const sData = SURAH_DATA.find((s) => s.number === surahNum);
                if (!sData) return null;

                const isCurrent = currentAyah?.surah === surahNum;

                return (
                  <NeoCard
                    key={surahNum}
                    variant="white"
                    padding={12}
                    style={[
                      styles.surahCard,
                      { borderColor: isCurrent ? colors.primary : colors.border },
                      isCurrent && { backgroundColor: colors.primarySurface },
                    ]}
                    onPress={() => handleSelectPopularSurah(surahNum)}
                  >
                    <View style={styles.surahCardLeft}>
                      <View
                        style={[
                          styles.surahCardBadge,
                          { backgroundColor: isCurrent ? colors.primary : colors.surfaceLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.surahCardBadgeText,
                            { color: isCurrent ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {surahNum}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.surahCardName, { color: colors.text }]}>
                          {sData.name_latin}
                        </Text>
                        <Text style={[styles.surahCardTrans, { color: colors.textMuted }]}>
                          {sData.translation} • {sData.number_of_ayah} Ayat
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.surahCardArab, { color: colors.primary }]}>
                      {sData.name}
                    </Text>
                  </NeoCard>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
      />

      <SurahPickerModal
        visible={surahPickerVisible}
        onClose={() => setSurahPickerVisible(false)}
        onSelectAyah={(surah, ayah) => selectSpecificAyah(surah, ayah)}
        currentSurah={currentAyah?.surah || 1}
        currentAyah={currentAyah?.ayah || 1}
      />

      <AyatHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        favorites={favorites}
        history={history}
        onSelectAyah={(ayah) => selectSpecificAyah(ayah.surah, ayah.ayah)}
        onClearHistory={clearHistory}
      />

      <TafsirModal
        visible={tafsirModalVisible}
        onClose={() => setTafsirModalVisible(false)}
        ayah={currentAyah}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 3,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  topBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  mainLayout: {
    flexDirection: 'column',
  },
  mainLayoutTablet: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  columnLeft: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
    marginTop: 14,
  },
  columnTablet: {
    flex: 1,
    marginTop: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  surahPickerBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  popularSurahList: {
    gap: 6,
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 3,
    borderWidth: 1,
  },
  surahCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  surahCardBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahCardBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  surahCardName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
  },
  surahCardTrans: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  surahCardArab: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default QuranScreen;
