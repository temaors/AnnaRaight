import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarManager } from '@/lib/google-calendar';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    console.log('=== GOOGLE CALENDAR DIAGNOSTIC TEST ===');
    
    const diagnostics = {
      cwd: process.cwd(),
      credentialsPath: path.join(process.cwd(), 'database', 'credentials.json'),
      tokenPath: path.join(process.cwd(), 'database', 'token.json'),
      credentialsExists: false,
      tokenExists: false,
      managerInitialized: false,
      calendarAvailable: false,
      initializationError: null,
      testEventResult: null
    };
    
    // Check file existence
    try {
      diagnostics.credentialsExists = fs.existsSync(diagnostics.credentialsPath);
      diagnostics.tokenExists = fs.existsSync(diagnostics.tokenPath);
    } catch (error) {
      console.error('Error checking files:', error);
    }
    
    console.log('📁 Working directory:', diagnostics.cwd);
    console.log('📁 Credentials exists:', diagnostics.credentialsExists);
    console.log('📁 Token exists:', diagnostics.tokenExists);
    
    if (diagnostics.credentialsExists && diagnostics.tokenExists) {
      try {
        // Try to initialize the manager
        await googleCalendarManager.ensureInitialized();
        diagnostics.managerInitialized = true;
        diagnostics.calendarAvailable = googleCalendarManager.isGoogleCalendarAvailable();
        
        console.log('✅ Manager initialized:', diagnostics.managerInitialized);
        console.log('✅ Calendar available:', diagnostics.calendarAvailable);
        
        if (diagnostics.calendarAvailable) {
          // Try to create a test event
          const testAppointment = {
            name: 'Diagnostic Test',
            email: 'test@example.com',
            appointment_date: '2025-01-21',
            appointment_time: '16:00',
            timezone: 'Europe/Moscow'
          };
          
          const result = await googleCalendarManager.createAppointment(testAppointment);
          diagnostics.testEventResult = result;
          console.log('🔬 Test event result:', result);
        }
        
      } catch (initError) {
        console.error('❌ Initialization error:', initError);
        diagnostics.initializationError = initError instanceof Error ? initError.message : 'Unknown error';
      }
    }
    
    return NextResponse.json({
      success: true,
      diagnostics
    });
    
  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}