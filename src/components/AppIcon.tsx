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
import Svg, { Path } from 'react-native-svg';
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
