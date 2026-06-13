import { AuthSignupSheet } from '@/src/features/auth/components/AuthSignupSheet';
import type { AppUser } from '@/src/types/models';

type Props = {
  visible: boolean;
  cardId: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onConverted: (user: AppUser) => void;
};

/** Inline signup sheet for guest card save — same UI as auth login float sheet. */
export function GuestAccountSheet({
  visible,
  cardId,
  title = 'Save your NFC card',
  subtitle = 'Create a free account to edit later, track orders, and manage future cards.',
  onClose,
  onConverted,
}: Props) {
  return (
    <AuthSignupSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      cardId={cardId}
      onSuccess={onConverted}
    />
  );
}
