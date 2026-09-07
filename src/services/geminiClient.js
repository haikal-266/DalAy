/**
 * geminiClient.js
 * Centralized Google Gemini AI Client / Gateway for DalAy
 *
 * Responsibilities:
 * - Centralized endpoint & model management
 * - Dynamic discovery of active models for user's API key
 * - Intelligent model failover queue (gemini-3.6, 2.5, 2.0, 1.5)
 * - API version negotiation ('v1beta', 'v1')
 * - Automatic HTTP 429 rate-limit backoff retry
 * - Automatic HTTP 400 fallback for models not supporting responseMimeType
 * - Robust fetch with AbortController timeout
 * - API key validation
 */

import { getFriendlyErrorMessage } from '../utils/errorHandler';

export const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.6-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

let cachedModels = null;
let cachedModelsKey = '';
let cachedModelsTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

/**
 * Clear cached models list (useful for tests or key changes)
 */
export const clearGeminiModelCache = () => {
  cachedModels = null;
  cachedModelsKey = '';
  cachedModelsTimestamp = 0;
};

/**
 * Helper to fetch with an AbortController timeout
 * @param {string} url
 * @param {Object} options
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
export const fetchWithTimeout = async (url, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout (${timeoutMs / 1000}s)`);
    }
    throw err;
  }
};

/**
 * Detect if an error is an unrecoverable host/DNS or network connectivity error.
 * When this occurs, retrying alternative models on the same host is futile and causes long freezes.
 * @param {Error|any} err
 * @returns {boolean}
 */
export const isNetworkOrDnsError = (err) => {
  if (!err) return false;
  const msg = (
    typeof err === 'string'
      ? err
      : `${err.message || ''} ${err.name || ''} ${err.cause?.message || ''} ${err.toString() || ''}`
  ).toLowerCase();

  return (
    msg.includes('unknownhostexception') ||
    msg.includes('unable to resolve host') ||
    msg.includes('no address associated with hostname') ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('fetch failed') ||
    msg.includes('enotfound') ||
    msg.includes('eai_again') ||
    msg.includes('econnrefused') ||
    msg.includes('econnreset') ||
    msg.includes('ehostunreach') ||
    msg.includes('enetunreach') ||
    msg.includes('failed to connect') ||
    msg.includes('connection refused') ||
    msg.includes('sockettimeoutexception') ||
    msg.includes('net::err_internet_disconnected') ||
    msg.includes('net::err_name_not_resolved') ||
    msg.includes('net::err_network_changed') ||
    msg.includes('net::err_connection_timed_out') ||
    msg.includes('net::err_connection_refused')
  );
};

/**
 * Dynamically fetch all active generateContent models for this specific API key
 * with in-memory caching to prevent redundant network lookups.
 * @param {string} apiKey 
 * @returns {Promise<string[]>}
 */
export const getAvailableGeminiModels = async (apiKey) => {
  if (!apiKey || !apiKey.trim()) return CANDIDATE_MODELS;

  const key = apiKey.trim();
  const now = Date.now();
  if (cachedModels && cachedModelsKey === key && now - cachedModelsTimestamp < CACHE_TTL_MS) {
    return cachedModels;
  }

  try {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      { method: 'GET' },
      8000
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.models)) {
        const generateModels = data.models
          .filter(
            (m) =>
              Array.isArray(m.supportedGenerationMethods) &&
              m.supportedGenerationMethods.includes('generateContent')
          )
          .map((m) => m.name.replace(/^models\//, ''));

        console.log('[Gemini Models] Discovered API models for key:', generateModels);
        if (generateModels.length > 0) {
          // Prioritize by candidate precedence (e.g. gemini-2.0, 1.5 first)
          const prioritized = [];
          for (const cand of CANDIDATE_MODELS) {
            const match = generateModels.find((m) => m.toLowerCase() === cand.toLowerCase());
            if (match && !prioritized.includes(match)) {
              prioritized.push(match);
            }
          }
          // Append any other discovered models
          generateModels.forEach((m) => {
            if (!prioritized.includes(m)) {
              prioritized.push(m);
            }
          });

          cachedModels = prioritized;
          cachedModelsKey = key;
          cachedModelsTimestamp = now;
          return prioritized;
        }
      }
    }
  } catch (e) {
    console.warn('[Gemini Models] Models lookup error:', e.message);
  }
  return cachedModels || CANDIDATE_MODELS;
};

/**
 * Validate Gemini API key by querying Google AI models list endpoint
 * @param {string} apiKey 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const validateGeminiKey = async (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    console.error('[Gemini Validation] Key format invalid');
    return { success: false, message: 'Format API key tidak valid' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
    console.log('[Gemini Validation] Querying Google AI models list endpoint...');
    const response = await fetchWithTimeout(url, { method: 'GET' }, 10000);
    const data = await response.json();
    console.log('[Gemini Validation] HTTP response status:', response.status);

    if (response.ok && data.models) {
      console.log('[Gemini Validation] Key validation SUCCESS! Found models count:', data.models.length);
      return { success: true, message: 'API Key valid dan terhubung!' };
    }

    const rawErrMsg = data?.error?.message || 'API Key tidak valid atau dinonaktifkan';
    console.warn('[Gemini Validation] Key validation FAILED:', rawErrMsg);
    return { success: false, message: getFriendlyErrorMessage(rawErrMsg, 'general', true) };
  } catch (err) {
    console.error('[Gemini Validation] Error validating Gemini key:', err.message);
    return { success: false, message: getFriendlyErrorMessage(err, 'general', true) };
  }
};

/**
 * Centralized caller for Gemini generateContent API
 * Handles:
 * - Model discovery and priority queue
 * - Multi-version fallback ('v1beta' -> 'v1')
 * - Rate limit (429) backoff retry
 * - Fallback when responseMimeType: 'application/json' is rejected (400)
 * - Safe response extraction
 * 
 * @param {Object} params
 * @param {string} params.apiKey - User's Gemini API key
 * @param {string} [params.prompt] - Prompt text
 * @param {Object} [params.inlineData] - Multimodal attachment { mimeType, data (base64) }
 * @param {Array} [params.parts] - Custom parts array (if caller prepared parts directly)
 * @param {string} [params.systemInstruction] - Optional system instruction text
 * @param {number} [params.temperature=0.1] - Sampling temperature
 * @param {number} [params.maxOutputTokens=4096] - Token limit
 * @param {string|null} [params.responseMimeType='application/json'] - Desired output MIME type
 * @param {string} [params.tag='Gemini AI'] - Prefix for logging (e.g. 'Gemini Scan', 'Gemini AI Report')
 * @param {number} [params.timeoutMs=30000] - Request timeout in milliseconds
 * @returns {Promise<{ text: string, model: string, version: string, rawResponse: Object }>}
 */
export const callGeminiAi = async ({
  apiKey,
  prompt,
  inlineData,
  parts,
  systemInstruction,
  temperature = 0.1,
  maxOutputTokens = 4096,
  responseMimeType = 'application/json',
  tag = 'Gemini AI',
  timeoutMs = 30000,
}) => {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('API key Gemini diperlukan');
  }

  // Build content parts
  const contentParts = parts || [
    ...(prompt ? [{ text: prompt }] : []),
    ...(inlineData ? [{ inlineData }] : []),
  ];

  if (contentParts.length === 0) {
    throw new Error('Prompt atau konten diperlukan untuk memanggil Gemini AI');
  }

  console.log(`[${tag}] Memulai pemanggilan Gemini AI...`);
  let modelsToTry = CANDIDATE_MODELS;
  try {
    const availableModels = await getAvailableGeminiModels(apiKey);
    modelsToTry = Array.from(new Set([...availableModels, ...CANDIDATE_MODELS]));
  } catch (lookupErr) {
    if (isNetworkOrDnsError(lookupErr)) {
      console.warn(`[${tag}] Koneksi jaringan/DNS gagal: ${lookupErr.message}. Tidak dapat menjangkau host Google AI.`);
      throw lookupErr;
    }
  }
  console.log(`[${tag}] Antrean model yang akan dicoba:`, modelsToTry);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  let lastError = null;
  let consecutiveTimeouts = 0;
  let hasRetriedTransientNetwork = false;

  for (const modelName of modelsToTry) {
    const versions = ['v1beta', 'v1'];

    for (const ver of versions) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/${ver}/models/${modelName}:generateContent?key=${apiKey.trim()}`;
        console.log(`[${tag}] Mengirim request ke ${modelName} (${ver})...`);

        let reqBody = {
          contents: [{ parts: contentParts }],
          generationConfig: {
            temperature,
            maxOutputTokens,
            ...(responseMimeType ? { responseMimeType } : {}),
          },
          ...(systemInstruction
            ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
            : {}),
        };

        let response;
        try {
          response = await fetchWithTimeout(
            endpoint,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody),
            },
            timeoutMs
          );
        } catch (fetchErr) {
          // If this is a transient DNS / network cold-start error (very common on Android idle radio),
          // perform ONE quick retry after 800ms before declaring the network offline.
          if (isNetworkOrDnsError(fetchErr) && !hasRetriedTransientNetwork) {
            hasRetriedTransientNetwork = true;
            console.log(`[${tag}] Terdeteksi kendala jaringan/DNS awal (cold-start). Mencoba ulang otomatis dalam 800ms...`);
            await sleep(800);
            response = await fetchWithTimeout(
              endpoint,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody),
              },
              timeoutMs
            );
          } else {
            throw fetchErr;
          }
        }

        console.log(`[${tag}] Status respons ${modelName} (${ver}): ${response.status}`);

        // Handle Rate Limit (HTTP 429) with exponential backoff retry
        if (response.status === 429) {
          console.warn(`[${tag}] Model ${modelName} (${ver}) terkena Rate Limit (429). Menunggu jeda backoff...`);
          await sleep(2500);
          response = await fetchWithTimeout(
            endpoint,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody),
            },
            timeoutMs
          );
          console.log(`[${tag}] Status retry backoff ${modelName} (${ver}): ${response.status}`);
        }

        // If responseMimeType fails with 400 Bad Request, retry without responseMimeType
        if (!response.ok && response.status === 400 && responseMimeType) {
          console.log(`[${tag}] Retrying ${modelName} (${ver}) tanpa responseMimeType...`);
          const fallbackParts = contentParts.map((p, idx) => {
            if (idx === 0 && p.text && responseMimeType === 'application/json') {
              return { ...p, text: p.text + '\nPastikan hanya mengembalikan output murni dalam format JSON valid.' };
            }
            return p;
          });

          reqBody = {
            contents: [{ parts: fallbackParts }],
            generationConfig: {
              temperature,
              maxOutputTokens,
            },
            ...(systemInstruction
              ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
              : {}),
          };

          response = await fetchWithTimeout(
            endpoint,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody),
            },
            timeoutMs
          );
          console.log(`[${tag}] Status retry tanpa responseMimeType:`, response.status);
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          console.warn(`[${tag}] Model ${modelName} (${ver}) gagal (status ${response.status}):`, errText.slice(0, 120));
          lastError = new Error(`Model ${modelName} (${ver}) status ${response.status}: ${errText.slice(0, 100)}`);
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          console.warn(`[${tag}] Model ${modelName} (${ver}) mengembalikan parts kosong`);
          lastError = new Error(`Model ${modelName} parts kosong`);
          continue;
        }

        console.log(`[${tag}] SUCCESS dengan model ${modelName} (${ver})!`);
        return {
          text: rawText,
          model: modelName,
          version: ver,
          rawResponse: data,
        };
      } catch (err) {
        lastError = err;

        // Abort immediately on network or DNS failure.
        // All models use the same host ('generativelanguage.googleapis.com').
        // Retrying additional models or versions when offline causes long freezes and floods logs.
        if (isNetworkOrDnsError(err)) {
          console.warn(`[${tag}] Koneksi jaringan/DNS gagal pada model ${modelName} (${ver}): ${err.message}. Menghentikan antrean model seketika.`);
          throw err;
        }

        // Limit consecutive timeouts to avoid freezing for minutes
        if (err.message && err.message.toLowerCase().includes('timeout')) {
          consecutiveTimeouts++;
          if (consecutiveTimeouts >= 2) {
            console.warn(`[${tag}] Waktu tunggu (timeout) berulang kali habis. Menghentikan antrean model.`);
            throw err;
          }
        }

        console.warn(`[${tag}] Request error pada model ${modelName} (${ver}):`, err.message);
      }
    }
  }

  throw lastError || new Error('Seluruh model Gemini gagal dihubungi.');
};
