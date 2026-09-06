import {
  formatRupiah,
  formatCompact,
  formatDateIndo,
  formatTimeIndo,
  isSameDay,
} from '../../src/utils/formatters';

describe('formatters.js - Currency and Date Formatters', () => {
  describe('formatRupiah', () => {
    it('memformat angka normal menjadi format Rupiah dengan prefix', () => {
      expect(formatRupiah(25000)).toBe('Rp 25.000');
      expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
    });

    it('memformat angka negatif dengan prefix -Rp', () => {
      expect(formatRupiah(-50000)).toBe('-Rp 50.000');
    });

    it('memformat tanpa prefix ketika includePrefix = false', () => {
      expect(formatRupiah(75000, false)).toBe('75.000');
    });

    it('menghandle nilai 0 atau input null/undefined', () => {
      expect(formatRupiah(0)).toBe('Rp 0');
      expect(formatRupiah(null)).toBe('Rp 0');
    });
  });

  describe('formatCompact', () => {
    it('memformat ribuan menjadi Rb', () => {
      expect(formatCompact(50000)).toBe('50 Rb');
    });

    it('memformat jutaan menjadi Jt', () => {
      expect(formatCompact(2500000)).toBe('2.5 Jt');
      expect(formatCompact(1000000)).toBe('1 Jt');
    });

    it('memformat miliaran menjadi M', () => {
      expect(formatCompact(1500000000)).toBe('1.5 M');
    });

    it('menampilkan angka mentah jika di bawah 1000', () => {
      expect(formatCompact(500)).toBe('500');
    });
  });

  describe('formatDateIndo', () => {
    it('memformat tanggal ke bahasa Indonesia dengan benar', () => {
      const dateStr = '2026-08-17T10:00:00.000Z';
      const formatted = formatDateIndo(dateStr);
      expect(formatted).toContain('Agustus 2026');
    });

    it('mengembalikan "-" jika input tidak valid', () => {
      expect(formatDateIndo(null)).toBe('-');
      expect(formatDateIndo('invalid-date')).toBe('-');
    });
  });

  describe('isSameDay', () => {
    it('mengembalikan true untuk dua timestamp di hari yang sama', () => {
      const d1 = new Date(2026, 7, 17, 10, 0, 0);
      const d2 = new Date(2026, 7, 17, 23, 59, 0);
      expect(isSameDay(d1, d2)).toBe(true);
    });

    it('mengembalikan false untuk tanggal berbeda', () => {
      const d1 = new Date(2026, 7, 17);
      const d2 = new Date(2026, 7, 18);
      expect(isSameDay(d1, d2)).toBe(false);
    });
  });
});
