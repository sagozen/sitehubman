# Implementation Guide
## How to Use the New Design System

---

## Quick Start

### 1. Import Design Tokens and Utilities

```typescript
// Import tokens
import { tokens } from '@/src/design-system/tokens';

// Import utilities
import {
  getTypography,
  getColor,
  padding,
  gap,
  card,
  buttonSize,
  // ... any other utilities you need
} from '@/src/design-system/utilities';
```

### 2. Replace Hard-Coded Values

**Before:**
```typescript
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
```

**After:**
```typescript
const styles = StyleSheet.create({
  container: card('light', 'md', 'xxl', 5),
  title: getTypography('h3', 'semibold'),
});
```

### 3. Use Theme-Aware Colors

```typescript
import { usePreferences } from '@/src/hooks/usePreferences';

function MyComponent() {
  const { isDark } = usePreferences();
  const mode = isDark ? 'dark' : 'light';

  return (
    <View style={{ backgroundColor: getColor('background', mode) }}>
      <Text style={{ color: getColor('ink', mode) }}>
        Theme-aware text
      </Text>
    </View>
  );
}
```

---

## Common Patterns

### Pattern 1: Create a Card

```typescript
import { card, stack, getTypography, getColor } from '@/design-system/utilities';

function ProductCard({ title, description, price }) {
  const { isDark } = usePreferences();
  const mode = isDark ? 'dark' : 'light';

  return (
    <View style={card(mode, 'md', 'xxl', 5)}>
      <View style={stack(3)}>
        <Text style={getTypography('h3', 'semibold')}>
          {title}
        </Text>
        <Text style={{
          ...getTypography('body', 'regular'),
          color: getColor('inkSecondary', mode),
        }}>
          {description}
        </Text>
        <Text style={{
          ...getTypography('h2', 'bold'),
          color: getColor('primary', mode),
        }}>
          ${price}
        </Text>
      </View>
    </View>
  );
}
```

### Pattern 2: Create a Button

```typescript
import { buttonSize, getTypography, getColor, getShadow } from '@/design-system/utilities';

function PrimaryButton({ label, onPress }) {
  const { isDark } = usePreferences();
  const mode = isDark ? 'dark' : 'light';

  return (
    <Pressable
      onPress={onPress}
      style={{
        ...buttonSize('md', 4, 'lg'),
        backgroundColor: getColor('primary', mode),
        ...getShadow('sm'),
      }}
    >
      <Text style={{
        ...getTypography('bodyEmphasis', 'semibold'),
        color: getColor('inkInverse', mode),
      }}>
        {label}
      </Text>
    </Pressable>
  );
}
```

### Pattern 3: Create an Input Field

```typescript
import { inputSize, getTypography, getColor, padding, gap } from '@/design-system/utilities';

function TextField({ label, value, onChangeText, error }) {
  const { isDark } = usePreferences();
  const mode = isDark ? 'dark' : 'light';
  const [focused, setFocused] = useState(false);

  return (
    <View style={gap(2)}>
      <Text style={{
        ...getTypography('caption', 'medium'),
        color: getColor('inkSecondary', mode),
      }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputSize('md', 4, 'lg'),
          ...getTypography('body', 'medium'),
          backgroundColor: getColor('surfaceSubdued', mode),
          color: getColor('ink', mode),
          borderWidth: focused ? 1.5 : 1,
          borderColor: error
            ? getColor('error', mode)
            : focused
              ? getColor('focus', mode)
              : getColor('border', mode),
        }}
      />
      {error && (
        <Text style={{
          ...getTypography('footnote', 'regular'),
          color: getColor('errorText', mode),
        }}>
          {error}
        </Text>
      )}
    </View>
  );
}
```

### Pattern 4: Create a Status Badge

```typescript
import { padding, rounded, getTypography, getStatusColor } from '@/design-system/utilities';

function StatusBadge({ status }: { status: 'success' | 'warning' | 'error' | 'info' }) {
  const { isDark } = usePreferences();
  const mode = isDark ? 'dark' : 'light';

  return (
    <View style={{
      ...padding(1, 2, 1, 2),
      ...rounded('md'),
      backgroundColor: getStatusColor(status, mode, 'soft'),
    }}>
      <Text style={{
        ...getTypography('footnote', 'medium'),
        color: getStatusColor(status, mode, 'text'),
        textTransform: 'uppercase',
      }}>
        {status}
      </Text>
    </View>
  );
}
```

### Pattern 5: Create a Header

```typescript
import { row, padding, getTypography, getColor, touchTarget } from '@/design-system/utilities';

function Header({ title, onBack, onAction }) {
  const { isDark } = usePreferences();
  const mode = isDark ? 'dark' : 'light';

  return (
    <View style={{
      ...row(4, 'center'),
      ...padding(4, 5, 4, 5),
      backgroundColor: getColor('surface', mode),
      borderBottomWidth: 0.5,
      borderBottomColor: getColor('border', mode),
    }}>
      <Pressable onPress={onBack} style={touchTarget()}>
        <AppIcon name="ChevronLeft" size={tokens.iconSize.lg} />
      </Pressable>
      
      <Text style={{
        ...getTypography('h3', 'semibold'),
        flex: 1,
      }}>
        {title}
      </Text>

      <Pressable onPress={onAction} style={touchTarget()}>
        <AppIcon name="MoreVertical" size={tokens.iconSize.lg} />
      </Pressable>
    </View>
  );
}
```

### Pattern 6: Create a List Item

```typescript
import { row, padding, gap, getTypography, getColor, touchTarget } from '@/design-system/utilities';

function ListItem({ icon, title, subtitle, onPress }) {
  const { isDark } = usePreferences();
  const mode = isDark ? 'dark' : 'light';

  return (
    <Pressable onPress={onPress}>
      <View style={{
        ...row(4, 'center'),
        ...padding(4, 5, 4, 5),
        ...touchTarget(56),
        backgroundColor: getColor('surface', mode),
      }}>
        {icon && (
          <View style={{
            width: 40,
            height: 40,
            ...center(),
            ...rounded('md'),
            backgroundColor: getColor('surfaceSubdued', mode),
          }}>
            {icon}
          </View>
        )}
        
        <View style={{ flex: 1, ...gap(1) }}>
          <Text style={getTypography('bodyEmphasis', 'medium')}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{
              ...getTypography('caption', 'regular'),
              color: getColor('inkSecondary', mode),
            }}>
              {subtitle}
            </Text>
          )}
        </View>

        <AppIcon
          name="ChevronRight"
          size={tokens.iconSize.sm}
          color={getColor('inkTertiary', mode)}
        />
      </View>
    </Pressable>
  );
}
```

---

## Animation Patterns

### Pattern 1: Button Press Animation

```typescript
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import { getDuration, getSpring, tokens } from '@/design-system/utilities';

function AnimatedButton({ children, onPress }) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(
      tokens.animation.scale.pressed,
      { duration: getDuration('fast') }
    );
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, getSpring('snappy'));
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
```

### Pattern 2: Fade In Animation

```typescript
import Animated, { FadeIn } from 'react-native-reanimated';
import { getDuration } from '@/design-system/utilities';

function FadeInView({ children }) {
  return (
    <Animated.View entering={FadeIn.duration(getDuration('base'))}>
      {children}
    </Animated.View>
  );
}
```

---

## Migration Strategy

### Step 1: Create a Parallel Component

Don't modify the original component immediately. Create a new version:

```typescript
// Old: src/components/AppButton.tsx
// New: src/components/AppButtonV2.tsx
```

### Step 2: Migrate One Component at a Time

```typescript
// 1. Import new utilities
import { buttonSize, getTypography, getColor } from '@/design-system/utilities';

// 2. Replace hard-coded values
const oldStyle = { height: 44, paddingHorizontal: 18, borderRadius: 12 };
const newStyle = buttonSize('md', 4, 'lg');

// 3. Replace hard-coded colors
const oldColor = '#000000';
const newColor = getColor('ink', mode);

// 4. Replace hard-coded typography
const oldTypography = { fontSize: 15, fontWeight: '600', letterSpacing: -0.1 };
const newTypography = getTypography('bodyEmphasis', 'semibold');
```

### Step 3: Test Thoroughly

- Test on iOS
- Test on Android
- Test on Web (if applicable)
- Test light mode
- Test dark mode
- Test accessibility

### Step 4: Replace Original

Once V2 is tested and stable:
```bash
# Rename old
mv src/components/AppButton.tsx src/components/AppButton.old.tsx

# Promote V2
mv src/components/AppButtonV2.tsx src/components/AppButton.tsx

# Update all imports (if needed)
# Then delete old file after verification
```

---

## Best Practices

### ✅ DO

```typescript
// Use semantic color tokens
const bg = getColor('background', mode);
const text = getColor('ink', mode);

// Use typography utilities
const heading = getTypography('h1', 'semibold');

// Use spacing tokens
const containerPadding = padding(5, 4, 5, 4);

// Compose utilities
const cardStyle = {
  ...card(mode, 'md', 'xxl', 5),
  ...gap(4),
};

// Use status colors semantically
const successColor = getStatusColor('success', mode);
```

### ❌ DON'T

```typescript
// Don't hard-code colors
backgroundColor: '#FFFFFF'  // ❌
backgroundColor: getColor('surface', mode)  // ✅

// Don't use magic numbers
padding: 18  // ❌
...padding(5, 5, 5, 5)  // ✅ (20px via token)

// Don't use arbitrary font sizes
fontSize: 16  // ❌
...getTypography('body')  // ✅

// Don't break the 8pt grid
marginBottom: 15  // ❌
marginBottom: tokens.spacing[4]  // ✅ (16px)

// Don't use inline styles for everything
<View style={{ padding: 20, margin: 16, backgroundColor: '#FFF' }} />  // ❌
<View style={card('light', 'none', 'xxl', 5)} />  // ✅
```

---

## Testing Your Changes

### Visual Regression Testing

1. Take screenshots before changes
2. Implement new design system
3. Take screenshots after changes
4. Compare for unintended changes

### Accessibility Testing

```typescript
// Ensure proper contrast ratios
import { getColor } from '@/design-system/utilities';

const bgColor = getColor('background', mode);
const textColor = getColor('ink', mode);
// These tokens already meet WCAG AA standards

// Ensure touch targets
import { touchTarget } from '@/design-system/utilities';

<Pressable style={touchTarget(44)}>  // Minimum 44x44px
```

### Performance Testing

```typescript
// Animations should run at 60fps
import { getDuration } from '@/design-system/utilities';

// Fast animations for immediate feedback
const pressAnimation = getDuration('fast');  // 150ms

// Base animations for standard transitions
const modalAnimation = getDuration('base');  // 220ms
```

---

## Troubleshooting

### Issue: Colors Look Wrong

**Solution:** Ensure you're passing the correct mode:

```typescript
const { isDark } = usePreferences();
const mode = isDark ? 'dark' : 'light';

// Then use mode consistently
const bgColor = getColor('background', mode);
```

### Issue: Spacing Doesn't Look Right

**Solution:** Stick to the 8pt grid:

```typescript
// Use tokens, not arbitrary values
const SPACING_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 30];
// These map to: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 120]px

// Good
...padding(5, 4, 5, 4)  // 20, 16, 20, 16 - follows grid

// Bad
paddingHorizontal: 18  // Doesn't follow grid
```

### Issue: Typography Looks Off

**Solution:** Use the predefined scales:

```typescript
// Available scales (in order of size)
'footnote'     // 11px - smallest
'caption'      // 13px
'body'         // 15px - default
'h3'           // 17px
'h2'           // 20px
'h1'           // 24px
'display'      // 32px - largest

// Use appropriately
<Text style={getTypography('body')}>Regular text</Text>
<Text style={getTypography('h2', 'semibold')}>Section heading</Text>
```

---

## Next Steps

1. **Review** the design specification (DESIGN_SPEC.md)
2. **Study** the comparison guide (DESIGN_COMPARISON.md)
3. **Start small** - Migrate one component
4. **Test thoroughly** - Verify on all platforms
5. **Expand gradually** - Migrate screen by screen
6. **Document patterns** - Add to this guide as you go

---

## Need Help?

Common questions:

**Q: Which component should I start with?**
A: Start with the most-used primitive: AppButton, AppCard, or AppInput.

**Q: How do I handle custom cases?**
A: Use `createTypography()` and spread utilities for customization:
```typescript
const customStyle = {
  ...getTypography('body'),
  color: '#custom',
  // Add custom overrides
};
```

**Q: What if a token doesn't exist?**
A: Add it to `tokens.ts` following the established patterns, then create a utility function if needed.

**Q: How do I ensure consistency across the team?**
A: Use TypeScript, enforce linting rules, and review PRs for token usage.

---

*Consistency is the foundation of great design. Use the system, trust the system.*
