import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== SIMPLE APPOINTMENT API STARTED ===');
  
  try {
    const data = await request.json();
    console.log('Received data:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Simple appointment test working',
      received_data: data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Simple API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Simple API error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}