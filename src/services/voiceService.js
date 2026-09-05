import { requireOptionalNativeModule, isRunningInExpoGo } from 'expo';

/**
 * DalAy Voice & Speech Recognition Service
 * Wraps expo-speech-recognition with safety checks, Expo Go detection, and permissions.
 */

export const isExpoGoEnv = typeof isRunningInExpoGo === 'function' ? isRunningInExpoGo() : false;

let nativeSpeechModule = null;
try {
  if (!isExpoGoEnv && typeof requireOptionalNativeModule === 'function') {
    nativeSpeechModule = requireOptionalNativeModule('ExpoSpeechRecognition');
  }
} catch (err) {
  nativeSpeechModule = null;
}

export const VoiceService = {
  /**
   * Check if speech recognition is supported on the current device / runtime
   */
  isAvailable: async () => {
    try {
      if (isExpoGoEnv || !nativeSpeechModule) return false;
      if (typeof nativeSpeechModule.isRecognitionAvailable === 'function') {
        return Boolean(nativeSpeechModule.isRecognitionAvailable());
      }
      return true;
    } catch (e) {
      console.warn('[VoiceService] isAvailable check failed:', e);
      return false;
    }
  },

  /**
   * Check if running in Expo Go (which does not include custom native modules)
   */
  isExpoGo: () => isExpoGoEnv || !nativeSpeechModule,

  /**
   * Check current microphone and speech recognition permissions
   */
  getPermissions: async () => {
    try {
      if (!nativeSpeechModule?.getPermissionsAsync) {
        return { granted: false, canAskAgain: true };
      }
      return await nativeSpeechModule.getPermissionsAsync();
    } catch (e) {
      console.warn('[VoiceService] getPermissions error:', e);
      return { granted: false, canAskAgain: true };
    }
  },

  /**
   * Request microphone and speech recognition permissions
   */
  requestPermissions: async () => {
    try {
      if (!nativeSpeechModule?.requestPermissionsAsync) {
        return { granted: false, canAskAgain: false };
      }
      return await nativeSpeechModule.requestPermissionsAsync();
    } catch (e) {
      console.warn('[VoiceService] requestPermissions error:', e);
      return { granted: false, canAskAgain: false };
    }
  },

  /**
   * Get supported speech recognition locales
   */
  getSupportedLocales: async () => {
    try {
      if (typeof nativeSpeechModule?.getSupportedLocales === 'function') {
        const res = await nativeSpeechModule.getSupportedLocales();
        return res?.locales || ['id-ID', 'en-US'];
      }
      return ['id-ID', 'en-US'];
    } catch {
      return ['id-ID', 'en-US'];
    }
  },

  /**
   * Start speech recognition
   */
  start: async ({
    lang = 'id-ID',
    interimResults = true,
    continuous = true,
    contextualStrings = [
      'pemasukan',
      'pengeluaran',
      'uang masuk',
      'uang keluar',
      'masuk',
      'keluar',
      'makan',
      'bensin',
      'kopi',
      'gaji',
      'freelance',
      'bonus',
      'proyek',
      'belanja',
      'ribu',
      'juta',
      'rb',
      'k',
      'jt',
      'rupiah',
      'sarapan',
      'makan siang',
      'makan malam',
      'pulsa',
      'listrik',
      'parkir',
      'sedekah',
      'infak',
      'zakat',
    ],
  } = {}) => {
    if (isExpoGoEnv || !nativeSpeechModule) {
      throw new Error('EXPO_GO_UNSUPPORTED');
    }

    const perm = await VoiceService.requestPermissions();
    if (!perm.granted) {
      throw new Error('PERMISSION_DENIED');
    }

    try {
      // Abort any existing active recognition before starting
      try {
        nativeSpeechModule.abort?.();
      } catch (_) {
        // ignore if not running
      }

      nativeSpeechModule.start?.({
        lang,
        interimResults,
        continuous: true,
        contextualStrings,
        addsPunctuation: false,
        requiresOnDeviceRecognition: false,
      });

      return { success: true };
    } catch (error) {
      console.error('[VoiceService] start error:', error);
      throw error;
    }
  },

  /**
   * Stop recognition normally
   */
  stop: async () => {
    try {
      if (nativeSpeechModule?.stop) {
        nativeSpeechModule.stop();
      }
    } catch (e) {
      console.warn('[VoiceService] stop error:', e);
    }
  },

  /**
   * Abort recognition immediately
   */
  abort: async () => {
    try {
      if (nativeSpeechModule?.abort) {
        nativeSpeechModule.abort();
      }
    } catch (e) {
      console.warn('[VoiceService] abort error:', e);
    }
  },

  /**
   * Get current native recognition state
   */
  getState: async () => {
    try {
      if (nativeSpeechModule?.getStateAsync) {
        return await nativeSpeechModule.getStateAsync();
      }
      return 'inactive';
    } catch {
      return 'inactive';
    }
  },

  /**
   * Get raw native module instance if available
   */
  getNativeModule: () => nativeSpeechModule,
};

export default VoiceService;
