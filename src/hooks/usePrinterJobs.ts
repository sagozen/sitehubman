import { useEffect, useState } from 'react';
import { subscribePrinterJobs } from '@/src/services/firestoreService';
import { PrinterJob } from '@/src/types/models';
import { useAuth } from '@/src/hooks/useAuth';
import { useActiveBatch } from '@/src/hooks/useActiveBatch';
import { getAuthErrorMessage } from '@/src/services/authService';

function isPermissionDenied(error: unknown) {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return code === 'permission-denied' || message.includes('permission');
}

export function usePrinterJobs() {
  const [jobs, setJobs] = useState<PrinterJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { batchId } = useActiveBatch();

  useEffect(() => {
    setJobs([]);
    setError(null);

    if (!user || user.isGuest) {
      setIsLoading(false);
      return;
    }

    if (!batchId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribePrinterJobs(
      user.role,
      user.id,
      (next) => {
        setJobs(next);
        setIsLoading(false);
      },
      (err) => {
        setError(
          isPermissionDenied(err)
            ? 'Cannot load this batch queue. Use a printer account, match your workshop branch to the batch, and pick a batch that has jobs assigned to you (or unassigned).'
            : getAuthErrorMessage(err)
        );
        setIsLoading(false);
      },
      batchId
    );

    return unsubscribe;
  }, [user, batchId]);

  return { jobs, isLoading, error, batchId };
}
