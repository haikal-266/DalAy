import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { getRandomSurahAyah } from '../utils/surahData';
import { fetchAyah } from './quranApi';

const SETTINGS_KEY = '@quranku_reminder_settings';

// Configure notification behavior safely
try {
  if (Platform.OS !== 'web') {
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch (e) {
  console.log('setNotificationHandler error:', e);
}

export const REMINDER_INTERVALS = [
  { id: '1h', label: 'Setiap 1 Jam', seconds: 3600, minutes: 60 },
  { id: '2h', label: 'Setiap 2 Jam', seconds: 7200, minutes: 120 },
  { id: '4h', label: 'Setiap 4 Jam', seconds: 14400, minutes: 240 },
  { id: '6h', label: 'Setiap 6 Jam', seconds: 21600, minutes: 360 },
  { id: '12h', label: 'Setiap 12 Jam', seconds: 43200, minutes: 720 },
  { id: '24h', label: '1x Sehari (Harian)', seconds: 86400, minutes: 1440 },
];

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async () => {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      try {
        await setNotificationChannelAsync('quranku-reminder', {
          name: 'DalAy Reminders',
          importance: AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0D9488',
          sound: 'default',
        });
      } catch (err) {
        // ignore channel creation errors on web or unsupported devices
      }
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.log('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Schedule recurring Quran Reminder
 */
export const scheduleQuranReminder = async (intervalId = '4h') => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return { success: false, message: 'Izin notifikasi belum diberikan.' };
    }

    // Cancel all previous scheduled notifications first
    try {
      await cancelAllScheduledNotificationsAsync();
    } catch (e) {}

    const selectedInterval =
      REMINDER_INTERVALS.find((i) => i.id === intervalId) || REMINDER_INTERVALS[2];
    const { surah, ayah, surahInfo } = getRandomSurahAyah();

    // Schedule next notification with timer trigger
    const notificationId = await scheduleNotificationAsync({
      content: {
        title: `📖 Ayat Hari Ini: ${surahInfo.name_latin} : ${ayah}`,
        body: `Ketuk untuk membaca & merenungkan ayat Al-Quran.`,
        data: { surah, ayah },
        sound: true,
        channelId: 'quranku-reminder',
      },
      trigger: {
        seconds: selectedInterval.seconds,
        repeats: true,
      },
    });

    // Save settings
    const settings = {
      enabled: true,
      intervalId,
      notificationId,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    return { success: true, notificationId, interval: selectedInterval };
  } catch (error) {
    console.log('Error scheduling notification:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Cancel all active reminders
 */
export const cancelAllReminders = async () => {
  try {
    try {
      await cancelAllScheduledNotificationsAsync();
    } catch (e) {}

    const settings = {
      enabled: false,
      intervalId: '4h',
      notificationId: null,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Trigger immediate test notification
 */
export const triggerTestNotification = async () => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return { success: false, message: 'Izin notifikasi diperlukan.' };
    }

    const { surah, ayah, surahInfo } = getRandomSurahAyah();
    const ayahData = await fetchAyah(surah, ayah);

    await scheduleNotificationAsync({
      content: {
        title: `✨ Pengingat Ayat: QS. ${surahInfo.name_latin} (${surah}:${ayah})`,
        body: ayahData.translation
          ? `"${ayahData.translation.slice(0, 90)}..."`
          : 'Ketuk untuk membaca ayat selengkapnya.',
        data: { surah, ayah },
        sound: true,
        channelId: 'quranku-reminder',
      },
      trigger: null, // trigger immediately
    });

    return { success: true, surahInfo, ayah };
  } catch (error) {
    console.log('Test notification error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get saved reminder settings
 */
export const getReminderSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return {
    enabled: false,
    intervalId: '4h',
    notificationId: null,
  };
};

export default {
  REMINDER_INTERVALS,
  requestNotificationPermission,
  scheduleQuranReminder,
  cancelAllReminders,
  triggerTestNotification,
  getReminderSettings,
};
