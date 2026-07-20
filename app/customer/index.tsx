/**
 * /customer — Customer home dashboard.
 *
 * This is the default landing route for authenticated customers.
 * Renders the premium CustomerAccountScreen directly instead of redirecting.
 */
import { CustomerAccountScreen } from '@/src/features/customer/CustomerAccountScreen';

export default function CustomerIndex() {
  return <CustomerAccountScreen />;
}
