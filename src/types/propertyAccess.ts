export type CredentialStatus = 'active' | 'blocked' | 'lost' | 'expired';
export type CredentialKind = 'nfc' | 'wallet' | 'qr';
export type VisitorPassStatus = 'active' | 'revoked' | 'expired';
export type AccessDecision = 'granted' | 'denied';

export interface PropertyResident {
  id: string;
  propertyId: string;
  fullName: string;
  unit: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface AccessCredential {
  id: string;
  propertyId: string;
  residentId?: string;
  label: string;
  kind: CredentialKind;
  nfcUid?: string;
  status: CredentialStatus;
  walletPassUrl?: string;
  createdAt: string;
}

export interface VisitorPass {
  id: string;
  propertyId: string;
  hostResidentId: string;
  visitorName: string;
  token: string;
  validFrom: string;
  validUntil: string;
  status: VisitorPassStatus;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  propertyId: string;
  credentialId?: string;
  visitorPassId?: string;
  subjectName: string;
  method: CredentialKind;
  decision: AccessDecision;
  door: string;
  occurredAt: string;
}

export interface AccessValidationResult {
  decision: AccessDecision;
  subjectName: string;
  method: CredentialKind;
  door: string;
}
