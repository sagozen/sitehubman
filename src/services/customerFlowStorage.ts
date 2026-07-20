import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomerFlowId } from '@/src/constants/customerFlows';
import { CUSTOMER_FLOWS } from '@/src/constants/customerFlows';

const STORAGE_KEY = 'sitehub_customer_flow_stats_v1';

export type CustomerFlowStat = {
  flowId: CustomerFlowId;
  openCount: number;
  lastOpenedAt: string;
};

type StoredPayload = Partial<Record<CustomerFlowId, CustomerFlowStat>>;

async function readPayload(): Promise<StoredPayload> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredPayload;
  } catch {
    return {};
  }
}

async function writePayload(payload: StoredPayload): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/** Persist that the user opened a customer flow — keyed by flow storageKey. */
export async function recordCustomerFlowOpen(flowId: CustomerFlowId): Promise<void> {
  const payload = await readPayload();
  const existing = payload[flowId];
  payload[flowId] = {
    flowId,
    openCount: (existing?.openCount ?? 0) + 1,
    lastOpenedAt: new Date().toISOString(),
  };
  await writePayload(payload);
}

export async function getCustomerFlowStats(): Promise<Partial<Record<CustomerFlowId, CustomerFlowStat>>> {
  return readPayload();
}

export async function getRecentCustomerFlows(limit = 4): Promise<CustomerFlowId[]> {
  const payload = await readPayload();
  return Object.values(payload)
    .filter((item): item is CustomerFlowStat => Boolean(item?.flowId))
    .sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime())
    .slice(0, limit)
    .map((item) => item.flowId);
}

export async function clearCustomerFlowStats(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function flowStorageKey(flowId: CustomerFlowId): string {
  return CUSTOMER_FLOWS[flowId].storageKey;
}
