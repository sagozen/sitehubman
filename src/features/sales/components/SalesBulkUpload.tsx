/**
 * SalesBulkUpload — iOS Settings-style card for CSV batch import.
 */
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { AppIcon } from '@/src/components/AppIcon';
import { salesUi } from '@/src/features/sales/components/SalesScreenUi';
import { useAuth } from '@/src/hooks/useAuth';
import { createOrder } from '@/src/services/firestoreService';
import { writeAuditLog } from '@/src/services/productionService';
import { CardDesign } from '@/src/types/models';

// ─── CSV helpers ──────────────────────────────────────────────────────────────

type CsvRow = {
  customerName: string;
  phone: string;
  email?: string;
  company?: string;
  telegram?: string;
  productType: string;
};

function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  cols.push(current.trim());
  return cols;
}

function headerIndex(headers: string[], ...needles: string[]): number {
  return headers.findIndex((h) => needles.some((n) => h.includes(n)));
}

export function parseEmployeeCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const nameIdx     = headerIndex(headers, 'name', 'customer');
  const phoneIdx    = headerIndex(headers, 'phone', 'mobile');
  const emailIdx    = headerIndex(headers, 'email', 'mail');
  const companyIdx  = headerIndex(headers, 'company', 'org');
  const telegramIdx = headerIndex(headers, 'telegram');
  const productIdx  = headerIndex(headers, 'product', 'card');

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return {
      customerName: cols[nameIdx     >= 0 ? nameIdx     : 0] ?? '',
      phone:        cols[phoneIdx    >= 0 ? phoneIdx    : 1] ?? '',
      email:        emailIdx    >= 0 ? cols[emailIdx]    : undefined,
      company:      companyIdx  >= 0 ? cols[companyIdx]  : undefined,
      telegram:     telegramIdx >= 0 ? cols[telegramIdx] : undefined,
      productType:  cols[productIdx  >= 0 ? productIdx  : 2] ?? 'wood_card',
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SalesBulkUpload() {
  const { user } = useAuth();
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function runImport(rows: CsvRow[]) {
    if (!user?.id) return;
    if (rows.length === 0) {
      Alert.alert('No rows', 'Add a header row and at least one employee line.');
      return;
    }
    setImporting(true);
    let ok = 0;
    let failed = 0;
    for (const row of rows) {
      const hasContact = row.phone?.trim() || row.telegram?.trim() || row.email?.trim();
      if (!row.customerName?.trim() || !hasContact) { failed += 1; continue; }
      try {
        await createOrder({
          customerName: row.customerName,
          phone: row.phone || '',
          email: row.email,
          company: row.company,
          telegram: row.telegram,
          productType: row.productType || 'wood_card',
          quantity: 1,
          cardDesign: 'classic_black' as CardDesign,
          fulfillment: 'physical',
          paymentStatus: 'unpaid',
          notes: 'bulk_import',
          orderSource: 'bulk',
          assignedSalesman: user.id,
          createdBy: user.id,
        });
        ok += 1;
      } catch { failed += 1; }
    }
    if (ok > 0) {
      await writeAuditLog({
        action: 'bulk_orders_imported',
        entityType: 'order',
        entityId: user.id,
        actorId: user.id,
        actorRole: user.role,
        branch: user.branch,
        metadata: { created: ok, failed, source: 'sales_csv' },
      });
    }
    setImporting(false);
    Alert.alert('Import complete', `${ok} draft orders created, ${failed} skipped or failed.`);
  }

  return (
    <View style={styles.wrap}>
      {/* Header row */}
      <Pressable
        style={({ pressed }) => [styles.headerRow, pressed && { opacity: 0.7 }]}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={styles.headerIcon}>
          <AppIcon name="Upload" size={18} color={salesUi.accent} />
        </View>
        <View style={styles.headerCopy}>
          <AppText style={styles.headerTitle}>Bulk import</AppText>
          <AppText style={styles.headerSub}>Upload CSV employee / client list</AppText>
        </View>
        <AppIcon
          name={expanded ? 'ChevronUp' : 'ChevronDown'}
          size={16}
          color={salesUi.muted}
        />
      </Pressable>

      {/* Collapsible body */}
      {expanded ? (
        <View style={styles.body}>
          <View style={styles.divider} />
          <AppText style={styles.hint}>
            CSV columns: customerName, phone, email, company, telegram, productType
          </AppText>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Paste CSV here…"
            placeholderTextColor={salesUi.muted}
            value={csvText}
            onChangeText={setCsvText}
            editable={!importing}
            textAlignVertical="top"
          />
          <Pressable
            style={[styles.btn, (importing || !csvText.trim()) && styles.btnDisabled]}
            disabled={importing || !csvText.trim()}
            onPress={() => void runImport(parseEmployeeCsv(csvText))}
          >
            {importing ? (
              <AppText style={styles.btnText}>Importing…</AppText>
            ) : (
              <>
                <AppIcon name="CloudUpload" size={16} color="#fff" />
                <AppText style={styles.btnText}>Import to Firebase</AppText>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    backgroundColor: salesUi.surface,
    borderRadius: salesUi.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    overflow: 'hidden',
    ...salesUi.shadow,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: salesUi.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,149,0,0.2)',
  },
  headerCopy: { flex: 1 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: salesUi.text,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    color: salesUi.muted,
    marginTop: 1,
  },

  body: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: salesUi.border,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
    color: salesUi.muted,
    lineHeight: 17,
  },
  input: {
    minHeight: 96,
    maxHeight: 160,
    borderRadius: salesUi.radiusSm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: salesUi.border,
    padding: 12,
    fontSize: 13,
    fontWeight: '400',
    color: salesUi.text,
    backgroundColor: salesUi.bg,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: salesUi.accent,
    borderRadius: salesUi.radiusSm,
    paddingVertical: 13,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
