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
import { TYPOGRAPHY } from '../theme/typography';
import { useQuran } from '../stores/quranStore';
import { useTheme } from '../stores/themeStore';
import { useLanguage } from '../stores/languageStore';
import { AyatCard } from '../components/quran/AyatCard';
import { ReminderModal } from '../components/quran/ReminderModal';
import { SurahPickerModal } from '../components/quran/SurahPickerModal';
import { AyatHistoryModal } from '../components/quran/AyatHistoryModal';
import { TafsirModal } from '../components/quran/TafsirModal';
import { RandomHadithCard } from '../components/quran/RandomHadithCard';
import { NeoButton } from '../components/neo/NeoButton';
import { NeoSegmented } from '../components/neo/NeoSegmented';

export const QuranScreen = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('ayat'); // 'ayat' | 'hadits'
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
              <Text style={[styles.headerLogo, { color: colors.text }]}>
                {t('quran.appName', 'DalAy')}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t('quran.subtitle', 'Daily Ayah & Hadith')}
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <NeoButton
              title={t('quran.reminderBtn', 'Pengingat')}
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

        {/* Top Tab Switcher: Ayat vs Hadits (Mobile) */}
        {!isTablet && (
          <View style={styles.viewToggleContainer}>
            <NeoSegmented
              options={[
                {
                  label: t('quran.tabAyat', 'Ayat Al-Quran'),
                  value: 'ayat',
                  iconName: 'book-outline',
                },
                {
                  label: t('quran.tabHadis', 'Hadits Pilihan'),
                  value: 'hadits',
                  iconName: 'sparkles-outline',
                },
              ]}
              selectedValue={activeTab}
              onSelect={setActiveTab}
            />
          </View>
        )}

        {/* Main Content Layout (Adaptive for Tablet & Tab Switching) */}
        <View style={[styles.mainLayout, isTablet && styles.mainLayoutTablet]}>
          {/* Left Column: Featured Ayat Card */}
          {(isTablet || activeTab === 'ayat') && (
            <View style={[styles.columnLeft, isTablet && styles.columnTablet]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="sparkles" size={15} color={colors.primary} />
                  <Text
                    style={[styles.sectionTitle, { color: colors.textSecondary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {t('quran.dailyAyahTitle', 'AYAT UNTUKMU HARI INI')}
                  </Text>
                </View>
                <NeoButton
                  title={t('quran.surahPickerBtn', 'Pilih Surah (114)')}
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
          )}

          {/* Right Column: Daily Hadith & Wisdom (Directly at top when selected on Mobile) */}
          {(isTablet || activeTab === 'hadits') && (
            <View style={[styles.columnRight, isTablet && styles.columnTablet]}>
              <RandomHadithCard />
            </View>
          )}
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
        onSelectAyah={(s, a) => selectSpecificAyah(s, a)}
        currentSurah={currentAyah?.surah || 1}
        currentAyah={currentAyah?.ayah || 1}
      />

      <AyatHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        favorites={favorites}
        history={history}
        onSelectAyah={(s, a) => selectSpecificAyah(s, a)}
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
    marginRight: 8,
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
    alignItems: 'center',
    gap: 6,
  },
  topBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
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
  viewToggleContainer: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  surahPickerBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
});

export default QuranScreen;
