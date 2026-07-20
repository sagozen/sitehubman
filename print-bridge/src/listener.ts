import admin from 'firebase-admin';
import { config } from './config';
import { logger } from './dispatcher';

/**
 * Real-time listener for printer jobs in Firebase.
 */
export function startJobListener(onJobReceived: (job: any) => void) {
  logger(`Starting job listener for Branch: ${config.workshop.branchId}`, 'info');

  try {
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(config.firebase.serviceAccountPath),
    });

    const db = admin.firestore();

    // Listen for jobs in the specific branch's queue
    // We filter by branchId and stage to ensure we only get actionable jobs
    const query = db.collection('printer_jobs')
      .where('branchId', '==', config.workshop.branchId)
      .where('stage', 'in', ['received', 'printing', 'nfc_encoding', 'reprint']);

    const unsubscribe = query.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const jobData = change.doc.data();
          if (jobData) {
            logger(`New job detected: ${change.doc.id} (Order: ${jobData.orderId})`, 'info');
            onJobReceived({ id: change.doc.id, ...jobData });
          }
        }
        // Note: We handle updates/deletes if needed for complex state transitions
      });
    }, (error) => {
      logger(`Firestore Listener Error: ${error.message}`, 'error');
    });

    return unsubscribe;
  } catch (err: any) {
    logger(`Failed to initialize Firestore listener: ${err.message}`, 'error');
    throw err;
  }
}

export async function updateJobStatus(jobId: string, newStage: string) {
  const db = admin.firestore();
  await db.collection('printer_jobs').doc(jobId).update({
    stage: newStage,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  logger(`Job ${jobId} updated to stage: ${newStage}`, 'debug');
}
