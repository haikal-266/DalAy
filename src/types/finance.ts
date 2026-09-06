/**
 * DalAy - Finance Type Definitions
 */

export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';

export type WalletType = 'cash' | 'bank' | 'ewallet' | 'investment' | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  name: string;
  amount: number;
  wallet_id: string;
  wallet_name: string;
  category_id: string;
  category_name: string;
  icon_name?: string;
  icon_family?: string;
  category_color?: string;
  category_bg_color?: string;
  raw_text?: string;
  date: string; // YYYY-MM-DD or ISO
  transfer_id?: string | null;
  is_transfer?: number | boolean;
  transfer_role?: 'source' | 'target' | null;
  target_wallet_id?: string | null;
  target_wallet_name?: string | null;
  source_wallet_id?: string | null;
  source_wallet_name?: string | null;
  is_transfer_fee?: number | boolean;
  is_increase?: number | boolean | null;
  adjustment_diff?: number | null;
  extra_data?: string | null;
}

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  icon: string;
  color: string;
  initialBalance: number;
  balance?: number;
  isDefault?: boolean;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income' | 'both';
  icon: string;
  iconFamily: string;
  color: string;
  bgColor: string;
  isCustom?: boolean;
}

export interface WalletTransferParams {
  sourceWalletId: string;
  targetWalletId: string;
  amount: number;
  adminFee?: number;
  date?: string;
  notes?: string;
}

export interface TransferSimulation {
  sourceWalletId: string;
  targetWalletId: string;
  amount: number;
  adminFee: number;
  sourceBefore: number;
  sourceAfter: number;
  targetBefore: number;
  targetAfter: number;
}

export interface ReceiptItem {
  name: string;
  amount: number;
  category?: string;
  quantity?: number;
}

export interface ReceiptData {
  merchantName: string;
  date: string;
  totalAmount: number;
  items: ReceiptItem[];
  suggestedWalletId?: string;
}
