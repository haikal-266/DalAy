import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { NeoCard } from '../neo/NeoCard';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import {
  REMINDER_INTERVALS,
  scheduleQuranReminder,
  cancelAllReminders,
  triggerTestNotification,
  getReminderSettings,
} from '../../services/notificationService';

export const ReminderModal = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { currentLanguage, isIndonesian, t } = useLanguage();
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
      const res = await scheduleQuranReminder(selectedInterval, currentLanguage);
      if (res.success) {
        showFeedback(
          'success',
          isIndonesian ? 'Pengingat Aktif' : 'Reminder Enabled',
          isIndonesian
            ? `Notifikasi ayat akan dikirim secara berkala (${res.interval?.label || selectedInterval}).`
            : `Ayah reminders will be sent periodically (${res.interval?.labelEn || selectedInterval}).`
        );
      } else {
        setIsEnabled(false);
        showFeedback(
          'error',
          isIndonesian ? 'Gagal Mengaktifkan' : 'Failed to Enable',
          res.message || (isIndonesian ? 'Izin notifikasi belum diaktifkan di HP.' : 'Notification permission not granted.')
        );
      }
    } else {
      await cancelAllReminders();
      showFeedback(
        'success',
        isIndonesian ? 'Pengingat Dinonaktifkan' : 'Reminder Disabled',
        isIndonesian ? 'Notifikasi terjadwal telah dihentikan.' : 'Scheduled notifications stopped.'
      );
    }
  };

  const handleSelectInterval = async (intervalId) => {
    setSelectedInterval(intervalId);
    if (isEnabled) {
      const res = await scheduleQuranReminder(intervalId, currentLanguage);
      if (res.success) {
        showFeedback(
          'success',
          isIndonesian ? 'Jadwal Diperbarui' : 'Schedule Updated',
          isIndonesian
            ? `Frekuensi pengingat diubah ke ${res.interval?.label || intervalId}.`
            : `Reminder frequency updated to ${res.interval?.labelEn || intervalId}.`
        );
      }
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    const res = await triggerTestNotification(currentLanguage);
    setTesting(false);
    if (res.success) {
      showFeedback(
        'success',
        isIndonesian ? 'Notifikasi Contoh Terkirim!' : 'Sample Notification Sent!',
        isIndonesian
          ? `Notifikasi ajakan membaca ayat (${res.surahInfo.name_latin} : ${res.ayah}) telah dikirim ke HP Anda. Ketuk notifikasi untuk langsung membukanya.`
          : `An inspiring reminder (${res.surahInfo.name_latin} : ${res.ayah}) was sent to your device. Tap it to view the verse.`
      );
    } else {
      showFeedback(
        'error',
        isIndonesian ? 'Gagal Mengirim' : 'Failed to Send',
        res.message || (isIndonesian ? 'Izin notifikasi belum aktif.' : 'Notification permission is required.')
      );
    }
  };

  return (
    <NeoModal
      visible={visible}
      onClose={onClose}
      title={isIndonesian ? 'Pengingat Ayat Terjadwal' : 'Scheduled Ayah Reminder'}
      subtitle={isIndonesian ? 'Notifikasi ajakan membaca Al-Quran berkala di HP Anda' : 'Inspiring daily Quran reminders on your phone'}
      footer={
        <NeoButton
          title={testing ? (isIndonesian ? 'Mengirim Notifikasi...' : 'Sending Reminder...') : (isIndonesian ? 'Kirim Notifikasi Contoh' : 'Send Sample Notification')}
          iconName="send-outline"
          variant="secondary"
          loading={testing}
          onPress={handleTestNotification}
          fullWidth
        />
      }
    >
      {/* Floating In-Modal Feedback Alert Banner */}
      {feedback && (
        <View
          style={[
            styles.feedbackBanner,
            {
              backgroundColor:
                feedback.type === 'success'
                  ? colors.incomeLight || '#D1FAE5'
                  : colors.expenseLight || '#FEE2E2',
              borderColor:
                feedback.type === 'success'
                  ? colors.incomeBorder || '#10B981'
                  : colors.expenseBorder || '#EF4444',
            },
          ]}
        >
          <Ionicons
            name={
              feedback.type === 'success'
                ? 'checkmark-circle'
                : 'alert-circle'
            }
            size={18}
            color={
              feedback.type === 'success'
                ? colors.incomeDark || '#059669'
                : colors.expenseDark || '#DC2626'
            }
            style={styles.feedbackIcon}
          />
          <View style={styles.feedbackTexts}>
            <Text
              style={[
                styles.feedbackTitle,
                {
                  color:
                    feedback.type === 'success'
                      ? colors.incomeDark || '#059669'
                      : colors.expenseDark || '#DC2626',
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
                      ? colors.incomeDark || '#059669'
                      : colors.expenseDark || '#DC2626',
                },
              ]}
            >
              {feedback.message}
            </Text>
          </View>
        </View>
      )}

      {/* Main Switch Card */}
      <NeoCard variant="white" padding={14} style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchTexts}>
            <Text style={[styles.switchTitle, { color: colors.text }]}>
              {isIndonesian ? 'Aktifkan Notifikasi Harian' : 'Enable Daily Reminders'}
            </Text>
            <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
              {isEnabled
                ? (isIndonesian ? 'Pengingat aktif mengirim pesan inspiratif' : 'Active and sending inspiring reminders')
                : (isIndonesian ? 'Pengingat otomatis saat ini dinonaktifkan' : 'Automated reminders currently paused')}
            </Text>
          </View>

          <Switch
            value={isEnabled}
            onValueChange={handleToggleReminder}
            trackColor={{
              false: colors.borderLight || '#E2E8F0',
              true: colors.primary,
            }}
            thumbColor="#FFFFFF"
          />
        </View>
      </NeoCard>

      {/* Frequency Interval Grid */}
      <View style={styles.sectionHeader}>
        <Ionicons name="time-outline" size={16} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {isIndonesian ? 'PILIH FREKUENSI PENGINGAT :' : 'SELECT REMINDER FREQUENCY :'}
        </Text>
      </View>

      <View style={styles.intervalGrid}>
        {REMINDER_INTERVALS.map((item) => {
          const isSelected = selectedInterval === item.id;
          const displayLabel = isIndonesian ? item.label : item.labelEn;

          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelectInterval(item.id)}
              style={({ pressed }) => [
                styles.intervalItem,
                {
                  backgroundColor: isSelected
                    ? colors.primarySurface || '#F0FDFA'
                    : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                isSelected && styles.intervalItemSelected,
                pressed && styles.intervalItemPressed,
              ]}
            >
              <View style={styles.intervalLeft}>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.intervalLabel,
                    {
                      color: isSelected ? colors.primaryDark : colors.text,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {displayLabel}
                </Text>
              </View>

              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Helper Info Note */}
      <View
        style={[
          styles.noteBox,
          {
            backgroundColor: colors.surfaceLight,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name="sparkles-outline"
          size={14}
          color={colors.primary}
          style={styles.noteIcon}
        />
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          {isIndonesian
            ? 'Setiap notifikasi berisi pesan ajakan inspiratif yang bervariasi. Mengetuk notifikasi akan langsung membuka ayat dan tafsirnya di aplikasi.'
            : 'Each notification features a unique inspiring message. Tapping the notification will immediately open that specific verse and commentary.'}
        </Text>
      </View>
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  feedbackIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  feedbackTexts: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  feedbackMessage: {
    fontSize: 11,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTexts: {
    flex: 1,
    marginRight: 10,
  },
  switchTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  switchSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  intervalGrid: {
    gap: 6,
    marginBottom: 12,
  },
  intervalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  intervalItemSelected: {
    borderWidth: 1.5,
  },
  intervalItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  intervalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  intervalLabel: {
    fontSize: 12,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  noteIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  noteText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});

export default ReminderModal;
