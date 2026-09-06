import {
  txToRow,
  rowToTx,
  walletToRow,
  rowToWallet,
} from '../../src/services/database';

describe('database.js - SQLite Data Layer & Schema Mapping', () => {
  describe('Transaction Object ↔ SQLite Row Mapping', () => {
    it('mengonversi JS transaction ke DB row (camelCase -> snake_case)', () => {
      const tx = {
        id: 'tx_123',
        type: 'expense',
        name: 'Makan Siang',
        amount: 35000,
        walletId: 'wallet_bca',
        walletName: 'BCA',
        categoryId: 'food',
        categoryName: 'Makanan',
        date: '2026-08-17T12:00:00.000Z',
        isTransfer: false,
        customTag: 'kantor', // extra property
      };

      const row = txToRow(tx);
      expect(row.id).toBe('tx_123');
      expect(row.amount).toBe(35000);
      expect(row.wallet_id).toBe('wallet_bca');
      expect(row.category_id).toBe('food');
      expect(row.is_transfer).toBe(0);

      // Pastikan property non-standard tersimpan di extra_data
      expect(row.extra_data).toBeDefined();
      const parsedExtra = JSON.parse(row.extra_data);
      expect(parsedExtra.customTag).toBe('kantor');
    });

    it('mengonversi DB row kembali ke JS transaction (snake_case -> camelCase)', () => {
      const row = {
        id: 'tx_456',
        type: 'income',
        name: 'Gaji Bulanan',
        amount: 8000000,
        wallet_id: 'wallet_bca',
        wallet_name: 'BCA',
        category_id: 'salary',
        category_name: 'Gaji',
        icon_name: 'cash',
        icon_family: 'Ionicons',
        category_color: '#10B981',
        category_bg_color: '#ECFDF5',
        raw_text: 'gaji bca 8jt',
        date: '2026-08-25',
        transfer_id: null,
        is_transfer: 0,
        transfer_role: null,
        target_wallet_id: null,
        target_wallet_name: null,
        source_wallet_id: null,
        source_wallet_name: null,
        is_transfer_fee: 0,
        is_increase: 1,
        adjustment_diff: null,
        extra_data: JSON.stringify({ notes: 'Bonus kuartal' }),
      };

      const tx = rowToTx(row);
      expect(tx.id).toBe('tx_456');
      expect(tx.type).toBe('income');
      expect(tx.walletId).toBe('wallet_bca');
      expect(tx.categoryId).toBe('salary');
      expect(tx.isIncrease).toBe(true);
      expect(tx.notes).toBe('Bonus kuartal');
    });
  });

  describe('Wallet Object ↔ SQLite Row Mapping', () => {
    it('mengonversi wallet ke DB row dan sebaliknya secara konsisten', () => {
      const wallet = {
        id: 'wallet_cash',
        name: 'Uang Tunai',
        type: 'cash',
        icon: 'cash-outline',
        color: '#10B981',
        initialBalance: 500000,
        isDefault: true,
        sortOrder: 1,
      };

      const row = walletToRow(wallet);
      expect(row.id).toBe('wallet_cash');
      expect(row.initial_balance).toBe(500000);
      expect(row.is_default).toBe(1);

      const restored = rowToWallet(row);
      expect(restored.id).toBe(wallet.id);
      expect(restored.initialBalance).toBe(wallet.initialBalance);
      expect(restored.isDefault).toBe(true);
    });
  });

  describe('Automated Database Migration System', () => {
    it('memiliki registry MIGRATIONS yang valid dan berurutan', () => {
      const { MIGRATIONS, SCHEMA_VERSION } = require('../../src/services/database');
      expect(Array.isArray(MIGRATIONS)).toBe(true);
      expect(MIGRATIONS.length).toBeGreaterThan(0);
      expect(SCHEMA_VERSION).toBe(MIGRATIONS[MIGRATIONS.length - 1].version);

      MIGRATIONS.forEach((m, idx) => {
        expect(m.version).toBe(idx + 1);
        expect(typeof m.name).toBe('string');
        expect(typeof m.up).toBe('function');
      });
    });

    it('addColumnIfNotExists hanya menambahkan kolom jika belum ada', async () => {
      const { addColumnIfNotExists } = require('../../src/services/database');
      const executedSql = [];

      const mockDb = {
        getAllAsync: jest.fn().mockResolvedValue([
          { name: 'id' },
          { name: 'amount' },
        ]),
        execAsync: jest.fn().mockImplementation((sql) => {
          executedSql.push(sql);
          return Promise.resolve();
        }),
      };

      // 1. Coba tambah kolom yang sudah ada -> return false, no ALTER TABLE
      const addedExisting = await addColumnIfNotExists(mockDb, 'transactions', 'amount', 'REAL');
      expect(addedExisting).toBe(false);
      expect(executedSql).toHaveLength(0);

      // 2. Coba tambah kolom baru -> return true, panggil ALTER TABLE
      const addedNew = await addColumnIfNotExists(mockDb, 'transactions', 'image_uri', 'TEXT');
      expect(addedNew).toBe(true);
      expect(executedSql).toHaveLength(1);
      expect(executedSql[0]).toContain('ALTER TABLE transactions ADD COLUMN image_uri TEXT');
    });

    it('runSchemaMigration membungkus setiap step dalam atomic transaction (BEGIN & COMMIT)', async () => {
      const { runSchemaMigration } = require('../../src/services/database');
      const queries = [];

      const mockDb = {
        execAsync: jest.fn().mockImplementation((sql) => {
          queries.push(sql);
          return Promise.resolve();
        }),
        runAsync: jest.fn().mockResolvedValue({}),
      };

      await runSchemaMigration(mockDb, 0, 1);

      // Pastikan ada BEGIN TRANSACTION sebelum DDL
      expect(queries[0]).toBe('BEGIN TRANSACTION;');
      // Pastikan user_version di-update
      expect(queries.some((q) => q.includes('PRAGMA user_version = 1'))).toBe(true);
      // Pastikan di-COMMIT
      expect(queries.some((q) => q === 'COMMIT;')).toBe(true);
    });

    it('runSchemaMigration melakukan ROLLBACK jika terjadi kegagalan query di tengah jalan', async () => {
      const { runSchemaMigration } = require('../../src/services/database');
      const queries = [];

      const failingDb = {
        execAsync: jest.fn().mockImplementation((sql) => {
          queries.push(sql);
          if (sql.includes('CREATE TABLE')) {
            return Promise.reject(new Error('Disk I/O Error simulated'));
          }
          return Promise.resolve();
        }),
        runAsync: jest.fn().mockResolvedValue({}),
      };

      await expect(runSchemaMigration(failingDb, 0, 1)).rejects.toThrow('Disk I/O Error simulated');
      expect(queries[0]).toBe('BEGIN TRANSACTION;');
      expect(queries.some((q) => q === 'ROLLBACK;')).toBe(true);
    });
  });
});

