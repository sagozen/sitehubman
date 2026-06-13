import type { AppUser, UserRole } from '@/src/types/models';
import { isPrinterOperatorRole } from '@/src/types/models';

const BRANCH_REQUIRED_ROLES: UserRole[] = [
  'printer',
  'printer_operator',
  'qa_inspector',
  'shipping',
  'agent',
];

export function roleRequiresBranch(role: UserRole | undefined): boolean {
  if (!role) return false;
  return BRANCH_REQUIRED_ROLES.includes(role) || isPrinterOperatorRole(role);
}

export function assertStaffBranch(user: AppUser | null | undefined, context: string): string {
  const branch = user?.branch?.trim();
  if (roleRequiresBranch(user?.role) && !branch) {
    throw new Error(`${context}: your account needs a branch assigned. Ask an admin.`);
  }
  return branch ?? '';
}

export function resolveOrderBranch(staffBranch: string | undefined, fallback = ''): string {
  const branch = staffBranch?.trim() || fallback.trim();
  return branch;
}
