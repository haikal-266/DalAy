import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
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

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    const settings = await getReminderSettings();
    setIsEnabled(settings.enabled);
    setSelectedInterval(settings.intervalId || '4h');
  };

  const handleToggleReminder = async (val) => {
    setIsEnabled(val);
    if (val) {
      const res = await scheduleQuranReminder(selectedInterval);
      if (!res.success) {
        Alert.alert('Perhatian', res.message || 'Gagal mengaktifkan pengingat.');
        setIsEnabled(false);
      }
    } else {
      await cancelAllReminders();
    }
  };

  const handleSelectInterval = async (intervalId) => {
    setSelectedInterval(intervalId);
    if (isEnabled) {
      await scheduleQuranReminder(intervalId);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    const res = await triggerTestNotification();
    setTesting(false);
    if (res.success) {
      Alert.alert(
        'Notifikasi Terkirim!',
        `Notifikasi contoh ayat QS. ${res.surahInfo.name_latin} : ${res.ayah} telah dikirim ke perangkat Anda.`
      );
    } else {
      Alert.alert('Gagal Mengirim', res.message || 'Izin notifikasi belum diaktifkan.');
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
