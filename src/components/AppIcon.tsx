/**
 * AppIcon - shared icon component using Feather (standard Lucide-inspired linear vectors).
 * Keeps icon style consistent globally (same stroke width, default size 22px).
 */

import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';
import { usePreferences } from '@/src/hooks/usePreferences';

const DEFAULT_ICON_SIZE = 22;

type FeatherIconProps = ComponentProps<typeof Feather>;

// ─── Direct mappings from previous names to Feather (Lucide) icons ──────────
const icons: Record<string, keyof typeof Feather.glyphMap> = {
  Archive: 'archive',
  ArchiveRestore: 'archive',
  ArrowLeft: 'arrow-left',
  BadgeDollarSign: 'dollar-sign',
  BadgeCheck: 'check-circle',
  BarChart: 'bar-chart-2',
  BarChart2: 'bar-chart-2',
  Bell: 'bell',
  Briefcase: 'briefcase',
  Building2: 'home',
  Calendar: 'calendar',
  CalendarDays: 'calendar',
  Camera: 'camera',
  Check: 'check',
  CheckCheck: 'check',
  CheckCircle: 'check-circle',
  ChevronDown: 'chevron-down',
  ChevronLeft: 'chevron-left',
  ChevronRight: 'chevron-right',
  ChevronUp: 'chevron-up',
  ClipboardList: 'clipboard',
  Clock: 'clock',
  CreditCard: 'credit-card',
  Circle: 'circle',
  CircleAlert: 'alert-circle',
  CircleCheck: 'check-circle',
  CircleDollarSign: 'dollar-sign',
  CircleUserRound: 'user',
  AlertCircle: 'alert-circle',
  Lock: 'lock',
  Sliders: 'sliders',
  CloudUpload: 'upload-cloud',
  TrendingUp: 'trending-up',
  TrendingDown: 'trending-down',
  Minus: 'minus',
  DollarSign: 'dollar-sign',
  Banknote: 'credit-card',
  QrCode: 'grid',
  ExternalLink: 'external-link',
  Download: 'download',
  Eye: 'eye',
  EyeOff: 'eye-off',
  FileText: 'file-text',
  FileVideo: 'video',
  FlipHorizontal: 'repeat',
  Globe: 'globe',
  Twitter: 'twitter',
  Facebook: 'facebook',
  Linkedin: 'linkedin',
  Home: 'home',
  History: 'clock',
  Image: 'image',
  Info: 'info',
  Instagram: 'instagram',
  Link: 'link',
  LogOut: 'log-out',
  Loader: 'loader',
  Loader2: 'loader',
  MapPin: 'map-pin',
  Mail: 'mail',
  MoreHorizontal: 'more-horizontal',
  MoreVertical: 'more-vertical',
  Nfc: 'rss',
  Package: 'package',
  PenLine: 'edit-2',
  Phone: 'phone',
  Printer: 'printer',
  Plus: 'plus',
  PlusSimple: 'plus',
  XCircle: 'x-circle',
  RefreshCw: 'refresh-cw',
  RotateCcw: 'rotate-ccw',
  Restart: 'rotate-ccw',
  ScanLine: 'maximize',
  Search: 'search',
  Settings: 'settings',
  Save: 'save',
  Send: 'send',
  Share: 'share-2',
  Share2: 'share-2',
  Shield: 'shield',
  ShieldCheck: 'shield',
  Snowflake: 'wind',
  Sparkles: 'sun',
  Tag: 'tag',
  Target: 'target',
  Trash2: 'trash-2',
  TriangleAlert: 'alert-triangle',
  Truck: 'truck',
  Upload: 'upload',
  User: 'user',
  UserPlus: 'user-plus',
  UserRound: 'user',
  Users: 'users',
  Wallet: 'credit-card',
  X: 'x',
  Zap: 'zap',
  ZapOff: 'zap-off',
  Bolt: 'zap',
  Pause: 'pause',
  Play: 'play',
};

import * as Solar from '@solar-icons/react-native';

// Fallback safety check for name mapping
const getFeatherName = (name: string): keyof typeof Feather.glyphMap => {
  const mappedName = icons[name];
  if (mappedName && mappedName in Feather.glyphMap) {
    return mappedName;
  }
  // Try direct lookup
  if (name in Feather.glyphMap) {
    return name as any;
  }
  // General fallbacks
  if (name.toLowerCase().includes('user')) return 'user';
  if (name.toLowerCase().includes('arrow')) return 'arrow-left';
  if (name.toLowerCase().includes('check')) return 'check';
  return 'info';
};

export type AppIconName = string;

interface AppIconProps extends Omit<FeatherIconProps, 'size' | 'color' | 'name'> {
  name: AppIconName;
  size?: number;
  color?: string;
}

export function AppIcon({
  name,
  size = DEFAULT_ICON_SIZE,
  color,
  ...rest
}: AppIconProps) {
  const { colors } = usePreferences();
  const resolvedColor = color ?? colors.textPrimary;

  // Map requested icon names to Solar bold/duotone components for premium Gen Z styling
  const solarMap: Record<string, keyof typeof Solar> = {
    Home: 'HomeBold',
    CreditCard: 'CardBold',
    Wallet: 'WalletBold',
    User: 'UserBold',
    ClipboardList: 'ClipboardListBold',
    Search: 'MagnifierBold',
    Sliders: 'SettingsBold',
    Printer: 'PrinterBold',
    Bell: 'BellBold',
    Users: 'UsersGroupTwoRoundedBold',
    BarChart2: 'ChartBold',
    Copy: 'CopyBold',
    Share2: 'ShareBold',
    Plus: 'AddCircleBold',
    X: 'CloseCircleBold',
    BadgePercent: 'SaleBold',
    AlertCircle: 'DangerCircleBold',
    ChevronRight: 'AltArrowRightBold',
    PenLine: 'PenBold',
    Trash2: 'TrashBinTrashBold',
    BadgeCheck: 'CheckCircleBold',
  };

  const solarKey = solarMap[name];
  if (solarKey && solarKey in Solar) {
    const SolarIconComponent = Solar[solarKey] as any;
    return (
      <SolarIconComponent
        size={size}
        color={resolvedColor}
        {...rest}
      />
    );
  }

  const featherName = getFeatherName(name);
  return (
    <Feather
      name={featherName}
      size={size}
      color={resolvedColor}
      {...rest}
    />
  );
}
