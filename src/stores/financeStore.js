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
        // Filter out any legacy dummy samples
        const cleaned = Array.isArray(parsed)
          ? parsed.filter((t) => t && !String(t.id).startsWith('tx_sample_'))
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
  const addFromNaturalLanguage = async (rawInput, type = 'expense', customDate = null) => {
    const parsed = parseFinancialInput(rawInput, type);
    if (!parsed || parsed.length === 0) {
      return { success: false, count: 0, message: 'Tidak ada transaksi yang berhasil dibaca.' };
    }

    const itemsWithDate = customDate
      ? parsed.map((item) => ({ ...item, date: new Date(customDate).toISOString() }))
      : parsed;

    const updated = [...itemsWithDate, ...transactions];
    await saveTransactions(updated);
    return { success: true, count: itemsWithDate.length, items: itemsWithDate };
  };

  /**
   * Add single manual transaction
   */
  const addTransaction = async (txData) => {
    const newTx = {
      id: txData.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: txData.type || 'expense',
      name: txData.name || 'Transaksi Baru',
      amount: txData.amount || 0,
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

  const updateTransaction = async (id, updatedFields) => {
    const updated = transactions.map((t) =>
      t.id === id ? { ...t, ...updatedFields } : t
    );
    await saveTransactions(updated);
  };

  const deleteTransaction = async (id) => {
    const updated = transactions.filter((t) => t.id !== id);
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

  // Filtered transactions based on active period, type, and search query
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter by Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
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
        if (!matchName && !matchCategory && !matchAmount) return false;
      }

      return true;
    });
  }, [transactions, periodFilter, typeFilter, searchQuery]);

  // Overall Financial Summary
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount || 0;
      } else {
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
  }, [filteredTransactions]);

  // Category breakdown for statistics & charts
  const categoryStats = useMemo(() => {
    const map = {};
    let totalNominal = 0;

    const currentType = typeFilter === 'income' ? 'income' : 'expense';

    filteredTransactions.forEach((tx) => {
      // If we are looking at all or specific type
      if (typeFilter !== 'all' && tx.type !== typeFilter) return;
      if (typeFilter === 'all' && tx.type !== 'expense') return; // Default breakdown is expense

      const catId = tx.categoryId || 'other';
      if (!map[catId]) {
        map[catId] = {
          id: catId,
          name: tx.categoryName || 'Lain-lain',
          iconName: tx.iconName || 'cube',
          iconFamily: tx.iconFamily || 'Ionicons',
          color: tx.categoryColor || '#64748B',
          bgColor: tx.categoryBgColor || '#F1F5F9',
          amount: 0,
          count: 0,
        };
      }
      map[catId].amount += tx.amount || 0;
      map[catId].count += 1;
      totalNominal += tx.amount || 0;
    });

    const list = Object.values(map).map((item) => ({
      ...item,
      percentage: totalNominal > 0 ? Math.round((item.amount / totalNominal) * 100) : 0,
    }));

    // Sort highest amount first
    list.sort((a, b) => b.amount - a.amount);

    return {
      type: currentType,
      totalNominal,
      categories: list,
    };
  }, [filteredTransactions, typeFilter]);

  const contextValue = useMemo(
    () => ({
      transactions,
      filteredTransactions,
      loading,
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
