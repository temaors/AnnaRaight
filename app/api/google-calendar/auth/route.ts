import { NextRequest, NextResponse } from 'next/server';
import { googleCalendarManager } from '@/lib/google-calendar';

export async function GET(request: NextRequest) {
  try {
    // Ensure calendar manager is initialized
    await googleCalendarManager.ensureInitialized();
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      // Handle OAuth callback
      await googleCalendarManager.getTokenFromCode(code);
      return NextResponse.json({
        success: true,
        message: 'Google Calendar authentication successful'
      });
    } else {
      // Redirect to Google OAuth
      const authUrl = googleCalendarManager.getAuthUrl();
      return NextResponse.redirect(authUrl);
    }
  } catch (error) {
    console.error('Google Calendar auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication failed'
    }, { status: 500 });
  }
}