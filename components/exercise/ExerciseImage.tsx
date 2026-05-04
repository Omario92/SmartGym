/**
 * ExerciseImage — Reusable image component with skeleton loader,
 * fade-in animation, neon glow when selected, and muscle-group
 * gradient fallback on error.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors, Radius } from '@/lib/theme';

interface ExerciseImageProps {
  uri: string;
  width: number;
  height: number;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export const ExerciseImage: React.FC<ExerciseImageProps> = ({
  uri,
  width,
  height,
  selected = false,
  style,
  borderRadius = Radius.lg,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Shimmer loop for skeleton
  useEffect(() => {
    if (loaded || error) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [loaded, error, shimmerAnim]);

  const handleLoad = () => {
    setLoaded(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius },
        selected && styles.selected,
        style,
      ]}
    >
      {/* Skeleton */}
      {!loaded && !error && (
        <Animated.View
          style={[
            styles.skeleton,
            { width, height, borderRadius, opacity: shimmerOpacity },
          ]}
        />
      )}

      {/* Error / Fallback */}
      {error && (
        <View style={[styles.fallback, { width, height, borderRadius }]}>
          <View style={styles.fallbackIcon}>
            <Animated.Text style={styles.fallbackEmoji}>🏋️</Animated.Text>
          </View>
        </View>
      )}

      {/* Image */}
      {!error && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image
            source={{ uri }}
            style={{ width, height, borderRadius }}
            resizeMode="cover"
            onLoad={handleLoad}
            onError={() => {
              setError(true);
              setLoaded(true);
            }}
          />
        </Animated.View>
      )}

      {/* Neon glow border when selected */}
      {selected && (
        <View
          style={[
            styles.glowBorder,
            { width, height, borderRadius },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: Colors.bgCard2,
  },
  selected: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  skeleton: {
    position: 'absolute',
    backgroundColor: Colors.bgCard3,
  },
  fallback: {
    backgroundColor: Colors.bgCard3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackEmoji: {
    fontSize: 32,
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
});
