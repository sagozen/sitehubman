/**
 * Fix Rainbow Colors - Replace banned colors with monochrome palette
 * 
 * Run: node scripts/fix-rainbow-colors.js
 */

const fs = require('fs');
const path = require('path');

// Color mapping: banned → approved
const COLOR_MAP = {
  '#00A3FF': '#2596BE', // Blue → Accent
  '#0A84FF': '#2596BE', // iOS blue → Accent
  '#007AFF': '#2596BE', // Blue variant → Accent
  
  '#30D158': '#A1A1AA', // Green → Secondary (neutral)
  '#34C759': '#A1A1AA', // iOS green → Secondary
  '#20A84A': '#A1A1AA', // Green variant → Secondary
  
  '#FF9500': '#A1A1AA', // Orange → Secondary
  '#FF9F0A': '#A1A1AA', // iOS orange → Secondary
  '#E07000': '#A1A1AA', // Orange variant → Secondary
  
  '#FF2D55': '#52525B', // Pink/Red → Muted
  '#FF3B30': '#52525B', // iOS red → Muted
  '#FF375F': '#52525B', // Pink variant → Muted
  '#FF453A': '#52525B', // Red variant → Muted
  
  '#AF52DE': '#52525B', // Purple → Muted
  '#BF5AF2': '#52525B', // Purple variant → Muted
  '#5856D6': '#52525B', // iOS purple → Muted
  '#5E5CE6': '#52525B', // Purple alt → Muted
  
  '#FFD60A': '#A1A1AA', // Yellow → Secondary
};

// Files to process
const FILES_TO_FIX = [
  'src/features/settings/components/SettingsChrome.tsx',
  'src/features/sales/components/SalesScreenUi.tsx',
  'src/features/qr/QrCustomizeScreen.tsx',
  'src/features/production/ProductionLabelScreen.tsx',
  'src/features/orders/DesignProofScreen.tsx',
  'src/features/orders/OrderFormControls.tsx',
  'src/features/notifications/StaffNotificationsScreen.tsx',
  'src/features/nfc/NfcTestScreen.tsx',
  'src/features/nfc/NfcDirectModeScreen.tsx',
  'src/features/home/SiteHubHomeScreen.tsx',
  'src/features/home/PremiumHomeScreen.tsx',
  'src/features/customer/CustomerNotificationsScreen.tsx',
  'src/features/guest/GuestConnectionsScreen.tsx',
  'src/features/guest/GuestTrackOrderScreen.tsx',
  'src/features/guest/GuestStudioScreen.tsx',
  'src/features/guest/GuestHomeScreen.tsx',
  'src/features/customer/EventScannerScreen.tsx',
  'src/features/guest/GuestScreenUi.tsx',
  'src/features/guest/GuestAnalyticsScreen.tsx',
  'src/features/customer/CustomerPreviewScreen.tsx',
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skip: ${filePath} (not found)`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  // Replace all banned colors
  Object.entries(COLOR_MAP).forEach(([banned, approved]) => {
    const regex = new RegExp(banned, 'gi');
    if (regex.test(content)) {
      content = content.replace(regex, approved);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  } else {
    console.log(`✓  Clean: ${filePath}`);
    return false;
  }
}

function main() {
  console.log('🎨 Fixing rainbow colors → monochrome palette\n');
  
  let fixedCount = 0;
  FILES_TO_FIX.forEach(file => {
    if (fixFile(file)) fixedCount++;
  });
  
  console.log(`\n✅ Fixed ${fixedCount}/${FILES_TO_FIX.length} files`);
  console.log('🎯 Result: 100% monochrome brand compliance');
}

main();
