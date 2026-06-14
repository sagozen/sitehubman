# Feature Additions — Recent Card, Photo Upload, Social Media, Card Back

## 2026-06-14: Four New Features

---

## 1. ✅ Studio: Fetch Recent Card

**Problem:** Studio screen showed generic card, not user's actual designed card.

**Solution:** Load customer's most recent card from database

### Changes:
- **File:** `src/features/guest/GuestStudioScreen.tsx`
- Fetches `loadCustomerCloudCard(user.id)` on mount
- Displays real card data: name, title, phone, email, QR
- Shows loading state while fetching
- Fallbacks: bio → cloud card → user auth → defaults

### Data Priority:
```
1. bioPage (profile data)
2. cloudCard (card design data)
3. user (auth data)
4. defaults ("Your Name", etc.)
```

### Result:
- ✅ Studio shows your latest card design
- ✅ Live preview with real data
- ✅ Loading indicator during fetch
- ✅ Consistent with customer home card

---

## 2. ✅ Profile Settings: Photo Upload

**Problem:** Profile settings had no way to upload/change profile photo.

**Solution:** Added camera badge + tap to upload

### Changes:
- **File:** `src/features/customer/CustomerProfileScreen.tsx`
- Added `pickImage()` function
- Integrated `expo-image-picker` + `uploadProfilePhoto` service
- Tap avatar → select from gallery → upload → save to bio
- Shows camera badge overlay on avatar
- Loading indicator while uploading

### UI Flow:
```
1. Tap avatar with camera badge
2. Select photo from gallery
3. Crop to 1:1 aspect ratio
4. Upload to Cloudinary
5. Save URL to bio_pages
6. Avatar updates instantly
```

### Result:
- ✅ Tap avatar to upload photo
- ✅ Camera badge indicator
- ✅ Loading state during upload
- ✅ Photo saved to bio and synced
- ✅ Displays uploaded photo or initial fallback

---

## 3. ✅ Edit Bio: More Social Media Fields

**Problem:** Only had WhatsApp, Instagram, Telegram — missing other platforms.

**Solution:** Added 5 more social media fields

### Added Fields:
1. **Website** — `website` (Globe icon)
2. **LinkedIn** — `linkedin` (Linkedin icon)
3. **Twitter** — `twitter` (Twitter icon)
4. **Facebook** — `facebook` (Facebook icon)
5. *(Telegram, Instagram, WhatsApp already existed)*

### Changes:
- **File:** `src/features/bio/EditBioScreen.tsx`
- Split into 2 sections: **Contact** + **Social Media**
- Contact: Email, WhatsApp, Website
- Social Media: Telegram, Instagram, Twitter, Facebook, LinkedIn
- All fields optional
- Data saved to `bio_pages` collection in Firestore

### Database Schema (bio_pages):
```ts
{
  email?: string;
  whatsapp?: string;
  website?: string;
  telegram?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
}
```

### Result:
- ✅ 3 contact fields
- ✅ 5 social media fields
- ✅ Clean iOS Settings-style layout
- ✅ All data saved to database
- ✅ Used in public bio page + tap events

---

## 4. ✅ Card Back View (Credit/Debit Card Style)

**Problem:** NFC cards only showed front — no back view like credit cards.

**Solution:** Created card back component + flippable wrapper

### New Components:

#### A. `NfcGlobalCardBack.tsx`
- Magnetic stripe (black bar at top)
- Large QR code center (150px)
- Card ID below QR
- NFC Global branding at bottom
- Instructions: "Tap to share" + "Compatible with all devices"
- Same gradient as front
- Compact mode support

#### B. `FlippableNfcCard.tsx`
- Wrapper component for flip animation
- Tap card → flip to back
- Spring animation (smooth rotate)
- Haptic feedback on flip
- Shows front by default
- Both sides responsive

### Usage:
```tsx
// Simple (front only)
<NfcGlobalCardFace {...props} />

// With back view (flippable)
<FlippableNfcCard
  fullName="John Doe"
  phone="+855 12 345 678"
  profileUrl="https://your.link/john"
  cardId="BC-NFC_A8F2"
/>
```

### Card Back Design:
```
┌─────────────────────────────────┐
│ [Black magnetic stripe]         │
│                                  │
│        ┌─────────────┐          │
│        │             │          │
│        │   QR CODE   │          │
│        │             │          │
│        └─────────────┘          │
│     SCAN TO VIEW PROFILE        │
│                                  │
│        BC-NFC_A8F2               │
│                                  │
│ [N] NFC GLOBAL                   │
│     Your identity. One tap away. │
│                                  │
│ • Tap to share your profile      │
│ • Compatible with all devices    │
└─────────────────────────────────┘
```

### Result:
- ✅ Professional card back design
- ✅ Magnetic stripe like credit cards
- ✅ Large scannable QR code
- ✅ Card ID for identification
- ✅ Flippable with smooth animation
- ✅ Haptic feedback on flip

---

## Implementation Summary

### Files Modified:
1. `src/features/guest/GuestStudioScreen.tsx` — Recent card fetch
2. `src/features/customer/CustomerProfileScreen.tsx` — Photo upload
3. `src/features/bio/EditBioScreen.tsx` — Social media fields

### Files Created:
1. `src/components/NfcGlobalCardBack.tsx` — Card back view
2. `src/components/FlippableNfcCard.tsx` — Flip animation wrapper

### Database Changes:
- **Added to `bio_pages`:**
  - `website?: string`
  - `linkedin?: string`
  - `twitter?: string`
  - `facebook?: string`

*Note: No migration needed — fields are optional.*

---

## Usage Examples

### 1. Studio with Recent Card
```tsx
// Auto-loads recent card
<GuestStudioScreen />
// Shows: Latest card design, real data, loading state
```

### 2. Profile with Photo Upload
```tsx
// Tap avatar to upload
<CustomerProfileScreen />
// Flow: Tap → Select → Crop → Upload → Save
```

### 3. Edit Bio with Social Media
```tsx
// All 8 fields available
<EditBioScreen />
// Contact: Email, WhatsApp, Website
// Social: Telegram, Instagram, Twitter, Facebook, LinkedIn
```

### 4. Flippable Card
```tsx
// Tap to flip
<FlippableNfcCard
  fullName="Sok Dara"
  phone="+855 12 345 678"
  email="dara@email.com"
  profileUrl="https://your.link/dara"
  cardId="BC-NFC_4F8A"
/>
```

---

## Testing Checklist

### Studio Recent Card:
- [ ] Card shows user's name from last design
- [ ] Card shows real phone/email
- [ ] QR code points to bio profile
- [ ] Loading state appears briefly
- [ ] Fallbacks work (no card → shows defaults)

### Profile Photo Upload:
- [ ] Camera badge visible on avatar
- [ ] Tap avatar opens gallery
- [ ] Select photo → crop works
- [ ] Upload progress shows
- [ ] Photo displays after save
- [ ] Bio page shows uploaded photo

### Edit Bio Social Media:
- [ ] All 8 fields visible
- [ ] Data saves to Firestore
- [ ] Public bio shows social links
- [ ] Icons render correctly
- [ ] Placeholder text clear
- [ ] Validation works (URL format)

### Card Back & Flip:
- [ ] Tap card → flips to back
- [ ] Haptic feedback on flip
- [ ] QR code scannable
- [ ] Card ID displays
- [ ] Magnetic stripe shows
- [ ] Flip animation smooth
- [ ] Tap back → returns to front

---

## Known Limitations

1. **Card Flip:** Web version may have CSS limitations (check `backfaceVisibility`)
2. **Photo Upload:** Requires camera/gallery permissions
3. **Social Media:** No validation for username format (add if needed)
4. **Card Back:** QR size fixed (150px) — may need responsive sizing

---

## Next Steps (Optional)

### Enhancements:
- [ ] Add "Flip" hint on first card view
- [ ] Support NFC write on card back
- [ ] Add social media validation (username format)
- [ ] Photo compression before upload
- [ ] Batch upload multiple photos
- [ ] Card back customization (colors, branding)

### Analytics:
- [ ] Track card flip rate
- [ ] Monitor photo upload success rate
- [ ] Track which social fields are most used
- [ ] QR scan events from card back

---

Last updated: 2026-06-14
