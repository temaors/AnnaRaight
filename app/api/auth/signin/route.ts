import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Hardcoded admin credentials
const ADMIN_LOGIN = 'admin';
const ADMIN_PASSWORD = 'ChatBot1!1';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Check hardcoded credentials (email field can be used for login)
    if ((email === ADMIN_LOGIN || email === 'admin@example.com') && password === ADMIN_PASSWORD) {
      // Create simple session
      const user = {
        id: 'admin',
        email: 'admin@example.com',
        name: 'Admin',
        created_at: new Date().toISOString()
      };
      
      const session = {
        access_token: 'admin-token-' + Date.now(),
        refresh_token: 'admin-refresh-' + Date.now(),
        expires_in: 3600,
        user
      };
      
      // Set cookies
      const cookieStore = await cookies();
      cookieStore.set('access_token', session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600
      });
      
      return NextResponse.json({ user, session, error: null });
    } else {
      return NextResponse.json({ 
        user: null, 
        session: null,
        error: { message: 'Invalid credentials' } 
      });
    }
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({ 
      user: null, 
      session: null,
      error: { message: 'Signin failed' } 
    });
  }
}