import {
  repairAndParseReceiptJson,
  validateGeminiKey,
  scanReceiptOffline,
  scanReceiptWithGemini,
  CANDIDATE_MODELS,
} from '../../src/services/receiptScanner';

// Mock global fetch
const originalFetch = global.fetch;

describe('receiptScanner Service (AI Scan Struk)', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('CANDIDATE_MODELS', () => {
    it('should list resilient Google Gemini Flash models', () => {
      expect(Array.isArray(CANDIDATE_MODELS)).toBe(true);
      expect(CANDIDATE_MODELS.length).toBeGreaterThanOrEqual(4);
      expect(CANDIDATE_MODELS).toContain('gemini-2.5-flash');
      expect(CANDIDATE_MODELS).toContain('gemini-2.0-flash');
    });
  });

  describe('repairAndParseReceiptJson (Resilient JSON Parser)', () => {
    it('should parse valid clean JSON string', () => {
      const jsonStr = JSON.stringify({
        merchant: 'Indomaret Point',
        date: '2026-09-01',
        totalAmount: 45000,
        type: 'expense',
        categoryId: 'shopping',
        items: [{ name: 'Roti Gandum', price: 15000, qty: 3 }],
      });

      const parsed = repairAndParseReceiptJson(jsonStr);
      expect(parsed).toBeTruthy();
      expect(parsed.merchant).toBe('Indomaret Point');
      expect(parsed.totalAmount).toBe(45000);
      expect(parsed.items.length).toBe(1);
    });

    it('should strip markdown backticks and json tag', () => {
      const markdownJson = `\`\`\`json
{
  "merchant": "Alfamart",
  "totalAmount": 28500,
  "date": "2026-09-02"
}
\`\`\``;

      const parsed = repairAndParseReceiptJson(markdownJson);
      expect(parsed).toBeTruthy();
      expect(parsed.merchant).toBe('Alfamart');
      expect(parsed.totalAmount).toBe(28500);
    });

    it('should repair truncated JSON with missing closing brackets and braces', () => {
      // Truncated mid-response from AI token limit
      const truncated = `{
        "merchant": "Superindo",
        "date": "2026-09-03",
        "totalAmount": 125000,
        "items": [
          { "name": "Apel Fuji", "price": 45000, "qty": 1 },
          { "name": "Susu Segar", "price": 80000, "qty": 1 }`;

      const parsed = repairAndParseReceiptJson(truncated);
      expect(parsed).toBeTruthy();
      expect(parsed.merchant).toBe('Superindo');
      expect(parsed.totalAmount).toBe(125000);
    });

    it('should fallback to regex extraction when JSON syntax is corrupted', () => {
      const corruptedText = `Berikut adalah data struk:
"merchant": "Kopi Kenangan",
"totalAmount": 38000,
"date": "2026-09-04",
"categoryId": "food"
(end of receipt)`;

      const parsed = repairAndParseReceiptJson(corruptedText);
      expect(parsed).toBeTruthy();
      expect(parsed.merchant).toBe('Kopi Kenangan');
      expect(parsed.totalAmount).toBe(38000);
      expect(parsed.date).toBe('2026-09-04');
    });

    it('should return null for empty or non-string inputs', () => {
      expect(repairAndParseReceiptJson('')).toBeNull();
      expect(repairAndParseReceiptJson(null)).toBeNull();
      expect(repairAndParseReceiptJson(undefined)).toBeNull();
    });
  });

  describe('validateGeminiKey', () => {
    it('should reject keys shorter than 10 characters immediately', async () => {
      const result = await validateGeminiKey('short');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Format API key tidak valid');
    });

    it('should return success when Google API responds with model list', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          models: [{ name: 'models/gemini-2.5-flash' }, { name: 'models/gemini-2.0-flash' }],
        }),
      });

      const result = await validateGeminiKey('AIzaSyValidDummyKeyForTesting12345');
      expect(result.success).toBe(true);
      expect(result.message).toContain('valid');
    });

    it('should return user-friendly error when Google API responds with error message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'API key not valid. Please pass a valid API key.' },
        }),
      });

      const result = await validateGeminiKey('AIzaSyInvalidFakeKeyTesting123456');
      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });
  });

  describe('scanReceiptOffline (Automated OCR Parser)', () => {
    it('should detect Indomaret merchant, date, total, and line items', async () => {
      const indomaretOcrText = `
        INDOMARET MANGESTI JAYA
        JL. MANGESTI RAYA NO. 12
        15 Mei 2026 14:30
        
        ROTI TAWAR SARI ROTI   1   15.000   15.000
        ULTRA MILK COKLAT 1L   2   19.500   39.000
        
        HARGA JUAL : Rp 54.000
        TUNAI : Rp 100.000
        KEMBALIAN : Rp 46.000
        TERIMA KASIH
      `;

      const result = await scanReceiptOffline({ rawText: indomaretOcrText });

      expect(result.merchant).toBe('Indomaret');
      expect(result.totalAmount).toBe(54000);
      expect(result.date).toBe('2026-05-15');
      expect(result.isOffline).toBe(true);
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(result.items[0].name).toContain('ROTI TAWAR');
      expect(result.items[0].price).toBe(15000);
    });

    it('should detect Alfamart merchant and numeric slash dates', async () => {
      const alfamartOcrText = `
        ALFAMART KAMPUS UGM
        28/08/2026
        
        TEH BOTOL SOSRO 450ML  2  7500  15000
        TOTAL BELANJA : 15.000
        BAYAR : 20.000
      `;

      const result = await scanReceiptOffline({ rawText: alfamartOcrText });

      expect(result.merchant).toBe('Alfamart');
      expect(result.totalAmount).toBe(15000);
      expect(result.date).toBe('2026-08-28');
      expect(result.items.length).toBe(1);
    });

    it('should recalculate total from items when grand total text is absent', async () => {
      const receiptNoTotal = `
        WARUNG MAKAN SEDAP
        10-09-2026
        NASI GORENG SPESIAL   1   25.000   25.000
        ES TEH MANIS          1    5.000    5.000
      `;

      const result = await scanReceiptOffline({ rawText: receiptNoTotal });

      expect(result.merchant).toContain('WARUNG MAKAN');
      expect(result.totalAmount).toBe(30000); // 25000 + 5000
      expect(result.items.length).toBe(2);
    });
  });

  describe('scanReceiptWithGemini (Vision AI)', () => {
    it('should throw error if apiKey is not provided', async () => {
      await expect(scanReceiptWithGemini('file:///test/receipt.jpg', '')).rejects.toThrow(
        /API Key Gemini belum diatur/i
      );
    });

    it('should successfully parse receipt JSON from Gemini Vision AI', async () => {
      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    merchant: 'Gramedia Bookstore',
                    date: '2026-09-05',
                    totalAmount: 185000,
                    type: 'expense',
                    categoryId: 'education',
                    items: [
                      { name: 'Buku The Psychology of Money', price: 110000, qty: 1 },
                      { name: 'Notebook Spiral A5', price: 75000, qty: 1 },
                    ],
                    notes: 'Buku bacaan finansial',
                  }),
                },
              ],
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockGeminiResponse,
      });

      const result = await scanReceiptWithGemini(
        'file:///test/receipt.jpg',
        'AIzaSyDummyGeminiKeyValid123456789'
      );

      expect(result).toBeDefined();
      expect(result.merchant).toBe('Gramedia Bookstore');
      expect(result.totalAmount).toBe(185000);
      expect(result.date).toBe('2026-09-05');
      expect(result.categoryId).toBe('education');
      expect(result.items.length).toBe(2);
      expect(result.notes).toBe('Buku bacaan finansial');
    });
  });
});
