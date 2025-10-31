import { NextResponse } from 'next/server';
import { googleCalendarManager } from '@/lib/google-calendar';

export async function GET() {
  try {
    // Ensure initialization is complete
    await googleCalendarManager.ensureInitialized();
    
    const isAvailable = googleCalendarManager.isGoogleCalendarAvailable();

    return NextResponse.json({
      success: true,
      google_calendar_available: isAvailable,
      status: isAvailable ? 'connected' : 'not_configured'
    });

  } catch (error) {
    console.error('Error checking Google Calendar status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check Google Calendar status'
    }, { status: 500 });
  }
}