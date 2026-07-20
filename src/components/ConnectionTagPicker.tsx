/**
 * ConnectionTagPicker — Phase 2 "Smart Search & Categorization"
 *
 * A compact bottom-sheet that lets users tag a connection:
 *   Potential Client · Investor · Partner · Friend · etc.
 *
 * Selections are persisted via useConnectionIntelligence / connectionsIntelligenceService.
 */

import { useCallback } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import {
  ALL_TAGS,
  type ConnectionTagId,
} from '@/src/services/connectionsIntelligenceService';
import { HapticTap } from '@/src/utils/haptics';
import { Easings } from '@/src/utils/motion';

interface ConnectionTagPickerProps {
  visible: boolean;
  momentId: string;
  currentTags: ConnectionTagId[];
  onToggle: (momentId: string, tagId: ConnectionTagId) => void;
  onClose: () => void;
}

export function ConnectionTagPicker({
  visible,
  momentId,
  currentTags,
  onToggle,
  onClose,
}: ConnectionTagPickerProps) {
  const enter = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      enter.value = 0;
      enter.value = withSpring(1, { damping: 22, stiffness: 240 });
    } else {
      enter.value = withTiming(0, { duration: 200, easing: Easings.accelerate });
    }
  }, [enter, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(enter.value, [0, 1], [400, 0]) }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: enter.value * 0.5,
  }));

  const handleToggle = useCallback((tagId: ConnectionTagId) => {
    HapticTap.medium();
    onToggle(momentId, tagId);
  }, [momentId, onToggle]);

  const activeSet = new Set(currentTags);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <AppText style={styles.title}>Tag this connection</AppText>
            <AppText style={styles.subtitle}>Choose one or more to categorise & search later</AppText>
          </View>

          <ScrollView
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {ALL_TAGS.map((tag) => {
              const active = activeSet.has(tag.id);
              return (
                <Pressable
                  key={tag.id}
                  onPress={() => handleToggle(tag.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={tag.label}
                  style={({ pressed }) => [
                    styles.chip,
                    active && { backgroundColor: tag.color + '22', borderColor: tag.color },
                    pressed && styles.chipPressed,
                  ]}
                >
                  <AppText style={styles.chipEmoji}>{tag.emoji}</AppText>
                  <AppText
                    style={[
                      styles.chipLabel,
                      active && { color: tag.color, fontWeight: '800' },
                    ]}
                  >
                    {tag.label}
                  </AppText>
                  {active && (
                    <View style={[styles.checkDot, { backgroundColor: tag.color }]}>
                      <AppIcon name="Check" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <AppText style={styles.doneBtnText}>Done</AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: '#000000',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 16,
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.14)',
    marginBottom: 2,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0A0C12',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.42)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  chipPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A0C12',
  },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0C12',
    borderRadius: 16,
    paddingVertical: 15,
  },
  doneBtnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
