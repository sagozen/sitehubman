import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

type TabKey = 'awaiting' | 'collected' | 'reconciled';

interface MoneyOrder {
  id: string;
  customerName: string;
  amount: number;
  channel: 'Courier COD' | 'Avio Delivery';
  deliveredDate: string;
  status: TabKey;
  collectedBy?: string;
}

const INITIAL_ORDERS: MoneyOrder[] = [
  {
    id: 'AVS-2608-4471',
    customerName: 'Sok Dara',
    amount: 22.5,
    channel: 'Courier COD',
    deliveredDate: '14 Aug 2026',
    status: 'awaiting',
  },
  {
    id: 'AVS-2608-4468',
    customerName: 'Chan Sophea',
    amount: 45.0,
    channel: 'Avio Delivery',
    deliveredDate: '15 Aug 2026',
    status: 'collected',
    collectedBy: 'Vann Rithy',
  },
  {
    id: 'AVS-2608-4450',
    customerName: 'Meas Chanda',
    amount: 30.0,
    channel: 'Avio Delivery',
    deliveredDate: '12 Aug 2026',
    status: 'reconciled',
    collectedBy: 'Lim Sokha',
  },
];

export default function CashHandoverScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('awaiting');
  const [orders, setOrders] = useState<MoneyOrder[]>(INITIAL_ORDERS);

  const filteredOrders = orders.filter((o) => o.status === activeTab);

  const handleMarkCollected = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'collected', collectedBy: 'Current User' }
          : o
      )
    );
    Alert.alert('Logged to Avio Shop', `Order ${orderId} marked as Collected. Sales commission unlocked.`);
  };

  const handleMarkReconciled = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'reconciled' } : o))
    );
    Alert.alert('Reconciled', `Order ${orderId} reconciled against closed banking remittance period.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Back Navigation */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backButtonText}>← Management Hub</Text>
        </TouchableOpacity>

        {/* Title & Sync Stamp */}
        <View style={styles.header}>
          <Text style={styles.title}>Money Collection & Audit</Text>
          <Text style={styles.syncText}>Synced 2 minutes ago from Avio Shop</Text>
        </View>

        {/* Tabs: Awaiting / Collected / Reconciled */}
        <View style={styles.tabBar}>
          {(['awaiting', 'collected', 'reconciled'] as TabKey[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabItemText,
                  activeTab === tab && styles.activeTabItemText,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            (!) Delivered is not paid. Courier COD stays with the courier until the remittance period closes.
          </Text>
        </View>

        {/* Orders List */}
        <View style={styles.orderList}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No orders in {activeTab} stage.</Text>
            </View>
          ) : (
            filteredOrders.map((item) => (
              <View key={item.id} style={styles.orderCard}>
                <View style={styles.orderTopRow}>
                  <div>
                    <Text style={styles.orderId}>{item.id}</Text>
                    <Text style={styles.customerLine}>
                      {item.customerName} · {item.channel}
                    </Text>
                  </div>
                  <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
                </View>

                <Text style={styles.dateLine}>
                  Delivered on {item.deliveredDate}
                  {item.collectedBy ? ` (Collected by ${item.collectedBy})` : ''}
                </Text>

                {activeTab === 'awaiting' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleMarkCollected(item.id)}
                  >
                    <Text style={styles.actionBtnText}>Mark as Collected →</Text>
                  </TouchableOpacity>
                )}

                {activeTab === 'collected' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.reconcileBtn]}
                    onPress={() => handleMarkReconciled(item.id)}
                  >
                    <Text style={styles.actionBtnText}>Mark as Reconciled →</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        <Text style={styles.footerNotice}>
          All transactions are written directly to Avio Shop master ledger.
        </Text>
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
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  syncText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabItem: {
    backgroundColor: '#ffffff',
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeTabItemText: {
    color: '#000000',
    fontWeight: '800',
  },
  warningBox: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 12,
    color: '#FBBF24',
    lineHeight: 16,
  },
  orderList: {
    gap: 14,
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: '#111114',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
  },
  orderCard: {
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  customerLine: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  dateLine: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reconcileBtn: {
    backgroundColor: '#2997FF',
  },
  actionBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  footerNotice: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginBottom: 20,
  },
});
