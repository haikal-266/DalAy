/**
 * DalAy - Parser & Voice Type Definitions
 */

import { TransactionType, Wallet } from './finance';

export interface ParsedItem {
  name: string;
  amount: number;
  category?: string;
  categoryId?: string;
  type?: TransactionType;
}

export interface TailWalletResult {
  wallet: Wallet | null;
  walletId: string | null;
  walletName: string;
  cleanText: string;
}

export interface ParsedTransactionResult {
  type: TransactionType;
  items: ParsedItem[];
  walletId?: string | null;
  walletName?: string;
  rawText: string;
}

export interface DetectedCategory {
  id: string;
  name: string;
  color?: string;
  bgColor?: string;
  icon?: string;
  iconFamily?: string;
}
