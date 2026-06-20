import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { DEFAULT_PAGE_SIZE } from '@/src/constants/pagination';
import { firebaseCollections } from '@/src/constants/collections';
import { db } from '@/src/services/firebaseClient';
import { mapOrder } from '@/src/services/orderMappers';
import type { Order, UserRole } from '@/src/types/models';
import { isPrinterOperatorRole } from '@/src/types/models';

export type OrdersPageResult = {
  items: Order[];
  nextCursor: string | null;
  hasMore: boolean;
};

function sortNewestFirst(items: Order[]): Order[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function buildOrdersQuery(
  role: UserRole,
  userId: string,
  pageSize: number,
  cursorSnap?: Awaited<ReturnType<typeof getDoc>>
) {
  const col = collection(db, firebaseCollections.orders);
  const constraints = [];
  if (role === 'customer') {
    constraints.push(where('createdBy', '==', userId));
  } else if (role === 'sales' || role === 'agent') {
    constraints.push(where('assignedSalesman', '==', userId));
  }
  constraints.push(orderBy('createdAt', 'desc'));
  if (cursorSnap?.exists()) {
    constraints.push(startAfter(cursorSnap));
  }
  constraints.push(limit(pageSize));
  return query(col, ...constraints);
}

export async function listOrdersPage(
  role: UserRole,
  userId: string,
  options?: { pageSize?: number; cursorOrderId?: string | null; branch?: string }
): Promise<OrdersPageResult> {
  if (!userId || role === 'guest') {
    return { items: [], nextCursor: null, hasMore: false };
  }
  if (isPrinterOperatorRole(role)) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  let cursorSnap;
  if (options?.cursorOrderId) {
    cursorSnap = await getDoc(doc(db, firebaseCollections.orders, options.cursorOrderId));
  }
  const snapshot = await getDocs(buildOrdersQuery(role, userId, pageSize, cursorSnap));
  let items = snapshot.docs.map((d) => mapOrder(d.id, d.data() as Record<string, unknown>));

  if ((role === 'agent' || role === 'shipping') && options?.branch?.trim()) {
    items = items.filter((o) => !o.branch || o.branch === options.branch);
  }

  items = sortNewestFirst(items);
  const last = snapshot.docs[snapshot.docs.length - 1];
  const hasMore = snapshot.docs.length === pageSize;

  return {
    items,
    nextCursor: hasMore && last ? last.id : null,
    hasMore,
  };
}

/** Admin CSV export — capped page fetches. */
export async function listOrdersForAdminExport(
  adminUserId: string,
  maxOrders = 500
): Promise<Order[]> {
  const all: Order[] = [];
  let cursor: string | null = null;
  while (all.length < maxOrders) {
    const page = await listOrdersPage('admin', adminUserId, {
      pageSize: Math.min(DEFAULT_PAGE_SIZE, maxOrders - all.length),
      cursorOrderId: cursor,
    });
    all.push(...page.items);
    if (!page.hasMore || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all;
}
