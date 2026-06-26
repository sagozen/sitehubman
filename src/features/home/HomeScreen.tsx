import { CustomerAccountScreen } from '@/src/features/customer/CustomerAccountScreen';
import { GuestHomeScreen } from '@/src/features/guest/GuestHomeScreen';
import { useIsGuest } from '@/src/hooks/useIsGuest';

export function HomeScreen() {
  return useIsGuest() ? <GuestHomeScreen /> : <CustomerAccountScreen />;
}
