import { NextResponse } from 'next/server';
import { statusManager } from '@/lib/status-manager';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
  try {
    // Get status statistics
    const stats = await statusManager.getEngagementStats();
    
    // Get status history with lead details
    const db = new Database(path.join(process.cwd(), 'data', 'funnel.db'));
    
    try {
      const history = db.prepare(`
        SELECT 
          sh.*,
          l.name as lead_name,
          l.email as lead_email
        FROM status_history sh
        LEFT JOIN leads l ON sh.lead_id = l.id
        ORDER BY sh.created_at DESC
        LIMIT 100
      `).all();

      return NextResponse.json({
        success: true,
        data: {
          history,
          stats
        }
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Error fetching status data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch status data' },
      { status: 500 }
    );
  }
}