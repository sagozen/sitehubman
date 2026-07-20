import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { CachedImage } from '@/src/components/CachedImage';

type GeneratedProfileIconProps = {
  name?: string | null;
  subtitle?: string | null;
  seed?: string | null;
  photoUrl?: string | null;
  size?: number;
  variant?: 'circle' | 'squircle';
  style?: StyleProp<ViewStyle>;
};

const PALETTES: { colors: readonly [string, string]; iconColor: string; textColor: string }[] = [
  { colors: ['#0F766E', '#38BDF8'], iconColor: '#ECFEFF', textColor: '#FFFFFF' },
  { colors: ['#4338CA', '#E11D48'], iconColor: '#EEF2FF', textColor: '#FFFFFF' },
  { colors: ['#14532D', '#F59E0B'], iconColor: '#FEFCE8', textColor: '#FFFFFF' },
  { colors: ['#111827', '#64748B'], iconColor: '#F8FAFC', textColor: '#FFFFFF' },
  { colors: ['#7C2D12', '#DB2777'], iconColor: '#FFF7ED', textColor: '#FFFFFF' },
  { colors: ['#164E63', '#22C55E'], iconColor: '#F0FDFA', textColor: '#FFFFFF' },
];

const ICONS: AppIconName[] = ['UserRound', 'Nfc', 'Sparkles', 'QrCode', 'Link', 'BadgeCheck', 'Wallet', 'Zap'];

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function initialsFor(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return 'EC';
  const parts = trimmed
    .replace(/[^A-Za-z0-9\s@._-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'EC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function GeneratedProfileIcon({
  name,
  subtitle,
  seed,
  photoUrl,
  size = 64,
  variant = 'squircle',
  style,
}: GeneratedProfileIconProps) {
  const safeSize = Math.max(36, size);
  const radius = variant === 'circle' ? safeSize / 2 : Math.round(safeSize * 0.32);
  const hash = hashSeed([seed, name, subtitle].filter(Boolean).join('|') || 'sitehub-ecard-profile');
  const palette = PALETTES[hash % PALETTES.length];
  const icon = ICONS[Math.floor(hash / PALETTES.length) % ICONS.length];
  const initials = initialsFor(name);

  return (
    <View
      style={[
        styles.shell,
        {
          width: safeSize,
          height: safeSize,
          borderRadius: radius,
        },
        style,
      ]}
    >
      {photoUrl?.trim() ? (
        <CachedImage
          uri={photoUrl}
          width={safeSize}
          height={safeSize}
          thumbnail
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          accessibilityLabel={`${name || 'Profile'} photo`}
        />
      ) : (
        <LinearGradient
          colors={palette.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.generated]}
        >
          <View style={styles.highlight} />
          <AppIcon name={icon} size={Math.round(safeSize * 0.36)} color={palette.iconColor} />
          <View style={styles.initialsBadge}>
            <AppText
              style={[
                styles.initials,
                {
                  color: palette.textColor,
                  fontSize: Math.max(11, Math.round(safeSize * 0.2)),
                },
              ]}
              numberOfLines={1}
            >
              {initials}
            </AppText>
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.48)',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  generated: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: 'center',
  },
  initials: {
    fontWeight: '900',
    letterSpacing: 0,
  },
});
