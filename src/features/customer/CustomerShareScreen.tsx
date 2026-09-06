import React, { useState, useEffect, useMemo } from 'react';
import { Alert, Pressable, Share, StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import { appRoutes } from '@/src/constants/navigation';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { useAuth } from '@/src/hooks/useAuth';
import { useIsGuest } from '@/src/hooks/useIsGuest';
import { useBioPage } from '@/src/hooks/useBioPage';
import { HapticTap } from '@/src/utils/haptics';
import { loadCustomerCloudCard, loadGuestCloudCard } from '@/src/services/guestCardDraftService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferences } from '@/src/hooks/usePreferences';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';

const SPRING_STD = { damping: 18, stiffness: 260, mass: 0.9 };
const SPRING_SNAPPY = { damping: 16, stiffness: 340, mass: 0.7 };
const SPRING_BOUNCY = { damping: 12, stiffness: 280, mass: 1.0 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Interactive Pressable wrapper
function SpringPressable({ children, onPress, style, ...props }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.95, SPRING_SNAPPY);
      }}
      onPressOut={() => {
        scale.value = withSpring(1.0, SPRING_SNAPPY);
      }}
      onPress={(e: any) => {
        HapticTap.selection();
        if (onPress) runOnJS(onPress)(e);
      }}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

// Checkmark morph icon
function CopyLinkIcon({ isCopied, color }: { isCopied: boolean, color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isCopied) {
      scale.value = withSequence(withTiming(0, { duration: 150 }), withTiming(1, { duration: 150 }));
      opacity.value = withSequence(withTiming(0, { duration: 150 }), withTiming(1, { duration: 150 }));
    } else {
      scale.value = withTiming(1, { duration: 150 });
      opacity.value = withTiming(1, { duration: 150 });
    }
  }, [isCopied]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  return (
    <Animated.View style={style}>
      <AppIcon name={isCopied ? "Check" : "Copy"} size={18} color={color} />
    </Animated.View>
  );
}

export function CustomerShareScreen() {
  const { user } = useAuth();
  const isGuest = useIsGuest();
  const { bioPage } = useBioPage(user?.id ?? '');
  const [cloudCard, setCloudCard] = useState<any>(null);
  const { isDark } = usePreferences();
  const { bottom } = useSafeAreaInsets();
  
  const [tapCount, setTapCount] = useState(0);
  const tapScale = useSharedValue(1);

  const [activeTab, setActiveTab] = useState(0); // 0: NFC, 1: QR, 2: Link
  const [tabWidth, setTabWidth] = useState(0);
  const tabPosition = useSharedValue(0);

  const [isCopied, setIsCopied] = useState(false);

  const themeColors = isDark
    ? {
        gradient: ['#000000', '#07090E', '#0D1017'] as const,
        text: '#FFFFFF',
        textMuted: 'rgba(255, 255, 255, 0.45)',
        cardBg: 'rgba(25, 25, 30, 0.5)',
        border: 'rgba(255, 255, 255, 0.1)',
        iconBg: '#1A1A1A',
        tint: 'rgba(255, 255, 255, 0.15)'
      }
    : {
        gradient: ['#F4F7FB', '#FAFCFF', '#FFFFFF'] as const,
        text: '#000000',
        textMuted: 'rgba(0, 0, 0, 0.45)',
        cardBg: 'rgba(255, 255, 255, 0.7)',
        border: 'rgba(0, 0, 0, 0.05)',
        iconBg: '#F0F0F0',
        tint: 'rgba(0, 0, 0, 0.05)'
      };

  useEffect(() => {
    const loadCard = async () => {
      try {
        if (isGuest) {
          const cardId = await AsyncStorage.getItem('guest_card_id');
          if (cardId) {
            const loaded = await loadGuestCloudCard(cardId);
            setCloudCard(loaded);
          }
        } else if (user?.id) {
          const loaded = await loadCustomerCloudCard(user.id);
          setCloudCard(loaded);
        }
      } catch {}
    };
    void loadCard();
  }, [isGuest, user?.id]);

  const displayName =
    bioPage?.displayName?.trim() ||
    user?.displayName?.trim() ||
    (isGuest ? 'Alexander Wright' : 'Your Card');
  const title = bioPage?.tagline?.trim() || (isGuest ? 'Executive Pass · AVIO OS' : 'Digital identity');

  const profileUrl = useMemo(() => {
    if (bioPage?.slug) return buildSlugProfileUrl(bioPage.slug);
    if (isGuest) return buildSlugProfileUrl('alexander-wright');
    return 'https://sitehubman.app/alexander';
  }, [isGuest, bioPage?.slug]);

  async function handleShare() {
    HapticTap.medium();
    await Share.share({
      message: `${displayName} • Contact Pass\n${profileUrl}`,
      url: profileUrl,
    });
  }

  const handleCopy = () => {
    HapticTap.light();
    setIsCopied(true);
    void Share.share({ message: profileUrl, url: profileUrl });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const incrementTap = () => {
    setTapCount(c => c + 1);
    tapScale.value = withSequence(withSpring(1.2, SPRING_BOUNCY), withSpring(1.0, SPRING_SNAPPY));
  };
  
  const tapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tapScale.value }]
  }));

  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPosition.value }]
  }));

  // NFC Pulse Animations
  const ring1Scale = useSharedValue(0.8);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0.8);
  const ring2Opacity = useSharedValue(0);
  const ring3Scale = useSharedValue(0.8);
  const ring3Opacity = useSharedValue(0);

  useEffect(() => {
    const startPulse = (scale: any, opacity: any, delay: number) => {
      setTimeout(() => {
        scale.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1800 }),
            withTiming(0, { duration: 200 })
          ),
          -1
        );
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 200 }),
            withTiming(0, { duration: 1800 })
          ),
          -1
        );
      }, delay);
    };

    startPulse(ring1Scale, ring1Opacity, 0);
    startPulse(ring2Scale, ring2Opacity, 600);
    startPulse(ring3Scale, ring3Opacity, 1200);
  }, []);

  const getRingStyle = (scale: any, opacity: any) => useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
  }));

  // Beam now glow
  const beamGlowScale = useSharedValue(1);
  const beamGlowOpacity = useSharedValue(0.5);

  useEffect(() => {
    beamGlowScale.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );
    beamGlowOpacity.value = withRepeat(
      withSequence(withTiming(0.1, { duration: 1500 }), withTiming(0.5, { duration: 1500 })),
      -1,
      true
    );
  }, []);

  const beamGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: beamGlowScale.value }],
    opacity: beamGlowOpacity.value
  }));

  const ACTIONS = [
    {
      id: 'qr',
      title: 'Full Screen QR',
      sub: 'High-contrast scan code',
      icon: 'QrCode',
      onPress: () => router.push(appRoutes.qrGenerator)
    },
    {
      id: 'copy',
      title: 'Copy Bio URL',
      sub: profileUrl.replace('https://', ''),
      icon: 'Copy',
      onPress: handleCopy
    },
    {
      id: 'wallet',
      title: 'Apple Wallet Pass',
      sub: 'Add .pkpass to native iOS Wallet',
      icon: 'Wallet',
      onPress: () => {
        HapticTap.light();
        void Share.share({ message: `Add to Apple Wallet: ${profileUrl}`, url: profileUrl });
      }
    },
    {
      id: 'studio',
      title: 'Card Studio',
      sub: 'Customize finish & metal engraving',
      icon: 'Sparkles',
      onPress: () => router.push(appRoutes.guestDesign),
      last: true
    }
  ];

  return (
    <LinearGradient colors={themeColors.gradient} style={styles.safe}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Top Bar ── */}
          <View style={styles.topBar}>
            <SpringPressable
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: themeColors.iconBg }]}
              hitSlop={12}
              accessibilityLabel="Back"
            >
              <AppIcon name="ChevronLeft" size={20} color={themeColors.text} />
            </SpringPressable>
            <AppText style={[styles.topTitle, { color: themeColors.text }]} weight="bold">Share Pass</AppText>
            
            <SpringPressable onPress={incrementTap} style={[styles.backButton, { backgroundColor: themeColors.iconBg }]} hitSlop={12}>
              <Animated.View style={tapStyle}>
                <AppText weight="bold" style={{ color: themeColors.text, fontSize: 13 }}>{tapCount}</AppText>
              </Animated.View>
            </SpringPressable>
          </View>

          {/* ── Tabs ── */}
          <View 
            style={[styles.tabsContainer, { backgroundColor: themeColors.iconBg }]}
            onLayout={(e: LayoutChangeEvent) => {
              setTabWidth(e.nativeEvent.layout.width);
            }}
          >
            {tabWidth > 0 && (
              <Animated.View 
                style={[
                  styles.tabIndicator, 
                  { backgroundColor: themeColors.tint, width: (tabWidth - 8) / 3 }, 
                  tabIndicatorStyle
                ]} 
              />
            )}
            {['NFC', 'QR', 'Link'].map((tab, idx) => (
              <SpringPressable
                key={tab}
                style={styles.tabButton}
                onPress={() => {
                  setActiveTab(idx);
                  if (tabWidth > 0) {
                    tabPosition.value = withSpring(idx * ((tabWidth - 8) / 3), SPRING_SNAPPY);
                  }
                }}
              >
                <AppText style={{ color: activeTab === idx ? themeColors.text : themeColors.textMuted }} weight="bold">
                  {tab}
                </AppText>
              </SpringPressable>
            ))}
          </View>

          {/* ── Hero Flippable Card (Complete View with Full Width) ── */}
          <Animated.View style={styles.heroCardContainer} entering={FadeInDown.springify().delay(100)}>
            <View style={styles.radarContainer}>
              <Animated.View style={[styles.radarRing, getRingStyle(ring1Scale, ring1Opacity), { borderColor: themeColors.text }]} />
              <Animated.View style={[styles.radarRing, getRingStyle(ring2Scale, ring2Opacity), { borderColor: themeColors.text }]} />
              <Animated.View style={[styles.radarRing, getRingStyle(ring3Scale, ring3Opacity), { borderColor: themeColors.text }]} />
            </View>
            <FlippableNfcCard
              fullName={displayName}
              title={title}
              phone={bioPage?.whatsapp || user?.phone || undefined}
              email={bioPage?.email || user?.email || undefined}
              profileUrl={profileUrl || undefined}
              gradientIndex={cloudCard?.design?.gradientIndex ?? 0}
              backgroundImageUri={cloudCard?.design?.customImageUri || undefined}
              cardId={cloudCard?.id ?? 'AVIO-8890-7A3F'}
              style={styles.heroCard}
            />
            <AppText style={[styles.flipHint, { color: themeColors.textMuted }]}>Tap card to flip · Contactless NFC active</AppText>
          </Animated.View>

          {/* ── Compact QR Code Section ── */}
          <Animated.View entering={FadeInUp.springify().delay(200)}>
            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.compactQrCard, { borderColor: themeColors.border, backgroundColor: themeColors.cardBg }]}>
              <View style={styles.qrInnerBox}>
                <QRCode
                  value={profileUrl}
                  size={100}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                  quietZone={4}
                />
              </View>
              <View style={styles.qrTextInfo}>
                <View style={[styles.qrBadge, { backgroundColor: themeColors.tint }]}>
                  <AppText style={[styles.qrBadgeText, { color: themeColors.text }]} weight="bold">DYNAMIC QR</AppText>
                </View>
                <AppText style={[styles.qrHeaderTitle, { color: themeColors.text }]} weight="bold">Scan to Exchange</AppText>
                <AppText style={[styles.qrUrlText, { color: themeColors.textMuted }]} numberOfLines={1}>{profileUrl}</AppText>
              </View>
            </BlurView>
          </Animated.View>

          {/* ── Intentional Brand Action Rows (Borderless) ── */}
          <View style={styles.actionSection}>
            <AppText style={[styles.sectionHeader, { color: themeColors.textMuted }]}>IDENTITY CHANNELS</AppText>
            
            {ACTIONS.map((action, i) => (
              <Animated.View key={action.id} entering={FadeInDown.springify().delay(300 + i * 60)}>
                <SpringPressable
                  onPress={action.onPress}
                  style={[styles.actionRow, action.last && styles.actionRowLast, { borderBottomColor: themeColors.border }]}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: themeColors.iconBg }]}>
                    {action.id === 'copy' ? (
                      <CopyLinkIcon isCopied={isCopied} color={themeColors.text} />
                    ) : (
                      <AppIcon name={action.icon as any} size={18} color={themeColors.text} />
                    )}
                  </View>
                  <View style={styles.actionDetails}>
                    <AppText style={[styles.actionTitle, { color: themeColors.text }]} weight="bold">{action.title}</AppText>
                    <AppText style={[styles.actionSub, { color: themeColors.textMuted }]}>{action.sub}</AppText>
                  </View>
                  <AppIcon name="ChevronRight" size={16} color={themeColors.border} />
                </SpringPressable>
              </Animated.View>
            ))}
          </View>

        </IosScrollView>

        {/* ── Primary Action: "↗ Beam Now" (Floating Bottom) ── */}
        <Animated.View style={[styles.floatingActionContainer, { paddingBottom: Math.max(bottom, 20) }]} entering={FadeInUp.springify().delay(600)}>
          <View style={styles.beamBtnWrapper}>
            <Animated.View style={[styles.beamGlow, beamGlowStyle, { backgroundColor: themeColors.text }]} />
            <SpringPressable
              style={[styles.primaryShareBtn, { backgroundColor: themeColors.text }]}
              onPress={handleShare}
            >
              <AppIcon name="Radio" size={20} color={isDark ? '#000000' : '#FFFFFF'} />
              <AppText style={[styles.primaryShareBtnText, { color: isDark ? '#000000' : '#FFFFFF' }]} weight="extrabold">
                Beam Now
              </AppText>
            </SpringPressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 130, // Clearance for floating dock
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
    marginVertical: 10,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  // ── Hero Card ──
  heroCardContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
    position: 'relative',
  },
  radarContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  radarRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  heroCard: {
    width: '100%',
    maxWidth: 440,
  },
  flipHint: {
    fontSize: 12,
    marginTop: 8,
  },

  // ── Compact QR Card ──
  compactQrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    overflow: 'hidden'
  },
  qrInnerBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qrTextInfo: {
    flex: 1,
    gap: 6,
  },
  qrBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qrBadgeText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  qrHeaderTitle: {
    fontSize: 16,
  },
  qrUrlText: {
    fontSize: 13,
  },

  // ── Identity Channels (Borderless) ──
  actionSection: {
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDetails: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
  },
  actionSub: {
    fontSize: 13,
  },
  
  // Floating Action
  floatingActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    pointerEvents: 'box-none',
  },
  beamBtnWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
  },
  beamGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 30,
    opacity: 0.3,
  },
  primaryShareBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryShareBtnText: {
    fontSize: 16,
  },
});
