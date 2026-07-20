import React from 'react';
import { View, Pressable, StyleSheet, Modal } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@/src/components/AppText';
import { AppIcon, type AppIconName } from '@/src/components/AppIcon';
import { HapticTap } from '@/src/utils/haptics';

interface QuickActionModalProps {
  visible: boolean;
  onClose: () => void;
}

const ACTIONS: { label: string; icon: AppIconName; route: string; color: string }[] = [
  { label: 'Design Card', icon: 'CreditCard', route: '/guest-design', color: '#FFFFFF' },
  { label: 'New Order', icon: 'ShoppingCart', route: '/new-order', color: '#FFFFFF' },
  { label: 'Track Order', icon: 'Truck', route: '/guest-track-order', color: '#FFFFFF' },
  { label: 'Resume Bio Draft', icon: 'User', route: '/edit-bio', color: '#FFFFFF' },
  { label: 'Resume Card Draft', icon: 'Folder', route: '/drafts', color: '#FFFFFF' },
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
          
          <AppText style={styles.title} weight="extrabold">Quick Actions</AppText>
          
          {ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.actionRow,
                pressed && styles.actionPressed,
              ]}
              onPress={() => {
                HapticTap.light();
                onClose();
                setTimeout(() => {
                  router.push(action.route as any);
                }, 250);
              }}
            >
              <View style={styles.actionIcon}>
                <AppIcon name={action.icon} size={20} color="#FFFFFF" variant="solar-bold" />
              </View>
              <AppText style={styles.actionLabel} weight="bold">{action.label}</AppText>
              <AppIcon name="ChevronRight" size={15} color="#8E8E93" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 44,
    gap: 4,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 0,
    backgroundColor: '#2D2E30',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 6,
    letterSpacing: -0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 0,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
