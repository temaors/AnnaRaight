// Removed unused imports

// Client-side wrapper that mimics Supabase client API
export function createClient() {
  return {
    // Database operations
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: unknown) => {
          // For client-side, we need to make an API call to the server
          return fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'select', 
              table, 
              where: { column, value } 
            })
          }).then(res => res.json());
        }
      }),
      insert: async (values: Record<string, unknown>) => {
        // For client-side, we need to make an API call to the server
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'insert', 
            table, 
            values 
          })
        });
        return response.json();
      },
      update: (updates: Record<string, unknown>) => ({
        eq: async (column: string, value: unknown) => {
          const response = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'update', 
              table, 
              where: { column, value },
              updates 
            })
          });
          return response.json();
        }
      }),
      delete: () => ({
        eq: async (column: string, value: unknown) => {
          const response = await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'delete', 
              table, 
              where: { column, value } 
            })
          });
          return response.json();
        }
      })
    }),

    // Authentication operations
    auth: {
      signUp: async ({ email, password, options }: { 
        email: string; 
        password: string; 
        options?: { data?: { name?: string } } 
      }) => {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, options })
        });
        return response.json();
      },

      signInWithPassword: async ({ email, password }: { 
        email: string; 
        password: string; 
      }) => {
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        
        // Reload the page to update the session state
        if (!result.error) {
          window.location.reload();
        }
        
        return result;
      },

      signOut: async () => {
        const response = await fetch('/api/auth/signout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        
        // Reload the page to clear the session
        if (!result.error) {
          window.location.reload();
        }
        
        return result;
      },

      getUser: async () => {
        // Client-side user info should come from server-side rendering
        // This is a placeholder for compatibility
        return { user: null, error: new Error('Use server-side getUser') };
      },

      getClaims: async () => {
        // Client-side claims should come from server-side rendering
        // This is a placeholder for compatibility
        return null;
      },

      updateUser: async (updates: { password?: string; name?: string }) => {
        const response = await fetch('/api/auth/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        return response.json();
      },

      resetPasswordForEmail: async (email: string) => {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        return response.json();
      },

      verifyOtp: async (params: { token: string; type: string }) => {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        return response.json();
      }
    }
  };
}