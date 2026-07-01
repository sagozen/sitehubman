const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/features/guest/GuestHomeScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace brand colors
content = content.replace(/const BRAND = '#2596BE';/, "const BRAND = '#1877F2';");
content = content.replace(/const INK = '#0A0A0F';/, "const INK = '#050505';");
content = content.replace(/const INK2 = '#1C1C1E';/, "const INK2 = '#050505';");
content = content.replace(/const MUTED = '#6E6E73';/, "const MUTED = '#65676B';");
content = content.replace(/const BG = '#FFFFFF';/, "const BG = '#F0F2F5';");

// 2. Remove hooks
content = content.replace(/const useFloatAnimation =.*?return \{ transform: \[\{ translateY \}\] \};\n\};\n/s, '');
content = content.replace(/const usePulseAnimation =.*?return \{ transform: \[\{ scale \}\] \};\n\};\n/s, '');
content = content.replace(/const usePressAnimation =.*?return \{ scale, pressIn, pressOut \};\n\};\n/s, '');

// 3. Remove Animated from imports
content = content.replace(/import \{ Animated, Easing \} from 'react-native';\n/, '');
content = content.replace(/import \{ LinearGradient \} from 'expo-linear-gradient';\n/, '');

// 4. Update OrderRow
content = content.replace(/const \{ scale, pressIn, pressOut \} = usePressAnimation\(\);\n/, '');
content = content.replace(/onPressIn=\{pressIn\}\n\s*onPressOut=\{pressOut\}\n/, '');
content = content.replace(/<Animated\.View style=\{\[\n\s*styles\.orderRow,\n\s*\{ transform: \[\{ scale \}\] \},\n\s*\]\}>/s, '<View style={styles.orderRow}>');
content = content.replace(/<\/Animated\.View>/g, '</View>');

// 5. Update GuestHomeScreen variables
content = content.replace(/const floatAnim = useFloatAnimation\(0\);\n/, '');
content = content.replace(/const pulseAnim = usePulseAnimation\(\);\n/, '');

// 6. Remove LinearGradient
content = content.replace(/\{\/\* Hardware-accelerated Linear Gradient Background \*\/\}\n\s*<LinearGradient.*?style=\{styles\.gradientContainer\}\n\s*\/>\n/s, '');

// 7. Remove floatAnim and pulseAnim from Animated.Views
content = content.replace(/<Animated\.View style=\{\[\n\s*styles\.profileAvatar,\n\s*isHovering && styles\.hovered,\n\s*floatAnim,\n\s*\]\}>/s, '<View style={[styles.profileAvatar, isHovering && styles.hovered]}>');
content = content.replace(/<Animated\.View style=\{\[\n\s*styles\.headerIcon,\n\s*isHovering && styles\.hovered,\n\s*pulseAnim,\n\s*\]\}>/s, '<View style={[styles.headerIcon, isHovering && styles.hovered]}>');
content = content.replace(/<Animated\.View style=\{\[styles\.cardElevation, floatAnim\]\}>/s, '<View style={styles.cardElevation}>');

// 8. Simplify Pressable interactions to use simple opacity
content = content.replace(/pressed && styles\.pressed,/g, "pressed && { opacity: 0.7 },");
content = content.replace(/pressed && styles\.actionPressed,/g, "pressed && { opacity: 0.7 },");
content = content.replace(/pressed && styles\.orderPressed,/g, "pressed && { backgroundColor: 'rgba(0,0,0,0.05)' },");
content = content.replace(/pressed && styles\.viewAllPressed,/g, "pressed && { opacity: 0.5 },");
content = content.replace(/pressed && styles\.productPressed,/g, "pressed && { opacity: 0.7 },");
content = content.replace(/pressed && styles\.demoPressed,/g, "pressed && { opacity: 0.7 },");

// Fix any leftover animated view
content = content.replace(/<Animated\.View/g, '<View');
content = content.replace(/<\/Animated\.View>/g, '</View>');

// Layout tweaks for Facebook style
// Card shadow needs to be flatter and simpler
content = content.replace(/shadowColor: '#000000',\n\s*shadowOffset: \{ width: 0, height: 8 \},\n\s*shadowOpacity: 0.15,\n\s*shadowRadius: 20,\n\s*elevation: 8,/s, "shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,");

// Content gap should be tighter
content = content.replace(/paddingBottom: SPACING\.xxl,\n\s*gap: SPACING\.section,/s, "paddingBottom: SPACING.xxl, gap: SPACING.md,");

// Add white background and padding to action container so it looks like a Facebook "What's on your mind / quick actions" card
content = content.replace(/actionContainer: \{\n\s*flexDirection: 'row',\n\s*flexWrap: 'wrap',\n\s*justifyContent: 'space-between',\n\s*gap: SPACING\.md,\n\s*marginVertical: SPACING\.lg,\n\s*\},/s, "actionContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: SPACING.md, marginVertical: SPACING.sm, backgroundColor: SURFACE, padding: SPACING.md, borderRadius: LAYOUT.borderRadius.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },");

fs.writeFileSync(filePath, content);
console.log('Successfully updated GuestHomeScreen.tsx');
