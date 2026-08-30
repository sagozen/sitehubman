/**
 * OrderTimelineV2 — Premium SaaS Quality Order Timeline
 * Displays an animated, vertical step tracker for order fulfillment.
 */

import React, { memo } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { MonoText } from '@/src/components/MonoText';
import { tokens } from '@/src/design-system/tokens';
import { getColor, getTypography, type ColorMode } from '@/src/design-system/utilities';
import { usePreferences } from '@/src/hooks/usePreferences';
import { OrderStatus, PaymentStatus } from '@/src/types/models';
import { buildOrderTimeline } from '@/src/utils/orderTrackTimeline';

export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  date?: string;
  isCompleted: boolean;
  isActive?: boolean;
  icon?: AppIconName;
}

export interface OrderTimelineV2Props {
  steps?: TimelineStep[];
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
  style?: StyleProp<ViewStyle>;
}

function OrderTimelineV2Raw({ steps, status, paymentStatus, createdAt, style }: OrderTimelineV2Props) {
  const { isDark } = usePreferences();
  const mode: ColorMode = isDark ? 'dark' : 'light';

  let resolvedSteps = steps;
  if (!resolvedSteps && status) {
    const dummyOrder = {
      status,
      paymentStatus: paymentStatus || 'unpaid',
      createdAt: createdAt || new Date().toISOString(),
    } as any;
    const items = buildOrderTimeline(dummyOrder);
    resolvedSteps = items.map((item, idx) => ({
      id: String(idx),
      title: item.step,
      description: item.at,
      isCompleted: item.done,
      isActive: item.active,
      icon: item.failed ? ('AlertCircle' as const) : undefined,
    }));
  }

  const finalSteps = resolvedSteps || [];

  return (
    <View style={[styles.container, style]}>
      {finalSteps.map((step, index) => {
        const isLast = index === finalSteps.length - 1;
        const colorPrimary = getColor('primary', mode);
        const colorBorder = getColor('borderStrong', mode);
        
        const nodeColor = step.isCompleted || step.isActive ? colorPrimary : colorBorder;
        const nodeBg = step.isCompleted || step.isActive ? colorPrimary : 'transparent';
        const iconColor = step.isCompleted || step.isActive ? getColor('inkInverse', mode) : getColor('inkTertiary', mode);

        return (
          <View key={step.id} style={styles.stepContainer}>
            
            {/* Left Column (Node & Line) */}
            <View style={styles.leftCol}>
              <View 
                style={[
                  styles.node, 
                  { borderColor: nodeColor, backgroundColor: nodeBg }
                ]}
              >
                {step.icon ? (
                  <AppIcon name={step.icon} size={12} color={iconColor} />
                ) : step.isCompleted ? (
                  <AppIcon name="Check" size={12} color={iconColor} />
                ) : null}
              </View>
              
              {!isLast && (
                <View 
                  style={[
                    styles.line, 
                    { backgroundColor: step.isCompleted ? colorPrimary : colorBorder }
                  ]} 
                />
              )}
            </View>

            {/* Right Column (Content) */}
            <View style={[styles.content, { paddingBottom: isLast ? 0 : tokens.spacing[6] }]}>
              <MonoText 
                style={[
                  getTypography('bodyEmphasis', 'bold'), 
                  { color: step.isCompleted || step.isActive ? getColor('ink', mode) : getColor('inkSecondary', mode) }
                ]}
              >
                {step.title}
              </MonoText>
              
              {step.description && (
                <MonoText 
                  style={[
                    getTypography('caption', 'regular'), 
                    { color: getColor('inkTertiary', mode), marginTop: tokens.spacing[1] }
                  ]}
                >
                  {step.description}
                </MonoText>
              )}
              
              {step.date && (
                <MonoText 
                  style={[
                    getTypography('caption', 'medium'), 
                    { color: getColor('inkSecondary', mode), marginTop: tokens.spacing[2] }
                  ]}
                >
                  {step.date}
                </MonoText>
              )}
            </View>
            
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  stepContainer: {
    flexDirection: 'row',
  },
  leftCol: {
    alignItems: 'center',
    width: 24,
    marginRight: tokens.spacing[4],
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 2, // Align text with center of node
  },
});

export const OrderTimelineV2 = memo(OrderTimelineV2Raw);
