import Svg, { Path, Rect } from 'react-native-svg';
import { authLoginTheme } from '@/src/features/auth/constants/authTheme';

type AuthFieldIconProps = {
  size?: number;
  color?: string;
};

/** Outline envelope — login email field */
export function AuthEmailIcon({
  size = 18,
  color = authLoginTheme.brandBlue,
}: AuthFieldIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7.5L12 13l8-5.5M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Outline padlock — login password field */
export function AuthLockIcon({
  size = 18,
  color = authLoginTheme.brandBlue,
}: AuthFieldIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={5}
        y={11}
        width={14}
        height={10}
        rx={2}
        stroke={color}
        strokeWidth={1.75}
      />
      <Path
        d="M8 11V8a4 4 0 118 0v3"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Outline person — signup name field */
export function AuthUserIcon({
  size = 18,
  color = authLoginTheme.brandBlue,
}: AuthFieldIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12a4 4 0 100-8 4 4 0 000 8zM6 20v-1a6 6 0 0112 0v1"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export type AuthFieldIconType = 'email' | 'password' | 'user';

export function AuthFieldLeadingIcon({
  type,
  size,
  color,
}: AuthFieldIconProps & { type: AuthFieldIconType }) {
  if (type === 'email') return <AuthEmailIcon size={size} color={color} />;
  if (type === 'user') return <AuthUserIcon size={size} color={color} />;
  return <AuthLockIcon size={size} color={color} />;
}
