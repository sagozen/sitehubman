import { config } from './config';
import { logger } from './dispatcher';
import admin from 'firebase-admin';

/**
 * SIMULATION TOOL
 * This script creates a fake job in your Firebase database 
 * so you can test if your Print Bridge picks it up and 
 * attempts to send it to the printer.
 */

async function createTestJob() {
  logger('Creating a simulated test job...', 'info');

  try {
    // Initialize Firebase Admin for the simulation
    admin.initializeApp({
      credential: admin.credential.cert(config.firebase.serviceAccountPath),
    });

    const db = admin.firestore();
    const testJobId = `test_job_${Date.now()}`;

    const testJob = {
      id: testJobId,
      orderId: 'TEST-ORDER-123',
      branchId: config.workshop.branchId,
      stage: 'received',
      payload: '--- TEST PRINT JOB ---
ID: ' + testJobId + '
ORDER: TEST-ORDER-123
-----------------------',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('printer_jobs').doc(testJobId).set(testJob);

    logger(`✅ SUCCESS: Test job created in Firestore: ${testJobId}`, 'info');
    logger(`Check your Print Bridge terminal to see if it picks up this job!`, 'info');

  } catch (err: any) {
    logger(`❌ FAILED to create test job: ${err.message}`, 'error');
  }
}

createTestJob();
