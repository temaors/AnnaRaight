import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { smsService } from '@/lib/sms';

export async function POST() {
  try {
    console.log('🔄 Processing appointment reminders...');

    // Dynamic import to avoid edge runtime issues
    const { emailManager } = await import('@/lib/email/email-manager');
    
    // Initialize database
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'funnel.db');
    const db = new Database(dbPath);

    try {
      // Calculate the time 6 hours from now
      const now = new Date();
      const sixHoursFromNow = new Date(now.getTime() + (6 * 60 * 60 * 1000)); // 6 hours in milliseconds
      
      // Format for comparison (YYYY-MM-DD HH:MM format)
      const targetDate = sixHoursFromNow.toISOString().split('T')[0]; // YYYY-MM-DD
      const targetTime = sixHoursFromNow.toTimeString().substr(0, 5); // HH:MM

      console.log(`🎯 Looking for appointments on ${targetDate} around ${targetTime}`);

      // Find appointments that need reminders
      // Check appointments that are approximately 6 hours away (within a 30-minute window)
      const appointments = db.prepare(`
        SELECT 
          a.*,
          DATETIME(a.appointment_date || ' ' || a.appointment_time) as appointment_datetime
        FROM appointments a
        WHERE 
          a.status = 'scheduled'
          AND a.appointment_date = ?
          AND (a.email_reminder_sent = 0 OR a.sms_reminder_sent = 0)
          AND TIME(a.appointment_time) BETWEEN TIME(?, '-15 minutes') AND TIME(?, '+15 minutes')
      `).all(targetDate, targetTime, targetTime);

      console.log(`📋 Found ${appointments.length} appointments needing reminders`);

      const results = {
        processed: 0,
        emailsSent: 0,
        smsSent: 0,
        errors: [] as string[]
      };

      for (const appointment of appointments as Array<Record<string, unknown>>) {
        try {
          console.log(`📅 Processing appointment ${appointment.id} for ${appointment.name} (${appointment.email})`);
          
          const appointmentData = {
            name: String(appointment.name || 'Client'),
            date: new Date(String(appointment.appointment_date || '')).toLocaleDateString('ru-RU'),
            time: String(appointment.appointment_time || ''),
            meetLink: String(appointment.google_meet_link || '')
          };

          // Send email reminder if not sent
          if (!appointment.email_reminder_sent) {
            try {
              const appointmentForEmail = {
                name: String(appointment.name || 'Client'),
                email: String(appointment.email || ''),
                phone: String(appointment.phone || ''),
                appointment_date: String(appointment.appointment_date || ''),
                appointment_time: String(appointment.appointment_time || ''),
                timezone: String(appointment.timezone || 'Europe/Moscow'),
                google_meet_link: String(appointment.google_meet_link || ''),
                meeting_id: String(appointment.meeting_id || '')
              };

              const emailResult = await emailManager.sendAppointmentReminderEmail(appointmentForEmail);

              if (emailResult.success) {
                // Update database - mark email reminder as sent
                db.prepare(`
                  UPDATE appointments 
                  SET email_reminder_sent = 1, email_reminder_sent_at = datetime('now')
                  WHERE id = ?
                `).run(appointment.id);
                
                results.emailsSent++;
                console.log(`✅ Email reminder sent to ${appointment.email}`);
              } else {
                console.error(`❌ Failed to send email to ${appointment.email}:`, emailResult.error);
                results.errors.push(`Email to ${appointment.email}: ${emailResult.error}`);
              }
            } catch (emailError) {
              console.error(`❌ Email error for ${appointment.email}:`, emailError);
              results.errors.push(`Email to ${appointment.email}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
            }
          }

          // Send SMS reminder if not sent and phone number available
          if (!appointment.sms_reminder_sent && appointment.phone && smsService.isAvailable()) {
            try {
              const smsMessage = smsService.createAppointmentReminderSMS(appointmentData);
              
              const smsResult = await smsService.sendSMS({
                to: String(appointment.phone || ''),
                message: smsMessage
              });

              if (smsResult.success) {
                // Update database - mark SMS reminder as sent
                db.prepare(`
                  UPDATE appointments 
                  SET sms_reminder_sent = 1, sms_reminder_sent_at = datetime('now')
                  WHERE id = ?
                `).run(appointment.id);
                
                results.smsSent++;
                console.log(`✅ SMS reminder sent to ${appointment.phone}`);
              } else {
                console.error(`❌ Failed to send SMS to ${appointment.phone}:`, smsResult.error);
                results.errors.push(`SMS to ${appointment.phone}: ${smsResult.error}`);
              }
            } catch (smsError) {
              console.error(`❌ SMS error for ${appointment.phone}:`, smsError);
              results.errors.push(`SMS to ${appointment.phone}: ${smsError instanceof Error ? smsError.message : 'Unknown error'}`);
            }
          }

          results.processed++;

        } catch (appointmentError) {
          console.error(`❌ Error processing appointment ${appointment.id}:`, appointmentError);
          results.errors.push(`Appointment ${appointment.id}: ${appointmentError instanceof Error ? appointmentError.message : 'Unknown error'}`);
        }
      }

      console.log(`✅ Reminder processing complete:`, results);

      return NextResponse.json({
        success: true,
        message: 'Reminder processing completed',
        data: results
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('❌ Error processing reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process reminders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

