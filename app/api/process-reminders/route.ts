import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log(`🕒 [PROCESS REMINDERS] Starting reminder processing...`);
    
    // Dynamic import with error handling
    let reminderScheduler;
    try {
      const module = await import('@/lib/reminder-scheduler');
      reminderScheduler = module.reminderScheduler;
    } catch (importError) {
      console.error('❌ [PROCESS REMINDERS] Failed to import reminder-scheduler:', importError);
      return NextResponse.json(
        { success: false, error: 'Failed to load reminder scheduler module', details: importError instanceof Error ? importError.message : 'Unknown import error' },
        { status: 500 }
      );
    }
    
    const result = await reminderScheduler.processPendingReminders();
    
    console.log(`📊 [PROCESS REMINDERS] Completed:`, result);
    
    return NextResponse.json({
      success: true,
      message: 'Reminders processed successfully',
      ...result
    });

  } catch (error) {
    console.error('❌ [PROCESS REMINDERS] Error processing reminders:', error);
    console.error('❌ [PROCESS REMINDERS] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : 'No stack' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Same as GET for convenience
  return GET(request);
}