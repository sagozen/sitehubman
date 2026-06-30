# Performance Testing Guide for SiteHub Man

This guide explains how to measure and identify performance bottlenecks in your React Native/Expo application.

## Overview

After fixing the bundling issues that prevented `npx expo start` from working, you can now focus on runtime performance. This guide will help you:

1. Measure render times and interaction latencies on each screen
2. Identify which pages/screens are slow and impacting user experience
3. Use the collected data to optimize performance

## Step 1: Add Performance Monitoring Utilities

We've created a performance monitoring utility at:
`src/utils/performanceMonitor.ts`

This provides:
- `usePerformanceMonitor` hook for manual measurements
- `measureRender` for automatic component render timing
- `wrapComponentWithPerf` HOC for automatic wrapping
- Console logging in development mode

## Step 2: Instrument Key Screens

To test performance on each page, add performance monitoring to your main screens. Here's how:

### Option A: Using the Hook (Recommended for Screens)

In your screen component (e.g., `CustomerProfileScreen.tsx`):

```typescript
import usePerformanceMonitor from '@/utils/performanceMonitor';

export function CustomerProfileScreen() {
  const { measure -----------------------------------------------------------------------
  // 1. INITIALIZE PERFORMANCE MONITOR
  // -----------------------------------------------------------------------
  const { measure, measureRender, getMetrics, clearMetrics } = usePerformanceMonitor();

  // Measure initial render time
  measureRender('CustomerProfileScreen');

  // Measure data loading operations
  useEffect(() => {
    if (user?.id) {
      measure('Load Cloud Card', async () => {
        await loadCustomerCloudCard(user.id).then(setCloudCard).catch(() => null);
      });
    }
  }, [user?.id]);

  // Measure specific interactions
  const handleCardPress = useCallback(async (card: CarouselCard) => {
    await measure('Handle Card Press', async () => {
      // ... existing logic ...
    });
  }, [updatePreferences]);

  // ... rest of your component
}
```

### Option B: Using HOC Wrapper (For Simple Components)

```typescript
import { wrapComponentWithPerf } from '@/utils/performanceMonitor';

// Wrap any component to automatically measure its render time
const MonitoredCardCarousel = wrapComponentWithPerf(CardStackCarousel, 'CardStackCarousel');
```

## Step 3: Run the Application and Collect Data

1. Start your Expo development server:
   ```bash
   npm run start:web    # or start:tunnel/start:clear based on your setup
   ```

2. Navigate through the app as a customer would:
   - Login
   - Visit Home Screen
   - Navigate to Profile
   - Visit Cards section
   - Try creating a card
   - Check notifications, etc.

3. Watch the console for performance logs:
   ```
   [PERF] CustomerProfileScreen render: 124.50ms
   [PERF] Load Cloud Card: 342.20ms
   [PERF] Handle Card Press: 85.30ms
   ```

## Step 4: Analyze Results

### Performance Thresholds to Watch For:

| Metric Type | Good (ms) | Acceptable (ms) | Needs Improvement (ms) |
|-------------|-----------|-----------------|------------------------|
| **Component Render** | < 16ms | 16-50ms | > 50ms (causes dropped frames) |
| **Screen Load** | < 100ms | 100-300ms | > 300ms (noticeable delay) |
| **Network Request** | < 300ms | 300-800ms | > 800ms (poor UX) |
| **Interaction Response** | < 50ms | 50-100ms | > 100ms (feels sluggish) |

### What to Look For:

1. **Consistently high render times** (>50ms) - indicates expensive render logic
2. **Long data loading times** (>300ms) - may need caching or optimization
3. **Slow interactions** (>100ms) - check for heavy computations in event handlers
4. **Frame drops** - if JS thread work exceeds 16ms per frame

## Step 5: Advanced Profiling Tools

For deeper analysis, use these built-in tools:

### Expo Dev Menu (while app is running):
- Shake device or press ⌘+D (iOS simulator) / Ctrl+M (Android)
- Select "Performance Monitor"
- Watch for:
  - JS Frame Rate (should stay near 60fps)
  - UI Frame Rate (should stay near 60fps)
  - JS Spike frequency (indicates expensive operations)

### Flipper Plugins (if using):
- **React DevTools** - Component re-renders
- **Network Inspector** - API call timing
- **Profiler** - React render times
- **React Native Performance** - Frame timing

### Console-Based Profiling:
Add this to your `performanceMonitor.ts` for more detailed tracking:

```typescript
// Add to usePerformanceMonitor hook
const logFrameRate = useCallback(() => {
  const now = performance.now();
  const fps = 1000 / (now - lastFrameTime);
  lastFrameTime = now;
  
  if (fps < 50) { // Below 50fps is concerning
    console.warn(`[PERF] Low FPS: ${fps.toFixed(1)}`);
  }
}, []);

// Call this in a requestAnimationFrame loop if needed
```

## Step 6: Common Optimization Areas (Based on Our Previous Work)

From the UI/UX enhancements we implemented, check these areas:

1. **Animations** (`src/utils/motion.ts`):
   - Ensure all animations use `useNativeDriver: true`
   - Verify durations are reasonable (100-300ms typical)
   - Check for layout-thrashing animations

2. **Haptics** (`src/utils/haptics.ts`):
   - Confirm all haptic calls use `safe()` wrapper
   - Ensure `setTimeout` delays are short (<200ms)
   - Verify no blocking operations in haptic callbacks

3. **Theme/Styling** (`src/design-system/`):
   - Check that style objects are memoized (use `useMemo`)
   - Verify theme context doesn't cause unnecessary re-renders

4. **Image Loading**:
   - Ensure proper image caching
   - Check for oversized images being scaled down
   - Verify lazy loading where appropriate

## Step 7: Iterative Improvement Process

1. **Baseline**: Measure current performance on key user flows
2. **Identify**: Find the slowest operations (>100ms threshold)
3. **Optimize**: Focus on high-impact areas first
4. **Measure**: Verify improvements
5. **Repeat**: Continue until all critical paths meet targets

## Example Optimization Targets

Based on our recent UI enhancements, pay special attention to:

- **CustomerHeroCard.tsx**: Check float/pulse animation performance
- **GuestHomeScreen.tsx**: Verify gradient background and animation performance
- **Any screen using AppText**: Ensure typography lookups don't cause re-renders
- **Navigation transitions**: Monitor screen change performance

## Troubleshooting High Response Times

If you find specific screens/actions are slow:

1. **Isolate the problem**: Use `measure()` to time specific sections
2. **Check for expensive operations** in render:
   - Object/array creation in render
   - Expensive calculations without `useMemo/useCallback`
   - Unnecessary context consumers
3. **Review animation configurations**:
   - Are animations running on JS thread instead of native?
   - Are durations excessively long?
4. **Check image handling**:
   - Are images properly sized/resized?
   - Is caching being used effectively?

## Next Steps

1. Instrument 3-5 key customer-facing screens using the patterns above
2. Run through typical user journeys and collect performance data
3. Identify any operations exceeding 100ms (perceptible delay threshold)
4. Optimize the worst offenders first
5. Re-measure to verify improvements

Remember: The goal is to maintain 60fps (16ms/frame) for smooth interactions. Any work on the JS thread that consistently exceeds 16ms will cause dropped frames and perceptible lag.