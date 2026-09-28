import {
  CANDIDATE_MODELS,
  fetchWithTimeout,
  getAvailableGeminiModels,
  validateGeminiKey,
  callGeminiAi,
  isNetworkOrDnsError,
  clearGeminiModelCache,
} from '../../src/services/geminiClient';

const originalFetch = global.fetch;

describe('geminiClient Service (Centralized AI Gateway)', () => {
  beforeEach(() => {
    clearGeminiModelCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
    clearGeminiModelCache();
  });

  describe('CANDIDATE_MODELS', () => {
    it('should provide priority-ordered list of Google Gemini Flash models', () => {
      expect(Array.isArray(CANDIDATE_MODELS)).toBe(true);
      expect(CANDIDATE_MODELS).toContain('gemini-3.6-flash');
      expect(CANDIDATE_MODELS).toContain('gemini-flash-latest');
    });
  });

  describe('fetchWithTimeout', () => {
    it('should return response when fetch succeeds within timeout', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
      const res = await fetchWithTimeout('https://example.com', {}, 5000);
      expect(res.ok).toBe(true);
    });

    it('should throw timeout error when AbortError occurs', async () => {
      global.fetch = jest.fn().mockRejectedValue({ name: 'AbortError' });
      await expect(fetchWithTimeout('https://example.com', {}, 1000)).rejects.toThrow(
        /Request timeout/
      );
    });
  });

  describe('validateGeminiKey', () => {
    it('should reject short or invalid format key', async () => {
      const result = await validateGeminiKey('short');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Format API key tidak valid');
    });

    it('should return success when models endpoint returns 200 with models', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ models: [{ name: 'models/gemini-2.0-flash' }] }),
      });

      const result = await validateGeminiKey('AIzaSyValidDummyKey123456789');
      expect(result.success).toBe(true);
      expect(result.message).toContain('API Key valid');
    });

    it('should return failure with friendly message when API returns error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'API key not valid' } }),
      });

      const result = await validateGeminiKey('AIzaSyInvalidKey123456789');
      expect(result.success).toBe(false);
    });
  });

  describe('getAvailableGeminiModels', () => {
    it('should return fallback CANDIDATE_MODELS if apiKey is missing', async () => {
      const models = await getAvailableGeminiModels('');
      expect(models).toEqual(CANDIDATE_MODELS);
    });

    it('should discover supported models and order them by candidate priority', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          models: [
            {
              name: 'models/gemini-1.5-flash',
              supportedGenerationMethods: ['generateContent'],
            },
            {
              name: 'models/gemini-2.0-flash',
              supportedGenerationMethods: ['generateContent'],
            },
            {
              name: 'models/embedding-001',
              supportedGenerationMethods: ['embedContent'],
            },
          ],
        }),
      });

      const models = await getAvailableGeminiModels('AIzaSyDummyKey123456789');
      expect(models).toContain('gemini-2.0-flash');
      expect(models).toContain('gemini-1.5-flash');
      expect(models).not.toContain('embedding-001');
    });

    it('should prioritize gemini-3.6-flash and filter out audio/image specialized models', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          models: [
            { name: 'models/gemini-2.5-flash-preview-tts', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/gemini-3.6-flash', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/gemini-2.5-flash-image', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/lyria-3.5', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/gemini-flash-latest', supportedGenerationMethods: ['generateContent'] },
          ],
        }),
      });

      const models = await getAvailableGeminiModels('AIzaSyDummyKey123456789');
      expect(models[0]).toBe('gemini-3.6-flash');
      expect(models[1]).toBe('gemini-flash-latest');
      expect(models).not.toContain('gemini-2.5-flash-preview-tts');
      expect(models).not.toContain('gemini-2.5-flash-image');
      expect(models).not.toContain('lyria-3.5');
    });
  });

  describe('callGeminiAi', () => {
    it('should throw if apiKey is empty', async () => {
      await expect(callGeminiAi({ apiKey: '', prompt: 'hello' })).rejects.toThrow(
        /API key Gemini diperlukan/
      );
    });

    it('should throw if prompt and parts are both missing', async () => {
      await expect(
        callGeminiAi({ apiKey: 'AIzaSyValidDummyKey123456789' })
      ).rejects.toThrow(/Prompt atau konten diperlukan/);
    });

    it('should successfully call generateContent and return text & model', async () => {
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/models?key=')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              models: [
                {
                  name: 'models/gemini-2.0-flash',
                  supportedGenerationMethods: ['generateContent'],
                },
              ],
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: '{"response": "OK"}' }],
                },
              },
            ],
          }),
        });
      });

      const result = await callGeminiAi({
        apiKey: 'AIzaSyValidDummyKey123456789',
        prompt: 'Analyze data',
        responseMimeType: 'application/json',
        tag: 'Test AI',
      });

      expect(result.text).toBe('{"response": "OK"}');
      expect(result.model).toBe('gemini-2.0-flash');
      expect(result.version).toBe('v1beta');
    });

    it('should support multimodal inlineData', async () => {
      let requestedBody = null;
      global.fetch = jest.fn().mockImplementation((url, opts) => {
        if (url.includes('/models?key=')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              models: [{ name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }],
            }),
          });
        }
        requestedBody = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'Receipt parsed' }] } }],
          }),
        });
      });

      const result = await callGeminiAi({
        apiKey: 'AIzaSyValidDummyKey123456789',
        prompt: 'Read receipt',
        inlineData: { mimeType: 'image/jpeg', data: 'base64sample' },
        tag: 'Test Multimodal',
      });

      expect(result.text).toBe('Receipt parsed');
      expect(requestedBody.contents[0].parts).toHaveLength(2);
      expect(requestedBody.contents[0].parts[1].inlineData.mimeType).toBe('image/jpeg');
    });

    it('should retry without responseMimeType when model returns 400 Bad Request', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/models?key=')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              models: [{ name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }],
            }),
          });
        }
        callCount++;
        if (callCount === 1) {
          // First attempt with responseMimeType returns 400
          return Promise.resolve({
            ok: false,
            status: 400,
            text: async () => 'Unsupported responseMimeType',
          });
        }
        // Second attempt without responseMimeType succeeds
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'Fallback success' }] } }],
          }),
        });
      });

      const result = await callGeminiAi({
        apiKey: 'AIzaSyValidDummyKey123456789',
        prompt: 'Generate JSON',
        responseMimeType: 'application/json',
      });

      expect(result.text).toBe('Fallback success');
      expect(callCount).toBe(2);
    });

    it('should throw error when all models fail', async () => {
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/models?key=')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ models: [] }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 503,
          text: async () => 'Service unavailable',
        });
      });

      await expect(
        callGeminiAi({
          apiKey: 'AIzaSyValidDummyKey123456789',
          prompt: 'Hello',
        })
      ).rejects.toThrow();
    });

    it('should abort quickly when DNS/host resolution fails without retrying all candidate models', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(
          new Error(
            'fetch failed: java.net.UnknownHostException: Unable to resolve host "generativelanguage.googleapis.com": No address associated with hostname'
          )
        );
      });

      await expect(
        callGeminiAi({
          apiKey: 'AIzaSyValidDummyKey123456789',
          prompt: 'Receipt image',
          tag: 'Gemini Scan Test',
        })
      ).rejects.toThrow(/UnknownHostException/);

      // Discovery (1) + model 1st attempt (1) + transient retry (1) = 3 calls total, then aborted immediately
      expect(callCount).toBeLessThanOrEqual(3);
    });

    it('should abort immediately if model request encounters network failure without retrying subsequent models', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation((url) => {
        callCount++;
        if (url.includes('/models?key=')) {
          // Model discovery succeeds with 2 models
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              models: [
                { name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] },
                { name: 'models/gemini-1.5-flash', supportedGenerationMethods: ['generateContent'] },
              ],
            }),
          });
        }
        // First model request throws Network request failed
        return Promise.reject(new Error('TypeError: Network request failed'));
      });

      await expect(
        callGeminiAi({
          apiKey: 'AIzaSyValidDummyKey123456789',
          prompt: 'Analyze',
          tag: 'Gemini Scan Test',
        })
      ).rejects.toThrow(/Network request failed/);

      // Discovery (1) + 1st model request (1) + transient retry (1) = 3 calls total, then aborted immediately
      expect(callCount).toBe(3);
    });

    it('should recover from transient cold-start DNS failure on automatic retry and succeed', async () => {
      let modelCallCount = 0;
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/models?key=')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              models: [{ name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }],
            }),
          });
        }
        modelCallCount++;
        if (modelCallCount === 1) {
          // Cold-start DNS failure on 1st attempt
          return Promise.reject(
            new Error('fetch failed: java.net.UnknownHostException: Unable to resolve host "generativelanguage.googleapis.com": No address associated with hostname')
          );
        }
        // Succeeds on automatic transient retry!
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'Cold start recovered' }] } }],
          }),
        });
      });

      const result = await callGeminiAi({
        apiKey: 'AIzaSyValidDummyKey123456789',
        prompt: 'Scan receipt',
        tag: 'Gemini Scan Test',
      });

      expect(result.text).toBe('Cold start recovered');
      expect(modelCallCount).toBe(2);
    });

    it('should cache discovered models and avoid repeated network lookups', async () => {
      let lookupCount = 0;
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/models?key=')) {
          lookupCount++;
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              models: [{ name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }],
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'OK' }] } }],
          }),
        });
      });

      await callGeminiAi({ apiKey: 'AIzaSyKey123', prompt: 'First' });
      await callGeminiAi({ apiKey: 'AIzaSyKey123', prompt: 'Second' });

      // Only 1 lookup was made because the second call used the cache!
      expect(lookupCount).toBe(1);
    });
  });

  describe('isNetworkOrDnsError helper', () => {
    it('should return true for Android UnknownHostException and DNS resolution errors', () => {
      const err = new Error(
        'fetch failed: java.net.UnknownHostException: Unable to resolve host "generativelanguage.googleapis.com": No address associated with hostname'
      );
      expect(isNetworkOrDnsError(err)).toBe(true);
    });

    it('should return true for React Native Network request failed', () => {
      expect(isNetworkOrDnsError(new Error('TypeError: Network request failed'))).toBe(true);
      expect(isNetworkOrDnsError(new Error('Failed to fetch'))).toBe(true);
    });

    it('should return true for Node.js DNS/network errors like ENOTFOUND and ECONNREFUSED', () => {
      expect(isNetworkOrDnsError(new Error('getaddrinfo ENOTFOUND generativelanguage.googleapis.com'))).toBe(true);
      expect(isNetworkOrDnsError(new Error('connect ECONNREFUSED 142.250.190.42:443'))).toBe(true);
    });

    it('should return false for HTTP status errors and non-network errors', () => {
      expect(isNetworkOrDnsError(new Error('Model gemini-2.0-flash status 404: Not Found'))).toBe(false);
      expect(isNetworkOrDnsError(new Error('Model gemini-2.0-flash status 429: Quota exceeded'))).toBe(false);
      expect(isNetworkOrDnsError(new Error('JSON Parse error: Unexpected token'))).toBe(false);
      expect(isNetworkOrDnsError(null)).toBe(false);
    });
  });
});
