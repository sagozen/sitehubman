/**
 * NFC Security Dashboard
 * 
 * Monitor clone attempts, suspicious tap patterns, and fraud alerts
 * Critical for 1M user trust and fraud prevention
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/src/services/firebaseClient';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AppButton } from '@/src/components/AppButton';
import { theme } from '@/src/constants/theme';
import { HapticTap } from '@/src/utils/haptics';
import { EmptyState } from '@/src/components/EmptyState';

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
type AlertType = 'clone_detected' | 'suspicious_taps' | 'expired_signature' | 'invalid_signature' | 'rate_limit_exceeded';

interface SecurityAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  cardId: string;
  uidHash?: string;
  message: string;
  metadata?: Record<string, any>;
  resolved: boolean;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

interface SecurityStats {
  totalAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  clonesDetected: number;
  suspiciousTaps: number;
  last24h: number;
}

export default function NfcSecurityScreen() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalAlerts: 0,
    criticalAlerts: 0,
    resolvedAlerts: 0,
    clonesDetected: 0,
    suspiciousTaps: 0,
    last24h: 0,
  });
  const [filter, setFilter] = useState<'all' | AlertType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSecurityAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const alertsRef = collection(db, 'security_alerts');
      let alertsQuery = query(
        alertsRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (filter !== 'all') {
        alertsQuery = query(
          alertsRef,
          where('type', '==', filter),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const [alertsSnap, allAlertsSnap] = await Promise.all([
        getDocs(alertsQuery),
        getDocs(query(collection(db, 'security_alerts'), orderBy('createdAt', 'desc'))),
      ]);

      const loadedAlerts: SecurityAlert[] = alertsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as SecurityAlert));

      setAlerts(loadedAlerts);

      // Calculate stats
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      const statsData = allAlertsSnap.docs.reduce(
        (acc, doc) => {
          const alert = doc.data() as SecurityAlert;
          acc.totalAlerts++;

          if (alert.severity === 'critical') acc.criticalAlerts++;
          if (alert.resolved) acc.resolvedAlerts++;
          if (alert.type === 'clone_detected') acc.clonesDetected++;
          if (alert.type === 'suspicious_taps') acc.suspiciousTaps++;

          const createdAt = alert.createdAt.toDate().getTime();
          if (createdAt > oneDayAgo) acc.last24h++;

          return acc;
        },
        {
          totalAlerts: 0,
          criticalAlerts: 0,
          resolvedAlerts: 0,
          clonesDetected: 0,
          suspiciousTaps: 0,
          last24h: 0,
        }
      );

      setStats(statsData);
    } catch (error) {
      console.error('[Security] Load alerts failed', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadSecurityAlerts();
  }, [loadSecurityAlerts]);

  const handleRefresh = useCallback(() => {
    HapticTap.light();
    loadSecurityAlerts(true);
  }, [loadSecurityAlerts]);

  const handleFilterChange = useCallback((newFilter: 'all' | AlertType) => {
    HapticTap.light();
    setFilter(newFilter);
  }, []);

  const handleResolveAlert = useCallback(async (alertId: string) => {
    HapticTap.medium();
    // TODO: Mark alert as resolved in Firestore
    console.log('[Security] Resolve alert:', alertId);
    loadSecurityAlerts(true);
  }, [loadSecurityAlerts]);

  const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
      case 'critical': return '#FFFFFF'; // Monochrome - brightest for critical
      case 'high': return '#FFFFFF';
      case 'medium': return '#A1A1AA';
      case 'low': return '#52525B';
    }
  };

  const getSeverityLabel = (severity: AlertSeverity): string => {
    return severity.toUpperCase();
  };

  const getAlertIcon = (type: AlertType): string => {
    switch (type) {
      case 'clone_detected': return 'Copy';
      case 'suspicious_taps': return 'AlertTriangle';
      case 'expired_signature': return 'Clock';
      case 'invalid_signature': return 'ShieldAlert';
      case 'rate_limit_exceeded': return 'Zap';
    }
  };

  const getAlertTypeLabel = (type: AlertType): string => {
    return type.replace(/_/g, ' ').toUpperCase();
  };

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter((alert) => alert.type === filter);
  }, [alerts, filter]);

  const renderStatCard = (label: string, count: number, color: string) => (
    <View style={styles.statCard}>
      <AppText style={[styles.statCount, { color }]} weight="bold">
        {count}
      </AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );

  const renderAlert = ({ item }: { item: SecurityAlert }) => (
    <Pressable
      style={[styles.alertCard, item.resolved && styles.alertCardResolved]}
      onPress={() => !item.resolved && handleResolveAlert(item.id)}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertInfo}>
          <AppIcon
            name={getAlertIcon(item.type) as any}
            size={24}
            color={getSeverityColor(item.severity)}
          />
          <View style={styles.alertTitleContainer}>
            <AppText style={styles.alertType} weight="bold">
              {getAlertTypeLabel(item.type)}
            </AppText>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) + '20' }]}>
              <AppText style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
                {getSeverityLabel(item.severity)}
              </AppText>
            </View>
          </View>
        </View>
        {item.resolved && (
          <View style={styles.resolvedBadge}>
            <AppIcon name="CheckCircle" size={18} color="#A1A1AA" />
          </View>
        )}
      </View>

      <AppText style={styles.alertMessage}>{item.message}</AppText>

      {item.cardId && (
        <AppText style={styles.alertDetail}>Card: {item.cardId.slice(0, 12)}...</AppText>
      )}
      {item.uidHash && (
        <AppText style={styles.alertDetail}>UID Hash: {item.uidHash.slice(0, 16)}...</AppText>
      )}

      <AppText style={styles.alertTimestamp}>
        {item.createdAt.toDate().toLocaleString()}
      </AppText>

      {!item.resolved && (
        <AppButton
          title="Mark as Resolved"
          onPress={() => handleResolveAlert(item.id)}
          variant="secondary"
          size="sm"
          style={styles.resolveButton}
        />
      )}
    </Pressable>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <AppText style={styles.title} weight="bold">
          Security Dashboard
        </AppText>
        <AppText style={styles.subtitle}>
          Monitor fraud attempts and suspicious activity
        </AppText>
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard('Total', stats.totalAlerts, '#FFFFFF')}
        {renderStatCard('Critical', stats.criticalAlerts, '#FFFFFF')}
        {renderStatCard('Clones', stats.clonesDetected, '#FFFFFF')}
        {renderStatCard('Last 24h', stats.last24h, '#A1A1AA')}
      </View>

      <View style={styles.filterBar}>
        <Pressable
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => handleFilterChange('all')}
        >
          <AppText style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </AppText>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === 'clone_detected' && styles.filterChipActive]}
          onPress={() => handleFilterChange('clone_detected')}
        >
          <AppText style={[styles.filterText, filter === 'clone_detected' && styles.filterTextActive]}>
            Clones
          </AppText>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === 'suspicious_taps' && styles.filterChipActive]}
          onPress={() => handleFilterChange('suspicious_taps')}
        >
          <AppText style={[styles.filterText, filter === 'suspicious_taps' && styles.filterTextActive]}>
            Suspicious
          </AppText>
        </Pressable>
      </View>

      <FlatList
        data={filteredAlerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredAlerts.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="Shield"
            title="No security alerts"
            subtitle="Your NFC system is secure. Alerts will appear here if suspicious activity is detected."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2596BE"
            colors={['#2596BE']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0E0E11',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 26,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#A1A1AA',
    textTransform: 'uppercase',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0E0E11',
  },
  filterChipActive: {
    backgroundColor: '#2596BE',
  },
  filterText: {
    fontSize: 13,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  alertCard: {
    backgroundColor: '#0E0E11',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  alertCardResolved: {
    opacity: 0.6,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  alertTitleContainer: {
    flex: 1,
    gap: 6,
  },
  alertType: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  resolvedBadge: {
    marginLeft: 12,
  },
  alertMessage: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertDetail: {
    fontSize: 12,
    color: '#52525B',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  alertTimestamp: {
    fontSize: 11,
    color: '#52525B',
    marginTop: 8,
  },
  resolveButton: {
    marginTop: 12,
  },
});
