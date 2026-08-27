import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../theme/typography';
import { useFinance } from '../stores/financeStore';
import { useQuran } from '../stores/quranStore';
import { useSync } from '../stores/syncStore';
import { useTheme } from '../stores/themeStore';
import { useLanguage } from '../stores/languageStore';
import { SummaryCards } from '../components/finance/SummaryCards';
import { DateStripSelector } from '../components/finance/DateStripSelector';
import { QuickInputBar } from '../components/finance/QuickInputBar';
import { PieChartSection } from '../components/finance/PieChartSection';
import { TransactionList } from '../components/finance/TransactionList';
import { ManualTransactionModal } from '../components/finance/ManualTransactionModal';
import { ExportModal } from '../components/finance/ExportModal';
import { ImportModal } from '../components/finance/ImportModal';
import { WalletCarousel } from '../components/finance/WalletCarousel';
import { ManageWalletsModal } from '../components/finance/ManageWalletsModal';
import { NeoSegmented } from '../components/neo/NeoSegmented';
import { ConfirmModal } from '../components/neo/ConfirmModal';

export const FinanceScreen = () => {
  const scrollViewRef = useRef(null);
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const { isConnected, isSyncing, performSync, backupToGoogleDriveFile } = useSync();
  const { favorites, history, replaceFavoritesAndHistory } = useQuran();

  const {
    transactions,
    replaceTransactions,
    filteredTransactions,
    periodFilter,
    setPeriodFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    summary,
    categoryStats,
    addFromNaturalLanguage,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();

  const [selectedInputDate, setSelectedInputDate] = useState(new Date());
  const [activeViewTab, setActiveViewTab] = useState('list'); // 'list' | 'chart'
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [manageWalletsVisible, setManageWalletsVisible] = useState(false);
  const [initialWalletAddMode, setInitialWalletAddMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [modalAlert, setModalAlert] = useState(null);

  const showSyncToast = (msg, icon = 'checkmark-circle') => {
    const toastObj = typeof msg === 'string' ? { text: msg, icon } : msg;
    setSyncFeedback(toastObj);
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const getLocalSnapshot = () => ({
    transactions: transactions || [],
    quranFavorites: favorites || [],
    quranHistory: history || [],
  });

  const applyMerged = async (mergeResult) => {
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

  const handleQuickSync = async () => {
    if (!isConnected) {
      const res = await backupToGoogleDriveFile(getLocalSnapshot);
      if (res.success) {
        showSyncToast(
          isIndonesian ? 'Pilih Drive untuk menyimpan data' : 'Select Drive to save backup',
          'cloud-upload-outline'
        );
      }
    } else {
      const res = await performSync(getLocalSnapshot, applyMerged);
      if (res.success) {
        showSyncToast(res.message, 'sync-outline');
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleOpenEdit = (tx) => {
    setEditingTransaction(tx);
    setManualModalVisible(true);
  };

  const handleSaveManual = async (txData) => {
    if (editingTransaction) {
      await updateTransaction(txData.id, txData);
      showSyncToast(
        isIndonesian ? 'Transaksi berhasil diperbarui' : 'Transaction updated',
        'checkmark-circle'
      );
      setEditingTransaction(null);
    } else {
      await addTransaction(txData);
      showSyncToast(
        isIndonesian ? 'Transaksi berhasil dicatat' : 'Transaction recorded',
        'checkmark-circle'
      );
    }
  };

  const handleDeleteTransaction = async (id) => {
    await deleteTransaction(id);
    showSyncToast(
      isIndonesian ? 'Transaksi berhasil dihapus' : 'Transaction deleted',
      'trash-outline'
    );
  };

  const handleQuickAdd = async (text, type, date) => {
    const res = await addFromNaturalLanguage(text, type, date);
    if (res.success) {
      showSyncToast(
        isIndonesian
          ? `Berhasil mencatat ${res.count || 1} transaksi`
          : `Recorded ${res.count || 1} transactions`,
        'checkmark-circle'
      );
    }
    return res;
  };

  const [quickInputY, setQuickInputY] = useState(480);
  const [transactionListY, setTransactionListY] = useState(700);

  const isKeyboardVisibleRef = useRef(false);
  const targetScrollYRef = useRef(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        isKeyboardVisibleRef.current = true;
        if (targetScrollYRef.current !== null) {
          const y = targetScrollYRef.current;
          requestAnimationFrame(() => {
            scrollViewRef.current?.scrollTo({
              y,
              animated: true,
            });
          });
        }
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        isKeyboardVisibleRef.current = false;
        targetScrollYRef.current = null;
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const smoothScrollToTarget = (targetY) => {
    const y = Math.max(0, targetY - 14);
    targetScrollYRef.current = y;
    if (isKeyboardVisibleRef.current) {
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          y,
          animated: true,
        });
      });
    } else {
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (targetScrollYRef.current !== null) {
            scrollViewRef.current?.scrollTo({
              y: targetScrollYRef.current,
              animated: true,
            });
          }
        });
      }, 140);
    }
  };

  const handleFocusInput = () => {
    smoothScrollToTarget(quickInputY);
  };

  const handleSearchFocus = () => {
    smoothScrollToTarget(transactionListY);
  };

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'today':
        return t('finance.today', 'Hari Ini');
      case 'week':
        return t('finance.thisWeek', 'Minggu Ini');
      case 'month':
        return t('finance.thisMonth', 'Bulan Ini');
      case 'all':
      default:
        return t('finance.allPeriods', 'Semua Periode');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Bar */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoRow}>
              <View
                style={[
                  styles.logoBadge,
                  { backgroundColor: colors.brandGoldLight || '#FEF3C7' },
                ]}
              >
                <Ionicons
                  name="wallet"
                  size={18}
                  color={colors.brandGold || '#D97706'}
                />
              </View>
              <Text
                style={[styles.headerLogo, { color: colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {t('finance.headerTitle', 'Catatan Keuangan')}
              </Text>
            </View>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('finance.headerSubtitle', 'Pencatatan Cepat & Rekap Otomatis')}
            </Text>
          </View>

          <View style={styles.headerButtons}>
            {/* Google Drive Cloud Sync Quick Button */}
            <Pressable
              onPress={handleQuickSync}
              style={({ pressed }) => [
                styles.actionIconBtn,
                {
                  backgroundColor: isConnected ? colors.accentLight || '#DBEAFE' : colors.surface,
                  borderColor: isConnected ? colors.accent : colors.border,
                },
                pressed ? styles.actionIconBtnPressed : null,
              ]}
              accessibilityLabel="Sync Google Drive"
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons
                  name={isConnected ? 'cloud-done' : 'cloud-upload-outline'}
                  size={17}
                  color={isConnected ? colors.accent : colors.textSecondary}
                />
              )}
            </Pressable>

            {/* Import Button */}
            <Pressable
              onPress={() => setImportModalVisible(true)}
              style={({ pressed }) => [
                styles.actionIconBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                pressed ? styles.actionIconBtnPressed : null,
              ]}
              accessibilityLabel={isIndonesian ? 'Impor Excel' : 'Import Excel'}
            >
              <Ionicons
                name="download-outline"
                size={17}
                color={colors.primary}
              />
            </Pressable>

            {/* Export Button */}
            <Pressable
              onPress={() => setExportModalVisible(true)}
              style={({ pressed }) => [
                styles.actionIconBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                pressed ? styles.actionIconBtnPressed : null,
              ]}
              accessibilityLabel={t('finance.exportBtn', 'Ekspor ke Excel')}
            >
              <Ionicons
                name="document-text-outline"
                size={17}
                color={colors.incomeDark || '#16A34A'}
              />
            </Pressable>
          </View>
        </View>

        {/* Floating Sync Toast Feedback */}
        {syncFeedback && (
          <View
            style={[
              styles.syncToastBox,
              { backgroundColor: colors.accent, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name={syncFeedback.icon || 'checkmark-circle'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.syncToastText}>{syncFeedback.text}</Text>
          </View>
        )}

        {/* Diversified Custom Wallets Carousel */}
        <WalletCarousel
          onOpenManageWallets={() => {
            setInitialWalletAddMode(false);
            setManageWalletsVisible(true);
          }}
          onAddNewWallet={() => {
            setInitialWalletAddMode(true);
            setManageWalletsVisible(true);
          }}
        />

        {/* Financial Summary KPI Cards */}
        <SummaryCards
          summary={summary}
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
        />

        {/* 7-Day Date Strip & Calendar Picker */}
        <DateStripSelector
          selectedDate={selectedInputDate}
          onSelectDate={setSelectedInputDate}
        />

        {/* Smart Natural Language Quick Input Bar */}
        <View onLayout={(e) => setQuickInputY(e.nativeEvent.layout.y)}>
          <QuickInputBar
            onAdd={handleQuickAdd}
            onOpenManual={() => {
              setEditingTransaction(null);
              setManualModalVisible(true);
            }}
            selectedDate={selectedInputDate}
            onFocus={handleFocusInput}
            onFocusInput={handleFocusInput}
          />
        </View>

        {/* View Toggle Tabs (Transaction List vs Stats & Charts) */}
        <View style={styles.viewToggleContainer}>
          <NeoSegmented
            options={[
              {
                label: `${t('finance.transactionHistory', 'Daftar Transaksi')} (${filteredTransactions.length})`,
                value: 'list',
                iconName: 'list-outline',
              },
              {
                label: t('finance.chartView', 'Statistik & Grafik'),
                value: 'chart',
                iconName: 'pie-chart-outline',
              },
            ]}
            selectedValue={activeViewTab}
            onSelect={setActiveViewTab}
          />
        </View>

        {/* Main Content Area */}
        {activeViewTab === 'list' ? (
          <View onLayout={(e) => setTransactionListY(e.nativeEvent.layout.y)}>
            <TransactionList
              transactions={filteredTransactions}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteTransaction}
              onSearchFocus={handleSearchFocus}
            />
          </View>
        ) : (
          <PieChartSection
            categoryStats={categoryStats}
            summary={summary}
            periodFilter={periodFilter}
            onSelectPeriod={setPeriodFilter}
            typeFilter={typeFilter}
            onSelectType={setTypeFilter}
          />
        )}
      </ScrollView>

      {/* Manual Input / Edit Modal */}
      <ManualTransactionModal
        visible={manualModalVisible}
        onClose={() => {
          setManualModalVisible(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveManual}
        initialTransaction={editingTransaction}
        initialData={editingTransaction}
        defaultDate={selectedInputDate}
      />

      {/* Export to Excel Modal */}
      {/* Export to Excel Modal */}
      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onSuccess={(fileName) => {
          showSyncToast(
            isIndonesian ? `Rekap ${fileName} siap dibagikan` : `Exported ${fileName}`,
            'document-text-outline'
          );
          setModalAlert({
            title: isIndonesian ? 'Ekspor Berhasil' : 'Export Successful',
            message: isIndonesian
              ? `Laporan Excel (${fileName}) telah selesai dibuat dan siap disimpan atau dibagikan.`
              : `Excel report (${fileName}) is ready to download or share.`,
            type: 'success',
            iconName: 'document-text-outline',
            confirmText: isIndonesian ? 'Selesai' : 'Done',
          });
        }}
        onError={(err) => {
          setModalAlert({
            title: isIndonesian ? 'Gagal Ekspor' : 'Export Failed',
            message: err,
            type: 'danger',
            confirmText: isIndonesian ? 'Tutup' : 'Close',
          });
        }}
        transactions={filteredTransactions}
        summary={summary}
        periodLabel={getPeriodLabel()}
      />

      {/* Import from Excel / CSV Modal */}
      <ImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSuccess={(count) => {
          showSyncToast(
            isIndonesian
              ? `Berhasil mengimpor ${count} transaksi`
              : `Successfully imported ${count} transactions`,
            'cloud-download-outline'
          );
          setModalAlert({
            title: isIndonesian ? 'Impor Berhasil' : 'Import Successful',
            message: isIndonesian
              ? `Berhasil memasukkan ${count} catatan transaksi ke dalam pembukuan Anda.`
              : `Successfully imported ${count} transaction records into your financial bookkeeping.`,
            type: 'success',
            iconName: 'cloud-download-outline',
            confirmText: isIndonesian ? 'Selesai' : 'Done',
          });
        }}
        onError={(err) => {
          setModalAlert({
            title: isIndonesian ? 'Gagal Mengimpor Data' : 'Import Failed',
            message: err,
            type: 'danger',
            confirmText: isIndonesian ? 'Tutup' : 'Close',
          });
        }}
      />

      {/* Manage Custom Wallets Modal */}
      <ManageWalletsModal
        visible={manageWalletsVisible}
        onClose={() => setManageWalletsVisible(false)}
        onToast={showSyncToast}
        initialAddMode={initialWalletAddMode}
      />

      {/* Custom Neo Notification / Alert Modal */}
      {modalAlert && (
        <ConfirmModal
          visible={Boolean(modalAlert)}
          onClose={() => setModalAlert(null)}
          onConfirm={() => {
            if (modalAlert.onConfirm) modalAlert.onConfirm();
            setModalAlert(null);
          }}
          title={modalAlert.title}
          message={modalAlert.message}
          type={modalAlert.type || 'info'}
          iconName={modalAlert.iconName}
          confirmText={modalAlert.confirmText || (isIndonesian ? 'Selesai' : 'Done')}
          showCancel={false}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 220,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerLogo: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.93 }],
  },
  viewToggleContainer: {
    marginTop: 18,
    marginBottom: 14,
  },
  syncToastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 10,
    gap: 8,
  },
  syncToastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: TYPOGRAPHY.families.bold,
    fontWeight: '700',
    flex: 1,
  },
});

export default FinanceScreen;
