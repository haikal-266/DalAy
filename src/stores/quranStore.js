import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { fetchAyah, fetchRandomAyah, getLastOrInitialAyah } from '../services/quranApi';
import { useLanguage } from './languageStore';

const STORAGE_KEY_FAVORITES = '@dalay_favorites';
const STORAGE_KEY_HISTORY = '@dalay_ayat_history';

const QuranContext = createContext(null);

export const QuranProvider = ({ children }) => {
  const { currentLanguage } = useLanguage();
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

  // Update current ayah translation when language changes
  useEffect(() => {
    if (currentAyah?.surah && currentAyah?.ayah) {
      fetchAyah(currentAyah.surah, currentAyah.ayah, currentLanguage).then((updated) => {
        if (updated) setCurrentAyah(updated);
      });
    }
  }, [currentLanguage]);

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

      // Load initial ayah in current language
      const initial = await getLastOrInitialAyah(currentLanguage);
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
      const ayah = await fetchRandomAyah(currentLanguage);
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
      const ayah = await fetchAyah(surahNumber, ayahNumber, currentLanguage);
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
      const filtered = history.filter(
        (h) => !(h.surah === ayah.surah && h.ayah === ayah.ayah)
      );
      const updated = [
        { ...ayah, readAt: new Date().toISOString() },
        ...filtered.slice(0, 49), // Keep max 50 recent items
      ];
      setHistory(updated);
      await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    } catch (e) {}
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY_HISTORY);
  };

  /**
   * Replace favorites & history (used by Cloud Sync)
   */
  const replaceFavoritesAndHistory = async (newFavs, newHist) => {
    if (Array.isArray(newFavs)) {
      setFavorites(newFavs);
      await AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(newFavs));
    }
    if (Array.isArray(newHist)) {
      setHistory(newHist);
      await AsyncStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(newHist));
    }
  };

  /**
   * Audio Playback Controls
   */
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

      if (Platform.OS === 'web') {
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
        audio.onerror = () => {
          setIsPlayingAudio(false);
          setAudioLoading(false);
        };

        await audio.play();
      } else {
        // Native (Android/iOS)
        const player = createAudioPlayer({
          uri: currentAyah.audio,
        });

        soundRef.current = player;

        player.addListener('playbackStatusUpdate', (status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlayingAudio(false);
              player.remove();
              soundRef.current = null;
            }
          }
        });

        player.play();
        setIsPlayingAudio(true);
        setAudioLoading(false);
      }
    } catch (e) {
      console.log('Audio playback error:', e);
      setIsPlayingAudio(false);
      setAudioLoading(false);
    }
  };

  const stopAudio = async () => {
    try {
      if (Platform.OS === 'web' && webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.currentTime = 0;
        webAudioRef.current = null;
      } else if (soundRef.current) {
        soundRef.current.pause();
        if (typeof soundRef.current.remove === 'function') {
          soundRef.current.remove();
        }
        soundRef.current = null;
      }
    } catch (e) {
    } finally {
      setIsPlayingAudio(false);
      setAudioLoading(false);
    }
  };

  const value = useMemo(
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
      replaceFavoritesAndHistory,
      togglePlayAudio,
    }),
    [currentAyah, favorites, history, loading, isPlayingAudio, audioLoading]
  );

  return <QuranContext.Provider value={value}>{children}</QuranContext.Provider>;
};

export const useQuran = () => {
  const context = useContext(QuranContext);
  if (!context) {
    throw new Error('useQuran must be used within a QuranProvider');
  }
  return context;
};

export default QuranContext;
