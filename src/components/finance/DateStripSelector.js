import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../stores/themeStore';
import { CalendarDatePickerModal } from './CalendarDatePickerModal';

const DAYS_SHORT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];
const DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DateStripSelector = ({ selectedDate, onSelectDate }) => {
  const { colors } = useTheme();
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

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
    const dayName = DAYS_FULL[d.getDay()];
    const dateNum = d.getDate();
    const monthName = MONTHS_SHORT[d.getMonth()];

    if (diffDays === 0) return `Hari Ini • ${dayName}, ${dateNum} ${monthName}`;
    if (diffDays === -1) return `Kemarin • ${dayName}, ${dateNum} ${monthName}`;
    if (diffDays === 1) return `Besok • ${dayName}, ${dateNum} ${monthName}`;
    if (diffDays < 0) return `${Math.abs(diffDays)} hari lalu • ${dateNum} ${monthName}`;
    return `${diffDays} hari lagi • ${dateNum} ${monthName}`;
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
              Hari Ini
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
          {dateList.map((d, index) => {
            const isSelected = isSameDay(d, selectedDate);
            const isCurrentDay = isToday(d);

            return (
              <Pressable
                key={`${d.toISOString()}_${index}`}
                onPress={() => onSelectDate(d)}
                style={({ pressed }) => [
                  styles.datePill,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : isCurrentDay
                      ? colors.primarySurface
                      : colors.surface,
                    borderColor: isSelected
                      ? colors.primary
                      : isCurrentDay
                      ? colors.primaryLight
                      : colors.border,
                  },
                  isSelected && styles.datePillSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : isCurrentDay
                        ? colors.primaryDark
                        : colors.textMuted,
                    },
                  ]}
                >
                  {DAYS_SHORT[d.getDay()]}
                </Text>

                <Text
                  style={[
                    styles.numText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : isCurrentDay
                        ? colors.primaryDark
                        : colors.text,
                    },
                  ]}
                >
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Calendar Picker Modal Trigger Button */}
        <Pressable
          onPress={() => setCalendarModalVisible(true)}
          style={({ pressed }) => [
            styles.calendarBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            pressed && styles.pressed,
          ]}
          accessibilityLabel="Buka Kalender Pemilih Tanggal"
        >
          <Ionicons name="calendar" size={17} color={colors.primary} />
        </Pressable>
      </View>

      {/* Interactive Month Grid Calendar Modal */}
      <CalendarDatePickerModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginBottom: 6,
  },
  topInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resetTodayBtn: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  resetTodayText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollStrip: {
    gap: 6,
    paddingVertical: 2,
  },
  datePill: {
    width: 44,
    height: 48,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillSelected: {
    borderWidth: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  dayText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  numText: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  calendarBtn: {
    width: 44,
    height: 48,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DateStripSelector;
