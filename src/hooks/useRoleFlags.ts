import { useMemo } from 'react';
import { useAuth } from '@/src/hooks/useAuth';

export function useRoleFlags() {
  const { user } = useAuth();

  return useMemo(
    () => ({
      role: user?.role ?? 'guest',
      isSales: user?.role === 'sales',
      isAgent: false,
      isPrinter: false,
      isQaInspector: false,
      isShipping: false,
      isCustomer: user?.role === 'customer',
      isAdmin: user?.role === 'super_admin',
      isSuperAdmin: user?.role === 'super_admin',
      isGuest: !user || user.isGuest === true || user.role === 'guest',
    }),
    [user]
  );
}
