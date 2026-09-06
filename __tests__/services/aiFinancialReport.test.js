import {
  getOfflineSmartInsights,
  fetchGeminiAiFinancialInsights,
  CURATED_EXPERT_CITATIONS,
} from '../../src/services/aiFinancialReport';
import { buildReportHtml } from '../../src/services/pdfReportGenerator';

describe('aiFinancialReport Service', () => {
  describe('CURATED_EXPERT_CITATIONS', () => {
    it('should have reputable authors and valid citations', () => {
      expect(CURATED_EXPERT_CITATIONS.length).toBeGreaterThanOrEqual(5);

      const authors = CURATED_EXPERT_CITATIONS.map((c) => c.author);
      expect(authors).toContain('Morgan Housel');
      expect(authors).toContain('Prof. Elizabeth Warren');
      expect(authors).toContain('Warren Buffett');
      expect(authors).toContain('Daniel Kahneman');
      expect(authors).toContain('Benjamin Graham');

      CURATED_EXPERT_CITATIONS.forEach((c) => {
        expect(c.author).toBeTruthy();
        expect(c.source).toBeTruthy();
        expect(c.quoteId).toBeTruthy();
        expect(c.quoteEn).toBeTruthy();
      });
    });
  });

  describe('getOfflineSmartInsights', () => {
    it('should return deficit warnings and Graham citation when expenses exceed income', () => {
      const metrics = {
        totalIncome: 5000000,
        totalExpense: 7500000,
        balance: -2500000,
        topCategory: { name: 'Makanan & Minuman', amount: 3500000, percentage: 47 },
      };

      const result = getOfflineSmartInsights(metrics, true);
      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThanOrEqual(2);
      expect(result.insights[0]).toContain('pengeluaran lebih besar');
      expect(result.citation.author).toBe('Benjamin Graham');
    });

    it('should return high savings praise and Buffett citation when savings rate >= 30%', () => {
      const metrics = {
        totalIncome: 10000000,
        totalExpense: 6000000,
        balance: 4000000, // 40% savings rate
        topCategory: { name: 'Investasi', amount: 3000000, percentage: 50 },
      };

      const result = getOfflineSmartInsights(metrics, true);
      expect(result.insights).toBeDefined();
      expect(result.insights[0]).toContain('sangat sehat');
      expect(result.citation.author).toBe('Warren Buffett');
    });

    it('should return Elizabeth Warren 50/30/20 citation for moderate positive cashflow', () => {
      const metrics = {
        totalIncome: 10000000,
        totalExpense: 8500000,
        balance: 1500000, // 15% savings rate
        topCategory: { name: 'Belanja', amount: 4000000, percentage: 47 },
      };

      const result = getOfflineSmartInsights(metrics, true);
      expect(result.insights).toBeDefined();
      expect(result.insights[0]).toContain('surplus');
      expect(result.citation.author).toBe('Prof. Elizabeth Warren');
    });

    it('should handle zero income gracefully and quote Morgan Housel', () => {
      const metrics = {
        totalIncome: 0,
        totalExpense: 1200000,
        balance: -1200000,
      };

      const result = getOfflineSmartInsights(metrics, true);
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.citation.author).toBe('Morgan Housel');
    });

    it('should support English language generation', () => {
      const metrics = {
        totalIncome: 10000000,
        totalExpense: 6000000,
        balance: 4000000,
      };

      const result = getOfflineSmartInsights(metrics, false);
      expect(result.insights[0]).toContain('financial health');
      expect(result.citation.quote).toContain('Do not save what is left');
    });
  });

  describe('fetchGeminiAiFinancialInsights', () => {
    it('should gracefully fallback to offline insights when API key is invalid or empty', async () => {
      const metrics = {
        totalIncome: 5000000,
        totalExpense: 3000000,
        balance: 2000000,
      };

      const result = await fetchGeminiAiFinancialInsights(metrics, '', true);
      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThanOrEqual(1);
      expect(result.citation).toBeDefined();
      expect(result.citation.author).toBeTruthy();
    });

    it('should successfully parse Gemini AI response even with markdown code fences', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('models?key=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              models: [{ name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }],
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: "```json\n{\n  \"insights\": [\n    \"Pemasukan bulan ini tergolong stabil.\",\n    \"Pengeluaran pendidikan mendominasi anggaran.\"\n  ],\n  \"citation\": {\n    \"author\": \"Warren Buffett\",\n    \"source\": \"Berkshire Shareholder Letter\",\n    \"quote\": \"Rule No. 1: Never lose money.\"\n  }\n}\n```",
                    },
                  ],
                },
              },
            ],
          }),
        });
      });

      const metrics = {
        totalIncome: 10000000,
        totalExpense: 6000000,
        balance: 4000000,
        topCategory: { name: 'Pendidikan', percentage: 60, amount: 3600000 },
        categoryPercentages: [{ name: 'Pendidikan', percentage: 60 }],
        periodLabel: 'September 2026',
        topTransactions: ['Uang Kuliah (Rp 3.600.000)'],
        transactionsCount: 15,
      };

      const result = await fetchGeminiAiFinancialInsights(metrics, 'AIzaSyFakeValidKeyTesting12345', true);
      global.fetch = originalFetch;

      expect(result.isAiGenerated).toBe(true);
      expect(result.insights).toHaveLength(2);
      expect(result.insights[0]).toContain('Pemasukan bulan ini tergolong stabil');
      expect(result.citation.author).toBe('Warren Buffett');
    });
  });
});

describe('pdfReportGenerator Service', () => {
  describe('buildReportHtml', () => {
    it('should build responsive mobile-first HTML with chart and audit table at the bottom', () => {
      const transactions = [
        {
          id: 'tx_1',
          name: 'Gaji Bulanan',
          type: 'income',
          amount: 15000000,
          date: '2026-09-01',
          categoryName: 'Gaji',
          walletName: 'Bank BCA',
        },
        {
          id: 'tx_2',
          name: 'Sewa Apartemen',
          type: 'expense',
          amount: 4500000,
          date: '2026-09-02',
          categoryName: 'Tempat Tinggal',
          walletName: 'Bank BCA',
        },
      ];

      const summary = {
        totalIncome: 15000000,
        totalExpense: 4500000,
        balance: 10500000,
      };

      const categoryStats = [
        { name: 'Tempat Tinggal', amount: 4500000, percentage: 100, color: '#3B82F6', type: 'expense' },
      ];

      const aiData = {
        insights: ['Kesehatan finansial luar biasa dengan rasio tabungan 70%.'],
        citation: {
          author: 'Warren Buffett',
          source: 'Berkshire Hathaway Annual Letter',
          quote: 'Jangan menabung apa yang tersisa.',
        },
      };

      const html = buildReportHtml({
        transactions,
        summary,
        categoryStats,
        periodLabel: 'September 2026',
        isIndonesian: true,
        aiData,
      });

      // Assert classic A4 document setup & multi-page safety
      expect(html).toContain('size: A4 portrait;');
      expect(html).toContain('DALAY FINANCE');
      expect(html).toContain('September 2026');
      expect(html).toContain('display: table-header-group;');
      expect(html).toContain('break-inside: avoid;');

      // Assert SVG chart presence
      expect(html).toContain('<svg width="150" height="150"');
      expect(html).toContain('Tempat Tinggal');

      // Assert AI insights and citation presence
      expect(html).toContain('Kesehatan finansial luar biasa');
      expect(html).toContain('Warren Buffett');

      // Assert transactions table is rendered
      expect(html).toContain('Gaji Bulanan');
      expect(html).toContain('Sewa Apartemen');

      // Check that table comes after the AI container in the HTML stream (audit log at the bottom)
      const aiIndex = html.indexOf('Catatan Analisis Finansial');
      const tableIndex = html.indexOf('Gaji Bulanan');
      expect(tableIndex).toBeGreaterThan(aiIndex);
    });
  });

  describe('generateAndSharePdfReport', () => {
    it('should generate PDF, save via base64 to cacheDirectory, and trigger sharing', async () => {
      const { generateAndSharePdfReport } = require('../../src/services/pdfReportGenerator');
      const FileSystem = require('expo-file-system/legacy');
      const Sharing = require('expo-sharing');

      const result = await generateAndSharePdfReport({
        transactions: [
          { id: '1', name: 'Makan', type: 'expense', amount: 50000, date: '2026-09-01' },
        ],
        summary: { totalIncome: 1000000, totalExpense: 50000, balance: 950000 },
        categoryStats: [{ name: 'Makanan', amount: 50000, percentage: 100 }],
        periodLabel: 'September 2026',
        isIndonesian: true,
        aiData: {
          insights: ['Pengeluaran sangat terkendali.'],
          citation: { author: 'Test Author', source: 'Test Book', quote: 'Test quote' },
        },
      });

      expect(result.success).toBe(true);
      expect(result.fileName).toMatch(/DalAy_Report_\d{4}-\d{2}-\d{2}\.pdf/);
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('DalAy_Report_'),
        expect.any(String),
        expect.objectContaining({ encoding: 'base64' })
      );
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining('DalAy_Report_'),
        expect.objectContaining({
          mimeType: 'application/pdf',
          UTI: '.pdf',
        })
      );
    });
  });
});
