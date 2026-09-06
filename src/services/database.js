/**
 * database.js — Expo SQLite Database Service
 *
 * Central database layer: schema creation, versioned migrations,
 * one-time AsyncStorage → SQLite data migration.
 *
 * Every other store calls helpers exported from here instead of
 * touching SQLite directly.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_NAME = 'dalay.db';
const MIGRATION_FLAG = '@dalay_migrated_to_sqlite_v1';

// ─── Module-level singleton ──────────────────────────────────
let _db = null;
let _initPromise = null;

/**
 * Initialise database: create/update schema, run one-time migration.
 * Call this once at app startup (before providers render).
 * Idempotent and thread-safe.
 */
export const initializeDatabase = async () => {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    if (Platform.OS === 'web') return null;

    try {
      const SQLite = require('expo-sqlite');
      const db = await SQLite.openDatabaseAsync(DB_NAME);

      // Check current schema version
      const versionRow = await db.getFirstAsync('PRAGMA user_version');
      const currentVersion = versionRow?.user_version ?? 0;

      if (currentVersion < SCHEMA_VERSION) {
        await runSchemaMigration(db, currentVersion);
      }

      // One-time data migration from AsyncStorage
      await migrateFromAsyncStorage(db);

      // Only assign singleton _db after all schema & data migrations are complete
      _db = db;
      return _db;
    } catch (err) {
      console.warn('[DB] initializeDatabase error:', err);
      _initPromise = null;
      return null;
    }
  })();

  return _initPromise;
};

/**
 * Get or open the database instance (guarantees initialization and migration are complete).
 * Safe to call multiple times — returns the same handle.
 */
export const getDatabase = async () => {
  if (_db) return _db;
  return await initializeDatabase();
};

/**
 * Returns the cached db handle (synchronous).
 * Only safe to call *after* initializeDatabase() has resolved.
 */
export const getDatabaseSync = () => _db;

// ─── Schema & Migrations ────────────────────────────────────

export const SCHEMA_VERSION = 1;

/**
 * Helper to safely add a column to a table if it does not already exist.
 * Avoids SQLite crash when ALTER TABLE ADD COLUMN is called on an existing column.
 */
export const addColumnIfNotExists = async (db, tableName, columnName, columnDef) => {
  try {
    const columns = await db.getAllAsync(`PRAGMA table_info(${tableName});`);
    const exists = columns.some((col) => col.name.toLowerCase() === columnName.toLowerCase());
    if (!exists) {
      await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef};`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`[DB] addColumnIfNotExists error for ${tableName}.${columnName}:`, err);
    return false;
  }
};

/**
 * Sequential migration registry.
 * Each migration must define:
 * - version: positive integer (strictly sequential: 1, 2, 3...)
 * - name: descriptive string
 * - up: async function(db) => Promise<void>
 */
export const MIGRATIONS = [
  {
    version: 1,
    name: 'initial_schema',
    up: async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        -- Migration audit log table
        CREATE TABLE IF NOT EXISTS _schema_migrations (
          version INTEGER PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL
        );

        -- Transactions table
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          type TEXT NOT NULL DEFAULT 'expense',
          name TEXT NOT NULL DEFAULT '',
          amount REAL NOT NULL DEFAULT 0,
          wallet_id TEXT NOT NULL DEFAULT 'wallet_cash',
          wallet_name TEXT NOT NULL DEFAULT 'Tunai',
          category_id TEXT NOT NULL DEFAULT 'other',
          category_name TEXT NOT NULL DEFAULT 'Lain-lain',
          icon_name TEXT DEFAULT 'cube',
          icon_family TEXT DEFAULT 'Ionicons',
          category_color TEXT DEFAULT '#64748B',
          category_bg_color TEXT DEFAULT '#F1F5F9',
          raw_text TEXT DEFAULT '',
          date TEXT NOT NULL,
          transfer_id TEXT,
          is_transfer INTEGER DEFAULT 0,
          transfer_role TEXT,
          target_wallet_id TEXT,
          target_wallet_name TEXT,
          source_wallet_id TEXT,
          source_wallet_name TEXT,
          is_transfer_fee INTEGER DEFAULT 0,
          is_increase INTEGER,
          adjustment_diff REAL,
          extra_data TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_tx_wallet ON transactions(wallet_id);
        CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);

        -- Wallets table
        CREATE TABLE IF NOT EXISTS wallets (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          type TEXT DEFAULT 'other',
          icon TEXT DEFAULT 'wallet-outline',
          color TEXT DEFAULT '#10B981',
          initial_balance REAL DEFAULT 0,
          is_default INTEGER DEFAULT 0,
          created_at TEXT,
          sort_order INTEGER DEFAULT 0
        );

        -- Custom categories table
        CREATE TABLE IF NOT EXISTS custom_categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'expense',
          icon_name TEXT DEFAULT 'cube',
          icon_family TEXT DEFAULT 'Ionicons',
          color TEXT DEFAULT '#3B82F6',
          bg_color TEXT,
          is_custom INTEGER DEFAULT 1,
          created_at TEXT,
          keywords TEXT
        );

        -- Quran items table (favorites + history)
        CREATE TABLE IF NOT EXISTS quran_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kind TEXT NOT NULL,
          surah INTEGER NOT NULL,
          ayah INTEGER NOT NULL,
          surah_name TEXT,
          surah_name_ar TEXT,
          arab TEXT,
          latin TEXT,
          translation TEXT,
          translation_id TEXT,
          audio TEXT,
          timestamp TEXT,
          extra_data TEXT,
          UNIQUE(kind, surah, ayah)
        );

        CREATE INDEX IF NOT EXISTS idx_quran_kind ON quran_items(kind);
      `);
    },
  },
];

/**
 * Versioned schema migrations executed sequentially with atomic transactions.
 */
export const runSchemaMigration = async (db, fromVersion, targetVersion = SCHEMA_VERSION) => {
  if (fromVersion >= targetVersion) return;

  const pendingMigrations = MIGRATIONS.filter(
    (m) => m.version > fromVersion && m.version <= targetVersion
  ).sort((a, b) => a.version - b.version);

  for (const migration of pendingMigrations) {
    console.log(`[DB] Running schema migration v${migration.version}: ${migration.name}...`);

    await db.execAsync('BEGIN TRANSACTION;');
    try {
      await migration.up(db);

      // Record migration audit log
      try {
        await db.runAsync(
          'INSERT OR REPLACE INTO _schema_migrations (version, name, applied_at) VALUES (?, ?, ?);',
          [migration.version, migration.name, new Date().toISOString()]
        );
      } catch (logErr) {
        // Table might be created in migration 1 itself
      }

      // Update PRAGMA user_version atomically inside transaction
      await db.execAsync(`PRAGMA user_version = ${migration.version};`);
      await db.execAsync('COMMIT;');

      console.log(`[DB] Schema migration v${migration.version} completed successfully ✓`);
    } catch (err) {
      try {
        await db.execAsync('ROLLBACK;');
      } catch (rollbackErr) {
        // Ignore rollback error
      }
      console.error(`[DB] Schema migration v${migration.version} failed. Rolled back! Error:`, err);
      throw err;
    }
  }
};

// ─── AsyncStorage → SQLite One-Time Migration ───────────────

const migrateFromAsyncStorage = async (db) => {
  try {
    const flag = await AsyncStorage.getItem(MIGRATION_FLAG);
    if (flag === 'done') return; // already migrated

    console.log('[DB] Starting one-time AsyncStorage → SQLite migration...');

    await migrateTransactions(db);
    await migrateWallets(db);
    await migrateCustomCategories(db);
    await migrateQuranData(db);

    // Mark migration as complete
    await AsyncStorage.setItem(MIGRATION_FLAG, 'done');
    console.log('[DB] Migration complete ✓');
  } catch (err) {
    console.warn('[DB] Migration error (will retry on next launch):', err);
    // Don't set the flag so it retries next time
  }
};

// ─── Transaction helpers (snake_case ↔ camelCase) ───────────

const KNOWN_TX_KEYS = new Set([
  'id', 'type', 'name', 'amount', 'walletId', 'walletName', 'categoryId',
  'categoryName', 'iconName', 'iconFamily', 'categoryColor', 'categoryBgColor',
  'rawText', 'date', 'transferId', 'isTransfer', 'transferRole',
  'targetWalletId', 'targetWalletName', 'sourceWalletId', 'sourceWalletName',
  'isTransferFee', 'isIncrease', 'adjustmentDiff',
]);

/**
 * Convert a JS transaction object to a DB row.
 */
export const txToRow = (tx) => {
  let isIncreaseVal = null;
  if (tx.isIncrease !== undefined) {
    isIncreaseVal = tx.isIncrease ? 1 : 0;
  }

  const extra = {};
  for (const [k, v] of Object.entries(tx)) {
    if (!KNOWN_TX_KEYS.has(k)) extra[k] = v;
  }
  const extraDataJson = Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;

  return {
    id: tx.id,
    type: tx.type || 'expense',
    name: tx.name || '',
    amount: tx.amount || 0,
    wallet_id: tx.walletId || 'wallet_cash',
    wallet_name: tx.walletName || 'Tunai',
    category_id: tx.categoryId || 'other',
    category_name: tx.categoryName || 'Lain-lain',
    icon_name: tx.iconName || 'cube',
    icon_family: tx.iconFamily || 'Ionicons',
    category_color: tx.categoryColor || '#64748B',
    category_bg_color: tx.categoryBgColor || '#F1F5F9',
    raw_text: tx.rawText || '',
    date: tx.date || new Date().toISOString(),
    transfer_id: tx.transferId || null,
    is_transfer: tx.isTransfer ? 1 : 0,
    transfer_role: tx.transferRole || null,
    target_wallet_id: tx.targetWalletId || null,
    target_wallet_name: tx.targetWalletName || null,
    source_wallet_id: tx.sourceWalletId || null,
    source_wallet_name: tx.sourceWalletName || null,
    is_transfer_fee: tx.isTransferFee ? 1 : 0,
    is_increase: isIncreaseVal,
    adjustment_diff: tx.adjustmentDiff ?? null,
    extra_data: extraDataJson,
  };
};

/**
 * Convert a DB row back to a JS transaction object.
 */
export const rowToTx = (row) => {
  const tx = {
    id: row.id,
    type: row.type,
    name: row.name,
    amount: row.amount,
    walletId: row.wallet_id,
    walletName: row.wallet_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    iconName: row.icon_name,
    iconFamily: row.icon_family,
    categoryColor: row.category_color,
    categoryBgColor: row.category_bg_color,
    rawText: row.raw_text,
    date: row.date,
  };

  if (row.transfer_id) tx.transferId = row.transfer_id;
  if (row.is_transfer) tx.isTransfer = true;
  if (row.transfer_role) tx.transferRole = row.transfer_role;
  if (row.target_wallet_id) tx.targetWalletId = row.target_wallet_id;
  if (row.target_wallet_name) tx.targetWalletName = row.target_wallet_name;
  if (row.source_wallet_id) tx.sourceWalletId = row.source_wallet_id;
  if (row.source_wallet_name) tx.sourceWalletName = row.source_wallet_name;
  if (row.is_transfer_fee) tx.isTransferFee = true;
  if (row.is_increase !== null && row.is_increase !== undefined) tx.isIncrease = !!row.is_increase;
  if (row.adjustment_diff !== null && row.adjustment_diff !== undefined) tx.adjustmentDiff = row.adjustment_diff;

  // Merge any extra_data
  if (row.extra_data) {
    try {
      Object.assign(tx, JSON.parse(row.extra_data));
    } catch (_) {}
  }

  return tx;
};

/**
 * Convert a DB row to a wallet object.
 */
export const rowToWallet = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  icon: row.icon,
  color: row.color,
  initialBalance: row.initial_balance || 0,
  isDefault: !!row.is_default,
  createdAt: row.created_at || undefined,
  sortOrder: row.sort_order || 0,
});

/**
 * Convert a wallet object to a DB row.
 */
export const walletToRow = (w) => ({
  id: w.id,
  name: w.name || 'Dompet',
  type: w.type || 'other',
  icon: w.icon || 'wallet-outline',
  color: w.color || '#10B981',
  initial_balance: w.initialBalance || 0,
  is_default: w.isDefault ? 1 : 0,
  created_at: w.createdAt || null,
  sort_order: w.sortOrder || 0,
});

/**
 * Convert a DB row to a custom category object.
 */
export const rowToCategory = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  iconName: row.icon_name,
  iconFamily: row.icon_family,
  color: row.color,
  bgColor: row.bg_color || `${row.color}18`,
  isCustom: true,
  createdAt: row.created_at || undefined,
  keywords: row.keywords ? (() => { try { return JSON.parse(row.keywords); } catch(_) { return [row.name.toLowerCase()]; } })() : [row.name.toLowerCase()],
});

/**
 * Convert a custom category object to a DB row.
 */
export const categoryToRow = (c) => ({
  id: c.id,
  name: c.name,
  type: c.type || 'expense',
  icon_name: c.iconName || 'cube',
  icon_family: c.iconFamily || 'Ionicons',
  color: c.color || '#3B82F6',
  bg_color: c.bgColor || `${c.color || '#3B82F6'}18`,
  is_custom: 1,
  created_at: c.createdAt || null,
  keywords: JSON.stringify(c.keywords || [c.name.toLowerCase()]),
});

/**
 * Convert a DB row to a quran item (favorite/history).
 */
export const rowToQuranItem = (row) => {
  const item = {
    surah: row.surah,
    ayah: row.ayah,
    surahName: row.surah_name,
    surah_name: row.surah_name,
    surahNameArab: row.surah_name_ar,
    surah_name_ar: row.surah_name_ar,
    arab: row.arab,
    latin: row.latin,
    translation: row.translation,
    translation_id: row.translation_id,
    audio: row.audio,
  };

  if (row.kind === 'favorite') {
    item.favoritedAt = row.timestamp;
  } else {
    item.readAt = row.timestamp;
  }

  // Merge extra data
  if (row.extra_data) {
    try { Object.assign(item, JSON.parse(row.extra_data)); } catch (_) {}
  }

  return item;
};

// ─── DB CRUD Helpers ─────────────────────────────────────────

// -- Transactions --

const INSERT_TX_SQL = `INSERT OR REPLACE INTO transactions (
  id, type, name, amount, wallet_id, wallet_name, category_id, category_name,
  icon_name, icon_family, category_color, category_bg_color, raw_text, date,
  transfer_id, is_transfer, transfer_role, target_wallet_id, target_wallet_name,
  source_wallet_id, source_wallet_name, is_transfer_fee, is_increase, adjustment_diff, extra_data
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const txRowToParams = (r) => [
  r.id, r.type, r.name, r.amount, r.wallet_id, r.wallet_name,
  r.category_id, r.category_name, r.icon_name, r.icon_family,
  r.category_color, r.category_bg_color, r.raw_text, r.date,
  r.transfer_id, r.is_transfer, r.transfer_role,
  r.target_wallet_id, r.target_wallet_name,
  r.source_wallet_id, r.source_wallet_name,
  r.is_transfer_fee, r.is_increase, r.adjustment_diff, r.extra_data,
];

export const dbLoadAllTransactions = async () => {
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync('SELECT * FROM transactions ORDER BY date DESC');
  return rows.map(rowToTx);
};

export const dbInsertTransaction = async (tx) => {
  const db = await getDatabase();
  if (!db) return;
  const row = txToRow(tx);
  await db.runAsync(INSERT_TX_SQL, txRowToParams(row));
};

export const dbInsertTransactionsBatch = async (txList) => {
  const db = await getDatabase();
  if (!db) return;
  await db.withTransactionAsync(async () => {
    for (const tx of txList) {
      const row = txToRow(tx);
      await db.runAsync(INSERT_TX_SQL, txRowToParams(row));
    }
  });
};

export const dbUpdateTransaction = async (id, updatedFields) => {
  const db = await getDatabase();
  if (!db) return;
  // Build dynamic SET clause
  const fieldMap = {
    type: 'type', name: 'name', amount: 'amount',
    walletId: 'wallet_id', walletName: 'wallet_name',
    categoryId: 'category_id', categoryName: 'category_name',
    iconName: 'icon_name', iconFamily: 'icon_family',
    categoryColor: 'category_color', categoryBgColor: 'category_bg_color',
    rawText: 'raw_text', date: 'date',
    transferId: 'transfer_id', isTransfer: 'is_transfer',
    transferRole: 'transfer_role',
    targetWalletId: 'target_wallet_id', targetWalletName: 'target_wallet_name',
    sourceWalletId: 'source_wallet_id', sourceWalletName: 'source_wallet_name',
    isTransferFee: 'is_transfer_fee',
    isIncrease: 'is_increase', adjustmentDiff: 'adjustment_diff',
  };

  const setClauses = [];
  const values = [];

  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (updatedFields[jsKey] !== undefined) {
      setClauses.push(`${dbCol} = ?`);
      let val = updatedFields[jsKey];
      // Convert booleans to integers for SQLite
      if (typeof val === 'boolean') val = val ? 1 : 0;
      values.push(val);
    }
  }

  if (setClauses.length === 0) return;
  values.push(id);

  await db.runAsync(
    `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );
};

export const dbDeleteTransaction = async (id) => {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
};

export const dbDeleteTransactionsByTransferId = async (transferId) => {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync('DELETE FROM transactions WHERE transfer_id = ?', transferId);
};

export const dbClearAllTransactions = async () => {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync('DELETE FROM transactions');
};

export const dbReplaceAllTransactions = async (txList) => {
  const db = await getDatabase();
  if (!db) return;
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM transactions');
    for (const tx of txList) {
      const row = txToRow(tx);
      await db.runAsync(INSERT_TX_SQL, txRowToParams(row));
    }
  });
};

// -- Wallets --

const INSERT_WALLET_SQL = `INSERT OR REPLACE INTO wallets (
  id, name, type, icon, color, initial_balance, is_default, created_at, sort_order
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const walletRowToParams = (r) => [
  r.id, r.name, r.type, r.icon, r.color,
  r.initial_balance, r.is_default, r.created_at, r.sort_order,
];

export const dbLoadAllWallets = async () => {
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync('SELECT * FROM wallets ORDER BY sort_order ASC, rowid ASC');
  return rows.map(rowToWallet);
};

export const dbInsertWallet = async (wallet) => {
  const db = await getDatabase();
  if (!db) return;
  const row = walletToRow(wallet);
  await db.runAsync(INSERT_WALLET_SQL, walletRowToParams(row));
};

export const dbUpdateWallet = async (id, updates) => {
  const db = await getDatabase();
  if (!db) return;
  const fieldMap = {
    name: 'name', type: 'type', icon: 'icon', color: 'color',
    initialBalance: 'initial_balance', isDefault: 'is_default',
    createdAt: 'created_at', sortOrder: 'sort_order',
  };
  const setClauses = [];
  const values = [];
  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (updates[jsKey] !== undefined) {
      setClauses.push(`${dbCol} = ?`);
      let val = updates[jsKey];
      if (typeof val === 'boolean') val = val ? 1 : 0;
      values.push(val);
    }
  }
  if (setClauses.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE wallets SET ${setClauses.join(', ')} WHERE id = ?`, values);
};

export const dbDeleteWallet = async (id) => {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync('DELETE FROM wallets WHERE id = ?', id);
};

export const dbReplaceAllWallets = async (walletList) => {
  const db = await getDatabase();
  if (!db) return;
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM wallets');
    for (const w of walletList) {
      const row = walletToRow(w);
      await db.runAsync(INSERT_WALLET_SQL, walletRowToParams(row));
    }
  });
};

// -- Custom Categories --

const INSERT_CAT_SQL = `INSERT OR REPLACE INTO custom_categories (
  id, name, type, icon_name, icon_family, color, bg_color, is_custom, created_at, keywords
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const catRowToParams = (r) => [
  r.id, r.name, r.type, r.icon_name, r.icon_family,
  r.color, r.bg_color, r.is_custom, r.created_at, r.keywords,
];

export const dbLoadAllCustomCategories = async () => {
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync('SELECT * FROM custom_categories ORDER BY rowid DESC');
  return rows.map(rowToCategory);
};

export const dbInsertCategory = async (cat) => {
  const db = await getDatabase();
  if (!db) return;
  const row = categoryToRow(cat);
  await db.runAsync(INSERT_CAT_SQL, catRowToParams(row));
};

export const dbDeleteCategory = async (id) => {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync('DELETE FROM custom_categories WHERE id = ?', id);
};

// -- Quran Items --

const INSERT_QURAN_SQL = `INSERT OR REPLACE INTO quran_items (
  kind, surah, ayah, surah_name, surah_name_ar, arab, latin,
  translation, translation_id, audio, timestamp, extra_data
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export const dbLoadQuranItems = async (kind) => {
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync(
    'SELECT * FROM quran_items WHERE kind = ? ORDER BY timestamp DESC',
    kind
  );
  return rows.map(rowToQuranItem);
};

export const dbInsertQuranItem = async (kind, item) => {
  const db = await getDatabase();
  if (!db) return;
  const timestamp = kind === 'favorite' ? (item.favoritedAt || new Date().toISOString()) : (item.readAt || new Date().toISOString());

  // Collect extra fields that don't have dedicated columns
  const knownKeys = new Set([
    'surah', 'ayah', 'surahName', 'surah_name', 'surahNameArab', 'surah_name_ar',
    'arab', 'latin', 'translation', 'translation_id', 'audio',
    'favoritedAt', 'readAt', '_lang',
  ]);
  const extra = {};
  for (const [k, v] of Object.entries(item)) {
    if (!knownKeys.has(k)) extra[k] = v;
  }
  const extraJson = Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;

  await db.runAsync(INSERT_QURAN_SQL, [
    kind,
    item.surah,
    item.ayah,
    item.surahName || item.surah_name || null,
    item.surahNameArab || item.surah_name_ar || null,
    item.arab || null,
    item.latin || null,
    item.translation || null,
    item.translation_id || null,
    item.audio || null,
    timestamp,
    extraJson,
  ]);
};

export const dbDeleteQuranItem = async (kind, surah, ayah) => {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(
    'DELETE FROM quran_items WHERE kind = ? AND surah = ? AND ayah = ?',
    kind, surah, ayah
  );
};

export const dbClearQuranItems = async (kind) => {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync('DELETE FROM quran_items WHERE kind = ?', kind);
};

export const dbCapQuranHistory = async (maxItems = 50) => {
  const db = await getDatabase();
  if (!db) return;
  // Keep only the most recent N history items
  await db.runAsync(
    `DELETE FROM quran_items WHERE kind = 'history' AND id NOT IN (
      SELECT id FROM quran_items WHERE kind = 'history' ORDER BY timestamp DESC LIMIT ?
    )`,
    maxItems
  );
};

export const dbReplaceQuranItems = async (kind, items) => {
  const db = await getDatabase();
  if (!db) return;
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM quran_items WHERE kind = ?', kind);
    for (const item of items) {
      const timestamp = kind === 'favorite'
        ? (item.favoritedAt || new Date().toISOString())
        : (item.readAt || new Date().toISOString());
      const knownKeys = new Set([
        'surah', 'ayah', 'surahName', 'surah_name', 'surahNameArab', 'surah_name_ar',
        'arab', 'latin', 'translation', 'translation_id', 'audio',
        'favoritedAt', 'readAt', '_lang',
      ]);
      const extra = {};
      for (const [k, v] of Object.entries(item)) {
        if (!knownKeys.has(k)) extra[k] = v;
      }
      const extraJson = Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;
      await db.runAsync(INSERT_QURAN_SQL, [
        kind, item.surah, item.ayah,
        item.surahName || item.surah_name || null,
        item.surahNameArab || item.surah_name_ar || null,
        item.arab || null, item.latin || null,
        item.translation || null, item.translation_id || null,
        item.audio || null, timestamp, extraJson,
      ]);
    }
  });
};

// ─── One-Time Migration helpers ──────────────────────────────

const migrateTransactions = async (db) => {
  const raw = await AsyncStorage.getItem('@quranku_transactions');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return;
    // Filter legacy samples
    const cleaned = parsed.filter((t) => t && !String(t.id).startsWith('tx_sample_'));
    if (cleaned.length === 0) return;

    console.log(`[DB] Migrating ${cleaned.length} transactions...`);
    await db.withTransactionAsync(async () => {
      for (const tx of cleaned) {
        // Auto-heal adjustment flags (same logic as loadTransactions had)
        let item = tx;
        if (item.type === 'adjustment' || item.categoryId === 'cat_adjustment') {
          if (item.isIncrease === undefined && item.adjustmentDiff === undefined) {
            const isPositive = item.rawText ? item.rawText.includes('+') : false;
            item = {
              ...item,
              isIncrease: isPositive,
              adjustmentDiff: isPositive ? (item.amount || 0) : -(item.amount || 0),
            };
          }
        }
        const row = txToRow(item);
        await db.runAsync(INSERT_TX_SQL, txRowToParams(row));
      }
    });
    // Clean up AsyncStorage key
    await AsyncStorage.removeItem('@quranku_transactions');
    console.log(`[DB] Transactions migrated ✓`);
  } catch (e) {
    console.warn('[DB] Transaction migration failed:', e);
  }
};

const migrateWallets = async (db) => {
  const raw = await AsyncStorage.getItem('@dalay_wallets_v1');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    console.log(`[DB] Migrating ${parsed.length} wallets...`);
    await db.withTransactionAsync(async () => {
      for (const w of parsed) {
        const row = walletToRow(w);
        await db.runAsync(INSERT_WALLET_SQL, walletRowToParams(row));
      }
    });
    await AsyncStorage.removeItem('@dalay_wallets_v1');
    console.log(`[DB] Wallets migrated ✓`);
  } catch (e) {
    console.warn('[DB] Wallet migration failed:', e);
  }
};

const migrateCustomCategories = async (db) => {
  const raw = await AsyncStorage.getItem('@dalay_custom_categories_v1');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    console.log(`[DB] Migrating ${parsed.length} custom categories...`);
    await db.withTransactionAsync(async () => {
      for (const c of parsed) {
        const row = categoryToRow(c);
        await db.runAsync(INSERT_CAT_SQL, catRowToParams(row));
      }
    });
    await AsyncStorage.removeItem('@dalay_custom_categories_v1');
    console.log(`[DB] Custom categories migrated ✓`);
  } catch (e) {
    console.warn('[DB] Category migration failed:', e);
  }
};

const migrateQuranData = async (db) => {
  // Favorites
  const rawFavs = await AsyncStorage.getItem('@dalay_favorites');
  if (rawFavs) {
    try {
      const favs = JSON.parse(rawFavs);
      if (Array.isArray(favs) && favs.length > 0) {
        console.log(`[DB] Migrating ${favs.length} Quran favorites...`);
        await db.withTransactionAsync(async () => {
          for (const fav of favs) {
            const timestamp = fav.favoritedAt || new Date().toISOString();
            await db.runAsync(INSERT_QURAN_SQL, [
              'favorite', fav.surah, fav.ayah,
              fav.surahName || fav.surah_name || null,
              fav.surahNameArab || fav.surah_name_ar || null,
              fav.arab || null, fav.latin || null,
              fav.translation || null, fav.translation_id || null,
              fav.audio || null, timestamp, null,
            ]);
          }
        });
        await AsyncStorage.removeItem('@dalay_favorites');
        console.log(`[DB] Quran favorites migrated ✓`);
      }
    } catch (e) {
      console.warn('[DB] Quran favorites migration failed:', e);
    }
  }

  // History
  const rawHist = await AsyncStorage.getItem('@dalay_ayat_history');
  if (rawHist) {
    try {
      const hist = JSON.parse(rawHist);
      if (Array.isArray(hist) && hist.length > 0) {
        console.log(`[DB] Migrating ${hist.length} Quran history items...`);
        await db.withTransactionAsync(async () => {
          for (const h of hist) {
            const timestamp = h.readAt || new Date().toISOString();
            await db.runAsync(INSERT_QURAN_SQL, [
              'history', h.surah, h.ayah,
              h.surahName || h.surah_name || null,
              h.surahNameArab || h.surah_name_ar || null,
              h.arab || null, h.latin || null,
              h.translation || null, h.translation_id || null,
              h.audio || null, timestamp, null,
            ]);
          }
        });
        await AsyncStorage.removeItem('@dalay_ayat_history');
        console.log(`[DB] Quran history migrated ✓`);
      }
    } catch (e) {
      console.warn('[DB] Quran history migration failed:', e);
    }
  }
};
