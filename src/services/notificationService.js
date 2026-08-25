import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { getRandomSurahAyah } from '../utils/surahData';

const SETTINGS_KEY = '@dalay_reminder_settings';
const CHANNEL_ID = 'dalay-reminder';

// Detect if running inside Expo Go client on Android/iOS
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment?.StoreClient ||
  Constants?.appOwnership === 'expo';

/**
 * Safe dynamic module getter
 * Prevents Expo Go SDK 53+ Android crash by only loading native module in standalone builds
 */
const getNotificationModule = () => {
  if (Platform.OS === 'web' || isExpoGo) {
    return null;
  }
  try {
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
};

// Safe top-level configuration in standalone builds
try {
  const Notifications = getNotificationModule();
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch (e) {}

export const REMINDER_INTERVALS = [
  { id: '1h', label: 'Setiap 1 Jam', labelEn: 'Every 1 Hour', seconds: 3600, minutes: 60 },
  { id: '2h', label: 'Setiap 2 Jam', labelEn: 'Every 2 Hours', seconds: 7200, minutes: 120 },
  { id: '4h', label: 'Setiap 4 Jam', labelEn: 'Every 4 Hours', seconds: 14400, minutes: 240 },
  { id: '6h', label: 'Setiap 6 Jam', labelEn: 'Every 6 Hours', seconds: 21600, minutes: 360 },
  { id: '12h', label: 'Setiap 12 Jam', labelEn: 'Every 12 Hours', seconds: 43200, minutes: 720 },
  { id: '24h', label: '1x Sehari (Harian)', labelEn: 'Once a Day (Daily)', seconds: 86400, minutes: 1440 },
];

/**
 * Rich randomized pool of warm, inspiring Quran invitation messages
 */
export const INSPIRING_MESSAGES = {
  id: [
    {
      title: '🌟 Waktunya Sejenak Bersama Al-Quran',
      body: 'Ada pesan penuh hikmah untuk harimu. Yuk luangkan 1 menit untuk membaca ayat pilihan hari ini ✨',
    },
    {
      title: '📖 Penenang Hati & Jiwa',
      body: 'Rehat sejenak dari kesibukan. Simak ayat pilihan dan renungkan maknanya hari ini 🌿',
    },
    {
      title: '✨ Cahaya Petunjuk Hari Ini',
      body: 'Awali dan isi harimu dengan petunjuk Al-Quran. Ketuk untuk membuka ayat dan tafsirnya 🤲',
    },
    {
      title: '🌿 Oase Spiritual Untukmu',
      body: 'Segarkan hati dan pikiran dengan firman-Nya. Mari lihat ayat inspiratif hari ini 💫',
    },
    {
      title: '🤲 Renungan Harian Menunggumu',
      body: 'Jangan lewatkan pesan kebaikan hari ini. Buka DalAy untuk menyimak ayat pilihanmu 📖',
    },
    {
      title: '🌸 Rehat Sejenak & Renungkan',
      body: 'Satu ayat bisa mengubah sudut pandang harimu. Ketuk untuk membaca ayat dan terjemahannya ✨',
    },
    {
      title: '🤍 Luangkan Waktu untuk Al-Quran',
      body: 'Mari mendekat kepada firman Allah. Ayat penuh inspirasi telah siap untukmu hari ini 🌙',
    },
    {
      title: '💡 Inspirasi Harian DalAy',
      body: 'Temukan ketenangan dan petunjuk hidup dari Al-Quran hari ini. Ketuk untuk menyimak 🌟',
    },
  ],
  en: [
    {
      title: '🌟 A Moment of Peace with Quran',
      body: 'A heartfelt message is waiting for you today. Take a minute to read and reflect ✨',
    },
    {
      title: '📖 Your Daily Quran Reflection',
      body: 'Pause your busy day and nourish your soul with today’s inspiring verse 🌿',
    },
    {
      title: '✨ Daily Light & Guidance',
      body: 'Enrich your day with timeless wisdom. Tap to read today’s ayah and commentary 🤲',
    },
    {
      title: '🌿 Spiritual Oasis for You',
      body: 'Refresh your mind and heart with Allah’s words. Check out today’s inspiring verse 💫',
    },
    {
      title: '🤲 Daily Wisdom Awaits You',
      body: 'Don’t miss today’s reminder of goodness. Open DalAy to reflect on the verse 📖',
    },
    {
      title: '🌸 Pause & Reflect',
      body: 'A single verse can bring tranquility to your entire day. Tap to read now ✨',
    },
    {
      title: '🤍 A Timeless Reminder',
      body: 'Find peace and clarity in the Quran today. Tap to discover your daily ayah 🌙',
    },
    {
      title: '💡 DalAy Daily Inspiration',
      body: 'Discover solace and guidance from the Holy Quran today. Tap to explore 🌟',
    },
  ],
};

export const getRandomNotificationMessage = (lang = 'en') => {
  const pool = INSPIRING_MESSAGES[lang] || INSPIRING_MESSAGES.en;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};

/**
 * Request notification permissions and register notification channel
 */
export const requestNotificationPermission = async () => {
  const Notifications = getNotificationModule();
  if (!Notifications) {
    return true; // Graceful simulation in Expo Go & Web
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'DalAy Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0D9488',
          sound: 'default',
        });
      } catch (err) {}
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.log('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Schedule recurring Quran Reminder with randomized inspiring call-to-action
 */
export const scheduleQuranReminder = async (intervalId = '4h', lang = 'en') => {
  const Notifications = getNotificationModule();
  const selectedInterval =
    REMINDER_INTERVALS.find((i) => i.id === intervalId) || REMINDER_INTERVALS[2];

  try {
    let notificationId = `remind_${Date.now()}`;

    if (Notifications) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return {
          success: false,
          message: lang === 'id'
            ? 'Izin notifikasi belum diaktifkan di HP Anda.'
            : 'Notification permission is not enabled on your device.',
        };
      }

      // Cancel all previous scheduled notifications first
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (e) {}

      const { surah, ayah } = getRandomSurahAyah();
      const msg = getRandomNotificationMessage(lang);

      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          data: {
            type: 'daily_ayah',
            surah,
            ayah,
          },
          sound: true,
          channelId: CHANNEL_ID,
        },
        trigger: {
          type: 'timeInterval',
          seconds: selectedInterval.seconds,
          repeats: true,
          channelId: CHANNEL_ID,
        },
      });
    }

    // Save settings
    const settings = {
      enabled: true,
      intervalId,
      notificationId,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    return {
      success: true,
      notificationId,
      interval: selectedInterval,
      isExpoGo,
    };
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
    const Notifications = getNotificationModule();
    if (Notifications) {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (e) {}
    }

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
 * Trigger immediate test notification with inspiring invitation
 */
export const triggerTestNotification = async (lang = 'en') => {
  const Notifications = getNotificationModule();
  const { surah, ayah, surahInfo } = getRandomSurahAyah();
  const msg = getRandomNotificationMessage(lang);

  try {
    if (Notifications) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return {
          success: false,
          message: lang === 'id'
            ? 'Izin notifikasi diperlukan. Silakan aktifkan izin notifikasi di Pengaturan HP.'
            : 'Notification permission required. Please enable it in device settings.',
        };
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: msg.title,
          body: msg.body,
          data: {
            type: 'daily_ayah',
            surah,
            ayah,
          },
          sound: true,
          channelId: CHANNEL_ID,
        },
        trigger: {
          type: 'timeInterval',
          seconds: 1,
          repeats: false,
          channelId: CHANNEL_ID,
        },
      });
    }

    return {
      success: true,
      surahInfo,
      ayah,
      messageTitle: msg.title,
      messageBody: msg.body,
      isExpoGo,
    };
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
  } catch (e) {}
  return {
    enabled: false,
    intervalId: '4h',
    notificationId: null,
  };
};

export default {
  REMINDER_INTERVALS,
  INSPIRING_MESSAGES,
  getRandomNotificationMessage,
  requestNotificationPermission,
  scheduleQuranReminder,
  cancelAllReminders,
  triggerTestNotification,
  getReminderSettings,
};
