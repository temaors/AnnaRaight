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
    const defaultVideoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://annaraight.com'}/video/?firstName=${encodeURIComponent(firstName)}&email=${encodeURIComponent(email)}`;
    const finalVideoUrl = videoUrl || defaultVideoUrl;

    console.log(`📧 [WELCOME EMAIL API] Sending welcome email to ${email}`);
    console.log(`📧 [WELCOME EMAIL API] Video URL: ${finalVideoUrl}`);

    // Dynamic import to avoid edge runtime issues
    const { emailManager } = await import('@/lib/email/email-manager');

    // Send welcome email
    const emailResult = await emailManager.sendWelcomeEmail(email, firstName, finalVideoUrl);

    if (emailResult.success) {
      console.log(`✅ [WELCOME EMAIL API] Welcome email sent successfully to ${email}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Welcome email sent successfully',
        videoUrl: finalVideoUrl
      });
    } else {
      console.error(`❌ [WELCOME EMAIL API] Failed to send welcome email to ${email}:`, emailResult.error);
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [WELCOME EMAIL API] Error in welcome email API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}