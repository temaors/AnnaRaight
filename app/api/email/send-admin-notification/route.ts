import { NextRequest, NextResponse } from 'next/server';

interface AppointmentData {
  name: string;
  email: string;
  phone: string;
  website: string;
  revenue: string;
  appointment_date: string;
  appointment_time: string;
  timezone?: string;
  google_meet_link?: string;
  meeting_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    let appointmentData: AppointmentData;
    try {
      appointmentData = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'website', 'revenue', 'appointment_date', 'appointment_time'];
    for (const field of requiredFields) {
      if (!appointmentData[field as keyof AppointmentData]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Dynamic import to avoid edge runtime issues
    const { emailManager } = await import('@/lib/email/email-manager');

    // Send admin notification
    const result = await emailManager.sendAdminNotification(appointmentData);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in admin notification API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}