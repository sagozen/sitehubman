/**
 * printerStorageService — local printer configuration storage.
 *
 * Stores printer name, IP, location, and status in AsyncStorage.
 * When real printer SDKs are added later, this service provides
 * the config layer (IP, port, etc.) they need to connect.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sitehub/printers';
const DEFAULT_KEY = '@sitehub/default_printer';

export interface PrinterConfig {
  id: string;
  name: string;
  ipAddress: string;
  port: string;
  location: string;
  isDefault: boolean;
  /** Last test result: 'ok' | 'fail' | 'untested' */
  lastTestResult: 'ok' | 'fail' | 'untested';
  lastTestAt?: string;
  createdAt: string;
}

/** Generate a short unique ID */
function uid(): string {
  return `prt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getAllPrinters(): Promise<PrinterConfig[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PrinterConfig[];
  } catch {
    return [];
  }
}

export async function getDefaultPrinter(): Promise<PrinterConfig | null> {
  const all = await getAllPrinters();
  const defaultId = await AsyncStorage.getItem(DEFAULT_KEY);
  if (defaultId) {
    const found = all.find(p => p.id === defaultId);
    if (found) return found;
  }
  // Fallback: first printer
  return all.length > 0 ? all[0] : null;
}

export async function getPrinterById(id: string): Promise<PrinterConfig | null> {
  const all = await getAllPrinters();
  return all.find(p => p.id === id) ?? null;
}

// ─── Write ────────────────────────────────────────────────────────────────────

async function savePrinters(printers: PrinterConfig[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(printers));
}

export async function addPrinter(
  name: string,
  ipAddress: string,
  port: string,
  location: string,
): Promise<PrinterConfig> {
  const all = await getAllPrinters();
  const printer: PrinterConfig = {
    id: uid(),
    name: name.trim(),
    ipAddress: ipAddress.trim(),
    port: port.trim() || '9100',
    location: location.trim(),
    isDefault: all.length === 0, // first printer is default
    lastTestResult: 'untested',
    createdAt: new Date().toISOString(),
  };
  all.push(printer);
  await savePrinters(all);
  if (printer.isDefault) {
    await AsyncStorage.setItem(DEFAULT_KEY, printer.id);
  }
  return printer;
}

export async function updatePrinter(
  id: string,
  updates: Partial<Pick<PrinterConfig, 'name' | 'ipAddress' | 'port' | 'location'>>,
): Promise<void> {
  const all = await getAllPrinters();
  const idx = all.findIndex(p => p.id === id);
  if (idx < 0) return;
  Object.assign(all[idx], updates);
  await savePrinters(all);
}

export async function deletePrinter(id: string): Promise<void> {
  let all = await getAllPrinters();
  all = all.filter(p => p.id !== id);
  await savePrinters(all);
  // If we deleted the default, set a new one
  const defaultId = await AsyncStorage.getItem(DEFAULT_KEY);
  if (defaultId === id) {
    if (all.length > 0) {
      await AsyncStorage.setItem(DEFAULT_KEY, all[0].id);
    } else {
      await AsyncStorage.removeItem(DEFAULT_KEY);
    }
  }
}

export async function setDefaultPrinter(id: string): Promise<void> {
  await AsyncStorage.setItem(DEFAULT_KEY, id);
}

// ─── Test connection (simulated) ──────────────────────────────────────────────

/**
 * Simulate a printer connection test.
 * In future, this will ping the printer IP:port via TCP.
 * For now it just checks that IP is not empty and simulates a delay.
 */
export async function testPrinterConnection(id: string): Promise<'ok' | 'fail'> {
  const all = await getAllPrinters();
  const idx = all.findIndex(p => p.id === id);
  if (idx < 0) return 'fail';

  // Simulate network delay
  await new Promise(r => setTimeout(r, 1500));

  // Simple validation: if IP looks valid, "pass"
  const ip = all[idx].ipAddress;
  const looksValid = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) || ip === 'localhost';
  const result: 'ok' | 'fail' = looksValid ? 'ok' : 'fail';

  all[idx].lastTestResult = result;
  all[idx].lastTestAt = new Date().toISOString();
  await savePrinters(all);

  return result;
}
