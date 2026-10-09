import React, { useState } from 'react';
import { View, StyleSheet, Platform, Linking } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/src/services/firebaseClient';
import { AppButton } from '@/src/components/AppButton';
import { useToast } from '@/src/providers/ToastProvider';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface WalletPassButtonsProps {
  onSuccess?: () => void;
}

export function WalletPassButtons({ onSuccess }: WalletPassButtonsProps) {
  const [loadingApple, setLoadingApple] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { showToast } = useToast();

  const handleAddAppleWallet = async () => {
    if (loadingApple) return;
    setLoadingApple(true);
    try {
      const generatePass = httpsCallable(functions, 'generateAppleWalletPass');
      const response = await generatePass();
      const data = response.data as { success: boolean; passBase64: string };
      
      if (data.success && data.passBase64) {
        if (Platform.OS === 'ios') {
          const fileUri = `${FileSystem.documentDirectory}SiteHubCard.pkpass`;
          await FileSystem.writeAsStringAsync(fileUri, data.passBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, { UTI: 'com.apple.pkpass', mimeType: 'application/vnd.apple.pkpass' });
            showToast({ message: 'Ready to add to Wallet', type: 'success' });
            onSuccess?.();
          } else {
            showToast({ message: 'Sharing is not available on this device.', type: 'error' });
          }
        } else {
          showToast({ message: 'Apple Wallet is only supported on iOS devices.', type: 'error' });
        }
      }
    } catch (error: any) {
      console.error('Apple Wallet Error:', error);
      showToast({ message: error.message || 'Failed to generate Apple Wallet pass', type: 'error' });
    } finally {
      setLoadingApple(false);
    }
  };

  const handleAddGoogleWallet = async () => {
    if (loadingGoogle) return;
    setLoadingGoogle(true);
    try {
      const generatePass = httpsCallable(functions, 'generateGoogleWalletPass');
      const response = await generatePass();
      const data = response.data as { success: boolean; googleWalletUrl: string };
      
      if (data.success && data.googleWalletUrl) {
        const canOpen = await Linking.canOpenURL(data.googleWalletUrl);
        if (canOpen) {
          await Linking.openURL(data.googleWalletUrl);
          showToast({ message: 'Ready to add to Google Wallet', type: 'success' });
          onSuccess?.();
        } else {
          showToast({ message: 'Cannot open Google Wallet link.', type: 'error' });
        }
      }
    } catch (error: any) {
      console.error('Google Wallet Error:', error);
      showToast({ message: error.message || 'Failed to generate Google Wallet link', type: 'error' });
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' && (
        <AppButton 
          title={loadingApple ? 'Generating...' : 'Add to Apple Wallet'} 
          leftIcon={"logo-apple" as any} 
          variant="primary" 
          onPress={handleAddAppleWallet}
          disabled={loadingApple || loadingGoogle}
        />
      )}
      
      {Platform.OS === 'android' && (
        <AppButton 
          title={loadingGoogle ? 'Generating...' : 'Add to Google Wallet'} 
          leftIcon={"logo-google" as any} 
          variant="secondary" 
          onPress={handleAddGoogleWallet}
          disabled={loadingApple || loadingGoogle}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
