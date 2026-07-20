# Codex Design Language - Sitehubman App

All pages in this React Native app must follow the clean, premium layout rules learned from the **Guest Home Screen** to maintain visual excellence.

## 1. Unified Deep Dark Canvas
* **Rule**: Set the canvas background of all screens to solid pure black (`#000000`).
* **Visual Backdrop**: Never use bright solid overlays. Background decorations (like subtle gradients or logo overlays) must be set to `opacity: 0.1` and overlayed with `rgba(0,0,0,0.45)` to keep them dark, elegant, and low-contrast.

## 2. Layout Structure & Responsive Constraints
* **Paddings & Gaps**: Maintain standard screen padding of `paddingHorizontal: 20` and standard block gaps of `16` or `20`.
* **Tablet/Landscape Scale Limit**: Always wrap screen content layouts in a container specifying:
  ```typescript
  content: {
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  }
  ```
  This prevents cards and text inputs from stretching excessively on wider screens.

## 3. High-Contrast Border Cards (No Drop Shadows)
* **Rule**: To keep GPU rendering at 60fps on mobile while looking premium, avoid heavy drop shadows.
* **Card Style**: Card components should be styled with a deep charcoal background and a fine, translucent border:
  ```typescript
  card: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
  }
  ```

## 4. Image-Driven Bento Modules
* **Rule**: Action menus and step guides must be rendered as bento-style cards rather than simple rows:
  - Left side: Title, small high-contrast icons, and descriptions using regular typography.
  - Right side: Clean, high-end 3D PNG illustrations popping out of the card.

## 5. Black & White Themed Elements
* **Rule**: The primary action buttons must be styled in high-contrast solid black-and-white (`variant="dark"`):
  - Black background with a white border and white text, or solid white background with black text.
  - Avoid using clunky default solid green or blue gradients on buttons, keeping checkout and submission CTA elements sleek and premium.

## 6. Typography Constraint
* **Rule**: In studio and guide views, prioritize regular typography weights. Keep fonts locked to `SF-Pro-Display-Regular` to ensure layout elegance and high readability.
