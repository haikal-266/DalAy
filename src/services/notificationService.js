import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { getRandomSurahAyah } from '../utils/surahData';

const SETTINGS_KEY = '@dalay_reminder_settings';
const CHANNEL_ID = 'dalay-quran-reminders-v3';
const LEGACY_CHANNELS = ['quranku-reminder', 'dalay-reminder', 'dalay-reminder-v2'];

// Detect if running inside Expo Go client on Android/iOS
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment?.StoreClient ||
  Constants?.appOwnership === 'expo';

/**
 * Safe dynamic module getter
 * Loads expo-notifications on mobile devices (including Expo Go for local notifications).
 *
 * NOTE: In Expo Go SDK 53+, importing root 'expo-notifications' executes
 * DevicePushTokenAutoRegistration.fx which throws an error on Android.
 * Importing the local notification submodules directly bypasses that push-token check
 * and enables local scheduled notifications to work seamlessly in Expo Go.
 */
export const getNotificationModule = () => {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    const { scheduleNotificationAsync } = require('expo-notifications/build/scheduleNotificationAsync');
    const { setNotificationHandler } = require('expo-notifications/build/NotificationsHandler');
    const { getPermissionsAsync, requestPermissionsAsync } = require('expo-notifications/build/NotificationPermissions');
    const { setNotificationChannelAsync } = require('expo-notifications/build/setNotificationChannelAsync');
    const { deleteNotificationChannelAsync } = require('expo-notifications/build/deleteNotificationChannelAsync');
    const { cancelAllScheduledNotificationsAsync } = require('expo-notifications/build/cancelAllScheduledNotificationsAsync');
    const { dismissAllNotificationsAsync } = require('expo-notifications/build/dismissAllNotificationsAsync');
    const { addNotificationResponseReceivedListener } = require('expo-notifications/build/NotificationsEmitter');
    const { AndroidImportance } = require('expo-notifications/build/NotificationChannelManager.types');
    const { AndroidNotificationPriority, SchedulableTriggerInputTypes } = require('expo-notifications/build/Notifications.types');

    return {
      scheduleNotificationAsync,
      setNotificationHandler,
      getPermissionsAsync,
      requestPermissionsAsync,
      setNotificationChannelAsync,
      deleteNotificationChannelAsync,
      cancelAllScheduledNotificationsAsync,
      dismissAllNotificationsAsync,
      addNotificationResponseReceivedListener,
      AndroidImportance: AndroidImportance || { HIGH: 4, DEFAULT: 3 },
      AndroidNotificationPriority: AndroidNotificationPriority || { HIGH: 'high', DEFAULT: 'default' },
      SchedulableTriggerInputTypes,
    };
  } catch (subErr) {
    try {
      return require('expo-notifications');
    } catch (rootErr) {
      console.log('expo-notifications not available:', rootErr?.message || subErr?.message);
      return null;
    }
  }
};

// Safe top-level configuration for foreground notification presentation
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
  { id: '1h', label: 'Setiap 1 Jam', labelEn: 'Every 1 Hour', seconds: 3600, minutes: 60, slots: 24 },
  { id: '2h', label: 'Setiap 2 Jam', labelEn: 'Every 2 Hours', seconds: 7200, minutes: 120, slots: 24 },
  { id: '4h', label: 'Setiap 4 Jam', labelEn: 'Every 4 Hours', seconds: 14400, minutes: 240, slots: 24 },
  { id: '6h', label: 'Setiap 6 Jam', labelEn: 'Every 6 Hours', seconds: 21600, minutes: 360, slots: 20 },
  { id: '12h', label: 'Setiap 12 Jam', labelEn: 'Every 12 Hours', seconds: 43200, minutes: 720, slots: 20 },
  { id: '24h', label: '1x Sehari (Harian)', labelEn: 'Once a Day (Daily)', seconds: 86400, minutes: 1440, slots: 30 },
];

/**
 * Curated pool of inspiring, comforting, and beloved Quranic verses
 * Each verse has its surah number, Latin name, ayah number, and short reflection
 */
export const INSPIRING_AYAT_POOL = [
  {
    surahNumber: 2,
    surahName: 'Al-Baqarah',
    ayah: 286,
    quoteId: 'Allah tidak membebani seseorang melainkan sesuai dengan kesanggupannya.',
    quoteEn: 'Allah does not burden a soul beyond that it can bear.',
  },
  {
    surahNumber: 2,
    surahName: 'Al-Baqarah',
    ayah: 186,
    quoteId: 'Aku dekat. Aku mengabulkan doa orang yang memohon apabila dia berdoa kepada-Ku.',
    quoteEn: 'Indeed I am near. I respond to the invocations of the supplicant.',
  },
  {
    surahNumber: 2,
    surahName: 'Al-Baqarah',
    ayah: 152,
    quoteId: 'Maka ingatlah kepada-Ku, niscaya Aku ingat kepadamu.',
    quoteEn: 'So remember Me; I will remember you.',
  },
  {
    surahNumber: 3,
    surahName: "Ali 'Imran",
    ayah: 139,
    quoteId: 'Janganlah kamu bersedih hati, sungguh kamulah orang yang unggul jika kamu beriman.',
    quoteEn: 'Do not grieve, for you will overcome if you are truly believers.',
  },
  {
    surahNumber: 3,
    surahName: "Ali 'Imran",
    ayah: 159,
    quoteId: 'Apabila engkau telah membulatkan tekad, bertawakallah kepada Allah.',
    quoteEn: 'When you have decided, then put your trust in Allah.',
  },
  {
    surahNumber: 13,
    surahName: "Ar-Ra'd",
    ayah: 28,
    quoteId: 'Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.',
    quoteEn: 'Unquestionably, by the remembrance of Allah hearts are assured.',
  },
  {
    surahNumber: 14,
    surahName: 'Ibrahim',
    ayah: 7,
    quoteId: 'Jika kamu bersyukur, pasti Kami akan menambah nikmat kepadamu.',
    quoteEn: 'If you are grateful, I will surely increase you in favor.',
  },
  {
    surahNumber: 20,
    surahName: 'Taha',
    ayah: 46,
    quoteId: 'Janganlah khawatir, sesungguhnya Aku bersamamu, Aku mendengar dan melihat.',
    quoteEn: 'Fear not. Indeed, I am with you; I hear and I see.',
  },
  {
    surahNumber: 21,
    surahName: "Al-Anbiya'",
    ayah: 87,
    quoteId: 'Tidak ada tuhan selain Engkau, Mahasuci Engkau, sungguh aku termasuk orang zalim.',
    quoteEn: 'There is no deity except You; exalted are You. Indeed, I was of the wrongdoers.',
  },
  {
    surahNumber: 25,
    surahName: 'Al-Furqan',
    ayah: 74,
    quoteId: 'Ya Tuhan kami, jadikanlah pasangan & keturunan kami sebagai penyejuk hati.',
    quoteEn: 'Our Lord, grant us comfort to our eyes from our wives and offspring.',
  },
  {
    surahNumber: 39,
    surahName: 'Az-Zumar',
    ayah: 53,
    quoteId: 'Janganlah berputus asa dari rahmat Allah. Sungguh Allah mengampuni segala dosa.',
    quoteEn: 'Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.',
  },
  {
    surahNumber: 65,
    surahName: 'At-Talaq',
    ayah: 3,
    quoteId: 'Barangsiapa bertawakal kepada Allah, niscaya Allah akan mencukupkan keperluannya.',
    quoteEn: 'Whoever relies upon Allah - then He is sufficient for him.',
  },
  {
    surahNumber: 94,
    surahName: 'Asy-Syarh',
    ayah: 5,
    quoteId: 'Maka sesungguhnya bersama kesulitan ada kemudahan.',
    quoteEn: 'For indeed, with hardship [will be] ease.',
  },
  {
    surahNumber: 94,
    surahName: 'Asy-Syarh',
    ayah: 6,
    quoteId: 'Sesungguhnya bersama kesulitan selalu ada kemudahan.',
    quoteEn: 'Indeed, with hardship [will be] ease.',
  },
  {
    surahNumber: 93,
    surahName: 'Ad-Duha',
    ayah: 3,
    quoteId: 'Tuhanmu tidak meninggalkan engkau dan tidak pula membencimu.',
    quoteEn: 'Your Lord has not forsaken you, nor has He detested you.',
  },
  {
    surahNumber: 93,
    surahName: 'Ad-Duha',
    ayah: 4,
    quoteId: 'Dan sungguh, yang kemudian itu lebih baik bagimu daripada yang permulaan.',
    quoteEn: 'And the Hereafter is better for you than the first life.',
  },
  {
    surahNumber: 18,
    surahName: 'Al-Kahf',
    ayah: 10,
    quoteId: 'Ya Tuhan kami, berikanlah rahmat kepada kami dari sisi-Mu dan petunjuk lurus.',
    quoteEn: 'Our Lord, grant us from Yourself mercy and prepare right guidance for us.',
  },
  {
    surahNumber: 24,
    surahName: 'An-Nur',
    ayah: 35,
    quoteId: 'Allah adalah cahaya langit dan bumi.',
    quoteEn: 'Allah is the Light of the heavens and the earth.',
  },
  {
    surahNumber: 67,
    surahName: 'Al-Mulk',
    ayah: 15,
    quoteId: 'Dialah yang menjadikan bumi mudah untukmu, maka berjalanlah di segala penjurunya.',
    quoteEn: 'It is He who made the earth tame for you - so walk among its slopes.',
  },
  {
    surahNumber: 55,
    surahName: 'Ar-Rahman',
    ayah: 13,
    quoteId: 'Maka nikmat Tuhanmu yang manakah yang kamu dustakan?',
    quoteEn: 'So which of the favors of your Lord would you deny?',
  },
  {
    surahNumber: 2,
    surahName: 'Al-Baqarah',
    ayah: 45,
    quoteId: 'Jadikanlah sabar dan salat sebagai penolongmu.',
    quoteEn: 'And seek help through patience and prayer.',
  },
  {
    surahNumber: 10,
    surahName: 'Yunus',
    ayah: 57,
    quoteId: 'Telah datang kepadamu pelajaran dari Tuhanmu dan penyembuh bagi penyakit di dada.',
    quoteEn: 'There has come to you advice from your Lord and healing for what is in hearts.',
  },
  {
    surahNumber: 17,
    surahName: "Al-Isra'",
    ayah: 82,
    quoteId: 'Dan Kami turunkan dari Al-Quran suatu yang menjadi penawar dan rahmat.',
    quoteEn: 'And We send down of the Quran that which is healing and mercy.',
  },
  {
    surahNumber: 50,
    surahName: 'Qaf',
    ayah: 16,
    quoteId: 'Dan Kami lebih dekat kepadanya daripada urat lehernya.',
    quoteEn: 'And We are closer to him than his jugular vein.',
  },
  {
    surahNumber: 57,
    surahName: 'Al-Hadid',
    ayah: 4,
    quoteId: 'Dan Dia bersama kamu di mana saja kamu berada.',
    quoteEn: 'And He is with you wherever you are.',
  },
  {
    surahNumber: 35,
    surahName: 'Fatir',
    ayah: 34,
    quoteId: 'Segala puji bagi Allah yang telah menghilangkan kesedihan dari kami.',
    quoteEn: 'Praise to Allah, who has removed from us all sorrow.',
  },
  {
    surahNumber: 23,
    surahName: "Al-Mu'minun",
    ayah: 118,
    quoteId: 'Ya Tuhanku, berilah ampunan dan rahmat, Engkau sebaik-baik pemberi rahmat.',
    quoteEn: 'My Lord, forgive and have mercy, and You are the best of the merciful.',
  },
  {
    surahNumber: 103,
    surahName: "Al-'Asr",
    ayah: 3,
    quoteId: 'Saling menasihati untuk kebenaran dan saling menasihati untuk kesabaran.',
    quoteEn: 'Advise each other to truth and advise each other to patience.',
  },
  {
    surahNumber: 112,
    surahName: 'Al-Ikhlas',
    ayah: 1,
    quoteId: 'Katakanlah (Muhammad), Dialah Allah, Yang Maha Esa.',
    quoteEn: 'Say, He is Allah, the One and Only.',
  },
  {
    surahNumber: 28,
    surahName: 'Al-Qasas',
    ayah: 77,
    quoteId: 'Dan carilah pada apa yang dianugerahkan Allah kepadamu kebahagiaan akhirat.',
    quoteEn: 'Seek the home of the Hereafter through that which Allah has given you.',
  },
];

/**
 * Get a shuffled sequence of distinct verses to avoid duplicate notifications
 */
export const getDistinctAyatSequence = (count = 24) => {
  // Fisher-Yates shuffle on a copy of curated verses
  const shuffled = [...INSPIRING_AYAT_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // If more slots needed than pool size, fill with unique random surah/ayah
  const results = [...shuffled];
  while (results.length < count) {
    const rand = getRandomSurahAyah();
    results.push({
      surahNumber: rand.surah,
      surahName: rand.surahInfo?.name_latin || `Surah ${rand.surah}`,
      ayah: rand.ayah,
      quoteId: 'Ada pesan penuh hikmah untukmu. Ketuk untuk menyimak ayat ini.',
      quoteEn: 'A heartfelt reflection awaits you. Tap to read this verse.',
    });
  }

  return results.slice(0, count);
};

/**
 * Purge all legacy repeating alarms and notification channels from older versions
 */
export const purgeAllLegacyReminders = async () => {
  const Notifications = getNotificationModule();
  if (!Notifications) return;

  try {
    if (typeof Notifications.cancelAllScheduledNotificationsAsync === 'function') {
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
    }
    if (typeof Notifications.dismissAllNotificationsAsync === 'function') {
      await Notifications.dismissAllNotificationsAsync().catch(() => {});
    }

    if (Platform.OS === 'android' && typeof Notifications.deleteNotificationChannelAsync === 'function') {
      for (const ch of LEGACY_CHANNELS) {
        try {
          await Notifications.deleteNotificationChannelAsync(ch);
        } catch (e) {}
      }
    }
  } catch (err) {
    console.log('purgeAllLegacyReminders error:', err);
  }
};

/**
 * Request notification permissions and register channel
 */
export const requestNotificationPermission = async () => {
  const Notifications = getNotificationModule();
  if (!Notifications) {
    return false;
  }

  try {
    // Ensure foreground presentation handler is active
    if (typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }

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
          enableVibrate: true,
          showBadge: true,
        });
      } catch (err) {}
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.log('Error requesting notification permission:', error);
    return false;
  }
};

let currentSchedulingSession = 0;
let lastSyncedLanguage = null;
let lastSyncedInterval = null;

/**
 * Schedule a fresh batch of DISTINCT Quran reminders
 * Each upcoming notification in the batch has a DIFFERENT Surah and Ayah!
 */
export const scheduleQuranReminder = async (intervalId = '4h', lang = 'id') => {
  const Notifications = getNotificationModule();
  const selectedInterval =
    REMINDER_INTERVALS.find((i) => i.id === intervalId) || REMINDER_INTERVALS[2];

  const thisSession = ++currentSchedulingSession;

  try {
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

      // Purge old schedules and stale Android repeating alarms
      await purgeAllLegacyReminders();

      // If another schedule request arrived while purging, abort immediately
      if (thisSession !== currentSchedulingSession) {
        return { success: false, aborted: true };
      }

      const isIndo = lang === 'id';
      const numSlots = selectedInterval.slots || 24;
      const sequence = getDistinctAyatSequence(numSlots);

      // Schedule individual one-shot timers into the future
      for (let i = 0; i < sequence.length; i++) {
        if (thisSession !== currentSchedulingSession) {
          return { success: false, aborted: true };
        }

        const item = sequence[i];
        const delaySeconds = selectedInterval.seconds * (i + 1);

        const title = isIndo
          ? `Ayat Hari Ini: ${item.surahName} : ${item.ayah}`
          : `Daily Ayah: ${item.surahName} : ${item.ayah}`;

        const body = isIndo
          ? `"${item.quoteId}" (Ketuk untuk membaca)`
          : `"${item.quoteEn}" (Tap to read & reflect)`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: {
              type: 'daily_ayah',
              surah: item.surahNumber,
              ayah: item.ayah,
            },
            sound: true,
            channelId: CHANNEL_ID,
          },
          trigger: {
            type: 'timeInterval',
            seconds: delaySeconds,
            repeats: false,
            channelId: CHANNEL_ID,
          },
        });
      }
    }

    // Save settings
    const settings = {
      enabled: true,
      intervalId,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    return {
      success: true,
      interval: selectedInterval,
      isExpoGo,
    };
  } catch (error) {
    console.log('Error scheduling notification batch:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Cancel all active reminders
 */
export const cancelAllReminders = async () => {
  try {
    ++currentSchedulingSession;
    lastSyncedLanguage = null;
    lastSyncedInterval = null;
    await purgeAllLegacyReminders();

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
 * Trigger immediate test notification with a fresh random inspiring verse
 */
export const triggerTestNotification = async (lang = 'id') => {
  const Notifications = getNotificationModule();
  const isIndo = lang === 'id';
  const randIndex = Math.floor(Math.random() * INSPIRING_AYAT_POOL.length);
  const item = INSPIRING_AYAT_POOL[randIndex];

  try {
    if (!Notifications) {
      return {
        success: false,
        message: isIndo
          ? 'Modul notifikasi tidak tersedia di platform web.'
          : 'Notification module is not available on web.',
      };
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return {
        success: false,
        message: isIndo
          ? 'Izin notifikasi diperlukan. Silakan aktifkan izin notifikasi DalAy di Pengaturan HP Anda.'
          : 'Notification permission is required. Please enable DalAy notification permission in device settings.',
      };
    }

    const title = isIndo
      ? `Ayat Hari Ini: ${item.surahName} : ${item.ayah}`
      : `Daily Ayah: ${item.surahName} : ${item.ayah}`;

    const body = isIndo
      ? `"${item.quoteId}" (Ketuk untuk membaca & merenungkan)`
      : `"${item.quoteEn}" (Tap to read & reflect)`;

    // Ensure Android channel exists before presenting
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'DalAy Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0D9488',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      } catch (err) {}
    }

    // Ensure foreground presentation handler is active
    if (typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }

    // Immediate notification: trigger: null presents instantly
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'daily_ayah',
          surah: item.surahNumber,
          ayah: item.ayah,
        },
        sound: true,
        channelId: CHANNEL_ID,
        priority: Notifications.AndroidNotificationPriority ? Notifications.AndroidNotificationPriority.HIGH : undefined,
      },
      trigger: null,
    });

    return {
      success: true,
      notificationId,
      surahInfo: { name_latin: item.surahName, number: item.surahNumber },
      ayah: item.ayah,
      messageTitle: title,
      messageBody: isIndo ? item.quoteId : item.quoteEn,
    };
  } catch (error) {
    console.log('Test notification error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send an immediate push notification to device
 */
export const sendLocalNotification = async ({ title, body, data = {} }) => {
  const Notifications = getNotificationModule();
  if (!Notifications) return false;
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return false;

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'DalAy Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0D9488',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
      } catch (err) {}
    }

    if (typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        channelId: CHANNEL_ID,
        priority: Notifications.AndroidNotificationPriority ? Notifications.AndroidNotificationPriority.HIGH : undefined,
      },
      trigger: null,
    });
    return true;
  } catch (err) {
    console.log('Error sending local notification:', err);
    return false;
  }
};


/**
 * Sync / replenish reminders on app startup
 * Ensures legacy repeating alarms from previous versions are purged,
 * and if reminder is enabled, tops up the schedule with fresh unique verses.
 */
export const initNotificationSync = async (lang = 'id', force = false) => {
  try {
    const Notifications = getNotificationModule();
    if (!Notifications) return;

    const settings = await getReminderSettings();
    if (settings.enabled) {
      if (!force && lastSyncedLanguage === lang && lastSyncedInterval === settings.intervalId) {
        return;
      }
      lastSyncedLanguage = lang;
      lastSyncedInterval = settings.intervalId || '4h';
      await scheduleQuranReminder(settings.intervalId || '4h', lang);
    } else {
      await purgeAllLegacyReminders();
    }
  } catch (err) {
    console.log('initNotificationSync error:', err);
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
  INSPIRING_AYAT_POOL,
  getDistinctAyatSequence,
  requestNotificationPermission,
  scheduleQuranReminder,
  cancelAllReminders,
  triggerTestNotification,
  initNotificationSync,
  getReminderSettings,
};
