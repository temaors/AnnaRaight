import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== TEST API STARTED ===');
  
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Invalid content type');
      return NextResponse.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Parse JSON
    let leadData: { firstName: string; email: string; videoUrl?: string };
    try {
      leadData = await request.json();
      console.log('Parsed data:', leadData);
    } catch (jsonError) {
      console.log('JSON error:', jsonError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // Basic validation
    if (!leadData.firstName || !leadData.email) {
      return NextResponse.json(
        { success: false, error: 'Missing firstName or email' },
        { status: 400 }
      );
    }

    console.log('Test API success');
    return NextResponse.json({
      success: true,
      message: 'Test API works',
      data: leadData
    });

  } catch (error) {
    console.error('Test API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Test API failed', details: String(error) },
      { status: 500 }
    );
  }
}