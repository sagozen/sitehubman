import { Stack } from 'expo-router';
import PrinterSettingsScreen from '@/src/features/sales/screens/PrinterSettingsScreen';

export default function PrinterSettingsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PrinterSettingsScreen />
    </>
  );
}
