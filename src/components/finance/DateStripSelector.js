import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useSwipeNavigation } from '../../stores/swipeNavigationStore';
import { CalendarDatePickerModal } from './CalendarDatePickerModal';

const DAYS_SHORT_ID = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const DAYS_SHORT_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const MONTHS_SHORT_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];
const MONTHS_SHORT_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_FULL_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_FULL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TOTAL_PAGES = 25; // 25 pages * 5 dates = 125 days (~4 months range)
const HALF_PAGES = 12;  // Page index 12 is center page (Today)

export const DateStripSelector = ({ selectedDate, onSelectDate }) => {
  const { colors } = useTheme();
  const { isIndonesian, t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const { setSwipeEnabled } = useSwipeNavigation();
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const daysShort = isIndonesian ? DAYS_SHORT_ID : DAYS_SHORT_EN;
  const monthsShort = isIndonesian ? MONTHS_SHORT_ID : MONTHS_SHORT_EN;
  const daysFull = isIndonesian ? DAYS_FULL_ID : DAYS_FULL_EN;

  const scrollViewRef = useRef(null);

  // Exact container width (FinanceScreen has paddingHorizontal: 16 -> windowWidth - 32)
  const [layoutWidth, setLayoutWidth] = useState(windowWidth - 32);
  const effectiveWidth = layoutWidth > 0 ? layoutWidth : windowWidth - 32;

  // 5 dates per page
  const VISIBLE_COUNT = 5;
  const GAP = 7;
  const pillWidth = Math.floor((effectiveWidth - (VISIBLE_COUNT - 1) * GAP) / VISIBLE_COUNT);

  // Anchor date: Today midnight - 2 days (so Today is right in the center of Page 12)
  const baseAnchorDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 2);
    return d;
  }, []);

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const a = new Date(d1);
    const b = new Date(d2);
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const isToday = (d) => isSameDay(d, new Date());

  // Generate 25 discrete pages of 5 dates each
  const pages = useMemo(() => {
    const list = [];
    for (let p = -HALF_PAGES; p <= HALF_PAGES; p++) {
      const pageDates = [];
      const pageStart = new Date(baseAnchorDate);
      pageStart.setDate(baseAnchorDate.getDate() + p * VISIBLE_COUNT);

      for (let i = 0; i < VISIBLE_COUNT; i++) {
        const d = new Date(pageStart);
        d.setDate(pageStart.getDate() + i);
        pageDates.push(d);
      }
      list.push({ pageOffset: p, dates: pageDates });
    }
    return list;
  }, [baseAnchorDate]);

  // Calculate page index for a given date
  const getPageIndexForDate = (date) => {
    if (!date) return HALF_PAGES;
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const base = new Date(baseAnchorDate);
    base.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - base) / (1000 * 60 * 60 * 24));
    const pageOffset = Math.floor(diffDays / VISIBLE_COUNT);
    const pageIdx = pageOffset + HALF_PAGES;
    return Math.max(0, Math.min(TOTAL_PAGES - 1, pageIdx));
  };

  const scrollToPage = (pageIdx, animated = true) => {
    if (scrollViewRef.current && pageIdx >= 0 && pageIdx < TOTAL_PAGES) {
      scrollViewRef.current.scrollTo({
        x: pageIdx * effectiveWidth,
        animated,
      });
    }
  };

  // On mount or layout width ready: glide to the page of selectedDate without animation
  useEffect(() => {
    const initialPage = getPageIndexForDate(selectedDate || new Date());
    const timer = setTimeout(() => {
      scrollToPage(initialPage, false);
    }, 60);
    return () => clearTimeout(timer);
  }, [effectiveWidth]);

  // When user taps a date: directly select it without any bouncing or jump loops
  const handleDatePress = (itemDate) => {
    onSelectDate(itemDate);
  };

  // When user taps "Hari Ini"
  const handleBackToToday = () => {
    const today = new Date();
    onSelectDate(today);
    const todayPage = getPageIndexForDate(today);
    scrollToPage(todayPage, true);
  };

  // When user picks a date from the monthly calendar modal
  const handleCalendarPick = (pickedDate) => {
    const d = new Date(pickedDate);
    onSelectDate(d);
    const targetPage = getPageIndexForDate(d);
    scrollToPage(targetPage, true);
  };

  const getRelativeDateString = () => {
    const d = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    const dayName = daysFull[d.getDay()];
    const dateNum = d.getDate();
    const monthName = monthsShort[d.getMonth()];

    if (diffDays === 0) return `${t('finance.today', 'Hari Ini')} • ${dayName}, ${dateNum} ${monthName}`;
    if (diffDays === -1) return `${t('finance.yesterday', 'Kemarin')} • ${dayName}, ${dateNum} ${monthName}`;
    if (diffDays === 1) return `${t('finance.tomorrow', 'Besok')} • ${dayName}, ${dateNum} ${monthName}`;
    if (diffDays < 0) return `${Math.abs(diffDays)} ${t('finance.daysAgo', 'hari lalu')} • ${dateNum} ${monthName}`;
    return `${diffDays} ${t('finance.daysLater', 'hari lagi')} • ${dateNum} ${monthName}`;
  };

  return (
    <View style={styles.container}>
      {/* Clean Compact Date Label Bar */}
      <View style={styles.topInfoBar}>
        <View style={styles.dateLabelRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {getRelativeDateString()}
          </Text>
        </View>

        <View style={styles.topRightActions}>
          {!isToday(selectedDate) && (
            <Pressable
              onPress={handleBackToToday}
              style={({ pressed }) => [
                styles.resetTodayBtn,
                { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.resetTodayText, { color: colors.primaryDark }]}>
                {t('finance.backToToday', 'Hari Ini')}
              </Text>
            </Pressable>
          )}

          {/* Calendar Picker Trigger */}
          <Pressable
            onPress={() => setCalendarModalVisible(true)}
            style={({ pressed }) => [
              styles.calendarHeaderBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              pressed && styles.pressed,
            ]}
            accessibilityLabel={t('modal.selectDate', 'Pilih Tanggal')}
          >
            <Ionicons name="calendar" size={13} color={colors.primary} />
            <Text style={[styles.calendarHeaderBtnText, { color: colors.text }]}>
              {isIndonesian ? 'Kalender' : 'Calendar'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Paging Carousel Container (Like Wallet Carousel) */}
      <View
        style={styles.stripContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - layoutWidth) > 1) {
            setLayoutWidth(w);
          }
        }}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          onTouchStart={() => setSwipeEnabled(false)}
          onTouchEnd={() => setSwipeEnabled(true)}
          onTouchCancel={() => setSwipeEnabled(true)}
          onScrollBeginDrag={() => setSwipeEnabled(false)}
          onMomentumScrollEnd={() => setSwipeEnabled(true)}
          decelerationRate="fast"
          style={{ width: effectiveWidth }}
        >
          {pages.map((page) => (
            <View
              key={page.dates[0].toISOString()}
              style={[
                styles.pageSlide,
                { width: effectiveWidth },
              ]}
            >
              <View style={styles.pillsRow}>
                {page.dates.map((itemDate) => {
                  const isSelected = isSameDay(itemDate, selectedDate);
                  const isCurrentToday = isToday(itemDate);
                  const dayName = daysShort[itemDate.getDay()];
                  const dayNum = itemDate.getDate();

                  return (
                    <Pressable
                      key={itemDate.toISOString()}
                      onPress={() => handleDatePress(itemDate)}
                      style={({ pressed }) => [
                        styles.pill,
                        {
                          width: pillWidth,
                          backgroundColor: isSelected
                            ? colors.primary
                            : isCurrentToday
                            ? (colors.primaryLight || '#F0FDF4')
                            : colors.surface,
                          borderColor: isSelected
                            ? colors.primaryDark
                            : isCurrentToday
                            ? colors.primary
                            : colors.border,
                          borderWidth: isSelected || isCurrentToday ? 1.5 : 1,
                        },
                        isSelected && styles.pillSelected,
                        pressed && styles.pillPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillDayName,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isCurrentToday
                              ? colors.primary
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {dayName}
                      </Text>
                      <Text
                        style={[
                          styles.pillDayNum,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : isCurrentToday
                              ? colors.primaryDark
                              : colors.text,
                          },
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Monthly Interactive Calendar Modal */}
      <CalendarDatePickerModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        selectedDate={selectedDate}
        onSelectDate={handleCalendarPick}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 16,
  },
  topInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '800',
    includeFontPadding: false,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetTodayBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetTodayText: {
    fontSize: 10,
    fontWeight: '800',
    includeFontPadding: false,
  },
  calendarHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
  },
  calendarHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  stripContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  pageSlide: {
    paddingVertical: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  pillSelected: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.5,
  },
  pillPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  pillDayName: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  pillDayNum: {
    fontSize: 15,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});

export default DateStripSelector;
