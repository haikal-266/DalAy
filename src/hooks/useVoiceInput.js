import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceService, isExpoGoEnv } from '../services/voiceService';
import { autoInsertCommasAfterPrices } from '../utils/parser';

/**
 * Custom React Hook for High-Performance Voice Speech Recognition in DalAy
 * - Throttled interim updates (80ms) to prevent JS thread / UI lag during live speech.
 * - Non-blocking instant release on Push-To-Talk stop.
 * - Comprehensive error state tracking (no-speech, permission-denied, network-error).
 * - Automatic comma formatting & multi-item parsing support.
 */
export const useVoiceInput = ({ defaultLang = 'id-ID', onResult = null } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(!isExpoGoEnv);

  const isListeningRef = useRef(false);
  const committedClausesRef = useRef([]);
  const latestSpokenRef = useRef('');
  const lastErrorRef = useRef(null);
  const lastInterimTimeRef = useRef(0);
  const interimTimeoutRef = useRef(null);

  const nativeModule = VoiceService.getNativeModule();
  const isExpoGo = isExpoGoEnv || !nativeModule;

  // Check native availability on mount
  useEffect(() => {
    let mounted = true;
    VoiceService.isAvailable().then((avail) => {
      if (mounted) setIsAvailable(avail);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync isListening ref
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (interimTimeoutRef.current) {
        clearTimeout(interimTimeoutRef.current);
      }
    };
  }, []);

  // Listen to native speech recognition events
  useEffect(() => {
    if (!nativeModule || typeof nativeModule.addListener !== 'function') {
      return;
    }

    const subStart = nativeModule.addListener('start', () => {
      setIsListening(true);
      setError(null);
      lastErrorRef.current = null;
    });

    const subEnd = nativeModule.addListener('end', () => {
      if (!isListeningRef.current) {
        setIsListening(false);
      }
    });

    const subSpeechEnd = nativeModule.addListener('speechend', () => {});

    // Speech recognition result handler with 80ms throttle
    const subResult = nativeModule.addListener('result', (event) => {
      if (!event?.results || event.results.length === 0) return;

      const rawSpeech = event.results[0]?.transcript?.trim() || '';
      if (!rawSpeech) return;

      const isFinal = Boolean(event.isFinal || event.results[0]?.isFinal);
      const prevCommitted = committedClausesRef.current.join(', ').trim();

      let combinedSpeech = rawSpeech;
      if (prevCommitted) {
        if (rawSpeech.toLowerCase().startsWith(prevCommitted.toLowerCase())) {
          combinedSpeech = rawSpeech;
        } else if (!prevCommitted.toLowerCase().endsWith(rawSpeech.toLowerCase())) {
          combinedSpeech = `${prevCommitted}, ${rawSpeech}`;
        }
      }

      const formattedLive = autoInsertCommasAfterPrices(combinedSpeech);
      latestSpokenRef.current = formattedLive;
      lastErrorRef.current = null;

      if (isFinal) {
        if (interimTimeoutRef.current) {
          clearTimeout(interimTimeoutRef.current);
          interimTimeoutRef.current = null;
        }

        if (!prevCommitted || !rawSpeech.toLowerCase().startsWith(prevCommitted.toLowerCase())) {
          if (!prevCommitted.toLowerCase().endsWith(rawSpeech.toLowerCase())) {
            committedClausesRef.current.push(rawSpeech);
          }
        } else {
          committedClausesRef.current = [rawSpeech];
        }

        const finalFormatted = autoInsertCommasAfterPrices(committedClausesRef.current.join(', '));
        latestSpokenRef.current = finalFormatted;
        setTranscript(finalFormatted);
        setInterimTranscript('');

        if (typeof onResult === 'function') {
          onResult(finalFormatted, true);
        }
      } else {
        // Throttle interim UI state updates to prevent frame drops
        const now = Date.now();
        if (now - lastInterimTimeRef.current >= 75) {
          lastInterimTimeRef.current = now;
          setInterimTranscript(formattedLive);

          if (typeof onResult === 'function') {
            onResult(formattedLive, false);
          }
        } else if (!interimTimeoutRef.current) {
          interimTimeoutRef.current = setTimeout(() => {
            interimTimeoutRef.current = null;
            lastInterimTimeRef.current = Date.now();
            setInterimTranscript(latestSpokenRef.current);
            if (typeof onResult === 'function') {
              onResult(latestSpokenRef.current, false);
            }
          }, 80);
        }
      }
    });

    const subError = nativeModule.addListener('error', (event) => {
      const errCode = event?.error || 'unknown';

      // Ignore normal lifecycle abort / client cancel events
      if (errCode === 'aborted' || errCode === 'client') {
        return;
      }

      console.warn('[useVoiceInput] recognition error:', errCode, event?.message);

      if (errCode === 'no-speech') {
        setError('no-speech');
        lastErrorRef.current = 'no-speech';
      } else if (errCode === 'not-allowed' || errCode === 'permission-denied') {
        setError('permission-denied');
        lastErrorRef.current = 'permission-denied';
        setIsListening(false);
        isListeningRef.current = false;
      } else if (errCode === 'network') {
        setError('network-error');
        lastErrorRef.current = 'network-error';
      } else {
        setError(event?.message || errCode);
        lastErrorRef.current = event?.message || errCode;
      }
    });

    return () => {
      subStart?.remove?.();
      subEnd?.remove?.();
      subSpeechEnd?.remove?.();
      subResult?.remove?.();
      subError?.remove?.();
    };
  }, [nativeModule, onResult]);

  const startListening = useCallback(
    async ({ lang = defaultLang, continuous = true } = {}) => {
      try {
        if (interimTimeoutRef.current) {
          clearTimeout(interimTimeoutRef.current);
          interimTimeoutRef.current = null;
        }

        setError(null);
        lastErrorRef.current = null;
        committedClausesRef.current = [];
        latestSpokenRef.current = '';
        setTranscript('');
        setInterimTranscript('');
        setIsListening(true);
        isListeningRef.current = true;

        if (isExpoGo) {
          setError('expo-go-unsupported');
          lastErrorRef.current = 'expo-go-unsupported';
          setIsListening(false);
          isListeningRef.current = false;
          return false;
        }

        await VoiceService.start({
          lang,
          interimResults: true,
          continuous: true,
        });
        return true;
      } catch (err) {
        setIsListening(false);
        isListeningRef.current = false;
        if (err.message === 'PERMISSION_DENIED') {
          setError('permission-denied');
          lastErrorRef.current = 'permission-denied';
        } else if (err.message === 'EXPO_GO_UNSUPPORTED') {
          setError('expo-go-unsupported');
          lastErrorRef.current = 'expo-go-unsupported';
        } else {
          setError(err.message || 'Gagal memulai perekaman suara');
          lastErrorRef.current = err.message || 'error';
        }
        return false;
      }
    },
    [defaultLang, isExpoGo]
  );

  const stopListening = useCallback(async () => {
    if (interimTimeoutRef.current) {
      clearTimeout(interimTimeoutRef.current);
      interimTimeoutRef.current = null;
    }

    isListeningRef.current = false;
    setIsListening(false);

    const latest = (latestSpokenRef.current || committedClausesRef.current.join(', ')).trim();
    const fullAccumulated = autoInsertCommasAfterPrices(latest);
    if (fullAccumulated) {
      setTranscript(fullAccumulated);
      setInterimTranscript('');
    }

    // Stop native recognition asynchronously without blocking UI response
    if (!isExpoGo) {
      VoiceService.stop().catch((err) => {
        console.warn('[useVoiceInput] stop error:', err);
      });
    }

    return {
      transcript: fullAccumulated,
      error: lastErrorRef.current,
    };
  }, [isExpoGo]);

  const resetTranscript = useCallback(() => {
    if (interimTimeoutRef.current) {
      clearTimeout(interimTimeoutRef.current);
      interimTimeoutRef.current = null;
    }
    committedClausesRef.current = [];
    latestSpokenRef.current = '';
    lastErrorRef.current = null;
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const fullTranscript = autoInsertCommasAfterPrices(
    (interimTranscript || transcript || latestSpokenRef.current || committedClausesRef.current.join(', ')).trim()
  );

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript,
    error,
    isAvailable,
    isExpoGo,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
};

export default useVoiceInput;
