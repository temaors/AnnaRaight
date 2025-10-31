import { NextResponse } from 'next/server';
import { emailPreferencesManager } from '@/lib/email-preferences';

export async function GET() {
  try {
    const userLists = await emailPreferencesManager.getUserLists();
    
    return NextResponse.json({
      success: true,
      data: userLists
    });

  } catch (error) {
    console.error('Error fetching user lists:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user lists', details: error.message },
      { status: 500 }
    );
  }
}