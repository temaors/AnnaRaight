import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

interface AppointmentData {
  name: string;
  email: string;
  phone?: string;
  website?: string;
  revenue?: string;
  currentLevel?: string;
  desiredLevel?: string;
  currentIncome?: string;
  decisionMaker?: string;
  appointment_date: string;
  appointment_time: string;
  timezone?: string;
  google_meet_link?: string;
  meeting_id?: string;
}

export async function POST(request: NextRequest) {
  console.log('=== APPOINTMENT API STARTED ===');
  
  try {
    console.log('Parsing appointment request...');
    const appointmentData: AppointmentData = await request.json();
    console.log('Appointment data:', appointmentData);

    // Validate required fields
    const requiredFields = ['name', 'email', 'appointment_date', 'appointment_time'];
    for (const field of requiredFields) {
      if (!appointmentData[field as keyof AppointmentData]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Set default timezone if not provided
    if (!appointmentData.timezone) {
      appointmentData.timezone = 'Europe/Moscow';
    }

    // Create appointment in Google Calendar with error handling
    console.log('Creating appointment in Google Calendar...');
    let calendarResult: any = { success: false, message: 'Calendar not initialized' };
    
    try {
      // TEMPORARY FIX: Create event directly until module cache issue is resolved
      console.log('🔄 Creating Google Calendar event directly...');
      
      // Load required modules
      const { google } = require('googleapis');
      const fs = require('fs');
      const path = require('path');
      
      // Force debug logging to file
      const debugLog = `[${new Date().toISOString()}] Calendar attempt started - appointment_id: ${appointmentData.name}\n`;
      try {
        const logPath = path.join(process.cwd(), 'debug.log');
        fs.appendFileSync(logPath, debugLog);
      } catch (logError) {
        console.log('Debug log error (non-fatal):', logError.message);
      }
      
      // Direct file paths - use database folder in project root
      const credentialsPath = path.join(process.cwd(), 'database', 'credentials.json');
      const tokenPath = path.join(process.cwd(), 'database', 'token.json');
      
      console.log('📁 Checking files:', { credentialsPath, tokenPath });
      
      if (fs.existsSync(credentialsPath) && fs.existsSync(tokenPath)) {
        console.log('✅ Both files found, creating event...');
        
        const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        
        const auth = google.auth.fromJSON({
          type: 'authorized_user',
          client_id: token.client_id,
          client_secret: token.client_secret,
          refresh_token: token.refresh_token
        });
        
        const calendar = google.calendar({ version: 'v3', auth });
        
        // Create event
        const [hours, minutes] = appointmentData.appointment_time.split(':').map(Number);
        const eventDateTime = new Date(appointmentData.appointment_date);
        eventDateTime.setHours(hours, minutes, 0, 0);
        
        const endDateTime = new Date(eventDateTime);
        endDateTime.setHours(eventDateTime.getHours() + 1);
        
        const event = {
          summary: `Consultation with ${appointmentData.name}`,
          description: `👤 Client: ${appointmentData.name}\n📧 Email: ${appointmentData.email}\n⏰ Time: ${appointmentData.appointment_time}\n🌍 Timezone: ${appointmentData.timezone}\n\n📝 Booked through sales funnel.`,
          start: {
            dateTime: eventDateTime.toISOString(),
            timeZone: appointmentData.timezone,
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: appointmentData.timezone,
          },
          attendees: [
            { email: appointmentData.email },
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 30 },
            ],
          },
        };
        
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
          sendUpdates: 'none',
        });
        
        console.log('✅ Direct Google Calendar event created:', response.data.id);
        
        // Log success to file
        const successLog = `[${new Date().toISOString()}] SUCCESS: Event created with ID: ${response.data.id}\n`;
        try {
          const logPath = path.join(process.cwd(), 'debug.log');
          fs.appendFileSync(logPath, successLog);
        } catch (logError) {
          console.log('Success log error (non-fatal):', logError.message);
        }
        
        calendarResult = {
          success: true,
          event_id: response.data.id,
          html_link: response.data.htmlLink,
          google_meet_link: null,
          meeting_id: null
        };
      } else {
        console.log('❌ Files not found, using fallback');
        
        // Log files not found
        const errorLog = `[${new Date().toISOString()}] ERROR: Files not found - credentials: ${fs.existsSync(credentialsPath)}, token: ${fs.existsSync(tokenPath)}\n`;
        try {
          const logPath = path.join(process.cwd(), 'debug.log');
          fs.appendFileSync(logPath, errorLog);
        } catch (logError) {
          console.log('Error log error (non-fatal):', logError.message);
        }
        
        calendarResult = { 
          success: false, 
          message: 'Google Calendar files not found',
          event_id: null,
          html_link: null,
          google_meet_link: null,
          meeting_id: null
        };
      }
    } catch (calendarError) {
      console.error('Google Calendar error (non-fatal):', calendarError);
      
      // Log error to file
      const catchErrorLog = `[${new Date().toISOString()}] CATCH ERROR: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}\n`;
      try {
        const logPath = path.join(process.cwd(), 'debug.log');
        fs.appendFileSync(logPath, catchErrorLog);
      } catch (logError) {
        console.log('Catch error log error (non-fatal):', logError.message);
      }
      
      calendarResult = { 
        success: false, 
        message: `Calendar error: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}`,
        event_id: null,
        google_meet_link: null,
        meeting_id: null,
        html_link: null
      };
    }

    // Set up database with error handling - use data directory
    const dataDir = path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, 'funnel.db');
    const dbDir = path.dirname(dbPath);
    
    // Ensure database directory exists
    if (!fs.existsSync(dbDir)) {
      console.log('Creating database directory:', dbDir);
      fs.mkdirSync(dbDir, { recursive: true });
    }

    console.log('Database path:', dbPath);
    
    let db: any;
    try {
      // Dynamic import of Database
      const Database = (await import('better-sqlite3')).default;
      
      // Check if database file exists and is writable
      if (fs.existsSync(dbPath)) {
        try {
          fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
          console.log('Database file is readable and writable');
        } catch (accessError) {
          console.error('Database file access error:', accessError);
          // Try to fix permissions
          try {
            fs.chmodSync(dbPath, 0o666);
            console.log('Fixed database file permissions');
          } catch (chmodError) {
            console.error('Could not fix database permissions:', chmodError);
          }
        }
      }
      
      db = new Database(dbPath);
      console.log('Database connection established successfully');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Tables are already created by lib/database.ts, just verify they exist
    // DO NOT recreate tables here - use the existing schema

    // First, get or create lead
    const leadStmt = db.prepare('SELECT id FROM leads WHERE email = ?');
    const leadRecord = leadStmt.get(appointmentData.email) as { id: number } | undefined;
    let leadId = leadRecord?.id;

    // If no lead exists, create one
    if (!leadId) {
      const insertLeadStmt = db.prepare(`
        INSERT INTO leads (name, email, phone, website, revenue, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `);

      const leadResult = insertLeadStmt.run(
        appointmentData.name,
        appointmentData.email,
        appointmentData.phone || null,
        appointmentData.website || null,
        appointmentData.currentIncome || appointmentData.revenue || null
      );

      leadId = leadResult.lastInsertRowid as number;
      console.log('Created new lead with ID:', leadId);
    } else {
      // Update existing lead with new information
      const updateLeadStmt = db.prepare(`
        UPDATE leads
        SET name = ?, phone = COALESCE(?, phone), website = COALESCE(?, website),
            revenue = COALESCE(?, revenue), updated_at = datetime('now')
        WHERE id = ?
      `);

      updateLeadStmt.run(
        appointmentData.name,
        appointmentData.phone || null,
        appointmentData.website || null,
        appointmentData.currentIncome || appointmentData.revenue || null,
        leadId
      );
      console.log('Updated existing lead with ID:', leadId);
    }

    // Insert appointment into database with lead_id
    const insertStmt = db.prepare(`
      INSERT INTO appointments (
        lead_id, appointment_date, appointment_time, timezone, status,
        google_event_id, google_meet_link, meeting_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      leadId,
      appointmentData.appointment_date,
      appointmentData.appointment_time,
      appointmentData.timezone,
      'scheduled', // status
      calendarResult.event_id || null,
      calendarResult.google_meet_link || appointmentData.google_meet_link || null,
      calendarResult.meeting_id || appointmentData.meeting_id || null
    );

    // Safely close database
    try {
      db.close();
      console.log('Database connection closed successfully');
    } catch (closeError) {
      console.error('Error closing database:', closeError);
    }

    console.log('Appointment saved successfully:', result.lastInsertRowid);
    
    // Send appointment confirmation email (like first email - simple and direct)
    let emailResult: { success: boolean; error?: string } | null = null;

    try {
      console.log('📧 Starting email sending process...');

      // Dynamic import of email manager
      const { emailManager } = await import('@/lib/email/email-manager');

      // Add Google Meet link from calendar result to appointmentData
      if (calendarResult.google_meet_link) {
        appointmentData.google_meet_link = calendarResult.google_meet_link;
      }
      if (calendarResult.meeting_id) {
        appointmentData.meeting_id = calendarResult.meeting_id;
      }

      console.log('📧 Sending confirmation email to:', appointmentData.email);
      // Send confirmation email to client
      emailResult = await emailManager.sendAppointmentConfirmationEmail(appointmentData);
      console.log(`✅ Appointment confirmation email sent to ${appointmentData.email}:`, emailResult);

      console.log('📧 Sending admin notification...');
      // Send admin notification
      const adminResult = await emailManager.sendAdminNotification(appointmentData);
      console.log(`✅ Admin notification email sent:`, adminResult);

      console.log('📧 Email sending process completed successfully');

    } catch (emailError: unknown) {
      console.error('❌ Error sending appointment emails:', emailError);
      if (emailError instanceof Error) {
        console.error('❌ Error stack:', emailError.stack);
      }
      // Continue even if email fails
    }

    // Update lead status to appointment_scheduled
    try {
      const { statusManager } = await import('@/lib/status-manager');
      await statusManager.handleAppointmentScheduled(leadId, result.lastInsertRowid as number);
      console.log('✅ Lead status updated to appointment_scheduled');
    } catch (statusError) {
      console.error('❌ Error updating lead status:', statusError);
      // Continue even if status update fails
    }

    // Cancel all pending email reminders for this user since they scheduled an appointment
    try {
      const { reminderScheduler } = await import('@/lib/reminder-scheduler');
      const cancelResult = reminderScheduler.cancelAllReminders(appointmentData.email);
      console.log('📅 Cancelled pending reminders:', cancelResult);
    } catch (cancelError) {
      console.error('❌ Error cancelling reminders:', cancelError);
      // Continue even if cancellation fails
    }

    // Schedule appointment reminder (5 minutes from now)
    try {
      const { reminderScheduler } = await import('@/lib/reminder-scheduler');
      const appointmentDateTime = `${appointmentData.appointment_date} ${appointmentData.appointment_time}`;
      const reminderResult = reminderScheduler.scheduleAppointmentReminder(
        appointmentData.email,
        appointmentData.name,
        appointmentDateTime
      );
      console.log('📅 Appointment reminder scheduled:', reminderResult);
    } catch (reminderError) {
      console.error('❌ Error scheduling appointment reminder:', reminderError);
      // Continue even if reminder scheduling fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Appointment saved successfully',
      appointment_id: result.lastInsertRowid,
      google_calendar: {
        event_id: calendarResult.event_id || null,
        html_link: calendarResult.html_link || null,
        google_meet_link: calendarResult.google_meet_link || null,
        meeting_id: calendarResult.meeting_id || null,
        message: calendarResult.success ? 'Event created successfully' : (calendarResult.message || 'Calendar not configured')
      }
    });
    
  } catch (error) {
    console.error('=== APPOINTMENT API ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}