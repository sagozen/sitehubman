import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { RealIcon } from '@/src/components/RealIcon';
import {
  CUSTOMER_FLOWS,
  type CustomerFlowDefinition,
  type CustomerFlowId,
} from '@/src/constants/customerFlows';
import { squircleTileStyle } from '@/src/components/SquircleIconTile';
import { iosDesign } from '@/src/design-system/ios';

type Props = {
  flowId: CustomerFlowId;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** Squircle tile with the flow's real/native icon. */
export function CustomerFlowIcon({ flowId, size = 44, color, style }: Props) {
  const flow = CUSTOMER_FLOWS[flowId];
  const iconSize = Math.round(size * 0.52);

  return (
    <View style={[squircleTileStyle(size), styles.tile, style]}>
      <RealIcon
        id={flow.realIcon}
        size={iconSize}
        color={color ?? flow.tint}
        fallbackIcon={flow.fallbackIcon}
      />
    </View>
  );
}

export function CustomerFlowIconBadge({
  flow,
  size = 40,
}: {
  flow: CustomerFlowDefinition;
  size?: number;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: `${flow.tint}18`, borderColor: `${flow.tint}33` }]}>
      <RealIcon
        id={flow.realIcon}
        size={size}
        color={flow.tint}
        fallbackIcon={flow.fallbackIcon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(60,60,67,0.08)',
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: iosDesign.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
