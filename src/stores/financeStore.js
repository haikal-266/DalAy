import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseFinancialInput } from '../utils/parser';
import { isSameDay, isThisWeek, isThisMonth } from '../utils/formatters';

const STORAGE_KEY_TRANSACTIONS = '@quranku_transactions';

const FinanceContext = createContext(null);

export const FinanceProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('all'); // 'today' | 'week' | 'month' | 'all'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'expense' | 'income'
  const [walletFilter, setWalletFilter] = useState('all'); // 'all' | walletId
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | categoryId
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Filter out any legacy dummy samples and auto-heal adjustment flags if missing
        const cleaned = Array.isArray(parsed)
          ? parsed
              .filter((t) => t && !String(t.id).startsWith('tx_sample_'))
              .map((t) => {
                if (t && (t.type === 'adjustment' || t.categoryId === 'cat_adjustment')) {
                  if (t.isIncrease === undefined && t.adjustmentDiff === undefined) {
                    const isPositive = t.rawText ? t.rawText.includes('+') : false;
                    return {
                      ...t,
                      isIncrease: isPositive,
                      adjustmentDiff: isPositive ? (t.amount || 0) : -(t.amount || 0),
                    };
                  }
                }
                return t;
              })
          : [];
        setTransactions(cleaned);
        await AsyncStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(cleaned));
      } else {
        setTransactions([]);
        await AsyncStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify([]));
      }
    } catch (e) {
      console.log('Error loading transactions:', e);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const saveTransactions = async (newTxList) => {
    try {
      setTransactions(newTxList);
      await AsyncStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(newTxList));
    } catch (e) {
      console.log('Error saving transactions:', e);
    }
  };

  /**
   * Add transactions via Natural Language Input
   * e.g. "makan 5k, bensin 15k"
   */
  const addFromNaturalLanguage = async (
    rawInput,
    type = 'expense',
    customDate = null,
    targetWalletId = null,
    targetWalletName = null
  ) => {
    const parsed = parseFinancialInput(rawInput, type);
    if (!parsed || parsed.length === 0) {
      return { success: false, count: 0, message: 'Tidak ada transaksi yang berhasil dibaca.' };
    }

    const itemsWithDate = parsed.map((item) => ({
      ...item,
      walletId: targetWalletId || (walletFilter !== 'all' ? walletFilter : 'wallet_cash'),
      walletName: targetWalletName || 'Tunai',
      date: customDate ? new Date(customDate).toISOString() : (item.date || new Date().toISOString()),
    }));

    const updated = [...itemsWithDate, ...transactions];
    await saveTransactions(updated);
    return { success: true, count: itemsWithDate.length, items: itemsWithDate };
  };

  /**
   * Add single manual transaction
   */
  const addTransaction = async (txData) => {
    const newTx = {
      ...txData,
      id: txData.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: txData.type || 'expense',
      name: txData.name || 'Transaksi Baru',
      amount: txData.amount || 0,
      walletId: txData.walletId || (walletFilter !== 'all' ? walletFilter : 'wallet_cash'),
      walletName: txData.walletName || 'Tunai',
      categoryId: txData.categoryId || 'other',
      categoryName: txData.categoryName || 'Lain-lain',
      iconName: txData.iconName || 'cube',
      iconFamily: txData.iconFamily || 'Ionicons',
      categoryColor: txData.categoryColor || '#64748B',
      categoryBgColor: txData.categoryBgColor || '#F1F5F9',
      rawText: txData.rawText || txData.name,
      date: txData.date || new Date().toISOString(),
    };

    const updated = [newTx, ...transactions];
    await saveTransactions(updated);
    return newTx;
  };

  /**
   * Import multiple transactions from Excel/CSV
   */
  const importTransactions = async (importedList) => {
    if (!Array.isArray(importedList) || importedList.length === 0) {
      return { success: false, count: 0 };
    }
    const updated = [...importedList, ...transactions];
    await saveTransactions(updated);
    return { success: true, count: importedList.length };
  };

  /**
   * Transfer funds between wallets
   */
  const transferBalance = async ({
    sourceWalletId,
    sourceWalletName,
    targetWalletId,
    targetWalletName,
    amount,
    adminFee = 0,
    note = '',
    date = null,
  }) => {
    const transferId = `trf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const txDate = date ? new Date(date).toISOString() : new Date().toISOString();
    const numAmount = Number(amount) || 0;
    const numFee = Number(adminFee) || 0;

    // 1. Transaction Out from Source Wallet
    const txOut = {
      id: `tx_trf_out_${Date.now()}_1`,
      transferId,
      isTransfer: true,
      transferRole: 'out',
      type: 'expense',
      name: `Transfer ke ${targetWalletName}`,
      amount: numAmount,
      walletId: sourceWalletId,
      walletName: sourceWalletName,
      targetWalletId,
      targetWalletName,
      categoryId: 'cat_transfer',
      categoryName: 'Transfer Dompet',
      iconName: 'swap-horizontal',
      iconFamily: 'Ionicons',
      categoryColor: '#0EA5E9',
      categoryBgColor: '#E0F2FE',
      rawText: note || `Transfer ke ${targetWalletName}`,
      date: txDate,
    };

    // 2. Transaction In to Target Wallet
    const txIn = {
      id: `tx_trf_in_${Date.now()}_2`,
      transferId,
      isTransfer: true,
      transferRole: 'in',
      type: 'income',
      name: `Transfer dari ${sourceWalletName}`,
      amount: numAmount,
      walletId: targetWalletId,
      walletName: targetWalletName,
      sourceWalletId,
      sourceWalletName,
      categoryId: 'cat_transfer',
      categoryName: 'Transfer Dompet',
      iconName: 'swap-horizontal',
      iconFamily: 'Ionicons',
      categoryColor: '#0EA5E9',
      categoryBgColor: '#E0F2FE',
      rawText: note || `Transfer dari ${sourceWalletName}`,
      date: txDate,
    };

    const newTxs = [txOut, txIn];

    // 3. Admin Fee if any (charged to Source Wallet)
    if (numFee > 0) {
      const txFee = {
        id: `tx_trf_fee_${Date.now()}_3`,
        transferId,
        isTransferFee: true,
        type: 'expense',
        name: `Biaya Admin (${sourceWalletName} → ${targetWalletName})`,
        amount: numFee,
        walletId: sourceWalletId,
        walletName: sourceWalletName,
        categoryId: 'cat_admin_fee',
        categoryName: 'Biaya Admin',
        iconName: 'receipt-outline',
        iconFamily: 'Ionicons',
        categoryColor: '#F59E0B',
        categoryBgColor: '#FEF3C7',
        rawText: 'Biaya Admin Transfer',
        date: txDate,
      };
      newTxs.push(txFee);
    }

    const updated = [...newTxs, ...transactions];
    await saveTransactions(updated);
    return { success: true, count: newTxs.length, transferId };
  };

  const updateTransaction = async (id, updatedFields) => {
    const updated = transactions.map((t) =>
      t.id === id ? { ...t, ...updatedFields } : t
    );
    await saveTransactions(updated);
  };

  const deleteTransaction = async (id) => {
    const target = transactions.find((t) => t.id === id);
    let updated;
    if (target?.transferId) {
      // If deleting a transfer, remove all paired transfer records
      updated = transactions.filter((t) => t.transferId !== target.transferId);
    } else {
      updated = transactions.filter((t) => t.id !== id);
    }
    await saveTransactions(updated);
  };

  const clearAllTransactions = async () => {
    await saveTransactions([]);
  };

  /**
   * Replace whole transaction list (used by Cloud Sync)
   */
  const replaceTransactions = async (newTxList) => {
    if (Array.isArray(newTxList)) {
      await saveTransactions(newTxList);
    }
  };

  // Filtered transactions based on active period, type, wallet, and search query
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter by Wallet
      if (walletFilter !== 'all') {
        const txWalletId = tx.walletId || 'wallet_cash';
        if (txWalletId !== walletFilter) {
          return false;
        }
      }

      // Filter by Type
      if (typeFilter !== 'all') {
        const isAdjustment = tx.type === 'adjustment' || tx.categoryId === 'cat_adjustment';
        if (isAdjustment) return false;
        if (tx.type !== typeFilter) {
          return false;
        }
      }

      // Filter by Category
      if (categoryFilter !== 'all') {
        const txCatId = tx.categoryId || 'other';
        if (txCatId !== categoryFilter) {
          return false;
        }
      }

      // Filter by Period
      if (periodFilter === 'today') {
        if (!isSameDay(tx.date, new Date())) return false;
      } else if (periodFilter === 'week') {
        if (!isThisWeek(tx.date)) return false;
      } else if (periodFilter === 'month') {
        if (!isThisMonth(tx.date)) return false;
      }

      // Filter by Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = tx.name.toLowerCase().includes(q);
        const matchCategory = (tx.categoryName || '').toLowerCase().includes(q);
        const matchAmount = tx.amount.toString().includes(q);
        const matchWallet = (tx.walletName || '').toLowerCase().includes(q);
        if (!matchName && !matchCategory && !matchAmount && !matchWallet) return false;
      }

      return true;
    });
  }, [transactions, walletFilter, periodFilter, typeFilter, categoryFilter, searchQuery]);

  // Overall Financial Summary
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((tx) => {
      const isAdjustment = tx.type === 'adjustment' || tx.categoryId === 'cat_adjustment';
      if (isAdjustment) {
        // Balance corrections are reconciliations, not actual cashflow income/expense
        return;
      }
      // When viewing 'all' wallets, internal transfers between your own wallets
      // should NOT inflate total income or expense! (Only transfer fee counts as real expense)
      if (walletFilter === 'all' && tx.isTransfer) {
        return;
      }
      if (tx.type === 'income') {
        totalIncome += tx.amount || 0;
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount || 0;
      }
    });

    const balance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions, walletFilter]);

  // Category breakdown for statistics & charts (strictly separates expense and income, excludes transfers)
  const getCategoryStats = (selectedType = 'expense') => {
    const map = {};
    let totalNominal = 0;

    transactions.forEach((tx) => {
      // 1. Exclude adjustments & internal transfers
      const isAdjustment = tx.type === 'adjustment' || tx.categoryId === 'cat_adjustment';
      if (isAdjustment) return;

      const isTransfer = tx.isTransfer || tx.categoryId === 'cat_transfer';
      if (isTransfer) return;

      // 2. Strict Type Check (Pengeluaran vs Pemasukan never mix)
      if (tx.type !== selectedType) return;

      // 3. Filter by Wallet
      if (walletFilter !== 'all') {
        const txWalletId = tx.walletId || 'wallet_cash';
        if (txWalletId !== walletFilter) return;
      }

      // 4. Filter by Period
      if (periodFilter === 'today') {
        if (!isSameDay(tx.date, new Date())) return;
      } else if (periodFilter === 'week') {
        if (!isThisWeek(tx.date)) return;
      } else if (periodFilter === 'month') {
        if (!isThisMonth(tx.date)) return;
      }

      // 5. Search Query Filter if active
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = (tx.name || '').toLowerCase().includes(q);
        const matchCategory = (tx.categoryName || '').toLowerCase().includes(q);
        const matchAmount = (tx.amount || 0).toString().includes(q);
        const matchWallet = (tx.walletName || '').toLowerCase().includes(q);
        if (!matchName && !matchCategory && !matchAmount && !matchWallet) return;
      }

      const catId = tx.categoryId || 'other';
      const catName = tx.categoryName || 'Lain-lain';
      const catColor = tx.categoryColor || '#64748B';
      const catBgColor = tx.categoryBgColor || '#F1F5F9';
      const iconName = tx.iconName || 'cube';
      const iconFamily = tx.iconFamily || 'Ionicons';
      const amount = tx.amount || 0;

      totalNominal += amount;

      if (!map[catId]) {
        map[catId] = {
          id: catId,
          name: catName,
          color: catColor,
          bgColor: catBgColor,
          iconName,
          iconFamily,
          amount: 0,
          count: 0,
        };
      }

      map[catId].amount += amount;
      map[catId].count += 1;
    });

    const list = Object.values(map)
      .map((item) => ({
        ...item,
        percentage: totalNominal > 0 ? (item.amount / totalNominal) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      type: selectedType,
      totalNominal,
      categories: list,
    };
  };

  const categoryStats = useMemo(() => {
    const effectiveType = typeFilter === 'income' ? 'income' : 'expense';
    return getCategoryStats(effectiveType);
  }, [transactions, walletFilter, periodFilter, typeFilter, searchQuery]);

  const contextValue = useMemo(
    () => ({
      transactions,
      filteredTransactions,
      loading,
      periodFilter,
      setPeriodFilter,
      typeFilter,
      setTypeFilter,
      walletFilter,
      setWalletFilter,
      categoryFilter,
      setCategoryFilter,
      searchQuery,
      setSearchQuery,
      summary,
      categoryStats,
      getCategoryStats,
      addFromNaturalLanguage,
      addTransaction,
      transferBalance,
      importTransactions,
      updateTransaction,
      deleteTransaction,
      clearAllTransactions,
      replaceTransactions,
    }),
    [
      transactions,
      filteredTransactions,
      loading,
      periodFilter,
      typeFilter,
      walletFilter,
      categoryFilter,
      searchQuery,
      summary,
      categoryStats,
    ]
  );

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export default FinanceContext;
