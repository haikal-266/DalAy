import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { NeoCard } from '../neo/NeoCard';
import { useTheme } from '../../stores/themeStore';
import {
  REMINDER_INTERVALS,
  scheduleQuranReminder,
  cancelAllReminders,
  triggerTestNotification,
  getReminderSettings,
} from '../../services/notificationService';

export const ReminderModal = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState('4h');
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', title, message }

  useEffect(() => {
    if (visible) {
      loadSettings();
      setFeedback(null);
    }
  }, [visible]);

  const loadSettings = async () => {
    const settings = await getReminderSettings();
    setIsEnabled(settings.enabled);
    setSelectedInterval(settings.intervalId || '4h');
  };

  const showFeedback = (type, title, message) => {
    setFeedback({ type, title, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const handleToggleReminder = async (val) => {
    setIsEnabled(val);
    if (val) {
      const res = await scheduleQuranReminder(selectedInterval);
      if (res.success) {
        showFeedback(
          'success',
          'Pengingat Aktif',
          `Notifikasi ayat akan dikirim secara berkala (${res.interval?.label || selectedInterval}).`
        );
      } else {
        setIsEnabled(false);
        showFeedback('error', 'Gagal Mengaktifkan', res.message || 'Izin notifikasi belum diaktifkan di HP.');
      }
    } else {
      await cancelAllReminders();
      showFeedback('success', 'Pengingat Dinonaktifkan', 'Notifikasi terjadwal telah dihentikan.');
    }
  };

  const handleSelectInterval = async (intervalId) => {
    setSelectedInterval(intervalId);
    if (isEnabled) {
      const res = await scheduleQuranReminder(intervalId);
      if (res.success) {
        showFeedback(
          'success',
          'Jadwal Diperbarui',
          `Frekuensi pengingat diubah ke ${res.interval?.label || intervalId}.`
        );
      }
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    const res = await triggerTestNotification();
    setTesting(false);
    if (res.success) {
      showFeedback(
        'success',
        'Notifikasi Contoh Terkirim!',
        `Ayat QS. ${res.surahInfo.name_latin} : ${res.ayah} telah dikirim ke status bar HP Anda.`
      );
    } else {
      showFeedback('error', 'Gagal Mengirim', res.message || 'Izin notifikasi belum aktif.');
    }
  };

  return (
    <NeoModal
      visible={visible}
      onClose={onClose}
      title="Pengingat Ayat Terjadwal"
      subtitle="Jadwalkan notifikasi ayat Al-Quran berkala di HP Anda"
      footer={
        <NeoButton
          title="Tutup Pengaturan"
          variant="secondary"
          onPress={onClose}
          fullWidth
        />
      }
    >
      {/* Custom In-App Notification / Feedback Banner */}
      {feedback && (
        <View
          style={[
            styles.feedbackBanner,
            {
              backgroundColor:
                feedback.type === 'success' ? colors.incomeLight : colors.expenseLight,
              borderColor:
                feedback.type === 'success' ? colors.incomeBorder : colors.expenseBorder,
            },
          ]}
        >
          <Ionicons
            name={
              feedback.type === 'success'
                ? 'checkmark-circle'
                : 'alert-circle'
            }
            size={20}
            color={
              feedback.type === 'success' ? colors.incomeDark : colors.expenseDark
            }
            style={styles.feedbackIcon}
          />
          <View style={styles.feedbackTextContainer}>
            <Text
              style={[
                styles.feedbackTitle,
                {
                  color:
                    feedback.type === 'success'
                      ? colors.incomeDark
                      : colors.expenseDark,
                },
              ]}
            >
              {feedback.title}
            </Text>
            <Text
              style={[
                styles.feedbackMessage,
                {
                  color:
                    feedback.type === 'success'
                      ? colors.incomeDark
                      : colors.expenseDark,
                },
              ]}
            >
              {feedback.message}
            </Text>
          </View>
          <Pressable onPress={() => setFeedback(null)}>
            <Ionicons
              name="close"
              size={16}
              color={
                feedback.type === 'success'
                  ? colors.incomeDark
                  : colors.expenseDark
              }
            />
          </Pressable>
        </View>
      )}

      {/* Switch Card */}
      <NeoCard variant="accent" padding={14} style={styles.switchCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <View style={styles.switchTitleRow}>
              <Ionicons name="notifications" size={18} color={colors.primaryDark} />
              <Text style={[styles.switchTitle, { color: colors.primaryDark }]}>
                Aktifkan Pengingat
              </Text>
            </View>
            <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
              {isEnabled
                ? 'Notifikasi lokal akan berjalan otomatis di background'
                : 'Pengingat berkala saat ini dinonaktifkan'}
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggleReminder}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isEnabled ? colors.primary : colors.textMuted}
          />
        </View>
      </NeoCard>

      {/* Interval Selector */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        PILIH FREKUENSI PENGINGAT :
      </Text>

      <View style={styles.intervalGrid}>
        {REMINDER_INTERVALS.map((item) => {
          const isSelected = selectedInterval === item.id;
          return (
            <NeoCard
              key={item.id}
              variant={isSelected ? 'accent' : 'white'}
              padding={12}
              onPress={() => handleSelectInterval(item.id)}
              style={[
                styles.intervalCard,
                isSelected && styles.selectedIntervalCard,
              ]}
            >
              <View style={styles.intervalContent}>
                <View style={styles.intervalLeft}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={isSelected ? colors.primaryDark : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.intervalLabel,
                      {
                        color: isSelected ? colors.primaryDark : colors.text,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.primaryDark} />
                )}
              </View>
            </NeoCard>
          );
        })}
      </View>

      {/* Test Notification Action */}
      <View style={styles.testSection}>
        <Text style={[styles.testHint, { color: colors.textSecondary }]}>
          Ingin mencoba memeriksa tampilan notifikasi di status bar HP sekarang?
        </Text>
        <NeoButton
          title="Kirim Notifikasi Tes Sekarang"
          iconName="send-outline"
          variant="secondary"
          size="md"
          loading={testing}
          onPress={handleTestNotification}
          fullWidth
        />
      </View>
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  feedbackIcon: {
    marginRight: 8,
  },
  feedbackTextContainer: {
    flex: 1,
    marginRight: 6,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  feedbackMessage: {
    fontSize: 11,
    marginTop: 1,
  },
  switchCard: {
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  switchSub: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  intervalGrid: {
    gap: 4,
  },
  intervalCard: {
    marginVertical: 3,
  },
  selectedIntervalCard: {
    borderWidth: 1.5,
  },
  intervalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intervalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intervalLabel: {
    fontSize: TYPOGRAPHY.size.xs,
  },
  testSection: {
    marginTop: 14,
    paddingTop: 8,
  },
  testHint: {
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default ReminderModal;
