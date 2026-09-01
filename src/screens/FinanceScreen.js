import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../theme/typography';
import { isSameDay, isThisWeek, isThisMonth } from '../utils/formatters';
import { useFinance } from '../stores/financeStore';
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
import { TransferModal } from '../components/finance/TransferModal';
import { ReceiptSourceModal } from '../components/finance/ReceiptSourceModal';
import { ReceiptReviewModal } from '../components/finance/ReceiptReviewModal';
import { ReceiptDetailModal } from '../components/finance/ReceiptDetailModal';
import { useWallet } from '../stores/walletStore';
import { NeoSegmented } from '../components/neo/NeoSegmented';
import { ConfirmModal } from '../components/neo/ConfirmModal';
import { getFriendlyErrorMessage } from '../utils/errorHandler';

export const FinanceScreen = ({ onNavigateTab }) => {
  const scrollViewRef = useRef(null);
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();

  const { getTotalNetWorth, wallets } = useWallet();

  const {
    transactions,
    filteredTransactions,
    periodFilter,
    setPeriodFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    summary,
    categoryStats,
    addFromNaturalLanguage,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();

  const totalNetWorth = getTotalNetWorth(transactions);

  // Overall financial summary for All Wallets (fixed, independent of selected individual wallet)
  const allWalletsSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      const isAdjustment = tx.type === 'adjustment' || tx.categoryId === 'cat_adjustment';
      if (isAdjustment) return;

      // Filter by active period
      if (periodFilter === 'today') {
        if (!isSameDay(tx.date, new Date())) return;
      } else if (periodFilter === 'week') {
        if (!isThisWeek(tx.date)) return;
      } else if (periodFilter === 'month') {
        if (!isThisMonth(tx.date)) return;
      }

      // Internal wallet transfers do not count as overall income/expense
      if (tx.isTransfer) return;

      if (tx.type === 'income') {
        totalIncome += tx.amount || 0;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount || 0;
      }
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
    };
  }, [transactions, periodFilter]);

  const [selectedInputDate, setSelectedInputDate] = useState(new Date());
  const [activeViewTab, setActiveViewTab] = useState('list'); // 'list' | 'chart'
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [receiptSourceModalVisible, setReceiptSourceModalVisible] = useState(false);
  const [receiptReviewModalVisible, setReceiptReviewModalVisible] = useState(false);
  const [scannedReceiptData, setScannedReceiptData] = useState(null);
  const [scannedReceiptImageUri, setScannedReceiptImageUri] = useState(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [manageWalletsVisible, setManageWalletsVisible] = useState(false);
  const [initialWalletAddMode, setInitialWalletAddMode] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [modalAlert, setModalAlert] = useState(null);
  const [bgScanStatus, setBgScanStatus] = useState(null);

  const [receiptDetailModalVisible, setReceiptDetailModalVisible] = useState(false);
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState(null);

  const handleOpenReceiptScanner = () => {
    setReceiptSourceModalVisible(true);
  };

  const handleReceiptScanned = (data, imageUri) => {
    setBgScanStatus(null);
    setScannedReceiptData(data);
    setScannedReceiptImageUri(imageUri);
    setReceiptReviewModalVisible(true);
  };

  const handleSaveReceiptTransaction = async (txData) => {
    await addTransaction(txData);
    showSyncToast(
      isIndonesian ? 'Struk belanja berhasil dicatat!' : 'Receipt transaction logged!',
      'checkmark-circle'
    );
  };

  const showSyncToast = (msg, icon = 'checkmark-circle') => {
    const toastObj = typeof msg === 'string' ? { text: msg, icon } : msg;
    setSyncFeedback(toastObj);
    setTimeout(() => setSyncFeedback(null), 3000);
  };



  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  };

  const handleOpenEdit = (tx) => {
    if (tx?.items && tx.items.length > 0) {
      setSelectedReceiptDetail(tx);
      setReceiptDetailModalVisible(true);
    } else {
      setEditingTransaction(tx);
      setManualModalVisible(true);
    }
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

  const handleQuickAdd = async (text, type, date, walletId, walletName) => {
    const res = await addFromNaturalLanguage(text, type, date, walletId, walletName);
    if (res.success) {
      const destinationText = walletName ? ` ke ${walletName}` : '';
      const destinationTextEn = walletName ? ` to ${walletName}` : '';
      showSyncToast(
        isIndonesian
          ? `Berhasil mencatat ${res.count || 1} transaksi${destinationText}`
          : `Recorded ${res.count || 1} transaction(s)${destinationTextEn}`,
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
        {/* Sleek Hero Header Card */}
        <View
          style={[
            styles.headerHeroCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.headerLeftCol}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.glowingIconBadge,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <Ionicons name="stats-chart" size={20} color={colors.primary} />
                <View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: colors.accent || '#8B5CF6' },
                  ]}
                />
              </View>
              <View style={styles.headerTitleTextGroup}>
                <View style={styles.titleWithTagRow}>
                  <Text style={[styles.heroHeaderTitle, { color: colors.text }]}>
                    {isIndonesian ? 'Manajemen Keuangan' : 'Finance Dashboard'}
                  </Text>
                  <View
                    style={[
                      styles.liveTagBadge,
                      { backgroundColor: colors.income + '25' },
                    ]}
                  >
                    <Text style={[styles.liveTagText, { color: colors.income }]}>
                      LIVE
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.heroHeaderSubtitle,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {isIndonesian
                    ? 'Catat Pengeluaranmu'
                    : 'Record Your Expenses'}
                </Text>
              </View>
            </View>
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

        {/* Floating Background Scan Status Banner */}
        {bgScanStatus && (
          <View
            style={[
              styles.syncToastBox,
              { backgroundColor: (colors.accent || '#8B5CF6') + '25', borderColor: colors.accent || '#8B5CF6' },
            ]}
          >
            <ActivityIndicator size="small" color={colors.accent || '#8B5CF6'} />
            <Text style={[styles.syncToastText, { color: colors.text }]}>
              {bgScanStatus.statusMsg || (isIndonesian ? 'Memproses struk di background...' : 'Processing receipt in background...')}
            </Text>
          </View>
        )}

        {/* Fixed All Wallets Overview KPI Card */}
        <SummaryCards
          summary={allWalletsSummary}
          periodFilter={periodFilter}
          periodLabel={getPeriodLabel()}
          onPeriodChange={setPeriodFilter}
          totalNetWorth={totalNetWorth}
        />

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
          onOpenTransfer={() => setTransferModalVisible(true)}
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
            onOpenReceipt={handleOpenReceiptScanner}
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
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
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
      {manualModalVisible && (
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
      )}

      {/* Export to Excel Modal */}
      {exportModalVisible && (
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
              message: getFriendlyErrorMessage(err, 'excel_export', isIndonesian),
              type: 'danger',
              confirmText: isIndonesian ? 'Tutup' : 'Close',
            });
          }}
          transactions={filteredTransactions}
          summary={summary}
          periodLabel={getPeriodLabel()}
        />
      )}

      {/* Import from Excel / CSV Modal */}
      {importModalVisible && (
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
              message: getFriendlyErrorMessage(err, 'excel_import', isIndonesian),
              type: 'danger',
              confirmText: isIndonesian ? 'Tutup' : 'Close',
            });
          }}
        />
      )}

      {/* Manage Custom Wallets Modal */}
      {manageWalletsVisible && (
        <ManageWalletsModal
          visible={manageWalletsVisible}
          onClose={() => setManageWalletsVisible(false)}
          onToast={showSyncToast}
          initialAddMode={initialWalletAddMode}
        />
      )}

      {/* Transfer Between Wallets Modal */}
      {transferModalVisible && (
        <TransferModal
          visible={transferModalVisible}
          onClose={() => setTransferModalVisible(false)}
          onSuccess={(msg) => {
            showSyncToast(msg, 'swap-horizontal');
          }}
        />
      )}

      {/* Receipt Scanner Source / Method Modal */}
      <ReceiptSourceModal
        visible={receiptSourceModalVisible}
        onClose={() => setReceiptSourceModalVisible(false)}
        onReceiptScanned={handleReceiptScanned}
        onScanStarted={(info) => {
          setBgScanStatus(info);
        }}
        onScanError={(err) => {
          setBgScanStatus(null);
          setModalAlert({
            title: isIndonesian ? 'Pemindaian Struk Gagal' : 'Scan Failed',
            message: getFriendlyErrorMessage(err, 'receipt_scan', isIndonesian),
            type: 'danger',
            confirmText: isIndonesian ? 'Tutup' : 'Close',
          });
        }}
        onNavigateSettings={() => {
          if (typeof onNavigateTab === 'function') {
            onNavigateTab('settings');
          }
        }}
      />

      {/* Receipt Review & Edit Modal */}
      {receiptReviewModalVisible && (
        <ReceiptReviewModal
          visible={receiptReviewModalVisible}
          onClose={() => {
            setReceiptReviewModalVisible(false);
            setScannedReceiptData(null);
            setScannedReceiptImageUri(null);
          }}
          scannedData={scannedReceiptData}
          imageUri={scannedReceiptImageUri}
          onSave={handleSaveReceiptTransaction}
          defaultWalletId={wallets[0]?.id}
        />
      )}

      {/* Receipt Item Breakdown & Validation Modal */}
      {receiptDetailModalVisible && (
        <ReceiptDetailModal
          visible={receiptDetailModalVisible}
          onClose={() => {
            setReceiptDetailModalVisible(false);
            setSelectedReceiptDetail(null);
          }}
          transaction={selectedReceiptDetail}
          onEdit={(tx) => {
            setReceiptDetailModalVisible(false);
            setEditingTransaction(tx);
            setManualModalVisible(true);
          }}
          onDelete={(tx) => {
            setReceiptDetailModalVisible(false);
            handleDeleteTransaction(tx.id);
          }}
        />
      )}

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
  headerHeroCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  headerLeftCol: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  glowingIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerTitleTextGroup: {
    flex: 1,
    gap: 2,
  },
  titleWithTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  liveTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroHeaderSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
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
