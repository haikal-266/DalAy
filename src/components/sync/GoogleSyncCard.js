import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
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
import { useWallet } from '../../stores/walletStore';
import { formatDateIndo, formatTimeIndo } from '../../utils/formatters';

export const GoogleSyncCard = ({ onToast }) => {
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();
  const {
    lastSyncTime,
    isSyncing,
    backupToGoogleDriveFile,
    restoreFromGoogleDriveFile,
  } = useSync();

  const { transactions, replaceTransactions } = useFinance();
  const { favorites, history, replaceFavoritesAndHistory } = useQuran();
  const { wallets, replaceWallets } = useWallet();

  const [confirmDialog, setConfirmDialog] = useState(null);

  // Helper to package all local data snapshot
  const getLocalDataSnapshot = () => ({
    transactions: transactions || [],
    wallets: wallets || [],
    quranFavorites: favorites || [],
    quranHistory: history || [],
  });

  // Helper to apply merged cloud dataset
  const applyMergedDataset = async (mergeResult) => {
    if (mergeResult.transactions) {
      await replaceTransactions(mergeResult.transactions);
    }
    if (mergeResult.wallets && typeof replaceWallets === 'function') {
      await replaceWallets(mergeResult.wallets);
    }
    if (mergeResult.quranFavorites || mergeResult.quranHistory) {
      await replaceFavoritesAndHistory(
        mergeResult.quranFavorites || [],
        mergeResult.quranHistory || []
      );
    }
  };

  const handleDirectDriveBackup = async () => {
    try {
      const res = await backupToGoogleDriveFile(getLocalDataSnapshot);
      if (res.success) {
        if (onToast) {
          onToast(
            isIndonesian
              ? 'Pilih "Simpan ke Drive" pada menu share untuk menyimpan cadangan!'
              : 'Select "Save to Drive" on share menu to save backup!'
          );
        }
      } else if (res.message) {
        Alert.alert(isIndonesian ? 'Gagal Cadangkan' : 'Backup Failed', res.message);
      }
    } catch (err) {
      Alert.alert(
        isIndonesian ? 'Error Cadangan' : 'Backup Error',
        err?.message || (isIndonesian ? 'Gagal membuat cadangan.' : 'Failed to create backup.')
      );
    }
  };

  const handleDirectDriveRestore = async () => {
    setConfirmDialog({
      title: isIndonesian ? 'Pulihkan dari Google Drive?' : 'Restore from Google Drive?',
      message: isIndonesian
        ? 'Pilih file cadangan (dalay_cloud_backup_*.json) dari Google Drive Anda. Seluruh transaksi, dompet, dan riwayat Quran Anda akan dipulihkan secara otomatis.'
        : 'Select your backup file from Google Drive. Transactions, wallets, and Quran history will be restored seamlessly.',
      type: 'info',
      confirmText: isIndonesian ? 'Pilih File di Drive' : 'Select File in Drive',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await restoreFromGoogleDriveFile(getLocalDataSnapshot, applyMergedDataset);
          if (res.success) {
            if (onToast) onToast(res.message);
          } else if (!res.canceled && res.message) {
            Alert.alert(isIndonesian ? 'Gagal Memulihkan' : 'Restore Failed', res.message);
          }
        } catch (err) {
          Alert.alert(
            isIndonesian ? 'Error Pemulihan' : 'Restore Error',
            err?.message || (isIndonesian ? 'Gagal memulihkan file.' : 'Failed to restore file.')
          );
        }
      },
    });
  };

  const formatLastSync = (isoString) => {
    if (!isoString) return isIndonesian ? 'Belum pernah dicadangkan' : 'Never backed up';
    try {
      const date = new Date(isoString);
      const dateStr = formatDateIndo(date, true, false);
      const timeStr = formatTimeIndo(date);
      return `${dateStr}, ${timeStr}`;
    } catch {
      return isIndonesian ? 'Belum pernah dicadangkan' : 'Never backed up';
    }
  };

  return (
    <NeoCard
      variant="default"
      padding={18}
      style={[
        styles.card,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.headerIconContainer, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
          <Ionicons name="cloud-done" size={24} color={colors.accent || '#2563EB'} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {isIndonesian ? 'Cadangan Google Drive' : 'Google Drive Backup'}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {isIndonesian
              ? 'Simpan dan pulihkan catatan Anda tanpa ribet login'
              : 'Safely backup and restore data without login hassles'}
          </Text>
        </View>
      </View>

      {/* Current Data Overview */}
      <View style={[styles.statsBox, { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{transactions.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {isIndonesian ? 'Transaksi' : 'Transactions'}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.brandGold || '#D97706' }]}>{wallets.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {isIndonesian ? 'Dompet' : 'Wallets'}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{favorites.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {isIndonesian ? 'Ayat Favorit' : 'Favorites'}
          </Text>
        </View>
      </View>

      {/* Last Backup Info */}
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={15} color={colors.textMuted} />
        <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
          {isIndonesian ? 'Terakhir dicadangkan:' : 'Last backup:'}
        </Text>
        <Text style={[styles.metaValue, { color: colors.text }]}>
          {formatLastSync(lastSyncTime)}
        </Text>
      </View>

      {/* Main Action Buttons */}
      <View style={styles.actionsRow}>
        <NeoButton
          variant="primary"
          size="lg"
          onPress={handleDirectDriveBackup}
          loading={isSyncing}
          style={styles.actionBtn}
        >
          <View style={styles.btnInner}>
            <Ionicons name="cloud-upload" size={19} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.actionBtnText}>
              {isIndonesian ? 'Cadangkan ke Google Drive' : 'Backup to Google Drive'}
            </Text>
          </View>
        </NeoButton>

        <NeoButton
          variant="outline"
          size="lg"
          onPress={handleDirectDriveRestore}
          loading={isSyncing}
          style={styles.actionBtn}
        >
          <View style={styles.btnInner}>
            <Ionicons name="cloud-download-outline" size={19} color={colors.text} style={styles.btnIcon} />
            <Text style={[styles.restoreBtnText, { color: colors.text }]}>
              {isIndonesian ? 'Pulihkan dari Google Drive' : 'Restore from Google Drive'}
            </Text>
          </View>
        </NeoButton>
      </View>

      {/* Practical Guide */}
      <View style={[styles.guideContainer, { backgroundColor: colors.backgroundSecondary || colors.surfaceLight, borderColor: colors.borderLight }]}>
        <View style={styles.guideHeader}>
          <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
          <Text style={[styles.guideTitle, { color: colors.text }]}>
            {isIndonesian ? 'Cara Penggunaan Praktis:' : 'How It Works:'}
          </Text>
        </View>
        <Text style={[styles.guideText, { color: colors.textSecondary }]}>
          {isIndonesian
            ? '1. Ketuk "Cadangkan ke Google Drive" lalu pilih opsi "Simpan ke Drive" pada jendela HP Anda.\n2. Saat install ulang atau ganti HP baru, cukup ketuk "Pulihkan dari Google Drive" dan pilih file cadangan Anda.'
            : '1. Tap "Backup to Google Drive" and select "Save to Drive" on your phone.\n2. When switching devices or reinstalling, simply tap "Restore from Google Drive" and select your backup file.'}
        </Text>
      </View>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmModal
          visible={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          confirmText={confirmDialog.confirmText}
          cancelText={isIndonesian ? 'Batal' : 'Cancel'}
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
    marginBottom: 16,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  statsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    width: '100%',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnIcon: {
    marginRight: 2,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  restoreBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  guideContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  guideText: {
    fontSize: 11,
    lineHeight: 17,
  },
});

export default GoogleSyncCard;
