import React, { useState, useRef } from 'react';
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

  const showSyncToast = (msg) => {
    setSyncFeedback(msg);
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
        showSyncToast(isIndonesian ? 'Pilih Drive untuk menyimpan data!' : 'Select Drive to save backup!');
      }
    } else {
      const res = await performSync(getLocalSnapshot, applyMerged);
      if (res.success) {
        showSyncToast(res.message);
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
      setEditingTransaction(null);
    } else {
      await addTransaction(txData);
    }
  };

  const handleFocusInput = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 160, animated: true });
    }, 120);
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
        automaticallyAdjustKeyboardInsets={true}
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
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.syncToastText}>{syncFeedback}</Text>
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
        <QuickInputBar
          onAdd={addFromNaturalLanguage}
          onOpenManual={() => {
            setEditingTransaction(null);
            setManualModalVisible(true);
          }}
          selectedDate={selectedInputDate}
          onFocusInput={handleFocusInput}
        />

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
          <TransactionList
            transactions={filteredTransactions}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onEdit={handleOpenEdit}
            onDelete={deleteTransaction}
            onOpenManual={() => {
              setEditingTransaction(null);
              setManualModalVisible(true);
            }}
          />
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
      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        transactions={filteredTransactions}
        summary={summary}
        periodLabel={getPeriodLabel()}
      />

      {/* Import from Excel / CSV Modal */}
      <ImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
      />

      {/* Manage Custom Wallets Modal */}
      <ManageWalletsModal
        visible={manageWalletsVisible}
        onClose={() => setManageWalletsVisible(false)}
        initialAddMode={initialWalletAddMode}
      />
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
    paddingBottom: 48,
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
