import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  console.log('=== POST /api/lead/save started ===');
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Add early error catching for Next.js environment issues
    if (!request || !request.headers) {
      console.error('❌ Invalid request object received');
      return NextResponse.json(
        { success: false, error: 'Invalid request object' },
        { status: 400 }
      );
    }
    // Check content type
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Invalid content type, returning 400');
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    let leadData: { firstName: string; email: string; videoUrl?: string };
    try {
      leadData = await request.json();
      console.log('Parsed JSON data:', leadData);
    } catch (jsonError) {
      console.log('JSON parsing error:', jsonError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!leadData.firstName || !leadData.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: firstName, email' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Initialize database with error handling
    let db: Database.Database | null = null;
    let leadId: number = 0;
    
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const dbPath = path.join(dataDir, 'funnel.db');
      console.log('Database path:', dbPath);
      
      db = new Database(dbPath);
      
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
      `);
      
      // Check if lead already exists
      const existingLead = db.prepare('SELECT id FROM leads WHERE email = ?').get(leadData.email) as { id: number } | undefined;
      
      if (existingLead) {
        // Update existing lead
        leadId = existingLead.id;
        db.prepare(`
          UPDATE leads 
          SET name = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(leadData.firstName, leadId);
        console.log('Updated existing lead:', leadId);
      } else {
        // Create new lead
        const insertLead = db.prepare(`
          INSERT INTO leads (name, email, created_at)
          VALUES (?, ?, datetime('now'))
        `);
        const result = insertLead.run(leadData.firstName, leadData.email);
        leadId = result.lastInsertRowid as number;
        console.log('Created new lead:', leadId);
      }
    } catch (dbError) {
      console.error('Database error (non-fatal):', dbError);
      // Continue without database - at least save the lead in memory/logs
    } finally {
      if (db) {
        try {
          db.close();
        } catch (closeError) {
          console.error('Error closing database:', closeError);
        }
      }
    }

    // Send welcome email if requested
    let emailResult: { success: boolean; error?: string } | null = null;

    if (leadData.videoUrl) {
      try {
        // Dynamic import with error handling
        let emailManager;
        let reminderScheduler;

        try {
          const emailModule = await import('@/lib/email/email-manager');
          emailManager = emailModule.emailManager;

          const reminderModule = await import('@/lib/reminder-scheduler');
          reminderScheduler = reminderModule.reminderScheduler;
        } catch (importError) {
          console.error('Failed to import email modules:', importError);
          emailResult = { success: false, error: `Module import failed: ${importError instanceof Error ? importError.message : 'Unknown import error'}` };
          return NextResponse.json({
            success: true,
            message: 'Lead saved successfully (email modules failed to load)',
            lead_id: leadId,
            email_sent: false,
            email_result: emailResult
          });
        }

        // Create the video URL with user data
        const videoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://annaraight.com'}/video/?firstName=${encodeURIComponent(leadData.firstName)}&email=${encodeURIComponent(leadData.email)}`;
        console.log('🔗 [DEBUG] BASE_URL env:', process.env.NEXT_PUBLIC_BASE_URL);
        console.log('🔗 [DEBUG] Generated videoUrl:', videoUrl);

        emailResult = await emailManager.sendWelcomeEmail(
          leadData.email,
          leadData.firstName,
          videoUrl
        );
        console.log(`Welcome email sent to ${leadData.email}:`, emailResult);

        // Schedule reminder emails if welcome email was sent successfully
        // Using testMode=true for 5-minute intervals (change to false for production intervals)
        if (emailResult.success) {
          const reminderResult = reminderScheduler.scheduleVideoReminder(
            leadData.email,
            leadData.firstName,
            videoUrl,
            true // testMode=true for 5-minute intervals
          );
          console.log(`📅 First reminder scheduled for ${leadData.email}:`, reminderResult);
        }
      } catch (emailError) {
        console.error('Email error (non-fatal):', emailError);
        emailResult = { success: false, error: String(emailError) };
      }
    }

    console.log(`Lead saved successfully: ${leadData.email}`);

    return NextResponse.json({
      success: true,
      message: 'Lead saved successfully',
      lead_id: leadId,
      email_sent: !!emailResult?.success,
      email_result: emailResult
    });

  } catch (error) {
    console.error('=== ERROR in /api/lead/save ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}