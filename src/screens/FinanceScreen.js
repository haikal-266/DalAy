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
  useWindowDimensions,
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
import { PushToTalkButton } from '../components/voice/PushToTalkButton';
import { VoiceListeningOverlay } from '../components/voice/VoiceListeningOverlay';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { parseFinancialInput } from '../utils/parser';
import { getFriendlyErrorMessage } from '../utils/errorHandler';

export const FinanceScreen = React.memo(({ onNavigateTab }) => {
  const scrollViewRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600 || width >= 768;
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
    addMultipleTransactions,
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
    if (res?.success) {
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

  const [isHoldingVoice, setIsHoldingVoice] = useState(false);

  // Push-To-Talk Voice Input Hook
  const {
    isListening: isVoiceListening,
    transcript: voiceTranscript,
    interimTranscript: voiceInterimTranscript,
    fullTranscript: voiceFullTranscript,
    error: voiceError,
    isExpoGo,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
    resetTranscript: resetVoiceTranscript,
  } = useVoiceInput({ defaultLang: 'id-ID' });

  // Real-time detection while user is holding and speaking
  const liveVoiceDetection = useMemo(() => {
    const textToParse = voiceFullTranscript.trim();
    if (!isHoldingVoice && !isVoiceListening) {
      return { walletName: null, categoryName: null, type: null };
    }
    if (!textToParse) {
      return { walletName: null, categoryName: null, type: null };
    }
    const items = parseFinancialInput(textToParse, 'expense', wallets, wallets[0]?.id);
    if (items.length > 0) {
      return {
        walletName: items[0].walletName || null,
        categoryName: items[0].categoryName || null,
        type: items[0].type || null,
      };
    }
    return { walletName: null, categoryName: null, type: null };
  }, [isHoldingVoice, isVoiceListening, voiceFullTranscript, wallets]);

  const handlePushToTalkStart = async () => {
    setIsHoldingVoice(true);
    resetVoiceTranscript();
    const success = await startVoiceListening({ lang: 'id-ID', continuous: true });
    if (!success) {
      setIsHoldingVoice(false);
      if (isExpoGo) {
        showSyncToast(
          isIndonesian
            ? 'Fitur suara butuh build native (tidak didukung di Expo Go)'
            : 'Voice input requires native build',
          'alert-circle-outline'
        );
      }
    }
  };

  const handlePushToTalkEnd = async () => {
    setIsHoldingVoice(false);
    const result = await stopVoiceListening();
    const spoken =
      typeof result === 'object' && result?.transcript !== undefined
        ? result.transcript
        : result || voiceFullTranscript || voiceTranscript;
    const lastErr = typeof result === 'object' && result?.error ? result.error : voiceError;

    if (!spoken?.trim()) {
      if (lastErr === 'permission-denied') {
        showSyncToast(
          isIndonesian ? 'Izin mikrofon diperlukan' : 'Microphone permission required',
          'alert-circle-outline'
        );
      } else if (lastErr === 'network-error') {
        showSyncToast(
          isIndonesian ? 'Koneksi suara terputus' : 'Voice network error',
          'alert-circle-outline'
        );
      } else {
        showSyncToast(
          isIndonesian ? 'Suara tidak terdeteksi' : 'No speech detected',
          'mic-off-outline'
        );
      }
      resetVoiceTranscript();
      return;
    }

    // Parse all financial items with wallet, category & type (income/expense) matching
    const parsedItems = parseFinancialInput(
      spoken,
      'expense',
      wallets,
      wallets[0]?.id
    );

    if (parsedItems.length === 0) {
      showSyncToast(
        isIndonesian
          ? 'Nominal transaksi tidak terdeteksi'
          : 'No transaction amount detected',
        'alert-circle-outline'
      );
      resetVoiceTranscript();
      return;
    }

    const txDataList = parsedItems.map((item) => ({
      name: item.name,
      amount: item.amount,
      type: item.type || 'expense',
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      iconName: item.iconName,
      iconFamily: item.iconFamily,
      categoryColor: item.categoryColor,
      categoryBgColor: item.categoryBgColor,
      walletId: item.walletId || wallets[0]?.id,
      walletName: item.walletName || wallets[0]?.name,
      rawText: item.rawText,
      date: selectedInputDate ? new Date(selectedInputDate).toISOString() : new Date().toISOString(),
    }));

    await addMultipleTransactions(txDataList);

    const isAllIncome = parsedItems.every((it) => it.type === 'income');
    const isAllExpense = parsedItems.every((it) => it.type === 'expense');
    const typeLabel = isAllIncome
      ? isIndonesian ? ' pemasukan' : ' income'
      : isAllExpense
      ? isIndonesian ? ' pengeluaran' : ' expense'
      : '';

    showSyncToast(
      isIndonesian
        ? `Berhasil mencatat ${parsedItems.length}${typeLabel}`
        : `Recorded ${parsedItems.length}${typeLabel} transaction(s)`,
      'checkmark-circle'
    );

    resetVoiceTranscript();
  };

  const handleCancelVoice = async () => {
    setIsHoldingVoice(false);
    await stopVoiceListening();
    resetVoiceTranscript();
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
      {/* Floating Top Screen Toast Banner - Always visible regardless of scroll position */}
      {syncFeedback && (
        <View
          style={[
            styles.floatingScreenToast,
            {
              backgroundColor: colors.accent || '#0D9488',
              borderColor: colors.borderLight,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name={syncFeedback.icon || 'checkmark-circle'}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.floatingScreenToastText} numberOfLines={2}>
            {syncFeedback.text}
          </Text>
        </View>
      )}

      {/* Floating Top Background Scan Status Banner */}
      {bgScanStatus && (
        <View
          style={[
            styles.floatingScreenToast,
            {
              top: syncFeedback ? (Platform.OS === 'ios' ? 108 : 78) : (Platform.OS === 'ios' ? 52 : 24),
              backgroundColor: colors.surfaceLight || '#1E293B',
              borderColor: colors.accent || '#8B5CF6',
            },
          ]}
          pointerEvents="none"
        >
          <ActivityIndicator size="small" color={colors.accent || '#8B5CF6'} />
          <Text style={[styles.floatingScreenToastText, { color: colors.text }]}>
            {bgScanStatus.statusMsg || (isIndonesian ? 'Memproses struk di background...' : 'Processing receipt in background...')}
          </Text>
        </View>
      )}

      {isTablet ? (
        <View style={styles.tabletOuter}>
          {/* Enhanced Fixed Header Bar on Tablet */}
          <View
            style={[
              styles.header,
              styles.tabletHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.logoRow}>
                <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="wallet" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.headerLogo, { color: colors.text }]}>
                  {t('quran.appName', 'DalAy')}
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {isIndonesian ? 'Manajemen Keuangan & Dompet' : 'Finance & Wallet Dashboard'}
              </Text>
            </View>

            <View style={styles.headerRightGroup}>
              <View
                style={[
                  styles.liveTagBadge,
                  { backgroundColor: colors.income + '20', borderColor: colors.income },
                ]}
              >
                <View style={[styles.pulseDotInline, { backgroundColor: colors.income }]} />
                <Text style={[styles.liveTagText, { color: colors.incomeDark }]}>
                  LIVE
                </Text>
              </View>
            </View>
          </View>

          {/* Tablet Dual-Pane Independent Scroll Layout */}
          <View style={styles.tabletPanesRow}>
            {/* Left Pane: Summary, Wallets, Inputs, and Transaction List */}
            <View style={styles.tabletPaneColumn}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.paneScrollView}
                contentContainerStyle={styles.paneScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                  />
                }
              >
                <SummaryCards
                  summary={allWalletsSummary}
                  periodFilter={periodFilter}
                  periodLabel={getPeriodLabel()}
                  onPeriodChange={setPeriodFilter}
                  totalNetWorth={totalNetWorth}
                />

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

                <DateStripSelector
                  selectedDate={selectedInputDate}
                  onSelectDate={setSelectedInputDate}
                />

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
              </ScrollView>
            </View>

            {/* Subtle Vertical Divider between Panes */}
            <View style={[styles.tabletVerticalDivider, { backgroundColor: colors.border }]} />

            {/* Right Pane: Live Chart & Analytics with Independent Scroll */}
            <View style={styles.tabletPaneColumn}>
              <ScrollView
                style={styles.paneScrollView}
                contentContainerStyle={styles.paneScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <PieChartSection
                  categoryStats={categoryStats}
                  summary={summary}
                  periodFilter={periodFilter}
                  onSelectPeriod={setPeriodFilter}
                  typeFilter={typeFilter}
                  onSelectType={setTypeFilter}
                />
              </ScrollView>
            </View>
          </View>
        </View>
      ) : (
        /* Mobile Portrait Single Scroll Flow */
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 16 }]}
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
                <View style={[styles.logoBadge, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="wallet" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.headerLogo, { color: colors.text }]}>
                  {t('quran.appName', 'DalAy')}
                </Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {isIndonesian ? 'Manajemen Keuangan' : 'Finance Dashboard'}
              </Text>
            </View>

            <View style={styles.headerRightGroup}>
              <View
                style={[
                  styles.liveTagBadge,
                  { backgroundColor: colors.income + '20', borderColor: colors.income },
                ]}
              >
                <View style={[styles.pulseDotInline, { backgroundColor: colors.income }]} />
                <Text style={[styles.liveTagText, { color: colors.incomeDark }]}>
                  LIVE
                </Text>
              </View>
            </View>
          </View>
          {/* Mobile All Wallets Overview KPI Card */}
          <SummaryCards
            summary={allWalletsSummary}
            periodFilter={periodFilter}
            periodLabel={getPeriodLabel()}
            onPeriodChange={setPeriodFilter}
            totalNetWorth={totalNetWorth}
          />

          {/* Mobile Wallets Carousel */}
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

          {/* Mobile 7-Day Date Strip & Calendar Picker */}
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

          {/* Mobile Tab Content */}
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
      )}

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
      {/* Push-To-Talk Floating Action Button - Exclusively on Finance Tab */}
      <PushToTalkButton
        onPressIn={handlePushToTalkStart}
        onPressOut={handlePushToTalkEnd}
        isListening={isVoiceListening || isHoldingVoice}
      />

      {/* Full-Screen Blur/Backdrop Overlay while Holding Button */}
      <VoiceListeningOverlay
        visible={isVoiceListening || isHoldingVoice}
        transcript={voiceTranscript}
        interimTranscript={voiceInterimTranscript}
        detectedType={liveVoiceDetection.type}
        detectedWallet={liveVoiceDetection.walletName}
        detectedCategory={liveVoiceDetection.categoryName}
        isExpoGo={isExpoGo}
        onClose={handleCancelVoice}
      />
    </KeyboardAvoidingView>
  );
});

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
    marginBottom: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: 1,
    width: '100%',
  },
  tabletHeader: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 0,
  },
  headerLeft: {
    flexShrink: 0,
    marginRight: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    minWidth: 85,
    paddingRight: 14,
    paddingBottom: 2,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
    fontWeight: '500',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  liveTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pulseDotInline: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionIconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.93 }],
  },
  tabletOuter: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  tabletHeroHeader: {
    marginHorizontal: 24,
    marginTop: 10,
    marginBottom: 0,
  },
  tabletToastMargin: {
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 0,
  },
  tabletPanesRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 18,
    width: '100%',
    height: '100%',
    alignItems: 'stretch',
  },
  tabletVerticalDivider: {
    width: 1,
    height: '100%',
    alignSelf: 'stretch',
    opacity: 0.7,
  },
  tabletPaneColumn: {
    flex: 1,
    height: '100%',
    minWidth: 0,
  },
  paneScrollView: {
    flex: 1,
    width: '100%',
  },
  paneScrollContent: {
    paddingBottom: 40,
  },
  viewToggleContainer: {
    marginTop: 18,
    marginBottom: 14,
  },
  floatingScreenToast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 24,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
    gap: 10,
  },
  floatingScreenToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.2,
  },
});

export default FinanceScreen;
