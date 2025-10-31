import { NextRequest, NextResponse } from 'next/server';
import { whcEmailManager } from '@/lib/email-whc';

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

    let requestData: { email: string; firstName: string; videoUrl: string };
    try {
      requestData = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email, firstName, videoUrl } = requestData;

    // Validate required fields
    if (!email || !firstName || !videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, firstName, videoUrl' },
        { status: 400 }
      );
    }

    // Initialize email manager
        // Send video email
    const result = await whcEmailManager.sendVideoEmail(email, firstName, videoUrl);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in video email API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}