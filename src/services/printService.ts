import { Platform } from 'react-native';

export type PrintDimensions = {
  width: number;
  height: number;
};

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
