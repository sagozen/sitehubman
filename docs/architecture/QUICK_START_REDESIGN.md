# Quick Start - Redesigned NFC Card App

## 🚀 How to Use the Redesigned App

### **1. Import the New Design Tokens**

```typescript
import { tokens } from '@/design-system/extracted-tokens';

// Typography
tokens.typography.display  // 28px display
tokens.typography.title    // 20px title
tokens.typography.body     // 15px body

// Spacing
tokens.spacing[10]  // 40px gaps
tokens.spacing[12]  // 48px section gaps

// Colors
tokens.color.black   // #0A0A0A
tokens.color.primary // #3E6AE1 (Electric Blue)
```

### **2. Use the Redesigned Screens**

```typescript
// Home Screen
import { HomeScreen } from '@/screens/HomeScreenRedesigned';

// Order Detail
import { OrderDetailScreen } from '@/screens/OrderScreenRedesigned';

// Card Customization
import { CardDesignScreen } from '@/screens/CardDesignScreenRedesigned';

// Profile
import { ProfileScreen } from '@/screens/ProfileScreenRedesigned';

// NFC Scan
import { ScanScreen } from '@/screens/ScanScreenRedesigned';

// Connections
import { ConnectionsScreen } from '@/screens/ConnectionsScreenRedesigned';
```

### **3. Build New Components**

All components follow the same patterns:

```typescript
// Button
<Button label="Continue" variant="primary" />
<Button label="Cancel" variant="secondary" />

// Card
<View style={[
  styles.card, 
  { 
    borderRadius: tokens.card.radius,
    padding: tokens.card.padding,
    borderWidth: 0.5,
    borderColor: tokens.color.border,
  }
]} />

// List Item (64px height)
<View style={{
  height: 64,
  borderBottomWidth: 0.5,
  borderBottomColor: tokens.color.borderLight,
}}>
  {/* Content */}
</View>
```

---

## 📐 **Design Rules**

### **Always:**
✅ Use extracted tokens (no hard-coded values)
✅ Follow 8pt grid spacing
✅ Left-align content
✅ Use 16px radius for cards
✅ Use 64px for list items
✅ Use 40-48px for section gaps
✅ Use 24px for card padding
✅ Use text-first (minimal icons)
✅ Use single accent color

### **Never:**
❌ Center layouts
❌ Use border AND shadow together
❌ Use 44px list items
❌ Use 16px section gaps
❌ Use multiple primary buttons
❌ Use gradients or glows
❌ Use bright saturated colors

---

## 🎨 **Quick Reference**

### **Typography**
```
Display:  tokens.typography.display  (28px)
Title:    tokens.typography.title    (20px)
Body:     tokens.typography.body     (15px)
Detail:   tokens.typography.detail   (13px)
Caption:  tokens.typography.caption  (11px, uppercase)
```

### **Spacing**
```
Micro:    tokens.spacing[2-4]   (8-16px)
Standard: tokens.spacing[5-8]   (20-32px)
Generous: tokens.spacing[10-12] (40-48px)
Screen:   tokens.spacing.screenX (20px)
```

### **Radius**
```
Card:   tokens.radius.card   (16px)
Button: tokens.radius.button (10px)
Input:  tokens.radius.input  (10px)
```

### **Colors**
```
Primary:  tokens.color.primary  (#3E6AE1)
Black:    tokens.color.black    (#0A0A0A)
White:    tokens.color.white    (#FFFFFF)
Surface:  tokens.color.surface  (#FFFFFF)
Border:   tokens.color.border   (#E5E5E5)
```

---

## 📱 **Screen Patterns**

### **Header (Linear style)**
```typescript
<View style={{
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: tokens.spacing[10], // 40px gap
}}>
  <Text style={tokens.typography.display}>Title</Text>
  <Text style={tokens.typography.body}>Action</Text>
</View>
```

### **Section (Linear style)**
```typescript
<View style={{ marginBottom: tokens.spacing[10] }}>
  <Text style={[
    tokens.typography.caption,
    { marginBottom: tokens.spacing[4] }
  ]}>
    SECTION TITLE
  </Text>
  {/* Content */}
</View>
```

### **List (64px items)**
```typescript
<View style={{
  borderRadius: tokens.radius.card,
  borderWidth: 0.5,
  borderColor: tokens.color.border,
}}>
  <View style={{
    height: 64,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: tokens.color.borderLight,
  }}>
    {/* Content */}
  </View>
</View>
```

---

## ✅ **Ready to Ship**

All screens are:
- Production-ready
- Based on real product design
- Following industry standards
- Accessibility compliant
- Performance optimized

**Start with HomeScreenRedesigned.tsx and go from there! 🚀**
