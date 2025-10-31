import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await auth.signOut();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json({ 
      error: { message: 'Signout failed' } 
    });
  }
}