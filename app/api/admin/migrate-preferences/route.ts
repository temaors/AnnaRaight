import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface LeadEmail {
  email: string;
}

export async function POST() {
  try {
    // Initialize database
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'funnel.db');
    const db = new Database(dbPath);

    try {
      const changes = [];

      // Create email_preferences table
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
          unsubscribed_at DATETIME,
          unsubscribe_reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      changes.push('Created email_preferences table');

      // Add unsubscribe tracking to leads table
      const leadsColumns = db.prepare("PRAGMA table_info(leads)").all() as ColumnInfo[];
      const leadsColumnNames = leadsColumns.map(col => col.name);
      
      if (!leadsColumnNames.includes('funnel_step')) {
        db.exec('ALTER TABLE leads ADD COLUMN funnel_step TEXT DEFAULT "vsl_optin"');
        changes.push('Added funnel_step column to leads');
      }

      if (!leadsColumnNames.includes('is_subscribed')) {
        db.exec('ALTER TABLE leads ADD COLUMN is_subscribed INTEGER DEFAULT 1');
        changes.push('Added is_subscribed column to leads');
      }

      // Create trigger to update email_preferences when leads are updated
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_email_preferences_on_lead_change
        AFTER INSERT ON leads
        FOR EACH ROW
        BEGIN
          INSERT OR IGNORE INTO email_preferences (email) VALUES (NEW.email);
        END
      `);
      changes.push('Created trigger for email preferences');

      // Create unsubscribe_log table for tracking
      db.exec(`
        CREATE TABLE IF NOT EXISTS unsubscribe_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          unsubscribe_type TEXT NOT NULL, -- 'all', 'marketing', 'appointments', etc.
          reason TEXT,
          source TEXT, -- 'email_link', 'admin_panel', 'user_preference'
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      changes.push('Created unsubscribe_log table');

      // Initialize preferences for existing leads
      const existingLeads = db.prepare('SELECT DISTINCT email FROM leads').all() as LeadEmail[];
      const insertPreference = db.prepare(`
        INSERT OR IGNORE INTO email_preferences (email) VALUES (?)
      `);
      
      let preferencesCreated = 0;
      for (const lead of existingLeads) {
        insertPreference.run(lead.email);
        preferencesCreated++;
      }
      
      if (preferencesCreated > 0) {
        changes.push(`Initialized preferences for ${preferencesCreated} existing leads`);
      }

      return NextResponse.json({
        success: true,
        message: 'Email preferences schema migration completed',
        changes: changes
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error migrating preferences schema:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to migrate preferences schema', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}