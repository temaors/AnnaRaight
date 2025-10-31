import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    const result = await auth.resetPasswordForEmail(email);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ 
      error: { message: 'Reset password failed' } 
    });
  }
}