import CryptoJS from 'crypto-js';

const APP_IDENTIFIER = process.env.EXPO_PUBLIC_SITEHUB_APP_ID?.trim() || 'com.sagozen.sitehubman';

function getQrSigningKey(): string {
  return process.env.EXPO_PUBLIC_SITEHUB_QR_SIGNING_KEY?.trim() ?? '';
}

function withoutSignature(data: any): any {
  const clone = { ...data };
  delete clone.appSignature;
  return clone;
}

function stableStringify(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export const generateAppSignature = (data: any): string => {
  const signingKey = getQrSigningKey();
  if (!signingKey) return '';

  const payload = {
    appId: APP_IDENTIFIER,
    data: withoutSignature(data),
  };

  return CryptoJS.HmacSHA256(stableStringify(payload), signingKey).toString();
};

export const validateAppSignature = (qrData: any): boolean => {
  try {
    if (!getQrSigningKey()) return false;
    if (!qrData.appSignature || !qrData.type) {
      return false;
    }

    const expectedSignature = generateAppSignature(withoutSignature(qrData));
    return qrData.appSignature === expectedSignature;
  } catch {
    return false;
  }
};

export const isQRCodeExpired = (qrData: any): boolean => {
  if (!qrData.expiresAt) return false;
  return new Date() > new Date(qrData.expiresAt);
};

export const validateQRCodeStructure = (qrData: any): boolean => {
  const requiredFields = ['id', 'type', 'appSignature', 'createdAt', 'createdBy'];
  
  for (const field of requiredFields) {
    if (!qrData[field]) {
      return false;
    }
  }
  
  const validTypes = ['user_invite', 'attendance', 'event_invite'];
  const groupTypes = ['group_invite', 'group_attendance'];
  const allValidTypes = [...validTypes, ...groupTypes];
  if (!allValidTypes.includes(qrData.type)) {
    return false;
  }
  
  return true;
};

export const generateSecureQRData = (baseData: any, adminId: string): any => {
  const qrData = {
    ...baseData,
    appId: APP_IDENTIFIER,
    signatureVersion: 'hmac-sha256-v2',
    id: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    createdBy: adminId,
  };

  qrData.appSignature = generateAppSignature(qrData);

  return qrData;
};
