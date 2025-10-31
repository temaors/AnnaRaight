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

interface LeadWithStatus {
  id: number;
  email: string;
  has_appointment: number;
  has_order: number;
  has_video_view: number;
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

      // 1. Enhance leads table with new status fields
      const leadsColumns = db.prepare("PRAGMA table_info(leads)").all() as ColumnInfo[];
      const leadsColumnNames = leadsColumns.map(col => col.name);
      
      if (!leadsColumnNames.includes('funnel_stage')) {
        db.exec('ALTER TABLE leads ADD COLUMN funnel_stage TEXT DEFAULT "new"');
        changes.push('Added funnel_stage column to leads');
      }

      if (!leadsColumnNames.includes('engagement_score')) {
        db.exec('ALTER TABLE leads ADD COLUMN engagement_score INTEGER DEFAULT 0');
        changes.push('Added engagement_score column to leads');
      }

      if (!leadsColumnNames.includes('last_activity')) {
        db.exec('ALTER TABLE leads ADD COLUMN last_activity DATETIME DEFAULT NULL');
        db.exec('UPDATE leads SET last_activity = created_at WHERE last_activity IS NULL');
        changes.push('Added last_activity column to leads');
      }

      // 2. Create status_history table for tracking status changes
      db.exec(`
        CREATE TABLE IF NOT EXISTS status_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lead_id INTEGER NOT NULL,
          old_status TEXT,
          new_status TEXT NOT NULL,
          status_type TEXT NOT NULL DEFAULT 'funnel_stage', -- 'funnel_stage', 'appointment', 'payment'
          trigger_event TEXT,
          notes TEXT,
          admin_user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lead_id) REFERENCES leads(id)
        )
      `);
      changes.push('Created status_history table');

      // 3. Enhance appointments table with more detailed statuses
      const appointmentsColumns = db.prepare("PRAGMA table_info(appointments)").all() as ColumnInfo[];
      const appointmentsColumnNames = appointmentsColumns.map(col => col.name);

      if (!appointmentsColumnNames.includes('attended')) {
        db.exec('ALTER TABLE appointments ADD COLUMN attended BOOLEAN DEFAULT FALSE');
        changes.push('Added attended column to appointments');
      }

      if (!appointmentsColumnNames.includes('no_show')) {
        db.exec('ALTER TABLE appointments ADD COLUMN no_show BOOLEAN DEFAULT FALSE');
        changes.push('Added no_show column to appointments');
      }

      if (!appointmentsColumnNames.includes('rescheduled_from')) {
        db.exec('ALTER TABLE appointments ADD COLUMN rescheduled_from INTEGER');
        changes.push('Added rescheduled_from column to appointments');
      }

      if (!appointmentsColumnNames.includes('cancellation_reason')) {
        db.exec('ALTER TABLE appointments ADD COLUMN cancellation_reason TEXT');
        changes.push('Added cancellation_reason column to appointments');
      }

      // 4. Create invoices table for invoice management
      db.exec(`
        CREATE TABLE IF NOT EXISTS invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_number TEXT UNIQUE NOT NULL,
          lead_id INTEGER NOT NULL,
          email TEXT NOT NULL,
          status TEXT DEFAULT 'draft', -- draft, sent, viewed, paid, overdue, cancelled
          total_amount DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'USD',
          due_date DATE,
          invoice_date DATE DEFAULT CURRENT_DATE,
          stripe_payment_intent_id TEXT,
          stripe_invoice_id TEXT,
          notes TEXT,
          pdf_path TEXT,
          sent_at DATETIME,
          viewed_at DATETIME,
          paid_at DATETIME,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lead_id) REFERENCES leads(id)
        )
      `);
      changes.push('Created invoices table');

      // 5. Create invoice_items table for invoice line items
      db.exec(`
        CREATE TABLE IF NOT EXISTS invoice_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          product_id INTEGER,
          description TEXT NOT NULL,
          quantity INTEGER DEFAULT 1,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `);
      changes.push('Created invoice_items table');

      // 6. Create invoice_payments table for payment tracking
      db.exec(`
        CREATE TABLE IF NOT EXISTS invoice_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          currency TEXT DEFAULT 'USD',
          payment_method TEXT, -- stripe, bank_transfer, cash, etc.
          stripe_payment_id TEXT,
          status TEXT DEFAULT 'pending', -- pending, succeeded, failed, cancelled
          paid_at DATETIME,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        )
      `);
      changes.push('Created invoice_payments table');

      // 7. Create engagement_events table for detailed tracking
      db.exec(`
        CREATE TABLE IF NOT EXISTS engagement_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lead_id INTEGER NOT NULL,
          event_type TEXT NOT NULL, -- video_view, page_visit, email_open, link_click, etc.
          event_data TEXT, -- JSON data for additional context
          score_value INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lead_id) REFERENCES leads(id)
        )
      `);
      changes.push('Created engagement_events table');

      // 8. Initialize existing leads with proper funnel stages based on their current data
      const existingLeads = db.prepare(`
        SELECT l.id, l.email, 
               CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as has_appointment,
               CASE WHEN o.id IS NOT NULL THEN 1 ELSE 0 END as has_order,
               CASE WHEN v.id IS NOT NULL THEN 1 ELSE 0 END as has_video_view
        FROM leads l
        LEFT JOIN appointments a ON l.email = a.email
        LEFT JOIN orders o ON l.email = o.email
        LEFT JOIN video_views v ON l.id = v.lead_id
      `).all() as LeadWithStatus[];

      const updateFunnelStage = db.prepare(`
        UPDATE leads SET funnel_stage = ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?
      `);

      let stagesUpdated = 0;
      for (const lead of existingLeads) {
        let stage = 'new';
        
        if (lead.has_video_view) {
          stage = 'video_started';
        }
        if (lead.has_appointment) {
          stage = 'appointment_scheduled';
        }
        if (lead.has_order) {
          stage = 'paid_customer';
        }

        updateFunnelStage.run(stage, lead.id);
        stagesUpdated++;
      }

      if (stagesUpdated > 0) {
        changes.push(`Updated funnel stages for ${stagesUpdated} existing leads`);
      }

      // 9. Create triggers for automatic status tracking
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS track_lead_status_changes
        AFTER UPDATE OF funnel_stage ON leads
        FOR EACH ROW
        WHEN OLD.funnel_stage != NEW.funnel_stage
        BEGIN
          INSERT INTO status_history (lead_id, old_status, new_status, status_type, trigger_event)
          VALUES (NEW.id, OLD.funnel_stage, NEW.funnel_stage, 'funnel_stage', 'automated_update');
        END
      `);
      changes.push('Created trigger for automatic status tracking');

      return NextResponse.json({
        success: true,
        message: 'Enhanced status system migration completed',
        changes: changes
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error migrating status system:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to migrate status system', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}