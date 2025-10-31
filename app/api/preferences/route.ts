import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

// Generate secure token for unsubscribe links
function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-in-production';
  return crypto.createHmac('sha256', secret).update(email).digest('hex').substring(0, 16);
}

// Verify unsubscribe token
function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expectedToken = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

// GET - Get user preferences
export async function GET(request: NextRequest) {
  console.log('=== GET /api/preferences ===');
  
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    
    console.log('GET preferences for email:', email);

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    // Verify token for security
    if (token && !verifyUnsubscribeToken(email, token)) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 403 }
      );
    }

    const dataDir = path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, 'funnel.db');
    
    let db: Database.Database | null = null;

    try {
      db = new Database(dbPath);
      
      // Initialize tables if they don't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS email_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          marketing_emails INTEGER DEFAULT 1,
          appointment_emails INTEGER DEFAULT 1,
          reminder_emails INTEGER DEFAULT 1,
          newsletter INTEGER DEFAULT 1,
          sms_marketing INTEGER DEFAULT 1,
          sms_appointments INTEGER DEFAULT 1,
          sms_reminders INTEGER DEFAULT 1,
          unsubscribed_all INTEGER DEFAULT 0,
          unsubscribed_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS unsubscribe_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          unsubscribe_type TEXT,
          reason TEXT,
          source TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Get preferences or create default ones
      let preferences = db.prepare(`
        SELECT * FROM email_preferences WHERE email = ?
      `).get(email);

      if (!preferences) {
        // Create default preferences
        db.prepare(`
          INSERT INTO email_preferences (email) VALUES (?)
        `).run(email);
        
        preferences = db.prepare(`
          SELECT * FROM email_preferences WHERE email = ?
        `).get(email);
      }

      // Generate unsubscribe token for this user
      const unsubscribeToken = generateUnsubscribeToken(email);

      return NextResponse.json({
        success: true,
        data: {
          ...(preferences as Record<string, unknown>),
          unsubscribe_token: unsubscribeToken
        }
      });

    } catch (dbError) {
      console.error('Database error in GET preferences:', dbError);
      throw dbError;
    } finally {
      if (db) {
        try {
          db.close();
        } catch (closeError) {
          console.error('Error closing database:', closeError);
        }
      }
    }

  } catch (error) {
    console.error('Error getting preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get preferences', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Update user preferences
export async function POST(request: NextRequest) {
  console.log('=== POST /api/preferences ===');
  
  try {
    const body = await request.json();
    const { email, token, preferences, unsubscribe_type, reason } = body;
    
    console.log('POST preferences for email:', email, 'type:', unsubscribe_type);

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify token for security
    if (token && !verifyUnsubscribeToken(email, token)) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 403 }
      );
    }

    const dataDir = path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, 'funnel.db');
    
    let db: Database.Database | null = null;

    try {
      db = new Database(dbPath);
      
      // Initialize tables if they don't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS email_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          marketing_emails INTEGER DEFAULT 1,
          appointment_emails INTEGER DEFAULT 1,
          reminder_emails INTEGER DEFAULT 1,
          newsletter INTEGER DEFAULT 1,
          sms_marketing INTEGER DEFAULT 1,
          sms_appointments INTEGER DEFAULT 1,
          sms_reminders INTEGER DEFAULT 1,
          unsubscribed_all INTEGER DEFAULT 0,
          unsubscribed_at TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS unsubscribe_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          unsubscribe_type TEXT,
          reason TEXT,
          source TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS leads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT UNIQUE,
          is_subscribed INTEGER DEFAULT 1
        );
      `);
      
      // Get client info
      const ip_address = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
      const user_agent = request.headers.get('user-agent') || 'unknown';

      // Handle complete unsubscribe
      if (unsubscribe_type === 'all') {
        // Update preferences - unsubscribe from everything
        db.prepare(`
          INSERT OR REPLACE INTO email_preferences 
          (email, marketing_emails, appointment_emails, reminder_emails, newsletter, 
           sms_marketing, sms_appointments, sms_reminders, unsubscribed_all, unsubscribed_at) 
          VALUES (?, 0, 0, 0, 0, 0, 0, 0, 1, datetime('now'))
        `).run(email);

        // Log unsubscribe
        db.prepare(`
          INSERT INTO unsubscribe_log 
          (email, unsubscribe_type, reason, source, ip_address, user_agent) 
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(email, 'all', reason || null, 'user_action', ip_address, user_agent);

        // Update leads table
        db.prepare(`
          UPDATE leads SET is_subscribed = 0 WHERE email = ?
        `).run(email);

        return NextResponse.json({
          success: true,
          message: 'Successfully unsubscribed from all communications'
        });
      }

      // Handle selective preferences update
      if (preferences) {
        const {
          marketing_emails = 1,
          appointment_emails = 1,
          reminder_emails = 1,
          newsletter = 1,
          sms_marketing = 1,
          sms_appointments = 1,
          sms_reminders = 1
        } = preferences;

        // Check if user is unsubscribing from everything
        const allDisabled = !marketing_emails && !appointment_emails && !reminder_emails && !newsletter;

        db.prepare(`
          INSERT OR REPLACE INTO email_preferences 
          (email, marketing_emails, appointment_emails, reminder_emails, newsletter, 
           sms_marketing, sms_appointments, sms_reminders, unsubscribed_all, unsubscribed_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          email, marketing_emails, appointment_emails, reminder_emails, newsletter,
          sms_marketing, sms_appointments, sms_reminders, 
          allDisabled ? 1 : 0, 
          allDisabled ? new Date().toISOString() : null
        );

        // Log selective unsubscribe
        const unsubscribedTypes = [];
        if (!marketing_emails) unsubscribedTypes.push('marketing');
        if (!appointment_emails) unsubscribedTypes.push('appointments');
        if (!reminder_emails) unsubscribedTypes.push('reminders');
        if (!newsletter) unsubscribedTypes.push('newsletter');

        if (unsubscribedTypes.length > 0) {
          db.prepare(`
            INSERT INTO unsubscribe_log 
            (email, unsubscribe_type, reason, source, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            email, 
            unsubscribedTypes.join(','), 
            reason || null, 
            'user_preference', 
            ip_address, 
            user_agent
          );
        }

        // Update leads subscription status
        db.prepare(`
          UPDATE leads SET is_subscribed = ? WHERE email = ?
        `).run(allDisabled ? 0 : 1, email);

        return NextResponse.json({
          success: true,
          message: 'Preferences updated successfully'
        });
      }

      return NextResponse.json(
        { success: false, error: 'No valid action specified' },
        { status: 400 }
      );

    } catch (dbError) {
      console.error('Database error in POST preferences:', dbError);
      throw dbError;
    } finally {
      if (db) {
        try {
          db.close();
        } catch (closeError) {
          console.error('Error closing database:', closeError);
        }
      }
    }

  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function for generating unsubscribe links (internal use only)