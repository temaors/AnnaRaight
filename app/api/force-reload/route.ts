import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Force reloading Google Calendar module...');
    
    // Очистка require кэша для Google Calendar модуля
    const moduleId = require.resolve('@/lib/google-calendar');
    delete require.cache[moduleId];
    
    // Также очистим все связанные модули
    Object.keys(require.cache).forEach(key => {
      if (key.includes('google-calendar') || key.includes('lib/google-calendar')) {
        delete require.cache[key];
        console.log('🗑️ Cleared cache for:', key);
      }
    });
    
    // Принудительно импортируем заново
    const { googleCalendarManager } = require('@/lib/google-calendar');
    
    // Сбросим состояние менеджера
    (googleCalendarManager as any).isInitialized = false;
    (googleCalendarManager as any).isAvailable = false;
    (googleCalendarManager as any).calendar = null;
    (googleCalendarManager as any).oauth2Client = null;
    
    console.log('✅ Google Calendar module reloaded');
    
    return NextResponse.json({
      success: true,
      message: 'Google Calendar module reloaded successfully'
    });
    
  } catch (error) {
    console.error('❌ Error reloading module:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}