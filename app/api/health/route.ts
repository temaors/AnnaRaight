import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'ok',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
      },
      database: {
        dataDir: path.join(process.cwd(), 'data'),
        dataDirExists: false,
        dbPath: path.join(process.cwd(), 'data', 'funnel.db'),
        dbExists: false
      },
      modules: {
        betterSqlite3: false,
        nodemailer: false,
        emailWhc: false,
        reminderScheduler: false
      }
    };

    // Check data directory
    const dataDir = path.join(process.cwd(), 'data');
    healthCheck.database.dataDirExists = fs.existsSync(dataDir);
    
    const dbPath = path.join(dataDir, 'funnel.db');
    healthCheck.database.dbExists = fs.existsSync(dbPath);

    // Test module imports
    try {
      await import('better-sqlite3');
      healthCheck.modules.betterSqlite3 = true;
    } catch (e) {
      console.log('better-sqlite3 import failed:', e.message);
    }

    try {
      await import('nodemailer');
      healthCheck.modules.nodemailer = true;
    } catch (e) {
      console.log('nodemailer import failed:', e.message);
    }

    try {
      await import('@/lib/email-whc');
      healthCheck.modules.emailWhc = true;
    } catch (e) {
      console.log('email-whc import failed:', e.message);
    }

    try {
      await import('@/lib/reminder-scheduler');
      healthCheck.modules.reminderScheduler = true;
    } catch (e) {
      console.log('reminder-scheduler import failed:', e.message);
    }

    return NextResponse.json(healthCheck);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}