import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/categories';

const STORAGE_KEY_CUSTOM_CATEGORIES = '@dalay_custom_categories_v1';

const CategoryContext = createContext(null);

export const CategoryProvider = ({ children }) => {
  const [customCategories, setCustomCategories] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load custom categories from storage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_CATEGORIES);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setCustomCategories(parsed);
          }
        }
      } catch (err) {
        console.error('Error loading custom categories:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadCategories();
  }, []);

  // Save to storage helper
  const saveCustomCategories = async (newList) => {
    try {
      setCustomCategories(newList);
      await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_CATEGORIES, JSON.stringify(newList));
      return true;
    } catch (err) {
      console.error('Error saving custom categories:', err);
      return false;
    }
  };

  /**
   * Add a new custom category
   * @param {Object} catData - { name, type: 'expense'|'income', iconName, iconFamily, color }
   */
  const addCategory = useCallback(async ({ name, type = 'expense', iconName = 'cube', iconFamily = 'Ionicons', color = '#3B82F6' }) => {
    if (!name || !name.trim()) {
      return { success: false, message: 'Nama kategori tidak boleh kosong' };
    }

    const trimmedName = name.trim();
    const newId = `cat_custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newCategory = {
      id: newId,
      name: trimmedName,
      type,
      iconName,
      iconFamily,
      color,
      bgColor: `${color}18`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      keywords: [trimmedName.toLowerCase()],
    };

    const nextList = [newCategory, ...customCategories];
    const saved = await saveCustomCategories(nextList);
    if (saved) {
      return { success: true, category: newCategory };
    }
    return { success: false, message: 'Gagal menyimpan kategori baru' };
  }, [customCategories]);

  /**
   * Delete a custom category
   */
  const deleteCategory = useCallback(async (catId) => {
    const nextList = customCategories.filter((c) => c.id !== catId);
    return await saveCustomCategories(nextList);
  }, [customCategories]);

  // Combined active expense categories (preset + custom, with "Lain-lain" at the end)
  const expenseCategories = useMemo(() => {
    const customList = customCategories.filter((c) => c.type === 'expense');
    const standardWithoutOther = EXPENSE_CATEGORIES.filter((c) => c.id !== 'other_expense');
    const otherExpense = EXPENSE_CATEGORIES.find((c) => c.id === 'other_expense') || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

    return [...standardWithoutOther, ...customList, otherExpense];
  }, [customCategories]);

  // Combined active income categories (preset + custom, with "Lain-lain" at the end)
  const incomeCategories = useMemo(() => {
    const customList = customCategories.filter((c) => c.type === 'income');
    const standardWithoutOther = INCOME_CATEGORIES.filter((c) => c.id !== 'other_income');
    const otherIncome = INCOME_CATEGORIES.find((c) => c.id === 'other_income') || INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1];

    return [...standardWithoutOther, ...customList, otherIncome];
  }, [customCategories]);

  // Combined all categories
  const allCategories = useMemo(() => {
    const seen = new Set();
    const list = [];
    [...expenseCategories, ...incomeCategories].forEach((c) => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        list.push(c);
      }
    });
    return list;
  }, [expenseCategories, incomeCategories]);

  /**
   * Find category by ID and optional type
   */
  const getCategoryById = useCallback((id, type = 'expense') => {
    if (!id || id === 'all') return null;
    const pool = type === 'expense' ? expenseCategories : incomeCategories;
    const found = pool.find((c) => c.id === id);
    if (found) return found;
    return allCategories.find((c) => c.id === id) || pool[pool.length - 1];
  }, [expenseCategories, incomeCategories, allCategories]);

  const value = useMemo(
    () => ({
      isLoaded,
      customCategories,
      expenseCategories,
      incomeCategories,
      allCategories,
      addCategory,
      deleteCategory,
      getCategoryById,
    }),
    [
      isLoaded,
      customCategories,
      expenseCategories,
      incomeCategories,
      allCategories,
      addCategory,
      deleteCategory,
      getCategoryById,
    ]
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      isLoaded: true,
      customCategories: [],
      expenseCategories: EXPENSE_CATEGORIES,
      incomeCategories: INCOME_CATEGORIES,
      allCategories: [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES],
      addCategory: async () => ({ success: false }),
      deleteCategory: async () => false,
      getCategoryById: (id, type) => {
        const pool = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        return pool.find((c) => c.id === id) || pool[pool.length - 1];
      },
    };
  }
  return context;
};

export default CategoryContext;
