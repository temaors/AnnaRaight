import { NextRequest, NextResponse } from 'next/server';
import { EmailManager, WelcomeEmailData } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email }: WelcomeEmailData = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailManager = new EmailManager();
    const result = await emailManager.sendWelcomeEmail({ 
      name: name || 'User', 
      email 
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in send-welcome endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}