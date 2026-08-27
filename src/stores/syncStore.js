import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFinance } from './financeStore';
import { useQuran } from './quranStore';
import { useWallet } from './walletStore';
import {
  signInWithGoogle,
  fetchGoogleUserProfile,
  findBackupFileInDrive,
  downloadBackupFromDrive,
  uploadBackupToDrive,
  mergeDatasets,
  exportBackupToFile,
  importBackupFromFile,
} from '../services/googleDriveSync';
import { APP_INFO } from '../constants/appInfo';

const STORAGE_KEY_ACCOUNT = '@dalay_google_account';
const STORAGE_KEY_LAST_SYNC = '@dalay_last_sync_timestamp';
const STORAGE_KEY_AUTO_SYNC = '@dalay_auto_sync_enabled';
const STORAGE_KEY_DRIVE_FILE_ID = '@dalay_drive_file_id';
const STORAGE_KEY_CLIENT_ID = '@dalay_google_client_id';

const SyncContext = createContext(null);

export const SyncProvider = ({ children }) => {
  const { transactions } = useFinance();
  const { favorites, history } = useQuran();
  const { wallets } = useWallet();

  const [googleAccount, setGoogleAccount] = useState(null);
  const [googleClientId, setGoogleClientId] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [cloudFileId, setCloudFileId] = useState(null);
  const [cloudStats, setCloudStats] = useState(null); // { exists, modifiedTime, transactionCount }
  const [syncError, setSyncError] = useState(null);

  const isInitialMount = useRef(true);
  const debounceTimerRef = useRef(null);

  // Live Silent Background Auto-Sync whenever data changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (googleAccount?.accessToken && autoSyncEnabled && !isSyncing) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const payload = {
            app: 'dalay',
            version: APP_INFO.version,
            updatedAt: new Date().toISOString(),
            userEmail: googleAccount.email,
            transactions: transactions || [],
            wallets: wallets || [],
            quranFavorites: favorites || [],
            quranHistory: history || [],
          };

          let currentFileId = cloudFileId;
          if (!currentFileId) {
            const check = await findBackupFileInDrive(googleAccount.accessToken);
            if (check.exists) currentFileId = check.fileId;
          }

          const uploadRes = await uploadBackupToDrive(
            googleAccount.accessToken,
            payload,
            currentFileId
          );

          if (uploadRes.success) {
            if (uploadRes.fileId && !cloudFileId) {
              setCloudFileId(uploadRes.fileId);
              await AsyncStorage.setItem(STORAGE_KEY_DRIVE_FILE_ID, uploadRes.fileId);
            }
            const now = new Date().toISOString();
            setLastSyncTime(now);
            await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now);
            console.log('=== Google Drive Background Auto-Sync Succeeded ===');
          }
        } catch (e) {
          console.log('Error during background auto-sync:', e);
        }
      }, 2000); // 2 second debounce
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [transactions, favorites, history, googleAccount, autoSyncEnabled]);

  // Load persistent sync state on mount
  useEffect(() => {
    loadSyncState();
  }, []);

  const loadSyncState = async () => {
    try {
      const [rawAccount, rawLastSync, rawAutoSync, rawFileId, rawClientId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_ACCOUNT),
        AsyncStorage.getItem(STORAGE_KEY_LAST_SYNC),
        AsyncStorage.getItem(STORAGE_KEY_AUTO_SYNC),
        AsyncStorage.getItem(STORAGE_KEY_DRIVE_FILE_ID),
        AsyncStorage.getItem(STORAGE_KEY_CLIENT_ID),
      ]);

      if (rawAccount) setGoogleAccount(JSON.parse(rawAccount));
      if (rawLastSync) setLastSyncTime(rawLastSync);
      if (rawAutoSync !== null) setAutoSyncEnabled(JSON.parse(rawAutoSync));
      if (rawFileId) setCloudFileId(rawFileId);
      if (rawClientId) setGoogleClientId(rawClientId);
    } catch (e) {
      console.log('Error loading sync state:', e);
    }
  };

  const saveGoogleClientId = async (id) => {
    setGoogleClientId(id);
    if (id) {
      await AsyncStorage.setItem(STORAGE_KEY_CLIENT_ID, id);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    }
  };

  /**
   * Connect with Google & Run Initial Seamless Sync / Recovery
   */
  const connectAndSync = async (customClientId = null, getLocalData, applyMergedData) => {
    setIsSyncing(true);
    setSyncError(null);

    const targetClientId = customClientId || googleClientId || null;

    try {
      // 1. Google OAuth
      const authRes = await signInWithGoogle(targetClientId);

      if (!authRes.success) {
        setIsSyncing(false);
        if (authRes.canceled) {
          return { success: false, canceled: true, message: 'Koneksi dibatalkan.' };
        }
        setSyncError(authRes.error);
        return { success: false, message: authRes.error };
      }

      const accountData = {
        ...authRes.user,
        accessToken: authRes.accessToken,
        connectedAt: new Date().toISOString(),
      };

      setGoogleAccount(accountData);
      await AsyncStorage.setItem(STORAGE_KEY_ACCOUNT, JSON.stringify(accountData));

      // 2. Check for existing backup in Google Drive
      const driveFile = await findBackupFileInDrive(authRes.accessToken);
      const localData = getLocalData ? await getLocalData() : { transactions: [], quranFavorites: [], quranHistory: [] };

      if (driveFile.exists && driveFile.fileId) {
        setCloudFileId(driveFile.fileId);
        await AsyncStorage.setItem(STORAGE_KEY_DRIVE_FILE_ID, driveFile.fileId);

        // 3. Download cloud backup
        const downloadRes = await downloadBackupFromDrive(authRes.accessToken, driveFile.fileId);

        if (downloadRes.success && downloadRes.data) {
          const cloudPayload = downloadRes.data;

          // 4. Merge datasets (Guarantees zero data loss, restores old data on fresh install!)
          const mergeResult = mergeDatasets(localData, cloudPayload);

          if (applyMergedData) {
            await applyMergedData(mergeResult);
          }

          // 5. Upload consolidated state back to Google Drive
          const consolidatedPayload = {
            app: 'dalay',
            version: APP_INFO.version,
            updatedAt: new Date().toISOString(),
            userEmail: accountData.email,
            transactions: mergeResult.transactions,
            quranFavorites: mergeResult.quranFavorites,
            quranHistory: mergeResult.quranHistory,
          };

          await uploadBackupToDrive(authRes.accessToken, consolidatedPayload, driveFile.fileId);

          const now = new Date().toISOString();
          setLastSyncTime(now);
          await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now);

          setCloudStats({
            exists: true,
            modifiedTime: now,
            transactionCount: mergeResult.transactions.length,
          });

          setIsSyncing(false);
          return {
            success: true,
            isRecovery: true,
            restoredCount: mergeResult.newFromCloud,
            totalTransactions: mergeResult.transactions.length,
            message: `Akun terhubung! Berhasil memulihkan ${mergeResult.totalTransactions} catatan dari Google Drive.`,
          };
        }
      }

      // 6. No prior backup found -> Upload initial local state to create first backup
      const initialPayload = {
        app: 'dalay',
        version: APP_INFO.version,
        createdAt: new Date().toISOString(),
        userEmail: accountData.email,
        transactions: localData.transactions || [],
        quranFavorites: localData.quranFavorites || [],
        quranHistory: localData.quranHistory || [],
      };

      const uploadRes = await uploadBackupToDrive(authRes.accessToken, initialPayload);
      if (uploadRes.success) {
        setCloudFileId(uploadRes.fileId);
        await AsyncStorage.setItem(STORAGE_KEY_DRIVE_FILE_ID, uploadRes.fileId);
      }

      const now = new Date().toISOString();
      setLastSyncTime(now);
      await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now);

      setCloudStats({
        exists: true,
        modifiedTime: now,
        transactionCount: localData.transactions ? localData.transactions.length : 0,
      });

      setIsSyncing(false);
      return { success: true, message: 'Google Drive terhubung & data berhasil dicadangkan!' };
    } catch (error) {
      console.log('Error in connectAndSync:', error);
      setIsSyncing(false);
      setSyncError(error.message);
      return { success: false, message: error.message || 'Koneksi Google Drive gagal.' };
    }
  };

  /**
   * Handle Login via raw Access Token
   */
  const handleAccessTokenLogin = async (accessToken, getLocalData, applyMergedData) => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const userProfile = await fetchGoogleUserProfile(accessToken);
      const accountData = {
        ...userProfile,
        accessToken,
        connectedAt: new Date().toISOString(),
      };

      setGoogleAccount(accountData);
      await AsyncStorage.setItem(STORAGE_KEY_ACCOUNT, JSON.stringify(accountData));

      const driveFile = await findBackupFileInDrive(accessToken);
      const localData = getLocalData ? await getLocalData() : { transactions: [], quranFavorites: [], quranHistory: [] };

      if (driveFile.exists && driveFile.fileId) {
        setCloudFileId(driveFile.fileId);
        await AsyncStorage.setItem(STORAGE_KEY_DRIVE_FILE_ID, driveFile.fileId);

        const downloadRes = await downloadBackupFromDrive(accessToken, driveFile.fileId);
        if (downloadRes.success && downloadRes.data) {
          const mergeResult = mergeDatasets(localData, downloadRes.data);
          if (applyMergedData) {
            await applyMergedData(mergeResult);
          }

          const consolidatedPayload = {
            app: 'dalay',
            version: APP_INFO.version,
            updatedAt: new Date().toISOString(),
            userEmail: accountData.email,
            transactions: mergeResult.transactions,
            quranFavorites: mergeResult.quranFavorites,
            quranHistory: mergeResult.quranHistory,
          };

          await uploadBackupToDrive(accessToken, consolidatedPayload, driveFile.fileId);
          const now = new Date().toISOString();
          setLastSyncTime(now);
          await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now);
          setIsSyncing(false);
          return { success: true, message: 'Google Drive terhubung & data berhasil disinkronkan!' };
        }
      }

      // Initial backup
      const initialPayload = {
        app: 'dalay',
        version: APP_INFO.version,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userEmail: accountData.email,
        transactions: localData.transactions || [],
        quranFavorites: localData.quranFavorites || [],
        quranHistory: localData.quranHistory || [],
      };

      const uploadRes = await uploadBackupToDrive(accessToken, initialPayload);
      if (uploadRes.success && uploadRes.fileId) {
        setCloudFileId(uploadRes.fileId);
        await AsyncStorage.setItem(STORAGE_KEY_DRIVE_FILE_ID, uploadRes.fileId);
      }

      const now = new Date().toISOString();
      setLastSyncTime(now);
      await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now);
      setIsSyncing(false);
      return { success: true, message: 'Google Drive terhubung & data berhasil dicadangkan!' };
    } catch (err) {
      console.log('Error in handleAccessTokenLogin:', err);
      setIsSyncing(false);
      return { success: false, message: err.message };
    }
  };

  /**
   * Perform manual or periodic background synchronization
   */
  const performSync = async (getLocalData, applyMergedData) => {
    if (!googleAccount || !googleAccount.accessToken) {
      return { success: false, notConnected: true, message: 'Belum ada akun Google yang terhubung.' };
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const localData = getLocalData ? await getLocalData() : { transactions: [], quranFavorites: [], quranHistory: [] };

      // Find or verify file ID
      let currentFileId = cloudFileId;
      if (!currentFileId) {
        const check = await findBackupFileInDrive(googleAccount.accessToken);
        if (check.exists) currentFileId = check.fileId;
      }

      let cloudData = null;
      if (currentFileId) {
        const downloadRes = await downloadBackupFromDrive(googleAccount.accessToken, currentFileId);
        if (downloadRes.success) {
          cloudData = downloadRes.data;
        }
      }

      // Merge data
      const mergeResult = mergeDatasets(localData, cloudData || {});

      if (applyMergedData) {
        await applyMergedData(mergeResult);
      }

      // Upload unified payload to Drive
      const uploadPayload = {
        app: 'dalay',
        version: APP_INFO.version,
        updatedAt: new Date().toISOString(),
        userEmail: googleAccount.email,
        transactions: mergeResult.transactions,
        quranFavorites: mergeResult.quranFavorites,
        quranHistory: mergeResult.quranHistory,
      };

      const uploadRes = await uploadBackupToDrive(
        googleAccount.accessToken,
        uploadPayload,
        currentFileId
      );

      if (uploadRes.success && uploadRes.fileId) {
        setCloudFileId(uploadRes.fileId);
        await AsyncStorage.setItem(STORAGE_KEY_DRIVE_FILE_ID, uploadRes.fileId);
      }

      const now = new Date().toISOString();
      setLastSyncTime(now);
      await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now);

      setCloudStats({
        exists: true,
        modifiedTime: now,
        transactionCount: mergeResult.transactions.length,
      });

      setIsSyncing(false);
      return {
        success: true,
        totalTransactions: mergeResult.transactions.length,
        message: `Sinkronisasi berhasil! Total ${mergeResult.transactions.length} catatan tersimpan di Google Drive.`,
      };
    } catch (error) {
      console.log('Error in performSync:', error);
      setIsSyncing(false);
      setSyncError(error.message);
      return { success: false, message: error.message || 'Sinkronisasi gagal.' };
    }
  };

  /**
   * Disconnect Google Account and clean local session
   */
  const disconnectGoogle = async () => {
    try {
      setGoogleAccount(null);
      setCloudFileId(null);
      setCloudStats(null);
      setLastSyncTime(null);
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY_ACCOUNT),
        AsyncStorage.removeItem(STORAGE_KEY_LAST_SYNC),
        AsyncStorage.removeItem(STORAGE_KEY_DRIVE_FILE_ID),
      ]);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  /**
   * 1-Click File-based Backup to Google Drive
   */
  const backupToGoogleDriveFile = async (getLocalData) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const localData = getLocalData ? await getLocalData() : { transactions: [], quranFavorites: [], quranHistory: [] };
      const res = await exportBackupToFile(localData);
      setIsSyncing(false);
      if (res.success) {
        const now = new Date().toISOString();
        setLastSyncTime(now);
        await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now);
        return {
          success: true,
          message: 'File cadangan siap! Silakan simpan ke Google Drive Anda.',
        };
      }
      return { success: false, message: res.error };
    } catch (e) {
      setIsSyncing(false);
      return { success: false, message: e.message };
    }
  };

  /**
   * 1-Click File-based Restore from Google Drive
   */
  const restoreFromGoogleDriveFile = async (getLocalData, applyMergedData) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const pickRes = await importBackupFromFile();
      if (!pickRes.success) {
        setIsSyncing(false);
        if (pickRes.canceled) return { success: false, canceled: true };
        return { success: false, message: pickRes.error };
      }

      const localData = getLocalData ? await getLocalData() : { transactions: [], quranFavorites: [], quranHistory: [] };
      const mergeResult = mergeDatasets(localData, pickRes.data);

      if (applyMergedData) {
        await applyMergedData(mergeResult);
      }

      const now = new Date().toISOString();
      setLastSyncTime(now);
      await AsyncStorage.setItem(STORAGE_KEY_LAST_SYNC, now);

      setIsSyncing(false);
      return {
        success: true,
        restoredCount: mergeResult.newFromCloud,
        totalTransactions: mergeResult.transactions.length,
        message: `Berhasil memulihkan ${mergeResult.transactions.length} catatan dari file Google Drive (${pickRes.fileName})!`,
      };
    } catch (e) {
      setIsSyncing(false);
      return { success: false, message: e.message };
    }
  };

  /**
   * Toggle auto-sync setting
   */
  const toggleAutoSync = async (val) => {
    setAutoSyncEnabled(val);
    await AsyncStorage.setItem(STORAGE_KEY_AUTO_SYNC, JSON.stringify(val));
  };

  const contextValue = useMemo(
    () => ({
      googleAccount,
      googleClientId,
      isConnected: !!googleAccount,
      lastSyncTime,
      isSyncing,
      autoSyncEnabled,
      cloudStats,
      syncError,
      saveGoogleClientId,
      connectAndSync,
      handleAccessTokenLogin,
      performSync,
      backupToGoogleDriveFile,
      restoreFromGoogleDriveFile,
      disconnectGoogle,
      toggleAutoSync,
    }),
    [
      googleAccount,
      googleClientId,
      lastSyncTime,
      isSyncing,
      autoSyncEnabled,
      cloudStats,
      syncError,
    ]
  );

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

export default SyncContext;
