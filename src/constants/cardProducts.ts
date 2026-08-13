// Card Products & Pricing Configuration
// Physical card tiers and add-ons for maximum revenue

export interface CardProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // For showing discounts
  material: string;
  thickness?: string;
  production: string;
  image: string;
  features: string[];
  description: string;
  popular?: boolean;
  badge?: string;
  color: string;
  stripePriceId: string;
  category: 'card' | 'addon';
  tags: string[];
}

// Main card products
export const CARD_PRODUCTS: Record<string, CardProduct> = {
  standard: {
    id: 'card_standard',
    name: 'Standard PVC',
    price: 19.99,
    material: 'PVC Plastic',
    thickness: '0.76mm (Standard credit card)',
    production: '7-10 business days',
    image: '/images/cards/standard-pvc.jpg',
    description: 'Perfect for getting started with digital cards',
    color: '#6B7280',
    stripePriceId: 'price_standard_card',
    category: 'card',
    tags: ['affordable', 'durable', 'classic'],
    features: [
      'NFC chip included (13.56MHz)',
      'QR code backup printed',
      'Full-color printing (CMYK)',
      'Matte or glossy finish',
      'Water-resistant coating',
      'Standard wallet size',
      'Works with all NFC phones',
      '2-year chip warranty',
    ],
  },

  premium: {
    id: 'card_premium',
    name: 'Premium Metal',
    price: 49.99,
    material: 'Stainless Steel',
    thickness: '0.84mm (Premium weight)',
    production: '7-10 business days',
    image: '/images/cards/premium-metal.jpg',
    description: 'Professional metal cards that make an impression',
    popular: true,
    badge: 'Most Popular',
    color: '#3B82F6',
    stripePriceId: 'price_premium_card',
    category: 'card',
    tags: ['professional', 'premium', 'metal', 'executive'],
    features: [
      'Everything in Standard',
      'Premium stainless steel construction',
      'Laser etching available',
      'Magnetic stripe option',
      'Weighted premium feel (15g)',
      'Scratch-resistant finish',
      'Lifetime durability',
      'Executive presentation',
    ],
  },

  luxury: {
    id: 'card_luxury',
    name: 'Luxury Carbon Fiber',
    price: 99.99,
    material: 'Real Carbon Fiber',
    thickness: '0.84mm (Ultra-premium)',
    production: '10-14 business days',
    image: '/images/cards/luxury-carbon.jpg',
    description: 'The ultimate premium card for executives',
    badge: 'Luxury',
    color: '#8B5CF6',
    stripePriceId: 'price_luxury_card',
    category: 'card',
    tags: ['luxury', 'carbon-fiber', 'executive', 'exclusive'],
    features: [
      'Everything in Premium',
      'Genuine carbon fiber construction',
      'Ultra-premium finish',
      'Custom color accent options',
      'Numbered limited edition',
      'Premium gift box packaging',
      'Leather card sleeve included',
      'VIP customer support',
    ],
  },

  custom: {
    id: 'card_custom',
    name: 'Custom Design Service',
    price: 149.99,
    material: 'Your choice of material',
    production: '14-21 business days',
    image: '/images/cards/custom-design.jpg',
    description: 'Professional design service with unlimited revisions',
    badge: 'Design Service',
    color: '#10B981',
    stripePriceId: 'price_custom_design',
    category: 'card',
    tags: ['custom', 'design-service', 'professional', 'unique'],
    features: [
      'Professional graphic designer assigned',
      'Unlimited design revisions',
      'Custom artwork and illustrations',
      'Brand identity consultation',
      'Your choice of material and finish',
      'Priority production queue',
      'Design files provided (AI, PSD)',
      'Dedicated project manager',
    ],
  },
};

// Add-on products and services
export const CARD_ADDONS: Record<string, CardProduct> = {
  cardHolder: {
    id: 'addon_holder',
    name: 'Premium Card Holder',
    price: 14.99,
    material: 'Genuine Leather',
    production: 'Ships with card',
    image: '/images/addons/leather-holder.jpg',
    description: 'Elegant leather holder with your branding',
    color: '#92400E',
    stripePriceId: 'price_card_holder',
    category: 'addon',
    tags: ['leather', 'holder', 'protection', 'branding'],
    features: [
      'Genuine leather construction',
      'Custom embossed logo',
      'RFID blocking protection',
      'Slim profile design',
      'Gift box packaging',
      'Available in 4 colors',
    ],
  },

  expressShipping: {
    id: 'addon_express',
    name: 'Express Production',
    price: 19.99,
    material: 'Service upgrade',
    production: '3-4 business days (rush)',
    image: '/images/addons/express-shipping.jpg',
    description: 'Get your cards in half the time',
    color: '#DC2626',
    stripePriceId: 'price_express_shipping',
    category: 'addon',
    tags: ['fast', 'rush', 'priority', 'shipping'],
    features: [
      'Priority production queue',
      '3-4 day production time',
      'Express shipping included',
      'Real-time tracking updates',
      'Dedicated production team',
      'Quality guarantee maintained',
    ],
  },

  customPackaging: {
    id: 'addon_packaging',
    name: 'Custom Gift Packaging',
    price: 9.99,
    material: 'Premium packaging',
    production: 'No additional time',
    image: '/images/addons/custom-packaging.jpg',
    description: 'Professional branded gift boxes',
    color: '#7C3AED',
    stripePriceId: 'price_custom_packaging',
    category: 'addon',
    tags: ['packaging', 'gift', 'branding', 'premium'],
    features: [
      'Custom branded gift box',
      'Your logo and colors',
      'Premium matte finish',
      'Tissue paper included',
      'Perfect for gifting',
      'Unboxing experience',
    ],
  },

  logoEmbossing: {
    id: 'addon_embossing',
    name: 'Logo Embossing',
    price: 29.99,
    material: 'Raised logo treatment',
    production: '+2 business days',
    image: '/images/addons/logo-embossing.jpg',
    description: 'Raised logo on metal cards for premium feel',
    color: '#059669',
    stripePriceId: 'price_logo_embossing',
    category: 'addon',
    tags: ['embossing', 'logo', 'premium', 'metal-only'],
    features: [
      'Raised logo embossing',
      'Available on metal cards only',
      'Premium tactile experience',
      'Multiple finish options',
      'Logo file optimization included',
      'Quality guarantee',
    ],
  },

  multiPack5: {
    id: 'addon_multipack_5',
    name: '5-Card Bundle',
    price: 199.99,
    originalPrice: 249.95,
    material: 'Bundle discount',
    production: 'Same as selected card',
    image: '/images/addons/bundle-5.jpg',
    description: 'Save $50 when you order 5 premium cards',
    badge: 'Save $50',
    color: '#DC2626',
    stripePriceId: 'price_bundle_5',
    category: 'addon',
    tags: ['bundle', 'discount', 'bulk', 'savings'],
    features: [
      '5 premium metal cards',
      'Save $49.96 vs individual',
      'Mix and match designs',
      'Bulk discount applied',
      'Perfect for teams',
      'Free shipping included',
    ],
  },

  multiPack10: {
    id: 'addon_multipack_10',
    name: '10-Card Team Pack',
    price: 399.99,
    originalPrice: 499.90,
    material: 'Bulk team order',
    production: 'Same as selected card',
    image: '/images/addons/team-pack.jpg',
    description: 'Perfect for small teams and departments',
    badge: 'Save $100',
    color: '#7C3AED',
    stripePriceId: 'price_team_pack_10',
    category: 'addon',
    tags: ['team', 'bulk', 'business', 'savings'],
    features: [
      '10 premium cards',
      'Save $99.91 vs individual',
      'Team design templates',
      'Bulk customization',
      'Team management dashboard',
      'Priority support included',
    ],
  },
};

// Bundle configurations for upselling
export const BUNDLE_DEALS = {
  starterPack: {
    id: 'bundle_starter',
    name: 'Starter Pack',
    products: ['card_premium', 'addon_holder'],
    originalPrice: 64.98,
    bundlePrice: 59.99,
    savings: 4.99,
    description: 'Premium card + leather holder',
  },
  
  professionalPack: {
    id: 'bundle_professional',
    name: 'Professional Pack',
    products: ['card_premium', 'addon_holder', 'addon_packaging'],
    originalPrice: 74.97,
    bundlePrice: 69.99,
    savings: 4.98,
    description: 'Premium card + holder + gift packaging',
  },
  
  executivePack: {
    id: 'bundle_executive',
    name: 'Executive Pack',
    products: ['card_luxury', 'addon_holder', 'addon_packaging', 'addon_embossing'],
    originalPrice: 154.96,
    bundlePrice: 139.99,
    savings: 14.97,
    description: 'Luxury carbon card + all premium options',
  },
};

// Pricing calculation functions
export function calculateProductPrice(productId: string, quantity: number = 1): number {
  const product = CARD_PRODUCTS[productId] || CARD_ADDONS[productId];
  if (!product) return 0;
  
  // Apply quantity discounts for cards (not addons)
  if (product.category === 'card' && quantity > 1) {
    const basePrice = product.price * quantity;
    
    // Bulk discount tiers
    if (quantity >= 50) return basePrice * 0.75; // 25% off
    if (quantity >= 25) return basePrice * 0.80; // 20% off  
    if (quantity >= 10) return basePrice * 0.85; // 15% off
    if (quantity >= 5) return basePrice * 0.90;  // 10% off
    
    return basePrice;
  }
  
  return product.price * quantity;
}

export function calculateBundlePrice(bundleId: string): number {
  const bundle = BUNDLE_DEALS[bundleId as keyof typeof BUNDLE_DEALS];
  if (!bundle) return 0;
  return bundle.bundlePrice;
}

export function calculateOrderTotal(
  items: Array<{ productId: string; quantity: number }>,
  bundleId?: string
): { subtotal: number; savings: number; total: number } {
  if (bundleId) {
    const bundle = BUNDLE_DEALS[bundleId as keyof typeof BUNDLE_DEALS];
    if (bundle) {
      return {
        subtotal: bundle.originalPrice,
        savings: bundle.savings,
        total: bundle.bundlePrice,
      };
    }
  }
  
  let subtotal = 0;
  let savings = 0;
  
  items.forEach(item => {
    const product = CARD_PRODUCTS[item.productId] || CARD_ADDONS[item.productId];
    if (!product) return;
    
    const regularPrice = product.price * item.quantity;
    const discountedPrice = calculateProductPrice(item.productId, item.quantity);
    
    subtotal += regularPrice;
    savings += regularPrice - discountedPrice;
  });
  
  return {
    subtotal,
    savings,
    total: subtotal - savings,
  };
}

// Get recommended products based on main selection
export function getRecommendedAddons(cardProductId: string): CardProduct[] {
  const recommendations: Record<string, string[]> = {
    card_standard: ['addon_holder', 'addon_express'],
    card_premium: ['addon_holder', 'addon_packaging', 'addon_embossing'],
    card_luxury: ['addon_packaging', 'addon_embossing', 'addon_express'],
    card_custom: ['addon_express', 'addon_packaging'],
  };
  
  const recommended = recommendations[cardProductId] || [];
  return recommended.map(id => CARD_ADDONS[id]).filter(Boolean);
}

// Get products by category
export function getProductsByCategory(category: 'card' | 'addon'): CardProduct[] {
  const allProducts = { ...CARD_PRODUCTS, ...CARD_ADDONS };
  return Object.values(allProducts).filter(product => product.category === category);
}

// Search products by tags
export function searchProducts(tags: string[]): CardProduct[] {
  const allProducts = { ...CARD_PRODUCTS, ...CARD_ADDONS };
  return Object.values(allProducts).filter(product =>
    tags.some(tag => product.tags.includes(tag))
  );
}

// Get product by ID
export function getProduct(productId: string): CardProduct | null {
  return CARD_PRODUCTS[productId] || CARD_ADDONS[productId] || null;
}

// Format price for display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
}

// Calculate savings percentage
export function calculateSavingsPercentage(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}

// Dual currency & helper exports
export type OrderCurrency = 'USD' | 'KHR';
export const USD_TO_KHR_RATE = 4100;

export function usdToKhr(usd: number): number {
  return Math.round(usd * USD_TO_KHR_RATE);
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatKhr(amount: number): string {
  return `${Math.round(amount).toLocaleString()} KHR`;
}

export function formatDualPrice(usdAmount: number): string {
  return `$${usdAmount.toFixed(2)} (${formatKhr(usdToKhr(usdAmount))})`;
}

export function formatFooterDualPrice(usdAmount: number): string {
  return formatDualPrice(usdAmount);
}

export function getEcardPriceUsd(): number {
  return 9.99;
}

export function getPhysicalPriceUsd(_product?: any): number {
  return 49.99;
}

export function amountInCurrency(usd: number, currency: OrderCurrency): number {
  return currency === 'KHR' ? usdToKhr(usd) : usd;
}

export function computeSalesCommission(totalUsd: number, rate?: number): number {
  return Math.round(totalUsd * (rate || 0.1) * 100) / 100;
}

export function resolveLineTotalUsd(productType?: string, quantity: number = 1, _material?: string): number {
  const price = productType === 'ecard' ? 9.99 : 49.99;
  return price * quantity;
}