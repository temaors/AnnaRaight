import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    console.log('📊 [REMINDER STATUS] Checking reminder system status...');
    
    // Initialize database
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'funnel.db');
    const db = new Database(dbPath);

    try {
      // Get pending reminders count
      const pendingReminders = db.prepare(`
        SELECT 
          reminderType,
          COUNT(*) as count
        FROM email_reminders 
        WHERE status = 'pending' 
        GROUP BY reminderType
        ORDER BY reminderType
      `).all();

      // Get total reminders count by status
      const totalByStatus = db.prepare(`
        SELECT 
          status,
          COUNT(*) as count
        FROM email_reminders 
        GROUP BY status
        ORDER BY status
      `).all();

      // Get recent activity (last 24 hours)
      const recentActivity = db.prepare(`
        SELECT 
          reminderType,
          status,
          COUNT(*) as count
        FROM email_reminders 
        WHERE sentAt > datetime('now', '-24 hours') OR createdAt > datetime('now', '-24 hours')
        GROUP BY reminderType, status
        ORDER BY reminderType, status
      `).all();

      // Get overdue reminders (should have been sent but haven't)
      const overdueReminders = db.prepare(`
        SELECT 
          reminderType,
          COUNT(*) as count,
          MIN(scheduledFor) as oldestScheduled
        FROM email_reminders 
        WHERE status = 'pending' 
        AND scheduledFor < datetime('now', '-1 hour')
        GROUP BY reminderType
        ORDER BY reminderType
      `).all();

      // Get next upcoming reminders
      const upcomingReminders = db.prepare(`
        SELECT 
          reminderType,
          COUNT(*) as count,
          MIN(scheduledFor) as nextScheduled
        FROM email_reminders 
        WHERE status = 'pending' 
        AND scheduledFor > datetime('now')
        AND scheduledFor < datetime('now', '+24 hours')
        GROUP BY reminderType
        ORDER BY nextScheduled
        LIMIT 10
      `).all();

      console.log('✅ [REMINDER STATUS] Status check completed');

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          pending: pendingReminders,
          totalByStatus: totalByStatus,
          recentActivity: recentActivity,
          overdueReminders: overdueReminders,
          upcomingReminders: upcomingReminders
        }
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('❌ [REMINDER STATUS] Error checking status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check reminder status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}