import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  revenue?: string;
  created_at: string;
}


export async function GET() {
  try {
    // Initialize database
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'funnel.db');
    const db = new Database(dbPath);
    
    // Initialize tables if they don't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS leads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          website TEXT,
          revenue TEXT,
          sales_calls TEXT,
          decision_maker TEXT,
          platform TEXT,
          text_messages TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        timezone TEXT,
        status TEXT DEFAULT 'scheduled',
        google_meet_link TEXT,
        meeting_id TEXT,
        confirmation_sent INTEGER DEFAULT 0,
        reminder_sent INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads (id)
      );
    `);

    try {
      // Fetch leads
      const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all() as Lead[];
      
      // Fetch appointments with proper structure
      const appointmentsRaw = db.prepare(`
        SELECT 
          a.id,
          a.name,
          a.email,
          a.appointment_date,
          a.appointment_time,
          a.timezone,
          a.status,
          a.google_meet_link,
          a.meeting_id,
          COALESCE(l.id, 0) as lead_id,
          CASE WHEN a.google_event_id IS NOT NULL THEN 1 ELSE 0 END as confirmation_sent,
          0 as reminder_sent,
          a.created_at
        FROM appointments a
        LEFT JOIN leads l ON l.email = a.email
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `).all() as { id: number; email: string; name: string; appointment_date: string; appointment_time: string; confirmation_sent: number; reminder_sent: number; created_at: string }[];
      
      // Calculate statistics
      const stats = {
        totalLeads: leads.length,
        totalAppointments: appointmentsRaw.length,
        confirmationsSent: appointmentsRaw.filter(apt => apt.confirmation_sent).length,
        leadsToday: leads.filter(lead => 
          lead.created_at.includes(new Date().toISOString().split('T')[0])
        ).length
      };

      return NextResponse.json({
        success: true,
        data: {
          leads,
          appointments: appointmentsRaw,
          stats
        }
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}