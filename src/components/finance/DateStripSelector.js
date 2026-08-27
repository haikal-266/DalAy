import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
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

export const DateStripSelector = ({ selectedDate, onSelectDate }) => {
  const { colors } = useTheme();
  const { isIndonesian, t } = useLanguage();
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const daysShort = isIndonesian ? DAYS_SHORT_ID : DAYS_SHORT_EN;
  const monthsShort = isIndonesian ? MONTHS_SHORT_ID : MONTHS_SHORT_EN;
  const daysFull = isIndonesian ? DAYS_FULL_ID : DAYS_FULL_EN;

  // Generate -4 to +3 days around selected date for smooth sliding
  const dateList = useMemo(() => {
    const list = [];
    const base = new Date(selectedDate || new Date());
    base.setHours(0, 0, 0, 0);

    for (let i = -4; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push(d);
    }
    return list;
  }, [selectedDate]);

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
          <Ionicons name="calendar-outline" size={13} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {getRelativeDateString()}
          </Text>
        </View>

        {!isToday(selectedDate) && (
          <Pressable
            onPress={() => onSelectDate(new Date())}
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
      </View>

      {/* Sleek Compact Strip + Calendar Button */}
      <View style={styles.stripRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollStrip}
        >
          {dateList.map((itemDate) => {
            const isSelected = isSameDay(itemDate, selectedDate);
            const isCurrentToday = isToday(itemDate);
            const dayName = daysShort[itemDate.getDay()];
            const dayNum = itemDate.getDate();

            return (
              <Pressable
                key={itemDate.toISOString()}
                onPress={() => onSelectDate(itemDate)}
                style={({ pressed }) => [
                  styles.pill,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.surface,
                    borderColor: isSelected
                      ? colors.primaryDark
                      : isCurrentToday
                      ? colors.primary
                      : colors.border,
                  },
                  isSelected && styles.pillSelected,
                  isCurrentToday && !isSelected && styles.pillToday,
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
                      fontWeight: isSelected || isCurrentToday ? '800' : '600',
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
                      fontWeight: isSelected ? '900' : '700',
                    },
                  ]}
                >
                  {dayNum}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Compact Calendar Modal Launcher */}
        <Pressable
          onPress={() => setCalendarModalVisible(true)}
          style={({ pressed }) => [
            styles.calendarBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            pressed && styles.calendarBtnPressed,
          ]}
          accessibilityLabel={t('modal.selectDate', 'Pilih Tanggal')}
        >
          <Ionicons name="calendar" size={17} color={colors.primary} />
        </Pressable>
      </View>

      {/* Monthly Interactive Calendar Modal */}
      <CalendarDatePickerModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        selectedDate={selectedDate}
        onSelectDate={(d) => onSelectDate(d)}
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
  },
  resetTodayBtn: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetTodayText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollStrip: {
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    width: 48,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  pillSelected: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  pillToday: {
    borderWidth: 1.5,
  },
  pillPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  pillDayName: {
    fontSize: 9,
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  pillDayNum: {
    fontSize: 13,
  },
  calendarBtn: {
    width: 44,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});

export default DateStripSelector;
