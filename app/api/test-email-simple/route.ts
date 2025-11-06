import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'test@example.com';

  try {
    // Dynamic import to avoid edge runtime issues
    const { emailManager } = await import('@/lib/email/email-manager');

    // Используем sendVideoEmail для теста
    const testVideoUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://annaraight.com'}/v/watch?test=true`;
    const result = await emailManager.sendVideoEmail(
      email,
      'Test User',
      testVideoUrl
    );
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Email sent successfully!' : 'Failed to send email',
      error: result.error,
      config: {
        server: process.env.WHC_SMTP_SERVER,
        port: process.env.WHC_SMTP_PORT,
        sender: process.env.WHC_SENDER_EMAIL,
        to: email
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        server: process.env.WHC_SMTP_SERVER,
        port: process.env.WHC_SMTP_PORT,
        sender: process.env.WHC_SENDER_EMAIL,
        to: email
      }
    });
  }
}