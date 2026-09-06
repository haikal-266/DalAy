import {
  autoInsertCommasAfterPrices,
  extractTailWallet,
  convertSpokenNumbersToDigits,
  extractTypeDirective,
  parseFinancialInput,
  parseSingleItem,
} from '../../src/utils/parser';

describe('parser.js - Financial & Voice Input Parsing', () => {
  const mockWallets = [
    { id: 'wallet_cash', name: 'Tunai', type: 'cash' },
    { id: 'wallet_bca', name: 'BCA', type: 'bank' },
    { id: 'wallet_gopay', name: 'GoPay', type: 'ewallet' },
  ];

  describe('autoInsertCommasAfterPrices', () => {
    it('memisahkan beberapa item tanpa koma dengan benar', () => {
      const input = 'teh hijau 12 ribu bakso 13k kuota 50 ribu';
      const output = autoInsertCommasAfterPrices(input);
      expect(output).toBe('teh hijau 12 ribu, bakso 13k, kuota 50 ribu');
    });

    it('memisahkan format rupiah titik (dot separator)', () => {
      const input = 'mie ayam 25.000 es jeruk 5.000';
      const output = autoInsertCommasAfterPrices(input);
      expect(output).toBe('mie ayam 25.000, es jeruk 5.000');
    });

    it('tidak merusak kalimat yang sudah memiliki koma', () => {
      const input = 'kopi 15k, roti 10k';
      const output = autoInsertCommasAfterPrices(input);
      expect(output).toBe('kopi 15k, roti 10k');
    });
  });

  describe('extractTailWallet', () => {
    it('mendeteksi nama wallet di ujung kalimat dengan tepat', () => {
      const res = extractTailWallet('makan siang 35k bayar pake bca', mockWallets);
      expect(res.walletId).toBe('wallet_bca');
      expect(res.walletName).toBe('BCA');
      expect(res.cleanText).toBe('makan siang 35k');
    });

    it('mendeteksi alias generic seperti "tunai" atau "cash"', () => {
      const res = extractTailWallet('beli bensin 20k tunai', mockWallets);
      expect(res.walletId).toBe('wallet_cash');
      expect(res.cleanText).toBe('beli bensin 20k');
    });

    it('menggunakan defaultWalletId jika tidak ada nama wallet yang disebut', () => {
      const res = extractTailWallet('kopi susu 18k', mockWallets, 'wallet_gopay');
      expect(res.walletId).toBe('wallet_gopay');
      expect(res.cleanText).toBe('kopi susu 18k');
    });
  });

  describe('extractTypeDirective', () => {
    it('mendeteksi directive pemasukan di awal', () => {
      const res = extractTypeDirective('pemasukan gaji bulanan 5jt');
      expect(res.type).toBe('income');
      expect(res.cleanText).toBe('gaji bulanan 5jt');
    });

    it('mendeteksi directive uang masuk di tengah/akhir', () => {
      const res = extractTypeDirective('freelance 1.5jt uang masuk');
      expect(res.type).toBe('income');
      expect(res.cleanText).toBe('freelance 1.5jt');
    });

    it('default ke expense jika tidak ada kata kunci pemasukan', () => {
      const res = extractTypeDirective('makan padang 25k');
      expect(res.type).toBe('expense');
      expect(res.cleanText).toBe('makan padang 25k');
    });
  });

  describe('convertSpokenNumbersToDigits', () => {
    it('mengonversi angka kata seperti "lima puluh ribu" menjadi digit', () => {
      const res = convertSpokenNumbersToDigits('beli pulsa lima puluh ribu');
      expect(res).toContain('50000');
    });

    it('mengonversi "dua puluh lima k" menjadi 25000', () => {
      const res = convertSpokenNumbersToDigits('kopi dua puluh lima ribu');
      expect(res).toContain('25000');
    });
  });

  describe('parseFinancialInput (End-to-End)', () => {
    it('memparsing satu transaksi tunggal dengan benar', () => {
      const results = parseFinancialInput('nasi goreng 25k bca', 'expense', mockWallets);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Nasi goreng');
      expect(results[0].amount).toBe(25000);
      expect(results[0].walletId).toBe('wallet_bca');
      expect(results[0].type).toBe('expense');
    });

    it('memparsing multi-item sekaligus dari satu kalimat suara', () => {
      const results = parseFinancialInput(
        'mie ayam 15k es teh 5rb bca',
        'expense',
        mockWallets
      );
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results[0].amount).toBe(15000);
      expect(results[1].amount).toBe(5000);
      expect(results[0].walletId).toBe('wallet_bca');
      expect(results[1].walletId).toBe('wallet_bca');
    });

    it('otomatis mendeteksi kategori makanan untuk "bakso"', () => {
      const res = parseSingleItem('bakso urat 20k', 'expense', mockWallets);
      expect(res.amount).toBe(20000);
      expect(res.categoryId).toBe('food');
    });
  });
});
