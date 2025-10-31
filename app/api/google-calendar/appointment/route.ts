import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarManager } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const appointmentData = await request.json();
    console.log('🔥 API: Received appointment data:', appointmentData);

    // Validate required fields
    const requiredFields = ['appointment_date', 'appointment_time', 'name', 'email'];
    for (const field of requiredFields) {
      if (!appointmentData[field]) {
        console.log('❌ API: Missing required field:', field);
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    console.log('✅ API: All required fields present, calling Google Calendar manager...');
    
    // Ensure Google Calendar is initialized
    await googleCalendarManager.ensureInitialized();
    console.log('📅 API: Google Calendar available:', googleCalendarManager.isGoogleCalendarAvailable());

    // Create appointment in Google Calendar
    const result = await googleCalendarManager.createAppointment(appointmentData);
    console.log('🎯 API: Google Calendar result:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create appointment'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { event_id, ...appointmentData } = await request.json();

    if (!event_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing event_id for update'
      }, { status: 400 });
    }

    // Update appointment in Google Calendar
    const result = await googleCalendarManager.updateAppointment(event_id, appointmentData);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update appointment'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing event_id for deletion'
      }, { status: 400 });
    }

    // Delete appointment from Google Calendar
    const result = await googleCalendarManager.deleteAppointment(event_id);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete appointment'
    }, { status: 500 });
  }
}