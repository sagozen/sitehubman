// Card Upgrade Flow - Optimized for maximum AOV (Average Order Value)
// This screen converts users from digital cards to physical cards

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CARD_PRODUCTS,
  CARD_ADDONS,
  BUNDLE_DEALS,
  calculateOrderTotal,
  getRecommendedAddons,
  formatPrice,
  calculateSavingsPercentage,
} from '@/src/constants/cardProducts';
import { useSubscription } from '@/src/hooks/useSubscription';
import { subscriptionService } from '@/src/services/subscriptionService';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface OrderItem {
  productId: string;
  quantity: number;
  customization?: any;
}

export default function CardUpgradeScreen() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams();
  const { currentPlan, hasAccess } = useSubscription();
  
  const [selectedCard, setSelectedCard] = useState<string>('card_premium');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Get recommended addons based on selected card
  const recommendedAddons = getRecommendedAddons(selectedCard);
  const selectedCardProduct = CARD_PRODUCTS[selectedCard];

  // Calculate pricing
  const orderItems: OrderItem[] = [
    { productId: selectedCard, quantity },
    ...selectedAddons.map(addonId => ({ productId: addonId, quantity: 1 })),
  ];

  const pricing = calculateOrderTotal(orderItems, selectedBundle || undefined);

  useEffect(() => {
    // Track page view for analytics
    // analytics.track('Card Upgrade Page Viewed', { cardId });
  }, []);

  const handleCardSelection = (cardId: string) => {
    setSelectedCard(cardId);
    setSelectedAddons([]); // Reset addons when changing card type
    setSelectedBundle(null); // Reset bundle
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, Math.min(100, quantity + change));
    setQuantity(newQuantity);
    
    // Auto-suggest team bundles for larger quantities
    if (newQuantity >= 5 && !selectedBundle) {
      setSelectedBundle('bundle_professional');
    }
  };

  const handleProceedToCheckout = async () => {
    if (!hasAccess('digitalCards')) {
      // Redirect to pricing if user doesn't have card ordering access
      Alert.alert(
        'Upgrade Required',
        'Card ordering is available in Pro and Business plans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/pricing' as any) },
        ]
      );
      return;
    }

    setIsLoading(true);
    try {
      const { checkoutUrl } = await subscriptionService.createCardOrder(
        'current-user-id', // Replace with actual user ID
        orderItems
      );
      
      if (checkoutUrl) {
        if (isWeb) {
          window.location.href = checkoutUrl;
        } else {
          // Handle mobile navigation
          router.push(checkoutUrl as any);
        }
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      Alert.alert('Error', 'Failed to proceed to checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Upgrade to Physical Card</Text>
        <Text style={styles.subtitle}>
          Get your digital card printed on premium materials
        </Text>
      </View>

      {/* Card Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Card</Text>
        
        <View style={styles.cardGrid}>
          {Object.values(CARD_PRODUCTS).map(card => (
            <CardOption
              key={card.id}
              card={card}
              selected={selectedCard === card.id}
              onSelect={() => handleCardSelection(card.id)}
            />
          ))}
        </View>
      </View>

      {/* Quantity Selector */}
      <View style={styles.section}>
        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          
          <View style={styles.quantitySelector}>
            <Pressable
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(-1)}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </Pressable>
            
            <Text style={styles.quantityValue}>{quantity}</Text>
            
            <Pressable
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
        
        {quantity >= 5 && (
          <View style={styles.bulkDiscountBadge}>
            <Text style={styles.bulkDiscountText}>
              🎉 Bulk discount applied! Save {calculateSavingsPercentage(
                selectedCardProduct.price * quantity,
                calculateOrderTotal([{ productId: selectedCard, quantity }]).total
              )}%
            </Text>
          </View>
        )}
      </View>

      {/* Recommended Add-ons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enhance Your Order</Text>
        <Text style={styles.sectionSubtitle}>
          Recommended for {selectedCardProduct.name}
        </Text>
        
        <View style={styles.addonsGrid}>
          {recommendedAddons.map(addon => (
            <AddonOption
              key={addon.id}
              addon={addon}
              selected={selectedAddons.includes(addon.id)}
              onToggle={() => toggleAddon(addon.id)}
            />
          ))}
        </View>
      </View>

      {/* Bundle Offers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bundle Deals</Text>
        
        <View style={styles.bundleGrid}>
          {Object.values(BUNDLE_DEALS).map(bundle => (
            <BundleOption
              key={bundle.id}
              bundle={bundle}
              selected={selectedBundle === bundle.id}
              onSelect={() => setSelectedBundle(
                selectedBundle === bundle.id ? null : bundle.id
              )}
            />
          ))}
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.orderSummary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <Pressable onPress={() => setShowComparison(!showComparison)}>
            <Text style={styles.compareLink}>Compare Cards</Text>
          </Pressable>
        </View>

        {/* Selected Items */}
        <View style={styles.summaryItems}>
          <SummaryItem
            name={`${selectedCardProduct.name} × ${quantity}`}
            price={selectedCardProduct.price * quantity}
          />
          
          {selectedAddons.map(addonId => {
            const addon = CARD_ADDONS[addonId];
            return (
              <SummaryItem
                key={addonId}
                name={addon.name}
                price={addon.price}
              />
            );
          })}
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.pricingBreakdown}>
          <PricingRow label="Subtotal" amount={pricing.subtotal} />
          
          {pricing.savings > 0 && (
            <PricingRow
              label="Savings"
              amount={-pricing.savings}
              savings={true}
            />
          )}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatPrice(pricing.total)}</Text>
          </View>
        </View>

        {/* CTA Button */}
        <Pressable
          style={[styles.checkoutButton, isLoading && styles.checkoutButtonLoading]}
          onPress={handleProceedToCheckout}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.checkoutButtonText}>
            {isLoading ? 'Processing...' : `Proceed to Checkout • ${formatPrice(pricing.total)}`}
          </Text>
        </Pressable>

        {/* Trust Signals */}
        <View style={styles.trustSignals}>
          <Text style={styles.trustText}>🔒 Secure checkout</Text>
          <Text style={styles.trustText}>📦 Free shipping over $50</Text>
          <Text style={styles.trustText}>↩️ 30-day guarantee</Text>
        </View>
      </View>

      {/* Comparison Modal */}
      {showComparison && (
        <ComparisonModal
          onClose={() => setShowComparison(false)}
          selectedCard={selectedCard}
          onCardSelect={handleCardSelection}
        />
      )}
    </ScrollView>
  );
}

// Card Selection Component
function CardOption({ card, selected, onSelect }: any) {
  return (
    <Pressable
      style={[styles.cardOption, selected && styles.cardOptionSelected]}
      onPress={onSelect}
    >
      {card.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      )}
      
      <Image source={{ uri: card.image }} style={styles.cardImage} />
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardMaterial}>{card.material}</Text>
        <Text style={styles.cardPrice}>{formatPrice(card.price)}</Text>
      </View>
      
      <View style={styles.cardFeatures}>
        {card.features.slice(0, 3).map((feature: string, index: number) => (
          <Text key={index} style={styles.cardFeature}>
            ✓ {feature}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

// Addon Selection Component
function AddonOption({ addon, selected, onToggle }: any) {
  return (
    <Pressable
      style={[styles.addonOption, selected && styles.addonOptionSelected]}
      onPress={onToggle}
    >
      <View style={styles.addonHeader}>
        <Image source={{ uri: addon.image }} style={styles.addonImage} />
        <View style={styles.addonInfo}>
          <Text style={styles.addonName}>{addon.name}</Text>
          <Text style={styles.addonPrice}>{formatPrice(addon.price)}</Text>
        </View>
      </View>
      
      <Text style={styles.addonDescription}>{addon.description}</Text>
      
      <View style={styles.checkbox}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </Pressable>
  );
}

// Bundle Option Component
function BundleOption({ bundle, selected, onSelect }: any) {
  return (
    <Pressable
      style={[styles.bundleOption, selected && styles.bundleOptionSelected]}
      onPress={onSelect}
    >
      <View style={styles.bundleBadge}>
        <Text style={styles.bundleBadgeText}>
          Save {formatPrice(bundle.savings)}
        </Text>
      </View>
      
      <Text style={styles.bundleName}>{bundle.name}</Text>
      <Text style={styles.bundleDescription}>{bundle.description}</Text>
      
      <View style={styles.bundlePricing}>
        <Text style={styles.bundleOriginalPrice}>
          {formatPrice(bundle.originalPrice)}
        </Text>
        <Text style={styles.bundlePrice}>
          {formatPrice(bundle.bundlePrice)}
        </Text>
      </View>
    </Pressable>
  );
}

// Summary Components
function SummaryItem({ name, price }: { name: string; price: number }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryItemName}>{name}</Text>
      <Text style={styles.summaryItemPrice}>{formatPrice(price)}</Text>
    </View>
  );
}

function PricingRow({ 
  label, 
  amount, 
  savings = false 
}: { 
  label: string; 
  amount: number; 
  savings?: boolean 
}) {
  return (
    <View style={styles.pricingRow}>
      <Text style={[styles.pricingLabel, savings && styles.savingsLabel]}>
        {label}
      </Text>
      <Text style={[styles.pricingAmount, savings && styles.savingsAmount]}>
        {savings ? '-' : ''}{formatPrice(Math.abs(amount))}
      </Text>
    </View>
  );
}

// Comparison Modal Component
function ComparisonModal({ onClose, selectedCard, onCardSelect }: any) {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Compare Cards</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.modalClose}>×</Text>
          </Pressable>
        </View>
        
        {/* Comparison content */}
        <ScrollView>
          {Object.values(CARD_PRODUCTS).map((card: any) => (
            <View key={card.id} style={styles.comparisonCard}>
              <Text style={styles.comparisonCardName}>{card.name}</Text>
              <Text style={styles.comparisonCardPrice}>{formatPrice(card.price)}</Text>
              <View style={styles.comparisonFeatures}>
                {card.features.map((feature: string, index: number) => (
                  <Text key={index} style={styles.comparisonFeature}>
                    ✓ {feature}
                  </Text>
                ))}
              </View>
              <Pressable
                style={styles.selectCardButton}
                onPress={() => {
                  onCardSelect(card.id);
                  onClose();
                }}
              >
                <Text style={styles.selectCardButtonText}>
                  {selectedCard === card.id ? 'Selected' : 'Select This Card'}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: isWeb ? 32 : 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 24,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  cardGrid: {
    gap: 16,
  },
  cardOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  cardOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardInfo: {
    marginBottom: 12,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardMaterial: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  cardFeatures: {
    gap: 4,
  },
  cardFeature: {
    fontSize: 14,
    color: '#374151',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center',
  },
  bulkDiscountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  bulkDiscountText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  addonsGrid: {
    gap: 12,
  },
  addonOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  addonOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  addonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addonImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  addonPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  addonDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkmark: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  bundleGrid: {
    gap: 12,
  },
  bundleOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  bundleOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  bundleBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bundleBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  bundleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  bundleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  bundlePricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bundleOriginalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  bundlePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  orderSummary: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    marginTop: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  compareLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  summaryItems: {
    gap: 8,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemName: {
    fontSize: 16,
    color: '#374151',
  },
  summaryItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pricingBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    gap: 8,
    marginBottom: 20,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  pricingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  savingsLabel: {
    color: '#10B981',
  },
  savingsAmount: {
    color: '#10B981',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#374151',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  checkoutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  checkoutButtonLoading: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  trustSignals: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  trustText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: isWeb ? 600 : '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  modalClose: {
    fontSize: 32,
    color: '#6B7280',
    fontWeight: '300',
  },
  comparisonCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 16,
    marginBottom: 16,
  },
  comparisonCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  comparisonCardPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  comparisonFeatures: {
    gap: 4,
    marginBottom: 12,
  },
  comparisonFeature: {
    fontSize: 14,
    color: '#374151',
  },
  selectCardButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  selectCardButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});