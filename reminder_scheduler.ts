import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface EmailReminder {
  id?: number;
  email: string;
  firstName: string;
  videoUrl: string;
  reminderType: 'video_reminder_5m' | 'video_reminder_24h' | 'appointment_reminder' | 'checking_in_5m' | 'direct_offer_5m' | 'final_reminder_5m' | 'testimonial_1_5m' | 'testimonial_2_5m' | 'testimonial_3_5m' | 'content_1_5m';
  scheduledFor: string; // ISO timestamp
  status: 'pending' | 'sent' | 'failed';
  createdAt?: string;
  sentAt?: string;
  errorMessage?: string;
}

class ReminderScheduler {
  private dbPath: string;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'funnel.db');
    this.initializeDatabase();
  }

  private initializeDatabase() {
    const db = new Database(this.dbPath);
    
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS email_reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          firstName TEXT NOT NULL,
          videoUrl TEXT NOT NULL,
          reminderType TEXT NOT NULL,
          scheduledFor TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          createdAt TEXT DEFAULT (datetime('now')),
          sentAt TEXT,
          errorMessage TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_email_reminders_scheduled ON email_reminders(scheduledFor, status);
        CREATE INDEX IF NOT EXISTS idx_email_reminders_email ON email_reminders(email);
      `);
      console.log('✅ Email reminders table initialized');
    } catch (error) {
      console.error('❌ Error initializing email reminders table:', error);
    } finally {
      db.close();
    }
  }

  // Schedule a 3-hour reminder email
  scheduleVideoReminder(email: string, firstName: string, videoUrl: string): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      // Check if reminder already exists
      if (this.hasExistingReminder(email, 'video_reminder_5m')) {
        console.log(`⏭️ [REMINDER SCHEDULER] Reminder already exists for ${email}, skipping`);
        db.close();
        return { success: true };
      }
      
      // Calculate 3 hours from now
      const scheduledFor = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('Z', '');
      
      const stmt = db.prepare(`
        INSERT INTO email_reminders (email, firstName, videoUrl, reminderType, scheduledFor)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(email, firstName, videoUrl, 'video_reminder_5m', scheduledFor);
      
      console.log(`📅 [REMINDER SCHEDULER] Scheduled 3-hour video reminder for ${email} at ${scheduledFor}`);
      
      db.close();
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error scheduling reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Schedule appointment reminder (5 minutes after booking)
  scheduleAppointmentReminder(email: string, firstName: string, appointmentDateTime: string): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      // Schedule reminder for 1 hour before appointment
      const appointmentTime = new Date(appointmentDateTime);
      const scheduledTime = new Date(appointmentTime.getTime() - 60 * 60 * 1000); // 1 hour before
      const scheduledFor = scheduledTime.toISOString().replace('T', ' ').replace('Z', '');
      
      const stmt = db.prepare(`
        INSERT INTO email_reminders (email, firstName, videoUrl, reminderType, scheduledFor)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(email, firstName, appointmentDateTime, 'appointment_reminder', scheduledFor);
      
      console.log(`📅 [REMINDER SCHEDULER] Scheduled appointment reminder for ${email} at ${scheduledFor}`);
      
      db.close();
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error scheduling appointment reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Schedule checking-in reminder (21 hours after video reminder)
  scheduleCheckingInReminder(email: string, firstName: string, videoUrl: string): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      // Schedule reminder for 2 days from now
      const now = new Date();
      const scheduledTime = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days later
      const scheduledFor = scheduledTime.toISOString().replace('T', ' ').replace('Z', '');
      
      const stmt = db.prepare(`
        INSERT INTO email_reminders (email, firstName, videoUrl, reminderType, scheduledFor)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(email, firstName, videoUrl, 'checking_in_5m', scheduledFor);
      
      console.log(`📅 [REMINDER SCHEDULER] Scheduled checking-in reminder for ${email} at ${scheduledFor}`);
      
      db.close();
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error scheduling checking-in reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Schedule direct offer reminder (3 days after checking-in)
  scheduleDirectOfferReminder(email: string, firstName: string, videoUrl: string): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      // Schedule reminder for 3 days from now
      const now = new Date();
      const scheduledTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days later
      const scheduledFor = scheduledTime.toISOString().replace('T', ' ').replace('Z', '');
      
      const stmt = db.prepare(`
        INSERT INTO email_reminders (email, firstName, videoUrl, reminderType, scheduledFor)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(email, firstName, videoUrl, 'direct_offer_5m', scheduledFor);
      
      console.log(`📅 [REMINDER SCHEDULER] Scheduled direct offer reminder for ${email} at ${scheduledFor}`);
      
      db.close();
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error scheduling direct offer reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Schedule final reminder (5 days after direct offer)
  scheduleFinalReminder(email: string, firstName: string, videoUrl: string): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      // Schedule reminder for 5 days from now
      const now = new Date();
      const scheduledTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days later
      const scheduledFor = scheduledTime.toISOString().replace('T', ' ').replace('Z', '');
      
      const stmt = db.prepare(`
        INSERT INTO email_reminders (email, firstName, videoUrl, reminderType, scheduledFor)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(email, firstName, videoUrl, 'final_reminder_5m', scheduledFor);
      
      console.log(`📅 [REMINDER SCHEDULER] Scheduled final reminder for ${email} at ${scheduledFor}`);
      
      db.close();
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error scheduling final reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Schedule testimonial 1 reminder (7 days after final reminder)
  scheduleTestimonial1Reminder(email: string, firstName: string, videoUrl: string): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      // Schedule reminder for 7 days from now
      const now = new Date();
      const scheduledTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
      const scheduledFor = scheduledTime.toISOString().replace('T', ' ').replace('Z', '');
      
      const stmt = db.prepare(`
        INSERT INTO email_reminders (email, firstName, videoUrl, reminderType, scheduledFor)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(email, firstName, videoUrl, 'testimonial_1_5m', scheduledFor);
      
      console.log(`📅 [REMINDER SCHEDULER] Scheduled testimonial 1 reminder for ${email} at ${scheduledFor}`);
      
      db.close();
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error scheduling testimonial 1 reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Schedule testimonial 2 reminder (10 days after testimonial 1)
  scheduleTestimonial2Reminder(email: string, firstName: string, videoUrl: string): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      // Schedule reminder for 10 days from now
      const now = new Date();
      const scheduledTime = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days later
      const scheduledFor = scheduledTime.toISOString().replace('T', ' ').replace('Z', '');
      
      const stmt = db.prepare(`
        INSERT INTO email_reminders (email, firstName, videoUrl, reminderType, scheduledFor)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(email, firstName, videoUrl, 'testimonial_2_5m', scheduledFor);
      
      console.log(`📅 [REMINDER SCHEDULER] Scheduled testimonial 2 reminder for ${email} at ${scheduledFor}`);
      
      db.close();
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error scheduling testimonial 2 reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Schedule testimonial 3 reminder (14 days after testimonial 2)
  scheduleTestimonial3Reminder(email: string, firstName: string, videoUrl: string): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      // Schedule reminder for 14 days from now
      const now = new Date();
      const scheduledTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days later
      const scheduledFor = scheduledTime.toISOString().replace('T', ' ').replace('Z', '');
      
      const stmt = db.prepare(`
        INSERT INTO email_reminders (email, firstName, videoUrl, reminderType, scheduledFor)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(email, firstName, videoUrl, 'testimonial_3_5m', scheduledFor);
      
      console.log(`📅 [REMINDER SCHEDULER] Scheduled testimonial 3 reminder for ${email} at ${scheduledFor}`);
      
      db.close();
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error scheduling testimonial 3 reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Schedule content 1 reminder (21 days after testimonial 3)
  scheduleContent1Reminder(email: string, firstName: string, videoUrl: string): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      // Schedule reminder for 21 days from now
      const now = new Date();
      const scheduledTime = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 21 days later
      const scheduledFor = scheduledTime.toISOString().replace('T', ' ').replace('Z', '');
      
      const stmt = db.prepare(`
        INSERT INTO email_reminders (email, firstName, videoUrl, reminderType, scheduledFor)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(email, firstName, videoUrl, 'content_1_5m', scheduledFor);
      
      console.log(`📅 [REMINDER SCHEDULER] Scheduled content 1 reminder for ${email} at ${scheduledFor}`);
      
      db.close();
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error scheduling content 1 reminder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }


  // Get pending reminders that are due to be sent
  getPendingReminders(): EmailReminder[] {
    try {
      const db = new Database(this.dbPath);
      
      const stmt = db.prepare(`
        SELECT * FROM email_reminders 
        WHERE status = 'pending' 
        AND scheduledFor <= datetime('now')
        ORDER BY scheduledFor ASC
        LIMIT 50
      `);
      
      const reminders = stmt.all() as EmailReminder[];
      db.close();
      
      return reminders;
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error getting pending reminders:', error);
      return [];
    }
  }

  // Mark reminder as sent
  markReminderSent(id: number): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      const stmt = db.prepare(`
        UPDATE email_reminders 
        SET status = 'sent', sentAt = datetime('now')
        WHERE id = ?
      `);
      
      stmt.run(id);
      db.close();
      
      console.log(`✅ [REMINDER SCHEDULER] Marked reminder ${id} as sent`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error marking reminder as sent:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Mark reminder as failed
  markReminderFailed(id: number, errorMessage: string): { success: boolean; error?: string } {
    try {
      const db = new Database(this.dbPath);
      
      const stmt = db.prepare(`
        UPDATE email_reminders 
        SET status = 'failed', errorMessage = ?
        WHERE id = ?
      `);
      
      stmt.run(errorMessage, id);
      db.close();
      
      console.log(`❌ [REMINDER SCHEDULER] Marked reminder ${id} as failed: ${errorMessage}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error marking reminder as failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Process all pending reminders
  async processPendingReminders(): Promise<{ processed: number; sent: number; failed: number }> {
    const pendingReminders = this.getPendingReminders();
    let sent = 0;
    let failed = 0;
    
    const timestamp = new Date().toISOString();
    console.log(`🔄 [REMINDER SCHEDULER] ${timestamp} - Processing ${pendingReminders.length} pending reminders`);
    
    if (pendingReminders.length === 0) {
      console.log(`✅ [REMINDER SCHEDULER] ${timestamp} - No pending reminders to process`);
      return { processed: 0, sent: 0, failed: 0 };
    }
    
    for (const reminder of pendingReminders) {
      try {
        let response;
        
        if (reminder.reminderType === 'appointment_reminder') {
          // Send appointment reminder email directly via emailManager
          const { whcEmailManager } = await import('@/lib/email-whc');
          
          const emailResult = await whcEmailManager.sendAppointmentReminder({
            name: reminder.firstName,
            email: reminder.email,
            appointment_date: reminder.videoUrl.split(' ')[0], // Parse from stored datetime
            appointment_time: reminder.videoUrl.split(' ')[1] || '15:00',
          });
          
          if (emailResult.success) {
            this.markReminderSent(reminder.id!);
            sent++;
            console.log(`✅ [REMINDER SCHEDULER] Sent appointment reminder to ${reminder.email}`);
          } else {
            this.markReminderFailed(reminder.id!, emailResult.error || 'Unknown error');
            failed++;
            console.error(`❌ [REMINDER SCHEDULER] Failed to send appointment reminder to ${reminder.email}: ${emailResult.error}`);
          }
          continue;
        }

        if (reminder.reminderType === 'checking_in_5m') {
          // Send checking-in email directly via emailManager
          const { whcEmailManager } = await import('@/lib/email-whc');
          
          const emailResult = await whcEmailManager.sendCheckingInEmail(reminder.email, reminder.firstName, reminder.videoUrl);
          
          if (emailResult.success) {
            this.markReminderSent(reminder.id!);
            sent++;
            console.log(`✅ [REMINDER SCHEDULER] Sent checking-in email to ${reminder.email}`);
            
            // Schedule next reminder in the chain
            const directOfferResult = this.scheduleDirectOfferReminder(reminder.email, reminder.firstName, reminder.videoUrl);
            console.log(`📅 [REMINDER SCHEDULER] Scheduled direct offer reminder:`, directOfferResult);
          } else {
            this.markReminderFailed(reminder.id!, emailResult.error || 'Unknown error');
            failed++;
            console.error(`❌ [REMINDER SCHEDULER] Failed to send checking-in email to ${reminder.email}: ${emailResult.error}`);
          }
          continue;
        }

        if (reminder.reminderType === 'direct_offer_5m') {
          // Send direct offer email directly via emailManager
          const { whcEmailManager } = await import('@/lib/email-whc');
          
          const emailResult = await whcEmailManager.sendDirectOfferEmail(reminder.email, reminder.firstName, reminder.videoUrl);
          
          if (emailResult.success) {
            this.markReminderSent(reminder.id!);
            sent++;
            console.log(`✅ [REMINDER SCHEDULER] Sent direct offer email to ${reminder.email}`);
            
            // Schedule next reminder in the chain
            const finalReminderResult = this.scheduleFinalReminder(reminder.email, reminder.firstName, reminder.videoUrl);
            console.log(`📅 [REMINDER SCHEDULER] Scheduled final reminder:`, finalReminderResult);
          } else {
            this.markReminderFailed(reminder.id!, emailResult.error || 'Unknown error');
            failed++;
            console.error(`❌ [REMINDER SCHEDULER] Failed to send direct offer email to ${reminder.email}: ${emailResult.error}`);
          }
          continue;
        }

        if (reminder.reminderType === 'final_reminder_5m') {
          // Send final reminder email directly via emailManager
          const { whcEmailManager } = await import('@/lib/email-whc');
          
          const emailResult = await whcEmailManager.sendFinalReminderEmail(reminder.email, reminder.firstName, reminder.videoUrl);
          
          if (emailResult.success) {
            this.markReminderSent(reminder.id!);
            sent++;
            console.log(`✅ [REMINDER SCHEDULER] Sent final reminder email to ${reminder.email}`);
            
            // Schedule next reminder in the chain
            const testimonial1Result = this.scheduleTestimonial1Reminder(reminder.email, reminder.firstName, reminder.videoUrl);
            console.log(`📅 [REMINDER SCHEDULER] Scheduled testimonial 1 reminder:`, testimonial1Result);
          } else {
            this.markReminderFailed(reminder.id!, emailResult.error || 'Unknown error');
            failed++;
            console.error(`❌ [REMINDER SCHEDULER] Failed to send final reminder email to ${reminder.email}: ${emailResult.error}`);
          }
          continue;
        }

        if (reminder.reminderType === 'testimonial_1_5m') {
          // Send testimonial 1 email directly via emailManager
          const { whcEmailManager } = await import('@/lib/email-whc');
          
          const emailResult = await whcEmailManager.sendTestimonial1Email(reminder.email, reminder.firstName, reminder.videoUrl);
          
          if (emailResult.success) {
            this.markReminderSent(reminder.id!);
            sent++;
            console.log(`✅ [REMINDER SCHEDULER] Sent testimonial 1 email to ${reminder.email}`);
            
            // Schedule next reminder in the chain
            const testimonial2Result = this.scheduleTestimonial2Reminder(reminder.email, reminder.firstName, reminder.videoUrl);
            console.log(`📅 [REMINDER SCHEDULER] Scheduled testimonial 2 reminder:`, testimonial2Result);
          } else {
            this.markReminderFailed(reminder.id!, emailResult.error || 'Unknown error');
            failed++;
            console.error(`❌ [REMINDER SCHEDULER] Failed to send testimonial 1 email to ${reminder.email}: ${emailResult.error}`);
          }
          continue;
        }

        if (reminder.reminderType === 'testimonial_2_5m') {
          // Send testimonial 2 email directly via emailManager
          const { whcEmailManager } = await import('@/lib/email-whc');
          
          const emailResult = await whcEmailManager.sendTestimonial2Email(reminder.email, reminder.firstName, reminder.videoUrl);
          
          if (emailResult.success) {
            this.markReminderSent(reminder.id!);
            sent++;
            console.log(`✅ [REMINDER SCHEDULER] Sent testimonial 2 email to ${reminder.email}`);
            
            // Schedule next reminder in the chain
            const testimonial3Result = this.scheduleTestimonial3Reminder(reminder.email, reminder.firstName, reminder.videoUrl);
            console.log(`📅 [REMINDER SCHEDULER] Scheduled testimonial 3 reminder:`, testimonial3Result);
          } else {
            this.markReminderFailed(reminder.id!, emailResult.error || 'Unknown error');
            failed++;
            console.error(`❌ [REMINDER SCHEDULER] Failed to send testimonial 2 email to ${reminder.email}: ${emailResult.error}`);
          }
          continue;
        }

        if (reminder.reminderType === 'testimonial_3_5m') {
          // Send testimonial 3 email directly via emailManager
          const { whcEmailManager } = await import('@/lib/email-whc');
          
          const emailResult = await whcEmailManager.sendTestimonial3Email(reminder.email, reminder.firstName, reminder.videoUrl);
          
          if (emailResult.success) {
            this.markReminderSent(reminder.id!);
            sent++;
            console.log(`✅ [REMINDER SCHEDULER] Sent testimonial 3 email to ${reminder.email}`);
            
            // Automatic scheduling disabled to prevent email spam
            // const content1Result = this.scheduleContent1Reminder(reminder.email, reminder.firstName, reminder.videoUrl);
            // console.log(`📅 [REMINDER SCHEDULER] Scheduled content 1 reminder:`, content1Result);
          } else {
            this.markReminderFailed(reminder.id!, emailResult.error || 'Unknown error');
            failed++;
            console.error(`❌ [REMINDER SCHEDULER] Failed to send testimonial 3 email to ${reminder.email}: ${emailResult.error}`);
          }
          continue;
        }

        if (reminder.reminderType === 'content_1_5m') {
          // Send content 1 email directly via emailManager
          const { whcEmailManager } = await import('@/lib/email-whc');
          
          const emailResult = await whcEmailManager.sendContent1Email(reminder.email, reminder.firstName, reminder.videoUrl);
          
          if (emailResult.success) {
            this.markReminderSent(reminder.id!);
            sent++;
            console.log(`✅ [REMINDER SCHEDULER] Sent content 1 email to ${reminder.email}`);
            
          } else {
            this.markReminderFailed(reminder.id!, emailResult.error || 'Unknown error');
            failed++;
            console.error(`❌ [REMINDER SCHEDULER] Failed to send content 1 email to ${reminder.email}: ${emailResult.error}`);
          }
          continue;
        }

        
        // Send video reminder email via API call (existing logic)
        response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://annaraight.com'}/api/reminder-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: reminder.email,
            firstName: reminder.firstName,
            videoUrl: reminder.videoUrl
          }),
        });

        const result = await response.json();

        if (result.success) {
          this.markReminderSent(reminder.id!);
          sent++;
          console.log(`✅ [REMINDER SCHEDULER] Sent reminder to ${reminder.email}`);
          
          // Schedule next reminder in the chain for video reminder
          if (reminder.reminderType === 'video_reminder_5m') {
            const checkingInResult = this.scheduleCheckingInReminder(reminder.email, reminder.firstName, reminder.videoUrl);
            console.log(`📅 [REMINDER SCHEDULER] Scheduled checking-in reminder:`, checkingInResult);
          }
        } else {
          this.markReminderFailed(reminder.id!, result.error || 'Unknown error');
          failed++;
          console.error(`❌ [REMINDER SCHEDULER] Failed to send reminder to ${reminder.email}: ${result.error}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.markReminderFailed(reminder.id!, errorMessage);
        failed++;
        console.error(`❌ [REMINDER SCHEDULER] Error processing reminder for ${reminder.email}:`, error);
      }
    }
    
    console.log(`📊 [REMINDER SCHEDULER] Processed: ${pendingReminders.length}, Sent: ${sent}, Failed: ${failed}`);
    
    return {
      processed: pendingReminders.length,
      sent,
      failed
    };
  }

  // Check if user already has a pending reminder of this type
  hasExistingReminder(email: string, reminderType: string): boolean {
    try {
      const db = new Database(this.dbPath);
      
      const stmt = db.prepare(`
        SELECT COUNT(*) as count FROM email_reminders 
        WHERE email = ? AND reminderType = ? AND status = 'pending'
      `);
      
      const result = stmt.get(email, reminderType) as { count: number };
      db.close();
      
      return result.count > 0;
      
    } catch (error) {
      console.error('❌ [REMINDER SCHEDULER] Error checking existing reminder:', error);
      return false;
    }
  }
}

// Export singleton instance
export const reminderScheduler = new ReminderScheduler();