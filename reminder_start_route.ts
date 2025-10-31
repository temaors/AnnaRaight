import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🚀 [REMINDER STARTUP] Starting reminder processor...');
    
    // Import and start the reminder processor
    const { reminderProcessor } = await import('@/lib/reminder-processor');
    
    if (reminderProcessor.isRunning()) {
      return NextResponse.json({
        success: true,
        message: 'Reminder processor is already running',
        status: 'already_running'
      });
    }

    // Start automatic processing every 5 minutes (more frequent for better responsiveness)
    reminderProcessor.startAutoProcessing(5);
    
    console.log('✅ [REMINDER STARTUP] Reminder processor started successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Reminder processor started successfully',
      status: 'started',
      interval: '5 minutes'
    });

  } catch (error) {
    console.error('❌ [REMINDER STARTUP] Error starting reminder processor:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to start reminder processor', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { reminderProcessor } = await import('@/lib/reminder-processor');
    
    return NextResponse.json({
      success: true,
      isRunning: reminderProcessor.isRunning(),
      message: reminderProcessor.isRunning() ? 'Processor is running' : 'Processor is stopped'
    });
    
  } catch (error) {
    console.error('❌ [REMINDER STATUS] Error checking status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check processor status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}