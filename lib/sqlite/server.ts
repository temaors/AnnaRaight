import { dbOps } from '../database';
import { auth } from '../auth';

// Server-side wrapper that mimics Supabase server client API
export async function createServerClient() {
  return {
    // Database operations
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: unknown) => dbOps.select(table).eq(column, value),
        data: dbOps.select(table).data()
      }),
      insert: (values: Record<string, unknown>) => dbOps.insert(table).values(values),
      update: (updates: Record<string, unknown>) => ({
        eq: (column: string, value: unknown) => dbOps.update(table).eq(column, value).set(updates)
      }),
      delete: () => ({
        eq: (column: string, value: unknown) => dbOps.delete(table).eq(column, value)
      })
    }),

    // Authentication operations
    auth: {
      signUp: async ({ email, password, options }: { 
        email: string; 
        password: string; 
        options?: { data?: { name?: string } } 
      }) => {
        return await auth.signUp(email, password, options);
      },

      signInWithPassword: async ({ email, password }: { 
        email: string; 
        password: string; 
      }) => {
        return await auth.signInWithPassword(email, password);
      },

      signOut: async () => {
        return await auth.signOut();
      },

      getUser: async () => {
        return await auth.getUser();
      },

      getClaims: async () => {
        return await auth.getClaims();
      },

      updateUser: async (updates: { password?: string; name?: string }) => {
        return await auth.updateUser(updates);
      },

      resetPasswordForEmail: async (email: string) => {
        return await auth.resetPasswordForEmail(email);
      },

      verifyOtp: async () => {
        return await auth.verifyOtp();
      }
    }
  };
}