import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';


export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const db = new Database(path.join(dataDir, 'funnel.db'));

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const invoiceUploadsDir = path.join(uploadsDir, 'invoices');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    if (!fs.existsSync(invoiceUploadsDir)) {
      fs.mkdirSync(invoiceUploadsDir, { recursive: true });
    }

    try {
      // Add image fields to invoices table
      console.log('Adding image fields to invoices table...');
      
      db.exec(`
        ALTER TABLE invoices ADD COLUMN image_url TEXT;
      `);
      
      db.exec(`
        ALTER TABLE invoices ADD COLUMN image_filename TEXT;
      `);
      
      db.exec(`
        ALTER TABLE invoices ADD COLUMN image_uploaded_at DATETIME;
      `);

      console.log('✅ Image fields added successfully');
    } catch (error) {
      if (error instanceof Error && error.message && error.message.includes('duplicate column name')) {
        console.log('ℹ️ Image fields already exist, skipping...');
      } else {
        throw error;
      }
    }

    try {
      // Add post-payment content fields
      console.log('Adding post-payment content fields...');
      
      db.exec(`
        ALTER TABLE invoices ADD COLUMN post_payment_content TEXT;
      `);
      
      db.exec(`
        ALTER TABLE invoices ADD COLUMN post_payment_content_enabled INTEGER DEFAULT 0;
      `);
      
      db.exec(`
        ALTER TABLE invoices ADD COLUMN content_access_token TEXT;
      `);

      console.log('✅ Post-payment content fields added successfully');
    } catch (error) {
      if (error instanceof Error && error.message && error.message.includes('duplicate column name')) {
        console.log('ℹ️ Post-payment content fields already exist, skipping...');
      } else {
        throw error;
      }
    }

    try {
      // Create invoice_attachments table for multiple images
      console.log('Creating invoice_attachments table...');
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS invoice_attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          filename TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );
      `);

      console.log('✅ Invoice attachments table created successfully');
    } catch (error) {
      console.log('ℹ️ Invoice attachments table might already exist:', error instanceof Error ? error.message : 'Unknown error');
    }

    try {
      // Create invoice_digital_content table for structured post-payment content
      console.log('Creating invoice_digital_content table...');
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS invoice_digital_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          content_type TEXT NOT NULL, -- 'file', 'link', 'text', 'course_access'
          title TEXT NOT NULL,
          description TEXT,
          content_url TEXT,
          filename TEXT,
          file_size INTEGER,
          access_instructions TEXT,
          is_downloadable INTEGER DEFAULT 1,
          download_limit INTEGER DEFAULT 0, -- 0 = unlimited
          expiry_days INTEGER DEFAULT 0, -- 0 = never expires
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
        );
      `);

      console.log('✅ Invoice digital content table created successfully');
    } catch (error) {
      console.log('ℹ️ Invoice digital content table might already exist:', error instanceof Error ? error.message : 'Unknown error');
    }

    try {
      // Create content_access_logs table to track downloads
      console.log('Creating content_access_logs table...');
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS content_access_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          content_id INTEGER NOT NULL,
          access_token TEXT NOT NULL,
          accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          user_agent TEXT,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
          FOREIGN KEY (content_id) REFERENCES invoice_digital_content(id) ON DELETE CASCADE
        );
      `);

      console.log('✅ Content access logs table created successfully');
    } catch (error) {
      console.log('ℹ️ Content access logs table might already exist:', error instanceof Error ? error.message : 'Unknown error');
    }

    db.close();

    console.log('🎉 Database migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Invoice content features migration completed successfully',
      changes: [
        'Added image fields to invoices table',
        'Added post-payment content fields to invoices table', 
        'Created invoice_attachments table',
        'Created invoice_digital_content table',
        'Created content_access_logs table',
        'Created uploads/invoices directory'
      ]
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}