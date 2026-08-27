import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { NeoButton } from '../neo/NeoButton';
import { ConfirmModal } from '../neo/ConfirmModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useSync } from '../../stores/syncStore';
import { useFinance } from '../../stores/financeStore';
import { useQuran } from '../../stores/quranStore';
import { formatDateIndo, formatTimeIndo } from '../../utils/formatters';

WebBrowser.maybeCompleteAuthSession();

export const GoogleSyncCard = ({ onToast }) => {
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();
  const {
    googleAccount,
    isConnected,
    lastSyncTime,
    isSyncing,
    autoSyncEnabled,
    connectAndSync,
    handleAccessTokenLogin,
    performSync,
    backupToGoogleDriveFile,
    restoreFromGoogleDriveFile,
    disconnectGoogle,
    toggleAutoSync,
  } = useSync();

  const { transactions, replaceTransactions } = useFinance();
  const { favorites, history, replaceFavoritesAndHistory } = useQuran();

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  // Helper to package local data snapshot
  const getLocalDataSnapshot = () => ({
    transactions: transactions || [],
    quranFavorites: favorites || [],
    quranHistory: history || [],
  });

  // Helper to apply merged cloud dataset
  const applyMergedDataset = async (mergeResult) => {
    if (mergeResult.transactions) {
      await replaceTransactions(mergeResult.transactions);
    }
    if (mergeResult.quranFavorites || mergeResult.quranHistory) {
      await replaceFavoritesAndHistory(
        mergeResult.quranFavorites || [],
        mergeResult.quranHistory || []
      );
    }
  };

  const handleStartOAuthLogin = async () => {
    try {
      const res = await connectAndSync(null, getLocalDataSnapshot, applyMergedDataset);
      if (res?.success) {
        if (onToast) onToast(res.message);
      } else if (!res?.canceled && res?.message) {
        Alert.alert(isIndonesian ? 'Status Koneksi' : 'Connection Status', res.message);
      }
    } catch (err) {
      console.log('Error in handleStartOAuthLogin:', err);
    }
  };

  const handleTokenSubmit = async () => {
    const raw = tokenInput.trim();
    if (!raw) {
      Alert.alert(
        isIndonesian ? 'Token Kosong' : 'Empty Token',
        isIndonesian ? 'Silakan tempel URL atau token Google Anda.' : 'Please paste your Google URL or token.'
      );
      return;
    }

    let token = raw;
    if (!raw.startsWith('ya29.')) {
      const match = raw.match(/access_token=([^&]+)/);
      if (match && match[1]) {
        token = decodeURIComponent(match[1]);
      }
    }

    setTokenModalVisible(false);
    setTokenInput('');

    const res = await handleAccessTokenLogin(token, getLocalDataSnapshot, applyMergedDataset);
    if (res.success) {
      if (onToast) onToast(res.message);
    } else {
      Alert.alert(isIndonesian ? 'Gagal Terhubung' : 'Connection Failed', res.message);
    }
  };

  const handleDirectDriveBackup = async () => {
    const res = await backupToGoogleDriveFile(getLocalDataSnapshot);
    if (res.success) {
      if (onToast) onToast(isIndonesian ? 'Pilih "Drive" untuk menyimpan ke Google Drive!' : 'Select "Drive" to save to Google Drive!');
    } else {
      Alert.alert(isIndonesian ? 'Gagal Cadangkan' : 'Backup Failed', res.message);
    }
  };

  const handleDirectDriveRestore = async () => {
    setConfirmDialog({
      title: isIndonesian ? 'Pulihkan dari Google Drive?' : 'Restore from Google Drive?',
      message: isIndonesian
        ? 'Pilih file backup (dalay_cloud_backup_*.json) dari Google Drive Anda. Seluruh catatan keuangan dan riwayat Quran Anda akan dipulihkan secara otomatis.'
        : 'Select your backup file from Google Drive. Transactions and Quran history will be restored seamlessly.',
      type: 'info',
      confirmText: isIndonesian ? 'Pilih File di Drive' : 'Select File in Drive',
      onConfirm: async () => {
        setConfirmDialog(null);
        const res = await restoreFromGoogleDriveFile(getLocalDataSnapshot, applyMergedDataset);
        if (res.success) {
          if (onToast) onToast(res.message);
        } else if (!res.canceled) {
          Alert.alert(isIndonesian ? 'Gagal Memulihkan' : 'Restore Failed', res.message);
        }
      },
    });
  };

  const handleManualSync = async () => {
    const res = await performSync(getLocalDataSnapshot, applyMergedDataset);
    if (res.success) {
      if (onToast) onToast(res.message);
    } else {
      Alert.alert(
        isIndonesian ? 'Sinkronisasi Gagal' : 'Sync Failed',
        res.message || (isIndonesian ? 'Terjadi kesalahan saat sync data.' : 'Error during sync.')
      );
    }
  };

  const handleDisconnectPrompt = () => {
    setConfirmDialog({
      title: isIndonesian ? 'Putuskan Akun Google?' : 'Disconnect Google Account?',
      message: isIndonesian
        ? 'Aplikasi tidak akan lagi otomatis menyinkronkan data ke Google Drive. Data yang sudah tersimpan di cloud tetap aman.'
        : 'App will stop auto-syncing to Google Drive. Existing data on cloud remains safe.',
      type: 'warning',
      confirmText: isIndonesian ? 'Putuskan' : 'Disconnect',
      onConfirm: async () => {
        await disconnectGoogle();
        setConfirmDialog(null);
        if (onToast) {
          onToast(isIndonesian ? 'Akun Google berhasil diputuskan' : 'Google account disconnected');
        }
      },
    });
  };

  const formatLastSync = (isoString) => {
    if (!isoString) return isIndonesian ? 'Belum pernah sync' : 'Never synced';
    const date = new Date(isoString);
    const dateStr = formatDateIndo(date, true, false);
    const timeStr = formatTimeIndo(date);
    return `${dateStr}, ${timeStr}`;
  };

  return (
    <NeoCard
      variant="default"
      padding={18}
      style={[styles.card, { borderColor: colors.border }]}
    >
      {/* Header with Cloud Icon */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: colors.accent + '20', borderColor: colors.border }]}>
          <Ionicons name="cloud-done-outline" size={24} color={colors.accent} />
        </View>
        <View style={styles.headerTextCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {isIndonesian ? 'Cadangkan & Pulihkan Google Drive' : 'Google Drive Backup & Restore'}
            </Text>
            {isConnected && (
              <View style={[styles.connectedBadge, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
                <View style={styles.greenDot} />
                <Text style={styles.connectedBadgeText}>
                  {isIndonesian ? 'Cloud Auto-Sync' : 'Cloud Auto-Sync'}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {isIndonesian
              ? 'Pulihkan data kapan saja saat install ulang atau ganti HP'
              : 'Recover your data seamlessly on fresh install or device switch'}
          </Text>
        </View>
      </View>

      {/* Body: Connected vs Not Connected */}
      {isConnected ? (
        <View style={styles.connectedContainer}>
          {/* User Profile Bar */}
          <View style={[styles.profileBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            {googleAccount?.picture ? (
              <Image source={{ uri: googleAccount.picture }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarLetter}>
                  {(googleAccount?.name || 'G')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                {googleAccount?.name || 'Google Account'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {googleAccount?.email || '-'}
              </Text>
            </View>
          </View>

          {/* Sync Metadata Info */}
          <View style={styles.syncMetaContainer}>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                {isIndonesian ? 'Terakhir disinkronkan:' : 'Last Synced:'}
              </Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {formatLastSync(lastSyncTime)}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="documents-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                {isIndonesian ? 'Status Data:' : 'Data Status:'}
              </Text>
              <Text style={[styles.metaValue, { color: colors.accent, fontWeight: '700' }]}>
                {`${transactions.length} ${isIndonesian ? 'Transaksi' : 'Transactions'} • ${favorites.length} ${isIndonesian ? 'Favorit' : 'Favorites'}`}
              </Text>
            </View>
          </View>

          {/* Auto-Sync Toggle */}
          <View style={[styles.toggleRow, { borderColor: colors.border }]}>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>
                {isIndonesian ? 'Auto-Sync Otomatis' : 'Automatic Auto-Sync'}
              </Text>
              <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                {isIndonesian
                  ? 'Sinkronkan data saat ada transaksi baru'
                  : 'Sync automatically when new notes are added'}
              </Text>
            </View>
            <Switch
              value={autoSyncEnabled}
              onValueChange={toggleAutoSync}
              trackColor={{ false: '#94A3B8', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <NeoButton
              variant="primary"
              size="md"
              onPress={handleManualSync}
              loading={isSyncing}
              style={styles.syncBtn}
            >
              <View style={styles.btnInner}>
                <Ionicons name="sync" size={18} color="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.syncBtnText}>
                  {isSyncing
                    ? (isIndonesian ? 'Menyinkronkan...' : 'Syncing...')
                    : (isIndonesian ? 'Sync Sekarang' : 'Sync Now')}
                </Text>
              </View>
            </NeoButton>

            <NeoButton
              variant="outline"
              size="md"
              onPress={handleDisconnectPrompt}
              style={styles.disconnectBtn}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.danger || '#EF4444'} />
            </NeoButton>
          </View>
        </View>
      ) : (
        <View style={styles.unconnectedContainer}>
          <Text style={[styles.descText, { color: colors.textSecondary }]}>
            {isIndonesian
              ? 'Simpan data transaksi dan riwayat Quran Anda ke Google Drive. Saat install ulang atau ganti HP, data Anda dapat dipulihkan secara instan.'
              : 'Save your records and Quran history to Google Drive. Easily restore data on clean install or new devices.'}
          </Text>

          {/* Main 1-Click Google Drive Native Backup & Restore Buttons */}
          <View style={styles.fastActionContainer}>
            <NeoButton
              variant="primary"
              size="lg"
              onPress={handleDirectDriveBackup}
              loading={isSyncing}
              style={styles.fastBackupBtn}
            >
              <View style={styles.btnInner}>
                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.fastBtnText}>
                  {isIndonesian ? 'Cadangkan ke Google Drive' : 'Backup to Google Drive'}
                </Text>
              </View>
            </NeoButton>

            <NeoButton
              variant="outline"
              size="lg"
              onPress={handleDirectDriveRestore}
              loading={isSyncing}
              style={styles.fastRestoreBtn}
            >
              <View style={styles.btnInner}>
                <Ionicons name="cloud-download-outline" size={20} color={colors.text} style={styles.btnIcon} />
                <Text style={[styles.fastRestoreText, { color: colors.text }]}>
                  {isIndonesian ? 'Pulihkan dari Google Drive' : 'Restore from Google Drive'}
                </Text>
              </View>
            </NeoButton>
          </View>

          {/* Direct Google Account Link */}
          <View style={[styles.altSection, { borderTopColor: colors.border + '40' }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleStartOAuthLogin}
              style={styles.altLoginRow}
            >
              <Ionicons name="logo-google" size={16} color={colors.accent} />
              <Text style={[styles.altLoginText, { color: colors.accent }]}>
                {isIndonesian ? 'Hubungkan Akun Google (Login Otomatis)' : 'Link Google Account (Auto Login)'}
              </Text>
            </TouchableOpacity>

            {/* Development-only Token Paste Fallback (Commented out for production APK)
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTokenModalVisible(true)}
              style={[styles.altLoginRow, { marginTop: 8 }]}
            >
              <Ionicons name="clipboard-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.altLoginText, { color: colors.textSecondary }]}>
                {isIndonesian ? 'Selesaikan Login (Tempel URL / Token)' : 'Complete Login (Paste URL / Token)'}
              </Text>
            </TouchableOpacity>
            */}
          </View>
        </View>
      )}

      {/* Development-only Manual Token Modal (Commented out for production APK)
      <Modal
        visible={tokenModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTokenModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isIndonesian ? 'Selesaikan Login Google' : 'Complete Google Sign-in'}
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              {isIndonesian
                ? 'Salin seluruh isi URL dari peramban Brave (yang diawali postman://... atau ya29...), lalu tempelkan di bawah ini:'
                : 'Copy the full URL from the browser (starting with postman://... or ya29...), then paste below:'}
            </Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
              placeholder={isIndonesian ? 'Tempel URL atau token di sini...' : 'Paste URL or token here...'}
              placeholderTextColor={colors.textSecondary + '80'}
              value={tokenInput}
              onChangeText={setTokenInput}
              multiline={true}
              numberOfLines={4}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setTokenModalVisible(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>
                  {isIndonesian ? 'Batal' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handleTokenSubmit}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                  {isIndonesian ? 'Hubungkan' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      */}

      {/* Confirmation Modal */}
      {confirmDialog && (
        <ConfirmModal
          visible={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          confirmText={confirmDialog.confirmText}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </NeoCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.families.bold,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.families.regular,
    marginTop: 2,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  connectedBadgeText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.families.bold,
    color: '#10B981',
    fontWeight: '700',
  },
  descText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: TYPOGRAPHY.families.regular,
    marginBottom: 16,
  },
  fastActionContainer: {
    gap: 10,
    marginBottom: 14,
  },
  fastBackupBtn: {
    width: '100%',
  },
  fastRestoreBtn: {
    width: '100%',
  },
  fastBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: TYPOGRAPHY.families.bold,
    fontWeight: '800',
  },
  fastRestoreText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.families.bold,
    fontWeight: '800',
  },
  altSection: {
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: 'center',
  },
  altLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  altLoginText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.families.medium,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 12,
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.families.bold,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.families.regular,
  },
  syncMetaContainer: {
    gap: 6,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.families.regular,
  },
  metaValue: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.families.medium,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.families.bold,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.families.regular,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  syncBtn: {
    flex: 1,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: TYPOGRAPHY.families.bold,
    fontWeight: '800',
  },
  disconnectBtn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.families.bold,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 80,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
  },
  modalSubmitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    justifyContent: 'center',
  },
});

export default GoogleSyncCard;
