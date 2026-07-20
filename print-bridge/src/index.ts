import { startJobListener, updateJobStatus } from './listener';
import { sendToPrinter, logger } from './dispatcher';
import { config } from './config';

async function handleNewJob(job: any) {
  try {
    logger(`Processing Job #${job.id}...`, 'info');

    // 1. Determine Payload
    // In a real production environment, this would fetch the actual 
    // print-ready image/file from Firebase Storage.
    // For this MVP/Bridge, we send a simple text command.
    
    let payload: string | Buffer = `PRINT JOB ID: ${job.id}
ORDER ID: ${job.orderId}
STAGE: ${job.stage}
`;
    
    if (job.payload) {
      payload = job.payload; // If the job already contains a pre-formatted string
    }

    // 2. Send to Printer
    await sendToPrinter(payload);

    // 3. Update Status in Cloud
    // We move it to 'printing' so the mobile app knows it's in progress
    await updateJobStatus(job.id, 'printing');
    
    logger(`✅ Job #${job.id} successfully dispatched to printer.`, 'info');

  } catch (err: any) {
    logger(`❌ Failed to process job #${job.id}: ${err.message}`, 'error');
  }
}

async function main() {
  logger('🚀 SiteHubMan Print Bridge is starting...', 'info');
  logger(`Configuration: Branch=${config.workshop.branchId}, Printer=${config.printer.ip}`, 'debug');

  try {
    const unsubscribe = startJobListener(handleNewJob);
    
    logger('📡 Listening for new jobs in the cloud. Press Ctrl+C to stop.', 'info');

    // Handle process termination gracefully
    process.on('SIGINT', () => {
      logger('Stopping bridge...', 'info');
      unsubscribe();
      process.exit(0);
    });

  } catch (err: any) {
    logger(`Fatal error during startup: ${err.message}`, 'error');
    process.exit(1);
  }
}

main();
