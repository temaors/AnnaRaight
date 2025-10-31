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
      // Check if reminder columns already exist
      const columns = db.prepare("PRAGMA table_info(appointments)").all() as ColumnInfo[];
      const columnNames = columns.map(col => col.name);
      
      const changes = [];

      // Add email_reminder_sent column if it doesn't exist
      if (!columnNames.includes('email_reminder_sent')) {
        db.exec('ALTER TABLE appointments ADD COLUMN email_reminder_sent INTEGER DEFAULT 0');
        changes.push('Added email_reminder_sent column');
      }

      // Add sms_reminder_sent column if it doesn't exist
      if (!columnNames.includes('sms_reminder_sent')) {
        db.exec('ALTER TABLE appointments ADD COLUMN sms_reminder_sent INTEGER DEFAULT 0');
        changes.push('Added sms_reminder_sent column');
      }

      // Add email_reminder_sent_at column if it doesn't exist
      if (!columnNames.includes('email_reminder_sent_at')) {
        db.exec('ALTER TABLE appointments ADD COLUMN email_reminder_sent_at DATETIME');
        changes.push('Added email_reminder_sent_at column');
      }

      // Add sms_reminder_sent_at column if it doesn't exist
      if (!columnNames.includes('sms_reminder_sent_at')) {
        db.exec('ALTER TABLE appointments ADD COLUMN sms_reminder_sent_at DATETIME');
        changes.push('Added sms_reminder_sent_at column');
      }

      // Add phone column to appointments if it doesn't exist (for SMS)
      if (!columnNames.includes('phone')) {
        db.exec('ALTER TABLE appointments ADD COLUMN phone TEXT');
        changes.push('Added phone column');
      }

      return NextResponse.json({
        success: true,
        message: 'Database schema migration completed',
        changes: changes.length > 0 ? changes : ['No changes needed - schema already up to date']
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error migrating database schema:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to migrate database schema', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}