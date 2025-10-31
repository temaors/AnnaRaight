import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { statusManager } from '@/lib/status-manager';

export async function POST(request: NextRequest) {
  try {
    const viewData = await request.json();
    
    // Validate required fields
    if (!viewData.video_page || viewData.view_duration === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Initialize database
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'funnel.db');
    const db = new Database(dbPath);
    let result: any;
    
    try {
      // Create video_views table if it doesn't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS video_views (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lead_id INTEGER,
          video_page TEXT NOT NULL,
          view_duration INTEGER DEFAULT 0,
          view_percentage INTEGER DEFAULT 0,
          is_completed INTEGER DEFAULT 0,
          ip_address TEXT,
          user_agent TEXT,
          viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lead_id) REFERENCES leads (id)
        );
      `);
      // Get lead_id from email if provided
      let leadId = viewData.lead_id || null;
      
      if (!leadId && viewData.email) {
        const lead = db.prepare('SELECT id FROM leads WHERE email = ?').get(viewData.email) as { id: number } | undefined;
        leadId = lead ? lead.id : null;
      }
      
      // Get client IP and user agent
      const ip_address = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
      const user_agent = request.headers.get('user-agent') || 'unknown';
      
      // Check if a view record already exists for this session
      const existingView = db.prepare(`
        SELECT id FROM video_views 
        WHERE video_page = ? AND ip_address = ? AND user_agent = ? 
        AND datetime(viewed_at) > datetime('now', '-1 hour')
        ORDER BY viewed_at DESC 
        LIMIT 1
      `).get(viewData.video_page, ip_address, user_agent) as { id: number } | undefined;

      if (existingView) {
        // Update existing record with the latest viewing data
        const updateStmt = db.prepare(`
          UPDATE video_views 
          SET view_duration = ?, view_percentage = ?, is_completed = ?, viewed_at = datetime('now')
          WHERE id = ?
        `);
        
        updateStmt.run(
          Math.round(viewData.view_duration || 0),
          Math.round(viewData.view_percentage || 0),
          viewData.is_completed ? 1 : 0,
          existingView.id
        );
        
        result = { lastInsertRowid: existingView.id };
      } else {
        // Insert new video view record
        const insertStmt = db.prepare(`
          INSERT INTO video_views (
            lead_id, 
            video_page, 
            view_duration, 
            view_percentage, 
            is_completed, 
            ip_address, 
            user_agent, 
            viewed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        
        result = insertStmt.run(
          leadId,
          viewData.video_page,
          Math.round(viewData.view_duration || 0),
          Math.round(viewData.view_percentage || 0),
          viewData.is_completed ? 1 : 0,
          ip_address,
          user_agent
        );
      }
      
      // Also track in funnel analytics if email provided (only once per session)
      if (viewData.email && viewData.session_id) {
        // Check if this session already tracked this page
        const existingAnalytics = db.prepare(`
          SELECT id FROM funnel_analytics 
          WHERE email = ? AND page_visited = ? AND session_id = ?
        `).get(viewData.email, viewData.video_page, viewData.session_id);
        
        if (!existingAnalytics) {
          const analyticsStmt = db.prepare(`
            INSERT INTO funnel_analytics (
              email,
              page_visited,
              session_id,
              metadata,
              timestamp
            ) VALUES (?, ?, ?, ?, datetime('now'))
          `);
          
          analyticsStmt.run(
            viewData.email,
            viewData.video_page,
            viewData.session_id,
            JSON.stringify({
              action: 'video_view',
              duration: viewData.view_duration,
              percentage: viewData.view_percentage,
              completed: viewData.is_completed
            })
          );
        }
      }

      // Update status based on video progress if lead_id is available
      if (leadId && (viewData.view_percentage || viewData.is_completed)) {
        await statusManager.handleVideoCompletion(
          leadId, 
          viewData.video_page, 
          viewData.view_percentage || 0
        );
      }
      
    } finally {
      db.close();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Video view tracked successfully',
      view_id: result.lastInsertRowid
    });
    
  } catch (error) {
    console.error('Error tracking video view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track video view' },
      { status: 500 }
    );
  }
}