/**
 * NFC Batch Write Screen
 * 
 * Sequential NFC encoding for production efficiency
 * Processes multiple cards in one session
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { AppButton } from '@/src/components/AppButton';
import { T } from '@/src/constants/theme';
import { HapticTap } from '@/src/utils/haptics';
import { writeNfcUrl, startNfcManager, isNfcAvailable } from '@/src/services/nfcManagerService';
import { encryptNfcUrl, registerNfcTag } from '@/src/services/nfcEncryptionService';
import { db } from '@/src/services/firebaseClient';

interface BatchCard {
  id: string;
  cardId: string;
  userId: string;
  status: 'pending' | 'writing' | 'success' | 'failed' | 'skipped';
  error?: string;
  writtenAt?: string;
}

type BatchMode = 'idle' | 'ready' | 'active' | 'paused' | 'complete';

export default function NfcBatchWriteScreen() {
  const router = useRouter();
  const [batchCards, setBatchCards] = useState<BatchCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<BatchMode>('idle');
  const [totalSuccess, setTotalSuccess] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handleLoadBatch = useCallback(async () => {
    // TODO: Load pending orders from Firestore
    // For now, use mock data
    const mockBatch: BatchCard[] = Array.from({ length: 10 }, (_, i) => ({
      id: `card_${i + 1}`,
      cardId: `card_${Date.now()}_${i}`,
      userId: 'user_123',
      status: 'pending',
    }));

    setBatchCards(mockBatch);
    setCurrentIndex(0);
    setMode('ready');
    HapticTap.success();
  }, []);

  const handleStartBatch = useCallback(async () => {
    const available = await isNfcAvailable();
    if (!available) {
      HapticTap.error();
      alert('NFC is not available on this device');
      return;
    }

    await startNfcManager();
    setMode('active');
    HapticTap.medium();
    processNextCard();
  }, []);

  const processNextCard = useCallback(async () => {
    if (currentIndex >= batchCards.length) {
      setMode('complete');
      HapticTap.success();
      return;
    }

    const card = batchCards[currentIndex];
    
    // Update status to writing
    setBatchCards((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { ...card, status: 'writing' };
      return updated;
    });

    try {
      // Generate encrypted URL
      const encryptedUrl = await encryptNfcUrl(card.cardId);

      // Write to NFC tag
      await writeNfcUrl(encryptedUrl);

      // Register tag in database
      const uid = `NFC_${Date.now()}`; // TODO: Read actual UID from tag
      await registerNfcTag(uid, card.cardId, card.userId, db);

      // Mark success
      setBatchCards((prev) => {
        const updated = [...prev];
        updated[currentIndex] = {
          ...card,
          status: 'success',
          writtenAt: new Date().toISOString(),
        };
        return updated;
      });

      setTotalSuccess((prev) => prev + 1);
      HapticTap.success();

      // Animate progress
      Animated.timing(progressAnim, {
        toValue: ((currentIndex + 1) / batchCards.length) * 100,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Move to next card after short delay
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        if (currentIndex + 1 < batchCards.length && mode === 'active') {
          processNextCard();
        } else if (currentIndex + 1 >= batchCards.length) {
          setMode('complete');
        }
      }, 1500);
    } catch (error: any) {
      // Mark failed
      setBatchCards((prev) => {
        const updated = [...prev];
        updated[currentIndex] = {
          ...card,
          status: 'failed',
          error: error.message || 'Write failed',
        };
        return updated;
      });

      setTotalFailed((prev) => prev + 1);
      HapticTap.error();
    }
  }, [currentIndex, batchCards, mode, progressAnim]);

  const handleSkipCard = useCallback(() => {
    HapticTap.light();
    setBatchCards((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { ...updated[currentIndex], status: 'skipped' };
      return updated;
    });
    setCurrentIndex((prev) => prev + 1);
    
    if (currentIndex + 1 < batchCards.length) {
      processNextCard();
    } else {
      setMode('complete');
    }
  }, [currentIndex, batchCards.length, processNextCard]);

  const handlePauseBatch = useCallback(() => {
    HapticTap.medium();
    setMode('paused');
  }, []);

  const handleResumeBatch = useCallback(() => {
    HapticTap.medium();
    setMode('active');
    processNextCard();
  }, [processNextCard]);

  const handleResetBatch = useCallback(() => {
    HapticTap.light();
    setBatchCards([]);
    setCurrentIndex(0);
    setTotalSuccess(0);
    setTotalFailed(0);
    setMode('idle');
    progressAnim.setValue(0);
  }, [progressAnim]);

  const currentCard = batchCards[currentIndex];
  const progress = batchCards.length > 0 ? ((currentIndex / batchCards.length) * 100).toFixed(0) : 0;

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.title} weight="bold">
            Batch NFC Write
          </AppText>
          <AppText style={styles.subtitle}>
            Sequential card encoding workflow
          </AppText>
        </View>

        {/* Progress Bar */}
        {mode !== 'idle' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <AppText style={styles.progressLabel}>
                Progress: {currentIndex} / {batchCards.length}
              </AppText>
              <AppText style={styles.progressPercent} weight="bold">
                {progress}%
              </AppText>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Stats */}
        {mode !== 'idle' && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <AppIcon name="CheckCircle" size={20} color={T.textPrimary} />
              <AppText style={styles.statValue} weight="bold">
                {totalSuccess}
              </AppText>
              <AppText style={styles.statLabel}>Success</AppText>
            </View>
            <View style={styles.statCard}>
              <AppIcon name="XCircle" size={20} color={T.textMuted} />
              <AppText style={styles.statValue} weight="bold">
                {totalFailed}
              </AppText>
              <AppText style={styles.statLabel}>Failed</AppText>
            </View>
            <View style={styles.statCard}>
              <AppIcon name="Clock" size={20} color={T.textSecondary} />
              <AppText style={styles.statValue} weight="bold">
                {batchCards.length - currentIndex}
              </AppText>
              <AppText style={styles.statLabel}>Remaining</AppText>
            </View>
          </View>
        )}

        {/* Current Card */}
        {mode === 'active' || mode === 'paused' ? (
          <View style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <AppIcon name="Zap" size={24} color={T.accent} />
              <AppText style={styles.currentTitle} weight="bold">
                Current Card
              </AppText>
            </View>
            {currentCard && (
              <>
                <AppText style={styles.currentCardId}>
                  {currentCard.cardId}
                </AppText>
                <View style={styles.statusBadge}>
                  <AppText
                    style={[
                      styles.statusText,
                      currentCard.status === 'writing' && styles.statusWriting,
                    ]}
                    weight="bold"
                  >
                    {currentCard.status === 'writing'
                      ? '✍️ Writing...'
                      : currentCard.status.toUpperCase()}
                  </AppText>
                </View>
                {currentCard.error && (
                  <AppText style={styles.errorText}>⚠️ {currentCard.error}</AppText>
                )}
              </>
            )}

            {/* Instructions */}
            {mode === 'active' && currentCard?.status === 'writing' && (
              <View style={styles.instructionBox}>
                <AppText style={styles.instructionText}>
                  Hold phone against NFC card...
                </AppText>
                <AppText style={styles.instructionDetail}>
                  Keep steady until write completes
                </AppText>
              </View>
            )}
          </View>
        ) : null}

        {/* Card List */}
        {mode !== 'idle' && batchCards.length > 0 && (
          <View style={styles.cardList}>
            <AppText style={styles.listTitle} weight="bold">
              Batch Cards
            </AppText>
            {batchCards.map((card, index) => (
              <View
                key={card.id}
                style={[
                  styles.cardItem,
                  index === currentIndex && styles.cardItemActive,
                ]}
              >
                <View style={styles.cardItemContent}>
                  <AppText style={styles.cardItemIndex}>#{index + 1}</AppText>
                  <AppText style={styles.cardItemId}>{card.cardId.slice(0, 12)}...</AppText>
                </View>
                <AppIcon
                  name={
                    card.status === 'success'
                      ? 'CheckCircle'
                      : card.status === 'failed'
                      ? 'XCircle'
                      : card.status === 'writing'
                      ? 'Zap'
                      : 'Circle'
                  }
                  size={16}
                  color={
                    card.status === 'success'
                      ? T.textPrimary
                      : card.status === 'failed'
                      ? T.textMuted
                      : card.status === 'writing'
                      ? T.accent
                      : T.textSecondary
                  }
                />
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {mode === 'idle' && (
            <AppButton
              title="Load Batch"
              onPress={handleLoadBatch}
              variant="primary"
              leftIcon="Upload"
              style={styles.actionButton}
            />
          )}

          {mode === 'ready' && (
            <>
              <AppButton
                title={`Start Batch (${batchCards.length} cards)`}
                onPress={handleStartBatch}
                variant="primary"
                leftIcon="Play"
                style={styles.actionButton}
              />
              <AppButton
                title="Cancel"
                onPress={handleResetBatch}
                variant="secondary"
                style={styles.actionButton}
              />
            </>
          )}

          {mode === 'active' && (
            <>
              <AppButton
                title="Skip This Card"
                onPress={handleSkipCard}
                variant="secondary"
                leftIcon="SkipForward"
                style={styles.actionButton}
              />
              <AppButton
                title="Pause Batch"
                onPress={handlePauseBatch}
                variant="secondary"
                leftIcon="Pause"
                style={styles.actionButton}
              />
            </>
          )}

          {mode === 'paused' && (
            <>
              <AppButton
                title="Resume Batch"
                onPress={handleResumeBatch}
                variant="primary"
                leftIcon="Play"
                style={styles.actionButton}
              />
              <AppButton
                title="Cancel Batch"
                onPress={handleResetBatch}
                variant="secondary"
                style={styles.actionButton}
              />
            </>
          )}

          {mode === 'complete' && (
            <>
              <View style={styles.completeBox}>
                <AppText style={styles.completeTitle} weight="bold">
                  ✅ Batch Complete!
                </AppText>
                <AppText style={styles.completeText}>
                  Successfully wrote {totalSuccess} cards
                </AppText>
                {totalFailed > 0 && (
                  <AppText style={styles.completeWarning}>
                    ⚠️ {totalFailed} cards failed
                  </AppText>
                )}
              </View>
              <AppButton
                title="Start New Batch"
                onPress={handleResetBatch}
                variant="primary"
                style={styles.actionButton}
              />
              <AppButton
                title="View Inventory"
                onPress={() => router.push('/nfc/inventory' as any)}
                variant="secondary"
                style={styles.actionButton}
              />
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: T.fontSizeXL,
    color: T.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: T.fontSizeMD,
    color: T.textSecondary,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
  },
  progressPercent: {
    fontSize: T.fontSizeSM,
    color: T.textPrimary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: T.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: T.accent,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    color: T.textPrimary,
  },
  statLabel: {
    fontSize: T.fontSizeXS,
    color: T.textSecondary,
    textTransform: 'uppercase',
  },
  currentCard: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  currentTitle: {
    fontSize: T.fontSizeLG,
    color: T.textPrimary,
  },
  currentCardId: {
    fontSize: T.fontSizeMD,
    color: T.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: T.surfaceRaised,
    borderRadius: 8,
  },
  statusText: {
    fontSize: T.fontSizeSM,
    color: T.textPrimary,
  },
  statusWriting: {
    color: T.accent,
  },
  errorText: {
    fontSize: T.fontSizeSM,
    color: T.textMuted,
    marginTop: 12,
  },
  instructionBox: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  instructionText: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
    marginBottom: 4,
  },
  instructionDetail: {
    fontSize: T.fontSizeSM,
    color: T.textSecondary,
  },
  cardList: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  listTitle: {
    fontSize: T.fontSizeMD,
    color: T.textPrimary,
    marginBottom: 16,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  cardItemActive: {
    backgroundColor: T.surfaceRaised,
  },
  cardItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardItemIndex: {
    fontSize: T.fontSizeSM,
    color: T.textMuted,
    width: 32,
  },
  cardItemId: {
    fontSize: T.fontSizeSM,
    color: T.textPrimary,
    fontFamily: 'monospace',
  },
  actions: {
    gap: 12,
    marginTop: 'auto',
  },
  actionButton: {
    width: '100%',
  },
  completeBox: {
    backgroundColor: T.surfaceRaised,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: T.fontSizeLG,
    color: T.textPrimary,
    marginBottom: 8,
  },
  completeText: {
    fontSize: T.fontSizeMD,
    color: T.textSecondary,
  },
  completeWarning: {
    fontSize: T.fontSizeMD,
    color: T.textMuted,
    marginTop: 4,
  },
});
