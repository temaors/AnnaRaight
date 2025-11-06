/**
 * Email Manager - Main orchestration class
 * Integrates all email templates and sending logic
 */

import { EmailSender } from './core/email-sender';
import { getEmailConfig } from './core/config';
import { EmailResult, AppointmentData, InvoiceData } from './core/types';
import { emailPreferencesManager } from '@/lib/email-preferences';

// Template imports
import {
  generateWelcomeEmail,
  getWelcomeSubject,
} from './templates/welcome-template';

import {
  generateVideoReminderEmail,
  generateCheckingInEmail,
  generateDirectOfferEmail,
  generateFinalReminderEmail,
  getVideoReminderSubject,
  getCheckingInSubject,
  getDirectOfferSubject,
  getFinalReminderSubject,
} from './templates/reminder-templates';

import {
  generateTestimonial1Email,
  generateTestimonial2Email,
  generateTestimonial3Email,
  getTestimonial1Subject,
  getTestimonial2Subject,
  getTestimonial3Subject,
} from './templates/testimonial-templates';

import {
  generateContent1Email,
  generateContent2Email,
  getContent1Subject,
  getContent2Subject,
} from './templates/content-templates';

import {
  generateAppointmentConfirmationEmail,
  generateAppointmentReminderEmail,
  getAppointmentConfirmationSubject,
  getAppointmentReminderSubject,
} from './templates/appointment-template';

import {
  generateAdminNotificationEmail,
  generateTestEmail,
  generateSimpleTestEmail,
} from './templates/admin-templates';

import {
  generateVideoEmail,
} from './templates/video-template';

import {
  generateInvoiceEmail,
} from './templates/invoice-template';

/**
 * Main Email Manager Class
 * Provides high-level email sending methods
 */
export class EmailManager {
  private sender: EmailSender;

  constructor() {
    const config = getEmailConfig();
    this.sender = new EmailSender(config);
  }

  /**
   * Test SMTP connection
   */
  async testConnection(): Promise<EmailResult> {
    return this.sender.testConnection();
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      // Check preferences
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping welcome email to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [WELCOME EMAIL] Sending to ${email}`);

      const { html, text } = generateWelcomeEmail({ email, firstName, videoUrl });
      const subject = getWelcomeSubject(firstName);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ [WELCOME EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send video reminder email
   */
  async sendVideoReminderEmail(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping video reminder to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [VIDEO REMINDER] Sending to ${email}`);

      const { html, text } = generateVideoReminderEmail({ email, firstName, videoUrl });
      const subject = getVideoReminderSubject(firstName);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ [VIDEO REMINDER] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send checking-in email
   */
  async sendCheckingInEmail(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping checking-in email to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [CHECKING-IN EMAIL] Sending to ${email}`);

      // Extract scheduling URL from video URL
      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      const { html, text } = generateCheckingInEmail({ email, firstName, videoUrl, schedulingUrl });
      const subject = getCheckingInSubject(firstName);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ [CHECKING-IN EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send direct offer email
   */
  async sendDirectOfferEmail(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping direct offer email to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [DIRECT OFFER EMAIL] Sending to ${email}`);

      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      const { html, text } = generateDirectOfferEmail({ email, firstName, videoUrl, schedulingUrl });
      const subject = getDirectOfferSubject(firstName);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ [DIRECT OFFER EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send final reminder email
   */
  async sendFinalReminderEmail(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping final reminder to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [FINAL REMINDER EMAIL] Sending to ${email}`);

      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      const { html, text, attachments } = generateFinalReminderEmail({
        email,
        firstName,
        videoUrl,
        schedulingUrl,
      });
      const subject = getFinalReminderSubject(firstName);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
        attachments,
      });
    } catch (error) {
      console.error('❌ [FINAL REMINDER EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send testimonial 1 email
   */
  async sendTestimonial1Email(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping testimonial 1 to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [TESTIMONIAL 1 EMAIL] Sending to ${email}`);

      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      const { html, text, attachments } = generateTestimonial1Email({
        email,
        firstName,
        videoUrl,
        schedulingUrl,
      });
      const subject = getTestimonial1Subject(firstName);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
        attachments,
      });
    } catch (error) {
      console.error('❌ [TESTIMONIAL 1 EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send testimonial 2 email
   */
  async sendTestimonial2Email(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping testimonial 2 to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [TESTIMONIAL 2 EMAIL] Sending to ${email}`);

      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      const { html, text, attachments } = generateTestimonial2Email({
        email,
        firstName,
        videoUrl,
        schedulingUrl,
      });
      const subject = getTestimonial2Subject(firstName);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
        attachments,
      });
    } catch (error) {
      console.error('❌ [TESTIMONIAL 2 EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send testimonial 3 email
   */
  async sendTestimonial3Email(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping testimonial 3 to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [TESTIMONIAL 3 EMAIL] Sending to ${email}`);

      const schedulingUrl = videoUrl.replace('/video/', '/schedule/').replace('/v/watch', '/schedule/');

      const { html, text, attachments } = generateTestimonial3Email({
        email,
        firstName,
        videoUrl,
        schedulingUrl,
      });
      const subject = getTestimonial3Subject(firstName);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
        attachments,
      });
    } catch (error) {
      console.error('❌ [TESTIMONIAL 3 EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send content 1 email
   */
  async sendContent1Email(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping content 1 to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [CONTENT 1 EMAIL] Sending to ${email}`);

      const { html, text } = generateContent1Email({ email, firstName, videoUrl });
      const subject = getContent1Subject(firstName);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ [CONTENT 1 EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send content 2 email
   */
  async sendContent2Email(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping content 2 to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [CONTENT 2 EMAIL] Sending to ${email}`);

      const { html, text } = generateContent2Email({ email, firstName, videoUrl });
      const subject = getContent2Subject(firstName);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ [CONTENT 2 EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send appointment confirmation email
   */
  async sendAppointmentConfirmationEmail(data: AppointmentData): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(data.email, 'transactional');
      if (!canSend) {
        console.log(`📧 Skipping appointment confirmation to ${data.email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [APPOINTMENT CONFIRMATION] Sending to ${data.email}`);

      const { html, text } = generateAppointmentConfirmationEmail(data);
      const subject = getAppointmentConfirmationSubject(data);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: data.email,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ [APPOINTMENT CONFIRMATION] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send appointment reminder email
   */
  async sendAppointmentReminderEmail(data: AppointmentData): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(data.email, 'transactional');
      if (!canSend) {
        console.log(`📧 Skipping appointment reminder to ${data.email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [APPOINTMENT REMINDER] Sending to ${data.email}`);

      const { html, text } = generateAppointmentReminderEmail(data);
      const subject = getAppointmentReminderSubject(data);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: data.email,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ [APPOINTMENT REMINDER] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send admin notification email
   */
  async sendAdminNotification(appointmentData: AppointmentData): Promise<EmailResult> {
    try {
      console.log(`📧 [ADMIN NOTIFICATION] Sending admin notification`);

      const { html, subject } = generateAdminNotificationEmail(appointmentData);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: this.sender.getConfig().adminEmail,
        subject,
        html,
      });
    } catch (error) {
      console.error('❌ [ADMIN NOTIFICATION] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send video email
   */
  async sendVideoEmail(
    email: string,
    firstName: string,
    videoUrl: string
  ): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(email, 'marketing');
      if (!canSend) {
        console.log(`📧 Skipping video email to ${email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [VIDEO EMAIL] Sending to ${email}`);

      const { html, text, subject } = generateVideoEmail(email, firstName, videoUrl);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: email,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ [VIDEO EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(invoiceData: InvoiceData): Promise<EmailResult> {
    try {
      const canSend = await emailPreferencesManager.canSendEmail(invoiceData.email, 'transactional');
      if (!canSend) {
        console.log(`📧 Skipping invoice email to ${invoiceData.email} - user unsubscribed`);
        return { success: true };
      }

      console.log(`📧 [INVOICE EMAIL] Sending to ${invoiceData.email}`);

      const { html, subject } = generateInvoiceEmail(invoiceData);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: invoiceData.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('❌ [INVOICE EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send test email to admin
   */
  async sendTestEmail(): Promise<EmailResult> {
    try {
      const adminEmail = this.sender.getConfig().adminEmail;
      console.log(`📧 [TEST EMAIL] Sending to admin ${adminEmail}`);

      const { html, subject } = generateTestEmail(adminEmail);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: adminEmail,
        subject,
        html,
      });
    } catch (error) {
      console.error('❌ [TEST EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send simple test email
   */
  async sendSimpleTestEmail(testEmail: string): Promise<EmailResult> {
    try {
      console.log(`📧 [SIMPLE TEST EMAIL] Sending to ${testEmail}`);

      const { html, text, subject } = generateSimpleTestEmail(testEmail);

      return await this.sender.send({
        from: this.sender.getConfig().senderEmail,
        to: testEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('❌ [SIMPLE TEST EMAIL] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Export singleton instance
export const emailManager = new EmailManager();
