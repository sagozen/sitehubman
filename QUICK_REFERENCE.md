# Quick Reference Guide
## Design System V2 Cheat Sheet

---

## 🎨 Import Statements

```typescript
// Design tokens
import { tokens } from '@/src/design-system/tokens';

// Utilities
import {
  getColor,
  getTypography,
  buttonSize,
  card,
  padding,
  gap,
  row,
  stack,
} from '@/src/design-system/utilities';

// Components V2
import { AppButtonV2 } from '@/src/components/AppButtonV2';
import { AppCardV2 } from '@/src/components/AppCardV2';
import { AppInputV2 } from '@/src/components/AppInputV2';

// Theme hook
import { usePreferences } from '@/src/hooks/usePreferences';
```

---

## 🔘 Buttons

```typescript
// Primary (most emphasis)
<AppButtonV2 label="Continue" variant="primary" onPress={handlePress} />

// Secondary (medium emphasis)
<AppButtonV2 label="Cancel" variant="secondary" />

// Tertiary (low emphasis)
<AppButtonV2 label="Skip" variant="tertiary" />

// Destructive
<AppButtonV2 label="Delete" variant="destructive" />

// Success
<AppButtonV2 label="Confirm" variant="success" />

// With icons
<AppButtonV2 label="Add" iconLeft="Plus" variant="primary" />
<AppButtonV2 label="Next" iconRight="ArrowRight" variant="secondary" />

// Icon only
<AppButtonV2 variant="icon" iconLeft="Settings" />
<AppButtonV2 variant="iconCircle" iconLeft="X" />

// Sizes
<AppButtonV2 label="Small" size="sm" />
<AppButtonV2 label="Medium" size="md" />
<AppButtonV2 label="Large" size="lg" />

// States
<AppButtonV2 label="Loading" loading />
<AppButtonV2 label="Disabled" disabled />

// Full width
<AppButtonV2 label="Full Width" fullWidth variant="primary" />
```

---

## 🃏 Cards

```typescript
// Elevations
<AppCardV2 elevation="flat">Content</AppCardV2>        // Border only
<AppCardV2 elevation="subtle">Content</AppCardV2>      // Subtle shadow
<AppCardV2 elevation="elevated">Content</AppCardV2>    // Standard shadow
<AppCardV2 elevation="floating">Content</AppCardV2>    // Maximum shadow

// With sections
<AppCardV2
  header={<Text>Header</Text>}
  footer={<Button />}
>
  Main content
</AppCardV2>

// Interactive
<AppCardV2 onPress={handlePress}>
  Tap me
</AppCardV2>

// Custom padding and radius
<AppCardV2 padding={6} radius="xxxl">
  Content
</AppCardV2>

// Preset cards
import { CompactCard, StandardCard, HeroCard } from '@/src/components/AppCardV2';

<CompactCard>Compact padding</CompactCard>
<StandardCard>Standard spacing</StandardCard>
<HeroCard>Large, prominent</HeroCard>
```

---

## 📝 Inputs

```typescript
// Basic
<AppInputV2
  label="Email"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
/>

// Required
<AppInputV2 label="Name" required />

// With helper text
<AppInputV2
  label="Phone"
  helperText="We'll never share this"
/>

// Validation states
<AppInputV2
  label="Username"
  validation="success"
  successText="Available"
/>

<AppInputV2
  label="Password"
  validation="error"
  error="Too weak"
/>

// With icons
<AppInputV2 label="Search" iconLeft="MagnifyingGlass" />

// Specialized inputs
import { SearchInputV2, PasswordInputV2 } from '@/src/components/AppInputV2';

<SearchInputV2 value={search} onChangeText={setSearch} />
<PasswordInputV2 value={password} onChangeText={setPassword} />

// Sizes
<AppInputV2 label="Small" size="sm" />
<AppInputV2 label="Medium" size="md" />
<AppInputV2 label="Large" size="lg" />
```

---

## 🎨 Colors

```typescript
const { isDark } = usePreferences();
const mode = isDark ? 'dark' : 'light';

// Surfaces
getColor('background', mode)      // Page background
getColor('surface', mode)          // Card background
getColor('surfaceElevated', mode)  // Elevated surface
getColor('surfaceSubdued', mode)   // Subtle background

// Text
getColor('ink', mode)              // Primary text
getColor('inkSecondary', mode)     // Secondary text
getColor('inkTertiary', mode)      // Tertiary text
getColor('inkInverse', mode)       // Inverse (for colored backgrounds)

// Borders
getColor('border', mode)           // Standard border
getColor('borderStrong', mode)     // Strong border
getColor('borderSubtle', mode)     // Subtle border

// Status colors
getColor('primary', mode)          // Primary accent
getColor('success', mode)          // Success green
getColor('warning', mode)          // Warning amber
getColor('error', mode)            // Error red

// Status variants
getStatusColor('success', mode, 'base')  // Base color
getStatusColor('success', mode, 'soft')  // Soft background
getStatusColor('success', mode, 'text')  // Text color
```

---

## 📏 Spacing

```typescript
// Direct token access
tokens.spacing[0]   // 0px
tokens.spacing[1]   // 4px
tokens.spacing[2]   // 8px
tokens.spacing[3]   // 12px
tokens.spacing[4]   // 16px
tokens.spacing[5]   // 20px
tokens.spacing[6]   // 24px
tokens.spacing[8]   // 32px
tokens.spacing[10]  // 40px
tokens.spacing[12]  // 48px

// Utility functions
padding(5, 4, 5, 4)  // { paddingTop: 20, paddingRight: 16, ... }
gap(4)               // { gap: 16 }

// Layout utilities
stack(4)             // Vertical stack with 16px gap
row(3, 'center')     // Horizontal row with 12px gap, center aligned
```

---

## 🔤 Typography

```typescript
// Get typography styles
getTypography('display', 'bold')       // 32px, bold
getTypography('h1', 'semibold')        // 24px, semibold
getTypography('h2', 'semibold')        // 20px, semibold
getTypography('h3', 'semibold')        // 17px, semibold
getTypography('body', 'regular')       // 15px, regular
getTypography('bodyEmphasis', 'medium')// 15px, medium
getTypography('caption', 'regular')    // 13px, regular
getTypography('footnote', 'regular')   // 11px, regular

// Usage
<Text style={getTypography('h1', 'semibold')}>
  Heading
</Text>

// Custom overrides
<Text style={{
  ...getTypography('body'),
  color: getColor('primary', mode),
}}>
  Custom text
</Text>
```

---

## 📐 Layout Utilities

```typescript
// Flex layouts
stack(4)              // Vertical, 16px gap
row(3, 'center')      // Horizontal, 12px gap, center aligned
center()              // Centered content

// Absolute positioning
absolute(0, 0, 0, 0)  // Fill parent

// Size
fullSize()            // width: 100%, height: 100%

// Card helper
card(mode, 'md', 'xxl', 5)  // Complete card styling
```

---

## 🎬 Animations

```typescript
// Durations
getDuration('instant')  // 0ms
getDuration('fast')     // 150ms
getDuration('base')     // 220ms
getDuration('slow')     // 320ms

// Spring configs
getSpring('gentle')     // Soft spring
getSpring('snappy')     // Quick spring
getSpring('bouncy')     // Bouncy spring

// Common values
tokens.animation.scale.pressed       // 0.98
tokens.animation.opacity.pressed     // 0.9
tokens.animation.opacity.disabled    // 0.4

// Usage with Reanimated
scale.value = withTiming(
  tokens.animation.scale.pressed,
  { duration: getDuration('fast') }
);

scale.value = withSpring(1, getSpring('snappy'));
```

---

## 🎯 Common Patterns

### Theme-Aware Component

```typescript
import { usePreferences } from '@/src/hooks/usePreferences';
import { getColor } from '@/design-system/utilities';

function MyComponent() {
  const { isDark } = usePreferences();
  const mode = isDark ? 'dark' : 'light';

  return (
    <View style={{ backgroundColor: getColor('background', mode) }}>
      <Text style={{ color: getColor('ink', mode) }}>
        Content
      </Text>
    </View>
  );
}
```

### Button with Loading State

```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await submitForm();
  } finally {
    setLoading(false);
  }
};

<AppButtonV2
  label={loading ? 'Saving...' : 'Save'}
  loading={loading}
  disabled={loading}
  variant="primary"
  onPress={handleSubmit}
/>
```

### Form with Validation

```typescript
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const validateEmail = (value: string) => {
  if (!value) {
    setError('Email is required');
  } else if (!isValidEmail(value)) {
    setError('Invalid email format');
  } else {
    setError('');
  }
};

<AppInputV2
  label="Email"
  value={email}
  onChangeText={(value) => {
    setEmail(value);
    validateEmail(value);
  }}
  validation={error ? 'error' : 'default'}
  error={error}
  required
/>
```

### Card with Action

```typescript
<AppCardV2
  elevation="subtle"
  header={
    <View style={row(3, 'center')}>
      <Text style={getTypography('h3', 'semibold')}>Title</Text>
    </View>
  }
  footer={
    <AppButtonV2
      label="Action"
      variant="soft"
      fullWidth
      onPress={handleAction}
    />
  }
>
  <Text style={getTypography('body')}>
    Card content goes here
  </Text>
</AppCardV2>
```

---

## 🔍 Debugging Tips

### Check Token Values

```typescript
console.log('Spacing:', tokens.spacing);
console.log('Colors Light:', tokens.colors.light);
console.log('Typography:', tokens.typography.scale);
```

### Verify Theme Mode

```typescript
const { isDark } = usePreferences();
console.log('Dark mode:', isDark);
console.log('Background:', getColor('background', isDark ? 'dark' : 'light'));
```

### Test Animations

```typescript
// Log animation values
console.log('Press scale:', tokens.animation.scale.pressed);
console.log('Duration fast:', getDuration('fast'));
```

---

## 📱 Platform-Specific

### iOS vs Android

```typescript
import { Platform } from 'react-native';

// Platform-specific spacing
const padding = Platform.select({
  ios: tokens.spacing[5],
  android: tokens.spacing[4],
  default: tokens.spacing[4],
});

// Platform-specific shadow (handled by tokens automatically)
const shadow = getShadow('md'); // iOS: shadowOffset, Android: elevation
```

---

## ✅ Best Practices

### DO ✅

```typescript
// Use tokens
backgroundColor: getColor('surface', mode)

// Use utilities
...padding(5, 4, 5, 4)

// Use semantic colors
color: getColor('success', mode)

// Follow 8pt grid
gap: tokens.spacing[4]  // 16px
```

### DON'T ❌

```typescript
// Hard-code colors
backgroundColor: '#FFFFFF'  // ❌

// Use arbitrary values
padding: 18  // ❌ (breaks 8pt grid)

// Use magic numbers
fontSize: 16  // ❌

// Mix old and new
import { AppButton } from './AppButton';        // Old
import { AppButtonV2 } from './AppButtonV2';    // New
// Pick one approach per component
```

---

## 🚀 Quick Start

1. **Import what you need:**
```typescript
import { AppButtonV2 } from '@/src/components/AppButtonV2';
import { usePreferences } from '@/src/hooks/usePreferences';
import { getColor } from '@/design-system/utilities';
```

2. **Get theme mode:**
```typescript
const { isDark } = usePreferences();
const mode = isDark ? 'dark' : 'light';
```

3. **Use components:**
```typescript
<AppButtonV2 label="Click Me" variant="primary" />
```

4. **Style with tokens:**
```typescript
style={{ backgroundColor: getColor('surface', mode) }}
```

---

## 📚 Full Documentation

- **DESIGN_SPEC.md** - Complete design system specification
- **DESIGN_COMPARISON.md** - Before/after examples
- **IMPLEMENTATION_GUIDE.md** - Detailed how-to guide
- **PHASE_2_COMPLETE.md** - Component documentation
- **tokens.ts** - All design tokens
- **utilities.ts** - All utility functions

---

*Keep this handy. Build faster. Ship better.*
