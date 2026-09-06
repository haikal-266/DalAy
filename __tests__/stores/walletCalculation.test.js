/**
 * Unit Tests: Wallet Calculations, Net Worth & Transfer Logic
 */

describe('Wallet Calculations & Financial Logic', () => {
  // Helper to calculate total net worth
  const calculateTotalNetWorth = (wallets = []) => {
    return wallets.reduce((total, w) => total + (Number(w.balance) || 0), 0);
  };

  // Helper to simulate wallet transfer
  const simulateTransfer = ({
    sourceWallet,
    targetWallet,
    amount,
    adminFee = 0,
  }) => {
    const totalDeduction = amount + adminFee;
    const isSufficient = (sourceWallet.balance || 0) >= totalDeduction;

    return {
      isSufficient,
      totalDeduction,
      sourceNewBalance: (sourceWallet.balance || 0) - totalDeduction,
      targetNewBalance: (targetWallet.balance || 0) + amount,
    };
  };

  // Helper to calculate balance adjustment diff
  const calculateAdjustment = (currentBalance, newTargetBalance) => {
    const diff = newTargetBalance - currentBalance;
    return {
      diff: Math.abs(diff),
      isIncrease: diff >= 0,
      type: diff >= 0 ? 'income' : 'expense',
    };
  };

  describe('calculateTotalNetWorth', () => {
    it('menghitung total net worth dengan benar dari berbagai akun', () => {
      const wallets = [
        { id: '1', name: 'Tunai', balance: 250000 },
        { id: '2', name: 'BCA', balance: 1750000 },
        { id: '3', name: 'GoPay', balance: 50000 },
      ];

      const netWorth = calculateTotalNetWorth(wallets);
      expect(netWorth).toBe(2050000);
    });

    it('menghandle wallet dengan balance 0 atau undefined dengan aman', () => {
      const wallets = [
        { id: '1', name: 'Tunai', balance: 100000 },
        { id: '2', name: 'Kosong', balance: 0 },
        { id: '3', name: 'Baru' },
      ];

      const netWorth = calculateTotalNetWorth(wallets);
      expect(netWorth).toBe(100000);
    });
  });

  describe('simulateTransfer', () => {
    it('menghitung transfer antar wallet dengan biaya admin secara presisi', () => {
      const source = { id: 'w1', name: 'BCA', balance: 1000000 };
      const target = { id: 'w2', name: 'GoPay', balance: 50000 };
      const amount = 200000;
      const adminFee = 2500;

      const sim = simulateTransfer({
        sourceWallet: source,
        targetWallet: target,
        amount,
        adminFee,
      });

      expect(sim.isSufficient).toBe(true);
      expect(sim.totalDeduction).toBe(202500);
      expect(sim.sourceNewBalance).toBe(797500);
      expect(sim.targetNewBalance).toBe(250000);
    });

    it('mendeteksi jika saldo sumber tidak mencukupi untuk transfer + admin fee', () => {
      const source = { id: 'w1', name: 'Tunai', balance: 50000 };
      const target = { id: 'w2', name: 'OVO', balance: 0 };
      const amount = 50000;
      const adminFee = 1500; // total 51.500 > 50.000

      const sim = simulateTransfer({
        sourceWallet: source,
        targetWallet: target,
        amount,
        adminFee,
      });

      expect(sim.isSufficient).toBe(false);
      expect(sim.sourceNewBalance).toBe(-1500);
    });
  });

  describe('calculateAdjustment (Rekonsiliasi Saldo)', () => {
    it('menghitung penyesuaian saldo bertambah (selisih positif)', () => {
      const current = 100000;
      const target = 150000;

      const adj = calculateAdjustment(current, target);
      expect(adj.diff).toBe(50000);
      expect(adj.isIncrease).toBe(true);
      expect(adj.type).toBe('income');
    });

    it('menghitung penyesuaian saldo berkurang (selisih negatif)', () => {
      const current = 200000;
      const target = 130000;

      const adj = calculateAdjustment(current, target);
      expect(adj.diff).toBe(70000);
      expect(adj.isIncrease).toBe(false);
      expect(adj.type).toBe('expense');
    });
  });
});
