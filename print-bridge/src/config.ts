import 'dotenv/config';

/**
 * Configuration schema for the Print Bridge.
 * All values are loaded from the .env file.
 */
export const config = {
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountPath: process.env.SERVICE_ACCOUNT_PATH,
  },
  workshop: {
    branchId: process.env.BRANCH_ID,
  },
  printer: {
    ip: process.env.PRINTER_IP,
    port: 9100, // Standard RAW printing port
    mode: (process.env.PRINT_MODE || 'RAW') as 'RAW' | 'IMAGE',
  },
  logging: {
    level: (process.env.LOG_LEVEL || 'info').toLowerCase() as 'debug' | 'info' | 'error',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'SERVICE_ACCOUNT_PATH',
  'BRANCH_ID',
  'PRINTER_IP',
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  throw new Error(
    `❌ Missing required environment variables in .env: ${missingVars.join(', ')}
` +
    `Please follow the template in .env.example`
  );
}
