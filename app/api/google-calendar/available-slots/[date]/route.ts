import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarManager } from '@/lib/google-calendar';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      }, { status: 400 });
    }

    // Ensure initialization is complete
    await googleCalendarManager.ensureInitialized();
    
    const availableSlots = await googleCalendarManager.getAvailableSlots(date);

    return NextResponse.json({
      success: true,
      date,
      available_slots: availableSlots
    });

  } catch (error) {
    console.error('Error getting available slots:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get available slots'
    }, { status: 500 });
  }
}