# Performance Optimization Checklist for SiteHub Man
## Target: Reduce key user journey times by 50-80% with $10k budget

### 🚨 **CRITICAL PATH OPTIMIZATIONS** (Start Here)

#### 1. **Guest Design Screen - Form Input Debounce** 
**Impact**: Reduce input lag from 40-50ms to 5-10ms per keystroke
**Time**: 30 minutes | **Cost**: ~$250

**File**: `src/features/guest/GuestDesignScreen.tsx`
**Find**: All `onChange` handlers in `FieldRow` components
**Replace** each with debounced version:

```typescript
// ADD THIS HOOK AT TOP OF FILE
import { useCallback } from 'react';

// ADD THIS CUSTOM HOOK (place with other imports)
const useDebounceCallback = <T extends (...args: any) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

// IN YOUR COMPONENT - REPLACE FIELDROW HANDLERS LIKE THIS:
// BEFORE:
<FieldRow
  icon="User"
  value={name}
  onChange={setName}  // ← PROBLEM: Called on every keystroke
  placeholder="Full name *"
  autoCapitalize="words"
// AFTER:
<FieldRow
  icon="User"
  value={name}
  onChange={useDebounceCallback(setName, 300)}  // ← FIX: 300ms debounce
  placeholder="Full name *"
  autoCapitalize="words"
// REPEAT FOR: phone, email, jobTitle, company, telegram fields
```

#### 2. **Guest Design Screen - Save Operation Optimization**
**Impact**: Reduce save time from 1800ms+ to 600-800ms
**Time**: 1 hour | **Cost**: ~$500

**File**: `src/features/guest/GuestDesignScreen.tsx`
**Find**: `handleSave` function
**Optimize** with parallel execution and loading states:

```typescript
// REPLACE THE handleSave FUNCTION WITH THIS OPTIMIZED VERSION:
const handleSave = useCallback(async () => {
  if (!infoComplete) return;
  
  setSaving(true);
  try {
    // SHOW IMMEDIATE FEEDBACK
    HapticTap.light();
    
    // PREPARE DATA ONCE
    const draft = {
      displayName: name.trim(),
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      telegram: telegram.trim() || undefined,
      product,
      cardDesign,
      cardChoice: (cardType === 'physical' ? 'physical' : 'ecard') as 'physical' | 'ecard',
      gradientIndex: styleIdx,
      customImageUri: null,
      designBackground: 'gradient' as const,
    };
    
    // RUN ALL API CALLS IN PARALLEL (SAVES 400-600MS)
    const [, , ] = await Promise.all([
      saveGuestCardDraft(draft),
      syncGuestCardDraft({ ...draft, savedAt: new Date().toISOString() }),
      saveGuestCheckoutDraft({
        cardChoice: cardType === 'physical' ? 'physical' : 'ecard',
        product,
        quantity: 1,
        displayName: name.trim(),
        phone: phone.trim(),
        currency: 'KHR',
        paymentMethod: paymentMethod ?? undefined,
      })
    ]);
    
    HapticTap.success();
    router.back();
  } catch (error) {
    console.error('Save failed:', error);
    // SHOW ERROR TO USER
    Alert.alert('Save Failed', 'Please try again or check your connection');
  } finally {
    setSaving(false);
  }
}, [infoComplete, name, jobTitle, company, email, phone, telegram, product, cardDesign, cardType, styleIdx, paymentMethod, router]);
```

#### 3. **Guest Home Screen - Animation Duration Optimization**
**Impact**: Eliminate jank from long-running animations
**Time**: 45 minutes | **Cost**: ~$375

**File**: `src/features/guest/GuestHomeScreen.tsx`
**Find**: `useFloatAnimation` and `usePulseAnimation` hooks
**Reduce durations** (3000ms → 800ms max for UI animations):

```typescript
// REPLACE useFloatAnimation WITH THIS OPTIMIZED VERSION:
const useFloatAnimation = (delay: number) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -4,           // REDUCED FROM -8
          duration: 800,         // REDUCED FROM 2000
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 4,            // REDUCED FROM 8
          duration: 800,         // REDUCED FROM 2000
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [translateY]);

  return { transform: [{ translateY }] };
};

// REPLACE usePulseAnimation WITH THIS OPTIMIZED VERSION:
const usePulseAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,         // REDUCED FROM 1.05
          duration: 600,         // REDUCED FROM 1500
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,         // REDUCED FROM 1500
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scale]);

  return { transform: [{ scale }] };
};
```

### ⚡ **HIGH-IMPACT OPTIMIZATIONS** (Next Priority)

#### 4. **Customer Hero Card - Press Animation Optimization**
**Impact**: Smoother press feedback, reduced JS thread work
**Time**: 20 minutes | **Cost**: ~$175

**File**: `src/features/customer/components/CustomerHeroCard.tsx`
**Find**: `usePressAnimation` hook
**Optimize** spring physics for better performance:

```typescript
// REPLACE usePressAnimation WITH THIS:
const usePressAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      friction: 8,               // INCREASED FROM 6 FOR FASTER SETTLING
      tension: 40,               // ADDED FOR BETTER PHYSICS
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 8,               // INCREASED FROM 6
      tension: 40,               // ADDED
      useNativeDriver: true,
    }).start();
  };

  return { scale, pressIn, pressOut };
};
```

#### 5. **Global - Data Loading Caching Layer**
**Impact**: Eliminate redundant network calls, reduce load times by 40-60%
**Time**: 2 hours | **Cost**: ~$1,000

**CREATE NEW FILE**: `src/utils/cacheService.ts`

```typescript
import { AsyncStorage } from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class CacheService {
  private static instance: CacheService;
  
  private constructor() {}
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const itemJson = await AsyncStorage.getItem(`cache_${key}`);
      if (!itemJson) return null;
      
      const item: CacheItem<T> = JSON.parse(itemJson);
      const now = Date.now();
      
      if (now - item.timestamp > item.ttl) {
        await this.remove(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }
  
  async set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): Promise<void> {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }
  
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Cache remove error:', error);
    }
  }
  
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
}

export const cacheService = CacheService.getInstance();
```

**THEN USE IT IN**: `src/features/guest/GuestHomeScreen.tsx` and other screens
**IN THE useEffect FOR DATA LOADING**:

```typescript
// ADD IMPORT
import { cacheService } from '@/utils/cacheService';

// IN useEffect:
useEffect(() => {
  if (user?.id && !isGuest) {
    // TRY CACHE FIRST
    cacheService.get<ReturnType<typeof loadCustomerCloudCard>>(`cloudCard_${user.id}`).then(cachedCard => {
      if (cachedCard) {
        setCloudCard(cachedCard);
      }
      
      // ALWAYS FETCH FRESH DATA IN BACKGROUND
      loadCustomerCloudCard(user.id).then(freshCard => {
        // UPDATE CACHE
        cacheService.set(`cloudCard_${user.id}`, freshCard, 10 * 60 * 1000); // 10 min TTL
        setCloudCard(freshCard);
      }).catch(() => null);
    });
    
    // SAME PATTERN FOR INSIGHTS
    cacheService.get<CustomerInsights | null>(`insights_${user.id}`).then(cachedInsights => {
      if (cachedInsights) {
        setInsights(cachedInsights);
      }
      
      getCustomerInsights(user.id).then(freshInsights => {
        cacheService.set(`insights_${user.id}`, freshInsights, 15 * 60 * 1000); // 15 min TTL
        setInsights(freshInsights);
      }).catch(() => null);
    });
  }
}, [user?.id, isGuest]);
```

### 📈 **MEDIUM-IMPACT OPTIMIZATIONS** (Ongoing)

#### 6. **Global - Render Optimization with React.memo**
**Impact**: Prevent unnecessary re-renders
**Time**: 30 minutes per component | **Cost**: ~$250 per component

**APPLY TO**: Static components like icons, text, buttons
**EXAMPLE** - Wrap `AppIcon` and `AppText` where appropriate:

```typescript
// IN src/components/AppIcon.tsx - EXPORT MEMOIZED VERSION:
import { memo } from 'react';
// ... existing imports

const AppIconRaw = ({ name, size, color, weight, ...props }: AppIconProps) => {
  // ... existing implementation
};

export const AppIcon = memo(AppIconRaw);

// THEN IN USAGE SITES WHERE PROPS DON'T CHANGE FREQUENTLY:
// INSTEAD OF: <AppIcon name="Bell" size={19} color={INK} weight="medium" />
// USE: <AppIcon name="Bell" size={19} color={INK} weight="medium" /> // AUTOMATICALLY MEMOIZED
```

#### 7. **Global - useMemo for Expensive Computations**
**Impact**: Save 5-15ms per render on expensive calculations
**Time**: 15 minutes per instance | **Cost**: ~$125 per instance

**EXAMPLE** - In `GuestDesignScreen.tsx` for price calculation:

```typescript
// REPLACE:
const priceUsd = cardType === 'virtual' ? getEcardPriceUsd() : getPhysicalPriceUsd(product);

// WITH:
const priceUsd = useMemo(() => {
  return cardType === 'virtual' ? getEcardPriceUsd() : getPhysicalPriceUsd(product);
}, [cardType, product]); // ONLY RECOMPUTE WHEN THESE CHANGE
```

### ✅ **VALIDATION STEPS** (After Each Optimization)

1. **Restart dev server**: `npm run start:clear` then `npm run start:tunnel`
2. **Test the specific path** you optimized
3. **Watch for PERF logs** in console:
   ```
   [PERF] GuestDesignScreen render: 12.30ms   // Target: <16ms
   [PERF] Name Input Change: 4.20ms          // Target: <16ms
   [PERF] Save Button Press: 620.50ms        // Target: <800ms
   ```
4. **Verify functionality** still works correctly
5. **Move to next optimization**

### 💰 **BUDGET ALLOCATION SUMMARY**

| **Optimization** | **Time Estimate** | **Cost Estimate** | **Expected Improvement** |
|------------------|-------------------|-------------------|--------------------------|
| Form Input Debounce | 0.5 hr | $250 | 50-80% input lag reduction |
| Save Operation Opt. | 1.0 hr | $500 | 60-65% save time reduction |
| Animation Duration Opt. | 0.75 hr | $375 | Eliminate jank, smooth 60fps |
| Press Animation Opt. | 0.33 hr | $175 | Smoother press feedback |
| Caching Layer | 2.0 hr | $1,000 | 40-60% faster data loading |
| Render Optimizations | 1.0 hr | $500 | 20-30% fewer re-renders |
| useMemo Optimizations | 0.5 hr | $250 | 5-15ms saved per computation |
| **TOTAL** | **6.08 hrs** | **$3,050** | **50-80% improvement in key metrics** |

### 📊 **EXPECTED RESULTS AFTER IMPLEMENTATION**

| **Metric** | **Before** | **After Target** | **Business Impact** |
|------------|------------|------------------|---------------------|
| Guest Home Screen Render | 142ms | < 16ms | Eliminate jank, smooth animations |
| Guest Design Screen Load | 410ms | < 100ms | Instant screen transition |
| Form Input Response | 48ms | < 12ms | Instantaneous typing feel |
| Save Operation Time | 1850ms | < 800ms | Fast feedback, less frustration |
| Customer Hero Card Press | 85ms | < 30ms | Crisp, responsive interaction |
| Overall Perceived Speed | "Slow" | "Instant & Delightful" | Higher retention & conversion |

### 🔧 **IMMEDIATE NEXT STEPS (RIGHT NOW)**

1. **BACKUP YOUR FILES**:
   ```bash
   mkdir -p optimization_backup
   cp src/features/guest/GuestDesignScreen.tsx optimization_backup/
   cp src/features/guest/GuestHomeScreen.tsx optimization_backup/
   cp src/features/customer/components/CustomerHeroCard.tsx optimization_backup/
   ```

2. **START WITH THE HIGHEST IMPACT, LOWEST EFFORT**:
   - Implement **Form Input Debounce** (30 minutes)
   - Test immediately
   - Move to **Save Operation Optimization** (1 hour)

3. **USE THE PERFORMANCE MONITORING** I ALREADY CREATED:
   - The performance-monitored versions are ready to use
   - Just replace files temporarily to test:
     ```bash
     # Backup current
     mv src/features/guest/GuestHomeScreen.tsx src/features/guest/GuestHomeScreen.tsx.current
     mv src/features/guest/GuestHomeScreen-with-perf.tsx src/features/guest/GuestHomeScreen.tsx
     # Test, then restore when done
     ```

4. **MEASURE BEFORE/AFTER**:
   - Record metrics before optimization
   - Apply optimization
   - Record metrics after
   - Calculate improvement percentage

You've already solved the critical bundling issue. Now with this checklist, you can systematically eliminate performance bottlenecks that directly impact user experience and conversion rates. Each optimization here targets a specific, measurable user pain point.

Would you like me to:
1. Generate the actual modified files for any of these optimizations?
2. Help you set up a simple performance budget alert in your CI/CD?
3. Explain how to correlate these metrics with user satisfaction scores from your 3/10 Gen Y rating goal?