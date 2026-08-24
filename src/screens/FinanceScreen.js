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
import { SummaryCards } from '../components/finance/SummaryCards';
import { DateStripSelector } from '../components/finance/DateStripSelector';
import { QuickInputBar } from '../components/finance/QuickInputBar';
import { PieChartSection } from '../components/finance/PieChartSection';
import { TransactionList } from '../components/finance/TransactionList';
import { ManualTransactionModal } from '../components/finance/ManualTransactionModal';
import { ExportModal } from '../components/finance/ExportModal';
import { NeoSegmented } from '../components/neo/NeoSegmented';

export const FinanceScreen = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const scrollViewRef = useRef(null);
  const { colors } = useTheme();

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
        return 'Hari Ini';
      case 'week':
        return 'Minggu Ini';
      case 'month':
        return 'Bulan Ini';
      case 'all':
      default:
        return 'Semua Periode';
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
                Catatan Keuangan
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Pencatatan Cepat & Rekap Otomatis
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <Pressable
              onPress={() => setExportModalVisible(true)}
              style={({ pressed }) => [
                styles.exportIconBtn,
                {
                  backgroundColor: colors.incomeLight,
                  borderColor: colors.incomeBorder,
                },
                pressed && styles.exportIconBtnPressed,
              ]}
              accessibilityLabel="Ekspor Excel"
            >
              <Ionicons
                name="download-outline"
                size={20}
                color={colors.incomeDark}
              />
            </Pressable>
          </View>
        </View>

        {/* Unified Hero Balance Card */}
        <SummaryCards summary={summary} periodLabel={getPeriodLabel()} />

        {/* Date Strip & Quick Input */}
        <DateStripSelector
          selectedDate={selectedInputDate}
          onSelectDate={setSelectedInputDate}
        />

        <QuickInputBar
          onAddFromNLP={addFromNaturalLanguage}
          onFocusInput={handleFocusInput}
          selectedDate={selectedInputDate}
          onOpenManualModal={() => {
            setEditingTransaction(null);
            setManualModalVisible(true);
          }}
        />

        {/* For Tablet: 2-column layout; For Mobile: Clean Tab Switcher */}
        {isTablet ? (
          <View style={styles.mainLayoutTablet}>
            <View style={styles.columnTablet}>
              <PieChartSection
                categoryStats={categoryStats}
                periodFilter={periodFilter}
                onSelectPeriod={setPeriodFilter}
                typeFilter={typeFilter === 'income' ? 'income' : 'expense'}
                onSelectType={(newType) => setTypeFilter(newType)}
              />
            </View>
            <View style={styles.columnTablet}>
              <TransactionList
                transactions={filteredTransactions}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                onEditTransaction={handleOpenEdit}
                onDeleteTransaction={deleteTransaction}
              />
            </View>
          </View>
        ) : (
          <View style={styles.mobileSection}>
            {/* Clean Segmented Toggle */}
            <NeoSegmented
              options={[
                {
                  label: `Daftar Transaksi (${filteredTransactions.length})`,
                  value: 'list',
                  iconName: 'receipt-outline',
                  activeColor: colors.primary,
                },
                {
                  label: 'Statistik & Grafik',
                  value: 'chart',
                  iconName: 'pie-chart-outline',
                  activeColor: colors.brandGold || '#D97706',
                },
              ]}
              selectedValue={activeViewTab}
              onSelect={setActiveViewTab}
              style={styles.viewToggleSegmented}
            />

            {activeViewTab === 'list' ? (
              <TransactionList
                transactions={filteredTransactions}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                onEditTransaction={handleOpenEdit}
                onDeleteTransaction={deleteTransaction}
              />
            ) : (
              <PieChartSection
                categoryStats={categoryStats}
                periodFilter={periodFilter}
                onSelectPeriod={setPeriodFilter}
                typeFilter={typeFilter === 'income' ? 'income' : 'expense'}
                onSelectType={(newType) => setTypeFilter(newType)}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <ManualTransactionModal
        visible={manualModalVisible}
        onClose={() => {
          setManualModalVisible(false);
          setEditingTransaction(null);
        }}
        initialTransaction={editingTransaction}
        onSave={handleSaveManual}
        defaultDate={selectedInputDate}
      />

      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        transactions={filteredTransactions}
        summary={summary}
        periodName={getPeriodLabel()}
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
    paddingTop: 2,
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
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  exportIconBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  mainLayoutTablet: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  columnTablet: {
    flex: 1,
  },
  mobileSection: {
    marginTop: 8,
  },
  viewToggleSegmented: {
    marginBottom: 6,
  },
});

export default FinanceScreen;
