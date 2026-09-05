import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, Pressable, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../stores/themeStore';

/**
 * Push-To-Talk Floating Action Button (FAB)
 * Sleek, modern, and perfectly aligned with DalAy's design aesthetic.
 * Exclusively displayed on the Finance screen.
 */
export const PushToTalkButton = ({
  onPressIn,
  onPressOut,
  isListening = false,
  style,
}) => {
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 5,
      tension: 70,
    }).start();
    if (typeof onPressIn === 'function') {
      onPressIn();
    }
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 50,
    }).start();
    if (typeof onPressOut === 'function') {
      onPressOut();
    }
  };

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* Soft Ambient Diffuse Ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            backgroundColor: isActive ? '#F43F5E' : primaryColor,
            opacity: isActive ? 0.35 : 0.18,
            transform: [{ scale: isActive ? 1.35 : pulseAnim }],
          },
        ]}
      />

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayPressIn={0}
        accessibilityRole="button"
        accessibilityLabel="Push to Talk Voice Input"
        style={styles.pressableArea}
      >
        <Animated.View
          style={[
            styles.fabButton,
            {
              backgroundColor: isActive ? '#E11D48' : primaryColor,
              transform: [{ scale: scaleAnim }],
            },
            isActive ? styles.fabActiveShadow : styles.fabNormalShadow,
          ]}
        >
          <Ionicons
            name={isActive ? 'mic' : 'mic-outline'}
            size={24}
            color="#FFFFFF"
          />
        </Animated.View>
      </Pressable>
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
  glowRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
});

export default PushToTalkButton;
