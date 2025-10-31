import { NextRequest, NextResponse } from 'next/server';
import { whcEmailManager } from '@/lib/email-whc';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'test_connection':
        const connectionResult = await whcEmailManager.testConnection();
        return NextResponse.json(connectionResult);

      case 'send_test_email':
        const testResult = await whcEmailManager.sendTestEmail();
        return NextResponse.json(testResult);

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "test_connection" or "send_test_email"'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in WHC email test:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const connectionResult = await whcEmailManager.testConnection();
    return NextResponse.json(connectionResult);
  } catch (error) {
    console.error('Error testing WHC email connection:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 