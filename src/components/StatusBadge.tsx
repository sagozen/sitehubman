import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/src/components/AppText';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#E8F5E9', text: '#2E7D32' },
  completed: { bg: '#E3F2FD', text: '#1565C0' },
  pending: { bg: '#FFF3E0', text: '#E65100' },
  cancelled: { bg: '#FFEBEE', text: '#C62828' },
  delivered: { bg: '#E8F5E9', text: '#2E7D32' },
  processing: { bg: '#F3E5F5', text: '#7B1FA2' },
  shipped: { bg: '#E0F7FA', text: '#00695C' },
  paid: { bg: '#E8F5E9', text: '#2E7D32' },
  unpaid: { bg: '#FFF3E0', text: '#E65100' },
  draft: { bg: '#F5F5F5', text: '#757575' },
  default: { bg: '#F5F5F5', text: '#757575' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/[^a-z]/g, '');
  const color = STATUS_COLORS[key] || STATUS_COLORS.default;
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <AppText style={[styles.label, { color: color.text }]}>{displayLabel}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
