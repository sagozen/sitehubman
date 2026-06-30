# Performance Testing Instructions for SiteHub Man

## Quick Start Guide

Follow these steps to test performance and identify slow pages that impact user experience:

### 1. Start the Development Server
```bash
# Use one of these based on your setup
npm run start:web      # For web testing
npm run start:tunnel   # For tunnel (external access)
npm run start:clear    # Clear cache first if experiencing issues
```

### 2. Instrument Key Screens (Already Done)
We've added performance monitoring capabilities. To use them:

**Option A: Manual Instrumentation (Recommended for Screens)**
In any screen file (e.g., `CustomerProfileScreen.tsx`), add:
```typescript
import usePerformanceMonitor from '@/utils/performanceMonitor';

export function YourScreen() {
  const { measure, measureRender, getMetrics } = usePerformanceMonitor();
  
  // Measure render time
  measureRender('YourScreenName');
  
  // Measure specific operations
  const handlePress = async () => {
    await measure('Operation Name', async () => {
      // Your operation here
    });
  };
}
```

**Option B: HOC Wrapper (For Components)**
```typescript
import { wrapComponentWithPerf } from '@/utils/performanceMonitor';

const MonitoredComponent = wrapComponentWithPerf(YourComponent, 'ComponentName');
```

### 3. Test User Flows
As a customer would experience the app:

1. **Login Flow**
   - Enter credentials
   - Wait for home screen to load
   
2. **Main Navigation**
   - Home screen → Profile screen
   - Home screen → Cards section
   - Home screen → Notifications
   - Profile → Edit Bio
   - Card creation flow

3. **Interaction Testing**
   - Tap cards to set as primary
   - Try to upload profile picture
   - Toggle settings/switches
   - Scroll through lists

### 4. Monitor Performance Metrics

#### Console Output (Development Only)
Look for lines like:
```
[PERF] CustomerProfileScreen render: 124.50ms
[PERF] Load Cloud Card: 342.20ms
[PERF] Handle Card Press: 85.30ms
```

#### Performance Thresholds
| Metric | Good | Acceptable | Needs Attention |
|--------|------|------------|-----------------|
| Screen Render | < 16ms | 16-50ms | > 50ms |
| Screen Load | < 100ms | 100-300ms | > 300ms |
| Network Request | < 300ms | 300-800ms | > 800ms |
| Touch Response | < 50ms | 50-100ms | > 100ms |
| Animation Frame | < 16ms | 16-20ms | > 20ms (jank) |

### 5. Focus Areas Based on Our Recent Work

#### Animation Performance Check
Check these files for potential bottlenecks:
- `src/utils/motion.ts` - Ensure `useNativeDriver: true` where applicable
- `src/features/guest/GuestHomeScreen.tsx` - Float/pulse animations
- `src/features/customer/components/CustomerHeroCard.tsx` - Press/scale animations

#### Haptics Performance
- `src/utils/haptics.ts` - Verify all haptic calls use `safe()` wrapper
- Check that `setTimeout` delays are short (<200ms) and non-blocking

#### Theme/Rendering Performance
- `src/design-system/` - Ensure styles are memoized where appropriate
- `src/components/AppText.tsx` - Verify typography lookups don't cause re-renders
- Context providers (`usePreferences`, `useAuth`, `useBioPage`) - check for unnecessary re-renders

### 6. Specific Tests to Run

#### Test 1: App Launch Time
1. Close app completely
2. Open app and time to first visible screen
3. Target: < 1500ms (cold start), < 800ms (warm start)

#### Test 2: Screen Transition Performance
1. Navigate from Home → Profile
2. Measure time from tap to fully rendered profile screen
3. Target: < 300ms

#### Test 3: List Scrolling Performance
1. Scroll through a long list (e.g., notifications, card carousel)
2. Watch for dropped frames or jank
3. Target: Maintain 60fps during scroll

#### Test 4: Interaction Response Time
1. Tap a button or card
3. Measure time from touch to visual feedback
4. Target: < 100ms for immediate feedback

### 7. Using Expo's Built-in Tools

#### Performance Monitor (In-App)
1. Shake device or press ⌘+D / Ctrl+M
2. Select "Performance Monitor"
3. Watch:
   - **JS Frame Rate** (should stay near 60fps)
   - **UI Frame Rate** (should stay near 60fps)
   - **JS Spike** frequency (indicates expensive JS work)

#### Flipper Plugins (If Configured)
- **React DevTools**: Component re-renders
- **Network Inspector**: API timing
- **Profiler**: React render times
- **React Native Performance**: Detailed frame analysis

### 8. Common Performance Issues to Check

#### Based on Our Recent Changes:
1. **Unnecessary Re-renders**
   - Check if `usePreferences`, `useBioPage`, `useAuth` are causing excessive re-renders
   - Verify context values are memoized appropriately

2. **Animation Issues**
   - Confirm `useNativeDriver: true` on all animations in:
     - `useFloatAnimation()` 
     - `usePulseAnimation()`
     - `usePressAnimation()`
   - Check animation durations are reasonable (100-400ms)

3. **Image Loading**
   - Verify images are properly sized (not loading huge then scaling down)
   - Check caching is working
   - Look for `resizeMode` optimizations

4. **JavaScript Thread Work**
   - Look for expensive calculations in render functions
   - Check for object/array creation in render (should be memoized)
   - Verify `useCallback`/`useMemo` are used appropriately

### 9. Optimization Priorities

If you find performance issues, address in this order:

1. **UI Thread Blocking** (>16ms work on UI thread)
   - Fix animations not using `useNativeDriver`
   - Move heavy computations off UI thread
   - Optimize layout-intensive operations

2. **JS Thread Blocking** (>16ms work on JS thread)
   - Memoize expensive calculations
   - Debounce rapid-fire events (like scroll)
   - Optimize render functions

3. **Network Delays**
   - Implement caching
   - Optimize payload sizes
   - Use pagination for large lists

4. **Memory Issues**
   - Check for memory leaks in navigation
   - Optimize image caching
   - Clean up listeners/subscriptions

### 10. Validation After Fixes

After making optimizations:
1. Re-run the same user flows
2. Verify metrics are now within target ranges
3. Test on both iOS and Android simulators/devices
4. Test on physical devices if possible (different performance characteristics)
5. Verify no regression in functionality

### 11. Example: What to Look For in Our Code

#### In `CustomerHeroCard.tsx` (we worked on this):
- ✅ `useFloatAnimation`, `usePulseAnimation`, `usePressAnimation` should use `useNativeDriver: true`
- ✅ Press animations use `friction: 6` (reasonable)
- ✅ Haptics use short delays in `HapticTap` wrapper
- ✅ Animations are driven by `Animated.View` with proper styling

#### In `GuestHomeScreen.tsx` (we worked on this):
- ✅ Float/pulse animations use `useNativeDriver: true`
- ✅ Gradient animations should be checked for performance
- ✅ Haptic feedback on press events uses short delays

#### In `utils/motion.ts`:
- ✅ Animation durations are in appropriate ranges:
  - `MotionDuration.quick = 120ms`
  - `MotionDuration.base = 220ms` 
  - `MotionDuration.slow = 320ms`
- ✅ Easing functions are optimized

### 12. Final Verification

Once you've identified and fixed performance issues:
1. Run through complete user journeys
2. Verify all metrics are in acceptable ranges
3. Test on both platforms (iOS/Android)
4. Check that the subjective experience feels smooth and responsive
5. Confirm no functionality was broken during optimization

Remember: Perception of performance matters as much as raw numbers. Aim for interactions that feel instantaneous (<100ms feedback) and animations that feel smooth and natural.