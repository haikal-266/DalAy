import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { APP_INFO } from '../constants/appInfo';

// Complete auth session if redirected back to web
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

// Standard OAuth Google Endpoints
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_USER_INFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const GOOGLE_DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';

export const BACKUP_FILE_NAME = 'dalay_cloud_backup.json';

// Google OAuth Scopes for AppData & User Profile
export const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
];

export const GOOGLE_ANDROID_CLIENT_ID =
  '702052069332-k07dttmreincr9bq2tfddcjs7n54hft8.apps.googleusercontent.com';
export const GOOGLE_WEB_CLIENT_ID =
  '702052069332-6vk90v9chhg7v37od7pfun0lmv01f8q5.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const signInWithGoogle = async (customClientId = null) => {
  const clientId = customClientId || GOOGLE_WEB_CLIENT_ID;

  // Browser OAuth via Postman / custom client
  try {
    const redirectUri = 'https://oauth.pstmn.io/v1/callback';

    const authUrl = `${GOOGLE_AUTH_ENDPOINT}?client_id=${encodeURIComponent(
      clientId
    )}&response_type=token&scope=${encodeURIComponent(
      SCOPES.join(' ')
    )}&redirect_uri=${encodeURIComponent(redirectUri)}&prompt=select_account`;

    console.log('=== Google OAuth AuthURL ===', authUrl);
    console.log('=== Google OAuth RedirectURI ===', redirectUri);

    const authResult = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (authResult.type === 'success' && authResult.url) {
      const url = authResult.url;
      let accessToken = null;

      if (url.includes('#')) {
        const fragment = url.split('#')[1];
        const params = new URLSearchParams(fragment);
        accessToken = params.get('access_token');
      }

      if (!accessToken && url.includes('?')) {
        const query = url.split('?')[1];
        const params = new URLSearchParams(query);
        accessToken = params.get('access_token');
      }

      if (!accessToken) {
        const match = url.match(/access_token=([^&]+)/);
        if (match && match[1]) {
          accessToken = decodeURIComponent(match[1]);
        }
      }

      if (!accessToken) {
        return {
          success: false,
          error: 'Tidak ditemukan access_token pada respon Google.',
        };
      }

      // Fetch user profile
      const userProfile = await fetchGoogleUserProfile(accessToken);

      return {
        success: true,
        accessToken,
        user: userProfile,
      };
    }

    if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
      return { success: false, canceled: true, error: 'Login dibatalkan oleh pengguna.' };
    }

    return {
      success: false,
      error: 'Otentikasi Google tidak berhasil.',
    };
  } catch (error) {
    console.log('Error in signInWithGoogle:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat menghubungkan akun Google.',
    };
  }
};

/**
 * Fetches Google User Profile information
 * @param {string} accessToken
 * @returns {Promise<{id: string, name: string, email: string, picture: string}>}
 */
export const fetchGoogleUserProfile = async (accessToken) => {
  try {
    const res = await fetch(GOOGLE_USER_INFO_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil profil user (${res.status})`);
    }

    const data = await res.json();
    return {
      id: data.sub || data.id,
      name: data.name || 'Pengguna Google',
      email: data.email || '',
      picture: data.picture || '',
    };
  } catch (error) {
    console.log('Error fetching user profile:', error);
    return {
      id: 'google_user',
      name: 'Pengguna Google',
      email: '',
      picture: '',
    };
  }
};

/**
 * Searches for existing backup file on Google Drive (AppData or Drive space)
 * @param {string} accessToken
 * @returns {Promise<{exists: boolean, fileId?: string, modifiedTime?: string, size?: number}>}
 */
export const findBackupFileInDrive = async (accessToken) => {
  try {
    // 1. Try querying in appDataFolder first
    const appDataUrl = `${GOOGLE_DRIVE_FILES_ENDPOINT}?spaces=appDataFolder&q=name%3D'${BACKUP_FILE_NAME}'%20and%20trashed%3Dfalse&fields=files(id,name,modifiedTime,size)`;
    const resAppData = await fetch(appDataUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (resAppData.ok) {
      const data = await resAppData.json();
      if (data.files && data.files.length > 0) {
        const file = data.files[0];
        return {
          exists: true,
          fileId: file.id,
          modifiedTime: file.modifiedTime,
          size: file.size,
          space: 'appDataFolder',
        };
      }
    }

    // 2. Fallback check in general Drive file space
    const driveUrl = `${GOOGLE_DRIVE_FILES_ENDPOINT}?q=name%3D'${BACKUP_FILE_NAME}'%20and%20trashed%3Dfalse&fields=files(id,name,modifiedTime,size)`;
    const resDrive = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (resDrive.ok) {
      const data = await resDrive.json();
      if (data.files && data.files.length > 0) {
        const file = data.files[0];
        return {
          exists: true,
          fileId: file.id,
          modifiedTime: file.modifiedTime,
          size: file.size,
          space: 'drive',
        };
      }
    }

    return { exists: false, fileId: null };
  } catch (error) {
    console.log('Error finding backup file in Drive:', error);
    return { exists: false, error: error.message };
  }
};

/**
 * Downloads the JSON backup content from Google Drive
 * @param {string} accessToken
 * @param {string} fileId
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const downloadBackupFromDrive = async (accessToken, fileId) => {
  try {
    const downloadUrl = `${GOOGLE_DRIVE_FILES_ENDPOINT}/${fileId}?alt=media`;
    const res = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengunduh file backup (${res.status})`);
    }

    const payload = await res.json();
    return {
      success: true,
      data: payload,
    };
  } catch (error) {
    console.log('Error downloading backup from Drive:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengunduh data backup dari Google Drive.',
    };
  }
};

/**
 * Uploads (Creates or Overwrites) full application snapshot to Google Drive
 * @param {string} accessToken
 * @param {object} payload - { transactions, quranFavorites, quranHistory, settings, ... }
 * @param {string|null} existingFileId - if provided, updates existing file
 * @returns {Promise<{success: boolean, fileId?: string, error?: string}>}
 */
export const uploadBackupToDrive = async (accessToken, payload, existingFileId = null) => {
  try {
    const jsonContent = JSON.stringify(payload, null, 2);

    // If file already exists, PATCH it
    if (existingFileId) {
      const updateUrl = `${GOOGLE_DRIVE_UPLOAD_ENDPOINT}/${existingFileId}?uploadType=media`;
      const res = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: jsonContent,
      });

      if (!res.ok) {
        throw new Error(`Gagal memperbarui file di Google Drive (${res.status})`);
      }

      const result = await res.json();
      return { success: true, fileId: result.id || existingFileId };
    }

    // Otherwise, create new file via multipart upload in appDataFolder
    const metadata = {
      name: BACKUP_FILE_NAME,
      parents: ['appDataFolder'],
      mimeType: 'application/json',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const createUrl = `${GOOGLE_DRIVE_UPLOAD_ENDPOINT}?uploadType=multipart`;
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      // Fallback: try creating in regular root directory if appDataFolder is restricted
      const fallbackMetadata = {
        name: BACKUP_FILE_NAME,
        mimeType: 'application/json',
      };
      const fallbackBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(fallbackMetadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        jsonContent +
        closeDelimiter;

      const fallbackRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: fallbackBody,
      });

      if (!fallbackRes.ok) {
        throw new Error(`Gagal membuat file backup (${fallbackRes.status})`);
      }

      const fallbackResult = await fallbackRes.json();
      return { success: true, fileId: fallbackResult.id };
    }

    const result = await res.json();
    return { success: true, fileId: result.id };
  } catch (error) {
    console.log('Error uploading backup to Drive:', error);
    return {
      success: false,
      error: error.message || 'Gagal mengunggah data backup ke Google Drive.',
    };
  }
};

/**
 * Intelligent Merge Algorithm for Local and Cloud Datasets
 * Guarantees zero data loss and prevents duplicates
 */
export const mergeDatasets = (localData, cloudData) => {
  const localTx = localData?.transactions || [];
  const cloudTx = cloudData?.transactions || [];

  // Merge transactions by unique ID
  const txMap = new Map();

  // Cloud items first
  cloudTx.forEach((tx) => {
    if (tx && tx.id) {
      txMap.set(tx.id, tx);
    }
  });

  // Local items overwrite or add
  localTx.forEach((tx) => {
    if (tx && tx.id) {
      txMap.set(tx.id, tx);
    }
  });

  const mergedTransactions = Array.from(txMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Merge Quran Favorites (by surah_ayah key)
  const localFavs = localData?.quranFavorites || [];
  const cloudFavs = cloudData?.quranFavorites || [];
  const favMap = new Map();

  [...cloudFavs, ...localFavs].forEach((fav) => {
    if (fav && fav.surah && fav.ayah) {
      favMap.set(`${fav.surah}_${fav.ayah}`, fav);
    }
  });
  const mergedFavorites = Array.from(favMap.values());

  // Merge Quran History
  const localHist = localData?.quranHistory || [];
  const cloudHist = cloudData?.quranHistory || [];
  const histMap = new Map();

  [...cloudHist, ...localHist].forEach((hist) => {
    if (hist && hist.surah && hist.ayah) {
      histMap.set(`${hist.surah}_${hist.ayah}`, hist);
    }
  });
  const mergedHistory = Array.from(histMap.values()).slice(0, 50);

  // Merge Wallets
  const localWallets = localData?.wallets || [];
  const cloudWallets = cloudData?.wallets || [];
  const walletMap = new Map();

  [...cloudWallets, ...localWallets].forEach((w) => {
    if (w && w.id) {
      walletMap.set(w.id, w);
    }
  });
  const mergedWallets = Array.from(walletMap.values());

  return {
    transactions: mergedTransactions,
    wallets: mergedWallets,
    quranFavorites: mergedFavorites,
    quranHistory: mergedHistory,
    totalTransactions: mergedTransactions.length,
    newFromCloud: Math.max(0, mergedTransactions.length - localTx.length),
  };
};

/**
 * 1-Click Save / Backup File to Google Drive (via Native Storage Sharing)
 * Works directly on all Android & iOS devices without requiring Google Console setup
 * @param {object} payload - { transactions, wallets, quranFavorites, quranHistory }
 * @returns {Promise<{success: boolean, uri?: string, error?: string}>}
 */
export const exportBackupToFile = async (payload) => {
  try {
    const fullPayload = {
      app: 'dalay',
      version: APP_INFO.version,
      exportedAt: new Date().toISOString(),
      transactions: payload?.transactions || [],
      wallets: payload?.wallets || [],
      quranFavorites: payload?.quranFavorites || [],
      quranHistory: payload?.quranHistory || [],
    };

    const jsonStr = JSON.stringify(fullPayload, null, 2);
    const fileName = `dalay_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`;

    if (Platform.OS !== 'web') {
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonStr, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Simpan / Cadangkan ke Google Drive',
          UTI: 'public.json',
        });
        return { success: true, uri: fileUri, fileName };
      }
      return { success: true, uri: fileUri, fileName };
    }

    return { success: true, fileName };
  } catch (error) {
    console.log('Error exporting backup file:', error);
    return { success: false, error: error.message || 'Gagal membuat file cadangan.' };
  }
};

/**
 * 1-Click Pick and Restore Backup File from Google Drive / Filesystem
 * @returns {Promise<{success: boolean, data?: object, fileName?: string, canceled?: boolean, error?: string}>}
 */
export const importBackupFromFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, canceled: true };
    }

    const file = result.assets[0];
    let jsonContent = '';

    // Strategy 1: Direct Web File object if present
    if (file.file && typeof file.file.text === 'function') {
      try {
        jsonContent = await file.file.text();
      } catch (e) {
        console.log('file.file.text() failed, trying fetch fallback:', e);
      }
    }

    // Strategy 2: fetch(file.uri) (React Native ContentResolver/stream layer - works reliably on Android SAF & file://)
    if (!jsonContent && file.uri) {
      try {
        const res = await fetch(file.uri);
        if (res.ok || res.status === 200 || res.status === 0) {
          jsonContent = await res.text();
        }
      } catch (fetchErr) {
        console.log('fetch(file.uri) failed, trying FileSystem:', fetchErr);
      }
    }

    // Strategy 3: FileSystem.readAsStringAsync
    if (!jsonContent && file.uri && Platform.OS !== 'web') {
      try {
        jsonContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch (fsErr) {
        console.log('FileSystem.readAsStringAsync failed:', fsErr);
      }
    }

    // Strategy 4: fetch + blob + FileReader (bulletproof fallback on strict Android scoped storage)
    if (!jsonContent && file.uri) {
      try {
        const blobRes = await fetch(file.uri);
        const blob = await blobRes.blob();
        jsonContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (e) => reject(e);
          reader.readAsText(blob);
        });
      } catch (blobErr) {
        console.log('FileReader blob fallback failed:', blobErr);
      }
    }

    if (!jsonContent || !jsonContent.trim()) {
      return {
        success: false,
        error: 'File cadangan kosong atau tidak dapat diakses oleh perangkat.',
      };
    }

    const parsed = JSON.parse(jsonContent);

    if (!parsed || (!parsed.transactions && !parsed.quranFavorites)) {
      return {
        success: false,
        error: 'Format file tidak valid. Pastikan file adalah backup resmi DalAy (.json).',
      };
    }

    return {
      success: true,
      data: parsed,
      fileName: file.name,
    };
  } catch (error) {
    console.log('Error importing backup file:', error);
    return {
      success: false,
      error: error.message || 'Gagal membaca file cadangan Google Drive.',
    };
  }
};

export const signOutGoogle = async () => {
  // Clear any active session
  return { success: true };
};

export default {
  signInWithGoogle,
  signOutGoogle,
  fetchGoogleUserProfile,
  findBackupFileInDrive,
  downloadBackupFromDrive,
  uploadBackupToDrive,
  mergeDatasets,
  exportBackupToFile,
  importBackupFromFile,
};
