/**
 * geminiClient.js
 * Centralized Google Gemini AI Client / Gateway for DalAy
 *
 * Responsibilities:
 * - Centralized endpoint & model management
 * - Dynamic discovery of active models for user's API key
 * - Intelligent, verified model failover queue (gemini-1.5-flash, 1.5-8b, 2.0-flash)
 * - Exclusive use of 'v1beta' endpoint (native support for multimodal, systemInstruction, responseMimeType)
 * - Automatic HTTP 429 rate-limit backoff retry
 * - Automatic HTTP 400 fallback for models not supporting responseMimeType
 * - Robust fetch with AbortController timeout
 * - Fast-abort on network/DNS failure (avoids freezing UI or looping when offline)
 * - API key validation
 * - Detailed request & response logging for transparency
 */

import { getFriendlyErrorMessage } from '../utils/errorHandler';

// Model prioritas resmi: gemini-3.6-flash (rekomendasi resmi Google AI) & gemini-flash-latest
export const CANDIDATE_MODELS = [
  'gemini-3.6-flash',      // Rekomendasi resmi Google AI Studio untuk generateContent terbaru & stabil
  'gemini-flash-latest',   // Dynamic alias resmi Google (otomatis ke Flash versi termutakhir)
];

let cachedModels = null;
let cachedModelsKey = '';
let cachedModelsTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

/**
 * Helper to mask sensitive API Key in logs
 */
export const maskApiKey = (key) => {
  if (!key || typeof key !== 'string') return 'none';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '***';
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)} (${trimmed.length} chars)`;
};

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
    if (
      err.name === 'AbortError' ||
      err.message?.toLowerCase().includes('aborted') ||
      err.message?.toLowerCase().includes('canceled') ||
      err.message?.toLowerCase().includes('cancelled')
    ) {
      const timeoutErr = new Error(`Request timeout (${timeoutMs / 1000}s)`);
      timeoutErr.name = 'TimeoutError';
      throw timeoutErr;
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
  if (err.name === 'AbortError' || err.name === 'TimeoutError') return false;
  const msg = (
    typeof err === 'string'
      ? err
      : `${err.message || ''} ${err.name || ''} ${err.cause?.message || ''} ${err.toString() || ''}`
  ).toLowerCase();

  // Explicit cancellation or timeout on a single slow model is not a fatal host DNS resolution error
  if (
    msg.includes('timeout') ||
    msg.includes('canceled') ||
    msg.includes('cancelled') ||
    msg.includes('abort')
  ) {
    return false;
  }

  return (
    msg.includes('unknownhostexception') ||
    msg.includes('unable to resolve host') ||
    msg.includes('no address associated with hostname') ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    (msg.includes('fetch failed') && !msg.includes('cancel')) ||
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
 * Filters out specialized audio/image models and prioritizes standard Flash models.
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
        // Filter out models that cannot do general multimodal/text generateContent
        const isExcludedModel = (name) => {
          const lower = name.toLowerCase();
          return (
            lower.includes('-tts') ||           // Text-to-speech (audio output only, rejects text)
            lower.includes('-image') ||         // Image generation only (Imagen/preview)
            lower.includes('-transcribe') ||    // Audio input transcription only
            lower.includes('lyria') ||          // Music only
            lower.includes('robotics') ||       // Robotics only
            lower.includes('computer-use') ||   // OS actions
            lower.includes('deep-research') ||  // Async research agent
            lower.includes('banana')            // Internal/toy model
          );
        };

        const generateModels = data.models
          .filter(
            (m) =>
              Array.isArray(m.supportedGenerationMethods) &&
              m.supportedGenerationMethods.includes('generateContent') &&
              !isExcludedModel(m.name)
          )
          .map((m) => m.name.replace(/^models\//, ''));

        console.log('[Gemini Models] Discovered API models for key:', generateModels);
        if (generateModels.length > 0) {
          // Prioritize by candidate precedence (gemini-3.6-flash, gemini-flash-latest, etc.)
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
    console.log(`[Gemini Validation] Memverifikasi API Key ${maskApiKey(apiKey)} via models endpoint...`);
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
 * Log comprehensive details about a Gemini request
 */
const logGeminiRequest = ({ tag, endpoint, modelName, apiKey, promptSnippet, hasInlineData, inlineDataSize, systemInstruction, generationConfig }) => {
  const maskedEndpoint = endpoint.replace(/key=[^&]+/, `key=${maskApiKey(apiKey)}`);
  console.log(`\n[${tag}] ═══════════════ 🚀 GEMINI API REQUEST ═══════════════`);
  console.log(`[${tag}] Model: ${modelName} (Endpoint: v1beta)`);
  console.log(`[${tag}] URL: ${maskedEndpoint}`);
  console.log(`[${tag}] Config: temp=${generationConfig.temperature}, maxTokens=${generationConfig.maxOutputTokens}, responseMimeType=${generationConfig.responseMimeType || 'default'}`);
  if (systemInstruction) {
    const sysPreview = systemInstruction.length > 120 ? `${systemInstruction.slice(0, 120)}...` : systemInstruction;
    console.log(`[${tag}] System Instruction: "${sysPreview}"`);
  }
  if (hasInlineData) {
    console.log(`[${tag}] Multimodal Attachment: YES (Base64 size: ${(inlineDataSize / 1024).toFixed(1)} KB)`);
  }
  if (promptSnippet) {
    const promptPreview = promptSnippet.length > 250 ? `${promptSnippet.slice(0, 250)}... [truncated]` : promptSnippet;
    console.log(`[${tag}] Prompt Text: "${promptPreview}"`);
  }
  console.log(`[${tag}] ────────────────────────────────────────────────────────\n`);
};

/**
 * Log comprehensive details about a Gemini response
 */
const logGeminiResponse = ({ tag, modelName, status, ok, rawText, errBody }) => {
  console.log(`\n[${tag}] ═══════════════ 📥 GEMINI API RESPONSE ═══════════════`);
  console.log(`[${tag}] Model: ${modelName} | Status: HTTP ${status} ${ok ? '✅ OK' : '❌ FAILED'}`);
  if (ok && rawText) {
    const preview = rawText.length > 400 ? `${rawText.slice(0, 400)}... [truncated ${rawText.length} chars]` : rawText;
    console.log(`[${tag}] Response Body:\n${preview}`);
  } else if (!ok) {
    console.error(`[${tag}] Error Details:`, JSON.stringify(errBody || {}, null, 2));
  }
  console.log(`[${tag}] ════════════════════════════════════════════════════════\n`);
};

/**
 * Centralized caller for Gemini generateContent API
 * 
 * Features:
 * - Direct hit to stable v1beta endpoint
 * - Multimodal base64 & JSON mode (responseMimeType)
 * - Safe network/DNS abort & cold-start transient retry
 * - Rate limit (429) backoff
 * - Safe response extraction & detailed logging
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
    ...(inlineData
      ? [
        {
          inlineData: {
            mimeType: inlineData.mimeType || inlineData.mime_type || 'image/jpeg',
            data: inlineData.data,
          },
        },
      ]
      : []),
  ];

  if (contentParts.length === 0) {
    throw new Error('Prompt atau konten diperlukan untuk memanggil Gemini AI');
  }

  console.log(`[${tag}] Memulai pemanggilan Gemini AI dengan key: ${maskApiKey(apiKey)}...`);
  let modelsToTry = CANDIDATE_MODELS;
  try {
    const availableModels = await getAvailableGeminiModels(apiKey);
    if (availableModels && availableModels.length > 0) {
      modelsToTry = availableModels;
    }
  } catch (lookupErr) {
    if (isNetworkOrDnsError(lookupErr)) {
      console.warn(`[${tag}] Koneksi jaringan/DNS gagal: ${lookupErr.message}. Tidak dapat menjangkau host Google AI.`);
      throw lookupErr;
    }
  }
  console.log(`[${tag}] Antrean model yang akan dicoba:`, modelsToTry);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  let lastError = null;
  let hasRetriedTransientNetwork = false;

  const promptSnippet = prompt || (parts && parts[0]?.text) || '';
  const inlineDataSize = inlineData?.data?.length || 0;

  for (const modelName of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

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

    logGeminiRequest({
      tag,
      endpoint,
      modelName,
      apiKey,
      promptSnippet,
      hasInlineData: Boolean(inlineData),
      inlineDataSize,
      systemInstruction,
      generationConfig: reqBody.generationConfig,
    });

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
      // If this is a transient DNS / network cold-start error, perform ONE quick retry after 800ms
      if (isNetworkOrDnsError(fetchErr) && !hasRetriedTransientNetwork) {
        hasRetriedTransientNetwork = true;
        console.log(`[${tag}] Terdeteksi kendala jaringan/DNS awal (cold-start). Mencoba ulang otomatis dalam 800ms...`);
        await sleep(800);
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
        } catch (retryErr) {
          console.warn(`[${tag}] Koneksi jaringan/DNS gagal setelah retry: ${retryErr.message}. Menghentikan antrean model seketika.`);
          throw retryErr;
        }
      } else {
        if (isNetworkOrDnsError(fetchErr)) {
          console.warn(`[${tag}] Koneksi jaringan/DNS gagal: ${fetchErr.message}. Menghentikan antrean model seketika.`);
          throw fetchErr;
        }
        lastError = fetchErr;
        continue;
      }
    }

    // Handle Rate Limit (HTTP 429) with backoff retry
    if (response.status === 429) {
      console.warn(`[${tag}] ⚠️ Model ${modelName} terkena Rate Limit (429). Menunggu jeda backoff 4 detik...`);
      await sleep(4000);
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
        console.log(`[${tag}] Status retry backoff ${modelName}: HTTP ${response.status}`);
      } catch (backoffErr) {
        if (isNetworkOrDnsError(backoffErr)) throw backoffErr;
        lastError = backoffErr;
        continue;
      }
    }

    // If responseMimeType fails with 400 Bad Request, retry without responseMimeType
    if (!response.ok && response.status === 400 && responseMimeType) {
      console.log(`[${tag}] Retrying ${modelName} tanpa responseMimeType...`);
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
        console.log(`[${tag}] Status retry tanpa responseMimeType: HTTP ${response.status}`);
      } catch (fallbackErr) {
        if (isNetworkOrDnsError(fallbackErr)) throw fallbackErr;
        lastError = fallbackErr;
        continue;
      }
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || `HTTP ${response.status}`;
      logGeminiResponse({ tag, modelName, status: response.status, ok: false, errBody });
      lastError = new Error(`Model ${modelName} status ${response.status}: ${errMsg}`);
      continue;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    logGeminiResponse({ tag, modelName, status: response.status, ok: true, rawText });

    if (!rawText) {
      console.warn(`[${tag}] Model ${modelName} mengembalikan parts kosong`);
      lastError = new Error(`Model ${modelName} parts kosong`);
      continue;
    }

    console.log(`[${tag}] SUCCESS dengan model ${modelName} (v1beta)!`);
    return {
      text: rawText,
      model: modelName,
      version: 'v1beta',
      rawResponse: data,
    };
  }

  throw lastError || new Error('Seluruh model Gemini gagal dihubungi.');
};