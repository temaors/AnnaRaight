import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, videoUrl } = await request.json();

    // Validate required fields
    if (!email || !firstName) {
      return NextResponse.json(
        { success: false, error: 'Email and firstName are required' },
        { status: 400 }
      );
    }

    // Default video URL if not provided
    const defaultVideoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://annaraight.com'}/v/watch?firstName=${encodeURIComponent(firstName)}&email=${encodeURIComponent(email)}`;
    const finalVideoUrl = videoUrl || defaultVideoUrl;

    console.log(`📧 [REMINDER EMAIL API] Sending reminder email to ${email}`);
    console.log(`📧 [REMINDER EMAIL API] Video URL: ${finalVideoUrl}`);

    // Dynamic import to avoid edge runtime issues
    const { emailManager } = await import('@/lib/email/email-manager');

    // Send reminder email
    const emailResult = await emailManager.sendVideoReminderEmail(email, firstName, finalVideoUrl);

    if (emailResult.success) {
      console.log(`✅ [REMINDER EMAIL API] Reminder email sent successfully to ${email}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Reminder email sent successfully',
        videoUrl: finalVideoUrl
      });
    } else {
      console.error(`❌ [REMINDER EMAIL API] Failed to send reminder email to ${email}:`, emailResult.error);
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [REMINDER EMAIL API] Error in reminder email API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}