/**
 * Email Configuration
 * Environment-based email settings
 */

import { EmailConfig } from './types';

export function getEmailConfig(): EmailConfig {
  return {
    smtpServer: process.env.WHC_SMTP_SERVER || 'mail.yourdomain.com',
    smtpPort: parseInt(process.env.WHC_SMTP_PORT || '465'),
    senderEmail: process.env.WHC_SENDER_EMAIL || 'noreply@yourdomain.com',
    senderPassword: process.env.WHC_SENDER_PASSWORD || '',
    useTLS: process.env.WHC_USE_TLS === 'true',
    useSSL: process.env.WHC_USE_SSL === 'true',
    adminEmail: process.env.WHC_ADMIN_EMAIL || 'admin@yourdomain.com',
  };
}

export const DEFAULT_SENDER_NAME = 'Anna Raight';
export const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://annaraight.com';
