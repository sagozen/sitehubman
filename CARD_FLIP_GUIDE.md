# How to See Card Back — User Guide

## 🎴 Tap to Flip!

All NFC cards in the app now have a **back view** — just like credit/debit cards!

---

## Where Cards are Flippable

### ✅ Studio (`/studio`)
- Shows your designed card
- **Tap card → Flips to back**
- See QR code, card ID, magnetic stripe

### ✅ Customer Home (Home tab)
- Your main NFC card
- **Tap card → Flips to back**
- Full-width card with flip animation

### ✅ Customer Profile (Profile tab)
- Your profile card
- **Tap card → Flips to back**
- Same card as home, flippable

---

## How to Flip

### Simple:
1. Find the NFC card on screen
2. **Tap anywhere on the card**
3. Card flips to show back
4. **Tap again** to flip back to front

### Visual Cue:
- Look for hint: **"💡 Tap card to flip"** (Studio screen)
- Card has subtle animation on load
- Haptic feedback when you tap

---

## What's on the Back?

### Credit Card Style Design:
```
┌─────────────────────────────────┐
│ ▓▓▓ Black Magnetic Stripe ▓▓▓  │  ← Like real cards
│                                  │
│        ┌─────────────┐          │
│        │   [QR CODE] │          │  ← Scannable QR
│        │             │          │
│        └─────────────┘          │
│     SCAN TO VIEW PROFILE        │
│                                  │
│        BC-NFC_A8F2               │  ← Your card ID
│                                  │
│ [N] NFC GLOBAL                   │  ← Branding
│     Your identity. One tap away. │
│                                  │
│ • Tap to share your profile      │  ← Instructions
│ • Compatible with all devices    │
└─────────────────────────────────┘
```

### Elements:
1. **Magnetic stripe** — Black bar at top (like credit cards)
2. **QR code** — Large scannable code (150×150px)
3. **Card ID** — Your unique identifier (e.g., BC-NFC_A8F2)
4. **Branding** — NFC Global logo + tagline
5. **Instructions** — How to use the card

---

## Animation Details

### Smooth Flip:
- **Spring animation** (not instant)
- **3D rotation** effect
- **Haptic feedback** on tap
- **No layout shift** (both sides same size)

### Performance:
- 60 FPS animation
- ~300ms duration
- Native driver (smooth on all devices)

---

## Technical Details

### Components Used:
```tsx
<FlippableNfcCard
  fullName="John Doe"
  phone="+855 12 345 678"
  email="john@example.com"
  profileUrl="https://your.link/john"
  cardId="BC-NFC_A8F2"
/>
```

### Files:
- `FlippableNfcCard.tsx` — Flip wrapper
- `NfcGlobalCardFace.tsx` — Front design
- `NfcGlobalCardBack.tsx` — Back design

---

## Testing

### Quick Test:
1. Open app
2. Go to **Studio** screen
3. See your NFC card
4. **Tap the card**
5. Should flip to show back with QR code
6. **Tap again** to flip back

### Expected:
- ✅ Smooth 3D rotation
- ✅ Haptic vibration on tap
- ✅ QR code visible and scannable
- ✅ Card ID shows your unique ID
- ✅ No flickering or glitches

---

## Screenshots

### Front (Default):
```
┌─────────────────────────────────┐
│ [N] NFC GLOBAL    [✓ Verified]  │
│     Verified identity            │
│                                  │
│  JOHN DOE                        │
│  Product Designer / Snap Tap     │
│                                  │
│  📱 +855 12 345 678              │
│  ✉️  john@example.com            │
│  🌐 yoursite.com          [QR]   │
└─────────────────────────────────┘
```

### Back (After Tap):
```
┌─────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                  │
│           [QR CODE]              │
│      SCAN TO VIEW PROFILE        │
│        BC-NFC_A8F2               │
│                                  │
│  [N] NFC GLOBAL                  │
│      Your identity. One tap.     │
└─────────────────────────────────┘
```

---

## Why Card Back?

### Real Card Experience:
- Mimics physical credit/debit cards
- Professional and familiar
- QR code on back (like some bank cards)

### Practical Use:
- **Share QR code** without giving physical card
- **Show card ID** for verification
- **Professional presentation** in meetings
- **Backup contact method** (scan QR if NFC fails)

---

## Future Enhancements

### Planned:
- [ ] Auto-flip on QR share tap
- [ ] Flip all cards in carousel
- [ ] Customize back design (colors, logo)
- [ ] Print-ready back design (PDF export)
- [ ] NFC write instructions on back
- [ ] Signature strip (like credit cards)

---

## Troubleshooting

### Card Not Flipping?
1. Make sure you're tapping the card itself (not buttons below)
2. Check you're on Studio, Home, or Profile screen
3. Try force-closing and reopening app
4. Update to latest version

### Animation Janky?
1. Close other apps (free up memory)
2. Restart device
3. Enable "Reduce Motion" in phone settings (simpler animation)

### QR Code Not Scanning?
1. Make sure you have a profile URL set
2. Check Edit Bio → save a public slug
3. QR appears after profile is published
4. Try flipping card in better lighting

---

## Pro Tips

### 1. Quick QR Share:
- Flip card to back
- Screenshot the QR code
- Share via WhatsApp/Telegram

### 2. Verification:
- Show card back to staff
- Card ID proves authenticity
- QR links to your verified profile

### 3. Meeting Presentations:
- Flip to back during video calls
- Others can scan QR code
- No physical card needed

---

Last updated: 2026-06-14
