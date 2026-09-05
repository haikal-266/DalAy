import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
  Pressable,
  Platform,
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
import { SURAH_DATA } from '../utils/surahData';

export const QuranScreen = React.memo(() => {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600 || width >= 768;
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const [activeTab, setActiveTab] = useState('ayat'); // 'ayat' | 'hadits'
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (msg, icon = 'checkmark-circle') => {
    const toastObj = typeof msg === 'string' ? { text: msg, icon } : msg;
    setToastMessage(toastObj);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleFavorite = async (ayah) => {
    if (!ayah) return;
    const isFav = isFavorite(ayah);
    await toggleFavorite(ayah);
    let feedbackText = '';
    if (isFav) {
      feedbackText = isIndonesian ? 'Dihapus dari favorit' : 'Removed from favorites';
    } else {
      feedbackText = isIndonesian ? 'Disimpan ke favorit' : 'Saved to favorites';
    }
    showToast(feedbackText, isFav ? 'heart-dislike-outline' : 'heart');
  };
  const {
    currentAyah,
    favorites,
    history,
    loading,
    isPlayingAudio,
    audioLoading,
    translationFontSize,
    increaseFontSize,
    decreaseFontSize,
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
    showToast(
      isIndonesian ? 'Ayat acak dimuat' : 'Random Ayah loaded',
      'shuffle'
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Floating Top Screen Toast Banner - Always visible regardless of scroll position */}
      {toastMessage && (
        <View
          style={[
            styles.floatingScreenToast,
            {
              backgroundColor: colors.accent || '#0D9488',
              borderColor: colors.borderLight,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name={toastMessage.icon || 'checkmark-circle'}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.floatingScreenToastText} numberOfLines={2}>
            {toastMessage.text}
          </Text>
        </View>
      )}

      {isTablet ? (
        <View style={styles.tabletOuter}>
          {/* Enhanced Fixed Header Bar on Tablet */}
          <View
            style={[
              styles.header,
              styles.tabletHeader,
              { borderBottomColor: colors.border },
            ]}
          >
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
              {/* Unified Tablet Font Size Controller for Quran & Hadith */}
              <View
                style={[
                  styles.tabletFontSizePill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="text-outline"
                  size={14}
                  color={colors.textSecondary}
                  style={{ marginRight: 2 }}
                />
                <Pressable
                  onPress={decreaseFontSize}
                  style={({ pressed }) => [
                    styles.tabletFontBtn,
                    pressed && styles.fontBtnPressed,
                  ]}
                  hitSlop={6}
                >
                  <Text style={[styles.tabletFontBtnText, { color: colors.text }]}>A-</Text>
                </Pressable>
                <View style={[styles.fontDivider, { backgroundColor: colors.borderLight }]} />
                <Text style={[styles.tabletFontSizeValue, { color: colors.primary }]}>
                  {translationFontSize}
                </Text>
                <View style={[styles.fontDivider, { backgroundColor: colors.borderLight }]} />
                <Pressable
                  onPress={increaseFontSize}
                  style={({ pressed }) => [
                    styles.tabletFontBtn,
                    pressed && styles.fontBtnPressed,
                  ]}
                  hitSlop={6}
                >
                  <Text style={[styles.tabletFontBtnText, { color: colors.text }]}>A+</Text>
                </Pressable>
              </View>

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

          {/* Independent Dual-Pane Scrolling Layout for Tablet */}
          <View style={styles.tabletPanesRow}>
            {/* Left Pane: Featured Ayat Column with Independent Scroll */}
            <View style={styles.tabletPaneColumn}>
              <ScrollView
                style={styles.paneScrollView}
                contentContainerStyle={styles.paneScrollContent}
                showsVerticalScrollIndicator={false}
              >
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
                  onToggleFavorite={() => handleToggleFavorite(currentAyah)}
                  onOpenSurahPicker={() => setSurahPickerVisible(true)}
                  onOpenTafsir={() => setTafsirModalVisible(true)}
                />
              </ScrollView>
            </View>

            {/* Subtle Vertical Divider between Panes */}
            <View style={[styles.tabletVerticalDivider, { backgroundColor: colors.border }]} />

            {/* Right Pane: Daily Hadith Column with Independent Scroll */}
            <View style={styles.tabletPaneColumn}>
              <ScrollView
                style={styles.paneScrollView}
                contentContainerStyle={styles.paneScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <RandomHadithCard onToast={showToast} />
              </ScrollView>
            </View>
          </View>
        </View>
      ) : (
        /* Mobile Portrait Single Scroll Flow */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header Bar */}
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

          {/* Top Tab Switcher: Ayat vs Hadits (Mobile Only) */}
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

          {/* Mobile Main Content */}
          {activeTab === 'ayat' ? (
            <View style={styles.columnLeft}>
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
                onToggleFavorite={() => handleToggleFavorite(currentAyah)}
                onOpenSurahPicker={() => setSurahPickerVisible(true)}
                onOpenTafsir={() => setTafsirModalVisible(true)}
              />
            </View>
          ) : (
            <View style={styles.columnRight}>
              <RandomHadithCard onToast={showToast} />
            </View>
          )}
        </ScrollView>
      )}

      {/* Modals */}
      <ReminderModal
        visible={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
      />

      <SurahPickerModal
        visible={surahPickerVisible}
        onClose={() => setSurahPickerVisible(false)}
        onSelectAyah={(s, a) => {
          selectSpecificAyah(s, a);
          const sMeta = SURAH_DATA.find((item) => item.number === s);
          const sName = sMeta ? sMeta.name_latin : `Surah ${s}`;
          showToast(
            isIndonesian ? `Memilih QS. ${sName} : ${a}` : `Selected QS. ${sName} : ${a}`,
            'book-outline'
          );
        }}
        currentSurah={currentAyah?.surah || 1}
        currentAyah={currentAyah?.ayah || 1}
      />

      <AyatHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        favorites={favorites}
        history={history}
        onSelectAyah={(s, a) => {
          selectSpecificAyah(s, a);
          const sMeta = SURAH_DATA.find((item) => item.number === s);
          const sName = sMeta ? sMeta.name_latin : `Surah ${s}`;
          showToast(
            isIndonesian ? `Membuka QS. ${sName} : ${a}` : `Opened QS. ${sName} : ${a}`,
            'time-outline'
          );
        }}
        onClearHistory={async () => {
          await clearHistory();
          showToast(
            isIndonesian ? 'Riwayat bacaan dibersihkan' : 'Reading history cleared',
            'trash-outline'
          );
        }}
      />

      <TafsirModal
        visible={tafsirModalVisible}
        onClose={() => setTafsirModalVisible(false)}
        ayah={currentAyah}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  tabletOuter: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  tabletHeader: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 0,
  },
  tabletPanesRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 18,
    width: '100%',
    height: '100%',
    alignItems: 'stretch',
  },
  tabletVerticalDivider: {
    width: 1,
    height: '100%',
    alignSelf: 'stretch',
    opacity: 0.7,
  },
  tabletPaneColumn: {
    flex: 1,
    height: '100%',
    minWidth: 0,
  },
  paneScrollView: {
    flex: 1,
    width: '100%',
  },
  paneScrollContent: {
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 48,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: 1,
    width: '100%',
  },
  headerLeft: {
    flexShrink: 0,
    marginRight: 12,
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
    letterSpacing: 0.5,
    minWidth: 85,
    paddingRight: 14,
    paddingBottom: 2,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  tabletFontSizePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  tabletFontBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tabletFontBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  fontDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 3,
  },
  tabletFontSizeValue: {
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 4,
    minWidth: 20,
    textAlign: 'center',
  },
  fontBtnPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.92 }],
  },
  topBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  columnLeft: {
    width: '100%',
  },
  columnRight: {
    width: '100%',
    marginTop: 14,
  },
  viewToggleContainer: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitleRow: {
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
    flexShrink: 1,
  },
  surahPickerBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  floatingScreenToast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 24,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
    gap: 10,
  },
  floatingScreenToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.2,
  },
});

export default QuranScreen;
