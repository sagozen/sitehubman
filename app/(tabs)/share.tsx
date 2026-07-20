import { CustomerShareScreen } from '@/src/features/customer/CustomerShareScreen';
import { Platform } from 'react-native';
import Head from 'expo-router/head';

export default function ShareTabRoute() {
  return (
    <>
      {Platform.OS === 'web' && (
        <Head>
          <title>Share Card & QR | Snap Tap NFC</title>
          <meta name="description" content="Share your business profile instantly using a QR code scan or NFC tag transmission." />
        </Head>
      )}
      <CustomerShareScreen />
    </>
  );
}
