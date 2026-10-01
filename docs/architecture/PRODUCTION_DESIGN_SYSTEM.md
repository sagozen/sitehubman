# Production Design System
## Ship-Ready · Manufacturing Grade · No Concepts

**Inspired by:** Apple Wallet, Linear, Stripe Dashboard, Arc Browser, Nothing, Tesla UI, Monzo

---

## Design Philosophy

### What We're NOT Building
❌ Dribbble concept with glows and gradients
❌ Behance shot with unrealistic spacing
❌ Futuristic UI with sci-fi effects
❌ Centered everything with decorative icons
❌ Over-designed components that look illustrated

### What We ARE Building
✅ Production app that ships next month
✅ Manufacturing-grade components
✅ Real product proportions and spacing
✅ Asymmetric layouts with generous space
✅ Typography-first, minimal icons (70% reduction)
✅ Clear hierarchy, subtle shadows, real materials
✅ Usability before aesthetics
✅ Looks manufactured, not illustrated

---

## Core Principles

### 1. Typography First, Decoration Second

**Primary Typeface:** SF Pro (iOS) / Inter (Android/Web)
**Hierarchy through size, not decoration**

```
Display:  28px / -0.5 tracking / 600 weight
Title:    20px / -0.3 tracking / 600 weight
Body:     15px / -0.1 tracking / 400 weight
Detail:   13px /  0.0 tracking / 400 weight
Caption:  11px /  0.1 tracking / 500 weight (uppercase)
```

**Rules:**
- No decorative text effects
- No gradients on text
- No shadows on text
- 90% of UI is black/gray text on white/gray surfaces
- Color only for status and action

### 2. Reduce Icon Usage by 70%

**Before (Typical):** Icon + Label everywhere
**After (Production):** Text-only unless absolutely necessary

**Icons ONLY for:**
- System actions (back, close, more)
- Universal symbols (tap, scan, share)
- Status indicators (success, error, pending)

**Never use icons for:**
- Every menu item (text is clearer)
- Decorative purposes
- "Making it look designed"

### 3. Asymmetric Layouts

**Linear-style composition:**
```
┌─────────────────────────────┐
│ Title              Action   │  ← Left-aligned title, right action
│                             │
│ Card                        │  ← Asymmetric card placement
│ ┌──────────────┐            │
│ │              │            │
│ │              │            │
│ └──────────────┘            │
│                             │
│ Details            →        │  ← Left content, right arrow
└─────────────────────────────┘
```

**Not this:**
```
┌─────────────────────────────┐
│         Title               │  ← Centered (bad)
│                             │
│      ┌──────────┐            │  ← Centered card (bad)
│      │          │            │
│      └──────────┘            │
│                             │
│        Button               │  ← Centered button (bad)
└─────────────────────────────┘
```

### 4. Generous Negative Space

**Stripe Dashboard-style breathing room:**
- Section gaps: 40-48px (not 16px)
- Card padding: 24-32px (not 16px)
- List item height: 56-64px (not 44px)
- Screen margins: 20-24px horizontal

**Rule:** If it feels cramped, add more space. If it feels spacious, it's right.

### 5. Clear Hierarchy

**Button hierarchy (Monzo-style):**
```
Primary:    Black background, white text
Secondary:  Gray-100 background, black text
Tertiary:   Transparent, black text
Danger:     Red-600 background, white text
```

**No:**
- Outlined buttons with 1px borders
- Multiple primary buttons
- Colorful buttons everywhere
- Gradient buttons

### 6. Subtle Shadows

**Apple Wallet-style elevation:**
```
None:     Border only (0.5px, gray-200)
Subtle:   0 1px 3px rgba(0,0,0,0.04)
Raised:   0 4px 12px rgba(0,0,0,0.08)
Floating: 0 8px 24px rgba(0,0,0,0.12)
```

**Never:**
- Multiple layered shadows
- Colored shadows
- Large blur radius shadows
- Glow effects

### 7. Real Materials

**Nothing-inspired surfaces:**
```
Background:    #FFFFFF
Surface:       #FAFAFA
Surface-2:     #F5F5F5
Border:        #E5E5E5
Border-subtle: #F0F0F0

Text:          #0A0A0A
Text-medium:   #666666
Text-subtle:   #999999
```

**Never:**
- Frosted glass everywhere
- Neumorphism
- Glassmorphism with blur
- Gradients unless physically motivated

---

## Component Design

### Buttons

**Primary Button (Ships orders, confirms actions)**
```
Height:     44px
Padding:    0 24px
Radius:     10px
Background: #0A0A0A
Text:       #FFFFFF, 15px, 500 weight
Shadow:     None (or 0 1px 2px rgba(0,0,0,0.1))

States:
- Press:    Background → #1A1A1A, scale 0.98
- Disabled: Opacity 0.4
```

**Secondary Button (Cancel, back actions)**
```
Height:     44px
Padding:    0 24px
Radius:     10px
Background: #F5F5F5
Text:       #0A0A0A, 15px, 500 weight
Shadow:     None

States:
- Press:    Background → #E5E5E5, scale 0.98
- Disabled: Opacity 0.4
```

**Tertiary Button (Low priority actions)**
```
Height:     44px
Padding:    0 16px
Radius:     10px
Background: transparent
Text:       #0A0A0A, 15px, 500 weight
Shadow:     None

States:
- Press:    Background → #F5F5F5, scale 0.98
```

**Icon-only Button**
```
Size:       44×44px
Radius:     10px
Background: transparent
Icon:       20px, #0A0A0A

States:
- Press:    Background → #F5F5F5, scale 0.98
```

**Rules:**
- One primary per screen
- Text-only buttons preferred
- No icons in primary/secondary unless critical
- No loading spinner with text (show "Saving..." text only)

### Cards

**Standard Card (Apple Wallet-inspired)**
```
Padding:    24px
Radius:     16px
Background: #FFFFFF
Border:     0.5px solid #E5E5E5
Shadow:     None (border only)

Content:
- Title:    20px, 600 weight, -0.3 tracking
- Body:     15px, 400 weight
- Detail:   13px, 400 weight, #666666
- Gap:      12px between elements
```

**Elevated Card (When needs to lift off surface)**
```
Padding:    24px
Radius:     16px
Background: #FFFFFF
Border:     None
Shadow:     0 4px 12px rgba(0,0,0,0.08)
```

**Interactive Card**
```
Same as standard, but:
- Add subtle press: scale 0.99
- Add hover (web): border → #D5D5D5
```

**Rules:**
- Border OR shadow, never both
- 16px radius for all cards (not 12, not 20)
- Minimum 24px padding
- No gradient backgrounds
- No glow effects

### Inputs

**Text Input (Stripe-inspired)**
```
Height:     48px
Padding:    0 16px
Radius:     10px
Background: #FAFAFA
Border:     1px solid transparent
Text:       15px, 400 weight

States:
- Focus:    Border → #0A0A0A
- Error:    Border → #DC2626
- Success:  Border → #16A34A
- Disabled: Background → #F5F5F5, opacity 0.6

Label:
- Size:     13px, 500 weight
- Color:    #666666
- Position: 8px above input
```

**Rules:**
- No floating labels
- No icons inside inputs (put them outside)
- No placeholder text as label replacement
- Clear error messages below input

### Lists

**List Item (Linear-inspired)**
```
Height:     64px (not 44px)
Padding:    0 24px
Border:     Bottom only, 0.5px, #F0F0F0

Layout:
┌────────────────────────────────┐
│ Title                   Detail │  ← 20px title, 13px detail
│ Subtitle                     → │  ← 13px subtitle, 16px arrow
└────────────────────────────────┘

Press:
- Background: #FAFAFA
- Scale: None (just background)
```

**Rules:**
- 64px minimum height (more comfortable)
- Left-align all text
- Right-align meta info or arrow
- No icons unless critical
- Separator line 0.5px (not 1px)

### NFC Card Component

**Card Face (Tesla UI-inspired minimalism)**
```
Size:       343×216px (credit card ratio)
Radius:     16px
Background: #0A0A0A (black card)
Padding:    24px

Layout:
┌─────────────────────────────┐
│ Logo              NFC icon  │  ← Corners only
│                             │
│                             │
│                             │
│ John Smith                  │  ← Bottom left
│ @username                   │
└─────────────────────────────┘

Typography:
- Name:     17px, 500 weight, #FFFFFF
- Handle:   13px, 400 weight, rgba(255,255,255,0.6)

Shadows:
- 0 8px 24px rgba(0,0,0,0.12)
```

**Rules:**
- No gradients on card
- No glow effects
- No decorative patterns
- Clean, minimal, production-ready
- Physical card proportions

---

## Screen Layouts

### Home Screen (Arc Browser-inspired sidebar)

```
┌──────────────────────────────────────┐
│ Cards                    + New Card  │  ← 24px top, left title
│                                      │
│ ┌──────────────┐                     │  ← Card gallery
│ │  Black Card  │  [     ]  [     ]  │
│ │              │                     │
│ │ John Smith   │                     │
│ └──────────────┘                     │
│                                      │  ← 40px gap
│                                      │
│ Recent Activity                      │  ← Section title
│                                      │
│ Order #1234              Shipped    │  ← List item
│ Order #1233              Pending    │
│ Order #1232              Delivered  │
│                                      │
└──────────────────────────────────────┘
```

### Order Screen (Monzo-inspired transaction detail)

```
┌──────────────────────────────────────┐
│ ← Order #1234                        │  ← Back + title
│                                      │
│                                      │  ← 32px gap
│                                      │
│ Status                               │  ← 11px caps
│ In Production                        │  ← 20px title
│                                      │
│ ──●───────○─────○                    │  ← Timeline
│ Paid   Make   Ship                   │
│                                      │
│                                      │  ← 40px gap
│                                      │
│ Details                              │  ← 11px caps
│                                      │
│ Card Type        Metal Black         │  ← Key-value pairs
│ Quantity         1 card              │
│ Total            $49.99              │
│                                      │
│                                      │  ← 40px gap
│                                      │
│ [Track Shipment]                     │  ← Primary button
│                                      │
└──────────────────────────────────────┘
```

### Card Design Screen (Nothing-inspired simplicity)

```
┌──────────────────────────────────────┐
│ ← Customize Card                     │
│                                      │
│                                      │
│ ┌──────────────┐                     │  ← Live preview
│ │              │                     │
│ │              │                     │
│ └──────────────┘                     │
│                                      │
│                                      │
│ Style                                │  ← 11px caps
│                                      │
│ ○ Black    ○ White    ● Metal       │  ← Radio buttons (text)
│                                      │
│                                      │
│ Information                          │  ← 11px caps
│                                      │
│ Name                                 │
│ [John Smith            ]             │  ← Input
│                                      │
│ Username                             │
│ [@username             ]             │
│                                      │
│                                      │
│ [Continue]                           │  ← Primary button
│                                      │
└──────────────────────────────────────┘
```

---

## Color System (Production-Grade)

### Primary Palette
```
Black:    #0A0A0A   ← All primary actions
White:    #FFFFFF   ← Surfaces
Gray-50:  #FAFAFA   ← Surface variant
Gray-100: #F5F5F5   ← Secondary buttons
Gray-200: #E5E5E5   ← Borders
Gray-400: #999999   ← Subtle text
Gray-600: #666666   ← Secondary text
Gray-900: #0A0A0A   ← Primary text
```

### Status Colors (Physical, not vibrant)
```
Success:  #16A34A   ← Green 600 (not bright green)
Error:    #DC2626   ← Red 600 (not bright red)
Warning:  #EA580C   ← Orange 600 (not bright orange)
Info:     #2563EB   ← Blue 600 (not bright blue)
```

### Usage Rules
```
✓ 90% black/gray
✓ Color only for status and primary action
✓ One accent color per screen
✓ Physical colors (look at real products)

✗ Rainbow everywhere
✗ Bright, saturated colors
✗ Gradients
✗ Multiple accent colors
```

---

## Animation (Manufacturing Quality)

### Timing
```
Fast:   150ms  ← Button press, small reveals
Base:   200ms  ← Standard transitions
Slow:   300ms  ← Sheet present, large movements
```

### Easing
```
Standard: cubic-bezier(0.4, 0, 0.2, 1)
Enter:    cubic-bezier(0, 0, 0.2, 1)
Exit:     cubic-bezier(0.4, 0, 1, 1)
```

### Movement
```
Button Press:  Scale 0.98, 150ms
Card Tap:      Scale 0.99, 200ms
Sheet Enter:   TranslateY 100% → 0, 300ms
Modal Enter:   Scale 0.95 → 1, Opacity 0 → 1, 200ms
```

**Rules:**
- No bouncy animations
- No overshooting
- No decorative animations
- Functional feedback only

---

## Implementation Priority

### Phase 1: Core (Ship-Critical)
1. AppButton (Primary, Secondary, Tertiary only)
2. AppCard (Standard card only)
3. AppInput (Basic text input only)
4. Typography system
5. Color system

### Phase 2: Screens (MVP)
1. Home screen with card gallery
2. Order list
3. Order detail
4. Card customization

### Phase 3: Polish (v1.1)
1. Animations refinement
2. Micro-interactions
3. Edge cases
4. Performance optimization

---

## Anti-Patterns to Avoid

### ❌ Don't Do This
```
- Centered everything
- Icon + label for every button
- Gradient backgrounds
- Glow effects
- Frosted glass everywhere
- Decorative animations
- Complex shadows
- Tiny spacing (8px everywhere)
- 1px borders on buttons
- Floating labels
- Placeholder as label
- Too many colors
- Rounded corners everywhere (30px radius)
```

### ✅ Do This Instead
```
- Asymmetric layouts
- Text-only buttons (70% less icons)
- Solid colors
- Subtle shadows
- Simple borders
- Functional animations only
- Realistic shadows (Apple-style)
- Generous spacing (40-48px sections)
- No border or subtle border
- Fixed labels above
- Proper labels
- Black/gray + one accent
- Consistent radius (10-16px)
```

---

## Real Product Examples

### Apple Wallet
- Minimal icons
- Typography hierarchy
- Asymmetric card layout
- Generous spacing
- Subtle shadows
- Real materials

### Linear
- Text-first interface
- Generous whitespace
- Clear hierarchy
- Minimal decoration
- Fast, functional
- Left-aligned content

### Stripe Dashboard
- Data density with breathing room
- Clear typography
- Subtle borders
- No unnecessary decoration
- Professional, clean
- Asymmetric layouts

### Arc Browser
- Sidebar navigation
- Minimal chrome
- Typography-focused
- Clear actions
- No clutter
- Generous space

### Nothing Phone
- Dot matrix simplicity
- Monochrome base
- Functional, not decorative
- Clear purpose
- Manufacturing quality
- Physical materials

### Tesla UI
- Information density
- Minimal decoration
- Clear hierarchy
- Functional graphics
- No chrome
- Purpose-driven

### Monzo
- Transaction clarity
- Generous spacing
- Status colors
- Clear actions
- Minimal icons
- Readable typography

---

## The Difference

### Concept (What We're NOT Building)
```
┌────────────────────────────────┐
│         🎨 Title 🎨            │  ← Centered
│                                │
│  ╭──────────────────╮          │  ← Gradient card
│  │ ✨ Glow Effect ✨│          │  ← Decorative
│  │                  │          │  ← Icons everywhere
│  ╰──────────────────╯          │
│                                │
│    [🔥 Amazing 🔥]            │  ← Emoji buttons
└────────────────────────────────┘
```

### Production (What We ARE Building)
```
┌────────────────────────────────┐
│ Cards                 + New    │  ← Left-aligned
│                                │
│ ┌──────────────┐               │  ← Simple black card
│ │              │               │  ← No glow
│ │ John Smith   │               │  ← Text-first
│ └──────────────┘               │  ← Real proportions
│                                │
│ [Continue]                     │  ← Text button
└────────────────────────────────┘
```

---

## Ship Checklist

Before shipping any component:

- [ ] No centered layouts (unless single item)
- [ ] No decorative icons (70% reduction)
- [ ] No gradients (unless physically motivated)
- [ ] No glow effects
- [ ] Subtle shadows only (Apple-style)
- [ ] Real product proportions
- [ ] Typography hierarchy clear
- [ ] Generous negative space (40-48px)
- [ ] Clear button hierarchy
- [ ] Usability tested
- [ ] Looks manufactured, not illustrated
- [ ] Animations functional, not decorative

---

**Bottom line:** This ships next month. Every pixel has a purpose. No decoration. No concepts. Just production-grade design that works.

Let's build it. 🚀
