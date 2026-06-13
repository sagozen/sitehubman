import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/src/components/AppButton';
import { AppHeader } from '@/src/components/AppHeader';
import { AppIcon } from '@/src/components/AppIcon';
import { AppInput } from '@/src/components/AppInput';
import { AppText } from '@/src/components/AppText';
import { CambodiaPaymentSelector } from '@/src/components/CambodiaPaymentSelector';
import { PaymentBrandStrip } from '@/src/components/PaymentBrandStrip';
import { PaymentMethodIcon } from '@/src/components/PaymentMethodIcon';
import {
  getCambodiaPaymentMethod,
  paymentMethodLabel,
  type CambodiaPaymentMethodId,
} from '@/src/constants/cambodiaPayments';
import { IosScrollView } from '@/src/components/IosScrollView';
import { formatFooterDualPrice } from '@/src/constants/cardProducts';
import type { ProductType } from '@/src/constants/options';
import { useProductCatalog } from '@/src/hooks/useProductCatalog';
import {
  getActiveMaterialProductOptions,
  getPhysicalPriceUsd,
} from '@/src/services/productCatalogService';
import { buildCardProfileUrl } from '@/src/constants/publicProfile';
import { iosDesign } from '@/src/design-system/ios';
import { GuestAccountSheet } from '@/src/features/guest/GuestAccountSheet';
import { PhotoBanner } from '@/src/components/PhotoBanner';
import { GuestCardPreview } from '@/src/features/guest/GuestCardPreview';
import { guestUi } from '@/src/features/guest/GuestScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { initiatePayment } from '@/src/services/paymentService';
import { getAuthErrorMessage } from '@/src/services/authService';
import { auth } from '@/src/services/firebaseClient';
import {
  createGuestCardOrder,
  loadGuestCloudCard,
  verifyCardMigration,
  type GuestCloudCard,
} from '@/src/services/guestCardDraftService';
import type { AppUser } from '@/src/types/models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CUSTOMER_TRIAL_DAYS } from '@/src/constants/customerTrial';
import {
  activateDigitalTrialFromGuestCard,
} from '@/src/services/customerTrialService';
import { getPostAuthDestination } from '@/src/utils/guestAuthRedirect';
import { isGuestUser } from '@/src/utils/authFlow';

function parseQuantity(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.min(100, parsed));
}

export default function GuestCheckoutRoute() {
  const params = useLocalSearchParams<{ cardId: string }>();
  const cardId = typeof params.cardId === 'string' ? params.cardId : '';
  const { user } = useAuth();
  useProductCatalog();
  const materialOptions = getActiveMaterialProductOptions();
  const [card, setCard] = useState<GuestCloudCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shippingName, setShippingName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [quantityText, setQuantityText] = useState('1');
  const [cardType, setCardType] = useState<ProductType>('pvc_card');
  const [paymentMethod, setPaymentMethod] = useState<CambodiaPaymentMethodId | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadGuestCloudCard(cardId);
      setCard(loaded);
      if (loaded) {
        setShippingName(loaded.profile.fullName);
        setPhone(loaded.profile.phone);
        setCardType(loaded.design.product ?? 'pvc_card');
      } else {
        setError('Draft not found. Start a new NFC card first.');
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const quantity = parseQuantity(quantityText);
  const totalUsd = getPhysicalPriceUsd(cardType) * quantity;
  const publicUrl = card?.publicSlug ? buildCardProfileUrl(card.publicSlug) : '';

  async function handleCreateOrder() {
    if (!card) return;
    if (!shippingName.trim() || !phone.trim() || !deliveryAddress.trim()) {
      setError('Shipping name, phone, and delivery address are required.');
      return;
    }
    if (!paymentMethod) {
      setError('Choose a payment method.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (!auth.currentUser || auth.currentUser.isAnonymous || isGuestUser(user)) {
        setAccountOpen(true);
        setError('Create an account or sign in before ordering a physical card.');
        return;
      }

      const createdOrderId = await createGuestCardOrder(card.cardId, {
        shippingName,
        phone,
        deliveryAddress,
        quantity,
        cardType,
        paymentMethod,
        currency: 'KHR',
      });

      if (paymentMethod === 'cash_on_delivery') {
        setOrderId(createdOrderId);
        return;
      }

      const intent = await initiatePayment(createdOrderId, paymentMethod);
      router.replace({ pathname: '/payment/[intentId]', params: { intentId: intent.intentId } });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConverted(convertedUser: AppUser) {
    setAccountOpen(false);

    if (!card) {
      setError('Card not loaded yet. Please try again.');
      return;
    }

    try {
      const { migrated, status } = await verifyCardMigration(card.cardId, convertedUser.id);
      const guestId = await AsyncStorage.getItem('currentGuestId');

      console.log('[AuthRedirect] Resolving checkout post auth:', {
        guestId,
        customerId: convertedUser.id,
        cardId: card.cardId,
        intent: 'checkout',
        redirectTarget: migrated ? `/checkout/${card.cardId}` : 'connections',
        migrationStatus: status,
      });

      if (!migrated) {
        setError('Card migration failed. Please try again or check connections.');
        router.replace('/(tabs)/connections');
        return;
      }
      
      router.replace(await getPostAuthDestination(convertedUser, { intent: 'checkout' }));
    } catch (e) {
      router.replace('/(tabs)/connections');
    }
  }

  async function handleStartFreeTrial() {
    if (!card) return;
    if (!auth.currentUser || isGuestUser(user)) {
      setAccountOpen(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const uid = auth.currentUser.uid;
      await activateDigitalTrialFromGuestCard(
        {
          id: uid,
          email: card.profile.email || user?.email || '',
          displayName: shippingName.trim() || card.profile.fullName || 'My Profile',
          role: 'customer',
          language: 'en',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        card.cardId,
      );
      router.replace('/(tabs)');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={guestUi.accent} />
          <AppText style={styles.muted}>Loading checkout...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppHeader title="Checkout" subtitle="NFC card order" showBack />
        <View style={styles.center}>
          <AppText style={styles.emptyTitle}>No draft found</AppText>
          <AppText style={styles.emptyText}>{error}</AppText>
          <AppButton label="Back to design" onPress={() => router.replace('/guest-design')} />
        </View>
      </SafeAreaView>
    );
  }

  if (orderId) {
    const isCod = paymentMethod === 'cash_on_delivery';
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <AppHeader title="Order placed" subtitle="Your NFC card is queued" showBack={false} />
        <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.successHero}>
            <View style={styles.successIcon}>
              <AppIcon name="CheckCheck" size={30} color={guestUi.accent} />
            </View>
            <AppText style={styles.successTitle}>Order submitted</AppText>
            <AppText style={styles.successText}>
              {isCod
                ? 'Pay on delivery. Production starts after payment is collected and verified.'
                : 'Open the payment screen to scan KHQR or use ABA Pay. Production begins after payment is verified and your sales rep approves print.'}
            </AppText>
            <AppText style={styles.publicLink} numberOfLines={2}>{publicUrl}</AppText>
          </View>

          <View style={styles.prompt}>
            <AppText style={styles.promptTitle}>Create account to track this order</AppText>
            <View style={styles.benefits}>
              {['Order tracking', 'NFC profile updates', 'Future reorders'].map((item) => (
                <View key={item} style={styles.benefitRow}>
                  <AppIcon name="CheckCheck" size={14} color={guestUi.accent} />
                  <AppText style={styles.benefitText}>{item}</AppText>
                </View>
              ))}
            </View>
            <AppButton label="Create Account" iconName="UserPlus" onPress={() => setAccountOpen(true)} />
            {!isCod ? (
              <AppButton
                label="Complete payment"
                iconName="CreditCard"
                onPress={() => router.replace(`/guest-track-order?orderId=${encodeURIComponent(orderId)}`)}
              />
            ) : null}
            <AppButton
              label="Track order"
              variant="outline"
              onPress={() => router.replace(`/guest-track-order?orderId=${encodeURIComponent(orderId)}`)}
            />
          </View>
        </IosScrollView>
        <GuestAccountSheet
          visible={accountOpen}
          cardId={card.cardId}
          title="Create account"
          subtitle="Keep this card and order connected to your account."
          onClose={() => setAccountOpen(false)}
          onConverted={handleConverted}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AppHeader title="Checkout" subtitle="Order your printed NFC card" showBack />
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PhotoBanner
          marketingSceneId="premium-membership"
          cacheKey="marketing-premium-checkout"
          variant="compact"
          overlay="product"
        />
        <GuestCardPreview
          displayName={card.profile.fullName}
          jobTitle={card.profile.role}
          company={card.profile.company}
          email={card.profile.email}
          phone={card.profile.phone}
          product={cardType}
          cardDesign={card.design.cardDesign ?? 'classic_black'}
        />

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Shipping</AppText>
          <View style={styles.helperRow}>
            <AppIcon name="MapPin" size={15} color={guestUi.accent} />
            <AppText style={styles.helperText}>
              Add your country code and full delivery address so support can confirm shipping clearly.
            </AppText>
          </View>
          <AppInput
            label="Shipping name"
            value={shippingName}
            onChangeText={setShippingName}
            placeholder="Full name"
            autoCapitalize="words"
          />
          <AppInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 555 0100 or +855 12 345 678"
            keyboardType="phone-pad"
          />
          <AppInput
            label="Delivery address"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Street, city, state/province, country"
            multiline
            style={styles.addressInput}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <AppText style={styles.sectionTitle}>Card type</AppText>
            <AppText style={styles.totalText}>{formatFooterDualPrice(totalUsd)}</AppText>
          </View>
          <View style={styles.materialGrid}>
            {materialOptions.map((option) => {
              const selected = cardType === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setCardType(option.value)}
                  style={({ pressed }) => [
                    styles.materialPill,
                    selected && styles.materialPillActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={[styles.materialText, selected && styles.materialTextActive]}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <AppInput
            label="Quantity"
            value={quantityText}
            onChangeText={setQuantityText}
            keyboardType="number-pad"
            placeholder="1"
          />
        </View>

        <View style={styles.trialSection}>
          <View style={styles.trialBadge}>
            <AppIcon name="Sparkles" size={18} color={guestUi.accent} />
            <AppText style={styles.trialTitle}>7-day free trial</AppText>
          </View>
          <AppText style={styles.trialBody}>
            Go live instantly with your digital profile. No credit card, no payment - full access for {CUSTOMER_TRIAL_DAYS} days.
          </AppText>
          <AppButton
            label={submitting ? 'Starting trial...' : 'Start free trial'}
            iconName="Zap"
            variant="outline"
            loading={submitting}
            onPress={() => void handleStartFreeTrial()}
          />
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Payment</AppText>
          <View style={styles.helperRow}>
            <AppIcon name="ShieldCheck" size={15} color={guestUi.accent} />
            <AppText style={styles.helperText}>
              Your order stays unpaid until the gateway or team verifies payment.
            </AppText>
          </View>
          <PaymentBrandStrip logoSize={32} />
          <CambodiaPaymentSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
            allowCashOnDelivery
            accentColor={guestUi.accent}
            borderColor={guestUi.border}
            mutedColor={guestUi.muted}
            textColor={guestUi.text}
          />
          {paymentMethod ? (
            <View style={styles.summaryRow}>
              <PaymentMethodIcon
                methodId={paymentMethod}
                fallbackIcon={getCambodiaPaymentMethod(paymentMethod)?.icon ?? 'Wallet'}
                size={22}
                color={guestUi.accent}
              />
              <AppText style={styles.summaryText}>{paymentMethodLabel(paymentMethod)}</AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.nfcInfo}>
          <AppIcon name="Nfc" size={18} color={guestUi.accent} />
          <View style={styles.nfcCopy}>
            <AppText style={styles.nfcTitle}>NFC chip URL</AppText>
            <AppText style={styles.helperText}>This is the tap and QR destination printed on your card.</AppText>
            <AppText style={styles.publicLink} numberOfLines={2}>{publicUrl}</AppText>
          </View>
        </View>

        {error ? <AppText style={styles.error}>{error}</AppText> : null}

        <AppButton
          label={submitting ? 'Creating order...' : 'Create Order'}
          iconName="CreditCard"
          loading={submitting}
          onPress={() => void handleCreateOrder()}
        />
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: guestUi.bg },
  scroll: {
    padding: iosDesign.spacing.md,
    gap: iosDesign.spacing.md,
    paddingBottom: iosDesign.spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosDesign.spacing.md,
    padding: iosDesign.spacing.lg,
  },
  muted: { color: guestUi.muted, fontWeight: '600' },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: guestUi.text },
  emptyText: { textAlign: 'center', color: guestUi.muted, lineHeight: 20 },
  trialSection: {
    gap: iosDesign.spacing.sm,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.accent,
    padding: iosDesign.spacing.md,
    ...guestUi.shadow,
  },
  trialBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trialTitle: { fontSize: 16, fontWeight: '800', color: guestUi.text },
  trialBody: { fontSize: 12, lineHeight: 18, fontWeight: '600', color: guestUi.muted },
  section: {
    gap: iosDesign.spacing.sm,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    padding: iosDesign.spacing.md,
    ...guestUi.shadow,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: guestUi.text },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingVertical: 2,
  },
  helperText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: guestUi.muted,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: iosDesign.spacing.sm,
  },
  totalText: { fontSize: 12, fontWeight: '800', color: guestUi.accent },
  addressInput: {
    minHeight: 86,
    textAlignVertical: 'top',
    paddingTop: iosDesign.spacing.md,
  },
  materialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: iosDesign.spacing.xs },
  materialPill: {
    minHeight: 42,
    borderRadius: 18,
    paddingHorizontal: iosDesign.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: guestUi.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
  },
  materialPillActive: {
    backgroundColor: guestUi.accentSoft,
    borderColor: guestUi.accent,
  },
  materialText: { fontSize: 12, fontWeight: '800', color: guestUi.muted },
  materialTextActive: { color: guestUi.text },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosDesign.spacing.xs,
    paddingTop: iosDesign.spacing.xs,
  },
  summaryText: { fontSize: 12, fontWeight: '700', color: guestUi.text },
  nfcInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: iosDesign.spacing.sm,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    padding: iosDesign.spacing.md,
  },
  nfcCopy: { flex: 1, minWidth: 0, gap: 4 },
  nfcTitle: { fontSize: 13, fontWeight: '800', color: guestUi.text },
  publicLink: { fontSize: 12, lineHeight: 17, fontWeight: '600', color: guestUi.muted },
  error: { fontSize: 12, fontWeight: '700', color: '#FF3B30' },
  pressed: { opacity: 0.82, transform: [{ scale: iosDesign.animation.softPressScale }] },
  successHero: {
    alignItems: 'center',
    gap: iosDesign.spacing.sm,
    backgroundColor: guestUi.surface,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    padding: iosDesign.spacing.lg,
    ...guestUi.shadowFloating,
  },
  successIcon: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: guestUi.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: guestUi.text, textAlign: 'center' },
  successText: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: guestUi.muted, textAlign: 'center' },
  prompt: {
    gap: iosDesign.spacing.sm,
    backgroundColor: guestUi.surface,
    borderRadius: guestUi.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: guestUi.border,
    padding: iosDesign.spacing.md,
    ...guestUi.shadow,
  },
  promptTitle: { fontSize: 20, fontWeight: '800', color: guestUi.text },
  benefits: { gap: 6 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  benefitText: { fontSize: 12, fontWeight: '700', color: guestUi.text },
});
