import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { EmailManager } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, options } = await request.json();
    
    const result = await auth.signUp(email, password, options);
    
    // Если регистрация прошла успешно, отправляем приветственное письмо
    if (result.user && !result.error) {
      try {
        const emailManager = new EmailManager();
        await emailManager.sendWelcomeEmail({
          name: result.user.name || 'User',
          email: result.user.email
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Не прерываем процесс регистрации, если письмо не отправилось
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ 
      user: null, 
      error: { message: 'Signup failed' } 
    });
  }
}