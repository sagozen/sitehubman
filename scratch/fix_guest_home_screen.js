const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/features/guest/GuestHomeScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove duplicate position/top/left/right/bottom in gradientContainer
content = content.replace(
  /gradientContainer:\s*\{\s*position:\s*'absolute',\s*top:\s*0,\s*left:\s*0,\s*right:\s*0,\s*bottom:\s*0,\s*\.\.\.StyleSheet\.absoluteFillObject,\s*\}/g,
  `gradientContainer: {
    ...StyleSheet.absoluteFillObject,
  }`
);

// 2. Fix StatCard component to accept style prop
content = content.replace(
  /function StatCard\(\{\s*label,\s*value,\s*icon,\s*color\s*\}\s*:\s*\{\s*label:\s*string;\s*value:\s*string;\s*icon:\s*AppIconName;\s*color:\s*string\s*\}\)/g,
  `function StatCard({ label, value, icon, color, style }: { label: string; value: string; icon: AppIconName; color: string; style?: any })`
);
content = content.replace(
  /<View style=\{styles\.statCard\}>/g,
  `<View style={[styles.statCard, style]}>`
);

// 3. Replace color={...} with style={{color: ...}} in AppText, and remove weight from AppIcon
// Let's do regex replacements for the specific offending lines

// Helper to replace AppText color prop
content = content.replace(
  /<AppText([^>]*?)\bcolor=\{([^}]+?)\}([^>]*?)>/g,
  (match, p1, p2, p3) => {
    // If style already exists, merge it, otherwise create style={{ color: p2 }}
    if (p1.includes('style={') || p3.includes('style={')) {
      // Let's just convert it to a custom style property
      return `<AppText${p1}${p3} style={[style, { color: ${p2} }]}>`;
    } else {
      return `<AppText${p1}${p3} style={{ color: ${p2} }}>`;
    }
  }
);

// Let's also handle color="..." (string literal)
content = content.replace(
  /<AppText([^>]*?)\bcolor="([^"]+?)"([^>]*?)>/g,
  (match, p1, p2, p3) => {
    return `<AppText${p1}${p3} style={{ color: "${p2}" }}>`;
  }
);

// Remove weight prop from AppIcon
content = content.replace(
  /<AppIcon([^>]*?)\bweight="[^"]+?"([^>]*?)\/>/g,
  '<AppIcon$1$2 />'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('GuestHomeScreen.tsx fixed!');
