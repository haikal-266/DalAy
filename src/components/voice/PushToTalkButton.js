import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  PanResponder,
  Animated,
  View,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../stores/themeStore';

const CANCEL_THRESHOLD_PX = 35; // Upward travel in px to reach cancel state

/**
 * Clean, High-Performance Push-To-Talk Floating Action Button (FAB)
 * Features:
 * - Dynamic relative touch tracking: no downward displacement debt.
 * - Minimalist floating guide (trash icon + upward bobbing arrow).
 * - Guide disappears cleanly when in cancel zone, reappears if finger moves down.
 * - Single-button architecture with zero UI duplicate bugs and 60 FPS fluidity.
 */
export const PushToTalkButton = ({
  onPressIn,
  onPressOut,
  onCancel,
  onDragStateChange,
  isListening = false,
  style,
}) => {
  const { colors } = useTheme();

  const [isPressed, setIsPressed] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const isPressedRef = useRef(false);
  const isCancelingRef = useRef(false);
  const touchStartYRef = useRef(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const guideAnim = useRef(new Animated.Value(0)).current;
  const arrowBobAnim = useRef(new Animated.Value(0)).current;

  const isActive = isListening || isPressed;
  const primaryColor = colors.primary || '#0D9488';

  // Subtle idle breathing pulse when idle
  useEffect(() => {
    if (!isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isActive, pulseAnim]);

  // Guide visibility animation (visible when active and NOT in cancel mode)
  useEffect(() => {
    if (isActive && !isCanceling) {
      Animated.spring(guideAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(guideAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, isCanceling, guideAnim]);

  // Gentle upward bobbing animation on the chevron arrow
  useEffect(() => {
    if (isActive && !isCanceling) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(arrowBobAnim, {
            toValue: -4,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(arrowBobAnim, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      arrowBobAnim.setValue(0);
    }
  }, [isActive, isCanceling, arrowBobAnim]);

  // Safe haptic feedback trigger
  const triggerHaptic = (pattern = 20) => {
    try {
      Vibration.vibrate(pattern);
    } catch (_) {}
  };

  // High-performance PanResponder with dynamic relative tracking
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,

        onPanResponderGrant: (evt) => {
          const pageY = evt?.nativeEvent?.pageY || 0;
          touchStartYRef.current = pageY;
          isPressedRef.current = true;
          isCancelingRef.current = false;
          setIsPressed(true);
          setIsCanceling(false);

          Animated.spring(scaleAnim, {
            toValue: 1.1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }).start();

          triggerHaptic(15);
          if (typeof onPressIn === 'function') {
            onPressIn();
          }
        },

        onPanResponderMove: (evt) => {
          if (!isPressedRef.current) return;

          const currentY = evt?.nativeEvent?.pageY || 0;

          // If finger moved downward below initial touch, adapt start position
          // so sliding up always requires only CANCEL_THRESHOLD_PX from current low point
          if (currentY > touchStartYRef.current) {
            touchStartYRef.current = currentY;
          }

          const upwardDistance = touchStartYRef.current - currentY;
          const isNowCanceling = upwardDistance > CANCEL_THRESHOLD_PX;

          // Only fire updates when the state flips to avoid unnecessary re-render lag
          if (isNowCanceling !== isCancelingRef.current) {
            isCancelingRef.current = isNowCanceling;
            setIsCanceling(isNowCanceling);
            triggerHaptic(isNowCanceling ? 25 : 15);
            if (typeof onDragStateChange === 'function') {
              onDragStateChange({ isCanceling: isNowCanceling, dy: -upwardDistance });
            }
          }
        },

        onPanResponderRelease: (evt) => {
          const currentY = evt?.nativeEvent?.pageY || 0;
          const upwardDistance = touchStartYRef.current - currentY;
          const wasCanceling =
            isCancelingRef.current || upwardDistance > CANCEL_THRESHOLD_PX;

          isPressedRef.current = false;
          isCancelingRef.current = false;
          setIsPressed(false);
          setIsCanceling(false);

          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }).start();

          if (wasCanceling) {
            triggerHaptic(35);
            if (typeof onCancel === 'function') {
              onCancel();
            } else if (typeof onPressOut === 'function') {
              onPressOut({ cancelled: true });
            }
          } else if (typeof onPressOut === 'function') {
            onPressOut({ cancelled: false });
          }
        },

        onPanResponderTerminate: () => {
          isPressedRef.current = false;
          isCancelingRef.current = false;
          setIsPressed(false);
          setIsCanceling(false);

          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }).start();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onPressIn, onPressOut, onCancel, onDragStateChange]
  );

  let glowColor = primaryColor;
  let glowOpacity = 0.18;
  let glowScale = pulseAnim;
  let fabColor = primaryColor;
  let fabIcon = 'mic-outline';

  if (isActive) {
    glowOpacity = 0.35;
    glowScale = 1.35;
    fabColor = '#E11D48';
    fabIcon = 'mic';
  }

  if (isCanceling) {
    glowColor = '#EF4444';
    glowOpacity = 0.5;
    glowScale = 1.45;
    fabColor = '#DC2626';
    fabIcon = 'trash-outline';
  }

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* Floating Swipe-Up Guide (Trash icon at top, animated upward arrow below) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.guideContainer,
          {
            opacity: guideAnim,
            transform: [
              {
                translateY: guideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
              { scale: guideAnim },
            ],
          },
        ]}
      >
        <Ionicons name="trash-outline" size={18} color="#F43F5E" />
        <Animated.View style={{ transform: [{ translateY: arrowBobAnim }] }}>
          <Ionicons name="chevron-up" size={16} color="#38BDF8" />
        </Animated.View>
      </Animated.View>

      {/* Ambient Diffuse Ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowRing,
          {
            backgroundColor: glowColor,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Main Single FAB Touch & Slide Responder */}
      <View {...panResponder.panHandlers} style={styles.pressableArea}>
        <Animated.View
          style={[
            styles.fabButton,
            {
              backgroundColor: fabColor,
              transform: [{ scale: scaleAnim }],
            },
            isCanceling
              ? styles.fabCancelShadow
              : isActive
              ? styles.fabActiveShadow
              : styles.fabNormalShadow,
          ]}
        >
          <Ionicons name={fabIcon} size={25} color="#FFFFFF" />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 10000,
    elevation: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressableArea: {
    padding: 6,
  },
  guideContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10001,
  },
  glowRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  fabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  fabNormalShadow: {
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabActiveShadow: {
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  fabCancelShadow: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 14,
  },
});

export default PushToTalkButton;
