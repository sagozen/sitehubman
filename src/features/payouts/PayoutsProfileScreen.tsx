/**
 * PayoutsProfileScreen — premium Binance-inspired Profile ("Me") page.
 * Style: Binance dark theme, black and gold palette, luxury fintech aesthetic.
 */
import { router } from 'expo-router';
import { StyleSheet, View, Pressable } from 'react-native';
import { IosScrollView } from '@/src/components/IosScrollView';
import { AppIcon } from '@/src/components/AppIcon';
import { AppText } from '@/src/components/AppText';
import { useAuth } from '@/src/hooks/useAuth';
import { usePayouts } from '@/src/hooks/usePayouts';
import { usePrinterJobs } from '@/src/hooks/usePrinterJobs';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Tokens (Binance Dark Palette) ──────────────────────────────────────────
const BG                  = '#0B0E11';
const SURFACE             = '#1E2329';
const SURFACE_LIGHT       = '#2B3139';
const BORDER              = 'rgba(234,236,239,0.06)';
const INK                 = '#FFFFFF';
const MUTED               = '#848E9C';
const DIM                 = '#707A8A';
const GREEN               = '#02C076';
const GREEN_DIM           = 'rgba(2,192,118,0.12)';
const RED                 = '#F6465D';

const GOLD_PRIMARY        = '#FCD535'; // Accent Gold
const GOLD_PRIMARY_DIM    = 'rgba(252,213,53,0.12)';
const GOLD_SECONDARY      = '#F0B90B';

export function PayoutsProfileScreen() {
  const { user, signOutUser } = useAuth();
  const { isSales, isPrinter } = useRoleFlags();
  const { payouts, isLoading: payoutsLoading, error: payoutsError, refresh } = usePayouts(user?.id ?? '');
  const { jobs } = usePrinterJobs();

  const totalPayouts = payouts.reduce((acc, payout) => acc + payout.amount, 0);
  const qaDone = jobs.filter((job) => job.stage === 'completed').length;

  return (
    <View style={styles.bg}>
      <IosScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.title}>{isSales ? 'My Payouts' : 'My Salary'}</AppText>
          <AppText style={styles.subtitle}>
            {isSales ? 'Commission summary and payout history.' : 'QA throughput and earnings.'}
          </AppText>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>
              {(user?.displayName ?? 'U')[0].toUpperCase()}
            </AppText>
          </View>
          <View style={styles.profileInfo}>
            <AppText style={styles.profileName}>{user?.displayName ?? 'User'}</AppText>
            <AppText style={styles.profileEmail}>{user?.email}</AppText>
            <View style={styles.roleBadge}>
              <AppText style={styles.roleBadgeText}>
                {user?.role?.toUpperCase() ?? 'STAFF'}
              </AppText>
            </View>
          </View>
        </View>

        {isSales ? (
          <>
            {payoutsError ? (
              <View style={styles.errorCard}>
                <AppText style={styles.errorText}>{payoutsError}</AppText>
                <Pressable style={styles.retryBtn} onPress={refresh}>
                  <AppText style={styles.retryBtnText}>Retry</AppText>
                </Pressable>
              </View>
            ) : null}

            {/* Total Earnings Card with Gold Gradient glow */}
            <View style={styles.totalCard}>
              <LinearGradient
                colors={['#1E2329', '#0B0E11']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <AppText style={styles.totalLabel}>TOTAL EARNINGS</AppText>
              <AppText style={styles.totalAmount}>
                ${totalPayouts.toFixed(2)}
              </AppText>
            </View>

            {payoutsLoading ? (
              <View style={styles.emptyCard}>
                <AppText style={styles.emptyText}>Loading payout records...</AppText>
              </View>
            ) : payouts.length === 0 ? (
              <View style={styles.emptyCard}>
                <AppText style={styles.emptyText}>No payout records yet.</AppText>
              </View>
            ) : null}

            {/* Payout List Header */}
            {payouts.length > 0 ? (
              <AppText style={styles.listSectionLabel}>Payout History</AppText>
            ) : null}

            {/* Payout rows */}
            {payouts.length > 0 ? (
              <View style={styles.listWrap}>
                {payouts.map((payout, i) => {
                  const isPaid = payout.status === 'paid';
                  const isLast = i === payouts.length - 1;
                  return (
                    <View key={payout.id} style={[styles.payoutRow, isLast && styles.payoutRowLast]}>
                      <View style={styles.payoutLeft}>
                        <AppText style={styles.payoutPeriod}>{payout.periodLabel}</AppText>
                        <View style={[styles.statusBadge, { backgroundColor: isPaid ? GREEN_DIM : GOLD_PRIMARY_DIM }]}>
                          <AppText style={[styles.badgeText, { color: isPaid ? GREEN : GOLD_PRIMARY }]}>
                            {payout.status.toUpperCase()}
                          </AppText>
                        </View>
                      </View>
                      <AppText style={styles.payoutAmount}>${payout.amount.toFixed(2)}</AppText>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </>
        ) : null}

        {isPrinter ? (
          <>
            <View style={styles.totalCard}>
              <AppText style={styles.totalLabel}>QA JOBS COMPLETED</AppText>
              <AppText style={styles.totalAmount}>{qaDone}</AppText>
            </View>
            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push('/printer/queue')}
            >
              <AppText style={styles.actionBtnText}>Capture QA Video</AppText>
            </Pressable>
          </>
        ) : null}

        {/* Sign Out Button */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.8 }]}
          onPress={() => signOutUser()}
        >
          <AppIcon name="LogOut" size={18} color={RED} />
          <AppText style={styles.signOutBtnText}>Sign Out</AppText>
        </Pressable>

        {/* Bottom space */}
        <View style={{ height: 120 }} />
      </IosScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },
  header: { marginBottom: 24, gap: 4 },
  title: { fontSize: 32, fontWeight: '900', color: INK, letterSpacing: -0.6, fontFamily: 'Inter_900Black' },
  subtitle: { fontSize: 13, fontWeight: '500', color: MUTED },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: SURFACE,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: SURFACE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GOLD_PRIMARY,
  },
  avatarText: {
    fontSize: 24,
    color: GOLD_PRIMARY,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: INK,
  },
  profileEmail: {
    fontSize: 13,
    color: MUTED,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 6,
    backgroundColor: GOLD_PRIMARY_DIM,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: GOLD_PRIMARY,
  },

  totalCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    gap: 6,
  },
  totalLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
  },
  totalAmount: {
    fontSize: 44,
    fontWeight: '900',
    color: INK,
    letterSpacing: -1,
  },

  errorCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  errorText: { fontSize: 13, color: RED, textAlign: 'center' },
  retryBtn: {
    backgroundColor: SURFACE_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: INK },

  emptyCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: { fontSize: 13, color: MUTED },

  listSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  listWrap: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 24,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  payoutRowLast: { borderBottomWidth: 0 },
  payoutLeft: { gap: 4 },
  payoutPeriod: { fontSize: 15, fontWeight: '700', color: INK },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: INK,
  },

  actionBtn: {
    backgroundColor: GOLD_PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  actionBtnText: { fontSize: 15, fontWeight: '800', color: BG },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 8,
    marginTop: 10,
  },
  signOutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: RED,
  },
});
