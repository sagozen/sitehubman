import { useState } from 'react';
import { Animated, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NfcGlobalCardFace } from '@/src/components/NfcGlobalCardFace';
import { NfcGlobalCardBack } from '@/src/components/NfcGlobalCardBack';

type FlippableNfcCardProps = {
  // Front props
  fullName?: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  profileUrl?: string;
  backgroundImageUri?: string | null;
  
  // Back props
  cardId?: string;
  
  // Size
  width?: number;
  height?: number;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function FlippableNfcCard(props: FlippableNfcCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));

  function handleFlip() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toValue = isFlipped ? 0 : 1;
    setIsFlipped(!isFlipped);
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <Pressable onPress={handleFlip} style={[styles.container, props.style]} activeOpacity={0.95}>
      {/* Front */}
      <Animated.View
        style={[
          styles.cardSide,
          { transform: [{ rotateY: frontInterpolate }] },
          isFlipped && styles.hidden,
        ]}
        pointerEvents={isFlipped ? 'none' : 'auto'}
      >
        <NfcGlobalCardFace
          fullName={props.fullName}
          title={props.title}
          company={props.company}
          phone={props.phone}
          email={props.email}
          website={props.website}
          profileUrl={props.profileUrl}
          backgroundImageUri={props.backgroundImageUri}
          width={props.width}
          height={props.height}
          compact={props.compact}
        />
      </Animated.View>

      {/* Back */}
      <Animated.View
        style={[
          styles.cardSide,
          styles.backSide,
          { transform: [{ rotateY: backInterpolate }] },
          !isFlipped && styles.hidden,
        ]}
        pointerEvents={!isFlipped ? 'none' : 'auto'}
      >
        <NfcGlobalCardBack
          profileUrl={props.profileUrl}
          cardId={props.cardId}
          width={props.width}
          height={props.height}
          compact={props.compact}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  cardSide: {
    backfaceVisibility: 'hidden',
  },
  backSide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hidden: {
    opacity: 0,
  },
});
