import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await request.json(); // Get request body but ignore params
    
    const result = await auth.verifyOtp();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ 
      user: null,
      session: null,
      error: { message: 'OTP verification failed' } 
    });
  }
}