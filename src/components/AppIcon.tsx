import type { ComponentProps } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { usePreferences } from '@/src/hooks/usePreferences';
import * as Solar from '@solar-icons/react-native';
import { memo } from 'react';

export type AppIconName = string;

const DEFAULT_ICON_SIZE = 22;

export type IconVariant = 
  | 'phosphor-duotone'
  | 'phosphor-fill'
  | 'solar-bold'
  | 'solar-duotone'
  | 'lucide-minimal'
  | 'default';

export type IconUsage = 
  | 'navigation'
  | 'toolbar'
  | 'card'
  | 'input';

// Map usage presets to exact pixel sizes requested
const USAGE_SIZES: Record<IconUsage, number> = {
  navigation: 24,
  toolbar: 22,
  card: 20,
  input: 18,
};

// ─── Direct mappings from friendly names to Ionicons / Feather ─────────────────
const ionicMap: Record<string, { outline: keyof typeof Ionicons.glyphMap; fill: keyof typeof Ionicons.glyphMap }> = {
  Home: { outline: 'home-outline', fill: 'home' },
  CreditCard: { outline: 'card-outline', fill: 'card' },
  Wallet: { outline: 'wallet-outline', fill: 'wallet' },
  User: { outline: 'person-outline', fill: 'person' },
  ClipboardList: { outline: 'clipboard-outline', fill: 'clipboard' },
  Search: { outline: 'search-outline', fill: 'search' },
  Sliders: { outline: 'settings-outline', fill: 'settings' },
  Printer: { outline: 'print-outline', fill: 'print' },
  Bell: { outline: 'notifications-outline', fill: 'notifications' },
  Users: { outline: 'people-outline', fill: 'people' },
  BarChart2: { outline: 'bar-chart-outline', fill: 'bar-chart' },
  Copy: { outline: 'copy-outline', fill: 'copy' },
  Share2: { outline: 'share-outline', fill: 'share' },
  Plus: { outline: 'add-outline', fill: 'add' },
  X: { outline: 'close-outline', fill: 'close' },
  BadgePercent: { outline: 'pricetag-outline', fill: 'pricetag' },
  AlertCircle: { outline: 'alert-circle-outline', fill: 'alert-circle' },
  ChevronRight: { outline: 'chevron-forward-outline', fill: 'chevron-forward' },
  ChevronLeft: { outline: 'chevron-back-outline', fill: 'chevron-back' },
  ChevronUp: { outline: 'chevron-up-outline', fill: 'chevron-up' },
  ChevronDown: { outline: 'chevron-down-outline', fill: 'chevron-down' },
  PenLine: { outline: 'create-outline', fill: 'create' },
  Trash2: { outline: 'trash-outline', fill: 'trash' },
  BadgeCheck: { outline: 'checkmark-circle-outline', fill: 'checkmark-circle' },
  Nfc: { outline: 'radio-outline', fill: 'radio' },
  Camera: { outline: 'camera-outline', fill: 'camera' },
  Lock: { outline: 'lock-closed-outline', fill: 'lock-closed' },
  MapPin: { outline: 'pin-outline', fill: 'pin' },
  Mail: { outline: 'mail-outline', fill: 'mail' },
  Phone: { outline: 'call-outline', fill: 'call' },
  Info: { outline: 'information-circle-outline', fill: 'information-circle' },
  ShieldCheck: { outline: 'shield-checkmark-outline', fill: 'shield-checkmark' },
  ExternalLink: { outline: 'open-outline', fill: 'open' },
  Download: { outline: 'download-outline', fill: 'download' },
  CheckCheck: { outline: 'checkmark-done-outline', fill: 'checkmark-done' },
  Clock: { outline: 'time-outline', fill: 'time' },
  Eye: { outline: 'eye-outline', fill: 'eye' },
  EyeOff: { outline: 'eye-off-outline', fill: 'eye-off' },
  Star: { outline: 'star-outline', fill: 'star' },
  Heart: { outline: 'heart-outline', fill: 'heart' },
  UserRound: { outline: 'person-outline', fill: 'person' },
  Briefcase: { outline: 'briefcase-outline', fill: 'briefcase' },
  Link: { outline: 'link-outline', fill: 'link' },
  PlusSimple: { outline: 'add-outline', fill: 'add' },
  LogOut: { outline: 'log-out-outline', fill: 'log-out' },
};

const featherMap: Record<string, keyof typeof Feather.glyphMap> = {
  Home: 'home',
  CreditCard: 'credit-card',
  Wallet: 'credit-card',
  User: 'user',
  ClipboardList: 'clipboard',
  Search: 'search',
  Sliders: 'sliders',
  Printer: 'printer',
  Bell: 'bell',
  Users: 'users',
  BarChart2: 'bar-chart-2',
  Copy: 'copy',
  Share2: 'share-2',
  Plus: 'plus',
  X: 'x',
  BadgePercent: 'tag',
  AlertCircle: 'alert-circle',
  ChevronRight: 'chevron-right',
  ChevronLeft: 'chevron-left',
  ChevronUp: 'chevron-up',
  ChevronDown: 'chevron-down',
  PenLine: 'edit-2',
  Trash2: 'trash-2',
  BadgeCheck: 'check-circle',
  Nfc: 'rss',
  Camera: 'camera',
  Lock: 'lock',
  MapPin: 'map-pin',
  Mail: 'mail',
  Phone: 'phone',
  Info: 'info',
  ShieldCheck: 'shield',
  ExternalLink: 'external-link',
  Download: 'download',
  CheckCheck: 'check',
  Clock: 'clock',
  Eye: 'eye',
  EyeOff: 'eye-off',
  Star: 'star',
  Heart: 'heart',
};

// Solar specific overrides mapping
const solarKeyMap: Record<string, string> = {
  Home: 'Home',
  CreditCard: 'Card2',
  Wallet: 'Wallet',
  User: 'User',
  ClipboardList: 'ClipboardList',
  Search: 'Magnifier',
  Sliders: 'Settings',
  Printer: 'Printer',
  Bell: 'Bell',
  Users: 'UsersGroupTwoRounded',
  BarChart2: 'Chart',
  Copy: 'Copy',
  Share2: 'Share',
  Plus: 'AddCircle',
  X: 'CloseCircle',
  BadgePercent: 'Sale',
  AlertCircle: 'DangerCircle',
  ChevronRight: 'AltArrowRight',
  ChevronLeft: 'AltArrowLeft',
  ChevronUp: 'AltArrowUp',
  ChevronDown: 'AltArrowDown',
  PenLine: 'Pen',
  Trash2: 'TrashBinTrash',
  BadgeCheck: 'CheckCircle',
  Nfc: 'Scanner',
  Camera: 'Camera',
  Lock: 'Lock',
  MapPin: 'MapPoint',
  Mail: 'Letter',
  Phone: 'Phone',
  Info: 'InfoSquare',
  ShieldCheck: 'ShieldCheck',
  ExternalLink: 'Login',
  Download: 'Download',
  CheckCheck: 'CheckCircle',
  Clock: 'ClockCircle',
  Eye: 'Eye',
  EyeOff: 'EyeClosed',
  UserRound: 'User',
  Briefcase: 'Case',
  Link: 'Link',
  PlusSimple: 'AddCircle',
  LogOut: 'Logout',
};

interface AppIconProps extends Omit<ComponentProps<typeof Feather>, 'size' | 'color' | 'name'> {
  name: string;
  variant?: IconVariant;
  usage?: IconUsage;
  size?: number;
  color?: string;
}

const AppIconRaw = ({
  name,
  variant,
  usage,
  size,
  color,
  ...rest
}: AppIconProps) => {
  const { colors } = usePreferences();
  const resolvedColor = color ?? colors.textPrimary;
  
  // Resolve size based on usage preset or direct size prop
  const resolvedSize = size ?? (usage ? USAGE_SIZES[usage] : DEFAULT_ICON_SIZE);

  // Read preferred global variant if not explicitly passed
  // We default to 'solar-duotone' or 'phosphor-duotone' for premium UI feel
  const resolvedVariant = variant ?? 'solar-duotone';

  // 1. Solar Bold or Solar Duotone
  if (resolvedVariant === 'solar-bold' || resolvedVariant === 'solar-duotone') {
    const baseSolarName = solarKeyMap[name] || name;
    const suffix = resolvedVariant === 'solar-duotone' ? 'BoldDuotone' : 'Bold';
    const solarKey = `${baseSolarName}${suffix}`;

    if (solarKey in Solar) {
      const SolarIconComponent = Solar[solarKey as keyof typeof Solar] as any;
      return (
        <SolarIconComponent
          size={resolvedSize}
          color={resolvedColor}
          {...rest}
        />
      );
    }
  }

  // 2. Phosphor Duotone
  if (resolvedVariant === 'phosphor-duotone') {
    const mapping = ionicMap[name];
    if (mapping) {
      return (
        <View style={{ width: resolvedSize, height: resolvedSize, alignItems: 'center', justifyContent: 'center' }}>
          {/* Duotone Layer 1: Low opacity filled shape */}
          <Ionicons
            name={mapping.fill}
            size={resolvedSize}
            color={resolvedColor}
            style={[StyleSheet.absoluteFillObject, { opacity: 0.15 }]}
          />
          {/* Duotone Layer 2: Full opacity outline shape */}
          <Ionicons
            name={mapping.outline}
            size={resolvedSize}
            color={resolvedColor}
          />
        </View>
      );
    }
  }

  // 3. Phosphor Fill
  if (resolvedVariant === 'phosphor-fill') {
    const mapping = ionicMap[name];
    if (mapping) {
      return (
        <Ionicons
          name={mapping.fill}
          size={resolvedSize}
          color={resolvedColor}
          {...rest}
        />
      );
    }
  }

  // 4. Lucide / Minimal Linear style (using Feather with consistent stroke weight)
  if (resolvedVariant === 'lucide-minimal' || resolvedVariant === 'default') {
    const featherName = featherMap[name] || name;
    if (featherName in Feather.glyphMap) {
      return (
        <Feather
          name={featherName as any}
          size={resolvedSize}
          color={resolvedColor}
          strokeWidth={1.8} // Consistent, premium thin weight
          {...rest}
        />
      );
    }
  }

  // Fallback to basic Ionicons Outline
  const fallbackMapping = ionicMap[name];
  if (fallbackMapping) {
    return (
      <Ionicons
        name={fallbackMapping.outline}
        size={resolvedSize}
        color={resolvedColor}
        {...rest}
      />
    );
  }

  // Final fallback Feather representation
  const finalFeatherName = featherMap[name] in Feather.glyphMap ? featherMap[name] : 'info';
  return (
    <Feather
      name={finalFeatherName as any}
      size={resolvedSize}
      color={resolvedColor}
      strokeWidth={1.8}
      {...rest}
    />
  );
};

// MEMOIZE: Prevent unnecessary re-renders when props are unchanged
export const AppIcon = memo(AppIconRaw);
