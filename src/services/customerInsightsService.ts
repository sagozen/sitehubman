import { getBioPage, listOrdersSimple } from '@/src/services/firestoreService';

export type CustomerInsights = {
  bioSlug: string | null;
  displayName: string | null;
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
};

export async function getCustomerInsights(userId: string): Promise<CustomerInsights> {
  if (!userId?.trim()) {
    return {
      bioSlug: null,
      displayName: null,
      totalOrders: 0,
      activeOrders: 0,
      deliveredOrders: 0,
    };
  }

  const [bio, orders] = await Promise.all([
    getBioPage(userId),
    listOrdersSimple('customer', userId),
  ]);

  return {
    bioSlug: bio?.slug ?? null,
    displayName: bio?.displayName ?? null,
    totalOrders: orders.length,
    activeOrders: orders.filter((order) => order.status !== 'delivered').length,
    deliveredOrders: orders.filter((order) => order.status === 'delivered').length,
  };
}
