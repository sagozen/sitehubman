import React from 'react';
import { View, Pressable, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { glassTheme } from '@/src/design-system/glass';

interface QuickActionModalProps {
  visible: boolean;
  onClose: () => void;
}

const ACTIONS: { label: string; icon: AppIconName; route: string; color: string }[] = [
  { label: 'Design Card', icon: 'CreditCard', route: '/guest-design', color: '#0A84FF' },
  { label: 'New Order', icon: 'ShoppingCart', route: '/new-order', color: '#34C759' },
  { label: 'Track Order', icon: 'Truck', route: '/guest-track-order', color: '#FF9500' },
  { label: 'Resume Bio Draft', icon: 'User', route: '/edit-bio', color: '#8E44AD' },
  { label: 'Resume Card Draft', icon: 'Folder', route: '/drafts', color: '#E67E22' },
];

export function QuickActionModal({ visible, onClose }: QuickActionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <AppText style={styles.title}>Quick Actions</AppText>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.actionRow,
                pressed && styles.actionPressed,
              ]}
              onPress={() => {
                onClose();
                router.push(action.route as any);
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <AppIcon name={action.icon} size={22} color={action.color} />
              </View>
              <AppText style={styles.actionLabel}>{action.label}</AppText>
              <AppIcon name="ChevronRight" size={16} color="#C7C7CC" />
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: glassTheme.spacing.screenX,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 14,
  },
  actionPressed: {
    backgroundColor: '#F2F2F7',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});
