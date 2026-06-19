import { IosScrollView } from '@/src/components/IosScrollView';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { GlassSafeScreen } from '@/src/components/GlassSafeScreen';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { AppEmptyState } from '@/src/components/AppState';
import { batchMaterialOptions, batchPrinterTypeOptions } from '@/src/constants/options';
import { theme } from '@/src/constants/theme';
import { useActiveBatch } from '@/src/hooks/useActiveBatch';
import { useProductionBatches } from '@/src/hooks/useProductionBatches';
import { ProductionBatch } from '@/src/types/models';

const HERO_BG = '#1a1a2e';

function BatchRow({
  batch,
  selected,
  onSelect,
}: {
  batch: ProductionBatch;
  selected: boolean;
  onSelect: () => void;
}) {
  const material = batchMaterialOptions.find((m) => m.value === batch.material)?.label ?? batch.material;
  const printer = batchPrinterTypeOptions.find((p) => p.value === batch.printerType)?.label ?? batch.printerType;

  return (
    <Pressable
      style={[styles.batchCard, selected && styles.batchCardSelected]}
      onPress={onSelect}
    >
      <View style={styles.batchTop}>
        <AppText style={styles.batchNumber}>{batch.batchNumber}</AppText>
        <View style={[styles.statusPill, batch.status === 'active' && styles.statusPillActive]}>
          <AppText style={styles.statusPillText}>{batch.status}</AppText>
        </View>
      </View>
      <AppText style={styles.batchMeta}>
        {material} · {printer} · {batch.orderIds.length} orders
      </AppText>
      {batch.branch ? <AppText style={styles.batchBranch}>Branch: {batch.branch}</AppText> : null}
    </Pressable>
  );
}

export default function PrinterBatchSelectScreen() {
  const { batches, isLoading, error } = useProductionBatches();
  const { batchId, selectBatch, hasActiveBatch } = useActiveBatch();

  const selectable = useMemo(
    () => batches.filter((b) => b.status === 'active'),
    [batches]
  );

  async function handleSelect(batch: ProductionBatch) {
    try {
      await selectBatch(batch.id);
      router.replace('/printer/queue');
    } catch (err) {
      Alert.alert('Could not select batch', err instanceof Error ? err.message : 'Try again.');
    }
  }

  return (
    <GlassSafeScreen>
      <IosScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.profileAvatar}>
              <AppIcon name="Archive" size={20} color="#007AFF" />
            </View>
            <View style={styles.profileCopy}>
              <AppText style={styles.heroEyebrow}>Workshop</AppText>
              <AppText style={styles.pageTitle}>Select Batch</AppText>
              <AppText style={styles.heroSub}>
                Choose an active production batch to begin.
              </AppText>
            </View>
          </View>
        </View>

        {hasActiveBatch && batchId ? (
          <Pressable
            style={({ pressed }) => [styles.continueBtn, pressed && styles.continueBtnPressed]}
            onPress={() => router.replace('/printer/queue')}
          >
            <AppText style={styles.continueBtnText}>Continue current batch</AppText>
            <AppIcon name="ChevronRight" size={16} color="#fff" />
          </Pressable>
        ) : null}

        {error ? (
          <AppText style={styles.errorText}>{error}</AppText>
        ) : null}

        {isLoading ? (
          <AppText tone="muted" style={styles.loadingText}>
            Loading batches…
          </AppText>
        ) : selectable.length === 0 ? (
          <AppEmptyState
            role="printer"
            iconName="Package"
            title="No batches"
            description="Ask sales or admin to open an active production batch."
          />
        ) : (
          selectable.map((batch) => (
            <BatchRow
              key={batch.id}
              batch={batch}
              selected={batchId === batch.id}
              onSelect={() => void handleSelect(batch)}
            />
          ))
        )}
      </IosScrollView>
    </GlassSafeScreen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EBF7FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    fontFamily: theme.typography.fontFamilyBold,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000000',
    fontFamily: theme.typography.fontFamilyBlack,
    letterSpacing: -0.6,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: theme.typography.fontFamilyMedium,
  },
  continueBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  continueBtnPressed: {
    opacity: 0.88,
  },
  continueBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, fontFamily: theme.typography.fontFamilyBold },
  batchCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  batchCardSelected: { borderColor: '#007AFF', borderWidth: 2 },
  batchTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchNumber: { fontSize: 17, fontWeight: '800', color: '#000000', fontFamily: theme.typography.fontFamilyExtraBold },
  statusPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillActive: { backgroundColor: '#DCFCE7' },
  statusPillText: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'capitalize', fontFamily: theme.typography.fontFamilyBold },
  batchMeta: { fontSize: 13, color: '#64748B', fontWeight: '600', fontFamily: theme.typography.fontFamilyMedium },
  batchBranch: { fontSize: 11, color: '#94A3B8', fontFamily: theme.typography.fontFamilyMedium },
  errorText: { color: theme.status.error, textAlign: 'center' },
  loadingText: { textAlign: 'center', paddingVertical: 24 },
});
