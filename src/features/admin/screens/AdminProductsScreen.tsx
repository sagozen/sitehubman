import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AppText } from '@/src/components/AppText';
import { SettingsGroup, SettingsSection } from '@/src/components/SettingsGroup';
import {
  CATALOG_PRODUCT_IDS,
  type CatalogProduct,
  buildDefaultProductCatalog,
} from '@/src/constants/productCatalogDefaults';
import { theme } from '@/src/constants/theme';
import { AdminScreenShell } from '@/src/features/admin/components/AdminScreenShell';
import { useAuth } from '@/src/hooks/useAuth';
import { useProductCatalog } from '@/src/hooks/useProductCatalog';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';
import { usePreferences } from '@/src/hooks/usePreferences';
import { db } from '@/src/services/firebaseClient';
import {
  invalidateProductCatalogCache,
  refreshProductCatalog,
} from '@/src/services/productCatalogService';

export default function ProductsScreen() {
  const { colors } = usePreferences();
  const { user } = useAuth();
  const { isSuperAdmin } = useRoleFlags();
  const { catalog, loading, reload } = useProductCatalog();
  const [editPrices, setEditPrices] = useState<Record<string, string>>({});
  const [editNames, setEditNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const products = useMemo(
    () => CATALOG_PRODUCT_IDS.map((id) => catalog.products[id]),
    [catalog],
  );

  useEffect(() => {
    const prices: Record<string, string> = {};
    const names: Record<string, string> = {};
    for (const id of CATALOG_PRODUCT_IDS) {
      const product = catalog.products[id];
      prices[id] = String(product.priceUsd);
      names[id] = product.name;
    }
    setEditPrices(prices);
    setEditNames(names);
  }, [catalog]);

  if (!user) return <Redirect href="/auth/login" />;
  if (!isSuperAdmin) {
    return (
      <AdminScreenShell title="Products" subtitle="Super admin only">
        <SettingsSection
          title="Restricted"
          footer="Only the super admin can change card prices and catalog availability."
          compact
        />
        <SettingsGroup compact style={styles.readOnlyCard}>
          {products.map((product) => (
            <View key={product.id} style={styles.readOnlyRow}>
              <AppText variant="body" weight="bold">
                {product.emoji} {product.name}
              </AppText>
              <AppText variant="caption" tone="muted">
                ${product.priceUsd} · {product.isActive ? 'Active' : 'Inactive'}
              </AppText>
            </View>
          ))}
        </SettingsGroup>
      </AdminScreenShell>
    );
  }

  async function saveProduct(product: CatalogProduct) {
    const priceStr = editPrices[product.id];
    const price = parseFloat(priceStr);
    const name = (editNames[product.id] ?? product.name).trim();
    if (!name) {
      Alert.alert('Invalid name', 'Product name is required.');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      Alert.alert('Invalid price', 'Please enter a valid price.');
      return;
    }

    setSaving((prev) => ({ ...prev, [product.id]: true }));
    try {
      await setDoc(
        doc(db, 'products', product.id),
        {
          name,
          emoji: product.emoji,
          price,
          kind: product.kind,
          isActive: product.isActive,
          updatedAt: serverTimestamp(),
          updatedBy: user?.id ?? null,
        },
        { merge: true },
      );
      invalidateProductCatalogCache();
      await refreshProductCatalog();
      await reload();
      Alert.alert('Saved', `${name} is now $${price} across guest checkout and sales.`);
    } catch {
      Alert.alert('Permission denied', 'Only super admin can update product prices.');
    } finally {
      setSaving((prev) => ({ ...prev, [product.id]: false }));
    }
  }

  async function toggleActive(product: CatalogProduct) {
    const newActive = !product.isActive;
    try {
      await setDoc(
        doc(db, 'products', product.id),
        {
          isActive: newActive,
          updatedAt: serverTimestamp(),
          updatedBy: user?.id ?? null,
        },
        { merge: true },
      );
      invalidateProductCatalogCache();
      await refreshProductCatalog();
      await reload();
    } catch {
      Alert.alert('Permission denied', 'Only super admin can change product availability.');
    }
  }

  return (
    <AdminScreenShell title="Products" subtitle="Super admin">
      <SettingsSection
        title="Live catalog"
        footer="Changes apply immediately to guest checkout, design, and sales orders. Only super admin can edit."
        compact
      />

      {loading ? (
        <AppText variant="body" tone="muted" style={styles.empty}>
          Loading catalog…
        </AppText>
      ) : (
        products.map((product) => (
          <SettingsGroup
            key={product.id}
            compact
            style={[styles.card, !product.isActive && styles.cardInactive]}
          >
            <View style={styles.productHeader}>
              <View style={[styles.emojiWrap, { backgroundColor: colors.surfaceSoft }]}>
                <AppText style={styles.emoji}>{product.emoji}</AppText>
              </View>
              <View style={styles.productInfo}>
                <TextInput
                  style={[styles.nameInput, { color: colors.typographyColor, borderColor: colors.border }]}
                  value={editNames[product.id] ?? product.name}
                  onChangeText={(value) => setEditNames((prev) => ({ ...prev, [product.id]: value }))}
                  placeholder="Product name"
                  placeholderTextColor={colors.textMuted}
                />
                <AppText variant="caption" tone="muted">
                  {product.id} · {product.kind === 'digital' ? 'Digital' : 'Physical NFC'}
                </AppText>
              </View>
              <View style={styles.toggleWrap}>
                <AppText
                  variant="caption"
                  weight="semibold"
                  style={{ color: product.isActive ? theme.colors.success : colors.textMuted }}
                >
                  {product.isActive ? 'Active' : 'Inactive'}
                </AppText>
                <Switch
                  value={product.isActive}
                  onValueChange={() => void toggleActive(product)}
                  trackColor={{ false: colors.border, true: theme.colors.success }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={styles.priceRow}>
              <AppText variant="body" weight="medium">
                Price (USD)
              </AppText>
              <View style={[styles.priceInputWrap, { backgroundColor: colors.surfaceSoft }]}>
                <AppText variant="body" weight="semibold" tone="muted">
                  $
                </AppText>
                <TextInput
                  style={[styles.priceInput, { color: colors.typographyColor }]}
                  value={editPrices[product.id] ?? String(product.priceUsd)}
                  onChangeText={(value) => setEditPrices((prev) => ({ ...prev, [product.id]: value }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <AppText variant="caption" tone="muted">
              Live price: ${product.priceUsd}
              {catalog.updatedAt ? ` · synced ${new Date(catalog.updatedAt).toLocaleString()}` : ''}
            </AppText>

            <Pressable
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary },
                saving[product.id] && styles.saveBtnDisabled,
              ]}
              onPress={() => void saveProduct(product)}
              disabled={saving[product.id]}
            >
              <AppText variant="body" weight="bold" style={styles.saveBtnText}>
                {saving[product.id] ? 'Saving…' : 'Save & publish price'}
              </AppText>
            </Pressable>
          </SettingsGroup>
        ))
      )}

      <Pressable
        style={[styles.resetBtn, { borderColor: colors.border }]}
        onPress={() => {
          Alert.alert(
            'Reset to defaults?',
            'This restores bundled default prices in the admin form only. Tap Save on each card to publish.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset form',
                onPress: () => {
                  const defaults = buildDefaultProductCatalog();
                  const prices: Record<string, string> = {};
                  const names: Record<string, string> = {};
                  for (const id of CATALOG_PRODUCT_IDS) {
                    prices[id] = String(defaults.products[id].priceUsd);
                    names[id] = defaults.products[id].name;
                  }
                  setEditPrices(prices);
                  setEditNames(names);
                },
              },
            ],
          );
        }}
      >
        <AppText variant="caption" tone="muted">
          Reset form to bundled defaults
        </AppText>
      </Pressable>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: theme.spacing.xl },
  readOnlyCard: { padding: theme.spacing.lg, gap: theme.spacing.md },
  readOnlyRow: { gap: 4 },
  card: { marginBottom: theme.spacing.md, padding: theme.spacing.lg, gap: theme.spacing.md },
  cardInactive: { opacity: 0.6 },
  productHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  emojiWrap: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  productInfo: { flex: 1, gap: 6 },
  nameInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  toggleWrap: { alignItems: 'center', gap: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    height: 44,
    gap: 4,
  },
  priceInput: { fontSize: 17, fontWeight: '600', minWidth: 72, textAlign: 'right' },
  saveBtn: { borderRadius: theme.radius.sm, paddingVertical: 11, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFFFFF' },
  resetBtn: {
    marginTop: theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
});
