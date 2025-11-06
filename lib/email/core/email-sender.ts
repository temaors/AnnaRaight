/**
 * Email Sender - Reusable SMTP Transport
 * Can be used in any Node.js project
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EmailConfig, EmailOptions, EmailResult } from './types';

export class EmailSender {
  private transporter: Transporter;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = this.createTransporter();
  }

  /**
   * Create nodemailer transporter with configuration
   */
  private createTransporter(): Transporter {
    console.log('📧 [EMAIL SENDER] Initializing with config:', {
      host: this.config.smtpServer,
      port: this.config.smtpPort,
      secure: this.config.useSSL,
      user: this.config.senderEmail,
    });

    return nodemailer.createTransport({
      host: this.config.smtpServer,
      port: this.config.smtpPort,
      secure: this.config.useSSL,
      auth: {
        user: this.config.senderEmail,
        pass: this.config.senderPassword,
      },
      connectionTimeout: 60000,
      greetingTimeout: 60000,
      socketTimeout: 60000,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1',
        ciphers: 'ALL',
      },
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development',
    });
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<EmailResult> {
    try {
      await this.transporter.verify();
      console.log('✅ [EMAIL SENDER] Connection verified');
      return { success: true };
    } catch (error) {
      console.error('❌ [EMAIL SENDER] Connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send email
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      console.log(`📤 [EMAIL SENDER] Sending to: ${options.to}`);

      const result = await this.transporter.sendMail(options);

      console.log(`✅ [EMAIL SENDER] Sent successfully:`, {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('❌ [EMAIL SENDER] Failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get sender config
   */
  getConfig(): EmailConfig {
    return { ...this.config };
  }
}
