import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../theme/typography';
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
import { NeoSegmented } from '../components/neo/NeoSegmented';

export const FinanceScreen = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const scrollViewRef = useRef(null);
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();

  const {
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
  const [refreshing, setRefreshing] = useState(false);

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
                  size={20}
                  color={colors.brandGold || '#D97706'}
                />
              </View>
              <Text style={[styles.headerLogo, { color: colors.text }]}>
                {t('finance.headerTitle', 'Catatan Keuangan')}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {t('finance.headerSubtitle', 'Pencatatan Cepat & Rekap Otomatis')}
            </Text>
          </View>

          <View style={styles.headerButtons}>
            {/* Import Button */}
            <Pressable
              onPress={() => setImportModalVisible(true)}
              style={({ pressed }) => [
                styles.actionIconBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                pressed && styles.actionIconBtnPressed,
              ]}
              accessibilityLabel={isIndonesian ? 'Impor Excel' : 'Import Excel'}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={18}
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
                pressed && styles.actionIconBtnPressed,
              ]}
              accessibilityLabel={t('finance.exportBtn', 'Ekspor ke Excel')}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={colors.incomeDark || '#16A34A'}
              />
            </Pressable>
          </View>
        </View>

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
    marginBottom: 8,
    paddingBottom: 10,
    paddingTop: 4,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
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
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 3,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.93 }],
  },
  viewToggleContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
});

export default FinanceScreen;
