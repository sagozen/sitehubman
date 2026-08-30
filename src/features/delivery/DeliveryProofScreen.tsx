import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

interface DeliveryProofProps {
  orderId?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  codAmount?: number;
}

export default function DeliveryProofScreen({
  orderId = 'AVS-2608-4471',
  recipientName = 'Chan Dara',
  recipientPhone = '+855 12 345 678',
  deliveryAddress = 'No.12, St.240, Chamkarmon, Phnom Penh',
  codAmount = 22.5,
}: DeliveryProofProps) {
  const router = useRouter();
  const [deliveryStatus, setDeliveryStatus] = useState<'picked_up' | 'on_the_way' | 'delivered' | 'failed'>('picked_up');
  const [hasPhotoProof, setHasPhotoProof] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [cashCollected, setCashCollected] = useState(true);

  const handleMarkDelivered = () => {
    if (!hasPhotoProof && deliveryNote.trim().length === 0) {
      Alert.alert(
        'Proof Required',
        'Please either attach a delivery photo proof or provide a delivery handover note.'
      );
      return;
    }

    Alert.alert(
      'Delivery Confirmed',
      `Order ${orderId} marked as delivered. $${codAmount.toFixed(2)} cash logged for handover.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleMarkFailed = () => {
    Alert.alert(
      'Delivery Attempt Failed',
      'The order will be scheduled for a second delivery attempt. Please state the reason:',
      [
        { text: 'Customer Unreachable', onPress: () => router.back() },
        { text: 'Wrong Address', onPress: () => router.back() },
        { text: 'Customer Rescheduled', onPress: () => router.back() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back Navigation */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backButtonText}>← Delivery Legs</Text>
        </TouchableOpacity>

        {/* Order Header */}
        <View style={styles.header}>
          <Text style={styles.orderId}>{orderId}</Text>
          <Text style={styles.channelBadge}>Channel: Avio Direct Delivery</Text>
        </View>

        {/* Customer Contact Card */}
        <View style={styles.customerCard}>
          <Text style={styles.customerName}>{recipientName}</Text>
          <Text style={styles.customerPhone}>{recipientPhone}</Text>
          <Text style={styles.customerAddress}>{deliveryAddress}</Text>

          <View style={styles.contactActions}>
            <TouchableOpacity style={styles.contactBtn}>
              <Text style={styles.contactBtnText}>📞 Call Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactBtn, styles.mapBtn]}>
              <Text style={styles.contactBtnText}>📍 Open Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cash On Delivery Collection Card */}
        <View style={styles.codCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.codLabel}>Cash to Collect (COD):</Text>
            <Text style={styles.codAmount}>${codAmount.toFixed(2)} USD</Text>
          </View>
          <TouchableOpacity
            style={styles.cashCheckbox}
            onPress={() => setCashCollected(!cashCollected)}
          >
            <Text style={styles.checkboxIcon}>{cashCollected ? '☑' : '☐'}</Text>
            <Text style={styles.checkboxLabel}>I have collected the exact cash amount</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Proof Capture */}
        <View style={styles.proofCard}>
          <Text style={styles.proofTitle}>Delivery Proof (Required)</Text>
          <Text style={styles.proofSubtitle}>
            Attach photo handover proof or enter a handover note:
          </Text>

          <TouchableOpacity
            style={[styles.photoButton, hasPhotoProof && styles.photoButtonActive]}
            onPress={() => setHasPhotoProof(!hasPhotoProof)}
          >
            <Text style={styles.photoButtonText}>
              {hasPhotoProof ? '✓ Photo Proof Attached (Tap to change)' : '📷 Capture Delivery Photo'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.noteInput}
            value={deliveryNote}
            onChangeText={setDeliveryNote}
            placeholder="Handover note (e.g. handed to reception / security)..."
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>

        {/* Action CTAs */}
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.deliverButton}
            onPress={handleMarkDelivered}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deliverButtonText}>✓ Confirm Delivery Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.failButton}
            onPress={handleMarkFailed}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.failButtonText}>Delivery Failed / Reschedule</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  backButton: {
    marginBottom: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    marginBottom: 16,
  },
  orderId: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  channelBadge: {
    fontSize: 12,
    color: '#2997FF',
    fontWeight: '600',
    marginTop: 4,
  },
  customerCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
    marginBottom: 6,
  },
  customerAddress: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
    marginBottom: 14,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtn: {
    borderColor: 'rgba(41, 151, 255, 0.3)',
  },
  contactBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  codCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  codLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  codAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
  },
  cashCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  checkboxIcon: {
    color: '#10B981',
    fontSize: 18,
    marginRight: 8,
  },
  checkboxLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  proofCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  proofTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  proofSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 14,
  },
  photoButton: {
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  photoButtonActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  photoButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: '#18181c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
  },
  actionGroup: {
    gap: 12,
    marginBottom: 20,
  },
  deliverButton: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  failButton: {
    backgroundColor: '#1c1c22',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
    borderRadius: 999,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failButtonText: {
    color: '#ff453a',
    fontSize: 13,
    fontWeight: '700',
  },
});
