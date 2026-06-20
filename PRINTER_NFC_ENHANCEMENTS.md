# Printer NFC Screen Enhancement Plan

## Current State (/printer/nfc/[jobId])

**Good:**
- ✅ Clean 4-step workflow (Preview → Print → Write → Verify)
- ✅ Visual step indicators with icons
- ✅ Animated NFC tap zone
- ✅ Label preview before print
- ✅ Print failure handling
- ✅ URL verification

**Issues:**
- ⏱️ Too many taps — 5 button presses per card
- 🐌 Slow for batch production (10+ cards/day)
- 📊 No real-time stats (cards/hour, success rate)
- ⌨️ No keyboard shortcuts for printers
- 🔄 No bulk mode for same design

---

## Enhancement Ideas

### 1. **Quick Mode (One-Tap Flow)**
**Problem:** 5 button presses per card is slow.

**Solution: Auto-advance workflow**
```
Print → Write → Verify (auto-advance)
Only confirm failures, not successes
```

**Toggle:**
```tsx
// Header: Quick Mode switch
<Pressable onPress={toggleQuickMode}>
  <AppIcon name={quickMode ? 'Zap' : 'Settings'} />
  <AppText>{quickMode ? 'Quick' : 'Manual'}</AppText>
</Pressable>
```

**Flow:**
1. Tap "Start Print"
2. Auto-detect print completion (5s timer)
3. Auto-write NFC after print
4. Auto-verify after write
5. Only stop on errors

**Benefit:** 5 taps → 1 tap per card ⚡

---

### 2. **Live Stats Dashboard**
**Problem:** No visibility into production speed.

**Solution: Real-time metrics card**
```tsx
<View style={styles.statsCard}>
  <Stat label="Today" value="47 cards" icon="CheckCircle" />
  <Stat label="This hour" value="8 cards" icon="Clock" />
  <Stat label="Success" value="98%" icon="TrendingUp" />
  <Stat label="Avg time" value="42s" icon="Zap" />
</View>
```

**Data source:**
- `printer_jobs` collection
- Filter by `assignedPrinter: user.id`
- Filter by `updatedAt >= today 00:00`
- Calculate success rate from `stage: 'completed'`

**Visual:** Horizontal scroll, 4 stat pills

---

### 3. **Keyboard Shortcuts (Power User)**
**Problem:** Touch input is slow for repetitive actions.

**Solution: USB barcode scanner + keyboard**
```
Space → Start Print / Next step
V     → Verify Tap
F     → Mark Print Failed
S     → Skip to next job
R     → Reprint current
Q     → Queue view
```

**Implementation:**
```tsx
import { useEffect } from 'react';
import { Keyboard } from 'react-native';

useEffect(() => {
  const listener = Keyboard.addListener('keyPress', (e) => {
    if (e.key === ' ') handleNextStep();
    if (e.key === 'v') handleVerify();
    if (e.key === 'f') handlePrintFailed();
    // etc...
  });
  return () => listener.remove();
}, []);
```

**UI Hint:**
```tsx
<View style={styles.shortcutHint}>
  <AppText>Space: Next</AppText>
  <AppText>V: Verify</AppText>
  <AppText>F: Failed</AppText>
</View>
```

---

### 4. **Batch Mode (Same Design)**
**Problem:** Printing 10 identical cards = 10 separate workflows.

**Solution: Batch counter**
```tsx
<View style={styles.batchMode}>
  <AppText>Batch: {currentCard} / {totalCards}</AppText>
  <Pressable onPress={handleNextCard}>
    <AppText>Next Card →</AppText>
  </Pressable>
</View>
```

**Flow:**
1. Select multiple jobs with same `cardDesign`
2. Enter batch mode
3. Auto-load next job after QA
4. Show progress: "3 / 10 cards encoded"

**Benefit:** Save 15 taps per batch

---

### 5. **Visual Improvements**

#### A. Timer Display
```tsx
// Show elapsed time per stage
<AppText style={styles.timer}>
  ⏱️ {formatDuration(elapsedMs)}
</AppText>
```

#### B. Success Confetti
```tsx
// After verification
{verified && <ConfettiCannon />}
```

#### C. Sound Feedback
```tsx
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

// Success beep after verify
await Audio.Sound.createAsync(require('@/assets/success.mp3'));
await Haptics.notificationAsync('success');
```

#### D. Card Preview Flip
```tsx
// Show front/back card preview
<Animated.View style={{
  transform: [{ rotateY: flip ? '180deg' : '0deg' }]
}}>
  <NfcGlobalCardFace />
</Animated.View>
```

---

### 6. **Error Recovery**

#### A. Auto-Retry Failed Writes
```tsx
// Retry NFC write 3x before marking failed
let retries = 0;
while (retries < 3) {
  try {
    await writeNfcUrl(url);
    break;
  } catch {
    retries++;
    await delay(1000);
  }
}
```

#### B. Print Quality Check
```tsx
// Camera snap + AI check (future)
<Pressable onPress={handlePhotoCheck}>
  <AppIcon name="Camera" />
  <AppText>Photo QA</AppText>
</Pressable>
```

---

### 7. **Queue Integration**

#### A. Auto-Load Next Job
```tsx
// After QA complete, auto-load next job
if (verified) {
  const nextJob = jobs.find(j => j.stage === 'received');
  if (nextJob) {
    router.replace(`/printer/nfc/${nextJob.id}`);
  }
}
```

#### B. Swipe Navigation
```tsx
// Swipe left/right to switch jobs
<GestureDetector gesture={swipe}>
  <View>{/* current job */}</View>
</GestureDetector>
```

---

## Implementation Priority

### Phase 1: Quick Wins (1 hour)
- [ ] Add live stats card
- [ ] Show elapsed timer per stage
- [ ] Success haptic feedback
- [ ] Auto-load next job button

### Phase 2: Speed Boost (2 hours)
- [ ] Quick mode toggle
- [ ] Auto-advance workflow
- [ ] Keyboard shortcuts
- [ ] Batch counter UI

### Phase 3: Polish (3 hours)
- [ ] Success confetti
- [ ] Sound effects
- [ ] Card flip animation
- [ ] Swipe navigation

### Phase 4: Advanced (Future)
- [ ] Batch mode (multi-job select)
- [ ] Camera QA check
- [ ] Auto-retry failed writes
- [ ] USB barcode scanner support

---

## Enhanced Screen Layout

```
┌─────────────────────────────────────┐
│ ← Back   Job #4829   [Quick Mode ⚡]│
│ Preview → Print → Write → Verify     │
├─────────────────────────────────────┤
│                                      │
│   Today: 47 │ Hour: 8 │ Rate: 98%   │
│                                      │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │   [NFC Tap Zone Animation]   │   │
│  │                              │   │
│  │      Write NFC to card       │   │
│  │    ⏱️ Elapsed: 1:23          │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│  [Label Preview Card]                │
│   Customer: John Doe                 │
│   Card: BC-NFC_A8F2                  │
│   URL: your.link/john                │
│                                      │
│  ┌────────────────────────────┐     │
│  │     [Write NFC] Space       │     │
│  └────────────────────────────┘     │
│                                      │
│  Shortcuts: V=Verify F=Failed        │
│  Batch: 1 / 1 cards                  │
│                                      │
└─────────────────────────────────────┘
```

---

## Expected Results

### Current Flow
- **Time per card:** ~2-3 minutes
- **Taps per card:** 5 buttons
- **Cards per hour:** ~20-30

### With Enhancements
- **Time per card:** ~30-45 seconds (Quick Mode)
- **Taps per card:** 1-2 buttons
- **Cards per hour:** ~80-120 ⚡

**4x faster production** 🚀

---

## Code Structure

```
/printer/nfc/
├── [jobId].tsx                    // Route
└── /features/printer/screens/
    ├── PrinterNfcJobScreen.tsx    // Current (1052 lines)
    └── components/
        ├── NfcStatsCard.tsx       // New: Live stats
        ├── NfcQuickMode.tsx       // New: Auto-advance
        ├── NfcBatchCounter.tsx    // New: Batch UI
        └── NfcShortcutHints.tsx   // New: Keyboard help
```

---

## Database Changes (Optional)

### New Collection: `printer_stats`
```ts
{
  printerId: string;
  date: string; // YYYY-MM-DD
  cardsCompleted: number;
  cardsFailed: number;
  avgTimeSeconds: number;
  totalTimeSeconds: number;
}
```

**Usage:** Show daily/weekly printer leaderboard

---

Last updated: 2026-06-14
