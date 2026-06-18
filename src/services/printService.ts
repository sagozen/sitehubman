import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrintDimensions = {
  width: number;
  height: number;
};

export const PRINTER_IP_KEY = 'sitehub_printer_ip';

export async function getPrinterIp(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PRINTER_IP_KEY);
  } catch {
    return null;
  }
}

export async function setPrinterIp(ip: string): Promise<void> {
  await AsyncStorage.setItem(PRINTER_IP_KEY, ip.trim());
}

export async function clearPrinterIp(): Promise<void> {
  await AsyncStorage.removeItem(PRINTER_IP_KEY);
}

function isMissingNativePrintModule(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ExpoPrint|expo-print|native module/i.test(message);
}

export function getPrintUnavailableMessage(): string {
  if (Platform.OS === 'web') {
    return 'Use your browser print dialog from the preview screen.';
  }
  return 'Label printing requires a development build with expo-print. Expo Go does not include this module — use PDF/share or run a custom dev client.';
}

/** Lazy-load expo-print so Expo Go can start without the native module. */
async function loadPrintModule() {
  try {
    return await import('expo-print');
  } catch (error) {
    if (isMissingNativePrintModule(error)) {
      throw new Error(getPrintUnavailableMessage());
    }
    throw error;
  }
}

export async function printHtmlDocument(html: string, dimensions: PrintDimensions): Promise<void> {
  const Print = await loadPrintModule();
  try {
    await Print.printAsync({
      html,
      width: dimensions.width,
      height: dimensions.height,
    });
  } catch (error) {
    if (isMissingNativePrintModule(error)) {
      throw new Error(getPrintUnavailableMessage());
    }
    throw error;
  }
}

export async function printHtmlToPdfFile(html: string, dimensions: PrintDimensions): Promise<{ uri: string }> {
  const Print = await loadPrintModule();
  try {
    return await Print.printToFileAsync({
      html,
      width: dimensions.width,
      height: dimensions.height,
    });
  } catch (error) {
    if (isMissingNativePrintModule(error)) {
      throw new Error(getPrintUnavailableMessage());
    }
    throw error;
  }
}

export async function printHtmlToIp(ip: string, html: string, orderCode: string): Promise<void> {
  const cleanIp = ip.trim();
  if (!cleanIp) throw new Error('Printer IP address is required.');

  // 1. Generate PDF locally
  const { uri } = await printHtmlToPdfFile(html, { width: 288, height: 432 });

  // 2. Read PDF as base64 on native platform
  let base64Pdf = '';
  if (Platform.OS !== 'web') {
    const FileSystem = await import('expo-file-system');
    base64Pdf = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    } as any);
  }

  // 3. Post payload to the IP printer relay server
  const url = cleanIp.startsWith('http://') || cleanIp.startsWith('https://')
    ? cleanIp
    : `http://${cleanIp}`;

  const finalUrl = url.endsWith('/print') ? url : `${url}/print`;

  const response = await fetch(finalUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderCode,
      html,
      pdf: base64Pdf,
    }),
  });

  if (!response.ok) {
    throw new Error(`Print server returned error status: ${response.status} ${response.statusText}`);
  }
}

