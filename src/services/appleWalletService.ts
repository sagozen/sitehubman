/**
 * Apple Wallet (PKPass) Service — Generates pass configurations and handles iOS pass downloads.
 */

export interface AppleWalletPassData {
  primaryText: string;
  secondaryText?: string;
  label?: string;
  qrUrl: string;
  serialNumber?: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

/**
 * Generates an Apple Wallet pass configuration payload.
 */
export function buildAppleWalletPassPayload(data: AppleWalletPassData) {
  const serial = data.serialNumber || `PASS-${Date.now()}`;
  return {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.sitehubman.card',
    serialNumber: serial,
    teamIdentifier: 'APPLE_TEAM_ID',
    organizationName: 'Sitehubman',
    description: 'Digital NFC & QR Business Card',
    logoText: 'Sitehubman',
    backgroundColor: data.backgroundColor || 'rgb(17, 17, 20)',
    foregroundColor: data.foregroundColor || 'rgb(255, 255, 255)',
    labelColor: 'rgb(161, 161, 170)',
    generic: {
      primaryFields: [
        {
          key: 'name',
          label: 'MEMBER',
          value: data.primaryText,
        },
      ],
      secondaryFields: [
        {
          key: 'title',
          label: data.label || 'ROLE',
          value: data.secondaryText || 'Verified Identity',
        },
      ],
      auxiliaryFields: [
        {
          key: 'status',
          label: 'CARD STATUS',
          value: 'Active',
        },
      ],
    },
    barcode: {
      message: data.qrUrl,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
    },
    barcodes: [
      {
        message: data.qrUrl,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
      },
    ],
  };
}

/**
 * Trigger PKPass pass download / presentation.
 */
export async function downloadAppleWalletPass(data: AppleWalletPassData): Promise<string> {
  const passUrl = `https://sitehub.app/api/pass/download?slug=${encodeURIComponent(data.qrUrl)}`;
  return passUrl;
}
