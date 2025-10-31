import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    // Initialize database
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'funnel.db');
    const db = new Database(dbPath);

    try {
      // Check what tables exist
      const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
      console.log('Available tables:', tables.map(t => t.name));

      // Get video statistics if table exists
      let videoStats = {
        unique_viewers: 0,
        total_views: 0,
        avg_duration: 0,
        avg_percentage: 0,
        completed_views: 0,
        max_duration: 0
      };

      const hasVideoViews = tables.some(t => t.name === 'video_views');
      if (hasVideoViews) {
        try {
          videoStats = db.prepare(`
            SELECT 
              COUNT(DISTINCT lead_id) as unique_viewers,
              COUNT(*) as total_views,
              AVG(view_duration) as avg_duration,
              AVG(view_percentage) as avg_percentage,
              SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_views,
              MAX(view_duration) as max_duration
            FROM video_views
          `).get() || videoStats;
        } catch (err) {
          console.log('Error querying video_views:', err.message);
        }
      }

      // Get video views by page
      let videoByPage = [];
      if (hasVideoViews) {
        try {
          videoByPage = db.prepare(`
            SELECT 
              video_page,
              COUNT(DISTINCT lead_id) as unique_viewers,
              COUNT(*) as total_views,
              AVG(view_duration) as avg_duration,
              AVG(view_percentage) as avg_percentage
            FROM video_views
            GROUP BY video_page
            ORDER BY total_views DESC
          `).all() || [];
        } catch (err) {
          console.log('Error querying video_views by page:', err.message);
        }
      }

      // Get funnel statistics (pages visited)
      let funnelStats = [];
      const hasFunnelAnalytics = tables.some(t => t.name === 'funnel_analytics');
      if (hasFunnelAnalytics) {
        try {
          funnelStats = db.prepare(`
            SELECT 
              page_visited,
              COUNT(DISTINCT email) as unique_visitors,
              COUNT(*) as total_visits,
              DATE(MAX(timestamp)) as last_visit
            FROM funnel_analytics
            GROUP BY page_visited
            ORDER BY total_visits DESC
          `).all() || [];
        } catch (err) {
          console.log('Error querying funnel_analytics:', err.message);
        }
      }

      // Get conversion funnel
      let conversionFunnel = {
        start_page: 0,
        watch_page: 0,
        schedule_page: 0,
        confirmed_page: 0
      };
      
      if (hasFunnelAnalytics) {
        try {
          conversionFunnel = db.prepare(`
            WITH funnel_steps AS (
              SELECT 
                email,
                MAX(CASE WHEN page_visited LIKE '%start%' THEN 1 ELSE 0 END) as visited_start,
                MAX(CASE WHEN page_visited LIKE '%watch%' OR page_visited LIKE '%video%' THEN 1 ELSE 0 END) as visited_watch,
                MAX(CASE WHEN page_visited LIKE '%schedule%' THEN 1 ELSE 0 END) as visited_schedule,
                MAX(CASE WHEN page_visited LIKE '%confirmed%' OR page_visited LIKE '%thank%' THEN 1 ELSE 0 END) as visited_confirmed
              FROM funnel_analytics
              GROUP BY email
            )
            SELECT 
              SUM(visited_start) as start_page,
              SUM(visited_watch) as watch_page,
              SUM(visited_schedule) as schedule_page,
              SUM(visited_confirmed) as confirmed_page
            FROM funnel_steps
          `).get() || conversionFunnel;
        } catch (err) {
          console.log('Error querying conversion funnel:', err.message);
        }
      }

      // Get recent activity
      const recentActivity = db.prepare(`
        SELECT 
          'page_visit' as activity_type,
          email,
          page_visited as details,
          timestamp
        FROM funnel_analytics
        UNION ALL
        SELECT 
          'video_view' as activity_type,
          l.email,
          'Watched ' || v.video_page || ' for ' || v.view_duration || 's' as details,
          v.viewed_at as timestamp
        FROM video_views v
        LEFT JOIN leads l ON l.id = v.lead_id
        ORDER BY timestamp DESC
        LIMIT 20
      `).all();

      // Get daily statistics for the last 7 days
      const dailyStats = db.prepare(`
        SELECT 
          DATE(timestamp) as date,
          COUNT(DISTINCT email) as unique_visitors,
          COUNT(*) as total_pageviews
        FROM funnel_analytics
        WHERE timestamp >= date('now', '-7 days')
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `).all();

      // Get leads by source/page
      const leadsBySource = db.prepare(`
        SELECT 
          fa.page_visited as source_page,
          COUNT(DISTINCT l.id) as lead_count
        FROM leads l
        INNER JOIN (
          SELECT email, page_visited, MIN(timestamp) as first_visit
          FROM funnel_analytics
          GROUP BY email
        ) fa ON l.email = fa.email
        GROUP BY fa.page_visited
        ORDER BY lead_count DESC
      `).all();

      return NextResponse.json({
        success: true,
        data: {
          videoStats,
          videoByPage,
          funnelStats,
          conversionFunnel,
          recentActivity,
          dailyStats,
          leadsBySource
        }
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}