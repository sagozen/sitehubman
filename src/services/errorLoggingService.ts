/**
 * Enterprise Telemetry & Error Logging Service
 * Automatically captures JavaScript runtime exceptions, React ErrorBoundary crashes,
 * and unhandled promise rejections. Logs to Firestore `error_logs` for scraping & fixing.
 */
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db, auth } from '@/src/services/firebaseClient';
import { firebaseCollections } from '@/src/constants/collections';

export interface AppErrorPayload {
  errorName: string;
  errorMessage: string;
  stackTrace?: string;
  componentStack?: string;
  route?: string;
  platform: typeof Platform.OS;
  userAgent?: string;
  userId?: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

// In-memory queue to prevent duplicate spamming within 5 seconds
const recentErrorsSet = new Set<string>();

/**
 * Primary error logger call — records a structured error payload silently to Firestore.
 */
export async function recordAppError(
  error: unknown,
  context?: { componentStack?: string | null; route?: string; extra?: Record<string, unknown> }
): Promise<string | null> {
  try {
    const errObj = error instanceof Error ? error : new Error(String(error));
    const errorKey = `${errObj.name}:${errObj.message}`;

    // Prevent duplicate error report floods within short window
    if (recentErrorsSet.has(errorKey)) {
      return null;
    }
    recentErrorsSet.add(errorKey);
    setTimeout(() => recentErrorsSet.delete(errorKey), 5000);

    const currentUser = auth?.currentUser;

    const payload: Omit<AppErrorPayload, 'timestamp'> & { createdAt: unknown } = {
      errorName: errObj.name || 'UnhandledException',
      errorMessage: errObj.message || 'Unknown runtime error',
      stackTrace: errObj.stack ? errObj.stack.slice(0, 1500) : undefined,
      componentStack: context?.componentStack ? context.componentStack.slice(0, 1500) : undefined,
      route: context?.route || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      platform: Platform.OS,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      userId: currentUser?.uid || 'guest',
      context: context?.extra,
      createdAt: serverTimestamp(),
    };

    console.warn('[Telemetry Logger] Logging error:', payload.errorMessage);

    const docRef = await addDoc(collection(db, firebaseCollections.errorLogs), payload);
    return docRef.id;
  } catch (loggingErr) {
    // Failure in error logger should never crash the app
    console.error('[Telemetry Logger Failure]', loggingErr);
    return null;
  }
}

/**
 * Admin scraper function — retrieves recent error logs for technical review & hotfixes.
 */
export async function fetchRecentErrorLogs(maxResults = 50) {
  try {
    const q = query(
      collection(db, firebaseCollections.errorLogs),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (err) {
    console.error('[Telemetry Logger] Error fetching logs:', err);
    return [];
  }
}

/**
 * Initializes global uncaught error listeners for Web and Native environments.
 */
export function setupGlobalUnhandledErrorListeners() {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      if (event.error) {
        void recordAppError(event.error, { extra: { source: 'window.onerror' } });
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      void recordAppError(event.reason || 'Unhandled Promise Rejection', {
        extra: { source: 'window.unhandledrejection' },
      });
    });
  }
}
