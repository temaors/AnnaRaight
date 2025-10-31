import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export interface EmailPreferences {
  email: string;
  marketing_emails: boolean;
  appointment_emails: boolean;
  reminder_emails: boolean;
  newsletter: boolean;
  sms_marketing: boolean;
  sms_appointments: boolean;
  sms_reminders: boolean;
  unsubscribed_all: boolean;
}

export interface SMSPreferences {
  email: string;
  sms_marketing: boolean;
  sms_appointments: boolean;
  sms_reminders: boolean;
  unsubscribed_all: boolean;
}

// Database row interfaces
interface EmailPreferencesRow {
  email: string;
  marketing_emails: number;
  appointment_emails: number;
  reminder_emails: number;
  newsletter: number;
  sms_marketing: number;
  sms_appointments: number;
  sms_reminders: number;
  unsubscribed_all: number;
}

interface LeadRow {
  email: string;
  name: string;
  created_at: string;
  funnel_step?: string;
  is_subscribed?: number;
}

interface AppointmentRow {
  email: string;
  name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
}

interface NewsletterRow {
  email: string;
  name: string;
  created_at: string;
  newsletter_subscribed: number;
  unsubscribed_all: number;
}

export class EmailPreferencesManager {
  private getDatabase() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return new Database(path.join(dataDir, 'funnel.db'));
  }

  // Generate secure unsubscribe token
  generateUnsubscribeToken(email: string): string {
    const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-in-production';
    return crypto.createHmac('sha256', secret).update(email).digest('hex').substring(0, 16);
  }

  // Get user preferences
  async getPreferences(email: string): Promise<EmailPreferences | null> {
    const db = this.getDatabase();
    try {
      // Check if email_preferences table exists, create if not
      const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='email_preferences'`).all();
      
      if (tables.length === 0) {
        // Create the table
        db.prepare(`
          CREATE TABLE email_preferences (
            email TEXT PRIMARY KEY,
            marketing_emails INTEGER DEFAULT 1,
            appointment_emails INTEGER DEFAULT 1,
            reminder_emails INTEGER DEFAULT 1,
            newsletter INTEGER DEFAULT 1,
            sms_marketing INTEGER DEFAULT 0,
            sms_appointments INTEGER DEFAULT 0,
            sms_reminders INTEGER DEFAULT 0,
            unsubscribed_all INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
      }

      let preferences = db.prepare(`
        SELECT * FROM email_preferences WHERE email = ?
      `).get(email) as EmailPreferencesRow | undefined;

      if (!preferences) {
        // Create default preferences
        db.prepare(`
          INSERT INTO email_preferences (email) VALUES (?)
        `).run(email);
        
        preferences = db.prepare(`
          SELECT * FROM email_preferences WHERE email = ?
        `).get(email) as EmailPreferencesRow | undefined;
      }

      if (!preferences) {
        return null;
      }

      return {
        email: preferences.email,
        marketing_emails: !!preferences.marketing_emails,
        appointment_emails: !!preferences.appointment_emails,
        reminder_emails: !!preferences.reminder_emails,
        newsletter: !!preferences.newsletter,
        sms_marketing: !!preferences.sms_marketing,
        sms_appointments: !!preferences.sms_appointments,
        sms_reminders: !!preferences.sms_reminders,
        unsubscribed_all: !!preferences.unsubscribed_all
      };
    } finally {
      db.close();
    }
  }

  // Check if user can receive specific email type
  async canSendEmail(email: string, emailType: 'marketing' | 'appointment' | 'reminder' | 'newsletter'): Promise<boolean> {
    const preferences = await this.getPreferences(email);
    if (!preferences) return true; // Default to allowing if no preferences found

    if (preferences.unsubscribed_all) return false;

    switch (emailType) {
      case 'marketing':
        return preferences.marketing_emails;
      case 'appointment':
        return preferences.appointment_emails;
      case 'reminder':
        return preferences.reminder_emails;
      case 'newsletter':
        return preferences.newsletter;
      default:
        return false;
    }
  }

  // Check if user can receive SMS
  async canSendSMS(email: string, smsType: 'marketing' | 'appointment' | 'reminder'): Promise<boolean> {
    const preferences = await this.getPreferences(email);
    if (!preferences) return true; // Default to allowing if no preferences found

    if (preferences.unsubscribed_all) return false;

    switch (smsType) {
      case 'marketing':
        return preferences.sms_marketing;
      case 'appointment':
        return preferences.sms_appointments;
      case 'reminder':
        return preferences.sms_reminders;
      default:
        return false;
    }
  }

  // Generate unsubscribe URLs
  generateUnsubscribeUrl(email: string, type: 'all' | 'preferences' = 'all'): string {
    const token = this.generateUnsubscribeToken(email);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://annaraight.com';
    
    if (type === 'all') {
      return `${baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
    } else {
      return `${baseUrl}/preferences?email=${encodeURIComponent(email)}&token=${token}`;
    }
  }

  // Add unsubscribe footer to email content
  addUnsubscribeFooter(htmlContent: string, email: string): string {
    const unsubscribeUrl = this.generateUnsubscribeUrl(email, 'all');
    const preferencesUrl = this.generateUnsubscribeUrl(email, 'preferences');

    const footer = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
        <p>You received this email because you subscribed to our notifications.</p>
        <p>
          <a href="${preferencesUrl}" style="color: #667eea; text-decoration: none;">Manage subscription</a> | 
          <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">Unsubscribe from all emails</a>
        </p>
        <p style="margin-top: 15px;">
          © 2025 AstroForYou. All rights reserved.<br>
          If you have any questions, contact us.
        </p>
      </div>
    `;

    // Insert footer before closing body tag, or append if no body tag found
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', footer + '</body>');
    } else {
      return htmlContent + footer;
    }
  }

  // Get user lists for admin
  async getUserLists() {
    const db = this.getDatabase();
    try {
      // Check if tables exist
      const tables = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table'
      `).all();
      
      console.log('Available tables:', tables);

      let vslOptIns = [];
      let bookedCalls = [];
      let newsletter = [];

      // Try to get leads if table exists
      const hasLeads = tables.some(t => t.name === 'leads');
      if (hasLeads) {
        try {
          vslOptIns = db.prepare(`SELECT * FROM leads ORDER BY created_at DESC`).all();
          newsletter = [...vslOptIns]; // Same data for now
        } catch (error) {
          console.log('Error getting leads:', error.message);
        }
      }

      // Try to get appointments if table exists
      const hasAppointments = tables.some(t => t.name === 'appointments');
      if (hasAppointments) {
        try {
          bookedCalls = db.prepare(`SELECT * FROM appointments ORDER BY created_at DESC`).all();
        } catch (error) {
          console.log('Error getting appointments:', error.message);
        }
      }

      return {
        vslOptIns,
        bookedCalls,
        newsletter,
        tables: tables.map(t => t.name)
      };
    } finally {
      db.close();
    }
  }
}

// Export singleton instance
export const emailPreferencesManager = new EmailPreferencesManager();