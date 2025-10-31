import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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
      console.log('🧹 Starting video views cleanup...');
      
      // Get count before cleanup
      const beforeCount = db.prepare('SELECT COUNT(*) as count FROM video_views').get() as { count: number };
      
      // Find and keep only the latest view for each unique combination of video_page, ip_address, and user_agent within 1 hour windows
      const cleanupQuery = `
        DELETE FROM video_views 
        WHERE id NOT IN (
          SELECT MAX(id) 
          FROM video_views 
          GROUP BY video_page, ip_address, user_agent, 
                   strftime('%Y-%m-%d %H', viewed_at)
        )
      `;
      
      db.prepare(cleanupQuery).run();
      
      // Get count after cleanup
      const afterCount = db.prepare('SELECT COUNT(*) as count FROM video_views').get() as { count: number };
      
      const removedCount = beforeCount.count - afterCount.count;
      
      console.log(`✅ Cleanup completed: removed ${removedCount} duplicate records`);

      return NextResponse.json({
        success: true,
        message: 'Video views cleanup completed',
        data: {
          recordsBefore: beforeCount.count,
          recordsAfter: afterCount.count,
          recordsRemoved: removedCount
        }
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error cleaning up video views:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup video views' },
      { status: 500 }
    );
  }
}