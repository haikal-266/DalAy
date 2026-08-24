import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { useTheme } from '../../stores/themeStore';

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const CalendarDatePickerModal = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
}) => {
  const { colors } = useTheme();

  // Current viewing year and month
  const [viewYear, setViewYear] = useState(() => (selectedDate ? new Date(selectedDate).getFullYear() : new Date().getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (selectedDate ? new Date(selectedDate).getMonth() : new Date().getMonth()));
  const [tempDate, setTempDate] = useState(() => (selectedDate ? new Date(selectedDate) : new Date()));

  // Reset viewing month when modal opens with new selectedDate
  React.useEffect(() => {
    if (visible && selectedDate) {
      const d = new Date(selectedDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setTempDate(d);
    }
  }, [visible, selectedDate]);

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(viewYear, viewMonth - 1, prevMonthDays - i),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(viewYear, viewMonth, i),
      });
    }

    // Next month filler days (to make total a multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(viewYear, viewMonth + 1, i),
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

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

  const handleConfirm = () => {
    onSelectDate(tempDate);
    onClose();
  };

  const handleSelectToday = () => {
    const today = new Date();
    setTempDate(today);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(today);
    onClose();
  };

  return (
    <NeoModal
      visible={visible}
      onClose={onClose}
      title="Pilih Tanggal Transaksi"
      subtitle="Pilih hari untuk pencatatan keuangan"
      footer={
        <View style={styles.footerRow}>
          <NeoButton
            title="Hari Ini"
            variant="outline"
            size="md"
            onPress={handleSelectToday}
            style={styles.todayBtn}
          />
          <NeoButton
            title="Pilih Tanggal Ini"
            variant="primary"
            size="md"
            onPress={handleConfirm}
            style={styles.confirmBtn}
          />
        </View>
      }
    >
      <View style={styles.container}>
        {/* Month & Year Navigation Header */}
        <View style={styles.navRow}>
          <Pressable
            onPress={handlePrevMonth}
            style={({ pressed }) => [
              styles.navBtn,
              { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>

          <View style={styles.monthTitleBox}>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {MONTHS_FULL[viewMonth]} {viewYear}
            </Text>
          </View>

          <Pressable
            onPress={handleNextMonth}
            style={({ pressed }) => [
              styles.navBtn,
              { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>

        {/* Days of Week Header */}
        <View style={styles.weekHeader}>
          {DAYS_SHORT.map((day, idx) => (
            <Text
              key={idx}
              style={[
                styles.weekDayText,
                { color: idx === 0 ? colors.expense : colors.textMuted },
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.grid}>
          {calendarDays.map((item, idx) => {
            const isSelected = isSameDay(item.date, tempDate);
            const isCurrent = isToday(item.date);

            return (
              <Pressable
                key={idx}
                onPress={() => {
                  setTempDate(item.date);
                  if (!item.isCurrentMonth) {
                    setViewMonth(item.date.getMonth());
                    setViewYear(item.date.getFullYear());
                  }
                }}
                style={({ pressed }) => [
                  styles.dayCell,
                  isSelected && [
                    styles.dayCellSelected,
                    { backgroundColor: colors.primary },
                  ],
                  isCurrent && !isSelected && [
                    styles.dayCellToday,
                    { borderColor: colors.primary },
                  ],
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : item.isCurrentMonth
                        ? colors.text
                        : colors.textSubtle,
                      fontWeight: isSelected ? '800' : isCurrent ? '800' : '500',
                    },
                  ]}
                >
                  {item.day}
                </Text>
                {isCurrent && (
                  <View
                    style={[
                      styles.todayDot,
                      { backgroundColor: isSelected ? '#FFFFFF' : colors.primary },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  monthTitleBox: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekDayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellToday: {
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 13,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  todayBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1.8,
  },
});

export default CalendarDatePickerModal;
