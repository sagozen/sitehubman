import { useAuth } from '@/src/hooks/useAuth';
import { useRoleFlags } from '@/src/hooks/useRoleFlags';
import { OrderDetailScreen } from '@/src/features/orders/OrderDetailScreen2';
import { SalesOrderDetailScreen } from '@/src/features/sales/SalesOrderDetailScreen';

export default function OrderDetailRoute() {
  const { isSales, isAdmin } = useRoleFlags();
  // Sales-only sees the premium redesigned screen; admin and other roles
  // keep the full edit form.
  if (isSales && !isAdmin) {
    return <SalesOrderDetailScreen />;
  }
  return <OrderDetailScreen />;
}
