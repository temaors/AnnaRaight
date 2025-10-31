import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Simple database operations without external lib
function createDbConnection() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const dbPath = path.join(dataDir, 'funnel.db');
  return new Database(dbPath);
}

export async function POST(request: NextRequest) {
  console.log('=== DB API called ===');
  
  let db: Database.Database | null = null;
  
  try {
    const { action, table, values, where, updates } = await request.json();
    console.log('DB API request:', { action, table, values, where, updates });

    db = createDbConnection();
    let result: any = null;

    switch (action) {
      case 'select':
        if (where) {
          const stmt = db.prepare(`SELECT * FROM ${table} WHERE ${where.column} = ?`);
          result = stmt.all(where.value);
        } else {
          const stmt = db.prepare(`SELECT * FROM ${table}`);
          result = stmt.all();
        }
        break;

      case 'insert':
        if (values) {
          const columns = Object.keys(values).join(', ');
          const placeholders = Object.keys(values).map(() => '?').join(', ');
          const stmt = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`);
          result = stmt.run(...Object.values(values));
        }
        break;

      case 'update':
        if (where && updates) {
          const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
          const stmt = db.prepare(`UPDATE ${table} SET ${setClause} WHERE ${where.column} = ?`);
          result = stmt.run(...Object.values(updates), where.value);
        }
        break;

      case 'delete':
        if (where) {
          const stmt = db.prepare(`DELETE FROM ${table} WHERE ${where.column} = ?`);
          result = stmt.run(where.value);
        }
        break;

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action',
          data: null 
        });
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `${action} operation completed successfully`
    });

  } catch (error) {
    console.error('Database API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    if (db) {
      try {
        db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
}