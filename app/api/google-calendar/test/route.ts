import { NextResponse } from 'next/server';
import { googleCalendarManager } from '@/lib/google-calendar';

export async function GET() {
  try {
    // Test Google Calendar availability
    const isAvailable = googleCalendarManager.isGoogleCalendarAvailable();
    
    // Test getting available slots for today + 1 day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const availableSlots = await googleCalendarManager.getAvailableSlots(dateStr);
    
    // Test data for creating appointment (optional - commented out to avoid creating test appointments)
    /*
    const testAppointment = {
      appointment_date: dateStr,
      appointment_time: '11:00',
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1234567890',
      website: 'https://example.com',
      revenue: '$10,000',
      timezone: 'Europe/Moscow'
    };
    */

    return NextResponse.json({
      success: true,
      google_calendar: {
        available: isAvailable,
        status: isAvailable ? 'Google Calendar connected' : 'Google Calendar not configured'
      },
      test_results: {
        date_tested: dateStr,
        available_slots: availableSlots,
        slots_count: availableSlots.length
      },
      message: 'Google Calendar integration test completed'
    });

  } catch (error) {
    console.error('Google Calendar test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Google Calendar test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}