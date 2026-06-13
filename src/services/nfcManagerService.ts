import { Platform } from 'react-native';

type NfcManagerModule = typeof import('react-native-nfc-manager').default;
type NfcTechModule = typeof import('react-native-nfc-manager').NfcTech;
type NdefModule = typeof import('react-native-nfc-manager').Ndef;

type NfcModules = {
  NfcManager: NfcManagerModule;
  NfcTech: NfcTechModule;
  Ndef: NdefModule;
};

let modules: NfcModules | null = null;
let hasStarted = false;

async function loadNfcModules(): Promise<NfcModules | null> {
  if (Platform.OS === 'web') return null;
  if (modules) return modules;

  try {
    const nfc = await import('react-native-nfc-manager');
    modules = {
      NfcManager: nfc.default,
      NfcTech: nfc.NfcTech,
      Ndef: nfc.Ndef,
    };
    return modules;
  } catch {
    return null;
  }
}

export async function isNfcAvailable() {
  const nfc = await loadNfcModules();
  if (!nfc) return false;
  return nfc.NfcManager.isSupported();
}

export async function startNfcManager() {
  const nfc = await loadNfcModules();
  if (!nfc) throw new Error('NFC is only available in a native iOS or Android build.');
  if (hasStarted) return;
  await nfc.NfcManager.start();
  hasStarted = true;
}

async function withNfcRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt >= 3) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }
}

export async function writeNfcUrl(url: string) {
  const nfc = await loadNfcModules();
  if (!nfc) {
    throw new Error('NFC writing is not available on web. Use a native development build or production app.');
  }

  await startNfcManager();
  const bytes = nfc.Ndef.encodeMessage([nfc.Ndef.uriRecord(url)]);
  if (!bytes) throw new Error('Unable to create NFC payload.');

  await withNfcRetry(async () => {
    try {
      await nfc.NfcManager.requestTechnology(nfc.NfcTech.Ndef);
      await nfc.NfcManager.ndefHandler.writeNdefMessage(bytes);
    } finally {
      void nfc.NfcManager.cancelTechnologyRequest();
    }
  });
}

export async function readNfcTag() {
  const nfc = await loadNfcModules();
  if (!nfc) {
    throw new Error('NFC reading is not available on web. Use a native development build or production app.');
  }

  await startNfcManager();
  return withNfcRetry(async () => {
    try {
      await nfc.NfcManager.requestTechnology(nfc.NfcTech.Ndef);
      return await nfc.NfcManager.getTag();
    } finally {
      void nfc.NfcManager.cancelTechnologyRequest();
    }
  });
}

const NDEF_URI_PREFIXES = [
  '',
  'http://www.',
  'https://www.',
  'http://',
  'https://',
  'tel:',
  'mailto:',
  'ftp://anonymous:anonymous@',
  'ftp://ftp.',
  'ftps://',
  'sftp://',
  'smb://',
  'nfs://',
  'ftp://',
  'dav://',
  'news:',
  'telnet://',
  'imap:',
  'rtsp://',
  'urn:',
  'pop:',
  'sip:',
  'sips:',
  'tftp:',
  'btspp://',
  'btl2cap://',
  'btgoep://',
  'tcpobex://',
  'irdaobex://',
  'file://',
  'urn:epc:id:',
  'urn:epc:tag:',
  'urn:epc:pat:',
  'urn:epc:raw:',
  'urn:epc:',
  'urn:nfc:',
];

function bytesFromUnknown(value: unknown): number[] {
  if (Array.isArray(value)) return value.map((item) => Number(item));
  if (value instanceof Uint8Array) return Array.from(value);
  if (value && typeof value === 'object' && 'length' in value) {
    return Array.from(value as ArrayLike<number>).map((item) => Number(item));
  }
  return [];
}

function asciiFromBytes(bytes: number[]): string {
  return String.fromCharCode(...bytes).replace(/\0/g, '').trim();
}

function decodeNdefRecordUrl(record: unknown): string | null {
  if (!record || typeof record !== 'object') return null;
  const data = record as { type?: unknown; payload?: unknown };
  const type = asciiFromBytes(bytesFromUnknown(data.type));
  const payload = bytesFromUnknown(data.payload);
  if (!payload.length) return null;

  if (type === 'U') {
    const prefix = NDEF_URI_PREFIXES[payload[0]] ?? '';
    return `${prefix}${asciiFromBytes(payload.slice(1))}`.trim();
  }

  if (type === 'T') {
    const languageCodeLength = payload[0] & 0x3f;
    const text = asciiFromBytes(payload.slice(1 + languageCodeLength));
    return /^https?:\/\//i.test(text) ? text : null;
  }

  const raw = asciiFromBytes(payload);
  return /^https?:\/\//i.test(raw) ? raw : null;
}

export async function readNfcUrl(): Promise<string> {
  const tag = await readNfcTag();
  const records = Array.isArray((tag as { ndefMessage?: unknown }).ndefMessage)
    ? ((tag as { ndefMessage: unknown[] }).ndefMessage)
    : [];

  for (const record of records) {
    const decoded = decodeNdefRecordUrl(record);
    if (decoded) return decoded;
  }

  throw new Error('No NFC URL found. Hold the encoded card on the phone and try again.');
}

/** Read chip UID from a blank or pre-encoded card (tries NDEF then NfcA). */
export async function readNfcUid(): Promise<string> {
  const nfc = await loadNfcModules();
  if (!nfc) {
    throw new Error('NFC reading is not available on web. Use a native development build or production app.');
  }

  const supported = await nfc.NfcManager.isSupported();
  if (!supported) {
    throw new Error('NFC is not supported on this device.');
  }

  await startNfcManager();
  return withNfcRetry(async () => {
    try {
      try {
        await nfc.NfcManager.requestTechnology(nfc.NfcTech.Ndef);
      } catch {
        await nfc.NfcManager.requestTechnology(nfc.NfcTech.NfcA);
      }
      const tag = await nfc.NfcManager.getTag();
      const uid = tag?.id?.replace(/:/g, '').toUpperCase() ?? '';
      if (!uid) throw new Error('Could not read chip UID. Hold the card on the phone and try again.');
      return uid;
    } finally {
      void nfc.NfcManager.cancelTechnologyRequest();
    }
  });
}
