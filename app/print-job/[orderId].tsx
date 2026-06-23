import { Stack } from 'expo-router';
import PrintJobScreen from '@/src/features/sales/screens/PrintJobScreen';

export default function PrintJobRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PrintJobScreen />
    </>
  );
}
