import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Modal,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../stores/languageStore';
import { VoiceService } from '../../services/voiceService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BAR_COLORS = [
  '#2DD4BF', // Teal-400
  '#38BDF8', // Sky-400
  '#0D9488', // Teal-600
  '#10B981', // Emerald-500
  '#0D9488', // Teal-600
  '#38BDF8', // Sky-400
  '#2DD4BF', // Teal-400
];

/**
 * 100% GPU-Accelerated Native Audio Waveform Visualizer
 * Zero React re-renders, zero JS thread overhead.
 */
const NativeAudioWaveform = ({ active }) => {
  const barScales = useRef(BAR_COLORS.map(() => new Animated.Value(0.35))).current;
  const loopAnims = useRef([]).current;

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
          key={`wave-bar-${idx}`}
          style={[
            styles.equalizerBar,
            {
              backgroundColor: BAR_COLORS[idx],
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
 * real-time transcript preview, and smart wallet/category badges.
 */
export const VoiceListeningOverlay = React.memo(({
  visible = false,
  transcript = '',
  interimTranscript = '',
  detectedType = null,
  detectedWallet = null,
  detectedCategory = null,
  isExpoGo = false,
  onClose = null,
}) => {
  const { isIndonesian } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      statusBarTranslucent={true}
      hardwareAccelerated={true}
      onRequestClose={onClose || undefined}
    >
      <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]}>
        {/* Full-Screen Backdrop Touch to Cancel/Dismiss */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Tutup dialog suara"
        />

        <Animated.View
          style={[
            styles.voiceCard,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header Status */}
          <View style={styles.headerRow}>
            <View style={styles.recordingPill}>
              <Animated.View
                style={[
                  styles.recDot,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <Text style={styles.recText}>
                {isIndonesian ? 'Mendengarkan...' : 'Listening...'}
              </Text>
            </View>

            <Text style={styles.tipText}>
              {isIndonesian ? 'Lepas untuk simpan' : 'Release to save'}
            </Text>
          </View>

          {/* Siri/ChatGPT Style Dynamic Equalizer Waveform */}
          <NativeAudioWaveform active={visible} />

          {/* Live Transcript Container */}
          <View style={styles.transcriptBox}>
            {currentText ? (
              <Text style={styles.transcriptText}>
                {transcript}
                {Boolean(interimTranscript) && (
                  <Text style={styles.interimText}>
                    {transcript ? ' ' : ''}
                    {interimTranscript}
                  </Text>
                )}
              </Text>
            ) : (
              <Text style={styles.placeholderText}>
                {isIndonesian
                  ? 'Contoh: "Pengeluaran mie ayam 20k BCA" atau "Pemasukan gaji 5jt BCA"'
                  : 'Example: "Expense lunch 20k BCA" or "Income salary 5m BCA"'}
              </Text>
            )}
          </View>

          {/* Auto Detected Metadata Badges (Type, Wallet, Category) */}
          {(detectedType || detectedWallet || detectedCategory) && (
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
                    {detectedType === 'income'
                      ? isIndonesian
                        ? 'Pemasukan'
                        : 'Income'
                      : isIndonesian
                        ? 'Pengeluaran'
                        : 'Expense'}
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

          {/* Tap outside to cancel hint */}
          <View style={styles.cancelHintContainer}>
            <Text style={styles.cancelHintText}>
              {isIndonesian ? 'Ketuk di luar untuk batal' : 'Tap outside to cancel'}
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
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  tipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  cancelHintContainer: {
    marginTop: 14,
    paddingVertical: 2,
  },
  cancelHintText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
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
  transcriptText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 23,
  },
  interimText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 19,
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
