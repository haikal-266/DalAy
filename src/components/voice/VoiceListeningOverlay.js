import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  Pressable,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../stores/languageStore';
import { VoiceService } from '../../services/voiceService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NORMAL_BAR_COLORS = [
  '#2DD4BF', // Teal-400
  '#38BDF8', // Sky-400
  '#0D9488', // Teal-600
  '#10B981', // Emerald-500
  '#0D9488', // Teal-600
  '#38BDF8', // Sky-400
  '#2DD4BF', // Teal-400
];

const CANCEL_BAR_COLORS = [
  '#F87171', // Red-400
  '#EF4444', // Red-500
  '#DC2626', // Red-600
  '#B91C1C', // Red-700
  '#DC2626', // Red-600
  '#EF4444', // Red-500
  '#F87171', // Red-400
];

/**
 * 100% GPU-Accelerated Native Audio Waveform Visualizer
 * Zero React re-renders, zero JS thread overhead.
 */
const NativeAudioWaveform = ({ active, isCanceling = false }) => {
  const barScales = useRef(NORMAL_BAR_COLORS.map(() => new Animated.Value(0.35))).current;

  const currentColors = isCanceling ? CANCEL_BAR_COLORS : NORMAL_BAR_COLORS;

  useEffect(() => {
    if (active) {
      // Start organic ambient wave oscillation
      const loops = barScales.map((scaleAnim, idx) => {
        const centerFactor = 1 - Math.abs(idx - 3) / 3;
        const maxScale = 0.6 + centerFactor * 0.7;
        const duration = 400 + idx * 70;

        return Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: maxScale,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.25 + centerFactor * 0.15,
              duration,
              useNativeDriver: true,
            }),
          ])
        );
      });

      loops.forEach((l) => l.start());

      // Native audio volume reactivity
      const nativeModule = VoiceService.getNativeModule();
      let subVolume = null;

      if (nativeModule && typeof nativeModule.addListener === 'function') {
        let lastTick = 0;
        subVolume = nativeModule.addListener('volumechange', (event) => {
          const now = Date.now();
          if (now - lastTick < 80) return;
          lastTick = now;

          if (typeof event?.value === 'number') {
            const normalized = Math.max(0, Math.min(1, (event.value + 2) / 12));
            barScales.forEach((scaleAnim, idx) => {
              const centerFactor = 1 - Math.abs(idx - 3) / 3;
              const boosted = Math.max(0.3, Math.min(1.45, 0.35 + (0.5 + centerFactor * 0.7) * normalized));
              Animated.spring(scaleAnim, {
                toValue: boosted,
                friction: 5,
                tension: 60,
                useNativeDriver: true,
              }).start();
            });
          }
        });
      }

      return () => {
        loops.forEach((l) => l.stop());
        subVolume?.remove?.();
      };
    } else {
      barScales.forEach((scaleAnim) => scaleAnim.setValue(0.35));
    }
  }, [active, barScales]);

  return (
    <View style={styles.waveformContainer}>
      {barScales.map((scaleY, idx) => (
        <Animated.View
          key={`bar-color-${idx}-${currentColors[idx]}`}
          style={[
            styles.equalizerBar,
            {
              backgroundColor: currentColors[idx],
              transform: [{ scaleY }],
            },
          ]}
        />
      ))}
    </View>
  );
};

/**
 * Ultra-Sleek, Modern Voice Recording Overlay
 * Displays a clean frosted glassmorphism card with live audio waveform,
 * real-time transcript preview, smart badges, and interactive cancellation state.
 */
export const VoiceListeningOverlay = React.memo(({
  visible = false,
  transcript = '',
  interimTranscript = '',
  detectedType = null,
  detectedWallet = null,
  detectedCategory = null,
  isExpoGo = false,
  isCanceling = false,
  onClose = null,
}) => {
  const { isIndonesian } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Handle hardware back press on Android when overlay is visible
  useEffect(() => {
    if (!visible) return;
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (typeof onClose === 'function') {
        onClose();
        return true;
      }
      return false;
    });
    return () => backSub.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.94,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim, pulseAnim]);

  if (!visible) return null;

  const currentText = interimTranscript || transcript;

  let statusPillText = isIndonesian ? 'Mendengarkan...' : 'Listening...';
  let tipActionText = isIndonesian ? 'Lepas untuk simpan' : 'Release to save';
  let hintSwipeText = isIndonesian
    ? '↑ Geser tombol ke atas untuk batalkan'
    : '↑ Swipe mic button up to cancel';
  let placeholderMessage = isIndonesian
    ? 'Contoh: "Pengeluaran mie ayam 20k BCA" atau "Pemasukan gaji 5jt BCA"'
    : 'Example: "Expense lunch 20k BCA" or "Income salary 5m BCA"';

  if (isCanceling) {
    statusPillText = isIndonesian ? 'Membatalkan...' : 'Cancelling...';
    tipActionText = isIndonesian ? 'Lepas untuk hapus' : 'Release to discard';
    hintSwipeText = isIndonesian
      ? '✕ Lepas tombol untuk batalkan tanpa simpan'
      : '✕ Release button to cancel without saving';
    placeholderMessage = isIndonesian ? 'Perekaman dibatalkan' : 'Recording cancelled';
  }

  let typeBadgeLabel = '';
  if (detectedType === 'income') {
    typeBadgeLabel = isIndonesian ? 'Pemasukan' : 'Income';
  } else if (detectedType === 'expense') {
    typeBadgeLabel = isIndonesian ? 'Pengeluaran' : 'Expense';
  }

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.overlayContainer,
        { opacity: fadeAnim },
      ]}
      pointerEvents="box-none"
    >
      {/* Full-Screen Backdrop Touch to Dismiss/Cancel */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityLabel="Tutup dialog suara"
      />

      <Animated.View
        style={[
          styles.voiceCard,
          isCanceling && styles.voiceCardCancel,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Header Status */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.recordingPill,
              isCanceling && styles.recordingPillCancel,
            ]}
          >
            {isCanceling ? (
              <Ionicons name="trash-outline" size={13} color="#EF4444" />
            ) : (
              <Animated.View
                style={[
                  styles.recDot,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
            )}
            <Text
              style={[
                styles.recText,
                isCanceling && styles.recTextCancel,
              ]}
            >
              {statusPillText}
            </Text>
          </View>

          <Text
            style={[
              styles.tipText,
              isCanceling && styles.tipTextCancel,
            ]}
          >
            {tipActionText}
          </Text>
        </View>

        {/* Dynamic Equalizer Waveform */}
        <NativeAudioWaveform active={visible} isCanceling={isCanceling} />

        {/* Live Transcript Container */}
        <View
          style={[
            styles.transcriptBox,
            isCanceling && styles.transcriptBoxCancel,
          ]}
        >
          {currentText ? (
            <View style={styles.transcriptContentWrapper}>
              <Text
                style={[
                  styles.transcriptText,
                  isCanceling && styles.transcriptTextCancel,
                ]}
              >
                {transcript}
                {Boolean(interimTranscript) && (
                  <Text
                    style={[
                      styles.interimText,
                      isCanceling && styles.interimTextCancel,
                    ]}
                  >
                    {transcript ? ' ' : ''}
                    {interimTranscript}
                  </Text>
                )}
              </Text>
              {isCanceling && (
                <View style={styles.discardWarningBadge}>
                  <Ionicons name="alert-circle" size={13} color="#F87171" />
                  <Text style={styles.discardWarningText}>
                    {isIndonesian
                      ? 'Input suara ini akan dihapus'
                      : 'This input will be discarded'}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text
              style={[
                styles.placeholderText,
                isCanceling && styles.placeholderTextCancel,
              ]}
            >
              {placeholderMessage}
            </Text>
          )}
        </View>

        {/* Auto Detected Metadata Badges (Type, Wallet, Category) */}
        {!isCanceling && (detectedType || detectedWallet || detectedCategory) && (
          <View style={styles.badgesRow}>
            {detectedType && (
              <View
                style={[
                  styles.typeBadge,
                  detectedType === 'income' ? styles.incomeBadge : styles.expenseBadge,
                ]}
              >
                <Ionicons
                  name={
                    detectedType === 'income'
                      ? 'arrow-down-circle-outline'
                      : 'arrow-up-circle-outline'
                  }
                  size={13}
                  color={detectedType === 'income' ? '#34D399' : '#FB7185'}
                />
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: detectedType === 'income' ? '#A7F3D0' : '#FECDD3' },
                  ]}
                >
                  {typeBadgeLabel}
                </Text>
              </View>
            )}
            {detectedWallet && (
              <View style={styles.walletBadge}>
                <Ionicons name="wallet-outline" size={13} color="#38BDF8" />
                <Text style={styles.walletBadgeText}>{detectedWallet}</Text>
              </View>
            )}
            {detectedCategory && (
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag-outline" size={13} color="#2DD4BF" />
                <Text style={styles.categoryBadgeText}>{detectedCategory}</Text>
              </View>
            )}
          </View>
        )}

        {/* Dynamic Cancel & Swipe Helper Text */}
        <View style={styles.cancelHintContainer}>
          <Text
            style={[
              styles.cancelHintText,
              isCanceling && styles.cancelHintTextActive,
            ]}
          >
            {hintSwipeText}
          </Text>
        </View>

        {/* Discreet Expo Go Hint */}
        {isExpoGo && (
          <View style={styles.expoGoHintRow}>
            <Ionicons name="information-circle-outline" size={13} color="#64748B" />
            <Text style={styles.expoGoHintText}>
              {isIndonesian
                ? 'Mode demo Expo Go (Dev build untuk mic asli)'
                : 'Expo Go demo mode (Dev build for real mic)'}
            </Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlayContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 9998,
    elevation: 20,
  },
  voiceCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 24,
  },
  voiceCardCancel: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    shadowColor: '#DC2626',
    shadowOpacity: 0.35,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  recordingPillCancel: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F43F5E',
  },
  recText: {
    color: '#FDA4AF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  recTextCancel: {
    color: '#FCA5A5',
  },
  tipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  tipTextCancel: {
    color: '#F87171',
    fontWeight: '700',
  },
  cancelHintContainer: {
    marginTop: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  cancelHintText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelHintTextActive: {
    color: '#FCA5A5',
    fontWeight: '700',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 52,
    width: '100%',
    marginVertical: 6,
  },
  equalizerBar: {
    width: 6,
    height: 38,
    borderRadius: 3,
  },
  transcriptBox: {
    width: '100%',
    minHeight: 64,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  transcriptBoxCancel: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  transcriptContentWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  transcriptText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 23,
  },
  transcriptTextCancel: {
    color: '#F87171',
    textDecorationLine: 'line-through',
    opacity: 0.85,
  },
  interimText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  interimTextCancel: {
    color: '#FCA5A5',
    textDecorationLine: 'line-through',
  },
  discardWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discardWarningText: {
    color: '#FECDD3',
    fontSize: 11,
    fontWeight: '700',
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 19,
  },
  placeholderTextCancel: {
    color: '#F87171',
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  incomeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  expenseBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.16)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  walletBadgeText: {
    color: '#BAE6FD',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 212, 191, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
  },
  categoryBadgeText: {
    color: '#99F6E4',
    fontSize: 12,
    fontWeight: '700',
  },
  expoGoHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
  },
  expoGoHintText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default VoiceListeningOverlay;
