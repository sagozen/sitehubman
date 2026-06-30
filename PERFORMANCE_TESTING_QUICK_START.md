# Performance Testing Quick Start Guide

## 🚀 Quick Setup

You now have performance-monitored versions of key screens ready to use. To start testing:

### 1. Temporarily Replace Files (For Testing)
Rename your current files and replace them with the performance-monitored versions:

```bash
# Guest Home Screen
mv src/features/guest/GuestHomeScreen.tsx src/features/guest/GuestHomeScreen.tsx.original
mv src/features/guest/GuestHomeScreen-with-perf.tsx src/features/guest/GuestHomeScreen.tsx

# Customer Hero Card
mv src/features/customer/components/CustomerHeroCard.tsx src/features/customer/components/CustomerHeroCard.tsx.original
mv src/features/customer/components/CustomerHeroCard-with-perf.tsx src/features/customer/components/CustomerHeroCard.tsx

# Guest Design Screen
mv src/features/guest/GuestDesignScreen.tsx src/features/guest/GuestDesignScreen.tsx.original
mv src/features/guest/GuestDesignScreen-with-perf.tsx src/features/guest/GuestDesignScreen.tsx
```

### 2. Start Development Server
```bash
npm run start:web      # For web testing
npm run start:tunnel   # For mobile testing
npm run start:clear    # Clear cache first if needed
```

### 3. Test User Flows
Navigate through these key paths:
1. **Guest Home Screen** (first impression)
2. **Card Creation Flow**: Guest Home → Design Screen → Save
3. **Profile Screen**: Home → Profile (if logged in)
4. **Card Interaction**: Home → Tap NFC Card → Set as Primary

### 4. Monitor Performance Metrics
Watch the console for logs like:
```
[PERF] GuestHomeScreen render: 124.50ms
[PERF] Load Cloud Card: 342.20ms
[PERF] Load Guest Card Draft: 180.30ms
[PERF] Name Input Change: 8.20ms
[PERF] Save Button Press: 1240.50ms
[PERF] Product Type Select: Physical: 5.10ms
```

### 5. Restore Original Files (After Testing)
```bash
# Restore original files
mv src/features/guest/GuestHomeScreen.tsx src/features/guest/GuestHomeScreen-with-perf.tsx
mv src/features/guest/GuestHomeScreen.tsx.original src/features/guest/GuestHomeScreen.txt

mv src/features/customer/components/CustomerHeroCard.tsx src/features/customer/components/CustomerHeroCard-with-perf.tsx
mv src/features/customer/components/CustomerHeroCard.tsx.original src/features/customer/components/CustomerHeroCard.tsx

mv src/features/guest/GuestDesignScreen.tsx src/features/guest/GuestDesignScreen-with-perf.tsx
mv src/features/guest/GuestDesignScreen.tsx.original src/features/guest/GuestDesignScreen.tsx
```

## 📊 Performance Metrics to Watch

### 🎯 Critical Thresholds (User-Perceivable)
| Metric | Target (Good) | Max Acceptable | Impact |
|--------|---------------|----------------|---------|
| **Screen Render** | < 16ms | < 50ms | Jank/frame drops |
| **Screen Load** | < 100ms | < 300ms | Perceived slowness |
| **Input Response** | < 16ms | < 50ms | Laggy typing |
| **Button Press** | < 50ms | < 100ms | Unresponsive feel |
| **Save/Network** | < 800ms | < 2000ms | Frustration point |
| **Animation Frame** | < 16ms | < 20ms | Visual jank |

### 🔍 Key Areas to Monitor
Based on our recent UI/UX enhancements:

1. **GuestHomeScreen.tsx**
   - Initial render time
   - Data loading (Load Cloud Card, Load Customer Insights)
   - Animation performance (floatAnim, pulseAnim)
   - Interaction responsiveness (buttons, cards)

2. **CustomerHeroCard.tsx**
   - Render performance
   - Press animation smoothness
   - Haptic feedback timing
   - Navigation response time

3. **GuestDesignScreen.tsx**
   - Form input responsiveness
   - Save operation performance
   - Product selection speed
   - Navigation delays

## 🛠️ Using the Performance Monitor Directly

If you prefer not to replace files, you can manually add performance monitoring to any component:

```typescript
import usePerformanceMonitor from '@/utils/performanceMonitor';

export function YourComponent() {
  const { measure, measureRender } = usePerformanceMonitor();
  
  // Measure component render
  measureRender('YourComponentName');
  
  // Measure specific operations
  const handlePress = async () => {
    await measure('Operation Name', async () => {
      // Your operation here
    });
  };
  
  // Measure input changes
  const handleInputChange = (value) => {
    measure('Input Change', async () => {
      setState(value);
    });
  };
  
  return <YourComponentContent />;
}
```

## 📈 Interpreting Results

### 🟢 Good Performance
- All metrics within "Target (Good)" column
- Animations feel smooth and natural
- Inputs respond instantly
- Screen transitions feel immediate

### 🟡 Needs Attention
- Some metrics in "Max Acceptable" range
- Occasional jank during animations
- Slight input delay noticeable
- Network operations approaching limits

### 🔴 Needs Immediate Fix
- Metrics exceed "Max Acceptable"
- Noticeable lag in UI interactions
- Frame drops during scrolling/animations
- Users report sluggishness

## 💡 Common Optimization Opportunities

Based on our codebase:

1. **Animation Optimization**
   - Ensure all animations use `useNativeDriver: true`
   - Check animation durations (should be 100-400ms)
   - Avoid layout-thrashing animations

2. **Input Responsiveness**
   - Debounce rapid-fire events (text input, scroll)
   - Use `useCallback` for event handlers
   - Avoid expensive operations in render

3. **Data Loading**
   - Implement caching for frequent requests
   - Show loading states appropriately
   - Consider optimistic UI updates

4. **Render Optimization**
   - Memoize expensive computations with `useMemo`
   - Prevent unnecessary re-renders with `React.memo`
   - Check for object/array creation in render functions

5. **Bundle Size**
   - Remove unused imports (we already fixed one!)
   - Code-split large components
   - Optimize image assets

## 🔧 Next Steps After Testing

1. **Identify Bottlenecks**: Find operations consistently exceeding thresholds
2. **Prioritize Fixes**: Focus on user-facing interactions first
3. **Implement Optimizations**: Apply techniques above
4. **Re-measure**: Verify improvements
5. **User Testing**: Get feedback on perceived performance

Remember: Perceived performance often matters more than raw benchmarks. Aim for interactions that feel instantaneous (<100ms feedback) and animations that feel natural and smooth.

## 📱 Testing Recommendations

- **Test on Real Devices**: Emulators/simulators can be misleading
- **Test Both Platforms**: iOS and Android have different performance characteristics
- **Test Network Conditions**: Try throttling to simulate real-world scenarios
- **Test Battery Impact**: Performance optimizations often improve battery life
- **Test Cold vs Warm Starts**: First launch vs subsequent launches

Start with the GuestHomeScreen (first impression) and GuestDesignScreen (conversion critical path) as these have the highest impact on user experience and business metrics.