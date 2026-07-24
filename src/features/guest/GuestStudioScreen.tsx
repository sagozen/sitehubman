import { IosScrollView } from '@/src/components/IosScrollView';
import { Pressable, StyleSheet, View, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { PageHeader } from '@/src/components/PageHeader';
import { FlippableNfcCard } from '@/src/components/FlippableNfcCard';
import { AppButton } from '@/src/components/AppButton';
import { appRoutes } from '@/src/constants/navigation';
import { pageThemes } from '@/src/constants/pageThemes';
import { useAuth } from '@/src/hooks/useAuth';
import { useBioPage } from '@/src/hooks/useBioPage';
import { loadCustomerCloudCard } from '@/src/services/guestCardDraftService';
import { buildSlugProfileUrl } from '@/src/constants/publicProfile';
import { HapticTap } from '@/src/utils/haptics';
import { useEffect, useState } from 'react';

const THEME = pageThemes.studio;

const STUDIO_ACTIONS = [
  {
    label: 'Design Card',
    description: 'Customize colors, gradients & text details',
    route: appRoutes.guestDesign,
    image: require('@/assets/images/3d_create_card_v2.png'),
    btnLabel: 'Edit Design',
  },
  {
    label: 'Public Profile',
    description: 'Edit your digital bio page & social links',
    route: '/edit-bio',
    image: require('@/assets/images/3d_share_card_v2.png'),
    btnLabel: 'Edit Links',
  },
  {
    label: 'QR Identity',
    description: 'Generate high-contrast codes for scans',
    route: appRoutes.qrGenerator,
    image: require('@/assets/images/3d_scan_card_v2.png'),
    btnLabel: 'View QR',
  },
];

export function GuestStudioScreen() {
  const { user } = useAuth();
  const { bioPage } = useBioPage(user?.id ?? '');
  const [cloudCard, setCloudCard] = useState<Awaited<ReturnType<typeof loadCustomerCloudCard>>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadCustomerCloudCard(user.id)
        .then(setCloudCard)
        .catch(() => null)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const initial = (user?.displayName?.trim() || 'S')[0].toUpperCase();
  const cardName = bioPage?.displayName?.trim() || cloudCard?.profile.fullName?.trim() || user?.displayName?.trim() || '';
  const cardTitle = bioPage?.tagline?.trim() || cloudCard?.profile.role?.trim() || '';
  const cardPhone = bioPage?.whatsapp?.trim() || cloudCard?.profile.phone?.trim() || user?.phone?.trim() || '';
  const cardEmail = bioPage?.email?.trim() || cloudCard?.profile.email?.trim() || user?.email?.trim() || '';
  const profileUrl = bioPage?.slug ? buildSlugProfileUrl(bioPage.slug) : cloudCard?.publicProfileUrl || undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <IosScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader
          theme={THEME}
          title="Studio"
          subtitle="Shape the card and profile people remember."
          showBack
        />

        <View style={styles.cardWrap}>
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={THEME.accent} size="large" />
              <AppText style={styles.loadingText} weight="regular">Loading your card...</AppText>
            </View>
          ) : (
            <FlippableNfcCard
              fullName={cardName || undefined}
              title={cardTitle || undefined}
              phone={cardPhone || undefined}
              email={cardEmail || undefined}
              profileUrl={profileUrl}
              cardId={cloudCard?.cardId}
            />
          )}
        </View>

        <AppText style={styles.flipHint} weight="regular">Tap card to flip</AppText>

        {/* ─── Image-Driven Action Cards ─── */}
        <View style={styles.actionGrid}>
          {STUDIO_ACTIONS.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => {
                HapticTap.light();
                router.push(item.route as any);
              }}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.actionCardCopy}>
                <AppText style={styles.actionCardLabel} weight="regular">{item.label}</AppText>
                <AppText style={styles.actionCardDesc} weight="regular">{item.description}</AppText>
                <View style={styles.bwActionBtn}>
                  <AppText style={styles.bwActionBtnText} weight="regular">{item.btnLabel} →</AppText>
                </View>
              </View>
              <Image source={item.image} style={styles.actionCardImg} resizeMode="contain" />
            </Pressable>
          ))}
        </View>

        {/* ─── How it Works & What you Get Guide ─── */}
        <View style={styles.guideContainer}>
          <AppText style={styles.guideHeader} weight="regular">How it works</AppText>

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <AppText style={styles.stepBadgeText} weight="regular">1</AppText>
            </View>
            <View style={styles.stepInfo}>
              <AppText style={styles.stepTitle} weight="regular">Customize Bio Profile</AppText>
              <AppText style={styles.stepText} weight="regular">
                Design your digital card layout and update your WhatsApp, Email, or website links at any time.
              </AppText>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <AppText style={styles.stepBadgeText} weight="regular">2</AppText>
            </View>
            <View style={styles.stepInfo}>
              <AppText style={styles.stepTitle} weight="regular">Get Smart NFC Card</AppText>
              <AppText style={styles.stepText} weight="regular">
                Order a custom-printed card. Tap it on any smartphone to load your profile page in 1 second.
              </AppText>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <AppText style={styles.stepBadgeText} weight="regular">3</AppText>
            </View>
            <View style={styles.stepInfo}>
              <AppText style={styles.stepTitle} weight="regular">Capture Moments Instantly</AppText>
              <AppText style={styles.stepText} weight="regular">
                When people scan your card, their contact details are saved directly into your app as a new Moment.
              </AppText>
            </View>
          </View>

          {/* Sample Moment Mockup Card */}
          <AppText style={styles.guideSubheading} weight="regular">Moment preview</AppText>
          
          <View style={styles.mockMomentCard}>
            <View style={styles.mockMomentHeader}>
              <View style={styles.mockAvatar}>
                <AppText style={styles.mockAvatarText} weight="regular">ML</AppText>
              </View>
              <View style={styles.mockInfo}>
                <AppText style={styles.mockName} weight="regular">Malyka Chea</AppText>
                <AppText style={styles.mockSub} weight="regular">Marketing, Prince Bank</AppText>
              </View>
              <View style={styles.mockBadge}>
                <AppText style={styles.mockBadgeText} weight="regular">New Moment</AppText>
              </View>
            </View>
            <View style={styles.mockFooter}>
              <View style={styles.mockMeta}>
                <AppIcon name="Nfc" size={12} color="#9A9AA0" />
                <AppText style={styles.mockMetaText} weight="regular">NFC card tap</AppText>
              </View>
              <View style={styles.mockTag}>
                <AppText style={styles.mockTagText} weight="regular">Prince Bank</AppText>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Share Profile CTA ─── */}
        <View style={styles.footerWrap}>
          <AppButton
            label="Share my profile"
            iconName="Share"
            variant="white"
            style={styles.bwOrderBtn}
            labelStyle={styles.bwOrderBtnText}
            onPress={() => {
              HapticTap.medium();
              if (profileUrl) {
                void import('react-native').then(({ Share }) =>
                  Share.share({ url: profileUrl, message: profileUrl })
                );
              } else {
                router.push(appRoutes.guestDesign as any);
              }
            }}
          />
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
    gap: 22,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: THEME.accentSoft,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    color: THEME.accent,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  cardWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
    minHeight: 220,
  },
  loadingCard: {
    minHeight: 220,
    backgroundColor: THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.muted,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  flipHint: {
    fontSize: 12,
    color: THEME.muted,
    textAlign: 'center',
    marginTop: -12,
    fontFamily: 'SF-Pro-Display-Regular',
  },

  // Action Cards (Image-Driven)
  actionGrid: {
    gap: 16,
  },
  actionCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 140,
    overflow: 'hidden',
  },
  actionCardCopy: {
    flex: 1,
    gap: 6,
    paddingRight: 10,
  },
  actionCardLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  actionCardDesc: {
    fontSize: 12,
    color: '#9A9AA0',
    lineHeight: 16,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  bwActionBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  bwActionBtnText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  actionCardImg: {
    width: 90,
    height: 90,
  },

  // Guide Section
  guideContainer: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginTop: 8,
  },
  guideHeader: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  guideSubheading: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  stepInfo: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  stepText: {
    fontSize: 12,
    color: '#9A9AA0',
    lineHeight: 16,
    fontFamily: 'SF-Pro-Display-Regular',
  },

  // Sample Mock Moment
  mockMomentCard: {
    backgroundColor: '#18181C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    gap: 12,
  },
  mockMomentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mockAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  mockInfo: {
    flex: 1,
    gap: 2,
  },
  mockName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  mockSub: {
    fontSize: 11,
    color: '#9A9AA0',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  mockBadge: {
    backgroundColor: 'rgba(48,209,88,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mockBadgeText: {
    color: '#30D158',
    fontSize: 9,
    fontFamily: 'SF-Pro-Display-Regular',
  },
  mockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
  },
  mockMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mockMetaText: {
    fontSize: 10,
    color: '#9A9AA0',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  mockTag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mockTagText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'SF-Pro-Display-Regular',
  },

  // Black and White Button
  footerWrap: {
    marginTop: 12,
  },
  bwOrderBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 12,
  },
  bwOrderBtnText: {
    color: '#000000',
    fontFamily: 'SF-Pro-Display-Regular',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
