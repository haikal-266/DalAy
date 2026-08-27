import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_WALLETS = '@dalay_wallets_v1';
const STORAGE_KEY_SELECTED_WALLET = '@dalay_selected_wallet_id';

export const WALLET_ICONS = [
  'cash-outline',
  'card-outline',
  'phone-portrait-outline',
  'wallet-outline',
  'briefcase-outline',
  'trending-up-outline',
  'shield-checkmark-outline',
  'server-outline',
  'diamond-outline',
  'ribbon-outline',
];

export const WALLET_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

export const DEFAULT_WALLETS = [
  {
    id: 'wallet_cash',
    name: 'Tunai (Cash)',
    type: 'cash',
    icon: 'cash-outline',
    color: '#10B981',
    initialBalance: 0,
    isDefault: true,
  },
  {
    id: 'wallet_bank',
    name: 'Rekening Bank',
    type: 'bank',
    icon: 'card-outline',
    color: '#3B82F6',
    initialBalance: 0,
    isDefault: false,
  },
  {
    id: 'wallet_ewallet',
    name: 'E-Wallet',
    type: 'ewallet',
    icon: 'phone-portrait-outline',
    color: '#8B5CF6',
    initialBalance: 0,
    isDefault: false,
  },
];

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [wallets, setWallets] = useState(DEFAULT_WALLETS);
  const [selectedWalletId, setSelectedWalletId] = useState('all'); // 'all' | walletId
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const [rawWallets, rawSelected] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_WALLETS),
        AsyncStorage.getItem(STORAGE_KEY_SELECTED_WALLET),
      ]);

      if (rawWallets) {
        const parsed = JSON.parse(rawWallets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWallets(parsed);
        } else {
          setWallets(DEFAULT_WALLETS);
          await AsyncStorage.setItem(STORAGE_KEY_WALLETS, JSON.stringify(DEFAULT_WALLETS));
        }
      } else {
        setWallets(DEFAULT_WALLETS);
        await AsyncStorage.setItem(STORAGE_KEY_WALLETS, JSON.stringify(DEFAULT_WALLETS));
      }

      if (rawSelected) {
        setSelectedWalletId(rawSelected);
      }
    } catch (e) {
      console.log('Error loading wallets:', e);
      setWallets(DEFAULT_WALLETS);
    } finally {
      setLoading(false);
    }
  };

  const saveWallets = async (newList) => {
    try {
      setWallets(newList);
      await AsyncStorage.setItem(STORAGE_KEY_WALLETS, JSON.stringify(newList));
    } catch (e) {
      console.log('Error saving wallets:', e);
    }
  };

  const selectWallet = async (id) => {
    setSelectedWalletId(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SELECTED_WALLET, id);
    } catch (e) {}
  };

  const addWallet = async (walletData) => {
    const id = `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newWallet = {
      id,
      name: walletData.name ? walletData.name.trim() : 'Dompet Baru',
      type: walletData.type || 'other',
      icon: walletData.icon || 'wallet-outline',
      color: walletData.color || WALLET_COLORS[0],
      initialBalance: Number.parseInt(walletData.initialBalance, 10) || 0,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...wallets, newWallet];
    await saveWallets(updated);
    return newWallet;
  };

  const updateWallet = async (id, updates) => {
    const updated = wallets.map((w) => {
      if (w.id === id) {
        return {
          ...w,
          ...updates,
          name: updates.name ? updates.name.trim() : w.name,
          initialBalance:
            updates.initialBalance !== undefined
              ? Number.parseInt(updates.initialBalance, 10) || 0
              : w.initialBalance,
        };
      }
      return w;
    });
    await saveWallets(updated);
  };

  const deleteWallet = async (id) => {
    if (wallets.length <= 1) {
      return { success: false, message: 'Harus ada minimal 1 dompet aktif.' };
    }

    const target = wallets.find((w) => w.id === id);
    if (target?.isDefault) {
      return { success: false, message: 'Dompet utama default tidak dapat dihapus.' };
    }

    const updated = wallets.filter((w) => w.id !== id);
    if (selectedWalletId === id) {
      selectWallet('all');
    }
    await saveWallets(updated);
    return { success: true };
  };

  const getWalletById = (id) => {
    return wallets.find((w) => w.id === id) || wallets[0];
  };

  /**
   * Calculate balance for a specific wallet
   */
  const getWalletBalance = (walletId, transactions = []) => {
    const wallet = wallets.find((w) => w.id === walletId);
    const initial = wallet?.initialBalance || 0;

    const txs = transactions.filter((t) => {
      // If transaction has no walletId, assign to default wallet
      const assignedWalletId = t.walletId || (wallets[0] ? wallets[0].id : 'wallet_cash');
      return assignedWalletId === walletId;
    });

    const income = txs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expense = txs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      initial,
      income,
      expense,
      balance: initial + income - expense,
      txCount: txs.length,
    };
  };

  /**
   * Calculate total net worth across all active wallets
   */
  const getTotalNetWorth = (transactions = []) => {
    return wallets.reduce((total, w) => {
      const stats = getWalletBalance(w.id, transactions);
      return total + stats.balance;
    }, 0);
  };

  const replaceWallets = async (newWallets) => {
    if (Array.isArray(newWallets) && newWallets.length > 0) {
      await saveWallets(newWallets);
    }
  };

  const value = useMemo(
    () => ({
      wallets,
      selectedWalletId,
      loading,
      selectWallet,
      addWallet,
      updateWallet,
      deleteWallet,
      getWalletById,
      getWalletBalance,
      getTotalNetWorth,
      replaceWallets,
    }),
    [wallets, selectedWalletId, loading]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default WalletContext;
