import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppButton, type ButtonVariant, type ButtonSize } from '@/src/components/AppButton';
import { appRoutes } from '@/src/constants/navigation';
import { usePreferences } from '@/src/hooks/usePreferences';
import { HapticTap } from '@/src/utils/haptics';

// Apple Marketplace Palette
const APPLE_BLUE = '#0071E3';
const APPLE_BG_LIGHT = '#FBFBFD';
const APPLE_BG_DARK = '#1C1C1E';
const APPLE_CARD_LIGHT = '#FFFFFF';
const APPLE_CARD_DARK = '#2C2C2E';
const APPLE_TEXT_LIGHT = '#1D1D1F';
const APPLE_TEXT_DARK = '#F5F5F7';
const APPLE_GRAY = '#86868B';
const APPLE_BORDER_LIGHT = '#E5E5EA';
const APPLE_BORDER_DARK = '#3A3A3C';
const APPLE_GREEN = '#34C759';

interface PageItem {
  id: string;
  title: string;
  description: string;
  route: Href;
  icon: AppIconName;
  badge?: string;
}

const CUSTOMER_PAGES: PageItem[] = [
  {
    id: 'account',
    title: 'Customer Dashboard',
    description: 'Main Apple Marketplace account & active NFC cards overview.',
    route: '/customer' as Href,
    icon: 'Home',
    badge: 'Main',
  },
  {
    id: 'profile',
    title: 'Customer Profile',
    description: 'Manage personal details, bio, and social links.',
    route: '/customer/profile' as Href,
    icon: 'User',
  },
  {
    id: 'analysis',
    title: 'Analytics & Insights',
    description: '3D NFC scan stats, engagement metrics, and signals.',
    route: appRoutes.customerAnalysis as Href,
    icon: 'BarChart2',
    badge: 'Live',
  },
  {
    id: 'orders',
    title: 'Orders History',
    description: 'Track NFC card production, printing, and shipping status.',
    route: '/customer/orders' as Href,
    icon: 'ClipboardList',
  },
  {
    id: 'notifications',
    title: 'Notifications Hub',
    description: 'System alerts, NFC taps, and connection requests.',
    route: '/customer/notifications' as Href,
    icon: 'Bell',
  },
  {
    id: 'connections',
    title: 'Connections & Moments',
    description: 'Network directory of people who tapped your card.',
    route: appRoutes.customerConnections as Href,
    icon: 'Users',
  },
  {
    id: 'qr',
    title: 'QR Code Generator',
    description: 'Instant QR code backup for your digital card.',
    route: appRoutes.qrGenerator as Href,
    icon: 'Nfc',
  },
  {
    id: 'share',
    title: 'Share Profile / Card',
    description: 'iOS share sheet, NFC beam, and social sharing.',
    route: appRoutes.customerShare as Href,
    icon: 'Share2',
  },
  {
    id: 'studio',
    title: '3D Card Studio',
    description: 'Design and customize physical NFC metal/PVC cards.',
    route: '/studio' as Href,
    icon: 'Sliders',
    badge: '3D',
  },
  {
    id: 'templates',
    title: 'Design Templates',
    description: 'Browse Apple-style marketplace card themes.',
    route: '/customer/templates' as Href,
    icon: 'Copy',
  },
  {
    id: 'promotional',
    title: 'Promotional Preview',
    description: 'Marketing showcases and interactive previews.',
    route: '/promotional-preview' as Href,
    icon: 'BadgePercent',
  },
  {
    id: 'icons',
    title: 'Icon System Gallery',
    description: 'Preview all 200+ vector icons across 4 styles.',
    route: '/icon-preview' as Href,
    icon: 'BadgeCheck',
  },
];

export function CustomerPreviewScreen() {
  const { isDark } = usePreferences();
  const [activeTab, setActiveTab] = useState<'pages' | 'buttons'>('pages');
  const [clickCount, setClickCount] = useState(0);
  const [lastPressed, setLastPressed] = useState<string>('None');

  const bgCol = isDark ? APPLE_BG_DARK : APPLE_BG_LIGHT;
  const cardCol = isDark ? APPLE_CARD_DARK : APPLE_CARD_LIGHT;
  const textCol = isDark ? APPLE_TEXT_DARK : APPLE_TEXT_LIGHT;
  const borderCol = isDark ? APPLE_BORDER_DARK : APPLE_BORDER_LIGHT;

  const handleButtonPress = (name: string) => {
    setClickCount((prev) => prev + 1);
    setLastPressed(name);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgCol }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: borderCol }]}>
        <AppButton
          variant="back"
          label="Back"
          onPress={() => router.back()}
          style={styles.backBtn}
        />
        <View style={styles.headerTitleContainer}>
          <AppText variant="h3" weight="bold" style={{ color: textCol }}>
            Apple Marketplace Lab
          </AppText>
          <AppText variant="caption" style={{ color: APPLE_GRAY }}>
            Showcase & Navigation Hub
          </AppText>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Segmented Control Switcher */}
      <View style={[styles.segmentContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <AppButton
          variant={activeTab === 'pages' ? 'white' : 'ghost'}
          label="📁 Pages Explorer (12)"
          fullWidth={false}
          style={[styles.segmentBtn, activeTab === 'pages' && styles.segmentActive]}
          onPress={() => {
            HapticTap.light();
            setActiveTab('pages');
          }}
        />
        <AppButton
          variant={activeTab === 'buttons' ? 'white' : 'ghost'}
          label="🔘 34 iOS Buttons API"
          fullWidth={false}
          style={[styles.segmentBtn, activeTab === 'buttons' && styles.segmentActive]}
          onPress={() => {
            HapticTap.light();
            setActiveTab('buttons');
          }}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'pages' ? (
          /* TAB 1: CUSTOMER PAGES EXPLORER */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="h3" weight="bold" style={{ color: textCol }}>
                All Customer Screens
              </AppText>
              <AppText variant="bodySmall" style={{ color: APPLE_GRAY, marginTop: 4 }}>
                Tap any card to instantly navigate and preview the live page.
              </AppText>
            </View>

            <View style={styles.grid}>
              {CUSTOMER_PAGES.map((page) => (
                <View
                  key={page.id}
                  style={[styles.pageCard, { backgroundColor: cardCol, borderColor: borderCol }]}
                >
                  <View style={styles.pageCardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(0,113,227,0.1)' }]}>
                      <AppIcon name={page.icon} size={22} color={APPLE_BLUE} />
                    </View>
                    {page.badge && (
                      <View style={[styles.badge, { backgroundColor: APPLE_BLUE }]}>
                        <AppText variant="caption" weight="bold" style={{ color: '#FFFFFF', fontSize: 11 }}>
                          {page.badge}
                        </AppText>
                      </View>
                    )}
                  </View>
                  <AppText variant="body" weight="bold" style={{ color: textCol, marginTop: 12 }}>
                    {page.title}
                  </AppText>
                  <AppText variant="caption" style={{ color: APPLE_GRAY, marginTop: 4, minHeight: 32 }}>
                    {page.description}
                  </AppText>
                  <View style={styles.pageCardFooter}>
                    <AppButton
                      variant="soft"
                      size="sm"
                      label="Launch Preview"
                      iconName="ChevronRight"
                      iconPosition="right"
                      onPress={() => {
                        HapticTap.medium();
                        router.push(page.route);
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* TAB 2: 34 IOS BUTTONS INTERACTIVE GALLERY */
          <View style={styles.section}>
            {/* Interactive Stats Bar */}
            <View style={[styles.statsBar, { backgroundColor: cardCol, borderColor: borderCol }]}>
              <View style={styles.statItem}>
                <AppText variant="caption" style={{ color: APPLE_GRAY }}>Total API</AppText>
                <AppText variant="h3" weight="bold" style={{ color: APPLE_BLUE }}>34 Buttons</AppText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: borderCol }]} />
              <View style={styles.statItem}>
                <AppText variant="caption" style={{ color: APPLE_GRAY }}>Live Clicks</AppText>
                <AppText variant="h3" weight="bold" style={{ color: APPLE_GREEN }}>{clickCount}</AppText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: borderCol }]} />
              <View style={styles.statItem}>
                <AppText variant="caption" style={{ color: APPLE_GRAY }}>Last Pressed</AppText>
                <AppText variant="bodySmall" weight="bold" style={{ color: textCol }} numberOfLines={1}>
                  {lastPressed}
                </AppText>
              </View>
            </View>

            {/* 1. CORE BUTTONS */}
            <View style={styles.categoryGroup}>
              <AppText variant="h4" weight="bold" style={{ color: textCol, marginBottom: 12 }}>
                1. Core Buttons (4)
              </AppText>
              <View style={styles.buttonRow}>
                <AppButton variant="primary" label="iOS Primary" onPress={() => handleButtonPress('Primary')} />
                <AppButton variant="secondary" label="iOS Secondary" onPress={() => handleButtonPress('Secondary')} />
                <AppButton variant="tertiary" label="iOS Tertiary" onPress={() => handleButtonPress('Tertiary')} />
                <AppButton
                  variant="destructive"
                  label="iOS Destructive"
                  destructiveConfirm={true}
                  onPress={() => handleButtonPress('Destructive')}
                />
              </View>
            </View>

            {/* 2. STATUS BUTTONS */}
            <View style={styles.categoryGroup}>
              <AppText variant="h4" weight="bold" style={{ color: textCol, marginBottom: 12 }}>
                2. Status Buttons (4)
              </AppText>
              <View style={styles.buttonRow}>
                <AppButton variant="success" label="iOS Success" iconName="BadgeCheck" onPress={() => handleButtonPress('Success')} />
                <AppButton variant="warning" label="iOS Warning" iconName="AlertCircle" onPress={() => handleButtonPress('Warning')} />
                <AppButton variant="disabled" label="iOS Disabled" disabled />
                <AppButton variant="loading" label="Processing..." loading={true} />
              </View>
            </View>

            {/* 3. GLASS BUTTONS */}
            <View style={styles.categoryGroup}>
              <AppText variant="h4" weight="bold" style={{ color: textCol, marginBottom: 12 }}>
                3. Glass & Floating Buttons (4)
              </AppText>
              <View style={styles.buttonRow}>
                <AppButton variant="ghost" label="iOS Ghost" onPress={() => handleButtonPress('Ghost')} />
                <AppButton variant="glass" label="iOS Glass" glass={true} onPress={() => handleButtonPress('Glass')} />
                <AppButton variant="glass-primary" label="iOS Glass Primary" glass={true} shadow="medium" onPress={() => handleButtonPress('Glass Primary')} />
                <View style={styles.fabContainer}>
                  <AppButton variant="floating" iconName="Plus" shadow="floating" onPress={() => handleButtonPress('Floating FAB')} />
                  <AppText variant="caption" style={{ color: APPLE_GRAY, marginTop: 6 }}>FAB</AppText>
                </View>
              </View>
            </View>

            {/* 4. ICON BUTTONS */}
            <View style={styles.categoryGroup}>
              <AppText variant="h4" weight="bold" style={{ color: textCol, marginBottom: 12 }}>
                4. Icon Buttons (8)
              </AppText>
              <View style={styles.buttonRow}>
                <AppButton variant="icon" label="Add Item" iconName="Plus" onPress={() => handleButtonPress('Icon Label')} />
                <View style={styles.iconCol}>
                  <AppButton variant="icon-circle" iconName="Sliders" onPress={() => handleButtonPress('Icon Circle')} />
                  <AppText variant="caption" style={{ color: APPLE_GRAY }}>Circle</AppText>
                </View>
                <AppButton variant="back" label="Back Nav" onPress={() => handleButtonPress('Back')} />
                <View style={styles.iconCol}>
                  <AppButton variant="close" onPress={() => handleButtonPress('Close')} />
                  <AppText variant="caption" style={{ color: APPLE_GRAY }}>Close</AppText>
                </View>
                <AppButton variant="share" label="Share" onPress={() => handleButtonPress('Share')} />
                <AppButton variant="scan" label="Scan NFC" onPress={() => handleButtonPress('Scan')} />
                <AppButton variant="add" label="Add New" onPress={() => handleButtonPress('Add')} />
                <AppButton variant="edit" label="Edit Bio" onPress={() => handleButtonPress('Edit')} />
              </View>
            </View>

            {/* 5. ACTION BUTTONS & SIZES */}
            <View style={styles.categoryGroup}>
              <AppText variant="h4" weight="bold" style={{ color: textCol, marginBottom: 12 }}>
                5. Action Buttons & Sizes (8)
              </AppText>
              <View style={styles.buttonRow}>
                <AppButton variant="pill" label="Filter Pill" onPress={() => handleButtonPress('Pill')} />
                <AppButton variant="outline" label="Outline Border" onPress={() => handleButtonPress('Outline')} />
                <AppButton variant="soft" label="Soft Tinted" onPress={() => handleButtonPress('Soft')} />
                <AppButton variant="link" label="Text Link →" onPress={() => handleButtonPress('Link')} />
              </View>
              <AppText variant="caption" weight="bold" style={{ color: APPLE_GRAY, marginTop: 16, marginBottom: 8 }}>
                Size Variations (mini, sm, default, lg, bottomCTA):
              </AppText>
              <View style={styles.buttonRow}>
                <AppButton variant="primary" size="mini" label="Mini 32px" fullWidth={false} onPress={() => handleButtonPress('Mini')} />
                <AppButton variant="primary" size="sm" label="Small 40px" fullWidth={false} onPress={() => handleButtonPress('Small')} />
                <AppButton variant="primary" size="default" label="Default 52px" fullWidth={false} onPress={() => handleButtonPress('Default')} />
              </View>
              <View style={{ marginTop: 10 }}>
                <AppButton variant="primary" size="lg" label="Large CTA 58px" onPress={() => handleButtonPress('Large')} />
              </View>
              <View style={{ marginTop: 10 }}>
                <AppButton variant="glass-primary" size="bottomCTA" label="Bottom Sticky CTA 56px" shadow="medium" onPress={() => handleButtonPress('Bottom CTA')} />
              </View>
            </View>

            {/* 6. NAVIGATION BUTTONS */}
            <View style={styles.categoryGroup}>
              <AppText variant="h4" weight="bold" style={{ color: textCol, marginBottom: 12 }}>
                6. Navigation Buttons (4)
              </AppText>
              <View style={styles.buttonRow}>
                <AppButton variant="dark" label="iOS Dark" onPress={() => handleButtonPress('Dark')} />
                <AppButton variant="white" label="iOS White" onPress={() => handleButtonPress('White')} />
                <AppButton variant="approval" label="Approve" iconName="BadgeCheck" onPress={() => handleButtonPress('Approve')} />
                <AppButton variant="reject" label="Reject" destructiveConfirm={true} onPress={() => handleButtonPress('Reject')} />
              </View>
            </View>

            {/* 7. SPECIAL BUTTONS */}
            <View style={styles.categoryGroup}>
              <AppText variant="h4" weight="bold" style={{ color: textCol, marginBottom: 12 }}>
                7. Special Buttons (2)
              </AppText>
              <View style={styles.buttonRow}>
                <AppButton variant="urgent" label="🚨 Urgent Action" shadow="medium" onPress={() => handleButtonPress('Urgent')} />
                <View style={styles.iconCol}>
                  <AppButton variant="menu" onPress={() => handleButtonPress('Menu')} />
                  <AppText variant="caption" style={{ color: APPLE_GRAY }}>Menu</AppText>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  } as ViewStyle,
  backBtn: {
    minWidth: 60,
  } as ViewStyle,
  headerTitleContainer: {
    alignItems: 'center',
  } as ViewStyle,
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  } as ViewStyle,
  segmentBtn: {
    flex: 1,
    height: 38,
    minHeight: 38,
    borderRadius: 10,
  } as ViewStyle,
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  } as ViewStyle,
  section: {
    flex: 1,
  } as ViewStyle,
  sectionHeader: {
    marginBottom: 16,
  } as ViewStyle,
  grid: {
    gap: 16,
  } as ViewStyle,
  pageCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,
  pageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  } as ViewStyle,
  pageCardFooter: {
    marginTop: 16,
  } as ViewStyle,
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  statDivider: {
    width: 1,
    height: 30,
  } as ViewStyle,
  categoryGroup: {
    marginBottom: 28,
  } as ViewStyle,
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  } as ViewStyle,
  iconCol: {
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  fabContainer: {
    alignItems: 'center',
  } as ViewStyle,
});
