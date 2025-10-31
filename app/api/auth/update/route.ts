import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json();
    
    const result = await auth.updateUser(updates);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ 
      user: null, 
      error: { message: 'Update failed' } 
    });
  }
}