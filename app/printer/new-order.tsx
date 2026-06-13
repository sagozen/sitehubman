import { Redirect } from 'expo-router';

/** Hidden route — printer uses tab bar + button to open scan. */
export default function PrinterNewOrderRoute() {
  return <Redirect href="/printer/scan" />;
}
