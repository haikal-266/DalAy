import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { fetchAyah, fetchRandomAyah, getLastOrInitialAyah } from '../services/quranApi';

const STORAGE_KEY_FAVORITES = '@quranku_favorites';
const STORAGE_KEY_HISTORY = '@quranku_ayat_history';

const QuranContext = createContext(null);

export const QuranProvider = ({ children }) => {
  const [currentAyah, setCurrentAyah] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const soundRef = useRef(null);
  const webAudioRef = useRef(null);

  // Initialize on mount
  useEffect(() => {
    loadInitialData();

    return () => {
      // Cleanup audio on unmount
      if (webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current = null;
      }
      if (soundRef.current) {
        try {
          if (typeof soundRef.current.pause === 'function') {
            soundRef.current.pause();
          }
          if (typeof soundRef.current.remove === 'function') {
            soundRef.current.remove();
          }
        } catch (e) {
          // ignore
        }
        soundRef.current = null;
      }
    };
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load favorites and history
      const [rawFavs, rawHist] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_FAVORITES),
        AsyncStorage.getItem(STORAGE_KEY_HISTORY),
      ]);

      if (rawFavs) setFavorites(JSON.parse(rawFavs));
      if (rawHist) setHistory(JSON.parse(rawHist));

      // Load initial ayah (last viewed or sample)
      const initial = await getLastOrInitialAyah();
      setCurrentAyah(initial);
    } catch (e) {
      console.log('Error loading initial quran data:', e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch a new random ayah and update state & history
   */
  const getNewRandomAyah = async () => {
    setLoading(true);
    await stopAudio();
    try {
      const ayah = await fetchRandomAyah();
      setCurrentAyah(ayah);
      await addToHistory(ayah);
      return ayah;
    } catch (e) {
      console.log('Error getting random ayah:', e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Select a specific surah & verse number
   */
  const selectSpecificAyah = async (surahNumber, ayahNumber) => {
    setLoading(true);
    await stopAudio();
    try {
      const ayah = await fetchAyah(surahNumber, ayahNumber);
      setCurrentAyah(ayah);
      await addToHistory(ayah);
      return ayah;
    } catch (e) {
      console.log('Error fetching specific ayah:', e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Favorite Management
   */
  const isFavorite = (ayah) => {
    if (!ayah) return false;
    return favorites.some(
      (f) => f.surah === ayah.surah && f.ayah === ayah.ayah
    );
  };

  const toggleFavorite = async (ayah) => {
    if (!ayah) return;

    try {
      let updated;
      if (isFavorite(ayah)) {
        updated = favorites.filter(
          (f) => !(f.surah === ayah.surah && f.ayah === ayah.ayah)
        );
      } else {
        const itemToSave = {
          ...ayah,
          favoritedAt: new Date().toISOString(),
        };
        updated = [itemToSave, ...favorites];
      }

      setFavorites(updated);
      await AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving favorite:', e);
    }
  };

  /**
   * History Management
   */
  const addToHistory = async (ayah) => {
    if (!ayah) return;
    try {
      // Remove duplicate if exists and put at beginning
      const filtered = history.filter(
        (h) => !(h.surah === ayah.surah && h.ayah === ayah.ayah)
      );

      const updated = [
        {
          ...ayah,
          readAt: new Date().toISOString(),
        },
        ...filtered.slice(0, 49), // Keep maximum 50 history entries
      ];

      setHistory(updated);
      await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY_HISTORY);
  };

  // Audio Playback
  const togglePlayAudio = async () => {
    if (isPlayingAudio) {
      await stopAudio();
    } else {
      await playAudio();
    }
  };

  const playAudio = async () => {
    if (!currentAyah || !currentAyah.audio) return;

    try {
      setAudioLoading(true);
      await stopAudio();

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const audio = new window.Audio(currentAyah.audio);
        webAudioRef.current = audio;

        audio.onplaying = () => {
          setIsPlayingAudio(true);
          setAudioLoading(false);
        };

        audio.onended = () => {
          setIsPlayingAudio(false);
          webAudioRef.current = null;
        };

        audio.onerror = (e) => {
          console.log('Web Audio error:', e);
          setIsPlayingAudio(false);
          setAudioLoading(false);
        };

        await audio.play();
        setIsPlayingAudio(true);
        setAudioLoading(false);
        return;
      }

      // Native Mobile via expo-audio (SDK 57)
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
        });
      } catch (modeErr) {
        // ignore mode configuration errors
      }

      const player = createAudioPlayer(currentAyah.audio);
      soundRef.current = player;

      if (typeof player.addListener === 'function') {
        player.addListener('playbackStatusUpdate', (status) => {
          if (status && status.didJustFinish) {
            setIsPlayingAudio(false);
            try {
              if (typeof player.remove === 'function') {
                player.remove();
              }
            } catch (e) {}
            soundRef.current = null;
          }
        });
      }

      if (typeof player.play === 'function') {
        player.play();
      }
      setIsPlayingAudio(true);
      setAudioLoading(false);
    } catch (e) {
      console.log('Audio playback error:', e);
      setAudioLoading(false);
      setIsPlayingAudio(false);
    }
  };

  const stopAudio = async () => {
    try {
      if (webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.currentTime = 0;
        webAudioRef.current = null;
      }
      if (soundRef.current) {
        if (typeof soundRef.current.pause === 'function') {
          soundRef.current.pause();
        }
        if (typeof soundRef.current.remove === 'function') {
          soundRef.current.remove();
        }
        soundRef.current = null;
      }
    } catch (e) {
      // ignore
    } finally {
      setIsPlayingAudio(false);
      setAudioLoading(false);
    }
  };

  const contextValue = useMemo(
    () => ({
      currentAyah,
      favorites,
      history,
      loading,
      isPlayingAudio,
      audioLoading,
      getNewRandomAyah,
      selectSpecificAyah,
      toggleFavorite,
      isFavorite,
      clearHistory,
      togglePlayAudio,
    }),
    [
      currentAyah,
      favorites,
      history,
      loading,
      isPlayingAudio,
      audioLoading,
    ]
  );

  return (
    <QuranContext.Provider value={contextValue}>
      {children}
    </QuranContext.Provider>
  );
};

export const useQuran = () => {
  const context = useContext(QuranContext);
  if (!context) {
    throw new Error('useQuran must be used within a QuranProvider');
  }
  return context;
};

export default QuranContext;
