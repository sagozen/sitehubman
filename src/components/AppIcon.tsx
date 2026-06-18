/**
 * AppIcon - shared icon component using Solar Icons.
 */

import type { ComponentProps, ComponentType } from 'react';
import {
  AddCircle,
  AltArrowLeft,
  AltArrowRight,
  Archive,
  ArchiveUp,
  ArrowLeft,
  Bell,
  Bolt,
  BoltCircle,
  Box,
  Buildings2,
  Calendar,
  CalendarDate,
  Camera,
  Card,
  Case,
  CheckCircle,
  CheckRead,
  Chart,
  ClipboardList,
  ClockCircle,
  CloseCircle,
  DangerCircle,
  DangerTriangle,
  Delivery,
  Diskette,
  Dollar,
  DollarMinimalistic,
  Download,
  Eye,
  EyeClosed,
  FileText,
  FlipHorizontal,
  Gallery,
  GraphUp,
  History,
  Home,
  InfoCircle,
  Letter,
  Link,
  Logout,
  Magnifier,
  MapPoint,
  MenuDots,
  PenNewRound,
  Phone,
  Printer,
  QrCode,
  RecordCircle,
  Refresh,
  Restart,
  Scanner,
  Settings,
  SendSquare,
  Share,
  Shield,
  ShieldCheck,
  SmartphoneVibration,
  Snowflake,
  SquareArrowRightUp,
  Stars,
  Tag,
  Target,
  TrashBinTrash,
  Upload,
  User,
  UserCircle,
  UserPlus,
  UserRounded,
  UsersGroupRounded,
  VerifiedCheck,
  VideoFrame,
  Wallet,
} from '@solar-icons/react-native/Linear';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { theme } from '@/src/constants/theme';
import { usePreferences } from '@/src/hooks/usePreferences';

const DEFAULT_ICON_SIZE = theme.iconSize.md;
type SolarIconProps = ComponentProps<typeof Archive>;
type SolarIcon = ComponentType<SolarIconProps>;

/** Plain plus for filled circular buttons (avoids circle-on-circle from AddCircle). */
function PlusSimple({ size = DEFAULT_ICON_SIZE, color = 'currentColor' }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 7v10M7 12h10" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function InstagramSimple({ size = DEFAULT_ICON_SIZE, color = 'currentColor' }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.5 3.75h9A3.75 3.75 0 0 1 20.25 7.5v9a3.75 3.75 0 0 1-3.75 3.75h-9A3.75 3.75 0 0 1 3.75 16.5v-9A3.75 3.75 0 0 1 7.5 3.75Z"
        stroke={color}
        strokeWidth={1.6}
      />
      <Path
        d="M8.75 12a3.25 3.25 0 1 0 6.5 0 3.25 3.25 0 0 0-6.5 0Z"
        stroke={color}
        strokeWidth={1.6}
      />
      <Path d="M16.9 7.1h.01" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

function GlobeSimple({ size = DEFAULT_ICON_SIZE, color = 'currentColor' }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M2 12h20" />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
  );
}

function TwitterSimple({ size = DEFAULT_ICON_SIZE, color = 'currentColor' }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </Svg>
  );
}

function FacebookSimple({ size = DEFAULT_ICON_SIZE, color = 'currentColor' }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </Svg>
  );
}

function LinkedinSimple({ size = DEFAULT_ICON_SIZE, color = 'currentColor' }: SolarIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <Rect x="2" y="9" width="4" height="12" />
      <Circle cx="4" cy="4" r="2" />
    </Svg>
  );
}

const icons = {
  Archive,
  ArchiveRestore: ArchiveUp,
  ArrowLeft,
  BadgeDollarSign: DollarMinimalistic,
  BadgeCheck: VerifiedCheck,
  BarChart: Chart,
  Bell,
  Briefcase: Case,
  Building2: Buildings2,
  Calendar,
  CalendarDays: CalendarDate,
  Camera,
  Check: CheckCircle,
  CheckCheck: CheckRead,
  ChevronLeft: AltArrowLeft,
  ChevronRight: AltArrowRight,
  ClipboardList,
  Clock: ClockCircle,
  CreditCard: Card,
  Circle: RecordCircle,
  CircleAlert: DangerCircle,
  CircleCheck: CheckCircle,
  CircleDollarSign: Dollar,
  CircleUserRound: UserCircle,
  ExternalLink: SquareArrowRightUp,
  Download,
  Eye,
  EyeOff: EyeClosed,
  FileText,
  FileVideo: VideoFrame,
  FlipHorizontal,
  Globe: GlobeSimple,
  Twitter: TwitterSimple,
  Facebook: FacebookSimple,
  Linkedin: LinkedinSimple,
  Home,
  History,
  Image: Gallery,
  Info: InfoCircle,
  Instagram: InstagramSimple,
  Link,
  LogOut: Logout,
  Loader: Refresh,
  MapPin: MapPoint,
  Mail: Letter,
  MoreHorizontal: MenuDots,
  MoreVertical: MenuDots,
  Nfc: SmartphoneVibration,
  Package: Box,
  PenLine: PenNewRound,
  Phone,
  Printer,
  Plus: AddCircle,
  PlusSimple,
  QrCode,
  RefreshCw: Refresh,
  RotateCcw: Restart,
  ScanLine: Scanner,
  Search: Magnifier,
  Settings,
  Save: Diskette,
  Send: SendSquare,
  Share,
  Share2: Share,
  Shield,
  ShieldCheck,
  Snowflake,
  Sparkles: Stars,
  Tag,
  Target,
  Trash2: TrashBinTrash,
  TriangleAlert: DangerTriangle,
  TrendingUp: GraphUp,
  Truck: Delivery,
  Upload,
  User,
  UserPlus,
  UserRound: UserRounded,
  Users: UsersGroupRounded,
  Wallet,
  X: CloseCircle,
  Zap: Bolt,
  ZapOff: BoltCircle,
} satisfies Record<string, SolarIcon>;

export type AppIconName = keyof typeof icons;

interface AppIconProps extends Omit<SolarIconProps, 'size' | 'color'> {
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
  const Icon = icons[name] as SolarIcon | undefined;
  const resolvedColor = color ?? colors.textPrimary;

  if (!Icon) {
    return <View style={{ width: size, height: size }} />;
  }

  return <Icon size={size} color={resolvedColor} {...rest} />;
}
