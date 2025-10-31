import { NextRequest, NextResponse } from 'next/server';
import { reminderScheduler } from '@/lib/reminder-scheduler';

// GET - Check scheduler status
export async function GET() {
  try {
    const status = reminderScheduler.getStatus();
    
    return NextResponse.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

// POST - Control scheduler (start/stop/trigger)
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    let result = false;
    let message = '';
    
    switch (action) {
      case 'start':
        result = reminderScheduler.start();
        message = result ? 'Scheduler started successfully' : 'Failed to start scheduler';
        break;
        
      case 'stop':
        result = reminderScheduler.stop();
        message = result ? 'Scheduler stopped successfully' : 'Failed to stop scheduler';
        break;
        
      case 'trigger':
        await reminderScheduler.triggerManual();
        result = true;
        message = 'Manual reminder processing triggered';
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start, stop, or trigger' },
          { status: 400 }
        );
    }
    
    const status = reminderScheduler.getStatus();
    
    return NextResponse.json({
      success: result,
      message: message,
      status: status
    });
    
  } catch (error) {
    console.error('Error controlling scheduler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to control scheduler' },
      { status: 500 }
    );
  }
}