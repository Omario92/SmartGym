/**
 * PreviewContextMenu — a shared iOS-style long-press menu: a dimmed backdrop, a
 * lifted `preview` node, and a list of actions. Used by both the Routines and
 * Explore cards so the long-press UI is identical across the app.
 *
 * Animates via worklet shared values (not the layout `entering=` API, which
 * doesn't fire in this runtime).
 */
import React from 'react';
import { Modal, View, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, FontSize, FontFamily, Shadow } from '@/lib/theme';
import { Text } from './Text';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface ContextAction {
  icon: IconName;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

interface PreviewContextMenuProps {
  visible: boolean;
  haptics?: boolean;
  /** Lifted preview shown above the action list. */
  preview: React.ReactNode;
  actions: ContextAction[];
  onClose: () => void;
}

export const PreviewContextMenu: React.FC<PreviewContextMenuProps> = ({
  visible,
  haptics,
  preview,
  actions,
  onClose,
}) => {
  const scale = useSharedValue(0.94);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 16, stiffness: 240, mass: 0.6 });
      translateY.value = withSpring(0, { damping: 16, stiffness: 240, mass: 0.6 });
      opacity.value = withTiming(1, { duration: 130 });
    } else {
      scale.value = 0.94;
      translateY.value = 14;
      opacity.value = 0;
    }
  }, [visible]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const run = (fn: () => void) => {
    if (haptics) Haptics.selectionAsync().catch(() => {});
    onClose();
    fn();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {visible ? (
          <Animated.View style={[styles.content, contentStyle]}>
            {preview}
            <View style={styles.list}>
              {actions.map((a, i) => (
                <React.Fragment key={a.label}>
                  {i > 0 ? <View style={styles.divider} /> : null}
                  <TouchableOpacity
                    style={styles.row}
                    activeOpacity={0.7}
                    onPress={() => run(a.onPress)}
                  >
                    <Ionicons
                      name={a.icon}
                      size={20}
                      color={a.destructive ? Colors.error : Colors.textPrimary}
                    />
                    <Text style={[styles.label, a.destructive && { color: Colors.error }]}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.scrimStrong,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  content: { gap: Spacing.md },
  list: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  label: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bodyMedium,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.lg + 20 + Spacing.md,
  },
});
