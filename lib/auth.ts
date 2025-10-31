import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbOps } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Types matching Supabase auth patterns
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// Auth operations that match Supabase patterns
export class AuthOperations {
  // Sign up with email and password
  async signUp(email: string, password: string, options?: { data?: { name?: string } }) {
    try {
      // Check if user already exists
      const existingUser = dbOps.select('users').eq('email', email);
      if (existingUser.data && existingUser.data.length > 0) {
        return { user: null, error: new Error('User already exists') };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const userData = {
        email,
        password: hashedPassword,
        name: options?.data?.name || null,
        email_verified: false
      };

      const result = dbOps.insert('users').values(userData);
      
      if (result.error || !result.data) {
        return { user: null, error: result.error || new Error('Failed to create user') };
      }

      const user: User = {
        id: String(result.data.id),
        email: email,
        name: options?.data?.name,
        created_at: new Date().toISOString()
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  // Sign in with email and password
  async signInWithPassword(email: string, password: string) {
    try {
      const userResult = dbOps.select('users').eq('email', email);
      
      if (!userResult.data || userResult.data.length === 0) {
        return { user: null, session: null, error: new Error('Invalid credentials') };
      }

      const userData = userResult.data[0] as { id: string; email: string; password: string; name?: string; created_at: string };
      const isPasswordValid = await bcrypt.compare(password, userData.password);

      if (!isPasswordValid) {
        return { user: null, session: null, error: new Error('Invalid credentials') };
      }

      const user: User = {
        id: String(userData.id),
        email: String(userData.email),
        name: userData.name || undefined,
        created_at: String(userData.created_at)
      };

      // Create session tokens
      const accessToken = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      const session: Session = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600,
        user
      };

      // Set cookies
      const cookieStore = await cookies();
      cookieStore.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600
      });
      cookieStore.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 3600
      });

      return { user, session, error: null };
    } catch (error) {
      return { user: null, session: null, error: error as Error };
    }
  }

  // Sign out
  async signOut() {
    try {
      const cookieStore = await cookies();
      cookieStore.delete('access_token');
      cookieStore.delete('refresh_token');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Get current user from session
  async getUser() {
    try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('access_token')?.value;

      if (!accessToken) {
        return { user: null, error: new Error('No session') };
      }

      const decoded = jwt.verify(accessToken, JWT_SECRET) as { userId: string };
      const userResult = dbOps.select('users').eq('id', decoded.userId);

      if (!userResult.data || userResult.data.length === 0) {
        return { user: null, error: new Error('User not found') };
      }

      const userData = userResult.data[0] as { id: string; email: string; password: string; name?: string; created_at: string };
      const user: User = {
        id: String(userData.id),
        email: String(userData.email),
        name: userData.name || undefined,
        created_at: String(userData.created_at)
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  // Get claims (similar to Supabase getClaims)
  async getClaims() {
    const { user, error } = await this.getUser();
    
    if (error || !user) {
      return null;
    }

    return {
      sub: user.id,
      email: user.email,
      name: user.name
    };
  }

  // Update user
  async updateUser(updates: { password?: string; name?: string }) {
    try {
      const { user } = await this.getUser();
      if (!user) {
        return { user: null, error: new Error('Not authenticated') };
      }

      const updateData: Record<string, unknown> = {};
      
      if (updates.password) {
        updateData.password = await bcrypt.hash(updates.password, 12);
      }
      
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }

      const result = dbOps.update('users').eq('id', user.id).set(updateData);
      
      if (result.error) {
        return { user: null, error: result.error };
      }

      const updatedUser: User = {
        ...user,
        name: updates.name !== undefined ? updates.name : user.name
      };

      return { user: updatedUser, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  // Reset password for email (placeholder - would need email service)
  async resetPasswordForEmail(email: string) {
    try {
      // In a real implementation, you would:
      // 1. Generate a secure reset token
      // 2. Store it in the database with expiration
      // 3. Send an email with reset link
      
      const userResult = dbOps.select('users').eq('email', email);
      
      if (!userResult.data || userResult.data.length === 0) {
        // Don't reveal if email exists for security
        return { error: null };
      }

      // For now, just return success
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Verify OTP (placeholder)
  async verifyOtp() {
    try {
      // In a real implementation, you would verify the OTP token
      // For now, just return success
      return { user: null, session: null, error: null };
    } catch (error) {
      return { user: null, session: null, error: error as Error };
    }
  }
}

// Auth schema is now initialized in database.ts to avoid circular dependency

export const auth = new AuthOperations();