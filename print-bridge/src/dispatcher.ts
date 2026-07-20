import * as net from 'net';
import { config } from './config';

/**
 * Logger utility for the Print Bridge.
 */
export function logger(message: string, level: 'debug' | 'info' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const isAllowed = 
    config.logging.level === 'debug' || 
    (config.logging.level === 'info' && level !== 'debug') ||
    (config.logging.level === 'error' && level === 'error');

  if (isAllowed) {
    const icon = level === 'error' ? '❌' : level === 'debug' ? '🔍' : '✅';
    console.log(`[${timestamp}] ${icon} ${message.toUpperCase()}`);
  }
}

/**
 * Sends raw data to a network printer via TCP/IP.
 */
export async function sendToPrinter(payload: string | Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    const target = `${config.printer.ip}:${config.printer.port}`;

    logger(`Connecting to printer at ${target}...`, 'debug');

    client.connect(config.printer.port, config.printer.ip, () => {
      logger(`Connected to ${target}. Sending payload...`, 'debug');
      client.write(payload, () => {
        logger(`Payload sent successfully to ${target}.`, 'info');
        client.end();
        resolve();
      });
    });

    client.on('error', (err) => {
      logger(`Printer Connection Error: ${err.message}`, 'error');
      client.destroy();
      reject(err);
    });

    client.on('close', () => {
      logger(`Socket closed for ${target}.`, 'debug');
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!client.destroyed) {
        client.destroy();
        reject(new Error('Printer connection timed out.'));
      }
    }, 10000);
  });
}
