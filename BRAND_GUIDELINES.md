# Sitehubman — Brand Guidelines & Design Architecture

**Version**: 1.0  
**Target Platform**: iOS / Android Mobile-Only  
**Design Standard**: Apple Human Interface Guidelines (HIG) + Dark Slab Architecture

---

## 1. Brand Philosophy
Sitehubman combines Apple's restrained elegance with the tactile utilitarianism of Stripe and Linear. 
The product focuses on frictionless NFC digital identity and business transactions.

---

## 2. Color Hierarchy & Palette

| Token Role | Hex Code | Purpose & Usage |
|:---|:---|:---|
| **Canvas Background** | `#000000` / `#0D0D0E` | Pure dark deep immersion. Zero bright flood overlays. |
| **Primary Slab Surface** | `#242424` | Elevated bento cards, tab panels, and list rows. |
| **Raised Slab Surface** | `#2C2C2C` | Modals, bottom sheets, search fields, floating buttons. |
| **Accent Primary** | `#799A85` | Eucalyptus Sage. Used strictly for success badges, selection pills, and key CTAs. |
| **Text Primary (Ink)** | `#FFFFFF` | Headlines, primary button labels, high-visibility values. |
| **Text Muted** | `rgba(255,255,255,0.65)` | Subtitles, helper text, and secondary timestamps. |
| **Dividers & Strokes** | `rgba(255,255,255,0.08)` | Ultra-fine 1px borders. Never use heavy solid borders or muddy drop shadows. |

> **Strict Rule**: No saturated primary blues (`#007AFF`) or neon gradients. The brand accent is strictly `#799A85`.

---

## 3. Typography Rules

* **Primary Font Family**: San Francisco Pro Display (`SF-Pro-Display`)
  - `SF-Pro-Display-Regular` (Body copy, descriptions, navigation subtitles)
  - `SF-Pro-Display-Medium` (Form inputs, button labels, pill tabs)
  - `SF-Pro-Display-Semibold` (Section titles, modal headers, card titles)
  - `SF-Pro-Display-Bold` (Metrics, hero headers)
* **Body Line Height**: Minimum 1.35x font size for clean readability.
* **Tracking / Kerning**: `-0.2px` on headlines >= 20pt for refined Apple feel.

---

## 4. Logo Clear Space & Display Standards

* **Clear Space Rule**: Maintain minimum padding equal to 50% of the logo height on all four sides.
* **Minimum Display Dimensions**:
  - App Icon: 60pt × 60pt (iOS home screen), 40pt × 40pt (Spotlight).
  - Header In-App Logo: Minimum height 24pt, maximum 32pt.
* **Forbidden Logo Practices**:
  - Do NOT distort, skew, or apply drop shadows to the logo mark.
  - Do NOT place the white logo on backgrounds lighter than 40% gray without a dark badge container.

---

## 5. Micro-Interactions & Haptic Feedback Hierarchy

| Interaction | Animation Timing | Haptic Trigger |
|:---|:---|:---|
| **Button Tap** | 110ms press scale (0.975), spring release | `Haptics.light()` or `Haptics.confidentClick()` |
| **NFC Tap / Card Read** | 220ms chime + badge ripple | `Haptics.success()` + `SoundFeedback.playNfcTap()` |
| **Save / Success Action**| 180ms morphing checkmark | `Haptics.softConfirmation()` + `SoundFeedback.playSuccess()` |
| **Card Flip / Rotate** | 300ms continuous spring | `HapticPattern.flip()` |
| **Error / Scan Interrupted**| 200ms double pulse | `Haptics.error()` + `SoundFeedback.playError()` |

---

## 6. Layout Grid & Container Constraints

* **Horizontal Padding**: Standard 20pt (`paddingHorizontal: 20`).
* **Tablet / Landscape Max Width**: Always constraint layout containers to `maxWidth: 640` with `alignSelf: 'center'` to prevent distorted wide stretching.
* **Touch Targets**: Minimum 48dp × 48dp on all interactive elements via `hitSlop`.
