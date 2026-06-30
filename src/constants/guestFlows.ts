import {
  CUSTOMER_FLOWS,
  CUSTOMER_FLOW_ORDER,
  type CustomerFlowDefinition,
  type CustomerFlowId,
} from '@/src/constants/customerFlows';

/** Guest journey — same registry, curated for preview / design-before-signup. */
export const GUEST_FLOW_ORDER: CustomerFlowId[] = [
  'ecard',
  'preview',
  'order',
  'track',
  'nfc',
  'connections',
];

export const GUEST_PRIMARY_FLOW_IDS: CustomerFlowId[] = ['drafts', 'preview', 'order', 'nfc'];

export const GUEST_PRIMARY_FLOWS = GUEST_PRIMARY_FLOW_IDS.map((id) => CUSTOMER_FLOWS[id]);

export const GUEST_METRIC_FLOWS: CustomerFlowDefinition[] = [
  CUSTOMER_FLOWS.order,
  CUSTOMER_FLOWS.preview,
  CUSTOMER_FLOWS.track,
  CUSTOMER_FLOWS.connections,
];

export function getGuestFlow(id: CustomerFlowId): CustomerFlowDefinition {
  return CUSTOMER_FLOWS[id];
}

export const GUEST_RECENT_FLOW_ORDER = CUSTOMER_FLOW_ORDER;
